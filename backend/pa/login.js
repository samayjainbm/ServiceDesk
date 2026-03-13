// routes/paLogin.js
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { login_id, password } = req.body;

    if (!login_id || !password) {
      return res.status(400).json({
        success: false,
        message: "login_id and password are required",
      });
    }

    const PA_ID = process.env.LOGIN_PA;
    const PA_PASS = process.env.LOGIN_PA_PASSWORD;
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!PA_ID || !PA_PASS || !JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server config missing: LOGIN_PA / LOGIN_PA_PASSWORD / JWT_SECRET not set",
      });
    }

    if (String(login_id) !== String(PA_ID) || String(password) !== String(PA_PASS)) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // ✅ same JWT shape as middleware expects
    const payload = {
      userId: String(login_id),
      role: "pa",
      login_id: String(login_id),
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "7d",
      issuer: "college_app_api",
    });

    return res.json({
      success: true,
      message: "Login successful",
      token,
      role: "pa",
    });
  } catch (err) {
    console.error("PA login error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;