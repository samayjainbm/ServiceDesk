// Work
// 1) Input kya lagega
// Params (URL): kuch nahi
// Body: kuch nahi (empty)

// 2) Kaunsa database/table change hoga
// Read (fetch ke liye):
// demanded_items ✅ READ (findMany)
// Condition: a..p me se kisi bhi item ka count > 0 hona chahiye (OR condition)
// Write/Change: kuch bhi nahi (no update/insert/delete)

// 3) API kya karegi
// Sirf admin (requireAuth + requireRole("admin")) hi access kar sakta hai.
// demanded_items table se woh saare rows nikalegi jahan a..p me se koi bhi item > 0 hai.
// Sirf complaint_id aur worker_id select karegi.
// complaint_id ascending order me return karegi.
// Response me data[] banake भेजेगी jisme:
// name: null (placeholder), worker_id, complaint_id
// Delete/Update kuch bhi nahi hota.

const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const rows = await prisma.demanded_items.findMany({
      where: {
        count: { gt: 0 },
      },
      select: {
        complaint_id: true,
        worker_id: true,
      },
      orderBy: { complaint_id: "asc" },
    });

    // ✅ NEW: ensure unique (worker_id, complaint_id) like old behavior
    const seen = new Set();
    const uniqueRows = [];
    for (const r of rows) {
      const key = `${r.worker_id}:${r.complaint_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueRows.push(r);
    }

    const workerRows = await Promise.all(
      uniqueRows.map((r) =>
        prisma.worker_info.findUnique({
          where: { worker_id: r.worker_id },
          select: { name: true },
        })
      )
    );

    // worker_id -> name map
    const nameMap = new Map();
    uniqueRows.forEach((r, idx) => {
      nameMap.set(r.worker_id, workerRows[idx]?.name ?? null);
    });

    const data = uniqueRows.map((r) => ({
      name: nameMap.get(r.worker_id),
      worker_id: r.worker_id,
      complaint_id: r.complaint_id,
    }));

    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching demand items list:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching demand items list.",
      error: process.env.NODE_ENV !== "production" ? String(error) : undefined,
    });
  }
});

module.exports = router;