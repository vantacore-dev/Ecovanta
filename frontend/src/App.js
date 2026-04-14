import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

<p style={{ color: "red", fontWeight: "bold" }}>
  Frontend build: v3-report-debug
</p>


const API = "https://ecovanta.onrender.com";

const initialAnalytics = {
  totalCompanies: 0,
  averageScore: 0,
  highRisk: 0,
  moderateRisk: 0,
  lowRisk: 0,
  belowBenchmark: 0
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [reports, setReports] = useState([]);
  const [company, setCompany] = useState("");
  const [sector, setSector] = useState("tech");
  const [environmental, setEnvironmental] = useState(1);
  const [social, setSocial] = useState(1);
  const [governance, setGovernance] = useState(1);
  const [benchmark, setBenchmark] = useState(60);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const calculateScore = (env, soc, gov) => {
    return Math.round((env / 3) * 40 + (soc / 3) * 30 + (gov / 3) * 30);
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

  const resetForm = () => {
    setCompany("");
    setSector("tech");
    setEnvironmental(1);
    setSocial(1);
    setGovernance(1);
  };

  const login = async () => {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "demo@test.com",
        password: "1234"
      })
    });

    const data = await res.json();

    if (!res.ok || !data?.token) {
      throw new Error(data?.error || "Login failed");
    }

    localStorage.setItem("token", data.token);
    setToken(data.token);
    return data.token;
  };

  const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type") || "";

    let data;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const message =
        typeof data === "string"
          ? data
          : data?.error || data?.details || "Request failed";
      throw new Error(message);
    }

    return data;
  };

  const loadBenchmark = async (selectedSector) => {
    try {
      const data = await fetchJson(`${API}/benchmark/${selectedSector}`);
      setBenchmark(Number(data?.benchmark || 60));
    } catch (error) {
      console.error("Benchmark load error:", error);
      setBenchmark(60);
    }
  };

  const loadReports = async (currentToken) => {
    const data = await fetchJson(`${API}/reports`, {
      headers: {
        ...authHeaders,
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
      }
    });

    setReports(Array.isArray(data) ? data : []);
    return Array.isArray(data) ? data : [];
  };

  const normalizeAnalytics = (data, currentReports = []) => {
    if (
      data &&
      (
        "totalCompanies" in data ||
        "averageScore" in data ||
        "highRisk" in data ||
        "moderateRisk" in data ||
        "lowRisk" in data ||
        "belowBenchmark" in data
      )
    ) {
      return {
        totalCompanies: Number(data.totalCompanies || 0),
        averageScore: Number(data.averageScore || 0),
        highRisk: Number(data.highRisk || 0),
        moderateRisk: Number(data.moderateRisk || 0),
        lowRisk: Number(data.lowRisk || 0),
        belowBenchmark: Number(data.belowBenchmark || 0)
      };
    }

    if (data && ("total" in data || "average" in data || "high" in data || "low" in data)) {
      return {
        totalCompanies: Number(data.total || 0),
        averageScore: Number(data.average || 0),
        highRisk: Number(data.high || 0),
        moderateRisk: 0,
        lowRisk: Number(data.low || 0),
        belowBenchmark: 0
      };
    }

    return deriveAnalyticsFromReports(currentReports);
  };

  const deriveAnalyticsFromReports = (reportList) => {
    const totalCompanies = reportList.length;
    const averageScore = totalCompanies
      ? Math.round(
          reportList.reduce((sum, report) => sum + Number(report.score || 0), 0) /
            totalCompanies
        )
      : 0;

    const highRisk = reportList.filter((report) => Number(report.score) < 60).length;
    const moderateRisk = reportList.filter(
      (report) => Number(report.score) >= 60 && Number(report.score) < 80
    ).length;
    const lowRisk = reportList.filter((report) => Number(report.score) >= 80).length;
    const belowBenchmark = reportList.filter(
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
  };

  const loadAnalytics = async (currentToken, currentReports = []) => {
    try {
      const data = await fetchJson(`${API}/analytics/overview`, {
        headers: {
          ...authHeaders,
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
        }
      });

      setAnalytics(normalizeAnalytics(data, currentReports));
    } catch (error) {
      console.error("Analytics load error:", error);
      setAnalytics(deriveAnalyticsFromReports(currentReports));
    }
  };

  const refreshDashboard = async (currentToken = token) => {
    if (!currentToken) return;

    try {
      setStatusMessage("Refreshing dashboard...");
      const loadedReports = await loadReports(currentToken);
      await loadAnalytics(currentToken, loadedReports);
      setStatusMessage("Dashboard refreshed.");
    } catch (error) {
      console.error("Refresh dashboard error:", error);
      setStatusMessage(`Refresh failed: ${error.message}`);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setBooting(true);
      try {
        let currentToken = token;

        if (!currentToken) {
          currentToken = await login();
        }

        if (cancelled) return;

        await loadReports(currentToken);
        await loadAnalytics(currentToken, []);
      } catch (error) {
        console.error("Startup error:", error);
        if (!cancelled) {
          setStatusMessage(`Startup error: ${error.message}`);
        }
      } finally {
        if (!cancelled) {
          setBooting(false);
        }
      }
    };

    boot();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadBenchmark(sector);
  }, [sector]);

  const addReport = async () => {
    if (!company.trim()) {
      alert("Please enter a company name.");
      return;
    }

    if (!token) {
      alert("Login not ready yet. Please try again.");
      return;
    }

    setLoading(true);
    setStatusMessage("Generating report...");

    const score = calculateScore(environmental, social, governance);
    let aiInsights = "No AI insights available";

    try {
      try {
        const aiData = await fetchJson(`${API}/ai-insights`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            environmental,
            social,
            governance,
            benchmark
          })
        });

        if (aiData?.insights) {
          aiInsights = aiData.insights;
        }
      } catch (error) {
        console.error("AI insights error:", error);
      }

      const newReport = {
        company: company.trim(),
        sector,
        environmental: Number(environmental),
        social: Number(social),
        governance: Number(governance),
        score: Number(score),
        benchmark: Number(benchmark),
        aiInsights
      };

      const savedReport = await fetchJson(`${API}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify(newReport)
      });

      const updatedReports = [savedReport, ...reports];
      setReports(updatedReports);
      setAnalytics(deriveAnalyticsFromReports(updatedReports));
      resetForm();
      setStatusMessage("Report generated successfully.");
    } catch (error) {
      console.error("Report save error:", error);
      alert(`Report save failed: ${error.message}`);
      setStatusMessage(`Report save failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const chartData = reports.map((report) => ({
    company: report.company,
    score: Number(report.score || 0)
  }));

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
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto"
        }}
      >
        <h1 style={{ marginBottom: "8px" }}>Ecovanta Risk and Compliance</h1>
        <p style={{ marginTop: 0, color: "#6b7280" }}>
          ESG intelligence platform
        </p>

        <div
          style={{
            marginTop: "12px",
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
          <span style={{ marginLeft: 16 }}>
            App state: {booting ? "Starting..." : "Ready"}
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
            { title: "Total Companies", value: analytics.totalCompanies },
            { title: "Average Score", value: analytics.averageScore },
            { title: "High Risk", value: analytics.highRisk },
            { title: "Moderate Risk", value: analytics.moderateRisk },
            { title: "Low Risk", value: analytics.lowRisk },
            { title: "Below Benchmark", value: analytics.belowBenchmark }
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
            gridTemplateColumns: "minmax(320px, 380px) 1fr",
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
            <h2 style={{ marginTop: 0 }}>Create ESG Report</h2>

            <div style={{ display: "grid", gap: "12px" }}>
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Company name"
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db"
                }}
              />

              <select
                value={sector}
                onChange={(event) => setSector(event.target.value)}
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

              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb"
                }}
              >
                Current Benchmark: <strong>{benchmark}</strong>
              </div>

              {[
                ["Environmental", environmental, setEnvironmental],
                ["Social", social, setSocial],
                ["Governance", governance, setGovernance]
              ].map(([label, value, setter]) => (
                <div key={label}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      color: "#4b5563"
                    }}
                  >
                    {label}
                  </label>
                  <select
                    value={value}
                    onChange={(event) => setter(Number(event.target.value))}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "none",
                      background:
                        value === 1 ? "#fee2e2" : value === 2 ? "#ffedd5" : "#dcfce7",
                      color:
                        value === 1 ? "#991b1b" : value === 2 ? "#9a3412" : "#166534",
                      fontWeight: "bold"
                    }}
                  >
                    <option value={1}>High Risk</option>
                    <option value={2}>Moderate Risk</option>
                    <option value={3}>Best Practice</option>
                  </select>
                </div>
              ))}

              <button
                onClick={addReport}
                disabled={loading || booting}
                style={{
                  marginTop: "8px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#1976d2",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor: loading || booting ? "not-allowed" : "pointer",
                  opacity: loading || booting ? 0.7 : 1
                }}
              >
                {loading ? "Generating..." : "Generate Report"}
              </button>
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
            <h2 style={{ marginTop: 0 }}>Portfolio Analytics</h2>

            {reports.length === 0 ? (
              <p style={{ color: "#6b7280" }}>
                No reports yet. Create your first ESG report to populate the portfolio dashboard.
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
                  borderLeft: `8px solid ${getRiskColor(Number(report.score || 0))}`,
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
                    <h3 style={{ marginTop: 0, marginBottom: "8px" }}>{report.company}</h3>
                    <div style={{ color: "#6b7280", marginBottom: "8px" }}>
                      Sector: {report.sector}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "999px",
                      background: getRiskColor(Number(report.score || 0)),
                      color: "#ffffff",
                      fontWeight: "bold"
                    }}
                  >
                    {report.score} — {getRiskLabel(Number(report.score || 0))}
                  </div>
                </div>

                <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                  <strong>Benchmark:</strong> {report.benchmark}
                  <span style={{ marginLeft: 16 }}>
                    <strong>Gap:</strong> {Number(report.score || 0) - Number(report.benchmark || 0)}
                  </span>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <strong>E:</strong> {report.environmental}
                  <span style={{ marginLeft: 16 }}>
                    <strong>S:</strong> {report.social}
                  </span>
                  <span style={{ marginLeft: 16 }}>
                    <strong>G:</strong> {report.governance}
                  </span>
                </div>

                <div
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "14px",
                    whiteSpace: "pre-wrap"
                  }}
                >
                  <strong>AI Recommendations</strong>
                  <div style={{ marginTop: "8px" }}>{report.aiInsights}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: "16px" }}>
          <button
            onClick={() => refreshDashboard()}
            disabled={!token}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              cursor: token ? "pointer" : "not-allowed",
              opacity: token ? 1 : 0.6
            }}
          >
            Refresh Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;