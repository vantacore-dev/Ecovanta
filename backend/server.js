const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage (temporary)
let reports = [];

// GET all reports
app.get('/reports', (req, res) => {
    res.json(reports);
});

// POST a new report
app.post('/reports', (req, res) => {
    const { company, score } = req.body;

    const report = {
        id: reports.length + 1,
        company,
        score
    };

    reports.push(report);
    
    res.json(reports);

// Start server
app.listen(3001, () => {
    console.log("Backend running on port 3001");
});