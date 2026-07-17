export const INDUSTRY_OPTIONS = [
  { value: "pharma", label: "Pharmaceuticals & Life Sciences" },
  { value: "finance", label: "Financial Services & Banking" },
  { value: "manufacturing", label: "Manufacturing & Supply Chain" },
  { value: "technology", label: "Technology & Software" },
  { value: "healthcare", label: "Healthcare" },
  { value: "energy", label: "Energy & Utilities" },
  { value: "retail", label: "Retail & E-Commerce" },
  { value: "government", label: "Government & Public Sector" },
  { value: "other", label: "Other" },
] as const;

export type IndustryVertical = (typeof INDUSTRY_OPTIONS)[number]["value"];

export interface ComplianceInputs {
  companySize: number;
  euDataSubjects: number;
  personalDataSystems: number;
  dsarsPerMonth: number;
  annualRevenue: number;
  ongoingPagesPerYear: number;
  industryVertical: IndustryVertical;
  /** Number of AI systems deployed (EU AI Act compliance). 0 = no AI Act costs. */
  aiSystemsDeployed: number;
}

export interface ComplianceCostBreakdown {
  dsarProcessing: number;
  dataMapping: number;
  complianceStaff: number;
  breachRiskExposure: number;
  auditAndAssessment: number;
  /** EU AI Act compliance costs (conformity assessments, documentation, monitoring). */
  aiActCompliance: number;
  totalAnnualCost: number;
}

export interface ComplianceKGCosts {
  solutionAnnual: number;
  ongoingAnnualCost: number;
  totalAnnualCost: number;
}

export interface ComplianceROI {
  projectedSavings: number;
  /** null means the investment never pays back (costs exceed savings). */
  paybackPeriodMonths: number | null;
  riskReductionPercent: number;
  firstYearROIPercent: number;
}

export interface ComplianceResults {
  currentCosts: ComplianceCostBreakdown;
  knowledgeGraphCosts: ComplianceKGCosts;
  knowledgeGraphROI: ComplianceROI;
}

// Advanced fields match the simple-mode estimator's output for a 500-person
// org (estimateAdvanced in ComplianceCalculatorForm), so nudging a simple
// slider and moving it back reproduces the same result the page loaded with.
export const DEFAULT_COMPLIANCE_INPUTS: ComplianceInputs = {
  companySize: 500,
  euDataSubjects: 50000,
  personalDataSystems: 8,
  dsarsPerMonth: 1,
  annualRevenue: 50000000,
  ongoingPagesPerYear: 2500,
  industryVertical: "technology",
  aiSystemsDeployed: 1,
};
