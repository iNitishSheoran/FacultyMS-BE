const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },
    attachmentUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    hodStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    deanStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    notificationShown: {
      type: Boolean,
      default: true, // true → nothing to notify yet
    },

    hodApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deanApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    hodApprovedAt: Date,
    deanApprovedAt: Date,

  },
  { timestamps: true }
);

module.exports = mongoose.model("Leave", leaveSchema);
