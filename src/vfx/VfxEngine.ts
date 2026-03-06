import { Application, Container } from 'pixi.js';
import { createProceduralTextures } from './assets/textures';
import { BURST_PRESETS } from './emitters/BurstPresets';
import { ParticleEmitter } from './emitters/ParticleEmitter';
import { CameraShake } from './fx/CameraShake';
import { Grading } from './fx/Grading';
import { PerfBudget } from './fx/PerfBudget';
import { AttractScene } from './scenes/AttractScene';
import { RepairScene } from './scenes/RepairScene';
import { ResultScene } from './scenes/ResultScene';

type SceneName = 'ATTRACT' | 'INTRO' | 'AVATAR' | 'TOOLKIT' | 'REPAIR' | 'RESULT';
type ResultType = 'full' | 'partial' | 'timeout';

export class VfxEngine {
  private app: Application | null = null;
  private host: HTMLElement | null = null;
  private root = new Container();
  private world = new Container();
  private overlays = new Container();
  private perf = new PerfBudget();
  private grading = new Grading();
  private shake = new CameraShake();
  private emitter = new ParticleEmitter();
  private textures = createProceduralTextures();
  private attractScene: AttractScene | null = null;
  private repairScene: RepairScene | null = null;
  private resultScene: ResultScene | null = null;
  private sceneName: SceneName = 'ATTRACT';
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  async init(host: HTMLElement): Promise<boolean> {
    this.host = host;
    try {
      const app = new Application();
      await app.init({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        preference: 'webgpu'
      });
      app.canvas.classList.add('pixi-layer');
      host.appendChild(app.canvas);
      this.app = app;

      this.root.eventMode = 'none';
      this.world.eventMode = 'none';
      this.overlays.eventMode = 'none';
      this.root.addChild(this.world);
      this.root.addChild(this.overlays);
      this.world.addChild(this.emitter.container);
      this.world.filters = [this.grading.filter];
      this.overlays.alpha = 0.98;
      app.stage.addChild(this.root);

      this.buildScenes();
      this.setReducedMotion(this.reducedMotion);
      app.ticker.add(this.tick);
      return true;
    } catch {
      this.destroy();
      return false;
    }
  }

  setScene(name: SceneName): void {
    this.sceneName = name;
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
    this.shake.setReducedMotion(value);
    this.emitter.setReducedMotion(value);
    this.attractScene?.setReducedMotion(value);
    this.repairScene?.setReducedMotion(value);
    this.resultScene?.setReducedMotion(value);
  }

  onRepairHit(payload: { x: number; y: number; success: boolean; intensity: number }): void {
    if (!this.app || !this.host) return;
    const preset = payload.success ? BURST_PRESETS.repairSuccess : BURST_PRESETS.repairFail;
    this.emitter.burst(
      this.host.clientWidth * payload.x,
      this.host.clientHeight * payload.y,
      this.textures.spark,
      this.textures.glow,
      preset,
      this.perf.qualityTier
    );
    this.repairScene?.pulse(payload.success ? 0.3 * payload.intensity : 0.12);
    this.shake.pulse(payload.success ? 0.36 * payload.intensity : 0.2);
  }

  onSlotComplete(payload: { x: number; y: number }): void {
    if (!this.app || !this.host) return;
    this.emitter.burst(
      this.host.clientWidth * payload.x,
      this.host.clientHeight * payload.y,
      this.textures.spark,
      this.textures.glow,
      BURST_PRESETS.slotComplete,
      this.perf.qualityTier
    );
    this.shake.pulse(0.48);
  }

  onResult(payload: { type: ResultType }): void {
    if (!this.app || !this.host) return;
    const tint = payload.type === 'timeout' ? 0xfb6542 : payload.type === 'partial' ? 0xf5cb5c : 0x2de2e6;
    this.emitter.burst(
      this.host.clientWidth * 0.5,
      this.host.clientHeight * 0.4,
      this.textures.spark,
      this.textures.glow,
      { ...BURST_PRESETS.result, tint },
      this.perf.qualityTier
    );
    this.shake.pulse(payload.type === 'timeout' ? 0.2 : 0.62);
  }

  setRestorationProgress(progress01: number): void {
    this.grading.setRestorationProgress(progress01);
    this.repairScene?.setProgress(progress01);
  }

  tick = (): void => {
    if (!this.app) return;
    const dtMs = this.app.ticker.deltaMS;
    this.perf.update(dtMs);
    this.shake.tick(dtMs, this.world);
    this.emitter.tick(dtMs);
    this.tickScene(dtMs);
    this.adaptQuality();
  };

  destroy(): void {
    if (!this.app) {
      return;
    }
    this.app.ticker.remove(this.tick);
    this.emitter.clear();
    this.app.destroy(true);
    this.app = null;
    this.host = null;
    this.attractScene = null;
    this.repairScene = null;
    this.resultScene = null;
  }

  private buildScenes(): void {
    if (!this.host) return;
    this.world.removeChildren();
    this.overlays.removeChildren();
    this.world.addChild(this.emitter.container);
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    this.attractScene = new AttractScene(this.textures, width, height);
    this.repairScene = new RepairScene(this.textures, width, height);
    this.resultScene = new ResultScene(this.textures, width, height);
  }

  private tickScene(dtMs: number): void {
    const scene = this.getActiveScene();
    if (!scene) {
      return;
    }
    this.world.removeChildren();
    this.world.addChild(scene.layer);
    const maybeGlow = 'glow' in scene ? scene.glow : 'ambientGlow' in scene ? scene.ambientGlow : scene.halo;
    this.world.addChild(maybeGlow);
    this.world.addChild(this.emitter.container);
    scene.tick(dtMs);
  }

  private getActiveScene(): AttractScene | RepairScene | ResultScene | null {
    if (this.sceneName === 'REPAIR') return this.repairScene;
    if (this.sceneName === 'RESULT') return this.resultScene;
    return this.attractScene;
  }

  private adaptQuality(): void {
    if (this.reducedMotion) {
      this.root.alpha = 0.82;
      return;
    }
    this.root.alpha = this.perf.qualityTier === 'LOW' ? 0.76 : this.perf.qualityTier === 'MED' ? 0.88 : 1;
  }
}

