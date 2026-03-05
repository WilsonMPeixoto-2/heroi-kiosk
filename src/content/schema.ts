import type { ScreenId } from '../core/types';

export type VariantTier = 'common' | 'rare' | 'legendary';

export interface VariantPack {
  common: string[];
  rare?: string[];
  legendary?: string[];
}

export interface VariantSelection {
  text: string;
  tier: VariantTier;
}

export interface ScreenCopy {
  attract: {
    pill: string;
    title: VariantPack;
    subtitle: VariantPack;
    ctaStart: VariantPack;
    ctaSpectator: string;
  };
  intro: {
    title: VariantPack;
    line1: VariantPack;
    line2: VariantPack;
    continueCta: string;
  };
  avatar: {
    title: string;
    subtitle: string;
    backCta: string;
    confirmCta: string;
  };
  toolkit: {
    title: string;
    subtitle: string;
    selectedHint: string;
    backCta: string;
    startRepairCta: string;
    tooltips: Record<string, string>;
  };
  repair: {
    title: string;
    subtitle: string;
    initialFeedback: string;
    needTool: VariantPack;
    alreadyStable: VariantPack;
    progressLabel: string;
    comboLabel: string;
    backCta: string;
    finishCta: string;
    hit: VariantPack;
    miss: VariantPack;
    combo: VariantPack;
    timeout: VariantPack;
    winPartial: VariantPack;
    winFull: VariantPack;
    slotNames: Record<string, string>;
    slotComplete: Record<string, VariantPack>;
  };
  result: {
    full: {
      title: VariantPack;
      message: VariantPack;
    };
    partial: {
      title: VariantPack;
      message: VariantPack;
    };
    timeout: {
      title: VariantPack;
      message: VariantPack;
    };
    playAgainCta: string;
    goMemoryCta: string;
    summaryLabels: {
      toolsUsed: string;
      restoredSlots: string;
      energyLeft: string;
      maxCombo: string;
      heroBadge: string;
    };
  };
}

export interface SpectatorCopy {
  title: string;
  waiting: string;
  screenLabel: Record<ScreenId, string>;
  progressByThreshold: Array<{
    threshold: number;
    line: string;
  }>;
  energyLabel: string;
  moduleLabel: string;
  activeBagLabel: string;
}

export interface ContentDataset {
  locale: 'pt-BR';
  screens: ScreenCopy;
  spectator: SpectatorCopy;
}
