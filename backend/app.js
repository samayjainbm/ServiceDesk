const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors({
  origin: "*",
}));

// Inventory
app.use("/api/login_inventory", require("./inventory/api/login"));
app.use("/api/booked_ids", require("./inventory/api/booked_ids"));
app.use("/api/booked_details", require("./inventory/api/booked_details"));
app.use("/api/show_worker_to_assign", require("./inventory/api/show_worker_to_assign"));
app.use("/api/assign_worker", require("./inventory/api/assign_worker"));
app.use("/api/assigned_ids", require("./inventory/api/assigned_ids"));
app.use("/api/assigned_details", require("./inventory/api/assigned_details"));
app.use("/api/toggle_complaint_status", require("./inventory/api/toggle_complaint_status"));
app.use("/api/demand_ids", require("./inventory/api/demand_ids"));
app.use("/api/demand_details", require("./inventory/api/demand_details"));
app.use("/api/materialGiven", require("./inventory/api/materialGiven"));
app.use("/api/reject_demand_request", require("./inventory/api/reject_Demand"));
app.use("/api/item_display", require("./inventory/api/item_display"));
app.use("/api/debt", require("./inventory/api/debt"));
app.use("/api/returned", require("./inventory/api/returned_woker_debt"));
app.use("/api/returned/bulk", require("./inventory/api/returned_bulk"));
app.use("/api/add_items", require("./inventory/api/add_items"));
app.use("/api/inventory/add_new_item", require("./inventory/api/add_new_items"));
app.use("/api/get_item_names", require("./inventory/api/get_item_names"));
app.use("/api/demandstock", require("./inventory/api/demandstock"));
app.use("/api/get_demandstock", require("./pa/get_demandstock"));

// Worker
app.use("/api/login_worker", require("./worker/login"));
app.use("/api/show_complaint", require("./worker/show_complaint"));
app.use("/api/complaint_detail", require("./worker/complaint_detail"));
app.use("/api/worker/show_items", require("./worker/itemdisp"));
app.use("/api/material_req", require("./worker/material_req"));
app.use("/api/worker/debt", require("./worker/debt"));

// User
app.use("/api/login_user", require("./user/login"));
app.use("/api/complaint_krdi", require("./user/complaint_krdi"));
app.use("/api/show_complaint_id", require("./user/show_complaint_id"));
app.use("/api/show_complaint_detail", require("./user/show_complaint_detail"));
app.use("/api/resolved", require("./user/resolved"));
app.use("/api/complaints/used-items/", require("./user/getUsedItems"));

// PA
app.use("/api/login_pa", require("./pa/login"));
app.use("/api/pa/workers", require("./pa/worker_info_change"));
app.use("/api/pa/worker-credentials", require("./pa/worker_credentials_change"));
app.use("/api/pa/users", require("./pa/user_info_change"));
app.use("/api/pa/users", require("./pa/user_password_change"));

// Google Auth
app.use("/api/auth/google-auth", require("./google_auth/google_auth"));

// Misc
app.use("/api/db-check", require("./routes/db-check"));
app.use("/api/run-seed", require("./routes/run_seed"));

app.get("/", (req, res) => {
  res.send("ServiceDesk backend is running");
});

module.exports = app;