const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post("/ai-draft", auth, async (req, res) => {
  try {
    const { companyName, sector } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OpenAI API key not configured"
      });
    }

    const prompt = `
You are an ESG expert.

Generate a CSRD/ESRS-ready ESG report draft.

Company: ${companyName}
Sector: ${sector}

Return STRICT JSON ONLY:
{
  "executiveSummary": "detailed executive summary (min 150 words)",
  "disclosureDraft": "structured ESRS disclosures",
  "dataGaps": "list missing ESG data points"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }]
    });

    const raw = response.choices[0].message.content;

    console.log("AI RAW:", raw); // 👈 IMPORTANT DEBUG

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("JSON parse failed:", raw);
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw
      });
    }

    res.json({
      executiveSummary: parsed.executiveSummary || "No summary generated",
      disclosureDraft: parsed.disclosureDraft || "No disclosure generated",
      dataGaps: parsed.dataGaps || "No gaps identified"
    });

  } catch (err) {
    console.error("AI draft error:", err);
    res.status(500).json({
      error: "AI draft failed",
      details: err.message
    });
  }
});
module.exports = router;