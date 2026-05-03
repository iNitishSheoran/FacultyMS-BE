require("dotenv").config();

const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role === "hod" || req.user.role === "dean") {
      return next();
    }

    return res.status(403).json({ message: "Access Denied" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = { isAdmin };