const textQualityScore = (value) => {
  const text = String(value || "").trim();
  if (!text) return 0;
  if (text.length < 20) return 1;
  if (text.length < 60) return 2;
  if (text.length < 140) return 3;
  if (text.length < 300) return 4;
  return 5;
};

const numericMaturityScore = (value) => {
  const num = Number(value || 0);
  if (!num || num <= 0) return 0;
  return 5;
};

const hasTargetLanguage = (text) => {
  const value = String(text || "").toLowerCase();
  return (
    value.includes("target") ||
    value.includes("goal") ||
    value.includes("by 20") ||
    value.includes("%") ||
    value.includes("reduce") ||
    value.includes("increase")
  );
};

const targetMaturityScore = (text) => {
  const value = String(text || "").trim();
  if (!value) return 0;
  if (value.length < 30) return 1;
  if (!hasTargetLanguage(value)) return 2;
  if (value.length < 120) return 3;
  if (value.length < 250) return 4;
  return 5;
};

export const calculateMaterialityScores = (topic) => {
  const impact = topic?.impactMateriality || {};
  const financial = topic?.financialMateriality || {};

  const getTimeHorizonScore = (timeHorizon) => {
    if (timeHorizon === "short") return 5;
    if (timeHorizon === "medium") return 3;
    if (timeHorizon === "long") return 2;
    return 3;
  };

  const impactRaw =
    Number(impact.severity || 0) * 0.3 +
    Number(impact.scale || 0) * 0.2 +
    Number(impact.scope || 0) * 0.2 +
    Number(impact.irremediability || 0) * 0.15 +
    Number(impact.likelihood || 0) * 0.15;

  const financialRaw =
    Number(financial.magnitude || 0) * 0.5 +
    Number(financial.likelihood || 0) * 0.3 +
    getTimeHorizonScore(financial.timeHorizon) * 0.2;

  const impactScore100 = Math.round((impactRaw / 5) * 100);
  const financialScore100 = Math.round((financialRaw / 5) * 100);
  const overallMaterialityScore = Math.max(impactScore100, financialScore100);
  const isMaterial = overallMaterialityScore >= 60;

  return {
    impactScore100,
    financialScore100,
    overallMaterialityScore,
    isMaterial
  };
};

const scoreESRS2 = (form) => {
  const governance = textQualityScore(form?.esrs2?.governance);
  const strategy = textQualityScore(form?.esrs2?.strategy);
  const iro = textQualityScore(form?.esrs2?.impactsRisksOpportunities);
  const metricsTargets = Math.max(
    textQualityScore(form?.esrs2?.metricsTargets),
    targetMaturityScore(form?.esrs2?.metricsTargets)
  );

  const raw = governance + strategy + iro + metricsTargets; // /20
  return Math.round((raw / 20) * 25);
};

const scoreE1 = (form) => {
  const scope1 = numericMaturityScore(form?.e1?.scope1Emissions);
  const scope2 = numericMaturityScore(form?.e1?.scope2Emissions);
  const scope3 = numericMaturityScore(form?.e1?.scope3Emissions);
  const climatePolicies = textQualityScore(form?.e1?.climatePolicies);
  const targetBonus = targetMaturityScore(form?.e1?.climatePolicies);

  const raw = scope1 + scope2 + scope3 + climatePolicies + targetBonus; // /25
  return Math.round((raw / 25) * 25);
};

const scoreS1 = (form) => {
  const workforcePolicies = textQualityScore(form?.s1?.workforcePolicies);
  const diversityInclusion = textQualityScore(form?.s1?.diversityInclusion);

  const raw = workforcePolicies + diversityInclusion; // /10
  return Math.round((raw / 10) * 15);
};

const scoreG1 = (form) => {
  const antiCorruption = textQualityScore(form?.g1?.antiCorruption);
  const whistleblowing = textQualityScore(form?.g1?.whistleblowing);

  const raw = antiCorruption + whistleblowing; // /10
  return Math.round((raw / 10) * 15);
};

const scoreMateriality = (form) => {
  const topics = Array.isArray(form?.materialityTopics) ? form.materialityTopics : [];
  if (!topics.length) return 0;

  const scored = topics.map((topic) => {
    const scores = calculateMaterialityScores(topic);

    const rationale = textQualityScore(topic?.rationale);
    const stakeholders = String(topic?.stakeholdersConsulted || "").trim() ? 5 : 0;
    const label = String(topic?.topicLabel || "").trim() ? 5 : 0;

    const materialityStrength =
      scores.overallMaterialityScore >= 80
        ? 5
        : scores.overallMaterialityScore >= 60
        ? 4
        : scores.overallMaterialityScore >= 40
        ? 3
        : 2;

    return rationale + stakeholders + label + materialityStrength; // /20
  });

  const avg = scored.reduce((sum, val) => sum + val, 0) / scored.length;
  return Math.round((avg / 20) * 20);
};

export const calculateBig4ESGScore = (form) => {
  const esrs2 = scoreESRS2(form);
  const e1 = scoreE1(form);
  const s1 = scoreS1(form);
  const g1 = scoreG1(form);
  const materiality = scoreMateriality(form);

  const overallScore = esrs2 + e1 + s1 + g1 + materiality;

  let riskLevel = "High Risk";
  if (overallScore >= 85) riskLevel = "Low Risk";
  else if (overallScore >= 65) riskLevel = "Moderate Risk";
  else if (overallScore >= 45) riskLevel = "Elevated Risk";

  return {
    overallScore,
    riskLevel,
    pillarScores: {
      esrs2,
      e1,
      s1,
      g1,
      materiality
    }
  };
};