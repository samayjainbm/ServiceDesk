// Work
// 1) Input kya lagega
// Params (URL):
// complaint_id (number)
// Body: kuch nahi (empty)

// 2) Kaunsa database/table change hoga
// Read (check ke liye):
// ongoing_complaints ✅ READ (findUnique)   // complaint exist hai ya nahi + current status
// Write/Change (actual update):
// ongoing_complaints ✅ UPDATE              // status toggle hoga (ongoing <-> delayed)

// 3) API kya karegi
// Sirf admin (requireAuth + requireRole("admin")) hi access kar sakta hai.
// complaint_id validate karegi.
// ongoing_complaints me complaint record dhundhegi.
// Agar complaint nahi mila => 404.
// Agar status "booked" hai => 400 (toggle allowed nahi).
// Agar status "ongoing" hai => "delayed" karegi.
// Agar status "delayed" hai => "ongoing" karegi.
// Fir ongoing_complaints table me status update karke updated data return karegi.
// Delete kuch bhi nahi hota.

const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

// PATCH /api/toggle_complaint_status/:complaint_id
router.patch("/:complaint_id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const complaintId = Number(req.params.complaint_id);

    if (!Number.isInteger(complaintId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint_id",
      });
    }

    // 1) Find complaint
    const complaint = await prisma.ongoing_complaints.findUnique({
      where: { complaint_id: complaintId },
      select: {
        complaint_id: true,
        status: true,
        worker_id: true,
      },
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Optional rule: booked should not be toggled
    if (complaint.status === "booked") {
      return res.status(400).json({
        success: false,
        message: "Booked complaint cannot be toggled. Assign worker first.",
      });
    }

    // 2) Toggle status
    let newStatus;
    if (complaint.status === "ongoing") newStatus = "delayed";
    else if (complaint.status === "delayed") newStatus = "ongoing";
    else {
      return res.status(400).json({
        success: false,
        message: `Cannot toggle status '${complaint.status}'`,
      });
    }

    // 3) Update
    const updated = await prisma.ongoing_complaints.update({
      where: { complaint_id: complaintId },
      data: { status: newStatus },
      select: {
        complaint_id: true,
        worker_id: true,
        status: true,
      },
    });

    return res.json({
      success: true,
      message: "Complaint status toggled successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error toggling complaint status:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while toggling complaint status.",
      error: process.env.NODE_ENV !== "production" ? error.message : undefined,
    });
  }
});

module.exports = router;