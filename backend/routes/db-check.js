const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

router.get("/", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      success: true,
      message: "DB connected",
    });
  } catch (error) {
    console.error("DB CHECK ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "DB connection failed",
      error: error.message,
    });
  }
});

module.exports = router;