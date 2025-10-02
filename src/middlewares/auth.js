const jwt = require("jsonwebtoken");
const User = require("../models/user");
require('dotenv').config();

const userAuth = async (req, res, next) => {
  try {
    // Check both cookie and header
    const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).send("Please Login!!");
    }

    const decodedObj = jwt.verify(token, process.env.JWT_SECRET); 

    const { _id } = decodedObj;
    const user = await User.findById(_id);

    if (!user) {
      throw new Error("User not found");
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token. Please log in" });
  }
};

module.exports = { userAuth };
