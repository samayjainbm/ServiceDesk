const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const bcrypt = require("bcryptjs");
const { requireAuth, requireRole } = require("../inventory/middlewares/auth");

// Base: /api/pa/worker-credentials

function toInt(v) {
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

// helper: ensure worker exists in worker_info (FK parent)
async function ensureWorkerExists(workerId) {
  // worker_info has worker_id Int (as per your earlier code)
  const worker = await prisma.worker_info.findUnique({
    where: { worker_id: workerId },
    select: { worker_id: true },
  });
  return !!worker;
}

// ✅ 1) CREATE credentials (hash password)
// NOTE: requires worker_info row exists for that worker_id
router.post("/", requireAuth, requireRole("pa"), async (req, res) => {
  try {
    const { worker_id, password } = req.body;

    const wid = toInt(worker_id);
    if (wid === null || !password) {
      return res.status(400).json({
        success: false,
        message: "worker_id (int) and password are required",
      });
    }

    // ✅ FK check
    const ok = await ensureWorkerExists(wid);
    if (!ok) {
      return res.status(400).json({
        success: false,
        message: `worker_id ${wid} does not exist in worker_info. Create worker_info first.`,
      });
    }

    // ✅ if already exists, block nicely
    const existing = await prisma.worker_credentials.findUnique({
      where: { worker_id: wid },
      select: { worker_id: true },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Credentials already exist for this worker_id",
      });
    }

    const hashed = await bcrypt.hash(String(password), 10);

    const created = await prisma.worker_credentials.create({
      data: {
        worker_id: wid,
        worker_password: hashed,
      },
      select: { worker_id: true }, // ✅ never return hash
    });

    return res.status(201).json({
      success: true,
      message: "Worker credentials created",
      data: created,
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Server error" });
  }
});

// ✅ 2) READ all credentials (NO hashes)
router.get("/", requireAuth, requireRole("pa"), async (req, res) => {
  try {
    const rows = await prisma.worker_credentials.findMany({
      orderBy: { worker_id: "asc" },
      select: { worker_id: true }, // ✅ hide password hash
    });
    return res.json({ success: true, data: rows });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Server error" });
  }
});

// ✅ 3) READ one by worker_id (NO hash)
router.get("/:worker_id", requireAuth, requireRole("pa"), async (req, res) => {
  try {
    const wid = toInt(req.params.worker_id);
    if (wid === null) {
      return res.status(400).json({ success: false, message: "worker_id must be an integer" });
    }

    const row = await prisma.worker_credentials.findUnique({
      where: { worker_id: wid },
      select: { worker_id: true }, // ✅ hide hash
    });

    if (!row) {
      return res.status(404).json({ success: false, message: "Credentials not found" });
    }

    return res.json({ success: true, data: row });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Server error" });
  }
});

// ✅ 4) UPDATE password only (worker_id constant)
// Optional FK check bhi rehne do (safe), though update me usually FK issue nahi aata
router.put("/:worker_id", requireAuth, requireRole("pa"), async (req, res) => {
  try {
    const wid = toInt(req.params.worker_id);
    const { password } = req.body;

    if (wid === null) {
      return res.status(400).json({ success: false, message: "worker_id must be an integer" });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: "password is required" });
    }

    // ✅ ensure worker exists (optional but consistent)
    const ok = await ensureWorkerExists(wid);
    if (!ok) {
      return res.status(400).json({
        success: false,
        message: `worker_id ${wid} does not exist in worker_info.`,
      });
    }

    const hashed = await bcrypt.hash(String(password), 10);

    const updated = await prisma.worker_credentials.update({
      where: { worker_id: wid },
      data: { worker_password: hashed },
      select: { worker_id: true },
    });

    return res.json({
      success: true,
      message: "Password updated",
      data: updated,
    });
  } catch (e) {
    if (e?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Credentials not found" });
    }
    return res.status(500).json({ success: false, message: e.message || "Server error" });
  }
});

// ✅ 5) DELETE credentials
router.delete("/:worker_id", requireAuth, requireRole("pa"), async (req, res) => {
  try {
    const wid = toInt(req.params.worker_id);
    if (wid === null) {
      return res.status(400).json({ success: false, message: "worker_id must be an integer" });
    }

    await prisma.worker_credentials.delete({
      where: { worker_id: wid },
    });

    return res.json({ success: true, message: "Credentials deleted" });
  } catch (e) {
    if (e?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Credentials not found" });
    }
    return res.status(500).json({ success: false, message: e.message || "Server error" });
  }
});

module.exports = router;