export interface VisibilityOptions {
  rootEl: HTMLElement;
  onVisible?: () => void;
  onHidden?: () => void;
}

export interface VisibilityController {
  dispose: () => void;
}

export function installVisibilityResilience(options: VisibilityOptions): VisibilityController {
  const { rootEl, onVisible, onHidden } = options;

  const focusRoot = () => rootEl.focus({ preventScroll: true });

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      focusRoot();
      onVisible?.();
    } else {
      onHidden?.();
    }
  };

  const onWindowFocus = () => {
    focusRoot();
    onVisible?.();
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('focus', onWindowFocus);

  return {
    dispose: () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onWindowFocus);
    }
  };
}
