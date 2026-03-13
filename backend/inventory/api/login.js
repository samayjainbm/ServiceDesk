const express = require("express");
const router = express.Router();
require("dotenv").config();
const jwt = require("jsonwebtoken"); // ✅ add this

// Utility: strict 10-digit check
function isValidTenDigitId(id) {
  return /^\d{10}$/.test(String(id));
}

// POST /api/login  ✅ use POST because we need req.body
router.post("/", async (req, res) => {
  try {
    const { id, password } = req.body;

    // 1) required fields
    if (!id || !password) {
      return res.status(400).json({
        success: false,
        message: "id and password are required",
      });
    }

    // 2) id must be exactly 10 digits
    if (!isValidTenDigitId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID must be exactly 10 digits",
      });
    }

    const validId = process.env.LOGIN_ID;
    const validPassword = process.env.LOGIN_PASSWORD;

    if (!validId || !validPassword) {
      return res.status(500).json({
        success: false,
        message: "Server login credentials are not configured",
      });
    }

    // 3) compare with fixed credentials
    if (String(id) !== String(validId) || String(password) !== String(validPassword)) {
      return res.status(401).json({
        success: false,
        message: "Invalid ID or password",
      });
    }

    // ✅ 4) role must be "admin" for your middleware
    const role = "admin";

    // ✅ 5) create token
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET is not configured in .env",
      });
    }

    const token = jwt.sign(
      { userId: String(validId), role },   // ✅ include role
      process.env.JWT_SECRET,
      { expiresIn: "1h" }                  // you can change
    );

    // ✅ 6) success response (token returned)
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token, // ✅ return token
      user: {
        id: String(validId),
        role, // ✅ admin
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
