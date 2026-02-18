# Space Prince Client

Browser-based prototype for the Space Prince combat system.

## Overview

This client renders two astrological charts (Self / Other) and lets you play a full combat run directly on the charts.
It is a local-only prototype: charts are randomly generated, game state is stored in `localStorage`, and no network calls are made.

### Architecture

- **UI**: React + Vite + TypeScript
- **Game logic**: `src/game/*`
  - `data.ts`: core constants (planet stats, sign tables, sect, etc.)
  - `logic.ts`: chart generation, encounter flow, turn resolution, propagation, combustion
  - `types.ts`: shared types used by UI and logic
- **State**: persisted in `localStorage` via `src/components/useLocalStorage.ts`

### Interaction model

- Start a run using the single **Start Run** button (mints a new chart and begins the run)
- Hover a planet to reveal stats and aspects
- Click a planet to act
- Aspect lines appear on hover
- Affliction is shown directly beneath each planet label

## Run locally

From the repo root:

```bash
cd client
pnpm install
pnpm dev
```

Then open the URL printed by Vite (usually `http://localhost:5173`).

## Notes

- The client is a prototype focused on combat flow and chart readability.
- PvE house-level mechanics are not implemented.
- Charts are randomly generated (not real astronomical calculations).
