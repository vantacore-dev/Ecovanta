import React, { useEffect, useState } from "react";
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
  Tooltip,
  Legend
} from "recharts";

const API = "https://ecovanta.onrender.com";

function App() {
  const [reports, setReports] = useState([]);
  const [company, setCompany] = useState("");
  const [environmental, setEnvironmental] = useState(1);
  const [social, setSocial] = useState(1);
  const [governance, setGovernance] = useState(1);

  useEffect(() => {
    fetch(`${API}/reports`)
      .then(res => res.json())
      .then(data => setReports(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, []);

  const getRating = (score = 0) => {
    if (score >= 80) return "A (Leader)";
    if (score >= 60) return "B (Compliant)";
    if (score >= 40) return "C (At Risk)";
    return "D (Critical)";
  };

  const addReport = async () => {
    if (!company) return alert("Enter company");

    const score =
      (environmental / 3) * 40 +
      (social / 3) * 30 +
      (governance / 3) * 30;

    let aiInsights = "AI unavailable";

    try {
      const res = await fetch(`${API}/ai-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ environmental, social, governance })
      });

      const data = await res.json();
      if (data?.insights) aiInsights = data.insights;
    } catch (err) {
      console.error(err);
    }

    const newReport = {
      id: Date.now(),
      company,
      score,
      environmental,
      social,
      governance,
      aiInsights
    };

    setReports(prev => [...prev, newReport]);
    setCompany("");
  };

  const generatePDF = async (r) => {
    const doc = new jsPDF();

    const getColor = (score = 0) => {
      if (score >= 80) return [46, 125, 50];
      if (score >= 60) return [255, 152, 0];
      return [211, 47, 47];
    };

    const color = getColor(r.score);

    doc.setFontSize(18);
    doc.text("Ecovanta ESG Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Company: ${r.company}`, 20, 40);

    doc.setFontSize(16);
    doc.setTextColor(...color);
    doc.text(`Score: ${Math.round(r.score || 0)}`, 20, 55);

    doc.setTextColor(0, 0, 0);
    doc.text(`Assessment: ${getRating(r.score)}`, 20, 65);

    doc.text(`Environmental: ${r.environmental}`, 20, 80);
    doc.text(`Social: ${r.social}`, 20, 90);
    doc.text(`Governance: ${r.governance}`, 20, 100);

    // Gauge
    doc.setFillColor(220);
    doc.rect(20, 115, 120, 10, "F");

    doc.setFillColor(...color);
    doc.rect(20, 115, (r.score / 100) * 120, 10, "F");

    doc.text("ESG Score", 20, 110);

    // Pie chart
    const el = document.getElementById(`chart-${r.id}`);
    if (el) {
      const canvas = await html2canvas(el);
      const img = canvas.toDataURL("image/png");
      doc.addImage(img, "PNG", 140, 40, 60, 60);
    }

    // AI (multi-page)
    const insights = r.aiInsights || "No AI insights available";
    const lines = doc.splitTextToSize(insights, 170);

    let y = 140;
    doc.text("AI Recommendations:", 20, y);
    y += 10;

    lines.forEach((line) => {
      if (y > 270) {
        doc.addPage();
        doc.text("AI Recommendations (continued)", 20, 20);
        y = 30;
      }
      doc.text(line, 20, y);
      y += 8;
    });

    doc.save(`${r.company}.pdf`);
  };

  // KPI CALCULATIONS
  const averageScore =
    reports.length > 0
      ? Math.round(
          reports.reduce((sum, r) => sum + (r.score || 0), 0) /
            reports.length
        )
      : 0;

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
        <select onChange={(e) => setEnvironmental(Number(e.target.value))}>
          <option value="1">High Risk</option>
          <option value="2">Moderate</option>
          <option value="3">Best Practice</option>
        </select>
      </div>

      <div>
        <label>Social</label>
        <select onChange={(e) => setSocial(Number(e.target.value))}>
          <option value="1">High Risk</option>
          <option value="2">Moderate</option>
          <option value="3">Best Practice</option>
        </select>
      </div>

      <div>
        <label>Governance</label>
        <select onChange={(e) => setGovernance(Number(e.target.value))}>
          <option value="1">High Risk</option>
          <option value="2">Moderate</option>
          <option value="3">Best Practice</option>
        </select>
      </div>

      <button onClick={addReport}>Generate ESG</button>

      {/* KPI */}
      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
        <div style={{ background: "#fff", padding: 15, borderRadius: 10 }}>
          <b>Total Companies:</b> {reports.length}
        </div>

        <div style={{ background: "#fff", padding: 15, borderRadius: 10 }}>
          <b>Average Score:</b> {averageScore}
        </div>
      </div>

      {/* DISTRIBUTION */}
      {reports.length > 0 && (
        <BarChart width={500} height={250} data={[
          { name: "A", value: reports.filter(r => r.score >= 80).length },
          { name: "B", value: reports.filter(r => r.score >= 60 && r.score < 80).length },
          { name: "C", value: reports.filter(r => r.score >= 40 && r.score < 60).length },
          { name: "D", value: reports.filter(r => r.score < 40).length }
        ]}>
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
          <Line type="monotone" dataKey="score" stroke="#1976d2" />
        </LineChart>
      )}

      {/* CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 300px)", gap: 20 }}>
        {reports.map((r) => {
          const pieData = [
            { name: "Environmental", value: r.environmental },
            { name: "Social", value: r.social },
            { name: "Governance", value: r.governance }
          ];

          return (
            <div key={r.id} style={{ background: "#fff", padding: 20, borderRadius: 10 }}>
              <h3>{r.company}</h3>

              <p>Score: {Math.round(r.score)}</p>
              <p>Assessment: {getRating(r.score)}</p>

              <div id={`chart-${r.id}`}>
                <PieChart width={250} height={250}>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    <Cell fill="#4CAF50" />
                    <Cell fill="#2196F3" />
                    <Cell fill="#FFC107" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </div>

              <p><b>AI Recommendations:</b></p>
              <p>{r.aiInsights}</p>

              <button onClick={() => generatePDF(r)}>Download PDF</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;