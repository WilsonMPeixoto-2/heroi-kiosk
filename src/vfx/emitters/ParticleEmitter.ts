import { Particle, ParticleContainer, type Texture } from 'pixi.js';
import type { QualityTier } from '../fx/PerfBudget';
import type { BurstPreset } from './BurstPresets';

interface LiveParticle {
  sprite: Particle;
  vx: number;
  vy: number;
  lifeMs: number;
  maxLifeMs: number;
  spin: number;
}

export class ParticleEmitter {
  readonly container: ParticleContainer;
  private readonly particles: LiveParticle[] = [];
  private reducedMotion = false;

  constructor() {
    this.container = new ParticleContainer({
      dynamicProperties: {
        position: true,
        scale: true,
        rotation: true,
        color: true
      },
      roundPixels: false
    });
    this.container.eventMode = 'none';
    this.container.blendMode = 'add';
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  burst(
    x: number,
    y: number,
    sparkTexture: Texture,
    glowTexture: Texture,
    preset: BurstPreset,
    quality: QualityTier
  ): void {
    const qualityScale = quality === 'HIGH' ? 1 : quality === 'MED' ? 0.72 : 0.5;
    const reducedScale = this.reducedMotion ? 0.4 : 1;
    const count = Math.max(4, Math.floor(preset.count * qualityScale * reducedScale));

    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * preset.spread * Math.PI * 2 + Math.random() * 0.12;
      const speed = preset.speed * (0.55 + Math.random() * 0.45);
      const useGlow = preset.glow && i % 3 === 0;
      const sprite = new Particle(useGlow ? glowTexture : sparkTexture);
      sprite.anchorX = 0.5;
      sprite.anchorY = 0.5;
      sprite.tint = preset.tint;
      sprite.alpha = useGlow ? 0.64 : 0.92;
      sprite.scaleX = useGlow ? 0.3 : 0.18;
      sprite.scaleY = sprite.scaleX;
      sprite.x = x;
      sprite.y = y;
      sprite.rotation = Math.random() * Math.PI * 2;
      this.container.addParticle(sprite);
      this.particles.push({
        sprite,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        lifeMs: preset.lifeMs,
        maxLifeMs: preset.lifeMs,
        spin: (Math.random() - 0.5) * 0.2
      });
    }
  }

  tick(dtMs: number): void {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const particle = this.particles[i];
      particle.lifeMs -= dtMs;
      particle.sprite.x += particle.vx * (dtMs / 1000);
      particle.sprite.y += particle.vy * (dtMs / 1000);
      particle.vy += 120 * (dtMs / 1000);
      particle.vx *= 0.986;
      particle.sprite.rotation += particle.spin;
      const progress = Math.max(0, particle.lifeMs / particle.maxLifeMs);
      particle.sprite.alpha = progress * (particle.sprite.alpha > 0.7 ? 1 : 0.85);
      particle.sprite.scaleX = Math.max(0.06, particle.sprite.scaleX * (1 - dtMs * 0.0016));
      particle.sprite.scaleY = particle.sprite.scaleX;

      if (particle.lifeMs <= 0) {
        this.container.removeParticle(particle.sprite);
        this.particles.splice(i, 1);
      }
    }
    this.container.update();
  }

  clear(): void {
    this.particles.splice(0, this.particles.length);
    this.container.particleChildren.length = 0;
    this.container.update();
  }
}
