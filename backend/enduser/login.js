const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

router.post("/", loginLimiter, async (req, res) => {
  try {
    const { id, password, captchaAnswer } = req.body;

    if (!id || !password) {
      return res.status(400).json({
        success: false,
        message: "id and password required",
      });
    }

    if (!captchaAnswer) {
      return res.status(400).json({
        success: false,
        requireCaptcha: true,
        message: "Captcha required",
      });
    }

    // Temporary captcha check
    // Abhi user ko hamesha 7 type karna hoga
    if (String(captchaAnswer).trim() !== "7") {
      return res.status(403).json({
        success: false,
        requireCaptcha: true,
        message: "Invalid captcha",
      });
    }

    const userId = parseInt(id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "id must be a number",
      });
    }

    const user = await prisma.user_info.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid id or password",
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({
        success: false,
        message: "Invalid id or password",
      });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role || "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        phone_number: user.phone_number,
        user_address: user.user_address,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;