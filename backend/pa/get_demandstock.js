const express = require("express");
const router = express.Router();

const prisma = require("../config/db");
const { requireAuth, requireRole } = require("../inventory/middlewares/auth");

function serializeBigInt(data) {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// GET /api/get_demandstock
router.get("/", requireAuth, requireRole("pa"), async (req, res) => {
  try {
    const rows = await prisma.demandStock.findMany({
      orderBy: [
        { date: "desc" },
        { item_name: "asc" },
        { s_no: "desc" },
      ],
      select: {
        date: true,
        item_id: true,
        item_name: true,
        count: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: serializeBigInt(rows),
      message: "Demand stock fetched successfully",
    });
  } catch (error) {
    console.error("get_demandstock error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch demand stock",
    });
  }
});

module.exports = router;