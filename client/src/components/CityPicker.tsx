import { useEffect, useMemo, useRef, useState } from "react";

type CityRow = [name: string, admin1: string, country: string, lat: number, lon: number, pop: number, tz: string];

interface Props {
  lat: number;
  lon: number;
  tz: string;
  onChange: (lat: number, lon: number, tz: string) => void;
}

const round1 = (v: number) => Math.round(v * 10) / 10;
const isAlphaAdmin = (a: string) => a.length > 0 && /^[A-Za-z]+$/.test(a);

function formatCity(c: CityRow): string {
  const [name, admin1, country] = c;
  return isAlphaAdmin(admin1) ? `${name}, ${admin1} · ${country}` : `${name} · ${country}`;
}

/** Quick coordinate entry: a leading sign + up to 5 digits, with the decimal
 *  floating two from the right ("2222" → "22.22"; "11824" → "118.24"). Five
 *  digits lets longitude reach its three integer digits. */
function maskCoord(raw: string): string {
  const neg = raw.trimStart().startsWith("-");
  const digits = raw.replace(/\D/g, "").slice(0, 5);
  const body = digits.length > 2 ? `${digits.slice(0, -2)}.${digits.slice(-2)}` : digits;
  return (neg ? "-" : "") + body;
}

let _datasetPromise: Promise<CityRow[]> | null = null;
function loadDataset(): Promise<CityRow[]> {
  if (!_datasetPromise) {
    _datasetPromise = import("@/assets/cities.json").then((m) => m.default as CityRow[]);
  }
  return _datasetPromise;
}

const MAX_RESULTS = 10;

function rank(rows: CityRow[], q: string): CityRow[] {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  const starts: CityRow[] = [];
  const contains: CityRow[] = [];
  for (const row of rows) {
    const name = row[0].toLowerCase();
    if (name.startsWith(needle)) starts.push(row);
    else if (name.includes(needle)) contains.push(row);
    if (starts.length >= MAX_RESULTS * 4) break; // bound work in pathological cases
  }
  starts.sort((a, b) => b[5] - a[5]);
  contains.sort((a, b) => b[5] - a[5]);
  return [...starts, ...contains].slice(0, MAX_RESULTS);
}

/** Compass rose — the manual-coordinates affordance, mirroring the native
 *  calendar/clock picker icons on the date and time fields. */
function CompassGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M12 4 L13.6 10.4 L20 12 L13.6 13.6 L12 20 L10.4 13.6 L4 12 L10.4 10.4 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function CityPicker({ lat, lon, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [dataset, setDataset] = useState<CityRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CityRow | null>(null);
  const [highlight, setHighlight] = useState(0);
  const [manual, setManual] = useState(false);
  const [manLat, setManLat] = useState("");
  const [manLon, setManLon] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const ensureDataset = () => {
    if (dataset || loading) return;
    setLoading(true);
    loadDataset()
      .then((d) => setDataset(d))
      .finally(() => setLoading(false));
  };

  const matches = useMemo<CityRow[]>(() => {
    if (!dataset) return [];
    return rank(dataset, query);
  }, [dataset, query]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (c: CityRow) => {
    setSelected(c);
    setQuery("");
    setOpen(false);
    onChange(round1(c[3]), round1(c[4]), c[6]);
  };

  // Manual coordinate entry — toggled by the compass. Prefills from a picked
  // city so you can nudge it; tz is left blank (treated as UTC at mint).
  const enterManual = () => {
    // Two decimals so a prefilled city coord round-trips through maskCoord
    // (which floats the decimal two from the right).
    setManLat(selected ? round1(lat).toFixed(2) : "");
    setManLon(selected ? round1(lon).toFixed(2) : "");
    setManual(true);
    setOpen(false);
  };
  const applyManual = (la: string, lo: string) => {
    setManLat(la);
    setManLon(lo);
    const nLa = Number.parseFloat(la);
    const nLo = Number.parseFloat(lo);
    if (Number.isFinite(nLa) && Number.isFinite(nLo)) {
      setSelected(null);
      onChange(round1(nLa), round1(nLo), "");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      const c = matches[highlight];
      if (c) {
        e.preventDefault();
        pick(c);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="city-picker" ref={wrapRef}>
      <div className="city-field">
        <div className="city-search">
          {manual ? (
            <div className="city-manual">
              <input
                type="text" inputMode="decimal" maxLength={7}
                placeholder="Lat" value={manLat}
                onChange={(e) => applyManual(maskCoord(e.target.value), manLon)}
              />
              <input
                type="text" inputMode="decimal" maxLength={7}
                placeholder="Lon" value={manLon}
                onChange={(e) => applyManual(manLat, maskCoord(e.target.value))}
              />
            </div>
          ) : (
            <>
              <input
                type="text"
                className={`city-input ${selected ? "has-city" : ""}`}
                placeholder={selected ? formatCity(selected) : "City"}
                value={query}
                onFocus={() => {
                  ensureDataset();
                  setOpen(true);
                }}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onKeyDown={onKeyDown}
              />
              {open && (query.trim().length >= 2 || loading) && (
                <ul className="city-results" role="listbox">
                  {loading && !dataset && <li className="city-empty">Loading places…</li>}
                  {!loading && dataset && matches.length === 0 && (
                    <li className="city-empty">No matches.</li>
                  )}
                  {matches.map((c, i) => (
                    <li
                      key={`${c[0]}-${c[3]}-${c[4]}`}
                      className={`city-row ${i === highlight ? "is-highlight" : ""}`}
                      role="option"
                      aria-selected={i === highlight}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(c);
                      }}
                      onMouseEnter={() => setHighlight(i)}
                    >
                      <span className="city-name">{c[0]}</span>
                      {isAlphaAdmin(c[1]) && <span className="city-admin">, {c[1]}</span>}
                      <span className="city-country"> · {c[2]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          className={`city-compass ${manual ? "is-active" : ""}`}
          title={manual ? "Search for a city" : "Enter coordinates"}
          aria-label={manual ? "Search for a city" : "Enter coordinates"}
          onClick={() => (manual ? setManual(false) : enterManual())}
        >
          <CompassGlyph />
        </button>
      </div>
    </div>
  );
}
