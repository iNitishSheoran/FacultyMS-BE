const express = require("express");
const departmentRouter = express.Router();
const Department = require("../models/department");
const User = require("../models/user");
const { userAuth} = require("../middlewares/auth.js");
const {isAdmin} = require("../middlewares/isAdmin.js");

// GET all departments (everyone can access)
departmentRouter.get("/departments", async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });

    // Add employee count dynamically
    const departmentsWithEmployees = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await User.countDocuments({ department: dept.code.toLowerCase() });
        return {
          _id: dept._id,
          name: dept.name,
          code: dept.code,
          employees: employeeCount,
          createdAt: dept.createdAt,
        };
      })
    );

    res.status(200).json({ success: true, departments: departmentsWithEmployees });
  } catch (err) {
    console.error("❌ Fetch departments error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch departments" });
  }
});

// ADD department (admin only)
departmentRouter.post("/departments", userAuth, isAdmin, async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: "Name & code required" });

    const existing = await Department.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(409).json({ success: false, message: "Department code already exists" });

    const dept = new Department({ name, code: code.toUpperCase() });
    await dept.save();

    res.status(201).json({ success: true, department: dept });
  } catch (err) {
    console.error("❌ Add department error:", err);
    res.status(500).json({ success: false, message: "Failed to add department" });
  }
});

// EDIT department (admin only)
departmentRouter.put("/departments/:id", userAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    const dept = await Department.findById(id);
    if (!dept) return res.status(404).json({ success: false, message: "Department not found" });

    if (name) dept.name = name;
    if (code) dept.code = code.toUpperCase();

    await dept.save();
    res.json({ success: true, department: dept });
  } catch (err) {
    console.error("❌ Edit department error:", err);
    res.status(500).json({ success: false, message: "Failed to edit department" });
  }
});

// DELETE department (admin only)
departmentRouter.delete("/departments/:id", userAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await Department.findByIdAndDelete(id);
    if (!dept) return res.status(404).json({ success: false, message: "Department not found" });

    res.json({ success: true, message: "Department deleted", department: dept });
  } catch (err) {
    console.error("❌ Delete department error:", err);
    res.status(500).json({ success: false, message: "Failed to delete department" });
  }
});

module.exports = departmentRouter;
