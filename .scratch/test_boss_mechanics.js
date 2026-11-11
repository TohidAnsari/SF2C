/**
 * Verification Test Suite for Lynx Boss Awakening & Combat Mechanics (Task 3)
 * Shadow Fight 2 Web Edition
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('=== Running Task 3: Lynx Multi-Phase Boss Mechanics Tests ===\n');

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

const CONFIG = sandbox.CONFIG;
const Fighter = sandbox.Fighter;

assert(Fighter, 'Fighter class must be defined');

// Sound mock
let soundsPlayed = [];
sandbox.Sound = {
  playBossRoar: () => soundsPlayed.push('BOSS_ROAR'),
  playDemonicThunder: () => soundsPlayed.push('DEMONIC_THUNDER'),
  playCriticalHit: () => soundsPlayed.push('CRITICAL'),
  playBladeSlash: () => soundsPlayed.push('SLASH'),
  playBlockClang: () => soundsPlayed.push('BLOCK'),
  playFistHit: () => soundsPlayed.push('HIT'),
  playWhoosh: (p, d) => soundsPlayed.push(`WHOOSH_${p}`)
};

// SceneRenderer mock
let sceneEvents = [];
const mockScene = {
  spawnSparks: (x, y, count, color) => sceneEvents.push({ type: 'sparks', x, y, count, color }),
  spawnShockwave: (x, y, r, color, w) => sceneEvents.push({ type: 'shockwave', x, y, r, color, w }),
  triggerScreenFlash: (color, dur) => sceneEvents.push({ type: 'flash', color, dur }),
  addTrauma: (amt) => sceneEvents.push({ type: 'trauma', amt }),
  spawnInkSplatter: (x, y, count, dir, scale) => sceneEvents.push({ type: 'ink', x, y, count, dir, scale }),
  spawnRadialSpeedLines: (x, y, count) => sceneEvents.push({ type: 'speedlines', x, y, count })
};

// Game mock
let awakeningTriggeredWith = null;
let combatTexts = [];
sandbox.Game = {
  triggerBossAwakening: (fighter) => {
    awakeningTriggeredWith = fighter;
  },
  spawnFloatingCombatText: (x, y, text, color) => {
    combatTexts.push({ x, y, text, color });
  }
};

// ==========================================
// TEST SUITE 1: Fighter Instantiation & Properties
// ==========================================
console.log('--- Test Suite 1: Fighter Instantiation & Boss Properties ---');

const boss = new Fighter(700, {
  name: 'Lynx',
  hp: 180,
  isBoss: true,
  weapon: 'LYNX_CLAWS',
  armor: 'SHADOW_ARMOR',
  helm: 'WARRIOR_HELM',
  visuals: {
    auraGlow: 'rgba(231, 76, 60, 0.85)'
  }
});

assert.strictEqual(boss.isBoss, true, 'boss.isBoss must be true');
assert.strictEqual(boss.bossPhase, 1, 'boss.bossPhase must initialize to 1');
assert.strictEqual(boss.hasAwakened, false, 'boss.hasAwakened must initialize to false');
assert.strictEqual(boss.isAwakened, false, 'boss.isAwakened must initialize to false');
assert.strictEqual(boss.isInvisible, false, 'boss.isInvisible must default to false');
assert.strictEqual(boss.isInvulnerable, false, 'boss.isInvulnerable must default to false');
assert.strictEqual(boss.hp, 180, 'boss.hp must initialize to 180');
assert.strictEqual(boss.maxHp, 180, 'boss.maxHp must initialize to 180');

const regular = new Fighter(200, { name: 'Shadow', hp: 100 });
assert.strictEqual(regular.isBoss, false, 'regular fighter isBoss must default to false');
assert.strictEqual(regular.bossPhase, 1, 'regular fighter bossPhase must be 1');
assert.strictEqual(regular.hasAwakened, false, 'regular fighter hasAwakened must be false');

console.log('✔ Instantiation and initial boss properties verified.');

// ==========================================
// TEST SUITE 2: resetForNewRound()
// ==========================================
console.log('--- Test Suite 2: resetForNewRound() ---');

boss.bossPhase = 2;
boss.hasAwakened = true;
boss.isAwakened = true;
boss.isInvulnerable = true;
boss.isInvisible = true;
boss.hp = 40;

boss.resetForNewRound(700, -1);

assert.strictEqual(boss.bossPhase, 1, 'bossPhase reset to 1');
assert.strictEqual(boss.hasAwakened, false, 'hasAwakened reset to false');
assert.strictEqual(boss.isAwakened, false, 'isAwakened reset to false');
assert.strictEqual(boss.isInvulnerable, false, 'isInvulnerable reset to false');
assert.strictEqual(boss.isInvisible, false, 'isInvisible reset to false');
assert.strictEqual(boss.hp, 180, 'hp reset to maxHp');
assert.strictEqual(boss.facing, -1, 'facing reset to -1');

console.log('✔ resetForNewRound() correctly resets boss state.');

// ==========================================
// TEST SUITE 3: 50% HP Threshold Trigger in takeHit()
// ==========================================
console.log('--- Test Suite 3: 50% HP Awakening Threshold Trigger ---');

awakeningTriggeredWith = null;
const attacker = new Fighter(200, { weapon: 'KATANA', facing: 1 });

// Initial HP: 180. 50% is 90.
// Let's damage boss to 120 (above 50%)
boss.hp = 120;
const lightHit = { damageMultiplier: 1.0, zone: 'torso' };
boss.takeHit(attacker, lightHit, mockScene, boss.x, boss.y - 50);

assert.strictEqual(boss.hasAwakened, false, 'Boss must not awaken when HP > 50%');
assert.strictEqual(awakeningTriggeredWith, null, 'Game.triggerBossAwakening must not be called yet');

// Now drop HP to 95 and take a hit that drops HP to <= 90
boss.hp = 95;
boss.takeHit(attacker, lightHit, mockScene, boss.x, boss.y - 50);

assert(boss.hp <= 90, `Boss HP should be <= 90 (current: ${boss.hp})`);
assert.strictEqual(boss.hasAwakened, true, 'hasAwakened must be true after reaching <= 50% HP');
assert.strictEqual(awakeningTriggeredWith, boss, 'Game.triggerBossAwakening must be called with boss instance');

// Subsequent hit should NOT re-trigger triggerBossAwakening
awakeningTriggeredWith = null;
boss.takeHit(attacker, lightHit, mockScene, boss.x, boss.y - 50);
assert.strictEqual(awakeningTriggeredWith, null, 'Game.triggerBossAwakening must not be called again once hasAwakened is true');

// Verify lethal hit does not trigger awakening when starting from 0 HP
const bossDead = new Fighter(700, { hp: 100, isBoss: true });
awakeningTriggeredWith = null;
bossDead.hp = 5;
const heavyHit = { damageMultiplier: 10.0, zone: 'head' };
bossDead.takeHit(attacker, heavyHit, mockScene, bossDead.x, bossDead.y - 50);
assert.strictEqual(bossDead.hp, 0, 'Boss died from heavy hit');
assert.strictEqual(bossDead.hasAwakened, false, 'Dead boss must not awaken on lethal blow');

console.log('✔ 50% HP threshold correctly triggers awakening exactly once.');

// ==========================================
// TEST SUITE 4: activateDemonAwakening()
// ==========================================
console.log('--- Test Suite 4: activateDemonAwakening() ---');

soundsPlayed = [];
boss.hp = 80;
boss.activateDemonAwakening();

assert.strictEqual(boss.isAwakened, true, 'boss.isAwakened must be true');
assert.strictEqual(boss.bossPhase, 2, 'boss.bossPhase must be 2');
assert.strictEqual(boss.visuals.auraGlow, 'rgba(231, 76, 60, 0.95)', 'Aura glow must become crimson 0.95');
assert.strictEqual(boss.hp, 105, 'HP must increase by +25 (80 + 25 = 105)');
assert(soundsPlayed.includes('BOSS_ROAR'), 'playBossRoar must be called');
assert(soundsPlayed.includes('DEMONIC_THUNDER'), 'playDemonicThunder must be called');

// Test HP capping at maxHp
boss.hp = 175;
boss.activateDemonAwakening();
assert.strictEqual(boss.hp, 180, 'HP must be capped at maxHp (180)');

console.log('✔ activateDemonAwakening() sets phase 2, aura glow, bonus health, and audio cues.');

// ==========================================
// TEST SUITE 5: Awakened Move - LYNX_TRUE_VANISH & Invulnerability
// ==========================================
console.log('--- Test Suite 5: LYNX_TRUE_VANISH & Invulnerability ---');

boss.resetForNewRound(700, -1);
boss.activateDemonAwakening();
const player = new Fighter(300, { hp: 100, facing: 1 });

boss.triggerMove('LYNX_TRUE_VANISH');
assert.strictEqual(boss.state, 'ATTACKING', 'Boss enters ATTACKING state');
assert.strictEqual(boss.isInvisible, true, 'Boss becomes invisible on vanish start');
assert.strictEqual(boss.isInvulnerable, true, 'Boss becomes invulnerable on vanish start');

// Invulnerability prevents all incoming damage
const initialHp = boss.hp;
const hitResult = boss.takeHit(player, { damageMultiplier: 2.0, zone: 'torso' }, mockScene, boss.x, boss.y - 50);
assert.strictEqual(hitResult, false, 'takeHit must return false when invulnerable');
assert.strictEqual(boss.hp, initialHp, 'Boss HP must not change when hit during invulnerability');

// Advance through frames 1 to 65
for (let f = 1; f <= 65; f++) {
  boss.handleAttackingState(player, mockScene);
  assert.strictEqual(boss.isInvisible, true, `Frame ${f}: isInvisible must remain true`);
  assert.strictEqual(boss.isInvulnerable, true, `Frame ${f}: isInvulnerable must remain true`);
}

// Frame 66: Teleport directly above opponent
boss.handleAttackingState(player, mockScene);
assert.strictEqual(boss.isInvisible, false, 'Frame 66: isInvisible must become false');
assert.strictEqual(boss.isInvulnerable, true, 'Frame 66: isInvulnerable remains true during aerial dive');
assert.strictEqual(boss.x, player.x - 30 * player.facing, 'Frame 66: Boss repositions above opponent x');
assert.strictEqual(boss.y, player.y - 140, 'Frame 66: Boss repositions at y - 140');
assert.strictEqual(boss.vy, 18.0, 'Frame 66: vy set to 18.0 for downward dive');

// Advance through frames 67 to 84
for (let f = 67; f <= 84; f++) {
  boss.handleAttackingState(player, mockScene);
}

// Frame 85: Dive-kick impact check
sceneEvents = [];
const playerHpBeforeDive = player.hp;
boss.handleAttackingState(player, mockScene);

assert(player.hp < playerHpBeforeDive, 'Player takes dive kick damage at frame 85');
const shockwaves = sceneEvents.filter(e => e.type === 'shockwave');
assert(shockwaves.length > 0, 'Shockwave spawned at frame 85 dive-kick impact');

// Advance through frames 86 to 104
for (let f = 86; f <= 104; f++) {
  boss.handleAttackingState(player, mockScene);
}

// Frame 105: Lands and clears invulnerability
boss.handleAttackingState(player, mockScene);
assert.strictEqual(boss.isInvulnerable, false, 'Frame 105: isInvulnerable cleared');
assert.strictEqual(boss.isInvisible, false, 'Frame 105: isInvisible is false');
assert.strictEqual(boss.y, CONFIG.GROUND_Y, 'Frame 105: Boss landed on ground');

console.log('✔ LYNX_TRUE_VANISH frames, teleportation, dive damage, and invulnerability verified.');

// ==========================================
// TEST SUITE 6: Awakened Move - LYNX_FRENZY
// ==========================================
console.log('--- Test Suite 6: LYNX_FRENZY Multi-Hit Claw Rush ---');

boss.resetForNewRound(350, 1);
boss.activateDemonAwakening();
player.resetForNewRound(400, -1);

boss.triggerMove('LYNX_FRENZY');
assert.strictEqual(boss.state, 'ATTACKING', 'Boss enters ATTACKING state');

let slashChecksCount = 0;
sceneEvents = [];
const initialPlayerHp = player.hp;

// Advance through frames 1 to 42
for (let f = 1; f <= 42; f++) {
  boss.handleAttackingState(player, mockScene);
  if (f >= 6 && f <= 36 && (f - 6) % 6 === 0) {
    slashChecksCount++;
    assert.strictEqual(boss.vx, 3.2 * boss.facing, `Frame ${f}: Boss rushes forward with vx = 3.2 * facing`);
  }
}

assert.strictEqual(slashChecksCount, 6, 'Must trigger 6 slash checks (frames 6, 12, 18, 24, 30, 36)');
assert(player.hp < initialPlayerHp, 'Player must have taken multi-hit claw damage');

const inkSplatters = sceneEvents.filter(e => e.type === 'ink');
assert(inkSplatters.length > 0, 'Cross-screen ink splatter triggered on final hit (frame 36)');

console.log('✔ LYNX_FRENZY advances with forward claw slashes and final cross ink splatter.');

// ==========================================
// TEST SUITE 7: Awakened Move - LYNX_DEMONIC_CLAWS
// ==========================================
console.log('--- Test Suite 7: LYNX_DEMONIC_CLAWS Ground Eruption ---');

boss.resetForNewRound(200, 1);
boss.activateDemonAwakening();
player.resetForNewRound(500, -1);
player.hp = 100;

boss.triggerMove('LYNX_DEMONIC_CLAWS');
assert.strictEqual(boss.state, 'ATTACKING', 'Boss enters ATTACKING state');

// Frame 1: Spawns ground claw spell/entity at opponent.x
boss.handleAttackingState(player, mockScene);
assert.strictEqual(boss.activeMagicSpells.length, 1, 'Spell entity pushed to activeMagicSpells');
assert.strictEqual(boss.activeMagicSpells[0].id, 'LYNX_DEMONIC_CLAWS', 'Spell ID is LYNX_DEMONIC_CLAWS');
assert.strictEqual(boss.activeMagicSpells[0].x, player.x, 'Spell spawned at player.x');

// Advance to frame 17
for (let f = 2; f < 18; f++) {
  boss.handleAttackingState(player, mockScene);
  assert.strictEqual(player.hp, 100, `Frame ${f}: Opponent takes no damage before eruption`);
}

// Frame 18: Eruption deals 38 damage and sets opponent.vy = -13.5
sceneEvents = [];
boss.handleAttackingState(player, mockScene);

assert.strictEqual(player.hp, 62, 'Opponent takes 38 damage (100 - 38 = 62)');
assert.strictEqual(player.vy, -13.5, 'Opponent launched vertically with vy = -13.5');
assert.strictEqual(player.state, 'HITSTUN', 'Opponent put into HITSTUN state');

const clawShockwaves = sceneEvents.filter(e => e.type === 'shockwave');
assert(clawShockwaves.length > 0, 'Shockwave spawned on claw eruption');

console.log('✔ LYNX_DEMONIC_CLAWS spawns ground entity and erupts at frame 18 with 38 dmg & launch.');

// ==========================================
// ALL TESTS PASSED
// ==========================================
console.log('\n======================================================');
console.log('🎉 ALL TASK 3 BOSS MECHANICS VERIFICATION TESTS PASSED!');
console.log('======================================================');
process.exit(0);
