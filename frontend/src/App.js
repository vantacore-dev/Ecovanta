import React, { useEffect, useState } from 'react';

import { PieChart, Pie, Cell } from 'recharts';

const API = "https://ecovanta.onrender.com"; // 🔥 replace

function App() {
  const [reports, setReports] = useState([]);
  const [company, setCompany] = useState('');
  const [score, setScore] = useState('');

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
    </div>
  );
})}
    </ul>
  </div>
);

}

export default App;