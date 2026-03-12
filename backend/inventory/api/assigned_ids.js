// Work
// 1) Input kya lagega
// Params (URL): kuch nahi
// Body: kuch nahi (empty)

// 2) Kaunsa database/table change hoga
// Read (fetch ke liye):
// ongoing_complaints ✅ READ (findMany)
// Condition: status sirf ["ongoing","delayed"] me se hona chahiye
// Write/Change: kuch bhi nahi (no update/insert/delete)

// 3) API kya karegi
// ongoing_complaints table se saare records nikalegi jinka status ongoing ya delayed hai.
// Sirf complaint_id aur status fields return karegi.
// Result complaint_id ascending order me hoga.
// Response me count (total rows) aur data array de degi.
// Delete/Update kuch bhi nahi hota.

const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

// GET /api/assigned_ids
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const rows = await prisma.ongoing_complaints.findMany({
      where: {
        status: { in: ["ongoing", "delayed"] },
      },
      select: {
        complaint_id: true,
        status: true,
        start_date:true,
      },
      orderBy: { start_date: "desc" },
    });

    return res.json({
      success: true,
      count: rows.length,
      data: rows, // [{ complaint_id, status }, ...]
    });
  } catch (error) {
    console.error("Error fetching assigned ids:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "An error occurred while fetching assigned ids.",
      error: process.env.NODE_ENV !== "production" ? String(error) : undefined,
    });
  }
});

module.exports = router;
