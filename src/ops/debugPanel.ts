import type { SessionMetrics } from './metrics';
import type { OpsDashboardSnapshot } from './metrics';

export interface OpsDebugPanelOptions {
  getSnapshot: () => OpsDashboardSnapshot;
  onExportJson: () => void;
  onExportSummaryCsv: () => void;
  onExportEventsCsv: () => void;
  onResetMetrics: () => void;
}

export class OpsDebugPanel {
  private readonly root: HTMLDivElement;
  private readonly content: HTMLDivElement;
  private readonly options: OpsDebugPanelOptions;
  private open = false;
  private refreshIntervalId: number | null = null;

  constructor(options: OpsDebugPanelOptions) {
    this.options = options;
    this.root = document.createElement('div');
    this.root.className = 'ops-debug-panel';
    this.root.hidden = true;

    const head = document.createElement('div');
    head.className = 'ops-debug-head';
    head.innerHTML = `
      <h3>Painel Debug (OPS)</h3>
      <small>F3 ou segure D por 1s</small>
    `;

    this.content = document.createElement('div');
    this.content.className = 'ops-debug-content';

    const actions = document.createElement('div');
    actions.className = 'ops-debug-actions';
    actions.innerHTML = `
      <button type="button" class="mini-btn" data-ops="json">Exportar JSON</button>
      <button type="button" class="mini-btn" data-ops="summary">Exportar CSV (summary)</button>
      <button type="button" class="mini-btn" data-ops="events">Exportar CSV (events)</button>
      <button type="button" class="mini-btn warning" data-ops="reset">Reset Metrics</button>
    `;

    actions.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-ops]');
      if (!button) {
        return;
      }
      const action = button.dataset.ops;
      if (action === 'json') {
        this.options.onExportJson();
      } else if (action === 'summary') {
        this.options.onExportSummaryCsv();
      } else if (action === 'events') {
        this.options.onExportEventsCsv();
      } else if (action === 'reset') {
        this.options.onResetMetrics();
        this.refresh();
      }
    });

    this.root.append(head, this.content, actions);
    document.body.append(this.root);
  }

  toggle(): void {
    this.setOpen(!this.open);
  }

  setOpen(next: boolean): void {
    this.open = next;
    this.root.hidden = !next;
    if (next) {
      this.refresh();
      this.startRefreshTimer();
    } else {
      this.stopRefreshTimer();
    }
  }

  isOpen(): boolean {
    return this.open;
  }

  refresh(): void {
    const snapshot = this.options.getSnapshot();
    const toolkitTop = topEntries(snapshot.current.toolkitChoices, 5)
      .map((entry) => `<li><strong>${entry.key}</strong>: ${entry.count}</li>`)
      .join('');

    const recent = snapshot.recentSessions
      .slice(0, 4)
      .map((session) => `<li>${summarizeSession(session)}</li>`)
      .join('');

    const screenTable = Object.entries(snapshot.current.screenTimeMs)
      .map(([screen, ms]) => `<li>${screen}: ${Math.round(ms)}ms (${formatMs(ms)})</li>`)
      .join('');

    this.content.innerHTML = `
      <article>
        <small>Sessão Atual</small>
        <strong>${snapshot.current.sessionId}</strong>
        <p>Runs: ${snapshot.current.runsTotal} | Resets: ${snapshot.current.resetsTotal}</p>
      </article>
      <article>
        <small>Entradas por tela</small>
        <ul>
          <li>ATTRACT: ${snapshot.current.screenEntries.ATTRACT}</li>
          <li>INTRO: ${snapshot.current.screenEntries.INTRO}</li>
          <li>AVATAR: ${snapshot.current.screenEntries.AVATAR}</li>
          <li>TOOLKIT: ${snapshot.current.screenEntries.TOOLKIT}</li>
          <li>REPAIR: ${snapshot.current.screenEntries.REPAIR}</li>
          <li>RESULT: ${snapshot.current.screenEntries.RESULT}</li>
        </ul>
      </article>
      <article>
        <small>Tempo por tela</small>
        <ul>${screenTable}</ul>
      </article>
      <article>
        <small>Input Sources</small>
        <ul>
          <li>Keyboard: ${snapshot.current.inputSourceCounts.keyboard}</li>
          <li>Gamepad: ${snapshot.current.inputSourceCounts.gamepad}</li>
          <li>Pointer: ${snapshot.current.inputSourceCounts.pointer}</li>
          <li>Unknown: ${snapshot.current.inputSourceCounts.unknown}</li>
        </ul>
      </article>
      <article>
        <small>Falhas & Remap</small>
        <ul>
          <li>Remap usado: ${snapshot.current.remapUsedCount}</li>
          <li>Popup bloqueado: ${snapshot.current.popupBlockedCount}</li>
          <li>Fullscreen falhou: ${snapshot.current.fullscreenFailCount}</li>
          <li>Wake lock falhou: ${snapshot.current.wakeLockFailCount}</li>
        </ul>
      </article>
      <article>
        <small>Repair Stats</small>
        <ul>
          <li>Tempo: ${formatMs(snapshot.current.repairStats.timeMsTotal)}</li>
          <li>Slots completos: ${snapshot.current.repairStats.slotsCompletedTotal}</li>
          <li>Wins (full/partial/timeout): ${snapshot.current.repairStats.fullWins}/${snapshot.current.repairStats.partialWins}/${snapshot.current.repairStats.timeoutWins}</li>
          <li>Combo máximo: x${snapshot.current.repairStats.maxComboEver}</li>
          <li>Hits/Misses: ${snapshot.current.repairStats.hits}/${snapshot.current.repairStats.misses}</li>
        </ul>
      </article>
      <article>
        <small>Ferramentas mais usadas</small>
        <ul>${toolkitTop || '<li>Sem dados.</li>'}</ul>
      </article>
      <article>
        <small>Totais (sessões carregadas)</small>
        <ul>
          <li>Sessões: ${snapshot.totals.sessionsStored}</li>
          <li>Runs: ${snapshot.totals.runsTotal}</li>
          <li>Resets: ${snapshot.totals.resetsTotal}</li>
          <li>Remap: ${snapshot.totals.remapUsedCount}</li>
          <li>Falhas popup/full/wake: ${snapshot.totals.popupBlockedCount}/${snapshot.totals.fullscreenFailCount}/${snapshot.totals.wakeLockFailCount}</li>
        </ul>
      </article>
      <article>
        <small>Últimas sessões</small>
        <ul>${recent || '<li>Nenhuma sessão finalizada ainda.</li>'}</ul>
      </article>
    `;
  }

  destroy(): void {
    this.stopRefreshTimer();
    this.root.remove();
  }

  private startRefreshTimer(): void {
    if (this.refreshIntervalId !== null) {
      return;
    }
    this.refreshIntervalId = window.setInterval(() => this.refresh(), 800);
  }

  private stopRefreshTimer(): void {
    if (this.refreshIntervalId !== null) {
      window.clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = null;
    }
  }
}

function topEntries(map: Record<string, number>, maxItems: number): Array<{ key: string; count: number }> {
  return Object.entries(map)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxItems);
}

function formatMs(ms: number): string {
  const safe = Math.max(0, Math.round(ms));
  const minutes = Math.floor(safe / 60_000);
  const seconds = Math.floor((safe % 60_000) / 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function summarizeSession(session: SessionMetrics): string {
  return `${session.sessionId} | runs ${session.runsTotal} | reset ${session.resetsTotal} | combo x${session.repairStats.maxComboEver}`;
}
