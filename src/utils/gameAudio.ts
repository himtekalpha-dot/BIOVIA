// Procedural Web Audio API sound effects (zero external files / zero 404s)

class GameAudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(next: boolean): void {
    this.muted = next;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainPeak = 0.08,
    jitter = 0.08
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const pitchShift = 1 + (Math.random() * 2 - 1) * jitter;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(40, freqStart * pitchShift), now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd * pitchShift), now + duration);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(gainPeak, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // Ignore audio errors on headless/restricted environments
    }
  }

  public playShoot(): void {
    this.playTone(620, 290, 0.085, 'triangle', 0.06, 0.08);
  }

  public playSkillWave(): void {
    this.playTone(280, 740, 0.24, 'sine', 0.09, 0.04);
  }

  public playHit(): void {
    this.playTone(210, 95, 0.11, 'sawtooth', 0.07, 0.1);
  }

  public playPickup(): void {
    this.playTone(540, 880, 0.13, 'sine', 0.075, 0.06);
  }

  public playHurt(): void {
    this.playTone(170, 68, 0.22, 'square', 0.085, 0.05);
  }

  public playPlace(): void {
    this.playTone(420, 560, 0.09, 'triangle', 0.06, 0.05);
  }

  public playClick(): void {
    this.playTone(500, 620, 0.055, 'sine', 0.045, 0.04);
  }

  public playVictory(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      window.setTimeout(() => {
        this.playTone(freq, freq * 1.02, 0.22, 'triangle', 0.08, 0.01);
      }, idx * 95);
    });
  }

  public playDefeat(): void {
    const notes = [330, 261.6, 196];
    notes.forEach((freq, idx) => {
      window.setTimeout(() => {
        this.playTone(freq, freq * 0.9, 0.24, 'sawtooth', 0.06, 0.01);
      }, idx * 120);
    });
  }
}

export const gameAudio = new GameAudioEngine();
