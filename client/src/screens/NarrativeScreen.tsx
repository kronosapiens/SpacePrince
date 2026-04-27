import { Link } from "react-router-dom";

export default function NarrativeScreen() {
  return (
    <div className="stub-page">
      <header className="stub-page-header">
        <Link to="/" className="screen-nav-link">
          ← Index
        </Link>
      </header>
      <div className="stub-body">
        <div className="stub-eyebrow">Narrative · House Encounters</div>
        <h1 className="stub-title">Not yet inhabited</h1>
        <p className="stub-prose">
          The twelve houses are specified in <code>spec/mechanics/HOUSES.md</code>. This
          surface will host the push-your-luck decision trees, chart-conditioned
          options, and house-archetype encounters described there.
        </p>
        <p className="stub-prose">
          Nothing lives here yet — this is a placeholder route so the surface
          has a home as the design lands.
        </p>
      </div>
    </div>
  );
}
