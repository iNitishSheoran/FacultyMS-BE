const express = require("express");
const connectDB = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");
require("dotenv").config();

app.use(
  require("cors")({
    origin: [
      "http://localhost:5173", // dev frontend (vite)
      "https://www.khetmitra.live"
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// routes
const authRouter = require("./routes/authRouter");
app.use("/", authRouter);

const facultyRouter = require("./routes/facultyRouter");
app.use("/", facultyRouter);

const departmentRouter = require("./routes/departmentRouter");
app.use("/", departmentRouter);

const leaveTypeRouter = require("./routes/leaveTypeRouter");
app.use("/", leaveTypeRouter);


const PORT = process.env.PORT || 2713;
connectDB()
  .then(() => {
    console.log("Database connected");
    app.listen(PORT, "0.0.0.0", () =>
      console.log(`Server listening on ${PORT}`)
    );
  })
  .catch((err) => console.error("DB connection failed:", err));
