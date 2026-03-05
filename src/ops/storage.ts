import {
  AVATAR_CATEGORIES,
  createEmptySessionMetrics,
  OPS_MAX_STORED_SESSIONS,
  OPS_SCHEMA_VERSION,
  SCREEN_IDS,
  type OpsEvent,
  type SessionMetrics
} from './metrics';

const SESSIONS_KEY = 'ops.sessions.v1';
const CURRENT_KEY = 'ops.current.v1';

export function loadStoredSessions(): SessionMetrics[] {
  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(normalizeSession).filter(Boolean).slice(-OPS_MAX_STORED_SESSIONS) as SessionMetrics[];
  } catch {
    return [];
  }
}

export function saveStoredSessions(sessions: SessionMetrics[]): void {
  try {
    const trimmed = sessions.slice(-OPS_MAX_STORED_SESSIONS);
    window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignora erro de quota indisponível para não interromper o jogo.
  }
}

export function loadCurrentSession(): SessionMetrics | null {
  try {
    const raw = window.localStorage.getItem(CURRENT_KEY);
    if (!raw) {
      return null;
    }
    return normalizeSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveCurrentSession(session: SessionMetrics): void {
  try {
    window.localStorage.setItem(CURRENT_KEY, JSON.stringify(session));
  } catch {
    // Ignora erro de quota indisponível para não interromper o jogo.
  }
}

export function clearCurrentSession(): void {
  window.localStorage.removeItem(CURRENT_KEY);
}

export function clearOpsStorage(): void {
  window.localStorage.removeItem(SESSIONS_KEY);
  window.localStorage.removeItem(CURRENT_KEY);
}

export function createFreshSession(): SessionMetrics {
  return createEmptySessionMetrics(new Date());
}

function normalizeSession(input: unknown): SessionMetrics | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const obj = input as Partial<SessionMetrics>;
  if (obj.schemaVersion !== OPS_SCHEMA_VERSION) {
    return null;
  }
  if (typeof obj.sessionId !== 'string' || typeof obj.startedAt !== 'string') {
    return null;
  }

  const base = createEmptySessionMetrics(new Date(obj.startedAt));
  base.sessionId = obj.sessionId;
  base.startedAt = obj.startedAt;
  base.endedAt = typeof obj.endedAt === 'string' ? obj.endedAt : null;
  base.runsTotal = toSafeNumber(obj.runsTotal);
  base.resetsTotal = toSafeNumber(obj.resetsTotal);

  SCREEN_IDS.forEach((screen) => {
    base.screenTimeMs[screen] = toSafeNumber(obj.screenTimeMs?.[screen]);
    base.screenEntries[screen] = toSafeNumber(obj.screenEntries?.[screen]);
  });

  base.inputSourceCounts.keyboard = toSafeNumber(obj.inputSourceCounts?.keyboard);
  base.inputSourceCounts.gamepad = toSafeNumber(obj.inputSourceCounts?.gamepad);
  base.inputSourceCounts.pointer = toSafeNumber(obj.inputSourceCounts?.pointer);
  base.inputSourceCounts.unknown = toSafeNumber(obj.inputSourceCounts?.unknown);

  base.remapUsedCount = toSafeNumber(obj.remapUsedCount);
  base.popupBlockedCount = toSafeNumber(obj.popupBlockedCount);
  base.fullscreenFailCount = toSafeNumber(obj.fullscreenFailCount);
  base.wakeLockFailCount = toSafeNumber(obj.wakeLockFailCount);
  base.copyVariantCounts.common = toSafeNumber(obj.copyVariantCounts?.common);
  base.copyVariantCounts.rare = toSafeNumber(obj.copyVariantCounts?.rare);
  base.copyVariantCounts.legendary = toSafeNumber(obj.copyVariantCounts?.legendary);

  AVATAR_CATEGORIES.forEach((category) => {
    const src = obj.avatarChoices?.[category];
    if (!src || typeof src !== 'object') {
      return;
    }
    Object.entries(src).forEach(([option, count]) => {
      base.avatarChoices[category][option] = toSafeNumber(count);
    });
  });

  if (obj.toolkitChoices && typeof obj.toolkitChoices === 'object') {
    Object.entries(obj.toolkitChoices).forEach(([tool, count]) => {
      base.toolkitChoices[tool] = toSafeNumber(count);
    });
  }

  base.repairStats.timeMsTotal = toSafeNumber(obj.repairStats?.timeMsTotal);
  base.repairStats.slotsCompletedTotal = toSafeNumber(obj.repairStats?.slotsCompletedTotal);
  base.repairStats.partialWins = toSafeNumber(obj.repairStats?.partialWins);
  base.repairStats.fullWins = toSafeNumber(obj.repairStats?.fullWins);
  base.repairStats.timeoutWins = toSafeNumber(obj.repairStats?.timeoutWins);
  base.repairStats.maxComboEver = toSafeNumber(obj.repairStats?.maxComboEver);
  base.repairStats.hits = toSafeNumber(obj.repairStats?.hits);
  base.repairStats.misses = toSafeNumber(obj.repairStats?.misses);
  base.repairStats.progressMax = toSafeNumber(obj.repairStats?.progressMax);

  const events = Array.isArray(obj.events) ? obj.events : [];
  base.events = events.map(normalizeEvent).filter(Boolean) as OpsEvent[];

  return base;
}

function normalizeEvent(input: unknown): OpsEvent | null {
  if (!input || typeof input !== 'object') {
    return null;
  }
  const event = input as Partial<OpsEvent>;
  if (typeof event.tsMs !== 'number' || typeof event.iso !== 'string' || typeof event.type !== 'string') {
    return null;
  }
  return {
    tsMs: event.tsMs,
    iso: event.iso,
    type: event.type,
    screen: event.screen ?? null,
    action: event.action ?? null,
    source: event.source ?? null,
    details: event.details ?? null
  };
}

function toSafeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export { CURRENT_KEY, SESSIONS_KEY };
