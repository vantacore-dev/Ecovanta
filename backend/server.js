const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/test", (req, res) => {
  res.send("TEST OK");
});

app.get("/benchmark/:sector", (req, res) => {
  const benchmarks = {
    Technology: 75,
    Energy: 55,
    Manufacturing: 65
  };

  res.json({
    benchmark: benchmarks[req.params.sector] || 60
  });
});

app.get("/benchmark/:sector", (req, res) => {
  res.json({ benchmark: 75 });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});