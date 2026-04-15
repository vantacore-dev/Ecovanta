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
Generate a CSRD/ESRS-ready ESG report draft in JSON format.

Company: ${companyName}
Sector: ${sector}

Return ONLY JSON with:
{
  "executiveSummary": "...",
  "disclosureDraft": "...",
  "dataGaps": "..."
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const raw = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(raw);

    res.json({
      executiveSummary: parsed.executiveSummary || "",
      disclosureDraft: parsed.disclosureDraft || "",
      dataGaps: parsed.dataGaps || ""
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