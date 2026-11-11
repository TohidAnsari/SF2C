/**
 * Verification Test Suite for Enraged Combat AI & 2.5D Demon Lighting (Task 4)
 * Shadow Fight 2 Web Edition
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('=== Running Task 4: Enraged Combat AI & 2.5D Demon Lighting Tests ===\n');

// 1. Setup Sandbox Environment
const sandbox = {
  console: console,
  Math: Math,
  Date: Date,
  window: {}
};
sandbox.window = sandbox;

// Load config.js
const configCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'config.js'), 'utf8');
vm.runInNewContext(configCode, sandbox);

// Load fighter.js
const fighterCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'fighter.js'), 'utf8');
vm.runInNewContext(fighterCode, sandbox);

// Load ai.js
const aiCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'ai.js'), 'utf8');
vm.runInNewContext(aiCode, sandbox);

// Load skeleton.js
const skeletonCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'skeleton.js'), 'utf8');
vm.runInNewContext(skeletonCode, sandbox);

// Load renderer.js
const rendererCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'renderer.js'), 'utf8');
vm.runInNewContext(rendererCode, sandbox);

// Load three_scene.js
const threeSceneCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'three_scene.js'), 'utf8');
vm.runInNewContext(threeSceneCode, sandbox);

const CONFIG = sandbox.CONFIG;
const Fighter = sandbox.Fighter;
const CombatAI = sandbox.CombatAI;
const Skeleton = sandbox.Skeleton;
const SceneRenderer = sandbox.SceneRenderer;
const ThreeSceneManager = sandbox.ThreeSceneManager;

assert(Fighter, 'Fighter class must be defined');
assert(CombatAI, 'CombatAI class must be defined');
assert(Skeleton, 'Skeleton must be defined');
assert(SceneRenderer, 'SceneRenderer class must be defined');
assert(ThreeSceneManager, 'ThreeSceneManager class must be defined');

// Sound mock
sandbox.Sound = {
  playWhoosh: () => {},
  playShurikenThrow: () => {},
  playBladeSlash: () => {},
  playCriticalHit: () => {},
  playBlockClang: () => {}
};

// ==========================================
// TEST SUITE 1: Direct Move Trigger in Fighter
// ==========================================
console.log('--- Test Suite 1: Direct Move Trigger Support in Fighter ---');

const fighter = new Fighter(200, { name: 'Player' });
assert.strictEqual(fighter.state, 'IDLE');

// Trigger move directly via input.move
fighter.handleIdleState(null, { move: 'LYNX_FRENZY' }, null);
assert.strictEqual(fighter.state, 'ATTACKING', 'Fighter should transition to ATTACKING');
assert.strictEqual(fighter.currentMove.id, 'LYNX_FRENZY', 'currentMove should be LYNX_FRENZY');

// Reset to IDLE
fighter.state = 'IDLE';
fighter.handleIdleState(null, { move: 'LYNX_TRUE_VANISH' }, null);
assert.strictEqual(fighter.state, 'ATTACKING');
assert.strictEqual(fighter.currentMove.id, 'LYNX_TRUE_VANISH');
assert.strictEqual(fighter.isInvisible, true, 'LYNX_TRUE_VANISH sets isInvisible');
assert.strictEqual(fighter.isInvulnerable, true, 'LYNX_TRUE_VANISH sets isInvulnerable');

console.log('  ✓ Direct move trigger in Fighter.handleIdleState verified');

// ==========================================
// TEST SUITE 2: Awakened Combat AI Stats & Reaction
// ==========================================
console.log('\n--- Test Suite 2: Awakened Boss AI Combat Stats & Reaction ---');

const bossFighter = new Fighter(600, {
  name: 'Lynx',
  isBoss: true,
  hp: 180
});

const ai = new CombatAI(bossFighter, { aiAggro: 0.6, aiReaction: 0.55 });
assert.strictEqual(ai.aggro, 0.6);
assert.strictEqual(ai.reaction, 0.55);

const opponent = new Fighter(500, { name: 'Shadow', hp: 100 });

// Before awakening: stats remain default
ai.update(opponent);
assert.strictEqual(ai.aggro, 0.6);
assert.strictEqual(ai.reaction, 0.55);

// Awaken boss
bossFighter.isAwakened = true;
ai.update(opponent);
assert.strictEqual(ai.aggro, 1.0, 'Awakened boss aggro must be 1.0');
assert.strictEqual(ai.reaction, 0.95, 'Awakened boss reaction must be 0.95');
console.log('  ✓ Awakened AI stats overridden (aggro: 1.0, reaction: 0.95)');

// Subtest 2.2: Reactive counter when player is attacking
opponent.state = 'ATTACKING';
opponent.currentMove = { zone: 'mid' };

// Close range (dist < 120), e.g. dist = 80
opponent.x = 520;
bossFighter.x = 600; // dist = 80

// Mock Math.random to simulate high reaction (< 0.95) and frenzy counter (< 0.45)
const originalRandom = Math.random;
try {
  let callCount = 0;
  Math.random = () => {
    callCount++;
    // 1st call is reaction check (< 0.95) -> 0.1
    // 2nd call is frenzy interrupt (< 0.45) -> 0.2
    return 0.1;
  };
  const reactionDecision = ai.update(opponent);
  assert(reactionDecision && reactionDecision.move === 'LYNX_FRENZY', 'Should counter with LYNX_FRENZY at close range');
  console.log('  ✓ Close-range reactive interrupt { move: "LYNX_FRENZY" } verified');

  // Next: close range but frenzy roll fails (>= 0.45) -> fallback to instant guard
  Math.random = () => {
    // 1st call reaction (< 0.95) -> 0.1
    // 2nd call frenzy (< 0.45) -> 0.8
    if (callCount++ % 2 === 0) return 0.1;
    return 0.8;
  };
  const guardDecision = ai.update(opponent);
  assert(guardDecision && guardDecision.back === true, 'Should fallback to instant guard { back: true }');
  console.log('  ✓ Close-range reactive guard { back: true } verified');

  // Next: mid-range attack reaction (dist = 140 >= 120) -> returns instant guard
  opponent.x = 460;
  bossFighter.x = 600; // dist = 140
  Math.random = () => 0.1; // Passes reaction check
  const midRangeDecision = ai.update(opponent);
  assert(midRangeDecision && midRangeDecision.back === true, 'Should guard against mid-range attack');
  console.log('  ✓ Mid-range reactive guard verified');
} finally {
  Math.random = originalRandom;
}

// ==========================================
// TEST SUITE 3: Awakened Tactical Decision Tree
// ==========================================
console.log('\n--- Test Suite 3: Awakened Tactical Decision Tree Moves ---');

// Reset opponent to IDLE
opponent.state = 'IDLE';

// Test Distance > 200: 55% chance of LYNX_TRUE_VANISH
try {
  Math.random = () => 0.2; // < 0.55
  const vanishDecision = ai.makeTacticalDecision(opponent, 240);
  assert(vanishDecision && vanishDecision.move === 'LYNX_TRUE_VANISH', 'Distance > 200 should trigger LYNX_TRUE_VANISH');
  console.log('  ✓ Distance > 200 triggers { move: "LYNX_TRUE_VANISH" }');

  // Test Distance <= 120: 60% chance of LYNX_FRENZY
  Math.random = () => 0.2; // < 0.60
  const frenzyDecision = ai.makeTacticalDecision(opponent, 100);
  assert(frenzyDecision && frenzyDecision.move === 'LYNX_FRENZY', 'Distance <= 120 should trigger LYNX_FRENZY');
  console.log('  ✓ Distance <= 120 triggers { move: "LYNX_FRENZY" }');

  // Test Distance between 120 and 260: 50% chance of LYNX_DEMONIC_CLAWS
  Math.random = () => 0.2; // < 0.50
  const clawsDecision = ai.makeTacticalDecision(opponent, 180);
  assert(clawsDecision && clawsDecision.move === 'LYNX_DEMONIC_CLAWS', 'Distance 120-260 should trigger LYNX_DEMONIC_CLAWS');
  console.log('  ✓ Distance 120-260 triggers { move: "LYNX_DEMONIC_CLAWS" }');

  // Fallback decision when probability checks roll above threshold
  Math.random = () => 0.99;
  const fallbackDecision = ai.makeTacticalDecision(opponent, 240);
  assert(fallbackDecision, 'Fallback decision must be returned');
  assert(fallbackDecision.forward, 'Fallback decision should aggressively push forward');
  console.log('  ✓ High roll fallback generates aggressive martial movement');
} finally {
  Math.random = originalRandom;
}

// ==========================================
// TEST SUITE 4: Dynamic 2.5D Demon Lighting
// ==========================================
console.log('\n--- Test Suite 4: Dynamic 2.5D Demon Lighting in ThreeSceneManager ---');

// Mock PointLight
function MockPointLight(color, intensity, distance) {
  this.color = {
    hex: color,
    setHex: function(h) { this.hex = h; },
    getHex: function() { return this.hex; }
  };
  this.intensity = intensity;
  this.distance = distance;
  this.position = {
    x: 0, y: 0, z: 0,
    set: function(x, y, z) { this.x = x; this.y = y; this.z = z; }
  };
}

const threeScene = new ThreeSceneManager();
threeScene.isSupported = true;
threeScene.currentMode = 'arena';
threeScene.spellLight = new MockPointLight(0xff6600, 0, 18);
threeScene.demonLight = threeScene.spellLight;

const p1 = new Fighter(300, { name: 'Player' });
const p2 = new Fighter(700, { name: 'Lynx', isBoss: true });

// Neither awakened, no spells -> intensity fades
threeScene.spellLight.intensity = 1.0;
threeScene.updateSpellLighting(p1, p2);
assert(threeScene.spellLight.intensity < 1.0, 'Intensity should fade when no awakened boss and no spells');

// Lynx awakens!
p2.isAwakened = true;
threeScene.updateSpellLighting(p1, p2);

assert.strictEqual(threeScene.spellLight.color.getHex(), 0xd63031, 'Spell light must be set to crimson 0xd63031');
assert(threeScene.spellLight.intensity >= 1.9, 'Spell light intensity must pulse above 1.9 for demon aura');
const expectedX = (p2.x - 500) * 0.016;
assert(Math.abs(threeScene.spellLight.position.x - expectedX) < 0.001, 'Spell light position.x should track awakened boss');
assert.strictEqual(threeScene.spellLight.position.y, 1.6, 'Spell light position.y must be 1.6');
assert.strictEqual(threeScene.spellLight.position.z, -1.8, 'Spell light position.z must be -1.8');
console.log('  ✓ Awakened boss sets deep crimson light (0xd63031, pulsing intensity, tracked x)');

// Active spell overrides awakened boss lighting
p1.activeMagicSpells.push({ id: 'FIREBALL', x: 400, y: 350 });
threeScene.updateSpellLighting(p1, p2);
assert.strictEqual(threeScene.spellLight.color.getHex(), 0xff5500, 'Spell FIREBALL should override lighting with 0xff5500');

// Spell finishes -> resumes crimson demon lighting
p1.activeMagicSpells = [];
threeScene.updateSpellLighting(p1, p2);
assert.strictEqual(threeScene.spellLight.color.getHex(), 0xd63031, 'Lighting should restore to awakened boss crimson (0xd63031)');
console.log('  ✓ Spell lighting precedence and fallback to awakened crimson verified');

// ==========================================
// TEST SUITE 5: SceneRenderer drawDemonAura
// ==========================================
console.log('\n--- Test Suite 5: SceneRenderer drawDemonAura VFX ---');

// Mock canvas 2D context
const mockCtx = {
  saveCalls: 0,
  restoreCalls: 0,
  arcs: [],
  curves: [],
  fillCalls: 0,
  strokeCalls: 0,
  shadowColor: '',
  shadowBlur: 0,
  globalAlpha: 1.0,
  fillStyle: '',
  strokeStyle: '',
  save() { this.saveCalls++; },
  restore() { this.restoreCalls++; },
  beginPath() {},
  closePath() {},
  arc(x, y, r, sa, ea) { this.arcs.push({ x, y, r }); },
  moveTo(x, y) {},
  lineTo(x, y) {},
  quadraticCurveTo(cpx, cpy, x, y) { this.curves.push({ cpx, cpy, x, y }); },
  fill() { this.fillCalls++; },
  stroke() { this.strokeCalls++; }
};

const mockCanvas = {
  getContext: (type) => mockCtx,
  width: 1000,
  height: 600
};

const renderer = new SceneRenderer(mockCanvas);
assert.strictEqual(typeof renderer.drawDemonAura, 'function', 'drawDemonAura must be a method on SceneRenderer');

// Safe null check
renderer.drawDemonAura(null);
renderer.drawDemonAura({ isAwakened: false });

// Render demon aura with awakened fighter
p2.vx = 2.0; // Moving -> tests eye trail as well
renderer.drawDemonAura(p2, mockCtx);

assert(mockCtx.saveCalls >= 1, 'Context save should be called');
assert(mockCtx.restoreCalls >= 1, 'Context restore should be called');
assert(mockCtx.arcs.length >= 8, 'Should render 8+ rising demonic flame ember particles');
assert(mockCtx.curves.length >= 4, 'Should render flame tongues and eye streaks');
assert.strictEqual(mockCtx.shadowColor, '#d63031', 'Shadow color should be #d63031');
console.log('  ✓ drawDemonAura executed safely with embers, flame tongues, and eye trails');

// ==========================================
// TEST SUITE 6: Skeleton True Vanish Invisibility & Crimson Eyes
// ==========================================
console.log('\n--- Test Suite 6: Skeleton True Vanish Invisibility ---');

assert.strictEqual(typeof Skeleton.drawHeadAndFace, 'function', 'Skeleton.drawHeadAndFace must be defined');

const vanishBoss = new Fighter(500, {
  name: 'Lynx',
  isBoss: true,
  visuals: {
    eyeColor: '#ff1744',
    eyeTrailColor: 'rgba(255, 23, 68, 0.6)'
  }
});
vanishBoss.isInvisible = true;
vanishBoss.currentMove = { id: 'LYNX_TRUE_VANISH', duration: 110, hitStart: 30, hitEnd: 70 };

const skelCtx = {
  globalAlpha: 1.0,
  alphaHistory: [],
  save() {},
  restore() {},
  translate() {},
  scale() {},
  rotate() {},
  beginPath() {},
  closePath() {},
  moveTo() {},
  lineTo() {},
  quadraticCurveTo() {},
  bezierCurveTo() {},
  arc() {},
  ellipse() {},
  fill() {},
  stroke() {}
};

Object.defineProperty(skelCtx, 'globalAlpha', {
  get() { return this._alpha !== undefined ? this._alpha : 1.0; },
  set(val) {
    this._alpha = val;
    this.alphaHistory.push(val);
  }
});

Skeleton.draw(skelCtx, vanishBoss);

assert(skelCtx.alphaHistory.includes(0.05), 'Body silhouette should receive globalAlpha = 0.05 during True Vanish');
assert(skelCtx.alphaHistory.includes(1.0), 'Head and crimson eyes should restore globalAlpha = 1.0');
console.log('  ✓ Skeleton True Vanish renders ghost silhouette (0.05) with radiant crimson eyes (1.0)');

console.log('\n======================================================');
console.log('🎉 ALL TASK 4 ENRAGED COMBAT AI & 2.5D LIGHTING TESTS PASSED!');
console.log('======================================================');
