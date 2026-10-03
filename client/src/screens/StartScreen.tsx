import { useOutletContext } from "react-router-dom";
import { BeginButton } from "@/components/BeginButton";
import { CityPicker } from "@/components/CityPicker";
import { PlanetIntroCard } from "@/components/PlanetIntroCard";
import { TermText } from "@/components/TermText";
import { PLANETS } from "@/game/data";
import { PLANET_PRIMARY } from "@/svg/palette";
import { PLANET_GLYPH } from "@/svg/glyphs";
import { PRIMER_CAST, PRIMER_FRAMING } from "@/copy/primer";
import type { GameLayoutContext } from "./GameLayout";

export function StartScreen() {
  const { casting } = useOutletContext<GameLayoutContext>();
  const {
    stage, form, setForm, computed, leavingFraming, painted,
    currentRevealing, currentSign, showCeremony,
    continueFraming, handleConfirm, closeIntroduction, handleEnter,
  } = casting;

  return (
    <div className="chart-layout-content mint-content anim-surface-in">
      {stage === "framing" && (
        <div className={`mint-framing anim-surface-in ${leavingFraming ? "is-leaving" : ""}`}>
          {PRIMER_FRAMING.map((p, i) => (
            <p key={i}><TermText text={p} /></p>
          ))}
          <BeginButton
            type="button"
            disabled={leavingFraming}
            onClick={continueFraming}
          >
            Continue
          </BeginButton>
        </div>
      )}

      {stage === "input" && (
        <>
          <div className="mint-caption-italic anim-surface-in"><TermText text={PRIMER_CAST} /></div>
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
                initialCityLabel="Los Angeles, CA · United States"
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

      {stage === "introducing" && computed && (
        <PlanetIntroCard chart={computed} planet="Moon" onClose={closeIntroduction} />
      )}

      {stage === "settled" && <BeginButton onClick={handleEnter}>Continue</BeginButton>}

      {/* Progress pips — Macrobian sequence as planet glyphs */}
      {showCeremony && (
        <div className="mint-progress">
          {PLANETS.map((p) => (
            <span
              key={p}
              className={`mint-pip ${painted.includes(p) ? "is-on" : ""}`}
              style={{ ["--c" as any]: PLANET_PRIMARY[p] }}
            >
              {PLANET_GLYPH[p]}
            </span>
          ))}
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
