const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// =======================
// Middleware
// =======================
app.use(cors());
app.use(express.json());

// =======================
// Routes
// =======================
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const aiRoutes = require("./routes/aiRoutes");

// 👉 Register main routes
app.use("/auth", authRoutes);
app.use("/reports", reportRoutes);
app.use("/ai", aiRoutes);

// =======================
// ✅ Benchmark Route (FIX)
// =======================
app.get("/benchmark/:sector", (req, res) => {
  const { sector } = req.params;

  const benchmarks = {
    tech: 65,
    energy: 58,
    manufacturing: 61
  };

  res.json({
    benchmark: benchmarks[sector] || 60
  });
});

// =======================
// Health Check (optional)
// =======================
app.get("/", (req, res) => {
  res.send("Ecovanta API running");
});

// =======================
// Start Server
// =======================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});