// Web Audio API를 활용한 효과음 사운드 엔진
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }

  playCorrect() {
    // 딩동댕 밝은 상승음
    this.playTone(523.25, 'sine', 0.1, 0.15); // C5
    setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.15), 80); // E5
    setTimeout(() => this.playTone(783.99, 'triangle', 0.25, 0.2), 160); // G5
  }

  playWrong() {
    // 띡 오답음
    this.playTone(220, 'sawtooth', 0.15, 0.15);
    setTimeout(() => this.playTone(180, 'sawtooth', 0.2, 0.15), 100);
  }

  playPop() {
    // 물방울 터지는 소리
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playClick() {
    this.playTone(440, 'triangle', 0.05, 0.08);
  }

  playBossHit() {
    // 타격음
    this.playTone(150, 'square', 0.1, 0.2);
    setTimeout(() => this.playTone(300, 'sine', 0.15, 0.15), 50);
  }

  playVictory() {
    // 승리 팡파르
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.3, 0.2), idx * 120);
    });
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

export const sounds = new SoundEngine();
