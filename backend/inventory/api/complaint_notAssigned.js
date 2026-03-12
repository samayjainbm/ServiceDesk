// Work
// 1) Input kya lagega
// Params (URL): kuch nahi
// Body: kuch nahi (empty)

// 2) Kaunsa database/table change hoga
// Read (fetch ke liye):
// ongoing_complaints ✅ READ (findMany)
// Condition: status = "booked"
// Write/Change: kuch bhi nahi (no update/insert/delete)

// 3) API kya karegi
// Sirf admin (requireAuth + requireRole("admin")) hi access kar sakta hai.
// ongoing_complaints table se saare complaints निकालेगी jinka status "booked" hai (unassigned/booked complaints).
// start_date descending order me return karegi.
// Fields return karegi: complaint_id, start_date, phone_number, address, description, worker_id, status
// aur items/columns a..p (a,b,c,...,p).
// Response me count aur data array de degi.
// Delete/Update kuch bhi nahi hota.

const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");
// GET /api/booked_display
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const bookedDisplayData = await prisma.ongoing_complaints.findMany({
      where: {
        status: "booked", // enum value
      },
      orderBy: {
        start_date: "desc",
      },
      select: {
        complaint_id: true,
        start_date: true,
        phone_number: true,
        address: true,
        description: true,
        worker_id: true,
        status: true,
       
      },
    });

    return res.status(200).json({
      success: true,
      count: bookedDisplayData.length,
      data: bookedDisplayData,
    });
  } catch (error) {
    console.error("Error fetching booked display data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
});

module.exports = router;
