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
    tech: 75,
    energy: 55,
    manufacturing: 65
  };

  const sector = req.params.sector.toLowerCase().trim();

  res.json({
    benchmark: benchmarks[sector] || 60
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

app.post("/ai-insights", async (req, res) => {
  try {
    const { environmental, social, governance } = req.body;

    // SIMPLE SMART LOGIC (works without OpenAI key)
    let insights = "";

    if (environmental === 1) {
      insights += "Environmental risk is high. Improve emissions reduction and energy efficiency.\n";
    } else if (environmental === 2) {
      insights += "Environmental performance is moderate. Consider renewable energy adoption.\n";
    } else {
      insights += "Environmental practices are strong. Maintain leadership in sustainability.\n";
    }

    if (social === 1) {
      insights += "Social risk is high. Improve labor conditions and diversity policies.\n";
    } else if (social === 2) {
      insights += "Social performance is moderate. Strengthen employee engagement.\n";
    } else {
      insights += "Social practices are strong. Continue investing in workforce wellbeing.\n";
    }

    if (governance === 1) {
      insights += "Governance risk is high. Improve compliance and transparency.\n";
    } else if (governance === 2) {
      insights += "Governance is moderate. Strengthen internal controls.\n";
    } else {
      insights += "Governance is strong. Maintain high accountability standards.\n";
    }

    res.json({ insights });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI failed" });
  }
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