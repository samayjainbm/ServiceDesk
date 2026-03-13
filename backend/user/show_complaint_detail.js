// routes/complaints/getComplaintWithWorkerPhone.js
const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const { requireAuth, requireRole } = require("../inventory/middlewares/auth");

/**
 * GET /api/ongoing_complaints/:complaint_id
 * - user can fetch ONLY their own complaint
 * - if worker is allotted (worker_id != null) => return worker_phone_number + worker_name + designation
 * - NEW: returns dynamic items used in this complaint from complaint_items
 */
router.get("/:complaint_id", requireAuth, requireRole("user"), async (req, res) => {
  try {
    const complaintId = parseInt(req.params.complaint_id, 10);
    if (Number.isNaN(complaintId)) {
      return res.status(400).json({ success: false, message: "complaint_id must be a number" });
    }

    // 1) fetch complaint (must belong to logged-in user)
    const complaint = await prisma.ongoing_complaints.findFirst({
      where: {
        complaint_id: complaintId,
        user_id: req.user.user_id,
      },
      select: {
        complaint_id: true,
        user_id: true,
        worker_id: true,
        address: true,
        phone_number: true,
        description: true,
        start_date: true,
        status: true,
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    // ✅ NEW: dynamic used items from complaint_items
    const usedRows = await prisma.complaint_items.findMany({
      where: { complaint_id: complaintId, count: { gt: 0 } },
      select: {
        count: true,
        item: { select: { item_name: true } },
      },
      orderBy: { s_no: "asc" },
    });

    const items = {};
    for (const r of usedRows) {
      const name = String(r?.item?.item_name ?? "").trim();
      if (!name) continue;
      const v = Number(r.count ?? 0);
      items[name] = Number.isFinite(v) ? v : 0;
    }

    const items_list = Object.entries(items)
      .filter(([_, v]) => Number(v) > 0)
      .map(([item_name, used_count]) => ({ item_name, used_count }));

    // 2) if worker allotted, fetch worker phone number + name + designation
    let worker_phone_number = null;
    let worker_name = null;
    let designation = null;

    if (complaint.worker_id != null) {
      const worker = await prisma.worker_info.findUnique({
        where: { worker_id: complaint.worker_id },
        select: { worker_phone_number: true, name: true, designation: true },
      });

      worker_phone_number = worker?.worker_phone_number ?? null;
      worker_name = worker?.name ?? null;
      designation = worker?.designation ?? null;
    }

    return res.json({
      success: true,
      complaint: {
        ...complaint,
        worker_allotted: complaint.worker_id != null,
        name: worker_name,
        worker_phone_number,
        designation,

        // ✅ dynamic (works for any item)
        items,
        items_list,
      },
    });
  } catch (err) {
    console.error("Fetch complaint error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;