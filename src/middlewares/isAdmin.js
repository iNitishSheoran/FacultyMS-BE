require("dotenv").config();

const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { email } = req.user;

    if (
      email === process.env.HOD_EMAIL ||
      email === process.env.DEAN_EMAIL
    ) {
      return next();
    }

    return res.status(403).json({ message: "Access Denied" });

  } catch (error) {
    console.error("❌ isAdmin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { isAdmin };