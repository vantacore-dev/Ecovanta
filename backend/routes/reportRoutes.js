const express = require("express");
const PDFDocument = require("pdfkit");
const auth = require("../middleware/auth");
const ESRSReport = require("../models/ESRSReport");
const AuditLog = require("../models/AuditLog");
const { createAuditLog } = require("../utils/audit");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
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

//Chart package
const chartWidth = 900;
const chartHeight = 500;
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width: chartWidth,
  height: chartHeight,
  backgroundColour: "white"
});

const getSectorBenchmarks = (sector) => {
  const benchmarks = {
    tech: { sectorAverage: 65, topQuartile: 82 },
    energy: { sectorAverage: 58, topQuartile: 78 },
    manufacturing: { sectorAverage: 61, topQuartile: 79 }
  };

  return benchmarks[sector] || { sectorAverage: 60, topQuartile: 75 };
};

const getComplianceScore = (report) => {
  let total = 0;
  let complete = 0;

  const checks = [
    report?.esrs2?.governance,
    report?.esrs2?.strategy,
    report?.esrs2?.impactsRisksOpportunities,
    report?.esrs2?.metricsTargets,
    report?.e1?.scope1Emissions,
    report?.e1?.scope2Emissions,
    report?.e1?.scope3Emissions,
    report?.e1?.climatePolicies,
    report?.s1?.workforcePolicies,
    report?.s1?.diversityInclusion,
    report?.g1?.antiCorruption,
    report?.g1?.whistleblowing
  ];

  checks.forEach((item) => {
    total += 1;
    if (
      item !== undefined &&
      item !== null &&
      String(item).trim() !== "" &&
      String(item).trim() !== "0"
    ) {
      complete += 1;
    }
  });

  return total ? Math.round((complete / total) * 100) : 0;
};

const buildBenchmarkChart = async (report) => {
  const sectorBench = getSectorBenchmarks(report.sector);

  const configuration = {
    type: "bar",
    data: {
      labels: ["Company Score", "Sector Average", "Top Quartile"],
      datasets: [
        {
          label: "Score",
          data: [
            Number(report.scorecard?.overallScore || 0),
            sectorBench.sectorAverage,
            sectorBench.topQuartile
          ],
          backgroundColor: ["#1976d2", "#f59e0b", "#10b981"]
        }
      ]
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Benchmark Comparison"
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  };

  return chartJSNodeCanvas.renderToBuffer(configuration);
};

const buildMaterialityHeatmapChart = async (report) => {
  const points = Array.isArray(report.materialityTopics)
    ? report.materialityTopics.map((topic) => ({
        x: Number(topic.financialScore100 || 0),
        y: Number(topic.impactScore100 || 0),
        label: topic.topicCode || topic.topicLabel || "Topic"
      }))
    : [];

  const configuration = {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Materiality Topics",
          data: points,
          backgroundColor: "#7c3aed",
          pointRadius: 7
        }
      ]
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Materiality Heatmap"
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const raw = context.raw || {};
              return `${raw.label || "Topic"}: Financial ${raw.x}/100, Impact ${raw.y}/100`;
            }
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          title: {
            display: true,
            text: "Financial Materiality"
          }
        },
        y: {
          min: 0,
          max: 100,
          title: {
            display: true,
            text: "Impact Materiality"
          }
        }
      }
    }
  };

  return chartJSNodeCanvas.renderToBuffer(configuration);
};

const buildComplianceGaugeChart = async (report) => {
  const score = getComplianceScore(report);

  const configuration = {
    type: "doughnut",
    data: {
      labels: ["Low", "Moderate", "Strong"],
      datasets: [
        {
          data: [40, 30, 30],
          backgroundColor: ["#C96A5A", "#D7B26D", "#6FA287"],
          borderWidth: 0,
          hoverOffset: 0
        }
      ]
    },
    options: {
      responsive: false,
      rotation: -90,
      circumference: 180,
      cutout: "72%",
      animation: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `Compliance Gap Dashboard`,
          color: "#1F2937",
          font: {
            size: 20,
            weight: "bold"
          },
          padding: {
            top: 10,
            bottom: 20
          }
        }
      }
    },
    plugins: [
      {
        id: "premiumGaugeNeedle",
        afterDatasetDraw(chart) {
          const { ctx } = chart;
          const meta = chart.getDatasetMeta(0);

          if (!meta || !meta.data || !meta.data.length) return;

          const arc = meta.data[0];
          const centerX = arc.x;
          const centerY = arc.y;
          const outerRadius = arc.outerRadius;
          const innerRadius = arc.innerRadius;

          // 0–100 mapped to half circle from left to right
          const angle = Math.PI * (score / 100) - Math.PI;

          // smoother, slightly shorter needle
          const needleLength = outerRadius * 0.82;
          const baseRadius = 10;

          const needleX = centerX + Math.cos(angle) * needleLength;
          const needleY = centerY + Math.sin(angle) * needleLength;

          ctx.save();

          // needle shadow
          ctx.beginPath();
          ctx.lineWidth = 4;
          ctx.strokeStyle = "rgba(0,0,0,0.10)";
          ctx.moveTo(centerX + 1, centerY + 1);
          ctx.lineTo(needleX + 1, needleY + 1);
          ctx.stroke();

          // main needle
          ctx.beginPath();
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#1F2937";
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(needleX, needleY);
          ctx.stroke();

          // center hub
          ctx.beginPath();
          ctx.fillStyle = "#1F2937";
          ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
          ctx.fill();

          // inner hub ring
          ctx.beginPath();
          ctx.fillStyle = "#F9FAFB";
          ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
          ctx.fill();

          // main score text
          ctx.font = "bold 38px Arial";
          ctx.fillStyle = "#111827";
          ctx.textAlign = "center";
          ctx.fillText(`${score}%`, centerX, centerY - 18);

          // subtitle
          ctx.font = "15px Arial";
          ctx.fillStyle = "#6B7280";
          ctx.fillText("Compliance Score", centerX, centerY + 20);

          // labels under zones
          const labelRadius = outerRadius + 18;
          const leftAngle = -Math.PI + Math.PI * 0.20;   // low zone center
          const midAngle = -Math.PI + Math.PI * 0.55;    // moderate zone center
          const rightAngle = -Math.PI + Math.PI * 0.85;  // strong zone center

          const labels = [
            { text: "Low", angle: leftAngle, color: "#A54E43" },
            { text: "Moderate", angle: midAngle, color: "#9A7A38" },
            { text: "Strong", angle: rightAngle, color: "#4E7D66" }
          ];

          ctx.font = "13px Arial";

          labels.forEach((label) => {
            const lx = centerX + Math.cos(label.angle) * labelRadius;
            const ly = centerY + Math.sin(label.angle) * labelRadius + 18;

            ctx.fillStyle = label.color;
            ctx.textAlign = "center";
            ctx.fillText(label.text, lx, ly);
          });

          // optional min/max labels
          ctx.font = "12px Arial";
          ctx.fillStyle = "#9CA3AF";
          ctx.textAlign = "left";
          ctx.fillText("0", centerX - outerRadius - 6, centerY + 6);
          ctx.textAlign = "right";
          ctx.fillText("100", centerX + outerRadius + 6, centerY + 6);

          ctx.restore();
        }
      }
    ]
  };

  return chartJSNodeCanvas.renderToBuffer(configuration);
};
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


// ===== Benchmark helper =====
const benchmarks = {
  tech: { sectorAverage: 65, topQuartile: 82 },
  energy: { sectorAverage: 58, topQuartile: 78 },
  manufacturing: { sectorAverage: 61, topQuartile: 79 }
};

const sectorBench = benchmarks[report.sector] || benchmarks.tech;

// ===== Compliance gaps =====
const getMissing = () => {
  const gaps = [];

  if (!report.esrs2?.governance) gaps.push("ESRS2 Governance");
  if (!report.esrs2?.strategy) gaps.push("ESRS2 Strategy");
  if (!report.e1?.scope1Emissions) gaps.push("Scope 1 emissions");
  if (!report.e1?.scope2Emissions) gaps.push("Scope 2 emissions");
  if (!report.e1?.scope3Emissions) gaps.push("Scope 3 emissions");
  if (!report.e1?.climatePolicies) gaps.push("Climate policies");

  return gaps;
};

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
      // ✅ Reset left alignment after table
      doc.x = doc.page.margins.left;
      doc.fontSize(16).text("10. Materiality Topic Notes", {
      align: "left"
      });
      doc.moveDown(0.5);

      report.materialityTopics.forEach((topic, index) => {
        ensureSpace(doc, 710);
         // ✅ Reset alignment for each row
        doc.x = doc.page.margins.left;
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

    // ===== 11. Analytics & Visual Insights =====
    doc.addPage();
    doc.fontSize(18).text("11. Analytics & Visual Insights", {
      align: "center"
    });
    doc.moveDown();

    const benchmarkChartBuffer = await buildBenchmarkChart(report);
    const materialityChartBuffer = await buildMaterialityHeatmapChart(report);
    const complianceGaugeBuffer = await buildComplianceGaugeChart(report);

    doc.fontSize(14).text("11.1 Benchmark Comparison", { underline: true });
    doc.moveDown(0.5);
    doc.image(benchmarkChartBuffer, {
      fit: [500, 260],
      align: "center"
    });

    doc.moveDown(1.5);
    doc.fontSize(14).text("11.2 Materiality Heatmap", { underline: true });
    doc.moveDown(0.5);
    doc.image(materialityChartBuffer, {
      fit: [500, 260],
      align: "center"
    });

    doc.addPage();
    doc.fontSize(14).text("11.3 Compliance Gap Dashboard", { underline: true });
    doc.moveDown(0.5);
    doc.image(complianceGaugeBuffer, {
      fit: [500, 260],
      align: "center"
    });

//add benchmark comparison to pdf
    doc.moveDown().fontSize(14).text("12. Benchmark Comparison", { underline: true });

    doc.moveDown().fontSize(11);
    doc.text(`Company Score: ${report.scorecard?.overallScore || 0}`);
    doc.text(`Sector Average: ${sectorBench.sectorAverage}`);
    doc.text(`Top Quartile: ${sectorBench.topQuartile}`);

    // add Meteriality Heatmap Table
    doc.moveDown().fontSize(14).text("13. Materiality Heatmap", { underline: true });

if (Array.isArray(report.materialityTopics)) {
  report.materialityTopics.forEach((t, i) => {
    doc.moveDown().fontSize(11).text(
      `${i + 1}. ${t.topicCode} - ${t.topicLabel}`
    );
    doc.text(`Impact: ${t.impactScore100}/100`);
    doc.text(`Financial: ${t.financialScore100}/100`);
    doc.text(`Overall: ${t.overallMaterialityScore}/100`);
    doc.text(`Result: ${t.isMaterial ? "Material" : "Not Material"}`);
  });
} else {
  doc.text("No materiality data.");
}

    // add Compliance Gap Dashboard

  doc.moveDown().fontSize(14).text("14. Compliance Gap Analysis", { underline: true });

  const gaps = getMissing();

  if (gaps.length === 0) {
  doc.moveDown().text("No major compliance gaps identified.");
  } else {
  doc.moveDown().text("Missing elements:");
  gaps.forEach((g, i) => {
    doc.text(`- ${g}`);
  });
}

    // AUDIT TRAIL SUMMARY
    if (Array.isArray(auditLogs) && auditLogs.length > 0) {
      doc.addPage();
      doc.fontSize(18).text("15. Audit Trail Summary");
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