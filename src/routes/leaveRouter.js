const express = require("express");
const Leave = require("../models/leave");
const LeaveType = require("../models/leaveType");
const { userAuth } = require("../middlewares/auth");
const { isAdmin } = require("../middlewares/isAdmin");
const leaveRouter = express.Router();

// ✅ Apply for leave (Employee)
leaveRouter.post("/leaves/apply", userAuth, async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason, attachmentUrl } = req.body;

    if (!leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const leaveTypeData = await LeaveType.findById(leaveType);
    if (!leaveTypeData)
      return res.status(404).json({ success: false, message: "Invalid leave type" });

    // Calculate total days
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const totalDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

    if (totalDays > leaveTypeData.maxDays) {
      return res.status(400).json({
        success: false,
        message: `You cannot apply more than ${leaveTypeData.maxDays} days for ${leaveTypeData.name}`,
      });
    }

    const newLeave = new Leave({
      user: req.user._id,
      leaveType,
      fromDate: from,
      toDate: to,
      totalDays,
      reason,
      attachmentUrl,
    });

    await newLeave.save();

    // Increment application count
    leaveTypeData.applications += 1;
    await leaveTypeData.save();

    res.status(201).json({ success: true, message: "Leave applied successfully", leave: newLeave });
  } catch (error) {
    console.error("❌ Apply Leave Error:", error);
    res.status(500).json({ success: false, message: "Failed to apply leave" });
  }
});

// ✅ Delete a leave (Admin)
leaveRouter.delete("/leaves/:id", userAuth, isAdmin, async (req, res) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);
    if (!leave)
      return res.status(404).json({ success: false, message: "Leave not found" });

    res.status(200).json({ success: true, message: "Leave deleted successfully" });
  } catch (error) {
    console.error("❌ Delete Leave Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete leave" });
  }
});


// ✅ View my leaves (Employee)
leaveRouter.get("/leaves/my", userAuth, async (req, res) => {
  try {
    const leaves = await Leave.find({ user: req.user._id })
      .populate("leaveType", "name maxDays requiresAttachment")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    console.error("❌ Fetch My Leaves Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch your leaves" });
  }
});

// ✅ View all leaves (Admin)
leaveRouter.get("/leaves", userAuth, isAdmin, async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate("user", "fullName email department")
      .populate("leaveType", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    console.error("❌ Fetch All Leaves Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch all leaves" });
  }
});

// ✅ Leave counts for logged-in faculty
leaveRouter.get("/leaves/my/counts", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const total = await Leave.countDocuments({ user: userId });

    const pending = await Leave.countDocuments({
      user: userId,
      status: "pending"
    });

    const approved = await Leave.countDocuments({
      user: userId,
      status: "approved"
    });

    const rejected = await Leave.countDocuments({
      user: userId,
      status: "rejected"
    });

    res.status(200).json({
      success: true,
      counts: {
        total,
        pending,
        approved,
        rejected
      }
    });

  } catch (error) {
    console.error("❌ Fetch Leave Counts Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch leave counts" });
  }
});


// ✅ Approve / Reject leave (Admin)
leaveRouter.put("/leaves/:id/status", userAuth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave)
      return res.status(404).json({ success: false, message: "Leave not found" });

    leave.status = status;
    leave.notificationShown = false; 
    await leave.save();


    res.status(200).json({ success: true, message: `Leave ${status} successfully`, leave });
  } catch (error) {
    console.error("❌ Update Leave Status Error:", error);
    res.status(500).json({ success: false, message: "Failed to update leave status" });
  }
});

// Mark notification as shown
leaveRouter.put("/leaves/:id/mark-notified", userAuth, async (req, res) => {
  try {
    await Leave.findByIdAndUpdate(req.params.id, { notificationShown: true });
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Mark Notification Error:", error);
    res.status(500).json({ success: false, message: "Failed to mark notification" });
  }
});

// Get pending notifications for the logged-in user
leaveRouter.get("/leaves/notifications/pending", userAuth, async (req, res) => {
  try {
    const notifications = await Leave.find({
      user: req.user._id,
      notificationShown: false,
      status: { $in: ["approved", "rejected"] }
    })
      .populate("leaveType", "name")
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("❌ Fetch Notifications Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
});

// Get remaining leaves for a user for a specific leave type
leaveRouter.get("/leaves/remaining/:typeId", userAuth, async (req, res) => {
  try {
    const leaveTypeId = req.params.typeId;

    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType)
      return res.status(404).json({ success: false, message: "Leave type not found" });

    // Fetch all leaves of this user for this type
    const userLeaves = await Leave.find({
      user: req.user._id,
      leaveType: leaveTypeId,
      status: { $in: ["approved", "pending"] }  // count only applied ones
    });

    // sum days
    const usedDays = userLeaves.reduce((sum, leave) => sum + leave.totalDays, 0);

    const remaining = leaveType.maxDays - usedDays;

    res.json({
      success: true,
      maxDays: leaveType.maxDays,
      usedDays,
      remainingDays: remaining >= 0 ? remaining : 0,
    });

  } catch (err) {
    console.error("Error getting remaining leaves:", err);
    res.status(500).json({ success: false, message: "Failed to fetch remaining leaves" });
  }
});




module.exports = leaveRouter;
