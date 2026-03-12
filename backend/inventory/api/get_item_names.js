// backend/inventory/api/get_item_names.js

const express = require("express");
const router = express.Router();

const prisma = require("../../config/db");
const { requireAuth, requireRole } = require("../middlewares/auth");

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const items = await prisma.items.findMany({
      orderBy: {
        item_name: "asc",
      },
      select: {
        item_name: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: items,
      message: "Item names fetched successfully",
    });
  } catch (error) {
    console.error("get_item_names error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch item names",
    });
  }
});

module.exports = router;