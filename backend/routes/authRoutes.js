const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { email, password, companyName } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "User exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hash,
      companyName
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "No user" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Wrong password" });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;