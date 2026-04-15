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
      userId: req.user.userId
    });

    res.json(report);
  } catch (err) {
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
  const report = await ESRSReport.findOne({
    _id: req.params.id,
    userId: req.user.userId
  });

  if (!report) return res.status(404).json({ error: "Not found" });

  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${report.companyName}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(18).text("ESRS Report", { align: "center" });
  doc.moveDown();

  doc.text(`Company: ${report.companyName}`);
  doc.text(`Sector: ${report.sector}`);
  doc.text(`Score: ${report.scorecard?.overallScore}`);

  doc.moveDown();
  doc.text(report.aiDraft?.executiveSummary || "");

  doc.end();
});

module.exports = router;