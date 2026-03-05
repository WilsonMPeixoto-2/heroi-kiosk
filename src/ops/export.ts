import type { AvatarCategory, SessionMetrics } from './metrics';

const CSV_SEPARATOR = ',';

export function exportSessionJson(session: SessionMetrics): string {
  return JSON.stringify(session, null, 2);
}

export function exportSessionsSummaryCsv(sessions: SessionMetrics[]): string {
  const header = [
    'session_id',
    'started_at',
    'ended_at',
    'runs_total',
    'resets_total',
    'screen_ms_attract',
    'screen_ms_intro',
    'screen_ms_avatar',
    'screen_ms_toolkit',
    'screen_ms_repair',
    'screen_ms_result',
    'input_keyboard',
    'input_gamepad',
    'input_pointer',
    'input_unknown',
    'remap_used_count',
    'popup_blocked_count',
    'fullscreen_fail_count',
    'wake_lock_fail_count',
    'repair_time_ms_total',
    'repair_slots_completed_total',
    'repair_full_wins',
    'repair_partial_wins',
    'repair_timeout_wins',
    'repair_max_combo_ever',
    'repair_hits',
    'repair_misses',
    'top_tools',
    'top_avatar'
  ];

  const rows = sessions.map((session) => {
    const topTools = topEntries(session.toolkitChoices, 3)
      .map((entry) => `${entry.key}:${entry.count}`)
      .join('|');
    const topAvatar = topAvatarChoices(session);

    const cells: Array<string | number> = [
      session.sessionId,
      session.startedAt,
      session.endedAt ?? '',
      session.runsTotal,
      session.resetsTotal,
      session.screenTimeMs.ATTRACT,
      session.screenTimeMs.INTRO,
      session.screenTimeMs.AVATAR,
      session.screenTimeMs.TOOLKIT,
      session.screenTimeMs.REPAIR,
      session.screenTimeMs.RESULT,
      session.inputSourceCounts.keyboard,
      session.inputSourceCounts.gamepad,
      session.inputSourceCounts.pointer,
      session.inputSourceCounts.unknown,
      session.remapUsedCount,
      session.popupBlockedCount,
      session.fullscreenFailCount,
      session.wakeLockFailCount,
      session.repairStats.timeMsTotal,
      session.repairStats.slotsCompletedTotal,
      session.repairStats.fullWins,
      session.repairStats.partialWins,
      session.repairStats.timeoutWins,
      session.repairStats.maxComboEver,
      session.repairStats.hits,
      session.repairStats.misses,
      topTools,
      topAvatar
    ];

    return cells.map(csvCell).join(CSV_SEPARATOR);
  });

  return [header.join(CSV_SEPARATOR), ...rows].join('\n');
}

export function exportEventsCsv(sessions: SessionMetrics[]): string {
  const header = ['session_id', 'ts_ms', 'iso', 'type', 'screen', 'action', 'source', 'details'];
  const rows: string[] = [];

  sessions.forEach((session) => {
    session.events.forEach((event) => {
      rows.push(
        [
          session.sessionId,
          event.tsMs,
          event.iso,
          event.type,
          event.screen ?? '',
          event.action ?? '',
          event.source ?? '',
          event.details ?? ''
        ]
          .map(csvCell)
          .join(CSV_SEPARATOR)
      );
    });
  });

  return [header.join(CSV_SEPARATOR), ...rows].join('\n');
}

export function downloadTextFile(fileName: string, contentType: string, content: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 250);
}

export function createTimestampedFileName(prefix: string, ext: 'json' | 'csv', date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(
    date.getHours()
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `${prefix}-${stamp}.${ext}`;
}

function csvCell(value: string | number): string {
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
}

function topEntries(map: Record<string, number>, maxItems: number): Array<{ key: string; count: number }> {
  return Object.entries(map)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxItems);
}

function topAvatarChoices(session: SessionMetrics): string {
  const categories: AvatarCategory[] = ['skin', 'hair', 'eyes', 'outfit', 'accessory'];
  return categories
    .map((category) => {
      const [top] = topEntries(session.avatarChoices[category], 1);
      if (!top) {
        return `${category}:n/a`;
      }
      return `${category}:${top.key}`;
    })
    .join('|');
}
