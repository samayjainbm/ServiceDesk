const prisma = require("../config/db");

module.exports = async (req, res) => {
  try {
    const key = req.query.key;

    if (key !== process.env.SEED_SECRET) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 1) Clear old data
    await prisma.DemandStock.deleteMany();
    await prisma.StockPurchased.deleteMany();
    await prisma.demanded_items.deleteMany();
    await prisma.complaint_items.deleteMany();
    await prisma.worker_debt.deleteMany();
    await prisma.alloted_task.deleteMany();
    await prisma.ongoing_complaints.deleteMany();
    await prisma.worker_credentials.deleteMany();
    await prisma.worker_info.deleteMany();
    await prisma.items.deleteMany();
    await prisma.user_info.deleteMany();

    // 2) Seed sample data
    await prisma.user_info.createMany({
      data: [
        {
          user_id: 1,
          user_name: "Rahul Sharma",
          user_address: "Bhopal",
          phone_number: "9876543210",
          password: "test123",
        },
        {
          user_id: 2,
          user_name: "Priya Verma",
          user_address: "Indore",
          phone_number: "9876501234",
          password: "test123",
        },
      ],
    });

    await prisma.items.createMany({
      data: [
        { item_id: 1, item_name: "Pipe", count: 20 },
        { item_id: 2, item_name: "Wire", count: 50 },
        { item_id: 3, item_name: "Bulb", count: 30 },
      ],
    });

    await prisma.worker_info.createMany({
      data: [
        {
          worker_id: 101,
          name: "Amit",
          worker_phone_number: "9000000001",
          designation: "Plumber",
        },
        {
          worker_id: 102,
          name: "Rohit",
          worker_phone_number: "9000000002",
          designation: "Electrician",
        },
      ],
    });

    await prisma.worker_credentials.createMany({
      data: [
        { worker_id: 101, worker_password: "pass101" },
        { worker_id: 102, worker_password: "pass102" },
      ],
    });

    await prisma.ongoing_complaints.createMany({
      data: [
        {
          complaint_id: 1,
          start_date: new Date("2026-03-13"),
          user_id: 1,
          phone_number: "9876543210",
          address: "Bhopal",
          description: "Pipe leakage in bathroom",
          worker_id: 101,
          status: "booked",
        },
        {
          complaint_id: 2,
          start_date: new Date("2026-03-13"),
          user_id: 2,
          phone_number: "9876501234",
          address: "Indore",
          description: "Fan not working",
          worker_id: 102,
          status: "ongoing",
        },
      ],
    });

    await prisma.complaint_items.createMany({
      data: [
        { complaint_id: 1, item_id: 1, count: 2 },
        { complaint_id: 2, item_id: 2, count: 3 },
      ],
    });

    await prisma.alloted_task.createMany({
      data: [
        { worker_id: 101, alloted_task: 1 },
        { worker_id: 102, alloted_task: 1 },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Seed completed successfully",
    });
  } catch (error) {
    console.error("RUN SEED ERROR =", error);
    return res.status(500).json({
      success: false,
      message: "Seed failed",
      error: error.message,
    });
  }
};