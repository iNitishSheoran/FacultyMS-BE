const express = require("express");
const facultyRouter = express.Router();
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth.js");
const {isAdmin} = require("../middlewares/isAdmin.js");
const fetch = require("node-fetch"); 

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

// ✅ GET faculty load from external site
facultyRouter.get("/faculty-load", async (req, res) => {
  const { school = "SOICT", dept = "" } = req.query;

  try {
    const url = `https://mygbu.in/schd/load.php?school=${school}&dept=${dept}`;

    // Fetch HTML from external site
    const response = await fetch(url, { timeout: 15000 }); // 15s timeout
    if (!response.ok) {
      return res.status(response.status).send("Failed to fetch external site");
    }

    const html = await response.text();
    res.send(html); // send HTML to frontend
  } catch (err) {
    console.error("❌ Error fetching faculty load:", err);
    res.status(500).send("Failed to fetch faculty load");
  }
});

module.exports = facultyRouter;
