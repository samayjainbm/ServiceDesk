const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    console.log("BOOKED_IDS req.user =", req.user);
    console.log(
      "BOOKED_IDS DATABASE_URL startsWith mysql:// =",
      String(process.env.DATABASE_URL || "").startsWith("mysql://")
    );

    const rows = await prisma.ongoing_complaints.findMany({
      where: { status: "booked" },
      orderBy: { start_date: "desc" },
      select: { complaint_id: true },
    });

    console.log("BOOKED_IDS success, rows length =", rows.length);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("BOOKED_IDS ERROR object =", error);
    console.error("BOOKED_IDS ERROR message =", error?.message);
    console.error("BOOKED_IDS ERROR stack =", error?.stack);
    console.error(
      "BOOKED_IDS DATABASE_URL raw =",
      process.env.DATABASE_URL || "DATABASE_URL not set"
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error?.message || String(error),
    });
  }
});

module.exports = router;