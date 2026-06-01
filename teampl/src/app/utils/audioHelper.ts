class TonePlayer {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;
  private activeOscillators: OscillatorNode[] = [];
  private activeGain: GainNode | null = null;
  private type: 'ringtone' | 'ringback';

  constructor(type: 'ringtone' | 'ringback') {
    this.type = type;
  }

  start() {
    this.stop();
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API not supported", e);
      return;
    }

    const playTone = () => {
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      
      if (this.type === 'ringback') {
        gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.1);
        gain.connect(this.ctx.destination);
        this.activeGain = gain;

        const osc1 = this.ctx.createOscillator();
        osc1.frequency.value = 440;
        osc1.connect(gain);

        const osc2 = this.ctx.createOscillator();
        osc2.frequency.value = 480;
        osc2.connect(gain);

        osc1.start();
        osc2.start();
        this.activeOscillators = [osc1, osc2];

        setTimeout(() => this.stopOscillators(), 1500);
      } else {
        // ringtone
        gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.05);
        gain.connect(this.ctx.destination);
        this.activeGain = gain;

        const osc1 = this.ctx.createOscillator();
        osc1.frequency.value = 680;
        osc1.connect(gain);

        const osc2 = this.ctx.createOscillator();
        osc2.frequency.value = 770;
        osc2.connect(gain);

        const mod = this.ctx.createOscillator();
        mod.frequency.value = 12; // 12Hz tremolo
        const modGain = this.ctx.createGain();
        modGain.gain.value = 15;
        mod.connect(modGain);
        modGain.connect(osc1.frequency);
        modGain.connect(osc2.frequency);

        osc1.start();
        osc2.start();
        mod.start();
        this.activeOscillators = [osc1, osc2, mod];

        setTimeout(() => this.stopOscillators(), 1200);
      }
    };

    playTone();
    this.intervalId = setInterval(playTone, this.type === 'ringback' ? 4000 : 3000);
  }

  private stopOscillators() {
    if (this.activeGain && this.ctx) {
      try {
        this.activeGain.gain.setValueAtTime(this.activeGain.gain.value, this.ctx.currentTime);
        this.activeGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);
      } catch (e) {}
    }
    setTimeout(() => {
      this.activeOscillators.forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
      this.activeOscillators = [];
    }, 150);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.stopOscillators();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
  }
}

export const ringtonePlayer = new TonePlayer('ringtone');
export const ringbackPlayer = new TonePlayer('ringback');

export const playConnectSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.error("Failed to play connect sound", e);
  }
};

export const playDisconnectSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playBeep = (delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = 350;
      
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + delay + 0.02);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + delay + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.18);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.2);
    };

    playBeep(0);
    playBeep(0.25);
    playBeep(0.5);
  } catch (e) {
    console.error("Failed to play disconnect sound", e);
  }
};
