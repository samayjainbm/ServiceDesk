const express = require("express");
const cors = require("cors");
const { join } = require("@prisma/client/runtime/library");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: "*", // Allow all origins (for development only, change in production)
}));

// Inventory
// Login
app.use("/api/login_inventory", require("./inventory/api/login"));
// A) Complaints
// 1) Unassigned Complaints
app.use("/api/booked_ids", require("./inventory/api/booked_ids"));
app.use("/api/booked_details", require("./inventory/api/booked_details"));
// app.use("/api/complaint_not_assigned", require("./inventory/api/complaint_notAssigned"));
app.use("/api/show_worker_to_assign", require("./inventory/api/show_worker_to_assign"));
app.use("/api/assign_worker", require("./inventory/api/assign_worker"));
// 2) Assigned Complaints
app.use("/api/assigned_ids", require("./inventory/api/assigned_ids"));
app.use("/api/assigned_details", require("./inventory/api/assigned_details"));
// app.use("/api/complaint_assigned", require("./inventory/api/complaint_assigned"));
app.use("/api/toggle_complaint_status", require("./inventory/api/toggle_complaint_status"));
// 3) Completed Complaints

// B) Demand Items
app.use("/api/demand_ids", require("./inventory/api/demand_ids"));
app.use("/api/demand_details", require("./inventory/api/demand_details"));
// app.use("/api/demanditems", require("./inventory/api/demandItems"));
app.use("/api/materialGiven", require("./inventory/api/materialGiven"));
// app.use("/api/material_dedia_inventory_ne", require("./inventory/api/material_dedia_inventory_ne"));
app.use ("/api/reject_demand_request" , require('./inventory/api/reject_Demand'))
// C) Inventory Storage
app.use("/api/item_display", require("./inventory/api/item_display"));
app.use("/api/debt", require("./inventory/api/debt"));
// app.use("/api/returned", require("./inventory/api/returned"));
app.use("/api/returned", require("./inventory/api/returned_woker_debt"));
app.use("/api/returned/bulk", require("./inventory/api/returned_bulk"));
app.use("/api/add_items", require("./inventory/api/add_items"));
// in your main app/server file
app.use("/api/inventory/add_new_item", require("./inventory/api/add_new_items"));

// D) Demand Stock APIs
app.use("/api/get_item_names", require("./inventory/api/get_item_names"));
app.use("/api/demandstock", require("./inventory/api/demandstock"));
app.use("/api/get_demandstock", require("./pa/get_demandstock"));

//worker login
app.use("/api/login_worker", require("./worker/login"));
app.use("/api/show_complaint", require("./worker/show_complaint"));
app.use("/api/complaint_detail", require("./worker/complaint_detail"));
app.use("/api/worker/show_items", require("./worker/itemdisp"));
app.use("/api/material_req", require("./worker/material_req"));
 app.use('/api/worker/',require('./worker/debt'));
// user routes
app.use("/api/login_user", require("./enduser/login"));
app.use("/api/complaint_krdi", require("./enduser/complaint_krdi"));
app.use("/api/show_complaint_id", require("./enduser/show_complaint_id"));
app.use("/api/show_complaint_detail", require("./enduser/show_complaint_detail"));
app.use("/api/resolved", require("./enduser/resolved"));
app.use('/api/complaints/used-items/',require('./enduser/getUsedItems'));

// PA routes
app.use("/api/login_pa", require("./pa/login"));
app.use("/api/pa/workers", require("./pa/worker_info_change"));
app.use("/api/pa/worker-credentials", require("./pa/worker_credentials_change"));
app.use("/api/pa/users", require("./pa/user_info_change"));
app.use("/api/pa/users", require("./pa/user_password_change"));
// Google Auth routes
app.use('/api/auth/google-auth',require('./google_auth/google_auth'));

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on 0.0.0.0:3000");
});
