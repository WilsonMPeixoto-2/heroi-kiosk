import { Sprite, TilingSprite } from 'pixi.js';
import type { VfxTextures } from '../assets/textures';

export class AttractScene {
  readonly layer = new TilingSprite();
  readonly glow = new Sprite();
  private reducedMotion = false;

  constructor(textures: VfxTextures, width: number, height: number) {
    this.layer.texture = textures.grain;
    this.layer.width = width;
    this.layer.height = height;
    this.layer.alpha = 0.09;
    this.layer.blendMode = 'normal';
    this.layer.tint = 0x7ab8d4;

    this.glow.texture = textures.glow;
    this.glow.anchor.set(0.5);
    this.glow.alpha = 0.24;
    this.glow.blendMode = 'screen';
    this.glow.x = width * 0.2;
    this.glow.y = height * 0.25;
    this.glow.scale.set(2.4);
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  resize(width: number, height: number): void {
    this.layer.width = width;
    this.layer.height = height;
  }

  tick(dtMs: number): void {
    const dt = dtMs / 1000;
    const speed = this.reducedMotion ? 4 : 16;
    this.layer.tilePosition.x += speed * dt;
    this.layer.tilePosition.y += speed * 0.6 * dt;
    if (!this.reducedMotion) {
      this.glow.rotation += 0.04 * dt;
    }
  }
}
