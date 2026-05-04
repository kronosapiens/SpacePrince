import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chart } from "@/components/Chart";
import { CityPicker } from "@/components/CityPicker";
import { ROUTES } from "@/routes";
import { computeBirthChart } from "@/astronomy/compute";
import { derivePlacements, seededChart } from "@/game/chart";
import { useProfileDispatch } from "@/state/ProfileStore";
import { hashString } from "@/game/rng";
import { TIME_BUCKET_MS, MACROBIAN_ORDER, SIGNS } from "@/game/data";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { PLANET_PRIMARY } from "@/svg/palette";
import { PLANET_GLYPH } from "@/svg/glyphs";
import type { Chart as ChartType, Profile, PlanetName, SignName } from "@/game/types";

type Stage = "input" | "revealing" | "settled";

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

// Stable scaffold chart shown before the player has supplied inputs. Real
// planet positions are hidden via unlockedPlanets={[]}; only the substrate
// (rings + sign divisions) renders.
const SCAFFOLD_CHART = seededChart(0, "");

export function StartScreen() {
  const navigate = useNavigate();
  const { setActive } = useActivePlanet();
  const dispatchProfile = useProfileDispatch();
  const [stage, setStage] = useState<Stage>("input");
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
    if (stage === "input" || stage === "settled") setActive(null);
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
    if (!computed) return;
    setStage("revealing");
    setRevealedCount(0);
  };

  const handleEnter = () => {
    if (!computed) return;
    const ms = quantizeMs(localToUtcMs(form.date, form.time, form.tz));
    const iso = new Date(ms).toISOString();
    const profile: Profile = {
      id: computed.id,
      name: computed.name,
      birthData: {
        iso,
        lat: roundLat(Number(form.lat)),
        lon: roundLon(Number(form.lon)),
      },
      chart: computed,
      lifetimeEncounterCount: 0,
      scarsLevel: 0,
      createdAt: Date.now(),
      schemaVersion: 1,
    };
    dispatchProfile({ type: "profile/set", profile });
    navigate(ROUTES.title);
  };

  const showCeremony = stage === "revealing" || stage === "settled";

  return (
    <div className="mint-screen">
      {/* Macrobian rainbow bands on the left edge */}
      <div className="mint-bands">
        {MACROBIAN_ORDER.map((p, i) => {
          const isOn = stage === "revealing" || stage === "settled" ? i < revealedCount : false;
          const isCurrent = stage === "revealing" && i === revealedCount - 1;
          return (
            <div
              key={p}
              className={`mint-band ${isOn ? "is-on" : ""} ${isCurrent ? "is-current" : ""}`}
              style={{ background: PLANET_PRIMARY[p] }}
            />
          );
        })}
      </div>

      <div className="mint-center">
        {stage === "input" && (
          <div className="mint-stage">
            <Chart
              chart={computed ?? SCAFFOLD_CHART}
              unlockedPlanets={[]}
              showColorField={false}
              showSubstrate
              passive
            />
          </div>
        )}

        {showCeremony && computed && (
          <div className="mint-stage">
            <Chart
              chart={computed}
              unlockedPlanets={revealedPlanets}
              activePlanet={ghosted ? null : currentRevealing}
              showColorField
              showSubstrate
              passive
            />
          </div>
        )}

        {stage === "input" && (
          <>
            <div className="mint-form">
              <Field label="Date">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </Field>
              <Field label="Time">
                <input
                  type="time"
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
            <button className="begin-btn" onClick={handleConfirm} disabled={!computed}>
              Begin
            </button>
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
            <button className="begin-btn" onClick={handleEnter}>Continue</button>
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

void SIGNS;
