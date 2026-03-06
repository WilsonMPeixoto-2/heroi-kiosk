import { Sprite, TilingSprite } from 'pixi.js';
import type { VfxTextures } from '../assets/textures';

export class RepairScene {
  readonly layer = new TilingSprite();
  readonly ambientGlow = new Sprite();
  private reducedMotion = false;
  private progress = 0;
  private pulseEnergy = 0;

  constructor(textures: VfxTextures, width: number, height: number) {
    this.layer.texture = textures.grain;
    this.layer.width = width;
    this.layer.height = height;
    this.layer.alpha = 0.14;
    this.layer.tint = 0x4e91c9;

    this.ambientGlow.texture = textures.glow;
    this.ambientGlow.anchor.set(0.5);
    this.ambientGlow.blendMode = 'add';
    this.ambientGlow.alpha = 0.24;
    this.ambientGlow.scale.set(2.8);
    this.ambientGlow.x = width * 0.5;
    this.ambientGlow.y = height * 0.38;
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  resize(width: number, height: number): void {
    this.layer.width = width;
    this.layer.height = height;
    this.ambientGlow.x = width * 0.5;
    this.ambientGlow.y = height * 0.38;
  }

  setProgress(p01: number): void {
    this.progress = Math.max(0, Math.min(1, p01));
  }

  pulse(strength = 0.25): void {
    this.pulseEnergy = Math.min(1, this.pulseEnergy + strength);
  }

  tick(dtMs: number): void {
    const dt = dtMs / 1000;
    this.layer.tilePosition.x += (this.reducedMotion ? 6 : 20) * dt;
    this.layer.tilePosition.y += (this.reducedMotion ? 2 : 8) * dt;
    this.pulseEnergy = Math.max(0, this.pulseEnergy - dt * 0.8);
    const drift = this.reducedMotion ? 0 : Math.sin(performance.now() * 0.0014) * 10;
    this.ambientGlow.x += (this.layer.width * 0.5 + drift - this.ambientGlow.x) * 0.08;
    this.ambientGlow.alpha = 0.18 + this.progress * 0.26 + this.pulseEnergy * 0.25;
    this.ambientGlow.scale.set(2.4 + this.progress * 0.8 + this.pulseEnergy * 0.5);
    this.ambientGlow.tint = this.progress > 0.66 ? 0x72ffd9 : this.progress > 0.33 ? 0x6dc2f6 : 0x4f8eb8;
  }
}
