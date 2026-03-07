import './graphic-novel.css';

type ThemeId = 'dark-fantasy' | 'scifi-neon' | 'cartoon-brutal';
type MoodId = 'focused' | 'worried' | 'fierce' | 'hopeful' | 'calm';

interface Stats {
  focus: number;
  empathy: number;
  courage: number;
}

interface Choice {
  id: string;
  label: string;
  impactText: string;
  impact: Partial<Stats>;
  nextId: string;
}

interface Scene {
  id: string;
  chapter: string;
  location: string;
  tag: string;
  title: string;
  mainText: string;
  bubbleSpeaker: string;
  bubbleText: string;
  mood: MoodId;
  background: 'distopia' | 'lab' | 'reborn';
  nextId?: string;
  choices?: Choice[];
}

interface Ending {
  title: string;
  summary: string;
  badge: string;
}

const THEME_ALIASES: Record<string, ThemeId> = {
  'dark-fantasy': 'dark-fantasy',
  clean: 'dark-fantasy',
  'scifi-neon': 'scifi-neon',
  neon: 'scifi-neon',
  'cartoon-brutal': 'cartoon-brutal',
  comic: 'cartoon-brutal'
};

const THEME_LABEL: Record<ThemeId, string> = {
  'dark-fantasy': 'Versao A - Fantasia Sombria',
  'scifi-neon': 'Versao B - Sci-Fi Neon',
  'cartoon-brutal': 'Versao C - Cartoon Brutal'
};

const BACKGROUND_URL: Record<Scene['background'], string> = {
  distopia: '/assets/backgrounds/distopia.svg',
  lab: '/assets/backgrounds/lab.svg',
  reborn: '/assets/backgrounds/reborn.svg'
};

const SCENES: Record<string, Scene> = {
  opening: {
    id: 'opening',
    chapter: 'Capitulo 01',
    location: 'Distrito sem energia',
    tag: 'Chamado',
    title: 'A cidade apagou de novo',
    mainText:
      'Durante a noite, metade do distrito entrou em colapso energetico. O modulo central trava e o caos se espalha. Seu heroi recebe uma missao: recuperar os fragmentos e religar a cidade antes da madrugada.',
    bubbleSpeaker: 'Operadora Lyra',
    bubbleText: 'Nao temos reforco. Voce decide agora como essa historia termina.',
    mood: 'worried',
    background: 'distopia',
    nextId: 'street'
  },
  street: {
    id: 'street',
    chapter: 'Capitulo 02',
    location: 'Avenida principal',
    tag: 'Conflito',
    title: 'Pessoas ou rota rapida',
    mainText:
      'A avenida esta bloqueada. Um grupo de estudantes ficou preso entre destrocos. Existe uma rota curta para o laboratorio, mas passar por ela significa deixar o grupo para tras.',
    bubbleSpeaker: 'Capitao Drax',
    bubbleText: 'Escolhe: seguranca coletiva ou velocidade extrema.',
    mood: 'focused',
    background: 'distopia',
    choices: [
      {
        id: 'street-help',
        label: 'Resgatar o grupo e abrir passagem segura',
        impactText: '+Empatia, +Coragem',
        impact: { empathy: 18, courage: 8, focus: -6 },
        nextId: 'shelter'
      },
      {
        id: 'street-rush',
        label: 'Forcar rota curta para chegar antes ao laboratorio',
        impactText: '+Foco, -Empatia',
        impact: { focus: 16, empathy: -12, courage: 4 },
        nextId: 'shelter'
      },
      {
        id: 'street-balance',
        label: 'Dividir equipe e evacuar por corredor secundario',
        impactText: '+Foco, +Empatia',
        impact: { focus: 8, empathy: 10, courage: 2 },
        nextId: 'shelter'
      }
    ]
  },
  shelter: {
    id: 'shelter',
    chapter: 'Capitulo 03',
    location: 'Abrigo subterraneo',
    tag: 'Pressao',
    title: 'Falta de recursos',
    mainText:
      'No abrigo, voce encontra baterias emergenciais. Elas podem estabilizar o sistema local ou alimentar sua ofensiva no nucleo. O tempo esta acabando.',
    bubbleSpeaker: 'Tecnica Nara',
    bubbleText: 'Cada celula usada aqui e uma celula a menos no confronto final.',
    mood: 'calm',
    background: 'lab',
    choices: [
      {
        id: 'shelter-share',
        label: 'Distribuir energia para manter o abrigo funcional',
        impactText: '+Empatia, -Foco',
        impact: { empathy: 16, focus: -8, courage: 4 },
        nextId: 'reactor'
      },
      {
        id: 'shelter-save',
        label: 'Guardar baterias para o reator central',
        impactText: '+Foco, +Coragem',
        impact: { focus: 14, courage: 8, empathy: -6 },
        nextId: 'reactor'
      },
      {
        id: 'shelter-hybrid',
        label: 'Criar racionamento e manter minima operacao',
        impactText: '+Foco, +Empatia',
        impact: { focus: 8, empathy: 8, courage: 3 },
        nextId: 'reactor'
      }
    ]
  },
  reactor: {
    id: 'reactor',
    chapter: 'Capitulo 04',
    location: 'Nucleo de restauracao',
    tag: 'Climax',
    title: 'Ultima decisao',
    mainText:
      'O nucleo responde, mas o guardiao automatizado dispara contra tudo ao redor. Voce precisa escolher a estrategia final: neutralizar com forca, reprogramar o sistema ou conduzir evacuacao e ganhar tempo.',
    bubbleSpeaker: 'Sistema Central',
    bubbleText: 'Autorizacao negada. Probabilidade de falha em 72%.',
    mood: 'fierce',
    background: 'lab',
    choices: [
      {
        id: 'reactor-force',
        label: 'Confronto direto para abrir o nucleo na marra',
        impactText: '+Coragem, -Empatia',
        impact: { courage: 18, focus: 6, empathy: -10 },
        nextId: 'finale'
      },
      {
        id: 'reactor-code',
        label: 'Invasao de sistema com protocolo de restauracao',
        impactText: '+Foco, +Coragem',
        impact: { focus: 18, courage: 6, empathy: -2 },
        nextId: 'finale'
      },
      {
        id: 'reactor-evac',
        label: 'Priorizar evacuacao e reinicio gradual',
        impactText: '+Empatia, +Foco',
        impact: { empathy: 18, focus: 6, courage: 2 },
        nextId: 'finale'
      }
    ]
  },
  finale: {
    id: 'finale',
    chapter: 'Capitulo 05',
    location: 'Cidade ao amanhecer',
    tag: 'Resolucao',
    title: 'O resultado aparece',
    mainText:
      'O modulo responde e a cidade volta a respirar. Agora a populacao vai lembrar como voce conduziu essa noite: lideranca fria, lideranca humana ou uma sintese rara das duas.',
    bubbleSpeaker: 'Narrador',
    bubbleText: 'A reputacao do heroi nasce exatamente aqui.',
    mood: 'hopeful',
    background: 'reborn'
  }
};

const appRoot = document.querySelector<HTMLDivElement>('#app');
if (!appRoot) {
  throw new Error('Elemento #app nao encontrado.');
}

const theme = resolveTheme();
document.body.dataset.theme = theme;

appRoot.innerHTML = `
  <main class="novel-shell">
    <section class="novel-top">
      <header>
        <h1>Heroi Kiosk | Motion Comic Interativo</h1>
        <p id="themeLabel">${THEME_LABEL[theme]}</p>
      </header>
      <div class="status-grid">
        <article class="status-card">
          <small>Foco</small>
          <strong id="focusValue">40</strong>
          <div class="status-meter"><i id="focusFill"></i></div>
        </article>
        <article class="status-card">
          <small>Empatia</small>
          <strong id="empathyValue">40</strong>
          <div class="status-meter"><i id="empathyFill"></i></div>
        </article>
        <article class="status-card">
          <small>Coragem</small>
          <strong id="courageValue">40</strong>
          <div class="status-meter"><i id="courageFill"></i></div>
        </article>
        <article class="status-card">
          <small>Cena</small>
          <strong id="sceneCounter">1/5</strong>
        </article>
        <article class="status-card">
          <small>Rota</small>
          <strong id="routeBadge">INICIO</strong>
        </article>
      </div>
    </section>

    <section class="novel-stage">
      <div class="scene-viewport">
        <div id="sceneBg" class="scene-bg"></div>
        <div class="scene-noise"></div>
        <div class="scene-panels">
          <article class="panel-main">
            <div class="panel-tag">
              <span id="sceneChapter">Capitulo</span>
              <span id="sceneTag">Tag</span>
              <span id="sceneLocation">Local</span>
            </div>
            <p id="sceneMainText"></p>
          </article>
          <article class="panel-side">
            <div class="portrait" id="portraitSlot"></div>
            <div class="bubble">
              <strong id="bubbleSpeaker">Speaker</strong>
              <p id="bubbleText">Texto.</p>
            </div>
          </article>
        </div>
      </div>

      <div class="scene-bottom">
        <p id="sceneTitleLine"></p>
        <div id="choicesBox" class="choices"></div>
        <div class="scene-controls">
          <small id="hintText">Clique em uma escolha para continuar. Teclas 1/2/3 tambem funcionam.</small>
          <button id="nextBtn" class="next-btn" type="button">Proxima cena</button>
        </div>
      </div>
    </section>
  </main>
`;

const ui = {
  focusValue: mustById('focusValue'),
  empathyValue: mustById('empathyValue'),
  courageValue: mustById('courageValue'),
  focusFill: mustById('focusFill'),
  empathyFill: mustById('empathyFill'),
  courageFill: mustById('courageFill'),
  sceneCounter: mustById('sceneCounter'),
  routeBadge: mustById('routeBadge'),
  sceneBg: mustById('sceneBg'),
  sceneChapter: mustById('sceneChapter'),
  sceneTag: mustById('sceneTag'),
  sceneLocation: mustById('sceneLocation'),
  sceneMainText: mustById('sceneMainText'),
  portraitSlot: mustById('portraitSlot'),
  bubbleSpeaker: mustById('bubbleSpeaker'),
  bubbleText: mustById('bubbleText'),
  sceneTitleLine: mustById('sceneTitleLine'),
  choicesBox: mustById('choicesBox'),
  hintText: mustById('hintText'),
  nextBtn: mustById('nextBtn') as HTMLButtonElement
};

let stats: Stats = { focus: 40, empathy: 40, courage: 40 };
let currentSceneId = 'opening';
let pendingNextId: string | null = null;
let selectedChoiceId: string | null = null;
let typingTimer: number | null = null;
let routePath: string[] = [];

ui.nextBtn.addEventListener('click', () => advanceScene());
window.addEventListener('keydown', onKeyDown);

renderScene(currentSceneId);

function onKeyDown(event: KeyboardEvent): void {
  if (event.code === 'Enter') {
    if (!ui.nextBtn.disabled) {
      advanceScene();
    }
  }
  if (event.code === 'Digit1') {
    pickChoiceByIndex(0);
  } else if (event.code === 'Digit2') {
    pickChoiceByIndex(1);
  } else if (event.code === 'Digit3') {
    pickChoiceByIndex(2);
  }
}

function pickChoiceByIndex(index: number): void {
  const scene = SCENES[currentSceneId];
  if (!scene.choices || index < 0 || index >= scene.choices.length) {
    return;
  }
  applyChoice(scene.choices[index]);
}

function resolveTheme(): ThemeId {
  const params = new URLSearchParams(window.location.search);
  const envTheme = typeof import.meta.env.VITE_DEFAULT_THEME === 'string' ? import.meta.env.VITE_DEFAULT_THEME.toLowerCase() : '';
  const raw = (params.get('theme') ?? envTheme ?? 'scifi-neon').toLowerCase();
  return THEME_ALIASES[raw] ?? 'scifi-neon';
}

function renderScene(sceneId: string): void {
  const scene = SCENES[sceneId];
  if (!scene) {
    renderEndingScene();
    return;
  }

  currentSceneId = scene.id;
  pendingNextId = scene.nextId ?? null;
  selectedChoiceId = null;

  const sceneIndex = orderedSceneIds().indexOf(scene.id) + 1;
  ui.sceneCounter.textContent = `${sceneIndex}/5`;
  ui.sceneBg.style.backgroundImage = `url('${BACKGROUND_URL[scene.background]}')`;
  ui.sceneChapter.textContent = scene.chapter;
  ui.sceneTag.textContent = scene.tag;
  ui.sceneLocation.textContent = scene.location;
  ui.sceneTitleLine.textContent = `${scene.title}`;
  ui.bubbleSpeaker.textContent = scene.bubbleSpeaker;
  ui.bubbleText.textContent = scene.bubbleText;
  ui.portraitSlot.innerHTML = buildPortrait(scene.mood);

  animateText(ui.sceneMainText, scene.mainText);
  renderChoices(scene);
  updateStatsUi();
}

function orderedSceneIds(): string[] {
  return ['opening', 'street', 'shelter', 'reactor', 'finale'];
}

function renderChoices(scene: Scene): void {
  ui.choicesBox.innerHTML = '';
  if (!scene.choices || scene.choices.length === 0) {
    ui.nextBtn.disabled = false;
    ui.hintText.textContent = 'Pressione Enter ou clique para continuar.';
    return;
  }

  ui.nextBtn.disabled = true;
  ui.hintText.textContent = 'Escolha uma rota. Teclas 1/2/3 tambem funcionam.';
  scene.choices.forEach((choice, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-btn';
    button.innerHTML = `<strong>${index + 1}. ${choice.label}</strong><br><span class="${impactClass(choice.impactText)}">${choice.impactText}</span>`;
    button.addEventListener('click', () => applyChoice(choice));
    ui.choicesBox.appendChild(button);
  });
}

function impactClass(text: string): string {
  return text.includes('-') ? 'impact-bad' : 'impact-good';
}

function applyChoice(choice: Choice): void {
  if (selectedChoiceId) {
    return;
  }
  selectedChoiceId = choice.id;
  stats = {
    focus: clamp(stats.focus + (choice.impact.focus ?? 0), 0, 100),
    empathy: clamp(stats.empathy + (choice.impact.empathy ?? 0), 0, 100),
    courage: clamp(stats.courage + (choice.impact.courage ?? 0), 0, 100)
  };
  routePath.push(choice.id);
  pendingNextId = choice.nextId;
  ui.routeBadge.textContent = routePath.slice(-2).join(' > ').toUpperCase().replaceAll('-', ' ');
  ui.nextBtn.disabled = false;
  ui.hintText.textContent = 'Escolha registrada. Avance para a proxima cena.';
  Array.from(ui.choicesBox.querySelectorAll('button')).forEach((button) => {
    const b = button as HTMLButtonElement;
    b.disabled = true;
  });
  updateStatsUi();
}

function advanceScene(): void {
  if (pendingNextId) {
    renderScene(pendingNextId);
    return;
  }
  if (currentSceneId === 'finale') {
    renderEndingScene();
  }
}

function renderEndingScene(): void {
  const ending = computeEnding();
  ui.sceneCounter.textContent = 'FINAL';
  ui.sceneBg.style.backgroundImage = `url('${BACKGROUND_URL.reborn}')`;
  ui.sceneChapter.textContent = 'Epilogo';
  ui.sceneTag.textContent = 'Desfecho';
  ui.sceneLocation.textContent = 'Amanhecer';
  ui.sceneTitleLine.innerHTML = `<span class="result-pill">${ending.badge}</span> ${ending.title}`;
  ui.bubbleSpeaker.textContent = 'Cidade';
  ui.bubbleText.textContent = 'O publico reage ao tipo de lideranca que voce construiu.';
  ui.portraitSlot.innerHTML = buildPortrait('hopeful');
  animateText(ui.sceneMainText, ending.summary);
  ui.choicesBox.innerHTML = '';
  ui.hintText.textContent = 'Pressione F5 para reiniciar outra rota.';
  ui.nextBtn.disabled = true;
}

function computeEnding(): Ending {
  if (stats.focus >= 70 && stats.empathy >= 60) {
    return {
      title: 'Protocolo Aurora',
      summary:
        'Sua estrategia equilibrou precisao tecnica e cuidado humano. O modulo estabiliza sem sacrificar os bairros mais vulneraveis. Voce vira referencia de lideranca para todo o distrito.',
      badge: 'Final S'
    };
  }
  if (stats.courage >= 72 && stats.focus >= 58) {
    return {
      title: 'Lamina de Reacao',
      summary:
        'A cidade sobrevive por resposta agressiva e decisiva. O nucleo volta no limite e a populacao respeita a sua ousadia, mas parte da infraestrutura ainda depende de reparos urgentes.',
      badge: 'Final A'
    };
  }
  if (stats.empathy >= 76) {
    return {
      title: 'Rede Viva',
      summary:
        'A restauracao acontece em ritmo mais lento, porem ninguem fica para tras. A comunidade confia no heroi porque viu escolhas humanas mesmo sob pressao maxima.',
      badge: 'Final B'
    };
  }
  return {
    title: 'Reinicio Fragil',
    summary:
      'A cidade volta, mas com baixa confianca no comando da operacao. O sistema funciona no curto prazo e exige uma nova ofensiva para consolidar a restauracao.',
    badge: 'Final C'
  };
}

function updateStatsUi(): void {
  ui.focusValue.textContent = String(stats.focus);
  ui.empathyValue.textContent = String(stats.empathy);
  ui.courageValue.textContent = String(stats.courage);
  ui.focusFill.style.width = `${stats.focus}%`;
  ui.empathyFill.style.width = `${stats.empathy}%`;
  ui.courageFill.style.width = `${stats.courage}%`;
}

function animateText(target: HTMLElement, text: string): void {
  if (typingTimer !== null) {
    window.clearInterval(typingTimer);
    typingTimer = null;
  }
  target.textContent = '';
  let index = 0;
  typingTimer = window.setInterval(() => {
    index += 1;
    target.textContent = text.slice(0, index);
    if (index >= text.length) {
      if (typingTimer !== null) {
        window.clearInterval(typingTimer);
      }
      typingTimer = null;
    }
  }, 9);
}

function buildPortrait(mood: MoodId): string {
  const palette = portraitPalette(mood);
  return `
    <svg viewBox="0 0 260 260" role="img" aria-label="Portrait">
      <defs>
        <linearGradient id="bgFade" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${palette.bgA}" />
          <stop offset="100%" stop-color="${palette.bgB}" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="260" height="260" fill="url(#bgFade)"/>
      <circle cx="130" cy="88" r="44" fill="${palette.skin}" stroke="rgba(0,0,0,.35)" stroke-width="4"/>
      <path d="M78 92 Q130 20 182 92 L182 108 L78 108 Z" fill="${palette.hair}" />
      <rect x="84" y="130" width="92" height="92" rx="20" fill="${palette.coat}" stroke="rgba(0,0,0,.35)" stroke-width="4"/>
      <circle cx="114" cy="90" r="5.5" fill="${palette.eye}" />
      <circle cx="146" cy="90" r="5.5" fill="${palette.eye}" />
      <rect x="102" y="156" width="56" height="9" rx="4.5" fill="${palette.line}" opacity=".8"/>
      <path d="M34 224 L226 224" stroke="${palette.line}" stroke-width="3" stroke-dasharray="8 7" opacity=".45"/>
    </svg>
  `;
}

function portraitPalette(mood: MoodId): {
  bgA: string;
  bgB: string;
  skin: string;
  hair: string;
  coat: string;
  eye: string;
  line: string;
} {
  switch (mood) {
    case 'fierce':
      return { bgA: '#2d1431', bgB: '#0c1d30', skin: '#f0c9a1', hair: '#1a1e2f', coat: '#5f1222', eye: '#ffe06b', line: '#ff7092' };
    case 'hopeful':
      return { bgA: '#1b3e57', bgB: '#1f6e59', skin: '#f2d0b0', hair: '#243248', coat: '#2e7d60', eye: '#9ff5ff', line: '#b8ffd4' };
    case 'focused':
      return { bgA: '#152c43', bgB: '#1a2336', skin: '#eec5a1', hair: '#20283a', coat: '#1f4d6b', eye: '#8dd8ff', line: '#9bc7ef' };
    case 'calm':
      return { bgA: '#21303f', bgB: '#26344e', skin: '#efc9ac', hair: '#283048', coat: '#415b79', eye: '#b6e6ff', line: '#c8d9ef' };
    default:
      return { bgA: '#2f1f2e', bgB: '#1f2a3d', skin: '#f0c6a3', hair: '#2a2431', coat: '#4c3055', eye: '#ffd39b', line: '#f2b8cf' };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mustById(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) {
    throw new Error(`Elemento #${id} nao encontrado.`);
  }
  return node;
}
