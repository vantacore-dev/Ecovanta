import React, { useEffect, useState } from 'react';

const API = "https://ecovanta.onrender.com"; // 🔥 replace

function App() {
  const [reports, setReports] = useState([]);
  const [company, setCompany] = useState('');
  const [score, setScore] = useState('');
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
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