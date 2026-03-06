import { Sprite, TilingSprite } from 'pixi.js';
import type { VfxTextures } from '../assets/textures';

export class ResultScene {
  readonly layer = new TilingSprite();
  readonly halo = new Sprite();
  private reducedMotion = false;

  constructor(textures: VfxTextures, width: number, height: number) {
    this.layer.texture = textures.grain;
    this.layer.width = width;
    this.layer.height = height;
    this.layer.alpha = 0.12;
    this.layer.tint = 0xa2dbff;

    this.halo.texture = textures.glow;
    this.halo.anchor.set(0.5);
    this.halo.blendMode = 'screen';
    this.halo.alpha = 0.36;
    this.halo.scale.set(3.2);
    this.halo.x = width * 0.5;
    this.halo.y = height * 0.42;
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  resize(width: number, height: number): void {
    this.layer.width = width;
    this.layer.height = height;
    this.halo.x = width * 0.5;
    this.halo.y = height * 0.42;
  }

  tick(dtMs: number): void {
    const dt = dtMs / 1000;
    this.layer.tilePosition.x += (this.reducedMotion ? 5 : 14) * dt;
    if (!this.reducedMotion) {
      this.halo.rotation += 0.08 * dt;
      this.halo.scale.set(3 + Math.sin(performance.now() * 0.002) * 0.2);
    }
  }
}
