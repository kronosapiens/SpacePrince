import { useEffect, useMemo, useState } from "react";
import { computeBirthChart } from "@/astronomy/compute";
import { derivePlacements } from "@/game/chart";
import { usePrinceDispatch } from "@/state/PrinceStore";
import { beginRun } from "@/game/run";
import { loadDevSettings } from "@/state/settings";
import { hashString } from "@/game/rng";
import { TIME_BUCKET_MS, PLANETS } from "@/game/data";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { playUISound, setTheme } from "@/audio/engine";
import type { Chart as ChartType, Prince, SignName } from "@/game/types";

type Stage = "framing" | "input" | "revealing" | "dimmed" | "introducing" | "settled";

interface FormState {
  name: string;
  date: string;
  time: string;
  lat: string;
  lon: string;
  tz: string;
}

const REVEAL_INTERVAL_MS = 2500;
const HELD_MOMENT_MS = 1500;
const DIMMED_MS = 1500;
const FRAMING_FADE_MS = 400;

export function useCasting(enabled: boolean) {
  const { setActive } = useActivePlanet();
  const dispatchPrince = usePrinceDispatch();
  const [stage, setStage] = useState<Stage>("framing");
  const [form, setForm] = useState<FormState>({
    name: "",
    date: "1990-01-01",
    time: "12:00",
    lat: "",
    lon: "",
    tz: "",
  });
  const [revealedCount, setRevealedCount] = useState(0);
  const [leavingFraming, setLeavingFraming] = useState(false);
  const [lastComputed, setLastComputed] = useState<ChartType | null>(null);

  useEffect(() => { if (enabled) setTheme("Main"); }, [enabled]);

  const computed: ChartType | null = useMemo(() => {
    if (!form.lat || !form.lon) return null;
    if (!form.date || !form.time) return null;
    const lat = Number(form.lat);
    const lon = Number(form.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    try {
      const ms = quantizeMs(localToUtcMs(form.date, form.time, form.tz));
      const iso = new Date(ms).toISOString();
      const data = computeBirthChart(iso, roundLat(lat), roundLon(lon));
      const { planets, ascendantSign } = derivePlacements({
        longitudes: data.longitudes,
        ascendantLongitude: data.ascendantLongitude,
        isDiurnal: data.isDiurnal,
      });
      const id = `prince_${hashString(`${iso}_${roundLat(lat).toFixed(1)}_${roundLon(lon).toFixed(1)}`)}`;
      return {
        id,
        name: form.name.trim() || "Prince",
        isDiurnal: data.isDiurnal,
        ascendantSign,
        ascendantLongitude: data.ascendantLongitude,
        planets,
      };
    } catch (e) {
      console.warn(e);
      return null;
    }
  }, [form]);

  // The whole chart paints in, holds, then dims to nothing; after a beat the
  // Moon arrives through the same introduction card every later planet uses.
  useEffect(() => {
    if (!enabled) return;
    if (stage === "dimmed") {
      const timer = window.setTimeout(() => setStage("introducing"), DIMMED_MS);
      return () => window.clearTimeout(timer);
    }
    if (stage !== "revealing") return;
    const delay = revealedCount >= PLANETS.length ? HELD_MOMENT_MS : REVEAL_INTERVAL_MS;
    const timer = window.setTimeout(() => {
      if (revealedCount >= PLANETS.length) setStage("dimmed");
      else setRevealedCount((n) => n + 1);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [enabled, stage, revealedCount]);

  const currentRevealing = stage === "revealing" && revealedCount > 0 ? PLANETS[revealedCount - 1]! : null;

  // The canvas takes the tint of the planet arriving, and stays neutral
  // outside the reveal — no carry-over from the previous screen.
  useEffect(() => {
    if (enabled) setActive(currentRevealing);
  }, [enabled, currentRevealing, setActive]);

  const currentSign: SignName | null = currentRevealing && computed
    ? computed.planets[currentRevealing].sign
    : null;

  const handleConfirm = () => {
    if (!computed || stage !== "input") return;
    playUISound("commit");
    setStage("revealing");
    setRevealedCount(0);
  };

  const handleEnter = () => {
    if (!computed || stage !== "settled") return;
    const ms = quantizeMs(localToUtcMs(form.date, form.time, form.tz));
    const iso = new Date(ms).toISOString();
    const prince: Prince = {
      id: computed.id,
      position: {
        iso,
        lat: roundLat(Number(form.lat)),
        lon: roundLon(Number(form.lon)),
      },
      chart: computed,
      numEncounters: 0,
      achievements: 0,
      runs: [beginRun(computed, undefined, 0, loadDevSettings().unlockAll)],
    };
    dispatchPrince({ kind: "mint", prince });
    playUISound("commit");
  };

  const closeIntroduction = () => {
    if (stage === "introducing") setStage("settled");
  };

  const showCeremony = stage !== "framing" && stage !== "input";
  const painted = useMemo(
    () => (stage === "revealing" ? PLANETS.slice(0, revealedCount) : []),
    [stage, revealedCount],
  );
  const revealedPlanets = stage === "introducing" || stage === "settled" ? PLANETS.slice(0, 1) : painted;

  // The bands fill in step with the reveal: everything painted so far rests
  // dim, the planet arriving sits bright. They go dark with the chart and stay
  // dark — past the reveal they only mark planets acting in an encounter.
  const bandsOn = useMemo(() => new Set(painted), [painted]);
  const bandsCurrent = useMemo(
    () => new Set(currentRevealing ? [currentRevealing] : []),
    [currentRevealing],
  );

  useEffect(() => {
    if (computed) setLastComputed(computed);
  }, [computed]);

  useEffect(() => {
    if (!enabled || !leavingFraming) return;
    const delay = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : FRAMING_FADE_MS;
    const timer = window.setTimeout(() => {
      setStage("input");
      setLeavingFraming(false);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [enabled, leavingFraming]);

  const continueFraming = () => {
    if (leavingFraming) return;
    playUISound("select");
    setLeavingFraming(true);
  };

  return {
    stage, form, setForm, computed, chart: computed ?? lastComputed,
    leavingFraming, currentRevealing, currentSign, showCeremony, painted,
    revealedPlanets, bandsOn, bandsCurrent, continueFraming, handleConfirm, closeIntroduction, handleEnter,
  };
}

function quantizeMs(ms: number): number {
  return Math.floor(ms / TIME_BUCKET_MS) * TIME_BUCKET_MS;
}
function roundLat(v: number): number { return Math.round(v * 10) / 10; }
function roundLon(v: number): number { return Math.round(v * 10) / 10; }

// Convert a wall-clock (date, time) in IANA `tz` to a UTC ms timestamp.
// Empty tz: input is treated as UTC (used before a city has been picked).
// Two-pass to handle DST boundaries; ambiguous fall-back hours resolve to the
// first occurrence (DST → standard), which is acceptable at sign-level chart
// resolution.
function localToUtcMs(date: string, time: string, tz: string): number {
  const naive = Date.parse(`${date}T${time}:00Z`);
  if (!tz) return naive;
  const off1 = tzOffsetMs(naive, tz);
  return naive - tzOffsetMs(naive - off1, tz);
}

function tzOffsetMs(ms: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const wall = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return wall - ms;
}
