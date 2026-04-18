const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// ===============================
// REGISTER
// ===============================
router.post("/register", async (req, res) => {
  try {
    const { email, password, companyName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        error: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      companyName: companyName || "",
      plan: "free",
      role: "preparer" // default role
    });

    res.json({
      message: "User registered successfully"
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// LOGIN
// ===============================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        error: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        error: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role // ✅ IMPORTANT
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// GET CURRENT USER
// ===============================
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    res.json({
      id: user._id,
      email: user.email,
      companyName: user.companyName,
      plan: user.plan,
      role: user.role // ✅ IMPORTANT
    });
  } catch (err) {
    console.error("Load user error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;