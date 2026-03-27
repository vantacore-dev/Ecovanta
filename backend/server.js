const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const BIN_ID = "69c5c73cc3097a1dd5642542";
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
  const { company, score, environmental, social, governance } = req.body;

  const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Master-Key': API_KEY }
  });

  const data = await response.json();
  const reports = data.record.reports || [];

  const newReport = {
    id: Date.now(),
    company,
    score,
    environmental,
    social,
    governance
  };

  reports.push(newReport);

  await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY
    },
    body: JSON.stringify({ reports })
  });

  res.json(reports);
});

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "POST failed" });
  }
});

app.listen(3001, () => {
  console.log("Backend running");
});