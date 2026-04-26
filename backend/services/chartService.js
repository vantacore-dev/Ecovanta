const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width: 900,
  height: 500,
  backgroundColour: "white"
});

const toDataUri = (buffer) =>
  `data:image/png;base64,${Buffer.from(buffer).toString("base64")}`;

const getSectorBenchmarks = (sector) => {
  const normalizedSector = String(sector || "").toLowerCase();

  const benchmarks = {
    tech: { sectorAverage: 65, topQuartile: 82 },
    technology: { sectorAverage: 65, topQuartile: 82 },
    energy: { sectorAverage: 58, topQuartile: 78 },
    manufacturing: { sectorAverage: 61, topQuartile: 79 }
  };

  return benchmarks[normalizedSector] || {
    sectorAverage: 60,
    topQuartile: 75
  };
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

  const overallScore = Number(report.scorecard?.overallScore || 0);
  const sectorAverage = Number(
    report.scorecard?.sectorAverage || sectorBench.sectorAverage
  );
  const topQuartile = Number(
    report.scorecard?.topQuartile || sectorBench.topQuartile
  );

  const buffer = await chartJSNodeCanvas.renderToBuffer({
    type: "bar",
    data: {
      labels: ["Company Score", "Sector Average", "Top Quartile"],
      datasets: [
        {
          label: "Score",
          data: [overallScore, sectorAverage, topQuartile],
          backgroundColor: ["#5B8DB8", "#C7A86D", "#6FA287"],
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 80,
          categoryPercentage: 0.8,
          barPercentage: 0.9
        }
      ]
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: "Benchmark Comparison",
          color: "#1F2937",
          font: {
            size: 22,
            weight: "bold"
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        tooltip: {
          enabled: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20,
            color: "#6B7280",
            font: {
              size: 11
            }
          },
          grid: {
            color: "#E5E7EB"
          },
          border: {
            display: false
          },
          title: {
            display: true,
            text: "Score",
            color: "#6B7280",
            font: {
              size: 12,
              weight: "bold"
            }
          }
        },
        x: {
          ticks: {
            color: "#4B5563",
            font: {
              size: 12
            }
          },
          grid: {
            display: false
          },
          border: {
            display: false
          }
        }
      }
    },
    plugins: [
      {
        id: "valueLabels",
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          const meta = chart.getDatasetMeta(0);

          ctx.save();
          ctx.fillStyle = "#111827";
          ctx.font = "bold 13px Arial";
          ctx.textAlign = "center";

          meta.data.forEach((bar, index) => {
            const value = chart.data.datasets[0].data[index];
            ctx.fillText(`${value}/100`, bar.x, bar.y - 8);
          });

          ctx.restore();
        }
      }
    ]
  });

  return toDataUri(buffer);
}

async function buildMaterialityHeatmapChart(report) {
  const points = Array.isArray(report.materialityTopics)
    ? report.materialityTopics.map((topic) => ({
        x: Number(topic.financialScore100 || 0),
        y: Number(topic.impactScore100 || 0),
        label: topic.topicCode || topic.topicLabel || "Topic",
        topicLabel: topic.topicLabel || "",
        overall: Number(topic.overallMaterialityScore || 0),
        isMaterial: Boolean(topic.isMaterial)
      }))
    : [];

  const buffer = await chartJSNodeCanvas.renderToBuffer({
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Materiality Topics",
          data: points,
          backgroundColor: points.map((point) =>
            point.isMaterial ? "#7A6AAE" : "#B8B4C7"
          ),
          borderColor: points.map((point) =>
            point.isMaterial ? "#5C4E8C" : "#9CA3AF"
          ),
          borderWidth: 1.5,
          pointRadius: 7,
          pointHoverRadius: 8
        }
      ]
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: "Materiality Heatmap",
          color: "#1F2937",
          font: {
            size: 22,
            weight: "bold"
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        tooltip: {
          enabled: false
        }
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            color: "#6B7280",
            font: {
              size: 11
            }
          },
          grid: {
            color: "#E5E7EB"
          },
          border: {
            display: false
          },
          title: {
            display: true,
            text: "Financial Materiality",
            color: "#6B7280",
            font: {
              size: 12,
              weight: "bold"
            }
          }
        },
        y: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            color: "#6B7280",
            font: {
              size: 11
            }
          },
          grid: {
            color: "#E5E7EB"
          },
          border: {
            display: false
          },
          title: {
            display: true,
            text: "Impact Materiality",
            color: "#6B7280",
            font: {
              size: 12,
              weight: "bold"
            }
          }
        }
      }
    },
    plugins: [
      {
        id: "quadrantLabels",
        afterDraw(chart) {
          const { ctx, chartArea } = chart;
          if (!chartArea) return;

          const { left, right, top, bottom } = chartArea;
          const midX = (left + right) / 2;
          const midY = (top + bottom) / 2;

          ctx.save();

          ctx.fillStyle = "rgba(111, 162, 135, 0.06)";
          ctx.fillRect(midX, top, right - midX, midY - top);

          ctx.fillStyle = "rgba(201, 106, 90, 0.06)";
          ctx.fillRect(left, midY, midX - left, bottom - midY);

          ctx.fillStyle = "#6B7280";
          ctx.font = "12px Arial";
          ctx.textAlign = "center";

          ctx.fillText("High Financial / High Impact", right - 115, top + 18);
          ctx.fillText("Lower Priority", left + 80, bottom - 10);

          ctx.strokeStyle = "rgba(107, 114, 128, 0.25)";
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.moveTo(midX, top);
          ctx.lineTo(midX, bottom);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(left, midY);
          ctx.lineTo(right, midY);
          ctx.stroke();

          ctx.restore();
        }
      },
      {
        id: "pointLabels",
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          const meta = chart.getDatasetMeta(0);

          ctx.save();
          ctx.font = "bold 11px Arial";
          ctx.fillStyle = "#374151";
          ctx.textAlign = "left";

          meta.data.forEach((point, index) => {
            const raw = chart.data.datasets[0].data[index];

            if (!raw?.label) return;

            ctx.fillText(raw.label, point.x + 8, point.y - 8);
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
          borderWidth: 0,
          hoverOffset: 0
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
        legend: {
          display: false
        },
        title: {
          display: true,
          text: "Compliance Gap Dashboard",
          color: "#1F2937",
          font: {
            size: 22,
            weight: "bold"
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        tooltip: {
          enabled: false
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
          ctx.lineWidth = 4;
          ctx.strokeStyle = "rgba(0,0,0,0.12)";
          ctx.moveTo(centerX + 1, centerY + 1);
          ctx.lineTo(needleX + 1, needleY + 1);
          ctx.stroke();

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

          const labelRadius = outerRadius + 18;

          const labels = [
            {
              text: "Low",
              angle: -Math.PI + Math.PI * 0.2,
              color: "#A54E43"
            },
            {
              text: "Moderate",
              angle: -Math.PI + Math.PI * 0.55,
              color: "#9A7A38"
            },
            {
              text: "Strong",
              angle: -Math.PI + Math.PI * 0.85,
              color: "#4E7D66"
            }
          ];

          ctx.font = "13px Arial";

          labels.forEach((label) => {
            const lx = centerX + Math.cos(label.angle) * labelRadius;
            const ly = centerY + Math.sin(label.angle) * labelRadius + 18;

            ctx.fillStyle = label.color;
            ctx.textAlign = "center";
            ctx.fillText(label.text, lx, ly);
          });

          ctx.restore();
        }
      }
    ]
  });

  return toDataUri(buffer);
}

async function buildPdfCharts(report) {
  const safeReport = {
    ...report,
    scorecard: {
      ...(report.scorecard || {}),
      overallScore: Number(report.scorecard?.overallScore || 0),
      benchmark: Number(report.scorecard?.benchmark || 0),
      sectorAverage: Number(report.scorecard?.sectorAverage || 0),
      topQuartile: Number(report.scorecard?.topQuartile || 0)
    },
    materialityTopics: Array.isArray(report.materialityTopics)
      ? report.materialityTopics
      : []
  };

  const [benchmarkChart, materialityHeatmap, complianceGauge] =
    await Promise.all([
      buildBenchmarkChart(safeReport),
      buildMaterialityHeatmapChart(safeReport),
      buildComplianceGaugeChart(safeReport)
    ]);

  return {
    benchmarkChart,
    materialityHeatmap,
    complianceGauge
  };
}

module.exports = {
  buildPdfCharts,
  buildBenchmarkChart,
  buildMaterialityHeatmapChart,
  buildComplianceGaugeChart
};