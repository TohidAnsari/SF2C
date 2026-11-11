/**
 * Unit & Integration Test for Narrative Data Models and Procedural Audio Synthesizers
 * Shadow Fight 2 Web Edition - Boss Awakening Cinematics (Task 1)
 */

const assert = require('assert');
const CONFIG = require('../js/config.js');
const Sound = require('../js/audio.js');

console.log('=== Running Task 1: Narrative Data Models & Procedural Audio Tests ===\n');

// ==========================================
// TEST SUITE 1: CONFIG.DIALOGUES Data Models
// ==========================================
console.log('--- Test Suite 1: CONFIG.DIALOGUES ---');

assert(CONFIG.DIALOGUES, 'CONFIG.DIALOGUES must be defined');

// 1.1 DISCIPLES Dialogue
const disciples = CONFIG.DIALOGUES.DISCIPLES;
assert(disciples, 'CONFIG.DIALOGUES.DISCIPLES must be defined');

const expectedDisciples = {
  shin: {
    speaker: 'SHIN',
    title: 'DISCIPLE',
    text: 'I have trained under the Master for three winters. Let us test your shadow arts!'
  },
  ken: {
    speaker: 'KEN',
    title: 'MONK',
    text: 'Steel speaks swifter than words, traveler. Defend yourself!'
  },
  brick: {
    speaker: 'BRICK',
    title: 'ENFORCER',
    text: 'Your bones will splinter against my fists like brittle bamboo!'
  },
  needle: {
    speaker: 'NEEDLE',
    title: 'ASSASSIN',
    text: 'Blink, and you will find steel through your throat.'
  },
  ghost: {
    speaker: 'GHOST',
    title: 'CURSED RONIN',
    text: 'The chain of the reaper never returns empty, stranger.'
  }
};

for (const [id, expected] of Object.entries(expectedDisciples)) {
  assert(disciples[id], `Disciple dialogue for '${id}' must exist`);
  assert.strictEqual(disciples[id].speaker, expected.speaker, `Disciple '${id}' speaker mismatch`);
  assert.strictEqual(disciples[id].title, expected.title, `Disciple '${id}' title mismatch`);
  assert.strictEqual(disciples[id].text, expected.text, `Disciple '${id}' text mismatch`);
  console.log(`  ✓ Disciple dialogue '${id}' verified`);
}

// 1.2 LYNX_PRE_FIGHT Dialogue
const preFight = CONFIG.DIALOGUES.LYNX_PRE_FIGHT;
assert(Array.isArray(preFight), 'CONFIG.DIALOGUES.LYNX_PRE_FIGHT must be an array');
assert.strictEqual(preFight.length, 3, 'LYNX_PRE_FIGHT must have exactly 3 dialogue frames');

assert.deepStrictEqual(preFight[0], {
  speaker: 'SENSEI',
  title: '師父 SENSEI',
  side: 'left',
  portrait: 'sensei',
  text: 'Shadow, steel your mind. Lynx is no ordinary martial artist—he commands the demonic powers of the Shadows!'
}, 'LYNX_PRE_FIGHT Frame 0 mismatch');
console.log('  ✓ LYNX_PRE_FIGHT Frame 0 (Sensei) verified');

assert.deepStrictEqual(preFight[1], {
  speaker: 'LYNX',
  title: '山猫 LYNX',
  side: 'right',
  portrait: 'lynx',
  text: 'Hahaha! A wandering silhouette without a face dares challenge the Master of the Claws? Let us see how brightly your blood burns upon my steel!'
}, 'LYNX_PRE_FIGHT Frame 1 mismatch');
console.log('  ✓ LYNX_PRE_FIGHT Frame 1 (Lynx) verified');

assert.deepStrictEqual(preFight[2], {
  speaker: 'SHADOW',
  title: '影 SHADOW',
  side: 'left',
  portrait: 'shadow',
  text: '...'
}, 'LYNX_PRE_FIGHT Frame 2 mismatch');
console.log('  ✓ LYNX_PRE_FIGHT Frame 2 (Shadow) verified');

// 1.3 LYNX_AWAKENING Dialogue
const awakening = CONFIG.DIALOGUES.LYNX_AWAKENING;
assert(Array.isArray(awakening), 'CONFIG.DIALOGUES.LYNX_AWAKENING must be an array');
assert.strictEqual(awakening.length, 1, 'LYNX_AWAKENING must have 1 dialogue frame');

assert.deepStrictEqual(awakening[0], {
  speaker: 'LYNX',
  title: '山猫 DEMON LYNX',
  side: 'right',
  portrait: 'lynx_demon',
  text: 'Insolent worm! You thought you had pushed me to the brink?! Behold the true curse of the Demon Order!'
}, 'LYNX_AWAKENING Frame 0 mismatch');
console.log('  ✓ LYNX_AWAKENING Frame 0 (Demon Lynx) verified');

// 1.4 LYNX_VICTORY Dialogue
const victory = CONFIG.DIALOGUES.LYNX_VICTORY;
assert(Array.isArray(victory), 'CONFIG.DIALOGUES.LYNX_VICTORY must be an array');
assert.strictEqual(victory.length, 2, 'LYNX_VICTORY must have 2 dialogue frames');

assert.deepStrictEqual(victory[0], {
  speaker: 'LYNX',
  title: '山猫 LYNX',
  side: 'right',
  portrait: 'lynx_defeated',
  text: 'Impossible... my claws... shattered by a mere mortal shadow... Take the Seal, fool... but the Gates will consume you!'
}, 'LYNX_VICTORY Frame 0 mismatch');
console.log('  ✓ LYNX_VICTORY Frame 0 (Lynx Defeated) verified');

assert.deepStrictEqual(victory[1], {
  speaker: 'SENSEI',
  title: '師父 SENSEI',
  side: 'left',
  portrait: 'sensei',
  text: 'Well fought, Shadow! The first demon of the Order has fallen, and the Seal of the Lynx is in our grasp. The Gates of Shadows await!'
}, 'LYNX_VICTORY Frame 1 mismatch');
console.log('  ✓ LYNX_VICTORY Frame 1 (Sensei Victory) verified');

// ==========================================
// TEST SUITE 2: CONFIG.MOVES Boss Abilities
// ==========================================
console.log('\n--- Test Suite 2: CONFIG.MOVES Boss Abilities ---');

const expectedMoves = {
  LYNX_FRENZY: {
    id: 'LYNX_FRENZY',
    name: 'Demonic Claw Frenzy',
    type: 'punch',
    duration: 42,
    hitStart: 6,
    hitEnd: 36,
    reach: 82,
    heightOffset: -60,
    damageMultiplier: 2.2,
    zone: 'torso',
    step: 2.4,
    knockback: 8.5,
    hitstun: 26,
    isAwakenedOnly: true
  },
  LYNX_TRUE_VANISH: {
    id: 'LYNX_TRUE_VANISH',
    name: 'True Shadow Vanish',
    type: 'special',
    duration: 110,
    hitStart: 85,
    hitEnd: 105,
    reach: 90,
    heightOffset: -70,
    damageMultiplier: 2.4,
    zone: 'head',
    step: 0,
    knockback: 9.0,
    hitstun: 28,
    isAwakenedOnly: true
  },
  LYNX_DEMONIC_CLAWS: {
    id: 'LYNX_DEMONIC_CLAWS',
    name: 'Demonic Floor Claws',
    type: 'special',
    duration: 45,
    hitStart: 12,
    hitEnd: 32,
    reach: 250,
    heightOffset: -30,
    damageMultiplier: 2.0,
    zone: 'legs',
    step: 0,
    knockback: 6.0,
    hitstun: 25,
    isAwakenedOnly: true
  }
};

for (const [id, expected] of Object.entries(expectedMoves)) {
  assert(CONFIG.MOVES[id], `CONFIG.MOVES.${id} must be defined`);
  assert.deepStrictEqual(CONFIG.MOVES[id], expected, `CONFIG.MOVES.${id} property mismatch`);
  console.log(`  ✓ Move '${id}' verified (${expected.name})`);
}

// ==========================================
// TEST SUITE 3: Procedural Audio Synthesizers
// ==========================================
console.log('\n--- Test Suite 3: Procedural Audio Synthesizers ---');

// 3.1 Existence check
assert(typeof Sound.playBossRoar === 'function', 'Sound.playBossRoar must be a function');
assert(typeof Sound.playDemonicThunder === 'function', 'Sound.playDemonicThunder must be a function');
assert(typeof Sound.playDialogueChime === 'function', 'Sound.playDialogueChime must be a function');
assert(typeof Sound.playSealAcquired === 'function', 'Sound.playSealAcquired must be a function');
console.log('  ✓ All 4 procedural audio methods exist on SoundEngine');

// 3.2 Graceful null AudioContext handling
console.log('\n  Subtest 3.2: Graceful null/uninitialized AudioContext handling:');
Sound.ctx = null;
Sound.isMuted = false;

// Calling when ctx is null must not throw
assert.doesNotThrow(() => Sound.playBossRoar(), 'playBossRoar should not throw when ctx is null');
assert.doesNotThrow(() => Sound.playDemonicThunder(), 'playDemonicThunder should not throw when ctx is null');
assert.doesNotThrow(() => Sound.playDialogueChime(), 'playDialogueChime should not throw when ctx is null');
assert.doesNotThrow(() => Sound.playSealAcquired(), 'playSealAcquired should not throw when ctx is null');
console.log('  ✓ All 4 methods safely handle null AudioContext');

// Calling when isMuted = true
Sound.isMuted = true;
assert.doesNotThrow(() => Sound.playBossRoar(), 'playBossRoar should not throw when muted');
assert.doesNotThrow(() => Sound.playDemonicThunder(), 'playDemonicThunder should not throw when muted');
assert.doesNotThrow(() => Sound.playDialogueChime(), 'playDialogueChime should not throw when muted');
assert.doesNotThrow(() => Sound.playSealAcquired(), 'playSealAcquired should not throw when muted');
console.log('  ✓ All 4 methods safely handle muted state');

// 3.3 Mock AudioContext Execution & Parameter Verification
console.log('\n  Subtest 3.3: Mock AudioContext synthesis execution:');

function createMockAudioContext() {
  const events = {
    oscillators: [],
    gains: [],
    filters: [],
    buffers: [],
    bufferSources: [],
    connections: []
  };

  class MockAudioParam {
    constructor(val = 0) {
      this.value = val;
      this.history = [];
    }
    setValueAtTime(val, time) {
      this.history.push({ op: 'set', val, time });
    }
    linearRampToValueAtTime(val, time) {
      this.history.push({ op: 'linear', val, time });
    }
    exponentialRampToValueAtTime(val, time) {
      this.history.push({ op: 'exp', val, time });
    }
  }

  class MockNode {
    connect(target) {
      events.connections.push({ from: this, to: target });
      return target;
    }
  }

  class MockOscillator extends MockNode {
    constructor() {
      super();
      this.type = 'sine';
      this.frequency = new MockAudioParam(440);
      this.started = false;
      this.stopped = false;
      events.oscillators.push(this);
    }
    start(time) { this.started = true; this.startTime = time; }
    stop(time) { this.stopped = true; this.stopTime = time; }
  }

  class MockGain extends MockNode {
    constructor() {
      super();
      this.gain = new MockAudioParam(1.0);
      events.gains.push(this);
    }
  }

  class MockBiquadFilter extends MockNode {
    constructor() {
      super();
      this.type = 'lowpass';
      this.frequency = new MockAudioParam(350);
      this.Q = new MockAudioParam(1);
      events.filters.push(this);
    }
  }

  class MockBufferSource extends MockNode {
    constructor() {
      super();
      this.buffer = null;
      this.started = false;
      events.bufferSources.push(this);
    }
    start(time) { this.started = true; this.startTime = time; }
  }

  return {
    sampleRate: 44100,
    currentTime: 10.0,
    state: 'running',
    destination: new MockNode(),
    createOscillator: () => new MockOscillator(),
    createGain: () => new MockGain(),
    createBiquadFilter: () => new MockBiquadFilter(),
    createBufferSource: () => new MockBufferSource(),
    createBuffer: (channels, length, sampleRate) => {
      const channelData = [new Float32Array(length)];
      const buf = {
        numberOfChannels: channels,
        length,
        sampleRate,
        getChannelData: (c) => channelData[c]
      };
      events.buffers.push(buf);
      return buf;
    },
    resume: () => {},
    _events: events
  };
}

// Test playBossRoar with mock
{
  const mockCtx = createMockAudioContext();
  Sound.ctx = mockCtx;
  Sound.isMuted = false;

  Sound.playBossRoar();

  const oscs = mockCtx._events.oscillators;
  const filters = mockCtx._events.filters;
  const gains = mockCtx._events.gains;

  assert(oscs.length >= 3, `playBossRoar must spawn at least 3 oscillators (dual carrier + LFO), found: ${oscs.length}`);
  const sawOsc = oscs.find(o => o.type === 'sawtooth');
  const triOsc = oscs.find(o => o.type === 'triangle');
  const lfoOsc = oscs.find(o => o.type === 'sine');
  assert(sawOsc, 'playBossRoar must include sawtooth carrier oscillator');
  assert(triOsc, 'playBossRoar must include triangle sub-bass oscillator');
  assert(lfoOsc, 'playBossRoar must include sine LFO oscillator for FM modulation');

  assert(filters.length >= 1, 'playBossRoar must include a resonant low-pass filter');
  assert.strictEqual(filters[0].type, 'lowpass');
  assert(filters[0].frequency.history.length >= 3, 'playBossRoar filter frequency must sweep dynamically');

  assert(oscs.every(o => o.started && o.stopped), 'All roar oscillators must be started and scheduled to stop');
  console.log('  ✓ playBossRoar() synthesized dual-oscillator FM growl with low-pass sweep');
}

// Test playDemonicThunder with mock
{
  const mockCtx = createMockAudioContext();
  Sound.ctx = mockCtx;
  Sound.isMuted = false;

  Sound.playDemonicThunder();

  const buffers = mockCtx._events.buffers;
  const bufferSources = mockCtx._events.bufferSources;
  const oscs = mockCtx._events.oscillators;
  const filters = mockCtx._events.filters;

  assert(buffers.length >= 1, 'playDemonicThunder must create a white-noise buffer');
  assert(bufferSources.length >= 1, 'playDemonicThunder must create a buffer source');
  assert(bufferSources[0].started, 'Thunder noise source must be started');

  assert(filters.length >= 1, 'playDemonicThunder must use low-pass filter on noise burst');
  assert.strictEqual(filters[0].type, 'lowpass');

  const boomOsc = oscs.find(o => o.type === 'sine');
  assert(boomOsc, 'playDemonicThunder must include a sine sub-bass boom oscillator');
  assert(boomOsc.started && boomOsc.stopped, 'Sub-bass boom oscillator must start and stop');

  console.log('  ✓ playDemonicThunder() synthesized noise burst with bass boom');
}

// Test playDialogueChime with mock
{
  const mockCtx = createMockAudioContext();
  Sound.ctx = mockCtx;
  Sound.isMuted = false;

  Sound.playDialogueChime();

  const oscs = mockCtx._events.oscillators;
  const filters = mockCtx._events.filters;
  const gains = mockCtx._events.gains;

  assert(oscs.length >= 1, 'playDialogueChime must create bamboo tap oscillator');
  assert.strictEqual(oscs[0].type, 'triangle', 'Bamboo tap oscillator should be triangle wave');
  assert(oscs[0].started && oscs[0].stopped, 'Bamboo tap oscillator must start and stop');

  assert(filters.length >= 1, 'playDialogueChime must have bandpass filter for hollow bamboo overtone');
  assert.strictEqual(filters[0].type, 'bandpass', 'Filter should be bandpass');

  console.log('  ✓ playDialogueChime() synthesized resonant bamboo percussion tap');
}

// Test playSealAcquired with mock
{
  const mockCtx = createMockAudioContext();
  Sound.ctx = mockCtx;
  Sound.isMuted = false;

  Sound.playSealAcquired();

  const oscs = mockCtx._events.oscillators;
  const gains = mockCtx._events.gains;

  assert(oscs.length >= 9, `playSealAcquired must create multi-tone harmonious chord (expected >= 9 oscillators, got ${oscs.length})`);
  assert(oscs.every(o => o.started && o.stopped), 'All celestial chord oscillators must start and stop');

  // Verify sub-bass gong layer
  const subOsc = oscs.find(o => o.frequency.history[0]?.val < 80);
  assert(subOsc, 'playSealAcquired must include deep sub-bass gong fundamental strike');

  console.log(`  ✓ playSealAcquired() synthesized harmonious celestial gong with ${oscs.length} harmonic voices`);
}

console.log('\n======================================================');
console.log(' ALL NARRATIVE & AUDIO SYNTHESIZER TESTS PASSED (100%)');
console.log('======================================================');
process.exit(0);

