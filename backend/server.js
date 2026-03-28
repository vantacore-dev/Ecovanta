const express = require("express");
const cors = require("cors");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ AI ROUTE (NO OPENAI SDK → STABLE)
app.post("/ai-insights", async (req, res) => {
  try {
    const { environmental, social, governance } = req.body;

    const prompt = `
You are a senior ESG consultant.

Environmental: ${environmental}/3
Social: ${social}/3
Governance: ${governance}/3

Provide concise, actionable ESG recommendations.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    const insights =
      data.choices?.[0]?.message?.content || "No AI insights available";

    res.json({ insights });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI failed" });
  }
});

// ✅ JSONBIN CONFIG
const BIN_ID = "69c5c73cc3097a1dd5642542";
const API_KEY = "$2a$10$PafMHhMfytGzoyF9pUsO4uwR5R0B5kN/4EuCsfnkhzd9WmutS";

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
    res.json(data.record?.reports || []);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "GET failed" });
  }
});

// ✅ POST REPORT
app.post("/reports", async (req, res) => {
  try {
    const { company, score, environmental, social, governance } = req.body;

    const response = await fetch(
      `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,
      {
        headers: { "X-Master-Key": API_KEY }
      }
    );

    const data = await response.json();
    const reports = data.record?.reports || [];

    const newReport = {
      id: Date.now(),
      company,
      score,
      environmental,
      social,
      governance
    };

    reports.push(newReport);

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