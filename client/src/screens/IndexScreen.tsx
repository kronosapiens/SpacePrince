import { Link } from "react-router-dom";

interface SurfaceLink {
  to: string;
  eyebrow: string;
  title: string;
  blurb: string;
}

const SURFACES: SurfaceLink[] = [
  {
    to: "/map",
    eyebrow: "Topology",
    title: "Map",
    blurb:
      "The seven-layer tree the player descends each run. Reseed, slide, walk node-to-node.",
  },
  {
    to: "/encounter",
    eyebrow: "Combat",
    title: "Encounter",
    blurb:
      "Two charts, planet-vs-planet turn resolution, propagation along aspects, combustion.",
  },
  {
    to: "/narrative",
    eyebrow: "Houses",
    title: "Narrative",
    blurb:
      "Twelve-house decision-tree encounters. Stubbed; design lives in spec/HOUSES.md.",
  },
];

export default function IndexScreen() {
  return (
    <div className="index-page">
      <header className="index-header">
        <div className="index-eyebrow">Space Prince</div>
        <h1 className="index-title">Surfaces</h1>
        <p className="index-subtitle">
          Each surface develops independently. They will be wired into a single
          run flow later.
        </p>
      </header>
      <nav className="index-grid">
        {SURFACES.map((s) => (
          <Link key={s.to} to={s.to} className="index-card">
            <div className="index-card-eyebrow">{s.eyebrow}</div>
            <div className="index-card-title">{s.title}</div>
            <div className="index-card-blurb">{s.blurb}</div>
            <div className="index-card-route">{s.to}</div>
          </Link>
        ))}
      </nav>
    </div>
  );
}
