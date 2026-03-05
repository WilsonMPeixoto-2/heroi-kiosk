import { AudioGate } from './audioGate';
import { requestFullscreenSafe } from './fullscreen';
import type { OverlayToasts } from './overlays';
import { SpectatorWindowController } from './spectator';
import { WakeLockController } from './wakeLock';

export interface StartSessionOptions {
  fullscreen: boolean;
  spectator: boolean;
  wakeLock: boolean;
}

export interface StartSessionResult {
  fullscreenReady: boolean;
  audioReady: boolean;
  spectatorOpened: boolean;
  popupBlocked: boolean;
  wakeLockReady: boolean;
}

export class StartOrchestrator {
  private readonly toasts: OverlayToasts;
  readonly audio = new AudioGate();
  readonly spectator = new SpectatorWindowController();
  readonly wakeLock = new WakeLockController();

  constructor(toasts: OverlayToasts) {
    this.toasts = toasts;
  }

  async startSession(options: StartSessionOptions): Promise<StartSessionResult> {
    const result: StartSessionResult = {
      fullscreenReady: false,
      audioReady: false,
      spectatorOpened: false,
      popupBlocked: false,
      wakeLockReady: false
    };

    if (options.fullscreen) {
      result.fullscreenReady = await requestFullscreenSafe();
      if (!result.fullscreenReady) {
        this.toasts.show('Não foi possível entrar em tela cheia. A missão continua normalmente.', 'warn');
      }
    }

    result.audioReady = await this.audio.initOnUserGesture();

    if (options.spectator) {
      const spectator = this.spectator.open();
      result.spectatorOpened = spectator.opened;
      result.popupBlocked = spectator.popupBlocked;

      if (spectator.popupBlocked) {
        this.toasts.show('Pop-up bloqueado. Use o botão "Abrir Tela do Público".', 'warn', 4200);
      }
    }

    if (options.wakeLock) {
      result.wakeLockReady = await this.wakeLock.request();
    }

    return result;
  }
}
