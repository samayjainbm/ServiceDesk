// inventory/api/debt.js
// GET /api/debt?name_of_material=a
// Admin-only

const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

// GET /api/debt?name_of_material=a
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const rawMaterial = req.query.name_of_material;
  const material = String(rawMaterial || "").trim().toLowerCase();

  // 1) Validate query (same input)
  if (!material) {
    return res.status(400).json({
      success: false,
      message:
        "Query param 'name_of_material' is required. Example: /api/debt?name_of_material=a",
    });
  }

  try {
    // ✅ NEW: Validate dynamically from DB (instead of ALLOWED_MATERIALS)
    const itemRow = await prisma.items.findUnique({
      where: { item_name: material },
      select: { item_id: true, count: true },
    });

    if (!itemRow) {
      return res.status(404).json({
        success: false,
        message: `Material '${material}' not found in items table.`,
      });
    }

    // ✅ NEW: Fetch workers where this material debt count > 0 (row-based)
    const debtData = await prisma.worker_debt.findMany({
      where: {
        item_id: itemRow.item_id,
        count: { gt: 0 },
      },
      select: {
        worker_id: true,
        count: true,
      },
      orderBy: {
        worker_id: "asc",
      },
    });

    // 4) Fetch worker names from worker_info table
    const workerIds = debtData.map((row) => row.worker_id);

    let workerMap = new Map();

    if (workerIds.length > 0) {
      const workerInfoRows = await prisma.worker_info.findMany({
        where: {
          worker_id: { in: workerIds },
        },
        select: {
          worker_id: true,
          name: true,
        },
      });

      workerMap = new Map(workerInfoRows.map((w) => [w.worker_id, w.name]));
    }

    // 5) Shape result (worker_id + worker_name + debt_count)
    const data = debtData.map((row) => ({
      worker_id: row.worker_id,
      worker_name: workerMap.get(row.worker_id) || null,
      debt_count: row.count,
    }));

    return res.status(200).json({
      success: true,
      material,
      inventory_total: itemRow.count,
      total_workers_in_debt: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching debt data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;