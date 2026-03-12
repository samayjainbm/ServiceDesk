// api/complaints/getUsedItems.js
const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const { requireAuth, requireRole } = require("../inventory/middlewares/auth");

// GET /api/complaints/used-items/:complaint_id
router.get("/:complaint_id", requireAuth, requireRole("user"), async (req, res) => {
  try {
    const complaintId = Number(req.params.complaint_id);
    if (!Number.isInteger(complaintId)) {
      return res.status(400).json({ success: false, message: "complaint_id must be an integer" });
    }

    // ✅ ensure complaint exists (same 404 message style)
    const complaint = await prisma.ongoing_complaints.findUnique({
      where: { complaint_id: complaintId },
      select: { complaint_id: true },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found in ongoing_complaints" });
    }

    // ✅ NEW: fetch used items from complaint_items + join items for item_name
    const rows = await prisma.complaint_items.findMany({
      where: { complaint_id: complaintId, count: { gt: 0 } },
      select: {
        count: true,
        item: { select: { item_name: true } },
      },
      orderBy: { s_no: "asc" },
    });

    // Normalize into { item_name: number, ... }
    const used_items = {};
    for (const r of rows) {
      const name = r?.item?.item_name;
      if (!name) continue;
      const v = Number(r.count ?? 0);
      used_items[name] = Number.isFinite(v) ? v : 0;
    }

    // Make a list of only non-zero used items
    const used_items_list = Object.entries(used_items)
      .filter(([_, v]) => Number(v) > 0)
      .map(([item_name, used_count]) => ({ item_name, used_count }));

    return res.json({
      success: true,
      complaint_id: complaintId,
      used_items,
      used_items_list,
    });
  } catch (err) {
    console.error("GET used-items error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;