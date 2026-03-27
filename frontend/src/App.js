import React, { useEffect, useState } from 'react';

import html2canvas from "html2canvas";

import jsPDF from "jspdf";

import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

const API = "https://ecovanta.onrender.com"; // 🔥 replace

function App() {
  const [reports, setReports] = useState([]);
  const [company, setCompany] = useState('');

const fetchReports = async () => {
  try {
    const res = await fetch(`${API}/reports`);
    const data = await res.json();

    if (Array.isArray(data)) {
      setReports(data);
    }
  } catch (err) {
    console.error(err);
  }
};

const [environmental, setEnvironmental] = useState(1);
const [social, setSocial] = useState(1);
const [governance, setGovernance] = useState(1);

const generatePDF = async (report) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("Ecovanta ESG Report", 20, 20);

  // Company + score
  doc.setFontSize(12);
  const companyName = report.company || "Unknown Company";
doc.text(`Company: ${companyName}`, 20, 40);
  doc.text(`ESG Score: ${Math.round(report.score)}`, 20, 50);

  // ⭐ Assessment (FIXED)
  doc.text(`Assessment: ${getRating(report.score)}`, 20, 60);

  // ESG breakdown
  const e = report.environmental ?? 1;
  const s = report.social ?? 1;
  const g = report.governance ?? 1;

  doc.text(`Environmental: ${(e / 3 * 40).toFixed(1)}`, 20, 75);
  doc.text(`Social: ${(s / 3 * 30).toFixed(1)}`, 20, 85);
  doc.text(`Governance: ${(g / 3 * 30).toFixed(1)}`, 20, 95);

  // 📊 Chart capture (FIXED)
  const chartElement = document.getElementById(`chart-${report.id}`);

  if (chartElement) {
    // Wait for chart to fully render
    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(chartElement);
    const imgData = canvas.toDataURL("image/png");

    doc.addImage(imgData, "PNG", 20, 110, 160, 100);
  }

  // Save
  doc.save(`${companyName}_ESG_Report.pdf`);
};

  const addReport = async () => {
  if (!company) {
  alert("Please enter a company name");
  return;
}
    const score =
    (environmental / 3) * 40 +
    (social / 3) * 30 +
    (governance / 3) * 30;
setCompany('');
  try {
    const res = await fetch(`${API}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      console.log(environmental, social, governance);
      body: JSON.stringify({
        company,
        score,
        environmental,
        social,
        governance
      })
    });

    const data = await res.json();

    if (Array.isArray(data)) {
      setReports(data);
    }

    setCompany('');
  } catch (err) {
    console.error(err);
  }
};

  useEffect(() => {
    fetchReports();
  }, []);

const getRating = (score) => {
  if (score >= 80) return "A (Leader)";
  if (score >= 60) return "B (Compliant)";
  if (score >= 40) return "C (At Risk)";
  return "D (Critical)";
};

const getInsights = (r) => {
  let insights = [];

  if (r.environmental < 2)
    insights.push("Improve environmental practices (emissions, waste, suppliers)");

  if (r.social < 2)
    insights.push("Strengthen social policies (labor, diversity, safety)");

  if (r.governance < 2)
    insights.push("Enhance governance (board structure, reporting)");

  if (insights.length === 0)
    insights.push("Strong ESG performance. Maintain current practices.");

  return insights;
};

 return (
 <div style={{
  padding: 20,
  background: "#f5f7fa",
  minHeight: "100vh",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
}}>

    <h1>Ecovanta ESG Dashboard</h1>

    {/* INPUT */}
    <div style={{ marginBottom: 20 }}>

  <input
    value={company}
    placeholder="Company"
    onChange={(e) => setCompany(e.target.value)}
    style={{ marginBottom: 10 }}
  />

  {/* Environmental */}
 <div style={{ marginBottom: 10 }}>
  <label style={{ fontWeight: "bold" }}>Environmental:</label><br />

  <small style={{ color: "#666" }}>
    Measures emissions, resource use, and environmental impact
  </small><br />

<select
  value={environmental}
  onChange={(e) => setEnvironmental(Number(e.target.value))}
>
  <option value="1">High Risk</option>
  <option value="2">Moderate</option>
  <option value="3">Best Practice</option>
</select>
</div>

  {/* Social */}
  <div style={{ marginBottom: 10 }}>
  <label style={{ fontWeight: "bold" }}>Social:</label><br />

  <small style={{ color: "#666" }}>
    Covers labor practices, diversity, and employee wellbeing
  </small><br />

 <select
  value={social}
  onChange={(e) => setSocial(Number(e.target.value))}
>
  <option value="1">High Risk</option>
  <option value="2">Moderate</option>
  <option value="3">Best Practice</option>
</select>
</div>

  {/* Governance */}
 <div style={{ marginBottom: 10 }}>
  <label style={{ fontWeight: "bold" }}>Governance:</label><br />

  <small style={{ color: "#666" }}>
    Includes board structure, transparency, and compliance
  </small><br />

  <select
  value={governance}
  onChange={(e) => setGovernance(Number(e.target.value))}
>
  <option value="1">High Risk</option>
  <option value="2">Moderate</option>
  <option value="3">Best Practice</option>
</select>
</div>

  <button type="button" onClick={addReport}>
    Generate ESG Score
  </button>
</div>

<div style={{ display: "flex", gap: 20, marginBottom: 30 }}>

  {/* Total Companies */}
  <div style={{
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    flex: 1
  }}>
    <h3>Total Companies</h3>
    <p style={{ fontSize: 24, fontWeight: "bold" }}>
      {reports.length}
    </p>
  </div>

  {/* Average Score */}
  <div style={{
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    flex: 1
    
  }}>
    <h3>Average ESG Score</h3>
    <p style={{ fontSize: 24, fontWeight: "bold" }}>
      {reports.length
        ? Math.round(
            reports.reduce((sum, r) => sum + r.score, 0) / reports.length
          )
        : 0}
    </p>
  </div>

</div>

<div style={{ display: "flex", gap: 20, marginBottom: 30 }}>

  {/* Total Companies */}
  <div style={{ background: "#fff", padding: 20, borderRadius: 10, flex: 1 }}>
       <h3>Total Companies</h3>
    <p>{reports.length}</p>
  </div>

  {/* Average Score */}
  <div style={{ background: "#fff", padding: 20, borderRadius: 10, flex: 1 }}>
        <h3>Average ESG Score</h3>
    <p>
      {reports.length
        ? Math.round(
            reports.reduce((sum, r) => sum + r.score, 0) / reports.length
          )
        : 0}
    </p>
  </div>

  {/* 🥇 Top Performer */}
  <div style={{ background: "#fff", padding: 20, borderRadius: 10, flex: 1 }}>
           <h3>Top Performer</h3>
    <p>
      {reports.length
        ? reports.reduce((best, r) => r.score > best.score ? r : best).company
        : "-"}
    </p>
  </div>

  {/* ⚠️ At Risk */}
  <div style={{ background: "#fff", padding: 20, borderRadius: 10, flex: 1 }}>
        <h3>At Risk</h3>
    <p>
      {reports.length
        ? reports.reduce((worst, r) => r.score < worst.score ? r : worst).company
        : "-"}
    </p>
  </div>

</div>

<div style={{
  background: "#fff",
  padding: 20,
  borderRadius: 10,
  marginBottom: 30,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
}}>
  <h3>ESG Rating Distribution</h3>

  <BarChart
    width={600}
    height={300}
    data={[
      { name: "A", value: reports.filter(r => r.score >= 80).length },
      { name: "B", value: reports.filter(r => r.score >= 60 && r.score < 80).length },
      { name: "C", value: reports.filter(r => r.score >= 40 && r.score < 60).length },
      { name: "D", value: reports.filter(r => r.score < 40).length }
    ]}
  >
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="value" fill="#1976d2" />
  </BarChart>
</div>

    {/* TREND CHART */}
    <div style={{ background: "#fff", padding: 20, borderRadius: 10, marginBottom: 30 }}>
            <h3>ESG Score Comparison</h3>

      <LineChart width={700} height={300} data={reports}>
        <XAxis dataKey="company" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="score" stroke="#1976d2" strokeWidth={3} />
      </LineChart>
    </div>

    {/* REPORTS GRID */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 20
      }}
    >
      {reports.map((r) => (
        <div key={r.id} style={{ background: "#fff", padding: 20, borderRadius: 10 }}>
                   <h3>{r.company}</h3>

          <p>Score: <b>{Math.round(r.score)}</b></p>
          <p>Assessment: <b>{getRating(r.score)}</b></p>
<p>DEBUG: E={r.environmental} S={r.social} G={r.governance}</p>
          <div style={{ marginTop: 10 }}>
  <b>Recommendations:</b>
  <ul>
    {getInsights(r).map((insight, i) => (
      <li key={i}>{insight}</li>
    ))}
  </ul>
</div>

          <div id={`chart-${r.id}`}>
            <PieChart width={250} height={250}>
              <Pie
                data={[
                  { name: "Environmental", value: Number(r.environmental || 1) / 3 * 40 },
                  { name: "Social", value: Number(r.social || 1) / 3 * 30 },
                  { name: "Governance", value: Number(r.governance || 1) / 3 * 30 }
                ]}
                dataKey="value"
                outerRadius={90}
              >
                <Cell fill="#4CAF50" />
                <Cell fill="#2196F3" />
                <Cell fill="#FFC107" />
              </Pie>
            </PieChart>
          </div>

          <button type="button" onClick={() => generatePDF(r)}>
            Download ESG Report
          </button>

        </div>
      ))}
    </div>

  </div>
);
}
export default App;