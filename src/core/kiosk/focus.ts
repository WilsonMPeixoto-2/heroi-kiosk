export interface FocusNavigator {
  refresh: () => void;
  move: (delta: number) => void;
  activateFocused: () => void;
  activateBack: () => void;
  focusPrimaryAction: () => void;
  dispose: () => void;
}

export function bindFocusNavigation(rootEl: HTMLElement): FocusNavigator {
  let focusables: HTMLElement[] = [];
  let focusIndex = 0;

  const toFocusable = (target: HTMLElement | null): HTMLElement | null => {
    if (!target) {
      return null;
    }

    if (target.matches('[data-focusable="true"], button, [role="button"], a[href]')) {
      return target;
    }

    return target.closest<HTMLElement>('[data-focusable="true"], button, [role="button"], a[href]');
  };

  const paint = () => {
    focusables.forEach((node, index) => {
      const isFocused = index === focusIndex;
      node.tabIndex = isFocused ? 0 : -1;
      node.classList.toggle('focus-mark', isFocused);
      if (isFocused) {
        node.focus({ preventScroll: true });
      }
    });
  };

  const setFocusToNode = (node: HTMLElement | null) => {
    if (!node) {
      return;
    }
    const index = focusables.indexOf(node);
    if (index < 0) {
      return;
    }
    focusIndex = index;
    paint();
  };

  const refresh = () => {
    focusables = Array.from(
      rootEl.querySelectorAll<HTMLElement>(
        '[data-focusable="true"]:not([disabled]), button:not([disabled]), [role="button"]:not([aria-disabled="true"]), a[href]'
      )
    ).filter((node) => node.offsetParent !== null);

    focusIndex = 0;
    paint();
  };

  const move = (delta: number) => {
    if (focusables.length === 0) {
      return;
    }
    focusIndex = (focusIndex + delta + focusables.length) % focusables.length;
    paint();
  };

  const activateFocused = () => {
    focusables[focusIndex]?.click();
  };

  const activateBack = () => {
    const back = rootEl.querySelector<HTMLElement>('[data-role="back"]:not([disabled])');
    back?.click();
  };

  const focusPrimaryAction = () => {
    const primary = rootEl.querySelector<HTMLElement>('[data-primary="1"]:not([disabled])');
    if (primary) {
      setFocusToNode(primary);
      return;
    }
    paint();
  };

  const onPointerDown = (event: PointerEvent) => {
    const focusable = toFocusable(event.target as HTMLElement | null);
    if (focusable) {
      setFocusToNode(focusable);
    }
  };

  rootEl.addEventListener('pointerdown', onPointerDown, { passive: true });

  return {
    refresh,
    move,
    activateFocused,
    activateBack,
    focusPrimaryAction,
    dispose: () => {
      rootEl.removeEventListener('pointerdown', onPointerDown);
    }
  };
}
