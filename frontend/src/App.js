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
    dataGaps: ""
  },
  scorecard: {
    benchmark: 0,
    overallScore: 0
  },
  reviewStatus: "draft",
  materialityTopics: [{ ...defaultMaterialityTopic }]
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

  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [reports, setReports] = useState([]);
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
      const safeReports = Array.isArray(data) ? data : [];
      setReports(safeReports);
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
        ? Math.round(scores.reduce((sum, value) => sum + value, 0) / totalReports)
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

  const loadBenchmark = useCallback(async () => {
    try {
      const data = await fetchJson(`${API}/benchmark/${reportForm.sector}`);
      setBenchmark(Number(data.benchmark || 60));
    } catch (err) {
      console.error("Load benchmark error:", err);
      setBenchmark(60);
    }
  }, [reportForm.sector, fetchJson]);

  const refreshDashboard = useCallback(async () => {
    await Promise.all([loadUser(), loadReports(), loadAnalytics()]);
  }, [loadUser, loadReports, loadAnalytics]);

  useEffect(() => {
    if (!token) return;
    refreshDashboard();
  }, [token, refreshDashboard]);

  useEffect(() => {
    loadBenchmark();
  }, [loadBenchmark]);

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
    setSelectedReportId("");
    setStatusMessage("Logged out.");
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

      nextTopics[index] = current;

      return {
        ...prev,
        materialityTopics: nextTopics
      };
    });
  };

  const generateAiDraft = async () => {
    console.log("Generate AI Draft clicked");

    if (!token) {
      alert("Login required.");
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

    console.log("AI payload being sent:", payload);

    if (!payload.companyName || !payload.sector) {
      setStatusMessage("Company name and sector must be filled before AI draft.");
      return;
    }

    try {
      setAiLoading(true);
      setStatusMessage("");

      //const data = await fetchJson(`${API}/ai-draft`, {
      const data = await fetchJson(`${API}/ai/ai-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify(payload)
      });

      console.log("AI draft response:", data);

      //setReportForm((prev) => ({
        //...prev,
        //aiDraft: {
          //executiveSummary: data.executiveSummary || "",
          //disclosureDraft: data.disclosureDraft || "",
          //dataGaps: data.dataGaps || ""
        //}
      //}));

setReportForm((prev) => ({
  ...prev,
  aiDraft: {
    executiveSummary:
      typeof data.executiveSummary === "string"
        ? data.executiveSummary
        : JSON.stringify(data.executiveSummary, null, 2),

    disclosureDraft:
      typeof data.disclosureDraft === "string"
        ? data.disclosureDraft
        : JSON.stringify(data.disclosureDraft, null, 2),

    dataGaps:
      typeof data.dataGaps === "string"
        ? data.dataGaps
        : Array.isArray(data.dataGaps)
        ? data.dataGaps.join("\n- ")
        : JSON.stringify(data.dataGaps, null, 2)
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

      const payload = {
        ...reportForm,
        scorecard: {
          ...reportForm.scorecard,
          benchmark
        },
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
        impactsRisksOpportunities: found.esrs2?.impactsRisksOpportunities || "",
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
      aiDraft: {
        executiveSummary: found.aiDraft?.executiveSummary || "",
        disclosureDraft: found.aiDraft?.disclosureDraft || "",
        dataGaps: found.aiDraft?.dataGaps || ""
      },
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
            : ""
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
    alert("Delete route is not included yet. Add DELETE /reports/:id on the backend first.");
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
            <h1 style={{ marginBottom: "8px" }}>Ecovanta CSRD-Ready Platform</h1>
            <p style={{ marginTop: 0, color: "#6b7280" }}>
              ESRS-aligned sustainability reporting workflow.
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ marginBottom: "8px" }}>
              <strong>Plan:</strong> {user?.plan || "free"}
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                justifyContent: "flex-end"
              }}
            >
              {user?.plan === "free" && (
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
                    Upgrade to Pro
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
                    Upgrade to Enterprise
                  </button>
                </>
              )}

              {user?.plan === "pro" && (
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
            marginBottom: "20px",
            padding: "12px 16px",
            background: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #e5e7eb"
          }}
        >
          <strong>Debug:</strong>
          <span style={{ marginLeft: 8 }}>Token: {token ? "OK" : "Missing"}</span>
          <span style={{ marginLeft: 16 }}>Reports loaded: {reports.length}</span>
          <span style={{ marginLeft: 16 }}>Benchmark: {benchmark}</span>
        </div>

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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px"
                }}
              >
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
                </select>

                <input
                  type="number"
                  value={reportForm.reportingYear}
                  onChange={(e) => setTopField("reportingYear", Number(e.target.value))}
                  placeholder="Reporting year"
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db"
                  }}
                />
              </div>

              <h3>ESRS 2</h3>
              <textarea
                value={reportForm.esrs2.governance}
                onChange={(e) => setNestedField("esrs2", "governance", e.target.value)}
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
                onChange={(e) => setNestedField("esrs2", "strategy", e.target.value)}
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
                  setNestedField("esrs2", "impactsRisksOpportunities", e.target.value)
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
                onChange={(e) => setNestedField("esrs2", "metricsTargets", e.target.value)}
                placeholder="Metrics and targets"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />

              <h3>E1 - Climate</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px"
                }}
              >
                <input
                  type="number"
                  value={reportForm.e1.scope1Emissions}
                  onChange={(e) =>
                    setNestedField("e1", "scope1Emissions", Number(e.target.value))
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
                    setNestedField("e1", "scope2Emissions", Number(e.target.value))
                  }
                  placeholder="Scope 2 emissions"
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db"
                  }}
                />
              </div>

              <input
                type="number"
                value={reportForm.e1.scope3Emissions}
                onChange={(e) =>
                  setNestedField("e1", "scope3Emissions", Number(e.target.value))
                }
                placeholder="Scope 3 emissions"
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />

              <textarea
                value={reportForm.e1.climatePolicies}
                onChange={(e) => setNestedField("e1", "climatePolicies", e.target.value)}
                placeholder="Climate policies"
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
                  setNestedField("s1", "workforcePolicies", e.target.value)
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
                value={reportForm.s1.diversityInclusion}
                onChange={(e) =>
                  setNestedField("s1", "diversityInclusion", e.target.value)
                }
                placeholder="Diversity and inclusion"
                rows={3}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />

              <h3>G1 - Business Conduct</h3>
              <textarea
                value={reportForm.g1.antiCorruption}
                onChange={(e) =>
                  setNestedField("g1", "antiCorruption", e.target.value)
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
                  setNestedField("g1", "whistleblowing", e.target.value)
                }
                placeholder="Whistleblowing"
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

                    <input
                      value={topic.stakeholdersConsulted}
                      onChange={(e) =>
                        updateMaterialityTopic(index, "stakeholdersConsulted", e.target.value)
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
                  setNestedField("aiDraft", "executiveSummary", e.target.value)
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
                  setNestedField("aiDraft", "disclosureDraft", e.target.value)
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
                  setNestedField("aiDraft", "dataGaps", e.target.value)
                }
                placeholder="AI data gaps"
                rows={4}
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
            reports.map((report) => {
              const score = Number(report.scorecard?.overallScore || 0);

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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default App;