import { useActiveRun } from "@/state/PrinceStore";

/** The player's next step, named at the top of a gameplay screen. Shown on
 *  each run's first map only; later maps play without it. */
export function Instruction({ text }: { text: string }) {
  const run = useActiveRun();
  if (!run || run.mapsCompleted > 0) return null;
  return <p className="instruction eyebrow">{text}</p>;
}
