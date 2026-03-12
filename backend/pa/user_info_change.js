const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const bcrypt = require("bcryptjs");
const { requireAuth, requireRole } = require("../inventory/middlewares/auth");

// Base: /api/pa/users

function toInt(v) {
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

// ✅ 1) CREATE user (password REQUIRED + hashed)
router.post("/", requireAuth, requireRole("pa"), async (req, res) => {
  try {
    const { user_id, user_name, user_address, address, phone_number, password } = req.body;

    const uid = toInt(user_id);
    const addr = user_address ?? address;

    if (uid === null || !user_name || !addr || !phone_number || !password) {
      return res.status(400).json({
        success: false,
        message: "user_id (int), user_name, user_address/address, phone_number, password are required",
      });
    }

    const hashed = await bcrypt.hash(String(password), 10);

    const created = await prisma.user_info.create({
      data: {
        user_id: uid,
        user_name: String(user_name),
        user_address: String(addr),
        phone_number: String(phone_number),
        password: hashed, // ✅ hashed
      },
      select: {
        user_id: true,
        user_name: true,
        user_address: true,
        phone_number: true,
      },
    });

    return res.status(201).json({ success: true, message: "User created", data: created });
  } catch (e) {
    if (e?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: `Duplicate value for unique field(s): ${e?.meta?.target?.join(", ") || ""}`,
      });
    }
    return res.status(500).json({ success: false, message: e.message || "Server error" });
  }
});

// ✅ 2) READ all users (never return password)
router.get("/", requireAuth, requireRole("pa"), async (req, res) => {
  try {
    const users = await prisma.user_info.findMany({
      orderBy: { user_id: "asc" },
      select: {
        user_id: true,
        user_name: true,
        user_address: true,
        phone_number: true,
      },
    });

    return res.json({ success: true, data: users });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Server error" });
  }
});

// ✅ 3) READ one user by id
router.get("/:user_id", requireAuth, requireRole("pa"), async (req, res) => {
  try {
    const uid = toInt(req.params.user_id);
    if (uid === null) {
      return res.status(400).json({ success: false, message: "user_id must be an integer" });
    }

    const user = await prisma.user_info.findUnique({
      where: { user_id: uid },
      select: {
        user_id: true,
        user_name: true,
        user_address: true,
        phone_number: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, data: user });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Server error" });
  }
});

// ✅ 4) UPDATE user (EXCEPT password)
router.put("/:user_id", requireAuth, requireRole("pa"), async (req, res) => {
  try {
    const uid = toInt(req.params.user_id);
    if (uid === null) {
      return res.status(400).json({ success: false, message: "user_id must be an integer" });
    }

    const { user_name, user_address, address, phone_number } = req.body;

    const data = {};
    if (user_name !== undefined) data.user_name = String(user_name);
    if (user_address !== undefined) data.user_address = String(user_address);
    if (address !== undefined) data.user_address = String(address);
    if (phone_number !== undefined) data.phone_number = String(phone_number);

    // ✅ strictly block password change here
    if ("password" in req.body) {
      return res.status(400).json({
        success: false,
        message: "Password cannot be updated from this API. Use separate change-password API.",
      });
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update: user_name, user_address/address, phone_number",
      });
    }

    const updated = await prisma.user_info.update({
      where: { user_id: uid },
      data,
      select: {
        user_id: true,
        user_name: true,
        user_address: true,
        phone_number: true,
      },
    });

    return res.json({ success: true, message: "User updated", data: updated });
  } catch (e) {
    if (e?.code === "P2025") {
      return res.status(404).json({ success: false, message: "User not found" });
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

// ✅ 5) DELETE user
router.delete("/:user_id", requireAuth, requireRole("pa"), async (req, res) => {
  try {
    const uid = toInt(req.params.user_id);
    if (uid === null) {
      return res.status(400).json({ success: false, message: "user_id must be an integer" });
    }

    await prisma.user_info.delete({
      where: { user_id: uid },
    });

    return res.json({ success: true, message: "User deleted" });
  } catch (e) {
    if (e?.code === "P2025") {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(500).json({ success: false, message: e.message || "Server error" });
  }
});

module.exports = router;