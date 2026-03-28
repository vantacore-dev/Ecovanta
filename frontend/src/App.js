const generatePDF = async (r) => {
  const doc = new jsPDF();

  // ---------- COLORS ----------
  const getColor = (score = 0) => {
    if (score >= 80) return [46, 125, 50];   // green
    if (score >= 60) return [255, 152, 0];   // orange
    return [211, 47, 47];                    // red
  };

  const color = getColor(r.score);

  // ---------- LOGO ----------
  // 👉 Replace with your own logo URL
  const logoUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg";

  try {
    const img = await fetch(logoUrl)
      .then(res => res.blob())
      .then(blob => new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      }));

    doc.addImage(img, "PNG", 150, 10, 40, 15);
  } catch {
    console.log("Logo not loaded");
  }

  // ---------- TITLE ----------
  doc.setFontSize(18);
  doc.text("Ecovanta ESG Report", 20, 20);

  // ---------- COMPANY ----------
  doc.setFontSize(12);
  doc.text(`Company: ${r.company}`, 20, 40);

  // ---------- SCORE ----------
  doc.setFontSize(16);
  doc.setTextColor(...color);
  doc.text(`Score: ${Math.round(r.score || 0)}`, 20, 55);

  doc.setTextColor(0, 0, 0);
  doc.text(`Assessment: ${getRating(r.score)}`, 20, 65);

  // ---------- ESG BREAKDOWN ----------
  doc.text(`Environmental: ${r.environmental}`, 20, 80);
  doc.text(`Social: ${r.social}`, 20, 90);
  doc.text(`Governance: ${r.governance}`, 20, 100);

  // ---------- ESG GAUGE ----------
  const centerX = 150;
  const centerY = 65;
  const radius = 22;

  // background circle
  doc.setDrawColor(200);
  doc.setLineWidth(4);
  doc.circle(centerX, centerY, radius);

  // score arc
  doc.setDrawColor(...color);
  doc.setLineWidth(4);

  const angle = ((r.score || 0) / 100) * 360;

  try {
    doc.arc(centerX, centerY, radius, radius, 0, angle);
  } catch {
    // fallback (arc not always supported)
  }

  // ---------- BENCHMARK ----------
  const industryAvg = 65;

  doc.setFontSize(12);
  doc.text("Benchmark vs Industry:", 20, 120);

  const diff = Math.round((r.score || 0) - industryAvg);

  doc.text(`Your Score: ${Math.round(r.score || 0)}`, 20, 130);
  doc.text(`Industry Avg: ${industryAvg}`, 20, 140);
  doc.text(`Difference: ${diff > 0 ? "+" : ""}${diff}`, 20, 150);

  // ---------- PIE CHART (TOP RIGHT SMALL) ----------
  const el = document.getElementById(`chart-${r.id}`);

  if (el) {
    try {
      const canvas = await html2canvas(el);
      const img = canvas.toDataURL("image/png");

      doc.addImage(img, "PNG", 130, 85, 55, 55);
    } catch (err) {
      console.log("Chart capture failed");
    }
  }

  // ---------- AI INSIGHTS ----------
  const insights = r.aiInsights || "No AI insights available";
  const lines = doc.splitTextToSize(insights, 170);

  doc.setFontSize(12);
  doc.text("AI Recommendations:", 20, 180);
  doc.text(lines, 20, 190);

  // ---------- SAVE ----------
  doc.save(`${r.company}_ESG_Report.pdf`);
};