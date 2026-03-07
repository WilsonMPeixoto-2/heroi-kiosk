import './vertical-slice.css';

type ThemeId = 'dark-fantasy' | 'scifi-neon' | 'cartoon-brutal';

interface ThemeConfig {
  label: string;
  skyTop: string;
  skyBottom: string;
  haze: string;
  farLayer: string;
  midLayer: string;
  platform: string;
  platformTop: string;
  heroBody: string;
  heroCape: string;
  heroSword: string;
  enemyBody: string;
  enemyEye: string;
  fragment: string;
  portal: string;
  particle: string;
}

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Body {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
}

interface Player extends Body {
  facing: 1 | -1;
  onGround: boolean;
  hp: number;
  maxHp: number;
  dashCooldown: number;
  attackCooldown: number;
  parryCooldown: number;
  invuln: number;
  attackTimer: number;
  parryTimer: number;
}

interface Enemy extends Body {
  id: number;
  hp: number;
  alive: boolean;
  dir: 1 | -1;
  patrolMin: number;
  patrolMax: number;
  attackCooldown: number;
  stun: number;
  hitFlash: number;
}

interface Fragment {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  pulse: number;
}

interface Portal {
  x: number;
  y: number;
  w: number;
  h: number;
  active: boolean;
  pulse: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
}

type ActionName = 'left' | 'right' | 'jump' | 'attack' | 'dash' | 'parry' | 'restart';

const THEMES: Record<ThemeId, ThemeConfig> = {
  'dark-fantasy': {
    label: 'Versao A - Fantasia Sombria',
    skyTop: '#0b0f1a',
    skyBottom: '#1a2331',
    haze: 'rgba(200, 164, 106, 0.08)',
    farLayer: '#202a39',
    midLayer: '#35465a',
    platform: '#3b4557',
    platformTop: '#7b8798',
    heroBody: '#c7a46a',
    heroCape: '#6b1e1e',
    heroSword: '#f3d39a',
    enemyBody: '#6f788a',
    enemyEye: '#d35a5a',
    fragment: '#f0bd79',
    portal: '#d98c2b',
    particle: '#d98c2b'
  },
  'scifi-neon': {
    label: 'Versao B - Sci-Fi Neon',
    skyTop: '#05070d',
    skyBottom: '#111827',
    haze: 'rgba(0, 229, 255, 0.08)',
    farLayer: '#1d2a3a',
    midLayer: '#294058',
    platform: '#2a3441',
    platformTop: '#5b738d',
    heroBody: '#00e5ff',
    heroCape: '#ff2e88',
    heroSword: '#c8fbff',
    enemyBody: '#7f93aa',
    enemyEye: '#ffe066',
    fragment: '#00e5ff',
    portal: '#ff2e88',
    particle: '#00e5ff'
  },
  'cartoon-brutal': {
    label: 'Versao C - Cartoon Brutal',
    skyTop: '#1d3557',
    skyBottom: '#457b9d',
    haze: 'rgba(241, 250, 140, 0.08)',
    farLayer: '#2f5b80',
    midLayer: '#3f7ea3',
    platform: '#2a9d8f',
    platformTop: '#91d7cd',
    heroBody: '#f1fa8c',
    heroCape: '#e63946',
    heroSword: '#ffe6a8',
    enemyBody: '#ff9f1c',
    enemyEye: '#2d1e2f',
    fragment: '#f1fa8c',
    portal: '#e63946',
    particle: '#f1fa8c'
  }
};

const THEME_ALIASES: Record<string, ThemeId> = {
  'dark-fantasy': 'dark-fantasy',
  clean: 'dark-fantasy',
  'scifi-neon': 'scifi-neon',
  neon: 'scifi-neon',
  'cartoon-brutal': 'cartoon-brutal',
  comic: 'cartoon-brutal'
};

const ACTION_CODES: Record<ActionName, string[]> = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  jump: ['Space', 'KeyW', 'ArrowUp'],
  attack: ['KeyJ'],
  dash: ['KeyK', 'ShiftLeft', 'ShiftRight'],
  parry: ['KeyL'],
  restart: ['KeyR']
};

const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 900;
const GRAVITY = 2100;
const PLAYER_ACCEL = 2600;
const PLAYER_FRICTION = 2200;
const PLAYER_MAX_SPEED = 390;
const PLAYER_JUMP_SPEED = 820;
const PLAYER_DASH_SPEED = 980;
const PLAYER_DASH_COOLDOWN = 0.9;
const PLAYER_PARRY_COOLDOWN = 1.2;
const PLAYER_ATTACK_COOLDOWN = 0.35;
const PLAYER_MAX_HP = 5;
const FRAGMENT_TARGET = 3;
const COMBO_TIMEOUT = 2.5;
const STORAGE_BEST_SCORE = 'heroi-kiosk-best-score';

const platforms: Platform[] = [
  { x: 0, y: 780, w: 860, h: 120 },
  { x: 980, y: 780, w: 620, h: 120 },
  { x: 1730, y: 780, w: 710, h: 120 },
  { x: 2580, y: 780, w: 620, h: 120 },
  { x: 520, y: 640, w: 200, h: 24 },
  { x: 1320, y: 620, w: 240, h: 24 },
  { x: 1960, y: 620, w: 220, h: 24 },
  { x: 2780, y: 650, w: 220, h: 24 }
];

const fragmentSpawns = [
  { x: 620, y: 600 },
  { x: 1440, y: 580 },
  { x: 2080, y: 580 }
];

const enemySpawns = [
  { id: 1, x: 500, patrolMin: 250, patrolMax: 820 },
  { id: 2, x: 1160, patrolMin: 1020, patrolMax: 1550 },
  { id: 3, x: 1530, patrolMin: 1020, patrolMax: 1590 },
  { id: 4, x: 1880, patrolMin: 1760, patrolMax: 2380 },
  { id: 5, x: 2290, patrolMin: 1760, patrolMax: 2380 },
  { id: 6, x: 2870, patrolMin: 2620, patrolMax: 3180 }
];

const appRoot = document.querySelector<HTMLDivElement>('#app');
if (!appRoot) {
  throw new Error('Elemento #app nao encontrado.');
}

const theme = resolveTheme();
const themeConfig = THEMES[theme];
document.body.dataset.theme = theme;

appRoot.innerHTML = `
  <main class="game-shell">
    <section class="hud-panel">
      <div class="hud-header">
        <div>
          <h1>Heroi Kiosk - Vertical Slice</h1>
          <p id="themeLabel">${themeConfig.label}</p>
        </div>
        <p id="objectiveText">Colete os 3 fragmentos do nucleo e alcance o portal.</p>
      </div>
      <div class="hud-grid">
        <article class="hud-card">
          <small>Vida</small>
          <strong id="hpText">5/5</strong>
          <div class="meter"><i id="hpFill"></i></div>
        </article>
        <article class="hud-card">
          <small>Dash</small>
          <strong id="dashText">PRONTO</strong>
          <div class="meter"><i id="dashFill"></i></div>
        </article>
        <article class="hud-card">
          <small>Fragmentos</small>
          <strong id="fragmentText">0/3</strong>
        </article>
        <article class="hud-card">
          <small>Pontuacao</small>
          <strong id="scoreText">0</strong>
        </article>
        <article class="hud-card">
          <small>Status</small>
          <strong id="statusText">EM MISSAO</strong>
          <small id="timeText">00:00</small>
        </article>
      </div>
    </section>

    <section class="stage-panel">
      <canvas id="gameCanvas"></canvas>
      <div id="stageOverlay" class="stage-overlay">
        <div class="box">
          <h2 id="overlayTitle">Missao encerrada</h2>
          <p id="overlayBody"></p>
          <button id="restartButton" type="button">Jogar novamente</button>
        </div>
      </div>
    </section>

    <section class="controls-panel">
      <p><strong>Controles:</strong> A/D ou setas mover, ESPACO pular, J atacar, K dash, L parry, R reiniciar.</p>
      <p id="comboText">Combo: x0 | Melhor: 0</p>
      <div class="touch-controls" id="touchControls">
        <button type="button" data-action="left">ESQ</button>
        <button type="button" data-action="right">DIR</button>
        <button type="button" data-action="jump">PULO</button>
        <button type="button" data-action="attack">ATAQUE</button>
        <button type="button" data-action="dash">DASH</button>
      </div>
    </section>
  </main>
`;

const canvas = mustGetById<HTMLCanvasElement>('gameCanvas');
const context = canvas.getContext('2d');
if (!context) {
  throw new Error('Contexto 2D indisponivel.');
}
const ctx: CanvasRenderingContext2D = context;

const ui = {
  hpText: mustGetById<HTMLElement>('hpText'),
  hpFill: mustGetById<HTMLElement>('hpFill'),
  dashText: mustGetById<HTMLElement>('dashText'),
  dashFill: mustGetById<HTMLElement>('dashFill'),
  fragmentText: mustGetById<HTMLElement>('fragmentText'),
  scoreText: mustGetById<HTMLElement>('scoreText'),
  statusText: mustGetById<HTMLElement>('statusText'),
  timeText: mustGetById<HTMLElement>('timeText'),
  comboText: mustGetById<HTMLElement>('comboText'),
  objectiveText: mustGetById<HTMLElement>('objectiveText'),
  overlay: mustGetById<HTMLElement>('stageOverlay'),
  overlayTitle: mustGetById<HTMLElement>('overlayTitle'),
  overlayBody: mustGetById<HTMLElement>('overlayBody'),
  restartButton: mustGetById<HTMLButtonElement>('restartButton'),
  touchControls: mustGetById<HTMLElement>('touchControls')
};

let viewportWidth = 1280;
let viewportHeight = 720;
let cameraX = 0;
let elapsedSeconds = 0;
let score = 0;
let bestScore = readBestScore();
let combo = 0;
let comboTimer = 0;
let fragmentsCollected = 0;
let objective = 'Colete os 3 fragmentos do nucleo e alcance o portal.';
let runState: 'playing' | 'won' | 'lost' = 'playing';
let shakeTimer = 0;
let shakeStrength = 0;
let particles: Particle[] = [];

const pressedKeys = new Set<string>();
const heldKeys = new Set<string>();
const pressedTouchActions = new Set<ActionName>();
const heldTouchActions = new Set<ActionName>();

let player = createPlayer();
let enemies = createEnemies();
let fragments = createFragments();
let portal = createPortal();

installInput();
installTouchControls();
ui.restartButton.addEventListener('click', () => resetRun());
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
requestAnimationFrame(loop);

let previousFrameMs = performance.now();

function resolveTheme(): ThemeId {
  const params = new URLSearchParams(window.location.search);
  const envTheme = typeof import.meta.env.VITE_DEFAULT_THEME === 'string' ? import.meta.env.VITE_DEFAULT_THEME.toLowerCase() : '';
  const raw = (params.get('theme') ?? envTheme ?? 'scifi-neon').toLowerCase();
  return THEME_ALIASES[raw] ?? 'scifi-neon';
}

function createPlayer(): Player {
  return {
    x: 140,
    y: 680,
    w: 48,
    h: 78,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
    dashCooldown: 0,
    attackCooldown: 0,
    parryCooldown: 0,
    invuln: 0,
    attackTimer: 0,
    parryTimer: 0
  };
}

function createEnemies(): Enemy[] {
  return enemySpawns.map((spawn) => ({
    id: spawn.id,
    x: spawn.x,
    y: 700,
    w: 46,
    h: 72,
    vx: 0,
    vy: 0,
    hp: 3,
    alive: true,
    dir: 1,
    patrolMin: spawn.patrolMin,
    patrolMax: spawn.patrolMax,
    attackCooldown: 0,
    stun: 0,
    hitFlash: 0
  }));
}

function createFragments(): Fragment[] {
  return fragmentSpawns.map((spawn) => ({
    x: spawn.x,
    y: spawn.y,
    radius: 17,
    collected: false,
    pulse: 0
  }));
}

function createPortal(): Portal {
  return {
    x: 3040,
    y: 640,
    w: 84,
    h: 130,
    active: false,
    pulse: 0
  };
}

function installInput(): void {
  const blocked = new Set<string>(Object.values(ACTION_CODES).flat());
  window.addEventListener('keydown', (event) => {
    if (!heldKeys.has(event.code)) {
      pressedKeys.add(event.code);
    }
    heldKeys.add(event.code);
    if (blocked.has(event.code)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    heldKeys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    heldKeys.clear();
    pressedKeys.clear();
    heldTouchActions.clear();
    pressedTouchActions.clear();
  });
}

function installTouchControls(): void {
  const buttons = Array.from(ui.touchControls.querySelectorAll<HTMLButtonElement>('[data-action]'));
  for (const button of buttons) {
    const rawAction = button.dataset.action;
    if (!rawAction) {
      continue;
    }
    const action = rawAction as ActionName;
    const press = (event: Event) => {
      event.preventDefault();
      if (!heldTouchActions.has(action)) {
        pressedTouchActions.add(action);
      }
      heldTouchActions.add(action);
    };
    const release = (event: Event) => {
      event.preventDefault();
      heldTouchActions.delete(action);
    };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);
  }
}

function resizeCanvas(): void {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  viewportWidth = Math.max(1, rect.width);
  viewportHeight = Math.max(1, rect.height);
  canvas.width = Math.floor(viewportWidth * dpr);
  canvas.height = Math.floor(viewportHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function loop(timestampMs: number): void {
  const dt = getDeltaSeconds(timestampMs);
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function getDeltaSeconds(timestampMs: number): number {
  const dt = Math.min(0.033, Math.max(0.001, (timestampMs - previousFrameMs) / 1000));
  previousFrameMs = timestampMs;
  return dt;
}

function update(dt: number): void {
  elapsedSeconds += dt;
  updateShake(dt);
  updateParticles(dt);
  portal.pulse += dt * 2.6;
  for (const fragment of fragments) {
    fragment.pulse += dt * 3.2;
  }

  if (runState === 'playing') {
    updatePlayer(dt);
    updateEnemies(dt);
    updateFragments();
    updatePortal();
    updateCombo(dt);
    updateCamera(dt);
  } else if (isActionPressed('restart')) {
    resetRun();
  }

  updateHud();
  pressedKeys.clear();
  pressedTouchActions.clear();
}

function updatePlayer(dt: number): void {
  const moveAxis = Number(isActionHeld('right')) - Number(isActionHeld('left'));
  if (moveAxis !== 0) {
    player.facing = moveAxis > 0 ? 1 : -1;
  }
  const targetSpeed = moveAxis * PLAYER_MAX_SPEED;
  const accel = moveAxis === 0 ? PLAYER_FRICTION : PLAYER_ACCEL;
  player.vx = approach(player.vx, targetSpeed, accel * dt);

  if (player.onGround && isActionPressed('jump')) {
    player.vy = -PLAYER_JUMP_SPEED;
    player.onGround = false;
    emitBurst(player.x + player.w * 0.5, player.y + player.h, 8, themeConfig.particle, 110, 220);
  }

  if (isActionPressed('dash') && player.dashCooldown <= 0) {
    player.vx = player.facing * PLAYER_DASH_SPEED;
    player.invuln = Math.max(player.invuln, 0.2);
    player.dashCooldown = PLAYER_DASH_COOLDOWN;
    triggerShake(0.12, 6);
    emitBurst(player.x + player.w * 0.5, player.y + player.h * 0.5, 14, themeConfig.particle, 160, 330);
  }

  if (isActionPressed('parry') && player.parryCooldown <= 0) {
    player.parryTimer = 0.24;
    player.parryCooldown = PLAYER_PARRY_COOLDOWN;
  }

  if (isActionPressed('attack') && player.attackCooldown <= 0) {
    player.attackCooldown = PLAYER_ATTACK_COOLDOWN;
    player.attackTimer = 0.12;
    performAttack();
  }

  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.parryCooldown = Math.max(0, player.parryCooldown - dt);
  player.invuln = Math.max(0, player.invuln - dt);
  player.attackTimer = Math.max(0, player.attackTimer - dt);
  player.parryTimer = Math.max(0, player.parryTimer - dt);

  player.vy += GRAVITY * dt;
  moveBody(player, dt, true);

  if (player.y > WORLD_HEIGHT + 220) {
    player.hp = 0;
    loseRun('Voce caiu no vazio. Tente novamente.');
  }
}

function updateEnemies(dt: number): void {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
    enemy.stun = Math.max(0, enemy.stun - dt);
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);

    if (enemy.stun > 0) {
      enemy.vx = approach(enemy.vx, 0, 2600 * dt);
    } else {
      const playerDelta = centerX(player) - centerX(enemy);
      const absDelta = Math.abs(playerDelta);
      if (absDelta < 420) {
        enemy.dir = playerDelta >= 0 ? 1 : -1;
        enemy.vx = approach(enemy.vx, enemy.dir * 170, 900 * dt);
      } else {
        if (enemy.x < enemy.patrolMin) {
          enemy.dir = 1;
        } else if (enemy.x > enemy.patrolMax) {
          enemy.dir = -1;
        }
        enemy.vx = approach(enemy.vx, enemy.dir * 110, 600 * dt);
      }
    }

    enemy.vy += GRAVITY * dt;
    moveBody(enemy, dt, false);

    if (rectsOverlap(player, enemy) && enemy.attackCooldown <= 0) {
      if (player.parryTimer > 0 && isEnemyInFront(enemy)) {
        enemy.stun = 0.95;
        enemy.vx = player.facing * 460;
        enemy.vy = -250;
        enemy.attackCooldown = 0.8;
        enemy.hitFlash = 0.18;
        score += 85;
        triggerShake(0.12, 8);
        emitBurst(centerX(enemy), enemy.y + enemy.h * 0.5, 14, themeConfig.particle, 180, 360);
      } else {
        const knockDirection = centerX(player) < centerX(enemy) ? -1 : 1;
        damagePlayer(1, knockDirection);
        enemy.attackCooldown = 1.05;
      }
    }
  }
}

function updateFragments(): void {
  for (const fragment of fragments) {
    if (fragment.collected) {
      continue;
    }
    const distance = Math.hypot(centerX(player) - fragment.x, centerY(player) - fragment.y);
    if (distance <= fragment.radius + 24) {
      fragment.collected = true;
      fragmentsCollected += 1;
      score += 320;
      triggerShake(0.1, 7);
      emitBurst(fragment.x, fragment.y, 18, themeConfig.fragment, 180, 340);
      if (fragmentsCollected >= FRAGMENT_TARGET) {
        portal.active = true;
        objective = 'Portal aberto. Alcance a saida agora.';
      } else {
        objective = `Fragmento coletado (${fragmentsCollected}/${FRAGMENT_TARGET}).`;
      }
    }
  }
}

function updatePortal(): void {
  if (!portal.active) {
    return;
  }
  if (rectsOverlap(player, portal)) {
    winRun();
  }
}

function updateCombo(dt: number): void {
  if (combo <= 0) {
    comboTimer = 0;
    return;
  }
  comboTimer -= dt;
  if (comboTimer <= 0) {
    combo = 0;
    comboTimer = 0;
  }
}

function updateCamera(dt: number): void {
  const target = clamp(player.x - viewportWidth * 0.35, 0, Math.max(0, WORLD_WIDTH - viewportWidth));
  cameraX = lerp(cameraX, target, 1 - Math.exp(-dt * 6.5));
}

function updateShake(dt: number): void {
  if (shakeTimer <= 0) {
    shakeTimer = 0;
    shakeStrength = 0;
    return;
  }
  shakeTimer -= dt;
  shakeStrength = Math.max(0, shakeStrength - dt * 16);
}

function updateParticles(dt: number): void {
  const remaining: Particle[] = [];
  for (const particle of particles) {
    particle.life -= dt;
    if (particle.life <= 0) {
      continue;
    }
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 600 * dt;
    particle.vx *= 0.98;
    remaining.push(particle);
  }
  particles = remaining;
}

function performAttack(): void {
  const attackWidth = 108;
  const attackHeight = 64;
  const attackBox = {
    x: player.facing > 0 ? player.x + player.w - 4 : player.x - attackWidth + 4,
    y: player.y + 8,
    w: attackWidth,
    h: attackHeight
  };

  let hits = 0;
  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }
    if (!rectsOverlap(attackBox, enemy)) {
      continue;
    }
    enemy.hp -= 1;
    enemy.hitFlash = 0.16;
    enemy.stun = 0.2;
    enemy.vx = player.facing * 370;
    enemy.vy = -220;
    hits += 1;
    if (enemy.hp <= 0) {
      enemy.alive = false;
      score += 220;
      emitBurst(centerX(enemy), enemy.y + enemy.h * 0.5, 16, themeConfig.enemyBody, 160, 320);
    } else {
      score += 80;
      emitBurst(centerX(enemy), enemy.y + enemy.h * 0.5, 9, themeConfig.fragment, 140, 270);
    }
  }

  if (hits > 0) {
    combo += hits;
    comboTimer = COMBO_TIMEOUT;
    score += combo * 6;
    triggerShake(0.08, 5 + hits * 2);
  }
}

function moveBody(body: Body, dt: number, trackGround: boolean): void {
  body.x += body.vx * dt;
  for (const platform of platforms) {
    if (!rectsOverlap(body, platform)) {
      continue;
    }
    if (body.vx > 0) {
      body.x = platform.x - body.w;
    } else if (body.vx < 0) {
      body.x = platform.x + platform.w;
    }
    body.vx = 0;
  }

  body.y += body.vy * dt;
  let grounded = false;
  for (const platform of platforms) {
    if (!rectsOverlap(body, platform)) {
      continue;
    }
    if (body.vy > 0) {
      body.y = platform.y - body.h;
      body.vy = 0;
      grounded = true;
    } else if (body.vy < 0) {
      body.y = platform.y + platform.h;
      body.vy = 0;
    }
  }

  body.x = clamp(body.x, 0, WORLD_WIDTH - body.w);

  if (trackGround) {
    player.onGround = grounded;
  }
}

function damagePlayer(amount: number, knockDirection: number): void {
  if (runState !== 'playing' || player.invuln > 0) {
    return;
  }
  player.hp = Math.max(0, player.hp - amount);
  player.invuln = 0.95;
  player.vx = 320 * knockDirection;
  player.vy = -300;
  combo = 0;
  comboTimer = 0;
  triggerShake(0.16, 10);
  emitBurst(centerX(player), player.y + player.h * 0.4, 12, themeConfig.enemyBody, 180, 320);
  if (player.hp <= 0) {
    loseRun('Derrota. O modulo colapsou antes da restauracao.');
  }
}

function isEnemyInFront(enemy: Enemy): boolean {
  const enemyDir = centerX(enemy) >= centerX(player) ? 1 : -1;
  return enemyDir === player.facing;
}

function triggerShake(duration: number, strength: number): void {
  shakeTimer = Math.max(shakeTimer, duration);
  shakeStrength = Math.max(shakeStrength, strength);
}

function emitBurst(x: number, y: number, count: number, color: string, minSpeed: number, maxSpeed: number): void {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
    const life = 0.25 + Math.random() * 0.45;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60,
      size: 2 + Math.random() * 3.6,
      life,
      maxLife: life,
      color
    });
  }
}

function winRun(): void {
  if (runState !== 'playing') {
    return;
  }
  runState = 'won';
  const timeBonus = Math.max(0, Math.round(1100 - elapsedSeconds * 15));
  const lifeBonus = player.hp * 150;
  const comboBonus = combo * 35;
  score += timeBonus + lifeBonus + comboBonus;
  bestScore = Math.max(bestScore, score);
  saveBestScore(bestScore);
  objective = 'Modulo restaurado. A cidade recebeu energia novamente.';
  ui.overlayTitle.textContent = 'Vitoria';
  ui.overlayBody.textContent = `Pontuacao final: ${score}. Bonus tempo: ${timeBonus}. Bonus vida: ${lifeBonus}.`;
  ui.overlay.classList.add('is-visible');
}

function loseRun(message: string): void {
  if (runState !== 'playing') {
    return;
  }
  runState = 'lost';
  objective = message;
  ui.overlayTitle.textContent = 'Falha da Missao';
  ui.overlayBody.textContent = `Pontuacao final: ${score}. Pressione R ou clique em "Jogar novamente".`;
  ui.overlay.classList.add('is-visible');
}

function resetRun(): void {
  player = createPlayer();
  enemies = createEnemies();
  fragments = createFragments();
  portal = createPortal();
  particles = [];
  elapsedSeconds = 0;
  score = 0;
  combo = 0;
  comboTimer = 0;
  fragmentsCollected = 0;
  objective = 'Colete os 3 fragmentos do nucleo e alcance o portal.';
  runState = 'playing';
  shakeTimer = 0;
  shakeStrength = 0;
  cameraX = 0;
  ui.overlay.classList.remove('is-visible');
}

function updateHud(): void {
  const hpRatio = player.hp / player.maxHp;
  const dashReadyRatio = 1 - player.dashCooldown / PLAYER_DASH_COOLDOWN;
  const totalSeconds = Math.floor(elapsedSeconds);
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');

  ui.hpText.textContent = `${player.hp}/${player.maxHp}`;
  ui.hpFill.style.width = `${Math.round(clamp(hpRatio, 0, 1) * 100)}%`;
  ui.dashFill.style.width = `${Math.round(clamp(dashReadyRatio, 0, 1) * 100)}%`;
  ui.dashText.textContent = player.dashCooldown <= 0 ? 'PRONTO' : `${player.dashCooldown.toFixed(1)}s`;
  ui.fragmentText.textContent = `${fragmentsCollected}/${FRAGMENT_TARGET}`;
  ui.scoreText.textContent = String(score);
  ui.statusText.textContent = runState === 'playing' ? 'EM MISSAO' : runState === 'won' ? 'VITORIA' : 'DERROTA';
  ui.timeText.textContent = `${mins}:${secs}`;
  ui.comboText.textContent = `Combo: x${combo} | Melhor: ${bestScore}`;
  ui.objectiveText.textContent = objective;
}

function render(): void {
  const shakeX = shakeTimer > 0 ? (Math.random() * 2 - 1) * shakeStrength : 0;
  const shakeY = shakeTimer > 0 ? (Math.random() * 2 - 1) * shakeStrength * 0.6 : 0;

  renderBackground(shakeX, shakeY);

  ctx.save();
  ctx.translate(-cameraX + shakeX, shakeY);
  renderPlatforms();
  renderPortal();
  renderFragments();
  renderEnemies();
  renderPlayer();
  renderParticles();
  ctx.restore();
}

function renderBackground(shakeX: number, shakeY: number): void {
  ctx.clearRect(0, 0, viewportWidth, viewportHeight);

  const gradient = ctx.createLinearGradient(0, 0, 0, viewportHeight);
  gradient.addColorStop(0, themeConfig.skyTop);
  gradient.addColorStop(1, themeConfig.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  const farOffset = modulo(-cameraX * 0.2 + shakeX * 0.4, 430);
  ctx.fillStyle = themeConfig.farLayer;
  for (let i = -1; i < 12; i += 1) {
    const baseX = i * 430 + farOffset - 430;
    ctx.beginPath();
    ctx.moveTo(baseX, viewportHeight);
    ctx.lineTo(baseX + 180, viewportHeight * 0.45);
    ctx.lineTo(baseX + 360, viewportHeight);
    ctx.closePath();
    ctx.fill();
  }

  const midOffset = modulo(-cameraX * 0.45 + shakeX * 0.5, 300);
  ctx.fillStyle = themeConfig.midLayer;
  for (let i = -1; i < 16; i += 1) {
    const x = i * 300 + midOffset - 300;
    const height = 140 + (i % 3) * 45;
    ctx.fillRect(x, viewportHeight - height - 140 + shakeY * 0.2, 150, height);
  }

  ctx.fillStyle = themeConfig.haze;
  for (let i = 0; i < 5; i += 1) {
    const hazeY = viewportHeight * (0.2 + i * 0.16);
    const wave = Math.sin(elapsedSeconds * 0.5 + i) * 24;
    ctx.fillRect(0, hazeY + wave, viewportWidth, 36);
  }
}

function renderPlatforms(): void {
  for (const platform of platforms) {
    if (platform.x + platform.w < cameraX - 60 || platform.x > cameraX + viewportWidth + 60) {
      continue;
    }
    ctx.fillStyle = themeConfig.platform;
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.fillStyle = themeConfig.platformTop;
    ctx.fillRect(platform.x, platform.y, platform.w, 8);
  }
}

function renderPortal(): void {
  if (!portal.active) {
    return;
  }
  const centerPortalX = portal.x + portal.w * 0.5;
  const centerPortalY = portal.y + portal.h * 0.5;
  const pulse = 1 + Math.sin(portal.pulse * 4) * 0.1;
  const radius = 40 * pulse;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = themeConfig.portal;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(centerPortalX, centerPortalY, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(centerPortalX, centerPortalY, radius + 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function renderFragments(): void {
  for (const fragment of fragments) {
    if (fragment.collected) {
      continue;
    }
    const pulse = 1 + Math.sin(fragment.pulse * 5) * 0.16;
    const radius = fragment.radius * pulse;
    ctx.save();
    ctx.translate(fragment.x, fragment.y);
    ctx.rotate(fragment.pulse);
    ctx.fillStyle = themeConfig.fragment;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.lineTo(radius * 0.7, 0);
    ctx.lineTo(0, radius);
    ctx.lineTo(-radius * 0.7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function renderEnemies(): void {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }
    const flash = enemy.hitFlash > 0;
    ctx.fillStyle = flash ? '#ffffff' : themeConfig.enemyBody;
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
    ctx.fillStyle = themeConfig.enemyEye;
    const eyeY = enemy.y + 18;
    const eyeX = enemy.dir > 0 ? enemy.x + enemy.w - 14 : enemy.x + 8;
    ctx.fillRect(eyeX, eyeY, 6, 6);

    const hpRatio = enemy.hp / 3;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(enemy.x, enemy.y - 10, enemy.w, 4);
    ctx.fillStyle = themeConfig.fragment;
    ctx.fillRect(enemy.x, enemy.y - 10, enemy.w * hpRatio, 4);
  }
}

function renderPlayer(): void {
  if (player.invuln > 0 && Math.floor(player.invuln * 24) % 2 === 0) {
    return;
  }

  const midX = player.x + player.w * 0.5;
  const midY = player.y + player.h * 0.5;
  const capeDirection = player.facing > 0 ? -1 : 1;

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(midX, player.y + player.h + 4, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = themeConfig.heroCape;
  ctx.beginPath();
  ctx.moveTo(midX, player.y + 22);
  ctx.lineTo(midX + capeDirection * 34, player.y + 48);
  ctx.lineTo(midX + capeDirection * 22, player.y + 74);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = themeConfig.heroBody;
  ctx.fillRect(player.x, player.y + 16, player.w, player.h - 16);
  ctx.fillRect(player.x + 8, player.y, player.w - 16, 24);

  ctx.fillStyle = '#0b1624';
  const eyeOffset = player.facing > 0 ? 8 : player.w - 14;
  ctx.fillRect(player.x + eyeOffset, player.y + 10, 6, 4);

  ctx.fillStyle = themeConfig.heroSword;
  const swordBaseX = player.facing > 0 ? player.x + player.w - 2 : player.x - 34;
  ctx.fillRect(swordBaseX, player.y + 32, 34, 5);

  if (player.parryTimer > 0) {
    ctx.strokeStyle = themeConfig.fragment;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(midX, midY, 38 + Math.sin(player.parryTimer * 28) * 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (player.attackTimer > 0) {
    ctx.strokeStyle = themeConfig.fragment;
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (player.facing > 0) {
      ctx.arc(player.x + player.w + 12, player.y + 40, 30, -1.1, 1.1);
    } else {
      ctx.arc(player.x - 12, player.y + 40, 30, Math.PI - 1.1, Math.PI + 1.1);
    }
    ctx.stroke();
  }
}

function renderParticles(): void {
  for (const particle of particles) {
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1;
}

function isActionHeld(action: ActionName): boolean {
  if (heldTouchActions.has(action)) {
    return true;
  }
  for (const code of ACTION_CODES[action]) {
    if (heldKeys.has(code)) {
      return true;
    }
  }
  return false;
}

function isActionPressed(action: ActionName): boolean {
  if (pressedTouchActions.has(action)) {
    pressedTouchActions.delete(action);
    return true;
  }
  for (const code of ACTION_CODES[action]) {
    if (pressedKeys.has(code)) {
      pressedKeys.delete(code);
      return true;
    }
  }
  return false;
}

function readBestScore(): number {
  const stored = window.localStorage.getItem(STORAGE_BEST_SCORE);
  if (!stored) {
    return 0;
  }
  const parsed = Number(stored);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function saveBestScore(value: number): void {
  window.localStorage.setItem(STORAGE_BEST_SCORE, String(Math.max(0, Math.floor(value))));
}

function centerX(body: { x: number; w: number }): number {
  return body.x + body.w * 0.5;
}

function centerY(body: { y: number; h: number }): number {
  return body.y + body.h * 0.5;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function approach(current: number, target: number, delta: number): number {
  if (current < target) {
    return Math.min(target, current + delta);
  }
  if (current > target) {
    return Math.max(target, current - delta);
  }
  return current;
}

function modulo(value: number, cycle: number): number {
  return ((value % cycle) + cycle) % cycle;
}

function rectsOverlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function mustGetById<TElement extends HTMLElement>(id: string): TElement {
  const node = document.getElementById(id);
  if (!node) {
    throw new Error(`Elemento #${id} nao encontrado.`);
  }
  return node as TElement;
}
