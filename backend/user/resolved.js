// ✅ PASTE THIS WHOLE FILE
// Route: POST /api/resolved/:complaint_id
// Body:
// {
//   "used_items": [
//     { "item_id": 1, "count": 2 },
//     { "item_id": 4, "count": 1 }
//   ]
// }

const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const { requireAuth, requireRole } = require("../inventory/middlewares/auth");

// ✅ Google Sheet append via Apps Script Webhook
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

  return data; // sheet response bhi return karwa diya
}

router.post("/:complaint_id", requireAuth, requireRole("user"), async (req, res) => {
  try {
    const complaintId = Number(req.params.complaint_id);

    if (!Number.isInteger(complaintId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint_id",
      });
    }

    const usedRaw = req.body?.used_items;

    if (!Array.isArray(usedRaw)) {
      return res.status(400).json({
        success: false,
        message: "used_items must be an array",
      });
    }

    // ✅ clean used_items
    // only keep valid rows with count > 0
    const mergedUsedMap = new Map();

    for (const row of usedRaw) {
      const itemId = Number(row?.item_id);
      const count = Number(row?.count);

      if (!Number.isInteger(itemId) || itemId <= 0) continue;
      if (!Number.isFinite(count)) continue;

      const cleanCount = Math.max(0, Math.trunc(count));
      if (cleanCount <= 0) continue;

      mergedUsedMap.set(itemId, (mergedUsedMap.get(itemId) || 0) + cleanCount);
    }

    const usedItems = Array.from(mergedUsedMap.entries()).map(([item_id, count]) => ({
      item_id,
      count,
    }));

    if (usedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "used_items must contain at least one item with count > 0",
      });
    }

    // ✅ DB transaction
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
          user_id: true,
        },
      });

      if (!oc) {
        return { ok: false, status: 404, message: "ongoing_complaints not found" };
      }

      if (oc.worker_id == null) {
        return { ok: false, status: 400, message: "Worker not assigned; cannot resolve" };
      }

      // ✅ complaint ke allotted items lao
      const complaintItemRows = await tx.complaint_items.findMany({
        where: { complaint_id: complaintId },
        select: {
          item_id: true,
          count: true,
          item: {
            select: {
              item_name: true,
            },
          },
        },
      });

      if (!complaintItemRows || complaintItemRows.length === 0) {
        return {
          ok: false,
          status: 404,
          message: "No complaint_items found for this complaint",
        };
      }

      const allottedMap = new Map();
      for (const row of complaintItemRows) {
        allottedMap.set(Number(row.item_id), Number(row.count || 0));
      }

      // ✅ used <= allotted
      for (const row of usedItems) {
        const allotted = allottedMap.get(row.item_id) || 0;
        if (row.count > allotted) {
          const itemName =
            complaintItemRows.find((x) => Number(x.item_id) === row.item_id)?.item?.item_name ||
            `item_id ${row.item_id}`;

          return {
            ok: false,
            status: 400,
            message: `used count for ${itemName} cannot exceed allotted`,
          };
        }
      }

      // ✅ worker debt rows lao
      const workerDebtRows = await tx.worker_debt.findMany({
        where: {
          worker_id: oc.worker_id,
          item_id: { in: usedItems.map((x) => x.item_id) },
        },
        select: {
          worker_id: true,
          item_id: true,
          count: true,
          item: {
            select: {
              item_name: true,
            },
          },
        },
      });

      const debtMap = new Map();
      for (const row of workerDebtRows) {
        debtMap.set(Number(row.item_id), Number(row.count || 0));
      }

      // ✅ debt must be enough
      for (const row of usedItems) {
        const debt = debtMap.get(row.item_id) || 0;
        if (row.count > debt) {
          const itemName =
            workerDebtRows.find((x) => Number(x.item_id) === row.item_id)?.item?.item_name ||
            complaintItemRows.find((x) => Number(x.item_id) === row.item_id)?.item?.item_name ||
            `item_id ${row.item_id}`;

          return {
            ok: false,
            status: 400,
            message: `Worker debt insufficient for ${itemName}`,
          };
        }
      }

      // ✅ worker_debt decrement
      for (const row of usedItems) {
        await tx.worker_debt.updateMany({
          where: {
            worker_id: oc.worker_id,
            item_id: row.item_id,
          },
          data: {
            count: {
              decrement: row.count,
            },
          },
        });
      }

      // ✅ item names sheet ke liye
      const itemMasterRows = await tx.items.findMany({
        where: {
          item_id: { in: usedItems.map((x) => x.item_id) },
        },
        select: {
          item_id: true,
          item_name: true,
        },
      });

      const itemNameMap = new Map();
      for (const row of itemMasterRows) {
        itemNameMap.set(Number(row.item_id), row.item_name);
      }

      const usedItemsDetailed = usedItems.map((x) => ({
        item_id: x.item_id,
        item_name: itemNameMap.get(x.item_id) || `item_${x.item_id}`,
        count: x.count,
      }));

      // ✅ customer name nikalne ki koshish
      let customerName = "";
      if (oc.user_id != null) {
        const user = await tx.user_info.findUnique({
          where: { user_id: oc.user_id },
          select: { user_name: true },
        });
        customerName = user?.user_name || "";
      }

      // ✅ delete complaint_items first
      await tx.complaint_items.deleteMany({
        where: { complaint_id: complaintId },
      });

      // ✅ delete ongoing complaint
      await tx.ongoing_complaints.delete({
        where: { complaint_id: complaintId },
      });

      return {
        ok: true,
        oc,
        customerName,
        usedItemsDetailed,
      };
    });

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    let sheetWarning = null;
    let sheetResponse = null;

    try {
      const totalItemsUsed = result.usedItemsDetailed.reduce((sum, x) => sum + x.count, 0);

      sheetResponse = await appendToSheetViaAppsScript({
        complaint_id: result.oc.complaint_id,
        complaint_date: result.oc.start_date,
        resolved_date: new Date().toISOString(),
        customer_name: result.customerName || "",
        phone_number: result.oc.phone_number || "",
        address: result.oc.address || "",
        issue_description: result.oc.description || "",
        worker: result.oc.worker_id,
        used_items: result.usedItemsDetailed.map((x) => ({
          item_id: x.item_id,
          item_name: x.item_name,
          count: x.count,
        })),
        total_items_used: totalItemsUsed,
      });
    } catch (e) {
      sheetWarning = `Resolved in DB, but Google Sheet append failed: ${String(
        e?.message || e
      )}`;
    }

    return res.json({
      success: true,
      message: "Resolved: debt reduced, complaint_items deleted, ongoing deleted, appended to sheet.",
      warning: sheetWarning,
      sheet_response: sheetResponse,
      data: {
        complaint_id: result.oc.complaint_id,
        worker_id: result.oc.worker_id,
        used_items: result.usedItemsDetailed,
      },
    });
  } catch (err) {
    console.error("resolved error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
});

module.exports = router;