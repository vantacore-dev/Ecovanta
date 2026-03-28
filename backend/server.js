// ✅ IMPORTS
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const app = express();

// ✅ MIDDLEWARE (must come first)
app.use(cors());
app.use(express.json());

// ✅ OPENAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ✅ AI ROUTE
app.post("/ai-insights", async (req, res) => {
  const { environmental, social, governance } = req.body;

  try {
    const prompt = `
You are a senior ESG consultant.

Environmental: ${environmental}/3
Social: ${social}/3
Governance: ${governance}/3

Provide concise, actionable ESG recommendations.
`;

   const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: prompt }]
});

    const insights = response.choices[0].message.content;

    res.json({ insights });

  } catch (error) {
    console.error("AI ERROR:", error);
    res.status(500).json({ error: "AI failed" });
  }
});

// ✅ JSONBIN CONFIG
const BIN_ID = "69c5c73cc3097a1dd5642542";
const API_KEY = "$2a$10$PafMHhMfytGzoyF9pUsO4uwR5XgP5R0B5kN/4EuCsfnkhzd9WmutS";

// ✅ GET REPORTS
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

// ✅ POST REPORT
app.post("/reports", async (req, res) => {
  try {
    const { company, score, environmental, social, governance } = req.body;

    // Get existing reports
    const response = await fetch(
      `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,
      {
        headers: { "X-Master-Key": API_KEY }
      }
    );

    const data = await response.json();
    const reports = data.record.reports || [];

    // Add new report
    const newReport = {
      id: Date.now(),
      company,
      score,
      environmental,
      social,
      governance
    };

    reports.push(newReport);

    // Save updated list
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

// ✅ START SERVER
app.listen(3001, () => {
  console.log("Backend running on port 3001");
});