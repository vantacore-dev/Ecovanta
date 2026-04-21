const express = require("express");
const OpenAI = require("openai");
const auth = require("../middleware/auth");

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// -----------------------------
// Helpers
// -----------------------------
function getTimeHorizonScore(timeHorizon) {
  if (timeHorizon === "short") return 5;
  if (timeHorizon === "medium") return 3;
  if (timeHorizon === "long") return 2;
  return 3;
}

function calculateMaterialityScores(topic = {}) {
  const impact = topic?.impactMateriality || {};
  const financial = topic?.financialMateriality || {};

  const impactRaw =
    Number(impact.severity || 0) * 0.3 +
    Number(impact.scale || 0) * 0.2 +
    Number(impact.scope || 0) * 0.2 +
    Number(impact.irremediability || 0) * 0.15 +
    Number(impact.likelihood || 0) * 0.15;

  const financialRaw =
    Number(financial.magnitude || 0) * 0.5 +
    Number(financial.likelihood || 0) * 0.3 +
    getTimeHorizonScore(financial.timeHorizon) * 0.2;

  const impactScore100 = Math.round((impactRaw / 5) * 100);
  const financialScore100 = Math.round((financialRaw / 5) * 100);
  const overallMaterialityScore = Math.max(
    impactScore100,
    financialScore100
  );

  return {
    impactScore100,
    financialScore100,
    overallMaterialityScore,
    isMaterial: overallMaterialityScore >= 60
  };
}

function computeComplianceGaps(payload = {}) {
  const sections = [];

  const esrs2Missing = [];
  if (!payload?.esrs2?.governance?.trim()) {
    esrs2Missing.push("Governance disclosure missing");
  }
  if (!payload?.esrs2?.strategy?.trim()) {
    esrs2Missing.push("Strategy disclosure missing");
  }
  if (!payload?.esrs2?.impactsRisksOpportunities?.trim()) {
    esrs2Missing.push("Impacts, risks and opportunities disclosure missing");
  }
  if (!payload?.esrs2?.metricsTargets?.trim()) {
    esrs2Missing.push("Metrics and targets disclosure missing");
  }
  sections.push({
    section: "ESRS 2",
    missing: esrs2Missing,
    completeness: Math.round(((4 - esrs2Missing.length) / 4) * 100)
  });

  const e1Missing = [];
  if (!payload?.e1?.scope1Emissions) e1Missing.push("Scope 1 emissions missing");
  if (!payload?.e1?.scope2Emissions) e1Missing.push("Scope 2 emissions missing");
  if (!payload?.e1?.scope3Emissions) e1Missing.push("Scope 3 emissions missing");
  if (!payload?.e1?.climatePolicies?.trim()) {
    e1Missing.push("Climate policies missing");
  }
  sections.push({
    section: "E1 Climate",
    missing: e1Missing,
    completeness: Math.round(((4 - e1Missing.length) / 4) * 100)
  });

  const s1Missing = [];
  if (!payload?.s1?.workforcePolicies?.trim()) {
    s1Missing.push("Workforce policies missing");
  }
  if (!payload?.s1?.diversityInclusion?.trim()) {
    s1Missing.push("Diversity and inclusion disclosure missing");
  }
  sections.push({
    section: "S1 Workforce",
    missing: s1Missing,
    completeness: Math.round(((2 - s1Missing.length) / 2) * 100)
  });

  const g1Missing = [];
  if (!payload?.g1?.antiCorruption?.trim()) {
    g1Missing.push("Anti-corruption disclosure missing");
  }
  if (!payload?.g1?.whistleblowing?.trim()) {
    g1Missing.push("Whistleblowing disclosure missing");
  }
  sections.push({
    section: "G1 Business Conduct",
    missing: g1Missing,
    completeness: Math.round(((2 - g1Missing.length) / 2) * 100)
  });

  return sections;
}

function normalizeStakeholders(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function buildEnrichedPayload(body = {}) {
  const materialityTopics = Array.isArray(body.materialityTopics)
    ? body.materialityTopics.map((topic) => {
        const scores = calculateMaterialityScores(topic);
        return {
          topicCode: topic?.topicCode || "",
          topicLabel: topic?.topicLabel || "",
          rationale: topic?.rationale || "",
          stakeholdersConsulted: normalizeStakeholders(
            topic?.stakeholdersConsulted
          ),
          ...scores
        };
      })
    : [];

  const highPriorityTopics = materialityTopics
    .filter((t) => t.overallMaterialityScore >= 60)
    .sort((a, b) => b.overallMaterialityScore - a.overallMaterialityScore);

  return {
    companyName: String(body.companyName || "").trim(),
    sector: String(body.sector || "").trim(),
    reportingYear: body.reportingYear || new Date().getFullYear(),
    esrs2: body.esrs2 || {},
    e1: body.e1 || {},
    s1: body.s1 || {},
    g1: body.g1 || {},
    materialityTopics,
    highPriorityTopics,
    complianceGaps: computeComplianceGaps(body)
  };
}

function stringifyRecommendations(recommendations = []) {
  return recommendations
    .map((item, index) => {
      const actionLines = Array.isArray(item.actions)
        ? item.actions.map((a) => `- ${a}`).join("\n")
        : "- No actions provided";

      const kpiLines =
        Array.isArray(item.suggestedKPIs) && item.suggestedKPIs.length
          ? item.suggestedKPIs.map((k) => `- ${k}`).join("\n")
          : "- No KPI suggested";

      return `${index + 1}. ${item.title}
Category: ${item.category}
Priority: ${item.priority}
Timeline: ${item.timeline}
ESRS Reference: ${item.esrsReference || "General ESRS alignment"}

Current Gap:
${item.currentGap}

Risk / Impact:
${item.riskImpact}

Recommended Actions:
${actionLines}

Suggested KPIs:
${kpiLines}`;
    })
    .join("\n\n");
}

// -----------------------------
// Route
// -----------------------------
router.post("/ai-draft", auth, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is missing"
      });
    }

    // Optional plan gating
    if (
      req.user?.plan &&
      !["pro", "enterprise"].includes(req.user.plan)
    ) {
      return res.status(403).json({
        error: "AI Draft is available on Pro and Enterprise plans only"
      });
    }

    const payload = buildEnrichedPayload(req.body);

    if (!payload.companyName || !payload.sector) {
      return res.status(400).json({
        error: "companyName and sector are required"
      });
    }

    const prompt = `
You are a senior ESG and CSRD advisor from a Big4 consulting firm.

Your job is to generate a premium-quality ESRS advisory output for a company.
Be specific, practical, and audit-aware.

RULES:
1. Recommendations must be concrete, non-generic, and tied to actual input gaps.
2. Prioritize high-materiality topics and missing disclosures.
3. Separate compliance needs from strategic improvement opportunities.
4. Use consultant-grade language, but keep it readable.
5. Do not invent data.
6. Recommendations should be realistic for management teams to execute.
7. Focus on ESRS 2, E1, S1, G1, and double materiality.
8. If emissions or policies are missing, treat that as a high-priority compliance issue.
9. If stakeholder consultation is weak, mention governance/materiality robustness.
10. Keep outputs crisp and useful.

Company input:
${JSON.stringify(payload, null, 2)}
`;

    const response = await client.responses.create({
      model: "gpt-5.4",
      reasoning: { effort: "medium" },
      input: [
        {
          role: "system",
          content:
            "You are an expert ESG, CSRD, and ESRS reporting advisor. Return structured, decision-ready output."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "esrs_ai_draft",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              executiveSummary: { type: "string" },
              disclosureDraft: { type: "string" },
              dataGaps: {
                type: "array",
                items: { type: "string" }
              },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: { type: "string" },
                    category: {
                      type: "string",
                      enum: ["Compliance", "Strategy", "Risk", "Opportunity"]
                    },
                    priority: {
                      type: "string",
                      enum: ["High", "Medium", "Low"]
                    },
                    timeline: {
                      type: "string",
                      enum: ["Short term", "Medium term", "Long term"]
                    },
                    esrsReference: { type: "string" },
                    currentGap: { type: "string" },
                    riskImpact: { type: "string" },
                    actions: {
                      type: "array",
                      items: { type: "string" }
                    },
                    suggestedKPIs: {
                      type: "array",
                      items: { type: "string" }
                    }
                  },
                  required: [
                    "title",
                    "category",
                    "priority",
                    "timeline",
                    "esrsReference",
                    "currentGap",
                    "riskImpact",
                    "actions",
                    "suggestedKPIs"
                  ]
                }
              }
            },
            required: [
              "executiveSummary",
              "disclosureDraft",
              "dataGaps",
              "recommendations"
            ]
          }
        }
      }
    });

    const parsed = JSON.parse(response.output_text);

    return res.json({
      executiveSummary: parsed.executiveSummary || "",
      disclosureDraft: parsed.disclosureDraft || "",
      dataGaps: Array.isArray(parsed.dataGaps)
        ? parsed.dataGaps.join("\n- ")
        : "",
      recommendations: stringifyRecommendations(parsed.recommendations || [])
    });
  } catch (err) {
    console.error("AI draft route error:", err);

    return res.status(500).json({
      error: "Failed to generate AI draft",
      details: err.message
    });
  }
});

module.exports = router;