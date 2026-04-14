const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const OpenAI = require("openai");

if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch (error) {
    console.warn("dotenv not installed. Skipping local .env loading.");
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// =======================
// MIDDLEWARE
// =======================
app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json());

// =======================
// ENV
// =======================
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const MONGO_URI = process.env.MONGO_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!MONGO_URI) {
  console.warn("MONGO_URI is not set");
}

if (!OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set");
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

// =======================
// DATABASE
// =======================
async function connectDB() {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 15000
  });
}

// =======================
// MODEL
// =======================
const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    company: {
      type: String,
      required: true,
      trim: true
    },
    sector: {
      type: String,
      required: true,
      trim: true
    },
    environmental: {
      type: Number,
      required: true,
      min: 1,
      max: 3
    },
    social: {
      type: Number,
      required: true,
      min: 1,
      max: 3
    },
    governance: {
      type: Number,
      required: true,
      min: 1,
      max: 3
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    benchmark: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    aiInsights: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);

// =======================
// HELPERS
// =======================
function calculateScore(environmental, social, governance) {
  return Math.round(
    (environmental / 3) * 40 + (social / 3) * 30 + (governance / 3) * 30
  );
}

function getBenchmarkBySector(sector) {
  const map = {
    tech: 75,
    energy: 55,
    manufacturing: 65
  };

  return map[sector] || 60;
}

function parseToken(authHeader) {
  if (!authHeader) return null;

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return authHeader.trim();
}

function deriveAnalytics(reports) {
  const totalCompanies = reports.length;
  const averageScore = totalCompanies
    ? Math.round(
        reports.reduce((sum, report) => sum + Number(report.score || 0), 0) /
          totalCompanies
      )
    : 0;

  const highRisk = reports.filter((report) => Number(report.score) < 60).length;
  const moderateRisk = reports.filter(
    (report) => Number(report.score) >= 60 && Number(report.score) < 80
  ).length;
  const lowRisk = reports.filter((report) => Number(report.score) >= 80).length;
  const belowBenchmark = reports.filter(
    (report) => Number(report.score) < Number(report.benchmark || 0)
  ).length;

  return {
    totalCompanies,
    averageScore,
    highRisk,
    moderateRisk,
    lowRisk,
    belowBenchmark
  };
}

// =======================
// AUTH
// =======================
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = parseToken(authHeader);

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// =======================
// HEALTH
// =======================
app.get("/", (req, res) => {
  res.send("Ecovanta backend running");
});

app.get("/health", async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const stateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };

  return res.json({
    ok: true,
    server: "running",
    database: stateMap[dbState] || "unknown"
  });
});

// =======================
// LOGIN
// =======================
app.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  if (email === "demo@test.com" && password === "1234") {
    const token = jwt.sign({ userId: "demo" }, JWT_SECRET, {
      expiresIn: "7d"
    });

    return res.json({ token });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

// =======================
// BENCHMARK
// =======================
app.get("/benchmark/:sector", (req, res) => {
  const benchmark = getBenchmarkBySector(req.params.sector);
  return res.json({ benchmark });
});

// =======================
// AI INSIGHTS
// =======================
app.post("/ai-insights", async (req, res) => {
  try {
    const environmental = Number(req.body?.environmental);
    const social = Number(req.body?.social);
    const governance = Number(req.body?.governance);
    const benchmark = Number(req.body?.benchmark || 0);

    if (
      ![environmental, social, governance].every(
        (value) => Number.isFinite(value) && value >= 1 && value <= 3
      )
    ) {
      return res.status(400).json({
        error: "Environmental, social, and governance scores must be numbers between 1 and 3"
      });
    }

    if (!OPENAI_API_KEY) {
      return res.json({
        insights: "AI unavailable: OPENAI_API_KEY is not configured."
      });
    }

    const score = calculateScore(environmental, social, governance);

    const prompt = `
You are an ESG analyst.

Company score: ${score}
Benchmark: ${benchmark}
Environmental: ${environmental}/3
Social: ${social}/3
Governance: ${governance}/3

Provide:
- Risk level
- Benchmark comparison
- Key issues
- Priority actions
- Short-term actions
- Medium-term actions

Keep it practical and concise.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });

    return res.json({
      insights:
        response?.choices?.[0]?.message?.content ||
        "No AI insights returned."
    });
  } catch (error) {
    console.error("AI insights error:", error);
    return res.status(500).json({
      error: "AI generation failed",
      details: error.message,
      insights: "AI unavailable"
    });
  }
});

// =======================
// REPORTS
// =======================
app.post("/reports", auth, async (req, res) => {
  try {
    const company = String(req.body?.company || "").trim();
    const sector = String(req.body?.sector || "").trim();
    const environmental = Number(req.body?.environmental);
    const social = Number(req.body?.social);
    const governance = Number(req.body?.governance);
    const providedBenchmark = Number(req.body?.benchmark);
    const aiInsights = String(req.body?.aiInsights || "");

    if (!company) {
      return res.status(400).json({ error: "Company is required" });
    }

    if (!sector) {
      return res.status(400).json({ error: "Sector is required" });
    }

    if (
      ![environmental, social, governance].every(
        (value) => Number.isFinite(value) && value >= 1 && value <= 3
      )
    ) {
      return res.status(400).json({
        error: "Environmental, social, and governance scores must be numbers between 1 and 3"
      });
    }

    const score = calculateScore(environmental, social, governance);
    const benchmark = Number.isFinite(providedBenchmark)
      ? providedBenchmark
      : getBenchmarkBySector(sector);

    const report = await Report.create({
      userId: req.user.userId,
      company,
      sector,
      environmental,
      social,
      governance,
      score,
      benchmark,
      aiInsights
    });

    return res.status(201).json(report);
  } catch (error) {
    console.error("Create report error:", error);
    return res.status(500).json({
      error: "Failed to save report",
      details: error.message
    });
  }
});

app.get("/reports", auth, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.userId }).sort({
      createdAt: -1
    });

    return res.json(reports);
  } catch (error) {
    console.error("Get reports error:", error);
    return res.status(500).json({
      error: "Failed to fetch reports",
      details: error.message
    });
  }
});

// =======================
// ANALYTICS
// =======================
app.get("/analytics/overview", auth, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.userId });
    const analytics = deriveAnalytics(reports);

    return res.json(analytics);
  } catch (error) {
    console.error("Analytics error:", error);
    return res.status(500).json({
      error: "Failed to load analytics",
      details: error.message
    });
  }
});


// Indfividual pdf report download //


const PDFDocument = require("pdfkit");

app.get("/reports/:id/download/pdf", auth, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${report.company.replace(/[^a-z0-9]/gi, "_")}_report.pdf"`
    );

    doc.pipe(res);

    doc.fontSize(20).text("Ecovanta ESG Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Company: ${report.company}`);
    doc.text(`Sector: ${report.sector}`);
    doc.text(`Score: ${report.score}`);
    doc.text(`Benchmark: ${report.benchmark}`);
    doc.moveDown();

    doc.text(`Environmental: ${report.environmental}`);
    doc.text(`Social: ${report.social}`);
    doc.text(`Governance: ${report.governance}`);
    doc.moveDown();

    doc.fontSize(14).text("AI Recommendations");
    doc.moveDown(0.5);
    doc.fontSize(12).text(report.aiInsights || "No AI insights available", {
      align: "left"
    });

    doc.moveDown();
    doc.fontSize(10).fillColor("gray").text(
      `Generated: ${new Date(report.createdAt).toLocaleString()}`
    );

    doc.end();
  } catch (error) {
    console.error("Single report PDF error:", error);
    return res.status(500).json({
      error: "Failed to generate report PDF",
      details: error.message
    });
  }
});

const PDFDocument = require("pdfkit"); // npm install pdfkit

app.get("/reports/download/pdf", auth, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.userId }).sort({
      createdAt: -1
    });

    if (!reports.length) {
      return res.status(404).json({ error: "No reports found" });
    }

    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=ecovanta_reports.pdf"
    );

    doc.pipe(res);

    doc.fontSize(20).text("Ecovanta ESG Reports", { align: "center" });
    doc.moveDown(1);

    reports.forEach((r, idx) => {
      doc
        .fontSize(14)
        .text(`${idx + 1}. Company: ${r.company}`, { underline: true });
      doc.fontSize(12).text(`Sector: ${r.sector}`);
      doc.text(`Environmental: ${r.environmental}`);
      doc.text(`Social: ${r.social}`);
      doc.text(`Governance: ${r.governance}`);
      doc.text(`Score: ${r.score}`);
      doc.text(`Benchmark: ${r.benchmark}`);
      doc.text("AI Insights:");
      doc.text(r.aiInsights || "No insights", { indent: 20 });
      doc.moveDown(1);
    });

    doc.end();
  } catch (error) {
    console.error("PDF download error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// =======================
// 404
// =======================
app.use((req, res) => {
  return res.status(404).json({ error: "Route not found" });
});

// =======================
// GLOBAL ERROR HANDLER
// =======================
app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);
  return res.status(500).json({
    error: "Internal server error",
    details: error.message
  });
});

// =======================
// START SERVER
// =======================
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error.message);
    process.exit(1);
  }
}

startServer();