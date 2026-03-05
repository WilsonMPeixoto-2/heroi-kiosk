type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export class AudioGate {
  private context: AudioContext | null = null;
  private enabled = true;

  async initOnUserGesture(): Promise<boolean> {
    const AudioCtor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!AudioCtor) {
      return false;
    }

    if (!this.context) {
      this.context = new AudioCtor();
    }

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    return this.context.state === 'running';
  }

  toggleEnabled(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  blip(frequency = 440, durationMs = 90, gainLevel = 0.06): void {
    if (!this.context || !this.enabled) {
      return;
    }

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(gainLevel, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
    osc.connect(gain);
    gain.connect(this.context.destination);
    osc.start(now);
    osc.stop(now + durationMs / 1000);
  }

  success(): void {
    this.blip(620, 110, 0.05);
    window.setTimeout(() => this.blip(820, 120, 0.05), 80);
  }
}
