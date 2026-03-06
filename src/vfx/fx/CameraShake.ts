import type { Container } from 'pixi.js';

export class CameraShake {
  private intensity = 0;
  private decayPerSecond = 3.2;
  private readonly baseX = 0;
  private readonly baseY = 0;
  private reducedMotion = false;

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  pulse(intensity: number): void {
    if (this.reducedMotion) {
      return;
    }
    this.intensity = Math.min(1.8, this.intensity + intensity);
  }

  tick(dtMs: number, target: Container): void {
    if (this.reducedMotion) {
      target.x = this.baseX;
      target.y = this.baseY;
      return;
    }
    const dt = dtMs / 1000;
    this.intensity = Math.max(0, this.intensity - this.decayPerSecond * dt);
    const jitter = this.intensity * 3.2;
    target.x = this.baseX + (Math.random() - 0.5) * jitter;
    target.y = this.baseY + (Math.random() - 0.5) * jitter;
  }
}

