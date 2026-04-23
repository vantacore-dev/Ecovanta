import { PLAN_KEYS, PLAN_CONFIG } from "./plans";
import React from "react";

export default function EcovantaLandingPage() {
  const goToSignup = () => {
    window.location.href = "/?signup=true";
  };

  const goToDemo = () => {
    window.location.href = "mailto:hello@ecovanta.ai?subject=Ecovanta Demo Request";
  };

  return (
    <div
      style={{
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: "#f8fafc",
        color: "#0f172a",
        minHeight: "100vh"
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(248, 250, 252, 0.92)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #e5e7eb"
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "12px",
                background:
                  "linear-gradient(135deg, #7c3aed 0%, #10b981 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: "bold"
              }}
            >
              E
            </div>
            <div>
              <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                ecovanta.ai
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                AI-powered ESG reporting
              </div>
            </div>
          </div>

          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap"
            }}
          >
            <a href="#features" style={navLinkStyle}>
              Features
            </a>
            <a href="#how-it-works" style={navLinkStyle}>
              How it works
            </a>
            <a href="#pricing" style={navLinkStyle}>
              Pricing
            </a>
            <button style={secondaryButtonStyle} onClick={goToDemo}>
              Book Demo
            </button>
            <button style={primaryButtonStyle} onClick={goToSignup}>
              Start Free
            </button>
          </nav>
        </div>
      </header>

      <section
        style={{
          padding: "72px 24px 56px 24px"
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: "40px",
            alignItems: "center"
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#ede9fe",
                color: "#5b21b6",
                padding: "8px 14px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: "bold",
                marginBottom: "18px"
              }}
            >
              ESRS-aligned • Audit-ready • AI-powered
            </div>

            <h1
              style={{
                fontSize: "56px",
                lineHeight: 1.05,
                margin: "0 0 18px 0",
                letterSpacing: "-1.5px"
              }}
            >
              ESG &amp; CSRD Reporting —
              <br />
              Simplified with AI
            </h1>

            <p
              style={{
                fontSize: "20px",
                lineHeight: 1.7,
                color: "#475569",
                maxWidth: "680px",
                marginBottom: "28px"
              }}
            >
              Turn complex sustainability data into audit-ready, investor-grade
              reports in minutes — not months.
            </p>

            <div
              style={{
                display: "flex",
                gap: "14px",
                flexWrap: "wrap",
                marginBottom: "20px"
              }}
            >
              <button style={primaryButtonLargeStyle} onClick={goToSignup}>
                Start Free
              </button>
              <button style={secondaryButtonLargeStyle} onClick={goToDemo}>
                Book Demo
              </button>
            </div>

            <div
              style={{
                color: "#64748b",
                fontSize: "14px"
              }}
            >
              Designed for sustainability teams, CFOs, and compliance leaders.
            </div>
          </div>

          <div>
            <div
              style={{
                background: "#ffffff",
                borderRadius: "24px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 24px 60px rgba(15, 23, 42, 0.10)",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  background: "#0f172a",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ color: "#ffffff", fontWeight: "bold" }}>
                  Ecovanta Dashboard
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px"
                  }}
                >
                  <span style={dot("#ef4444")} />
                  <span style={dot("#f59e0b")} />
                  <span style={dot("#10b981")} />
                </div>
              </div>

              <div style={{ padding: "22px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                    marginBottom: "18px"
                  }}
                >
                  <MetricCard title="Overall Score" value="78" accent="#10b981" />
                  <MetricCard title="Compliance" value="84%" accent="#7c3aed" />
                  <MetricCard title="Material Topics" value="6" accent="#f59e0b" />
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: "16px",
                    padding: "16px",
                    border: "1px solid #e5e7eb",
                    marginBottom: "14px"
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
                    AI Recommendation
                  </div>
                  <div
                    style={{
                      display: "inline-block",
                      background: "#fee2e2",
                      color: "#991b1b",
                      border: "1px solid #fecaca",
                      borderRadius: "999px",
                      padding: "4px 10px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      marginBottom: "10px"
                    }}
                  >
                    High Priority
                  </div>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    Define a climate transition plan with Scope 1–3 targets,
                    board accountability, and KPI tracking aligned with ESRS E1.
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px"
                  }}
                >
                  <MiniPanel title="Benchmark Comparison">
                    <div style={barRow}>
                      <span>Company</span>
                      <div style={barTrack}>
                        <div
                          style={{
                            ...barFill,
                            width: "78%",
                            background: "#5b8db8"
                          }}
                        />
                      </div>
                    </div>
                    <div style={barRow}>
                      <span>Sector Avg</span>
                      <div style={barTrack}>
                        <div
                          style={{
                            ...barFill,
                            width: "65%",
                            background: "#c7a86d"
                          }}
                        />
                      </div>
                    </div>
                  </MiniPanel>

                  <MiniPanel title="Compliance Gaps">
                    <div style={{ color: "#475569", lineHeight: 1.7 }}>
                      • Missing Scope 3 methodology
                      <br />
                      • Targets not disclosed
                      <br />
                      • Workforce KPIs incomplete
                    </div>
                  </MiniPanel>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "0 24px 56px 24px" }}>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "18px",
            padding: "22px 28px",
            display: "flex",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
            alignItems: "center"
          }}
        >
          <div style={{ fontWeight: "bold" }}>
            Designed for CSRD, ESRS, and enterprise sustainability workflows
          </div>
          <div
            style={{
              display: "flex",
              gap: "24px",
              flexWrap: "wrap",
              color: "#64748b",
              fontSize: "14px"
            }}
          >
            <span>ESRS-aligned</span>
            <span>Audit-ready outputs</span>
            <span>Enterprise-grade workflows</span>
          </div>
        </div>
      </section>

      <section id="features" style={{ padding: "0 24px 72px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <SectionHeader
            eyebrow="Features"
            title="Built for serious ESG reporting teams"
            text="Ecovanta combines structured ESG data collection, AI-powered drafting, and decision-ready analytics in one platform."
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px"
            }}
          >
            <FeatureCard
              icon="✦"
              title="AI-Powered ESG Drafting"
              text="Automatically generate structured ESRS-compliant disclosures, executive summaries, and tailored recommendations."
            />
            <FeatureCard
              icon="◌"
              title="Double Materiality Engine"
              text="Quantify impact and financial materiality with a structured scoring model aligned with ESRS expectations."
            />
            <FeatureCard
              icon="▣"
              title="Compliance Gap Dashboard"
              text="Instantly identify missing disclosures, weak sections, and incomplete ESG inputs across the report."
            />
            <FeatureCard
              icon="▤"
              title="Benchmark Intelligence"
              text="Compare company performance against sector reference points and track improvement over time."
            />
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        style={{
          padding: "72px 24px",
          background: "#ffffff",
          borderTop: "1px solid #e5e7eb",
          borderBottom: "1px solid #e5e7eb"
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <SectionHeader
            eyebrow="How it works"
            title="From ESG data to investor-ready reports"
            text="A simple workflow designed for compliance, clarity, and speed."
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px"
            }}
          >
            <StepCard
              number="1"
              title="Input your ESG data"
              text="Enter governance, environmental, social, and business conduct information in a structured format."
            />
            <StepCard
              number="2"
              title="Generate AI draft"
              text="Produce disclosures, identify data gaps, and receive consulting-grade recommendations with actions and KPIs."
            />
            <StepCard
              number="3"
              title="Export board-ready reports"
              text="Download professional PDF reports aligned with CSRD and ESRS expectations."
            />
          </div>
        </div>
      </section>

      <section style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <SectionHeader
            eyebrow="Analytics"
            title="ESG intelligence — not just reporting"
            text="Go beyond compliance with real-time visibility into your ESG performance, risks, and priorities."
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px"
            }}
          >
            <div style={analyticsCardStyle}>
              <h3 style={analyticsTitleStyle}>Benchmark Comparison</h3>
              <p style={analyticsTextStyle}>
                Compare current ESG performance against sector averages and top
                quartile benchmarks.
              </p>
              <div style={{ marginTop: "18px" }}>
                <div style={barRow}>
                  <span>Company</span>
                  <div style={barTrack}>
                    <div
                      style={{
                        ...barFill,
                        width: "78%",
                        background: "#5b8db8"
                      }}
                    />
                  </div>
                </div>
                <div style={barRow}>
                  <span>Sector Avg</span>
                  <div style={barTrack}>
                    <div
                      style={{
                        ...barFill,
                        width: "65%",
                        background: "#c7a86d"
                      }}
                    />
                  </div>
                </div>
                <div style={barRow}>
                  <span>Top Quartile</span>
                  <div style={barTrack}>
                    <div
                      style={{
                        ...barFill,
                        width: "82%",
                        background: "#6fa287"
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={analyticsCardStyle}>
              <h3 style={analyticsTitleStyle}>Compliance Gap Dashboard</h3>
              <p style={analyticsTextStyle}>
                Track completeness by disclosure section and focus teams on the
                highest-priority gaps.
              </p>
              <div style={{ marginTop: "18px", display: "grid", gap: "12px" }}>
                <GapRow section="ESRS 2" percent={85} />
                <GapRow section="E1 Climate" percent={68} />
                <GapRow section="S1 Workforce" percent={72} />
                <GapRow section="G1 Business Conduct" percent={90} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" style={{ padding: "0 24px 72px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <SectionHeader
            eyebrow="Pricing"
            title="Simple, transparent pricing"
            text="Choose the plan that matches your reporting maturity and team needs."
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              alignItems: "stretch"
            }}
          >
            <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    alignItems: "stretch"
  }}
>
  {[PLAN_KEYS.FREE, PLAN_KEYS.PRO, PLAN_KEYS.ENTERPRISE].map((planKey) => {
    const plan = PLAN_CONFIG[planKey];

    return (
      <PricingCard
        key={plan.key}
        name={plan.name}
        price={plan.priceDisplay}
        description={plan.description}
        features={plan.marketingFeatures}
        highlighted={plan.highlighted}
        buttonText={plan.cta}
        onAction={
          plan.key === PLAN_KEYS.ENTERPRISE ? goToDemo : goToSignup
        }
          />
            );
              })}
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "72px 24px",
          background: "#0f172a",
          color: "#ffffff"
        }}
      >
        <div
          style={{
            maxWidth: "980px",
            margin: "0 auto",
            textAlign: "center"
          }}
        >
          <div
            style={{
              color: "#c4b5fd",
              fontSize: "14px",
              fontWeight: "bold",
              marginBottom: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.08em"
            }}
          >
            Ready to simplify ESG reporting?
          </div>

          <h2
            style={{
              fontSize: "42px",
              lineHeight: 1.15,
              margin: "0 0 16px 0"
            }}
          >
            Turn compliance into a strategic advantage
          </h2>

          <p
            style={{
              maxWidth: "760px",
              margin: "0 auto 28px auto",
              color: "#cbd5e1",
              fontSize: "18px",
              lineHeight: 1.7
            }}
          >
            Join Ecovanta, a green-tech & forward-thinking company using AI to accelerate CSRD
            readiness, improve ESG reporting quality, and deliver investor-grade
            disclosures.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "14px",
              flexWrap: "wrap"
            }}
          >
            <button style={finalPrimaryButtonStyle} onClick={goToSignup}>
              Start Free
            </button>
            <button style={finalSecondaryButtonStyle} onClick={goToDemo}>
              Book Demo
            </button>
          </div>
        </div>
      </section>

      <footer
        style={{
          padding: "28px 24px",
          background: "#ffffff",
          borderTop: "1px solid #e5e7eb"
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            color: "#64748b",
            fontSize: "14px"
          }}
        >
          <div>
            Ecovanta is an AI-powered ESG and CSRD reporting platform designed
            to help organizations meet regulatory requirements and deliver
            investor-grade sustainability disclosures.
          </div>
          <div>© 2026 Ecovanta.ai</div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ eyebrow, title, text }) {
  return (
    <div
      style={{
        marginBottom: "32px",
        maxWidth: "760px"
      }}
    >
      <div
        style={{
          color: "#7c3aed",
          fontSize: "14px",
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "10px"
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontSize: "40px",
          lineHeight: 1.15,
          margin: "0 0 12px 0",
          color: "#0f172a"
        }}
      >
        {title}
      </h2>
      <p
        style={{
          margin: 0,
          color: "#475569",
          lineHeight: 1.7,
          fontSize: "18px"
        }}
      >
        {text}
      </p>
    </div>
  );
}

function FeatureCard({ title, text, icon }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
        border: "1px solid #e5e7eb",
        height: "100%"
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
          marginBottom: "16px"
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          margin: "0 0 10px 0",
          fontSize: "20px",
          color: "#0f172a"
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: 0,
          color: "#475569",
          lineHeight: 1.6,
          fontSize: "15px"
        }}
      >
        {text}
      </p>
    </div>
  );
}

function StepCard({ number, title, text }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "24px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)"
      }}
    >
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "999px",
          background: "#7c3aed",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          marginBottom: "16px"
        }}
      >
        {number}
      </div>
      <h3
        style={{
          margin: "0 0 10px 0",
          fontSize: "20px",
          color: "#0f172a"
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: 0,
          color: "#475569",
          lineHeight: 1.6
        }}
      >
        {text}
      </p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  highlighted = false,
  buttonText,
  onAction
}) {
  return (
    <div
      style={{
        background: highlighted ? "#0f172a" : "#ffffff",
        color: highlighted ? "#ffffff" : "#0f172a",
        borderRadius: "20px",
        padding: "28px",
        border: highlighted ? "1px solid #0f172a" : "1px solid #e5e7eb",
        boxShadow: highlighted
          ? "0 16px 40px rgba(124, 58, 237, 0.18)"
          : "0 8px 24px rgba(15, 23, 42, 0.06)",
        position: "relative",
        height: "100%"
      }}
    >
      {highlighted && (
        <div
          style={{
            position: "absolute",
            top: "-12px",
            right: "20px",
            background: "#7c3aed",
            color: "#ffffff",
            borderRadius: "999px",
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: "bold"
          }}
        >
          Most Popular
        </div>
      )}

      <div
        style={{
          fontSize: "14px",
          fontWeight: "bold",
          color: highlighted ? "#c4b5fd" : "#7c3aed",
          marginBottom: "10px"
        }}
      >
        {name}
      </div>

      <div
        style={{
          fontSize: "36px",
          fontWeight: "bold",
          marginBottom: "12px"
        }}
      >
        {price}
      </div>

      <p
        style={{
          color: highlighted ? "#cbd5e1" : "#475569",
          lineHeight: 1.6,
          minHeight: "48px"
        }}
      >
        {description}
      </p>

      <div style={{ marginTop: "24px", marginBottom: "24px" }}>
        {features.map((feature, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "start",
              gap: "10px",
              marginBottom: "12px"
            }}
          >
            <span style={{ color: highlighted ? "#86efac" : "#10b981" }}>✓</span>
            <span style={{ color: highlighted ? "#e2e8f0" : "#334155" }}>
              {feature}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onAction}
        style={{
          width: "100%",
          padding: "14px 18px",
          borderRadius: "12px",
          border: "none",
          background: highlighted ? "#7c3aed" : "#0f172a",
          color: "#ffffff",
          fontWeight: "bold",
          cursor: "pointer",
          fontSize: "15px"
        }}
      >
        {buttonText}
      </button>
    </div>
  );
}

function MetricCard({ title, value, accent }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "14px"
      }}
    >
      <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "6px" }}>
        {title}
      </div>
      <div
        style={{
          fontSize: "26px",
          fontWeight: "bold",
          color: accent
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MiniPanel({ title, children }) {
  return (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: "14px",
        padding: "14px",
        border: "1px solid #e5e7eb"
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "10px" }}>{title}</div>
      {children}
    </div>
  );
}

function GapRow({ section, percent }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "14px",
          marginBottom: "6px"
        }}
      >
        <span>{section}</span>
        <span>{percent}%</span>
      </div>
      <div
        style={{
          width: "100%",
          height: "10px",
          borderRadius: "999px",
          background: "#e5e7eb",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background:
              percent >= 80 ? "#10b981" : percent >= 60 ? "#f59e0b" : "#ef4444"
          }}
        />
      </div>
    </div>
  );
}

const navLinkStyle = {
  color: "#475569",
  textDecoration: "none",
  fontWeight: "600",
  padding: "8px 10px"
};

const primaryButtonStyle = {
  padding: "10px 16px",
  borderRadius: "12px",
  border: "none",
  background: "#7c3aed",
  color: "#ffffff",
  fontWeight: "bold",
  cursor: "pointer"
};

const secondaryButtonStyle = {
  padding: "10px 16px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#0f172a",
  fontWeight: "bold",
  cursor: "pointer"
};

const primaryButtonLargeStyle = {
  padding: "14px 20px",
  borderRadius: "14px",
  border: "none",
  background: "#7c3aed",
  color: "#ffffff",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "15px"
};

const secondaryButtonLargeStyle = {
  padding: "14px 20px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#0f172a",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "15px"
};

const finalPrimaryButtonStyle = {
  padding: "14px 22px",
  borderRadius: "14px",
  border: "none",
  background: "#7c3aed",
  color: "#ffffff",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "15px"
};

const finalSecondaryButtonStyle = {
  padding: "14px 22px",
  borderRadius: "14px",
  border: "1px solid #475569",
  background: "transparent",
  color: "#ffffff",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "15px"
};

const analyticsCardStyle = {
  background: "#ffffff",
  borderRadius: "20px",
  padding: "24px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)"
};

const analyticsTitleStyle = {
  margin: "0 0 8px 0",
  color: "#0f172a",
  fontSize: "22px"
};

const analyticsTextStyle = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.6
};

const barRow = {
  display: "grid",
  gridTemplateColumns: "100px 1fr",
  gap: "10px",
  alignItems: "center",
  marginBottom: "10px",
  fontSize: "14px",
  color: "#475569"
};

const barTrack = {
  width: "100%",
  height: "10px",
  background: "#e5e7eb",
  borderRadius: "999px",
  overflow: "hidden"
};

const barFill = {
  height: "100%",
  borderRadius: "999px"
};

const dot = (color) => ({
  width: "10px",
  height: "10px",
  borderRadius: "999px",
  background: color,
  display: "inline-block"
});