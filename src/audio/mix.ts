interface DuckingConfig {
  attackMs: number;
  holdMs: number;
  releaseMs: number;
  targetScale: number;
}

const DEFAULT_CONFIG: DuckingConfig = {
  attackMs: 120,
  holdMs: 720,
  releaseMs: 420,
  targetScale: 0.35
};

type FadeFn = (from: number, to: number, ms: number) => void;

export class MusicDucker {
  private restoreTimerId: number | null = null;
  private readonly config: DuckingConfig;

  constructor(config: Partial<DuckingConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
  }

  duck(currentVolume: number, baseVolume: number, fade: FadeFn): void {
    const target = Math.max(0.05, baseVolume * this.config.targetScale);
    fade(currentVolume, target, this.config.attackMs);
    this.clear();
    this.restoreTimerId = window.setTimeout(() => {
      this.restoreTimerId = null;
      fade(target, baseVolume, this.config.releaseMs);
    }, this.config.holdMs);
  }

  clear(): void {
    if (this.restoreTimerId !== null) {
      window.clearTimeout(this.restoreTimerId);
      this.restoreTimerId = null;
    }
  }
}

