type ToastLevel = 'info' | 'warn';

export class OverlayToasts {
  private readonly root: HTMLDivElement;

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'toast-stack';
    document.body.appendChild(this.root);
  }

  show(message: string, level: ToastLevel = 'info', durationMs = 3000): void {
    const node = document.createElement('div');
    node.className = `toast toast-${level}`;
    node.textContent = message;
    this.root.appendChild(node);

    window.setTimeout(() => {
      node.remove();
    }, durationMs);
  }
}
