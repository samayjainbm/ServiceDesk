const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { requireAuth, requireRole } = require("../../inventory/middlewares/auth");

// POST /api/asc/:complaint_id
// No body needed. Quantities are read from demanded_items table.
router.post("/:complaint_id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const complaintId = Number(req.params.complaint_id);

    if (!Number.isInteger(complaintId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint_id",
      });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // 1) Get demanded rows
        const demandRows = await tx.demanded_items.findMany({
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
              select: {
                item_name: true,
              },
            },
          },
          orderBy: { s_no: "asc" },
        });

        if (!demandRows || demandRows.length === 0) {
          return {
            ok: false,
            status: 404,
            message: "No demanded_items entry found for this complaint_id",
          };
        }

        const workerId = demandRows[0].worker_id;

        // safety: same complaint_id should belong to same worker
        for (const r of demandRows) {
          if (r.worker_id !== workerId) {
            return {
              ok: false,
              status: 400,
              message: "Multiple workers found in demanded_items for this complaint_id",
            };
          }
        }

        // Aggregate by item_id
        const itemDemandMap = new Map();
        const materials = {};

        for (const r of demandRows) {
          const val = Number(r.count ?? 0);

          if (!Number.isInteger(val) || val < 0) {
            return {
              ok: false,
              status: 400,
              message: "Invalid stored quantity demanded_items.count",
            };
          }

          if (val <= 0) continue;

          const itemName = r?.item?.item_name;
          if (!itemName) {
            return {
              ok: false,
              status: 404,
              message: `Item not found for item_id=${r.item_id}`,
            };
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
          return {
            ok: false,
            status: 400,
            message: "Demanded materials are all 0; nothing to allot",
          };
        }

        // 2) Ensure ongoing_complaints exists
        const ongoing = await tx.ongoing_complaints.findUnique({
          where: { complaint_id: complaintId },
          select: { complaint_id: true, status: true },
        });

        if (!ongoing) {
          return {
            ok: false,
            status: 404,
            message: "No ongoing_complaints entry found for this complaint_id",
          };
        }

        // 3) Check inventory stock
        const inventoryRows = await tx.items.findMany({
          where: { item_id: { in: neededItemIds } },
          select: { item_id: true, item_name: true, count: true },
        });

        const invMap = new Map(inventoryRows.map((r) => [r.item_id, r.count]));

        for (const r of aggregatedItems) {
          const available = invMap.get(r.item_id);

          if (available == null) {
            return {
              ok: false,
              status: 404,
              message: `Item '${r.item_name}' not found in items table`,
            };
          }

          if (available < r.required) {
            return {
              ok: false,
              status: 400,
              message: `Not enough stock for '${r.item_name}'. Available=${available}, Required=${r.required}`,
            };
          }
        }

        // 4) Decrement inventory
        for (const r of aggregatedItems) {
          await tx.items.update({
            where: { item_id: r.item_id },
            data: {
              count: { decrement: r.required },
            },
          });
        }

        // 5) Add to worker_debt
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

        // 6) Update ongoing status
        await tx.ongoing_complaints.update({
          where: { complaint_id: complaintId },
          data: { status: "ongoing" },
        });

        // 7) Store allotted materials in complaint_items
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

        // 8) Delete original demanded rows
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
        timeout: 20000,
      }
    );

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
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