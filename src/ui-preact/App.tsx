import { GameRoot } from './GameRoot';
import { useGameStore } from './useGameStore';

export function App() {
  const snapshot = useGameStore();
  return <GameRoot screenId={snapshot.screenId} />;
}
