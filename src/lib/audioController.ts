import { useGameStore } from '@/store/useGameStore';
class AudioController {
  private ctx: AudioContext | null = null;
  private initialized = false;
  constructor() {
    if (typeof window !== 'undefined') {
      // Lazy init to avoid autoplay policy issues immediately
      const initAudio = () => this.init();
      window.addEventListener('click', initAudio, { once: true });
      window.addEventListener('touchstart', initAudio, { once: true });
      window.addEventListener('keydown', initAudio, { once: true });
    }
  }
  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContext();
      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext not supported', e);
    }
  }
  play(type: 'throw' | 'hit' | 'pickup' | 'win' | 'lose' | 'beep') {
    const { settings } = useGameStore.getState();
    if (!settings.sound || !this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    const t = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      switch (type) {
        case 'throw':
          // Slide whistle up
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(300, t);
          osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
          osc.start(t);
          osc.stop(t + 0.1);
          break;
        case 'hit':
          // Low punch/crunch
          osc.type = 'square';
          osc.frequency.setValueAtTime(150, t);
          osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
          osc.start(t);
          osc.stop(t + 0.15);
          break;
        case 'pickup':
          // High ping
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, t);
          osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
          osc.start(t);
          osc.stop(t + 0.1);
          break;
        case 'win':
          // Major arpeggio
          this.playNote(523.25, t, 0.1); // C5
          this.playNote(659.25, t + 0.1, 0.1); // E5
          this.playNote(783.99, t + 0.2, 0.2); // G5
          this.playNote(1046.50, t + 0.3, 0.4); // C6
          break;
        case 'lose':
          // Descending slide
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300, t);
          osc.frequency.linearRampToValueAtTime(50, t + 0.5);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.5);
          osc.start(t);
          osc.stop(t + 0.5);
          break;
        case 'beep':
          // Short high beep for countdown
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, t);
          osc.frequency.exponentialRampToValueAtTime(400, t + 0.1);
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
          osc.start(t);
          osc.stop(t + 0.1);
          break;
      }
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }
  private playNote(freq: number, time: number, duration: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    osc.start(time);
    osc.stop(time + duration);
  }
}
export const audioController = new AudioController();