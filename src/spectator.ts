import './spectator.css';
import { SpectatorBus } from './core/bus';
import { ACCESSORIES, EYE_COLORS, HAIR_COLORS, OUTFIT_COLORS, SKIN_COLORS, type SpectatorPublicState } from './core/types';

const root = document.querySelector<HTMLDivElement>('#spectator-app');
if (!root) {
  throw new Error('Elemento #spectator-app não encontrado.');
}

root.innerHTML = `
  <div class="spectator-shell">
    <header>
      <h1>Tela do Público</h1>
      <p id="screenLabel">Aguardando sessão...</p>
    </header>
    <main>
      <section class="avatar-panel" id="avatarPanel"></section>
      <section class="progress-panel">
        <div class="metric">
          <small>Energia restante</small>
          <strong id="energy">100%</strong>
        </div>
        <div class="metric">
          <small>Progresso do módulo</small>
          <strong id="repair">0/4</strong>
        </div>
        <div class="module-track"><i id="moduleFill"></i></div>
        <div class="slots" id="slotRows"></div>
      </section>
    </main>
  </div>
`;

const refs = {
  shell: root.querySelector<HTMLDivElement>('.spectator-shell'),
  screenLabel: mustGetById('screenLabel'),
  avatarPanel: mustGetById('avatarPanel'),
  energy: mustGetById('energy'),
  repair: mustGetById('repair'),
  moduleFill: mustGetById('moduleFill'),
  slotRows: mustGetById('slotRows')
};

const dispose = SpectatorBus.onMessage((message) => {
  if (message.type === 'RESET') {
    renderIdle();
    return;
  }

  render(message.payload);
});

window.addEventListener('beforeunload', () => {
  dispose();
});

renderIdle();

function renderIdle(): void {
  refs.shell?.classList.remove('state-distopia', 'state-lab', 'state-reborn');
  refs.shell?.classList.add('state-distopia');
  refs.screenLabel.textContent = 'Aguardando jogador...';
  refs.energy.textContent = '100%';
  refs.repair.textContent = '0/4';
  refs.moduleFill.style.width = '0%';
  refs.avatarPanel.innerHTML = '<p class="idle-text">Assim que o jogador apertar START, o painel será sincronizado.</p>';
  refs.slotRows.innerHTML = '';
}

function render(state: SpectatorPublicState): void {
  const energy = Math.max(0, Math.round((state.missionMsLeft / 150000) * 100));
  refs.energy.textContent = `${energy}%`;
  refs.repair.textContent = `${state.repair.completed}/${state.repair.total}`;
  refs.moduleFill.style.width = `${Math.round((state.repair.completed / state.repair.total) * 100)}%`;

  refs.shell?.classList.remove('state-distopia', 'state-lab', 'state-reborn');
  refs.shell?.classList.add(themeClassByScreen(state.screen));

  refs.screenLabel.textContent = labelByScreen(state.screen);
  refs.avatarPanel.innerHTML = renderAvatar(state);
  refs.slotRows.innerHTML = Object.entries(state.repair.slotProgress)
    .map(([slot, progress]) => {
      const done = progress >= 2 ? 'is-done' : '';
      return `<div class="slot ${done}"><small>${slot.toUpperCase()}</small><strong>${progress}/2</strong></div>`;
    })
    .join('');
}

function renderAvatar(state: SpectatorPublicState): string {
  const skin = SKIN_COLORS[state.avatar.skin] ?? SKIN_COLORS[0];
  const hair = HAIR_COLORS[state.avatar.hair] ?? HAIR_COLORS[0];
  const eyes = EYE_COLORS[state.avatar.eyes] ?? EYE_COLORS[0];
  const outfit = OUTFIT_COLORS[state.avatar.outfit] ?? OUTFIT_COLORS[0];
  const tools = state.toolkit.length > 0 ? state.toolkit.join(', ') : 'Ferramentas pendentes';

  return `
    <svg viewBox="0 0 280 280" class="avatar-big" role="img" aria-label="Avatar do jogador">
      <circle cx="140" cy="132" r="118" fill="rgba(45,226,230,.18)" />
      <rect x="102" y="66" width="76" height="78" rx="24" fill="${skin}" stroke="rgba(0,0,0,.4)" stroke-width="4"/>
      <path d="M96 72 Q140 34 184 72 L184 92 L96 92 Z" fill="${hair}" stroke="rgba(0,0,0,.35)" stroke-width="4"/>
      <circle cx="122" cy="102" r="8" fill="${eyes}" />
      <circle cx="158" cy="102" r="8" fill="${eyes}" />
      <rect x="94" y="144" width="92" height="98" rx="20" fill="${outfit}" stroke="rgba(0,0,0,.35)" stroke-width="4"/>
      <text x="140" y="262" text-anchor="middle" fill="rgba(234,246,255,.92)" font-size="11">${ACCESSORIES[state.avatar.accessory]}</text>
    </svg>
    <p class="toolkit-line"><strong>Mala ativa:</strong> ${tools}</p>
  `;
}

function labelByScreen(screen: SpectatorPublicState['screen']): string {
  switch (screen) {
    case 'ATTRACT':
      return 'Chamando público';
    case 'INTRO':
      return 'Narrativa distópica';
    case 'AVATAR':
      return 'Construção do protagonista';
    case 'TOOLKIT':
      return 'Escolha da mala de ferramentas';
    case 'REPAIR':
      return 'Reparo do Módulo dos Sonhos';
    case 'RESULT':
      return 'Celebrando o resultado';
    default:
      return screen;
  }
}

function themeClassByScreen(screen: SpectatorPublicState['screen']): string {
  if (screen === 'ATTRACT' || screen === 'INTRO') {
    return 'state-distopia';
  }
  if (screen === 'RESULT') {
    return 'state-reborn';
  }
  return 'state-lab';
}

function mustGetById(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Elemento #${id} não encontrado`);
  }
  return element;
}
