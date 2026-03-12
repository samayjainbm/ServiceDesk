// Display details of a specific complaint having status as booked

const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

// GET /api/booked_details/:complaint_id
router.get("/:complaint_id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const complaintId = Number(req.params.complaint_id);
    if (!Number.isInteger(complaintId)) {
      return res.status(400).json({ success: false, message: "Invalid complaint_id" });
    }

    const row = await prisma.ongoing_complaints.findFirst({
      where: {
        complaint_id: complaintId,
        status: "booked",
      },
      select: {
        user_id: true,
        complaint_id: true,
        start_date: true,
        phone_number: true,
        address: true,
        description: true,
        status: true,
        user: {
          select: {
            user_name: true,
          },
        },
      },
    });

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "No booked complaint found for this complaint_id",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user_id: row.user_id,
        complaint_id: row.complaint_id,
        start_date: row.start_date,
        phone_number: row.phone_number,
        address: row.address,
        description: row.description,
        status: row.status,
      },
      user_details: row.user,
    });
  } catch (error) {
    console.error("Error fetching booked details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
});

module.exports = router;