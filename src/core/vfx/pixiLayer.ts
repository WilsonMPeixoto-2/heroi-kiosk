import { Application, Graphics } from 'pixi.js';

interface Particle {
  shape: Graphics;
  vx: number;
  vy: number;
  life: number;
}

export class PixiFxLayer {
  private app: Application | null = null;
  private host: HTMLElement | null = null;
  private readonly particles: Particle[] = [];
  private running = false;

  async mount(host: HTMLElement): Promise<void> {
    if (this.app) {
      return;
    }

    this.host = host;

    try {
      const app = new Application();
      await app.init({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true
      });
      app.canvas.classList.add('pixi-layer');
      host.appendChild(app.canvas);
      this.app = app;
      this.running = true;
      app.ticker.add(this.tick);
    } catch {
      this.app = null;
      this.running = false;
    }
  }

  burst(xRatio: number, yRatio: number, color = 0x2de2e6): void {
    if (!this.app || !this.host) {
      return;
    }

    const x = this.host.clientWidth * xRatio;
    const y = this.host.clientHeight * yRatio;

    for (let i = 0; i < 26; i += 1) {
      const shape = new Graphics();
      shape.circle(0, 0, Math.random() * 3 + 1.4);
      shape.fill(color);
      shape.x = x;
      shape.y = y;
      shape.alpha = 0.9;
      this.app.stage.addChild(shape);

      this.particles.push({
        shape,
        vx: (Math.random() - 0.5) * 4.4,
        vy: (Math.random() - 0.8) * 4.2,
        life: Math.random() * 22 + 20
      });
    }
  }

  successWave(): void {
    this.burst(0.42, 0.42, 0x45cf78);
    this.burst(0.58, 0.42, 0xf5cb5c);
  }

  private readonly tick = (): void => {
    if (!this.running) {
      return;
    }

    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const particle = this.particles[i];
      particle.life -= 1;
      particle.shape.x += particle.vx;
      particle.shape.y += particle.vy;
      particle.vy += 0.04;
      particle.shape.alpha = Math.max(0, particle.life / 35);

      if (particle.life <= 0) {
        particle.shape.destroy();
        this.particles.splice(i, 1);
      }
    }
  };

  destroy(): void {
    if (!this.app) {
      return;
    }

    this.running = false;
    this.app.ticker.remove(this.tick);
    this.app.destroy(true);
    this.app = null;
  }
}
