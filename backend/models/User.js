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
  enum: ["preparer", "reviewer", "approver", "admin"],
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
    },
    stripeCustomerId: {
      type: String,
      default: ""
    },
    stripeSubscriptionId: {
      type: String,
      default: ""
    },
    subscriptionStatus: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);