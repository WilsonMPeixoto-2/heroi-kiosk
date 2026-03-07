import { useEffect, useState } from 'preact/hooks';
import { gameStore, type GameStoreState } from '../core/store/gameStore';

export function useGameStore(): GameStoreState {
  const [snapshot, setSnapshot] = useState<GameStoreState>(() => gameStore.getSnapshot());

  useEffect(() => {
    const sync = () => {
      setSnapshot(gameStore.getSnapshot());
    };
    const unsubscribe = gameStore.subscribe(sync);
    // Capture updates that may happen between initial render and subscription setup.
    sync();
    return unsubscribe;
  }, []);

  return snapshot;
}

