import type { SpectatorPublicState } from './types';

const CHANNEL_NAME = 'jogo-heroi';

type BusMessage =
  | { type: 'SYNC'; payload: SpectatorPublicState }
  | { type: 'RESET' };

export class SpectatorBus {
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
    }
  }

  sync(payload: SpectatorPublicState): void {
    this.channel?.postMessage({ type: 'SYNC', payload } satisfies BusMessage);
  }

  reset(): void {
    this.channel?.postMessage({ type: 'RESET' } satisfies BusMessage);
  }

  static onMessage(handler: (message: BusMessage) => void): () => void {
    if (typeof BroadcastChannel === 'undefined') {
      return () => {};
    }

    const channel = new BroadcastChannel(CHANNEL_NAME);
    const listener = (event: MessageEvent<BusMessage>) => {
      handler(event.data);
    };
    channel.addEventListener('message', listener);

    return () => {
      channel.removeEventListener('message', listener);
      channel.close();
    };
  }
}
