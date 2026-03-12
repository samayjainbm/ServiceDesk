// Work
// 1) Input kya lagega
// Params (URL):
// complaintId (number)
// workerId (number)
// Body: kuch nahi chahiye (empty)

// 2) Kaunsa database/table change hoga
// Read (check ke liye):
// ongoing_complaints (complaint exist hai ya nahi)
// worker_info (worker exist hai ya nahi)
// Write/Change (actual update):
// ongoing_complaints ✅ UPDATE
// alloted_task ✅ UPSERT (create ya update)

// 3) API kya karegi
// Pehle verify karegi ki complaint aur worker dono exist karte hain.
// Fir transaction me:
// ongoing_complaints me us complaint ka:
// worker_id = workerId set karegi
// status = "ongoing" set karegi
// alloted_task me:
// agar worker ka record nahi hai → create with alloted_task = 1
// agar already hai → increment alloted_task by +1
   
const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");
// PUT /assign_worker/:complaintId/confirm/:workerId
router.put("/:complaintId/confirm/:workerId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const complaintId = Number(req.params.complaintId);
    const workerId = Number(req.params.workerId);

    if (!Number.isInteger(complaintId) || !Number.isInteger(workerId)) {
      return res.status(400).json({ success: false, message: "Invalid complaintId or workerId" });
    }

    // 1) check complaint exists
    const complaint = await prisma.ongoing_complaints.findUnique({
      where: { complaint_id: complaintId },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    // 2) check worker exists
    const worker = await prisma.worker_info.findUnique({
      where: { worker_id: workerId },
    });

    if (!worker) {
      return res.status(404).json({ success: false, message: "Worker not found" });
    }

    // 3) transaction: assign complaint + increment alloted_task
    const result = await prisma.$transaction(async (tx) => {
      const updatedComplaint = await tx.ongoing_complaints.update({
        where: { complaint_id: complaintId },
        data: {
          worker_id: workerId,
          status: "ongoing",
        },
      });

      const updatedAlloted = await tx.alloted_task.upsert({
        where: { worker_id: workerId },
        create: { worker_id: workerId, alloted_task: 1 },
        update: { alloted_task: { increment: 1 } },
      });

      return { updatedComplaint, updatedAlloted };
    });

    return res.status(200).json({
      success: true,
      message: "Worker assigned successfully",
      complaint: result.updatedComplaint,
      alloted_task: result.updatedAlloted,
    });
  } catch (error) {
    console.error("Assign worker error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
