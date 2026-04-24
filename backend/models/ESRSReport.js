const mongoose = require("mongoose");

const MaterialityTopicSchema = new mongoose.Schema(
  {
    topicCode: { type: String, default: "" },
    topicLabel: { type: String, default: "" },

    impactMateriality: {
      severity: { type: Number, default: 3 },
      scale: { type: Number, default: 3 },
      scope: { type: Number, default: 3 },
      irremediability: { type: Number, default: 3 },
      likelihood: { type: Number, default: 3 }
    },

    financialMateriality: {
      magnitude: { type: Number, default: 3 },
      likelihood: { type: Number, default: 3 },
      timeHorizon: { type: String, default: "medium" }
    },

    stakeholdersConsulted: { type: mongoose.Schema.Types.Mixed, default: "" },
    isMaterial: { type: Boolean, default: false },
    rationale: { type: String, default: "" },

    impactScore100: { type: Number, default: 0 },
    financialScore100: { type: Number, default: 0 },
    overallMaterialityScore: { type: Number, default: 0 }
  },
  { _id: false }
);

const ESRSReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    userEmail: { type: String, default: "" },

    companyName: { type: String, required: true },
    sector: { type: String, default: "tech" },
    reportingYear: { type: Number, default: new Date().getFullYear() },

    reviewStatus: {
      type: String,
      enum: ["draft", "in_review", "approved", "published"],
      default: "draft"
    },

    esrs2: {
      governance: { type: String, default: "" },
      strategy: { type: String, default: "" },
      impactsRisksOpportunities: { type: String, default: "" },
      metricsTargets: { type: String, default: "" }
    },

    e1: {
      scope1Emissions: { type: Number, default: 0 },
      scope2Emissions: { type: Number, default: 0 },
      scope3Emissions: { type: Number, default: 0 },
      climatePolicies: { type: String, default: "" }
    },

    s1: {
      workforcePolicies: { type: String, default: "" },
      diversityInclusion: { type: String, default: "" }
    },

    g1: {
      antiCorruption: { type: String, default: "" },
      whistleblowing: { type: String, default: "" }
    },

    aiDraft: {
      executiveSummary: { type: String, default: "" },
      disclosureDraft: { type: String, default: "" },
      dataGaps: { type: String, default: "" },
      recommendations: { type: String, default: "" }
    },

    materialityTopics: {
      type: [MaterialityTopicSchema],
      default: []
    },

    scorecard: {
      benchmark: { type: Number, default: 0 },
      sectorAverage: { type: Number, default: 0 },
      topQuartile: { type: Number, default: 0 },
      overallScore: { type: Number, default: 0 },
      riskLevel: { type: String, default: "Not assessed" },
      pillarScores: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

module.exports = mongoose.model("ESRSReport", ESRSReportSchema);