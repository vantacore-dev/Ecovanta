import React from "react";

export default function EcovantaLandingPage() {
  const goToSignup = () => {
    window.location.href = "/?signup=true";
  };

  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        background: "#f8fafc",
        color: "#0f172a"
      }}
    >
      {/* NAVBAR */}
      <div style={nav}>
        <div style={{ fontWeight: "bold", fontSize: "20px" }}>
          ecovanta.ai
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button style={secondaryBtn}>Book Demo</button>
          <button style={primaryBtn} onClick={goToSignup}>
            Start Free
          </button>
        </div>
      </div>

      {/* HERO */}
      <div style={hero}>
        <h1 style={heroTitle}>
          ESG & CSRD Reporting — <br /> Simplified with AI
        </h1>

        <p style={heroText}>
          Turn complex sustainability data into audit-ready, investor-grade
          reports in minutes — not months.
        </p>

        <div style={{ display: "flex", gap: "12px" }}>
          <button style={primaryBtnLarge} onClick={goToSignup}>
            Start Free
          </button>
          <button style={secondaryBtnLarge}>Book Demo</button>
        </div>
      </div>

      {/* FEATURES */}
      <div style={section}>
        <h2 style={sectionTitle}>Features</h2>

        <div style={grid}>
          <Card
            title="AI ESG Drafting"
            text="Generate ESRS-compliant disclosures instantly."
          />
          <Card
            title="Double Materiality"
            text="Quantify impact & financial risks."
          />
          <Card
            title="Compliance Gaps"
            text="Identify missing disclosures in seconds."
          />
          <Card
            title="Benchmark Intelligence"
            text="Compare ESG performance vs sector."
          />
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={section}>
        <h2 style={sectionTitle}>How it works</h2>

        <div style={grid}>
          <Card
            title="1. Input Data"
            text="Enter ESG data in structured format."
          />
          <Card
            title="2. AI Draft"
            text="Generate reports + recommendations."
          />
          <Card
            title="3. Export"
            text="Download investor-ready PDF."
          />
        </div>
      </div>

      {/* PRICING */}
      <div style={section}>
        <h2 style={sectionTitle}>Pricing</h2>

        <div style={grid}>
          <Pricing
            name="Free"
            price="€0"
            features={["Basic reporting", "Manual input"]}
            action={goToSignup}
          />
          <Pricing
            name="Pro"
            price="€49/mo"
            features={["AI Draft", "Benchmark", "PDF Export"]}
            highlight
            action={goToSignup}
          />
          <Pricing
            name="Enterprise"
            price="Custom"
            features={[
              "Team workflows",
              "Audit logs",
              "API access"
            ]}
          />
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={cta}>
        <h2>Ready to simplify ESG reporting?</h2>

        <div style={{ marginTop: "16px" }}>
          <button style={primaryBtnLarge} onClick={goToSignup}>
            Start Free
          </button>
        </div>
      </div>
    </div>
  );
}

/* COMPONENTS */

function Card({ title, text }) {
  return (
    <div style={card}>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Pricing({ name, price, features, highlight, action }) {
  return (
    <div
      style={{
        ...card,
        border: highlight ? "2px solid #7c3aed" : "1px solid #e5e7eb"
      }}
    >
      <h3>{name}</h3>
      <h2>{price}</h2>

      {features.map((f, i) => (
        <div key={i}>✓ {f}</div>
      ))}

      {action && (
        <button
          style={{ ...primaryBtn, marginTop: "12px" }}
          onClick={action}
        >
          Start Free
        </button>
      )}
    </div>
  );
}

/* STYLES */

const nav = {
  display: "flex",
  justifyContent: "space-between",
  padding: "20px",
  background: "#ffffff",
  borderBottom: "1px solid #e5e7eb"
};

const hero = {
  padding: "60px 20px",
  textAlign: "center"
};

const heroTitle = {
  fontSize: "42px",
  marginBottom: "16px"
};

const heroText = {
  color: "#475569",
  marginBottom: "20px"
};

const section = {
  padding: "40px 20px"
};

const sectionTitle = {
  marginBottom: "20px"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "20px"
};

const card = {
  background: "#ffffff",
  padding: "20px",
  borderRadius: "12px"
};

const cta = {
  padding: "60px 20px",
  textAlign: "center",
  background: "#0f172a",
  color: "#ffffff"
};

const primaryBtn = {
  padding: "10px 16px",
  background: "#7c3aed",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer"
};

const secondaryBtn = {
  padding: "10px 16px",
  border: "1px solid #d1d5db",
  background: "#fff",
  borderRadius: "8px",
  cursor: "pointer"
};

const primaryBtnLarge = {
  ...primaryBtn,
  padding: "14px 20px"
};

const secondaryBtnLarge = {
  ...secondaryBtn,
  padding: "14px 20px"
};