const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
  },
  { timestamps: true } // automatically adds createdAt
);

const Department = mongoose.model("Department", departmentSchema);
module.exports = Department;
