require('dotenv').config();

const adminEmail = process.env.ADMIN_EMAIL;

const isAdmin =  (req, res, next) => {
  if (req.user && req.user.email === adminEmail) {
    return next();
  }
  return res.status(403).send("Access Denied");
};



module.exports = { isAdmin };
