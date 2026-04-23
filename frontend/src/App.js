import { PLAN_KEYS, canAccess, getPlanConfig } from "./plans";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from "recharts";
import HelpTooltip from "./components/HelpTooltip";
import { HELP } from "./helpContent";
import EcovantaLandingPage from "./EcovantaLandingPage";
import { calculateBig4ESGScore } from "./esgScoring";
const API = "https://ecovanta.onrender.com";

const defaultMaterialityTopic = {
  topicCode: "E1",
  topicLabel: "Climate change",
  impactMateriality: {
    severity: 3,
    scale: 3,
    scope: 3,
    irremediability: 3,
    likelihood: 3
  },
  financialMateriality: {
    magnitude: 3,
    likelihood: 3,
    timeHorizon: "medium"
  },
  stakeholdersConsulted: "",
  isMaterial: true,
  rationale: "",
  impactScore100: 0,
  financialScore100: 0,
  overallMaterialityScore: 0
};

const initialReportForm = {
  companyName: "",
  sector: "tech",
  reportingYear: new Date().getFullYear(),
  esrs2: {
    governance: "",
    strategy: "",
    impactsRisksOpportunities: "",
    metricsTargets: ""
  },
  e1: {
    scope1Emissions: 0,
    scope2Emissions: 0,
    scope3Emissions: 0,
    climatePolicies: ""
  },
  s1: {
    workforcePolicies: "",
    diversityInclusion: ""
  },
  g1: {
    antiCorruption: "",
    whistleblowing: ""
  },
  aiDraft: {
    executiveSummary: "",
    disclosureDraft: "",
    dataGaps: "",
    recommendations: ""
  },
  scorecard: {
    benchmark: 0,
    overallScore: 0
  },
  reviewStatus: "draft",
  materialityTopics: [{ ...defaultMaterialityTopic }]
};

const DEFAULT_SECTOR_BENCHMARKS = {
  tech: { sectorAverage: 65, topQuartile: 82 },
  energy: { sectorAverage: 58, topQuartile: 78 },
  manufacturing: { sectorAverage: 61, topQuartile: 79 }
};

const getTimeHorizonScore = (timeHorizon) => {
  if (timeHorizon === "short") return 5;
  if (timeHorizon === "medium") return 3;
  if (timeHorizon === "long") return 2;
  return 3;
};

const calculateMaterialityScores = (topic) => {
  const impact = topic?.impactMateriality || {};
  const financial = topic?.financialMateriality || {};

  const impactRaw =
    Number(impact.severity || 0) * 0.3 +
    Number(impact.scale || 0) * 0.2 +
    Number(impact.scope || 0) * 0.2 +
    Number(impact.irremediability || 0) * 0.15 +
    Number(impact.likelihood || 0) * 0.15;

  const financialRaw =
    Number(financial.magnitude || 0) * 0.5 +
    Number(financial.likelihood || 0) * 0.3 +
    getTimeHorizonScore(financial.timeHorizon) * 0.2;

  const impactScore100 = Math.round((impactRaw / 5) * 100);
  const financialScore100 = Math.round((financialRaw / 5) * 100);
  const overallMaterialityScore = Math.max(
    impactScore100,
    financialScore100
  );
  const isMaterial = overallMaterialityScore >= 60;

  return {
    impactScore100,
    financialScore100,
    overallMaterialityScore,
    isMaterial
  };
};

const calculateOverallESGScore = (form) => {
  const eScores = [
    form.e1?.scope1Emissions > 0 ? 3 : 1,
    form.e1?.scope2Emissions > 0 ? 3 : 1,
    form.e1?.scope3Emissions > 0 ? 3 : 1,
    form.e1?.climatePolicies ? 4 : 1
  ];

  const sScores = [
    form.s1?.workforcePolicies ? 4 : 1,
    form.s1?.diversityInclusion ? 4 : 1
  ];

  const gScores = [
    form.g1?.antiCorruption ? 4 : 1,
    form.g1?.whistleblowing ? 4 : 1
  ];

  const allScores = [...eScores, ...sScores, ...gScores];
  const avg5 =
    allScores.reduce((sum, value) => sum + value, 0) / allScores.length;

  return Math.round((avg5 / 5) * 100);
};

const getBenchmarkComparisonData = (reportForm, analytics) => {
  const sector = reportForm?.sector || "tech";
  const sectorBenchmarks =
    DEFAULT_SECTOR_BENCHMARKS[sector] || DEFAULT_SECTOR_BENCHMARKS.tech;

  return [
    {
      name: "Company",
      value: Number(
        reportForm?.scorecard?.overallScore || analytics?.averageScore || 0
      )
    },
    {
      name: "Sector Avg",
      value: sectorBenchmarks.sectorAverage
    },
    {
      name: "Top Quartile",
      value: sectorBenchmarks.topQuartile
    }
  ];
};

const getMaterialityHeatmapData = (materialityTopics = []) => {
  return materialityTopics.map((topic, index) => ({
    x: Number(topic.financialScore100 || 0),
    y: Number(topic.impactScore100 || 0),
    z: 100,
    name: topic.topicCode || `Topic ${index + 1}`,
    label: topic.topicLabel || "",
    overall: Number(topic.overallMaterialityScore || 0),
    result: topic.isMaterial ? "Material" : "Not Material"
  }));
};

const getComplianceGapData = (reportForm) => {
  const e1Missing = [];
  if (!reportForm?.e1?.scope1Emissions) e1Missing.push("Scope 1 emissions");
  if (!reportForm?.e1?.scope2Emissions) e1Missing.push("Scope 2 emissions");
  if (!reportForm?.e1?.scope3Emissions) e1Missing.push("Scope 3 emissions");
  if (!reportForm?.e1?.climatePolicies?.trim()) {
    e1Missing.push("Climate policies");
  }

  const esrs2Missing = [];
  if (!reportForm?.esrs2?.governance?.trim()) {
    esrs2Missing.push("Governance");
  }
  if (!reportForm?.esrs2?.strategy?.trim()) {
    esrs2Missing.push("Strategy");
  }
  if (!reportForm?.esrs2?.impactsRisksOpportunities?.trim()) {
    esrs2Missing.push("Impacts, risks and opportunities");
  }
  if (!reportForm?.esrs2?.metricsTargets?.trim()) {
    esrs2Missing.push("Metrics and targets");
  }

  const s1Missing = [];
  if (!reportForm?.s1?.workforcePolicies?.trim()) {
    s1Missing.push("Workforce policies");
  }
  if (!reportForm?.s1?.diversityInclusion?.trim()) {
    s1Missing.push("Diversity & inclusion");
  }

  const g1Missing = [];
  if (!reportForm?.g1?.antiCorruption?.trim()) {
    g1Missing.push("Anti-corruption");
  }
  if (!reportForm?.g1?.whistleblowing?.trim()) {
    g1Missing.push("Whistleblowing");
  }

  const materialityMissing = [];
  if (
    !Array.isArray(reportForm?.materialityTopics) ||
    reportForm.materialityTopics.length === 0
  ) {
    materialityMissing.push("Materiality topics");
  } else {
    reportForm.materialityTopics.forEach((topic, index) => {
      if (!topic.topicCode?.trim()) {
        materialityMissing.push(`Topic ${index + 1}: topic code`);
      }
      if (!topic.topicLabel?.trim()) {
        materialityMissing.push(`Topic ${index + 1}: topic label`);
      }
      if (!topic.rationale?.trim()) {
        materialityMissing.push(`Topic ${index + 1}: rationale`);
      }
      if (!topic.stakeholdersConsulted?.trim()) {
        materialityMissing.push(`Topic ${index + 1}: stakeholders consulted`);
      }
    });
  }

  const sections = [
    { key: "ESRS 2", missing: esrs2Missing, total: 4 },
    { key: "E1 Climate", missing: e1Missing, total: 4 },
    { key: "S1 Workforce", missing: s1Missing, total: 2 },
    { key: "G1 Business Conduct", missing: g1Missing, total: 2 },
    {
      key: "Materiality",
      missing: materialityMissing,
      total: Math.max(reportForm?.materialityTopics?.length || 1, 1) * 4
    }
  ];

  return sections.map((section) => {
    const completeness = Math.max(
      0,
      Math.round(
        ((section.total - section.missing.length) / section.total) * 100
      )
    );

    return {
      section: section.key,
      completeness,
      missing: section.missing
    };
  });
};

const getPriorityColor = (priority) => {
  const value = String(priority || "").toLowerCase();

  if (value === "high") {
    return {
      bg: "#fee2e2",
      text: "#991b1b",
      border: "#fecaca"
    };
  }

  if (value === "medium") {
    return {
      bg: "#fef3c7",
      text: "#92400e",
      border: "#fde68a"
    };
  }

  return {
    bg: "#dcfce7",
    text: "#166534",
    border: "#bbf7d0"
  };
};

const parseRecommendationsText = (rawText) => {
  if (!rawText || typeof rawText !== "string") return [];

  const blocks = rawText
    .split(/\n\s*\n(?=\d+\.)/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block.split("\n").map((line) => line.trim());

    const title = (lines[0] || "").replace(/^\d+\.\s*/, "").trim();

    const getField = (label) => {
      const line = lines.find((l) => l.startsWith(`${label}:`));
      return line ? line.replace(`${label}:`, "").trim() : "";
    };

    const category = getField("Category");
    const priority = getField("Priority");
    const timeline = getField("Timeline");
    const esrsReference = getField("ESRS Reference");

    const extractSectionLines = (sectionTitle, nextSectionTitles = []) => {
      const startIndex = lines.findIndex((l) => l === sectionTitle);
      if (startIndex === -1) return [];

      let endIndex = lines.length;

      for (const nextTitle of nextSectionTitles) {
        const foundIndex = lines.findIndex(
          (l, i) => i > startIndex && l === nextTitle
        );
        if (foundIndex !== -1 && foundIndex < endIndex) {
          endIndex = foundIndex;
        }
      }

      return lines
        .slice(startIndex + 1, endIndex)
        .map((l) => l.trim())
        .filter(Boolean);
    };

    const currentGap = extractSectionLines("Current Gap:", [
      "Risk / Impact:",
      "Recommended Actions:",
      "Suggested KPIs:"
    ]).join(" ");

    const riskImpact = extractSectionLines("Risk / Impact:", [
      "Recommended Actions:",
      "Suggested KPIs:"
    ]).join(" ");

    const actions = extractSectionLines("Recommended Actions:", [
      "Suggested KPIs:"
    ]).map((line) => line.replace(/^- /, "").trim());

    const suggestedKPIs = extractSectionLines("Suggested KPIs:").map((line) =>
      line.replace(/^- /, "").trim()
    );

    return {
      id: `${title}-${index}`,
      title,
      category,
      priority,
      timeline,
      esrsReference,
      currentGap,
      riskImpact,
      actions,
      suggestedKPIs
    };
  });
};

function GuidedSteps({ step }) {
  const steps = [
    "Fill Company Information",
    "Complete ESRS 2",
    "Add ESG Data",
    "Define Materiality",
    "Generate AI Draft",
    "Review & Export"
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        marginBottom: "20px",
        flexWrap: "wrap"
      }}
    >
      {steps.map((label, index) => (
        <div
          key={index}
          style={{
            padding: "8px 12px",
            borderRadius: "999px",
            background: index <= step ? "#7c3aed" : "#e5e7eb",
            color: index <= step ? "#fff" : "#374151",
            fontSize: "12px",
            fontWeight: "bold"
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

function FieldLabel({ children, helpKey }) {
  return (
    <label
      style={{
        fontWeight: "bold",
        display: "inline-flex",
        alignItems: "center",
        marginBottom: "6px"
      }}
    >
      {children}
      <HelpTooltip content={HELP[helpKey]} />
    </label>
  );
}

//function App() {
  function MainPlatform() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");

  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    companyName: ""
  });

  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalReports: 0,
    averageScore: 0,
    highRisk: 0,
    moderateRisk: 0,
    lowRisk: 0
  });

  const [benchmark, setBenchmark] = useState(60);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [reportForm, setReportForm] = useState(initialReportForm);
  const [recommendationFilter, setRecommendationFilter] = useState("all");

   const currentPlan = user?.plan || PLAN_KEYS.FREE;
  const currentPlanConfig = getPlanConfig(currentPlan);

  const hasAiDraftAccess = canAccess(currentPlan, "aiDraft");
  const hasPdfExportAccess = canAccess(currentPlan, "pdfExport");
  const hasAdvancedAnalyticsAccess = canAccess(currentPlan, "advancedAnalytics");
  const hasWorkflowAccess = canAccess(currentPlan, "workflow");
  const hasAuditTrailAccess = canAccess(currentPlan, "auditTrail");


  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const fetchJson = useCallback(async (url, options = {}) => {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type") || "";

    let data;
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const message =
        typeof data === "string"
          ? data
          : data?.error || data?.details || "Request failed";
      throw new Error(message);
    }

    return data;
  }, []);

  const normalizeAiDraft = useCallback((aiDraft) => {
    return {
      executiveSummary:
        typeof aiDraft?.executiveSummary === "string"
          ? aiDraft.executiveSummary
          : JSON.stringify(aiDraft?.executiveSummary ?? "", null, 2),

      disclosureDraft:
        typeof aiDraft?.disclosureDraft === "string"
          ? aiDraft.disclosureDraft
          : JSON.stringify(aiDraft?.disclosureDraft ?? "", null, 2),

      dataGaps:
        typeof aiDraft?.dataGaps === "string"
          ? aiDraft.dataGaps
          : Array.isArray(aiDraft?.dataGaps)
          ? aiDraft.dataGaps.join("\n- ")
          : JSON.stringify(aiDraft?.dataGaps ?? "", null, 2),

      recommendations:
        typeof aiDraft?.recommendations === "string"
          ? aiDraft.recommendations
          : Array.isArray(aiDraft?.recommendations)
          ? aiDraft.recommendations.join("\n- ")
          : JSON.stringify(aiDraft?.recommendations ?? "", null, 2)
    };
  }, []);

  const handleAuthField = (field, value) => {
    setAuthForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const setTopField = (field, value) => {
    setReportForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const setNestedField = (section, field, value) => {
    setReportForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const isEditable = () => {
    if (reportForm.reviewStatus === "draft") return true;

    if (
      reportForm.reviewStatus === "in_review" &&
      ["reviewer", "approver", "admin"].includes(user?.role)
    ) {
      return true;
    }

    return false;
  };

  const login = useCallback(async () => {
    try {
      setLoading(true);
      setStatusMessage("");

      const data = await fetchJson(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password
        })
      });

      setToken(data.token);
      localStorage.setItem("token", data.token);
      setStatusMessage("Logged in successfully.");
    } catch (err) {
      console.error("Login error:", err);
      setStatusMessage(`Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [authForm.email, authForm.password, fetchJson]);

  const register = useCallback(async () => {
    try {
      setLoading(true);
      setStatusMessage("");

      await fetchJson(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password,
          companyName: authForm.companyName
        })
      });

      setStatusMessage("Registration successful. Please log in.");
      setAuthMode("login");
      setAuthForm((prev) => ({
        ...prev,
        password: ""
      }));
    } catch (err) {
      console.error("Register error:", err);
      setStatusMessage(`Register failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [authForm.email, authForm.password, authForm.companyName, fetchJson]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setReports([]);
    setAuditLogs([]);
    setSelectedReportId("");
    setReportForm(initialReportForm);
    setStatusMessage("Logged out.");
  };

  const loadUser = useCallback(async () => {
    if (!token) return;

    try {
      const data = await fetchJson(`${API}/auth/me`, {
        headers: authHeaders
      });
      setUser(data);
    } catch (err) {
      console.error("Load user error:", err);
    }
  }, [token, authHeaders, fetchJson]);

  const loadReports = useCallback(async () => {
    if (!token) return;

    try {
      const data = await fetchJson(`${API}/reports`, {
        headers: authHeaders
      });
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load reports error:", err);
      setStatusMessage(`Could not load reports: ${err.message}`);
    }
  }, [token, authHeaders, fetchJson]);

  const loadAnalytics = useCallback(async () => {
    if (!token) return;

    try {
      const data = await fetchJson(`${API}/reports`, {
        headers: authHeaders
      });

      const safeReports = Array.isArray(data) ? data : [];
      const scores = safeReports.map((report) =>
        Number(report.scorecard?.overallScore || 0)
      );

      const totalReports = safeReports.length;
      const averageScore = totalReports
        ? Math.round(
            scores.reduce((sum, value) => sum + value, 0) / totalReports
          )
        : 0;

      const highRisk = scores.filter((score) => score < 60).length;
      const moderateRisk = scores.filter(
        (score) => score >= 60 && score < 80
      ).length;
      const lowRisk = scores.filter((score) => score >= 80).length;

      setAnalytics({
        totalReports,
        averageScore,
        highRisk,
        moderateRisk,
        lowRisk
      });
    } catch (err) {
      console.error("Load analytics error:", err);
    }
  }, [token, authHeaders, fetchJson]);

 const loadAuditLogs = useCallback(async () => {
  if (!token || !canAccess(currentPlan, "auditTrail")) {
    setAuditLogs([]);
    return;
  }

    try {
      const data = await fetchJson(`${API}/audit`, {
        headers: authHeaders
      });
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load audit logs error:", err);
    }
}, [token, authHeaders, fetchJson, currentPlan]);

  const loadBenchmark = useCallback(async () => {
    try {
      const data = await fetchJson(`${API}/benchmark/${reportForm.sector}`);
      setBenchmark(Number(data.benchmark || 60));
    } catch (err) {
      console.error("Load benchmark error:", err);
      setBenchmark(
        DEFAULT_SECTOR_BENCHMARKS[reportForm.sector]?.sectorAverage || 60
      );
    }
  }, [reportForm.sector, fetchJson]);

  const refreshDashboard = useCallback(async () => {
    await Promise.all([
      loadUser(),
      loadReports(),
      loadAnalytics(),
      loadAuditLogs()
    ]);
  }, [loadUser, loadReports, loadAnalytics, loadAuditLogs]);

  useEffect(() => {
    if (!token) return;
    refreshDashboard();
  }, [token, refreshDashboard]);

  useEffect(() => {
    loadBenchmark();
  }, [loadBenchmark]);

  const updateReportStatus = async (reportId, status) => {
    if (!token) {
      alert("Login required.");
      return;
    }

   if (
  !requireFeature(
    "workflow",
    "Workflow features are available on Enterprise only."
  )
) {
  return;
}

    try {
      const res = await fetch(`${API}/reports/${reportId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setStatusMessage(`Status updated to ${status}`);
      await refreshDashboard();
    } catch (err) {
      console.error("Status update error:", err);
      alert(`Failed: ${err.message}`);
    }
  };

const requireFeature = (featureName, message) => {
  if (!canAccess(currentPlan, featureName)) {
    alert(message);
    return false;
  }
  return true;
};

  const upgradePlan = async (plan) => {
    if (!token) {
      alert("Login required.");
      return;
    }

    try {
      const data = await fetchJson(`${API}/billing/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify({ plan })
      });

      window.location.href = data.url;
    } catch (err) {
      console.error("Upgrade error:", err);
      alert(`Upgrade failed: ${err.message}`);
    }
  };

  const cancelSubscription = async () => {
    if (!token) {
      alert("Login required.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel your subscription?"
    );

    if (!confirmed) return;

    try {
      const data = await fetchJson(`${API}/billing/cancel-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        }
      });

      setStatusMessage(data.message || "Subscription cancellation requested.");
      await refreshDashboard();
    } catch (err) {
      console.error("Cancel subscription error:", err);
      alert(`Cancel failed: ${err.message}`);
    }
  };

  const addMaterialityTopic = () => {
    setReportForm((prev) => ({
      ...prev,
      materialityTopics: [
        ...prev.materialityTopics,
        { ...defaultMaterialityTopic }
      ]
    }));
  };

  const removeMaterialityTopic = (index) => {
    setReportForm((prev) => ({
      ...prev,
      materialityTopics: prev.materialityTopics.filter((_, i) => i !== index)
    }));
  };

  const updateMaterialityTopic = (index, path, value) => {
    setReportForm((prev) => {
      const nextTopics = [...prev.materialityTopics];
      const current = { ...nextTopics[index] };

      if (path.includes(".")) {
        const [section, field] = path.split(".");
        current[section] = {
          ...current[section],
          [field]: value
        };
      } else {
        current[path] = value;
      }

      const scores = calculateMaterialityScores(current);

      nextTopics[index] = {
        ...current,
        impactScore100: scores.impactScore100,
        financialScore100: scores.financialScore100,
        overallMaterialityScore: scores.overallMaterialityScore,
        isMaterial: scores.isMaterial
      };

      return {
        ...prev,
        materialityTopics: nextTopics
      };
    });
  };

  const generateAiDraft = async () => {
    if (!token) {
      alert("Login required.");
      return;
    }

   if (
  !requireFeature(
    "aiDraft",
    "AI Draft is available on Pro and Enterprise plans only."
  )
) {
  return;
}

    const payload = {
      companyName: String(reportForm.companyName || "").trim(),
      sector: String(reportForm.sector || "").trim(),
      reportingYear: reportForm.reportingYear,
      esrs2: reportForm.esrs2,
      e1: reportForm.e1,
      s1: reportForm.s1,
      g1: reportForm.g1,
      materialityTopics: reportForm.materialityTopics.map((topic) => {
        const scores = calculateMaterialityScores(topic);

        return {
          ...topic,
          stakeholdersConsulted: topic.stakeholdersConsulted
            ? topic.stakeholdersConsulted
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          impactScore100: scores.impactScore100,
          financialScore100: scores.financialScore100,
          overallMaterialityScore: scores.overallMaterialityScore,
          isMaterial: scores.isMaterial
        };
      })
    };

    if (!payload.companyName || !payload.sector) {
      setStatusMessage(
        "Company name and sector must be filled before AI draft."
      );
      return;
    }

    try {
      setAiLoading(true);
      setStatusMessage("");

      const data = await fetchJson(`${API}/ai/ai-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify(payload)
      });

      setReportForm((prev) => ({
        ...prev,
        aiDraft: {
          ...prev.aiDraft,
          executiveSummary: data.executiveSummary || "",
          disclosureDraft: data.disclosureDraft || "",
          dataGaps: data.dataGaps || "",
          recommendations: data.recommendations || ""
        }
      }));

      setStatusMessage("AI draft generated.");
    } catch (err) {
      console.error("AI draft error:", err);
      setStatusMessage(`AI draft failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const saveReport = async () => {
    if (!token) {
      alert("Login required.");
      return;
    }

    if (!reportForm.companyName.trim()) {
      alert("Company name is required.");
      return;
    }

    try {
      setLoading(true);
      setStatusMessage("");

      const {
      overallScore,
      riskLevel,
      pillarScores
      } = calculateBig4ESGScore(reportForm);

      const payload = {
        ...reportForm,
        aiDraft: normalizeAiDraft({
          executiveSummary: reportForm.aiDraft?.executiveSummary || "",
          disclosureDraft: reportForm.aiDraft?.disclosureDraft || "",
          dataGaps: reportForm.aiDraft?.dataGaps || "",
          recommendations: reportForm.aiDraft?.recommendations || ""
        }),
        scorecard: {
        benchmark,
        overallScore,
        riskLevel,
        pillarScores
        },
        materialityTopics: reportForm.materialityTopics.map((topic) => {
          const scores = calculateMaterialityScores(topic);

          return {
            ...topic,
            stakeholdersConsulted: topic.stakeholdersConsulted
              ? topic.stakeholdersConsulted
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              : [],
            impactScore100: scores.impactScore100,
            financialScore100: scores.financialScore100,
            overallMaterialityScore: scores.overallMaterialityScore,
            isMaterial: scores.isMaterial
          };
        })
      };

      const saved = await fetchJson(`${API}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify(payload)
      });

      setReports((prev) => [saved, ...prev]);
      setSelectedReportId(saved._id || "");
      setReportForm(initialReportForm);
      setStatusMessage("Report saved successfully.");
      await refreshDashboard();
    } catch (err) {
      console.error("Save report error:", err);
      setStatusMessage(`Save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadReportIntoForm = async (reportId) => {
    if (!reportId) return;

    const found = reports.find((item) => (item._id || item.id) === reportId);

    if (!found) {
      setStatusMessage("Report not found.");
      return;
    }

    setReportForm({
      companyName: found.companyName || "",
      sector: found.sector || "tech",
      reportingYear: found.reportingYear || new Date().getFullYear(),
      esrs2: {
        governance: found.esrs2?.governance || "",
        strategy: found.esrs2?.strategy || "",
        impactsRisksOpportunities:
          found.esrs2?.impactsRisksOpportunities || "",
        metricsTargets: found.esrs2?.metricsTargets || ""
      },
      e1: {
        scope1Emissions: found.e1?.scope1Emissions || 0,
        scope2Emissions: found.e1?.scope2Emissions || 0,
        scope3Emissions: found.e1?.scope3Emissions || 0,
        climatePolicies: found.e1?.climatePolicies || ""
      },
      s1: {
        workforcePolicies: found.s1?.workforcePolicies || "",
        diversityInclusion: found.s1?.diversityInclusion || ""
      },
      g1: {
        antiCorruption: found.g1?.antiCorruption || "",
        whistleblowing: found.g1?.whistleblowing || ""
      },
      aiDraft: normalizeAiDraft(found.aiDraft),
      scorecard: {
        benchmark: found.scorecard?.benchmark || 0,
        overallScore: found.scorecard?.overallScore || 0
      },
      reviewStatus: found.reviewStatus || "draft",
      materialityTopics:
        found.materialityTopics?.map((topic) => ({
          ...topic,
          stakeholdersConsulted: Array.isArray(topic.stakeholdersConsulted)
            ? topic.stakeholdersConsulted.join(", ")
            : topic.stakeholdersConsulted || "",
          impactScore100: topic.impactScore100 || 0,
          financialScore100: topic.financialScore100 || 0,
          overallMaterialityScore: topic.overallMaterialityScore || 0
        })) || [{ ...defaultMaterialityTopic }]
    });

    setSelectedReportId(reportId);
    setStatusMessage("Report loaded into form.");
  };

  const downloadSingleReportPDF = async (reportId, companyName) => {
    if (!token) {
      alert("Login required.");
      return;
    }

   if (
  !requireFeature(
    "pdfExport",
    "PDF export is available on Pro and Enterprise plans only."
  )
) {
  return;
}

    try {
      const res = await fetch(`${API}/reports/${reportId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const text = await res.text();
        alert(`Download failed: ${text}`);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const safeName = (companyName || "report").replace(/[^a-z0-9]/gi, "_");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Download failed");
    }
  };

  const deleteReport = async () => {
    alert(
      "Delete route is not included yet. Add DELETE /reports/:id on the backend first."
    );
  };

  const getRiskColor = (score) => {
    if (score >= 80) return "#2e7d32";
    if (score >= 60) return "#f57c00";
    return "#d32f2f";
  };

  const getRiskLabel = (score) => {
    if (score >= 80) return "Low Risk";
    if (score >= 60) return "Moderate Risk";
    return "High Risk";
  };

  const chartData = reports.map((report) => ({
    company: report.companyName,
    score: Number(report.scorecard?.overallScore || 0)
  }));

  const benchmarkComparisonData = getBenchmarkComparisonData(
    reportForm,
    analytics
  );

  const { overallScore, riskLevel, pillarScores } = calculateBig4ESGScore(reportForm);

  const materialityHeatmapData = getMaterialityHeatmapData(
    reportForm.materialityTopics
  );
  const complianceGapData = getComplianceGapData(reportForm);

  const parsedRecommendations = parseRecommendationsText(
    reportForm.aiDraft?.recommendations || ""
  );

  const filteredRecommendations = parsedRecommendations.filter((item) => {
    if (recommendationFilter === "all") return true;
    if (recommendationFilter === "high") {
      return String(item.priority || "").toLowerCase() === "high";
    }
    if (recommendationFilter === "compliance") {
      return String(item.category || "").toLowerCase() === "compliance";
    }
    if (recommendationFilter === "strategy") {
      return String(item.category || "").toLowerCase() === "strategy";
    }
    return true;
  });

  const currentStep = useMemo(() => {
    if (!reportForm.companyName) return 0;
    if (!reportForm.esrs2.governance) return 1;
    if (
      !reportForm.e1.scope1Emissions &&
      !reportForm.e1.scope2Emissions &&
      !reportForm.e1.scope3Emissions
    ) {
      return 2;
    }
    if (!reportForm.materialityTopics.length) return 3;
    if (!reportForm.aiDraft.executiveSummary) return 4;
    return 5;
  }, [reportForm]);

  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f5f7fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "#ffffff",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
          }}
        >
          <h2>{authMode === "login" ? "Login" : "Register"}</h2>

          {authMode === "register" && (
            <input
              value={authForm.companyName}
              onChange={(e) => handleAuthField("companyName", e.target.value)}
              placeholder="Company name"
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "12px",
                borderRadius: "10px",
                border: "1px solid #d1d5db"
              }}
            />
          )}

          <input
            value={authForm.email}
            onChange={(e) => handleAuthField("email", e.target.value)}
            placeholder="Email"
            type="email"
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "10px",
              border: "1px solid #d1d5db"
            }}
          />

          <input
            type="password"
            value={authForm.password}
            onChange={(e) => handleAuthField("password", e.target.value)}
            placeholder="Password"
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "10px",
              border: "1px solid #d1d5db"
            }}
          />

          <button
            onClick={authMode === "login" ? login : register}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              background: "#1976d2",
              color: "#fff",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading
              ? "Please wait..."
              : authMode === "login"
              ? "Login"
              : "Register"}
          </button>

          <button
            onClick={() =>
              setAuthMode(authMode === "login" ? "register" : "login")
            }
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "10px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              background: "#fff",
              cursor: "pointer"
            }}
          >
            {authMode === "login" ? "Create account" : "Back to login"}
          </button>

          {statusMessage && (
            <div style={{ marginTop: "12px", color: "#374151" }}>
              {statusMessage}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
        color: "#1f2937"
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "16px"
          }}
        >
          <div>
            <h1 style={{ marginBottom: "8px" }}>
              Ecovanta CSRD-Ready Platform
            </h1>
            <p style={{ marginTop: 0, color: "#6b7280" }}>
              ESRS-aligned sustainability reporting workflow.
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
           <div style={{ marginBottom: "8px" }}>
          <strong>Plan:</strong> {currentPlanConfig.name}
        </div>

            <div style={{ marginBottom: "8px" }}>
              <strong>Role:</strong> {user?.role || "preparer"}
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                justifyContent: "flex-end"
              }}
            >
              {currentPlan === PLAN_KEYS.FREE && (
                <>
                  <button
                    onClick={() => upgradePlan("pro")}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "none",
                      background: "#1976d2",
                      color: "#fff",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                   {getPlanConfig(PLAN_KEYS.PRO).cta}
                  </button>

                  <button
                    onClick={() => upgradePlan("enterprise")}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "none",
                      background: "#7c3aed",
                      color: "#fff",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                   {getPlanConfig(PLAN_KEYS.ENTERPRISE).cta}
                  </button>
                </>
              )}

             {currentPlan === PLAN_KEYS.PRO && (
                <button
                  onClick={() => upgradePlan("enterprise")}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#7c3aed",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  Upgrade to Enterprise
                </button>
              )}

              {currentPlan !== PLAN_KEYS.FREE && (
                <button
                  onClick={cancelSubscription}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #ef4444",
                    background: "#ffffff",
                    color: "#ef4444",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  Cancel Subscription
                </button>
              )}

              <button
                onClick={logout}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px 16px",
              background: "#ffffff",
              borderRadius: "10px",
              border: "1px solid #d1d5db"
            }}
          >
            {statusMessage}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "24px"
          }}
        >
          {[
            { title: "Total Reports", value: analytics.totalReports },
            { title: "Average Score", value: analytics.averageScore },
            { title: "High Risk", value: analytics.highRisk },
            { title: "Moderate Risk", value: analytics.moderateRisk },
            { title: "Low Risk", value: analytics.lowRisk }
          ].map((card) => (
            <div
              key={card.title}
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "18px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
              }}
            >
              <div style={{ color: "#6b7280", fontSize: "14px" }}>
                {card.title}
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  marginTop: "8px"
                }}
              >
                {card.value || 0}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(380px, 520px) 1fr",
            gap: "20px",
            alignItems: "start"
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
            }}
          >
            <h2 style={{ marginTop: 0 }}>Create ESRS Report</h2>

            <GuidedSteps step={currentStep} />

            <div
              style={{
                padding: "10px",
                borderRadius: "8px",
                background:
                  reportForm.reviewStatus === "draft"
                    ? "#e0f2fe"
                    : reportForm.reviewStatus === "in_review"
                    ? "#fef3c7"
                    : reportForm.reviewStatus === "approved"
                    ? "#d1fae5"
                    : "#ede9fe",
                marginBottom: "12px"
              }}
            >
              <strong>Status:</strong> {reportForm.reviewStatus}
            </div>

            {!isEditable() && (
              <div
                style={{
                  background: "#fee2e2",
                  padding: "10px",
                  borderRadius: "8px",
                  marginBottom: "12px"
                }}
              >
                This report is in review, approved, or published mode and
                cannot be edited.
              </div>
            )}

            <div style={{ display: "grid", gap: "12px" }}>
              <div>
                <FieldLabel helpKey="companyName">Company Name</FieldLabel>
                <input
                  value={reportForm.companyName}
                  onChange={(e) => setTopField("companyName", e.target.value)}
                  placeholder="Company name"
                  disabled={!isEditable()}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    width: "100%"
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px"
                }}
              >
                <div>
                  <FieldLabel helpKey="sector">Sector</FieldLabel>
                  <select
                    value={reportForm.sector}
                    onChange={(e) => setTopField("sector", e.target.value)}
                    disabled={!isEditable()}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                      width: "100%"
                    }}
                  >
                    <option value="tech">Tech</option>
                    <option value="energy">Energy</option>
                    <option value="manufacturing">Manufacturing</option>
                  </select>
                </div>

                <div>
                  <FieldLabel helpKey="reportingYear">Reporting Year</FieldLabel>
                  <input
                    type="number"
                    value={reportForm.reportingYear}
                    onChange={(e) =>
                      setTopField("reportingYear", Number(e.target.value))
                    }
                    disabled={!isEditable()}
                    placeholder="Reporting year"
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                      width: "100%"
                    }}
                  />
                </div>
              </div>

              <h3>ESRS 2</h3>

              <div>
                <FieldLabel helpKey="governance">Governance</FieldLabel>
                <textarea
                  value={reportForm.esrs2.governance}
                  onChange={(e) =>
                    setNestedField("esrs2", "governance", e.target.value)
                  }
                  disabled={!isEditable()}
                  placeholder="Governance"
                  rows={3}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    width: "100%"
                  }}
                />
              </div>

              <div>
                <FieldLabel helpKey="strategy">Strategy</FieldLabel>
                <textarea
                  value={reportForm.esrs2.strategy}
                  onChange={(e) =>
                    setNestedField("esrs2", "strategy", e.target.value)
                  }
                  disabled={!isEditable()}
                  placeholder="Strategy"
                  rows={3}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    width: "100%"
                  }}
                />
              </div>

              <div>
                <FieldLabel helpKey="iro">
                  Impacts, Risks and Opportunities
                </FieldLabel>
                <textarea
                  value={reportForm.esrs2.impactsRisksOpportunities}
                  onChange={(e) =>
                    setNestedField(
                      "esrs2",
                      "impactsRisksOpportunities",
                      e.target.value
                    )
                  }
                  disabled={!isEditable()}
                  placeholder="Impacts, risks and opportunities"
                  rows={3}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    width: "100%"
                  }}
                />
              </div>

              <div>
                <FieldLabel helpKey="metricsTargets">
                  Metrics and Targets
                </FieldLabel>
                <textarea
                  value={reportForm.esrs2.metricsTargets}
                  onChange={(e) =>
                    setNestedField("esrs2", "metricsTargets", e.target.value)
                  }
                  disabled={!isEditable()}
                  placeholder="Metrics and targets"
                  rows={3}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    width: "100%"
                  }}
                />
              </div>

              <h3>E1 - Climate</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px"
                }}
              >
                <div>
                  <FieldLabel helpKey="scope1">Scope 1 Emissions</FieldLabel>
                  <input
                    type="number"
                    value={reportForm.e1.scope1Emissions}
                    onChange={(e) =>
                      setNestedField(
                        "e1",
                        "scope1Emissions",
                        Number(e.target.value)
                      )
                    }
                    disabled={!isEditable()}
                    placeholder="Scope 1 emissions"
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                      width: "100%"
                    }}
                  />
                </div>

                <div>
                  <FieldLabel helpKey="scope2">Scope 2 Emissions</FieldLabel>
                  <input
                    type="number"
                    value={reportForm.e1.scope2Emissions}
                    onChange={(e) =>
                      setNestedField(
                        "e1",
                        "scope2Emissions",
                        Number(e.target.value)
                      )
                    }
                    disabled={!isEditable()}
                    placeholder="Scope 2 emissions"
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                      width: "100%"
                    }}
                  />
                </div>
              </div>

              <div>
                <FieldLabel helpKey="scope3">Scope 3 Emissions</FieldLabel>
                <input
                  type="number"
                  value={reportForm.e1.scope3Emissions}
                  onChange={(e) =>
                    setNestedField("e1", "scope3Emissions", Number(e.target.value))
                  }
                  disabled={!isEditable()}
                  placeholder="Scope 3 emissions"
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    width: "100%"
                  }}
                />
              </div>

              <div>
                <FieldLabel helpKey="climatePolicies">Climate Policies</FieldLabel>
                <textarea
                  value={reportForm.e1.climatePolicies}
                  onChange={(e) =>
                    setNestedField("e1", "climatePolicies", e.target.value)
                  }
                  disabled={!isEditable()}
                  placeholder="Climate policies"
                  rows={3}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    width: "100%"
                  }}
                />
              </div>

              <h3>S1 - Own Workforce</h3>

              <div>
                <FieldLabel helpKey="workforcePolicies">
                  Workforce Policies
                </FieldLabel>
                <textarea
                  value={reportForm.s1.workforcePolicies}
                  onChange={(e) =>
                    setNestedField("s1", "workforcePolicies", e.target.value)
                  }
                  disabled={!isEditable()}
                  placeholder="Workforce policies"
                  rows={3}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    width: "100%"
                  }}
                />
              </div>

              <div>
                <FieldLabel helpKey="diversityInclusion">
                  Diversity and Inclusion
                </FieldLabel>
                <textarea
                  value={reportForm.s1.diversityInclusion}
                  onChange={(e) =>
                    setNestedField("s1", "diversityInclusion", e.target.value)
                  }
                  disabled={!isEditable()}
                  placeholder="Diversity and inclusion"
                  rows={3}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    width: "100%"
                  }}
                />
              </div>

              <h3>G1 - Business Conduct</h3>

              <div>
                <FieldLabel helpKey="antiCorruption">Anti-corruption</FieldLabel>
                <textarea
                  value={reportForm.g1.antiCorruption}
                  onChange={(e) =>
                    setNestedField("g1", "antiCorruption", e.target.value)
                  }
                  disabled={!isEditable()}
                  placeholder="Anti-corruption"
                  rows={3}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    width: "100%"
                  }}
                />
              </div>

              <div>
                <FieldLabel helpKey="whistleblowing">Whistleblowing</FieldLabel>
                <textarea
                  value={reportForm.g1.whistleblowing}
                  onChange={(e) =>
                    setNestedField("g1", "whistleblowing", e.target.value)
                  }
                  disabled={!isEditable()}
                  placeholder="Whistleblowing"
                  rows={3}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    width: "100%"
                  }}
                />
              </div>

              <h3>
                Double Materiality
                <HelpTooltip content={HELP.materiality} />
              </h3>

              {reportForm.materialityTopics.map((topic, index) => {
                const scores = calculateMaterialityScores(topic);

                return (
                  <div
                    key={`topic-${index}`}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "14px",
                      background: "#fafafa"
                    }}
                  >
                    <div style={{ display: "grid", gap: "10px" }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 2fr",
                          gap: "10px"
                        }}
                      >
                        <div>
                          <label
                            style={{ fontWeight: "bold", marginBottom: "6px", display: "block" }}
                          >
                            Topic Code
                          </label>
                          <input
                            value={topic.topicCode}
                            onChange={(e) =>
                              updateMaterialityTopic(
                                index,
                                "topicCode",
                                e.target.value
                              )
                            }
                            disabled={!isEditable()}
                            placeholder="Topic code"
                            style={{
                              padding: "10px",
                              borderRadius: "10px",
                              border: "1px solid #d1d5db",
                              width: "100%"
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{ fontWeight: "bold", marginBottom: "6px", display: "block" }}
                          >
                            Topic Label
                          </label>
                          <input
                            value={topic.topicLabel}
                            onChange={(e) =>
                              updateMaterialityTopic(
                                index,
                                "topicLabel",
                                e.target.value
                              )
                            }
                            disabled={!isEditable()}
                            placeholder="Topic label"
                            style={{
                              padding: "10px",
                              borderRadius: "10px",
                              border: "1px solid #d1d5db",
                              width: "100%"
                            }}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(5, 1fr)",
                          gap: "8px"
                        }}
                      >
                        {[
                          ["severity", "Severity"],
                          ["scale", "Scale"],
                          ["scope", "Scope"],
                          ["irremediability", "Irrem."],
                          ["likelihood", "Impact Likelihood"]
                        ].map(([field, label]) => (
                          <div key={field}>
                            <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                              {label}
                            </div>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={topic.impactMateriality[field]}
                              onChange={(e) =>
                                updateMaterialityTopic(
                                  index,
                                  `impactMateriality.${field}`,
                                  Number(e.target.value)
                                )
                              }
                              disabled={!isEditable()}
                              style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "10px",
                                border: "1px solid #d1d5db"
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: "8px"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                            Magnitude
                          </div>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={topic.financialMateriality.magnitude}
                            onChange={(e) =>
                              updateMaterialityTopic(
                                index,
                                "financialMateriality.magnitude",
                                Number(e.target.value)
                              )
                            }
                            disabled={!isEditable()}
                            style={{
                              width: "100%",
                              padding: "10px",
                              borderRadius: "10px",
                              border: "1px solid #d1d5db"
                            }}
                          />
                        </div>

                        <div>
                          <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                            Likelihood
                          </div>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={topic.financialMateriality.likelihood}
                            onChange={(e) =>
                              updateMaterialityTopic(
                                index,
                                "financialMateriality.likelihood",
                                Number(e.target.value)
                              )
                            }
                            disabled={!isEditable()}
                            style={{
                              width: "100%",
                              padding: "10px",
                              borderRadius: "10px",
                              border: "1px solid #d1d5db"
                            }}
                          />
                        </div>

                        <div>
                          <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                            Time horizon
                          </div>
                          <select
                            value={topic.financialMateriality.timeHorizon}
                            onChange={(e) =>
                              updateMaterialityTopic(
                                index,
                                "financialMateriality.timeHorizon",
                                e.target.value
                              )
                            }
                            disabled={!isEditable()}
                            style={{
                              width: "100%",
                              padding: "10px",
                              borderRadius: "10px",
                              border: "1px solid #d1d5db"
                            }}
                          >
                            <option value="short">Short</option>
                            <option value="medium">Medium</option>
                            <option value="long">Long</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <FieldLabel helpKey="stakeholders">
                          Stakeholders Consulted
                        </FieldLabel>
                        <input
                          value={topic.stakeholdersConsulted}
                          onChange={(e) =>
                            updateMaterialityTopic(
                              index,
                              "stakeholdersConsulted",
                              e.target.value
                            )
                          }
                          disabled={!isEditable()}
                          placeholder="Stakeholders consulted (comma-separated)"
                          style={{
                            padding: "10px",
                            borderRadius: "10px",
                            border: "1px solid #d1d5db",
                            width: "100%"
                          }}
                        />
                      </div>

                      <label style={{ fontSize: "14px", color: "#4b5563" }}>
                        <input
                          type="checkbox"
                          checked={!!topic.isMaterial}
                          onChange={(e) =>
                            updateMaterialityTopic(
                              index,
                              "isMaterial",
                              e.target.checked
                            )
                          }
                          disabled={!isEditable()}
                          style={{ marginRight: "8px" }}
                        />
                        Mark as material
                      </label>

                      <div>
                        <FieldLabel helpKey="rationale">Rationale</FieldLabel>
                        <textarea
                          value={topic.rationale}
                          onChange={(e) =>
                            updateMaterialityTopic(
                              index,
                              "rationale",
                              e.target.value
                            )
                          }
                          disabled={!isEditable()}
                          placeholder="Rationale"
                          rows={3}
                          style={{
                            padding: "10px",
                            borderRadius: "10px",
                            border: "1px solid #d1d5db",
                            width: "100%"
                          }}
                        />
                      </div>

                      <div
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "12px"
                        }}
                      >
                        <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                          Materiality Score
                        </div>
                        <div>Impact Score: {scores.impactScore100}/100</div>
                        <div>
                          Financial Score: {scores.financialScore100}/100
                        </div>
                        <div>
                          Overall Score: {scores.overallMaterialityScore}/100
                        </div>
                        <div>
                          Result:{" "}
                          <strong
                            style={{
                              color: scores.isMaterial ? "#b91c1c" : "#166534"
                            }}
                          >
                            {scores.isMaterial ? "Material" : "Not Material"}
                          </strong>
                        </div>
                      </div>

                      {reportForm.materialityTopics.length > 1 && (
                        <button
                          onClick={() => removeMaterialityTopic(index)}
                          disabled={!isEditable()}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: "1px solid #ef4444",
                            background: "#ffffff",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontWeight: "bold",
                            opacity: !isEditable() ? 0.6 : 1
                          }}
                        >
                          Remove Topic
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                onClick={addMaterialityTopic}
                disabled={!isEditable()}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  cursor: "pointer",
                  fontWeight: "bold",
                  opacity: !isEditable() ? 0.6 : 1
                }}
              >
                Add Material Topic
              </button>

              <h3>AI Draft</h3>

           {hasAiDraftAccess ? (
                <button
                  onClick={generateAiDraft}
                  disabled={aiLoading || !isEditable()}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#7c3aed",
                    color: "#ffffff",
                    fontWeight: "bold",
                    cursor:
                      aiLoading || !isEditable()
                        ? "not-allowed"
                        : "pointer",
                    opacity: aiLoading || !isEditable() ? 0.7 : 1
                  }}
                >
                  {aiLoading ? "Generating AI draft..." : "Generate AI Draft"}
                </button>
              ) : (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#fef3c7",
                    color: "#92400e",
                    fontWeight: "bold"
                  }}
                >
                  AI Draft is a Pro feature.
                </div>
              )}

              <div>
                <label
                  style={{
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: "6px"
                  }}
                >
                  AI Executive Summary
                </label>
                <textarea
                  value={reportForm.aiDraft.executiveSummary}
                  onChange={(e) =>
                    setNestedField("aiDraft", "executiveSummary", e.target.value)
                  }
                  disabled={!isEditable()}
                  placeholder="AI executive summary"
                  rows={4}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    width: "100%"
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: "6px"
                  }}
                >
                  AI Disclosure Draft
                </label>
                <textarea
                  value={reportForm.aiDraft.disclosureDraft}
                  onChange={(e) =>
                    setNestedField("aiDraft", "disclosureDraft", e.target.value)
                  }
                  disabled={!isEditable()}
                  placeholder="AI disclosure draft"
                  rows={8}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    width: "100%"
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: "6px"
                  }}
                >
                  AI Data Gaps
                </label>
                <textarea
                  value={reportForm.aiDraft.dataGaps}
                  onChange={(e) =>
                    setNestedField("aiDraft", "dataGaps", e.target.value)
                  }
                  disabled={!isEditable()}
                  placeholder="AI data gaps"
                  rows={4}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    width: "100%"
                  }}
                />
              </div>

              <div
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "12px"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginBottom: "14px"
                  }}
                >
                  <strong style={{ fontSize: "16px" }}>AI Recommendations</strong>

                  <select
                    value={recommendationFilter}
                    onChange={(e) => setRecommendationFilter(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                      background: "#ffffff"
                    }}
                  >
                    <option value="all">All</option>
                    <option value="high">High Priority</option>
                    <option value="compliance">Compliance</option>
                    <option value="strategy">Strategy</option>
                  </select>
                </div>

                {filteredRecommendations.length === 0 ? (
                  <div style={{ color: "#6b7280" }}>No AI recommendations</div>
                ) : (
                  <div style={{ display: "grid", gap: "14px" }}>
                    {filteredRecommendations.map((item) => {
                      const priorityStyle = getPriorityColor(item.priority);

                      return (
                        <div
                          key={item.id}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            padding: "16px",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "start",
                              gap: "12px",
                              flexWrap: "wrap",
                              marginBottom: "12px"
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: "16px",
                                  fontWeight: "bold",
                                  marginBottom: "6px"
                                }}
                              >
                                {item.title}
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  flexWrap: "wrap"
                                }}
                              >
                                {item.category && (
                                  <span
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: "999px",
                                      background: "#eef2ff",
                                      color: "#4338ca",
                                      fontSize: "12px",
                                      fontWeight: "bold"
                                    }}
                                  >
                                    {item.category}
                                  </span>
                                )}

                                {item.timeline && (
                                  <span
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: "999px",
                                      background: "#f3f4f6",
                                      color: "#374151",
                                      fontSize: "12px",
                                      fontWeight: "bold"
                                    }}
                                  >
                                    {item.timeline}
                                  </span>
                                )}

                                {item.esrsReference && (
                                  <span
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: "999px",
                                      background: "#ecfeff",
                                      color: "#0f766e",
                                      fontSize: "12px",
                                      fontWeight: "bold"
                                    }}
                                  >
                                    {item.esrsReference}
                                  </span>
                                )}
                              </div>
                            </div>

                            {item.priority && (
                              <span
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: "999px",
                                  background: priorityStyle.bg,
                                  color: priorityStyle.text,
                                  border: `1px solid ${priorityStyle.border}`,
                                  fontSize: "12px",
                                  fontWeight: "bold"
                                }}
                              >
                                {item.priority} Priority
                              </span>
                            )}
                          </div>

                          <div style={{ display: "grid", gap: "12px" }}>
                            {item.currentGap && (
                              <div>
                                <div
                                  style={{
                                    fontWeight: "bold",
                                    marginBottom: "4px",
                                    color: "#111827"
                                  }}
                                >
                                  Current Gap
                                </div>
                                <div style={{ color: "#4b5563" }}>
                                  {item.currentGap}
                                </div>
                              </div>
                            )}

                            {item.riskImpact && (
                              <div>
                                <div
                                  style={{
                                    fontWeight: "bold",
                                    marginBottom: "4px",
                                    color: "#111827"
                                  }}
                                >
                                  Risk / Impact
                                </div>
                                <div style={{ color: "#4b5563" }}>
                                  {item.riskImpact}
                                </div>
                              </div>
                            )}

                            {Array.isArray(item.actions) &&
                              item.actions.length > 0 && (
                                <div>
                                  <div
                                    style={{
                                      fontWeight: "bold",
                                      marginBottom: "6px",
                                      color: "#111827"
                                    }}
                                  >
                                    Recommended Actions
                                  </div>
                                  <ul
                                    style={{
                                      margin: 0,
                                      paddingLeft: "18px",
                                      color: "#4b5563"
                                    }}
                                  >
                                    {item.actions.map((action, idx) => (
                                      <li key={`${item.id}-action-${idx}`}>
                                        {action}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                            {Array.isArray(item.suggestedKPIs) &&
                              item.suggestedKPIs.length > 0 && (
                                <div>
                                  <div
                                    style={{
                                      fontWeight: "bold",
                                      marginBottom: "6px",
                                      color: "#111827"
                                    }}
                                  >
                                    Suggested KPIs
                                  </div>
                                  <ul
                                    style={{
                                      margin: 0,
                                      paddingLeft: "18px",
                                      color: "#4b5563"
                                    }}
                                  >
                                    {item.suggestedKPIs.map((kpi, idx) => (
                                      <li key={`${item.id}-kpi-${idx}`}>{kpi}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={saveReport}
                disabled={loading || !isEditable()}
                style={{
                  marginTop: "8px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#1976d2",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor:
                    loading || !isEditable() ? "not-allowed" : "pointer",
                  opacity: loading || !isEditable() ? 0.7 : 1
                }}
              >
                {loading ? "Saving..." : "Save Report"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: "20px" }}>
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
              }}
            >
              <h2 style={{ marginTop: 0 }}>Portfolio Analytics</h2>

              {reports.length === 0 ? (
                <p style={{ color: "#6b7280" }}>
                  No reports yet. Create your first ESRS report to populate the
                  dashboard.
                </p>
              ) : (
                <div style={{ width: "100%", height: "320px" }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="company" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="score" fill="#1976d2" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
              }}
            >
              <h2 style={{ marginTop: 0 }}>Load Existing Report</h2>

              <div style={{ display: "grid", gap: "12px" }}>
                <select
                  value={selectedReportId}
                  onChange={(e) => setSelectedReportId(e.target.value)}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db"
                  }}
                >
                  <option value="">Select report</option>
                  {reports.map((report) => (
                    <option
                      key={report._id || report.id}
                      value={report._id || report.id}
                    >
                      {report.companyName} - {report.reportingYear}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => loadReportIntoForm(selectedReportId)}
                  disabled={!selectedReportId}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    cursor: selectedReportId ? "pointer" : "not-allowed",
                    opacity: selectedReportId ? 1 : 0.6
                  }}
                >
                  Load Into Form
                </button>

                <button
                  onClick={refreshDashboard}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    cursor: "pointer"
                  }}
                >
                  Refresh Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

      {hasAdvancedAnalyticsAccess && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
              marginTop: "24px",
              marginBottom: "24px"
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
              }}
            >
              <h2 style={{ marginTop: 0 }}>Benchmark Comparison</h2>
              <p style={{ color: "#6b7280", marginTop: 0 }}>
                Compare current score against sector reference points.
              </p>

              <div style={{ width: "100%", height: "280px" }}>
                <ResponsiveContainer>
                  <BarChart data={benchmarkComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="value">
                      {benchmarkComparisonData.map((entry, index) => (
                        <Cell
                          key={`bench-${index}`}
                          fill={
                            entry.name === "Company"
                              ? "#1976d2"
                              : entry.name === "Sector Avg"
                              ? "#f59e0b"
                              : "#10b981"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
              }}
            >
              <h2 style={{ marginTop: 0 }}>Materiality Heatmap</h2>
              <p style={{ color: "#6b7280", marginTop: 0 }}>
                Impact materiality vs financial materiality by topic.
              </p>

              {materialityHeatmapData.length === 0 ? (
                <p style={{ color: "#6b7280" }}>No materiality topics yet.</p>
              ) : (
                <div style={{ width: "100%", height: "280px" }}>
                  <ResponsiveContainer>
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="Financial"
                        domain={[0, 100]}
                        label={{
                          value: "Financial Score",
                          position: "insideBottom",
                          offset: -8
                        }}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="Impact"
                        domain={[0, 100]}
                        label={{
                          value: "Impact Score",
                          angle: -90,
                          position: "insideLeft"
                        }}
                      />
                      <ZAxis type="number" dataKey="z" range={[120]} />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) {
                            return null;
                          }
                          const point = payload[0].payload;
                          return (
                            <div
                              style={{
                                background: "#fff",
                                border: "1px solid #d1d5db",
                                padding: "10px",
                                borderRadius: "8px"
                              }}
                            >
                              <div style={{ fontWeight: "bold" }}>
                                {point.name} - {point.label}
                              </div>
                              <div>Impact: {point.y}/100</div>
                              <div>Financial: {point.x}/100</div>
                              <div>Overall: {point.overall}/100</div>
                              <div>Result: {point.result}</div>
                            </div>
                          );
                        }}
                      />
                      <Scatter data={materialityHeatmapData} fill="#7c3aed" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
              }}
            >
              <h2 style={{ marginTop: 0 }}>Compliance Gap Dashboard</h2>
              <p style={{ color: "#6b7280", marginTop: 0 }}>
                Tracks completeness by disclosure section and highlights missing
                inputs.
              </p>

              <div style={{ display: "grid", gap: "12px" }}>
                {complianceGapData.map((item) => (
                  <div
                    key={item.section}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "14px",
                      background: "#fafafa"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "8px"
                      }}
                    >
                      <strong>{item.section}</strong>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "999px",
                          background:
                            item.completeness >= 80
                              ? "#dcfce7"
                              : item.completeness >= 60
                              ? "#fef3c7"
                              : "#fee2e2",
                          color:
                            item.completeness >= 80
                              ? "#166534"
                              : item.completeness >= 60
                              ? "#92400e"
                              : "#991b1b",
                          fontWeight: "bold",
                          fontSize: "12px"
                        }}
                      >
                        {item.completeness}% complete
                      </span>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: "10px",
                        background: "#e5e7eb",
                        borderRadius: "999px",
                        overflow: "hidden",
                        marginBottom: "10px"
                      }}
                    >
                      <div
                        style={{
                          width: `${item.completeness}%`,
                          height: "100%",
                          background:
                            item.completeness >= 80
                              ? "#10b981"
                              : item.completeness >= 60
                              ? "#f59e0b"
                              : "#ef4444"
                        }}
                      />
                    </div>

                    {item.missing.length === 0 ? (
                      <div style={{ color: "#166534", fontSize: "14px" }}>
                        No major gaps identified.
                      </div>
                    ) : (
                      <div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "bold",
                            marginBottom: "6px"
                          }}
                        >
                          Missing:
                        </div>
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: "18px",
                            color: "#6b7280"
                          }}
                        >
                          {item.missing.map((gap, idx) => (
                            <li key={`${item.section}-${idx}`}>{gap}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: "24px" }}>
          <h2>Portfolio Reports</h2>

          {reports.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
              }}
            >
              No reports generated yet.
            </div>
          ) : (
            reports.map((report) => {
              const score = Number(report.scorecard?.overallScore || 0);
              const reportRecommendations = parseRecommendationsText(
                report.aiDraft?.recommendations || ""
              );

              return (
                <div
                  key={report._id || report.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "16px",
                    borderLeft: `8px solid ${getRiskColor(score)}`,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      gap: "16px",
                      flexWrap: "wrap"
                    }}
                  >
                    <div>
                      <h3 style={{ marginTop: 0, marginBottom: "8px" }}>
                        {report.companyName}
                      </h3>
                      <div style={{ color: "#6b7280", marginBottom: "8px" }}>
                        Sector: {report.sector} | Year: {report.reportingYear}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: "999px",
                        background: getRiskColor(score),
                        color: "#ffffff",
                        fontWeight: "bold"
                      }}
                    >
                      {score} — {getRiskLabel(score)}
                    </div>
                  </div>

                  <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                    <strong>Benchmark:</strong> {report.scorecard?.benchmark || 0}
                    <span style={{ marginLeft: 16 }}>
                      <strong>Review:</strong> {report.reviewStatus}
                    </span>
                  </div>

                  {Array.isArray(report.materialityTopics) &&
                    report.materialityTopics.length > 0 && (
                      <div
                        style={{
                          background: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "14px",
                          marginBottom: "12px"
                        }}
                      >
                        <strong>Double Materiality Assessment</strong>
                        <div style={{ marginTop: "10px" }}>
                          {report.materialityTopics.map((topic, idx) => (
                            <div key={idx} style={{ marginBottom: "12px" }}>
                              <div>
                                <strong>{topic.topicCode}</strong> -{" "}
                                {topic.topicLabel}
                              </div>
                              <div>Impact Score: {topic.impactScore100 || 0}/100</div>
                              <div>
                                Financial Score: {topic.financialScore100 || 0}
                                /100
                              </div>
                              <div>
                                Overall Score:{" "}
                                {topic.overallMaterialityScore || 0}/100
                              </div>
                              <div>
                                Result:{" "}
                                <strong>
                                  {topic.isMaterial
                                    ? "Material"
                                    : "Not Material"}
                                </strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div
                    style={{
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "14px",
                      whiteSpace: "pre-wrap",
                      marginBottom: "12px"
                    }}
                  >
                    <strong>AI Executive Summary</strong>
                    <div style={{ marginTop: "8px" }}>
                      {report.aiDraft?.executiveSummary || "No AI summary"}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "14px",
                      whiteSpace: "pre-wrap",
                      marginBottom: "12px"
                    }}
                  >
                    <strong>AI Disclosure Draft</strong>
                    <div style={{ marginTop: "8px" }}>
                      {report.aiDraft?.disclosureDraft ||
                        "No AI disclosure draft"}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "14px",
                      whiteSpace: "pre-wrap",
                      marginBottom: "12px"
                    }}
                  >
                    <strong>AI Data Gaps</strong>
                    <div style={{ marginTop: "8px" }}>
                      {report.aiDraft?.dataGaps || "No AI data gaps"}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "14px",
                      marginBottom: "12px"
                    }}
                  >
                    <strong>AI Recommendations</strong>

                    <div style={{ marginTop: "10px", display: "grid", gap: "12px" }}>
                      {reportRecommendations.length === 0 ? (
                        <div style={{ color: "#6b7280" }}>
                          No AI recommendations
                        </div>
                      ) : (
                        reportRecommendations.map((item) => {
                          const priorityStyle = getPriorityColor(item.priority);

                          return (
                            <div
                              key={item.id}
                              style={{
                                background: "#ffffff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "12px",
                                padding: "14px"
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "start",
                                  gap: "10px",
                                  flexWrap: "wrap",
                                  marginBottom: "8px"
                                }}
                              >
                                <div style={{ fontWeight: "bold" }}>
                                  {item.title}
                                </div>

                                {item.priority && (
                                  <span
                                    style={{
                                      padding: "5px 10px",
                                      borderRadius: "999px",
                                      background: priorityStyle.bg,
                                      color: priorityStyle.text,
                                      border: `1px solid ${priorityStyle.border}`,
                                      fontSize: "12px",
                                      fontWeight: "bold"
                                    }}
                                  >
                                    {item.priority}
                                  </span>
                                )}
                              </div>

                              <div style={{ color: "#6b7280", marginBottom: "6px" }}>
                                {[item.category, item.timeline, item.esrsReference]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </div>

                              {item.currentGap && (
                                <div style={{ marginBottom: "8px" }}>
                                  <strong>Gap:</strong> {item.currentGap}
                                </div>
                              )}

                              {Array.isArray(item.actions) &&
                                item.actions.length > 0 && (
                                  <div>
                                    <strong>Actions:</strong>
                                    <ul
                                      style={{
                                        marginBottom: 0,
                                        paddingLeft: "18px"
                                      }}
                                    >
                                      {item.actions.map((action, idx) => (
                                        <li key={`${item.id}-report-action-${idx}`}>
                                          {action}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "12px",
                      padding: "12px",
                      border: "1px solid #e5e7eb",
                      marginBottom: "12px"
                    }}
                  >
                    <strong>Status:</strong> {report.reviewStatus || "draft"}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap"
                    }}
                  >
                    {hasPdfExportAccess ? (
                      <button
                        onClick={() =>
                          downloadSingleReportPDF(
                            report._id || report.id,
                            report.companyName
                          )
                        }
                        style={{
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "none",
                          background: "#1976d2",
                          color: "#ffffff",
                          fontWeight: "bold",
                          cursor: "pointer"
                        }}
                      >
                        Download This Report
                      </button>
                    ) : (
                      <button
                        disabled
                        style={{
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "none",
                          background: "#d1d5db",
                          color: "#6b7280",
                          fontWeight: "bold",
                          cursor: "not-allowed"
                        }}
                      >
                        PDF Export (Pro)
                      </button>
                    )}

                    <button
                      onClick={() => loadReportIntoForm(report._id || report.id)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid #d1d5db",
                        background: "#ffffff",
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      Edit In Form
                    </button>

                    <button
                      onClick={() => deleteReport(report._id || report.id)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid #ef4444",
                        background: "#ffffff",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      Delete
                    </button>

                    {hasWorkflowAccess && report.reviewStatus === "draft" && (
                        <button
                          onClick={() =>
                            updateReportStatus(
                              report._id || report.id,
                              "in_review"
                            )
                          }
                          style={{
                            padding: "10px 14px",
                            borderRadius: "10px",
                            border: "none",
                            background: "#f59e0b",
                            color: "#ffffff",
                            fontWeight: "bold",
                            cursor: "pointer"
                          }}
                        >
                          Send to Review
                        </button>
                      )}

                    {hasWorkflowAccess && report.reviewStatus === "in_review" &&
                      ["reviewer", "approver", "admin"].includes(user?.role) && (
                        <button
                          onClick={() =>
                            updateReportStatus(
                              report._id || report.id,
                              "approved"
                            )
                          }
                          style={{
                            padding: "10px 14px",
                            borderRadius: "10px",
                            border: "none",
                            background: "#10b981",
                            color: "#ffffff",
                            fontWeight: "bold",
                            cursor: "pointer"
                          }}
                        >
                          Approve
                        </button>
                      )}

                        {hasWorkflowAccess && report.reviewStatus === "approved" &&
                      ["approver", "admin"].includes(user?.role) && (
                        <button
                          onClick={() =>
                            updateReportStatus(
                              report._id || report.id,
                              "published"
                            )
                          }
                          style={{
                            padding: "10px 14px",
                            borderRadius: "10px",
                            border: "none",
                            background: "#6366f1",
                            color: "#ffffff",
                            fontWeight: "bold",
                            cursor: "pointer"
                          }}
                        >
                          Publish
                        </button>
                      )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {hasAuditTrailAccess && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              marginTop: "24px"
            }}
          >
            <h2 style={{ marginTop: 0 }}>Audit Trail</h2>

            {auditLogs.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No audit events yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log._id}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid #e5e7eb"
                  }}
                >
                  <div style={{ fontWeight: "bold" }}>{log.action}</div>
                  <div style={{ color: "#6b7280", fontSize: "14px" }}>
                    Company: {log.companyName || "-"}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "14px" }}>
                    By: {log.userEmail || "Unknown"}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "14px" }}>
                    When: {new Date(log.createdAt).toLocaleString()}
                  </div>
                  {log.details?.newStatus && (
                    <div style={{ color: "#6b7280", fontSize: "14px" }}>
                      New Status: {log.details.newStatus}
                    </div>
                  )}
                  {Array.isArray(log.details?.fieldsUpdated) && (
                    <div style={{ color: "#6b7280", fontSize: "14px" }}>
                      Changes: {log.details.fieldsUpdated.join(", ")}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const token = localStorage.getItem("token");

  // 👇 ADD THIS HERE
  const params = new URLSearchParams(window.location.search);
  const showSignup = params.get("signup") === "true";

  // 👇 UPDATE THIS CONDITION
  if (!token && !showSignup) {
    return <EcovantaLandingPage />;
  }

  return <MainPlatform />;
}

export default App;