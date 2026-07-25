import { MusicGenre } from '../types';

export class BackgroundMusicEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentGenre: MusicGenre = 'ambient';
  private gainNode: GainNode | null = null;
  private activeNodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
  private timerId: any = null;

  constructor() {}

  public getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public start(genre: MusicGenre, volume = 0.15) {
    this.stop();
    if (genre === 'none') return;

    this.currentGenre = genre;
    const ctx = this.getAudioContext();

    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    this.gainNode.connect(ctx.destination);

    this.isPlaying = true;

    if (genre === 'ambient') {
      this.playAmbientDrone(ctx, this.gainNode);
    } else if (genre === 'cinematic' || genre === 'epic') {
      this.playCinematicChords(ctx, this.gainNode, genre === 'epic');
    } else if (genre === 'lofi') {
      this.playLofiBeats(ctx, this.gainNode);
    } else if (genre === 'upbeat') {
      this.playUpbeatArp(ctx, this.gainNode);
    } else {
      this.playAmbientDrone(ctx, this.gainNode);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (e) {}
      this.gainNode = null;
    }
  }

  public setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
    }
  }

  private playAmbientDrone(ctx: AudioContext, destination: AudioNode) {
    // Warm rich pad with low-pass filter
    const freqs = [110, 164.81, 220, 277.18, 329.63]; // A minor chord notes
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    filter.Q.setValueAtTime(2, ctx.currentTime);
    filter.connect(destination);

    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, ctx.currentTime);

      // Subtle LFO for lush movement
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.1 + idx * 0.05, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(2, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      oscGain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start();

      this.activeNodes.push(osc, lfo);
    });
  }

  private playCinematicChords(ctx: AudioContext, destination: AudioNode, isEpic: boolean) {
    const chords = [
      [130.81, 164.81, 196.00], // C major
      [110.00, 130.81, 164.81], // A minor
      [174.61, 220.00, 261.63], // F major
      [146.83, 174.61, 220.00], // D minor
    ];

    let chordIdx = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isEpic ? 1200 : 600, ctx.currentTime);
    filter.connect(destination);

    const playChord = () => {
      if (!this.isPlaying) return;
      const currentChord = chords[chordIdx % chords.length];
      chordIdx++;

      currentChord.forEach((f) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = isEpic ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(f, ctx.currentTime);

        g.gain.setValueAtTime(0.001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.8);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.8);

        osc.connect(g);
        g.connect(filter);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 4.0);

        this.activeNodes.push(osc);
      });
    };

    playChord();
    this.timerId = setInterval(playChord, 3800);
  }

  private playLofiBeats(ctx: AudioContext, destination: AudioNode) {
    const freqs = [146.83, 174.61, 220.00, 261.63]; // Dm7
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.connect(destination);

    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      g.gain.setValueAtTime(0.06, ctx.currentTime);

      osc.connect(g);
      g.connect(filter);
      osc.start();
      this.activeNodes.push(osc);
    });
  }

  private playUpbeatArp(ctx: AudioContext, destination: AudioNode) {
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C major pentatonic
    let noteIdx = 0;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, ctx.currentTime);
    filter.connect(destination);

    const playArpStep = () => {
      if (!this.isPlaying) return;
      const f = scale[noteIdx % scale.length];
      noteIdx++;

      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime);

      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(g);
      g.connect(filter);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);

      this.activeNodes.push(osc);
    };

    this.timerId = setInterval(playArpStep, 250);
  }
}
