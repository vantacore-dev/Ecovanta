import React, { useEffect, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { PieChart, Pie, Cell } from "recharts";

const API = "https://ecovanta.onrender.com";

function App() {
  const [reports, setReports] = useState([]);
  const [company, setCompany] = useState("");
  const [environmental, setEnvironmental] = useState(1);
  const [social, setSocial] = useState(1);
  const [governance, setGovernance] = useState(1);

  // ✅ SAFE AI (no crash)
  useEffect(() => {
    const generateAI = async () => {
      const newReports = [];

      for (let r of reports) {
        if (r.aiInsights) {
          newReports.push(r);
        } else {
          const ai = await getAIInsights(r);
          newReports.push({ ...r, aiInsights: ai });
        }
      }

      const changed = newReports.some((r, i) => r !== reports[i]);

      if (changed) {
        setReports(newReports);
      }
    };

    if (reports.length > 0) generateAI();
  }, [reports]);

  const getRating = (score) => {
    if (score >= 80) return "A (Leader)";
    if (score >= 60) return "B (Compliant)";
    if (score >= 40) return "C (At Risk)";
    return "D (Critical)";
  };

  const getAIInsights = async (r) => {
    try {
      const res = await fetch(`${API}/ai-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const addReport = () => {
    if (!company) return alert("Enter company");

    const score =
      (environmental / 3) * 40 +
      (social / 3) * 30 +
      (governance / 3) * 30;

    const newReport = {
      id: Date.now(),
      company,
      score,
      environmental,
      social,
      governance
    };

    setReports((prev) => [...prev, newReport]);
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
    <div style={{ padding: 20, background: "#f5f7fa", minHeight: "100vh" }}>
      <h1>Ecovanta ESG Dashboard</h1>

      {/* INPUT */}
      <div style={{ marginBottom: 20 }}>
        <input
          value={company}
          placeholder="Company"
          onChange={(e) => setCompany(e.target.value)}
        />

        <div>
          <label>Environmental</label>
          <select value={environmental} onChange={(e) => setEnvironmental(Number(e.target.value))}>
            <option value="1">High Risk</option>
            <option value="2">Moderate</option>
            <option value="3">Best Practice</option>
          </select>
        </div>

        <div>
          <label>Social</label>
          <select value={social} onChange={(e) => setSocial(Number(e.target.value))}>
            <option value="1">High Risk</option>
            <option value="2">Moderate</option>
            <option value="3">Best Practice</option>
          </select>
        </div>

        <div>
          <label>Governance</label>
          <select value={governance} onChange={(e) => setGovernance(Number(e.target.value))}>
            <option value="1">High Risk</option>
            <option value="2">Moderate</option>
            <option value="3">Best Practice</option>
          </select>
        </div>

        <button onClick={addReport}>Generate ESG</button>
      </div>

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
              ? reports.reduce((best, r) => (r.score > best.score ? r : best)).company
              : "-"}
          </p>
        </div>

        <div style={{ background: "#fff", padding: 20, borderRadius: 10, flex: 1 }}>
          <h3>At Risk</h3>
          <p>
            {reports.length
              ? reports.reduce((worst, r) => (r.score < worst.score ? r : worst)).company
              : "-"}
          </p>
        </div>
      </div>

      {/* REPORT GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 20
        }}
      >
        {reports.map((r) => (
          <div
            key={r.id}
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 10
            }}
          >
            <h3>{r.company}</h3>

            <p>Score: <b>{Math.round(r.score)}</b></p>
            <p>Assessment: <b>{getRating(r.score)}</b></p>

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

            <p>{r.aiInsights || "Generating AI insights..."}</p>

            <button onClick={() => generatePDF(r)}>
              Download PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;