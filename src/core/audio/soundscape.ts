import { Howl, Howler } from 'howler';

type UiSound =
  | 'click'
  | 'confirm'
  | 'cancel'
  | 'repairHit'
  | 'repairComplete'
  | 'reward'
  | 'result';

const UI_SPRITES: Record<UiSound, [number, number]> = {
  click: [0, 140],
  confirm: [220, 200],
  cancel: [500, 260],
  repairHit: [840, 220],
  repairComplete: [1140, 320],
  reward: [1560, 390],
  result: [2060, 470]
};

export class Soundscape {
  private readonly ui: Howl;
  private readonly ambient: Howl;
  private enabled = true;
  private ambientStarted = false;

  constructor() {
    this.ui = new Howl({
      src: ['/assets/audio/ui-sprites.wav'],
      sprite: UI_SPRITES,
      preload: true,
      volume: 0.75
    });

    this.ambient = new Howl({
      src: ['/assets/audio/ambient-loop.wav'],
      loop: true,
      preload: true,
      volume: 0.3,
      html5: false
    });
  }

  async activate(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      await Howler.ctx?.resume();
    } catch {
      // Keep soft-fail behavior for kiosk reliability.
    }

    this.startAmbient();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    Howler.mute(!enabled);

    if (!enabled) {
      this.stopAmbient();
      return;
    }

    this.startAmbient();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  play(name: UiSound): void {
    if (!this.enabled) {
      return;
    }

    this.ui.play(name);
  }

  startAmbient(): void {
    if (!this.enabled || this.ambientStarted) {
      return;
    }

    this.ambient.play();
    this.ambientStarted = true;
  }

  stopAmbient(): void {
    if (!this.ambientStarted) {
      return;
    }

    this.ambient.stop();
    this.ambientStarted = false;
  }

  fadeAmbientTo(volume: number, ms = 500): void {
    const clamped = Math.max(0, Math.min(1, volume));
    if (!this.ambientStarted) {
      this.ambient.volume(clamped);
      return;
    }

    this.ambient.fade(this.ambient.volume(), clamped, ms);
  }
}
