import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type GuidePlacement = "top" | "right" | "bottom" | "left";

export interface GuidePoint {
  x: number;
  y: number;
}

export interface GuideRect {
  x: number;
  y: number;
  width: number;
  height: number;
  /** For a line element: its endpoints on screen. */
  line?: [GuidePoint, GuidePoint];
  /** For a capsule drawn along a line: its rotation about its centre. */
  angle?: number;
}

export type GuideRects = Record<string, GuideRect>;

export interface GuideNote {
  key: string;
  /** The `data-guide` element the note points at. */
  anchor: string;
  /** What the veil lifts for this note; the anchor alone when unset. */
  spotlights?: string[];
  /** The side the note prefers. `outward` leans away from the point
   *  `shapes.outwardFrom` names, so the note leaves the shape it belongs to
   *  rather than crossing it. */
  placement: GuidePlacement | "outward";
  label: string;
  body: ReactNode;
}

/** A lit shape: its box, its corner radius (half the larger side for a circle),
 *  and whether the veil lifts it without a ring. */
export interface GuideShape {
  rect: GuideRect;
  radius: number;
  lift?: boolean;
}

export interface GuideShapes {
  /** Ids to measure beyond what the notes name — obstacles, or centres other
   *  shapes need. */
  measure?: string[];
  /** The lit shape for an id when it isn't the default padded box; `undefined`
   *  falls through to the default. */
  shape?: (id: string, rects: GuideRects) => GuideShape | undefined;
  /** What notes keep off besides the lit shapes, the dock and the close button:
   *  `hard` always, `soft` while a clear side exists. */
  obstacles?: (rects: GuideRects) => { hard?: GuideRect[]; soft?: GuideRect[] };
  /** For `outward` notes: the point the note should move away from; `undefined`
   *  falls back to the `top` order. */
  outwardFrom?: (anchor: string, rects: GuideRects) => GuidePoint | undefined;
}

export interface GuideOverlayProps<P extends string> {
  open: boolean;
  phase: P;
  phases: P[];
  phaseLabel: Record<P, string>;
  notes: GuideNote[];
  shapes?: GuideShapes;
  /** Re-measure when this changes: state the elements reflect that no id names. */
  revision?: string;
  /** aria-label for the `?` trigger. */
  openLabel: string;
  /** aria-label for the close button. */
  closeLabel: string;
  onOpen: () => void;
  onClose: () => void;
  onPhaseChange: (phase: P) => void;
}

interface GuideSize {
  width: number;
  height: number;
}

const NOTE_WIDTH = 320;
const NOTE_HEIGHT = 96; // until measured
const NOTE_GAP = 28;
const EDGE = 18;
/** Notes stay well off the bottom, where a screen keeps its own labels. */
const EDGE_BOTTOM = 60;
const AVOID_PAD = 8;
/** One dash and one gap of the ring's stroke, in px (`.guide-ring`).
 *  Each ring's pathLength is a whole number of periods, so the pattern closes
 *  on itself without a seam whatever the ring's size. */
const DASH_PERIOD = 8;
/** Corners: one small radius for every box, matching the notes. */
export const BOX_RADIUS = 8;

const ORDER: Record<GuidePlacement, GuidePlacement[]> = {
  top: ["top", "bottom", "left", "right"],
  bottom: ["bottom", "top", "left", "right"],
  left: ["left", "right", "top", "bottom"],
  right: ["right", "left", "top", "bottom"],
};
const SIDE_VECTOR: Record<GuidePlacement, [number, number]> = {
  top: [0, -1],
  bottom: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/** Sides ranked by how far they point from `from` through `to`, so a note
 *  leaves by the nearest edge and only crosses back as a last resort. */
function outwardOrder(from: GuidePoint, to: GuidePoint): GuidePlacement[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return (Object.keys(SIDE_VECTOR) as GuidePlacement[]).sort((a, b) => {
    const [ax, ay] = SIDE_VECTOR[a];
    const [bx, by] = SIDE_VECTOR[b];
    return (bx * dx + by * dy) / len - (ax * dx + ay * dy) / len;
  });
}

/** An element's box, widened to any `data-guide-part` descendants — a readout's
 *  projected gain hangs outside its parent's box. */
function measureRect(element: Element): GuideRect {
  const box = element.getBoundingClientRect();
  if (element instanceof SVGLineElement) {
    const ctm = element.getScreenCTM();
    if (ctm) {
      const at = (x: number, y: number) => {
        const p = new DOMPoint(x, y).matrixTransform(ctm);
        return { x: p.x, y: p.y };
      };
      const line: [GuidePoint, GuidePoint] = [
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

function useGuideRects(open: boolean, phase: string, ids: string[], revision: string) {
  const [rects, setRects] = useState<GuideRects>({});
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

export function circleRect(c: GuidePoint, r: number): GuideRect {
  return { x: c.x - r, y: c.y - r, width: r * 2, height: r * 2 };
}

/** An id of the form `a+b` names the box around both elements — two things that
 *  sit too close for two boxes, and are one thing. */
export function rectOf(id: string, rects: GuideRects): GuideRect | null {
  const parts = id.split("+").flatMap((part) => (rects[part] ? [rects[part]] : []));
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0]!; // keeps a line's endpoints
  const x = Math.min(...parts.map((r) => r.x));
  const y = Math.min(...parts.map((r) => r.y));
  const right = Math.max(...parts.map((r) => r.x + r.width));
  const bottom = Math.max(...parts.map((r) => r.y + r.height));
  return { x, y, width: right - x, height: bottom - y };
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
export function crispRect(rect: GuideRect): GuideRect {
  return {
    x: Math.round(rect.x) + 0.5,
    y: Math.round(rect.y) + 0.5,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

/** The default shape: a padded, crisp box with the shared radius. */
export function boxShape(rect: GuideRect, padX = 6, padY = 5, radius = BOX_RADIUS): GuideShape {
  return {
    rect: crispRect({
      x: rect.x - padX,
      y: rect.y - padY,
      width: rect.width + padX * 2,
      height: rect.height + padY * 2,
    }),
    radius,
  };
}

/** The stroke's pathLength: the perimeter rounded to whole dash periods, so
 *  the pattern meets itself with no seam. */
function dashPathLength(rect: GuideRect, radius: number) {
  const straight = 2 * (rect.width + rect.height) - 8 * radius;
  const perimeter = straight + 2 * Math.PI * radius;
  return Math.max(1, Math.round(perimeter / DASH_PERIOD)) * DASH_PERIOD;
}

export function center(rect: GuideRect): GuidePoint {
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

function candidateRect(focus: GuideRect, placement: GuidePlacement, size: GuideSize): GuideRect {
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
 *  soft obstacle. Each later pass gives something up — first the fit, by
 *  pushing the note back inside the viewport; then the soft obstacles, which
 *  the veil has not singled out; then everything but the note's own target; and
 *  at the last the preferred side is taken regardless. */
function placeNote(
  focus: GuideRect,
  order: GuidePlacement[],
  size: GuideSize,
  viewport: GuideSize,
  hard: GuideRect[],
  soft: GuideRect[],
): { rect: GuideRect; side: GuidePlacement } {
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
function sideMidpoint(rect: GuideRect, side: GuidePlacement): GuidePoint {
  const c = center(rect);
  if (side === "top") return { x: c.x, y: rect.y };
  if (side === "bottom") return { x: c.x, y: rect.y + rect.height };
  if (side === "left") return { x: rect.x, y: c.y };
  return { x: rect.x + rect.width, y: c.y };
}

const OPPOSITE: Record<GuidePlacement, GuidePlacement> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/** The leader leaves the middle of the target's side and enters the middle
 *  of the note's facing side: one straight line when the two align, else a
 *  right-angled route out, across and in, so a note the search had to push
 *  aside still reads as deliberately tied to its target. */
function routeLeader(focus: GuideRect, note: GuideRect, side: GuidePlacement): GuidePoint[] {
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

export function GuideOverlay<P extends string>({
  open,
  phase,
  phases,
  phaseLabel,
  notes,
  shapes,
  revision = "",
  openLabel,
  closeLabel,
  onOpen,
  onClose,
  onPhaseChange,
}: GuideOverlayProps<P>): ReactElement {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const noteRefs = useRef<Record<string, HTMLElement | null>>({});
  const [sizes, setSizes] = useState<Record<string, GuideSize>>({});
  const [barRect, setBarRect] = useState<GuideRect | null>(null);
  const maskId = `guide-mask-${useId().replace(/:/g, "")}`;
  const phaseIndex = phases.indexOf(phase);

  const litIds = useMemo(
    () => Array.from(new Set(notes.flatMap((note) => note.spotlights ?? [note.anchor]))),
    [notes],
  );
  const ids = useMemo(
    () =>
      Array.from(
        new Set(
          [...litIds, ...notes.map((note) => note.anchor)]
            .flatMap((id) => id.split("+"))
            .concat(shapes?.measure ?? []),
        ),
      ),
    [notes, litIds, shapes],
  );
  const { rects, viewport } = useGuideRects(open, phase, ids, revision);

  // Notes are as tall as their copy; positions come from the rendered size.
  // The bar sits over the screen top-left, so its box is measured too and
  // kept clear.
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
    const shapeOf = (id: string): GuideShape | null => {
      const custom = shapes?.shape?.(id, rects);
      if (custom) return custom;
      const rect = rectOf(id, rects);
      return rect ? boxShape(rect) : null;
    };
    const spots = litIds.flatMap((id) => {
      const shape = shapeOf(id);
      return shape ? [{ id, ...shape }] : [];
    });
    const extra = shapes?.obstacles?.(rects);
    const hard: GuideRect[] = [
      ...(barRect ? [barRect] : []),
      ...(extra?.hard ?? []),
      ...spots.filter((spot) => !spot.lift).map((spot) => boundsOf(spot.rect)),
    ];
    const soft = extra?.soft ?? [];
    const placed = notes.flatMap((note) => {
      const anchor = rectOf(note.anchor, rects);
      const focus = shapeOf(note.anchor);
      if (!anchor || !focus) return [];
      const from = note.placement === "outward" ? shapes?.outwardFrom?.(note.anchor, rects) : undefined;
      const order = from ? outwardOrder(from, center(anchor)) : ORDER[note.placement === "outward" ? "top" : note.placement];
      const size = sizes[note.key] ?? { width: NOTE_WIDTH, height: NOTE_HEIGHT };
      const { rect, side } = placeNote(focus.rect, order, size, viewport, hard, soft);
      hard.push(rect);
      // A note the search had to drop onto its own target gets no leader.
      const leader = intersects(rect, focus.rect, 0) ? null : routeLeader(focus.rect, rect, side);
      return [{ note, rect, leader }];
    });
    return { spots, placed };
  }, [notes, litIds, rects, sizes, viewport, shapes, barRect]);

  useEffect(() => {
    if (!open) return;
    // Focus lands on the bar itself, not a button: a button focused by
    // script wears its keyboard ring, and the pill would open with one on.
    const frame = requestAnimationFrame(() => barRef.current?.focus());

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
        aria-label={openLabel}
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
      className="guide-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={phaseLabel[phase]}
    >
      <svg
        className="guide-veil"
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect width={viewport.width} height={viewport.height} fill="white" />
            {layout.spots.map(({ id, rect, radius }) => (
              <rect
                key={id}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                rx={radius}
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
        {layout.spots.filter((spot) => !spot.lift).map(({ id, rect, radius }) => (
          <rect
            key={id}
            className="guide-ring"
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            rx={radius}
            transform={turnOf(rect)}
            pathLength={dashPathLength(rect, radius)}
          />
        ))}
        {layout.placed.map(({ note, leader }) => leader && (
          <polyline
            key={note.key}
            className="guide-leader"
            points={leader.map((p) => `${p.x},${p.y}`).join(" ")}
          />
        ))}
      </svg>

      <div className="guide-notes" aria-live="polite">
        {layout.placed.map(({ note, rect }, index) => (
          <section
            key={note.key}
            ref={(element) => { noteRefs.current[note.key] = element; }}
            className="guide-note"
            style={{ left: rect.x, top: rect.y, animationDelay: `${index * 55}ms` }}
          >
            <div className="guide-note-label">{note.label}</div>
            <div className="guide-note-body">{note.body}</div>
          </section>
        ))}
      </div>

      <div className="guide-controls" ref={controlsRef}>
        {/* Where the `?` was, opened out: the way out, then back and forward,
            one pill. */}
        <div className="guide-bar" ref={barRef} tabIndex={-1}>
          <button type="button" className="guide-close" onClick={onClose} aria-label={closeLabel}>
            ×
          </button>
          <button
            type="button"
            className="guide-step"
            onClick={() => onPhaseChange(phases[phaseIndex - 1]!)}
            disabled={phaseIndex <= 0}
          >
            Back
          </button>
          {phaseIndex === phases.length - 1 ? (
            <button type="button" className="guide-step is-primary" onClick={onClose}>
              Close
            </button>
          ) : (
            <button
              type="button"
              className="guide-step is-primary"
              onClick={() => onPhaseChange(phases[phaseIndex + 1]!)}
            >
              Next
            </button>
          )}
        </div>

        <section className="guide-mobile-card" aria-live="polite">
          <div className="guide-note-label">{phaseLabel[phase]}</div>
          {notes.map((note) => (
            <div key={note.key} className="guide-mobile-entry">
              <span>{note.label}</span>
              <div>{note.body}</div>
            </div>
          ))}
        </section>
      </div>
    </div>,
    document.body,
  );
}
