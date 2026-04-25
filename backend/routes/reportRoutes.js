const express = require("express");
const auth = require("../middleware/auth");
const ESRSReport = require("../models/ESRSReport");
const AuditLog = require("../models/AuditLog");
const { createAuditLog } = require("../utils/audit");
const { generateStyledPDF } = require("../services/pdfService");
const { getReportHTML } = require("../templates/reportTemplate");

const router = express.Router();

const canMoveToStatus = (role, status) => {
  if (role === "admin") return true;

  if (status === "in_review") {
    return ["preparer", "reviewer", "approver"].includes(role);
  }

  if (status === "approved") {
    return ["reviewer", "approver"].includes(role);
  }

  if (status === "published") {
    return ["approver"].includes(role);
  }

  return false;
};

const normalizeMaterialityTopics = (topics) => {
  if (!Array.isArray(topics)) return [];

  return topics.map((topic) => ({
    topicCode: topic?.topicCode || "",
    topicLabel: topic?.topicLabel || "",
    impactMateriality: {
      severity: Number(topic?.impactMateriality?.severity || 0),
      scale: Number(topic?.impactMateriality?.scale || 0),
      scope: Number(topic?.impactMateriality?.scope || 0),
      irremediability: Number(topic?.impactMateriality?.irremediability || 0),
      likelihood: Number(topic?.impactMateriality?.likelihood || 0)
    },
    financialMateriality: {
      magnitude: Number(topic?.financialMateriality?.magnitude || 0),
      likelihood: Number(topic?.financialMateriality?.likelihood || 0),
      timeHorizon: topic?.financialMateriality?.timeHorizon || "medium"
    },
    stakeholdersConsulted: Array.isArray(topic?.stakeholdersConsulted)
      ? topic.stakeholdersConsulted
      : topic?.stakeholdersConsulted || "",
    isMaterial: Boolean(topic?.isMaterial),
    rationale: topic?.rationale || "",
    impactScore100: Number(topic?.impactScore100 || 0),
    financialScore100: Number(topic?.financialScore100 || 0),
    overallMaterialityScore: Number(topic?.overallMaterialityScore || 0)
  }));
};

const buildReportPayload = (req) => ({
  userId: req.user.userId,
  userEmail: req.user.email || "",

  companyName: req.body?.companyName || "",
  sector: req.body?.sector || "",
  reportingYear: Number(req.body?.reportingYear || new Date().getFullYear()),

  esrs2: {
    governance: req.body?.esrs2?.governance || "",
    strategy: req.body?.esrs2?.strategy || "",
    impactsRisksOpportunities:
      req.body?.esrs2?.impactsRisksOpportunities || "",
    metricsTargets: req.body?.esrs2?.metricsTargets || ""
  },

  e1: {
    scope1Emissions: Number(req.body?.e1?.scope1Emissions || 0),
    scope2Emissions: Number(req.body?.e1?.scope2Emissions || 0),
    scope3Emissions: Number(req.body?.e1?.scope3Emissions || 0),
    climatePolicies: req.body?.e1?.climatePolicies || ""
  },

  s1: {
    workforcePolicies: req.body?.s1?.workforcePolicies || "",
    diversityInclusion: req.body?.s1?.diversityInclusion || ""
  },

  g1: {
    antiCorruption: req.body?.g1?.antiCorruption || "",
    whistleblowing: req.body?.g1?.whistleblowing || ""
  },

  aiDraft: {
    executiveSummary: String(req.body?.aiDraft?.executiveSummary || ""),
    disclosureDraft: String(req.body?.aiDraft?.disclosureDraft || ""),
    dataGaps: String(req.body?.aiDraft?.dataGaps || ""),
    recommendations: String(req.body?.aiDraft?.recommendations || "")
  },

  scorecard: {
    benchmark: Number(req.body?.scorecard?.benchmark || 0),
    sectorAverage: Number(req.body?.scorecard?.sectorAverage || 0),
    topQuartile: Number(req.body?.scorecard?.topQuartile || 0),
    overallScore: Number(req.body?.scorecard?.overallScore || 0),
    riskLevel: String(req.body?.scorecard?.riskLevel || "Not assessed"),
    pillarScores: req.body?.scorecard?.pillarScores || {}
  },

  reviewStatus: req.body?.reviewStatus || "draft",
  materialityTopics: normalizeMaterialityTopics(req.body?.materialityTopics)
});



// ========================
// CREATE REPORT
// ========================
// GET all reports for current user
router.get("/", auth, async (req, res) => {
  try {
    const reports = await ESRSReport.find({
      userId: req.user.userId
    }).sort({ createdAt: -1 });

    return res.json(reports);
  } catch (err) {
    console.error("Load reports error:", err);
    return res.status(500).json({ error: err.message });
  }
});


// ========================
// UPDATE REPORT
// ========================
router.put("/:id", auth, async (req, res) => {
  try {
    const report = await ESRSReport.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!report) return res.status(404).json({ error: "Not found" });

    Object.assign(report, buildReportPayload(req));

    await report.save();

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// ========================
// DOWNLOAD PDF (FIXED)
// ========================
router.get("/:id/pdf", auth, async (req, res) => {
  try {
    const report = await ESRSReport.findOne({
      _id: req.params.id,
      userId: req.user.userId
    }).lean();

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const html = getReportHTML(report);
    const pdfBuffer = await generateStyledPDF(html);

    if (!pdfBuffer || pdfBuffer.length < 1000) {
      throw new Error("Generated PDF is invalid");
    }

    const filename = `${(report.companyName || "report").replace(
      /[^a-z0-9]/gi,
      "_"
    )}.pdf`;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length
    });

    return res.end(pdfBuffer);
  } catch (err) {
    console.error("PDF error:", err);
    return res.status(500).json({ error: err.message });
  }
});


// ========================
// DELETE REPORT
// ========================
router.delete("/:id", auth, async (req, res) => {
  try {
    await ESRSReport.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;