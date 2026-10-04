/**
 * Baseline narrative purchases for one planet; scenario integration is pending.
 * Recovery removes carried affliction; stat gains last for the rest of the run.
 * Fortune uses displayed units: 6 Fortune corresponds to 12 underlying Luck.
 * Revival returns a combusted planet at half Resolve.
 */
export const NARRATIVE_ECONOMY = {
  recovery: { amount: 24, cost: 48 },
  resolve: { amount: 12, cost: 240 },
  testify: { amount: 12, cost: 360 },
  afflict: { amount: 12, cost: 360 },
  fortune: { amount: 6, cost: 240 },
  revive: { cost: 180 },
} as const;
