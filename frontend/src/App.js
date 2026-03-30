import React, { useEffect, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, Tooltip, Legend
} from "recharts";

const API = "https://ecovanta.onrender.com";

function App() {
  const [reports, setReports] = useState([]);
  const [company, setCompany] = useState("");
  const [sector, setSector] = useState("Tech");

  const [environmental, setEnvironmental] = useState(1);
  const [social, setSocial] = useState(1);
  const [governance, setGovernance] = useState(1);

  const [benchmark, setBenchmark] = useState(0);

  // =========================
  // COLOR HELPERS
  // =========================
  const getColor = (value) => {
    if (value === 1) return "#d32f2f";
    if (value === 2) return "#f57c00";
    return "#2e7d32";
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#2e7d32";
    if (score >= 60) return "#f57c00";
    return "#d32f2f";
  };

  // =========================
  // BENCHMARK
  // =========================
  useEffect(() => {
    fetch(`${API}/benchmark/${sector}`)
      .then(res => res.json())
      .then(data => setBenchmark(data.benchmark))
      .catch(console.error);
  }, [sector]);

  // =========================
  // SCORE
  // =========================
  const calculateScore = () => {
    return Math.round(
      (environmental / 3) * 40 +
      (social / 3) * 30 +
      (governance / 3) * 30
    );
  };

  // =========================
  // RATING
  // =========================
  const getRating = (score) => {
    if (score >= 80) return "A (Leader)";
    if (score >= 60) return "B (Compliant)";
    if (score >= 40) return "C (At Risk)";
    return "D (Critical)";
  };

  // =========================
  // ADD REPORT + AI
  // =========================
  const addReport = async () => {
    if (!company) return alert("Enter company");

    const score = calculateScore();

    let aiInsights = "No AI insights available";

    try {
      const res = await fetch(`${API}/ai-insights`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ environmental, social, governance })
      });

      const data = await res.json();
      if (data?.insights) aiInsights = data.insights;
    } catch {}

    const newReport = {
      id: Date.now(),
      company,
      sector,
      score,
      environmental,
      social,
      governance,
      aiInsights
    };

    setReports(prev => [...prev, newReport]);
    setCompany("");
  };

  // =========================
  // PDF EXPORT
  // =========================
  
const generatePDF = (r) => {
  const doc = new jsPDF();

  // =========================
  // HEADER
  // =========================
  doc.setFontSize(18);
  doc.text("Ecovanta ESG Report", 20, 20);

  doc.setFontSize(12);
  doc.text(`Company: ${r.company}`, 20, 40);
  doc.text(`Score: ${r.score}`, 20, 50);
  doc.text(`Assessment: ${getRating(r.score)}`, 20, 60);
  doc.text(`Benchmark: ${benchmark}`, 20, 70);
  doc.text(`Gap: ${r.score - benchmark}`, 20, 80);

  // =========================
  // GAUGE
  // =========================
  doc.setFillColor(220);
  doc.rect(20, 95, 120, 10, "F");

  const color =
    r.score >= 80 ? [46,125,50] :
    r.score >= 60 ? [245,124,0] :
    [211,47,47];

  doc.setFillColor(...color);
  doc.rect(20, 95, (r.score / 100) * 120, 10, "F");

  doc.text("ESG Score", 20, 92);

  // =========================
  // PIE CHART (FIXED POSITION)
  // =========================
  const canvas = document.createElement("canvas");
  canvas.width = 220;
  canvas.height = 220;
  const ctx = canvas.getContext("2d");

  const values = [
    r.environmental,
    r.social,
    r.governance
  ];

  const labels = ["E", "S", "G"];
  const colors = ["#4CAF50", "#2196F3", "#FFC107"];

  const total = values.reduce((a, b) => a + b, 0);

  let startAngle = 0;

  values.forEach((val, i) => {
    const slice = (val / total) * 2 * Math.PI;

    // Draw slice
    ctx.beginPath();
    ctx.moveTo(110, 110);
    ctx.arc(110, 110, 90, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();

    // Label positioning
    const midAngle = startAngle + slice / 2;
    const x = 110 + Math.cos(midAngle) * 55;
    const y = 110 + Math.sin(midAngle) * 55;

    const percent = Math.round((val / total) * 100);

    ctx.fillStyle = "#000";
    ctx.font = "bold 12px Arial";
    ctx.fillText(`${labels[i]} ${percent}%`, x - 20, y);

    startAngle += slice;
  });

  const img = canvas.toDataURL("image/png");

  // Top-right position (NO OVERLAP)
  doc.addImage(img, "PNG", 135, 30, 65, 65);

  // =========================
  // AI TEXT
  // =========================
  doc.setFontSize(14);
  doc.text("Ecovanta Recommendations", 20, 130);

  doc.setFontSize(10);

  const lines = doc.splitTextToSize(r.aiInsights, 170);
  let y = 140;

  lines.forEach(line => {
    if (y > 280) {
      doc.addPage();
      doc.text("Ecovanta Recommendations (continued)", 20, 20);
      y = 30;
    }
    doc.text(line, 20, y);
    y += 6;
  });

  doc.save(`${r.company}_ESG_Report.pdf`);
};

  // =========================
  // KPI
  // =========================
  const avg =
    reports.length > 0
      ? Math.round(reports.reduce((s, r) => s + r.score, 0) / reports.length)
      : 0;

  // =========================
  // DISTRIBUTION
  // =========================
  const distData = [
    { name: "A", value: reports.filter(r => r.score >= 80).length },
    { name: "B", value: reports.filter(r => r.score >= 60 && r.score < 80).length },
    { name: "C", value: reports.filter(r => r.score >= 40 && r.score < 60).length },
    { name: "D", value: reports.filter(r => r.score < 40).length }
  ];

  return (
    <div style={{ padding: 20, background: "#f5f7fa" }}>
      <h1>Ecovanta ESG Dashboard</h1>

      {/* LEGEND */}
      <div style={{ marginBottom: 10 }}>
        <strong>ESG Scale:</strong>
        <span style={{ marginLeft: 10, color: "#d32f2f" }}>🔴 High Risk</span>
        <span style={{ marginLeft: 10, color: "#f57c00" }}>🟠 Moderate</span>
        <span style={{ marginLeft: 10, color: "#2e7d32" }}>🟢 Best Practice</span>
      </div>

      {/* INPUT */}
      <div style={{ background: "#fff", padding: 20, borderRadius: 10 }}>
        <input
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />

        <select onChange={(e) => setSector(e.target.value)}>
          <option>Tech</option>
          <option>Energy</option>
          <option>Manufacturing</option>
        </select>

        {[
          ["Environmental", environmental, setEnvironmental],
          ["Social", social, setSocial],
          ["Governance", governance, setGovernance]
        ].map(([label, value, setter]) => (
          <div key={label} style={{ marginTop: 10 }}>
            <label>{label}:</label>
            <select
              value={value}
              onChange={(e) => setter(Number(e.target.value))}
              style={{
                marginLeft: 10,
                padding: 6,
                backgroundColor: getColor(value),
                color: "#fff",
                borderRadius: 6
              }}
            >
              <option value="1">🔴 High Risk</option>
              <option value="2">🟠 Moderate Risk</option>
              <option value="3">🟢 Best Practice</option>
            </select>
          </div>
        ))}

        <button onClick={addReport}>Generate ESG</button>
      </div>

      {/* KPI */}
      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
        <div style={{ background: "#fff", padding: 10 }}>Total: {reports.length}</div>
        <div style={{ background: "#fff", padding: 10 }}>Average: {avg}</div>
      </div>

      <p>Benchmark ({sector}): {benchmark}</p>

      {/* DISTRIBUTION */}
      {reports.length > 0 && (
        <BarChart width={500} height={250} data={distData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#1976d2" />
        </BarChart>
      )}

      {/* TREND */}
      {reports.length > 1 && (
        <LineChart width={600} height={250} data={reports}>
          <XAxis dataKey="company" />
          <YAxis />
          <Tooltip />
          <Line dataKey="score" stroke="#1976d2" />
        </LineChart>
      )}

      {/* REPORTS */}
      {reports.map(r => (
        <div
          key={r.id}
          style={{
            background: "#fff",
            marginTop: 20,
            padding: 20,
            borderRadius: 10,
            borderLeft: `8px solid ${getScoreColor(r.score)}`
          }}
        >
          <h3>{r.company}</h3>

          <p>
            Score:
            <span
              style={{
                marginLeft: 10,
                padding: "4px 10px",
                borderRadius: 6,
                background: getScoreColor(r.score),
                color: "#fff"
              }}
            >
              {r.score}
            </span>
          </p>

          <p>Rating: {getRating(r.score)}</p>
          <p>Gap: {r.score - benchmark}</p>

          <p>
            E:
            <span style={{ color: getColor(r.environmental) }}> {r.environmental}</span> |
            S:
            <span style={{ color: getColor(r.social) }}> {r.social}</span> |
            G:
            <span style={{ color: getColor(r.governance) }}> {r.governance}</span>
          </p>

          <div id={`chart-${r.id}`}>
            <PieChart width={250} height={250}>
              <Pie data={[
                { name: "E", value: r.environmental },
                { name: "S", value: r.social },
                { name: "G", value: r.governance }
              ]} dataKey="value">
                <Cell fill="#4CAF50"/>
                <Cell fill="#2196F3"/>
                <Cell fill="#FFC107"/>
              </Pie>
              <Legend/>
            </PieChart>
          </div>

          <p><b>AI:</b> {r.aiInsights}</p>

          <button onClick={() => generatePDF(r)}>Download PDF</button>
        </div>
      ))}
    </div>
  );
}

export default App;