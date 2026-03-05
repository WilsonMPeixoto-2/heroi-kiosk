import { useEffect, useState } from 'preact/hooks';
import { gameStore, type GameStoreState } from '../core/store/gameStore';

export function useGameStore(): GameStoreState {
  const [snapshot, setSnapshot] = useState<GameStoreState>(() => gameStore.getSnapshot());

  useEffect(() => {
    return gameStore.subscribe(() => {
      setSnapshot(gameStore.getSnapshot());
    });
  }, []);

  return snapshot;
}

