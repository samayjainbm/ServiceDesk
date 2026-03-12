const express = require("express");
const router = express.Router();
const prisma = require("../config/db"); // adjust path if needed
const { requireAuth, requireRole } = require("../inventory/middlewares/auth");

// ✅ PA can CRUD worker_info
// Base: /api/pa/workers

// helper: safe int parse
function toInt(v) {
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

/**
 * Your schema (as per your create):
 * worker_id: Int
 * name: String
 * worker_phone_number: String
 * designation: String? (nullable)
 */

// 1) CREATE worker
router.post("/", requireAuth, requireRole("pa"), async (req, res) => {
  try {
    const { worker_id, worker_name, phone_number, designation } = req.body;

    // ✅ validate
    const wid = toInt(worker_id);
    if (wid === null || !worker_name || !phone_number) {
      return res.status(400).json({
        success: false,
        message: "worker_id (int), worker_name, phone_number are required",
      });
    }

    const created = await prisma.worker_info.create({
      data: {
        worker_id: wid, // ✅ Int
        name: String(worker_name), // ✅ correct field
        worker_phone_number: String(phone_number), // ✅ correct field
        designation: designation ? String(designation) : null,
      },
    });

    return res.status(201).json({ success: true, message: "Worker created", data: created });
  } catch (e) {
    // Unique constraint example: P2002
    if (e?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: `Duplicate value for unique field(s): ${e?.meta?.target?.join(", ") || ""}`,
      });
    }
    return res.status(500).json({ success: false, message: e.message || "Server error" });
  }
});

// 2) READ all workers
router.get("/", requireAuth, requireRole("pa"), async (req, res) => {
  try {
    const workers = await prisma.worker_info.findMany({
      orderBy: { worker_id: "asc" }, // ✅ worker_id is Int
    });
    return res.json({ success: true, data: workers });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Server error" });
  }
});

// 3) READ one worker by id
router.get("/:worker_id", requireAuth, requireRole("pa"), async (req, res) => {
  try {
    const wid = toInt(req.params.worker_id);
    if (wid === null) {
      return res.status(400).json({ success: false, message: "worker_id must be an integer" });
    }

    const worker = await prisma.worker_info.findUnique({
      where: { worker_id: wid }, // ✅ Int
    });

    if (!worker) {
      return res.status(404).json({ success: false, message: "Worker not found" });
    }

    return res.json({ success: true, data: worker });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Server error" });
  }
});

// 4) UPDATE worker
router.put("/:worker_id", requireAuth, requireRole("pa"), async (req, res) => {
  try {
    const wid = toInt(req.params.worker_id);
    if (wid === null) {
      return res.status(400).json({ success: false, message: "worker_id must be an integer" });
    }

    // ✅ accept either old keys or new keys from frontend (backward compatible)
    const {
      worker_name,
      phone_number,
      designation,
      // optional: if frontend sends already-correct field names
      name,
      worker_phone_number,
    } = req.body;

    const data = {};
    // ✅ map to schema fields
    if (worker_name !== undefined) data.name = String(worker_name);
    if (name !== undefined) data.name = String(name);

    if (phone_number !== undefined) data.worker_phone_number = String(phone_number);
    if (worker_phone_number !== undefined) data.worker_phone_number = String(worker_phone_number);

    if (designation !== undefined) data.designation = designation === null ? null : String(designation);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update: worker_name/name, phone_number/worker_phone_number, designation",
      });
    }

    const updated = await prisma.worker_info.update({
      where: { worker_id: wid },
      data,
    });

    return res.json({ success: true, message: "Worker updated", data: updated });
  } catch (e) {
    if (e?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Worker not found" });
    }
    if (e?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: `Duplicate value for unique field(s): ${e?.meta?.target?.join(", ") || ""}`,
      });
    }
    return res.status(500).json({ success: false, message: e.message || "Server error" });
  }
});

// 5) DELETE worker
router.delete("/:worker_id", requireAuth, requireRole("pa"), async (req, res) => {
  try {
    const wid = toInt(req.params.worker_id);
    if (wid === null) {
      return res.status(400).json({ success: false, message: "worker_id must be an integer" });
    }

    await prisma.worker_info.delete({
      where: { worker_id: wid },
    });

    return res.json({ success: true, message: "Worker deleted" });
  } catch (e) {
    if (e?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Worker not found" });
    }
    return res.status(500).json({ success: false, message: e.message || "Server error" });
  }
});

module.exports = router;