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

// GET all reports for current user
router.get("/", auth, async (req, res) => {
  try {
    const reports = await ESRSReport.find({
      userId: req.user.userId
    }).sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error("Load reports error:", err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE report
router.post("/", auth, async (req, res) => {
  try {
    const payload = buildReportPayload(req);

    const report = await ESRSReport.create(payload);

    await createAuditLog({
      user: req.user,
      action: "REPORT_CREATED",
      entityId: report._id,
      companyName: report.companyName,
      details: {
        reviewStatus: report.reviewStatus,
        reportingYear: report.reportingYear
      }
    });

    res.json(report);
  } catch (err) {
    console.error("Save report error:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE full report
router.put("/:id", auth, async (req, res) => {
  try {
    const report = await ESRSReport.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (report.reviewStatus === "in_review" && req.user.role === "preparer") {
      return res.status(403).json({
        error: "Preparer cannot edit report in review"
      });
    }

    const payload = buildReportPayload(req);

    report.companyName = payload.companyName || report.companyName;
    report.sector = payload.sector || report.sector;
    report.reportingYear = payload.reportingYear;

    report.esrs2 = payload.esrs2;
    report.e1 = payload.e1;
    report.s1 = payload.s1;
    report.g1 = payload.g1;
    report.aiDraft = payload.aiDraft;
    report.scorecard = payload.scorecard;
    report.reviewStatus = payload.reviewStatus || report.reviewStatus;
    report.materialityTopics = payload.materialityTopics;

    await report.save();

    await createAuditLog({
      user: req.user,
      action: "REPORT_UPDATED",
      entityId: report._id,
      companyName: report.companyName,
      details: {
        fieldsUpdated: [
          "companyName",
          "sector",
          "reportingYear",
          "esrs2",
          "e1",
          "s1",
          "g1",
          "aiDraft",
          "scorecard",
          "materialityTopics"
        ]
      }
    });

    res.json(report);
  } catch (err) {
    console.error("Update report error:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE workflow status
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const userRole = req.user.role || "preparer";

    const allowedStatuses = ["draft", "in_review", "approved", "published"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    if (!canMoveToStatus(userRole, status)) {
      return res.status(403).json({
        error: `Role '${userRole}' cannot move report to status '${status}'`
      });
    }

    const report = await ESRSReport.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    report.reviewStatus = status;

    if (status === "approved") {
      report.reviewedBy = req.user.userId;
      report.reviewedAt = new Date();
    }

    if (status === "published") {
      report.publishedAt = new Date();
    }

    await report.save();

    await createAuditLog({
      user: req.user,
      action: "REPORT_STATUS_UPDATED",
      entityId: report._id,
      companyName: report.companyName,
      details: {
        newStatus: report.reviewStatus,
        reviewedBy: report.reviewedBy,
        reviewedAt: report.reviewedAt,
        publishedAt: report.publishedAt
      }
    });

    res.json({
      message: "Report status updated successfully",
      report
    });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DOWNLOAD STYLED PDF FROM SAVED REPORT
router.get("/:id/pdf", auth, async (req, res) => {
  try {
    const report = await ESRSReport.findOne({
      _id: req.params.id,
      userId: req.user.userId
    }).lean();

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const auditLogs = await AuditLog.find({
      entityId: report._id
    })
      .sort({ createdAt: 1 })
      .lean();

    const reportForPdf = {
      ...report,
      auditLogs
    };

    await createAuditLog({
      user: req.user,
      action: "REPORT_PDF_DOWNLOADED",
      entityId: report._id,
      companyName: report.companyName,
      details: {
        reportingYear: report.reportingYear
      }
    });

    const html = getReportHTML(reportForPdf);
    const pdfBuffer = await generateStyledPDF(html);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${(
        report.companyName || "report"
      ).replace(/[^a-z0-9]/gi, "_")}.pdf`
    });

    return res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// OPTIONAL: EXPORT PDF FROM FRONTEND PAYLOAD
router.post("/export-pdf", auth, async (req, res) => {
  try {
    const report = req.body || {};

    const html = getReportHTML(report);
    const pdfBuffer = await generateStyledPDF(html);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${(
        report.companyName || "report"
      ).replace(/[^a-z0-9]/gi, "_")}.pdf`
    });

    return res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF export error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE report
router.delete("/:id", auth, async (req, res) => {
  try {
    const report = await ESRSReport.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    await createAuditLog({
      user: req.user,
      action: "REPORT_DELETED",
      entityId: report._id,
      companyName: report.companyName,
      details: {
        reportingYear: report.reportingYear
      }
    });

    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    console.error("Delete report error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;