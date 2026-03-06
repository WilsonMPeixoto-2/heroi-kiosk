import type { UiSfx } from './library';

export interface UiAudioBridge {
  playSfx(name: UiSfx): void;
}

export function playUiNavigationSound(bridge: UiAudioBridge, action: 'move' | 'confirm' | 'cancel'): void {
  if (action === 'move') {
    bridge.playSfx('move');
    return;
  }
  if (action === 'confirm') {
    bridge.playSfx('confirm');
    return;
  }
  bridge.playSfx('cancel');
}

