export type NarrationMode = 'OFF' | 'CAPTIONS_ONLY' | 'TTS';

export interface NarrationSettings {
  mode: NarrationMode;
  voiceURI: string | null;
  rate: number;
  pitch: number;
  volume: number;
  muted: boolean;
}

const STORAGE_KEY = 'game.narration.v1';
const MODES: NarrationMode[] = ['OFF', 'CAPTIONS_ONLY', 'TTS'];

const DEFAULT_SETTINGS: NarrationSettings = {
  mode: 'CAPTIONS_ONLY',
  voiceURI: null,
  rate: 1,
  pitch: 1,
  volume: 1,
  muted: false
};

export function loadNarrationSettings(): NarrationSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }

    const parsed = JSON.parse(raw) as Partial<NarrationSettings>;
    return {
      mode: isNarrationMode(parsed.mode) ? parsed.mode : DEFAULT_SETTINGS.mode,
      voiceURI: typeof parsed.voiceURI === 'string' && parsed.voiceURI.trim().length > 0 ? parsed.voiceURI : null,
      rate: clampNumber(parsed.rate, 0.6, 1.6, DEFAULT_SETTINGS.rate),
      pitch: clampNumber(parsed.pitch, 0.5, 1.5, DEFAULT_SETTINGS.pitch),
      volume: clampNumber(parsed.volume, 0, 1, DEFAULT_SETTINGS.volume),
      muted: typeof parsed.muted === 'boolean' ? parsed.muted : DEFAULT_SETTINGS.muted
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveNarrationSettings(settings: NarrationSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Persistência opcional; ignorar falhas de quota para não interromper o kiosk.
  }
}

export function nextNarrationMode(mode: NarrationMode): NarrationMode {
  const index = MODES.indexOf(mode);
  const next = (index + 1) % MODES.length;
  return MODES[next] ?? MODES[0];
}

export function narrationModeLabel(mode: NarrationMode): string {
  if (mode === 'OFF') {
    return 'Narração: OFF';
  }
  if (mode === 'CAPTIONS_ONLY') {
    return 'Narração: Legendas';
  }
  return 'Narração: TTS';
}

function isNarrationMode(value: unknown): value is NarrationMode {
  return value === 'OFF' || value === 'CAPTIONS_ONLY' || value === 'TTS';
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}
