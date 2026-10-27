/**
 * Provisional narrative exchange rates for one planet.
 * Values approximate each change's simulated effect on final run Light; full balance is deferred.
 * Press pays Light for taking affliction; recovery removes it; stat gains last for the rest of the run.
 * Fortune uses displayed units: 6 Fortune corresponds to 12 underlying Luck.
 * Revival returns a combusted planet at half Resolve.
 * Testify gains are not offered: their simulated value is near zero.
 */
export const NARRATIVE_ECONOMY = {
  recovery: { amount: 24, cost: 48 },
  press: { amount: 24, light: 72 },
  resolve: { amount: 12, cost: 60 },
  afflict: { amount: 12, cost: 36 },
  fortune: { amount: 6, cost: 36 },
  revive: { cost: 180 },
} as const;
