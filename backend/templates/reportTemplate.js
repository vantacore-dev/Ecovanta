function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getRiskClass(value) {
  const risk = String(value || "").toLowerCase();

  if (risk.includes("low")) return "low";
  if (risk.includes("moderate")) return "medium";
  if (risk.includes("elevated")) return "medium";
  if (risk.includes("high")) return "high";

  return "medium";
}

function formatText(value, fallback = "Not provided.") {
  const safe = escapeHtml(value || fallback);
  return safe.replace(/\n/g, "<br/>");
}

function renderPillarScores(pillarScores = {}) {
  const entries = Object.entries(pillarScores || {});

  if (!entries.length) {
    return `<div class="card muted">No pillar scores available.</div>`;
  }

  return entries
    .map(
      ([key, value]) => `
        <div class="metric-card">
          <div class="metric-label">${escapeHtml(key.toUpperCase())}</div>
          <div class="metric-value">${escapeHtml(value)}/100</div>
        </div>
      `
    )
    .join("");
}

function renderMaterialityTopics(topics = []) {
  if (!Array.isArray(topics) || topics.length === 0) {
    return `<div class="card muted">No materiality topics available.</div>`;
  }

  return topics
    .map((topic) => {
      const stakeholders = Array.isArray(topic.stakeholdersConsulted)
        ? topic.stakeholdersConsulted.join(", ")
        : topic.stakeholdersConsulted || "Not provided";

      return `
        <div class="card">
          <h3>${escapeHtml(topic.topicCode)} — ${escapeHtml(topic.topicLabel)}</h3>

          <div class="mini-grid">
            <div>
              <span class="metric-label">Impact Score</span>
              <strong>${escapeHtml(topic.impactScore100 ?? 0)}/100</strong>
            </div>
            <div>
              <span class="metric-label">Financial Score</span>
              <strong>${escapeHtml(topic.financialScore100 ?? 0)}/100</strong>
            </div>
            <div>
              <span class="metric-label">Overall Score</span>
              <strong>${escapeHtml(topic.overallMaterialityScore ?? 0)}/100</strong>
            </div>
          </div>

          <p>
            <strong>Status:</strong>
            <span class="badge ${topic.isMaterial ? "high" : "low"}">
              ${topic.isMaterial ? "Material" : "Not Material"}
            </span>
          </p>

          <p><strong>Stakeholders consulted:</strong> ${escapeHtml(stakeholders)}</p>
          <p><strong>Rationale:</strong> ${formatText(topic.rationale || "No rationale provided.")}</p>
        </div>
      `;
    })
    .join("");
}

function getReportHTML(report) {
  const companyName = escapeHtml(report.companyName || "Company");
  const year = escapeHtml(report.reportingYear || "");
  const sector = escapeHtml(report.sector || "");
  const status = escapeHtml(report.reviewStatus || "draft");

  const scorecard = report.scorecard || {};
  const riskClass = getRiskClass(scorecard.riskLevel);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${companyName} ESG Report</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      font-family: Inter, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 13px;
      line-height: 1.55;

      <div class="section page-break">
  <h2>Analytics & Visual Insights</h2>

  ${
    report.charts?.benchmarkChart
      ? `
        <div class="chart-card">
          <h3>Benchmark Comparison</h3>
          <img src="${report.charts.benchmarkChart}" />
        </div>
      `
      : ""
  }

<div class="section page-break">
  <h2>Analytics & Visual Insights</h2>

  ${
    report.charts?.benchmarkChart
      ? `
        <div class="chart-card">
          <h3>Benchmark Comparison</h3>
          <img src="${report.charts.benchmarkChart}" />
        </div>
      `
      : `<div class="card muted">Benchmark chart not available.</div>`
  }

  ${
    report.charts?.materialityHeatmap
      ? `
        <div class="chart-card">
          <h3>Materiality Heatmap</h3>
          <img src="${report.charts.materialityHeatmap}" />
        </div>
      `
      : `<div class="card muted">Materiality heatmap not available.</div>`
  }

  ${
    report.charts?.complianceGauge
      ? `
        <div class="chart-card">
          <h3>Compliance Gap Dashboard</h3>
          <img src="${report.charts.complianceGauge}" />
        </div>
      `
      : `<div class="card muted">Compliance gauge not available.</div>`
  }
</div>

  ${
    report.charts?.materialityHeatmap
      ? `
        <div class="chart-card">
          <h3>Materiality Heatmap</h3>
          <img src="${report.charts.materialityHeatmap}" />
        </div>
      `
      : ""
  }

  ${
    report.charts?.complianceGauge
      ? `
        <div class="chart-card">
          <h3>Compliance Gap Dashboard</h3>
          <img src="${report.charts.complianceGauge}" />
        </div>
      `
      : ""
  }
</div>
    }

    .page {
      padding: 34px;
    }

    .cover {
      background: linear-gradient(135deg, #0f172a 0%, #14532d 100%);
      color: #ffffff;
      padding: 42px 34px;
      border-radius: 18px;
      margin-bottom: 28px;
    }

    .brand {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #bbf7d0;
      margin-bottom: 36px;
    }

    h1 {
      font-size: 32px;
      line-height: 1.1;
      margin: 0 0 12px 0;
      color: inherit;
    }

    .subtitle {
      font-size: 15px;
      color: #d1fae5;
      margin-top: 8px;
    }

    h2 {
      font-size: 18px;
      color: #0f172a;
      margin: 28px 0 12px 0;
      padding-bottom: 7px;
      border-bottom: 1px solid #e5e7eb;
    }

    h3 {
      font-size: 15px;
      margin: 0 0 10px 0;
      color: #0f172a;
    }

    p {
      margin: 8px 0;
    }

    .section {
      margin-bottom: 24px;
    }

    .page-break {
      page-break-before: always;
    }

    .card,
    .metric-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 10px;
    }

    .card.white {
      background: #ffffff;
    }

    .muted {
      color: #64748b;
    }

   .grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.metric-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
}

.metric-label {
  display: block;
  color: #64748b;
  font-size: 11px;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-value {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
}

.badge {
  display: inline-block;
  padding: 5px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.badge.high {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.badge.medium {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.badge.low {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.chart-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 18px;
  page-break-inside: avoid;
}

.chart-card img {
  width: 100%;
  height: auto;
  max-height: 360px;
  object-fit: contain;
  display: block;
  margin: 8px auto 0 auto;
}

    .status-pill {
      display: inline-block;
      background: #ede9fe;
      color: #5b21b6;
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .footer {
      margin-top: 32px;
      padding-top: 14px;
      border-top: 1px solid #e5e7eb;
      color: #64748b;
      font-size: 11px;
    }
  </style>
</head>

<body>
  <div class="page">

   <div class="cover">
  <div class="brand">ECOVANTA</div>
  <h1>${companyName} ESG / ESRS Report</h1>
  <div class="subtitle">
    Reporting year: ${year} · Sector: ${sector} · Status:
    <span class="status-pill">${status}</span>
  </div>
</div>

<div class="section">
  <h2>Executive ESG Snapshot</h2>

  <div class="grid-3">
    <div class="metric-card">
      <div class="metric-label">ESG Score</div>
      <div class="metric-value">
        ${escapeHtml(report.scorecard?.overallScore ?? "N/A")}/100
      </div>
    </div>

    <div class="metric-card">
      <div class="metric-label">Risk Level</div>
      <span class="badge ${getRiskClass(report.scorecard?.riskLevel)}">
        ${escapeHtml(report.scorecard?.riskLevel || "Not assessed")}
      </span>
    </div>

    <div class="metric-card">
      <div class="metric-label">Benchmark</div>
      <div class="metric-value">
        ${escapeHtml(report.scorecard?.benchmark ?? "N/A")}
      </div>
    </div>
  </div>
</div>

    
    <div class="section">
      
        <div class="section page-break">
  <h2>Analytics & Visual Insights</h2>

  ${
    report.charts?.benchmarkChart
      ? `
        <div class="chart-card">
          <h3>Benchmark Comparison</h3>
          <img src="${report.charts.benchmarkChart}" />
        </div>
      `
      : ""
  }

  ${
    report.charts?.materialityHeatmap
      ? `
        <div class="chart-card">
          <h3>Materiality Heatmap</h3>
          <img src="${report.charts.materialityHeatmap}" />
        </div>
      `
      : ""
  }

  ${
    report.charts?.complianceGauge
      ? `
        <div class="chart-card">
          <h3>Compliance Gap Dashboard</h3>
          <img src="${report.charts.complianceGauge}" />
        </div>
      `
      : ""
  }
</div>
      <div class="grid-3">
        <div class="metric-card">
          <div class="metric-label">ESG Score</div>
          <div class="metric-value">${escapeHtml(scorecard.overallScore ?? "N/A")}/100</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Risk Level</div>
          <span class="badge ${riskClass}">
            ${escapeHtml(scorecard.riskLevel || "Not assessed")}
          </span>
        </div>

        <div class="metric-card">
          <div class="metric-label">Benchmark</div>
          <div class="metric-value">${escapeHtml(scorecard.benchmark ?? "N/A")}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Pillar Scores</h2>
      <div class="grid-3">
        ${renderPillarScores(scorecard.pillarScores)}
      </div>
    </div>
 
    <div class="section">
      <h2>AI Executive Summary</h2>
      <div class="card">${formatText(report.aiDraft?.executiveSummary || "No executive summary generated.")}</div>
    </div>

    <div class="section">
      <h2>AI Recommendations</h2>
      <div class="card">${formatText(report.aiDraft?.recommendations || "No recommendations generated.")}</div>
    </div>

    <div class="section">
      <h2>AI Data Gaps</h2>
      <div class="card">${formatText(report.aiDraft?.dataGaps || "No data gaps generated.")}</div>
    </div>

    <div class="section page-break">
      <h2>ESRS 2 — General Disclosures</h2>

      <h3>Governance</h3>
      <div class="card">${formatText(report.esrs2?.governance)}</div>

      <h3>Strategy</h3>
      <div class="card">${formatText(report.esrs2?.strategy)}</div>

      <h3>Impacts, Risks and Opportunities</h3>
      <div class="card">${formatText(report.esrs2?.impactsRisksOpportunities)}</div>

      <h3>Metrics and Targets</h3>
      <div class="card">${formatText(report.esrs2?.metricsTargets)}</div>
    </div>

    <div class="section">
      <h2>E1 — Climate Change</h2>

      <div class="grid-3">
        <div class="metric-card">
          <div class="metric-label">Scope 1</div>
          <div class="metric-value">${escapeHtml(report.e1?.scope1Emissions ?? 0)}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Scope 2</div>
          <div class="metric-value">${escapeHtml(report.e1?.scope2Emissions ?? 0)}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Scope 3</div>
          <div class="metric-value">${escapeHtml(report.e1?.scope3Emissions ?? 0)}</div>
        </div>
      </div>

      <h3>Climate Policies</h3>
      <div class="card">${formatText(report.e1?.climatePolicies)}</div>
    </div>

    <div class="section">
      <h2>S1 — Own Workforce</h2>

      <h3>Workforce Policies</h3>
      <div class="card">${formatText(report.s1?.workforcePolicies)}</div>

      <h3>Diversity and Inclusion</h3>
      <div class="card">${formatText(report.s1?.diversityInclusion)}</div>
    </div>

    <div class="section">
      <h2>G1 — Business Conduct</h2>

      <h3>Anti-Corruption</h3>
      <div class="card">${formatText(report.g1?.antiCorruption)}</div>

      <h3>Whistleblowing</h3>
      <div class="card">${formatText(report.g1?.whistleblowing)}</div>
    </div>

    <div class="section page-break">
      <h2>Materiality Topics</h2>
      ${renderMaterialityTopics(report.materialityTopics)}
    </div>

    <div class="section page-break">
      <h2>AI Disclosure Draft</h2>
      <div class="card">${formatText(report.aiDraft?.disclosureDraft || "No disclosure draft generated.")}</div>
    </div>

    <div class="footer">
      Generated by Ecovanta · AI-powered ESG and CSRD reporting platform
    </div>
.chart-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 18px;
  page-break-inside: avoid;
}

.chart-card img {
  width: 100%;
  max-width: 680px;
  display: block;
  margin: 8px auto 0 auto;
}
  </div>
</body>
</html>
`;
}

module.exports = { getReportHTML };