// login -> show_complaint
// show the complaints assigned to the worker

const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const { requireAuth, requireRole } = require("../inventory/middlewares/auth");

// GET /api/show_complaint
router.get("/", requireAuth, requireRole("worker"), async (req, res) => {
  try {
    const workerId = req.user.userId;
    const complaints = await prisma.ongoing_complaints.findMany({
      where: { worker_id: workerId },
      select: {
        complaint_id: true,
      },
    });

    return res.json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.error("Error fetching complaints for worker:", error);
    return res.status(500).json({
        success: false,
        message: "An error occurred while fetching complaints",
    });
  } 

});

module.exports = router;