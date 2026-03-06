import { Howl, Howler } from 'howler';
import { AUDIO_FILES, STINGER_TO_SFX, UI_SPRITES, type MusicTheme, type StingerName, type UiSfx } from './library';
import { MusicDucker } from './mix';
import { loadAudioSettings, saveAudioSettings, type AudioSettings } from './settings';
import { unlockAudioContext } from './unlock';

type LegacySound = 'click' | 'confirm' | 'cancel' | 'repairHit' | 'repairComplete' | 'reward' | 'result';

export class AudioDirector {
  private readonly uiSprite: Howl;
  private readonly music: Howl;
  private readonly ducker = new MusicDucker();
  private settings: AudioSettings;
  private initialized = false;
  private musicPlaying = false;

  constructor() {
    this.settings = loadAudioSettings();

    this.uiSprite = new Howl({
      src: [...AUDIO_FILES.uiSprite],
      sprite: UI_SPRITES,
      preload: true,
      volume: this.settings.sfx
    });

    this.music = new Howl({
      src: [...AUDIO_FILES.ambient],
      preload: false,
      loop: true,
      html5: false,
      volume: this.settings.music
    });

    this.applySettings();
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.applySettings();
  }

  async unlockOnStartGesture(): Promise<boolean> {
    const unlocked = await unlockAudioContext();
    this.music.load();
    return unlocked;
  }

  async activate(): Promise<void> {
    this.init();
    await this.unlockOnStartGesture();
    if (!this.settings.muted) {
      this.startAmbient();
    }
  }

  setEnabled(enabled: boolean): void {
    this.setMuted(!enabled);
  }

  isEnabled(): boolean {
    return !this.settings.muted;
  }

  setMuted(muted: boolean): void {
    this.settings.muted = muted;
    this.applySettings();
    this.persist();
    if (muted) {
      this.stopMusic(120);
    } else {
      this.playMusic('ambient', 180);
    }
  }

  setMasterVolume(value: number): void {
    this.settings.master = clamp01(value);
    this.applySettings();
    this.persist();
  }

  setMusicVolume(value: number): void {
    this.settings.music = clamp01(value);
    this.applySettings();
    this.persist();
  }

  setSfxVolume(value: number): void {
    this.settings.sfx = clamp01(value);
    this.uiSprite.volume(this.settings.sfx);
    this.persist();
  }

  playMusic(_theme: MusicTheme = 'ambient', fadeMs = 350): void {
    if (this.settings.muted) return;
    if (!this.musicPlaying) {
      this.music.play();
      this.musicPlaying = true;
    }
    const target = this.settings.music;
    this.music.fade(this.music.volume(), target, fadeMs);
  }

  stopMusic(fadeMs = 280): void {
    if (!this.musicPlaying) return;
    const current = this.music.volume();
    this.music.fade(current, 0, fadeMs);
    window.setTimeout(() => {
      this.music.stop();
      this.musicPlaying = false;
      this.music.volume(this.settings.music);
    }, fadeMs + 12);
  }

  playSfx(name: UiSfx): void {
    if (this.settings.muted) return;
    this.uiSprite.volume(this.settings.sfx);
    this.uiSprite.play(name);
  }

  playStinger(name: StingerName): void {
    if (this.settings.muted) return;
    const sfxName = STINGER_TO_SFX[name];
    this.playSfx(sfxName);
    if (this.musicPlaying) {
      this.ducker.duck(this.music.volume(), this.settings.music, (from, to, ms) => this.music.fade(from, to, ms));
    }
  }

  // Backward compatibility with existing gameplay calls.
  play(name: LegacySound): void {
    if (name === 'repairComplete' || name === 'reward' || name === 'result') {
      const stinger = name === 'result' ? 'resultFull' : name === 'reward' ? 'slotComplete' : 'resultPartial';
      this.playStinger(stinger);
      return;
    }
    const map: Record<LegacySound, UiSfx> = {
      click: 'click',
      confirm: 'confirm',
      cancel: 'cancel',
      repairHit: 'repairHit',
      repairComplete: 'repairComplete',
      reward: 'reward',
      result: 'result'
    };
    this.playSfx(map[name]);
  }

  startAmbient(): void {
    this.playMusic('ambient', 200);
  }

  stopAmbient(): void {
    this.stopMusic(150);
    this.ducker.clear();
  }

  fadeAmbientTo(volume: number, ms = 500): void {
    this.settings.music = clamp01(volume);
    this.persist();
    if (!this.musicPlaying) {
      this.music.volume(this.settings.music);
      return;
    }
    this.music.fade(this.music.volume(), this.settings.music, ms);
  }

  private applySettings(): void {
    Howler.mute(this.settings.muted);
    Howler.volume(this.settings.master);
    this.music.volume(this.settings.music);
    this.uiSprite.volume(this.settings.sfx);
  }

  private persist(): void {
    saveAudioSettings(this.settings);
  }
}

export class Soundscape extends AudioDirector {}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
