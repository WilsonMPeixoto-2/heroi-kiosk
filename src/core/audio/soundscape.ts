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

const SOUND_CLASS: Record<UiSound, 'ui' | 'impact' | 'stinger'> = {
  click: 'ui',
  confirm: 'impact',
  cancel: 'impact',
  repairHit: 'impact',
  repairComplete: 'stinger',
  reward: 'stinger',
  result: 'stinger'
};

const BASE_VOLUME = {
  music: 0.3,
  sfx: 0.76,
  stinger: 0.95
} as const;

const DUCKING = {
  attackMs: 110,
  holdMs: 320,
  releaseMs: 420,
  scale: 0.35
} as const;

export class Soundscape {
  private readonly ui: Howl;
  private readonly ambient: Howl;
  private enabled = true;
  private ambientStarted = false;
  private ambientBaseVolume: number = BASE_VOLUME.music;
  private duckRestoreTimerId: number | null = null;

  constructor() {
    this.ui = new Howl({
      src: ['/assets/audio/ui-sprites.webm', '/assets/audio/ui-sprites.mp3', '/assets/audio/ui-sprites.wav'],
      sprite: UI_SPRITES,
      preload: true,
      volume: BASE_VOLUME.sfx
    });

    this.ambient = new Howl({
      src: ['/assets/audio/ambient-loop.webm', '/assets/audio/ambient-loop.mp3', '/assets/audio/ambient-loop.wav'],
      loop: true,
      preload: true,
      volume: BASE_VOLUME.music,
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
      this.clearDuckingTimer();
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

    const id = this.ui.play(name);
    const category = SOUND_CLASS[name];
    if (category === 'stinger') {
      this.ui.volume(BASE_VOLUME.stinger, id);
      this.duckAmbient(DUCKING.scale, DUCKING.holdMs + 160);
      return;
    }

    this.ui.volume(BASE_VOLUME.sfx, id);
    if (category === 'impact') {
      this.duckAmbient(0.52, DUCKING.holdMs);
    }
  }

  startAmbient(): void {
    if (!this.enabled || this.ambientStarted) {
      return;
    }

    this.ambient.volume(this.currentAmbientTargetVolume());
    this.ambient.play();
    this.ambientStarted = true;
  }

  stopAmbient(): void {
    if (!this.ambientStarted) {
      return;
    }

    this.clearDuckingTimer();
    this.ambient.stop();
    this.ambientStarted = false;
  }

  fadeAmbientTo(volume: number, ms = 500): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.ambientBaseVolume = clamped;
    if (!this.ambientStarted) {
      this.ambient.volume(this.currentAmbientTargetVolume());
      return;
    }

    this.ambient.fade(this.ambient.volume(), this.currentAmbientTargetVolume(), ms);
  }

  private duckAmbient(scale: number, holdMs: number): void {
    if (!this.ambientStarted) {
      return;
    }

    const clampedScale = Math.max(0.2, Math.min(0.9, scale));
    const duckTarget = Math.max(0.05, this.ambientBaseVolume * clampedScale);
    this.ambient.fade(this.ambient.volume(), duckTarget, DUCKING.attackMs);

    this.clearDuckingTimer();
    this.duckRestoreTimerId = window.setTimeout(() => {
      this.duckRestoreTimerId = null;
      if (!this.ambientStarted) {
        return;
      }
      this.ambient.fade(this.ambient.volume(), this.ambientBaseVolume, DUCKING.releaseMs);
    }, holdMs);
  }

  private currentAmbientTargetVolume(): number {
    return this.ambientBaseVolume;
  }

  private clearDuckingTimer(): void {
    if (this.duckRestoreTimerId !== null) {
      window.clearTimeout(this.duckRestoreTimerId);
      this.duckRestoreTimerId = null;
    }
  }
}
