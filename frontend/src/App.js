import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from "recharts";

const API = "https://ecovanta.onrender.com";

function App() {

  const [reports, setReports] = useState([]);
  const [company, setCompany] = useState("");
  const [sector, setSector] = useState("tech");

  const [environmental, setEnvironmental] = useState(1);
  const [social, setSocial] = useState(1);
  const [governance, setGovernance] = useState(1);

  const [benchmark, setBenchmark] = useState(60);

  // =========================
  // HELPERS
  // =========================
  const getColor = (v) => v === 1 ? "#d32f2f" : v === 2 ? "#f57c00" : "#2e7d32";

  const getScoreColor = (s) =>
    s >= 80 ? "#2e7d32" :
    s >= 60 ? "#f57c00" :
    "#d32f2f";

  const getScoreRgb = (s) =>
    s >= 80 ? [46,125,50] :
    s >= 60 ? [245,124,0] :
    [211,47,47];

  const getRating = (s) =>
    s >= 80 ? "A (Leader)" :
    s >= 60 ? "B (Compliant)" :
    s >= 40 ? "C (At Risk)" :
    "D (Critical)";

  const calculateScore = (e, s, g) =>
    Math.round((e/3)*40 + (s/3)*30 + (g/3)*30);

  // =========================
  // LOAD BENCHMARK
  // =========================
  useEffect(() => {
    fetch(`${API}/benchmark/${sector}`)
      .then(r => r.json())
      .then(d => setBenchmark(Number(d.benchmark || 60)))
      .catch(() => setBenchmark(60));
  }, [sector]);

  // =========================
  // LOAD REPORTS
  // =========================
  useEffect(() => {
    fetch(`${API}/reports`)
      .then(r => r.json())
      .then(data => Array.isArray(data) && setReports(data))
      .catch(console.error);
  }, []);

  // =========================
  // ADD REPORT
  // =========================
  const addReport = async () => {

    const score = calculateScore(environmental, social, governance);
    let aiInsights = "No AI insights available";

    try {
      const res = await fetch(`${API}/ai-insights`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          environmental,
          social,
          governance,
          benchmark
        })
      });

      const data = await res.json();
      if (data?.insights) aiInsights = data.insights;

    } catch(err) {
      console.error(err);
    }

    const newReport = {
      id: Date.now(),
      company,
      sector,
      environmental,
      social,
      governance,
      score,
      benchmark,
      aiInsights
    };

    setReports(prev => [...prev, newReport]);

    // save to backend
    fetch(`${API}/reports`, {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(newReport)
    });

    setCompany("");
  };

  // =========================
  // PDF
  // =========================
  const generatePDF = (r) => {

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Ecovanta ESG Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Company: ${r.company}`, 20, 40);
    doc.text(`Score: ${r.score}`, 20, 50);
    doc.text(`Assessment: ${getRating(r.score)}`, 20, 60);
    doc.text(`Benchmark: ${r.benchmark}`, 20, 70);

    // gauge
    doc.setFillColor(220);
    doc.rect(20, 85, 120, 10, "F");

    doc.setFillColor(...getScoreRgb(r.score));
    doc.rect(20, 85, (r.score/100)*120, 10, "F");

    // pie
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");

    const values = [r.environmental, r.social, r.governance];
    const labels = ["E","S","G"];
    const colors = ["#4CAF50","#2196F3","#FFC107"];

    const total = values.reduce((a,b)=>a+b,0);
    let angle = 0;

    values.forEach((v,i)=>{
      const slice = (v/total)*2*Math.PI;

      ctx.beginPath();
      ctx.moveTo(100,100);
      ctx.arc(100,100,80,angle,angle+slice);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();

      const mid = angle + slice/2;
      const x = 100 + Math.cos(mid)*50;
      const y = 100 + Math.sin(mid)*50;

      ctx.fillStyle = "#000";
      ctx.fillText(`${labels[i]} ${Math.round(v/total*100)}%`, x, y);

      angle += slice;
    });

    const img = canvas.toDataURL("image/png");
    doc.addImage(img,"PNG",130,30,60,60);

    // AI
    doc.text("AI Recommendations",20,120);

    const lines = doc.splitTextToSize(r.aiInsights,170);
    let y = 130;

    lines.forEach(line=>{
      if(y>280){
        doc.addPage();
        y=20;
      }
      doc.text(line,20,y);
      y+=6;
    });

    doc.save(`${r.company}.pdf`);
  };

  // =========================
  // DASHBOARD STATS
  // =========================
  const avg =
    reports.length ?
    Math.round(reports.reduce((a,r)=>a+r.score,0)/reports.length)
    : 0;

  // =========================
  // UI
  // =========================
  return (
    <div style={{padding:20, background:"#f5f7fa"}}>

      <h1>Ecovanta ESG Dashboard V2</h1>

      <input
        placeholder="Company"
        value={company}
        onChange={e=>setCompany(e.target.value)}
      />

      <select onChange={e=>setSector(e.target.value)}>
        <option value="tech">Tech</option>
        <option value="energy">Energy</option>
        <option value="manufacturing">Manufacturing</option>
      </select>

      <select onChange={e=>setEnvironmental(Number(e.target.value))}>
        <option value="1">🔴 High Risk</option>
        <option value="2">🟠 Moderate</option>
        <option value="3">🟢 Best</option>
      </select>

      <select onChange={e=>setSocial(Number(e.target.value))}>
        <option value="1">🔴 High Risk</option>
        <option value="2">🟠 Moderate</option>
        <option value="3">🟢 Best</option>
      </select>

      <select onChange={e=>setGovernance(Number(e.target.value))}>
        <option value="1">🔴 High Risk</option>
        <option value="2">🟠 Moderate</option>
        <option value="3">🟢 Best</option>
      </select>

      <button onClick={addReport}>Generate ESG</button>

      <h2>Portfolio</h2>
      <p>Total: {reports.length}</p>
      <p>Average: {avg}</p>

      <BarChart width={400} height={200} data={reports}>
        <XAxis dataKey="company"/>
        <YAxis/>
        <Tooltip/>
        <Bar dataKey="score"/>
      </BarChart>

      {reports.map(r=>(
        <div key={r.id} style={{
          background:"#fff",
          padding:15,
          marginTop:15,
          borderLeft:`6px solid ${getScoreColor(r.score)}`
        }}>
          <h3>{r.company}</h3>
          <p>Score: {r.score}</p>
          <p>{r.aiInsights}</p>

          <button onClick={()=>generatePDF(r)}>PDF</button>
        </div>
      ))}

    </div>
  );
}

export default App;