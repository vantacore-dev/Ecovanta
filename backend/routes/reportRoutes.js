const express = require("express");
const PDFDocument = require("pdfkit");
const ESRSReport = require("../models/ESRSReport");
const auth = require("../middleware/auth");

const router = express.Router();

// CREATE REPORT
router.post("/", auth, async (req, res) => {
  try {
    const report = await ESRSReport.create({
      ...req.body,
      userId: req.user.userId,
      aiDraft: {
        executiveSummary: String(req.body?.aiDraft?.executiveSummary || ""),
        disclosureDraft: String(req.body?.aiDraft?.disclosureDraft || ""),
        dataGaps: String(req.body?.aiDraft?.dataGaps || "")
        
      },
      scorecard: {
        benchmark: Number(req.body?.scorecard?.benchmark || 0),
        overallScore: Number(req.body?.scorecard?.overallScore || 0)
      },
    });

    res.json(report);
  } catch (err) {
    console.error("Save report error:", err);
    res.status(500).json({ error: err.message });
  }
 
});

// GET REPORTS
router.get("/", auth, async (req, res) => {
  const reports = await ESRSReport.find({
    userId: req.user.userId
  }).sort({ createdAt: -1 });

  res.json(reports);
});

// DOWNLOAD PDF (single)
router.get("/:id/pdf", auth, async (req, res) => {
  try {
    const report = await ESRSReport.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${(report.companyName || "report").replace(/[^a-z0-9]/gi, "_")}.pdf`
    );

    doc.pipe(res);

    // Title
    doc.fontSize(20).text("ESRS Report", { align: "center" });
    doc.moveDown();

    // Basic info
    doc.fontSize(12).text(`Company: ${report.companyName || ""}`);
    doc.text(`Sector: ${report.sector || ""}`);
    doc.text(`Reporting Year: ${report.reportingYear || ""}`);
    doc.text(`Benchmark: ${report.scorecard?.benchmark ?? ""}`);
    doc.text(`Overall Score: ${report.scorecard?.overallScore ?? ""}`);
    doc.text(`Review Status: ${report.reviewStatus || ""}`);
    doc.moveDown();

    // ESRS 2
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

    // Climate
    doc.fontSize(16).text("E1 - Climate");
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Scope 1 Emissions: ${report.e1?.scope1Emissions ?? ""}`);
    doc.text(`Scope 2 Emissions: ${report.e1?.scope2Emissions ?? ""}`);
    doc.text(`Scope 3 Emissions: ${report.e1?.scope3Emissions ?? ""}`);
    doc.moveDown(0.5);
    doc.text(`Climate Policies: ${report.e1?.climatePolicies || ""}`);
    doc.moveDown();

    // Workforce
    doc.fontSize(16).text("S1 - Workforce");
    doc.moveDown(0.5);
    doc.fontSize(12).text(
      `Workforce Policies: ${report.s1?.workforcePolicies || ""}`
    );
    doc.moveDown(0.5);
    doc.text(`Diversity & Inclusion: ${report.s1?.diversityInclusion || ""}`);
    doc.moveDown();

    // Business conduct
    doc.fontSize(16).text("G1 - Business Conduct");
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Anti-Corruption: ${report.g1?.antiCorruption || ""}`);
    doc.moveDown(0.5);
    doc.text(`Whistleblowing: ${report.g1?.whistleblowing || ""}`);
    doc.moveDown();

    // AI Executive Summary
    doc.fontSize(16).text("AI Executive Summary");
    doc.moveDown(0.5);
    doc.fontSize(12).text(report.aiDraft?.executiveSummary || "No AI summary");
    doc.moveDown();

    // AI Disclosure Draft
    doc.fontSize(16).text("AI Disclosure Draft");
    doc.moveDown(0.5);
    doc.fontSize(12).text(
      report.aiDraft?.disclosureDraft || "No AI disclosure draft"
    );
    doc.moveDown();

    // AI Data Gaps
    doc.fontSize(16).text("AI Data Gaps");
    doc.moveDown(0.5);
    doc.fontSize(12).text(
      report.aiDraft?.dataGaps || "No AI data gaps"
    );
    doc.moveDown();

    // Materiality topics
   
    if (Array.isArray(report.materialityTopics) && report.materialityTopics.length > 0) {
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

    res.json({
      message: "Report status updated successfully",
      report
    });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;