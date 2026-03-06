import { Howler } from 'howler';

export async function unlockAudioContext(): Promise<boolean> {
  try {
    await Howler.ctx?.resume();
    return true;
  } catch {
    return false;
  }
}

