import { pickPreferredVoice } from './voiceCatalog';

export interface SpeakLineOptions {
  voiceURI: string | null;
  rate: number;
  pitch: number;
  volume: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
  onBoundary?: (charIndex: number) => void;
}

export class TtsEngine {
  private readonly supported: boolean;
  private readonly synth: SpeechSynthesis | null;

  constructor() {
    this.supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    this.synth = this.supported ? window.speechSynthesis : null;
  }

  isSupported(): boolean {
    return this.supported;
  }

  speakLine(text: string, options: SpeakLineOptions): Promise<void> {
    const synth = this.synth;
    if (!synth || !this.supported || !text.trim()) {
      options.onEnd?.();
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = pickPreferredVoice(synth.getVoices(), options.voiceURI);

        if (voice) {
          utterance.voice = voice;
        }

        utterance.rate = clamp(options.rate, 0.6, 1.6, 1);
        utterance.pitch = clamp(options.pitch, 0.5, 1.5, 1);
        utterance.volume = clamp(options.volume, 0, 1, 1);
        utterance.lang = voice?.lang ?? 'pt-BR';

        utterance.onstart = () => {
          options.onStart?.();
        };
        utterance.onend = () => {
          options.onEnd?.();
          resolve();
        };
        utterance.onerror = (event) => {
          const message = event.error ?? 'unknown';
          options.onError?.(message);
          reject(new Error(message));
        };
        utterance.onboundary = (event) => {
          options.onBoundary?.(event.charIndex);
        };

        synth.cancel();
        synth.speak(utterance);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'tts_speak_failed';
        options.onError?.(message);
        reject(error instanceof Error ? error : new Error(message));
      }
    });
  }

  cancel(): void {
    this.synth?.cancel();
  }

  pause(): void {
    this.synth?.pause();
  }

  resume(): void {
    this.synth?.resume();
  }
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, value));
}
