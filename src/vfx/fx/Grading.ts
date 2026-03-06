import { ColorMatrixFilter } from 'pixi.js';

export class Grading {
  readonly filter: ColorMatrixFilter;
  private progress = 0;

  constructor() {
    this.filter = new ColorMatrixFilter();
    this.apply();
  }

  setRestorationProgress(p01: number): void {
    this.progress = Math.max(0, Math.min(1, p01));
    this.apply();
  }

  private apply(): void {
    this.filter.reset();
    const saturateValue = 0.2 + this.progress * 0.9;
    const contrastValue = 0.75 + this.progress * 0.3;
    const brightnessValue = 0.82 + this.progress * 0.2;
    this.filter.saturate(saturateValue, false);
    this.filter.contrast(contrastValue, false);
    this.filter.brightness(brightnessValue, false);
  }
}

