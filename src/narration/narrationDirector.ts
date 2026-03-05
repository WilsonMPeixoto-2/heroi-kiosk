import type { VariantTier } from '../content/schema';
import { CaptionEngine, type CaptionChannel } from './captionEngine';
import { loadNarrationSettings, nextNarrationMode, saveNarrationSettings, type NarrationMode, type NarrationSettings } from './settings';
import type { NarrationCue } from './script';
import { TtsEngine } from './ttsEngine';
import { getVoicesSafe, watchVoicesChanged } from './voiceCatalog';

type PlayOptions = {
  channels?: CaptionChannel[];
  durationMs?: number;
  interrupt?: boolean;
};

type VariantHook = (key: string, tier: VariantTier) => void;

export class NarrationDirector {
  private settings: NarrationSettings = loadNarrationSettings();
  private readonly tts = new TtsEngine();
  private readonly captions: CaptionEngine;
  private readonly onVariant: VariantHook | undefined;
  private disposeVoiceListener: (() => void) | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private startedByUserGesture = false;

  constructor(captions: CaptionEngine, onVariant?: VariantHook) {
    this.captions = captions;
    this.onVariant = onVariant;
    this.voices = getVoicesSafe().all;
    this.disposeVoiceListener = watchVoicesChanged((snapshot) => {
      this.voices = snapshot.all;
      if (!this.settings.voiceURI) {
        const fallback = snapshot.preferred[0] ?? null;
        this.settings.voiceURI = fallback?.voiceURI ?? null;
        this.persist();
      }
    });
  }

  getSettings(): NarrationSettings {
    return { ...this.settings };
  }

  getMode(): NarrationMode {
    return this.settings.mode;
  }

  markStartGesture(): void {
    this.startedByUserGesture = true;
  }

  cycleMode(): NarrationMode {
    this.settings.mode = nextNarrationMode(this.settings.mode);
    if (this.settings.mode === 'TTS' && !this.tts.isSupported()) {
      this.settings.mode = 'CAPTIONS_ONLY';
    }
    this.persist();
    return this.settings.mode;
  }

  setMode(mode: NarrationMode): void {
    this.settings.mode = mode;
    if (this.settings.mode === 'TTS' && !this.tts.isSupported()) {
      this.settings.mode = 'CAPTIONS_ONLY';
    }
    this.persist();
  }

  setMuted(muted: boolean): void {
    this.settings.muted = muted;
    this.persist();
  }

  toggleMuted(): boolean {
    this.settings.muted = !this.settings.muted;
    this.persist();
    return this.settings.muted;
  }

  setVoice(voiceURI: string | null): void {
    this.settings.voiceURI = voiceURI;
    this.persist();
  }

  getVoices(): SpeechSynthesisVoice[] {
    return [...this.voices];
  }

  interrupt(): void {
    this.tts.cancel();
    this.captions.clearAll();
  }

  skipCurrent(): void {
    this.interrupt();
  }

  async play(cue: NarrationCue | null, options: PlayOptions = {}): Promise<void> {
    if (!cue) {
      return;
    }
    if (options.interrupt) {
      this.interrupt();
    }

    if (cue.tier === 'rare' || cue.tier === 'legendary') {
      this.onVariant?.(cue.key, cue.tier);
    }

    if (this.settings.mode === 'OFF' || this.settings.muted) {
      return;
    }

    const channels = options.channels ?? ['player', 'spectator'];
    const durationMs = options.durationMs;
    channels.forEach((channel) => {
      this.captions.show(cue.text, { channel, durationMs });
    });

    if (this.settings.mode !== 'TTS') {
      return;
    }

    if (!this.startedByUserGesture || !this.tts.isSupported()) {
      return;
    }

    try {
      await this.tts.speakLine(cue.text, {
        voiceURI: this.settings.voiceURI,
        rate: this.settings.rate,
        pitch: this.settings.pitch,
        volume: this.settings.volume,
        onBoundary: (charIndex) => {
          this.captions.highlightBoundary(charIndex, 'player');
        }
      });
    } catch {
      // Falha de TTS não interrompe experiência kiosk.
    }
  }

  destroy(): void {
    this.interrupt();
    this.disposeVoiceListener?.();
    this.disposeVoiceListener = null;
    this.captions.destroy();
  }

  private persist(): void {
    saveNarrationSettings(this.settings);
  }
}
