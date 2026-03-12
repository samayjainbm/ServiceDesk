// Work // 1) Input kya lagega // Params (URL): // complaint_id (number) // Body: kuch nahi (empty) // 2) Kaunsa database/table change hoga // Read (fetch ke liye): // demanded_items ✅ READ (findFirst) // complaint_id ke basis par // Write/Change: kuch bhi nahi (no update/insert/delete) // 3) API kya karegi // Sirf admin (requireAuth + requireRole("admin")) hi access kar sakta hai. // complaint_id validate karegi. // demanded_items table me complaint_id ka record ढूंढेगी. // Mil gaya to a..p me se sirf woh items return karegi jinki value > 0 hai (itemss object me). // Response me complaint_id, worker_id, aur itemss (only >0) de degi. // Delete/Update kuch bhi nahi hota.

const express = require("express");
const router = express.Router();
const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

router.get("/:complaint_id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const complaintId = Number(req.params.complaint_id);
    if (!Number.isInteger(complaintId)) {
      return res.status(400).json({ success: false, message: "Invalid complaint_id" });
    }

    const rows = await prisma.demanded_items.findMany({
      where: { complaint_id: complaintId, count: { gt: 0 } },
      select: {
        complaint_id: true,
        worker_id: true,
        count: true,
        item: {
          select: { item_name: true },
        },
      },
      orderBy: { s_no: "asc" },
    });

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No demanded_items entry found for this complaint_id",
      });
    }

    const itemss = {};
    for (const r of rows) {
      const name = r?.item?.item_name;
      if (!name) continue;
      const cnt = Number(r.count || 0);
      if (cnt > 0) itemss[name] = cnt;
    }

    return res.json({
      success: true,
      data: {
        complaint_id: rows[0].complaint_id,
        worker_id: rows[0].worker_id,
        itemss,
      },
    });
  } catch (error) {
    console.error("Error fetching demand items details:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching demand items details.",
      error: process.env.NODE_ENV !== "production" ? String(error) : undefined,
    });
  }
});

module.exports = router;