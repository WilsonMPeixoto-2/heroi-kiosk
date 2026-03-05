export class WakeLockController {
  private sentinel: WakeLockSentinel | null = null;

  async request(): Promise<boolean> {
    const wakeLock = navigator.wakeLock;
    if (!wakeLock) {
      return false;
    }

    try {
      this.sentinel = await wakeLock.request('screen');
      return true;
    } catch {
      this.sentinel = null;
      return false;
    }
  }

  async release(): Promise<void> {
    try {
      await this.sentinel?.release();
    } finally {
      this.sentinel = null;
    }
  }
}
