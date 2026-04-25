const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width: 900,
  height: 500,
  backgroundColour: "white"
});

const toDataUri = (buffer) =>
  `data:image/png;base64,${Buffer.from(buffer).toString("base64")}`;

const getSectorBenchmarks = (sector) => {
  const benchmarks = {
    tech: { sectorAverage: 65, topQuartile: 82 },
    energy: { sectorAverage: 58, topQuartile: 78 },
    manufacturing: { sectorAverage: 61, topQuartile: 79 }
  };

  return benchmarks[sector] || { sectorAverage: 60, topQuartile: 75 };
};

const getComplianceScore = (report) => {
  const checks = [
    report?.esrs2?.governance,
    report?.esrs2?.strategy,
    report?.esrs2?.impactsRisksOpportunities,
    report?.esrs2?.metricsTargets,
    report?.e1?.scope1Emissions,
    report?.e1?.scope2Emissions,
    report?.e1?.scope3Emissions,
    report?.e1?.climatePolicies,
    report?.s1?.workforcePolicies,
    report?.s1?.diversityInclusion,
    report?.g1?.antiCorruption,
    report?.g1?.whistleblowing
  ];

  const complete = checks.filter(
    (item) =>
      item !== undefined &&
      item !== null &&
      String(item).trim() !== "" &&
      String(item).trim() !== "0"
  ).length;

  return checks.length ? Math.round((complete / checks.length) * 100) : 0;
};

async function buildBenchmarkChart(report) {
  const sectorBench = getSectorBenchmarks(report.sector);

  const buffer = await chartJSNodeCanvas.renderToBuffer({
    type: "bar",
    data: {
      labels: ["Company Score", "Sector Average", "Top Quartile"],
      datasets: [
        {
          data: [
            Number(report.scorecard?.overallScore || 0),
            Number(report.scorecard?.sectorAverage || sectorBench.sectorAverage),
            Number(report.scorecard?.topQuartile || sectorBench.topQuartile)
          ],
          backgroundColor: ["#5B8DB8", "#C7A86D", "#6FA287"],
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 50
        }
      ]
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Benchmark Comparison",
          color: "#1F2937",
          font: { size: 22, weight: "bold" }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 20, color: "#6B7280" },
          grid: { color: "#E5E7EB" }
        },
        x: {
          ticks: { color: "#4B5563" },
          grid: { display: false }
        }
      }
    }
  });

  return toDataUri(buffer);
}

async function buildMaterialityHeatmapChart(report) {
  const points = Array.isArray(report.materialityTopics)
    ? report.materialityTopics.map((topic) => ({
        x: Number(topic.financialScore100 || 0),
        y: Number(topic.impactScore100 || 0),
        label: topic.topicCode || topic.topicLabel || "Topic",
        isMaterial: Boolean(topic.isMaterial)
      }))
    : [];

  const buffer = await chartJSNodeCanvas.renderToBuffer({
    type: "scatter",
    data: {
      datasets: [
        {
          data: points,
          backgroundColor: points.map((p) =>
            p.isMaterial ? "#7A6AAE" : "#B8B4C7"
          ),
          borderColor: points.map((p) =>
            p.isMaterial ? "#5C4E8C" : "#9CA3AF"
          ),
          borderWidth: 1.5,
          pointRadius: 7
        }
      ]
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Materiality Heatmap",
          color: "#1F2937",
          font: { size: 22, weight: "bold" }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          title: { display: true, text: "Financial Materiality" },
          grid: { color: "#E5E7EB" }
        },
        y: {
          min: 0,
          max: 100,
          title: { display: true, text: "Impact Materiality" },
          grid: { color: "#E5E7EB" }
        }
      }
    },
    plugins: [
      {
        id: "pointLabels",
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          const meta = chart.getDatasetMeta(0);

          ctx.save();
          ctx.font = "bold 11px Arial";
          ctx.fillStyle = "#374151";

          meta.data.forEach((point, index) => {
            const raw = chart.data.datasets[0].data[index];
            if (raw?.label) ctx.fillText(raw.label, point.x + 8, point.y - 8);
          });

          ctx.restore();
        }
      }
    ]
  });

  return toDataUri(buffer);
}

async function buildComplianceGaugeChart(report) {
  const score = getComplianceScore(report);

  const buffer = await chartJSNodeCanvas.renderToBuffer({
    type: "doughnut",
    data: {
      labels: ["Low", "Moderate", "Strong"],
      datasets: [
        {
          data: [40, 30, 30],
          backgroundColor: ["#C96A5A", "#D7B26D", "#6FA287"],
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: false,
      rotation: -90,
      circumference: 180,
      cutout: "72%",
      animation: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Compliance Gap Dashboard",
          color: "#1F2937",
          font: { size: 22, weight: "bold" }
        }
      }
    },
    plugins: [
      {
        id: "premiumGaugeNeedle",
        afterDatasetDraw(chart) {
          const { ctx } = chart;
          const meta = chart.getDatasetMeta(0);
          if (!meta?.data?.length) return;

          const arc = meta.data[0];
          const centerX = arc.x;
          const centerY = arc.y;
          const outerRadius = arc.outerRadius;

          const angle = Math.PI * (score / 100) - Math.PI;
          const needleLength = outerRadius * 0.82;
          const needleX = centerX + Math.cos(angle) * needleLength;
          const needleY = centerY + Math.sin(angle) * needleLength;

          ctx.save();

          ctx.beginPath();
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#1F2937";
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(needleX, needleY);
          ctx.stroke();

          ctx.beginPath();
          ctx.fillStyle = "#1F2937";
          ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.fillStyle = "#F9FAFB";
          ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = "bold 38px Arial";
          ctx.fillStyle = "#111827";
          ctx.textAlign = "center";
          ctx.fillText(`${score}%`, centerX, centerY - 18);

          ctx.font = "15px Arial";
          ctx.fillStyle = "#6B7280";
          ctx.fillText("Compliance Score", centerX, centerY + 20);

          ctx.restore();
        }
      }
    ]
  });

  return toDataUri(buffer);
}

async function buildPdfCharts(report) {
  const [benchmarkChart, materialityHeatmap, complianceGauge] =
    await Promise.all([
      buildBenchmarkChart(report),
      buildMaterialityHeatmapChart(report),
      buildComplianceGaugeChart(report)
    ]);

  return {
    benchmarkChart,
    materialityHeatmap,
    complianceGauge
  };
}

module.exports = { buildPdfCharts };