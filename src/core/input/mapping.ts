import { ACTIONS, type Action } from './actions';

export interface ArcadeMapping {
  keyboard: Record<Action, string[]>;
  gamepadButtons: Record<Action, number[]>;
}

export const MAPPING_STORAGE_KEY = 'arcadeMapping.v1';

export function createDefaultMapping(): ArcadeMapping {
  return {
    keyboard: {
      UP: ['ArrowUp', 'KeyW'],
      DOWN: ['ArrowDown', 'KeyS'],
      LEFT: ['ArrowLeft', 'KeyA'],
      RIGHT: ['ArrowRight', 'KeyD'],
      CONFIRM: ['Enter', 'Space', 'KeyZ'],
      CANCEL: ['Escape', 'Backspace', 'KeyX'],
      START: ['Enter', 'NumpadEnter'],
      SKIP: ['KeyS'],
      CALIBRATE: ['F2'],
      DEBUG: ['F3']
    },
    gamepadButtons: {
      UP: [12],
      DOWN: [13],
      LEFT: [14],
      RIGHT: [15],
      CONFIRM: [0],
      CANCEL: [1],
      START: [9],
      SKIP: [2],
      CALIBRATE: [8],
      DEBUG: [16]
    }
  };
}

export function loadMapping(): ArcadeMapping {
  const fallback = createDefaultMapping();

  try {
    const raw = window.localStorage.getItem(MAPPING_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<ArcadeMapping>;
    if (!parsed.keyboard || !parsed.gamepadButtons) {
      return fallback;
    }

    ACTIONS.forEach((action) => {
      if (!Array.isArray(parsed.keyboard?.[action])) {
        parsed.keyboard![action] = fallback.keyboard[action];
      }
      if (!Array.isArray(parsed.gamepadButtons?.[action])) {
        parsed.gamepadButtons![action] = fallback.gamepadButtons[action];
      }
    });

    return parsed as ArcadeMapping;
  } catch {
    return fallback;
  }
}

export function saveMapping(mapping: ArcadeMapping): void {
  window.localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(mapping));
}

export function replaceActionMapping(
  mapping: ArcadeMapping,
  action: Action,
  entry: { source: 'keyboard'; code: string } | { source: 'gamepad'; button: number }
): ArcadeMapping {
  const clone: ArcadeMapping = {
    keyboard: { ...mapping.keyboard },
    gamepadButtons: { ...mapping.gamepadButtons }
  };

  if (entry.source === 'keyboard') {
    clone.keyboard[action] = [entry.code];
    return clone;
  }

  clone.gamepadButtons[action] = [entry.button];
  return clone;
}
