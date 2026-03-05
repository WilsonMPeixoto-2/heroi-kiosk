import type { ScreenId } from '../core/types';

export interface TimerTickResult {
  screen: ScreenId;
  deltaMs: number;
}

export class ScreenTimer {
  private activeScreen: ScreenId | null = null;
  private lastTickMs: number | null = null;

  setActive(screen: ScreenId, nowMs: number): ScreenId | null {
    const previous = this.activeScreen;
    this.activeScreen = screen;
    this.lastTickMs = nowMs;
    return previous;
  }

  getActive(): ScreenId | null {
    return this.activeScreen;
  }

  tick(nowMs: number, bucket: Record<ScreenId, number>): TimerTickResult | null {
    if (!this.activeScreen || this.lastTickMs === null) {
      return null;
    }

    const deltaMs = Math.max(0, nowMs - this.lastTickMs);
    if (deltaMs <= 0) {
      return null;
    }

    bucket[this.activeScreen] = (bucket[this.activeScreen] ?? 0) + deltaMs;
    this.lastTickMs = nowMs;
    return {
      screen: this.activeScreen,
      deltaMs
    };
  }

  clear(): void {
    this.activeScreen = null;
    this.lastTickMs = null;
  }
}
