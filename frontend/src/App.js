import React, { useEffect, useState } from 'react';

import html2canvas from "html2canvas";

import { PieChart, Pie, Cell } from 'recharts';

import jsPDF from "jspdf";

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
  doc.text(`Company: ${report.company}`, 20, 40);
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
  doc.save(`${report.company}_ESG_Report.pdf`);
};

  const addReport = async () => {
  const score =
    (environmental / 3) * 40 +
    (social / 3) * 30 +
    (governance / 3) * 30;

  try {
    const res = await fetch(`${API}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  return (
  <div style={{
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f5f7fa",
    minHeight: "100vh",
    padding: "40px"
  }}>
    
    <h1>🔥 ECOVANTA DASHBOARD UI 🔥</h1>

<div style={{
  background: "white",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  marginBottom: 30,
  maxWidth: 400
}}>
  <h2>Add Company</h2>

  <input
    value={company}
    placeholder="Company"
    onChange={(e) => setCompany(e.target.value)}
    style={{ width: "100%", padding: 10, marginBottom: 10 }}
  />

  <p>Environmental</p>
  <select onChange={(e) => setEnvironmental(e.target.value)}>
    <option value="1">High Risk</option>
    <option value="2">Moderate</option>
    <option value="3">Best Practice</option>
  </select>

  <p>Social</p>
  <select onChange={(e) => setSocial(e.target.value)}>
    <option value="1">High Risk</option>
    <option value="2">Moderate</option>
    <option value="3">Best Practice</option>
  </select>

  <p>Governance</p>
  <select onChange={(e) => setGovernance(e.target.value)}>
    <option value="1">High Risk</option>
    <option value="2">Moderate</option>
    <option value="3">Best Practice</option>
  </select>

  <button
    onClick={addReport}
    style={{
      marginTop: 15,
      padding: 10,
      background: "#2e7d32",
      color: "white",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      width: "100%"
    }}
  >
    Generate ESG Score
  </button>
</div>


    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: 20
    }}>

      {reports.map((r) => {
        const data = [
          { name: "Environmental", value: (r.environmental / 3) * 40 },
          { name: "Social", value: (r.social / 3) * 30 },
          { name: "Governance", value: (r.governance / 3) * 30 }
        ];

        return (
          <div key={r.id} style={{
            background: "white",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}>
            <h3>{r.company}</h3>

            <p>Score: <b>{Math.round(r.score)}</b></p>
            <p>Rating: <b>{getRating(r.score)}</b></p>

            <div id={`chart-${r.id}`}>
  <PieChart width={200} height={200}>
    <Pie data={data} dataKey="value" outerRadius={80}>
      <Cell fill="#4CAF50" />
      <Cell fill="#2196F3" />
      <Cell fill="#FFC107" />
    </Pie>
  </PieChart>
</div>

            <button onClick={() => generatePDF(r)}>
              <button
  onClick={addReport}
  style={{
    marginTop: 15,
    padding: 10,
    background: "#2e7d32",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    width: "100%"
  }}
>
  Download ESG Score
</button>
            </button>
          </div>
        );
      })}
    </div>
  </div>
);}
export default App;