const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const { requireAuth, requireRole } = require("../inventory/middlewares/auth");

// GET /api/worker/debt/:worker_id
router.get("/:worker_id", requireAuth, requireRole("worker"), async (req, res) => {
  try {
    const workerIdFromToken = Number(req.user.userId);
    const workerIdFromParams = Number(req.params.worker_id);

    if (!Number.isInteger(workerIdFromParams)) {
      return res.status(400).json({
        success: false,
        message: "Invalid worker_id",
      });
    }

    // worker sirf apna debt dekh sake
    if (workerIdFromToken !== workerIdFromParams) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own debt",
      });
    }

    // optional: verify worker exists
    const workerExists = await prisma.worker_info.findUnique({
      where: { worker_id: workerIdFromParams },
      select: {
        worker_id: true,
        name: true,
        designation: true,
      },
    });

    if (!workerExists) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    const debtRows = await prisma.worker_debt.findMany({
      where: {
        worker_id: workerIdFromParams,
        count: {
          gt: 0,
        },
      },
      include: {
        item: {
          select: {
            item_id: true,
            item_name: true,
          },
        },
      },
      orderBy: {
        item_id: "asc",
      },
    });

    const items = debtRows.map((row) => ({
      item_id: row.item_id,
      item_name: row.item?.item_name || "Unknown Item",
      count: row.count,
    }));

    const totalCount = items.reduce((sum, curr) => sum + curr.count, 0);

    return res.status(200).json({
      success: true,
      worker_id: workerExists.worker_id,
      worker_name: workerExists.name,
      designation: workerExists.designation,
      total_non_zero_items: items.length,
      total_count: totalCount,
      items,
    });
  } catch (error) {
    console.error("WORKER DEBT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch worker debt",
      error: error.message,
    });
  }
});

module.exports = router;