export interface BurstPreset {
  count: number;
  speed: number;
  lifeMs: number;
  spread: number;
  tint: number;
  glow: boolean;
}

export const BURST_PRESETS = {
  repairSuccess: {
    count: 30,
    speed: 220,
    lifeMs: 520,
    spread: 1.8,
    tint: 0x45cf78,
    glow: true
  } satisfies BurstPreset,
  repairFail: {
    count: 18,
    speed: 180,
    lifeMs: 380,
    spread: 2.3,
    tint: 0xfb6542,
    glow: false
  } satisfies BurstPreset,
  slotComplete: {
    count: 46,
    speed: 260,
    lifeMs: 740,
    spread: 2.8,
    tint: 0xf5cb5c,
    glow: true
  } satisfies BurstPreset,
  result: {
    count: 74,
    speed: 300,
    lifeMs: 980,
    spread: 3.14,
    tint: 0x2de2e6,
    glow: true
  } satisfies BurstPreset
};

