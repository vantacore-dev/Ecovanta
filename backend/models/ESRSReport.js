const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    companyName: String,
    sector: String,
    reportingYear: Number,

    esrs2: {
      governance: String,
      strategy: String,
      impactsRisksOpportunities: String,
      metricsTargets: String
    },

    e1: {
      scope1Emissions: Number,
      scope2Emissions: Number,
      scope3Emissions: Number,
      climatePolicies: String
    },

    s1: {
      workforcePolicies: String,
      diversityInclusion: String
    },

    g1: {
      antiCorruption: String,
      whistleblowing: String
    },

    aiDraft: {
      executiveSummary: String,
      disclosureDraft: String,
      dataGaps: String
    },

    scorecard: {
      benchmark: Number,
      overallScore: Number
    },

    reviewStatus: {
      type: String,
      default: "draft"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ESRSReport", reportSchema);