import type { ScreenId, SpectatorPublicState } from '../types';

export interface GameStoreState {
  screenId: ScreenId;
  themeId: string;
  flags: {
    debug: boolean;
  };
  publicState: SpectatorPublicState | null;
}

type Listener = () => void;

const listeners = new Set<Listener>();

let state: GameStoreState = {
  screenId: 'ATTRACT',
  themeId: 'neon',
  flags: {
    debug: false
  },
  publicState: null
};

export const gameStore = {
  getSnapshot(): GameStoreState {
    return state;
  },
  setState(next: GameStoreState): void {
    state = next;
    emit();
  },
  setScreen(screenId: ScreenId): void {
    if (state.screenId === screenId) {
      return;
    }
    state = {
      ...state,
      screenId
    };
    emit();
  },
  patch(partial: Partial<GameStoreState>): void {
    state = {
      ...state,
      ...partial,
      flags: {
        ...state.flags,
        ...partial.flags
      }
    };
    emit();
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};

function emit(): void {
  listeners.forEach((listener) => listener());
}

