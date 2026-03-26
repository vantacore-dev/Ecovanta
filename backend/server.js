const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const BIN_ID = "YOUR_BIN_ID";
const API_KEY = "YOUR_API_KEY";

// GET reports
app.get('/reports', async (req, res) => {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { "X-Master-Key": API_KEY }
    });

    const data = await response.json();
    res.json(data.record.reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "GET failed" });
  }
});

// POST report
app.post('/reports', async (req, res) => {
  try {
    const { company, score } = req.body;

    const getRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { "X-Master-Key": API_KEY }
    });

    const json = await getRes.json();
    const reports = json.record.reports;

    const report = {
      id: reports.length + 1,
      company,
      score
    };

    reports.push(report);

    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY
      },
      body: JSON.stringify({ reports })
    });

    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "POST failed" });
  }
});

app.listen(3001, () => {
  console.log("Backend running");
});