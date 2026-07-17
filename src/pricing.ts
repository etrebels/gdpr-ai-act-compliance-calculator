// ─── Solution pricing (ILLUSTRATIVE placeholders) ───────────────
// These figures are illustrative defaults so the calculators run
// out of the box. They are NOT a quote and do not reflect any real
// vendor's pricing. Replace them with your own solution pricing
// before relying on the ROI output — see config.example.json.

// Illustrative annual platform cost for a knowledge-graph solution.
export const SOLUTION_ANNUAL_COST = 96000;

// Illustrative one-time implementation tiers keyed to corpus size
// (pages; ~400 words each). Linearly interpolated between tiers.
const IMPLEMENTATION_TIERS: [number, number][] = [
  [500, 15000],
  [1000, 20000],
  [5000, 26000],
  [10000, 33000],
  [15000, 39000],
  [20000, 45000],
];

// Illustrative cap on the one-time implementation cost.
const IMPLEMENTATION_COST_CAP = 45000;

// Ongoing pages added each year cost 10% of the implementation cost.
export const ONGOING_COST_RATE = 0.1;

/**
 * Linearly interpolate the implementation cost for a given page
 * count between the illustrative pricing tiers.
 */
export function getImplementationCost(pages: number): number {
  if (pages <= IMPLEMENTATION_TIERS[0][0]) {
    return IMPLEMENTATION_TIERS[0][1];
  }
  const lastTier = IMPLEMENTATION_TIERS[IMPLEMENTATION_TIERS.length - 1];
  if (pages >= lastTier[0]) {
    return IMPLEMENTATION_COST_CAP;
  }
  for (let tierIndex = 0; tierIndex < IMPLEMENTATION_TIERS.length - 1; tierIndex++) {
    const [lowerPages, lowerCost] = IMPLEMENTATION_TIERS[tierIndex];
    const [upperPages, upperCost] = IMPLEMENTATION_TIERS[tierIndex + 1];
    if (pages >= lowerPages && pages <= upperPages) {
      const ratio = (pages - lowerPages) / (upperPages - lowerPages);
      return Math.round(lowerCost + ratio * (upperCost - lowerCost));
    }
  }
  return lastTier[1];
}

export function formatCurrency(amount: number): string {
  if (amount < 0) return `-${formatCurrency(-amount)}`;
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}
