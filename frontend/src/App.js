import React, { useEffect, useState } from 'react';

function App() {
  const [reports, setReports] = useState([]);
  const [company, setCompany] = useState('');
  const [score, setScore] = useState('');

  const fetchReports = async () => {
    const res = await fetch('http://localhost:3001/reports');
    const data = await res.json();
    setReports(data);
  };

  const addReport = async () => {
    await fetch('http://localhost:3001/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, score })
    });
    fetchReports();
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Ecovanta ESG Dashboard</h1>

      <input placeholder="Company" onChange={e => setCompany(e.target.value)} />
      <input placeholder="Score" onChange={e => setScore(e.target.value)} />
      <button onClick={addReport}>Add Report</button>

      <ul>
        {reports.map(r => (
          <li key={r.id}>{r.company} - ESG Score: {r.score}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;