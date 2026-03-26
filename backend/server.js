const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage (temporary)
let reports = [];

// GET all reports
app.get('/reports', (req, res) => {
    res.json(data.record.reports);
});

// POST a new report
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
  body: JSON.stringify({ reports: data }) // 👈 IMPORTANT
});

res.json(data);