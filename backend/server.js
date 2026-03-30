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

    // OPENAI ROUTE
    const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/ai-insights", async (req, res) => {
  try {
    const { environmental, social, governance } = req.body;

    const prompt = `
You are an ESG consultant.

Provide professional ESG recommendations based on:

Environmental score: ${environmental} (1=High Risk, 3=Best Practice)
Social score: ${social}
Governance score: ${governance}

Write:
- Clear recommendations
- Business tone
- Actionable insights
- 5-8 bullet points
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    const insights = response.choices[0].message.content;

    res.json({ insights });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI failed" });
  }
});