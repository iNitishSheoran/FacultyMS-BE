const express = require("express");
const facultyRouter = express.Router();
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth.js");
const {isAdmin} = require("../middlewares/isAdmin.js")

// ✅ GET all faculty (with optional filters)
facultyRouter.get("/faculties", userAuth, async (req, res) => {
  try {
    const { department, gender, subject } = req.query;
    const filters = {};

    if (department) filters.department = department.toLowerCase();
    if (gender) filters.gender = gender.toLowerCase();
    if (subject) filters.subjects = { $in: [subject.toLowerCase()] };

    const faculties = await User.find(filters)
      .select("-password -__v")
      .sort({ fullName: 1 });

    if (!faculties || faculties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No faculties found",
      });
    }

    res.status(200).json({
      success: true,
      count: faculties.length,
      faculties,
    });
  } catch (error) {
    console.error("❌ Error fetching faculties:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch faculty list",
    });
  }
});

// ✅ DELETE faculty by ID (admin only)
facultyRouter.delete("/faculty/:id", userAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedFaculty = await User.findByIdAndDelete(id);

    if (!deletedFaculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Faculty deleted successfully.",
      deletedFaculty: {
        id: deletedFaculty._id,
        fullName: deletedFaculty.fullName,
        email: deletedFaculty.email,
      },
    });
  } catch (error) {
    console.error("❌ Error deleting faculty:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete faculty.",
    });
  }
});

module.exports = facultyRouter;
