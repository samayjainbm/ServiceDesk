// Work
// 1) Input kya lagega
// Params (URL): kuch nahi
// Body: kuch nahi (empty)

// 2) Kaunsa database/table change hoga
// Read (fetch ke liye):
// ongoing_complaints ✅ READ (findMany)
// Condition: status in ["ongoing","delayed"]
// Write/Change: kuch bhi nahi (no update/insert/delete)

// 3) API kya karegi
// Sirf admin (requireAuth + requireRole("admin")) hi access kar sakta hai.
// ongoing_complaints table se saare complaints निकालेगी jinka status ongoing ya delayed hai.
// Fields return karegi: complaint_id, phone_number, address, description, worker_id, status
// Order complaint_id ascending me rahega.
// Response me count aur data array de degi.
// Delete/Update kuch bhi nahi hota.

const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");
router.get("/", requireAuth, requireRole("admin"),     async (req, res) => {
  try {
    const complaints = await prisma.ongoing_complaints.findMany({
      where: {
        status: {
          in: ["ongoing", "delayed"], // IMPORTANT: delayed, not delay
        },
      },
      select: {
        complaint_id: true,
        phone_number: true,
        address: true,
        description: true,
        worker_id: true,
        status: true,
      },
      orderBy: {
        complaint_id: "asc",
      },
    });
 
    return res.json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    console.error("Error fetching complaints:", error); // keep full server log
    return res.status(500).json({
      success: false,
      message: error.message || "An error occurred while fetching complaints.",
      // remove line below in production
      error: process.env.NODE_ENV !== "production" ? String(error) : undefined,
    });
  }
});

module.exports = router;