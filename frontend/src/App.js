import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";


const API = "https://ecovanta.onrender.com";


function App(){

  const [token,setToken] = useState("");
  const [reports,setReports] = useState([]);
  const [company,setCompany] = useState("");
  const [sector,setSector] = useState("tech");

  const [e,setE]=useState(1);
  const [s,setS]=useState(1);
  const [g,setG]=useState(1);

  const [benchmark,setBenchmark]=useState(60);
  const [analytics,setAnalytics]=useState({});

  // =====================
  // LOGIN
  // =====================
const login = async () => {
  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "demo@test.com",
        password: "1234"
      })
    });

    const data = await res.json();

    if (data?.token) {
      setToken(data.token);
      localStorage.setItem("token", data.token);
    } else {
      console.error("Login failed:", data);
    }
  } catch (err) {
    console.error("Login error:", err);
  }
};

  // =====================
  // LOAD
  // =====================
useEffect(() => {
  const savedToken = localStorage.getItem("token");
  if (savedToken) {
    setToken(savedToken);
  } else {
    login();
  }
}, []);

useEffect(() => {
  if (!token) return;

  fetch(`${API}/reports`, {
    headers: { Authorization: token }
  })
    .then((r) => {
      if (!r.ok) throw new Error("Failed to load reports");
      return r.json();
    })
    .then((data) => {
      if (Array.isArray(data)) setReports(data);
    })
    .catch((err) => console.error("Reports load error:", err));

  fetch(`${API}/analytics/overview`, {
    headers: { Authorization: token }
  })
    .then((r) => {
      if (!r.ok) throw new Error("Failed to load analytics");
      return r.json();
    })
    .then((data) => setAnalytics(data))
    .catch((err) => console.error("Analytics load error:", err));
}, [token]);

  // =====================
  // ADD REPORT
  // =====================
  const addReport = async () => {
  if (!company.trim()) {
    alert("Please enter a company name");
    return;
  }

  if (!token) {
    alert("Login not ready yet. Please try again in a second.");
    return;
  }

  const score = Math.round((e / 3) * 40 + (s / 3) * 30 + (g / 3) * 30);

  let aiInsights = "No AI insights available";

  try {
    const ai = await fetch(`${API}/ai-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        environmental: e,
        social: s,
        governance: g,
        benchmark
      })
    });

    const aiData = await ai.json();
    if (aiData?.insights) {
      aiInsights = aiData.insights;
    }
  } catch (err) {
    console.error("AI error:", err);
  }

  const newReport = {
    company: company.trim(),
    sector,
    environmental: e,
    social: s,
    governance: g,
    score,
    benchmark,
    aiInsights
  };

  try {
    const save = await fetch(`${API}/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token
      },
      body: JSON.stringify(newReport)
    });

    if (!save.ok) {
      const errText = await save.text();
      console.error("Save failed:", errText);
      alert("Report save failed. Check backend auth or logs.");
      return;
    }

    const savedReport = await save.json();

    setReports((prev) => [savedReport, ...prev]);

    setAnalytics((prev) => ({
      ...prev,
      total: (prev.total || 0) + 1
    }));

    setCompany("");
    setE(1);
    setS(1);
    setG(1);
  } catch (err) {
    console.error("Report creation error:", err);
    alert("Could not create report.");
  }
};

  // =====================
  // UI
  // =====================
  return(
    <div style={{padding:20,background:"#f5f7fa"}}>


<p>Token: {token ? "OK" : "Missing"}</p>
<p>Reports loaded: {reports.length}</p>

      <h1>Ecovanta Full ESG v2</h1>

      {/* KPI */}
      <div style={{display:"flex",gap:20}}>
        <div>Companies: {analytics.total}</div>
        <div>Avg Score: {analytics.average}</div>
        <div>High Risk: {analytics.high}</div>
        <div>Low Risk: {analytics.low}</div>
      </div>

      {/* FORM */}
      <div style={{marginTop:20}}>
        <input placeholder="Company"
          onChange={e=>setCompany(e.target.value)}
        />

        <select onChange={e=>setSector(e.target.value)}>
          <option value="tech">Tech</option>
          <option value="energy">Energy</option>
        </select>

        <select onChange={e=>setE(Number(e.target.value))}>
          <option value="1">🔴</option>
          <option value="2">🟠</option>
          <option value="3">🟢</option>
        </select>

        <select onChange={e=>setS(Number(e.target.value))}>
          <option value="1">🔴</option>
          <option value="2">🟠</option>
          <option value="3">🟢</option>
        </select>

        <select onChange={e=>setG(Number(e.target.value))}>
          <option value="1">🔴</option>
          <option value="2">🟠</option>
          <option value="3">🟢</option>
        </select>

        <button onClick={addReport}>Generate</button>
      </div>

      {/* CHART */}
      <BarChart width={400} height={200} data={reports}>
        <XAxis dataKey="company"/>
        <YAxis/>
        <Tooltip/>
        <Bar dataKey="score"/>
      </BarChart>

      {/* LIST */}
      {reports.map(r=>(
        <div key={r._id} style={{
          background:"#fff",
          padding:15,
          marginTop:10,
          borderLeft:"6px solid " + (r.score>=80?"green":r.score>=60?"orange":"red")
        }}>
          <h3>{r.company}</h3>
          <p>Score: {r.score}</p>
          <p>{r.aiInsights}</p>
        </div>
      ))}

    </div>
  );
}

export default App;