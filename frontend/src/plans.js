export const PLAN_KEYS = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise"
};

export const PLAN_CONFIG = {
  [PLAN_KEYS.FREE]: {
    key: PLAN_KEYS.FREE,
    name: "Free",
    priceDisplay: "€0",
    cta: "Start Free",
    description:
      "Get started with structured ESG reporting and core workflow tools.",
    marketingFeatures: [
      "Manual ESG data input",
      "Basic report creation",
      "Basic portfolio analytics",
      "Save and load reports"
    ],
    featureFlags: {
      aiDraft: false,
      pdfExport: false,
      advancedAnalytics: false,
      benchmarkChart: false,
      materialityHeatmap: false,
      complianceGapDashboard: false,
      workflow: false,
      auditTrail: false,
      teamFeatures: false,
      apiAccess: false,
      prioritySupport: false
    }
  },

  [PLAN_KEYS.PRO]: {
    key: PLAN_KEYS.PRO,
    name: "Pro",
    priceDisplay: "€49/mo",
    cta: "Upgrade to Pro",
    description:
      "For teams automating ESG workflows, reporting, and AI-driven analysis.",
    marketingFeatures: [
      "AI-powered draft generation",
      "Structured AI recommendations",
      "PDF export",
      "Benchmark comparison",
      "Materiality heatmap",
      "Compliance gap dashboard",
      "Advanced analytics"
    ],
    featureFlags: {
      aiDraft: true,
      pdfExport: true,
      advancedAnalytics: true,
      benchmarkChart: true,
      materialityHeatmap: true,
      complianceGapDashboard: true,
      workflow: false,
      auditTrail: false,
      teamFeatures: false,
      apiAccess: false,
      prioritySupport: false
    }
  },

  [PLAN_KEYS.ENTERPRISE]: {
    key: PLAN_KEYS.ENTERPRISE,
    name: "Enterprise",
    priceDisplay: "Custom",
    cta: "Contact Sales",
    description:
      "For organizations requiring governance controls, review workflows, and audit-grade traceability.",
    marketingFeatures: [
      "Everything in Pro",
      "Review and approval workflows",
      "Audit logs and traceability",
      "Role-based governance controls"
    ],
    featureFlags: {
      aiDraft: true,
      pdfExport: true,
      advancedAnalytics: true,
      benchmarkChart: true,
      materialityHeatmap: true,
      complianceGapDashboard: true,
      workflow: true,
      auditTrail: true,
      teamFeatures: false,
      apiAccess: false,
      prioritySupport: false
    }
  }
};

export const getPlanConfig = (planKey) =>
  PLAN_CONFIG[planKey] || PLAN_CONFIG[PLAN_KEYS.FREE];

export const getFeatureAccess = (planKey) =>
  getPlanConfig(planKey).featureFlags;

export const canAccess = (planKey, featureName) =>
  Boolean(getFeatureAccess(planKey)[featureName]);