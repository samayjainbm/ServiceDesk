// Work
// 1) Input kya lagega
// Params (URL): kuch nahi
// Body (JSON): non-empty array
// [
//   { item_name: "a", added_item_count: 10 },
//   { item_name: "b", added_item_count: 0 },
//   ...
// ]
// Note: har item me item_name required hai aur added_item_count number hona chahiye (0 bhi chal sakta hai)

// 2) Kaunsa database/table change hoga
// Read: direct read nahi (but update ke time item_name exist hona chahiye warna error aa sakta hai)
// Write/Change (actual update):
// items ✅ UPDATE (item_count increment hota hai)

// 3) API kya karegi
// Body me jo items aaye hain, unke liye loop chalega.
// Har item_name ke row ko items table me dhundh ke:
// item_count = item_count + added_item_count karegi (increment).
// Successful hua to "Items added successfully" return karegi.
// Delete kuch bhi nahi hota.

const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

// put request to add items in inventory
// put request /api/add_items
// body mei ayega json format mei saare items k  item_name and added_item_count aayenge bhale hi 0 ho to bhi aayenge
router.put("/", requireAuth, requireRole("admin"), async (req, res) => {
  const itemsToAdd = req.body; // Expecting an array of objects with item_name and added_item_count
  if (!Array.isArray(itemsToAdd) || itemsToAdd.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Request body should be a non-empty array of items to add.",
    });
  }

  try {
    for (const item of itemsToAdd) {
      const { item_name, added_item_count } = item;
      if (!item_name || isNaN(added_item_count)) {
        return res.status(400).json({
          success: false,
          message: `Invalid item data: ${JSON.stringify(item)}`,
        });
      }

      // Update the items table by incrementing the count
      await prisma.items.update({
        where: { item_name },
        data: {
          count: { increment: added_item_count },
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Items added successfully.",
    });
  } catch (error) {
    console.error("Error adding items:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

module.exports = router;

//first find out that how much material he has in debt and then we will update the count of material in items table and also update the worker_debt table by reducing the count of material from worker_debt table
    //first find out that how much material he has in debt and then we will update the count of material in items table and also update the worker_debt table by reducing the count of material from worker_debt table