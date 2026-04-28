import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chart } from "@/components/Chart";
import { ROUTES } from "@/routes";
import { computeBirthChart } from "@/astronomy/compute";
import { derivePlacements } from "@/game/chart";
import { saveProfile } from "@/state/profile";
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
}

const REVEAL_INTERVAL_MS = 2500;
const HELD_MOMENT_MS = 1500;
const GHOST_FADE_MS = 1500;

export function StartScreen() {
  const navigate = useNavigate();
  const { setActive } = useActivePlanet();
  const [stage, setStage] = useState<Stage>("input");
  const [form, setForm] = useState<FormState>({
    name: "",
    date: "1990-01-01",
    time: "12:00",
    lat: "40.0",
    lon: "-74.0",
  });
  const [revealedCount, setRevealedCount] = useState(0);
  const [ghosted, setGhosted] = useState(false);

  const computed: ChartType | null = useMemo(() => {
    const lat = Number(form.lat);
    const lon = Number(form.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    if (!form.date || !form.time) return null;
    try {
      const ms = quantizeMs(`${form.date}T${form.time}:00Z`);
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
    const ms = quantizeMs(`${form.date}T${form.time}:00Z`);
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
    saveProfile(profile);
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
        {stage === "input" && computed && (
          <div className="mint-stage">
            <Chart
              chart={computed}
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
              <Field label="Time (UTC)">
                <input
                  type="time"
                  step={900}
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </Field>
              <Field label="Latitude">
                <input
                  type="number"
                  step="0.1"
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: e.target.value })}
                />
              </Field>
              <Field label="Longitude">
                <input
                  type="number"
                  step="0.1"
                  value={form.lon}
                  onChange={(e) => setForm({ ...form, lon: e.target.value })}
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
              <>{currentRevealing} rises in {currentSign}.</>
            ) : (
              <>—</>
            )}
          </div>
        )}

        {stage === "settled" && (
          <>
            <div className="mint-caption-italic">The Moon rises in the east. The rest will be revealed in time.</div>
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

function quantizeMs(iso: string): number {
  const ms = new Date(iso).getTime();
  return Math.floor(ms / TIME_BUCKET_MS) * TIME_BUCKET_MS;
}
function roundLat(v: number): number { return Math.round(v * 10) / 10; }
function roundLon(v: number): number { return Math.round(v * 10) / 10; }

void SIGNS;
