// Work
// 1) Input kya lagega
// Params (URL):
// complaint_id (number)
// Body: kuch nahi (empty)

// 2) Kaunsa database/table change hoga
// Read (check/fetch ke liye):
// ongoing_complaints ✅ READ (findFirst)
// Condition: complaint_id match hona chahiye AND status sirf ["ongoing","delayed"] me se hona chahiye
// Write/Change: kuch bhi nahi (no update/insert/delete)

// 3) API kya karegi
// complaint_id ko number me convert karke validate karegi.
// ongoing_complaints table me check karegi ki ye complaint_id ka record exist karta hai ya nahi
// aur status ongoing ya delayed hai ya nahi.
// Mil gaya to selected fields (complaint_id, phone_number, address, description, worker_id, status) return karegi.
// Nahi मिला to 404 de degi.
// Delete/Update kuch bhi nahi hota.

const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

// GET /api/assigned_details/:complaint_id
router.get("/:complaint_id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const complaintId = Number(req.params.complaint_id);
    if (!Number.isInteger(complaintId)) {
      return res.status(400).json({ success: false, message: "Invalid complaint_id" });
    }

    const row = await prisma.ongoing_complaints.findFirst({
      where: {
        complaint_id: complaintId,
        status: { in: ["ongoing", "delayed"] },
      },
      select: {
        complaint_id: true,
        phone_number: true,
        address: true,
        description: true,
        worker_id: true,
        status: true,
      },
    });

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "No assigned complaint (ongoing/delayed) found for this complaint_id",
      });
    }

    return res.json({ success: true, data: row });
  } catch (error) {
    console.error("Error fetching assigned details:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "An error occurred while fetching assigned details.",
      error: process.env.NODE_ENV !== "production" ? String(error) : undefined,
    });
  }
});

module.exports = router;
