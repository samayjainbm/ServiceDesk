// POST /api/material_req/:complaint_id

const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { requireAuth, requireRole } = require("../inventory/middlewares/auth");

router.post("/:complaint_id", requireAuth, requireRole("worker"), async (req, res) => {
  try {
    const workerId = req.user.userId;
    const complaintId = Number(req.params.complaint_id);

    const { materials } = req.body;

    if (!Number.isInteger(complaintId)) {
      return res.status(400).json({ success: false, message: "Invalid complaint_id" });
    }

    // ✅ Accept only demanded items:
    // materials can be:
    // 1) Array: [{ item_name: "wire", count: 2 }, ...]
    // 2) Object map (old): { wire: 2, q: 1 }
    if (!materials || (typeof materials !== "object" && !Array.isArray(materials))) {
      return res.status(400).json({ success: false, message: "materials is required" });
    }

    const entries = [];

    // ✅ NEW preferred format: array
    if (Array.isArray(materials)) {
      for (const row of materials) {
        const itemName = String(row?.item_name || "").trim().toLowerCase();
        const qty = Number(row?.count);

        if (!itemName) continue;
        if (!Number.isFinite(qty)) continue;

        const intQty = Math.trunc(qty);
        if (intQty > 0) entries.push({ item_name: itemName, count: intQty });
      }
    } else {
      // ✅ Backward compatible format: object map
      for (const [rawName, rawVal] of Object.entries(materials)) {
        const itemName = String(rawName || "").trim().toLowerCase();
        const qty = Number(rawVal);

        if (!itemName) continue;
        if (!Number.isFinite(qty)) continue;

        const intQty = Math.trunc(qty);
        if (intQty > 0) entries.push({ item_name: itemName, count: intQty });
      }
    }

    // same behavior: if nothing demanded => success true
    if (entries.length === 0) {
      return res.json({ success: true });
    }

    // resolve item_name -> item_id (same)
    const itemNames = [...new Set(entries.map((e) => e.item_name))];
    const itemRows = await prisma.items.findMany({
      where: { item_name: { in: itemNames } },
      select: { item_id: true, item_name: true },
    });

    const itemIdMap = new Map(itemRows.map((r) => [String(r.item_name).toLowerCase(), r.item_id]));

    for (const e of entries) {
      if (!itemIdMap.has(e.item_name)) {
        return res.status(404).json({
          success: false,
          message: `Material '${e.item_name}' not found in items table.`,
        });
      }
    }

    // ✅ upsert demanded_items row-wise (same)
    await prisma.$transaction(async (tx) => {
      for (const e of entries) {
        const item_id = itemIdMap.get(e.item_name);

        await tx.demanded_items.upsert({
          where: {
            worker_id_complaint_id_item_id: {
              worker_id: workerId,
              complaint_id: complaintId,
              item_id,
            },
          },
          update: {
            count: { increment: e.count },
          },
          create: {
            worker_id: workerId,
            complaint_id: complaintId,
            item_id,
            count: e.count,
          },
        });
      }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Error fetching materials for complaint:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching materials",
    });
  }
});
module.exports=router;