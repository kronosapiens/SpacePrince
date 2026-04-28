import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chart } from "@/components/Chart";
import { ROUTES } from "@/routes";
import { computeBirthChart } from "@/astronomy/compute";
import { derivePlacements } from "@/game/chart";
import { saveProfile } from "@/state/profile";
import { hashString } from "@/game/rng";
import { TIME_BUCKET_MS, MACROBIAN_ORDER } from "@/game/data";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import type { Chart as ChartType, Profile, PlanetName } from "@/game/types";

type Stage = "input" | "confirming" | "revealing" | "settled";

interface FormState {
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  lat: string;
  lon: string;
}

const REVEAL_INTERVAL_MS = 2500;
const HELD_MOMENT_MS = 1500;
const GHOST_FADE_MS = 1500;

export function MintScreen() {
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

  // Reveal progression
  useEffect(() => {
    if (stage !== "revealing") return;
    if (revealedCount >= MACROBIAN_ORDER.length) {
      // Active tint = Saturn briefly while held
      const t = window.setTimeout(() => {
        setGhosted(true);
        setActive(null);
        const t2 = window.setTimeout(() => setStage("settled"), GHOST_FADE_MS);
        return () => window.clearTimeout(t2);
      }, HELD_MOMENT_MS);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      setRevealedCount((n) => n + 1);
    }, REVEAL_INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [stage, revealedCount, setActive]);

  // Tint active planet while it's painting in
  useEffect(() => {
    if (stage !== "revealing") return;
    if (revealedCount === 0) return;
    const last = MACROBIAN_ORDER[revealedCount - 1] ?? null;
    setActive(last);
  }, [stage, revealedCount, setActive]);

  const revealedPlanets: PlanetName[] = useMemo(
    () => (ghosted ? ["Moon"] : MACROBIAN_ORDER.slice(0, revealedCount)),
    [revealedCount, ghosted],
  );

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

  return (
    <div className="mint">
      <div className="mint-stage">
        {stage === "input" && computed && (
          <div style={{ width: "min(420px, 70vw)", aspectRatio: "1 / 1" }}>
            <Chart
              chart={computed}
              unlockedPlanets={[]}
              showHouseWedges={false}
              showAspects={false}
              passive
            />
          </div>
        )}
        {(stage === "confirming" || stage === "revealing" || stage === "settled") && computed && (
          <div style={{ width: "min(540px, 80vw)", aspectRatio: "1 / 1" }}>
            <Chart
              chart={computed}
              unlockedPlanets={revealedPlanets}
              showHouseWedges
              passive
            />
          </div>
        )}
      </div>

      {stage === "input" && (
        <>
          <div className="mint-form">
            <Field label="Name (optional)">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Prince"
              />
            </Field>
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

          <div className="mint-confirm">
            <button
              className="mint-confirm-btn"
              onClick={() => setStage("confirming")}
              disabled={!computed}
            >
              Continue
            </button>
          </div>
        </>
      )}

      {stage === "confirming" && (
        <div className="mint-confirm">
          <div className="mint-confirm-text anim-fragment-in">
            This position may only be recognized once.
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
            <button className="title-second" onClick={() => setStage("input")}>Reconsider</button>
            <button className="mint-confirm-btn" onClick={handleConfirm}>
              Recognize this position
            </button>
          </div>
        </div>
      )}

      {stage === "revealing" && (
        <div className="mint-confirm">
          <div className="mint-confirm-text anim-fragment-in">
            {revealedCount === 0 ? "—" : revealedPlanets[revealedPlanets.length - 1]}
          </div>
        </div>
      )}

      {stage === "settled" && (
        <div className="mint-confirm">
          <div className="mint-confirm-text anim-fragment-in">
            Only the Moon stands today. The rest will be revealed.
          </div>
          <button className="mint-confirm-btn anim-fragment-in" onClick={handleEnter}>
            Enter
          </button>
        </div>
      )}
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

function roundLat(v: number): number {
  return Math.round(v * 10) / 10;
}

function roundLon(v: number): number {
  return Math.round(v * 10) / 10;
}
