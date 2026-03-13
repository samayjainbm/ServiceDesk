const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

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

const captchaStore = new Map();

function generateCaptchaData() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const captchaId = crypto.randomBytes(16).toString("hex");
  const answer = a + b;

  captchaStore.set(captchaId, {
    answer,
    createdAt: Date.now(),
  });

  return {
    captchaId,
    question: `${a} + ${b} = ?`,
  };
}

function cleanupCaptchas() {
  const now = Date.now();
  const TTL = 5 * 60 * 1000;

  for (const [key, value] of captchaStore.entries()) {
    if (now - value.createdAt > TTL) {
      captchaStore.delete(key);
    }
  }
}

setInterval(cleanupCaptchas, 10 * 60 * 1000);

router.get("/captcha", (req, res) => {
  try {
    const captcha = generateCaptchaData();

    return res.json({
      success: true,
      captchaId: captcha.captchaId,
      question: captcha.question,
    });
  } catch (err) {
    console.error("Captcha generation error:", err);
    return res.status(500).json({
      success: false,
      message: "Could not generate captcha",
    });
  }
});

router.post("/", loginLimiter, async (req, res) => {
  try {
    const { id, password, captchaId, captchaAnswer } = req.body;

    if (!id || !password) {
      return res.status(400).json({
        success: false,
        message: "id and password required",
      });
    }

    if (
      !captchaId ||
      captchaAnswer === undefined ||
      captchaAnswer === null ||
      String(captchaAnswer).trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Captcha required",
      });
    }

    const savedCaptcha = captchaStore.get(captchaId);

    if (!savedCaptcha) {
      return res.status(400).json({
        success: false,
        message: "Captcha expired. Please refresh captcha.",
      });
    }

    const captchaAge = Date.now() - savedCaptcha.createdAt;
    if (captchaAge > 5 * 60 * 1000) {
      captchaStore.delete(captchaId);
      return res.status(400).json({
        success: false,
        message: "Captcha expired. Please refresh captcha.",
      });
    }

    if (Number(captchaAnswer) !== Number(savedCaptcha.answer)) {
      captchaStore.delete(captchaId);
      return res.status(403).json({
        success: false,
        message: "Invalid captcha",
      });
    }

    captchaStore.delete(captchaId);

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

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "Password login not available for this account",
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
        userId: user.user_id,
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
