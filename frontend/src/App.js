import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

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
  rationale: ""
};

const initialReportForm = {
  companyName: "",
  sector: "tech",
  reportingYear: new Date().getFullYear(),
  reportingScope: "individual",
  transitionalReliefUsed: false,
  esrs2: {
    governance: "",
    strategy: "",
    impactsRisksOpportunities: "",
    metricsTargets: ""
  },
  e1: {
    climateTransitionPlan: "",
    scope1Emissions: 0,
    scope2Emissions: 0,
    scope3Emissions: 0,
    energyConsumption: 0,
    climatePolicies: "",
    climateActions: "",
    climateTargets: ""
  },
  s1: {
    workforcePolicies: "",
    healthSafetyMetrics: "",
    diversityInclusion: "",
    remunerationMetrics: ""
  },
  g1: {
    businessConductPolicies: "",
    antiCorruption: "",
    whistleblowing: "",
    paymentPractices: ""
  },
  materialityTopics: [{ ...defaultMaterialityTopic }],
  evidence: [],
  aiDraft: {
    executiveSummary: "",
    disclosureDraft: "",
    dataGaps: ""
  },
  taxonomyMappingNotes: "",
  reviewStatus: "draft"
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    companyName: ""
  });

  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [reportForm, setReportForm] = useState(initialReportForm);
  const [benchmark, setBenchmark] = useState(60);

  const [analytics, setAnalytics] = useState({
    totalReports: 0,
    averageScore: 0,
    highRisk: 0,
    moderateRisk: 0,
    lowRisk: 0,
    belowBenchmark: 0,
    approvedReports: 0,
    materialTopicsCount: 0
  });

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const updateNestedField = (section, field, value) => {
    setReportForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const setTopField = (field, value) => {
    setReportForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const fetchJson = async (url, options = {}) => {
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
  };

  const loadCurrentUser = useCallback(async () => {
    if (!token) return;

    try {
      const me = await fetchJson(`${API}/me`, {
        headers: authHeaders
      });
      setUser(me);
    } catch (error) {
      console.error("Load current user error:", error);
    }
  }, [token, authHeaders]);

  const loadReports = useCallback(async () => {
    if (!token) return;

    try {
      const data = await fetchJson(`${API}/reports`, {
        headers: authHeaders
      });
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load reports error:", error);
      setStatusMessage(`Could not load reports: ${error.message}`);
    }
  }, [token, authHeaders]);

  const loadAnalytics = useCallback(async () => {
    if (!token) return;

    try {
      const data = await fetchJson(`${API}/analytics/overview`, {
        headers: authHeaders
      });
      setAnalytics({
        totalReports: data.totalReports || 0,
        averageScore: data.averageScore || 0,
        highRisk: data.highRisk || 0,
        moderateRisk: data.moderateRisk || 0,
        lowRisk: data.lowRisk || 0,
        belowBenchmark: data.belowBenchmark || 0,
        approvedReports: data.approvedReports || 0,
        materialTopicsCount: data.materialTopicsCount || 0
      });
    } catch (error) {
      console.error("Load analytics error:", error);
      setStatusMessage(`Could not load analytics: ${error.message}`);
    }
  }, [token, authHeaders]);

  const loadBenchmark = useCallback(async () => {
    try {
      const data = await fetchJson(`${API}/benchmark/${reportForm.sector}`);
      setBenchmark(Number(data.benchmark || 60));
    } catch (error) {
      console.error("Load benchmark error:", error);
      setBenchmark(60);
    }
  }, [reportForm.sector]);

  const refreshDashboard = useCallback(async () => {
    await Promise.all([loadCurrentUser(), loadReports(), loadAnalytics()]);
  }, [loadCurrentUser, loadReports, loadAnalytics]);

  useEffect(() => {
    if (!token) return;
    refreshDashboard();
  }, [token, refreshDashboard]);

  useEffect(() => {
    loadBenchmark();
  }, [loadBenchmark]);

  const handleAuthChange = (field, value) => {
    setAuthForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      setStatusMessage("");

      await fetchJson(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm)
      });

      setStatusMessage("Registration successful. You can now log in.");
      setAuthMode("login");
      setAuthForm((prev) => ({
        ...prev,
        password: ""
      }));
    } catch (error) {
      console.error("Register error:", error);
      setStatusMessage(`Register failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setStatusMessage("");

      const data = await fetchJson(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password
        })
      });

      setToken(data.token);
      localStorage.setItem("token", data.token);
      setUser(data.user || null);
      setStatusMessage("Logged in successfully.");
    } catch (error) {
      console.error("Login error:", error);
      setStatusMessage(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setReports([]);
    setSelectedReportId("");
    setStatusMessage("Logged out.");
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
      const next = [...prev.materialityTopics];
      const topic = { ...next[index] };

      if (path.includes(".")) {
        const [section, field] = path.split(".");
        topic[section] = {
          ...topic[section],
          [field]: value
        };
      } else {
        topic[path] = value;
      }

      next[index] = topic;
      return {
        ...prev,
        materialityTopics: next
      };
    });
  };

  const generateAiDraft = async () => {
    if (!token) {
      alert("Login required.");
      return;
    }

    if (!reportForm.companyName.trim()) {
      alert("Please enter a company name first.");
      return;
    }

    try {
      setAiLoading(true);
      setStatusMessage("");

      const payload = {
        ...reportForm,
        materialityTopics: reportForm.materialityTopics.map((topic) => ({
          ...topic,
          stakeholdersConsulted: topic.stakeholdersConsulted
            ? topic.stakeholdersConsulted
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : []
        }))
      };

      const data = await fetchJson(`${API}/ai-draft`, {
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
          executiveSummary: data.executiveSummary || "",
          disclosureDraft: data.disclosureDraft || "",
          dataGaps: data.dataGaps || ""
        }
      }));

      setStatusMessage("AI draft generated.");
    } catch (error) {
      console.error("AI draft error:", error);
      setStatusMessage(`AI draft failed: ${error.message}`);
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

      const payload = {
        ...reportForm,
        materialityTopics: reportForm.materialityTopics.map((topic) => ({
          ...topic,
          stakeholdersConsulted: topic.stakeholdersConsulted
            ? topic.stakeholdersConsulted
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : []
        }))
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
      setStatusMessage("Report saved successfully.");
      setReportForm(initialReportForm);
      await refreshDashboard();
    } catch (error) {
      console.error("Save report error:", error);
      setStatusMessage(`Save failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadReportIntoForm = async (reportId) => {
    if (!reportId) return;

    try {
      const data = await fetchJson(`${API}/reports/${reportId}`, {
        headers: authHeaders
      });

      setReportForm({
        companyName: data.companyName || "",
        sector: data.sector || "tech",
        reportingYear: data.reportingYear || new Date().getFullYear(),
        reportingScope: data.reportingScope || "individual",
        transitionalReliefUsed: !!data.transitionalReliefUsed,
        esrs2: {
          governance: data.esrs2?.governance || "",
          strategy: data.esrs2?.strategy || "",
          impactsRisksOpportunities:
            data.esrs2?.impactsRisksOpportunities || "",
          metricsTargets: data.esrs2?.metricsTargets || ""
        },
        e1: {
          climateTransitionPlan: data.e1?.climateTransitionPlan || "",
          scope1Emissions: data.e1?.scope1Emissions || 0,
          scope2Emissions: data.e1?.scope2Emissions || 0,
          scope3Emissions: data.e1?.scope3Emissions || 0,
          energyConsumption: data.e1?.energyConsumption || 0,
          climatePolicies: data.e1?.climatePolicies || "",
          climateActions: data.e1?.climateActions || "",
          climateTargets: data.e1?.climateTargets || ""
        },
        s1: {
          workforcePolicies: data.s1?.workforcePolicies || "",
          healthSafetyMetrics: data.s1?.healthSafetyMetrics || "",
          diversityInclusion: data.s1?.diversityInclusion || "",
          remunerationMetrics: data.s1?.remunerationMetrics || ""
        },
        g1: {
          businessConductPolicies: data.g1?.businessConductPolicies || "",
          antiCorruption: data.g1?.antiCorruption || "",
          whistleblowing: data.g1?.whistleblowing || "",
          paymentPractices: data.g1?.paymentPractices || ""
        },
        materialityTopics:
          data.materialityTopics?.map((topic) => ({
            ...topic,
            stakeholdersConsulted: Array.isArray(topic.stakeholdersConsulted)
              ? topic.stakeholdersConsulted.join(", ")
              : ""
          })) || [{ ...defaultMaterialityTopic }],
        evidence: data.evidence || [],
        aiDraft: {
          executiveSummary: data.aiDraft?.executiveSummary || "",
          disclosureDraft: data.aiDraft?.disclosureDraft || "",
          dataGaps: data.aiDraft?.dataGaps || ""
        },
        taxonomyMappingNotes: data.taxonomyMappingNotes || "",
        reviewStatus: data.reviewStatus || "draft"
      });

      setSelectedReportId(data._id || "");
      setStatusMessage("Report loaded into form.");
    } catch (error) {
      console.error("Load single report error:", error);
      setStatusMessage(`Load failed: ${error.message}`);
    }
  };

  const downloadAllReportsPDF = async () => {
    if (!token) {
      alert("Login required.");
      return;
    }

    try {
      const res = await fetch(`${API}/reports/download/pdf`, {
        headers: authHeaders
      });

      if (!res.ok) {
        const text = await res.text();
        alert(`Download failed: ${text}`);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ecovanta_all_reports.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download all PDF error:", error);
      alert("Failed to download all reports PDF.");
    }
  };

  const downloadSingleReportPDF = async (reportId, companyName) => {
    if (!token) {
      alert("Login required.");
      return;
    }

    try {
      const res = await fetch(`${API}/reports/${reportId}/download/pdf`, {
        headers: authHeaders
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
      link.download = `${safeName}_esrs_report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download single PDF error:", error);
      alert("Failed to download single report PDF.");
    }
  };

  const deleteReport = async (reportId) => {
    if (!token) {
      alert("Login required.");
      return;
    }

    const confirmed = window.confirm("Delete this report?");
    if (!confirmed) return;

    try {
      await fetchJson(`${API}/reports/${reportId}`, {
        method: "DELETE",
        headers: authHeaders
      });

      setReports((prev) => prev.filter((item) => (item._id || item.id) !== reportId));
      setStatusMessage("Report deleted.");
      await refreshDashboard();
    } catch (error) {
      console.error("Delete report error:", error);
      setStatusMessage(`Delete failed: ${error.message}`);
    }
  };

  const chartData = reports.map((report) => ({
    company: report.companyName,
    score: report.scorecard?.overallScore || 0
  }));

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
            maxWidth: "460px",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)"
          }}
        >
          <h1 style={{ marginTop: 0 }}>Ecovanta CSRD-Ready Platform</h1>
          <p style={{ color: "#6b7280" }}>
            Create ESRS-aligned sustainability reports with double materiality,
            AI drafting, analytics, and PDF exports.
          </p>

          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <button
              onClick={() => setAuthMode("login")}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: "10px",
                border: authMode === "login" ? "none" : "1px solid #d1d5db",
                background: authMode === "login" ? "#1976d2" : "#ffffff",
                color: authMode === "login" ? "#ffffff" : "#111827",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Login
            </button>

            <button
              onClick={() => setAuthMode("register")}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: "10px",
                border: authMode === "register" ? "none" : "1px solid #d1d5db",
                background: authMode === "register" ? "#1976d2" : "#ffffff",
                color: authMode === "register" ? "#ffffff" : "#111827",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Register
            </button>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {authMode === "register" && (
              <input
                value={authForm.companyName}
                onChange={(e) => handleAuthChange("companyName", e.target.value)}
                placeholder="Company name"
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />
            )}

            <input
              value={authForm.email}
              onChange={(e) => handleAuthChange("email", e.target.value)}
              placeholder="Email"
              type="email"
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #d1d5db"
              }}
            />

            <input
              value={authForm.password}
              onChange={(e) => handleAuthChange("password", e.target.value)}
              placeholder="Password"
              type="password"
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #d1d5db"
              }}
            />

            <button
              onClick={authMode === "login" ? handleLogin : handleRegister}
              disabled={loading}
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                border: "none",
                background: "#1976d2",
                color: "#ffffff",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading
                ? "Please wait..."
                : authMode === "login"
                ? "Login"
                : "Create account"}
            </button>
          </div>

          {statusMessage && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                borderRadius: "10px",
                background: "#f9fafb",
                border: "1px solid #e5e7eb"
              }}
            >
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
            <h1 style={{ marginBottom: "8px" }}>Ecovanta CSRD-Ready Platform</h1>
            <p style={{ marginTop: 0, color: "#6b7280" }}>
              ESRS-aligned sustainability reporting workflow with AI-assisted drafts.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap"
            }}
          >
            <button
              onClick={downloadAllReportsPDF}
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                border: "none",
                background: "#1976d2",
                color: "#ffffff",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Download All Reports PDF
            </button>

            <button
              onClick={logout}
              style={{
                padding: "12px 16px",
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

        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            background: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #e5e7eb"
          }}
        >
          <strong>User:</strong> {user?.email || "Unknown"}
          <span style={{ marginLeft: 16 }}>
            <strong>Plan:</strong> {user?.plan || "free"}
          </span>
          <span style={{ marginLeft: 16 }}>
            <strong>Reports used:</strong> {user?.reportsUsed || 0}
          </span>
          <span style={{ marginLeft: 16 }}>
            <strong>Benchmark:</strong> {benchmark}
          </span>
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
            { title: "Low Risk", value: analytics.lowRisk },
            { title: "Below Benchmark", value: analytics.belowBenchmark },
            { title: "Approved Reports", value: analytics.approvedReports },
            { title: "Material Topics", value: analytics.materialTopicsCount }
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
              <div style={{ color: "#6b7280", fontSize: "14px" }}>{card.title}</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", marginTop: "8px" }}>
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

            <div style={{ display: "grid", gap: "12px" }}>
              <input
                value={reportForm.companyName}
                onChange={(e) => setTopField("companyName", e.target.value)}
                placeholder="Company name"
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <select
                  value={reportForm.sector}
                  onChange={(e) => setTopField("sector", e.target.value)}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db"
                  }}
                >
                  <option value="tech">Tech</option>
                  <option value="energy">Energy</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="finance">Finance</option>
                  <option value="retail">Retail</option>
                  <option value="agriculture">Agriculture</option>
                </select>

                <input
                  type="number"
                  value={reportForm.reportingYear}
                  onChange={(e) =>
                    setTopField("reportingYear", Number(e.target.value))
                  }
                  placeholder="Reporting year"
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <select
                  value={reportForm.reportingScope}
                  onChange={(e) => setTopField("reportingScope", e.target.value)}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db"
                  }}
                >
                  <option value="individual">Individual</option>
                  <option value="consolidated">Consolidated</option>
                </select>

                <select
                  value={reportForm.reviewStatus}
                  onChange={(e) => setTopField("reviewStatus", e.target.value)}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db"
                  }}
                >
                  <option value="draft">Draft</option>
                  <option value="in_review">In review</option>
                  <option value="approved">Approved</option>
                </select>
              </div>

              <label style={{ fontSize: "14px", color: "#4b5563" }}>
                <input
                  type="checkbox"
                  checked={reportForm.transitionalReliefUsed}
                  onChange={(e) =>
                    setTopField("transitionalReliefUsed", e.target.checked)
                  }
                  style={{ marginRight: "8px" }}
                />
                Transitional relief used
              </label>

              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb"
                }}
              >
                Current sector benchmark: <strong>{benchmark}</strong>
              </div>

              <h3>ESRS 2</h3>
              <textarea
                value={reportForm.esrs2.governance}
                onChange={(e) => updateNestedField("esrs2", "governance", e.target.value)}
                placeholder="Governance"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />
              <textarea
                value={reportForm.esrs2.strategy}
                onChange={(e) => updateNestedField("esrs2", "strategy", e.target.value)}
                placeholder="Strategy"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />
              <textarea
                value={reportForm.esrs2.impactsRisksOpportunities}
                onChange={(e) =>
                  updateNestedField(
                    "esrs2",
                    "impactsRisksOpportunities",
                    e.target.value
                  )
                }
                placeholder="Impacts, risks and opportunities"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />
              <textarea
                value={reportForm.esrs2.metricsTargets}
                onChange={(e) =>
                  updateNestedField("esrs2", "metricsTargets", e.target.value)
                }
                placeholder="Metrics and targets"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />

              <h3>E1 - Climate</h3>
              <textarea
                value={reportForm.e1.climateTransitionPlan}
                onChange={(e) =>
                  updateNestedField("e1", "climateTransitionPlan", e.target.value)
                }
                placeholder="Climate transition plan"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <input
                  type="number"
                  value={reportForm.e1.scope1Emissions}
                  onChange={(e) =>
                    updateNestedField("e1", "scope1Emissions", Number(e.target.value))
                  }
                  placeholder="Scope 1 emissions"
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db"
                  }}
                />
                <input
                  type="number"
                  value={reportForm.e1.scope2Emissions}
                  onChange={(e) =>
                    updateNestedField("e1", "scope2Emissions", Number(e.target.value))
                  }
                  placeholder="Scope 2 emissions"
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <input
                  type="number"
                  value={reportForm.e1.scope3Emissions}
                  onChange={(e) =>
                    updateNestedField("e1", "scope3Emissions", Number(e.target.value))
                  }
                  placeholder="Scope 3 emissions"
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db"
                  }}
                />
                <input
                  type="number"
                  value={reportForm.e1.energyConsumption}
                  onChange={(e) =>
                    updateNestedField("e1", "energyConsumption", Number(e.target.value))
                  }
                  placeholder="Energy consumption"
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db"
                  }}
                />
              </div>

              <textarea
                value={reportForm.e1.climatePolicies}
                onChange={(e) =>
                  updateNestedField("e1", "climatePolicies", e.target.value)
                }
                placeholder="Climate policies"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />
              <textarea
                value={reportForm.e1.climateActions}
                onChange={(e) =>
                  updateNestedField("e1", "climateActions", e.target.value)
                }
                placeholder="Climate actions"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />
              <textarea
                value={reportForm.e1.climateTargets}
                onChange={(e) =>
                  updateNestedField("e1", "climateTargets", e.target.value)
                }
                placeholder="Climate targets"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />

              <h3>S1 - Own Workforce</h3>
              <textarea
                value={reportForm.s1.workforcePolicies}
                onChange={(e) =>
                  updateNestedField("s1", "workforcePolicies", e.target.value)
                }
                placeholder="Workforce policies"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />
              <textarea
                value={reportForm.s1.healthSafetyMetrics}
                onChange={(e) =>
                  updateNestedField("s1", "healthSafetyMetrics", e.target.value)
                }
                placeholder="Health and safety metrics"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />
              <textarea
                value={reportForm.s1.diversityInclusion}
                onChange={(e) =>
                  updateNestedField("s1", "diversityInclusion", e.target.value)
                }
                placeholder="Diversity and inclusion"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />
              <textarea
                value={reportForm.s1.remunerationMetrics}
                onChange={(e) =>
                  updateNestedField("s1", "remunerationMetrics", e.target.value)
                }
                placeholder="Remuneration metrics"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />

              <h3>G1 - Business Conduct</h3>
              <textarea
                value={reportForm.g1.businessConductPolicies}
                onChange={(e) =>
                  updateNestedField("g1", "businessConductPolicies", e.target.value)
                }
                placeholder="Business conduct policies"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />
              <textarea
                value={reportForm.g1.antiCorruption}
                onChange={(e) =>
                  updateNestedField("g1", "antiCorruption", e.target.value)
                }
                placeholder="Anti-corruption"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />
              <textarea
                value={reportForm.g1.whistleblowing}
                onChange={(e) =>
                  updateNestedField("g1", "whistleblowing", e.target.value)
                }
                placeholder="Whistleblowing"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />
              <textarea
                value={reportForm.g1.paymentPractices}
                onChange={(e) =>
                  updateNestedField("g1", "paymentPractices", e.target.value)
                }
                placeholder="Payment practices"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />

              <h3>Double Materiality</h3>

              {reportForm.materialityTopics.map((topic, index) => (
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
                      <input
                        value={topic.topicCode}
                        onChange={(e) =>
                          updateMaterialityTopic(index, "topicCode", e.target.value)
                        }
                        placeholder="Topic code"
                        style={{
                          padding: "10px",
                          borderRadius: "10px",
                          border: "1px solid #d1d5db"
                        }}
                      />
                      <input
                        value={topic.topicLabel}
                        onChange={(e) =>
                          updateMaterialityTopic(index, "topicLabel", e.target.value)
                        }
                        placeholder="Topic label"
                        style={{
                          padding: "10px",
                          borderRadius: "10px",
                          border: "1px solid #d1d5db"
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                      {[
                        ["severity", "Severity"],
                        ["scale", "Scale"],
                        ["scope", "Scope"],
                        ["irremediability", "Irrem."],
                        ["likelihood", "Impact Likelihood"]
                      ].map(([field, label]) => (
                        <div key={field}>
                          <div style={{ fontSize: "12px", marginBottom: "4px" }}>{label}</div>
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

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                      <div>
                        <div style={{ fontSize: "12px", marginBottom: "4px" }}>Magnitude</div>
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
                          style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "10px",
                            border: "1px solid #d1d5db"
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", marginBottom: "4px" }}>Likelihood</div>
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
                          style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "10px",
                            border: "1px solid #d1d5db"
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", marginBottom: "4px" }}>Time horizon</div>
                        <select
                          value={topic.financialMateriality.timeHorizon}
                          onChange={(e) =>
                            updateMaterialityTopic(
                              index,
                              "financialMateriality.timeHorizon",
                              e.target.value
                            )
                          }
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

                    <input
                      value={topic.stakeholdersConsulted}
                      onChange={(e) =>
                        updateMaterialityTopic(
                          index,
                          "stakeholdersConsulted",
                          e.target.value
                        )
                      }
                      placeholder="Stakeholders consulted (comma-separated)"
                      style={{
                        padding: "10px",
                        borderRadius: "10px",
                        border: "1px solid #d1d5db"
                      }}
                    />

                    <label style={{ fontSize: "14px", color: "#4b5563" }}>
                      <input
                        type="checkbox"
                        checked={!!topic.isMaterial}
                        onChange={(e) =>
                          updateMaterialityTopic(index, "isMaterial", e.target.checked)
                        }
                        style={{ marginRight: "8px" }}
                      />
                      Mark as material
                    </label>

                    <textarea
                      value={topic.rationale}
                      onChange={(e) =>
                        updateMaterialityTopic(index, "rationale", e.target.value)
                      }
                      placeholder="Rationale"
                      rows={3}
                      style={{
                        padding: "10px",
                        borderRadius: "10px",
                        border: "1px solid #d1d5db"
                      }}
                    />

                    {reportForm.materialityTopics.length > 1 && (
                      <button
                        onClick={() => removeMaterialityTopic(index)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border: "1px solid #ef4444",
                          background: "#ffffff",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontWeight: "bold"
                        }}
                      >
                        Remove Topic
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={addMaterialityTopic}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Add Material Topic
              </button>

              <h3>AI Draft</h3>

              <button
                onClick={generateAiDraft}
                disabled={aiLoading}
                style={{
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#7c3aed",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor: aiLoading ? "not-allowed" : "pointer",
                  opacity: aiLoading ? 0.7 : 1
                }}
              >
                {aiLoading ? "Generating AI draft..." : "Generate AI Draft"}
              </button>

              <textarea
                value={reportForm.aiDraft.executiveSummary}
                onChange={(e) =>
                  updateNestedField("aiDraft", "executiveSummary", e.target.value)
                }
                placeholder="AI executive summary"
                rows={4}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />
              <textarea
                value={reportForm.aiDraft.disclosureDraft}
                onChange={(e) =>
                  updateNestedField("aiDraft", "disclosureDraft", e.target.value)
                }
                placeholder="AI disclosure draft"
                rows={6}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />
              <textarea
                value={reportForm.aiDraft.dataGaps}
                onChange={(e) =>
                  updateNestedField("aiDraft", "dataGaps", e.target.value)
                }
                placeholder="AI data gaps"
                rows={4}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />

              <textarea
                value={reportForm.taxonomyMappingNotes}
                onChange={(e) => setTopField("taxonomyMappingNotes", e.target.value)}
                placeholder="Taxonomy mapping notes"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />

              <button
                onClick={saveReport}
                disabled={loading}
                style={{
                  marginTop: "8px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#1976d2",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Saving..." : "Save Report"}
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "20px"
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
              <h2 style={{ marginTop: 0 }}>Portfolio Analytics</h2>

              {reports.length === 0 ? (
                <p style={{ color: "#6b7280" }}>
                  No reports yet. Create your first ESRS report to populate the dashboard.
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
                    <option key={report._id || report.id} value={report._id || report.id}>
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
            reports.map((report) => (
              <div
                key={report._id || report.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  padding: "20px",
                  marginBottom: "16px",
                  borderLeft: `8px solid ${
                    (report.scorecard?.overallScore || 0) >= 80
                      ? "#2e7d32"
                      : (report.scorecard?.overallScore || 0) >= 60
                      ? "#f57c00"
                      : "#d32f2f"
                  }`,
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
                      Sector: {report.sector} | Year: {report.reportingYear} | Scope:{" "}
                      {report.reportingScope}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "999px",
                      background:
                        (report.scorecard?.overallScore || 0) >= 80
                          ? "#2e7d32"
                          : (report.scorecard?.overallScore || 0) >= 60
                          ? "#f57c00"
                          : "#d32f2f",
                      color: "#ffffff",
                      fontWeight: "bold"
                    }}
                  >
                    {report.scorecard?.overallScore || 0}
                  </div>
                </div>

                <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                  <strong>Benchmark:</strong> {report.scorecard?.benchmark || 0}
                  <span style={{ marginLeft: 16 }}>
                    <strong>Review:</strong> {report.reviewStatus}
                  </span>
                  <span style={{ marginLeft: 16 }}>
                    <strong>Material topics:</strong>{" "}
                    {Array.isArray(report.materialityTopics)
                      ? report.materialityTopics.filter((t) => t.isMaterial).length
                      : 0}
                  </span>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <strong>Climate:</strong> {report.scorecard?.climateScore || 0}
                  <span style={{ marginLeft: 16 }}>
                    <strong>Social:</strong> {report.scorecard?.socialScore || 0}
                  </span>
                  <span style={{ marginLeft: 16 }}>
                    <strong>Governance:</strong>{" "}
                    {report.scorecard?.governanceScore || 0}
                  </span>
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
                  <strong>AI Executive Summary</strong>
                  <div style={{ marginTop: "8px" }}>
                    {report.aiDraft?.executiveSummary || "No AI summary"}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap"
                  }}
                >
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
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;