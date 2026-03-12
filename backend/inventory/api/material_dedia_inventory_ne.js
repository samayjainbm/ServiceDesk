// Work
// 1) Input kya lagega
// Params (URL):
// complaint_id (number)
// Body (JSON):
// {
//   materials: { a: "5", b: "0", ... p: "0" }   //any  keys allowed, values number/string (>=0)
// }

// 2) Kaunsa database/table change hoga
// Read (check ke liye):
// demanded_items ✅ READ (findFirst)          // complaint_id ka demand exist hai ya nahi
// ongoing_complaints ✅ READ (findUnique)     // complaint exist hai ya nahi + worker_id nikalne ke liye
// Write/Change (transaction me):
// ongoing_complaints ✅ UPDATE                // a..p columns set + status="ongoing"
// demanded_items ✅ DELETE (deleteMany)       // complaint_id wali row(s) remove
// worker_debt ✅ UPSERT (create ya update)    // worker_id ke hisaab se a..p increment/add

// 3) API kya karegi
// Sirf admin (requireAuth + requireRole("admin")) hi access kar sakta hai.
// complaint_id validate karegi.
// Body me materials object validate karegi.
// materials ke a..p keys ko clean/convert karke non-negative integers bana degi.
// demanded_items me complaint_id exist hona zaroori hai, warna 404.
// ongoing_complaints me complaint exist hona zaroori hai, aur worker_id allotted hona zaroori hai, warna error.
// Fir transa


const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

// POST /api/material_dedia_inventory_ne/:complaint_id
// Body: { materials: { <item_name OR item_id>: "5", ... } }
router.post("/:complaint_id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const complaintId = Number(req.params.complaint_id);
    if (!Number.isInteger(complaintId)) {
      return res.status(400).json({ success: false, message: "Invalid complaint_id" });
    }

    const materials = req.body?.materials;
    if (!materials || typeof materials !== "object") {
      return res.status(400).json({ success: false, message: "materials object is required" });
    }

    // ✅ dynamic keys (can be a..p, q..z, bolt, etc OR numeric item_id keys)
    const rawKeys = Object.keys(materials);
    if (rawKeys.length === 0) {
      return res.status(400).json({ success: false, message: "materials object is required" });
    }

    // clean counts (>=0 integer)
    const cleanMaterials = {};
    for (const k of rawKeys) {
      const val = Number(materials[k] ?? 0);
      cleanMaterials[String(k).trim()] = Number.isFinite(val) ? Math.max(0, Math.trunc(val)) : 0;
    }

    // ✅ must exist in demanded_items before allocating
    const demandRow = await prisma.demanded_items.findFirst({
      where: { complaint_id: complaintId },
      select: { complaint_id: true },
    });

    if (!demandRow) {
      return res.status(404).json({
        success: false,
        message: "No demanded_items entry found for this complaint_id",
      });
    }

    // ✅ fetch complaint to get worker_id (and ensure it exists)
    const oc = await prisma.ongoing_complaints.findUnique({
      where: { complaint_id: complaintId },
      select: { complaint_id: true, worker_id: true },
    });

    if (!oc) {
      return res.status(404).json({ success: false, message: "ongoing_complaints not found" });
    }
    if (oc.worker_id == null) {
      return res.status(400).json({
        success: false,
        message: "Worker not allotted yet for this complaint. Cannot add worker debt.",
      });
    }

    const workerId = oc.worker_id;

    // ✅ Support BOTH:
    // - keys as item_name:  "bolt": 3
    // - keys as item_id:    "12": 3
    const nameKeys = [];
    const idKeys = [];
    for (const k of rawKeys) {
      const keyTrim = String(k).trim();
      if (/^\d+$/.test(keyTrim)) idKeys.push(Number(keyTrim));
      else nameKeys.push(keyTrim.toLowerCase());
    }

    const itemRows = await prisma.items.findMany({
      where: {
        OR: [
          ...(nameKeys.length ? [{ item_name: { in: nameKeys } }] : []),
          ...(idKeys.length ? [{ item_id: { in: idKeys } }] : []),
        ],
      },
      select: { item_id: true, item_name: true },
    });

    // build lookup maps
    const byName = new Map(itemRows.map((x) => [String(x.item_name).toLowerCase(), x.item_id]));
    const byId = new Set(itemRows.map((x) => x.item_id));

    // Validate all provided keys exist in items table
    for (const k of rawKeys) {
      const keyTrim = String(k).trim();
      if (/^\d+$/.test(keyTrim)) {
        const id = Number(keyTrim);
        if (!byId.has(id)) {
          return res.status(404).json({
            success: false,
            message: `Material '${k}' not found in items table.`,
          });
        }
      } else {
        const nm = keyTrim.toLowerCase();
        if (!byName.has(nm)) {
          return res.status(404).json({
            success: false,
            message: `Material '${k}' not found in items table.`,
          });
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1) update ongoing_complaints (new schema: no a..p columns)
      await tx.ongoing_complaints.update({
        where: { complaint_id: complaintId },
        data: {
          status: "ongoing",
        },
      });

      // 2) replace complaint_items with what was allotted (dynamic)
      await tx.complaint_items.deleteMany({
        where: { complaint_id: complaintId },
      });

      const complaintItemsToCreate = [];
      for (const k of rawKeys) {
        const cnt = cleanMaterials[String(k).trim()] ?? 0;
        if (cnt <= 0) continue;

        const keyTrim = String(k).trim();
        let item_id;
        if (/^\d+$/.test(keyTrim)) item_id = Number(keyTrim);
        else item_id = byName.get(keyTrim.toLowerCase());

        complaintItemsToCreate.push({
          complaint_id: complaintId,
          item_id,
          count: cnt,
        });
      }

      if (complaintItemsToCreate.length > 0) {
        await tx.complaint_items.createMany({
          data: complaintItemsToCreate,
          skipDuplicates: true,
        });
      }

      // 3) delete demanded_items rows for this complaint
      await tx.demanded_items.deleteMany({
        where: { complaint_id: complaintId },
      });

      // 4) add materials to worker_debt (dynamic items)
      for (const k of rawKeys) {
        const cnt = cleanMaterials[String(k).trim()] ?? 0;
        if (cnt <= 0) continue;

        const keyTrim = String(k).trim();
        let item_id;
        if (/^\d+$/.test(keyTrim)) item_id = Number(keyTrim);
        else item_id = byName.get(keyTrim.toLowerCase());

        await tx.worker_debt.upsert({
          where: {
            worker_id_item_id: { worker_id: workerId, item_id },
          },
          update: {
            count: { increment: cnt },
          },
          create: {
            worker_id: workerId,
            item_id,
            count: cnt,
          },
        });
      }
    });

    return res.json({
      success: true,
      message: "Materials allotted, complaint set to ongoing, and worker debt updated.",
    });
  } catch (err) {
    console.error("material_dedia_inventory_ne error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "An error occurred while updating ongoing complaints",
    });
  }
});

module.exports = router;