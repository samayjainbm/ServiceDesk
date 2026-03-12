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

/**
 * ✅ CHANGE USER PASSWORD ONLY
 * PUT /api/pa/users/:user_id/password
 * Body: { password: "newPassword" }
 * - user_id is constant (cannot be changed)
 * - stores hashed password only
 */
router.put("/:user_id/password", requireAuth, requireRole("pa"), async (req, res) => {
  try {
    const uid = toInt(req.params.user_id);
    const { password } = req.body;

    if (uid === null) {
      return res.status(400).json({ success: false, message: "user_id must be an integer" });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: "password is required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: "password must be at least 6 characters" });
    }

    const hashed = await bcrypt.hash(String(password), 10);

    const updated = await prisma.user_info.update({
      where: { user_id: uid },
      data: { password: hashed }, // ✅ only password changes
      select: { user_id: true },  // ✅ never return hash
    });

    return res.json({
      success: true,
      message: "Password updated successfully",
      data: updated,
    });
  } catch (e) {
    if (e?.code === "P2025") {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(500).json({ success: false, message: e.message || "Server error" });
  }
});

module.exports = router;