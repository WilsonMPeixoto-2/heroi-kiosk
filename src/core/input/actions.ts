export const ACTIONS = [
  'UP',
  'DOWN',
  'LEFT',
  'RIGHT',
  'CONFIRM',
  'CANCEL',
  'START',
  'SKIP',
  'CALIBRATE',
  'DEBUG'
] as const;

export type Action = (typeof ACTIONS)[number];

export type InputSource = 'keyboard' | 'gamepad' | 'unknown';

export interface RawInput {
  source: InputSource;
  detail: string;
}
