// ✅ PASTE THIS WHOLE FILE (remove your duplicates)
// Route: POST /api/resolved/:complaint_id
// Body: { used_items: { a:"0", b:"0", ..., p:"0" } }

const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const { requireAuth, requireRole } = require("../inventory/middlewares/auth");

const KEYS = "abcdefghijklmnop".split("");

// ✅ Google Sheet append (FREE) via Apps Script Webhook
async function appendToSheetViaAppsScript(payload) {
  const url = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!url) throw new Error("GOOGLE_SHEET_WEBHOOK_URL missing in .env");

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data.success === false) {
    throw new Error(data.message || `Sheet webhook failed: HTTP ${resp.status}`);
  }
}

router.post("/:complaint_id", requireAuth, requireRole("user"), async (req, res) => {
  try {
    const complaintId = Number(req.params.complaint_id);
    if (!Number.isInteger(complaintId)) {
      return res.status(400).json({ success: false, message: "Invalid complaint_id" });
    }

    const usedRaw = req.body?.used_items;
    if (!usedRaw || typeof usedRaw !== "object") {
      return res.status(400).json({ success: false, message: "used_items object is required" });
    }

    // ✅ clean used_items (a..p only, int >=0)  (handles string numbers too)
    const usedItems = {};
    for (const k of KEYS) {
      const v = Number(usedRaw[k] ?? 0);
      usedItems[k] = Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : 0;
    }

    // ✅ DB Transaction: validate + decrement worker_debt + delete ongoing
    const result = await prisma.$transaction(async (tx) => {
      const oc = await tx.ongoing_complaints.findUnique({
        where: { complaint_id: complaintId },
        select: {
          complaint_id: true,
          worker_id: true,
          phone_number: true,
          address: true,
          description: true,
          status: true,
          start_date: true,
          a: true, b: true, c: true, d: true, e: true, f: true, g: true, h: true,
          i: true, j: true, k: true, l: true, m: true, n: true, o: true, p: true,
        },
      });

      if (!oc) return { ok: false, status: 404, message: "ongoing_complaints not found" };
      if (oc.worker_id == null) return { ok: false, status: 400, message: "Worker not assigned; cannot resolve" };

      // ✅ used <= allotted
      for (const k of KEYS) {
        const allotted = Number(oc[k] ?? 0);
        if (usedItems[k] > allotted) {
          return { ok: false, status: 400, message: `used_items.${k} cannot exceed allotted` };
        }
      }

      const workerDebt = await tx.worker_debt.findUnique({
        where: { worker_id: oc.worker_id },
        select: KEYS.reduce((acc, k) => ((acc[k] = true), acc), { worker_id: true }),
      });

      if (!workerDebt) return { ok: false, status: 404, message: "worker_debt not found for worker" };

      // ✅ debt must be enough
      for (const k of KEYS) {
        const debt = Number(workerDebt[k] ?? 0);
        if (usedItems[k] > debt) {
          return { ok: false, status: 400, message: `Worker debt insufficient for ${k}` };
        }
      }

      // ✅ decrement worker_debt
      const decObj = {};
      for (const k of KEYS) {
        if (usedItems[k] > 0) decObj[k] = { decrement: usedItems[k] };
      }
      if (Object.keys(decObj).length > 0) {
        await tx.worker_debt.update({
          where: { worker_id: oc.worker_id },
          data: decObj,
        });
      }

      // ✅ delete complaint from ongoing
      await tx.ongoing_complaints.delete({ where: { complaint_id: complaintId } });

      return { ok: true, oc, usedItems };
    });

    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    // ✅ Append to Sheet (IMPORTANT: used_items must be sent like this)
    let sheetWarning = null;
    try {
      await appendToSheetViaAppsScript({
        timestamp: new Date().toISOString(),
        complaint_id: result.oc.complaint_id,
        worker_id: result.oc.worker_id,
        phone_number: result.oc.phone_number,
        address: result.oc.address,
        description: result.oc.description,
        used_items: result.usedItems, // ✅ keep inside used_items
      });
    } catch (e) {
      sheetWarning = `Resolved in DB, but Google Sheet append failed: ${String(e?.message || e)}`;
    }

    return res.json({
      success: true,
      message: "Resolved: debt reduced, ongoing deleted, appended to sheet.",
      warning: sheetWarning,
      data: {
        complaint_id: result.oc.complaint_id,
        worker_id: result.oc.worker_id,
        used_items: result.usedItems,
      },
    });
  } catch (err) {
    console.error("resolved error:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
});

module.exports = router;