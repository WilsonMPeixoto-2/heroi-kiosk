type ToastLevel = 'info' | 'warn';

export class OverlayToasts {
  private readonly root: HTMLDivElement;

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'toast-stack';
    this.root.setAttribute('role', 'region');
    this.root.setAttribute('aria-label', 'Notificações do sistema');
    document.body.appendChild(this.root);
  }

  show(message: string, level: ToastLevel = 'info', durationMs = 3000): void {
    const node = document.createElement('div');
    node.className = `toast toast-${level}`;
    node.setAttribute('role', level === 'warn' ? 'alert' : 'status');
    node.setAttribute('aria-live', level === 'warn' ? 'assertive' : 'polite');
    node.setAttribute('aria-atomic', 'true');
    node.textContent = message;
    this.root.appendChild(node);

    window.setTimeout(() => {
      node.remove();
    }, durationMs);
  }
}
