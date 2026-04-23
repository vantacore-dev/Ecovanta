const PLAN_KEYS = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise"
};

const PLAN_ORDER = [
  PLAN_KEYS.FREE,
  PLAN_KEYS.PRO,
  PLAN_KEYS.ENTERPRISE
];

const PLAN_CONFIG = {
  [PLAN_KEYS.FREE]: {
    key: PLAN_KEYS.FREE,
    name: "Free",
    priceDisplay: "€0",
    interval: "",
    cta: "Start Free",
    stripeEnvKey: null,
    highlighted: false,
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
    priceDisplay: "€799/mo",
    interval: "monthly",
    cta: "Upgrade to Pro",
    stripeEnvKey: "STRIPE_PRICE_PRO",
    highlighted: true,
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
    priceDisplay: "€899",
    interval: "",
    cta: "Upgrade to Entgerprise€",
    stripeEnvKey: "STRIPE_PRICE_ENTERPRISE",
    highlighted: false,
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

function getPlanConfig(planKey) {
  return PLAN_CONFIG[planKey] || PLAN_CONFIG[PLAN_KEYS.FREE];
}

function getFeatureAccess(planKey) {
  return getPlanConfig(planKey).featureFlags;
}

function canAccess(planKey, featureName) {
  const featureFlags = getFeatureAccess(planKey);
  return Boolean(featureFlags[featureName]);
}

function getUpgradeablePlans(currentPlanKey) {
  if (currentPlanKey === PLAN_KEYS.FREE) {
    return [PLAN_KEYS.PRO, PLAN_KEYS.ENTERPRISE];
  }

  if (currentPlanKey === PLAN_KEYS.PRO) {
    return [PLAN_KEYS.ENTERPRISE];
  }

  return [];
}

module.exports = {
  PLAN_KEYS,
  PLAN_ORDER,
  PLAN_CONFIG,
  getPlanConfig,
  getFeatureAccess,
  canAccess,
  getUpgradeablePlans
};