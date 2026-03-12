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
    const demandItems = await prisma.demanded_items.findMany({
      where: {
        count: { gt: 0 },
      },
      select: {
        worker_id: true,
        complaint_id: true,
        count: true,
        item: {
          select: { item_name: true },
        },
      },
      orderBy: {
        complaint_id: "asc",
      },
    });

    // merge rows by (worker_id, complaint_id) to match old output shape
    const map = new Map();

    for (const row of demandItems) {
      const key = `${row.worker_id}:${row.complaint_id}`;
      if (!map.has(key)) {
        map.set(key, {
          worker_id: row.worker_id,
          complaint_id: row.complaint_id,
          itemss: {},
        });
      }

      const obj = map.get(key);
      const itemName = row?.item?.item_name;
      if (!itemName) continue;

      const cnt = Number(row.count || 0);
      if (cnt > 0) obj.itemss[itemName] = cnt;
    }

    const cleanedData = Array.from(map.values());

    return res.json({
      success: true,
      data: cleanedData,
    });
  } catch (error) {
    console.error("Error fetching demand items:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching demand items.",
    });
  }
});

module.exports = router;