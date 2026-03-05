import type { ScreenId } from './types';

export const SCREEN_ORDER: ScreenId[] = ['ATTRACT', 'INTRO', 'AVATAR', 'TOOLKIT', 'REPAIR', 'RESULT'];

export const TEST_MODE = readBooleanFlag('VITE_TEST_MODE', 'test');

export interface KioskRuntimeFlags {
  enabled: boolean;
  hardening: boolean;
  focusNavigation: boolean;
  visibilityRecovery: boolean;
}

const kioskEnabled = readBooleanFlagWithFallback('VITE_KIOSK_MODE', 'kiosk', true);

export const KIOSK_RUNTIME_FLAGS: KioskRuntimeFlags = {
  enabled: kioskEnabled,
  hardening: readBooleanFlagWithFallback('VITE_KIOSK_HARDENING', 'hardening', kioskEnabled),
  focusNavigation: readBooleanFlagWithFallback('VITE_KIOSK_FOCUS', 'focusNav', kioskEnabled),
  visibilityRecovery: readBooleanFlagWithFallback('VITE_KIOSK_VISIBILITY', 'visibilityRecovery', kioskEnabled)
};

export const IDLE_RESET_MS = readDuration('VITE_IDLE_MS', 'idleMs', 60_000);
export const RESULT_RESET_MS = readDuration('VITE_RESULT_RESET_MS', 'resultResetMs', 10_000);
export const INTRO_TIMEOUT_MS = readDuration('VITE_INTRO_MS', 'introMs', 12_000);
export const AVATAR_TIMEOUT_MS = readDuration('VITE_AVATAR_MS', 'avatarMs', 25_000);
export const TOOLKIT_TIMEOUT_MS = readDuration('VITE_TOOLKIT_MS', 'toolkitMs', 20_000);
export const REPAIR_TIMEOUT_MS = readDuration('VITE_REPAIR_MS', 'repairMs', 30_000);

export const SCREEN_TIMEOUTS_MS: Record<Exclude<ScreenId, 'ATTRACT'>, number> = {
  INTRO: INTRO_TIMEOUT_MS,
  AVATAR: AVATAR_TIMEOUT_MS,
  TOOLKIT: TOOLKIT_TIMEOUT_MS,
  REPAIR: REPAIR_TIMEOUT_MS,
  RESULT: RESULT_RESET_MS
};

function readDuration(envKey: string, queryKey: string, fallback: number): number {
  const queryOverride = readQueryNumber(queryKey);
  if (queryOverride !== null) {
    return queryOverride;
  }

  const raw = import.meta.env[envKey];
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBooleanFlag(envKey: string, queryKey: string): boolean {
  return readBooleanFlagWithFallback(envKey, queryKey, false);
}

function readBooleanFlagWithFallback(envKey: string, queryKey: string, fallback: boolean): boolean {
  const queryValue = readQueryBoolean(queryKey);
  if (queryValue !== null) {
    return queryValue;
  }

  return parseBoolean(import.meta.env[envKey], fallback);
}

function readQueryNumber(key: string): number | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const raw = params.get(key);
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readQueryBoolean(key: string): boolean | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return parseBoolean(params.get(key), null);
}

function parseBoolean(value: string | null | undefined, fallback: boolean | null): boolean | null {
  const raw = value?.toLowerCase();
  if (raw === undefined || raw === null || raw === '') {
    return fallback;
  }

  if (raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on') {
    return true;
  }

  if (raw === '0' || raw === 'false' || raw === 'no' || raw === 'off') {
    return false;
  }

  if (raw === 'enabled') {
    return true;
  }

  if (raw === 'disabled') {
    return false;
  }

  if (fallback === null) {
    return null;
  }
  return fallback;
}
