const express = require("express");
const OpenAI = require("openai");
const auth = require("../middleware/auth");

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const stringifyIfNeeded = (value, fallback = "") => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join("\n- ");
  if (value && typeof value === "object") return JSON.stringify(value, null, 2);
  return fallback;
};

router.post("/ai-draft", auth, async (req, res) => {
  try {
    const companyName = String(req.body?.companyName || "").trim();
    const sector = String(req.body?.sector || "").trim();

    if (!companyName || !sector) {
      return res.status(400).json({
        error: "companyName and sector are required",
        received: {
          companyName,
          sector
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
      materialityTopics = [],
      scorecard = {}
    } = req.body || {};

    const prompt = `
You are an ESG, CSRD, and ESRS reporting specialist.

Generate a practical AI draft for the company below.

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

Scorecard
- Benchmark: ${scorecard.benchmark ?? "Not provided"}
- Overall Score: ${scorecard.overallScore ?? "Not provided"}

Materiality topics:
${JSON.stringify(materialityTopics, null, 2)}

Return STRICT JSON ONLY with exactly these keys:
{
  "executiveSummary": "A practical executive summary of at least 120 words in plain text.",
  "disclosureDraft": "A human-readable CSRD/ESRS-aligned disclosure draft in plain text with section headings for Governance, Strategy, Impacts/Risks/Opportunities, Metrics & Targets, Climate, Workforce, Business Conduct, and Materiality Topics.",
  "dataGaps": "A practical list of missing data or weak evidence in plain text.",
  "recommendations": {
    "shortTerm": "Actions for 0-12 months to improve the ESG/report score.",
    "mediumTerm": "Actions for 1-3 years to improve the ESG/report score.",
    "longTerm": "Actions for 3-5+ years to improve the ESG/report score."
  }
}

Rules:
- Do not return markdown.
- Do not omit keys.
- disclosureDraft must be plain text, not an object or array.
- dataGaps should be plain text, not an array.
- recommendations must be practical and specific.
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

    const executiveSummary = stringifyIfNeeded(
      parsed.executiveSummary,
      "No executive summary generated."
    );

    const disclosureDraft = stringifyIfNeeded(
      parsed.disclosureDraft,
      "No disclosure draft generated."
    );

    const dataGaps = stringifyIfNeeded(
      parsed.dataGaps,
      "No data gaps identified."
    );

    let recommendations = "No recommendations generated.";
    if (typeof parsed.recommendations === "string") {
      recommendations = parsed.recommendations;
    } else if (
      parsed.recommendations &&
      typeof parsed.recommendations === "object"
    ) {
      const shortTerm = stringifyIfNeeded(
        parsed.recommendations.shortTerm,
        "No short-term recommendations."
      );
      const mediumTerm = stringifyIfNeeded(
        parsed.recommendations.mediumTerm,
        "No medium-term recommendations."
      );
      const longTerm = stringifyIfNeeded(
        parsed.recommendations.longTerm,
        "No long-term recommendations."
      );

      recommendations = [
        "Short-term (0-12 months)",
        shortTerm,
        "",
        "Medium-term (1-3 years)",
        mediumTerm,
        "",
        "Long-term (3-5+ years)",
        longTerm
      ].join("\n");
    }

    return res.json({
      executiveSummary,
      disclosureDraft,
      dataGaps,
      recommendations
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