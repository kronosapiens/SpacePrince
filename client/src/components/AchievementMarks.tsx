import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, achievementBit, type Achievement } from "@/data/achievements";
import { NEUTRAL } from "@/svg/palette";
import { ACHIEVEMENT_SLOTS, ACHIEVEMENT_STYLE as STYLE } from "@/svg/prince-style";

const SLOTS_PER_CATEGORY = ACHIEVEMENT_SLOTS.length / ACHIEVEMENT_CATEGORIES.length;

// Each category fills its own run of slots in list order.
const SLOT_ACHIEVEMENTS: (Achievement | undefined)[] = [];
for (const achievement of ACHIEVEMENTS) {
  const region = ACHIEVEMENT_CATEGORIES.indexOf(achievement.category);
  const rank = ACHIEVEMENTS.filter((a) => a.category === achievement.category).indexOf(achievement);
  SLOT_ACHIEVEMENTS[region * SLOTS_PER_CATEGORY + rank] = achievement;
}

/** Circular placeholders with geometric glyphs. */
function AchievementGlyph({ variant }: { variant: number }) {
  variant %= 5;
  return (
    <g fill="none" stroke={NEUTRAL.bone} strokeWidth={STYLE.stroke} strokeLinecap="round" strokeLinejoin="round" opacity={STYLE.markOpacity}>
      {variant === 0 && <circle r="3" fill={NEUTRAL.bone} stroke="none" />}
      {variant === 1 && <><path d="M0 -10V10" /><circle cy="-10" r="2.5" fill={NEUTRAL.void} /><circle cy="10" r="2.5" fill={NEUTRAL.void} /></>}
      {variant === 2 && <><path d="M-9 5.2 0 -10.4 9 5.2Z" /><circle r="2" fill={NEUTRAL.bone} stroke="none" /></>}
      {variant === 3 && <><path d="M-8 -8 8 8M-8 8 8 -8" /><circle r="4" fill={NEUTRAL.void} /></>}
      {variant === 4 && <><circle r="7" /><path d="M0 -14V-10M0 10V14M-14 0H-10M10 0H14" /></>}
    </g>
  );
}

/** Every slot draws: gold with its glyph once earned, an empty mist ring until then.
 *  `draft` treats every assigned achievement as earned until earning is implemented. */
export function AchievementMarks({ achievements, draft = false }: { achievements: number; draft?: boolean }) {
  return (
    <g fill="none" aria-label="Achievements">
      {ACHIEVEMENT_SLOTS.map(([x, y], index) => {
        const achievement = SLOT_ACHIEVEMENTS[index];
        const earned = !!achievement && (draft || (achievements & achievementBit(achievement.id)) !== 0);
        return (
          <g key={index} transform={`translate(${x} ${y}) scale(${STYLE.scale})`}>
            <circle
              r={STYLE.radius}
              stroke={earned ? NEUTRAL.gold : NEUTRAL.mist}
              strokeWidth={STYLE.stroke}
              opacity={earned ? STYLE.outlineOpacity : STYLE.emptyOpacity}
            />
            {earned && <AchievementGlyph variant={achievement.id - 1} />}
          </g>
        );
      })}
    </g>
  );
}
