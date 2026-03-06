export type UiSfx = 'move' | 'click' | 'confirm' | 'cancel' | 'repairHit' | 'repairComplete' | 'reward' | 'result';
export type StingerName = 'start' | 'slotComplete' | 'resultFull' | 'resultPartial' | 'resultTimeout';
export type MusicTheme = 'ambient';

export const UI_SPRITES: Record<UiSfx, [number, number]> = {
  move: [0, 110],
  click: [120, 120],
  confirm: [260, 190],
  cancel: [490, 260],
  repairHit: [840, 220],
  repairComplete: [1140, 320],
  reward: [1560, 390],
  result: [2060, 470]
};

export const STINGER_TO_SFX: Record<StingerName, UiSfx> = {
  start: 'confirm',
  slotComplete: 'repairComplete',
  resultFull: 'result',
  resultPartial: 'repairComplete',
  resultTimeout: 'cancel'
};

export const AUDIO_FILES = {
  uiSprite: ['/assets/audio/ui-sprites.webm', '/assets/audio/ui-sprites.mp3', '/assets/audio/ui-sprites.wav'],
  ambient: ['/assets/audio/ambient-loop.webm', '/assets/audio/ambient-loop.mp3', '/assets/audio/ambient-loop.wav']
} as const;

