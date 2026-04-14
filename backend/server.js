const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// =======================
// ENV
// =======================
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// =======================
// MODEL
// =======================
const Report = mongoose.model(
  "Report",
  new mongoose.Schema(
    {
      userId: String,
      company: String,
      sector: String,
      environmental: Number,
      social: Number,
      governance: Number,
      score: Number,
      benchmark: Number,
      aiInsights: String
    },
    { timestamps: true }
  )
);

// =======================
// HELPERS
// =======================
const calculateScore = (e, s, g) =>
  Math.round((e / 3) * 40 + (s / 3) * 30 + (g / 3) * 30);

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// =======================
// HEALTH
// =======================
app.get("/", (req, res) => res.send("Ecovanta v2 running"));

// =======================
// LOGIN
// =======================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === "demo@test.com" && password === "1234") {
    const token = jwt.sign({ userId: "demo" }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token });
  }

  res.status(401).json({ error: "Invalid" });
});

// =======================
// BENCHMARK
// =======================
app.get("/benchmark/:sector", (req, res) => {
  const map = {
    tech: 75,
    energy: 55,
    manufacturing: 65
  };

  res.json({ benchmark: map[req.params.sector] || 60 });
});

// =======================
// AI
// =======================
app.post("/ai-insights", async (req, res) => {
  try {
    const { environmental, social, governance, benchmark } = req.body;

    const score = calculateScore(environmental, social, governance);

    const prompt = `
Company score: ${score}
Benchmark: ${benchmark}

Provide:
- Risk level
- Benchmark comparison
- Key issues
- Priority actions
- Short-term actions
- Medium-term actions
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });

    res.json({
      insights: response.choices[0].message.content
    });
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ insights: "AI unavailable" });
  }
});

// =======================
// REPORTS
// =======================
app.post("/reports", auth, async (req, res) => {
  try {
    const r = await Report.create({
      ...req.body,
      userId: req.user.userId
    });
    res.json(r);
  } catch (err) {
    console.error("Create report error:", err);
    res.status(500).json({ error: "Failed to save report" });
  }
});

app.get("/reports", auth, async (req, res) => {
  try {
    const data = await Report.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.error("Get reports error:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// =======================
// ANALYTICS
// =======================
app.get("/analytics/overview", auth, async (req, res) => {
  try {
    const data = await Report.find({ userId: req.user.userId });

    const avg = data.length
      ? Math.round(data.reduce((a, r) => a + r.score, 0) / data.length)
      : 0;

    res.json({
      total: data.length,
      average: avg,
      high: data.filter((r) => r.score < 60).length,
      low: data.filter((r) => r.score >= 80).length
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});

// =======================
// START SERVER
// =======================
async function startServer() {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined");
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Startup error:", err.message);
    process.exit(1);
  }
}

startServer();