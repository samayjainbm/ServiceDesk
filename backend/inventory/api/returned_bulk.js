// inventory/api/returned_bulk.js
const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

// PUT /api/returned/bulk?worker_id=201
// Body (frontend se):
// [
//   { "item_name": "a", "return_count": 1 },
//   { "item_name": "b", "return_count": 0 },
//   ...
// ]
router.put("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const workerId = Number(req.query.worker_id);
    const itemsToReturn = req.body;

    // 1) worker_id validation
    if (!Number.isInteger(workerId) || workerId <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Valid query param 'worker_id' is required. Example: /api/returned/bulk?worker_id=201",
      });
    }

    // 2) body validation
    if (!Array.isArray(itemsToReturn) || itemsToReturn.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body should be a non-empty array.",
      });
    }

    // 3) normalize + validate request rows (dynamic items allowed)
    const normalized = [];
    const seenItems = new Set();

    for (const row of itemsToReturn) {
      const itemName = String(row?.item_name || "").trim().toLowerCase();
      const returnCount = Number(row?.return_count);

      if (!itemName) {
        return res.status(400).json({
          success: false,
          message: `Invalid item_name '${row?.item_name}'.`,
        });
      }

      if (!Number.isInteger(returnCount) || returnCount < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid return_count for item '${itemName}'. It must be an integer >= 0.`,
        });
      }

      if (seenItems.has(itemName)) {
        return res.status(400).json({
          success: false,
          message: `Duplicate item_name '${itemName}' in request body.`,
        });
      }

      seenItems.add(itemName);
      normalized.push({
        item_name: itemName,
        return_count: returnCount,
      });
    }

    const totalReturnUnits = normalized.reduce((sum, row) => sum + row.return_count, 0);

    if (totalReturnUnits <= 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item must have return_count > 0.",
      });
    }

    // ✅ NEW: map item_name -> item_id from items table
    const itemNames = normalized.map((r) => r.item_name);
    const itemRows = await prisma.items.findMany({
      where: { item_name: { in: itemNames } },
      select: { item_id: true, item_name: true },
    });

    const itemIdMap = new Map(itemRows.map((x) => [String(x.item_name).toLowerCase(), x.item_id]));

    // if any item_name not found in items table => 404 (same style as old not-found checks)
    for (const r of normalized) {
      if (!itemIdMap.has(r.item_name)) {
        return res.status(404).json({
          success: false,
          message: `Material '${r.item_name}' not found in items table.`,
        });
      }
    }

    // ✅ NEW: fetch worker_debt rows for these items (current debt check)
    const itemIds = normalized.map((r) => itemIdMap.get(r.item_name));
    const workerDebtRows = await prisma.worker_debt.findMany({
      where: {
        worker_id: workerId,
        item_id: { in: itemIds },
      },
      select: {
        item_id: true,
        count: true,
      },
    });

    const debtMap = new Map(workerDebtRows.map((r) => [r.item_id, r.count]));

    // If worker has no debt rows at all for requested items -> behave like old "no worker_debt row"
    // (old code required worker_debt row exist)
    if (workerDebtRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No worker_debt row found for worker_id ${workerId}`,
      });
    }

    // 5) ensure admin requested return_count <= worker debt for each item
    for (const row of normalized) {
      const item_id = itemIdMap.get(row.item_name);
      const currentDebt = Number(debtMap.get(item_id) ?? 0);

      if (row.return_count > currentDebt) {
        return res.status(400).json({
          success: false,
          message: `Return count exceeds debt for material '${row.item_name}'. Current debt: ${currentDebt}, requested: ${row.return_count}`,
        });
      }
    }

    // 6) transaction: worker_debt decrement + items increment
    await prisma.$transaction(async (tx) => {
      // decrement worker debt rows
      for (const row of normalized) {
        if (row.return_count > 0) {
          const item_id = itemIdMap.get(row.item_name);

          await tx.worker_debt.update({
            where: {
              worker_id_item_id: { worker_id: workerId, item_id },
            },
            data: {
              count: { decrement: row.return_count },
            },
          });
        }
      }

      // increment inventory counts
      for (const row of normalized) {
        if (row.return_count > 0) {
          const item_id = itemIdMap.get(row.item_name);

          await tx.items.update({
            where: { item_id },
            data: {
              count: {
                increment: row.return_count,
              },
            },
          });
        }
      }
    });

    // 7) success response
    return res.status(200).json({
      success: true,
      message: "Items returned successfully.",
      worker_id: workerId,
      total_returned_units: totalReturnUnits,
      returned_items: normalized.filter((row) => row.return_count > 0),
    });
  } catch (error) {
    console.error("Error in /api/returned/bulk:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

module.exports = router;