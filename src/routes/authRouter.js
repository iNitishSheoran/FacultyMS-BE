// routes/authRouter.js
const express = require("express");
const authRouter = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const { userAuth } = require("../middlewares/auth.js");
const { validateSignUpData } = require("../utils/validation.js"); // ✅ Import validation
// imports (top pe)
const crypto = require("crypto");
const nodemailer = require("nodemailer");
// Cookie options helper (dev vs prod)
const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "Lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};

authRouter.get("/health-check", (req, res) => {
  res.send("Backend Updated ✅");
});

// SIGNUP
authRouter.post("/signup", async (req, res) => {
  try {
    // ✅ Validate using validateSignUpData
    const { error } = validateSignUpData(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const {
      fullName,
      email,
      phoneNo,
      age,
      gender,
      department,
      subjects,
      password,
      photoUrl,
    } = req.body;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      fullName,
      email,
      phoneNo,
      age,
      gender,
      department,
      subjects,
      password: passwordHash,
      photoUrl,
    });

    const savedUser = await user.save();

    const token = savedUser.getJWT();
    res.cookie("token", token, getCookieOptions());

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: savedUser._id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        phoneNo: savedUser.phoneNo,
        age: savedUser.age,
        gender: savedUser.gender,
        department: savedUser.department,
        subjects: savedUser.subjects,
        photoUrl: savedUser.photoUrl,
      },
    });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(400).json({ success: false, message: err.message || "Error signing up" });
  }
});

// LOGIN
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw new Error("Invalid credentials");

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) throw new Error("Incorrect password");

    // Admin role check: BLOCK if trying to login as admin with non-admin email
    if (role === "admin" && email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized as admin",
      });
    }

    // Only now create JWT and set cookie
    const token = user.getJWT();
    res.cookie("token", token, getCookieOptions());

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNo: user.phoneNo,
        age: user.age,
        gender: user.gender,
        department: user.department,
        subjects: user.subjects,
        photoUrl: user.photoUrl,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(err.status || 400).json({ success: false, message: err.message || "Error logging in" });
  }
});



// GET CURRENT USER (protected)
authRouter.get("/user", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isAdmin = user.email === process.env.ADMIN_EMAIL;

    res.json({
      success: true,
      user,
      isAdmin,
    });
  } catch (err) {
    console.error("❌ Fetch User Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
});

// LOGOUT
authRouter.post("/logout", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "Lax",
    path: "/",
  });

  res.json({ success: true, message: "Logout successful" });
});

// FORGOT PASSWORD
authRouter.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "If email exists, reset link sent" });
    }

    const token = crypto.randomBytes(32).toString("hex");

const hashedToken = crypto
  .createHash("sha256")
  .update(token)
  .digest("hex");

user.resetToken = hashedToken;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Reset Your Password",
      html: `
        <h3>Password Reset</h3>
        <p>Click below link to reset password (valid 15 min)</p>
        <a href="${resetLink}">${resetLink}</a>
      `,
    });

    res.json({ message: "Reset link sent to email" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

authRouter.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
  .createHash("sha256")
  .update(token)
  .digest("hex");

const user = await User.findOne({
  resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = authRouter;
