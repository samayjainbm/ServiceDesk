// backend/inventory/api/demandstock.js

const express = require("express");
const router = express.Router();

const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

function serializeBigInt(data) {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

function getTodayRange() {
  const now = new Date();

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

router.put("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: "items array is required",
      });
    }

    const cleaned = items
      .map((x) => ({
        item_name: String(x.item_name || "").trim().toLowerCase(),
        count: Number(x.count),
      }))
      .filter(
        (x) =>
          x.item_name.length > 0 &&
          Number.isFinite(x.count) &&
          x.count > 0
      );

    if (cleaned.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid items with count > 0 found",
      });
    }

    // body ke same item names ko merge kar do
    const mergedInputMap = new Map();
    for (const item of cleaned) {
      mergedInputMap.set(
        item.item_name,
        (mergedInputMap.get(item.item_name) || 0) + item.count
      );
    }

    const mergedItems = Array.from(mergedInputMap.entries()).map(
      ([item_name, count]) => ({
        item_name,
        count,
      })
    );

    const itemNames = mergedItems.map((x) => x.item_name);

    const dbItems = await prisma.items.findMany({
      where: {
        item_name: { in: itemNames },
      },
      select: {
        item_id: true,
        item_name: true,
      },
    });

    const itemIdMap = new Map(
      dbItems.map((x) => [String(x.item_name).trim().toLowerCase(), x.item_id])
    );

    for (const name of itemNames) {
      if (!itemIdMap.has(name)) {
        return res.status(400).json({
          success: false,
          error: `Invalid item_name: ${name}`,
        });
      }
    }

    const { start, end } = getTodayRange();

    const result = await prisma.$transaction(async (tx) => {
      // aaj ke liye in item names ki sab existing rows nikaalo
      const existingRows = await tx.demandStock.findMany({
        where: {
          item_name: { in: itemNames },
          date: {
            gte: start,
            lte: end,
          },
        },
        orderBy: [
          { item_name: "asc" },
          { s_no: "asc" },
        ],
        select: {
          s_no: true,
          date: true,
          item_id: true,
          item_name: true,
          count: true,
        },
      });

      // existing rows ko item_name wise group karo
      const existingMap = new Map();
      for (const row of existingRows) {
        const key = String(row.item_name).trim().toLowerCase();
        if (!existingMap.has(key)) existingMap.set(key, []);
        existingMap.get(key).push(row);
      }

      const finalRows = [];

      for (const incoming of mergedItems) {
        const key = incoming.item_name;
        const rowsForItem = existingMap.get(key) || [];

        // same date pe ek bhi row nahi hai -> create
        if (rowsForItem.length === 0) {
          const created = await tx.demandStock.create({
            data: {
              date: start,
              item_id: itemIdMap.get(key),
              item_name: key,
              count: incoming.count,
            },
            select: {
              s_no: true,
              date: true,
              item_id: true,
              item_name: true,
              count: true,
            },
          });

          finalRows.push(created);
          continue;
        }

        // same date pe multiple rows hain -> sabka total + incoming count
        const keeperRow = rowsForItem[0];
        const duplicateRows = rowsForItem.slice(1);

        const existingTotal = rowsForItem.reduce(
          (sum, row) => sum + Number(row.count || 0),
          0
        );

        const finalCount = existingTotal + incoming.count;

        const updated = await tx.demandStock.update({
          where: { s_no: keeperRow.s_no },
          data: {
            count: finalCount,
            item_id: itemIdMap.get(key),
            item_name: key,
            date: start,
          },
          select: {
            s_no: true,
            date: true,
            item_id: true,
            item_name: true,
            count: true,
          },
        });

        if (duplicateRows.length > 0) {
          await tx.demandStock.deleteMany({
            where: {
              s_no: {
                in: duplicateRows.map((r) => r.s_no),
              },
            },
          });
        }

        finalRows.push(updated);
      }

      return finalRows;
    });

    return res.status(200).json({
      success: true,
      message: "Demand stock saved successfully",
      data: serializeBigInt(result),
    });
  } catch (e) {
    console.error("demandstock PUT error:", e);
    return res.status(400).json({
      success: false,
      error: e.message || "Failed to save demand stock",
    });
  }
});

module.exports = router;