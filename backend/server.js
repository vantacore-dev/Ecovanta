const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const OpenAI = require("openai");
const PDFDocument = require("pdfkit");

if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch (error) {
    console.warn("dotenv not installed. Skipping local .env loading.");
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));

const JWT_SECRET = process.env.JWT_SECRET || "change_me";
const MONGO_URI = process.env.MONGO_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

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

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    companyName: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      enum: ["preparer", "reviewer", "admin"],
      default: "preparer"
    },
    plan: {
      type: String,
      enum: ["free", "pro", "business", "enterprise"],
      default: "free"
    },
    reportsUsed: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const materialityTopicSchema = new mongoose.Schema(
  {
    topicCode: {
      type: String,
      required: true
    },
    topicLabel: {
      type: String,
      required: true
    },
    impactMateriality: {
      severity: { type: Number, min: 1, max: 5, default: 1 },
      scale: { type: Number, min: 1, max: 5, default: 1 },
      scope: { type: Number, min: 1, max: 5, default: 1 },
      irremediability: { type: Number, min: 1, max: 5, default: 1 },
      likelihood: { type: Number, min: 1, max: 5, default: 1 }
    },
    financialMateriality: {
      magnitude: { type: Number, min: 1, max: 5, default: 1 },
      likelihood: { type: Number, min: 1, max: 5, default: 1 },
      timeHorizon: {
        type: String,
        enum: ["short", "medium", "long"],
        default: "medium"
      }
    },
    stakeholdersConsulted: {
      type: [String],
      default: []
    },
    isMaterial: {
      type: Boolean,
      default: false
    },
    rationale: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const evidenceSchema = new mongoose.Schema(
  {
    topicCode: { type: String, default: "" },
    disclosureReference: { type: String, default: "" },
    sourceType: { type: String, default: "" },
    sourceName: { type: String, default: "" },
    extractedValue: { type: String, default: "" },
    owner: { type: String, default: "" },
    reviewStatus: {
      type: String,
      enum: ["draft", "reviewed", "approved"],
      default: "draft"
    },
    confidenceLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    notes: { type: String, default: "" }
  },
  { _id: false }
);

const esrsReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    companyName: {
      type: String,
      required: true,
      trim: true
    },
    sector: {
      type: String,
      required: true,
      trim: true
    },
    reportingYear: {
      type: Number,
      required: true
    },
    reportingScope: {
      type: String,
      enum: ["individual", "consolidated"],
      default: "individual"
    },
    transitionalReliefUsed: {
      type: Boolean,
      default: false
    },

    esrs2: {
      governance: { type: String, default: "" },
      strategy: { type: String, default: "" },
      impactsRisksOpportunities: { type: String, default: "" },
      metricsTargets: { type: String, default: "" }
    },

    e1: {
      climateTransitionPlan: { type: String, default: "" },
      scope1Emissions: { type: Number, default: 0 },
      scope2Emissions: { type: Number, default: 0 },
      scope3Emissions: { type: Number, default: 0 },
      energyConsumption: { type: Number, default: 0 },
      climatePolicies: { type: String, default: "" },
      climateActions: { type: String, default: "" },
      climateTargets: { type: String, default: "" }
    },

    s1: {
      workforcePolicies: { type: String, default: "" },
      healthSafetyMetrics: { type: String, default: "" },
      diversityInclusion: { type: String, default: "" },
      remunerationMetrics: { type: String, default: "" }
    },

    g1: {
      businessConductPolicies: { type: String, default: "" },
      antiCorruption: { type: String, default: "" },
      whistleblowing: { type: String, default: "" },
      paymentPractices: { type: String, default: "" }
    },

    materialityTopics: {
      type: [materialityTopicSchema],
      default: []
    },

    evidence: {
      type: [evidenceSchema],
      default: []
    },

    aiDraft: {
      executiveSummary: { type: String, default: "" },
      disclosureDraft: { type: String, default: "" },
      dataGaps: { type: String, default: "" }
    },

    taxonomyMappingNotes: {
      type: String,
      default: ""
    },

    reviewStatus: {
      type: String,
      enum: ["draft", "in_review", "approved"],
      default: "draft"
    },

    scorecard: {
      benchmark: { type: Number, default: 0 },
      climateScore: { type: Number, default: 0 },
      socialScore: { type: Number, default: 0 },
      governanceScore: { type: Number, default: 0 },
      overallScore: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const ESRSReport =
  mongoose.models.ESRSReport || mongoose.model("ESRSReport", esrsReportSchema);

function parseToken(authHeader) {
  if (!authHeader) return null;
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  return authHeader.trim();
}

function auth(req, res, next) {
  const token = parseToken(req.headers.authorization);

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

function getBenchmarkBySector(sector) {
  const map = {
    tech: 75,
    energy: 55,
    manufacturing: 65,
    finance: 72,
    retail: 62,
    agriculture: 50
  };

  return map[sector] || 60;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function computePillarScores(report) {
  const climateBase =
    Math.max(0, 100 - toNumber(report.e1.scope1Emissions) * 0.1) * 0.4 +
    Math.max(0, 100 - toNumber(report.e1.scope2Emissions) * 0.1) * 0.3 +
    Math.max(0, 100 - toNumber(report.e1.scope3Emissions) * 0.05) * 0.2 +
    Math.max(0, 100 - toNumber(report.e1.energyConsumption) * 0.02) * 0.1;

  const socialCompleteness =
    [
      report.s1.workforcePolicies,
      report.s1.healthSafetyMetrics,
      report.s1.diversityInclusion,
      report.s1.remunerationMetrics
    ].filter(Boolean).length * 25;

  const governanceCompleteness =
    [
      report.g1.businessConductPolicies,
      report.g1.antiCorruption,
      report.g1.whistleblowing,
      report.g1.paymentPractices
    ].filter(Boolean).length * 25;

  const climateScore = Math.max(0, Math.min(100, Math.round(climateBase)));
  const socialScore = Math.max(0, Math.min(100, socialCompleteness));
  const governanceScore = Math.max(0, Math.min(100, governanceCompleteness));

  const overallScore = Math.round(
    climateScore * 0.4 + socialScore * 0.3 + governanceScore * 0.3
  );

  return {
    benchmark: getBenchmarkBySector(report.sector),
    climateScore,
    socialScore,
    governanceScore,
    overallScore
  };
}

function deriveAnalytics(reports) {
  const totalReports = reports.length;

  const averageScore = totalReports
    ? Math.round(
        reports.reduce(
          (sum, report) => sum + toNumber(report.scorecard?.overallScore),
          0
        ) / totalReports
      )
    : 0;

  const highRisk = reports.filter(
    (report) => toNumber(report.scorecard?.overallScore) < 60
  ).length;

  const moderateRisk = reports.filter((report) => {
    const score = toNumber(report.scorecard?.overallScore);
    return score >= 60 && score < 80;
  }).length;

  const lowRisk = reports.filter(
    (report) => toNumber(report.scorecard?.overallScore) >= 80
  ).length;

  const belowBenchmark = reports.filter(
    (report) =>
      toNumber(report.scorecard?.overallScore) <
      toNumber(report.scorecard?.benchmark)
  ).length;

  const approvedReports = reports.filter(
    (report) => report.reviewStatus === "approved"
  ).length;

  const materialTopicsCount = reports.reduce(
    (sum, report) =>
      sum +
      (Array.isArray(report.materialityTopics)
        ? report.materialityTopics.filter((topic) => topic.isMaterial).length
        : 0),
    0
  );

  return {
    totalReports,
    averageScore,
    highRisk,
    moderateRisk,
    lowRisk,
    belowBenchmark,
    approvedReports,
    materialTopicsCount
  };
}

function stringifyMateriality(topics = []) {
  if (!Array.isArray(topics) || topics.length === 0) {
    return "No materiality topics provided.";
  }

  return topics
    .map((topic) => {
      const impact = topic.impactMateriality || {};
      const financial = topic.financialMateriality || {};
      return [
        `Topic: ${topic.topicCode} - ${topic.topicLabel}`,
        `Material: ${topic.isMaterial ? "Yes" : "No"}`,
        `Rationale: ${topic.rationale || "N/A"}`,
        `Impact materiality => severity ${impact.severity || 0}, scale ${impact.scale || 0}, scope ${impact.scope || 0}, irremediability ${impact.irremediability || 0}, likelihood ${impact.likelihood || 0}`,
        `Financial materiality => magnitude ${financial.magnitude || 0}, likelihood ${financial.likelihood || 0}, horizon ${financial.timeHorizon || "N/A"}`
      ].join("\n");
    })
    .join("\n\n");
}

function addPdfSection(doc, title, body) {
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(13).text(title);
  doc.moveDown(0.2);
  doc.font("Helvetica").fontSize(11).text(body || "Not provided", {
    align: "left"
  });
}

function renderSingleReportToPdf(doc, report, index = null) {
  if (index !== null) {
    doc.font("Helvetica-Bold").fontSize(18).text(`Report ${index + 1}`, {
      align: "center"
    });
    doc.moveDown();
  }

  doc.font("Helvetica-Bold").fontSize(20).text("Ecovanta CSRD-Ready ESRS Report", {
    align: "center"
  });
  doc.moveDown();

  doc.font("Helvetica").fontSize(11);
  doc.text(`Company: ${report.companyName}`);
  doc.text(`Sector: ${report.sector}`);
  doc.text(`Reporting Year: ${report.reportingYear}`);
  doc.text(`Scope: ${report.reportingScope}`);
  doc.text(`Review Status: ${report.reviewStatus}`);
  doc.text(`Generated: ${new Date(report.createdAt).toLocaleString()}`);
  doc.moveDown();

  doc.font("Helvetica-Bold").fontSize(13).text("Scorecard");
  doc.font("Helvetica").fontSize(11);
  doc.text(`Benchmark: ${report.scorecard?.benchmark || 0}`);
  doc.text(`Climate Score: ${report.scorecard?.climateScore || 0}`);
  doc.text(`Social Score: ${report.scorecard?.socialScore || 0}`);
  doc.text(`Governance Score: ${report.scorecard?.governanceScore || 0}`);
  doc.text(`Overall Score: ${report.scorecard?.overallScore || 0}`);

  addPdfSection(doc, "ESRS 2 - Governance", report.esrs2?.governance);
  addPdfSection(doc, "ESRS 2 - Strategy", report.esrs2?.strategy);
  addPdfSection(
    doc,
    "ESRS 2 - Impacts, Risks and Opportunities",
    report.esrs2?.impactsRisksOpportunities
  );
  addPdfSection(doc, "ESRS 2 - Metrics and Targets", report.esrs2?.metricsTargets);

  addPdfSection(
    doc,
    "E1 - Climate Transition Plan",
    report.e1?.climateTransitionPlan
  );
  addPdfSection(doc, "E1 - Climate Policies", report.e1?.climatePolicies);
  addPdfSection(doc, "E1 - Climate Actions", report.e1?.climateActions);
  addPdfSection(doc, "E1 - Climate Targets", report.e1?.climateTargets);

  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(13).text("E1 Metrics");
  doc.font("Helvetica").fontSize(11);
  doc.text(`Scope 1 Emissions: ${report.e1?.scope1Emissions || 0}`);
  doc.text(`Scope 2 Emissions: ${report.e1?.scope2Emissions || 0}`);
  doc.text(`Scope 3 Emissions: ${report.e1?.scope3Emissions || 0}`);
  doc.text(`Energy Consumption: ${report.e1?.energyConsumption || 0}`);

  addPdfSection(doc, "S1 - Workforce Policies", report.s1?.workforcePolicies);
  addPdfSection(doc, "S1 - Health & Safety", report.s1?.healthSafetyMetrics);
  addPdfSection(doc, "S1 - Diversity & Inclusion", report.s1?.diversityInclusion);
  addPdfSection(doc, "S1 - Remuneration", report.s1?.remunerationMetrics);

  addPdfSection(
    doc,
    "G1 - Business Conduct Policies",
    report.g1?.businessConductPolicies
  );
  addPdfSection(doc, "G1 - Anti-Corruption", report.g1?.antiCorruption);
  addPdfSection(doc, "G1 - Whistleblowing", report.g1?.whistleblowing);
  addPdfSection(doc, "G1 - Payment Practices", report.g1?.paymentPractices);

  addPdfSection(
    doc,
    "Double Materiality Assessment",
    stringifyMateriality(report.materialityTopics)
  );

  addPdfSection(
    doc,
    "AI Executive Summary",
    report.aiDraft?.executiveSummary || "Not generated"
  );
  addPdfSection(
    doc,
    "AI Disclosure Draft",
    report.aiDraft?.disclosureDraft || "Not generated"
  );
  addPdfSection(doc, "AI Data Gaps", report.aiDraft?.dataGaps || "Not generated");

  addPdfSection(
    doc,
    "Taxonomy Mapping Notes",
    report.taxonomyMappingNotes || "Not provided"
  );

  const evidenceSummary =
    Array.isArray(report.evidence) && report.evidence.length
      ? report.evidence
          .map(
            (item) =>
              `${item.topicCode || "N/A"} | ${item.disclosureReference || "N/A"} | ${item.sourceType || "N/A"} | ${item.sourceName || "N/A"} | ${item.reviewStatus || "draft"}`
          )
          .join("\n")
      : "No evidence items provided.";

  addPdfSection(doc, "Evidence Summary", evidenceSummary);
}

app.get("/", (req, res) => {
  res.send("Ecovanta CSRD-ready backend running");
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

app.post("/register", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const companyName = String(req.body?.companyName || "").trim();

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      companyName
    });

    return res.status(201).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        companyName: user.companyName,
        plan: user.plan,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      error: "Failed to register user",
      details: error.message
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        plan: user.plan,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        companyName: user.companyName,
        plan: user.plan,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "Login failed",
      details: error.message
    });
  }
});

app.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({
      error: "Failed to load user",
      details: error.message
    });
  }
});

app.get("/benchmark/:sector", (req, res) => {
  return res.json({
    benchmark: getBenchmarkBySector(req.params.sector)
  });
});

app.post("/ai-draft", auth, async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(400).json({
        error: "OPENAI_API_KEY is not configured"
      });
    }

    const payload = req.body || {};

    const prompt = `
You are helping draft CSRD-ready, ESRS-aligned sustainability disclosures.

Company: ${payload.companyName || "Unknown"}
Sector: ${payload.sector || "Unknown"}
Reporting year: ${payload.reportingYear || "Unknown"}

ESRS 2:
Governance: ${payload.esrs2?.governance || ""}
Strategy: ${payload.esrs2?.strategy || ""}
Impacts/Risks/Opportunities: ${payload.esrs2?.impactsRisksOpportunities || ""}
Metrics/Targets: ${payload.esrs2?.metricsTargets || ""}

E1:
Transition plan: ${payload.e1?.climateTransitionPlan || ""}
Policies: ${payload.e1?.climatePolicies || ""}
Actions: ${payload.e1?.climateActions || ""}
Targets: ${payload.e1?.climateTargets || ""}
Scope 1: ${payload.e1?.scope1Emissions || 0}
Scope 2: ${payload.e1?.scope2Emissions || 0}
Scope 3: ${payload.e1?.scope3Emissions || 0}
Energy: ${payload.e1?.energyConsumption || 0}

S1:
Policies: ${payload.s1?.workforcePolicies || ""}
Health and safety: ${payload.s1?.healthSafetyMetrics || ""}
Diversity: ${payload.s1?.diversityInclusion || ""}
Remuneration: ${payload.s1?.remunerationMetrics || ""}

G1:
Policies: ${payload.g1?.businessConductPolicies || ""}
Anti-corruption: ${payload.g1?.antiCorruption || ""}
Whistleblowing: ${payload.g1?.whistleblowing || ""}
Payment practices: ${payload.g1?.paymentPractices || ""}

Double materiality topics:
${stringifyMateriality(payload.materialityTopics || [])}

Produce JSON with keys:
{
  "executiveSummary": "...",
  "disclosureDraft": "...",
  "dataGaps": "..."
}

Be practical. Flag missing data clearly. Do not claim legal compliance.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }]
    });

    const raw = response?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    return res.json({
      executiveSummary: parsed.executiveSummary || "",
      disclosureDraft: parsed.disclosureDraft || "",
      dataGaps: parsed.dataGaps || ""
    });
  } catch (error) {
    console.error("AI draft error:", error);
    return res.status(500).json({
      error: "AI draft generation failed",
      details: error.message
    });
  }
});

app.post("/reports", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.plan === "free" && user.reportsUsed >= 5) {
      return res.status(403).json({
        error: "Free plan limit reached. Upgrade to create more reports."
      });
    }

    const companyName = String(req.body?.companyName || "").trim();
    const sector = String(req.body?.sector || "").trim();
    const reportingYear = toNumber(req.body?.reportingYear, new Date().getFullYear());
    const reportingScope = String(req.body?.reportingScope || "individual");

    if (!companyName) {
      return res.status(400).json({ error: "Company name is required" });
    }

    if (!sector) {
      return res.status(400).json({ error: "Sector is required" });
    }

    const reportPayload = {
      userId: user._id,
      companyName,
      sector,
      reportingYear,
      reportingScope,
      transitionalReliefUsed: Boolean(req.body?.transitionalReliefUsed),
      esrs2: {
        governance: String(req.body?.esrs2?.governance || ""),
        strategy: String(req.body?.esrs2?.strategy || ""),
        impactsRisksOpportunities: String(
          req.body?.esrs2?.impactsRisksOpportunities || ""
        ),
        metricsTargets: String(req.body?.esrs2?.metricsTargets || "")
      },
      e1: {
        climateTransitionPlan: String(req.body?.e1?.climateTransitionPlan || ""),
        scope1Emissions: toNumber(req.body?.e1?.scope1Emissions, 0),
        scope2Emissions: toNumber(req.body?.e1?.scope2Emissions, 0),
        scope3Emissions: toNumber(req.body?.e1?.scope3Emissions, 0),
        energyConsumption: toNumber(req.body?.e1?.energyConsumption, 0),
        climatePolicies: String(req.body?.e1?.climatePolicies || ""),
        climateActions: String(req.body?.e1?.climateActions || ""),
        climateTargets: String(req.body?.e1?.climateTargets || "")
      },
      s1: {
        workforcePolicies: String(req.body?.s1?.workforcePolicies || ""),
        healthSafetyMetrics: String(req.body?.s1?.healthSafetyMetrics || ""),
        diversityInclusion: String(req.body?.s1?.diversityInclusion || ""),
        remunerationMetrics: String(req.body?.s1?.remunerationMetrics || "")
      },
      g1: {
        businessConductPolicies: String(
          req.body?.g1?.businessConductPolicies || ""
        ),
        antiCorruption: String(req.body?.g1?.antiCorruption || ""),
        whistleblowing: String(req.body?.g1?.whistleblowing || ""),
        paymentPractices: String(req.body?.g1?.paymentPractices || "")
      },
      materialityTopics: Array.isArray(req.body?.materialityTopics)
        ? req.body.materialityTopics
        : [],
      evidence: Array.isArray(req.body?.evidence) ? req.body.evidence : [],
      aiDraft: {
        executiveSummary: String(req.body?.aiDraft?.executiveSummary || ""),
        disclosureDraft: String(req.body?.aiDraft?.disclosureDraft || ""),
        dataGaps: String(req.body?.aiDraft?.dataGaps || "")
      },
      taxonomyMappingNotes: String(req.body?.taxonomyMappingNotes || ""),
      reviewStatus: String(req.body?.reviewStatus || "draft")
    };

    reportPayload.scorecard = computePillarScores(reportPayload);

    const report = await ESRSReport.create(reportPayload);

    user.reportsUsed += 1;
    await user.save();

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
    const reports = await ESRSReport.find({ userId: req.user.userId }).sort({
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

app.get("/reports/:id", auth, async (req, res) => {
  try {
    const report = await ESRSReport.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    return res.json(report);
  } catch (error) {
    console.error("Get single report error:", error);
    return res.status(500).json({
      error: "Failed to fetch report",
      details: error.message
    });
  }
});

app.put("/reports/:id", auth, async (req, res) => {
  try {
    const existing = await ESRSReport.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!existing) {
      return res.status(404).json({ error: "Report not found" });
    }

    const updatePayload = {
      companyName: String(req.body?.companyName || existing.companyName).trim(),
      sector: String(req.body?.sector || existing.sector).trim(),
      reportingYear: toNumber(req.body?.reportingYear, existing.reportingYear),
      reportingScope: String(req.body?.reportingScope || existing.reportingScope),
      transitionalReliefUsed:
        req.body?.transitionalReliefUsed ?? existing.transitionalReliefUsed,
      esrs2: req.body?.esrs2 || existing.esrs2,
      e1: {
        ...existing.e1.toObject?.(),
        ...(req.body?.e1 || {})
      },
      s1: {
        ...existing.s1.toObject?.(),
        ...(req.body?.s1 || {})
      },
      g1: {
        ...existing.g1.toObject?.(),
        ...(req.body?.g1 || {})
      },
      materialityTopics: Array.isArray(req.body?.materialityTopics)
        ? req.body.materialityTopics
        : existing.materialityTopics,
      evidence: Array.isArray(req.body?.evidence)
        ? req.body.evidence
        : existing.evidence,
      aiDraft: req.body?.aiDraft || existing.aiDraft,
      taxonomyMappingNotes:
        req.body?.taxonomyMappingNotes ?? existing.taxonomyMappingNotes,
      reviewStatus: req.body?.reviewStatus || existing.reviewStatus
    };

    updatePayload.scorecard = computePillarScores(updatePayload);

    const report = await ESRSReport.findByIdAndUpdate(
      existing._id,
      updatePayload,
      { new: true }
    );

    return res.json(report);
  } catch (error) {
    console.error("Update report error:", error);
    return res.status(500).json({
      error: "Failed to update report",
      details: error.message
    });
  }
});

app.delete("/reports/:id", auth, async (req, res) => {
  try {
    const deleted = await ESRSReport.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!deleted) {
      return res.status(404).json({ error: "Report not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Delete report error:", error);
    return res.status(500).json({
      error: "Failed to delete report",
      details: error.message
    });
  }
});

app.get("/analytics/overview", auth, async (req, res) => {
  try {
    const reports = await ESRSReport.find({ userId: req.user.userId });
    return res.json(deriveAnalytics(reports));
  } catch (error) {
    console.error("Analytics error:", error);
    return res.status(500).json({
      error: "Failed to load analytics",
      details: error.message
    });
  }
});

app.get("/reports/download/pdf", auth, async (req, res) => {
  try {
    const reports = await ESRSReport.find({ userId: req.user.userId }).sort({
      createdAt: -1
    });

    if (!reports.length) {
      return res.status(404).json({ error: "No reports found" });
    }

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="ecovanta_all_reports.pdf"'
    );

    doc.pipe(res);

    reports.forEach((report, index) => {
      if (index > 0) {
        doc.addPage();
      }
      renderSingleReportToPdf(doc, report, index);
    });

    doc.end();
  } catch (error) {
    console.error("Download all reports PDF error:", error);
    return res.status(500).json({
      error: "Failed to generate all-reports PDF",
      details: error.message
    });
  }
});

app.get("/reports/:id/download/pdf", auth, async (req, res) => {
  try {
    const report = await ESRSReport.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const safeName = (report.companyName || "report").replace(/[^a-z0-9]/gi, "_");
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeName}_esrs_report.pdf"`
    );

    doc.pipe(res);
    renderSingleReportToPdf(doc, report);
    doc.end();
  } catch (error) {
    console.error("Download single report PDF error:", error);
    return res.status(500).json({
      error: "Failed to generate single-report PDF",
      details: error.message
    });
  }
});

app.use((req, res) => {
  return res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);
  return res.status(500).json({
    error: "Internal server error",
    details: error.message
  });
});

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