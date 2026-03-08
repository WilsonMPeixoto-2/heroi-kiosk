import './reboot-game.css';

type UiTheme = 'clean' | 'glitch' | 'distopic' | 'cyber';

interface Choice {
  label: string;
  nextScene: string;
  gainItem?: string;
  requiredItem?: string;
}

interface SceneData {
  speakerName: string;
  text: string;
  bgImage?: string;
  npcSprite?: string;
  eventCG?: string;
  bgMusic?: string;
  soundEffect?: string;
  uiTheme?: UiTheme;
  choices: Choice[];
}

type StoryData = Record<string, SceneData>;

interface RuntimeState {
  story: StoryData;
  currentSceneId: string;
  inventory: Set<string>;
  typing: boolean;
  shownChars: number;
  typingTimer: number | null;
  frontLayerVisible: boolean;
}

const appRoot = document.querySelector<HTMLDivElement>('#app');
if (!appRoot) {
  throw new Error('Elemento #app nao encontrado.');
}

appRoot.innerHTML = `
  <main class="novel-app">
    <section id="frame" class="novel-frame">
      <article id="viewport" class="novel-viewport" data-theme="clean">
        <div id="bgBack" class="bg-layer visible"></div>
        <div id="bgFront" class="bg-layer"></div>
        <div id="toneLayer" class="tone-layer tone-clean"></div>
        <img id="npcSprite" class="npc-sprite hidden" alt="Personagem" />

        <header class="novel-hud">
          <div class="hud-left">
            <h1>Heroi do Futuro | Motor Cinematografico</h1>
            <p id="sceneTag">Cena: --</p>
          </div>
          <div class="hud-right">
            <span id="routeTag" class="tag">Rota: --</span>
            <div id="inventoryBadges" class="inventory"></div>
          </div>
        </header>

        <section id="dialogueBox" class="dialogue-box theme-clean">
          <h2 id="speakerName">Carregando...</h2>
          <p id="dialogueText" class="typing"></p>
          <div id="choices" class="choices hidden"></div>
        </section>
      </article>
    </section>
  </main>
`;

const ui = {
  frame: mustGetById('frame'),
  viewport: mustGetById('viewport'),
  bgBack: mustGetById('bgBack'),
  bgFront: mustGetById('bgFront'),
  toneLayer: mustGetById('toneLayer'),
  npcSprite: mustGetById('npcSprite') as HTMLImageElement,
  speakerName: mustGetById('speakerName'),
  dialogueText: mustGetById('dialogueText'),
  choices: mustGetById('choices'),
  sceneTag: mustGetById('sceneTag'),
  routeTag: mustGetById('routeTag'),
  inventoryBadges: mustGetById('inventoryBadges'),
  dialogueBox: mustGetById('dialogueBox')
};

const state: RuntimeState = {
  story: {},
  currentSceneId: '',
  inventory: new Set<string>(),
  typing: false,
  shownChars: 0,
  typingTimer: null,
  frontLayerVisible: false
};

const bgm = new Audio();
bgm.loop = true;
bgm.preload = 'auto';

const sfx = new Audio();
sfx.preload = 'auto';

const TRAIT_LABELS: Record<string, string> = {
  trait_hacker: 'Overclocking',
  trait_engineer: 'Engenharia',
  trait_diplomat: 'Diplomacia',
  trait_bio: 'Bio-Restauracao',
  kit_sme: 'Kit SME'
};

const cleanupAspect = setupAspectBarrier(ui.frame, ui.viewport, 16 / 9);
void boot();

async function boot(): Promise<void> {
  try {
    const response = await fetch('/novel-assets/storyData.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Falha ao carregar storyData.json (${response.status})`);
    }

    const payload = (await response.json()) as StoryData;
    state.story = payload;

    const startScene = resolveStartScene(Object.keys(payload));
    goToScene(startScene);
  } catch (error) {
    ui.speakerName.textContent = 'Erro de carregamento';
    ui.dialogueText.textContent = `Nao foi possivel iniciar o motor cinematografico: ${(error as Error).message}`;
    ui.dialogueText.classList.remove('typing');
    ui.choices.classList.add('hidden');
  }
}

function resolveStartScene(allIds: string[]): string {
  const params = new URLSearchParams(window.location.search);
  const requested = (params.get('scene') ?? '').trim();
  if (requested && allIds.includes(requested)) {
    return requested;
  }
  return allIds.includes('intro_01') ? 'intro_01' : allIds[0] ?? '';
}

function goToScene(sceneId: string): void {
  const scene = state.story[sceneId];
  if (!scene) {
    renderMissingScene(sceneId);
    return;
  }

  stopTyping();
  state.currentSceneId = sceneId;
  state.shownChars = 0;
  state.typing = true;

  const bgSource = scene.eventCG || scene.bgImage || '';
  crossfadeBackground(resolveAssetRef(bgSource));
  renderNpc(scene);
  applyTheme(scene.uiTheme ?? 'clean');
  renderMeta(sceneId);
  playSceneAudio(scene);

  ui.speakerName.textContent = scene.speakerName || 'Narrador';
  ui.dialogueText.textContent = '';
  ui.dialogueText.classList.add('typing');

  ui.choices.innerHTML = '';
  ui.choices.classList.add('hidden');

  startTypewriter(scene.text, () => {
    renderChoices(scene);
  });
}

function renderMissingScene(sceneId: string): void {
  stopTyping();
  state.typing = false;
  ui.speakerName.textContent = 'Cena nao encontrada';
  ui.dialogueText.textContent = `A cena ${sceneId} nao existe no storyData.`;
  ui.dialogueText.classList.remove('typing');
  ui.choices.innerHTML = '';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'choice-btn';
  button.textContent = 'Reiniciar em intro_01';
  button.addEventListener('click', () => goToScene('intro_01'));
  ui.choices.appendChild(button);
  ui.choices.classList.remove('hidden');
}

function renderMeta(sceneId: string): void {
  ui.sceneTag.textContent = `Cena: ${sceneId}`;

  let route = 'Principal';
  if (sceneId.includes('hacker') || sceneId.includes('central')) {
    route = 'Hacker';
  } else if (sceneId.includes('engineer')) {
    route = 'Engenheiro';
  } else if (sceneId.includes('diplomat')) {
    route = 'Diplomata';
  } else if (sceneId.includes('jardim')) {
    route = 'Bio';
  }
  ui.routeTag.textContent = `Rota: ${route}`;

  ui.inventoryBadges.innerHTML = '';
  const entries = [...state.inventory.values()];
  if (entries.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'inventory-empty';
    empty.textContent = 'Sem tracos';
    ui.inventoryBadges.appendChild(empty);
    return;
  }

  entries.forEach((item) => {
    const badge = document.createElement('span');
    badge.className = 'inventory-badge';
    badge.textContent = TRAIT_LABELS[item] ?? item;
    ui.inventoryBadges.appendChild(badge);
  });
}

function startTypewriter(text: string, onDone: () => void): void {
  const normalized = text || '';
  const stepChars = 2;

  state.typingTimer = window.setInterval(() => {
    state.shownChars = Math.min(state.shownChars + stepChars, normalized.length);
    ui.dialogueText.textContent = normalized.slice(0, state.shownChars);

    if (state.shownChars >= normalized.length) {
      stopTyping();
      state.typing = false;
      ui.dialogueText.classList.remove('typing');
      onDone();
    }
  }, 22);
}

function stopTyping(): void {
  if (state.typingTimer !== null) {
    window.clearInterval(state.typingTimer);
    state.typingTimer = null;
  }
}

function finishTypingNow(): void {
  const scene = state.story[state.currentSceneId];
  if (!scene || !state.typing) {
    return;
  }

  stopTyping();
  state.typing = false;
  state.shownChars = scene.text.length;
  ui.dialogueText.textContent = scene.text;
  ui.dialogueText.classList.remove('typing');
  renderChoices(scene);
}

function renderChoices(scene: SceneData): void {
  const available = scene.choices.filter((choice) => {
    if (!choice.requiredItem) {
      return true;
    }
    return state.inventory.has(choice.requiredItem);
  });

  ui.choices.innerHTML = '';
  if (available.length === 0) {
    const fallback = document.createElement('button');
    fallback.type = 'button';
    fallback.className = 'choice-btn';
    fallback.textContent = 'Reiniciar simulacao';
    fallback.addEventListener('click', () => {
      state.inventory.clear();
      goToScene('intro_01');
    });
    ui.choices.appendChild(fallback);
    ui.choices.classList.remove('hidden');
    return;
  }

  available.forEach((choice, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-btn';
    button.style.setProperty('--delay-ms', `${index * 95}ms`);
    button.textContent = choice.label;
    button.addEventListener('click', () => {
      if (choice.gainItem) {
        state.inventory.add(choice.gainItem);
      }
      goToScene(choice.nextScene);
    });
    ui.choices.appendChild(button);
  });

  ui.choices.classList.remove('hidden');
}

function crossfadeBackground(src: string): void {
  const front = ui.bgFront;
  const back = ui.bgBack;
  const next = state.frontLayerVisible ? back : front;
  const previous = state.frontLayerVisible ? front : back;

  if (src) {
    next.style.backgroundImage = `url('${src}')`;
  } else {
    next.style.backgroundImage = 'none';
  }

  next.classList.add('visible');
  previous.classList.remove('visible');
  state.frontLayerVisible = !state.frontLayerVisible;
}

function renderNpc(scene: SceneData): void {
  const useNpc = !scene.eventCG && Boolean(scene.npcSprite);
  if (!useNpc) {
    ui.npcSprite.classList.add('hidden');
    ui.npcSprite.removeAttribute('src');
    return;
  }

  ui.npcSprite.src = resolveAssetRef(scene.npcSprite ?? '');
  ui.npcSprite.classList.remove('hidden');
}

function applyTheme(theme: UiTheme): void {
  const safeTheme = (['clean', 'glitch', 'distopic', 'cyber'] as const).includes(theme) ? theme : 'clean';

  ui.viewport.dataset.theme = safeTheme;
  ui.dialogueBox.className = `dialogue-box theme-${safeTheme}`;
  ui.toneLayer.className = `tone-layer tone-${safeTheme}`;

  if (safeTheme === 'glitch') {
    ui.viewport.classList.add('is-glitch');
  } else {
    ui.viewport.classList.remove('is-glitch');
  }
}

function setupAspectBarrier(frame: HTMLElement, viewport: HTMLElement, ratio: number): () => void {
  const sync = (): void => {
    const width = frame.clientWidth;
    const height = frame.clientHeight;
    if (!width || !height) {
      return;
    }

    let targetWidth = width;
    let targetHeight = Math.round(targetWidth / ratio);

    if (targetHeight > height) {
      targetHeight = height;
      targetWidth = Math.round(targetHeight * ratio);
    }

    viewport.style.width = `${targetWidth}px`;
    viewport.style.height = `${targetHeight}px`;
    frame.dataset.bars = width / height > ratio ? 'pillar' : 'letter';
  };

  const observer = new ResizeObserver(sync);
  observer.observe(frame);
  window.addEventListener('resize', sync);
  sync();

  return () => {
    observer.disconnect();
    window.removeEventListener('resize', sync);
  };
}

function mustGetById(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) {
    throw new Error(`Elemento #${id} nao encontrado.`);
  }
  return node;
}

function resolveAssetRef(raw: string): string {
  const value = raw.trim();
  if (!value) {
    return '';
  }
  if (value.startsWith('/')) {
    return value;
  }

  const aliases: Record<string, string> = {
    image_0: '/assets/bg_capsula_limpa.jpg',
    image_1: '/assets/bg_glitch_screen.jpg',
    image_2: '/assets/bg_rua_alagada_neon.jpg',
    image_3: '/assets/bg_painel_controle.jpg',
    image_4: '/assets/npc_cadu_explaining.png',
    image_5: '/assets/npc_cadu_sarcastic.png',
    image_6: '/assets/npc_cadu_panicking.png',
    image_7: '/assets/cg_hand_kit.jpg'
  };

  if (aliases[value]) {
    return aliases[value];
  }

  return `/assets/${value}`;
}

function playSceneAudio(scene: SceneData): void {
  const bgTrack = (scene.bgMusic ?? '').trim();
  if (!bgTrack) {
    bgm.pause();
    bgm.removeAttribute('src');
  } else {
    const resolved = resolveAssetRef(bgTrack);
    if (!bgm.src.endsWith(resolved)) {
      bgm.src = resolved;
    }
    void bgm.play().catch(() => undefined);
  }

  const fxTrack = (scene.soundEffect ?? '').trim();
  if (!fxTrack) {
    return;
  }
  sfx.src = resolveAssetRef(fxTrack);
  void sfx.play().catch(() => undefined);
}

ui.dialogueBox.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  if (target.closest('.choice-btn')) {
    return;
  }
  finishTypingNow();
});

window.addEventListener('keydown', (event) => {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    if (state.typing) {
      finishTypingNow();
      return;
    }

    const firstChoice = ui.choices.querySelector<HTMLButtonElement>('button.choice-btn');
    firstChoice?.click();
  }

  if (event.key.toLowerCase() === 'r') {
    state.inventory.clear();
    goToScene('intro_01');
  }
});

window.addEventListener('beforeunload', () => {
  cleanupAspect();
  stopTyping();
  bgm.pause();
  sfx.pause();
});
