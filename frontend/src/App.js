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
  const login = async ()=>{
    const res = await fetch(`${API}/login`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        email:"demo@test.com",
        password:"1234"
      })
    });

    const data = await res.json();
    setToken(data.token);
  };

  // =====================
  // LOAD
  // =====================
  useEffect(()=>{login()},[]);

  useEffect(()=>{
    if(!token) return;

    fetch(`${API}/reports`,{
      headers:{Authorization:token}
    })
    .then(r=>r.json())
    .then(setReports);

    fetch(`${API}/analytics/overview`,{
      headers:{Authorization:token}
    })
    .then(r=>r.json())
    .then(setAnalytics);

  },[token]);

  useEffect(()=>{
    fetch(`${API}/benchmark/${sector}`)
      .then(r=>r.json())
      .then(d=>setBenchmark(d.benchmark));
  },[sector]);

  // =====================
  // ADD REPORT
  // =====================
  const addReport = async ()=>{

    const score = Math.round((e/3)*40+(s/3)*30+(g/3)*30);

    let aiInsights = "";

    try{
      const ai = await fetch(`${API}/ai-insights`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          environmental:e,
          social:s,
          governance:g,
          benchmark
        })
      });

      const data = await ai.json();
      aiInsights = data.insights;
    }catch{}

    const newReport = {
      company,sector,
      environmental:e,
      social:s,
      governance:g,
      score,
      benchmark,
      aiInsights
    };

    await fetch(`${API}/reports`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        Authorization:token
      },
      body:JSON.stringify(newReport)
    });

    window.location.reload();
  };

  // =====================
  // UI
  // =====================
  return(
    <div style={{padding:20,background:"#f5f7fa"}}>

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