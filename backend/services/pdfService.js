const puppeteer = require("puppeteer");

async function generateStyledPDF(html) {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.setContent(html, {
    waitUntil: "networkidle0"
  });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "40px",
      bottom: "40px",
      left: "30px",
      right: "30px"
    }
  });

  await browser.close();

  return pdf;
}

module.exports = { generateStyledPDF };