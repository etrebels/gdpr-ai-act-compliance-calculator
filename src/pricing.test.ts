import { describe, it, expect } from "vitest";
import {
  getImplementationCost,
  formatCurrency,
  SOLUTION_ANNUAL_COST,
  ONGOING_COST_RATE,
} from "./pricing";

describe("getImplementationCost", () => {
  it("returns the illustrative floor for pages at or below 500", () => {
    expect(getImplementationCost(100)).toBe(15000);
    expect(getImplementationCost(500)).toBe(15000);
  });

  it("returns exact tier prices at tier boundaries", () => {
    expect(getImplementationCost(1000)).toBe(20000);
    expect(getImplementationCost(5000)).toBe(26000);
    expect(getImplementationCost(10000)).toBe(33000);
    expect(getImplementationCost(15000)).toBe(39000);
    expect(getImplementationCost(20000)).toBe(45000);
  });

  it("interpolates between tiers", () => {
    // Midpoint between [500, 15000] and [1000, 20000]
    const mid = getImplementationCost(750);
    expect(mid).toBe(17500); // round(15000 + 0.5 * 5000)
  });

  it("caps at the illustrative ceiling above the highest tier", () => {
    expect(getImplementationCost(25000)).toBe(45000);
    expect(getImplementationCost(1000000)).toBe(45000);
  });

  it("always returns a positive number", () => {
    expect(getImplementationCost(0)).toBeGreaterThan(0);
    expect(getImplementationCost(1)).toBeGreaterThan(0);
  });
});

describe("formatCurrency", () => {
  it("formats billions", () => {
    expect(formatCurrency(1500000000)).toBe("$1.5B");
  });

  it("formats millions", () => {
    expect(formatCurrency(2400000)).toBe("$2.4M");
  });

  it("formats thousands", () => {
    expect(formatCurrency(150000)).toBe("$150K");
    expect(formatCurrency(1000)).toBe("$1K");
  });

  it("formats small amounts with commas", () => {
    expect(formatCurrency(999)).toBe("$999");
    expect(formatCurrency(0)).toBe("$0");
  });

  it("handles negative amounts", () => {
    expect(formatCurrency(-500000)).toBe("-$500K");
    expect(formatCurrency(-2400000)).toBe("-$2.4M");
  });
});

describe("constants", () => {
  it("exports expected pricing constants", () => {
    // Illustrative placeholder — replace with your own pricing.
    expect(SOLUTION_ANNUAL_COST).toBe(96000);
    expect(ONGOING_COST_RATE).toBe(0.1);
  });
});
