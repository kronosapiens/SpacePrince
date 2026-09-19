import { ACHIEVEMENTS, achievementBit, type Achievement } from "@/data/achievements";
import { NEUTRAL } from "@/svg/palette";
import { ACHIEVEMENT_STYLE as STYLE } from "@/svg/prince-style";

/** Circular placeholders with geometric glyphs. */
function AchievementGlyph({ achievement }: { achievement: Achievement }) {
  const variant = (achievement.id - 1) % 5;
  return (
    <g fill="none" strokeWidth={STYLE.stroke} strokeLinecap="round" strokeLinejoin="round">
      <circle r={STYLE.radius} stroke={NEUTRAL.gold} opacity={STYLE.outlineOpacity} />
      <g stroke={NEUTRAL.bone} opacity={STYLE.markOpacity}>
        {variant === 0 && <circle r="3" fill={NEUTRAL.bone} stroke="none" />}
        {variant === 1 && <><path d="M0 -10V10" /><circle cy="-10" r="2.5" fill={NEUTRAL.void} /><circle cy="10" r="2.5" fill={NEUTRAL.void} /></>}
        {variant === 2 && <><path d="M-9 5.2 0 -10.4 9 5.2Z" /><circle r="2" fill={NEUTRAL.bone} stroke="none" /></>}
        {variant === 3 && <><path d="M-8 -8 8 8M-8 8 8 -8" /><circle r="4" fill={NEUTRAL.void} /></>}
        {variant === 4 && <><circle r="7" /><path d="M0 -14V-10M0 10V14M-14 0H-10M10 0H14" /></>}
      </g>
    </g>
  );
}

export function AchievementMarks({ achievements }: { achievements: number }) {
  if (achievements === 0) return null;

  return (
    <g aria-label="Achievements">
      {ACHIEVEMENTS.map((achievement, index) => {
        if ((achievements & achievementBit(achievement.id)) === 0) return null;
        const x = 400 + (index % STYLE.columns - (STYLE.columns - 1) / 2) * STYLE.gap;
        const y = STYLE.top + Math.floor(index / STYLE.columns) * STYLE.gap;
        const description = `${achievement.category} · ${achievement.condition}`;
        return (
          <g
            key={achievement.id}
            className="achievement-mark"
            data-achievement={achievement.id}
            transform={`translate(${x} ${y}) scale(${STYLE.scale})`}
            role="img"
            aria-label={description}
            tabIndex={0}
          >
            <title>{description}</title>
            <circle r={STYLE.radius + 5} fill="transparent" />
            <AchievementGlyph achievement={achievement} />
          </g>
        );
      })}
    </g>
  );
}
