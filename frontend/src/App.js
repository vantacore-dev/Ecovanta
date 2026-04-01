import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

const API = "https://ecovanta.onrender.com";

function App() {
  const [reports, setReports] = useState([]);
  const [company, setCompany] = useState("");
  const [sector, setSector] = useState("Tech");

  const [environmental, setEnvironmental] = useState(1);
  const [social, setSocial] = useState(1);
  const [governance, setGovernance] = useState(1);

  const [benchmark, setBenchmark] = useState(60);
  const [loading, setLoading] = useState(false);

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

  const getScoreRgb = (score) => {
    if (score >= 80) return [46, 125, 50];
    if (score >= 60) return [245, 124, 0];
    return [211, 47, 47];
  };

  const getRating = (score) => {
    if (score >= 80) return "A (Leader)";
    if (score >= 60) return "B (Compliant)";
    if (score >= 40) return "C (At Risk)";
    return "D (Critical)";
  };

  const calculateScore = (e, s, g) => {
    return Math.round((e / 3) * 40 + (s / 3) * 30 + (g / 3) * 30);
  };

  useEffect(() => {
    fetch(`${API}/benchmark/${sector}`)
      .then((res) => res.json())
      .then((data) => setBenchmark(Number(data.benchmark || 60)))
      .catch((err) => {
        console.error(err);
        setBenchmark(60);
      });
  }, [sector]);

  useEffect(() => {
    fetch(`${API}/reports`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load reports");
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setReports(data);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const addReport = async () => {
    if (!company.trim()) {
      alert("Please enter a company name.");
      return;
    }

    setLoading(true);

    const score = calculateScore(environmental, social, governance);
    let aiInsights = "No AI insights available.";

    try {
      const aiRes = await fetch(`${API}/ai-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environmental,
          social,
          governance,
          benchmark
        })
      });

      const aiData = await aiRes.json();
      if (aiData?.insights) {
        aiInsights = aiData.insights;
      }
    } catch (err) {
      console.error("AI fetch failed:", err);
    }

    const newReport = {
      id: Date.now(),
      company: company.trim(),
      sector,
      environmental,
      social,
      governance,
      score,
      benchmark,
      aiInsights,
      createdAt: new Date().toISOString()
    };

    try {
      const saveRes = await fetch(`${API}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReport)
      });

      if (saveRes.ok) {
        const saved = await saveRes.json();
        if (Array.isArray(saved)) {
          setReports(saved);
        } else {
          setReports((prev) => [...prev, newReport]);
        }
      } else {
        setReports((prev) => [...prev, newReport]);
      }
    } catch (err) {
      console.error("Save failed:", err);
      setReports((prev) => [...prev, newReport]);
    }

    setCompany("");
    setEnvironmental(1);
    setSocial(1);
    setGovernance(1);
    setLoading(false);
  };

  const generatePDF = (r) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Ecovanta ESG Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Company: ${r.company}`, 20, 38);
    doc.text(`Sector: ${r.sector || "N/A"}`, 20, 46);
    doc.text(`Score: ${r.score}`, 20, 54);
    doc.text(`Assessment: ${getRating(r.score)}`, 20, 62);
    doc.text(`Benchmark: ${r.benchmark ?? benchmark}`, 20, 70);
    doc.text(`Gap: ${r.score - (r.benchmark ?? benchmark)}`, 20, 78);

    const gaugeRgb = getScoreRgb(r.score);
    doc.setFontSize(10);
    doc.text("ESG Score", 20, 90);
    doc.setFillColor(220);
    doc.rect(20, 94, 120, 10, "F");
    doc.setFillColor(...gaugeRgb);
    doc.rect(20, 94, (r.score / 100) * 120, 10, "F");

    const canvas = document.createElement("canvas");
    const size = 220;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const values = [r.environmental, r.social, r.governance];
    const labels = ["E", "S", "G"];
    const colors = ["#4CAF50", "#2196F3", "#FFC107"];
    const total = values.reduce((sum, value) => sum + value, 0);

    let startAngle = 0;
    values.forEach((value, index) => {
      const slice = (value / total) * 2 * Math.PI;

      ctx.beginPath();
      ctx.moveTo(size / 2, size / 2);
      ctx.arc(size / 2, size / 2, 85, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = colors[index];
      ctx.fill();

      const midAngle = startAngle + slice / 2;
      const x = size / 2 + Math.cos(midAngle) * 50;
      const y = size / 2 + Math.sin(midAngle) * 50;
      const percent = Math.round((value / total) * 100);

      ctx.fillStyle = "#000";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${labels[index]} ${percent}%`, x, y);

      startAngle += slice;
    });

    const pieImage = canvas.toDataURL("image/png");
    doc.addImage(pieImage, "PNG", 135, 25, 60, 60);

    doc.setFontSize(11);
    doc.text("AI Recommendations", 20, 120);

    const aiText = r.aiInsights || "No AI insights available.";
    const lines = doc.splitTextToSize(aiText, 170);
    let y = 130;

    lines.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        doc.setFontSize(11);
        doc.text("AI Recommendations (continued)", 20, 20);
        y = 30;
      }
      doc.setFontSize(10);
      doc.text(line, 20, y);
      y += 6;
    });

    doc.save(`${r.company}_ESG_Report.pdf`);
  };

  const averageScore =
    reports.length > 0
      ? Math.round(
          reports.reduce((sum, report) => sum + Number(report.score || 0), 0) /
            reports.length
        )
      : 0;

  const distributionData = [
    { name: "A", value: reports.filter((r) => r.score >= 80).length },
    {
      name: "B",
      value: reports.filter((r) => r.score >= 60 && r.score < 80).length
    },
    {
      name: "C",
      value: reports.filter((r) => r.score >= 40 && r.score < 60).length
    },
    { name: "D", value: reports.filter((r) => r.score < 40).length }
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        padding: 24,
        fontFamily: "Arial, sans-serif"
      }}
    >
      <h1 style={{ marginBottom: 20 }}>Ecovanta ESG Dashboard</h1>

      <div
        style={{
          marginBottom: 16,
          background: "#fff",
          padding: 16,
          borderRadius: 10
        }}
      >
        <strong>ESG Scale:</strong>
        <span style={{ marginLeft: 12, color: "#d32f2f" }}>🔴 High Risk</span>
        <span style={{ marginLeft: 12, color: "#f57c00" }}>🟠 Moderate Risk</span>
        <span style={{ marginLeft: 12, color: "#2e7d32" }}>🟢 Best Practice</span>
      </div>

      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
        }}
      >
        <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
          <input
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc"
            }}
          />

          <div>
            <label style={{ marginRight: 10 }}>Sector:</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              style={{ padding: 8, borderRadius: 8 }}
            >
              <option value="Tech">Tech</option>
              <option value="Energy">Energy</option>
              <option value="Manufacturing">Manufacturing</option>
            </select>
          </div>

          {[
            ["Environmental", environmental, setEnvironmental],
            ["Social", social, setSocial],
            ["Governance", governance, setGovernance]
          ].map(([label, value, setter]) => (
            <div key={label}>
              <label style={{ display: "inline-block", width: 110 }}>
                {label}:
              </label>
              <select
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  background: getColor(value),
                  color: "#fff",
                  border: "none",
                  minWidth: 180,
                  fontWeight: "bold"
                }}
              >
                <option value="1">🔴 High Risk</option>
                <option value="2">🟠 Moderate Risk</option>
                <option value="3">🟢 Best Practice</option>
              </select>
            </div>
          ))}

          <div style={{ marginTop: 8 }}>
            <button
              onClick={addReport}
              disabled={loading}
              style={{
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 16px",
                cursor: "pointer"
              }}
            >
              {loading ? "Generating..." : "Generate ESG"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div
          style={{
            background: "#fff",
            padding: 16,
            borderRadius: 10,
            minWidth: 180,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
          }}
        >
          <strong>Total Companies</strong>
          <div style={{ fontSize: 24, marginTop: 8 }}>{reports.length}</div>
        </div>

        <div
          style={{
            background: "#fff",
            padding: 16,
            borderRadius: 10,
            minWidth: 180,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
          }}
        >
          <strong>Average Score</strong>
          <div style={{ fontSize: 24, marginTop: 8 }}>{averageScore}</div>
        </div>

        <div
          style={{
            background: "#fff",
            padding: 16,
            borderRadius: 10,
            minWidth: 220,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
          }}
        >
          <strong>Benchmark ({sector})</strong>
          <div style={{ fontSize: 24, marginTop: 8 }}>{benchmark}</div>
        </div>
      </div>

      {reports.length > 0 && (
        <div
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 12,
            marginBottom: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
          }}
        >
          <h3>Assessment Distribution</h3>
          <BarChart width={520} height={260} data={distributionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#1976d2" />
          </BarChart>
        </div>
      )}

      {reports.length > 1 && (
        <div
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 12,
            marginBottom: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
          }}
        >
          <h3>Trend</h3>
          <LineChart width={700} height={280} data={reports}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="company" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#1976d2" strokeWidth={3} />
          </LineChart>
        </div>
      )}

      {reports.map((r) => (
        <div
          key={r.id}
          style={{
            background: "#fff",
            marginBottom: 20,
            padding: 20,
            borderRadius: 12,
            borderLeft: `8px solid ${getScoreColor(r.score)}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
          }}
        >
          <h3 style={{ marginTop: 0 }}>{r.company}</h3>

          <p>
            Score:
            <span
              style={{
                marginLeft: 10,
                padding: "4px 10px",
                borderRadius: 6,
                background: getScoreColor(r.score),
                color: "#fff",
                fontWeight: "bold"
              }}
            >
              {r.score}
            </span>
          </p>

          <p>Assessment: {getRating(r.score)}</p>
          <p>Sector: {r.sector || sector}</p>
          <p>Benchmark: {r.benchmark ?? benchmark}</p>
          <p>Gap vs Benchmark: {r.score - (r.benchmark ?? benchmark)}</p>

          <p>
            E:
            <span style={{ color: getColor(r.environmental), fontWeight: "bold" }}>
              {" "}
              {r.environmental}
            </span>
            {" | "}S:
            <span style={{ color: getColor(r.social), fontWeight: "bold" }}>
              {" "}
              {r.social}
            </span>
            {" | "}G:
            <span style={{ color: getColor(r.governance), fontWeight: "bold" }}>
              {" "}
              {r.governance}
            </span>
          </p>

          <div id={`chart-${r.id}`}>
            <PieChart width={280} height={260}>
              <Pie
                data={[
                  { name: "Environmental", value: r.environmental },
                  { name: "Social", value: r.social },
                  { name: "Governance", value: r.governance }
                ]}
                dataKey="value"
                cx="50%"
                cy="45%"
                outerRadius={80}
                label={({ name, percent }) =>
                  `${name[0]} ${Math.round(percent * 100)}%`
                }
              >
                <Cell fill="#4CAF50" />
                <Cell fill="#2196F3" />
                <Cell fill="#FFC107" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>

          <div
            style={{
              whiteSpace: "pre-wrap",
              background: "#fafafa",
              padding: 12,
              borderRadius: 8,
              marginBottom: 12
            }}
          >
            <strong>AI Recommendations</strong>
            <div style={{ marginTop: 8 }}>{r.aiInsights}</div>
          </div>

          <button
            onClick={() => generatePDF(r)}
            style={{
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 16px",
              cursor: "pointer"
            }}
          >
            Download PDF
          </button>
        </div>
      ))}
    </div>
  );
}

export default App;