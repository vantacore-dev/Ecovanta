const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    companyName: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      enum: ["preparer", "reviewer", "admin"],
      default: "preparer"
    },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free"
    },
    reportsUsed: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);