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

function formatCoords(lat: number, lon: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(round1(lat)).toFixed(1)}° ${ns}, ${Math.abs(round1(lon)).toFixed(1)}° ${ew}`;
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

export function CityPicker({ lat, lon, tz, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [dataset, setDataset] = useState<CityRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CityRow | null>(null);
  const [highlight, setHighlight] = useState(0);
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
      <div className="city-search">
        <input
          type="text"
          className="city-input"
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
      </div>
      {selected && (
        <div className="city-readout">
          <span className="muted">
            {formatCoords(lat, lon)}
            {tz && ` · ${tz.replace(/_/g, " ")}`}
          </span>
        </div>
      )}
    </div>
  );
}
