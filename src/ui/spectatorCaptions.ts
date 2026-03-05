import type { CaptionOverlay } from './captionsOverlay';

export function createSpectatorCaptionsOverlay(host: HTMLElement): CaptionOverlay {
  const node = document.createElement('div');
  node.className = 'captions-overlay captions-spectator';
  node.setAttribute('aria-live', 'polite');
  node.setAttribute('aria-atomic', 'true');
  node.hidden = true;
  host.appendChild(node);

  return {
    show(text: string): void {
      node.textContent = text;
      node.hidden = !text.trim();
      node.classList.remove('is-highlight');
    },
    clear(): void {
      node.hidden = true;
      node.textContent = '';
      node.classList.remove('is-highlight');
    },
    highlightBoundary(index: number): void {
      node.dataset.boundary = String(index);
      node.classList.add('is-highlight');
    },
    destroy(): void {
      node.remove();
    }
  };
}
