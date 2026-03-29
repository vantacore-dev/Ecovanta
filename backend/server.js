const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ TEST ROUTE
app.get("/test", (req, res) => {
  res.send("TEST OK");
});

// ✅ BENCHMARK ROUTE
app.get("/benchmark/:sector", (req, res) => {
  const benchmarks = {
    Tech: 75,
    Energy: 55,
    Manufacturing: 65
  };

  const sector = req.params.sector;

  res.json({
    benchmark: benchmarks[sector] || 60
  });
});

// START SERVER
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});