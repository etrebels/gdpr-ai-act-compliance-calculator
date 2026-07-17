import {
  ComplianceInputs,
  ComplianceResults,
  IndustryVertical,
} from "./types";
import {
  getImplementationCost,
  SOLUTION_ANNUAL_COST,
  ONGOING_COST_RATE,
} from "./pricing";

// ─── GDPR Compliance Cost Assumptions ────────────────────────
// All numbers are grounded in published research. Sources:
//  - DLA Piper GDPR Fines Survey (Jan 2026): €1.2B in fines, 443 breach notifications/day
//  - IBM Cost of a Data Breach 2025: $4.44M global average
//  - AvePoint / Sapio Research: $1,524 average DSAR cost
//  - IAPP Privacy Governance Report 2024: staffing benchmarks
//  - Gartner: $12.9M avg cost of poor data quality

// ── DSAR Processing ──
// Average cost per DSAR request. Includes staff time to locate
// data across systems, review, redact third-party info, and respond.
// AvePoint/Sapio: $1,524 avg; GRC World Forums: £1,200 (~$1,500).
const DSAR_COST_PER_REQUEST = 1500;

// More systems holding personal data increases DSAR search time,
// but with diminishing returns (the 15th system adds less friction
// than the 3rd). We use square-root scaling instead of linear.
// At 8 systems: sqrt(8/3) ≈ 1.63x (was 2.4x with old linear model).
// At 20 systems: sqrt(20/3) ≈ 2.58x (was 4.8x).
const DSAR_SYSTEM_COMPLEXITY_BASELINE = 3; // systems below this = no extra complexity

// ── Data Mapping & Inventory ──
// GDPR Article 30 requires a Record of Processing Activities (ROPA).
// Maintaining a live data map across all systems costs real money.
// Enterprise cost per system: $15K/year for discovery, classification,
// lineage tracking, and ongoing maintenance.
// Smaller orgs use lighter-weight tooling (spreadsheets, manual audits)
// so costs scale from ~$5K/system at <100 employees to $15K at 1000+.
const DATA_MAPPING_COST_PER_SYSTEM = 15000;
const DATA_MAPPING_MIN_SCALE = 0.33;    // floor: ~$5K/system for tiny orgs
const DATA_MAPPING_SCALE_CEILING = 1000; // at 1000+ employees, full $15K/system

// ── Compliance Staff ──
// GDPR requires a Data Protection Officer (DPO) for organizations
// processing personal data at scale. DPO cost scales with org size:
//  - Small orgs (<100 employees): outsourced/fractional DPO (~$40K/year)
//  - Mid orgs (100-500): transitioning to in-house, ramps $40K→$180K
//  - Large orgs (500+): full-time in-house DPO at $180K fully loaded
// Source: IAPP Privacy Governance Report 2024, DPO salary benchmarks
const DPO_COST_MIN = 40000;   // outsourced / fractional DPO
const DPO_COST_MAX = 180000;  // full-time in-house DPO
const DPO_SCALE_FLOOR = 100;  // below this, outsourced DPO
const DPO_SCALE_CEILING = 500; // above this, full-time DPO
// Additional compliance analysts needed as org scales.
// IAPP benchmark: ~1 privacy FTE per 500 employees in regulated industries.
const COMPLIANCE_ANALYST_COST = 125000;
const EMPLOYEES_PER_COMPLIANCE_FTE = 500;

// ── Breach Risk Exposure ──
// IBM 2025: $4.44M global average breach cost.
// We model expected annual loss = probability × impact.
// Base probability: ~2.5% chance of a reportable breach per year
// (DLA Piper: 443 notifications/day across EU, ~162K/year).
const BASE_BREACH_PROBABILITY = 0.025;
const BASE_BREACH_COST = 4440000;

// GDPR fines: up to 4% of global annual revenue or €20M, whichever is higher.
// We model a conservative 2% regulatory fine probability on top of breach cost.
const REGULATORY_FINE_PROBABILITY = 0.02;

// ── Audit & Assessment ──
// Annual GDPR audits, gap assessments, and privacy impact assessments.
// Small orgs: ~$20K; Large enterprises: $50K-$250K.
const BASE_AUDIT_COST = 25000;

// ── EU AI Act Compliance Costs ──
// The EU AI Act (Regulation 2024/1689) entered into force August 2024.
// Key obligations phase in through 2025-2027. Sources:
//  - European Commission AI Act Impact Assessment (2024)
//  - Stanford HAI: AI Act compliance costs for high-risk systems
//  - OECD AI Policy Observatory: governance framework benchmarks
//
// Conformity assessment per AI system (Article 43): includes risk
// classification, technical documentation, testing, and certification.
// Stanford HAI estimates €200K-500K per high-risk system; we use a
// conservative mid-range estimate.
const AI_CONFORMITY_ASSESSMENT_PER_SYSTEM = 300000;
// Amortized over 3 years since assessments aren't annual
const AI_CONFORMITY_AMORTIZATION_YEARS = 3;

// Ongoing post-market monitoring per AI system (Article 72):
// logging, drift detection, incident reporting, performance tracking.
const AI_MONITORING_COST_PER_SYSTEM = 45000;

// AI governance framework: risk management system (Article 9),
// quality management (Article 17), record-keeping (Article 12).
// Base cost for establishing and maintaining AI governance.
const AI_GOVERNANCE_BASE_COST = 125000;

// ── Industry Multipliers ──
// Industries with more personal data or stricter regulation bear
// higher compliance costs. These multiply ALL cost categories.
const COMPLIANCE_MULTIPLIERS: Record<IndustryVertical, number> = {
  finance: 1.5,     // KYC/AML + PSD2 + DORA on top of GDPR
  healthcare: 1.45, // Patient data, clinical trials, cross-border transfers
  pharma: 1.4,      // Clinical trial data, pharmacovigilance
  retail: 1.2,      // High volume of consumer data, loyalty programs
  technology: 1.15, // SaaS platforms, user data at scale
  government: 1.1,  // Public sector GDPR obligations, FOI overlap
  energy: 1.05,     // Smart meter data, limited consumer PII
  manufacturing: 1.0,
  other: 1.1,
};

// ── KG Reduction Factors (maximum potential) ──
// These are the ceiling, a fully-deployed KG covering your entire
// data landscape achieves these reductions. Partial coverage scales
// them down via the "coverage factor" computed from the user's inputs.
const KG_MAX_DSAR_REDUCTION = 0.75;       // 75% ceiling, automated data discovery
const KG_MAX_DATA_MAPPING_REDUCTION = 0.80; // 80% ceiling, continuous ROPA
const KG_MAX_STAFF_REDUCTION = 0.40;      // 40% ceiling, still need humans
const KG_MAX_BREACH_RISK_REDUCTION = 0.50; // 50% ceiling, better visibility
const KG_MAX_AUDIT_REDUCTION = 0.60;      // 60% ceiling, audit-ready reports
const KG_MAX_AI_ACT_REDUCTION = 0.55;     // 55% ceiling, automated lineage & documentation

// ─── Main Calculation ────────────────────────────────────────

export function calculateComplianceResults(
  inputs: ComplianceInputs
): ComplianceResults {
  const multiplier = COMPLIANCE_MULTIPLIERS[inputs.industryVertical];

  // ── Current compliance costs (without a knowledge graph) ──

  // DSAR Processing: cost per request × volume × system complexity
  // More systems = more places to search per DSAR request, but with
  // diminishing returns (square root scaling). Capped at 3x.
  const systemComplexity = Math.min(
    3,
    Math.sqrt(Math.max(inputs.personalDataSystems, DSAR_SYSTEM_COMPLEXITY_BASELINE) / DSAR_SYSTEM_COMPLEXITY_BASELINE)
  );

  // Volume efficiency: organizations processing many DSARs invest in
  // automation tools (OneTrust, DataGrail, etc.) that reduce per-request
  // cost. Up to 20/month: full price. Beyond that: square-root scaling
  // brings the effective per-DSAR cost down (never below 35% of base).
  // At 100/month: ~$670/DSAR.  At 500/month: ~$530/DSAR.
  const DSAR_VOLUME_THRESHOLD = 20;
  const DSAR_VOLUME_FLOOR = 0.35; // automation can't eliminate all manual review
  const effectiveDsarCost = inputs.dsarsPerMonth <= DSAR_VOLUME_THRESHOLD
    ? DSAR_COST_PER_REQUEST
    : DSAR_COST_PER_REQUEST * Math.max(
        DSAR_VOLUME_FLOOR,
        Math.sqrt(DSAR_VOLUME_THRESHOLD / inputs.dsarsPerMonth)
      );

  const dsarProcessing = Math.round(
    inputs.dsarsPerMonth *
      12 *
      effectiveDsarCost *
      systemComplexity *
      multiplier
  );

  // Data Mapping: cost per system holding personal data.
  // GDPR Article 30 requires knowing what data you have, where,
  // and why, across every system. Smaller orgs use lighter tooling.
  const dataMappingScale = Math.min(
    1,
    DATA_MAPPING_MIN_SCALE + (1 - DATA_MAPPING_MIN_SCALE) *
      Math.min(1, inputs.companySize / DATA_MAPPING_SCALE_CEILING)
  );
  const dataMapping = Math.round(
    inputs.personalDataSystems * DATA_MAPPING_COST_PER_SYSTEM * dataMappingScale * multiplier
  );

  // Compliance Staff: DPO (scales with org size) + analysts for large orgs.
  // Small orgs use outsourced/fractional DPOs; cost ramps to full-time at 500+.
  const dpoCostScalar = Math.min(
    1,
    Math.max(0, (inputs.companySize - DPO_SCALE_FLOOR) / (DPO_SCALE_CEILING - DPO_SCALE_FLOOR))
  );
  const dpoCost = DPO_COST_MIN + dpoCostScalar * (DPO_COST_MAX - DPO_COST_MIN);
  // Analyst count uses diminishing returns, larger orgs get economies
  // of scale from automation and mature processes. Linear up to 5
  // analysts (2,500 employees), then square-root growth beyond that.
  // At 50K employees: ~11 analysts (was 99 with pure linear).
  const linearAnalysts = Math.max(
    0,
    Math.floor(inputs.companySize / EMPLOYEES_PER_COMPLIANCE_FTE) - 1
  );
  const ANALYST_LINEAR_CAP = 5;
  const additionalAnalysts = linearAnalysts <= ANALYST_LINEAR_CAP
    ? linearAnalysts
    : ANALYST_LINEAR_CAP + Math.round(
        Math.sqrt(linearAnalysts - ANALYST_LINEAR_CAP) * 2
      );
  const complianceStaff = Math.round(
    (dpoCost + additionalAnalysts * COMPLIANCE_ANALYST_COST) * multiplier
  );

  // Breach Risk Exposure: expected annual loss.
  // More data subjects = bigger breach impact.
  // More systems = larger attack surface = higher probability.
  const dataSubjectFactor = Math.log10(
    Math.max(inputs.euDataSubjects, 100)
  ) / Math.log10(1000000); // 1.0 at 1M subjects
  const systemRiskFactor = Math.sqrt(inputs.personalDataSystems / 5);

  const breachProbability = Math.min(
    BASE_BREACH_PROBABILITY * systemRiskFactor,
    0.15 // cap at 15% annual probability
  );
  const breachImpact = BASE_BREACH_COST * dataSubjectFactor;

  // GDPR fine exposure: 2% of annual revenue (conservative, max is 4%)
  const fineExposure =
    inputs.annualRevenue * 0.02 * REGULATORY_FINE_PROBABILITY;

  const breachRiskExposure = Math.round(
    (breachProbability * breachImpact + fineExposure) * multiplier
  );

  // Audit & Assessment: scales logarithmically with org size.
  // Use actual company size (min 10 to keep log math valid).
  const auditScale = Math.log10(Math.max(inputs.companySize, 10)) / Math.log10(10000);
  const auditAndAssessment = Math.round(
    BASE_AUDIT_COST * (1 + auditScale) * multiplier
  );

  // EU AI Act Compliance: conformity assessments + ongoing monitoring +
  // governance framework. Only applies if the org has AI systems.
  // The AI Act fine exposure is up to €35M or 7% of global revenue.
  const aiSystemCount = inputs.aiSystemsDeployed;
  const aiActCompliance = aiSystemCount > 0
    ? Math.round(
        (
          // Amortized conformity assessment cost
          (aiSystemCount * AI_CONFORMITY_ASSESSMENT_PER_SYSTEM / AI_CONFORMITY_AMORTIZATION_YEARS) +
          // Ongoing monitoring per system
          (aiSystemCount * AI_MONITORING_COST_PER_SYSTEM) +
          // AI governance framework (one-time base + per-system scaling)
          AI_GOVERNANCE_BASE_COST * (1 + Math.log2(Math.max(aiSystemCount, 1)) * 0.3)
        ) * multiplier
      )
    : 0;

  const totalAnnualCost =
    dsarProcessing + dataMapping + complianceStaff +
    breachRiskExposure + auditAndAssessment + aiActCompliance;

  // ── Knowledge Graph costs (illustrative solution pricing) ──
  // No initial implementation slider, just ongoing pages and the
  // annual solution subscription.
  const ongoingAnnualCost = Math.floor(
    getImplementationCost(inputs.ongoingPagesPerYear) * ONGOING_COST_RATE
  );
  const totalKGAnnualCost = SOLUTION_ANNUAL_COST + ongoingAnnualCost;

  // ── ROI projection ──

  // Coverage factor: how much of the data landscape the KG actually covers.
  // Driven by two inputs:
  //  1. Pages processed, more docs = more of your compliance corpus is mapped
  //  2. System fragmentation, more scattered systems = more value from unification
  //
  // At low page volumes (1K pages, 2 systems), coverage is ~53%.
  // At high volumes (100K+ pages, 20+ systems), coverage approaches 100%.
  // This makes the sliders visibly drive the risk reduction number.
  const pageCoverage = Math.min(
    1,
    Math.log10(Math.max(inputs.ongoingPagesPerYear, 100)) / Math.log10(500000)
  ); // 0→1 as pages go from 100 to 500K
  const systemUnificationBonus = Math.min(
    0.3,
    (inputs.personalDataSystems - 2) * 0.02
  ); // 0→0.3 as systems go from 2 to 17+
  const coverageFactor = Math.min(1, pageCoverage + systemUnificationBonus);

  // Actual reductions = max potential × coverage factor
  const dsarSavings = dsarProcessing * KG_MAX_DSAR_REDUCTION * coverageFactor;
  const mappingSavings = dataMapping * KG_MAX_DATA_MAPPING_REDUCTION * coverageFactor;
  const staffSavings = complianceStaff * KG_MAX_STAFF_REDUCTION * coverageFactor;
  const breachSavings = breachRiskExposure * KG_MAX_BREACH_RISK_REDUCTION * coverageFactor;
  const auditSavings = auditAndAssessment * KG_MAX_AUDIT_REDUCTION * coverageFactor;
  const aiActSavings = aiActCompliance * KG_MAX_AI_ACT_REDUCTION * coverageFactor;

  const grossSavings =
    dsarSavings + mappingSavings + staffSavings +
    breachSavings + auditSavings + aiActSavings;

  const projectedSavings = Math.max(0, grossSavings - totalKGAnnualCost);

  // Simple payback: months for GROSS savings to cover the annual KG cost.
  // (Dividing by net-of-cost savings double-counts the cost - once in the
  // numerator, again in the denominator - and overstated payback up to ~12x
  // near break-even.) Null when gross savings don't exceed the recurring
  // cost: against an annual recurring cost, anything past 12 months means
  // "never", so no cap beyond the gross > cost gate is needed.
  const paybackPeriodMonths =
    grossSavings > totalKGAnnualCost
      ? Math.max(1, Math.ceil((totalKGAnnualCost / grossSavings) * 12))
      : null;

  const riskReductionPercent =
    totalAnnualCost > 0
      ? Math.round((grossSavings / totalAnnualCost) * 100)
      : 0;

  // First-year ROI: net savings per dollar of KG cost. projectedSavings is
  // already net of totalKGAnnualCost, so no further subtraction - the old
  // formula subtracted the cost twice.
  const firstYearROIPercent =
    totalKGAnnualCost > 0
      ? Math.round((projectedSavings / totalKGAnnualCost) * 100)
      : 0;

  return {
    currentCosts: {
      dsarProcessing,
      dataMapping,
      complianceStaff,
      breachRiskExposure,
      auditAndAssessment,
      aiActCompliance,
      totalAnnualCost,
    },
    knowledgeGraphCosts: {
      solutionAnnual: SOLUTION_ANNUAL_COST,
      ongoingAnnualCost,
      totalAnnualCost: totalKGAnnualCost,
    },
    knowledgeGraphROI: {
      projectedSavings: Math.round(projectedSavings),
      paybackPeriodMonths,
      riskReductionPercent: Math.min(85, riskReductionPercent),
      firstYearROIPercent,
    },
  };
}
