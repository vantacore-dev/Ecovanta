const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const auditRoutes = require("./routes/auditRoutes");
const aiRoutes = require("./routes/aiRoutes");
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const billingRoutes = require("./routes/billingRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const app = express();

app.use(cors());
app.use("/audit", auditRoutes);
// Stripe webhook FIRST (before JSON parsing)
app.use("/webhooks", webhookRoutes);

// Then JSON parsing
app.use(express.json());

// DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// ROUTES
app.use("/auth", authRoutes);
app.use("/reports", reportRoutes);
app.use("/billing", billingRoutes);
app.use("/ai", aiRoutes); // ✅ FIXED

// HEALTH
app.get("/", (req, res) => {
  res.send("Ecovanta modular backend running");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));