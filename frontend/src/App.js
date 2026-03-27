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
  <div style={{ padding: 20 }}>

    <h1>Ecovanta ESG Dashboard</h1>

    {/* INPUT */}
    <div style={{ marginBottom: 20 }}>
      <input
        value={company}
        placeholder="Company"
        onChange={(e) => setCompany(e.target.value)}
      />

      <select onChange={(e) => setEnvironmental(e.target.value)}>
        <option value="1">High Risk</option>
        <option value="2">Moderate</option>
        <option value="3">Best Practice</option>
      </select>

      <select onChange={(e) => setSocial(e.target.value)}>
        <option value="1">High Risk</option>
        <option value="2">Moderate</option>
        <option value="3">Best Practice</option>
      </select>

      <select onChange={(e) => setGovernance(e.target.value)}>
        <option value="1">High Risk</option>
        <option value="2">Moderate</option>
        <option value="3">Best Practice</option>
      </select>

      <button type="button" onClick={addReport}>
        Generate ESG Score
      </button>
    </div>

    {/* REPORTS */}
    <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 20
  }}
>
      {reports.map((r) => (
        <div key={r.id} style={{ marginBottom: 20 }}>

          <h3>{r.company}</h3>

          <p>Score: <b>{Math.round(r.score)}</b></p>
          <p>Assessment: <b>{getRating(r.score)}</b></p>

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