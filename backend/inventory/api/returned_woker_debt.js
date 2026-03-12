// inventory/api/returned_worker_debt.js
const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

// GET /api/returned/worker-debt?worker_id=201
router.get("/worker-debt", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const workerId = Number(req.query.worker_id);

    if (!Number.isInteger(workerId) || workerId <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Valid query param 'worker_id' is required. Example: /api/returned/worker-debt?worker_id=201",
      });
    }

    // ✅ NEW: worker_debt rows fetch (row-based) + item join
    const debtRows = await prisma.worker_debt.findMany({
      where: { worker_id: workerId, count: { gt: 0 } },
      select: {
        worker_id: true,
        count: true,
        item: {
          select: { item_name: true },
        },
      },
      orderBy: { s_no: "asc" },
    });

    if (!debtRows || debtRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No worker_debt row found for worker_id ${workerId}`,
      });
    }

    // optional: worker name bhi bhej do
    const workerInfo = await prisma.worker_info.findUnique({
      where: { worker_id: workerId },
      select: {
        worker_id: true,
        name: true,
      },
    });

    // ✅ NEW: dynamic items for frontend counters
    const data = debtRows.map((r) => {
      const itemName = r?.item?.item_name || null;
      const debtCount = Number(r.count ?? 0);

      return {
        item_name: itemName,
        max_debt_count: debtCount, // frontend + disable logic ke liye
        selected_return_count: debtCount, // default UI value = current debt (as you asked)
      };
    });

    const totalDebtItems = data.reduce((sum, row) => sum + Number(row.max_debt_count || 0), 0);
    const nonZeroDebtMaterials = data.filter((row) => Number(row.max_debt_count || 0) > 0).length;

    return res.status(200).json({
      success: true,
      worker_id: workerId,
      worker_name: workerInfo?.name || null,
      total_debt_item_units: totalDebtItems,
      total_material_types_in_debt: nonZeroDebtMaterials,
      data,
    });
  } catch (error) {
    console.error("Error fetching worker debt for return UI:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

module.exports = router;