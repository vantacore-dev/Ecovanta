const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

async function generateStyledPDF(html) {
  let browser;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0"
    });

    const rawPdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "40px",
        bottom: "40px",
        left: "30px",
        right: "30px"
      }
    });

    const pdfBuffer = Buffer.from(rawPdf);

    if (!pdfBuffer || pdfBuffer.length < 1000) {
      throw new Error("Generated PDF buffer is empty or too small");
    }

    const header = pdfBuffer.subarray(0, 5).toString("utf8");

    if (header !== "%PDF-") {
      console.error("Invalid PDF header:", header);
      throw new Error("Generated file is not a valid PDF");
    }

    return pdfBuffer;
  } catch (err) {
    console.error("Puppeteer PDF error:", err);
    throw err;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { generateStyledPDF };