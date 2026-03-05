import { format, get, getVariant, type RngFn } from '../content/copy';
import type { VariantTier } from '../content/schema';
import type { ScreenId } from '../core/types';

export type NarrationTag =
  | 'screen_attract'
  | 'screen_intro'
  | 'screen_avatar'
  | 'screen_toolkit'
  | 'screen_repair'
  | 'screen_result'
  | 'repair_hit'
  | 'repair_miss'
  | 'repair_slot_complete'
  | 'repair_combo'
  | 'repair_timeout'
  | 'repair_need_tool'
  | 'repair_already_stable'
  | 'result_full'
  | 'result_partial'
  | 'result_timeout'
  | 'spectator_progress';

export interface NarrationCue {
  key: string;
  text: string;
  tier: VariantTier;
  tag: NarrationTag;
}

export function cueForScreen(screen: ScreenId, rng: RngFn): NarrationCue | null {
  switch (screen) {
    case 'ATTRACT':
      return fromVariant('screens.attract.title', 'ATTRACT.title', rng, 'screen_attract');
    case 'INTRO': {
      const line1 = fromVariant('screens.intro.line1', 'INTRO.line1', rng, 'screen_intro');
      const line2 = fromVariant('screens.intro.line2', 'INTRO.line2', rng, 'screen_intro');
      return mergeCues('INTRO.lines', line1, line2, 'screen_intro');
    }
    case 'AVATAR':
      return fromText('screens.avatar.subtitle', 'AVATAR.subtitle', 'screen_avatar');
    case 'TOOLKIT':
      return fromText('screens.toolkit.subtitle', 'TOOLKIT.subtitle', 'screen_toolkit');
    case 'REPAIR':
      return fromText('screens.repair.subtitle', 'REPAIR.subtitle', 'screen_repair');
    case 'RESULT':
      return fromText('screens.result.full.message.common.0', 'RESULT.summary', 'screen_result');
    default:
      return null;
  }
}

export function cueForRepairNeedTool(rng: RngFn): NarrationCue {
  return fromVariant('screens.repair.needTool', 'REPAIR.needTool', rng, 'repair_need_tool');
}

export function cueForRepairAlreadyStable(slotName: string, rng: RngFn): NarrationCue {
  return fromVariant('screens.repair.alreadyStable', 'REPAIR.alreadyStable', rng, 'repair_already_stable', {
    slot: slotName
  });
}

export function cueForRepairHit(success: boolean, rng: RngFn): NarrationCue {
  return success
    ? fromVariant('screens.repair.hit', 'REPAIR.hit', rng, 'repair_hit')
    : fromVariant('screens.repair.miss', 'REPAIR.miss', rng, 'repair_miss');
}

export function cueForRepairCombo(combo: number, rng: RngFn): NarrationCue {
  return fromVariant('screens.repair.combo', 'REPAIR.combo', rng, 'repair_combo', { combo });
}

export function cueForSlotComplete(slotId: string, rng: RngFn): NarrationCue {
  return fromVariant(
    `screens.repair.slotComplete.${slotId}`,
    `REPAIR.slotComplete.${slotId}`,
    rng,
    'repair_slot_complete'
  );
}

export function cueForRepairTimeout(rng: RngFn): NarrationCue {
  return fromVariant('screens.repair.timeout', 'REPAIR.timeout', rng, 'repair_timeout');
}

export function cueForResult(resultType: 'full' | 'partial' | 'timeout', rng: RngFn): NarrationCue {
  if (resultType === 'full') {
    return fromVariant('screens.result.full.message', 'RESULT.full.message', rng, 'result_full');
  }
  if (resultType === 'partial') {
    return fromVariant('screens.result.partial.message', 'RESULT.partial.message', rng, 'result_partial');
  }
  return fromVariant('screens.result.timeout.message', 'RESULT.timeout.message', rng, 'result_timeout');
}

export function cueForSpectatorProgress(progress01: number): NarrationCue {
  const lines = get<Array<{ threshold: number; line: string }>>('spectator.progressByThreshold');
  const sorted = [...lines].sort((a, b) => a.threshold - b.threshold);
  let selected = sorted[0]?.line ?? '';

  for (const item of sorted) {
    if (progress01 >= item.threshold) {
      selected = item.line;
    }
  }

  return {
    key: 'SPECTATOR.progress',
    text: selected,
    tier: 'common',
    tag: 'spectator_progress'
  };
}

function mergeCues(key: string, first: NarrationCue, second: NarrationCue, tag: NarrationTag): NarrationCue {
  return {
    key,
    text: `${first.text} ${second.text}`.trim(),
    tier: highestTier(first.tier, second.tier),
    tag
  };
}

function highestTier(a: VariantTier, b: VariantTier): VariantTier {
  if (a === 'legendary' || b === 'legendary') {
    return 'legendary';
  }
  if (a === 'rare' || b === 'rare') {
    return 'rare';
  }
  return 'common';
}

function fromText(path: string, key: string, tag: NarrationTag, params?: Record<string, string | number>): NarrationCue {
  const raw = get<string>(path);
  return {
    key,
    text: format(raw, params),
    tier: 'common',
    tag
  };
}

function fromVariant(
  path: string,
  key: string,
  rng: RngFn,
  tag: NarrationTag,
  params?: Record<string, string | number>
): NarrationCue {
  const selection = getVariant(path, rng);
  return {
    key,
    text: format(selection.text, params),
    tier: selection.tier,
    tag
  };
}
