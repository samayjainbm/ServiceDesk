const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const bcrypt = require("bcryptjs");

// helper: convert {a:2,b:0,...} => [{item_id, count}, ...]
function explodeCountsToRows(countsObj, itemIdMap) {
  const rows = [];
  for (const [key, val] of Object.entries(countsObj || {})) {
    const cnt = Number(val || 0);
    if (cnt > 0) {
      const item_id = itemIdMap.get(key);
      if (!item_id) throw new Error(`Item '${key}' not found in items table`);
      rows.push({ item_id, count: cnt });
    }
  }
  return rows;
}

router.get("/", async (req, res) => {
  try {
    const key = req.query.key;

    if (key !== process.env.SEED_SECRET) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 1) Clear old data (dependency-safe order)
    await prisma.DemandStock.deleteMany();
    await prisma.StockPurchased.deleteMany();

    await prisma.demanded_items.deleteMany();
    await prisma.complaint_items.deleteMany();
    await prisma.ongoing_complaints.deleteMany();

    await prisma.alloted_task.deleteMany();
    await prisma.worker_debt.deleteMany();
    await prisma.worker_credentials.deleteMany();
    await prisma.worker_info.deleteMany();

    await prisma.user_info.deleteMany();
    await prisma.items.deleteMany();

    // 2) Seed items
    const itemsSeed = [
      { item_name: "a", count: 10 },
      { item_name: "b", count: 20 },
      { item_name: "c", count: 30 },
      { item_name: "d", count: 40 },
      { item_name: "e", count: 50 },
      { item_name: "f", count: 60 },
      { item_name: "g", count: 70 },
      { item_name: "h", count: 80 },
      { item_name: "i", count: 90 },
      { item_name: "j", count: 100 },
      { item_name: "k", count: 110 },
      { item_name: "l", count: 120 },
      { item_name: "m", count: 130 },
      { item_name: "n", count: 140 },
      { item_name: "o", count: 150 },
      { item_name: "p", count: 160 },
    ];

    await prisma.items.createMany({
      data: itemsSeed,
      skipDuplicates: true,
    });

    const itemsInDb = await prisma.items.findMany({
      select: { item_id: true, item_name: true },
      orderBy: { item_id: "asc" },
    });

    const itemIdMap = new Map(itemsInDb.map((x) => [x.item_name, x.item_id]));

    // 3) worker_info
    await prisma.worker_info.createMany({
      data: [
        { worker_id: 201, name: "Aman", worker_phone_number: "9876500001", designation: "carpenter" },
        { worker_id: 202, name: "Ravi", worker_phone_number: "9876500002", designation: "carpenter" },
        { worker_id: 301, name: "Neeraj", worker_phone_number: "9876500003", designation: "electrician" },
        { worker_id: 302, name: "Sahil", worker_phone_number: "9876500004", designation: "electrician" },
        { worker_id: 401, name: "Imran", worker_phone_number: "9876500005", designation: "plumber" },
        { worker_id: 402, name: "Karan", worker_phone_number: "9876500006", designation: "plumber" },
        { worker_id: 501, name: "Deepak", worker_phone_number: "9876500007", designation: "internet" },
        { worker_id: 502, name: "Punit", worker_phone_number: "9876500008", designation: "internet" },
        { worker_id: 601, name: "Rakesh", worker_phone_number: "9876500009", designation: "helper" },
        { worker_id: 602, name: "Vikas", worker_phone_number: "9876500010", designation: "helper" },
      ],
      skipDuplicates: true,
    });

    // 3.5) worker_credentials (hashed)
    const credentialsData = [
      { worker_id: 201, plain: "Worker@201" },
      { worker_id: 202, plain: "Worker@202" },
      { worker_id: 301, plain: "Worker@301" },
      { worker_id: 302, plain: "Worker@302" },
      { worker_id: 401, plain: "Worker@401" },
      { worker_id: 402, plain: "Worker@402" },
      { worker_id: 501, plain: "Worker@501" },
      { worker_id: 502, plain: "Worker@502" },
      { worker_id: 601, plain: "Worker@601" },
      { worker_id: 602, plain: "Worker@602" },
    ];

    const hashedCredentials = await Promise.all(
      credentialsData.map(async (x) => ({
        worker_id: x.worker_id,
        worker_password: await bcrypt.hash(x.plain, 10),
      }))
    );

    await prisma.worker_credentials.createMany({
      data: hashedCredentials,
      skipDuplicates: true,
    });

    // 4) user_info
    const usersSeedRaw = [
      { user_id: 1, user_name: "User 1", user_address: "Hostel A, Room 101", phone_number: "9000000001" },
      { user_id: 2, user_name: "User 2", user_address: "Hostel B, Room 203", phone_number: "9000000002" },
      { user_id: 3, user_name: "User 3", user_address: "Hostel C, Room 305", phone_number: "9000000003" },
      { user_id: 4, user_name: "User 4", user_address: "Hostel D, Room 110", phone_number: "9000000004" },
      { user_id: 5, user_name: "User 5", user_address: "Hostel E, Room 212", phone_number: "9000000005" },
      { user_id: 6, user_name: "User 6", user_address: "Hostel F, Room 118", phone_number: "9000000006" },
      { user_id: 7, user_name: "User 7", user_address: "Hostel G, Room 404", phone_number: "9000000007" },
      { user_id: 8, user_name: "User 8", user_address: "Hostel H, Room 509", phone_number: "9000000008" },
      { user_id: 9, user_name: "User 9", user_address: "Hostel I, Room 601", phone_number: "9000000009" },
      { user_id: 10, user_name: "User 10", user_address: "Hostel J, Room 707", phone_number: "9000000010" },
      {
        user_id: 11,
        user_name: "Priyansh Mathur",
        user_address: "Bhopal",
        phone_number: "9000000011",
        email: "priyanshmathur1105@gmail.com",
        google_sub: "TEST_GOOGLE_SUB_116987521760557625524",
        avatar: null,
      },{
        user_id: 12,
        user_name: "Samay Jain",
        user_address: "Bhopal",
        phone_number: "9000000012",
        email: "samayjain72258@gmail.com",
        google_sub: "",
        avatar: null,
      },
    ];

    const usersSeed = await Promise.all(
      usersSeedRaw.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(`User@${u.phone_number}`, 10),
      }))
    );

    await prisma.user_info.createMany({
      data: usersSeed,
      skipDuplicates: true,
    });

    // 5) ongoing_complaints
    const complaintsHeader = [
      {
        complaint_id: 1001,
        start_date: new Date("2026-02-01"),
        user_id: 1,
        phone_number: "9000000001",
        address: "Hostel A, Room 101",
        description: "Door latch issue",
        worker_id: null,
        status: "booked",
      },
      {
        complaint_id: 1002,
        start_date: new Date("2026-02-02"),
        user_id: 2,
        phone_number: "9000000002",
        address: "Hostel B, Room 203",
        description: "Switch board issue",
        worker_id: null,
        status: "booked",
      },
      {
        complaint_id: 1003,
        start_date: new Date("2026-02-03"),
        user_id: 3,
        phone_number: "9000000003",
        address: "Hostel C, Room 305",
        description: "Pipe leakage",
        worker_id: null,
        status: "booked",
      },
      {
        complaint_id: 1004,
        start_date: new Date("2026-02-04"),
        user_id: 4,
        phone_number: "9000000004",
        address: "Hostel D, Room 110",
        description: "LAN not working",
        worker_id: null,
        status: "booked",
      },
      {
        complaint_id: 1005,
        start_date: new Date("2026-02-05"),
        user_id: 5,
        phone_number: "9000000005",
        address: "Hostel E, Room 212",
        description: "Window hinge broken",
        worker_id: 202,
        status: "delayed",
      },
      {
        complaint_id: 1006,
        start_date: new Date("2026-02-06"),
        user_id: 6,
        phone_number: "9000000006",
        address: "Hostel F, Room 118",
        description: "MCB tripping",
        worker_id: 302,
        status: "delayed",
      },
      {
        complaint_id: 1007,
        start_date: new Date("2026-02-07"),
        user_id: 7,
        phone_number: "9000000007",
        address: "Hostel G, Room 404",
        description: "Tap replacement",
        worker_id: 402,
        status: "ongoing",
      },
      {
        complaint_id: 1008,
        start_date: new Date("2026-02-08"),
        user_id: 8,
        phone_number: "9000000008",
        address: "Hostel H, Room 509",
        description: "WiFi cable issue",
        worker_id: 502,
        status: "ongoing",
      },
      {
        complaint_id: 1009,
        start_date: new Date("2026-02-09"),
        user_id: 9,
        phone_number: "9000000009",
        address: "Hostel I, Room 601",
        description: "General repair",
        worker_id: null,
        status: "booked",
      },
      {
        complaint_id: 1010,
        start_date: new Date("2026-02-10"),
        user_id: 10,
        phone_number: "9000000010",
        address: "Hostel J, Room 707",
        description: "Inspection",
        worker_id: null,
        status: "booked",
      },
    ];

    await prisma.ongoing_complaints.createMany({
      data: complaintsHeader,
      skipDuplicates: true,
    });

    // 5.1) complaint_items
    const complaintItemCounts = new Map([
      [1005, { b: 2, c: 1, d: 1 }],
      [1006, { f: 1, g: 1, h: 1, i: 1 }],
      [1007, { j: 1, k: 1, l: 1 }],
      [1008, { n: 1, o: 1, p: 1 }],
    ]);

    const complaintItemsRows = [];
    for (const [complaint_id, countsObj] of complaintItemCounts.entries()) {
      const rows = explodeCountsToRows(countsObj, itemIdMap);
      for (const r of rows) {
        complaintItemsRows.push({
          complaint_id,
          item_id: r.item_id,
          count: r.count,
        });
      }
    }

    if (complaintItemsRows.length) {
      await prisma.complaint_items.createMany({
        data: complaintItemsRows,
        skipDuplicates: true,
      });
    }

    // 6) demanded_items
    const demandedOld = [
      { worker_id: 302, complaint_id: 1006, counts: { e: 1, f: 1, g: 1, h: 1 } },
      { worker_id: 402, complaint_id: 1007, counts: { j: 1, k: 1, l: 1 } },
      { worker_id: 502, complaint_id: 1008, counts: { n: 1, o: 1, p: 1 } },
    ];

    const demandedRows = [];
    for (const d of demandedOld) {
      const rows = explodeCountsToRows(d.counts, itemIdMap);
      for (const r of rows) {
        demandedRows.push({
          worker_id: d.worker_id,
          complaint_id: d.complaint_id,
          item_id: r.item_id,
          count: r.count,
        });
      }
    }

    if (demandedRows.length) {
      await prisma.demanded_items.createMany({
        data: demandedRows,
        skipDuplicates: true,
      });
    }

    // 7) worker_debt
    const workerDebtOld = [
      { worker_id: 201, counts: { a: 1, c: 2 } },
      { worker_id: 202, counts: { b: 3, c: 2, d: 2 } },
      { worker_id: 301, counts: { e: 2, f: 1 } },
      { worker_id: 302, counts: { f: 2, g: 2, h: 2, i: 2 } },
      { worker_id: 401, counts: { i: 3, j: 1 } },
      { worker_id: 402, counts: { j: 2, k: 1, l: 2 } },
      { worker_id: 501, counts: { m: 2, n: 1 } },
      { worker_id: 502, counts: { n: 2, o: 1, p: 2 } },
      {
        worker_id: 601,
        counts: {
          a: 1, b: 1, c: 1, d: 1,
          e: 1, f: 1, g: 1, h: 1,
          i: 1, j: 1, k: 1, l: 1,
          m: 1, n: 1, o: 1, p: 1,
        },
      },
      { worker_id: 602, counts: {} },
    ];

    const workerDebtRows = [];
    for (const w of workerDebtOld) {
      const rows = explodeCountsToRows(w.counts, itemIdMap);
      for (const r of rows) {
        workerDebtRows.push({
          worker_id: w.worker_id,
          item_id: r.item_id,
          count: r.count,
        });
      }
    }

    if (workerDebtRows.length) {
      await prisma.worker_debt.createMany({
        data: workerDebtRows,
        skipDuplicates: true,
      });
    }

    // 8) alloted_task
    const assignedComplaints = await prisma.ongoing_complaints.groupBy({
      by: ["worker_id"],
      where: { worker_id: { not: null } },
      _count: { complaint_id: true },
    });

    const allWorkers = await prisma.worker_info.findMany({
      select: { worker_id: true },
      orderBy: { worker_id: "asc" },
    });

    const countMap = new Map(
      assignedComplaints.map((x) => [x.worker_id, x._count.complaint_id])
    );

    const allotData = allWorkers.map((w) => ({
      worker_id: w.worker_id,
      alloted_task: countMap.get(w.worker_id) ?? 0,
    }));

    await prisma.alloted_task.createMany({
      data: allotData,
      skipDuplicates: true,
    });

    // 9) StockPurchased
    const stockPurchasedSeed = [
      { date: new Date("2026-02-15"), item_name: "a", count: 5 },
      { date: new Date("2026-02-15"), item_name: "c", count: 12 },
      { date: new Date("2026-02-20"), item_name: "f", count: 8 },
      { date: new Date("2026-02-22"), item_name: "n", count: 20 },
      { date: new Date("2026-02-25"), item_name: "p", count: 10 },
    ].map((x) => ({
      date: x.date,
      item_id: itemIdMap.get(x.item_name),
      item_name: x.item_name,
      count: x.count,
    }));

    if (stockPurchasedSeed.some((x) => !x.item_id)) {
      throw new Error("StockPurchased seed: invalid item_name mapping");
    }

    await prisma.StockPurchased.createMany({
      data: stockPurchasedSeed,
      skipDuplicates: true,
    });

    // 10) DemandStock
    const demandStockSeed = [
      { date: new Date("2026-03-01"), item_name: "b", count: 15 },
      { date: new Date("2026-03-01"), item_name: "d", count: 6 },
      { date: new Date("2026-03-02"), item_name: "g", count: 10 },
      { date: new Date("2026-03-02"), item_name: "o", count: 9 },
    ].map((x) => ({
      date: x.date,
      item_id: itemIdMap.get(x.item_name),
      item_name: x.item_name,
      count: x.count,
    }));

    if (demandStockSeed.some((x) => !x.item_id)) {
      throw new Error("DemandStock seed: invalid item_name mapping");
    }

    await prisma.DemandStock.createMany({
      data: demandStockSeed,
      skipDuplicates: true,
    });

    return res.status(200).json({
      success: true,
      message: "Seed completed successfully",
      summary: {
        items: itemsInDb.length,
        users: usersSeed.length,
        workers: 10,
        complaints: complaintsHeader.length,
        complaint_items: complaintItemsRows.length,
        demanded_items: demandedRows.length,
        worker_debt: workerDebtRows.length,
        stock_purchased: stockPurchasedSeed.length,
        demand_stock: demandStockSeed.length,
      },
      login_info: {
        user_password_rule: "User@<phone_number>",
        worker_password_rule: "Worker@<worker_id>",
      },
    });
  } catch (error) {
    console.error("RUN SEED ERROR =", error);
    return res.status(500).json({
      success: false,
      message: "Seed failed",
      error: error.message,
    });
  }
});

module.exports = router;