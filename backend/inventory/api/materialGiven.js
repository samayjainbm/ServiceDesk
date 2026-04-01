const router = require("express").Router();
const prisma = require("../../config/db"); // <-- use singleton prisma
const { requireAuth, requireRole } = require("../middlewares/auth");
router.post("/:complaint_id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const complaintId = Number(req.params.complaint_id);

    if (!Number.isInteger(complaintId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint_id",
      });
    }

    // 1) Read demand rows OUTSIDE transaction
    const demandRows = await prisma.demanded_items.findMany({
      where: {
        complaint_id: complaintId,
        count: { gt: 0 },
      },
      select: {
        complaint_id: true,
        worker_id: true,
        item_id: true,
        count: true,
        item: {
          select: { item_name: true },
        },
      },
      orderBy: { s_no: "asc" },
    });

    if (!demandRows || demandRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No demanded_items entry found for this complaint_id",
      });
    }

    const workerId = demandRows[0].worker_id;

    for (const r of demandRows) {
      if (r.worker_id !== workerId) {
        return res.status(400).json({
          success: false,
          message: "Multiple workers found in demanded_items for this complaint_id",
        });
      }
    }

    // aggregate by item_id
    const itemDemandMap = new Map();
    const materials = {};

    for (const r of demandRows) {
      const val = Number(r.count ?? 0);

      if (!Number.isInteger(val) || val < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid stored quantity demanded_items.count",
        });
      }

      if (val <= 0) continue;

      const itemName = r?.item?.item_name;
      if (!itemName) {
        return res.status(404).json({
          success: false,
          message: `Item not found for item_id=${r.item_id}`,
        });
      }

      if (!itemDemandMap.has(r.item_id)) {
        itemDemandMap.set(r.item_id, {
          item_id: r.item_id,
          item_name: itemName,
          required: 0,
        });
      }

      itemDemandMap.get(r.item_id).required += val;
      materials[itemName] = (materials[itemName] || 0) + val;
    }

    const aggregatedItems = Array.from(itemDemandMap.values());
    const neededItemIds = aggregatedItems.map((x) => x.item_id);

    if (neededItemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Demanded materials are all 0; nothing to allot",
      });
    }

    // 2) Read ongoing complaint OUTSIDE transaction
    const ongoing = await prisma.ongoing_complaints.findUnique({
      where: { complaint_id: complaintId },
      select: { complaint_id: true, status: true },
    });

    if (!ongoing) {
      return res.status(404).json({
        success: false,
        message: "No ongoing_complaints entry found for this complaint_id",
      });
    }

    // 3) Read inventory OUTSIDE transaction
    const inventoryRows = await prisma.items.findMany({
      where: { item_id: { in: neededItemIds } },
      select: { item_id: true, item_name: true, count: true },
    });

    const invMap = new Map(inventoryRows.map((r) => [r.item_id, r.count]));

    for (const r of aggregatedItems) {
      const available = invMap.get(r.item_id);

      if (available == null) {
        return res.status(404).json({
          success: false,
          message: `Item '${r.item_name}' not found in items table`,
        });
      }

      if (available < r.required) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for '${r.item_name}'. Available=${available}, Required=${r.required}`,
        });
      }
    }

    // 4) Only WRITES inside transaction
    const result = await prisma.$transaction(
      async (tx) => {
        for (const r of aggregatedItems) {
          await tx.items.update({
            where: { item_id: r.item_id },
            data: {
              count: { decrement: r.required },
            },
          });
        }

        for (const r of aggregatedItems) {
          await tx.worker_debt.upsert({
            where: {
              worker_id_item_id: {
                worker_id: workerId,
                item_id: r.item_id,
              },
            },
            update: {
              count: { increment: r.required },
            },
            create: {
              worker_id: workerId,
              item_id: r.item_id,
              count: r.required,
            },
          });
        }

        await tx.ongoing_complaints.update({
          where: { complaint_id: complaintId },
          data: { status: "ongoing" },
        });

        for (const r of aggregatedItems) {
          await tx.complaint_items.upsert({
            where: {
              complaint_id_item_id: {
                complaint_id: complaintId,
                item_id: r.item_id,
              },
            },
            update: {
              count: { increment: r.required },
            },
            create: {
              complaint_id: complaintId,
              item_id: r.item_id,
              count: r.required,
            },
          });
        }

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
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );

    return res.json({
      success: true,
      message:
        "Allotted from demanded_items, inventory decremented, updated debt + ongoing, removed demand row",
      data: result,
    });
  } catch (err) {
    console.error("ASC error full:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: String(err?.message || err),
      code: err?.code || null,
      name: err?.name || null,
    });
  }
});

module.exports = router;