export async function requestFullscreenSafe(element: HTMLElement = document.documentElement): Promise<boolean> {
  if (!document.fullscreenEnabled || document.fullscreenElement) {
    return Boolean(document.fullscreenElement);
  }

  try {
    await element.requestFullscreen();
    return true;
  } catch {
    return false;
  }
}

export function isFullscreen(): boolean {
  return Boolean(document.fullscreenElement);
}
