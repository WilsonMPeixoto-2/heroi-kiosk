import { Hud } from './Hud';
import { ScreenHost } from './ScreenHost';

interface GameRootProps {
  screenId: string;
}

export function GameRoot({ screenId }: GameRootProps) {
  return (
    <div class="app-shell atmosphere">
      <header class="topbar panel">
        <div class="brand">
          <h1>HERÓI DO FUTURO</h1>
          <p>Experiência arcade para restaurar o Módulo dos Sonhos.</p>
        </div>
        <Hud />
      </header>

      <div class="main-grid" data-screen-id={screenId}>
        <aside class="panel bag" id="bagPanel" />
        <ScreenHost />
      </div>
    </div>
  );
}
