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

  // -------------------
  // Helper functions
  // -------------------
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

  // -------------------
  // Load functions (useCallback for stable references)
  // -------------------
  const loadReports = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();
      setReports(data);
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
      setAnalytics(data);
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
    }
  }, [sector]);

  // -------------------
  // Effects
  // -------------------
  useEffect(() => {
    if (!token) return;
    loadReports();
    loadAnalytics();
  }, [token, loadReports, loadAnalytics]);

  useEffect(() => {
    loadBenchmark();
  }, [loadBenchmark]);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) login();
    else setToken(savedToken);
  }, []);

  // -------------------
  // Login
  // -------------------
  const login = async () => {
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@test.com", password: "1234" })
      });
      const data = await res.json();
      if (data?.token) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
      } else {
        console.error("Login failed:", data);
        setStatusMessage("Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setStatusMessage("Login error");
    }
  };

  // -------------------
  // Generate Report
  // -------------------
  const addReport = async () => {
    if (!company.trim()) return alert("Please enter a company name");
    if (!token) return alert("Login not ready yet.");

    setLoading(true);
    setStatusMessage("");

    const score = calculateScore(e, s, g);
    let aiInsights = "No AI insights available";

    try {
      const ai = await fetch(`${API}/ai-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ environmental: e, social: s, governance: g, benchmark })
      });
      const aiData = await ai.json();
      if (aiData?.insights) aiInsights = aiData.insights;
    } catch (err) {
      console.error("AI error:", err);
    }

    const newReport = { company: company.trim(), sector, environmental: e, social: s, governance: g, score, benchmark, aiInsights };

    try {
      const save = await fetch(`${API}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newReport)
      });
      if (!save.ok) {
        const errText = await save.text();
        console.error("Save failed:", errText);
        alert("Report save failed: " + errText);
        setLoading(false);
        return;
      }

      const savedReport = await save.json();
      setReports((prev) => [savedReport, ...prev]);
      setStatusMessage("Report generated successfully.");
      setCompany(""); setE(1); setS(1); setG(1);
    } catch (err) {
      console.error("Report creation error:", err);
      alert("Could not create report.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------
  // PDF Download
  // -------------------
  const downloadPDF = async () => {
    if (!token) return alert("Login required");

    try {
      const res = await fetch(`${API}/reports/download/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const text = await res.text();
        return alert("Download failed: " + text);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "ecovanta_reports.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download PDF error:", err);
      alert("Download failed");
    }
  };

  // -------------------
  // Chart Data
  // -------------------
  const chartData = reports.map((r) => ({ company: r.company, score: r.score }));

  // -------------------
  // Render
  // -------------------
  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: "24px", fontFamily: "Arial, sans-serif", color: "#1f2937" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1>Ecovanta Risk and Compliance</h1>
        <p style={{ color: "#6b7280" }}>ESG intelligence platform</p>

        {/* Debug info */}
        <div style={{ padding: "12px 16px", background: "#fff", borderRadius: "10px", border: "1px solid #e5e7eb", marginBottom: "20px" }}>
          <strong>Debug:</strong> Token: {token ? "OK" : "Missing"}, Reports loaded: {reports.length}, Benchmark: {benchmark}
        </div>

        {statusMessage && (
          <div style={{ padding: "12px 16px", background: "#fff", borderRadius: "10px", border: "1px solid #d1d5db", marginBottom: "20px" }}>
            {statusMessage}
          </div>
        )}

      

        {/* Report form */}
        <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", marginBottom: "20px" }}>
          <h2>Create ESG Report</h2>
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" style={{ padding: "12px", borderRadius: "10px", border: "1px solid #d1d5db", width: "100%", marginBottom: "12px" }} />
          <select value={sector} onChange={(e) => setSector(e.target.value)} style={{ padding: "12px", borderRadius: "10px", border: "1px solid #d1d5db", width: "100%", marginBottom: "12px" }}>
            <option value="tech">Tech</option>
            <option value="energy">Energy</option>
            <option value="manufacturing">Manufacturing</option>
          </select>
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
            {[["Environmental", e, setE], ["Social", s, setS], ["Governance", g, setG]].map(([label, value, setter]) => (
              <div key={label} style={{ flex: 1 }}>
                <label>{label}</label>
                <select value={value} onChange={(e) => setter(Number(e.target.value))} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #d1d5db" }}>
                  <option value={1}>High Risk</option>
                  <option value={2}>Moderate Risk</option>
                  <option value={3}>Best Practice</option>
                </select>
              </div>
            ))}
          </div>
          <button onClick={addReport} disabled={loading} style={{ padding: "12px 16px", borderRadius: "10px", border: "none", background: "#1976d2", color: "#fff", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>


  {/* Download PDF Button */}
       
       <div style={{ marginBottom: "12px" }}>
  <button onClick={downloadPDF} style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #1976d2", background: "#1976d2", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
    Download Reports as PDF
  </button>
</div>

        {/* Analytics chart */}
        {reports.length > 0 && (
          <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <h2>Portfolio Analytics</h2>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default App;