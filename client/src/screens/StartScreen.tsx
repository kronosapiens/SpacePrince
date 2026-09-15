import { useEffect, useMemo, useState } from "react";
import { Chart } from "@/components/Chart";
import { BeginButton } from "@/components/BeginButton";
import { CityPicker } from "@/components/CityPicker";
import { PlanetBands } from "@/components/PlanetBands";
import { TermText } from "@/components/TermText";
import { computeBirthChart } from "@/astronomy/compute";
import { derivePlacements, seededChart } from "@/game/chart";
import { usePrinceDispatch } from "@/state/PrinceStore";
import { useStartRun } from "@/state/store-actions";
import { hashString } from "@/game/rng";
import { TIME_BUCKET_MS, MACROBIAN_ORDER } from "@/game/data";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { playUISound, setTheme } from "@/audio/engine";
import { PLANET_PRIMARY } from "@/svg/palette";
import { PLANET_GLYPH } from "@/svg/glyphs";
import type { Chart as ChartType, Prince, PlanetName, SignName } from "@/game/types";
import { PRIMER_FRAMING } from "@/copy/primer";

// The framing (SCREENS.md §9.6; copy in `copy/primer.ts`) opens the mint — its intent-and-
// stakes beat. It rides the mint surface so Continue (resume) bypasses it for
// free: only a New Game, a fresh mint, passes through it.
type Stage = "framing" | "input" | "revealing" | "settled";

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
const GHOST_FADE_MS = 1500;
const FRAMING_FADE_MS = 400; // matches .mint-framing opacity transition (layout.css)

// Stable scaffold chart shown before the player has supplied inputs. Real
// planet positions are hidden via unlockedPlanets={[]}; only the substrate
// (rings + sign divisions) renders.
const SCAFFOLD_CHART = seededChart(0, "");

export function StartScreen() {
  const { setActive } = useActivePlanet();
  const dispatchPrince = usePrinceDispatch();
  const startRun = useStartRun();
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
  const [ghosted, setGhosted] = useState(false);
  const [leavingFraming, setLeavingFraming] = useState(false);

  useEffect(() => { setTheme("Main"); }, []);

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

  useEffect(() => {
    if (stage !== "revealing") return;
    if (revealedCount >= MACROBIAN_ORDER.length) {
      const t = window.setTimeout(() => {
        setGhosted(true);
        setActive(null);
        const t2 = window.setTimeout(() => setStage("settled"), GHOST_FADE_MS);
        return () => window.clearTimeout(t2);
      }, HELD_MOMENT_MS);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setRevealedCount((n) => n + 1), REVEAL_INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [stage, revealedCount, setActive]);

  useEffect(() => {
    if (stage !== "revealing") return;
    if (revealedCount === 0) return;
    const last = MACROBIAN_ORDER[revealedCount - 1] ?? null;
    setActive(last);
  }, [stage, revealedCount, setActive]);

  // Keep the canvas neutral on the input + settled stages — no carry-over tint
  // from the previous screen.
  useEffect(() => {
    if (stage === "framing" || stage === "input" || stage === "settled") setActive(null);
  }, [stage, setActive]);

  const revealedPlanets: PlanetName[] = useMemo(
    () => (ghosted ? ["Moon"] : MACROBIAN_ORDER.slice(0, revealedCount)),
    [revealedCount, ghosted],
  );

  const currentRevealing = revealedCount > 0 ? MACROBIAN_ORDER[revealedCount - 1] : null;
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
      runs: [],
    };
    dispatchPrince({ kind: "mint", prince });
    // Append a fresh run; PlaySurface then renders the map (we're on /play).
    startRun();
    playUISound("commit");
  };

  const showCeremony = stage === "revealing" || stage === "settled";

  // The bands fill in step with the reveal: everything painted so far rests
  // dim, the planet arriving sits bright.
  const bandsOn = useMemo(
    () => new Set(showCeremony ? MACROBIAN_ORDER.slice(0, revealedCount) : []),
    [showCeremony, revealedCount],
  );
  const bandsCurrent = useMemo(
    () => new Set(stage === "revealing" && currentRevealing ? [currentRevealing] : []),
    [stage, currentRevealing],
  );

  return (
    <div className="chart-layout mint-screen">
      <PlanetBands on={bandsOn} current={bandsCurrent} />

      <div className="chart-layout-chart mint-stage">
        <Chart
          chart={computed ?? SCAFFOLD_CHART}
          unlockedPlanets={showCeremony ? revealedPlanets : []}
          activePlanet={showCeremony && !ghosted ? currentRevealing : null}
          showColorField={showCeremony}
          showSubstrate
          passive
        />
      </div>

      <div className="chart-layout-content mint-content">
        {stage === "framing" && (
          <div className={`mint-framing anim-surface-in ${leavingFraming ? "is-leaving" : ""}`}>
            {PRIMER_FRAMING.map((p, i) => (
              <p key={i}><TermText text={p} /></p>
            ))}
            <BeginButton
              type="button"
              disabled={leavingFraming}
              onClick={() => {
                if (leavingFraming) return;
                playUISound("select");
                setLeavingFraming(true); // fade out, then reveal the input form
                window.setTimeout(() => setStage("input"), FRAMING_FADE_MS);
              }}
            >
              Continue
            </BeginButton>
          </div>
        )}

        {stage === "input" && (
          <>
            <div className="mint-form anim-surface-in">
              <Field label="Date">
                <input
                  type="date"
                  className="invite-text"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </Field>
              <Field label="Time">
                <input
                  type="time"
                  className="invite-text"
                  step={300}
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </Field>
              <Field label="Place">
                <CityPicker
                  lat={Number(form.lat)}
                  lon={Number(form.lon)}
                  tz={form.tz}
                  onChange={(lat, lon, tz) =>
                    setForm({ ...form, lat: String(lat), lon: String(lon), tz })
                  }
                />
              </Field>
            </div>
            <BeginButton className="mint-submit" onClick={handleConfirm} disabled={!computed}>
              Cast Chart
            </BeginButton>
          </>
        )}

        {stage === "revealing" && (
          <div className="mint-caption-italic">
            {currentRevealing && currentSign ? (
              <>{currentRevealing} in {currentSign}.</>
            ) : (
              <>—</>
            )}
          </div>
        )}

        {stage === "settled" && (
          <>
            <div className="mint-caption-italic">The Moon rises in the east. The rest, in time.</div>
            <BeginButton onClick={handleEnter}>Continue</BeginButton>
          </>
        )}

        {/* Progress pips — Macrobian sequence as planet glyphs */}
        {showCeremony && (
          <div className="mint-progress">
            {MACROBIAN_ORDER.map((p, i) => {
              const isOn = i < revealedCount;
              return (
                <span
                  key={p}
                  className={`mint-pip ${isOn ? "is-on" : ""}`}
                  style={{ ["--c" as any]: PLANET_PRIMARY[p] }}
                >
                  {PLANET_GLYPH[p]}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mint-row">
      <label>{label}</label>
      {children}
    </div>
  );
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
