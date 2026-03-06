import { Texture } from 'pixi.js';

export interface VfxTextures {
  spark: Texture;
  glow: Texture;
  shard: Texture;
  grain: Texture;
}

export function createProceduralTextures(): VfxTextures {
  return {
    spark: Texture.from(drawSparkCanvas()),
    glow: Texture.from(drawGlowCanvas()),
    shard: Texture.from(drawShardCanvas()),
    grain: Texture.from(drawGrainCanvas())
  };
}

function drawSparkCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.translate(32, 32);
  ctx.fillStyle = 'rgba(255,255,255,0.98)';
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(6, -6);
  ctx.lineTo(22, 0);
  ctx.lineTo(6, 6);
  ctx.lineTo(0, 22);
  ctx.lineTo(-6, 6);
  ctx.lineTo(-22, 0);
  ctx.lineTo(-6, -6);
  ctx.closePath();
  ctx.fill();
  return canvas;
}

function drawGlowCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const g = ctx.createRadialGradient(64, 64, 10, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.35, 'rgba(180,245,255,0.5)');
  g.addColorStop(1, 'rgba(180,245,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return canvas;
}

function drawShardCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.translate(32, 32);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(18, 16);
  ctx.lineTo(-18, 16);
  ctx.closePath();
  ctx.fill();
  return canvas;
}

function drawGrainCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const image = ctx.createImageData(128, 128);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = Math.floor(Math.random() * 255);
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = Math.random() > 0.93 ? 42 : 0;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

