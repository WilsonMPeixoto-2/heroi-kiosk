export interface AudioSettings {
  muted: boolean;
  master: number;
  music: number;
  sfx: number;
}

export const AUDIO_SETTINGS_KEY = 'game.audio.v1';

const DEFAULT_SETTINGS: AudioSettings = {
  muted: false,
  master: 1,
  music: 0.34,
  sfx: 0.9
};

export function loadAudioSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(AUDIO_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;
    return {
      muted: parsed.muted ?? DEFAULT_SETTINGS.muted,
      master: clamp01(parsed.master ?? DEFAULT_SETTINGS.master),
      music: clamp01(parsed.music ?? DEFAULT_SETTINGS.music),
      sfx: clamp01(parsed.sfx ?? DEFAULT_SETTINGS.sfx)
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveAudioSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage may be unavailable in kiosk policies; ignore safely.
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

