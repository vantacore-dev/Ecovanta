import React, { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";


<p style={{ color: "red", fontSize: "20px", fontWeight: "bold" }}>
  VERSION: PDF BUTTON TEST
</p>

const API = "https://ecovanta.onrender.com";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [reports, setReports] = useState([]);
  const [company, setCompany] = useState("");
  const [sector, setSector] = useState("tech");
  const [e, setE] = useState(1);
  const [s, setS] = useState(1);
  const [g, setG] = useState(1);
  const [benchmark, setBenchmark] = useState(60);
  const [analytics, setAnalytics] = useState({
    totalCompanies: 0,
    averageScore: 0,
    highRisk: 0,
    moderateRisk: 0,
    lowRisk: 0,
    belowBenchmark: 0
  });
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const calculateScore = (env, soc, gov) =>
    Math.round((env / 3) * 40 + (soc / 3) * 30 + (gov / 3) * 30);

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

  const login = useCallback(async () => {
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "demo@test.com",
          password: "1234"
        })
      });

      const data = await res.json();

      if (data?.token) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
      } else {
        setStatusMessage("Login failed.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setStatusMessage("Login error.");
    }
  }, []);

  const loadReports = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API}/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to load reports");

      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("loadReports error:", err);
    }
  }, [token]);

  const loadAnalytics = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API}/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to load analytics");

      const data = await res.json();
      setAnalytics({
        totalCompanies: data.totalCompanies || 0,
        averageScore: data.averageScore || 0,
        highRisk: data.highRisk || 0,
        moderateRisk: data.moderateRisk || 0,
        lowRisk: data.lowRisk || 0,
        belowBenchmark: data.belowBenchmark || 0
      });
    } catch (err) {
      console.error("loadAnalytics error:", err);
    }
  }, [token]);

  const loadBenchmark = useCallback(async () => {
    try {
      const res = await fetch(`${API}/benchmark/${sector}`);
      if (!res.ok) throw new Error("Failed to load benchmark");
      const data = await res.json();
      setBenchmark(Number(data.benchmark || 60));
    } catch (err) {
      console.error("loadBenchmark error:", err);
      setBenchmark(60);
    }
  }, [sector]);

  const refreshDashboard = useCallback(async () => {
    await loadReports();
    await loadAnalytics();
  }, [loadReports, loadAnalytics]);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    } else {
      login();
    }
  }, [login]);

  useEffect(() => {
    if (!token) return;
    loadReports();
    loadAnalytics();
  }, [token, loadReports, loadAnalytics]);

  useEffect(() => {
    loadBenchmark();
  }, [loadBenchmark]);

  const addReport = async () => {
    if (!company.trim()) {
      alert("Please enter a company name");
      return;
    }

    if (!token) {
      alert("Login not ready yet. Please try again.");
      return;
    }

    setLoading(true);
    setStatusMessage("");

    const score = calculateScore(e, s, g);
    let aiInsights = "No AI insights available";

    try {
      const ai = await fetch(`${API}/ai-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environmental: e,
          social: s,
          governance: g,
          benchmark
        })
      });

      const aiData = await ai.json();
      if (aiData?.insights) {
        aiInsights = aiData.insights;
      }
    } catch (err) {
      console.error("AI error:", err);
    }

    const newReport = {
      company: company.trim(),
      sector,
      environmental: e,
      social: s,
      governance: g,
      score,
      benchmark,
      aiInsights
    };

    try {
      const save = await fetch(`${API}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newReport)
      });

      const contentType = save.headers.get("content-type") || "";
      let responseBody;

      if (contentType.includes("application/json")) {
        responseBody = await save.json();
      } else {
        responseBody = await save.text();
      }

      if (!save.ok) {
        const message =
          typeof responseBody === "string"
            ? responseBody
            : responseBody?.error || responseBody?.details || "Report save failed";

        alert(`Report save failed: ${message}`);
        return;
      }

      setReports((prev) => [responseBody, ...prev]);
      setCompany("");
      setE(1);
      setS(1);
      setG(1);
      setStatusMessage("Report generated successfully.");
      await refreshDashboard();
    } catch (err) {
      console.error("Report creation error:", err);
      alert(`Could not create report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!token) {
      alert("Login required");
      return;
    }

    try {
      const res = await fetch(`${API}/reports/download/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
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
      link.download = "ecovanta_reports.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download PDF error:", err);
      alert("Download failed");
    }
  };

  const chartData = reports.map((r) => ({
    company: r.company,
    score: r.score
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
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
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
            <h1 style={{ marginBottom: "8px" }}>Ecovanta Risk and Compliance</h1>
            <p style={{ marginTop: 0, color: "#6b7280" }}>
              ESG intelligence platform
            </p>
          </div>

          <button
            onClick={downloadPDF}
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              border: "none",
              background: "#1976d2",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
              minWidth: "220px"
            }}
          >
            Download Reports as PDF
          </button>
        </div>

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
                ["Environmental", e, setE],
                ["Social", s, setS],
                ["Governance", g, setG]
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
            reports.map((r) => (
              <div
                key={r._id || r.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  padding: "20px",
                  marginBottom: "16px",
                  borderLeft: `8px solid ${getRiskColor(r.score)}`,
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
                    <h3 style={{ marginTop: 0, marginBottom: "8px" }}>{r.company}</h3>
                    <div style={{ color: "#6b7280", marginBottom: "8px" }}>
                      Sector: {r.sector}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "999px",
                      background: getRiskColor(r.score),
                      color: "#ffffff",
                      fontWeight: "bold"
                    }}
                  >
                    {r.score} — {getRiskLabel(r.score)}
                  </div>
                </div>

                <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                  <strong>Benchmark:</strong> {r.benchmark}
                  <span style={{ marginLeft: 16 }}>
                    <strong>Gap:</strong> {r.score - r.benchmark}
                  </span>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <strong>E:</strong> {r.environmental}
                  <span style={{ marginLeft: 16 }}>
                    <strong>S:</strong> {r.social}
                  </span>
                  <span style={{ marginLeft: 16 }}>
                    <strong>G:</strong> {r.governance}
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
                  <div style={{ marginTop: "8px" }}>{r.aiInsights}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: "16px" }}>
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
  );
}

export default App;