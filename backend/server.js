// ===============================
// IMPORTS
// ===============================
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

// ===============================
// INIT
// ===============================
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = "secret123";

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// HEALTH CHECK
// ===============================
app.get("/test", (req, res) => {
  res.send("TEST OK");
});

// ===============================
// BENCHMARK
// ===============================
app.get("/benchmark/:sector", (req, res) => {
  const benchmarks = {
    Technology: 75,
    Energy: 55,
    Manufacturing: 65
  };

  res.json({
    benchmark: benchmarks[req.params.sector] || 60
  });
});

// ===============================
// AUTH - LOGIN
// ===============================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // demo user
  if (email === "demo@test.com" && password === "1234") {
    const token = jwt.sign(
      { email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({ token });
  }

  res.status(401).json({ error: "Invalid credentials" });
});

// ===============================
// AUTH - CURRENT USER
// ===============================
app.get("/me", (req, res) => {
  const token = req.headers.authorization;

  try {
    const user = jwt.verify(token, JWT_SECRET);
    res.json(user);
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// ===============================
// EXTERNAL ESG (MOCK)
// ===============================
app.get("/external-esg/:company", (req, res) => {
  res.json({
    company: req.params.company,
    externalScore: Math.floor(Math.random() * 100),
    source: "Mock ESG API"
  });
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});