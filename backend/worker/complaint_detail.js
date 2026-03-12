const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const { requireAuth, requireRole } = require("../inventory/middlewares/auth");

// GET /api/show_complaint/:complaint_id
router.get("/:complaint_id", requireAuth, requireRole("worker"), async (req, res) => {
  try {
    const workerId = Number(req.user.userId);
    const complaintId = Number(req.params.complaint_id);

    if (!Number.isInteger(workerId) || !Number.isInteger(complaintId)) {
      return res.status(400).json({ success: false, message: "Invalid worker_id or complaint_id" });
    }

    const complaint = await prisma.ongoing_complaints.findFirst({
      where: {
        worker_id: workerId,
        complaint_id: complaintId,
      },
      select: {
        complaint_id: true,
        phone_number: true,
        description: true,
        address: true,
        status: true,
        start_date: true,
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found for this worker" });
    }

    return res.json({
      success: true,
      complaint, // ✅ correct variable name
    });
  } catch (error) {
    console.error("Error fetching complaint for worker:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching complaint",
    });
  }
});

module.exports = router;
