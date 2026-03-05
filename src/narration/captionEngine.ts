import type { CaptionOverlay } from '../ui/captionsOverlay';

export type CaptionChannel = 'player' | 'spectator';

type ShowOptions = {
  channel: CaptionChannel;
  durationMs?: number;
};

type CaptionEngineOptions = {
  playerOverlay: CaptionOverlay;
  spectatorOverlay?: CaptionOverlay;
  onSpectatorForward?: (text: string, durationMs?: number) => void;
  onSpectatorClear?: () => void;
};

export class CaptionEngine {
  private readonly playerOverlay: CaptionOverlay;
  private readonly spectatorOverlay: CaptionOverlay | undefined;
  private readonly onSpectatorForward: ((text: string, durationMs?: number) => void) | undefined;
  private readonly onSpectatorClear: (() => void) | undefined;
  private readonly timers: Partial<Record<CaptionChannel, number>> = {};

  constructor(options: CaptionEngineOptions) {
    this.playerOverlay = options.playerOverlay;
    this.spectatorOverlay = options.spectatorOverlay;
    this.onSpectatorForward = options.onSpectatorForward;
    this.onSpectatorClear = options.onSpectatorClear;
  }

  show(text: string, options: ShowOptions): void {
    const target = this.overlayByChannel(options.channel);
    target?.show(text);

    if (options.channel === 'spectator') {
      this.onSpectatorForward?.(text, options.durationMs);
    }

    this.resetTimer(options.channel, options.durationMs);
  }

  clear(channel: CaptionChannel): void {
    const target = this.overlayByChannel(channel);
    target?.clear();
    if (channel === 'spectator') {
      this.onSpectatorClear?.();
    }
    this.clearTimer(channel);
  }

  clearAll(): void {
    this.clear('player');
    this.clear('spectator');
  }

  highlightBoundary(index: number, channel: CaptionChannel = 'player'): void {
    const target = this.overlayByChannel(channel);
    target?.highlightBoundary(index);
  }

  destroy(): void {
    this.clearAll();
    this.playerOverlay.destroy();
    this.spectatorOverlay?.destroy();
  }

  private overlayByChannel(channel: CaptionChannel): CaptionOverlay | null {
    if (channel === 'player') {
      return this.playerOverlay;
    }
    return this.spectatorOverlay ?? null;
  }

  private resetTimer(channel: CaptionChannel, durationMs?: number): void {
    this.clearTimer(channel);
    if (!durationMs || durationMs <= 0) {
      return;
    }

    const id = window.setTimeout(() => {
      this.clear(channel);
    }, durationMs);
    this.timers[channel] = id;
  }

  private clearTimer(channel: CaptionChannel): void {
    const id = this.timers[channel];
    if (id !== undefined) {
      window.clearTimeout(id);
      delete this.timers[channel];
    }
  }
}
