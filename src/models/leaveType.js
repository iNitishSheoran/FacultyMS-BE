// models/leaveType.js
const mongoose = require("mongoose");

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    maxDays: {
      type: Number,
      required: true,
      min: 0,
    },
    requiresAttachment: {
      type: Boolean,
      default: false,
    },
    applications: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

module.exports = mongoose.model("LeaveType", leaveTypeSchema);
