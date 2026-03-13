const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
  try {
    const { worker_id, password } = req.body;

    if (worker_id === undefined || worker_id === null || !password) {
      return res.status(400).json({
        success: false,
        message: "worker_id and password are required",
      });
    }

    const wid = Number(worker_id);
    if (!Number.isInteger(wid)) {
      return res.status(400).json({
        success: false,
        message: "worker_id must be an integer",
      });
    }

    const worker = await prisma.worker_info.findUnique({
      where: { worker_id: wid },
      select: {
        worker_id: true,
        name: true,
        worker_phone_number: true,
        designation: true,
      },
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker with this worker_id does not exist",
      });
    }

    const creds = await prisma.worker_credentials.findUnique({
      where: { worker_id: wid },
      select: { worker_password: true },
    });

    if (!creds) {
      return res.status(404).json({
        success: false,
        message: "Credentials not set for this worker_id",
      });
    }

    const ok = await bcrypt.compare(String(password), creds.worker_password);
    if (!ok) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET not configured",
      });
    }

    const token = jwt.sign(
      {
        userId: wid,
        role: "worker",
        designation: worker.designation,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        worker_id: worker.worker_id,
        name: worker.name,
        worker_phone_number: worker.worker_phone_number,
        designation: worker.designation,
        role: "worker",
      },
    });
  } catch (error) {
    console.error("Error in /api/login_worker:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV !== "production" ? String(error) : undefined,
    });
  }
});

module.exports = router;