import type { Action } from '../core/input/actions';
import type { ScreenId } from '../core/types';

export type OpsInputSource = 'keyboard' | 'gamepad' | 'pointer' | 'unknown';
export type RunEndReason = 'result' | 'manual' | 'idle' | 'abort';
export type RunOutcome = 'full' | 'partial' | 'timeout' | 'aborted';
export type AvatarCategory = 'skin' | 'hair' | 'eyes' | 'outfit' | 'accessory';

export interface OpsEvent {
  tsMs: number;
  iso: string;
  type: string;
  screen: ScreenId | null;
  action: Action | 'POINTER' | null;
  source: OpsInputSource | null;
  details: string | null;
}

export interface RepairStats {
  timeMsTotal: number;
  slotsCompletedTotal: number;
  partialWins: number;
  fullWins: number;
  timeoutWins: number;
  maxComboEver: number;
  hits: number;
  misses: number;
  progressMax: number;
}

export interface SessionMetrics {
  schemaVersion: 1;
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  runsTotal: number;
  resetsTotal: number;
  screenTimeMs: Record<ScreenId, number>;
  screenEntries: Record<ScreenId, number>;
  inputSourceCounts: Record<OpsInputSource, number>;
  remapUsedCount: number;
  popupBlockedCount: number;
  fullscreenFailCount: number;
  wakeLockFailCount: number;
  avatarChoices: Record<AvatarCategory, Record<string, number>>;
  toolkitChoices: Record<string, number>;
  repairStats: RepairStats;
  events: OpsEvent[];
}

export interface OpsDashboardSnapshot {
  current: SessionMetrics;
  recentSessions: SessionMetrics[];
  totals: {
    sessionsStored: number;
    runsTotal: number;
    resetsTotal: number;
    remapUsedCount: number;
    popupBlockedCount: number;
    fullscreenFailCount: number;
    wakeLockFailCount: number;
  };
}

export type EndRunPayload = {
  reason: RunEndReason;
  outcome: RunOutcome;
  completedSlots: number;
  maxCombo: number;
  missionMsLeft: number;
  badge: string;
};

export const OPS_SCHEMA_VERSION = 1;
export const OPS_MAX_STORED_SESSIONS = 50;
export const OPS_MAX_EVENTS_PER_SESSION = 2000;
export const SCREEN_IDS: ScreenId[] = ['ATTRACT', 'INTRO', 'AVATAR', 'TOOLKIT', 'REPAIR', 'RESULT'];
export const AVATAR_CATEGORIES: AvatarCategory[] = ['skin', 'hair', 'eyes', 'outfit', 'accessory'];

export function createEmptySessionMetrics(startedAt = new Date()): SessionMetrics {
  return {
    schemaVersion: OPS_SCHEMA_VERSION,
    sessionId: createSessionId(startedAt),
    startedAt: startedAt.toISOString(),
    endedAt: null,
    runsTotal: 0,
    resetsTotal: 0,
    screenTimeMs: createScreenNumberMap(),
    screenEntries: createScreenNumberMap(),
    inputSourceCounts: {
      keyboard: 0,
      gamepad: 0,
      pointer: 0,
      unknown: 0
    },
    remapUsedCount: 0,
    popupBlockedCount: 0,
    fullscreenFailCount: 0,
    wakeLockFailCount: 0,
    avatarChoices: createAvatarChoiceMap(),
    toolkitChoices: {},
    repairStats: {
      timeMsTotal: 0,
      slotsCompletedTotal: 0,
      partialWins: 0,
      fullWins: 0,
      timeoutWins: 0,
      maxComboEver: 0,
      hits: 0,
      misses: 0,
      progressMax: 0
    },
    events: []
  };
}

export function createScreenNumberMap(): Record<ScreenId, number> {
  return {
    ATTRACT: 0,
    INTRO: 0,
    AVATAR: 0,
    TOOLKIT: 0,
    REPAIR: 0,
    RESULT: 0
  };
}

function createAvatarChoiceMap(): Record<AvatarCategory, Record<string, number>> {
  return {
    skin: {},
    hair: {},
    eyes: {},
    outfit: {},
    accessory: {}
  };
}

function createSessionId(startedAt: Date): string {
  const part = Math.random().toString(16).slice(2, 8);
  return `ops-${startedAt.getTime()}-${part}`;
}
