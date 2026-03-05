import type { Action, InputSource } from '../core/input/actions';
import type { ScreenId } from '../core/types';
import type { VariantTier } from '../content/schema';
import {
  createEmptySessionMetrics,
  OPS_MAX_EVENTS_PER_SESSION,
  OPS_MAX_STORED_SESSIONS,
  type AvatarCategory,
  type EndRunPayload,
  type OpsDashboardSnapshot,
  type OpsInputSource,
  type SessionMetrics
} from './metrics';
import { ScreenTimer } from './timers';
import {
  clearCurrentSession,
  clearOpsStorage,
  createFreshSession,
  loadCurrentSession,
  loadStoredSessions,
  saveCurrentSession,
  saveStoredSessions
} from './storage';

type RecorderEvent = {
  type: string;
  screen?: ScreenId | null;
  action?: Action | 'POINTER' | null;
  source?: OpsInputSource | null;
  details?: string | null;
};

export class OpsRecorder {
  private sessions: SessionMetrics[] = [];
  private current: SessionMetrics;
  private readonly screenTimer = new ScreenTimer();
  private autosaveElapsedMs = 0;
  private runActive = false;
  private runCompletedSlots = new Set<string>();

  constructor() {
    this.sessions = loadStoredSessions();
    this.current = loadCurrentSession() ?? createFreshSession();
    this.recordEvent({
      type: 'session_boot',
      details: this.current.endedAt ? 'session_reopened' : 'session_started'
    });
    this.current.endedAt = null;
    this.persistCurrent();
  }

  update(dtMs: number): void {
    this.tickScreenTimer();
    this.autosaveElapsedMs += dtMs;

    if (this.autosaveElapsedMs >= 10_000) {
      this.autosaveElapsedMs = 0;
      this.persistCurrent();
    }
  }

  onScreenEnter(screen: ScreenId): void {
    const now = Date.now();
    const previous = this.screenTimer.getActive();

    if (previous) {
      const tick = this.screenTimer.tick(now, this.current.screenTimeMs);
      if (tick?.screen === 'REPAIR') {
        this.current.repairStats.timeMsTotal += tick.deltaMs;
      }
      if (previous !== screen) {
        this.recordEvent({
          type: 'screen_exit',
          screen: previous,
          details: tick ? `delta_ms=${Math.round(tick.deltaMs)}` : null
        });
      }
    }

    this.screenTimer.setActive(screen, now);
    this.current.screenEntries[screen] = (this.current.screenEntries[screen] ?? 0) + 1;
    this.recordEvent({ type: 'screen_enter', screen });
  }

  onAction(action: Action | 'POINTER', source: OpsInputSource | InputSource): void {
    const normalized = normalizeSource(source);
    this.current.inputSourceCounts[normalized] = (this.current.inputSourceCounts[normalized] ?? 0) + 1;
    this.recordEvent({
      type: 'action',
      screen: this.screenTimer.getActive(),
      action,
      source: normalized
    });
  }

  onRemapUsed(): void {
    this.current.remapUsedCount += 1;
    this.recordEvent({ type: 'remap_used', screen: this.screenTimer.getActive() });
    this.persistCurrent();
  }

  onPopupBlocked(): void {
    this.current.popupBlockedCount += 1;
    this.recordEvent({ type: 'popup_blocked', screen: this.screenTimer.getActive() });
  }

  onFullscreenFail(): void {
    this.current.fullscreenFailCount += 1;
    this.recordEvent({ type: 'fullscreen_fail', screen: this.screenTimer.getActive() });
  }

  onWakeLockFail(): void {
    this.current.wakeLockFailCount += 1;
    this.recordEvent({ type: 'wake_lock_fail', screen: this.screenTimer.getActive() });
  }

  onCopyVariantPicked(key: string, tier: VariantTier): void {
    this.current.copyVariantCounts[tier] = (this.current.copyVariantCounts[tier] ?? 0) + 1;
    this.recordEvent({
      type: 'copy_variant',
      screen: this.screenTimer.getActive(),
      details: `${key}|${tier}`
    });
  }

  onAvatarChoice(category: AvatarCategory, optionId: string | number): void {
    const key = String(optionId);
    const map = this.current.avatarChoices[category];
    map[key] = (map[key] ?? 0) + 1;
    this.recordEvent({
      type: 'avatar_choice',
      screen: this.screenTimer.getActive(),
      details: `${category}:${key}`
    });
  }

  onToolkitChoice(toolId: string): void {
    this.current.toolkitChoices[toolId] = (this.current.toolkitChoices[toolId] ?? 0) + 1;
    this.recordEvent({
      type: 'toolkit_choice',
      screen: this.screenTimer.getActive(),
      details: toolId
    });
  }

  onRepairHit(slotId: string, toolId: string, success: boolean): void {
    if (success) {
      this.current.repairStats.hits += 1;
    } else {
      this.current.repairStats.misses += 1;
    }

    this.recordEvent({
      type: 'repair_hit',
      screen: 'REPAIR',
      details: `${slotId}|${toolId}|${success ? 'success' : 'fail'}`
    });
  }

  onRepairSlotComplete(slotId: string): void {
    if (this.runCompletedSlots.has(slotId)) {
      return;
    }
    this.runCompletedSlots.add(slotId);
    this.current.repairStats.slotsCompletedTotal += 1;
    this.recordEvent({
      type: 'repair_slot_complete',
      screen: 'REPAIR',
      details: slotId
    });
  }

  setRepairProgress(progress01: number): void {
    const clamped = Math.max(0, Math.min(1, progress01));
    this.current.repairStats.progressMax = Math.max(this.current.repairStats.progressMax, clamped);
  }

  startRun(source: OpsInputSource | InputSource | string): void {
    if (this.runActive) {
      this.endRun({
        reason: 'abort',
        outcome: 'aborted',
        completedSlots: 0,
        maxCombo: 0,
        missionMsLeft: 0,
        badge: 'aborted'
      });
    }

    this.runActive = true;
    this.runCompletedSlots.clear();
    this.current.runsTotal += 1;
    this.recordEvent({
      type: 'run_start',
      screen: this.screenTimer.getActive(),
      source: normalizeSource(source),
      details: `run=${this.current.runsTotal}`
    });
    this.persistCurrent();
  }

  endRun(payload: EndRunPayload): void {
    if (!this.runActive) {
      return;
    }

    this.runActive = false;
    this.current.repairStats.maxComboEver = Math.max(this.current.repairStats.maxComboEver, payload.maxCombo);

    if (payload.outcome === 'full') {
      this.current.repairStats.fullWins += 1;
    } else if (payload.outcome === 'partial') {
      this.current.repairStats.partialWins += 1;
    } else if (payload.outcome === 'timeout') {
      this.current.repairStats.timeoutWins += 1;
    }

    this.recordEvent({
      type: 'run_end',
      screen: this.screenTimer.getActive(),
      details: [
        `reason=${payload.reason}`,
        `outcome=${payload.outcome}`,
        `completed_slots=${payload.completedSlots}`,
        `max_combo=${payload.maxCombo}`,
        `mission_ms_left=${payload.missionMsLeft}`,
        `badge=${payload.badge}`
      ].join('|')
    });
    this.persistCurrent();
  }

  onReset(reason: string): void {
    this.current.resetsTotal += 1;
    this.recordEvent({
      type: 'reset',
      screen: this.screenTimer.getActive(),
      details: reason
    });
    this.persistCurrent();
  }

  getDashboardSnapshot(): OpsDashboardSnapshot {
    this.tickScreenTimer();
    const current = cloneSession(this.current);
    const all = [...this.sessions, current];

    const totals = all.reduce(
      (acc, session) => {
        acc.runsTotal += session.runsTotal;
        acc.resetsTotal += session.resetsTotal;
        acc.remapUsedCount += session.remapUsedCount;
        acc.popupBlockedCount += session.popupBlockedCount;
        acc.fullscreenFailCount += session.fullscreenFailCount;
        acc.wakeLockFailCount += session.wakeLockFailCount;
        acc.rareVariants += session.copyVariantCounts.rare;
        acc.legendaryVariants += session.copyVariantCounts.legendary;
        return acc;
      },
      {
        sessionsStored: all.length,
        runsTotal: 0,
        resetsTotal: 0,
        remapUsedCount: 0,
        popupBlockedCount: 0,
        fullscreenFailCount: 0,
        wakeLockFailCount: 0,
        rareVariants: 0,
        legendaryVariants: 0
      }
    );

    return {
      current,
      recentSessions: this.sessions.slice(-6).reverse().map(cloneSession),
      totals
    };
  }

  getExportSessions(): SessionMetrics[] {
    this.tickScreenTimer();
    return [...this.sessions.map(cloneSession), cloneSession(this.current)];
  }

  getCurrentSession(): SessionMetrics {
    this.tickScreenTimer();
    return cloneSession(this.current);
  }

  endSession(): void {
    this.tickScreenTimer();
    this.current.endedAt = new Date().toISOString();
    this.recordEvent({ type: 'session_end' });
    this.sessions.push(cloneSession(this.current));
    this.sessions = this.sessions.slice(-OPS_MAX_STORED_SESSIONS);
    saveStoredSessions(this.sessions);
    clearCurrentSession();
  }

  resetAll(): void {
    clearOpsStorage();
    this.sessions = [];
    this.current = createEmptySessionMetrics(new Date());
    this.screenTimer.clear();
    this.runActive = false;
    this.runCompletedSlots.clear();
    this.autosaveElapsedMs = 0;
    this.recordEvent({ type: 'metrics_reset' });
    this.persistCurrent();
  }

  private tickScreenTimer(): void {
    const tick = this.screenTimer.tick(Date.now(), this.current.screenTimeMs);
    if (tick?.screen === 'REPAIR') {
      this.current.repairStats.timeMsTotal += tick.deltaMs;
    }
  }

  private persistCurrent(): void {
    saveCurrentSession(this.current);
  }

  private recordEvent({ type, screen, action, source, details }: RecorderEvent): void {
    const now = Date.now();
    this.current.events.push({
      tsMs: now,
      iso: new Date(now).toISOString(),
      type,
      screen: screen ?? null,
      action: action ?? null,
      source: source ?? null,
      details: details ?? null
    });

    if (this.current.events.length > OPS_MAX_EVENTS_PER_SESSION) {
      this.current.events.splice(0, this.current.events.length - OPS_MAX_EVENTS_PER_SESSION);
    }
  }
}

function normalizeSource(source: OpsInputSource | InputSource | string): OpsInputSource {
  if (source === 'keyboard' || source === 'gamepad' || source === 'pointer' || source === 'unknown') {
    return source;
  }
  return 'unknown';
}

function cloneSession(session: SessionMetrics): SessionMetrics {
  return JSON.parse(JSON.stringify(session)) as SessionMetrics;
}
