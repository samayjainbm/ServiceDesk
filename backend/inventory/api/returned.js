// Work
// 1) Input kya lagega
// Params (URL): kuch nahi
// Query (URL):
// name_of_material (string)   // e.g. a
// return_count (number)       // e.g. 5
// worker_id (number)          // e.g. 201
// Example: /api/returned?name_of_material=a&return_count=5&worker_id=201
// Body: kuch nahi (empty)

// 2) Kaunsa database/table change hoga
// Read (check ke liye):
// worker_debt ✅ READ (findUnique)   // worker ka current debt check (material ka debt >= return_count)
// Write/Change (actual update):
// worker_debt ✅ UPDATE              // material debt decrement (kam hoga)
// items ✅ UPDATE                    // inventory me item_count increment (badhega)

// 3) API kya karegi
// Sirf admin (requireAuth + requireRole("admin")) hi access kar sakta hai.
// Query params se material, returnCount, workerId read karegi aur validate karegi.
// worker_debt table me check karegi ki worker ke paas us material ka debt exist karta hai
// aur debt >= return_count hai ya nahi.
// Agar sufficient debt nahi hai => 400.
// Agar ok hai to:
// 1) worker_debt me us material ko return_count se decrement karegi (debt reduce)
// 2) items table me us material ka item_count return_count se increment karegi (stock increase)
// Delete kuch bhi nahi hota.

 
const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

// PUT /api/returned?name_of_material=a&return_count=5&worker_id=201
router.put("/", requireAuth, requireRole("admin"), async (req, res) => {
  const rawMaterial = req.query.name_of_material;
  const rawReturnCount = req.query.return_count;
  const rawWorkerId = req.query.worker_id;

  const material = String(rawMaterial || "").trim().toLowerCase();
  const returnCount = Number(rawReturnCount);
  const workerId = Number(rawWorkerId);

  // 1) Validate query (same)
  if (!material || isNaN(returnCount)) {
    return res.status(400).json({
      success: false,
      message:
        "Query params 'name_of_material' and 'return_count' are required. Example: /api/returned?name_of_material=a&return_count=5",
    });
  }

  try {
    // ✅ NEW: find item_id for this material
    const itemRow = await prisma.items.findUnique({
      where: { item_name: material },
      select: { item_id: true },
    });

    if (!itemRow) {
      return res.status(404).json({
        success: false,
        message: `Material '${material}' not found in items table.`,
      });
    }

    const itemId = itemRow.item_id;

    // ✅ NEW: Fetch worker's current debt row for this item_id
    const workerDebtRow = await prisma.worker_debt.findUnique({
      where: {
        worker_id_item_id: { worker_id: workerId, item_id: itemId },
      },
      select: { count: true },
    });

    const currentDebt = Number(workerDebtRow?.count ?? 0);

    if (!workerDebtRow || currentDebt < returnCount) {
      return res.status(400).json({
        success: false,
        message: `Worker does not have sufficient debt for material '${material}' or return count exceeds debt.`,
      });
    }

    // ✅ NEW: Atomic update (debt decrement + inventory increment)
    await prisma.$transaction(async (tx) => {
      await tx.worker_debt.update({
        where: {
          worker_id_item_id: { worker_id: workerId, item_id: itemId },
        },
        data: {
          count: { decrement: returnCount },
        },
      });

      await tx.items.update({
        where: { item_id: itemId },
        data: {
          count: { increment: returnCount },
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: `Successfully returned ${returnCount} units of material '${material}' for worker ID ${workerId}.`,
    });
  } catch (error) {
    console.error("Error in returned route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

module.exports = router;