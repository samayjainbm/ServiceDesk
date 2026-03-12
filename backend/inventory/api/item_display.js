// Work
// 1) Input kya lagega
// Params (URL): kuch nahi
// Body: kuch nahi (empty)

// 2) Kaunsa database/table change hoga
// Read (fetch ke liye):
// items ✅ READ (findMany)
// Write/Change: kuch bhi nahi (no update/insert/delete)

// 3) API kya karegi
// Sirf admin (requireAuth + requireRole("admin")) hi access kar sakta hai.
// items table se saare items nikalegi aur sirf item_name return karegi.
// item_name ascending order me return karegi.
// Response me data[] de degi (har element me item_name).
// Delete/Update kuch bhi nahi hota.


const express = require('express');
const router = express.Router();
const prisma = require('../../config/db');
const { requireAuth, requireRole } = require("../middlewares/auth");

router.get('/', requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const items = await prisma.items.findMany({
      select: {
        item_id: true,
        item_name: true,
        count: true,
      },
      orderBy: {
        item_name: 'asc',
      },
    });

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching items.'
    });
  }
});

module.exports = router;