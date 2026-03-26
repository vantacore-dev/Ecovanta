import React, { useEffect, useState } from 'react';

const API = "https://ecovanta.onrender.com"; // 🔥 PUT YOUR REAL URL

function App() {
  const [reports, setReports] = useState([]);
  const [company, setCompany] = useState('');
  const [score, setScore] = useState('');

  // Load reports
  const fetchReports = async () => {
    const res = await fetch(`${API}/reports`);
    const data = await res.json();
    console.log("GET:", data);
    setReports(data);
  };

  // Add report
  const addReport = async () => {
    console.log("Sending:", company, score);

    const res = await fetch(`${API}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, score: Number(score) })
    });

    const data = await res.json();
    console.log("POST response:", data);

    // 🔥 FORCE UPDATE FROM BACKEND RESPONSE
    setReports(data);

    setCompany('');
    setScore('');
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Ecovanta ESG Dashboard</h1>

      <input
        value={company}
        placeholder="Company"
        onChange={e => setCompany(e.target.value)}
      />

      <input
        value={score}
        placeholder="Score"
        onChange={e => setScore(e.target.value)}
      />

      <button onClick={addReport}>Add Report</button>

      <ul>
        {reports.map((r) => (
          <li key={r.id}>
            {r.company} - ESG Score: {r.score}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;