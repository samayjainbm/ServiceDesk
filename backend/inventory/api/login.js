const express = require("express");
const router = express.Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");

function isValidTenDigitId(id) {
  return /^\d{10}$/.test(String(id));
}

router.post("/", async (req, res) => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).json({
        success: false,
        message: "id and password are required",
      });
    }

    if (!isValidTenDigitId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID must be exactly 10 digits",
      });
    }

    const validId = process.env.LOGIN_ID;
    const validPassword = process.env.LOGIN_PASSWORD;
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!validId || !validPassword || !JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server login credentials are not configured",
      });
    }

    if (String(id) !== String(validId) || String(password) !== String(validPassword)) {
      return res.status(401).json({
        success: false,
        message: "Invalid ID or password",
      });
    }

    const role = "admin";

    const token = jwt.sign(
      { userId: String(validId), role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: String(validId),
        role,
      },
    });
  } catch (error) {
    console.error("Inventory login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;