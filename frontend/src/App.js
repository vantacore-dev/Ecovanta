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
  doc.text(`Environmental: ${(r.environmental / 3 * 40).toFixed(1)}`, 20, 80);
  doc.text(`Social: ${(r.social / 3 * 30).toFixed(1)}`, 20, 90);
  doc.text(`Governance: ${(r.governance / 3 * 30).toFixed(1)}`, 20, 100);

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

  return (
  <div style={{ padding: 20 }}>
    <h1>Ecovanta ESG Dashboard</h1>

    <div>
      <input
        value={company}
        placeholder="Company"
        onChange={(e) => setCompany(e.target.value)}
      />

      <input
        value={score}
        placeholder="Score"
        onChange={(e) => setScore(e.target.value)}
      />

      <button
        onClick={() => {
          console.log("CLICK WORKS"); // 🔥 debug
          addReport();
        }}
      >
        Add Report
      </button>
    </div>

    <ul>
      {reports.map((r) => {
  const data = [
    { name: "Environmental", value: r.score * 0.4 },
    { name: "Social", value: r.score * 0.3 },
    { name: "Governance", value: r.score * 0.3 }
  ];

  return (
    <div key={r.id} style={{ marginTop: 20 }}>
      <h3>{r.company} - ESG Score: {Math.round(r.score)}</h3>

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
    </ul>
  </div>
);

}

export default App;