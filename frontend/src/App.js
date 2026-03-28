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
  Tooltip
} from "recharts";

const API = "https://ecovanta.onrender.com";

function App() {
  const [reports, setReports] = useState([]);
  const [company, setCompany] = useState("");
  const [environmental, setEnvironmental] = useState(1);
  const [social, setSocial] = useState(1);
  const [governance, setGovernance] = useState(1);

  // Load reports safely
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

  // SAFE ADD REPORT (NO CRASH)
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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          environmental,
          social,
          governance
        })
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

  // Title
  doc.setFontSize(18);
  doc.text("Ecovanta ESG Report", 20, 20);

  // Company info (LEFT SIDE)
  doc.setFontSize(12);
  doc.text(`Company: ${r.company}`, 20, 40);
  doc.text(`Score: ${Math.round(r.score || 0)}`, 20, 50);
  doc.text(`Assessment: ${getRating(r.score)}`, 20, 60);

  doc.text(`Environmental: ${r.environmental}`, 20, 75);
  doc.text(`Social: ${r.social}`, 20, 85);
  doc.text(`Governance: ${r.governance}`, 20, 95);

  // 📊 PIE CHART (TOP RIGHT — SMALLER)
  const el = document.getElementById(`chart-${r.id}`);

  if (el) {
    const canvas = await html2canvas(el);
    const img = canvas.toDataURL("image/png");

    // 👉 Position top-right + smaller size
    doc.addImage(img, "PNG", 140, 25, 50, 50);
  }

  // 🤖 AI INSIGHTS (below)
  const insights = r.aiInsights || "No AI insights";
  const lines = doc.splitTextToSize(insights, 170);

  doc.text("AI Recommendations:", 20, 120);
  doc.text(lines, 20, 130);

  // Save
  doc.save(`${r.company}.pdf`);
};

  return (
    <div style={{ padding: 20, background: "#f5f7fa", minHeight: "100vh" }}>
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
      <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
        <div style={{ background: "#fff", padding: 20, borderRadius: 10, flex: 1 }}>
          <h3>Total Companies</h3>
          <p>{reports.length}</p>
        </div>

        <div style={{ background: "#fff", padding: 20, borderRadius: 10, flex: 1 }}>
          <h3>Average Score</h3>
          <p>
            {reports.length
              ? Math.round(reports.reduce((s, r) => s + (r.score || 0), 0) / reports.length)
              : 0}
          </p>
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
          <Line type="monotone" dataKey="score" stroke="#1976d2" strokeWidth={3} />
        </LineChart>
      )}

      {/* CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 300px)", gap: 20 }}>
        {Array.isArray(reports) && reports.map((r) => (
          <div key={r.id} style={{ background: "#fff", padding: 20, borderRadius: 10 }}>
            <h3>{r.company}</h3>

            <p>Score: {Math.round(r.score || 0)}</p>
            <p>Assessment: {getRating(r.score)}</p>

            <div id={`chart-${r.id}`}>
              <PieChart width={200} height={200}>
                <Pie data={[
                  { name: "E", value: r.environmental },
                  { name: "S", value: r.social },
                  { name: "G", value: r.governance }
                ]} dataKey="value">
                  <Cell fill="#4CAF50" />
                  <Cell fill="#2196F3" />
                  <Cell fill="#FFC107" />
                </Pie>
              </PieChart>
            </div>

            <p><b>AI Recommendations:</b></p>
            <p>{r.aiInsights || "Generating..."}</p>

            <button onClick={() => generatePDF(r)}>Download PDF</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;