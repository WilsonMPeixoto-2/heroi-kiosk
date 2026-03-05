export interface HardeningOptions {
  rootEl: HTMLElement;
}

export interface HardeningController {
  dispose: () => void;
  focusRoot: () => void;
}

export function initHardening(options: HardeningOptions): HardeningController {
  const { rootEl } = options;
  rootEl.tabIndex = 0;

  const focusRoot = () => {
    rootEl.focus({ preventScroll: true });
  };

  let lastTouchEndMs = 0;

  const onContextMenu = (event: Event) => event.preventDefault();
  const onDragStart = (event: Event) => event.preventDefault();
  const onSelectStart = (event: Event) => event.preventDefault();
  const onCtrlWheel = (event: WheelEvent) => {
    if (event.ctrlKey) {
      event.preventDefault();
    }
  };

  const onGesture = (event: Event) => {
    event.preventDefault();
  };

  const onTouchEnd = (event: TouchEvent) => {
    const now = Date.now();
    if (now - lastTouchEndMs <= 320) {
      event.preventDefault();
    }
    lastTouchEndMs = now;
  };

  const onPointerDown = () => focusRoot();
  const onTouchStart = () => focusRoot();

  window.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('dragstart', onDragStart);
  window.addEventListener('selectstart', onSelectStart);
  window.addEventListener('wheel', onCtrlWheel, { passive: false });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: false });
  window.addEventListener('gesturestart', onGesture, { passive: false });
  window.addEventListener('gesturechange', onGesture, { passive: false });
  window.addEventListener('gestureend', onGesture, { passive: false });

  focusRoot();

  return {
    focusRoot,
    dispose: () => {
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('dragstart', onDragStart);
      window.removeEventListener('selectstart', onSelectStart);
      window.removeEventListener('wheel', onCtrlWheel);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('gesturestart', onGesture);
      window.removeEventListener('gesturechange', onGesture);
      window.removeEventListener('gestureend', onGesture);
    }
  };
}
