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
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [company, setCompany] = useState("");
  const [sector, setSector] = useState("Tech");
  const [benchmark, setBenchmark] = useState(0);
  const [branding, setBranding] = useState({
    logo: null,
    color: "#1976d2"
  });

  const [environmental, setEnvironmental] = useState(1);
  const [social, setSocial] = useState(1);
  const [governance, setGovernance] = useState(1);

  // 🔐 LOAD USER
  useEffect(() => {
    if (token) {
      fetch(`${API}/me`, {
        headers: { Authorization: token }
      })
        .then(res => res.json())
        .then(setUser)
        .catch(() => setUser(null));
    }
  }, [token]);

  // 📊 LOAD REPORTS
  useEffect(() => {
    fetch(`${API}/reports`)
      .then(res => res.json())
      .then(data => setReports(Array.isArray(data) ? data : []));
  }, []);

  // 📊 LOAD BENCHMARK
  useEffect(() => {
    fetch(`${API}/benchmark/${sector}`)
      .then(res => res.json())
      .then(data => setBenchmark(data.benchmark || 60));
  }, [sector]);

  const getRating = (score = 0) => {
    if (score >= 80) return "A";
    if (score >= 60) return "B";
    if (score >= 40) return "C";
    return "D";
  };

  // 🔐 LOGIN
  const login = async () => {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ email: "demo@test.com", password: "1234" })
    });

    const data = await res.json();
    localStorage.setItem("token", data.token);
    setToken(data.token);
  };

  // ➕ ADD REPORT
  const addReport = async () => {
    const score =
      (environmental / 3) * 40 +
      (social / 3) * 30 +
      (governance / 3) * 30;

    // 🔌 External ESG API
    let externalData = {};
    try {
      const res = await fetch(`${API}/external-esg/${company}`);
      externalData = await res.json();
    } catch {}

    const newReport = {
      id: Date.now(),
      company,
      score,
      environmental,
      social,
      governance,
      externalData
    };

    setReports(prev => [...prev, newReport]);
  };

  // 📄 PDF (WHITE LABEL)
  const generatePDF = async (r) => {
    const doc = new jsPDF();

    doc.setTextColor(branding.color);

    doc.setFontSize(18);
    doc.text("ESG Report", 20, 20);

    if (branding.logo) {
      doc.addImage(branding.logo, "PNG", 150, 10, 40, 15);
    }

    doc.setTextColor(0,0,0);

    doc.text(`Company: ${r.company}`, 20, 40);
    doc.text(`Score: ${Math.round(r.score)}`, 20, 50);

    // Benchmark
    doc.text(`Industry Avg: ${benchmark}`, 20, 65);

    // Gauge
    doc.setFillColor(220);
    doc.rect(20, 80, 120, 10, "F");

    doc.setFillColor(0,150,0);
    doc.rect(20, 80, (r.score / 100) * 120, 10, "F");

    // Chart
    const el = document.getElementById(`chart-${r.id}`);
    if (el) {
      const canvas = await html2canvas(el);
      doc.addImage(canvas.toDataURL(), "PNG", 140, 40, 60, 60);
    }

    doc.save(`${r.company}.pdf`);
  };

  // 📊 KPI
  const avg =
    reports.length > 0
      ? Math.round(reports.reduce((s, r) => s + r.score, 0) / reports.length)
      : 0;

  // 🔥 RISK HEATMAP DATA
  const heatmapData = [
    { name: "Environmental", value: environmental * 30 },
    { name: "Social", value: social * 30 },
    { name: "Governance", value: governance * 30 }
  ];

  const getHeatColor = (v) => {
    if (v > 70) return "red";
    if (v > 40) return "orange";
    return "green";
  };

  // 🔐 IF NOT LOGGED
  if (!user) {
    return (
      <div style={{ padding: 50 }}>
        <h2>Login</h2>
        <button onClick={login}>Login Demo</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>

      <h1>Ecovanta ESG SaaS</h1>
      <p>Role: {user.role}</p>

      {/* INPUT */}
      <input
        placeholder="Company"
        onChange={(e) => setCompany(e.target.value)}
      />

      <select onChange={(e) => setSector(e.target.value)}>
        <option>Tech</option>
        <option>Energy</option>
        <option>Manufacturing</option>
      </select>

      <button onClick={addReport}>Add</button>

      {/* KPI */}
      <p>Total: {reports.length} | Avg: {avg}</p>

      {/* BENCHMARK */}
      <p>Industry Benchmark ({sector}): {benchmark}</p>

      {/* HEATMAP */}
      <div style={{ display: "flex", gap: 10 }}>
        {heatmapData.map(h => (
          <div key={h.name}
            style={{
              width: 100,
              height: 100,
              background: getHeatColor(h.value),
              color: "#fff"
            }}>
            {h.name}
          </div>
        ))}
      </div>

      {/* ROLE BASED */}
      {user.role === "admin" && (
        <div>
          <h3>Admin Panel</h3>
          <input
            type="color"
            onChange={(e) => setBranding({...branding, color: e.target.value})}
          />
        </div>
      )}

      {/* REPORTS */}
      {reports.map(r => (
        <div key={r.id} style={{ marginTop: 20 }}>
          <h3>{r.company}</h3>
          <p>{r.score}</p>

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

          <button onClick={() => generatePDF(r)}>PDF</button>
        </div>
      ))}
    </div>
  );
}

export default App;