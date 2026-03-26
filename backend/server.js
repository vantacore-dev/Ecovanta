const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./ecovanta.db');

db.run(`CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT,
    score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

app.get('/reports', (req, res) => {
    db.all("SELECT * FROM reports", [], (err, rows) => {
        res.json(rows);
    });
});

app.post('/reports', (req, res) => {
    const { company, score } = req.body;
    db.run("INSERT INTO reports (company, score) VALUES (?, ?)",
        [company, score],
        function(err) {
            res.json({ id: this.lastID });
        });
});

app.listen(3001, () => console.log("Backend running on port 3001"));