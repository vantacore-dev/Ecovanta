const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const BIN_ID = "69c58ccbc3097a1dd5636162";
const API_KEY = "$2a$10$PafMHhMfytGzoyF9pUsO4uwR5XgP5R0B5kN/4EuCsfnkhzd9WmutS";

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
    const data = json.record.reports;

    const report = {
      id: data.length + 1,
      company,
      score
    };

    data.push(report);

    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY
      },
      body: JSON.stringify({ reports: data })
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "POST failed" });
  }
});

app.listen(3001, () => console.log("Backend running"));