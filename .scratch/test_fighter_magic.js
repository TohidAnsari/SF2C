const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// 1. Mock browser environment
const sandbox = {
  console: console,
  Math: Math,
  window: {}
};
sandbox.window = sandbox;

// Load config.js
const configCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'config.js'), 'utf8');
vm.runInNewContext(configCode, sandbox);

// Load fighter.js
const fighterCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'fighter.js'), 'utf8');
vm.runInNewContext(fighterCode, sandbox);

const Fighter = sandbox.Fighter;

console.log('Testing Fighter Magic System...');

// Sound mock
let soundsPlayed = [];
sandbox.Sound = {
  playSpellReady: () => soundsPlayed.push('SPELL_READY'),
  playFireballIgnite: () => soundsPlayed.push('FIREBALL_IGNITE'),
  playDarkEruption: () => soundsPlayed.push('DARK_ERUPTION'),
  playSmokeTeleport: () => soundsPlayed.push('SMOKE_TELEPORT'),
  playCriticalHit: () => soundsPlayed.push('CRITICAL'),
  playBladeSlash: () => soundsPlayed.push('SLASH'),
  playBlockClang: () => soundsPlayed.push('BLOCK'),
  playFistHit: () => soundsPlayed.push('HIT'),
  playWhoosh: () => soundsPlayed.push('WHOOSH'),
};

// SceneRenderer mock
let fxSpawned = [];
const mockScene = {
  spawnSparks: (x, y, count, color) => fxSpawned.push({ type: 'sparks', color }),
  spawnShockwave: (x, y, r, color) => fxSpawned.push({ type: 'shockwave', color }),
  triggerScreenFlash: (color) => fxSpawned.push({ type: 'flash', color }),
  addTrauma: (amt) => fxSpawned.push({ type: 'trauma', amt }),
  spawnInkSplatter: () => fxSpawned.push({ type: 'ink' }),
  spawnRadialSpeedLines: () => fxSpawned.push({ type: 'speedlines' })
};

// Test 1: Initialization & addMagic
const p1 = new Fighter(200, { name: 'P1', amulet: 'FLAME_AMULET' });
const p2 = new Fighter(600, { name: 'P2', amulet: 'DARK_AMULET' });

assert.strictEqual(p1.magicMeter, 0.0, 'Magic meter should start at 0');
assert.strictEqual(p1.canCastMagic(), false, 'Cannot cast magic at 0 meter');

p1.addMagic(50);
assert.strictEqual(p1.magicMeter, 50, 'Meter should be 50');
assert.strictEqual(p1.canCastMagic(), false, 'Cannot cast magic at 50 meter');

p1.addMagic(60);
assert.strictEqual(p1.magicMeter, 100, 'Meter clamps to 100 max');
assert.strictEqual(p1.canCastMagic(), true, 'Can cast magic at 100 meter');
assert.ok(soundsPlayed.includes('SPELL_READY'), 'SPELL_READY sound was played');

// Test 2: Fireball Cast & Projectile Physics
soundsPlayed = [];
fxSpawned = [];
const castResult = p1.castMagic(p2, mockScene);
assert.strictEqual(castResult, true, 'Cast succeeded');
assert.strictEqual(p1.magicMeter, 0, 'Meter deducted on cast');
assert.strictEqual(p1.activeMagicSpells.length, 1, 'Fireball spell spawned');
assert.strictEqual(p1.activeMagicSpells[0].id, 'FIREBALL', 'Spell is FIREBALL');
assert.ok(soundsPlayed.includes('FIREBALL_IGNITE'), 'FIREBALL_IGNITE sound was played');

// Advance fireball toward p2
const fb = p1.activeMagicSpells[0];
const initialX = fb.x;
// Fast forward frames until hit
let hitOccurred = false;
for (let f = 0; f < 30; f++) {
  p1.updateMagicSpells(p2, mockScene);
  if (p1.activeMagicSpells.length === 0) {
    hitOccurred = true;
    break;
  }
}
assert.ok(hitOccurred, 'Fireball hit target');
assert.strictEqual(p2.isBurning, true, 'Target is burning from Fireball');
assert.ok(p2.hp < 100, 'Target took damage from Fireball');

// Test 3: Burning DoT Tick
const hpBeforeBurn = p2.hp;
// Simulate 60 frames to trigger burn tick
for (let f = 0; f < 60; f++) {
  p2.update(p1, null, mockScene);
}
assert.strictEqual(p2.hp, hpBeforeBurn - 4, 'Target took 4 DoT chip damage on 60th frame');

// Test 4: Dark Eruption Cast & Airborne Juggle
p2.hp = 100;
p2.magicMeter = 100;
assert.strictEqual(p2.amulet, 'DARK_AMULET');
p2.castMagic(p1, mockScene);
assert.strictEqual(p2.activeMagicSpells.length, 1);
assert.strictEqual(p2.activeMagicSpells[0].id, 'DARK_ERUPTION');

// Eruption has delay of 14 frames, then erupts and hits p1
for (let f = 0; f < 20; f++) {
  p2.updateMagicSpells(p1, mockScene);
}
assert.strictEqual(p1.vy, -14.0, 'P1 was launched into air with vy = -14.0');

// Test 5: Smoke Teleport Invulnerability & Repositioning
const p3 = new Fighter(200, { amulet: 'WIND_TALISMAN' });
const p4 = new Fighter(500, { facing: 1 });
p3.magicMeter = 100;
p3.castMagic(p4, mockScene);
assert.strictEqual(p3.isInvulnerable, true, 'P3 gained invulnerability upon smoke teleport');
assert.strictEqual(p3.activeMagicSpells[0].id, 'SMOKE_TELEPORT');

// After 8 frames, repositioned behind p4
for (let f = 0; f < 9; f++) {
  p3.updateMagicSpells(p4, mockScene);
}
assert.strictEqual(p3.x, 500 - 70 * 1, 'P3 repositioned 70px behind P4');

// After frame 14, ambush strike delivered
for (let f = 9; f < 15; f++) {
  p3.updateMagicSpells(p4, mockScene);
}
assert.ok(p4.hp < 100, 'P4 took ambush strike damage');

// After frame 22, spell finishes and invulnerability cleared
for (let f = 15; f < 25; f++) {
  p3.updateMagicSpells(p4, mockScene);
}
assert.strictEqual(p3.isInvulnerable, false, 'Invulnerability restored to false after teleport finishes');
assert.strictEqual(p3.activeMagicSpells.length, 0, 'Teleport spell completed and removed');

console.log('✅ ALL FIGHTER MAGIC SYSTEM TESTS PASSED PERFECTLY!');

