import type { RawInput } from '../actions';
import type { ArcadeMapping } from '../mapping';

export class GamepadProvider {
  private readonly previousButtons = new Map<string, boolean[]>();
  private lastRaw: RawInput = { source: 'unknown', detail: 'n/a' };

  snapshot(mapping: ArcadeMapping): { actionsDown: Set<string>; raw: RawInput } {
    const actionsDown = new Set<string>();
    const pads = navigator.getGamepads?.() ?? [];

    Array.from(pads)
      .filter((pad): pad is Gamepad => Boolean(pad))
      .forEach((pad) => {
        const key = `${pad.index}:${pad.id}`;
        const prev = this.previousButtons.get(key) ?? new Array<boolean>(pad.buttons.length).fill(false);

        Object.entries(mapping.gamepadButtons).forEach(([action, mappedButtons]) => {
          if (mappedButtons.some((buttonIndex) => Boolean(pad.buttons[buttonIndex]?.pressed))) {
            actionsDown.add(action);
          }
        });

        // Axis fallback for directional movement.
        if (pad.axes[1] < -0.5) actionsDown.add('UP');
        if (pad.axes[1] > 0.5) actionsDown.add('DOWN');
        if (pad.axes[0] < -0.5) actionsDown.add('LEFT');
        if (pad.axes[0] > 0.5) actionsDown.add('RIGHT');

        pad.buttons.forEach((button, index) => {
          const wasPressed = prev[index] ?? false;
          if (button.pressed && !wasPressed) {
            this.lastRaw = {
              source: 'gamepad',
              detail: `g${pad.index} b${index} (${pad.id.slice(0, 26)})`
            };
          }
          prev[index] = button.pressed;
        });

        this.previousButtons.set(key, prev);
      });

    return {
      actionsDown,
      raw: this.lastRaw
    };
  }

  readAnyPressedButton(): number | null {
    const pads = navigator.getGamepads?.() ?? [];
    for (const pad of Array.from(pads)) {
      if (!pad) continue;
      for (let index = 0; index < pad.buttons.length; index += 1) {
        if (pad.buttons[index]?.pressed) {
          return index;
        }
      }
    }

    return null;
  }
}
