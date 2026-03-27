import React, { useEffect, useState } from 'react';

import { PieChart, Pie, Cell } from 'recharts';

import jsPDF from "jspdf";

const API = "https://ecovanta.onrender.com"; // 🔥 replace

function App() {
  const [reports, setReports] = useState([]);
  const [company, setCompany] = useState('');
  const [score, setScore] = useState('');

const generatePDF = (report) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Ecovanta ESG Report", 20, 20);

  doc.setFontSize(12);
  doc.text(`Company: ${report.company}`, 20, 40);
  doc.text(`ESG Score: ${Math.round(report.score)}`, 20, 50);

  doc.text("Breakdown:", 20, 70);
  doc.text(`Environmental: ${(report.environmental / 3 * 40).toFixed(1)}`, 20, 80);
  doc.text(`Social: ${(report.social / 3 * 30).toFixed(1)}`, 20, 90);
  doc.text(`Governance: ${(report.governance / 3 * 30).toFixed(1)}`, 20, 100);

  doc.text("Assessment:", 20, 120);

  if (report.score > 80) {
    doc.text("ESG Leader", 20, 130);
  } else if (report.score > 60) {
    doc.text("Compliant", 20, 130);
  } else {
    doc.text("At Risk", 20, 130);
  }

  doc.save(`${report.company}_ESG_Report.pdf`);
};

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API}/reports`);
      const data = await res.json();

      console.log("GET:", data);

      if (Array.isArray(data)) {
        setReports(data);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error(err);
      setReports([]);
    } 
  };

  const addReport = async (e) => {
  if (e) e.preventDefault();

  try {
    const res = await fetch(`${API}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, score: Number(score) })
    });

    const data = await res.json();

    if (Array.isArray(data)) {
      setReports(data);
    }

    setCompany('');
    setScore('');
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

            <PieChart width={200} height={200}>
              <Pie data={data} dataKey="value" outerRadius={80}>
                <Cell fill="#4CAF50" />
                <Cell fill="#2196F3" />
                <Cell fill="#FFC107" />
              </Pie>
            </PieChart>

            <button onClick={() => generatePDF(r)}>
              Download ESG Report
            </button>
          </div>
        );
      })}
    </div>
  </div>
);}
export default App;