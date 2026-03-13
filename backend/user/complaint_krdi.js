const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const { requireAuth, requireRole } = require("../inventory/middlewares/auth");

function random4Digit() {
  return Math.floor(1000 + Math.random() * 9000);
}

/**
 * POST /api/complaint_krdi
 * Body: { description: string }
 */
router.post("/", requireAuth, requireRole("user"), async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || typeof description !== "string" || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "description required",
      });
    }

    const user = await prisma.user_info.findUnique({
      where: { user_id: Number(req.user.userId) },
      select: {
        user_id: true,
        user_address: true,
        user_name: true,
        phone_number: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
console.log("HELLO FROM REAL REPO");

    let createdComplaint = null;

    for (let attempt = 0; attempt < 15; attempt++) {
      const complaint_id = random4Digit();

      try {
        createdComplaint = await prisma.ongoing_complaints.create({
          data: {
            complaint_id,
            user_id: user.user_id,
            address: user.user_address,
            description: description.trim(),
            start_date: new Date(),
            phone_number: user.phone_number,
            status: "booked",
          },
        });
        break;
      } catch (err) {
        const msg = String(err?.message || "");
        if (msg.includes("Unique constraint")) {
          continue;
        }
        throw err;
      }
    }

    if (!createdComplaint) {
      return res.status(500).json({
        success: false,
        message: "Could not generate unique 4-digit complaint_id. Try again.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Complaint created",
      complaint: createdComplaint,
    });
  } catch (err) {
    console.error("Create complaint error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

module.exports = router;
