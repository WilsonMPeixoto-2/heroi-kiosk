import type { Action, InputSource, RawInput } from './actions';
import { ACTIONS } from './actions';
import type { ArcadeMapping } from './mapping';
import { loadMapping } from './mapping';
import { GamepadProvider } from './providers/gamepad';
import { KeyboardProvider } from './providers/keyboard';

export interface InputSnapshot {
  down: Set<Action>;
  pressed: Set<Action>;
  raw: RawInput;
  source: InputSource;
}

export class InputManager {
  private mapping: ArcadeMapping;
  private readonly keyboardProvider = new KeyboardProvider();
  private readonly gamepadProvider = new GamepadProvider();
  private downActions = new Set<Action>();
  private pressedActions = new Set<Action>();
  private lastSource: InputSource = 'unknown';
  private lastRaw: RawInput = { source: 'unknown', detail: 'n/a' };

  constructor() {
    this.mapping = loadMapping();
  }

  boot(): void {
    this.keyboardProvider.attach();
  }

  dispose(): void {
    this.keyboardProvider.detach();
  }

  tick(): InputSnapshot {
    const keyboard = this.keyboardProvider.snapshot(this.mapping);
    const gamepad = this.gamepadProvider.snapshot(this.mapping);

    const down = new Set<Action>();

    ACTIONS.forEach((action) => {
      if (keyboard.actionsDown.has(action) || gamepad.actionsDown.has(action)) {
        down.add(action);
      }
    });

    const pressed = new Set<Action>();
    down.forEach((action) => {
      if (!this.downActions.has(action)) {
        pressed.add(action);
      }
    });

    this.downActions = down;
    this.pressedActions = pressed;

    if (pressed.size > 0) {
      if (keyboard.raw.source === 'keyboard') {
        this.lastSource = 'keyboard';
        this.lastRaw = keyboard.raw;
      } else if (gamepad.raw.source === 'gamepad') {
        this.lastSource = 'gamepad';
        this.lastRaw = gamepad.raw;
      }
    }

    return {
      down: this.downActions,
      pressed: this.pressedActions,
      raw: this.lastRaw,
      source: this.lastSource
    };
  }

  isDown(action: Action): boolean {
    return this.downActions.has(action);
  }

  wasPressed(action: Action): boolean {
    return this.pressedActions.has(action);
  }

  getRaw(): RawInput {
    return this.lastRaw;
  }

  getSource(): InputSource {
    return this.lastSource;
  }

  getMapping(): ArcadeMapping {
    return this.mapping;
  }

  replaceMapping(mapping: ArcadeMapping): void {
    this.mapping = mapping;
  }

  readAnyPressedGamepadButton(): number | null {
    return this.gamepadProvider.readAnyPressedButton();
  }
}
