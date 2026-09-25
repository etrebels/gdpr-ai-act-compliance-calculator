import { describe, it, expect } from "vitest";
import { calculateComplianceResults } from "./calculator";
import { DEFAULT_COMPLIANCE_INPUTS } from "./types";
import type { ComplianceInputs } from "./types";

describe("calculateComplianceResults", () => {
  it("returns all expected result sections with default inputs", () => {
    const results = calculateComplianceResults(DEFAULT_COMPLIANCE_INPUTS);

    expect(results.currentCosts).toBeDefined();
    expect(results.knowledgeGraphCosts).toBeDefined();
    expect(results.knowledgeGraphROI).toBeDefined();
  });

  it("calculates positive costs for default inputs", () => {
    const { currentCosts } = calculateComplianceResults(DEFAULT_COMPLIANCE_INPUTS);

    expect(currentCosts.dsarProcessing).toBeGreaterThan(0);
    expect(currentCosts.dataMapping).toBeGreaterThan(0);
    expect(currentCosts.complianceStaff).toBeGreaterThan(0);
    expect(currentCosts.breachRiskExposure).toBeGreaterThan(0);
    expect(currentCosts.auditAndAssessment).toBeGreaterThan(0);
    expect(currentCosts.aiActCompliance).toBeGreaterThan(0);
  });

  it("totalAnnualCost is sum of all cost categories", () => {
    const { currentCosts } = calculateComplianceResults(DEFAULT_COMPLIANCE_INPUTS);

    expect(currentCosts.totalAnnualCost).toBe(
      currentCosts.dsarProcessing +
        currentCosts.dataMapping +
        currentCosts.complianceStaff +
        currentCosts.breachRiskExposure +
        currentCosts.auditAndAssessment +
        currentCosts.aiActCompliance,
    );
  });

  it("includes the solution annual cost in KG costs", () => {
    const results = calculateComplianceResults(DEFAULT_COMPLIANCE_INPUTS);
    expect(results.knowledgeGraphCosts.solutionAnnual).toBe(96000);
  });

  it("totalAnnualCost = subscription + ongoing for KG costs", () => {
    const kg = calculateComplianceResults(DEFAULT_COMPLIANCE_INPUTS).knowledgeGraphCosts;
    expect(kg.totalAnnualCost).toBe(kg.solutionAnnual + kg.ongoingAnnualCost);
  });

  it("caps risk reduction at 85%", () => {
    const results = calculateComplianceResults(DEFAULT_COMPLIANCE_INPUTS);
    expect(results.knowledgeGraphROI.riskReductionPercent).toBeLessThanOrEqual(85);
  });

  it("returns paybackPeriodMonths >= 1 when savings are positive", () => {
    const results = calculateComplianceResults(DEFAULT_COMPLIANCE_INPUTS);
    expect(results.knowledgeGraphROI.projectedSavings).toBeGreaterThan(0);
    expect(results.knowledgeGraphROI.paybackPeriodMonths).toBeGreaterThanOrEqual(1);
  });

  it("paybackPeriodMonths is null or >= 1 (never zero or negative)", () => {
    // Even tiny orgs have breach risk and audit costs that make KG worthwhile,
    // so we verify the payback period is always valid rather than forcing null.
    const tiny: ComplianceInputs = {
      companySize: 5,
      euDataSubjects: 50,
      personalDataSystems: 1,
      dsarsPerMonth: 0,
      annualRevenue: 10000,
      ongoingPagesPerYear: 100,
      industryVertical: "manufacturing",
      aiSystemsDeployed: 0,
    };
    const results = calculateComplianceResults(tiny);
    const payback = results.knowledgeGraphROI.paybackPeriodMonths;
    expect(payback === null || payback >= 1).toBe(true);
  });

  it("zero AI systems means zero AI Act compliance cost", () => {
    const inputs: ComplianceInputs = {
      ...DEFAULT_COMPLIANCE_INPUTS,
      aiSystemsDeployed: 0,
    };
    const results = calculateComplianceResults(inputs);
    expect(results.currentCosts.aiActCompliance).toBe(0);
  });

  it("more AI systems increases AI Act compliance costs", () => {
    const few = calculateComplianceResults({ ...DEFAULT_COMPLIANCE_INPUTS, aiSystemsDeployed: 1 });
    const many = calculateComplianceResults({ ...DEFAULT_COMPLIANCE_INPUTS, aiSystemsDeployed: 10 });

    expect(many.currentCosts.aiActCompliance).toBeGreaterThan(
      few.currentCosts.aiActCompliance,
    );
  });

  it("finance multiplier increases costs vs manufacturing", () => {
    const mfg = calculateComplianceResults({
      ...DEFAULT_COMPLIANCE_INPUTS,
      industryVertical: "manufacturing",
    });
    const fin = calculateComplianceResults({
      ...DEFAULT_COMPLIANCE_INPUTS,
      industryVertical: "finance",
    });

    expect(fin.currentCosts.totalAnnualCost).toBeGreaterThan(
      mfg.currentCosts.totalAnnualCost,
    );
  });

  it("more DSARs per month increases DSAR processing cost", () => {
    const low = calculateComplianceResults({ ...DEFAULT_COMPLIANCE_INPUTS, dsarsPerMonth: 5 });
    const high = calculateComplianceResults({ ...DEFAULT_COMPLIANCE_INPUTS, dsarsPerMonth: 100 });

    expect(high.currentCosts.dsarProcessing).toBeGreaterThan(
      low.currentCosts.dsarProcessing,
    );
  });

  it("higher page volume increases projected savings", () => {
    const lowPages = calculateComplianceResults({
      ...DEFAULT_COMPLIANCE_INPUTS,
      ongoingPagesPerYear: 1000,
    });
    const highPages = calculateComplianceResults({
      ...DEFAULT_COMPLIANCE_INPUTS,
      ongoingPagesPerYear: 100000,
    });

    expect(highPages.knowledgeGraphROI.projectedSavings).toBeGreaterThan(
      lowPages.knowledgeGraphROI.projectedSavings,
    );
  });

  it("returns only integer values for costs", () => {
    const { currentCosts } = calculateComplianceResults(DEFAULT_COMPLIANCE_INPUTS);
    expect(Number.isInteger(currentCosts.dsarProcessing)).toBe(true);
    expect(Number.isInteger(currentCosts.dataMapping)).toBe(true);
    expect(Number.isInteger(currentCosts.complianceStaff)).toBe(true);
    expect(Number.isInteger(currentCosts.breachRiskExposure)).toBe(true);
    expect(Number.isInteger(currentCosts.auditAndAssessment)).toBe(true);
    expect(Number.isInteger(currentCosts.aiActCompliance)).toBe(true);
  });

  it("treats negative or non-numeric counts as zero instead of returning NaN", () => {
    // The UI sliders enforce minimums, but the package is published for direct
    // use, and a negative count reaches Math.sqrt / Math.log10 as NaN.
    const bad: ComplianceInputs = {
      ...DEFAULT_COMPLIANCE_INPUTS,
      personalDataSystems: -5,
      companySize: -100,
      euDataSubjects: -1,
      dsarsPerMonth: Number.NaN,
      aiSystemsDeployed: -2,
    };
    const walk = (value: unknown): number[] =>
      typeof value === "number"
        ? [value]
        : value && typeof value === "object"
          ? Object.values(value).flatMap(walk)
          : [];
    const numbers = walk(calculateComplianceResults(bad));

    expect(numbers.length).toBeGreaterThan(0);
    for (const n of numbers) expect(Number.isNaN(n)).toBe(false);
    expect(calculateComplianceResults(bad).currentCosts.dataMapping).toBeGreaterThanOrEqual(0);
  });
});
