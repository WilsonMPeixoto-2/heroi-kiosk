export class IdleController {
  private readonly idleMs: number;
  private readonly onIdle: () => void;
  private timeoutId: number | null = null;

  constructor(idleMs: number, onIdle: () => void) {
    this.idleMs = idleMs;
    this.onIdle = onIdle;
  }

  touch(): void {
    this.stop();
    this.timeoutId = window.setTimeout(() => {
      this.onIdle();
    }, this.idleMs);
  }

  stop(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
