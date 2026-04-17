const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
  user = null,
  action,
  entityType = "ESRSReport",
  entityId = null,
  companyName = "",
  details = {}
}) => {
  try {
    await AuditLog.create({
      userId: user?.userId || null,
      userEmail: user?.email || "",
      action,
      entityType,
      entityId,
      companyName,
      details
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
};

module.exports = { createAuditLog };