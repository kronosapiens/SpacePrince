interface HeroHeaderProps {
  onNewVoyage: () => void;
}

export function HeroHeader({ onNewVoyage }: HeroHeaderProps) {
  return (
    <header className="hero">
      <div>
        <h1>🪐 Space Prince</h1>
      </div>
      <div className="hero-actions">
        <button className="btn" onClick={onNewVoyage}>
          🛸 New Voyage
        </button>
      </div>
    </header>
  );
}
