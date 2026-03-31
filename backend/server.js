// ===============================
// IMPORTS
// ===============================
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const OpenAI = require("openai");

// ===============================
// INIT
// ===============================
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = "secret123";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.send("Ecovanta backend running 🚀");
});

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
// AI INSIGHTS (REAL AI)
// ===============================
app.post("/ai-insights", async (req, res) => {
  try {
    const { environmental, social, governance } = req.body;

const prompt = `
You are a senior ESG consultant advising companies.

Context:
- Environmental score: ${environmental} (1=High Risk, 3=Best Practice)
- Social score: ${social}
- Governance score: ${governance}

Industry benchmark: ${req.body.benchmark || "unknown"}

Your task:

1. Assess overall ESG risk level (High / Moderate / Low)
2. Compare performance vs benchmark (above / below / aligned)
3. Identify key weaknesses
4. Provide PRIORITY ACTIONS (most important first)
5. Provide TIMELINE:
   - Short-term (0–6 months)
   - Medium-term (6–18 months)

Output format:

- Risk Level:
- Benchmark Position:
- Key Issues:
- Priority Actions:
- Short-term Actions:
- Medium-term Actions:

Write in a professional consulting tone.
Be concise but insightful.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    const insights = response.choices[0].message.content;

    res.json({ insights });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI generation failed" });
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