import type { InputSnapshot } from './inputManager';

export class DiagnosticsOverlay {
  private readonly container: HTMLDivElement;
  private visible = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'diag-overlay';
    this.container.setAttribute('aria-live', 'polite');
    this.container.hidden = true;
    document.body.appendChild(this.container);
  }

  toggle(): void {
    this.visible = !this.visible;
    this.container.hidden = !this.visible;
  }

  update(snapshot: InputSnapshot): void {
    if (!this.visible) {
      return;
    }

    const actions = Array.from(snapshot.down.values());
    this.container.innerHTML = `
      <strong>Diagnóstico de Input</strong>
      <div>Fonte: ${snapshot.source}</div>
      <div>Último evento: ${snapshot.raw.detail}</div>
      <div>Ações ativas: ${actions.length > 0 ? actions.join(', ') : 'nenhuma'}</div>
    `;
  }
}
