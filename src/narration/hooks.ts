import { createSeededRng } from '../content/copy';
import type { ScreenId } from '../core/types';
import { NarrationDirector } from './narrationDirector';
import {
  cueForRepairAlreadyStable,
  cueForRepairCombo,
  cueForRepairHit,
  cueForRepairNeedTool,
  cueForRepairTimeout,
  cueForResult,
  cueForScreen,
  cueForSlotComplete,
  cueForSpectatorProgress,
  type NarrationCue
} from './script';

type ResultType = 'full' | 'partial' | 'timeout';

export interface NarrationHooks {
  onScreenEnter(screen: ScreenId): Promise<void>;
  onRepairNeedTool(): Promise<NarrationCue>;
  onRepairAlreadyStable(slotName: string): Promise<NarrationCue>;
  onRepairHit(success: boolean): Promise<NarrationCue>;
  onSlotComplete(slotId: string): Promise<NarrationCue>;
  onCombo(combo: number): Promise<NarrationCue>;
  onRepairTimeout(): Promise<NarrationCue>;
  onResult(type: ResultType): Promise<NarrationCue>;
  onSpectatorProgress(progress01: number): Promise<void>;
}

export function createNarrationHooks(director: NarrationDirector, seed: string): NarrationHooks {
  const rng = createSeededRng(seed);

  return {
    async onScreenEnter(screen: ScreenId): Promise<void> {
      await director.play(cueForScreen(screen, rng), {
        channels: ['player', 'spectator'],
        interrupt: true,
        durationMs: 4600
      });
    },
    async onRepairNeedTool(): Promise<NarrationCue> {
      const cue = cueForRepairNeedTool(rng);
      await director.play(cue, { channels: ['player', 'spectator'], durationMs: 2200 });
      return cue;
    },
    async onRepairAlreadyStable(slotName: string): Promise<NarrationCue> {
      const cue = cueForRepairAlreadyStable(slotName, rng);
      await director.play(cue, { channels: ['player', 'spectator'], durationMs: 2200 });
      return cue;
    },
    async onRepairHit(success: boolean): Promise<NarrationCue> {
      const cue = cueForRepairHit(success, rng);
      await director.play(cue, { channels: ['player', 'spectator'], durationMs: 1800 });
      return cue;
    },
    async onSlotComplete(slotId: string): Promise<NarrationCue> {
      const cue = cueForSlotComplete(slotId, rng);
      await director.play(cue, { channels: ['player', 'spectator'], durationMs: 2600 });
      return cue;
    },
    async onCombo(combo: number): Promise<NarrationCue> {
      const cue = cueForRepairCombo(combo, rng);
      await director.play(cue, { channels: ['player', 'spectator'], durationMs: 2200 });
      return cue;
    },
    async onRepairTimeout(): Promise<NarrationCue> {
      const cue = cueForRepairTimeout(rng);
      await director.play(cue, { channels: ['player', 'spectator'], durationMs: 3000 });
      return cue;
    },
    async onResult(type: ResultType): Promise<NarrationCue> {
      const cue = cueForResult(type, rng);
      await director.play(cue, { channels: ['player', 'spectator'], interrupt: true, durationMs: 3800 });
      return cue;
    },
    async onSpectatorProgress(progress01: number): Promise<void> {
      const cue = cueForSpectatorProgress(progress01);
      await director.play(cue, { channels: ['spectator'], durationMs: 2400 });
    }
  };
}
