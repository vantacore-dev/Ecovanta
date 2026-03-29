app.get("/test", (req, res) => {
  res.send("TEST OK");
});

// ===============================
// IMPORTS
// ===============================
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

// ⚠️ Node 18+ already has fetch built-in
// DO NOT install node-fetch

const app = express();

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// CONFIG
// ===============================
const PORT = process.env.PORT || 3001;
const JWT_SECRET = "secret123";

// JSONBIN (your existing)
const BIN_ID = "69c5c73cc3097a1dd5642542";
const API_KEY = "$2a$10$PafMHhMfytGzoyF9pUsO4uwR5XgP5R0B5kN/4EuCsfnkhzd9WmutS";

// ===============================
// AUTH ROUTES
// ===============================

// LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === "demo@test.com" && password === "1234") {
    const token = jwt.sign(
      { email, role: "admin" }, // change role if needed
      JWT_SECRET
    );

    return res.json({ token });
  }

  res.status(401).json({ error: "Invalid credentials" });
});

// GET CURRENT USER
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
// AI INSIGHTS (SAFE MOCK VERSION)
// ===============================

app.post("/ai-insights", async (req, res) => {
  try {
    const { environmental, social, governance } = req.body;

    // ✅ fallback (no OpenAI dependency issues)
    const insights = `
Environmental score is ${environmental}/3: improve emissions and resource efficiency.
Social score is ${social}/3: strengthen employee policies and diversity.
Governance score is ${governance}/3: enhance compliance and transparency.
`;

    res.json({ insights });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI failed" });
  }
});

// ===============================
// BENCHMARK
// ===============================
app.get("/benchmark/:sector", (req, res) => {
  const benchmarks = {
    Tech: 75,
    Energy: 55,
    Manufacturing: 65
  };

  const sector = req.params.sector;

  res.json({
    benchmark: benchmarks[sector] || 60
  });
});

// ===============================
// EXTERNAL ESG (MOCK)
// ===============================
app.get("/external-esg/:company", (req, res) => {
  const { company } = req.params;

  res.json({
    company,
    externalScore: Math.floor(Math.random() * 100),
    source: "Mock ESG API"
  });
});

// ===============================
// REPORTS - GET
// ===============================
app.get("/reports", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,
      {
        headers: { "X-Master-Key": API_KEY }
      }
    );

    const data = await response.json();
    res.json(data.record.reports || []);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "GET failed" });
  }
});

// ===============================
// REPORTS - POST
// ===============================
app.post("/reports", async (req, res) => {
  try {
    const { company, score, environmental, social, governance } = req.body;

    // Get existing
    const response = await fetch(
      `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,
      {
        headers: { "X-Master-Key": API_KEY }
      }
    );

    const data = await response.json();
    const reports = data.record.reports || [];

    const newReport = {
      id: Date.now(),
      company,
      score,
      environmental,
      social,
      governance
    };

    reports.push(newReport);

    // Save updated
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY
      },
      body: JSON.stringify({ reports })
    });

    res.json(reports);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "POST failed" });
  }
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});