import Phaser from 'phaser';
import './reboot-game.css';

type ThemeId = 'dark-fantasy' | 'scifi-neon' | 'cartoon-brutal';
type RunStatus = 'playing' | 'won' | 'lost';

interface RuntimeState {
  hp: number;
  maxHp: number;
  score: number;
  coresCollected: number;
  totalCores: number;
  combo: number;
  comboTimerMs: number;
  elapsedMs: number;
  bestScore: number;
  status: RunStatus;
  theme: ThemeId;
  scene: Phaser.Scene | null;
}

interface ThemeConfig {
  label: string;
  skyAsset: string;
  accentHex: number;
  enemyHex: number;
  portalHex: number;
  platformHex: number;
}

const THEME_ALIASES: Record<string, ThemeId> = {
  'dark-fantasy': 'dark-fantasy',
  clean: 'dark-fantasy',
  'scifi-neon': 'scifi-neon',
  neon: 'scifi-neon',
  'cartoon-brutal': 'cartoon-brutal',
  comic: 'cartoon-brutal'
};

const THEMES: Record<ThemeId, ThemeConfig> = {
  'dark-fantasy': {
    label: 'Versao A - Fantasia Sombria',
    skyAsset: 'spooky',
    accentHex: 0xc7a46a,
    enemyHex: 0xbf7d66,
    portalHex: 0xd98c2b,
    platformHex: 0x6d7788
  },
  'scifi-neon': {
    label: 'Versao B - Sci-Fi Neon',
    skyAsset: 'space3',
    accentHex: 0x00e5ff,
    enemyHex: 0xff2e88,
    portalHex: 0x00e5ff,
    platformHex: 0x7ca6cc
  },
  'cartoon-brutal': {
    label: 'Versao C - Cartoon Brutal',
    skyAsset: 'gradient20',
    accentHex: 0xf1fa8c,
    enemyHex: 0xe63946,
    portalHex: 0xf1fa8c,
    platformHex: 0x9ad7cb
  }
};

const STORAGE_KEY = 'heroi-kiosk-reboot-best-score';

const appRoot = document.querySelector<HTMLDivElement>('#app');
if (!appRoot) {
  throw new Error('Elemento #app nao encontrado.');
}

const theme = resolveTheme();
const themeConfig = THEMES[theme];
document.body.dataset.theme = theme;

appRoot.innerHTML = `
  <main class="reboot-shell">
    <section class="reboot-top">
      <header class="reboot-head">
        <h1>Heroi Kiosk | Reboot de Verdade</h1>
        <p id="themeLabel">${themeConfig.label}</p>
      </header>
      <div class="reboot-stats">
        <article class="stat-card">
          <small>Vida</small>
          <strong id="hpText">5/5</strong>
          <div class="meter"><i id="hpFill"></i></div>
        </article>
        <article class="stat-card">
          <small>Fragmentos</small>
          <strong id="coreText">0/3</strong>
        </article>
        <article class="stat-card">
          <small>Pontuacao</small>
          <strong id="scoreText">0</strong>
        </article>
        <article class="stat-card">
          <small>Combo</small>
          <strong id="comboText">x0</strong>
        </article>
        <article class="stat-card">
          <small>Status</small>
          <strong id="statusText">EM MISSAO</strong>
          <small id="timeText">00:00</small>
        </article>
      </div>
    </section>

    <section class="reboot-stage">
      <div id="stageFrame" class="stage-frame">
        <div id="viewport16x9" class="viewport-16x9">
          <div id="gameHost"></div>
          <div id="overlay" class="overlay">
            <div class="overlay-box">
              <h2 id="overlayTitle">Fim de jogo</h2>
              <p id="overlayBody"></p>
              <button id="restartBtn" type="button">Jogar novamente</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="reboot-bottom">
      <p><strong>Controles:</strong> A/D ou setas para mover, W/ESPACO para pular, J atacar, K dash, R reiniciar.</p>
      <span class="chip" id="bestText">Melhor: 0</span>
    </section>
  </main>
`;

const ui = {
  hpText: mustGetById('hpText'),
  hpFill: mustGetById('hpFill'),
  coreText: mustGetById('coreText'),
  scoreText: mustGetById('scoreText'),
  comboText: mustGetById('comboText'),
  statusText: mustGetById('statusText'),
  timeText: mustGetById('timeText'),
  bestText: mustGetById('bestText'),
  overlay: mustGetById('overlay'),
  overlayTitle: mustGetById('overlayTitle'),
  overlayBody: mustGetById('overlayBody'),
  restartBtn: mustGetById('restartBtn') as HTMLButtonElement,
  stageFrame: mustGetById('stageFrame'),
  viewport16x9: mustGetById('viewport16x9'),
  gameHost: mustGetById('gameHost')
};

const runtime: RuntimeState = {
  hp: 5,
  maxHp: 5,
  score: 0,
  coresCollected: 0,
  totalCores: 3,
  combo: 0,
  comboTimerMs: 0,
  elapsedMs: 0,
  bestScore: readBestScore(),
  status: 'playing',
  theme,
  scene: null
};

ui.restartBtn.addEventListener('click', () => restartRun());
updateHud();
const cleanupAspectBarrier = setupAspectBarrier(ui.stageFrame, ui.viewport16x9, 16 / 9);

let game: Phaser.Game | null = null;

class RebootScene extends Phaser.Scene {
  private readonly worldWidth = 4200;
  private readonly worldHeight = 900;

  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private cores!: Phaser.Physics.Arcade.Group;
  private portal!: Phaser.Physics.Arcade.Sprite;
  private attackFx!: Phaser.GameObjects.Particles.ParticleEmitter;
  private hurtFx!: Phaser.GameObjects.Particles.ParticleEmitter;
  private skyFar!: Phaser.GameObjects.TileSprite;
  private skyNear!: Phaser.GameObjects.TileSprite;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyJ!: Phaser.Input.Keyboard.Key;
  private keyK!: Phaser.Input.Keyboard.Key;
  private keyR!: Phaser.Input.Keyboard.Key;

  private faceDir: 1 | -1 = 1;
  private attackCdMs = 0;
  private dashCdMs = 0;
  private invulnMs = 0;

  preload(): void {
    this.load.image('sky-space3', '/game-assets/skies/space3.png');
    this.load.image('sky-spooky', '/game-assets/skies/spooky.png');
    this.load.image('sky-gradient20', '/game-assets/skies/gradient20.png');
    this.load.image('platform', '/game-assets/sprites/platform.png');
    this.load.spritesheet('dude', '/game-assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.image('core', '/game-assets/sprites/star.png');
    this.load.image('enemy', '/game-assets/sprites/ufo.png');
    this.load.image('portal', '/game-assets/sprites/orb-blue.png');
    this.load.image('fx-yellow', '/game-assets/particles/yellow.png');
    this.load.image('fx-red', '/game-assets/particles/red.png');
  }

  create(): void {
    runtime.scene = this;
    resetRuntime();
    hideOverlay();

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

    const skyKey = `sky-${themeConfig.skyAsset}`;
    this.skyFar = this.add.tileSprite(0, 0, this.worldWidth, this.worldHeight, skyKey).setOrigin(0, 0);
    this.skyFar.setScrollFactor(0);
    this.skyFar.setAlpha(0.9);

    this.skyNear = this.add.tileSprite(0, 120, this.worldWidth, this.worldHeight - 120, skyKey).setOrigin(0, 0);
    this.skyNear.setScrollFactor(0);
    this.skyNear.setAlpha(0.55);
    this.skyNear.setBlendMode(Phaser.BlendModes.ADD);

    this.platforms = this.physics.add.staticGroup();
    this.buildPlatforms();

    this.player = this.physics.add.sprite(120, 560, 'dude');
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.02);
    this.player.setDepth(8);
    this.player.setSize(20, 44).setOffset(6, 4);

    this.cores = this.physics.add.group({
      key: 'core',
      repeat: runtime.totalCores - 1,
      setXY: { x: 880, y: 180, stepX: 1250 }
    });
    this.cores.getChildren().forEach((child, index) => {
      const core = child as Phaser.Physics.Arcade.Image;
      core.setBounce(1, 1);
      core.setVelocity(Phaser.Math.Between(-30, 30), Phaser.Math.Between(-40, 40));
      core.setCollideWorldBounds(true);
      core.setTint(themeConfig.accentHex);
      core.setScale(1.15 + index * 0.04);
    });

    this.enemies = this.physics.add.group();
    this.spawnEnemies();

    this.portal = this.physics.add.sprite(this.worldWidth - 140, 590, 'portal');
    this.portal.setScale(3.2);
    this.portal.setTint(themeConfig.portalHex);
    this.portal.setAlpha(0.22);
    this.portal.setImmovable(true);
    this.portal.disableBody(false, false);
    if (this.portal.body) {
      this.portal.body.checkCollision.none = true;
    }

    this.attackFx = this.add.particles(0, 0, 'fx-yellow', {
      speed: { min: 80, max: 260 },
      lifespan: 320,
      scale: { start: 0.11, end: 0 },
      gravityY: 700,
      quantity: 0,
      blendMode: 'ADD'
    });
    this.hurtFx = this.add.particles(0, 0, 'fx-red', {
      speed: { min: 80, max: 250 },
      lifespan: 340,
      scale: { start: 0.1, end: 0 },
      gravityY: 700,
      quantity: 0
    });

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.cores, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.cores, (_, core) => this.collectCore(core as Phaser.Physics.Arcade.Image));
    this.physics.add.overlap(this.player, this.enemies, (_, enemy) => this.touchEnemy(enemy as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.player, this.portal, () => this.reachPortal());

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyJ = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.keyK = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.keyR = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.createAnimations();

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    updateHud();
  }

  update(_time: number, deltaMs: number): void {
    runtime.elapsedMs += deltaMs;
    runtime.comboTimerMs = Math.max(0, runtime.comboTimerMs - deltaMs);
    if (runtime.comboTimerMs <= 0) {
      runtime.combo = 0;
    }

    this.attackCdMs = Math.max(0, this.attackCdMs - deltaMs);
    this.dashCdMs = Math.max(0, this.dashCdMs - deltaMs);
    this.invulnMs = Math.max(0, this.invulnMs - deltaMs);

    this.skyFar.tilePositionX = this.cameras.main.scrollX * 0.08;
    this.skyNear.tilePositionX = this.cameras.main.scrollX * 0.2;
    this.skyNear.tilePositionY = Math.sin(runtime.elapsedMs * 0.00025) * 12;

    if (runtime.status !== 'playing') {
      if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
        restartRun();
      }
      this.player.setVelocityX(0);
      this.player.anims.play('turn', true);
      updateHud();
      return;
    }

    this.handleMovement();
    this.updateEnemies(deltaMs);

    if (Phaser.Input.Keyboard.JustDown(this.keyJ) && this.attackCdMs <= 0) {
      this.performAttack();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyK) && this.dashCdMs <= 0) {
      const dir = this.faceDir;
      this.player.setVelocityX(dir * 680);
      this.dashCdMs = 900;
      this.invulnMs = Math.max(this.invulnMs, 230);
      this.cameras.main.shake(80, 0.004);
      this.attackFx.explode(14, this.player.x + dir * 18, this.player.y + 18);
    }

    if (this.invulnMs > 0 && Math.floor(this.invulnMs / 70) % 2 === 0) {
      this.player.setAlpha(0.55);
    } else {
      this.player.setAlpha(1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      restartRun();
    }

    updateHud();
  }

  private handleMovement(): void {
    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.keyW);
    const body = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (!body) {
      return;
    }

    if (left && !right) {
      this.player.setVelocityX(-250);
      this.player.anims.play('left', true);
      this.faceDir = -1;
    } else if (right && !left) {
      this.player.setVelocityX(250);
      this.player.anims.play('right', true);
      this.faceDir = 1;
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play('turn', true);
    }

    if (jumpPressed && body.blocked.down) {
      this.player.setVelocityY(-620);
      this.attackFx.explode(6, this.player.x, this.player.y + 24);
    }
  }

  private updateEnemies(deltaMs: number): void {
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      if (!enemy.active) {
        return;
      }

      const speed = enemy.getData('speed') as number;
      const minX = enemy.getData('minX') as number;
      const maxX = enemy.getData('maxX') as number;
      let dir = enemy.getData('dir') as number;

      if (enemy.x <= minX) {
        dir = 1;
      } else if (enemy.x >= maxX) {
        dir = -1;
      } else {
        const playerDistance = Math.abs(this.player.x - enemy.x);
        if (playerDistance < 240) {
          dir = this.player.x >= enemy.x ? 1 : -1;
        }
      }

      enemy.setData('dir', dir);
      enemy.setVelocityX(dir * speed);
      enemy.y += Math.sin((runtime.elapsedMs + enemy.getData('phase')) * 0.004) * 0.55 * (deltaMs / 16.6667);
      enemy.flipX = dir < 0;
    });
  }

  private performAttack(): void {
    this.attackCdMs = 260;
    const dir = this.faceDir;
    const attackRect = new Phaser.Geom.Rectangle(this.player.x + dir * 48 - 32, this.player.y - 12, 84, 58);
    let hitCount = 0;

    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      if (!enemy.active) {
        return;
      }
      const enemyRect = enemy.getBounds();
      if (!Phaser.Geom.Intersects.RectangleToRectangle(attackRect, enemyRect)) {
        return;
      }

      const hp = (enemy.getData('hp') as number) - 1;
      enemy.setData('hp', hp);
      enemy.setVelocityX(dir * 320);
      enemy.setVelocityY(-200);
      hitCount += 1;

      if (hp <= 0) {
        enemy.disableBody(true, true);
        runtime.score += 220;
        this.hurtFx.explode(15, enemy.x, enemy.y);
      } else {
        runtime.score += 90;
        this.hurtFx.explode(8, enemy.x, enemy.y);
      }
    });

    if (hitCount > 0) {
      runtime.combo += hitCount;
      runtime.comboTimerMs = 2300;
      runtime.score += runtime.combo * 7;
      this.cameras.main.shake(90, 0.0035 + hitCount * 0.0007);
      this.attackFx.explode(12, this.player.x + dir * 42, this.player.y + 12);
    }
  }

  private collectCore(core: Phaser.Physics.Arcade.Image): void {
    core.disableBody(true, true);
    runtime.coresCollected += 1;
    runtime.score += 340;
    this.attackFx.explode(20, core.x, core.y);
    this.cameras.main.flash(100, 255, 255, 255, false);

    if (runtime.coresCollected >= runtime.totalCores) {
      this.portal.setAlpha(1);
      this.portal.setScale(4);
      if (this.portal.body) {
        this.portal.body.checkCollision.none = false;
      }
      runtime.score += 250;
    }
  }

  private touchEnemy(enemy: Phaser.Physics.Arcade.Sprite): void {
    if (this.invulnMs > 0 || !enemy.active || runtime.status !== 'playing') {
      return;
    }
    runtime.hp -= 1;
    runtime.combo = 0;
    runtime.comboTimerMs = 0;
    this.invulnMs = 1050;
    const knockDir = this.player.x < enemy.x ? -1 : 1;
    this.player.setVelocityX(300 * knockDir);
    this.player.setVelocityY(-290);
    this.cameras.main.shake(140, 0.006);
    this.hurtFx.explode(12, this.player.x, this.player.y);
    if (runtime.hp <= 0) {
      endRun('lost', 'Derrota: o nucleo entrou em colapso.');
    }
  }

  private reachPortal(): void {
    if (runtime.status !== 'playing' || runtime.coresCollected < runtime.totalCores) {
      return;
    }
    runtime.score += Math.max(0, 1200 - Math.floor(runtime.elapsedMs / 120));
    endRun('won', 'Vitoria: modulo restaurado e cidade reenergizada.');
  }

  private spawnEnemies(): void {
    const enemySpawns = [
      { x: 780, y: 520, minX: 650, maxX: 1080, speed: 95 },
      { x: 1560, y: 500, minX: 1420, maxX: 1900, speed: 110 },
      { x: 2520, y: 480, minX: 2300, maxX: 2880, speed: 105 },
      { x: 3320, y: 470, minX: 3060, maxX: 3780, speed: 120 },
      { x: 3840, y: 430, minX: 3600, maxX: 4100, speed: 130 }
    ];

    enemySpawns.forEach((spawn, index) => {
      const enemy = this.enemies.create(spawn.x, spawn.y, 'enemy') as Phaser.Physics.Arcade.Sprite;
      enemy.setScale(1.5);
      enemy.setTint(themeConfig.enemyHex);
      enemy.setData('hp', 2);
      enemy.setData('minX', spawn.minX);
      enemy.setData('maxX', spawn.maxX);
      enemy.setData('speed', spawn.speed);
      enemy.setData('dir', index % 2 === 0 ? 1 : -1);
      enemy.setData('phase', index * 160);
      enemy.setDepth(7);
      const enemyBody = enemy.body as Phaser.Physics.Arcade.Body | null;
      enemyBody?.setAllowGravity(false);
      enemy.setCollideWorldBounds(false);
    });
  }

  private buildPlatforms(): void {
    const groundY = 710;
    [300, 980, 1660, 2340, 3020, 3700].forEach((x) => {
      const ground = this.platforms.create(x, groundY, 'platform') as Phaser.Physics.Arcade.Image;
      ground.setScale(2.4).refreshBody();
      ground.setTint(themeConfig.platformHex);
    });

    const ledges: Array<{ x: number; y: number; scale: number }> = [
      { x: 700, y: 560, scale: 0.8 },
      { x: 1150, y: 500, scale: 0.9 },
      { x: 1480, y: 560, scale: 0.8 },
      { x: 1880, y: 470, scale: 0.9 },
      { x: 2300, y: 530, scale: 0.9 },
      { x: 2700, y: 470, scale: 0.9 },
      { x: 3120, y: 520, scale: 0.9 },
      { x: 3520, y: 460, scale: 0.9 },
      { x: 3940, y: 420, scale: 0.8 }
    ];

    ledges.forEach((ledge) => {
      const p = this.platforms.create(ledge.x, ledge.y, 'platform') as Phaser.Physics.Arcade.Image;
      p.setScale(ledge.scale).refreshBody();
      p.setTint(themeConfig.platformHex);
    });
  }

  private createAnimations(): void {
    if (!this.anims.exists('left')) {
      this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 11,
        repeat: -1
      });
    }
    if (!this.anims.exists('turn')) {
      this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
      });
    }
    if (!this.anims.exists('right')) {
      this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 11,
        repeat: -1
      });
    }
  }
}

function resolveTheme(): ThemeId {
  const params = new URLSearchParams(window.location.search);
  const envTheme = typeof import.meta.env.VITE_DEFAULT_THEME === 'string' ? import.meta.env.VITE_DEFAULT_THEME.toLowerCase() : '';
  const rawTheme = (params.get('theme') ?? envTheme ?? 'scifi-neon').toLowerCase();
  return THEME_ALIASES[rawTheme] ?? 'scifi-neon';
}

function resetRuntime(): void {
  runtime.hp = runtime.maxHp;
  runtime.score = 0;
  runtime.coresCollected = 0;
  runtime.combo = 0;
  runtime.comboTimerMs = 0;
  runtime.elapsedMs = 0;
  runtime.status = 'playing';
  updateHud();
}

function restartRun(): void {
  if (runtime.scene) {
    runtime.scene.scene.restart();
  } else {
    resetRuntime();
  }
}

function endRun(status: RunStatus, message: string): void {
  runtime.status = status;
  runtime.bestScore = Math.max(runtime.bestScore, runtime.score);
  saveBestScore(runtime.bestScore);
  ui.overlayTitle.textContent = status === 'won' ? 'Vitoria' : 'Falha da Missao';
  ui.overlayBody.textContent = `${message} Pontuacao final: ${runtime.score}.`;
  ui.overlay.classList.add('visible');
  updateHud();
}

function hideOverlay(): void {
  ui.overlay.classList.remove('visible');
}

function updateHud(): void {
  ui.hpText.textContent = `${runtime.hp}/${runtime.maxHp}`;
  ui.coreText.textContent = `${runtime.coresCollected}/${runtime.totalCores}`;
  ui.scoreText.textContent = String(runtime.score);
  ui.comboText.textContent = `x${runtime.combo}`;
  ui.statusText.textContent = runtime.status === 'playing' ? 'EM MISSAO' : runtime.status === 'won' ? 'VITORIA' : 'DERROTA';
  ui.bestText.textContent = `Melhor: ${runtime.bestScore}`;
  const ratio = clamp(runtime.hp / runtime.maxHp, 0, 1);
  ui.hpFill.style.width = `${Math.round(ratio * 100)}%`;

  const totalSeconds = Math.floor(runtime.elapsedMs / 1000);
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');
  ui.timeText.textContent = `${mins}:${secs}`;
}

function readBestScore(): number {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return 0;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function saveBestScore(value: number): void {
  window.localStorage.setItem(STORAGE_KEY, String(Math.max(0, Math.floor(value))));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mustGetById(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) {
    throw new Error(`Elemento #${id} nao encontrado.`);
  }
  return node;
}

function setupAspectBarrier(frame: HTMLElement, viewport: HTMLElement, ratio: number): () => void {
  const sync = (): void => {
    const frameWidth = frame.clientWidth;
    const frameHeight = frame.clientHeight;
    if (!frameWidth || !frameHeight) {
      return;
    }

    let width = frameWidth;
    let height = Math.round(width / ratio);
    if (height > frameHeight) {
      height = frameHeight;
      width = Math.round(height * ratio);
    }

    viewport.style.width = `${width}px`;
    viewport.style.height = `${height}px`;
    frame.dataset.bars = frameWidth / frameHeight > ratio ? 'pillar' : 'letter';
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

game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: ui.gameHost,
  width: 1280,
  height: 720,
  backgroundColor: '#03060d',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1350 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [RebootScene]
});

window.addEventListener('beforeunload', () => {
  cleanupAspectBarrier();
  game?.destroy(true);
});
