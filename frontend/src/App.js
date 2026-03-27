import React, { useEffect, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  PieChart,
  Pie,
  Cell
} from "recharts";

const API = "https://ecovanta.onrender.com";

function App() {
  const [reports, setReports] = useState([]);
  const [company, setCompany] = useState("");
  const [environmental, setEnvironmental] = useState(1);
  const [social, setSocial] = useState(1);
  const [governance, setGovernance] = useState(1);

  useEffect(() => {
  const generateAllAI = async () => {
    const updatedReports = await Promise.all(
      reports.map(async (r) => {
        if (r.aiInsights) return r;

        const ai = await getAIInsights(r);
        return { ...r, aiInsights: ai };
      })
    );

    setReports(updatedReports);
  };

  if (reports.length > 0) {
    generateAllAI();
  }
}, [reports]);

  const getRating = (score) => {
    if (score >= 80) return "A (Leader)";
    if (score >= 60) return "B (Compliant)";
    if (score >= 40) return "C (At Risk)";
    return "D (Critical)";
  };

  const getInsights = (r) => {
    let insights = [];

    if (r.environmental <= 2)
      insights.push("Improve environmental practices");
    if (r.social <= 2)
      insights.push("Strengthen social policies");
    if (r.governance <= 2)
      insights.push("Enhance governance");

    if (insights.length === 0)
      insights.push("Strong ESG performance");

    return insights;
  };

  const getAIInsights = async (r) => {
    try {
      const res = await fetch(`${API}/ai-insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          environmental: r.environmental,
          social: r.social,
          governance: r.governance
        })
      });

      const data = await res.json();
      return data.insights;
    } catch (err) {
      console.error(err);
      return "AI unavailable";
    }
  };

  const addReport = async () => {
    if (!company) return alert("Enter company");

    const score =
      (environmental / 3) * 40 +
      (social / 3) * 30 +
      (governance / 3) * 30;

    await fetch(`${API}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company,
        score,
        environmental,
        social,
        governance
      })
    });

    setReports((prev) => [
      ...prev,
      {
        id: Date.now(),
        company,
        score,
        environmental,
        social,
        governance
      }
    ]);

    setCompany("");
  };

  const generatePDF = async (r) => {
    const doc = new jsPDF();
    doc.text(`Company: ${r.company}`, 20, 20);
    doc.text(`Score: ${Math.round(r.score)}`, 20, 30);

    const el = document.getElementById(`chart-${r.id}`);
    if (el) {
      const canvas = await html2canvas(el);
      doc.addImage(canvas.toDataURL(), "PNG", 20, 40, 150, 100);
    }

    doc.save(`${r.company}.pdf`);
  };

  return (
    <div style={{ padding: 20, background: "#f5f7fa" }}>
      <h1>Ecovanta ESG Dashboard</h1>

      {/* INPUT */}
      <input
        value={company}
        placeholder="Company"
        onChange={(e) => setCompany(e.target.value)}
      />

      <div>
        <label>Environmental</label>
        <select
          value={environmental}
          onChange={(e) => setEnvironmental(Number(e.target.value))}
        >
          <option value="1">High Risk</option>
          <option value="2">Moderate</option>
          <option value="3">Best Practice</option>
        </select>
      </div>

      <div>
        <label>Social</label>
        <select
          value={social}
          onChange={(e) => setSocial(Number(e.target.value))}
        >
          <option value="1">High Risk</option>
          <option value="2">Moderate</option>
          <option value="3">Best Practice</option>
        </select>
      </div>

      <div>
        <label>Governance</label>
        <select
          value={governance}
          onChange={(e) => setGovernance(Number(e.target.value))}
        >
          <option value="1">High Risk</option>
          <option value="2">Moderate</option>
          <option value="3">Best Practice</option>
        </select>
      </div>

      <button onClick={addReport}>Generate ESG</button>

      {/* KPI */}
      <h3>Total: {reports.length}</h3>
      <h3>
        Avg:{" "}
        {reports.length
          ? Math.round(
              reports.reduce((s, r) => s + r.score, 0) / reports.length
            )
          : 0}
      </h3>

      {/* REPORTS */}

<div style={{ display: "flex", gap: 20, marginBottom: 30 }}>

  <div style={{ background: "#fff", padding: 20, borderRadius: 10, flex: 1 }}>
    <h3>Total Companies</h3>
    <p>{reports.length}</p>
  </div>

  <div style={{ background: "#fff", padding: 20, borderRadius: 10, flex: 1 }}>
    <h3>Average Score</h3>
    <p>
      {reports.length
        ? Math.round(
            reports.reduce((sum, r) => sum + r.score, 0) / reports.length
          )
        : 0}
    </p>
  </div>

  <div style={{ background: "#fff", padding: 20, borderRadius: 10, flex: 1 }}>
    <h3>Top Performer</h3>
    <p>
      {reports.length
        ? reports.reduce((best, r) =>
            r.score > best.score ? r : best
          ).company
        : "-"}
    </p>
  </div>

  <div style={{ background: "#fff", padding: 20, borderRadius: 10, flex: 1 }}>
    <h3>At Risk</h3>
    <p>
      {reports.length
        ? reports.reduce((worst, r) =>
            r.score < worst.score ? r : worst
          ).company
        : "-"}
    </p>
  </div>

</div>

      {reports.map((r) => (
        <div key={r.id} style={{ background: "#fff", padding: 20, borderRadius: 10 }}>

  {/* Company */}
  <h3>{r.company}</h3>

  {/* Score */}
  <p>Score: <b>{Math.round(r.score)}</b></p>
  <p>Assessment: <b>{getRating(r.score)}</b></p>

  {/* Chart */}
  <div id={`chart-${r.id}`}>
    <PieChart width={200} height={200}>
      <Pie
        data={[
          { name: "E", value: r.environmental },
          { name: "S", value: r.social },
          { name: "G", value: r.governance }
        ]}
        dataKey="value"
      >
        <Cell fill="#4CAF50" />
        <Cell fill="#2196F3" />
        <Cell fill="#FFC107" />
      </Pie>
    </PieChart>
  </div>

  {/* AI Insights */}
  <div style={{ marginTop: 10 }}>
    <b>AI Recommendations:</b>
    <p>{r.aiInsights || "Generating AI insights..."}</p>
  </div>

</div>

export default App;