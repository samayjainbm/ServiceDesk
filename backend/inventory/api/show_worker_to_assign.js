// Work
// 1) Input kya lagega
// Params (URL): kuch nahi
// Body: kuch nahi (empty)

// 2) Kaunsa database/table change hoga
// Read (fetch ke liye):
// alloted_task ✅ READ (findMany)           // worker_id + alloted_task
// worker_info ✅ READ (relation/join via worker)  // designation + name (worker_id se join)
// Write/Change: kuch bhi nahi (no update/insert/delete)

// 3) API kya karegi
// Sirf admin (requireAuth + requireRole("admin")) hi access kar sakta hai.
// alloted_task table se saare workers ke worker_id aur alloted_task nikaalegi.
// saath me relation (join) se worker_info se name aur designation nikaalegi.
// Data ko alloted_task ascending order me sort karke return karegi
// (jispe kam tasks hain woh upar aayega, assign karne ke liye).
// Delete/Update kuch bhi nahi hota.

const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const data = await prisma.alloted_task.findMany({
      select: {
        worker_id: true,
        alloted_task: true,
        worker: {
          select: {
            designation: true,
            name: true,
          },
        },
      },
      orderBy: { alloted_task: "asc" },
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching worker info:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
});

module.exports = router;
