const express = require("express");
const PDFDocument = require("pdfkit");
const auth = require("../middleware/auth");
const ESRSReport = require("../models/ESRSReport");
const AuditLog = require("../models/AuditLog");
const { createAuditLog } = require("../utils/audit");

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

const getMaterialityLabel = (score) => {
  if (score >= 80) return "Highly Material";
  if (score >= 60) return "Material";
  if (score >= 40) return "Watchlist";
  return "Not Material";
};

const writeSection = (doc, title, content) => {
  doc.fontSize(18).text(title);
  doc.moveDown(0.5);
  doc.fontSize(12).text(content || "No content provided.");
  doc.moveDown();
};

const ensureSpace = (doc, minY = 700) => {
  if (doc.y > minY) {
    doc.addPage();
  }
};

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
        dataGaps: String(req.body?.aiDraft?.dataGaps || ""),
        recommendations: String(req.body?.aiDraft?.recommendations || "")
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

    if (report.reviewStatus === "in_review" && req.user.role === "preparer") {
      return res.status(403).json({
        error: "Preparer cannot edit report in review"
      });
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
      dataGaps: String(req.body?.aiDraft?.dataGaps || ""),
      recommendations: String(req.body?.aiDraft?.recommendations || "")
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

// DOWNLOAD ENHANCED PDF
router.get("/:id/pdf", auth, async (req, res) => {
  try {
    const report = await ESRSReport.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const auditLogs = await AuditLog.find({
      entityId: report._id
    }).sort({ createdAt: 1 });

    await createAuditLog({
      user: req.user,
      action: "REPORT_PDF_DOWNLOADED",
      entityId: report._id,
      companyName: report.companyName,
      details: {
        reportingYear: report.reportingYear
      }
    });

    const doc = new PDFDocument({
      margin: 50,
      size: "A4"
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${(report.companyName || "report").replace(
        /[^a-z0-9]/gi,
        "_"
      )}.pdf`
    );

    doc.pipe(res);

    // COVER PAGE
    doc.fontSize(24).text("CSRD / ESRS Sustainability Report", {
      align: "center"
    });
    doc.moveDown(2);

    doc.fontSize(18).text(report.companyName || "Unnamed Company", {
      align: "center"
    });
    doc.moveDown(1);

    doc.fontSize(12).text(`Sector: ${report.sector || ""}`, {
      align: "center"
    });
    doc.text(`Reporting Year: ${report.reportingYear || ""}`, {
      align: "center"
    });
    doc.text(`Review Status: ${report.reviewStatus || ""}`, {
      align: "center"
    });
    doc.text(
      `Overall Score: ${report.scorecard?.overallScore ?? 0}/100`,
      {
        align: "center"
      }
    );
    doc.text(`Benchmark: ${report.scorecard?.benchmark ?? 0}`, {
      align: "center"
    });
    doc.text(`Generated On: ${new Date().toLocaleString()}`, {
      align: "center"
    });
    doc.moveDown(8);

    doc.fontSize(11).text("Generated by Ecovanta CSRD-Ready Platform", {
      align: "center"
    });

    // MAIN CONTENT
    doc.addPage();

    writeSection(
      doc,
      "1. AI Executive Summary",
      report.aiDraft?.executiveSummary || "No AI summary"
    );

    ensureSpace(doc);
    writeSection(
      doc,
      "2. ESRS 2",
      [
        `Governance: ${report.esrs2?.governance || ""}`,
        "",
        `Strategy: ${report.esrs2?.strategy || ""}`,
        "",
        `Impacts, Risks & Opportunities: ${
          report.esrs2?.impactsRisksOpportunities || ""
        }`,
        "",
        `Metrics & Targets: ${report.esrs2?.metricsTargets || ""}`
      ].join("\n")
    );

    ensureSpace(doc);
    writeSection(
      doc,
      "3. E1 - Climate",
      [
        `Scope 1 Emissions: ${report.e1?.scope1Emissions ?? 0}`,
        `Scope 2 Emissions: ${report.e1?.scope2Emissions ?? 0}`,
        `Scope 3 Emissions: ${report.e1?.scope3Emissions ?? 0}`,
        "",
        `Climate Policies: ${report.e1?.climatePolicies || ""}`
      ].join("\n")
    );

    ensureSpace(doc);
    writeSection(
      doc,
      "4. S1 - Own Workforce",
      [
        `Workforce Policies: ${report.s1?.workforcePolicies || ""}`,
        "",
        `Diversity & Inclusion: ${report.s1?.diversityInclusion || ""}`
      ].join("\n")
    );

    ensureSpace(doc);
    writeSection(
      doc,
      "5. G1 - Business Conduct",
      [
        `Anti-Corruption: ${report.g1?.antiCorruption || ""}`,
        "",
        `Whistleblowing: ${report.g1?.whistleblowing || ""}`
      ].join("\n")
    );

    ensureSpace(doc);
    writeSection(
      doc,
      "6. AI Disclosure Draft",
      report.aiDraft?.disclosureDraft || "No AI disclosure draft"
    );

    ensureSpace(doc);
    writeSection(
      doc,
      "7. AI Data Gaps",
      report.aiDraft?.dataGaps || "No AI data gaps"
    );

    ensureSpace(doc);
    writeSection(
      doc,
      "8. AI Recommendations",
      report.aiDraft?.recommendations || "No AI recommendations"
    );

    // MATERIALITY TABLE
    doc.addPage();
    doc.fontSize(18).text("9. Double Materiality Table");
    doc.moveDown(1);

    const startX = 50;
    let y = doc.y;

    doc.fontSize(10).text("Code", startX, y);
    doc.text("Topic", 95, y, { width: 145 });
    doc.text("Impact", 255, y);
    doc.text("Financial", 315, y);
    doc.text("Overall", 390, y);
    doc.text("Result", 455, y);

    y += 18;
    doc
      .moveTo(startX, y - 4)
      .lineTo(545, y - 4)
      .stroke();

    (report.materialityTopics || []).forEach((topic) => {
      const overallScore = Number(topic.overallMaterialityScore || 0);
      const resultLabel = getMaterialityLabel(overallScore);

      if (y > 730) {
        doc.addPage();
        y = 50;
        doc.fontSize(10).text("Code", startX, y);
        doc.text("Topic", 95, y, { width: 145 });
        doc.text("Impact", 255, y);
        doc.text("Financial", 315, y);
        doc.text("Overall", 390, y);
        doc.text("Result", 455, y);
        y += 18;
        doc
          .moveTo(startX, y - 4)
          .lineTo(545, y - 4)
          .stroke();
      }

      doc.fontSize(10).text(topic.topicCode || "", startX, y);
      doc.text(topic.topicLabel || "", 95, y, { width: 145 });
      doc.text(`${topic.impactScore100 || 0}/100`, 255, y);
      doc.text(`${topic.financialScore100 || 0}/100`, 315, y);
      doc.text(`${overallScore}/100`, 390, y);
      doc.text(resultLabel, 455, y, { width: 85 });

      y += 28;
    });

    doc.y = y + 12;

    // OPTIONAL DETAILED MATERIALITY NOTES
    if (
      Array.isArray(report.materialityTopics) &&
      report.materialityTopics.length > 0
    ) {
      ensureSpace(doc);
      doc.moveDown();
      doc.fontSize(16).text("10. Materiality Topic Notes");
      doc.moveDown(0.5);

      report.materialityTopics.forEach((topic, index) => {
        ensureSpace(doc, 710);
        const overallScore = Number(topic.overallMaterialityScore || 0);

        doc.fontSize(12).text(
          `${index + 1}. ${topic.topicCode || ""} - ${topic.topicLabel || ""}`
        );
        doc.text(`Impact Score: ${topic.impactScore100 || 0}/100`);
        doc.text(`Financial Score: ${topic.financialScore100 || 0}/100`);
        doc.text(`Overall Score: ${overallScore}/100`);
        doc.text(`Result: ${getMaterialityLabel(overallScore)}`);
        doc.text(`Rationale: ${topic.rationale || ""}`);
        doc.moveDown(0.8);
      });
    }

    // AUDIT TRAIL SUMMARY
    if (Array.isArray(auditLogs) && auditLogs.length > 0) {
      doc.addPage();
      doc.fontSize(18).text("11. Audit Trail Summary");
      doc.moveDown(0.5);

      auditLogs.forEach((log, index) => {
        ensureSpace(doc, 720);
        doc.fontSize(12).text(`${index + 1}. ${log.action}`);
        doc.fontSize(11).text(`User: ${log.userEmail || "Unknown"}`);
        doc.text(`Company: ${log.companyName || "-"}`);
        doc.text(`When: ${new Date(log.createdAt).toLocaleString()}`);

        if (log.details?.newStatus) {
          doc.text(`New Status: ${log.details.newStatus}`);
        }

        if (Array.isArray(log.details?.fieldsUpdated)) {
          doc.text(`Fields Updated: ${log.details.fieldsUpdated.join(", ")}`);
        }

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