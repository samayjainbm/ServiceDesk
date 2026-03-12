// routes/inventory/reject_demand_request.js
const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

// POST /api/reject_demand_request
// Body: { complaint_id: 123, worker_id: 45 }
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const complaint_id = Number(req.body.complaint_id);
    const worker_id = Number(req.body.worker_id);

    // ✅ Basic validation
    if (!Number.isInteger(complaint_id) || complaint_id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid complaint_id is required",
      });
    }

    if (!Number.isInteger(worker_id) || worker_id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid worker_id is required",
      });
    }

    // ✅ Delete all demand rows for this worker + complaint
    const deleted = await prisma.demanded_items.deleteMany({
      where: {
        complaint_id,
        worker_id,
      },
    });

    // deleted.count = number of rows deleted
    if (deleted.count === 0) {
      return res.status(404).json({
        success: false,
        message: "No demanded items found for this worker and complaint",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Demand request rejected and demanded items deleted successfully",
      deleted_count: deleted.count,
      complaint_id,
      worker_id,
    });
  } catch (error) {
    console.error("Reject demand request error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while rejecting demand request",
    });
  }
});

module.exports = router;