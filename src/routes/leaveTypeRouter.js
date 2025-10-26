const express = require("express");
const leaveTypeRouter = express.Router();
const LeaveType = require("../models/leaveType"); // create this model
const { userAuth } = require("../middlewares/auth");
const { isAdmin } = require("../middlewares/isAdmin");

// GET all leave types (everyone can access)
leaveTypeRouter.get("/leave-types", async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find().sort({ name: 1 });
    res.status(200).json({ success: true, leaveTypes });
  } catch (err) {
    console.error("❌ Fetch leave types error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch leave types" });
  }
});

// ADD leave type (admin only)
leaveTypeRouter.post("/leave-types", userAuth, isAdmin, async (req, res) => {
  try {
    const { name, description, maxDays, requiresAttachment } = req.body;

    if (!name || !maxDays)
      return res.status(400).json({ success: false, message: "Name & maxDays are required" });

    const existing = await LeaveType.findOne({ name });
    if (existing)
      return res.status(409).json({ success: false, message: "Leave type already exists" });

    const leaveType = new LeaveType({
      name,
      description,
      maxDays,
      requiresAttachment: requiresAttachment || false,
    });

    await leaveType.save();
    res.status(201).json({ success: true, leaveType });
  } catch (err) {
    console.error("❌ Add leave type error:", err);
    res.status(500).json({ success: false, message: "Failed to add leave type" });
  }
});

// EDIT leave type (admin only)
leaveTypeRouter.put("/leave-types/:id", userAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, maxDays, requiresAttachment } = req.body;

    const leaveType = await LeaveType.findById(id);
    if (!leaveType)
      return res.status(404).json({ success: false, message: "Leave type not found" });

    if (name) leaveType.name = name;
    if (description) leaveType.description = description;
    if (maxDays) leaveType.maxDays = maxDays;
    if (requiresAttachment !== undefined) leaveType.requiresAttachment = requiresAttachment;

    await leaveType.save();
    res.json({ success: true, leaveType });
  } catch (err) {
    console.error("❌ Edit leave type error:", err);
    res.status(500).json({ success: false, message: "Failed to edit leave type" });
  }
});

// DELETE leave type (admin only)
leaveTypeRouter.delete("/leave-types/:id", userAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const leaveType = await LeaveType.findByIdAndDelete(id);
    if (!leaveType)
      return res.status(404).json({ success: false, message: "Leave type not found" });

    res.json({ success: true, message: "Leave type deleted", leaveType });
  } catch (err) {
    console.error("❌ Delete leave type error:", err);
    res.status(500).json({ success: false, message: "Failed to delete leave type" });
  }
});

module.exports = leaveTypeRouter;
