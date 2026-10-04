import { useEffect, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { currentTheme, getMusicVolume, playUISound, resetMusicParts, setTheme, subscribeTheme, subscribeVolume } from "@/audio/engine";
import { playFocusSound, playHoverSound } from "@/audio/interaction";
import { THEMES } from "@/audio/themes";
import { AudioControls } from "@/components/AudioControls";
import { HouseCoin } from "@/components/HouseCoin";
import { KandinskyComposition } from "@/components/KandinskyComposition";
import { MapDiagram } from "@/components/MapDiagram";
import { MusicVisualizer } from "@/components/MusicVisualizer";
import { PlanetIntroCard } from "@/components/PlanetIntroCard";
import { PrinceArtwork } from "@/components/PrinceArtwork";
import { HOUSES } from "@/data/houses";
import { seededChart } from "@/game/chart";
import { PLANETS, PLANET_ROLE, SIGNS, UNLOCK_THRESHOLDS } from "@/game/data";
import { beginRun } from "@/game/run";
import type { PlanetName, Prince, SignName } from "@/game/types";
import { ROUTES } from "@/routes";
import { PLANET_GLYPH, SIGN_GLYPH } from "@/svg/glyphs";
import { NEUTRAL, PLANET_PRIMARY, PLANET_SECONDARY } from "@/svg/palette";
import "@/style/gallery.css";

const chart = seededChart(42, "Gallery Prince");
const numEncounters = UNLOCK_THRESHOLDS[UNLOCK_THRESHOLDS.length - 1]!;
const run = beginRun(chart, 42, numEncounters);
const prince: Prince = {
  id: "gallery-prince",
  position: { iso: "2000-01-01T12:00:00Z", lat: 0, lon: 0 },
  chart,
  numEncounters,
  achievements: 0,
  runs: [run],
};

export default function GalleryScreen() {
  const [planet, setPlanet] = useState<PlanetName | null>(null);
  const [sign, setSign] = useState<SignName>("Pisces");
  const theme = useSyncExternalStore(subscribeTheme, currentTheme);
  const musicVolume = useSyncExternalStore(subscribeVolume, getMusicVolume);
  useEffect(() => {
    const selected = currentTheme();
    if (selected) setTheme(selected, "map");
    return resetMusicParts;
  }, []);
  // The placement override is only for the reveal's copy, never the chart artwork.
  const revealChart = planet ? {
    ...chart,
    planets: { ...chart.planets, [planet]: { ...chart.planets[planet], sign } },
  } : chart;
  const musicStatus = (
    <div className="gallery-music-status">
      <button type="button" className="gallery-music-stop" disabled={!theme}
        onPointerEnter={playHoverSound} onFocus={playFocusSound}
        onClick={() => { playUISound("dismiss"); setTheme(null); }}>Stop music</button>
      {musicVolume === 0 && <p className="gallery-note" role="status">Music is muted</p>}
    </div>
  );

  return (
    <main className="gallery-screen">
      <header className="gallery-header">
        <div>
          <p className="eyebrow">Space Prince · Development</p>
          <h1>Design gallery</h1>
          <p className="gallery-note">The sights and sounds of the game, gathered in one place.</p>
        </div>
        <Link className="gallery-link" to={ROUTES.title}>Back to game ↗</Link>
      </header>

      <nav className="gallery-nav" aria-label="Gallery sections">
        <a href="#planets">Planets & reveals</a>
        <a href="#symbols">Symbols & houses</a>
        <a href="#compositions">Chart & map</a>
        <a href="#palette">Palette & type</a>
        <a href="#music">Music</a>
      </nav>

      <section id="planets" className="gallery-section" aria-labelledby="gallery-planets-title">
        <div className="gallery-section-heading">
          <div>
            <p className="eyebrow">01 · Planets</p>
            <h2 id="gallery-planets-title">Planet compositions</h2>
            <p className="gallery-note">Select a planet to open its reveal card.</p>
          </div>
          <div className="gallery-sign">
            <label htmlFor="gallery-sign">Sign</label>
            <select id="gallery-sign" value={sign} onChange={(event) => setSign(event.target.value as SignName)}>
              {SIGNS.map((value) => <option key={value}>{value}</option>)}
            </select>
          </div>
        </div>
        <div className="gallery-planets">
          {PLANETS.map((name) => (
            <button key={name} type="button" className="gallery-planet"
              aria-label={`Preview ${name} reveal`}
              onPointerEnter={playHoverSound} onFocus={playFocusSound}
              onClick={() => { playUISound("select"); setPlanet(name); }}>
              <KandinskyComposition planet={name} size={240} />
              <span className="gallery-planet-name" style={{ color: PLANET_PRIMARY[name] }}>{name}</span>
              <span className="eyebrow">{PLANET_ROLE[name]}</span>
            </button>
          ))}
        </div>
      </section>

      <section id="symbols" className="gallery-section" aria-labelledby="gallery-symbols-title">
        <p className="eyebrow">02 · Symbols & houses</p>
        <h2 id="gallery-symbols-title">Glyphs and house coins</h2>
        <h3>Planetary glyphs</h3>
        <div className="gallery-symbols gallery-planet-symbols">
          {PLANETS.map((name) => (
            <figure key={name}>
              <svg viewBox="0 0 80 80" aria-hidden="true">
                <text x="40" y="40" dominantBaseline="central" textAnchor="middle"
                  fontSize="42" fill={PLANET_PRIMARY[name]}>{PLANET_GLYPH[name]}</text>
              </svg>
              <figcaption>{name}</figcaption>
            </figure>
          ))}
        </div>
        <h3>Zodiac</h3>
        <div className="gallery-symbols">
          {SIGNS.map((name) => (
            <figure key={name}>
              <svg viewBox="0 0 80 80" aria-hidden="true">
                <text x="40" y="40" dominantBaseline="central" textAnchor="middle"
                  fontSize="36" fill={NEUTRAL.bone}>{SIGN_GLYPH[name]}</text>
              </svg>
              <figcaption>{name}</figcaption>
            </figure>
          ))}
        </div>
        <h3>House coins</h3>
        <div className="gallery-symbols">
          {HOUSES.map((house) => (
            <figure key={house.num}>
              <svg viewBox="-40 -40 80 80" aria-hidden="true">
                <HouseCoin house={house.num} color={PLANET_PRIMARY[house.ruler]} />
              </svg>
              <figcaption>{house.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="compositions" className="gallery-section" aria-labelledby="gallery-compositions-title">
        <p className="eyebrow">03 · Compositions</p>
        <h2 id="gallery-compositions-title">Chart and map</h2>
        <p className="gallery-note">Fixed sample data, independent of your saved Prince.</p>
        <div className="gallery-compositions">
          <figure>
            <div className="gallery-artwork"><PrinceArtwork prince={prince} draft /></div>
            <figcaption>Prince artwork · all planets & draft achievement marks</figcaption>
          </figure>
          <figure>
            <div className="gallery-map"><MapDiagram map={run.map} /></div>
            <figcaption>Map · houses, encounters & the Lot of Fortune</figcaption>
          </figure>
        </div>
      </section>

      <section id="palette" className="gallery-section" aria-labelledby="gallery-palette-title">
        <p className="eyebrow">04 · Palette & type</p>
        <h2 id="gallery-palette-title">Palette and typography</h2>
        <div className="gallery-swatches">
          {PLANETS.map((name) => (
            <figure key={name}>
              <svg viewBox="0 0 100 40" aria-hidden="true">
                <rect width="70" height="40" fill={PLANET_PRIMARY[name]} />
                <rect x="70" width="30" height="40" fill={PLANET_SECONDARY[name]} />
              </svg>
              <figcaption>{name}</figcaption>
            </figure>
          ))}
        </div>
        <div className="gallery-swatches">
          {Object.entries(NEUTRAL).map(([name, color]) => (
            <figure key={name}>
              <svg viewBox="0 0 100 40" aria-hidden="true">
                <rect x="0.5" y="0.5" width="99" height="39" fill={color} stroke={NEUTRAL.smoke} />
              </svg>
              <figcaption>{name}</figcaption>
            </figure>
          ))}
        </div>
        <div className="gallery-type">
          <div><p className="eyebrow">Cormorant Garamond · Voice</p><p className="gallery-type-display">A planet comes into view</p></div>
          <div><p className="eyebrow">Inter · Chrome</p><p className="gallery-type-chrome">Identity, attention, and irreversible choice.</p></div>
        </div>
      </section>

      <section id="music" className="gallery-section" aria-labelledby="gallery-music-title">
        <div className="gallery-section-heading">
          <div>
            <p className="eyebrow">05 · Music</p>
            <h2 id="gallery-music-title">Planet themes</h2>
            <p className="gallery-note">All themes in the key of D. Select a theme to hear its map arrangement.</p>
          </div>
          <AudioControls />
        </div>
        <div className="gallery-music-themes">
          {(["Main", ...PLANETS] as const).map((name) => (
            <button key={name} type="button" className="gallery-music-theme"
              aria-label={`Play ${name} theme`} aria-pressed={theme === name}
              onPointerEnter={playHoverSound} onFocus={playFocusSound}
              onClick={() => { playUISound("select"); setTheme(name); }}>
              <svg viewBox="0 0 48 48" aria-hidden="true">
                {name === "Main" ? (
                  <circle cx="24" cy="24" r="11" fill="none" stroke={NEUTRAL.gold} />
                ) : (
                  <text x="24" y="24" dominantBaseline="central" textAnchor="middle"
                    fontSize="28" fill={PLANET_PRIMARY[name]}>{PLANET_GLYPH[name]}</text>
                )}
              </svg>
              <span className="gallery-music-heading">
                <span className="gallery-music-name" style={{ color: name === "Main" ? NEUTRAL.gold : PLANET_PRIMARY[name] }}>
                  {name === "Main" ? "Main Theme" : name}
                </span>
                {THEMES[name].mode && <span className="gallery-note">{THEMES[name].mode}</span>}
              </span>
              <span className="eyebrow">{theme === name ? "Selected" : "Play theme"}</span>
              <MusicVisualizer theme={name} overview />
            </button>
          ))}
        </div>
        {theme ? <MusicVisualizer theme={theme} status={musicStatus} /> : musicStatus}
      </section>

      {planet && <PlanetIntroCard chart={revealChart} planet={planet} onClose={() => setPlanet(null)} />}
    </main>
  );
}
