import { useEffect, useRef } from 'preact/hooks';

type LottieModule = typeof import('lottie-web');

type OverlayPayload = {
  mode: 'result' | 'slot';
};

export function LottieOverlay() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const currentAnimRef = useRef<{ destroy: () => void } | null>(null);
  const reducedMotionRef = useRef<boolean>(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const lottieModuleRef = useRef<LottieModule | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMediaChange = (event: MediaQueryListEvent): void => {
      reducedMotionRef.current = event.matches;
      if (event.matches) {
        currentAnimRef.current?.destroy();
        currentAnimRef.current = null;
      }
    };
    media.addEventListener('change', onMediaChange);

    const onPlay = (event: Event): void => {
      const custom = event as CustomEvent<OverlayPayload>;
      void play(custom.detail?.mode ?? 'result');
    };
    window.addEventListener('heroi:lottie:play', onPlay as EventListener);

    return () => {
      media.removeEventListener('change', onMediaChange);
      window.removeEventListener('heroi:lottie:play', onPlay as EventListener);
      currentAnimRef.current?.destroy();
      currentAnimRef.current = null;
    };
  }, []);

  const play = async (mode: 'result' | 'slot'): Promise<void> => {
    if (reducedMotionRef.current || !hostRef.current) {
      return;
    }

    const module = lottieModuleRef.current ?? (await import('lottie-web'));
    lottieModuleRef.current = module;
    const lottie = module.default;

    const path = mode === 'slot' ? '/assets/lottie/slot-complete.json' : '/assets/lottie/result-celebration.json';
    currentAnimRef.current?.destroy();
    currentAnimRef.current = lottie.loadAnimation({
      container: hostRef.current,
      renderer: 'svg',
      loop: mode === 'result',
      autoplay: true,
      path
    });

    if (mode === 'slot') {
      window.setTimeout(() => {
        currentAnimRef.current?.destroy();
        currentAnimRef.current = null;
      }, 1200);
    }
  };

  return <div class="lottie-overlay" id="lottieOverlay" ref={hostRef} aria-hidden="true" />;
}

