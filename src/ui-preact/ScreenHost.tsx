import { ACCESSORIES, DREAM_SLOTS, EYE_COLORS, HAIR_COLORS, OUTFIT_COLORS, SKIN_COLORS, TOOLS, type ScreenId } from '../core/types';
import { SCREEN_ORDER } from '../core/constants';
import { getContentDataset } from '../content/copy';
import { useGameStore } from './useGameStore';
import { AvatarView } from './components/AvatarView';

const content = getContentDataset();

export function ScreenHost() {
  const snapshot = useGameStore();
  const view = snapshot.uiView;
  if (!view) {
    return (
      <section class="panel stage">
        <nav class="steps" id="steps" />
        <div id="vfxHost" class="vfx-host" />
        <div id="screenRoot" />
      </section>
    );
  }

  return (
    <section class="panel stage">
      <nav class="steps" id="steps">
        {SCREEN_ORDER.map((screenId: ScreenId) => (
          <span class={`step ${snapshot.screenId === screenId ? 'is-active' : ''}`}>{stepLabel(screenId)}</span>
        ))}
      </nav>
      <div id="vfxHost" class="vfx-host" />
      <div id="screenRoot">
        {snapshot.screenId === 'ATTRACT' && <AttractScreen />}
        {snapshot.screenId === 'INTRO' && <IntroScreen />}
        {snapshot.screenId === 'AVATAR' && <AvatarScreen />}
        {snapshot.screenId === 'TOOLKIT' && <ToolkitScreen />}
        {snapshot.screenId === 'REPAIR' && <RepairScreen />}
        {snapshot.screenId === 'RESULT' && <ResultScreen />}
      </div>
    </section>
  );
}

function AttractScreen() {
  const { uiView } = useGameStore();
  if (!uiView) return null;
  return (
    <section class="screen screen-attract" data-testid="screen-attract">
      <div class="screen-bg bg-distopia" />
      <div class="content">
        <p class="pill">{content.screens.attract.pill}</p>
        <h2>{uiView.uiCopy.attractTitle}</h2>
        <p>{uiView.uiCopy.attractSubtitle}</p>
        <div class="button-row">
          <button class="btn primary" data-action="start-session" data-primary="1" data-focusable="true" data-testid="start-session">
            {uiView.uiCopy.attractCtaStart}
          </button>
          <button class="btn ghost" data-action="open-spectator" data-focusable="true">
            {content.screens.attract.ctaSpectator}
          </button>
        </div>
      </div>
    </section>
  );
}

function IntroScreen() {
  const { uiView } = useGameStore();
  if (!uiView) return null;
  return (
    <section class="screen screen-intro" data-testid="screen-intro">
      <div class="screen-bg bg-distopia" />
      <div class="content">
        <h2>{uiView.uiCopy.introTitle}</h2>
        <p>{uiView.uiCopy.introLine1}</p>
        <p>{uiView.uiCopy.introLine2}</p>
        <div class="button-row">
          <button class="btn primary" data-action="skip-intro" data-primary="1" data-focusable="true" data-testid="skip-intro">
            {content.screens.intro.continueCta}
          </button>
        </div>
      </div>
    </section>
  );
}

function AvatarScreen() {
  const { uiView } = useGameStore();
  if (!uiView) return null;
  const avatar = uiView.model.avatar;
  return (
    <section class="screen screen-avatar" data-testid="screen-avatar">
      <div class="screen-bg bg-lab" />
      <div class="content">
        <h2>{content.screens.avatar.title}</h2>
        <p>{content.screens.avatar.subtitle}</p>
        <div class="avatar-layout">
          <div class="avatar-preview">
            <AvatarView
              skinTone={avatar.skin}
              hairStyle={avatar.hair}
              eyeStyle={avatar.eyes}
              outfitStyle={avatar.outfit}
              accessoryId={avatar.accessory}
              mood="confident"
            />
          </div>
          <div class="avatar-controls">
            <Swatches label="Tom de pele" kind="skin" colors={SKIN_COLORS} selectedIndex={avatar.skin} />
            <Swatches label="Cabelo" kind="hair" colors={HAIR_COLORS} selectedIndex={avatar.hair} />
            <Swatches label="Olhos" kind="eyes" colors={EYE_COLORS} selectedIndex={avatar.eyes} />
            <Swatches label="Traje" kind="outfit" colors={OUTFIT_COLORS} selectedIndex={avatar.outfit} />
            <div class="group">
              <small>Acessório</small>
              <div class="pill-options">
                {ACCESSORIES.map((accessory, index) => (
                  <button
                    type="button"
                    class={`pill-option ${avatar.accessory === index ? 'is-selected' : ''}`}
                    data-action="avatar-accessory"
                    data-value={String(index)}
                    data-focusable="true"
                  >
                    {accessory}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div class="button-row">
          <button class="btn ghost" data-action="back-intro" data-role="back" data-focusable="true">
            {content.screens.avatar.backCta}
          </button>
          <button class="btn primary" data-action="go-toolkit" data-primary="1" data-focusable="true">
            {content.screens.avatar.confirmCta}
          </button>
        </div>
      </div>
    </section>
  );
}

function ToolkitScreen() {
  const { uiView } = useGameStore();
  if (!uiView) return null;
  const selectedSet = new Set(uiView.model.toolkit);
  return (
    <section class="screen screen-toolkit" data-testid="screen-toolkit">
      <div class="screen-bg bg-lab" />
      <div class="content">
        <h2>{content.screens.toolkit.title}</h2>
        <p>{content.screens.toolkit.subtitle}</p>
        <div class="tool-grid">
          {TOOLS.map((tool) => (
            <button type="button" class={`tool-card ${selectedSet.has(tool.id) ? 'is-selected' : ''}`} data-action="toggle-tool" data-tool={tool.id} data-focusable="true">
              <span class="icon">
                <img class="tool-icon" src={`/assets/icons/tools/${tool.id}.svg`} alt="" loading="lazy" decoding="async" />
                <span class="tool-fallback" aria-hidden="true">
                  {tool.icon}
                </span>
              </span>
              <strong>{tool.label}</strong>
              <p>{content.screens.toolkit.tooltips[tool.id] ?? tool.summary}</p>
            </button>
          ))}
        </div>
        <p class="hint">
          {content.screens.toolkit.selectedHint}: <strong>{uiView.model.toolkit.length}/3</strong>
        </p>
        <div class="button-row">
          <button class="btn ghost" data-action="back-avatar" data-role="back" data-focusable="true">
            {content.screens.toolkit.backCta}
          </button>
          <button class="btn primary" data-action="go-repair" data-primary="1" data-focusable="true" disabled={uiView.model.toolkit.length !== 3}>
            {content.screens.toolkit.startRepairCta}
          </button>
        </div>
      </div>
    </section>
  );
}

function RepairScreen() {
  const { uiView } = useGameStore();
  if (!uiView) return null;
  const selectedTools = uiView.model.toolkit.map((toolId) => TOOLS.find((tool) => tool.id === toolId)).filter(Boolean) as typeof TOOLS;
  const completed = DREAM_SLOTS.filter((slot) => (uiView.model.repair.slotProgress[slot.id] ?? 0) >= 2).length;
  const avatar = uiView.model.avatar;
  const avatarMood = uiView.model.comboStreak >= 3 ? 'smile' : uiView.model.repair.timingGrade === 'miss' ? 'neutral' : 'confident';
  const timingLabel = timingGradeLabel(uiView.model.repair.timingGrade);
  return (
    <section class="screen screen-repair" data-testid="screen-repair">
      <div class="screen-bg bg-lab" />
      <div class="content">
        <h2>{content.screens.repair.title}</h2>
        <p>{content.screens.repair.subtitle}</p>
        <p class={`hint timing-hint grade-${uiView.model.repair.timingGrade}`}>
          Janela de energia: <strong>{timingLabel}</strong>
        </p>
        <div class="repair-hero-strip">
          <div class="repair-avatar">
            <AvatarView
              skinTone={avatar.skin}
              hairStyle={avatar.hair}
              eyeStyle={avatar.eyes}
              outfitStyle={avatar.outfit}
              accessoryId={avatar.accessory}
              mood={avatarMood}
            />
          </div>
          <div class="repair-mission-copy">
            <p class="hint">Acione os núcleos no pico da barra para carga crítica.</p>
            <p class="hint">
              Estado da missão: <strong>{completed}/4</strong> núcleos estabilizados
            </p>
          </div>
        </div>
        <div class="repair-tools">
          {selectedTools.map((tool) => (
            <button class={`tool-chip ${uiView.model.repair.armedTool === tool.id ? 'is-armed' : ''}`} data-action="arm-tool" data-tool={tool.id} data-focusable="true">
              <span class="icon">
                <img class="tool-icon" src={`/assets/icons/tools/${tool.id}.svg`} alt="" loading="lazy" decoding="async" />
              </span>
              {tool.label}
            </button>
          ))}
        </div>
        <div class="repair-grid">
          {DREAM_SLOTS.map((slot, slotIndex) => {
            const progress = uiView.model.repair.slotProgress[slot.id] ?? 0;
            const done = progress >= 2;
            const status = done ? 'ONLINE' : `${progress}/2`;
            const slotLabel = content.screens.repair.slotNames[slot.id] ?? slot.label;
            const timingMs = 1600 + slotIndex * 190;
            const timingDelay = -(slotIndex * 170);
            return (
              <button class={`slot ${done ? 'is-done' : ''}`} data-action="apply-tool" data-slot={slot.id} data-focusable="true">
                <strong>{slotLabel}</strong>
                <small>{status}</small>
                <div class="slot-meter" style={`--slot-timing-ms:${timingMs}ms; --slot-timing-delay:${timingDelay}ms;`}>
                  <span class="meter-window" />
                  <span class="meter-cursor" />
                </div>
              </button>
            );
          })}
        </div>
        <p class="hint">{uiView.model.repair.feedback}</p>
        <p class="hint">
          {content.screens.repair.progressLabel}: <strong>{completed}/4</strong>
        </p>
        <p class="hint">
          {content.screens.repair.comboLabel}: <strong>x{uiView.model.comboStreak}</strong> | Melhor combo: <strong>x{uiView.model.maxCombo}</strong>
        </p>
        <div class="button-row">
          <button class="btn ghost" data-action="back-toolkit" data-role="back" data-focusable="true">
            {content.screens.repair.backCta}
          </button>
          <button class="btn primary" data-action="finish-repair" data-primary="1" data-focusable="true" disabled={completed < 3}>
            {content.screens.repair.finishCta}
          </button>
        </div>
      </div>
    </section>
  );
}

function ResultScreen() {
  const { uiView } = useGameStore();
  if (!uiView) return null;
  const completed = DREAM_SLOTS.filter((slot) => (uiView.model.repair.slotProgress[slot.id] ?? 0) >= 2).length;
  return (
    <section class="screen screen-result" data-testid="screen-result">
      <div class="screen-bg bg-reborn" />
      <div class="content">
        <h2>{uiView.model.resultTitle}</h2>
        <p>{uiView.model.resultMessage}</p>
        <div class="summary-grid">
          <article>
            <small>{content.screens.result.summaryLabels.toolsUsed}</small>
            <strong>{uiView.model.toolkit.map((toolId) => TOOLS.find((tool) => tool.id === toolId)?.label ?? toolId).join(', ')}</strong>
          </article>
          <article>
            <small>{content.screens.result.summaryLabels.restoredSlots}</small>
            <strong>{completed} / 4</strong>
          </article>
          <article>
            <small>{content.screens.result.summaryLabels.energyLeft}</small>
            <strong>{Math.max(0, Math.round((uiView.model.missionMsLeft / 150000) * 100))}%</strong>
          </article>
          <article>
            <small>{content.screens.result.summaryLabels.maxCombo}</small>
            <strong>x{uiView.model.maxCombo}</strong>
          </article>
          <article>
            <small>{content.screens.result.summaryLabels.heroBadge}</small>
            <strong>{uiView.model.resultBadge}</strong>
          </article>
        </div>
        <div class="button-row">
          <button class="btn ghost" data-action="play-again" data-primary="1" data-focusable="true" data-testid="play-again">
            {content.screens.result.playAgainCta}
          </button>
          <button class="btn primary" data-action="go-memory" data-focusable="true">
            {content.screens.result.goMemoryCta}
          </button>
        </div>
      </div>
    </section>
  );
}

function Swatches(props: { label: string; kind: 'skin' | 'hair' | 'eyes' | 'outfit'; colors: string[]; selectedIndex: number }) {
  return (
    <div class="group">
      <small>{props.label}</small>
      <div class="swatches">
        {props.colors.map((color, index) => (
          <button
            type="button"
            class={`swatch ${props.selectedIndex === index ? 'is-selected' : ''}`}
            style={`background:${color}`}
            data-action="avatar-set"
            data-kind={props.kind}
            data-value={String(index)}
            data-focusable="true"
            aria-label={`${props.label} ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function stepLabel(screenId: string): string {
  switch (screenId) {
    case 'ATTRACT':
      return '1. Attract';
    case 'INTRO':
      return '2. Contexto';
    case 'AVATAR':
      return '3. Avatar';
    case 'TOOLKIT':
      return '4. Ferramentas';
    case 'REPAIR':
      return '5. Reparo';
    case 'RESULT':
      return '6. Resultado';
    default:
      return screenId;
  }
}

function timingGradeLabel(grade: 'none' | 'perfect' | 'good' | 'miss'): string {
  if (grade === 'perfect') {
    return 'Perfeito';
  }
  if (grade === 'good') {
    return 'Bom';
  }
  if (grade === 'miss') {
    return 'Fora do timing';
  }
  return 'Aguardando ação';
}
