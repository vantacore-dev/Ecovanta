function getReportHTML(report) {
  return `
  <html>
  <head>
    <style>
      body {
        font-family: Inter, Arial, sans-serif;
        color: #111827;
        padding: 20px;
      }

      h1 {
        font-size: 24px;
        font-weight: 700;
      }

      h2 {
        font-size: 18px;
        margin-top: 20px;
      }

      .card {
        background: #f9fafb;
        padding: 16px;
        border-radius: 12px;
        margin-bottom: 12px;
      }

      .badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: bold;
      }

      .high {
        background: #fee2e2;
        color: #991b1b;
      }

      .medium {
        background: #fef3c7;
        color: #92400e;
      }

      .low {
        background: #dcfce7;
        color: #166534;
      }

      .section {
        margin-bottom: 20px;
      }
    </style>
  </head>

  <body>

  <h1>${report.companyName} ESG Report</h1>

    <div class="section">
  <h2>Overview</h2>

  <div class="card">
    <strong>ESG Score</strong><br/>
    ${report.overallScore || "N/A"}/100
  </div>

  <div class="card">
    <strong>Risk Level</strong><br/>
    <span class="badge ${report.riskLevel}">
      ${report.riskLevel?.toUpperCase() || "UNKNOWN"}
    </span>
    </div>
    </div>

    <div class="section">
      <h2>Overall Risk</h2>
      <span class="badge ${report.riskLevel}">
        ${report.riskLevel.toUpperCase()}
      </span>
    </div>

    <div class="section">
      <h2>Governance</h2>
      <div class="card">${report.esrs2?.governance || ""}</div>
    </div>

    <div class="section">
      <h2>Strategy</h2>
      <div class="card">${report.esrs2?.strategy || ""}</div>
    </div>

    <div class="section">
      <h2>Recommendations</h2>
      ${(report.recommendations || [])
        .map(
          (rec) => `
          <div class="card">
            <strong>${rec.title}</strong><br/>
            ${rec.description}
            <br/>
            <span class="badge ${rec.priority}">
              ${rec.priority.toUpperCase()}
            </span>
          </div>
        `
        )
        .join("")}
    </div>

  </body>
  </html>
  `;
}

module.exports = { getReportHTML };