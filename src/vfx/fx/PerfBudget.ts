export type QualityTier = 'HIGH' | 'MED' | 'LOW';

export class PerfBudget {
  private avgFps = 60;
  private readonly smoothing = 0.08;

  update(dtMs: number): void {
    if (dtMs <= 0) {
      return;
    }
    const fps = 1000 / dtMs;
    this.avgFps = this.avgFps + (fps - this.avgFps) * this.smoothing;
  }

  get qualityTier(): QualityTier {
    if (this.avgFps >= 54) return 'HIGH';
    if (this.avgFps >= 44) return 'MED';
    return 'LOW';
  }

  get avgFpsValue(): number {
    return this.avgFps;
  }
}

