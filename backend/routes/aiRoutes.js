const express = require("express");
const OpenAI = require("openai");
const auth = require("../middleware/auth");

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post("/ai-draft", auth, async (req, res) => {
  try {
    console.log("AI draft req.body:", req.body);

    const companyName = String(req.body?.companyName || "").trim();
    const sector = String(req.body?.sector || "").trim();

    if (!companyName || !sector) {
      return res.status(400).json({
        error: "companyName and sector are required",
        received: {
          companyName,
          sector,
          body: req.body
        }
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured"
      });
    }

    const {
      reportingYear,
      esrs2 = {},
      e1 = {},
      s1 = {},
      g1 = {},
      materialityTopics = []
    } = req.body || {};

    const prompt = `
You are an ESG and CSRD reporting specialist.

Generate an ESRS-aligned draft for the following company.

Company: ${companyName}
Sector: ${sector}
Reporting year: ${reportingYear || new Date().getFullYear()}

ESRS 2
- Governance: ${esrs2.governance || "Not provided"}
- Strategy: ${esrs2.strategy || "Not provided"}
- Impacts, Risks, Opportunities: ${esrs2.impactsRisksOpportunities || "Not provided"}
- Metrics and Targets: ${esrs2.metricsTargets || "Not provided"}

E1 Climate
- Scope 1 emissions: ${e1.scope1Emissions ?? "Not provided"}
- Scope 2 emissions: ${e1.scope2Emissions ?? "Not provided"}
- Scope 3 emissions: ${e1.scope3Emissions ?? "Not provided"}
- Climate policies: ${e1.climatePolicies || "Not provided"}

S1 Workforce
- Workforce policies: ${s1.workforcePolicies || "Not provided"}
- Diversity and inclusion: ${s1.diversityInclusion || "Not provided"}

G1 Business Conduct
- Anti-corruption: ${g1.antiCorruption || "Not provided"}
- Whistleblowing: ${g1.whistleblowing || "Not provided"}

Materiality topics:
${JSON.stringify(materialityTopics, null, 2)}

Return strict JSON with exactly these keys:
{
  "executiveSummary": "A practical executive summary of at least 120 words in plain text.",
  "disclosureDraft": "A human-readable CSRD/ESRS-aligned disclosure draft in plain text with section headings for Governance, Strategy, Impacts/Risks/Opportunities, Metrics & Targets, Climate, Workforce, Business Conduct, and Materiality Topics.",
  "dataGaps": "A practical list of missing data or weak evidence in plain text."
}

Do not return markdown.
Do not omit keys.
disclosureDraft must be plain text, not an object or array.
dataGaps should be plain text, not an array.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a precise ESG reporting assistant. Always return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3
    });

    const raw = response?.choices?.[0]?.message?.content || "{}";
    console.log("AI RAW RESPONSE:", raw);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (parseError) {
      console.error("Failed to parse AI JSON:", parseError);
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw
      });
    }

    const executiveSummary =
      typeof parsed.executiveSummary === "string"
        ? parsed.executiveSummary
        : JSON.stringify(parsed.executiveSummary, null, 2);

    const disclosureDraft =
      typeof parsed.disclosureDraft === "string"
        ? parsed.disclosureDraft
        : JSON.stringify(parsed.disclosureDraft, null, 2);

    const dataGaps =
      typeof parsed.dataGaps === "string"
        ? parsed.dataGaps
        : Array.isArray(parsed.dataGaps)
        ? parsed.dataGaps.join("\n- ")
        : JSON.stringify(parsed.dataGaps, null, 2);

    return res.json({
      executiveSummary: executiveSummary || "No executive summary generated.",
      disclosureDraft: disclosureDraft || "No disclosure draft generated.",
      dataGaps: dataGaps || "No data gaps identified."
    });
  } catch (err) {
    console.error("AI draft error:", err);
    return res.status(500).json({
      error: "AI draft failed",
      details: err.message
    });
  }
});

module.exports = router;