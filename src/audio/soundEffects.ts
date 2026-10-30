/**
 * Procedural Web Audio Sound Synthesizer
 * Zero external audio files or network dependencies.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastTickTime: number = 0;

  constructor() {
    // Check localStorage preference if available
    try {
      const saved = localStorage.getItem('brute_force_lab_muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    } catch {
      // Ignore
    }
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem('brute_force_lab_muted', String(muted));
    } catch {
      // Ignore
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Combination test tick sound
   * Uses frequency modulation and throttled playback to prevent buffer thrashing at high rates
   */
  public playAttemptTick(speed: 'lenta' | 'normal' | 'rapida' | 'extrema'): void {
    if (this.isMuted) return;
    const now = performance.now();

    // Throttle sound so high speeds (1,000/s or 10,000/s) emit a rhythmic cyber audio pulse
    const minInterval = speed === 'extrema' ? 45 : speed === 'rapida' ? 35 : speed === 'normal' ? 25 : 10;
    if (now - this.lastTickTime < minInterval) return;
    this.lastTickTime = now;

    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Pitch variation based on speed
      const baseFreq = speed === 'extrema' ? 880 : speed === 'rapida' ? 660 : speed === 'normal' ? 440 : 320;
      osc.type = speed === 'lenta' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(baseFreq + (Math.random() * 40 - 20), ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {
      // Audio context error guard
    }
  }

  /**
   * UI Click sound
   */
  public playClick(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      // Guard
    }
  }

  /**
   * Triumphant cyber unlock chord when password is found
   */
  public playSuccessUnlock(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      // 4-note ascending futuristic harmonic arpeggio
      const notes = [440, 554.37, 659.25, 880, 1108.73]; // A major 7 / 9
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const startTime = ctx.currentTime + i * 0.07;
        const duration = 0.55;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch {
      // Guard
    }
  }
}

export const soundFx = new SoundSynthesizer();
