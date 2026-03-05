import type { RawInput } from '../actions';
import type { ArcadeMapping } from '../mapping';

export class KeyboardProvider {
  private readonly downCodes = new Set<string>();
  private lastRaw: RawInput = { source: 'unknown', detail: 'n/a' };
  private attached = false;

  private readonly onKeyDown = (event: KeyboardEvent) => {
    this.downCodes.add(event.code);
    this.lastRaw = { source: 'keyboard', detail: event.code };

    if (
      event.code === 'ArrowUp' ||
      event.code === 'ArrowDown' ||
      event.code === 'ArrowLeft' ||
      event.code === 'ArrowRight' ||
      event.code === 'Space'
    ) {
      event.preventDefault();
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.downCodes.delete(event.code);
  };

  attach(): void {
    if (this.attached) {
      return;
    }

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.attached = true;
  }

  detach(): void {
    if (!this.attached) {
      return;
    }

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.attached = false;
  }

  snapshot(mapping: ArcadeMapping): { actionsDown: Set<string>; raw: RawInput } {
    const actionsDown = new Set<string>();

    Object.entries(mapping.keyboard).forEach(([action, codes]) => {
      if (codes.some((code) => this.downCodes.has(code))) {
        actionsDown.add(action);
      }
    });

    return {
      actionsDown,
      raw: this.lastRaw
    };
  }
}
