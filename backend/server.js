const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = "secret123";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
let report = [];

app.post("/reports", (req, res) => {
  const report = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date()
  };

  reports.push(report);
  res.json(report);
});


app.get("/reports", (req, res) => {
  res.json(reports);
});


app.use(cors());
app.use(express.json());

// ===============================
// HEALTH
// ===============================
app.get("/", (req, res) => {
  res.send("Ecovanta backend running");
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

  const sector = (req.params.sector || "").toLowerCase().trim();

  res.json({
    benchmark: benchmarks[sector] || 60
  });
});

// ===============================
// AUTH
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

app.get("/me", (req, res) => {
  const token = req.headers.authorization;

  try {
    const user = jwt.verify(token, JWT_SECRET);
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// ===============================
// AI INSIGHTS
// ===============================
app.post("/ai-insights", async (req, res) => {
  try {
    const { environmental, social, governance, benchmark } = req.body;

    console.log("AI BODY:", req.body);
    console.log("Benchmark received:", benchmark);

    const score = Math.round(
      (Number(environmental) / 3) * 40 +
      (Number(social) / 3) * 30 +
      (Number(governance) / 3) * 30
    );

    const safeBenchmark =
      benchmark !== undefined && benchmark !== null ? Number(benchmark) : 60;

    const prompt = `
You are a senior ESG consultant.

Company ESG Score: ${score}
Industry Benchmark: ${safeBenchmark}

Environmental score: ${environmental} (1 = High Risk, 3 = Best Practice)
Social score: ${social} (1 = High Risk, 3 = Best Practice)
Governance score: ${governance} (1 = High Risk, 3 = Best Practice)

Tasks:
1. Determine the overall ESG risk level:
   - High Risk if score < 60
   - Moderate Risk if score is 60–79
   - Low Risk if score >= 80

2. Benchmark comparison:
   Clearly state whether the company score (${score}) is ABOVE, BELOW, or IN LINE with the benchmark (${safeBenchmark}).

3. Identify key weaknesses.

4. Provide priority actions, ranked from most important to least important.

5. Provide a timeline:
   - Short-term actions (0–6 months)
   - Medium-term actions (6–18 months)

Output STRICTLY in this format:

Risk Level:
Benchmark Position:
Key Issues:
Priority Actions:
Short-term Actions:
Medium-term Actions:

Write in a professional consulting tone.
Use concise bullet points where helpful.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    const insights = response?.choices?.[0]?.message?.content;

    if (!insights) {
      return res.json({
        insights: "AI returned no content. Please try again."
      });
    }

    res.json({ insights });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({
      error: "AI generation failed",
      insights:
        "AI is temporarily unavailable. Please check backend logs and OPENAI_API_KEY."
    });
  }
});

// ===============================
// EXTERNAL ESG MOCK
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
  console.log(`Server running on port ${PORT}`);
 
});

