const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    console.log("BOOKED_IDS req.user =", req.user);

    const rows = await prisma.ongoing_complaints.findMany({
      where: { status: "booked" },
      orderBy: { start_date: "desc" },
      select: { complaint_id: true },
    });

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching booked ids:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
});

module.exports = router;