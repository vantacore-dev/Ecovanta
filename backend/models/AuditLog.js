const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    userEmail: {
      type: String,
      default: ""
    },
    action: {
      type: String,
      required: true
    },
    entityType: {
      type: String,
      default: "ESRSReport"
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    companyName: {
      type: String,
      default: ""
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);