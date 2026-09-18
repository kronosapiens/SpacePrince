// In map viewBox units; clears the current node's 55-unit halo at full breath.
export const MAP_PADDING = 60;

export const NODE_R = 22;

// Inner ring inside the house node's 22-unit disc.
export const HOUSE_BORDER = {
  rimR: 20,
  stroke: 1,
} as const;

export const HOUSE_COIN_GLOW = {
  radius: 32,
  core: 0.65,
  mid: 0.32,
} as const;

export const FORTUNE_STYLE = {
  stroke: HOUSE_BORDER.stroke,
} as const;
