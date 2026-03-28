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

  // ✅ AUTO AI
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

    if (reports.length > 0) generateAllAI();
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

  const addReport = async () => {
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

  // ✅ FORCE UI update (no backend dependency)
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
    <div style={{ padding: 20, background: "#f5f7fa" }}>
      <h1>Ecovanta ESG Dashboard</h1>
<p>Reports count: {reports.length}</p>
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
      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
        <div style={{ background: "#fff", padding: 20, flex: 1 }}>
          Total: {reports.length}
        </div>
        <div style={{ background: "#fff", padding: 20, flex: 1 }}>
          Avg:{" "}
          {reports.length
            ? Math.round(
                reports.reduce((s, r) => s + r.score, 0) / reports.length
              )
            : 0}
        </div>
      </div>

      {/* REPORTS */}
 <div style={{ marginTop: 20 }}>
  {reports.map((r) => (
    <div
      key={r.id}
      style={{
        background: "#ffffff",
        padding: 20,
        marginTop: 20,
        borderRadius: 10,
        border: "2px solid red" // 👈 TEMP DEBUG BORDER
      }}
    >
      <h2>{r.company}</h2>

      <p>Score: {Math.round(r.score)}</p>

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

      <p>{r.aiInsights || "Loading AI..."}</p>
    </div>
  ))}
</div>  
}

export default App;