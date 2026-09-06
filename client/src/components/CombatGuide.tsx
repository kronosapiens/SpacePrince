import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { PLANETS } from "@/game/data";
import type { PlanetName, Polarity } from "@/game/types";
import { PLANET_PRIMARY } from "@/svg/palette";
import { CHART_SIZE } from "@/svg/viewbox";

export type CombatGuidePhase = "read" | "chart" | "act";

interface CombatGuideProps {
  open: boolean;
  phase: CombatGuidePhase;
  turn: { current: number; total: number };
  /** The encounter is over: the sentence slot holds the way out. */
  settled: boolean;
  ruler: PlanetName;
  rule: string;
  opponentPlanet: PlanetName | null;
  examplePlanet: PlanetName | null;
  /** The far end of one of the example planet's aspect lines, if it has any. */
  exampleAspect: PlanetName | null;
  selectedPlanet: PlanetName | null;
  pendingAction: Polarity | null;
  projectedLight: number | null;
  onOpen: () => void;
  onClose: () => void;
  onPhaseChange: (phase: CombatGuidePhase) => void;
}

type NotePlacement = "top" | "right" | "bottom" | "left";

interface GuideNote {
  key: string;
  /** The `data-guide` element the note points at. */
  anchor: string;
  /** What the veil lifts for this note; the anchor alone when unset. */
  spotlights?: string[];
  /** The side the note prefers. `outward` is for planets: above or below
   *  according to which half of its wheel the planet sits in, so the note
   *  leaves the wheel rather than crossing it. */
  placement: NotePlacement | "outward";
  label: string;
  body: ReactNode;
}

interface GuideRect {
  x: number;
  y: number;
  width: number;
  height: number;
  /** For a line element: its endpoints on screen. */
  line?: [Point, Point];
  /** For a capsule drawn along a line: its rotation about its centre. */
  angle?: number;
}

type Point = { x: number; y: number };

interface GuideSize {
  width: number;
  height: number;
}

const PHASE_LABEL: Record<CombatGuidePhase, string> = {
  read: "Read the encounter",
  chart: "Read the charts",
  act: "Choose an answer",
};

const NOTE_WIDTH = 320;
const NOTE_HEIGHT = 96; // until measured
const NOTE_GAP = 28;
const EDGE = 18;
/** Notes stay above the SELF/OTHER label row. */
const EDGE_BOTTOM = 60;
const AVOID_PAD = 8;
/** The close button, top-left, where the `?` was. */
const CLOSE_RECT: GuideRect = { x: 18, y: 14, width: 46, height: 46 };
/** Planet rings are sized in the chart's own units around the measured disc,
 *  not around the glyph's box — the halo and interaction ring breathe, and a
 *  ring that followed them would too. Past the invite halo (54) for a planet
 *  merely open; past the active halo at full breath and the afflict corona
 *  (both ~78) for one carrying a verb. */
const PLANET_REACH = 62;
const CORONA_REACH = 86;
/** The capsule traced along an aspect line: its breadth, and how far it runs
 *  past the line's ends. */
const ASPECT_BREADTH = 14;
const ASPECT_OVERRUN = 4;
/** One dash and one gap of the ring's stroke, in px (`.combat-guide-ring`).
 *  Each ring's pathLength is a whole number of periods, so the pattern closes
 *  on itself without a seam whatever the ring's size. */
const DASH_PERIOD = 8;
/** Corners: one small radius for every box, matching the notes; the panel's
 *  outline is concentric with its card (the card's 14px plus the padding). */
const BOX_RADIUS = 8;
const PANEL_PAD = 8;
const PANEL_RADIUS = 14 + PANEL_PAD;

const ORDER: Record<NotePlacement, NotePlacement[]> = {
  top: ["top", "bottom", "left", "right"],
  bottom: ["bottom", "top", "left", "right"],
  left: ["left", "right", "top", "bottom"],
  right: ["right", "left", "top", "bottom"],
};
const SIDE_VECTOR: Record<NotePlacement, [number, number]> = {
  top: [0, -1],
  bottom: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/** Sides ranked by how far they point from the wheel's centre through the
 *  planet, so a note leaves the wheel by the nearest edge and only crosses it
 *  as a last resort. */
function outwardOrder(from: { x: number; y: number }, to: { x: number; y: number }): NotePlacement[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return (Object.keys(SIDE_VECTOR) as NotePlacement[]).sort((a, b) => {
    const [ax, ay] = SIDE_VECTOR[a];
    const [bx, by] = SIDE_VECTOR[b];
    return (bx * dx + by * dy) / len - (ax * dx + ay * dy) / len;
  });
}

/** Whole wheels lift through the veil without a ring of their own — the
 *  wheel's outer ring is already the shape — and notes may sit over them. */
const WHEELS = ["wheel-self", "wheel-other"];
/** Every glyph on both wheels: never lit as a group, but notes keep off them
 *  whenever a clear side exists. */
const GLYPHS = (["self", "other"] as const).flatMap((side) => PLANETS.map((planet) => planetAnchor(side, planet)));

function planetAnchor(side: "self" | "other", planet: PlanetName) {
  return `planet-${side}-${planet.toLowerCase()}`;
}

function arcAnchor(side: "self" | "other", planet: PlanetName) {
  return `arc-${side}-${planet.toLowerCase()}`;
}

/** The drawn line between two planets — the chart draws each pair once, in
 *  name order. */
function aspectAnchor(side: "self" | "other", a: PlanetName, b: PlanetName) {
  const [first, second] = [a, b].sort();
  return `aspect-${side}-${first!.toLowerCase()}-${second!.toLowerCase()}`;
}

function isLift(id: string) {
  return WHEELS.includes(id);
}

function isRound(id: string) {
  return isLift(id) || /^(planet|arc)-(self|other)-/.test(id);
}

function wheelOf(id: string) {
  return `wheel-${id.split("-")[1]}`;
}

/** An element's box, widened to any `data-guide-part` descendants — the
 *  Light readout's projected gain hangs outside its parent's box. */
function measureRect(element: Element): GuideRect {
  const box = element.getBoundingClientRect();
  if (element instanceof SVGLineElement) {
    const ctm = element.getScreenCTM();
    if (ctm) {
      const at = (x: number, y: number) => {
        const p = new DOMPoint(x, y).matrixTransform(ctm);
        return { x: p.x, y: p.y };
      };
      const line: [Point, Point] = [
        at(element.x1.baseVal.value, element.y1.baseVal.value),
        at(element.x2.baseVal.value, element.y2.baseVal.value),
      ];
      return { x: box.x, y: box.y, width: box.width, height: box.height, line };
    }
  }
  let { x, y, right, bottom } = box;
  element.querySelectorAll("[data-guide-part]").forEach((part) => {
    const r = part.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    x = Math.min(x, r.x);
    y = Math.min(y, r.y);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  });
  return { x, y, width: right - x, height: bottom - y };
}

function useGuideRects(open: boolean, phase: CombatGuidePhase, ids: string[], revision: string) {
  const [rects, setRects] = useState<Record<string, GuideRect>>({});
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const signature = ids.join("|");

  useLayoutEffect(() => {
    if (!open) return;

    const elements = ids.flatMap((id) => {
      const element = document.querySelector<Element>(`[data-guide="${id}"]`);
      return element ? [[id, element] as const] : [];
    });

    const measure = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      setRects(Object.fromEntries(elements.map(([id, element]) => [id, measureRect(element)])));
    };

    measure();
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    elements.forEach(([, element]) => observer.observe(element));
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, phase, signature, revision]);

  return { rects, viewport };
}

function circleRect(c: { x: number; y: number }, r: number): GuideRect {
  return { x: c.x - r, y: c.y - r, width: r * 2, height: r * 2 };
}

/** A circle of `reach` chart units around a planet's disc. */
function planetCircle(id: string, reach: number, rects: Record<string, GuideRect>): GuideRect | null {
  const disc = rects[id];
  if (!disc) return null;
  const wheel = rects[wheelOf(id)];
  const scale = wheel ? wheel.width / CHART_SIZE : 1;
  return circleRect(center(disc), reach * scale);
}

/** An id of the form `a+b` names the box around both elements — the ruler
 *  and its rule sit too close for two boxes, and they are one thing. */
function rectOf(id: string, rects: Record<string, GuideRect>): GuideRect | null {
  const parts = id.split("+").flatMap((part) => (rects[part] ? [rects[part]] : []));
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0]!; // keeps a line's endpoints
  const x = Math.min(...parts.map((r) => r.x));
  const y = Math.min(...parts.map((r) => r.y));
  const right = Math.max(...parts.map((r) => r.x + r.width));
  const bottom = Math.max(...parts.map((r) => r.y + r.height));
  return { x, y, width: right - x, height: bottom - y };
}

function spotlightRect(
  id: string,
  rects: Record<string, GuideRect>,
  reachOf: (id: string) => number,
): GuideRect | null {
  const rect = rectOf(id, rects);
  if (!rect) return null;
  if (id.startsWith("planet-") && id !== "planet-panel") return planetCircle(id, reachOf(id), rects);

  // A capsule along an aspect line, centred on it and turned to its angle.
  if (id.startsWith("aspect-") && rect.line) {
    const [a, b] = rect.line;
    const length = Math.hypot(b.x - a.x, b.y - a.y) + 2 * ASPECT_OVERRUN;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    return {
      x: mx - length / 2,
      y: my - ASPECT_BREADTH / 2,
      width: length,
      height: ASPECT_BREADTH,
      angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
    };
  }

  // A planet's arc is a span of a circle around its glyph, and its own box
  // is just that span; the ring is the whole circle, centred on the glyph and
  // reaching the arc's far edge.
  if (id.startsWith("arc-")) {
    const glyph = rects[id.replace("arc-", "planet-")];
    const c = center(glyph ?? rect);
    const corners: [number, number][] = [
      [rect.x, rect.y],
      [rect.x + rect.width, rect.y],
      [rect.x, rect.y + rect.height],
      [rect.x + rect.width, rect.y + rect.height],
    ];
    const reach = Math.max(...corners.map(([x, y]) => Math.hypot(x - c.x, y - c.y)));
    return circleRect(c, Math.max(reach, glyph ? glyph.width / 2 : 0) + 8);
  }

  let padX = 6;
  let padY = 5;
  if (isLift(id)) {
    padX = 0;
    padY = 0;
  } else if (id === "planet-panel") {
    padX = PANEL_PAD;
    padY = PANEL_PAD;
  } else if (id === "turn" || id === "light") {
    padX = 8;
    padY = 6;
  } else if (id === "opponent-move") {
    // The sentence sits 12px under the readouts; its line box already holds
    // the descenders, so the box hugs it top and bottom to keep air between.
    padX = 8;
    padY = 0;
  }

  const box = {
    x: rect.x - padX,
    y: rect.y - padY,
    width: rect.width + padX * 2,
    height: rect.height + padY * 2,
  };
  return crispRect(box);
}

/** Planets and wheels are circles, an aspect's capsule is round-ended, and
 *  everything else a softly rounded box. */
function cornerRadius(id: string, rect: GuideRect) {
  if (isRound(id)) return Math.max(rect.width, rect.height) / 2;
  if (id.startsWith("aspect-")) return rect.height / 2;
  return id === "planet-panel" ? PANEL_RADIUS : BOX_RADIUS;
}

/** A turned shape's `transform`, about its own centre. */
function turnOf(rect: GuideRect) {
  if (!rect.angle) return undefined;
  const c = center(rect);
  return `rotate(${rect.angle} ${c.x} ${c.y})`;
}

/** The axis-aligned box a shape occupies, for keeping notes off it. */
function boundsOf(rect: GuideRect): GuideRect {
  if (!rect.angle) return rect;
  const c = center(rect);
  const rad = (rect.angle * Math.PI) / 180;
  const w = Math.abs(rect.width * Math.cos(rad)) + Math.abs(rect.height * Math.sin(rad));
  const h = Math.abs(rect.width * Math.sin(rad)) + Math.abs(rect.height * Math.cos(rad));
  return { x: c.x - w / 2, y: c.y - h / 2, width: w, height: h };
}

/** Put a box's edges on half pixels so its 1px stroke stays crisp. */
function crispRect(rect: GuideRect): GuideRect {
  return {
    x: Math.round(rect.x) + 0.5,
    y: Math.round(rect.y) + 0.5,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

/** The stroke's pathLength: the perimeter rounded to whole dash periods, so
 *  the pattern meets itself with no seam. */
function dashPathLength(rect: GuideRect, radius: number) {
  const straight = 2 * (rect.width + rect.height) - 8 * radius;
  const perimeter = straight + 2 * Math.PI * radius;
  return Math.max(1, Math.round(perimeter / DASH_PERIOD)) * DASH_PERIOD;
}

function center(rect: GuideRect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function intersects(a: GuideRect, b: GuideRect, pad: number) {
  return (
    a.x < b.x + b.width + pad &&
    a.x + a.width + pad > b.x &&
    a.y < b.y + b.height + pad &&
    a.y + a.height + pad > b.y
  );
}

function candidateRect(focus: GuideRect, placement: NotePlacement, size: GuideSize): GuideRect {
  const c = center(focus);
  let x = c.x - size.width / 2;
  let y = c.y - size.height / 2;
  if (placement === "top") y = focus.y - NOTE_GAP - size.height;
  if (placement === "bottom") y = focus.y + focus.height + NOTE_GAP;
  if (placement === "left") x = focus.x - NOTE_GAP - size.width;
  if (placement === "right") x = focus.x + focus.width + NOTE_GAP;
  return { x, y, ...size };
}

function inBounds(rect: GuideRect, viewport: GuideSize) {
  return (
    rect.x >= EDGE &&
    rect.y >= EDGE &&
    rect.x + rect.width <= viewport.width - EDGE &&
    rect.y + rect.height <= viewport.height - EDGE_BOTTOM
  );
}

function clampRect(rect: GuideRect, viewport: GuideSize): GuideRect {
  return {
    ...rect,
    x: Math.max(EDGE, Math.min(rect.x, viewport.width - rect.width - EDGE)),
    y: Math.max(EDGE, Math.min(rect.y, viewport.height - rect.height - EDGE_BOTTOM)),
  };
}

/** The first side, in order of preference, where the note fits the viewport
 *  and covers nothing: not what is lit or already placed (`hard`), and not a
 *  planet (`soft`). Each later pass gives something up — first the fit, by
 *  pushing the note back inside the viewport; then the planets, which the
 *  veil has not singled out; then everything but the note's own target; and
 *  at the last the preferred side is taken regardless. */
function placeNote(
  focus: GuideRect,
  order: NotePlacement[],
  size: GuideSize,
  viewport: GuideSize,
  hard: GuideRect[],
  soft: GuideRect[],
): { rect: GuideRect; side: NotePlacement } {
  const clearOf = (rect: GuideRect, obstacles: GuideRect[]) =>
    !intersects(rect, focus, 0) && !obstacles.some((other) => intersects(rect, other, AVOID_PAD));
  const passes: [GuideRect[], boolean][] = [
    [hard.concat(soft), false],
    [hard.concat(soft), true],
    [hard, false],
    [hard, true],
    [[], true],
  ];
  for (const [obstacles, clamp] of passes) {
    for (const side of order) {
      const rect = candidateRect(focus, side, size);
      if (clamp) {
        const clamped = clampRect(rect, viewport);
        if (clearOf(clamped, obstacles)) return { rect: clamped, side };
      } else if (inBounds(rect, viewport) && clearOf(rect, obstacles)) {
        return { rect, side };
      }
    }
  }
  const side = order[0]!;
  return { rect: clampRect(candidateRect(focus, side, size), viewport), side };
}

/** The midpoint of a box's side — for a circle, its pole on that side. */
function sideMidpoint(rect: GuideRect, side: NotePlacement): Point {
  const c = center(rect);
  if (side === "top") return { x: c.x, y: rect.y };
  if (side === "bottom") return { x: c.x, y: rect.y + rect.height };
  if (side === "left") return { x: rect.x, y: c.y };
  return { x: rect.x + rect.width, y: c.y };
}

const OPPOSITE: Record<NotePlacement, NotePlacement> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/** The leader leaves the middle of the target's side and enters the middle
 *  of the note's facing side: one straight line when the two align, else a
 *  right-angled route out, across and in, so a note the search had to push
 *  aside still reads as deliberately tied to its target. */
function routeLeader(focus: GuideRect, note: GuideRect, side: NotePlacement): Point[] {
  const from = sideMidpoint(focus, side);
  const to = sideMidpoint(note, OPPOSITE[side]);
  if (side === "left" || side === "right") {
    if (Math.abs(from.y - to.y) < 1) return [from, to];
    const mid = (from.x + to.x) / 2;
    return [from, { x: mid, y: from.y }, { x: mid, y: to.y }, to];
  }
  if (Math.abs(from.x - to.x) < 1) return [from, to];
  const mid = (from.y + to.y) / 2;
  return [from, { x: from.x, y: mid }, { x: to.x, y: mid }, to];
}

export function CombatGuide({
  open,
  phase,
  turn,
  settled,
  ruler,
  rule,
  opponentPlanet,
  examplePlanet,
  exampleAspect,
  selectedPlanet,
  pendingAction,
  projectedLight,
  onOpen,
  onClose,
  onPhaseChange,
}: CombatGuideProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const noteRefs = useRef<Record<string, HTMLElement | null>>({});
  const [sizes, setSizes] = useState<Record<string, GuideSize>>({});
  const [barRect, setBarRect] = useState<GuideRect | null>(null);
  const maskId = `combat-guide-mask-${useId().replace(/:/g, "")}`;
  const actingPlanet = selectedPlanet ?? examplePlanet;
  const canAct = examplePlanet !== null;
  // The charts first: what self and other are is the ground the turn's
  // readouts stand on.
  const phases: CombatGuidePhase[] = canAct ? ["chart", "read", "act"] : ["chart", "read"];
  const phaseIndex = phases.indexOf(phase);

  const notes = useMemo<GuideNote[]>(() => {
    if (phase === "read") {
      return [
        {
          key: "turn",
          anchor: "turn",
          placement: "left",
          label: "Turn",
          body: settled
            ? <>Every turn is answered.</>
            : <>You are answering turn {turn.current} of {turn.total}.</>,
        },
        {
          key: "light",
          anchor: "light",
          placement: "right",
          label: "Light",
          body: <>What this run carries forward. A previewed gain appears beside it.</>,
        },
        {
          key: "their-move",
          anchor: "opponent-move",
          placement: "bottom",
          label: settled ? "The way out" : "Their move",
          body: settled
            ? <>This encounter is settled. Nothing more is asked of you here.</>
            : <>The other acts first. Its planet, verb, and strength are already fixed.</>,
        },
        {
          key: "ruler",
          anchor: "ruler+rule",
          placement: "top",
          label: "The condition",
          body: <><span style={{ color: PLANET_PRIMARY[ruler] }}>{ruler}</span> rules this encounter. Light gathers from {rule}.</>,
        },
      ];
    }

    if (phase === "chart") {
      const chartNotes: GuideNote[] = [
        {
          key: "self",
          anchor: "label-self",
          spotlights: ["wheel-self", "label-self"],
          placement: "left",
          label: "Self",
          body: <>Your chart. Every breathing ring is a planet that can answer.</>,
        },
        {
          key: "other",
          anchor: "label-other",
          spotlights: ["wheel-other", "label-other"],
          placement: "right",
          label: "Other",
          body: <>Their chart. Your answer lands against the planet acting now.</>,
        },
      ];

      if (opponentPlanet) {
        chartNotes.push({
          key: "active-planet",
          anchor: planetAnchor("other", opponentPlanet),
          placement: "outward",
          label: "Acting planet",
          body: <>The turning corona names both the source and the kind of the incoming move.</>,
        });
      }

      if (examplePlanet) {
        chartNotes.push({
          key: "anatomy",
          anchor: arcAnchor("self", examplePlanet),
          spotlights: [
            arcAnchor("self", examplePlanet),
            ...(exampleAspect ? [aspectAnchor("self", examplePlanet, exampleAspect)] : []),
          ],
          placement: "outward",
          label: "Resolve and aspects",
          body: <>The thick arc is remaining Resolve. Lines carry effects onward; hard lines invert them.</>,
        });
      }

      return chartNotes;
    }

    if (!actingPlanet) return [];
    const actionName = pendingAction === "Affliction" ? "Afflict" : "Testify";
    return [
      {
        key: "example",
        anchor: planetAnchor("self", actingPlanet),
        spotlights: ["wheel-self", "wheel-other", planetAnchor("self", actingPlanet)],
        placement: "outward",
        label: "Choose a planet",
        body: <>{actingPlanet} is open as an example, not advice. Any living planet can answer.</>,
      },
      {
        key: "actions",
        anchor: "planet-panel",
        placement: "bottom",
        label: "Choose a verb",
        body: <>Testify relieves affliction. Afflict adds it. The first tap previews; the second commits in play.</>,
      },
      {
        key: "projection",
        anchor: "light",
        placement: "right",
        label: `${actionName} preview`,
        body: <>The charts now show the exact outcome. This answer would gather {projectedLight ?? 0} Light.</>,
      },
    ];
  }, [phase, turn, settled, ruler, rule, opponentPlanet, examplePlanet, exampleAspect, actingPlanet, pendingAction, projectedLight]);

  const spotlightIds = useMemo(
    () => Array.from(new Set(notes.flatMap((note) => note.spotlights ?? [note.anchor]))),
    [notes],
  );
  const ids = useMemo(() => {
    const wanted = new Set(
      [...spotlightIds, ...notes.map((note) => note.anchor)].flatMap((id) => id.split("+")).concat(WHEELS, GLYPHS),
    );
    // An arc's circle is centred on its glyph, so measure that too.
    Array.from(wanted).forEach((id) => {
      if (id.startsWith("arc-")) wanted.add(id.replace("arc-", "planet-"));
    });
    return Array.from(wanted);
  }, [notes, spotlightIds]);
  const { rects, viewport } = useGuideRects(open, phase, ids, `${pendingAction}:${projectedLight}`);

  // Notes are as tall as their copy; positions come from the rendered size.
  // The bar sits between the wheels, so its box is measured too and kept clear.
  useLayoutEffect(() => {
    if (!open) return;
    const next: Record<string, GuideSize> = {};
    let changed = false;
    for (const note of notes) {
      const element = noteRefs.current[note.key];
      if (!element) continue;
      const size = { width: element.offsetWidth, height: element.offsetHeight };
      next[note.key] = size;
      const prev = sizes[note.key];
      if (!prev || prev.width !== size.width || prev.height !== size.height) changed = true;
    }
    if (changed) setSizes(next);

    const bar = barRef.current?.getBoundingClientRect();
    if (bar) {
      const rect = { x: bar.x, y: bar.y, width: bar.width, height: bar.height };
      if (
        !barRect ||
        barRect.x !== rect.x || barRect.y !== rect.y ||
        barRect.width !== rect.width || barRect.height !== rect.height
      ) setBarRect(rect);
    }
  });

  const layout = useMemo(() => {
    // The other's acting planet always carries its corona; in the act phase
    // the example planet carries one too, for the verb being previewed.
    const actingId = opponentPlanet ? planetAnchor("other", opponentPlanet) : null;
    const reachOf = (id: string) => (id === actingId || phase === "act" ? CORONA_REACH : PLANET_REACH);
    const spots = spotlightIds.flatMap((id) => {
      const rect = spotlightRect(id, rects, reachOf);
      return rect ? [{ id, rect, lift: isLift(id) }] : [];
    });
    // The acting planet's corona is the incoming move; a note never covers
    // it, lit or not.
    const acting = actingId ? planetCircle(actingId, CORONA_REACH, rects) : null;
    const hard: GuideRect[] = [
      CLOSE_RECT,
      ...(barRect ? [barRect] : []),
      ...(acting ? [acting] : []),
      ...spots.filter((spot) => !spot.lift).map((spot) => boundsOf(spot.rect)),
    ];
    const soft = GLYPHS.flatMap((id) => {
      const rect = planetCircle(id, PLANET_REACH, rects);
      return rect ? [rect] : [];
    });
    const placed = notes.flatMap((note) => {
      const anchor = rectOf(note.anchor, rects);
      const focus = spotlightRect(note.anchor, rects, reachOf);
      if (!anchor || !focus) return [];
      const wheel = note.placement === "outward" ? rects[wheelOf(note.anchor)] : undefined;
      const order = wheel ? outwardOrder(center(wheel), center(anchor)) : ORDER[note.placement === "outward" ? "top" : note.placement];
      const size = sizes[note.key] ?? { width: NOTE_WIDTH, height: NOTE_HEIGHT };
      const { rect, side } = placeNote(focus, order, size, viewport, hard, soft);
      hard.push(rect);
      // A note the search had to drop onto its own target gets no leader.
      const leader = intersects(rect, focus, 0) ? null : routeLeader(focus, rect, side);
      return [{ note, rect, leader }];
    });
    return { spots, placed };
  }, [notes, spotlightIds, rects, sizes, viewport, opponentPlanet, phase, barRect]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      controlsRef.current?.querySelector<HTMLButtonElement>(".is-primary")?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(
        controlsRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
      );
      if (controls.length === 0) return;
      const current = controls.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.shiftKey
        ? (current <= 0 ? controls.length - 1 : current - 1)
        : (current === controls.length - 1 ? 0 : current + 1);
      event.preventDefault();
      controls[next]?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      requestAnimationFrame(() => triggerRef.current?.focus());
    };
  }, [open, onClose]);

  if (!open) {
    return (
      <button
        ref={triggerRef}
        type="button"
        className="screen-help-button"
        aria-label="Study this encounter"
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
      >
        ?
      </button>
    );
  }

  return createPortal(
    <div
      className="combat-guide-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={PHASE_LABEL[phase]}
    >
      <svg
        className="combat-guide-veil"
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect width={viewport.width} height={viewport.height} fill="white" />
            {layout.spots.map(({ id, rect }) => (
              <rect
                key={id}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                rx={cornerRadius(id, rect)}
                transform={turnOf(rect)}
                fill="black"
              />
            ))}
          </mask>
        </defs>
        <rect
          width={viewport.width}
          height={viewport.height}
          fill="rgba(11, 10, 15, 0.64)"
          mask={`url(#${maskId})`}
        />
        {layout.spots.filter((spot) => !spot.lift).map(({ id, rect }) => {
          const radius = cornerRadius(id, rect);
          return (
            <rect
              key={id}
              className="combat-guide-ring"
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              rx={radius}
              transform={turnOf(rect)}
              pathLength={dashPathLength(rect, radius)}
            />
          );
        })}
        {layout.placed.map(({ note, leader }) => leader && (
          <polyline
            key={note.key}
            className="combat-guide-leader"
            points={leader.map((p) => `${p.x},${p.y}`).join(" ")}
          />
        ))}
      </svg>

      <div className="combat-guide-notes" aria-live="polite">
        {layout.placed.map(({ note, rect }, index) => (
          <section
            key={note.key}
            ref={(element) => { noteRefs.current[note.key] = element; }}
            className="combat-guide-note"
            style={{ left: rect.x, top: rect.y, animationDelay: `${index * 55}ms` }}
          >
            <div className="combat-guide-note-label">{note.label}</div>
            <div className="combat-guide-note-body">{note.body}</div>
          </section>
        ))}
      </div>

      <div className="combat-guide-controls" ref={controlsRef}>
        <button type="button" className="combat-guide-close" onClick={onClose} aria-label="Close encounter guide">
          ×
        </button>

        <div className="combat-guide-dock">
          <section className="combat-guide-mobile-card" aria-live="polite">
            <div className="combat-guide-note-label">{PHASE_LABEL[phase]}</div>
            {notes.map((note) => (
              <div key={note.key} className="combat-guide-mobile-entry">
                <span>{note.label}</span>
                <div>{note.body}</div>
              </div>
            ))}
          </section>

          <div className="combat-guide-bar" ref={barRef}>
            <button
              type="button"
              className="combat-guide-step"
              onClick={() => onPhaseChange(phases[phaseIndex - 1]!)}
              disabled={phaseIndex <= 0}
            >
              Back
            </button>
            {phaseIndex === phases.length - 1 ? (
              <button type="button" className="combat-guide-step is-primary" onClick={onClose}>
                Close
              </button>
            ) : (
              <button
                type="button"
                className="combat-guide-step is-primary"
                onClick={() => onPhaseChange(phases[phaseIndex + 1]!)}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
