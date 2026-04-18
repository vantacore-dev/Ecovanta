const express = require("express");
const PDFDocument = require("pdfkit");
const auth = require("../middleware/auth");
const ESRSReport = require("../models/ESRSReport");
const { createAuditLog } = require("../utils/audit");

const router = express.Router();

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
    const report = await ESRSReport.create({
      userId: req.user.userId,

      companyName: req.body?.companyName || "",
      sector: req.body?.sector || "",
      reportingYear: Number(
        req.body?.reportingYear || new Date().getFullYear()
      ),

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
        dataGaps: String(req.body?.aiDraft?.dataGaps || "")
      },

      scorecard: {
        benchmark: Number(req.body?.scorecard?.benchmark || 0),
        overallScore: Number(req.body?.scorecard?.overallScore || 0)
      },

      reviewStatus: req.body?.reviewStatus || "draft",

      materialityTopics: Array.isArray(req.body?.materialityTopics)
        ? req.body.materialityTopics.map((topic) => ({
            topicCode: topic?.topicCode || "",
            topicLabel: topic?.topicLabel || "",
            impactMateriality: {
              severity: Number(topic?.impactMateriality?.severity || 0),
              scale: Number(topic?.impactMateriality?.scale || 0),
              scope: Number(topic?.impactMateriality?.scope || 0),
              irremediability: Number(
                topic?.impactMateriality?.irremediability || 0
              ),
              likelihood: Number(topic?.impactMateriality?.likelihood || 0)
            },
            financialMateriality: {
              magnitude: Number(topic?.financialMateriality?.magnitude || 0),
              likelihood: Number(topic?.financialMateriality?.likelihood || 0),
              timeHorizon:
                topic?.financialMateriality?.timeHorizon || "medium"
            },
            stakeholdersConsulted: Array.isArray(topic?.stakeholdersConsulted)
              ? topic.stakeholdersConsulted
              : [],
            isMaterial: Boolean(topic?.isMaterial),
            rationale: topic?.rationale || "",
            impactScore100: Number(topic?.impactScore100 || 0),
            financialScore100: Number(topic?.financialScore100 || 0),
            overallMaterialityScore: Number(
              topic?.overallMaterialityScore || 0
            )
          }))
        : []
    });

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

    report.companyName = req.body?.companyName || report.companyName;
    report.sector = req.body?.sector || report.sector;
    report.reportingYear = Number(
      req.body?.reportingYear || report.reportingYear
    );

    report.esrs2 = {
      governance: req.body?.esrs2?.governance || "",
      strategy: req.body?.esrs2?.strategy || "",
      impactsRisksOpportunities:
        req.body?.esrs2?.impactsRisksOpportunities || "",
      metricsTargets: req.body?.esrs2?.metricsTargets || ""
    };

    report.e1 = {
      scope1Emissions: Number(req.body?.e1?.scope1Emissions || 0),
      scope2Emissions: Number(req.body?.e1?.scope2Emissions || 0),
      scope3Emissions: Number(req.body?.e1?.scope3Emissions || 0),
      climatePolicies: req.body?.e1?.climatePolicies || ""
    };

    report.s1 = {
      workforcePolicies: req.body?.s1?.workforcePolicies || "",
      diversityInclusion: req.body?.s1?.diversityInclusion || ""
    };

    report.g1 = {
      antiCorruption: req.body?.g1?.antiCorruption || "",
      whistleblowing: req.body?.g1?.whistleblowing || ""
    };

    report.aiDraft = {
      executiveSummary: String(req.body?.aiDraft?.executiveSummary || ""),
      disclosureDraft: String(req.body?.aiDraft?.disclosureDraft || ""),
      dataGaps: String(req.body?.aiDraft?.dataGaps || "")
    };

    report.scorecard = {
      benchmark: Number(req.body?.scorecard?.benchmark || 0),
      overallScore: Number(req.body?.scorecard?.overallScore || 0)
    };

    report.reviewStatus = req.body?.reviewStatus || report.reviewStatus;

    report.materialityTopics = Array.isArray(req.body?.materialityTopics)
      ? req.body.materialityTopics.map((topic) => ({
          topicCode: topic?.topicCode || "",
          topicLabel: topic?.topicLabel || "",
          impactMateriality: {
            severity: Number(topic?.impactMateriality?.severity || 0),
            scale: Number(topic?.impactMateriality?.scale || 0),
            scope: Number(topic?.impactMateriality?.scope || 0),
            irremediability: Number(
              topic?.impactMateriality?.irremediability || 0
            ),
            likelihood: Number(topic?.impactMateriality?.likelihood || 0)
          },
          financialMateriality: {
            magnitude: Number(topic?.financialMateriality?.magnitude || 0),
            likelihood: Number(topic?.financialMateriality?.likelihood || 0),
            timeHorizon: topic?.financialMateriality?.timeHorizon || "medium"
          },
          stakeholdersConsulted: Array.isArray(topic?.stakeholdersConsulted)
            ? topic.stakeholdersConsulted
            : [],
          isMaterial: Boolean(topic?.isMaterial),
          rationale: topic?.rationale || "",
          impactScore100: Number(topic?.impactScore100 || 0),
          financialScore100: Number(topic?.financialScore100 || 0),
          overallMaterialityScore: Number(
            topic?.overallMaterialityScore || 0
          )
        }))
      : [];

    await report.save();

    await createAuditLog({
      user: req.user,
      action: "REPORT_UPDATED",
      entityId: report._id,
      companyName: report.companyName,
      details: {
        fieldsUpdated: [
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

    const allowedStatuses = ["draft", "in_review", "approved", "published"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
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

// DOWNLOAD PDF
router.get("/:id/pdf", auth, async (req, res) => {
  try {
    const report = await ESRSReport.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    await createAuditLog({
      user: req.user,
      action: "REPORT_PDF_DOWNLOADED",
      entityId: report._id,
      companyName: report.companyName,
      details: {
        reportingYear: report.reportingYear
      }
    });

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${(report.companyName || "report").replace(
        /[^a-z0-9]/gi,
        "_"
      )}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(20).text("ESRS Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Company: ${report.companyName || ""}`);
    doc.text(`Sector: ${report.sector || ""}`);
    doc.text(`Reporting Year: ${report.reportingYear || ""}`);
    doc.text(`Benchmark: ${report.scorecard?.benchmark ?? ""}`);
    doc.text(`Overall Score: ${report.scorecard?.overallScore ?? ""}`);
    doc.text(`Review Status: ${report.reviewStatus || ""}`);
    doc.moveDown();

    doc.fontSize(16).text("ESRS 2");
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Governance: ${report.esrs2?.governance || ""}`);
    doc.moveDown(0.5);
    doc.text(`Strategy: ${report.esrs2?.strategy || ""}`);
    doc.moveDown(0.5);
    doc.text(
      `Impacts, Risks & Opportunities: ${
        report.esrs2?.impactsRisksOpportunities || ""
      }`
    );
    doc.moveDown(0.5);
    doc.text(`Metrics & Targets: ${report.esrs2?.metricsTargets || ""}`);
    doc.moveDown();

    doc.fontSize(16).text("E1 - Climate");
    doc.moveDown(0.5);
    doc.fontSize(12).text(
      `Scope 1 Emissions: ${report.e1?.scope1Emissions ?? ""}`
    );
    doc.text(`Scope 2 Emissions: ${report.e1?.scope2Emissions ?? ""}`);
    doc.text(`Scope 3 Emissions: ${report.e1?.scope3Emissions ?? ""}`);
    doc.moveDown(0.5);
    doc.text(`Climate Policies: ${report.e1?.climatePolicies || ""}`);
    doc.moveDown();

    doc.fontSize(16).text("S1 - Workforce");
    doc.moveDown(0.5);
    doc.fontSize(12).text(
      `Workforce Policies: ${report.s1?.workforcePolicies || ""}`
    );
    doc.moveDown(0.5);
    doc.text(`Diversity & Inclusion: ${report.s1?.diversityInclusion || ""}`);
    doc.moveDown();

    doc.fontSize(16).text("G1 - Business Conduct");
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Anti-Corruption: ${report.g1?.antiCorruption || ""}`);
    doc.moveDown(0.5);
    doc.text(`Whistleblowing: ${report.g1?.whistleblowing || ""}`);
    doc.moveDown();

    doc.fontSize(16).text("AI Executive Summary");
    doc.moveDown(0.5);
    doc.fontSize(12).text(report.aiDraft?.executiveSummary || "No AI summary");
    doc.moveDown();

    doc.fontSize(16).text("AI Disclosure Draft");
    doc.moveDown(0.5);
    doc.fontSize(12).text(
      report.aiDraft?.disclosureDraft || "No AI disclosure draft"
    );
    doc.moveDown();

    doc.fontSize(16).text("AI Data Gaps");
    doc.moveDown(0.5);
    doc.fontSize(12).text(report.aiDraft?.dataGaps || "No AI data gaps");
    doc.moveDown();

    if (
      Array.isArray(report.materialityTopics) &&
      report.materialityTopics.length > 0
    ) {
      doc.fontSize(16).text("Materiality Topics");
      doc.moveDown(0.5);

      report.materialityTopics.forEach((topic, index) => {
        const overallScore = Number(topic.overallMaterialityScore || 0);
        const resultLabel =
          overallScore >= 80
            ? "Highly Material"
            : overallScore >= 60
            ? "Material"
            : overallScore >= 40
            ? "Watchlist"
            : "Not Material";

        doc.fontSize(12).text(
          `${index + 1}. ${topic.topicCode || ""} - ${topic.topicLabel || ""}`
        );
        doc.text(`Impact Score: ${topic.impactScore100 || 0}/100`);
        doc.text(`Financial Score: ${topic.financialScore100 || 0}/100`);
        doc.text(`Overall Score: ${overallScore}/100`);
        doc.text(`Result: ${resultLabel}`);
        doc.text(`Rationale: ${topic.rationale || ""}`);
        doc.moveDown(0.8);
      });
    }

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: err.message });
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