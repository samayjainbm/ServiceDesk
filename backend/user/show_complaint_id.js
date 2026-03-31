// routes/complaints/myOngoingComplaints.js
const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

const { requireAuth, requireRole } = require("../inventory/middlewares/auth");

router.get("/", requireAuth, requireRole("user"), async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("Fetching ongoing complaints for user ID:", userId);

    const complaints = await prisma.ongoing_complaints.findMany({
      where: { user_id: userId },
      orderBy: { start_date: "desc" },
      select: {
        complaint_id: true,
        status:true,
       
      },
    });

    // ✅ If worker_id exists, fetch worker_name, else show "Worker Not Allotted"
  

        
    return res.json({
      success: true,
      count: complaints.length,
      complaints, 
    });
  } catch (err) {
    console.error("Fetch ongoing complaints error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
