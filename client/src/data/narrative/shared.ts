import { anyCombusted, joyPresent, type NarrativeScenario, type Option, type Outcome, type Target } from "@/game/narrative";
import type { PlanetStats, SignName } from "@/game/types";
import { NARRATIVE_ECONOMY } from "../economy";

export const L = (delta: number): Outcome => ({ kind: "light", delta });
export const A = (target: Target, delta: number): Outcome => ({ kind: "affliction", target, delta });
export const G = (target: Target, stat: keyof PlanetStats, amount: number): Outcome => ({ kind: "gain", target, stat, amount });

export const trade = (id: string, text: string, effects: Outcome[], extra: Pick<Option, "cost"> = {}): Option =>
  ({ id, text, result: { effects }, ...extra });
export const joyChoice = (id: string, text: string, effects: Outcome[], extra: Pick<Option, "cost"> = {}): Option =>
  ({ ...trade(id, text, effects, extra), visibleIf: joyPresent });
export const revival = (text: string): Option =>
  ({ ...trade("revive", text, [{ kind: "uncombust", target: "chosen" }], { cost: NARRATIVE_ECONOMY.revive.cost }), visibleIf: anyCombusted });
export const scene = (scenarioId: string, house: number, sign: SignName, text: string, options: Option[]): NarrativeScenario =>
  ({ scenarioId, house, sign, text, options });
