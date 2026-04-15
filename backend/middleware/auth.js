const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret";

const auth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    const token = header.startsWith("Bearer ")
      ? header.split(" ")[1]
      : header;

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = auth;