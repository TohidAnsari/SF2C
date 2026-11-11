/**
 * Shadow Fight 2 Web Edition - Procedural Web Audio Synthesizer
 * Generates authentic martial arts SFX, blade clashes, taiko drums,
 * and procedural themes for both the serene Dojo Lobby and intense Combat.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.musicPlaying = false;
    this.lobbyMusicPlaying = false;
    this.bgmTimer = null;
    this.lobbyTimer = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) ||
                               (typeof global !== 'undefined' && global.AudioContext);
      if (AudioContextClass) {
        try {
          this.ctx = new AudioContextClass();
        } catch (e) {
          this.ctx = null;
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBattleMusic();
      this.stopLobbyMusic();
    }
    return this.isMuted;
  }

  // --- SOUND EFFECTS ---

  playWhoosh(pitch = 180, duration = 0.16) {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + duration);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playFistHit() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.18);
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);

    this.playNoiseSnap(0.06, 0.4);
  }

  playSandbagHit() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    // Deep leather / canvas dull impact thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(22, now + 0.22);
    gain.gain.setValueAtTime(0.85, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);

    this.playNoiseSnap(0.08, 0.25);
  }

  playBladeSlash() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.16);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);

    this.playNoiseSnap(0.12, 0.35);
  }

  playBlockClang() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    const freqs = [1200, 1850, 2600];
    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.9, now + 0.3);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  playCriticalHit() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);

    this.playNoiseSnap(0.15, 0.7);
  }

  playShurikenThrow() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.linearRampToValueAtTime(1400, now + 0.1);
    osc.frequency.linearRampToValueAtTime(600, now + 0.22);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // --- SPECIAL JUTSU & MAGIC SFX ---
  playSpellReady() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);
      gain.gain.setValueAtTime(0.22, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.65);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.65);
    });
  }

  playFireballIgnite() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.45);
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
    this.playNoiseSnap(0.35, 0.4);
  }

  playDarkEruption() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.linearRampToValueAtTime(280, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.55);
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
    this.playNoiseSnap(0.25, 0.5);
  }

  playSmokeTeleport() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.28);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
    this.playNoiseSnap(0.2, 0.25);
  }

  playNoiseSnap(duration = 0.08, volume = 0.3) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  playGong() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const harmonics = [110, 164, 218, 332, 496];

    harmonics.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const amp = 0.35 / (idx + 1);
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 2.8);
    });
  }

  playTaikoDrum(heavy = true) {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = heavy ? 95 : 140;
    const endFreq = heavy ? 28 : 45;
    const dur = heavy ? 0.35 : 0.22;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);

    gain.gain.setValueAtTime(heavy ? 0.8 : 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  }

  // --- BOSS AWAKENING & CINEMATIC AUDIO SYNTHESIZERS ---

  playBossRoar() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const duration = 1.35;

    // Carrier oscillator 1 (sawtooth growl dropping in pitch)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(95, now);
    osc1.frequency.exponentialRampToValueAtTime(32, now + duration);

    // Sub-bass oscillator 2 (triangle for deep demonic weight)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(65, now);
    osc2.frequency.exponentialRampToValueAtTime(24, now + duration);

    // Frequency modulation LFO for menacing guttural tremor
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(28, now);
    lfo.frequency.linearRampToValueAtTime(14, now + duration);
    lfoGain.gain.setValueAtTime(35, now);
    lfoGain.gain.linearRampToValueAtTime(5, now + duration);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    // Resonant low-pass filter with sweeping resonance
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    if (filter.Q && filter.Q.setValueAtTime) {
      filter.Q.setValueAtTime(7.5, now);
    }
    filter.frequency.setValueAtTime(160, now);
    filter.frequency.linearRampToValueAtTime(720, now + 0.35);
    filter.frequency.exponentialRampToValueAtTime(80, now + duration);

    // Master gain envelope
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.01, now);
    masterGain.gain.linearRampToValueAtTime(0.85, now + 0.12);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(this.ctx.destination);

    lfo.start(now);
    lfo.stop(now + duration);
    osc1.start(now);
    osc1.stop(now + duration);
    osc2.start(now);
    osc2.stop(now + duration);

    this.playNoiseSnap(0.45, 0.4);
  }

  playDemonicThunder() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const duration = 0.85;

    // Explosive white-noise burst
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.18));
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Low-pass filter for heavy atmospheric thunder rumble
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(120, now + duration);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.9, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noiseSource.start(now);

    // Sub-bass boom layer
    const boomOsc = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(150, now);
    boomOsc.frequency.exponentialRampToValueAtTime(28, now + 0.65);

    boomGain.gain.setValueAtTime(0.95, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    boomOsc.connect(boomGain);
    boomGain.connect(this.ctx.destination);

    boomOsc.start(now);
    boomOsc.stop(now + 0.65);
  }

  playDialogueChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const duration = 0.09;

    // Traditional Japanese pentatonic scale (Insen mode): D, Eb, G, A, C
    const insenFrequencies = [587.33, 622.25, 783.99, 880.00, 1046.50, 1174.66];
    const baseFreq = insenFrequencies[Math.floor(Math.random() * insenFrequencies.length)];

    // Resonant wooden bamboo tap oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.72, now + duration);

    // Percussive bamboo gain envelope
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Hollow bamboo overtone filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq * 1.5, now);
    if (filter.Q && filter.Q.setValueAtTime) {
      filter.Q.setValueAtTime(4.0, now);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  playSealAcquired() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const duration = 3.8;

    // Multi-tone harmonious celestial gong chords (Insen / Hirajoshi celestial overtone series)
    const chordFreqs = [110.00, 164.81, 220.00, 293.66, 329.63, 440.00, 587.33, 880.00, 1174.66];

    chordFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx < 3 ? 'sine' : 'triangle';

      const stagger = idx * 0.035;
      const startTime = now + stagger;
      const noteDuration = duration - stagger;

      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.995, startTime + noteDuration);

      const amplitude = 0.28 / (1 + idx * 0.45);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(amplitude, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + noteDuration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });

    // Deep sub-bass gong resonance strike
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(73.42, now);
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 2.5);

    subGain.gain.setValueAtTime(0.55, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 2.5);
  }

  // --- PROCEDURAL SERENE DOJO LOBBY THEME ---
  startLobbyMusic() {
    if (this.lobbyMusicPlaying || this.isMuted) return;
    this.init();
    this.stopBattleMusic();
    this.lobbyMusicPlaying = true;

    // Serene Traditional Japanese Pentatonic Mode (Insen / Hirajoshi)
    const kotoNotes = [220, 233.08, 293.66, 329.63, 392.00, 440, 466.16, 587.33];
    let noteIdx = 0;

    const playLobbyNote = () => {
      if (!this.lobbyMusicPlaying || this.isMuted) return;

      const now = this.ctx.currentTime;

      // Soft Shakuhachi / Flute drone
      if (Math.random() > 0.45) {
        const fluteOsc = this.ctx.createOscillator();
        const fluteGain = this.ctx.createGain();
        fluteOsc.type = 'sine';
        const fluteFreq = kotoNotes[Math.floor(Math.random() * 4)];
        fluteOsc.frequency.setValueAtTime(fluteFreq, now);

        fluteGain.gain.setValueAtTime(0.001, now);
        fluteGain.gain.linearRampToValueAtTime(0.08, now + 0.3);
        fluteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

        fluteOsc.connect(fluteGain);
        fluteGain.connect(this.ctx.destination);
        fluteOsc.start(now);
        fluteOsc.stop(now + 1.6);
      }

      // Koto Pluck
      const noteFreq = kotoNotes[Math.floor(Math.random() * kotoNotes.length)];
      const kotoOsc = this.ctx.createOscillator();
      const kotoGain = this.ctx.createGain();
      kotoOsc.type = 'triangle';
      kotoOsc.frequency.setValueAtTime(noteFreq, now);

      kotoGain.gain.setValueAtTime(0.18, now);
      kotoGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      kotoOsc.connect(kotoGain);
      kotoGain.connect(this.ctx.destination);
      kotoOsc.start(now);
      kotoOsc.stop(now + 0.85);

      this.lobbyTimer = setTimeout(playLobbyNote, 700 + Math.random() * 600);
    };

    playLobbyNote();
  }

  stopLobbyMusic() {
    this.lobbyMusicPlaying = false;
    if (this.lobbyTimer) {
      clearTimeout(this.lobbyTimer);
      this.lobbyTimer = null;
    }
  }

  // --- PROCEDURAL ORIENTAL BATTLE THEME ---
  startBattleMusic() {
    if (this.musicPlaying || this.isMuted) return;
    this.init();
    this.stopLobbyMusic();
    this.musicPlaying = true;

    const scale = [220, 246.94, 261.63, 329.63, 349.23, 440, 493.88, 523.25];
    let step = 0;

    const playBeat = () => {
      if (!this.musicPlaying || this.isMuted) return;
      step++;

      if (step % 4 === 0) {
        this.playTaikoDrum(true);
      } else if (step % 2 === 0) {
        this.playTaikoDrum(false);
      }

      if (Math.random() > 0.4) {
        const noteFreq = scale[Math.floor(Math.random() * scale.length)];
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(noteFreq, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      }

      this.bgmTimer = setTimeout(playBeat, 230);
    };

    playBeat();
  }

  stopBattleMusic() {
    this.musicPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

const Sound = new SoundEngine();
Sound.SoundEngine = SoundEngine;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Sound;
} else {
  window.Sound = Sound;
}
