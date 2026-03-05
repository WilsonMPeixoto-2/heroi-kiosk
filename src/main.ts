import './style.css';
import './styles/kiosk.css';
import { h, render as renderPreact } from 'preact';
import { SpectatorBus } from './core/bus';
import { StateMachine } from './core/state';
import {
  createInitialModel,
  createInitialSlotProgress,
  DREAM_SLOTS,
  MISSION_TOTAL_MS,
  TOOLS,
  type GameModel,
  type ScreenId,
  type SpectatorPublicState
} from './core/types';
import { InputManager } from './core/input/inputManager';
import { DiagnosticsOverlay } from './core/input/diagnosticsOverlay';
import { RemapWizard } from './core/input/remapWizard';
import { OverlayToasts } from './core/kiosk/overlays';
import { IdleController } from './core/kiosk/idle';
import { StartOrchestrator } from './core/kiosk/startOrchestrator';
import { initHardening } from './core/kiosk/hardening';
import { bindFocusNavigation, type FocusNavigator } from './core/kiosk/focus';
import { installVisibilityResilience } from './core/kiosk/visibility';
import { registerSW } from 'virtual:pwa-register';
import { gsap } from 'gsap';
import { Soundscape } from './core/audio/soundscape';
import { IDLE_RESET_MS, KIOSK_RUNTIME_FLAGS, SCREEN_TIMEOUTS_MS, TEST_MODE } from './core/constants';
import { OpsRecorder } from './ops/recorder';
import { OpsDebugPanel } from './ops/debugPanel';
import { createTimestampedFileName, downloadTextFile, exportEventsCsv, exportSessionJson, exportSessionsSummaryCsv } from './ops/export';
import { createCaptionsOverlay } from './ui/captionsOverlay';
import { createNarrationHooks } from './narration/hooks';
import { CaptionEngine } from './narration/captionEngine';
import { NarrationDirector } from './narration/narrationDirector';
import { narrationModeLabel } from './narration/settings';
import { get, getContentDataset, getVariant, type RngFn } from './content/copy';
import type { VariantSelection } from './content/schema';
import { App } from './ui-preact/App';
import { gameStore } from './core/store/gameStore';

const THEMES = new Set(['neon', 'clean', 'comic']);

const appRoot = document.querySelector<HTMLDivElement>('#app');
if (!appRoot) {
  throw new Error('Elemento #app não encontrado.');
}

applyThemeFromQuery();
applyKioskModeClasses();
const content = getContentDataset();
renderPreact(h(App, {}), appRoot);

const refs = {
  timerBadge: mustGetById<HTMLDivElement>('timerBadge'),
  timerValue: mustGetById<HTMLSpanElement>('timerValue'),
  energyValue: mustGetById<HTMLElement>('energyValue'),
  energyFill: mustGetById<HTMLElement>('energyFill'),
  vfxHost: mustGetById<HTMLDivElement>('vfxHost'),
  screenRoot: mustGetById<HTMLDivElement>('screenRoot'),
  audioToggle: mustGetById<HTMLButtonElement>('audioToggle'),
  narrationMode: mustGetById<HTMLButtonElement>('narrationMode'),
  narrationMute: mustGetById<HTMLButtonElement>('narrationMute'),
  spectatorRetry: mustGetById<HTMLButtonElement>('spectatorRetry')
};

const model: GameModel = createInitialModel();
gameStore.patch({
  screenId: model.screen,
  themeId: document.body.dataset.theme ?? 'neon',
  publicState: null
});
const machine = new StateMachine<ScreenId>('ATTRACT');
const spectatorBus = new SpectatorBus();
const input = new InputManager();
const diagnostics = new DiagnosticsOverlay();
const ops = new OpsRecorder();
const remapWizard = new RemapWizard(input, {
  onCompleted: () => ops.onRemapUsed()
});
const toasts = new OverlayToasts();
const orchestrator = new StartOrchestrator(toasts);
const soundscape = new Soundscape();
const captionEngine = new CaptionEngine({
  playerOverlay: createCaptionsOverlay(refs.screenRoot.parentElement ?? refs.screenRoot),
  onSpectatorForward: (text, durationMs) => spectatorBus.caption(text, durationMs),
  onSpectatorClear: () => spectatorBus.clearCaption()
});
const narration = new NarrationDirector(captionEngine, (key, tier) => {
  ops.onCopyVariantPicked(key, tier);
});
const narrationHooks = createNarrationHooks(narration, `narration-seed-${Date.now()}`);
const debugPanel = new OpsDebugPanel({
  getSnapshot: () => ops.getDashboardSnapshot(),
  onExportJson: () => {
    const payload = exportSessionJson(ops.getCurrentSession());
    downloadTextFile(createTimestampedFileName('telemetry-session', 'json'), 'application/json', payload);
    toasts.show('JSON exportado.', 'info', 2000);
  },
  onExportSummaryCsv: () => {
    const payload = exportSessionsSummaryCsv(ops.getExportSessions());
    downloadTextFile(createTimestampedFileName('telemetry-summary', 'csv'), 'text/csv;charset=utf-8', payload);
    toasts.show('CSV summary exportado.', 'info', 2000);
  },
  onExportEventsCsv: () => {
    const payload = exportEventsCsv(ops.getExportSessions());
    downloadTextFile(createTimestampedFileName('telemetry-events', 'csv'), 'text/csv;charset=utf-8', payload);
    toasts.show('CSV events exportado.', 'info', 2000);
  },
  onResetMetrics: () => {
    ops.resetAll();
    ops.onScreenEnter(machine.current);
    toasts.show('Métricas locais resetadas.', 'info', 2200);
  }
});
const vfx = createFxLayer(refs.vfxHost);
const idle = new IdleController(IDLE_RESET_MS, () => {
  if (machine.current !== 'ATTRACT') {
    resetToAttract('Sessão reiniciada por inatividade.', 'idle');
  }
});

let missionTimerId: number | null = null;
let screenTimeoutId: number | null = null;
let startInProgress = false;
let dHoldTimeoutId: number | null = null;
let lastFrameMs = performance.now();
let lastSpectatorProgressBucket = -1;
let skipNextResultScreenNarration = false;

const uiCopy = {
  attractTitle: '',
  attractSubtitle: '',
  attractCtaStart: '',
  introTitle: '',
  introLine1: '',
  introLine2: ''
};
const copyRng: RngFn = createContentRng();
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = reducedMotionQuery.matches;
document.body.classList.toggle('reduce-motion', reduceMotion);

const onReducedMotionChanged = (event: MediaQueryListEvent): void => {
  reduceMotion = event.matches;
  document.body.classList.toggle('reduce-motion', reduceMotion);
};
reducedMotionQuery.addEventListener('change', onReducedMotionChanged);

const hardening = KIOSK_RUNTIME_FLAGS.hardening
  ? initHardening({ rootEl: appRoot })
  : {
      focusRoot: () => appRoot.focus({ preventScroll: true }),
      dispose: () => undefined
    };

const focusNavigator = KIOSK_RUNTIME_FLAGS.focusNavigation
  ? bindFocusNavigation(refs.screenRoot)
  : createPassiveFocusNavigator(refs.screenRoot);

const visibility = KIOSK_RUNTIME_FLAGS.visibilityRecovery
  ? installVisibilityResilience({
      rootEl: appRoot,
      onVisible: () => {
        if (!model.sessionStarted) {
          hardening.focusRoot();
          return;
        }
        void orchestrator.wakeLock.request().then((ok) => {
          if (!ok) {
            ops.onWakeLockFail();
          }
        });
        hardening.focusRoot();
      }
    })
  : {
      dispose: () => undefined
    };

input.boot();
idle.touch();
void vfx.mount();

refs.audioToggle.addEventListener('click', () => {
  const enabled = !soundscape.isEnabled();
  soundscape.setEnabled(enabled);
  refs.audioToggle.textContent = `Som: ${enabled ? 'ON' : 'OFF'}`;
  idle.touch();
});
updateNarrationUi();

refs.narrationMode.addEventListener('click', () => {
  narration.cycleMode();
  updateNarrationUi();
  idle.touch();
});

refs.narrationMute.addEventListener('click', () => {
  narration.toggleMuted();
  updateNarrationUi();
  idle.touch();
});

refs.spectatorRetry.addEventListener('click', () => {
  const status = orchestrator.spectator.retry();
  if (!status.opened) {
    toasts.show('Pop-up bloqueado. Permita pop-ups para o domínio local.', 'warn', 4200);
    ops.onPopupBlocked();
  }
  idle.touch();
});
refs.screenRoot.addEventListener('click', onScreenRootClick);

window.addEventListener('pointerdown', () => {
  idle.touch();
  ops.onAction('POINTER', 'pointer');
});

window.addEventListener('keydown', (event) => {
  idle.touch();
  if (event.code === 'KeyD' && !event.repeat && dHoldTimeoutId === null) {
    dHoldTimeoutId = window.setTimeout(() => {
      debugPanel.toggle();
      dHoldTimeoutId = null;
    }, 1000);
  }

  if (!TEST_MODE) {
    return;
  }

  if (event.code === 'F9') {
    event.preventDefault();
    jumpToRepairForTest();
  } else if (event.code === 'F10') {
    event.preventDefault();
    jumpToResultForTest();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'KeyD' && dHoldTimeoutId !== null) {
    window.clearTimeout(dHoldTimeoutId);
    dHoldTimeoutId = null;
  }
});

window.addEventListener('blur', () => {
  if (dHoldTimeoutId !== null) {
    window.clearTimeout(dHoldTimeoutId);
    dHoldTimeoutId = null;
  }
});

machine.onChange((next) => {
  model.screen = next;
  gameStore.setScreen(next);
  ops.onScreenEnter(next);
  onScreenEntered(next);
  renderCurrentScreenWithNativeTransition(next);
});

ops.onScreenEnter(machine.current);
onScreenEntered(machine.current);
renderCurrentScreen();
gameStore.patch({
  screenId: machine.current,
  publicState: getPublicState()
});

requestAnimationFrame(loop);
const updateServiceWorker = registerSW({
  immediate: true,
  onOfflineReady() {
    toasts.show('Modo offline pronto para uso.', 'info', 2000);
  },
  onNeedRefresh() {
    toasts.show('Atualização detectada. Reiniciando experiência...', 'info', 2400);
    window.setTimeout(() => {
      void updateServiceWorker(true);
    }, 1100);
  },
  onRegisterError() {
    toasts.show('Falha ao registrar cache offline.', 'warn', 2800);
  }
});

window.addEventListener('beforeunload', () => {
  if (model.sessionStarted) {
    ops.endRun({
      reason: 'abort',
      outcome: 'aborted',
      completedSlots: getCompletedSlotsCount(),
      maxCombo: model.maxCombo,
      missionMsLeft: model.missionMsLeft,
      badge: model.resultBadge
    });
  }
  ops.endSession();
  input.dispose();
  remapWizard.dispose();
  debugPanel.destroy();
  focusNavigator.dispose();
  visibility.dispose();
  hardening.dispose();
  reducedMotionQuery.removeEventListener('change', onReducedMotionChanged);
  narration.destroy();
  soundscape.stopAmbient();
  vfx.destroy();
});

function loop(nowMs: number): void {
  const dtMs = Math.min(50, Math.max(0, nowMs - lastFrameMs));
  lastFrameMs = nowMs;
  ops.update(dtMs);

  const snapshot = input.tick();
  diagnostics.update(snapshot);
  remapWizard.tick();

  if (snapshot.pressed.size > 0) {
    idle.touch();
    snapshot.pressed.forEach((action) => {
      ops.onAction(action, snapshot.source);
    });
  }

  if (input.wasPressed('DEBUG')) {
    diagnostics.toggle();
    debugPanel.toggle();
  }

  if (input.wasPressed('CALIBRATE')) {
    remapWizard.open();
    soundscape.play('click');
  }

  if (!remapWizard.isActive()) {
    handleActionNavigation();
  }

  requestAnimationFrame(loop);
}

function handleActionNavigation(): void {
  const current = machine.current;

  if (input.wasPressed('SKIP')) {
    narration.skipCurrent();
  }

  if (current === 'ATTRACT' && (input.wasPressed('START') || input.wasPressed('CONFIRM'))) {
    void beginSession();
    return;
  }

  if (current === 'INTRO' && (input.wasPressed('SKIP') || input.wasPressed('CONFIRM') || input.wasPressed('START'))) {
    machine.transition('AVATAR');
    return;
  }

  if (current === 'RESULT' && (input.wasPressed('CONFIRM') || input.wasPressed('START'))) {
    resetToAttract('Nova sessão pronta.', 'manual');
    return;
  }

  if (input.wasPressed('DOWN') || input.wasPressed('RIGHT')) {
    focusNavigator.move(1);
  }

  if (input.wasPressed('UP') || input.wasPressed('LEFT')) {
    focusNavigator.move(-1);
  }

  if (input.wasPressed('CONFIRM')) {
    focusNavigator.activateFocused();
  }

  if (input.wasPressed('CANCEL')) {
    focusNavigator.activateBack();
  }
}

async function beginSession(): Promise<void> {
  if (startInProgress) {
    return;
  }

  startInProgress = true;
  try {
    const status = await orchestrator.startSession({
      fullscreen: true,
      spectator: true,
      wakeLock: true
    });

    narration.markStartGesture();
    await soundscape.activate();
    soundscape.play('confirm');

    if (status.popupBlocked) {
      refs.spectatorRetry.classList.add('warning');
    } else {
      refs.spectatorRetry.classList.remove('warning');
    }
    if (!status.fullscreenReady) {
      ops.onFullscreenFail();
    }
    if (status.popupBlocked) {
      ops.onPopupBlocked();
    }
    if (!status.wakeLockReady) {
      ops.onWakeLockFail();
    }

    model.sessionStarted = true;
    model.missionMsLeft = MISSION_TOTAL_MS;
    model.toolkit = [];
    model.repair = {
      armedTool: null,
      slotProgress: createInitialSlotProgress(),
      feedback: get<string>('screens.repair.initialFeedback')
    };
    model.comboStreak = 0;
    model.maxCombo = 0;
    model.resultBadge = 'Selo Inicial';
    model.resultTitle = 'Missão em andamento';
    model.resultMessage = 'Siga as etapas e restaure o módulo.';
    ops.startRun(input.getSource());

    startMissionTimer();
    machine.transition('INTRO');
  } catch {
    toasts.show('Não foi possível iniciar a sessão. Tente novamente.', 'warn', 3200);
  } finally {
    startInProgress = false;
  }
}

function onScreenEntered(screen: ScreenId): void {
  clearScreenTimeout();

  switch (screen) {
    case 'ATTRACT':
      stopMissionTimer();
      refs.timerBadge.classList.remove('danger');
      soundscape.fadeAmbientTo(0.18, 400);
      break;
    case 'INTRO':
      soundscape.fadeAmbientTo(0.24, 350);
      setScreenTimeout(SCREEN_TIMEOUTS_MS.INTRO, () => machine.transition('AVATAR'));
      break;
    case 'AVATAR':
      soundscape.fadeAmbientTo(0.26, 300);
      setScreenTimeout(SCREEN_TIMEOUTS_MS.AVATAR, () => machine.transition('TOOLKIT'));
      break;
    case 'TOOLKIT':
      soundscape.fadeAmbientTo(0.28, 300);
      setScreenTimeout(SCREEN_TIMEOUTS_MS.TOOLKIT, () => {
        autoCompleteToolkit();
        machine.transition('REPAIR');
      });
      break;
    case 'REPAIR': {
      model.repair = {
        armedTool: model.toolkit[0] ?? null,
        slotProgress: createInitialSlotProgress(),
        feedback: get<string>('screens.repair.initialFeedback')
      };
      model.comboStreak = 0;
      ops.setRepairProgress(0);
      soundscape.fadeAmbientTo(0.34, 260);

      setScreenTimeout(SCREEN_TIMEOUTS_MS.REPAIR, () => {
        const completed = getCompletedSlotsCount();
        const outcome = completed >= 2 ? 'partial' : 'timeout';
        if (outcome === 'timeout') {
          void narrationHooks.onRepairTimeout()
            .then((cue) => {
              model.repair.feedback = cue.text;
              if (machine.current === 'REPAIR') {
                renderCurrentScreen();
              }
            })
            .finally(() => {
              window.setTimeout(() => {
                finishMission(outcome);
              }, 620);
            });
          return;
        }
        finishMission(outcome);
      });
      break;
    }
    case 'RESULT':
      soundscape.fadeAmbientTo(0.2, 450);
      setScreenTimeout(SCREEN_TIMEOUTS_MS.RESULT, () => {
        resetToAttract('Auto-reset concluído.', 'result');
      });
      break;
    default:
      break;
  }

  refreshUiCopyForScreen(screen);
  if (screen === 'RESULT' && skipNextResultScreenNarration) {
    skipNextResultScreenNarration = false;
    return;
  }
  void narrationHooks.onScreenEnter(screen);
}

function renderCurrentScreen(): void {
  gameStore.patch({
    uiView: {
      model: cloneGameModel(model),
      uiCopy: { ...uiCopy }
    }
  });
  window.requestAnimationFrame(() => {
    focusNavigator.refresh();
    focusNavigator.focusPrimaryAction();
    animateScreenTransition(machine.current);
  });
  updateHud();
  syncSpectator();
}

function renderCurrentScreenWithNativeTransition(screen: ScreenId): void {
  if (reduceMotion) {
    renderCurrentScreen();
    return;
  }

  const transitionDoc = document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> };
  };
  if (typeof transitionDoc.startViewTransition !== 'function') {
    renderCurrentScreen();
    return;
  }

  transitionDoc.startViewTransition(() => {
    renderCurrentScreen();
  }).finished.catch(() => {
    // Falha de transição nativa não pode interromper o fluxo do kiosk.
    animateScreenTransition(screen);
  });
}

function onScreenRootClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const node = target.closest<HTMLElement>('[data-action]');
  if (!node || !refs.screenRoot.contains(node)) {
    return;
  }
  idle.touch();
  handleClickAction(node.dataset.action ?? '', node);
}

function handleClickAction(action: string, node: HTMLElement): void {
  switch (action) {
    case 'start-session':
      soundscape.play('confirm');
      void beginSession();
      break;
    case 'open-spectator': {
      soundscape.play('click');
      const status = orchestrator.spectator.retry();
      if (!status.opened) {
        toasts.show('Pop-up bloqueado. Permita pop-ups para este domínio.', 'warn', 4200);
        ops.onPopupBlocked();
      }
      break;
    }
    case 'skip-intro':
      soundscape.play('confirm');
      narration.skipCurrent();
      machine.transition('AVATAR');
      break;
    case 'avatar-set': {
      const kind = node.dataset.kind;
      const value = Number(node.dataset.value);
      if (Number.isNaN(value)) return;
      if (kind === 'skin') model.avatar.skin = value;
      if (kind === 'hair') model.avatar.hair = value;
      if (kind === 'eyes') model.avatar.eyes = value;
      if (kind === 'outfit') model.avatar.outfit = value;
      if (kind === 'skin' || kind === 'hair' || kind === 'eyes' || kind === 'outfit') {
        ops.onAvatarChoice(kind, value);
      }
      soundscape.play('click');
      renderCurrentScreen();
      break;
    }
    case 'avatar-accessory': {
      const value = Number(node.dataset.value);
      if (Number.isNaN(value)) return;
      model.avatar.accessory = value;
      ops.onAvatarChoice('accessory', value);
      soundscape.play('click');
      renderCurrentScreen();
      break;
    }
    case 'back-intro':
      machine.transition('INTRO');
      break;
    case 'go-toolkit':
      soundscape.play('confirm');
      machine.transition('TOOLKIT');
      break;
    case 'back-avatar':
      machine.transition('AVATAR');
      break;
    case 'toggle-tool': {
      const tool = node.dataset.tool;
      if (!tool) return;
      const index = model.toolkit.indexOf(tool);
      if (index >= 0) {
        model.toolkit.splice(index, 1);
      } else if (model.toolkit.length < 3) {
        model.toolkit.push(tool);
        ops.onToolkitChoice(tool);
      }
      soundscape.play('click');
      renderCurrentScreen();
      updateHud();
      syncSpectator();
      break;
    }
    case 'go-repair':
      soundscape.play('confirm');
      machine.transition('REPAIR');
      break;
    case 'back-toolkit':
      machine.transition('TOOLKIT');
      break;
    case 'arm-tool': {
      const tool = node.dataset.tool;
      if (!tool) return;
      model.repair.armedTool = tool;
      model.repair.feedback = `Ferramenta ativa: ${TOOLS.find((item) => item.id === tool)?.label ?? tool}`;
      soundscape.play('confirm');
      renderCurrentScreen();
      syncSpectator();
      break;
    }
    case 'apply-tool': {
      const slotId = node.dataset.slot;
      if (!slotId) return;
      applyArmedToolToSlot(slotId);
      renderCurrentScreen();
      updateHud();
      syncSpectator();
      break;
    }
    case 'finish-repair':
      finishMission('full');
      break;
    case 'play-again':
      soundscape.play('confirm');
      resetToAttract('Nova sessão iniciada.', 'manual');
      break;
    case 'go-memory':
      toasts.show('Transição pronta: encaminhe para o jogo da memória.', 'info', 3600);
      break;
    default:
      break;
  }
}

function autoCompleteToolkit(): void {
  if (model.toolkit.length >= 3) {
    return;
  }

  for (const tool of TOOLS) {
    if (model.toolkit.length >= 3) {
      break;
    }
    if (!model.toolkit.includes(tool.id)) {
      model.toolkit.push(tool.id);
      ops.onToolkitChoice(tool.id);
    }
  }
}

function applyArmedToolToSlot(slotId: string): void {
  const slot = DREAM_SLOTS.find((entry) => entry.id === slotId);
  const slotIndex = DREAM_SLOTS.findIndex((entry) => entry.id === slotId);
  const armedTool = model.repair.armedTool;
  const setFeedbackFromCue = (text: string, append = false): void => {
    model.repair.feedback = append ? `${model.repair.feedback} ${text}`.trim() : text;
    if (machine.current === 'REPAIR') {
      renderCurrentScreen();
      syncSpectator();
    }
  };

  if (!slot || !armedTool) {
    void narrationHooks.onRepairNeedTool().then((cue) => {
      setFeedbackFromCue(cue.text);
    });
    soundscape.play('cancel');
    triggerHaptics([40]);
    ops.onRepairHit(slotId, armedTool ?? 'none', false);
    return;
  }

  const slotName = content.screens.repair.slotNames[slot.id] ?? slot.label;
  const current = model.repair.slotProgress[slot.id] ?? 0;
  if (current >= 2) {
    void narrationHooks.onRepairAlreadyStable(slotName).then((cue) => {
      setFeedbackFromCue(cue.text);
    });
    triggerHaptics([14]);
    return;
  }

  if (slot.acceptedTools.includes(armedTool)) {
    model.repair.slotProgress[slot.id] = Math.min(2, current + 1);
    const now = model.repair.slotProgress[slot.id];
    ops.onRepairHit(slot.id, armedTool, true);
    model.comboStreak += 1;
    model.maxCombo = Math.max(model.maxCombo, model.comboStreak);
    soundscape.play(now >= 2 ? 'repairComplete' : 'repairHit');

    if (now >= 2) {
      void narrationHooks.onSlotComplete(slot.id).then((cue) => {
        setFeedbackFromCue(cue.text);
      });
      emitLottie('slot');
      triggerHaptics([20, 18, 35]);
    } else {
      void narrationHooks.onRepairHit(true).then((cue) => {
        setFeedbackFromCue(cue.text);
      });
      triggerHaptics([16]);
    }

    if (model.comboStreak >= 3) {
      soundscape.play('reward');
      vfx.successWave();
      triggerHaptics([28, 20, 28]);
      void narrationHooks.onCombo(model.comboStreak).then((cue) => {
        setFeedbackFromCue(cue.text, true);
      });
    }
    if (now >= 2) {
      ops.onRepairSlotComplete(slot.id);
    }
    vfx.burst(0.24 + (slotIndex % 2) * 0.52, 0.45 + Math.floor(slotIndex / 2) * 0.2, 0x45cf78);
  } else {
    model.repair.slotProgress[slot.id] = Math.max(0, current - 1);
    ops.onRepairHit(slot.id, armedTool, false);
    model.comboStreak = 0;
    void narrationHooks.onRepairHit(false).then((cue) => {
      setFeedbackFromCue(cue.text);
    });
    soundscape.play('cancel');
    triggerHaptics([45]);
    vfx.burst(0.24 + (slotIndex % 2) * 0.52, 0.45 + Math.floor(slotIndex / 2) * 0.2, 0xfb6542);
  }

  const completed = getCompletedSlotsCount();
  ops.setRepairProgress(completed / DREAM_SLOTS.length);
  if (completed >= 3) {
    finishMission('full');
  }
}

function getCompletedSlotsCount(): number {
  return DREAM_SLOTS.filter((slot) => (model.repair.slotProgress[slot.id] ?? 0) >= 2).length;
}

function finishMission(mode: 'full' | 'partial' | 'timeout'): void {
  if (machine.current === 'RESULT') {
    return;
  }

  clearScreenTimeout();
  stopMissionTimer();
  model.sessionStarted = false;
  const titleSelection = pickVariantByPath(
    `screens.result.${mode}.title`,
    `RESULT.${mode}.title`
  );
  const messageSelection = pickVariantByPath(
    `screens.result.${mode}.message`,
    `RESULT.${mode}.message`
  );

  const rare = isRareTier(titleSelection.tier) || isRareTier(messageSelection.tier);
  model.resultBadge = pickResultBadge(mode, rare);
  model.resultTitle = titleSelection.text;
  model.resultMessage = messageSelection.text;

  if (mode === 'full') {
    soundscape.play('result');
    soundscape.play('reward');
    vfx.successWave();
    emitLottie('result');
    triggerHaptics([35, 22, 70]);
  } else if (mode === 'partial') {
    soundscape.play('repairComplete');
    emitLottie('result');
    triggerHaptics([22, 20, 30]);
  } else {
    soundscape.play('cancel');
    triggerHaptics([55]);
  }

  skipNextResultScreenNarration = true;
  void narrationHooks.onResult(mode);

  ops.endRun({
    reason: 'result',
    outcome: mode,
    completedSlots: getCompletedSlotsCount(),
    maxCombo: model.maxCombo,
    missionMsLeft: model.missionMsLeft,
    badge: model.resultBadge
  });

  machine.transition('RESULT');
}

function resetToAttract(message: string, reason: 'manual' | 'idle' | 'result'): void {
  clearScreenTimeout();
  stopMissionTimer();
  narration.interrupt();
  if (model.sessionStarted) {
    ops.endRun({
      reason,
      outcome: 'aborted',
      completedSlots: getCompletedSlotsCount(),
      maxCombo: model.maxCombo,
      missionMsLeft: model.missionMsLeft,
      badge: model.resultBadge
    });
  }
  ops.onReset(reason);
  spectatorBus.reset();
  model.sessionStarted = false;
  model.missionMsLeft = MISSION_TOTAL_MS;
  model.toolkit = [];
  model.repair = {
    armedTool: null,
    slotProgress: createInitialSlotProgress(),
    feedback: get<string>('screens.repair.initialFeedback')
  };
  model.comboStreak = 0;
  model.maxCombo = 0;
  model.resultTitle = 'Missão pronta para começar';
  model.resultMessage = 'Aperte START para liderar o resgate do Módulo dos Sonhos.';
  model.resultBadge = 'Selo Inicial';
  toasts.show(message, 'info', 2200);
  machine.transition('ATTRACT');
}

function jumpToRepairForTest(): void {
  ensureSessionForTest();
  autoCompleteToolkit();
  machine.transition('REPAIR');
}

function jumpToResultForTest(): void {
  ensureSessionForTest();
  autoCompleteToolkit();
  const progress = createInitialSlotProgress();
  DREAM_SLOTS.slice(0, 3).forEach((slot) => {
    progress[slot.id] = 2;
  });
  model.repair.slotProgress = progress;
  model.maxCombo = Math.max(model.maxCombo, 3);
  finishMission('partial');
}

function ensureSessionForTest(): void {
  if (model.sessionStarted) {
    return;
  }
  ops.startRun('unknown');
  model.sessionStarted = true;
  model.missionMsLeft = MISSION_TOTAL_MS;
  model.comboStreak = 0;
  model.maxCombo = 0;
  startMissionTimer();
}

function updateHud(): void {
  const left = Math.max(0, model.missionMsLeft);
  const minutes = String(Math.floor(left / 60_000)).padStart(2, '0');
  const seconds = String(Math.floor((left % 60_000) / 1000)).padStart(2, '0');
  const energy = Math.max(0, Math.round((left / MISSION_TOTAL_MS) * 100));

  refs.timerValue.textContent = `${minutes}:${seconds}`;
  refs.energyValue.textContent = `${energy}%`;
  refs.energyFill.style.width = `${energy}%`;

  refs.timerBadge.classList.toggle('danger', left <= 30_000 && machine.current !== 'ATTRACT' && machine.current !== 'RESULT');
}

function refreshUiCopyForScreen(screen: ScreenId): void {
  if (screen === 'ATTRACT') {
    uiCopy.attractTitle = pickVariantByPath('screens.attract.title', 'ATTRACT.title').text;
    uiCopy.attractSubtitle = pickVariantByPath('screens.attract.subtitle', 'ATTRACT.subtitle').text;
    uiCopy.attractCtaStart = pickVariantByPath('screens.attract.ctaStart', 'ATTRACT.cta').text;
  }

  if (screen === 'INTRO') {
    uiCopy.introTitle = pickVariantByPath('screens.intro.title', 'INTRO.title').text;
    uiCopy.introLine1 = pickVariantByPath('screens.intro.line1', 'INTRO.line1').text;
    uiCopy.introLine2 = pickVariantByPath('screens.intro.line2', 'INTRO.line2').text;
  }
}

function pickVariantByPath(path: string, key: string): VariantSelection {
  const selection = getVariant(path, copyRng);
  if (isRareTier(selection.tier)) {
    ops.onCopyVariantPicked(key, selection.tier);
  }
  return selection;
}

function isRareTier(tier: VariantSelection['tier']): boolean {
  return tier === 'rare' || tier === 'legendary';
}

function updateNarrationUi(): void {
  const settings = narration.getSettings();
  refs.narrationMode.textContent = narrationModeLabel(settings.mode);
  refs.narrationMute.textContent = `Narração: ${settings.muted ? 'MUTE' : 'ON'}`;
  refs.narrationMute.classList.toggle('warning', settings.muted);
}

function startMissionTimer(): void {
  stopMissionTimer();

  missionTimerId = window.setInterval(() => {
    if (!model.sessionStarted) {
      return;
    }

    model.missionMsLeft = Math.max(0, model.missionMsLeft - 1000);
    updateHud();
    syncSpectator();

    if (model.missionMsLeft <= 0 && machine.current !== 'RESULT' && machine.current !== 'ATTRACT') {
      finishMission('timeout');
    }
  }, 1000);
}

function stopMissionTimer(): void {
  if (missionTimerId !== null) {
    window.clearInterval(missionTimerId);
    missionTimerId = null;
  }
}

function setScreenTimeout(ms: number, handler: () => void): void {
  clearScreenTimeout();
  screenTimeoutId = window.setTimeout(handler, ms);
}

function clearScreenTimeout(): void {
  if (screenTimeoutId !== null) {
    window.clearTimeout(screenTimeoutId);
    screenTimeoutId = null;
  }
}

function syncSpectator(): void {
  const publicState = getPublicState();
  spectatorBus.sync(publicState);
  gameStore.patch({
    publicState
  });

  if (machine.current !== 'REPAIR') {
    lastSpectatorProgressBucket = -1;
    return;
  }

  const progress01 = publicState.repair.completed / Math.max(1, publicState.repair.total);
  const bucket = Math.max(0, Math.min(4, Math.floor(progress01 * 4)));
  if (bucket !== lastSpectatorProgressBucket) {
    lastSpectatorProgressBucket = bucket;
    void narrationHooks.onSpectatorProgress(progress01);
  }
}

function getPublicState(): SpectatorPublicState {
  return {
    screen: machine.current,
    missionMsLeft: model.missionMsLeft,
    avatar: model.avatar,
    toolkit: model.toolkit,
    repair: {
      completed: getCompletedSlotsCount(),
      total: DREAM_SLOTS.length,
      slotProgress: model.repair.slotProgress
    }
  };
}

function animateScreenTransition(screen: ScreenId): void {
  const content = refs.screenRoot.querySelector<HTMLElement>('.content');
  const screenEl = refs.screenRoot.querySelector<HTMLElement>('.screen');
  const bgEl = refs.screenRoot.querySelector<HTMLElement>('.screen-bg');
  if (!content) {
    return;
  }

  gsap.killTweensOf([content, screenEl, bgEl]);
  if (reduceMotion) {
    gsap.fromTo(content, { autoAlpha: 0.96 }, { autoAlpha: 1, duration: 0.14, ease: 'none' });
    return;
  }

  const profiles: Record<ScreenId, gsap.TweenVars> = {
    ATTRACT: { autoAlpha: 0, scale: 0.985, filter: 'blur(10px)' },
    INTRO: { autoAlpha: 0, x: 26, filter: 'blur(8px)' },
    AVATAR: { autoAlpha: 0, y: 18, scale: 0.99, filter: 'blur(8px)' },
    TOOLKIT: { autoAlpha: 0, x: -22, filter: 'blur(6px)' },
    REPAIR: { autoAlpha: 0, y: 24, rotationX: -5, transformOrigin: '50% 0%', filter: 'blur(9px)' },
    RESULT: { autoAlpha: 0, scale: 0.96, filter: 'blur(12px)' }
  };

  const timeline = gsap.timeline({ defaults: { overwrite: 'auto' } });
  if (bgEl) {
    timeline.fromTo(
      bgEl,
      { autoAlpha: 0.62, scale: 1.08, filter: 'saturate(0.9) contrast(0.95) blur(3px)' },
      { autoAlpha: 1, scale: 1.02, filter: 'saturate(1.08) contrast(1.04) blur(0px)', duration: 0.52, ease: 'power1.out' },
      0
    );
  }
  if (screenEl && (screen === 'ATTRACT' || screen === 'RESULT')) {
    timeline.fromTo(
      screenEl,
      { boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06), 0 0 0 rgba(45,226,230,0)' },
      { boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06), 0 0 32px rgba(45,226,230,.24)', duration: 0.34, ease: 'power2.out' },
      0.06
    );
  }

  timeline.fromTo(
    content,
    profiles[screen],
    {
      autoAlpha: 1,
      x: 0,
      y: 0,
      scale: 1,
      rotationX: 0,
      filter: 'blur(0px)',
      duration: 0.44,
      ease: screen === 'RESULT' ? 'back.out(1.08)' : 'power2.out'
    },
    0.06
  );

  const headline = content.querySelector<HTMLElement>('h2');
  const paragraphs = Array.from(content.querySelectorAll<HTMLElement>('p'));
  const buttons = Array.from(content.querySelectorAll<HTMLElement>('.button-row .btn'));
  const featured = getFeaturedMotionTargets(content, screen);

  if (headline) {
    timeline.fromTo(
      headline,
      { autoAlpha: 0, y: 16, letterSpacing: '0.03em' },
      { autoAlpha: 1, y: 0, letterSpacing: '0.01em', duration: 0.36, ease: 'power2.out' },
      0.12
    );
  }

  if (paragraphs.length > 0) {
    timeline.fromTo(
      paragraphs.slice(0, 2),
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power1.out', stagger: 0.05 },
      0.16
    );
  }

  if (featured.length > 0) {
    timeline.fromTo(
      featured,
      { autoAlpha: 0, y: 14, scale: 0.98 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out', stagger: 0.018 },
      0.2
    );
  }

  if (buttons.length > 0) {
    timeline.fromTo(
      buttons,
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.26, ease: 'power2.out', stagger: 0.04 },
      0.28
    );
  }
}

function getFeaturedMotionTargets(content: HTMLElement, screen: ScreenId): HTMLElement[] {
  switch (screen) {
    case 'AVATAR':
      return [
        ...Array.from(content.querySelectorAll<HTMLElement>('.swatch')).slice(0, 8),
        ...Array.from(content.querySelectorAll<HTMLElement>('.pill-option')).slice(0, 6)
      ];
    case 'TOOLKIT':
      return Array.from(content.querySelectorAll<HTMLElement>('.tool-card')).slice(0, 8);
    case 'REPAIR':
      return Array.from(content.querySelectorAll<HTMLElement>('.slot, .tool-chip')).slice(0, 10);
    case 'RESULT':
      return Array.from(content.querySelectorAll<HTMLElement>('.summary-grid article')).slice(0, 6);
    default:
      return [];
  }
}

function triggerHaptics(pattern: number | number[]): void {
  if (reduceMotion) {
    return;
  }

  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern);
  }

  const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
  for (const pad of pads) {
    if (!pad) {
      continue;
    }
    const haptics = (pad as Gamepad & { hapticActuators?: Array<{ pulse(strength: number, duration: number): Promise<boolean> }> })
      .hapticActuators;
    if (!haptics || haptics.length === 0) {
      continue;
    }

    const sequence = Array.isArray(pattern) ? pattern : [pattern];
    const total = sequence.reduce((sum, part) => sum + part, 0);
    void haptics[0]?.pulse(0.75, Math.min(160, total));
  }
}

function emitLottie(mode: 'result' | 'slot'): void {
  window.dispatchEvent(
    new CustomEvent('heroi:lottie:play', {
      detail: {
        mode
      }
    })
  );
}

function cloneGameModel(source: GameModel): GameModel {
  return {
    ...source,
    avatar: { ...source.avatar },
    toolkit: [...source.toolkit],
    repair: {
      ...source.repair,
      slotProgress: { ...source.repair.slotProgress }
    }
  };
}

function pickResultBadge(mode: 'full' | 'partial' | 'timeout', rare: boolean): string {
  if (rare) {
    return 'Selo Aurora Suprema';
  }

  if (mode === 'full') {
    const badges = ['Guardião Criativo', 'Arquiteto dos Sonhos', 'Engenheiro do Amanhã'];
    return badges[Math.floor(Math.random() * badges.length)] ?? badges[0];
  }

  if (mode === 'partial') {
    const badges = ['Reconstrutor em Campo', 'Progresso em Ação', 'Núcleo em Evolução'];
    return badges[Math.floor(Math.random() * badges.length)] ?? badges[0];
  }

  return 'Persistência em Missão';
}

type FxLayer = {
  mount: () => Promise<void>;
  burst: (xRatio: number, yRatio: number, color?: number) => void;
  successWave: () => void;
  destroy: () => void;
};

function createFxLayer(host: HTMLElement): FxLayer {
  let instance: {
    mount(hostElement: HTMLElement): Promise<void>;
    burst(xRatio: number, yRatio: number, color?: number): void;
    successWave(): void;
    destroy(): void;
  } | null = null;
  let loading: Promise<void> | null = null;

  const ensure = async (): Promise<void> => {
    if (instance || loading) {
      return loading ?? Promise.resolve();
    }

    loading = import('./core/vfx/pixiLayer')
      .then(async (module) => {
        instance = new module.PixiFxLayer();
        await instance.mount(host);
      })
      .catch(() => {
        instance = null;
      })
      .finally(() => {
        loading = null;
      });

    await loading;
  };

  return {
    mount: async () => {
      await ensure();
    },
    burst: (xRatio, yRatio, color) => {
      void ensure().then(() => {
        instance?.burst(xRatio, yRatio, color);
      });
    },
    successWave: () => {
      void ensure().then(() => {
        instance?.successWave();
      });
    },
    destroy: () => {
      instance?.destroy();
      instance = null;
    }
  };
}

function applyThemeFromQuery(): void {
  const params = new URLSearchParams(window.location.search);
  const theme = params.get('theme')?.toLowerCase();
  document.body.dataset.theme = theme && THEMES.has(theme) ? theme : 'neon';
}

function applyKioskModeClasses(): void {
  const html = document.documentElement;
  const cssEnabled = KIOSK_RUNTIME_FLAGS.enabled || KIOSK_RUNTIME_FLAGS.hardening;
  if (cssEnabled) {
    html.classList.add('kiosk-enabled');
    document.body.classList.add('kiosk-enabled');
  } else {
    html.classList.remove('kiosk-enabled');
    document.body.classList.remove('kiosk-enabled');
  }

  document.body.dataset.kioskMode = KIOSK_RUNTIME_FLAGS.enabled ? 'on' : 'off';
  document.body.dataset.kioskHardening = KIOSK_RUNTIME_FLAGS.hardening ? 'on' : 'off';
  document.body.dataset.kioskFocus = KIOSK_RUNTIME_FLAGS.focusNavigation ? 'on' : 'off';
  document.body.dataset.kioskVisibility = KIOSK_RUNTIME_FLAGS.visibilityRecovery ? 'on' : 'off';
}

function createPassiveFocusNavigator(rootEl: HTMLElement): FocusNavigator {
  return {
    refresh: () => undefined,
    move: () => undefined,
    activateFocused: () => {
      const primary = rootEl.querySelector<HTMLElement>('[data-primary="1"]:not([disabled])');
      if (primary) {
        primary.click();
        return;
      }
      const first = rootEl.querySelector<HTMLElement>('[data-focusable="true"]:not([disabled])');
      first?.click();
    },
    activateBack: () => {
      const back = rootEl.querySelector<HTMLElement>('[data-role="back"]:not([disabled])');
      back?.click();
    },
    focusPrimaryAction: () => undefined,
    dispose: () => undefined
  };
}

function createContentRng(): RngFn {
  let seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

function mustGetById<TElement extends HTMLElement>(id: string): TElement {
  const node = document.getElementById(id);
  if (!node) {
    throw new Error(`Elemento #${id} não encontrado.`);
  }
  return node as TElement;
}
