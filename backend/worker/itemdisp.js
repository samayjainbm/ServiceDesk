const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { requireAuth, requireRole } = require("../inventory/middlewares/auth");

// GET /api/worker/show_items
router.get('/', requireAuth, requireRole("worker"), async (req, res) => {
  try {
    const items = await prisma.items.findMany({
      select: {
        item_name: true,
      },
      orderBy: {
        item_name: 'asc',
      },
    });

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching items.',
    });
  }
});

module.exports = router;