const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const aiRoutes = require("./routes/aiRoutes");
const billingRoutes = require("./routes/billingRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const app = express();

// =======================
// Middleware
// =======================
app.use(cors());

// Stripe webhook first if you use raw body there
app.use("/webhooks", webhookRoutes);

// JSON parser after webhook route
app.use(express.json());

// =======================
// Routes
// =======================
app.use("/auth", authRoutes);
app.use("/reports", reportRoutes);
app.use("/ai", aiRoutes);
app.use("/billing", billingRoutes);

// Benchmark route
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

// Health check
app.get("/", (req, res) => {
  res.send("Ecovanta API running");
});

// =======================
// MongoDB Connection + Start Server
// =======================
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in environment variables");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();