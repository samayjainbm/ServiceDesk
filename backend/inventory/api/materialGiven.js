// Work
// 1) Input kya lagega
// Params (URL):
// complaint_id (number)
// Body: kuch nahi (empty)  // quantities demanded_items table se read hoti hain

// 2) Kaunsa database/table change hoga
// Read (check/fetch ke liye):
// demanded_items ✅ READ (findFirst)          // complaint_id + worker_id + a..p quantities
// ongoing_complaints ✅ READ (findUnique)     // complaint exist + current status
// items ✅ READ (findMany)                    // inventory stock check (needed items only)
// Write/Change (transaction me):
// items ✅ UPDATE                             // item_count decrement (inventory se stock kam)
// worker_debt ✅ UPSERT                        // worker_id ke liye a..p increment/add (debt badhega)
// ongoing_complaints ✅ UPDATE                 // a..p increment/store + status="ongoing"
// demanded_items ✅ DELETE (deleteMany)        // complaint_id wali demand row(s) remove

// 3) API kya karegi
// Sirf admin (requireAuth + requireRole("admin")) hi access kar sakta hai.
// complaint_id validate karegi.
// demanded_items se us complaint ki demanded quantities (a..p) + worker_id nikaalegi.
// Agar demanded_items missing hai => 404.
// Agar saari quantities 0 hain => 400 (nothing to allot).
// ongoing_complaints record exist hona zaroori hai, warna 404.
// items table se required materials ka stock check karegi:
// - item exist nahi => 404
// - stock kam hai => 400 (not enough stock)
// Fir transaction me:
// 1) items me required materials ka item_count decrement karegi (inventory reduce)
// 2) worker_debt me worker_id ke row me a..p increment karegi (ya new row create)
// 3) ongoing_complaints me a..p increment karegi + status "ongoing" set karegi
// 4) demanded_items ki row(s) delete karegi (demand clear)
// Is API me update + delete dono hote hain, aur inventory bhi decrement hoti hai.


const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { requireAuth, requireRole } = require("../middlewares/auth");

// POST /api/asc/:complaint_id
// No body needed. Quantities are read from demanded_items table.
router.post("/:complaint_id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const complaintId = Number(req.params.complaint_id);
    if (!Number.isInteger(complaintId)) {
      return res.status(400).json({ success: false, message: "Invalid complaint_id" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1) Get demanded rows (NEW SCHEMA: multiple rows per complaint, each row = 1 item)
      const demandRows = await tx.demanded_items.findMany({
        where: { complaint_id: complaintId, count: { gt: 0 } },
        select: {
          complaint_id: true,
          worker_id: true,
          item_id: true,
          count: true,
          item: { select: { item_name: true } },
        },
        orderBy: { s_no: "asc" },
      });

      if (!demandRows || demandRows.length === 0) {
        return { ok: false, status: 404, message: "No demanded_items entry found for this complaint_id" };
      }

      const workerId = demandRows[0].worker_id;

      // (safety) if somehow multiple worker_id exist for same complaint demand
      for (const r of demandRows) {
        if (r.worker_id !== workerId) {
          return { ok: false, status: 400, message: "Multiple workers found in demanded_items for this complaint_id" };
        }
      }

      // Build materials object from DB (now dynamic item_name -> count)
      const materials = {};
      const neededItemIds = [];
      for (const r of demandRows) {
        const val = Number(r.count ?? 0);
        if (!Number.isInteger(val) || val < 0) {
          return { ok: false, status: 400, message: `Invalid stored quantity demanded_items.count` };
        }
        if (val <= 0) continue;

        const itemName = r?.item?.item_name;
        if (!itemName) {
          return { ok: false, status: 404, message: `Item not found for item_id=${r.item_id}` };
        }

        materials[itemName] = val;
        neededItemIds.push(r.item_id);
      }

      if (neededItemIds.length === 0) {
        return { ok: false, status: 400, message: "Demanded materials are all 0; nothing to allot" };
      }

      // 2) Ensure ongoing_complaints exists
      const ongoing = await tx.ongoing_complaints.findUnique({
        where: { complaint_id: complaintId },
        select: { complaint_id: true, status: true },
      });

      if (!ongoing) {
        return { ok: false, status: 404, message: "No ongoing_complaints entry found for this complaint_id" };
      }

      // ----------------------------
      // ✅ NEW: Check inventory stock (by item_id)
      // ----------------------------
      const inventoryRows = await tx.items.findMany({
        where: { item_id: { in: neededItemIds } },
        select: { item_id: true, item_name: true, count: true },
      });

      const invMap = new Map(inventoryRows.map((r) => [r.item_id, r.count]));

      // ensure every needed item exists + has enough stock
      for (const r of demandRows) {
        const required = Number(r.count || 0);
        if (required <= 0) continue;

        const available = invMap.get(r.item_id);
        if (available == null) {
          return { ok: false, status: 404, message: `Item '${r?.item?.item_name ?? r.item_id}' not found in items table` };
        }
        if (available < required) {
          return {
            ok: false,
            status: 400,
            message: `Not enough stock for '${r?.item?.item_name ?? r.item_id}'. Available=${available}, Required=${required}`,
          };
        }
      }

      // ----------------------------
      // ✅ NEW: Decrement inventory (items.count)
      // ----------------------------
      for (const r of demandRows) {
        const required = Number(r.count || 0);
        if (required <= 0) continue;

        await tx.items.update({
          where: { item_id: r.item_id },
          data: { count: { decrement: required } },
        });
      }

      // 3) Add to worker_debt (NEW SCHEMA: row per item, upsert by (worker_id,item_id))
      for (const r of demandRows) {
        const required = Number(r.count || 0);
        if (required <= 0) continue;

        await tx.worker_debt.upsert({
          where: {
            worker_id_item_id: { worker_id: workerId, item_id: r.item_id },
          },
          update: {
            count: { increment: required },
          },
          create: {
            worker_id: workerId,
            item_id: r.item_id,
            count: required,
          },
        });
      }

      // 4) Update ongoing_complaints (NEW: only status ongoing; materials are stored in complaint_items)
      await tx.ongoing_complaints.update({
        where: { complaint_id: complaintId },
        data: { status: "ongoing" },
      });

      // 4.5) Store allotted materials against complaint (complaint_items)
      // Old schema: ongoing_complaints a..p increments
      // New schema: keep item-wise rows
      for (const r of demandRows) {
        const required = Number(r.count || 0);
        if (required <= 0) continue;

        await tx.complaint_items.upsert({
          where: {
            complaint_id_item_id: { complaint_id: complaintId, item_id: r.item_id },
          },
          update: {
            count: { increment: required },
          },
          create: {
            complaint_id: complaintId,
            item_id: r.item_id,
            count: required,
          },
        });
      }

      // 5) Delete demanded rows now that allotment is done
      await tx.demanded_items.deleteMany({
        where: { complaint_id: complaintId },
      });

      return {
        ok: true,
        complaint_id: complaintId,
        worker_id: workerId,
        previous_status: ongoing.status,
        new_status: "ongoing",
        materials_allotted: materials,
        inventory_decremented: materials,
      };
    });

    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    return res.json({
      success: true,
      message:
        "Allotted from demanded_items, inventory decremented, updated debt + ongoing, removed demand row",
      data: result,
    });
  } catch (err) {
    console.error("ASC error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: String(err?.message || err),
    });
  }
});

module.exports = router;