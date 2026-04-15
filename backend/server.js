const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// ROUTES
app.use("/auth", authRoutes);
app.use("/reports", reportRoutes);

// HEALTH
app.get("/", (req, res) => {
  res.send("Ecovanta modular backend running");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("Server running"));