/**
 * Verification Test Suite for Match Lifecycle & Cutscene Progression Integration (Task 5)
 * Shadow Fight 2 Web Edition - Boss Awakening & Dialogue Cinematics
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== Running Task 5: Match Lifecycle & Cutscene Progression Integration Tests ===\n');

// 1. Mock DOM Environment
class MockClassList {
  constructor(el) {
    this.classes = new Set();
    this.el = el;
  }
  add(cls) {
    this.classes.add(cls);
    if (this.el) this.el.className = Array.from(this.classes).join(' ');
  }
  remove(cls) {
    this.classes.delete(cls);
    if (this.el) this.el.className = Array.from(this.classes).join(' ');
  }
  contains(cls) {
    return this.classes.has(cls);
  }
}

class MockElement {
  constructor(id = '', tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.classList = new MockClassList(this);
    this.className = '';
    this.innerHTML = '';
    this.textContent = '';
    this.style = {};
    this.width = 300;
    this.height = 300;
    this.listeners = {};
  }
  querySelector(sel) {
    return new MockElement('', sel);
  }
  querySelectorAll(sel) {
    return [new MockElement('', sel)];
  }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  dispatchEvent(event) {
    const list = this.listeners[event.type || event] || [];
    list.forEach(fn => fn(event));
  }
  getContext(type) {
    return {
      save: () => {},
      restore: () => {},
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      translate: () => {},
      rotate: () => {},
      createRadialGradient: () => ({ addColorStop: () => {} }),
      createLinearGradient: () => ({ addColorStop: () => {} }),
      fillText: () => {},
      measureText: (txt) => ({ width: (txt || '').length * 10 }),
      roundRect: () => {}
    };
  }
}

const elements = new Map();
function getOrCreateElement(id, tag = 'div') {
  if (!elements.has(id)) {
    elements.set(id, new MockElement(id, tag));
  }
  return elements.get(id);
}

const mockDoc = {
  getElementById: (id) => getOrCreateElement(id),
  querySelector: (sel) => {
    if (sel.startsWith('#')) return getOrCreateElement(sel.slice(1));
    if (sel.startsWith('.')) return getOrCreateElement(sel.slice(1));
    return new MockElement('', sel);
  },
  querySelectorAll: (sel) => {
    return [
      getOrCreateElement('screen-main-menu'),
      getOrCreateElement('screen-arena'),
      getOrCreateElement('screen-tournament'),
      getOrCreateElement('screen-armory')
    ];
  },
  addEventListener: () => {}
};

// Global Sandbox Setup
const globalWindow = {
  document: mockDoc,
  localStorage: {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; }
  },
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  devicePixelRatio: 1,
  addEventListener: () => {},
  console: console,
  Math: Math,
  Date: Date
};
globalWindow.window = globalWindow;
globalWindow.global = globalWindow;

// Pre-create common elements
getOrCreateElement('seal-reward-modal');
getOrCreateElement('sealInspectCanvas', 'canvas');
getOrCreateElement('match-end-modal');
getOrCreateElement('pause-modal');
getOrCreateElement('tournament-list');
getOrCreateElement('gameCanvas', 'canvas');
getOrCreateElement('lobbyCanvas', 'canvas');

// Load CONFIG
const configCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'config.js'), 'utf8');
vm.runInNewContext(configCode, globalWindow);

// Mock Sound Engine
const audioLog = [];
globalWindow.Sound = {
  playBossRoar: () => audioLog.push('BOSS_ROAR'),
  playSealAcquired: () => audioLog.push('SEAL_ACQUIRED'),
  playDialogueChime: () => audioLog.push('CHIME'),
  playDemonicThunder: () => audioLog.push('DEMONIC_THUNDER'),
  startBattleMusic: () => audioLog.push('START_BATTLE_MUSIC'),
  stopBattleMusic: () => audioLog.push('STOP_BATTLE_MUSIC'),
  startLobbyMusic: () => audioLog.push('START_LOBBY_MUSIC'),
  playGong: () => audioLog.push('GONG'),
  playTaikoDrum: () => audioLog.push('TAIKO')
};

// Mock Armory
globalWindow.Armory = {
  coins: 500,
  gems: 10,
  equipped: {
    weapon: 'KATANA',
    armor: 'LEATHER_VEST',
    helm: 'IRON_MASK',
    amulet: 'FLAME_AMULET'
  },
  addCoins(amount) {
    this.coins += amount;
  },
  addGems(amount) {
    this.gems += amount;
  },
  consumeEnergy() {},
  updateUI() {}
};

// Load Tournament
const tournamentCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'tournament.js'), 'utf8');
vm.runInNewContext(tournamentCode, globalWindow);

// Load Cinematics
const cinematicsCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'cinematics.js'), 'utf8');
vm.runInNewContext(cinematicsCode, globalWindow);

// Load ThreeScene
const threeSceneCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'three_scene.js'), 'utf8');
vm.runInNewContext(threeSceneCode, globalWindow);

// Mock SceneRenderer & Fighter
class MockSceneRenderer {
  constructor() {
    this.trauma = 0;
    this.flashColor = null;
    this.flashAlpha = 0;
    this.camera = { x: 0, zoom: 1 };
    this.ctx = {
      save: () => {},
      restore: () => {},
      textAlign: '',
      textBaseline: '',
      font: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      shadowColor: '',
      shadowBlur: 0,
      beginPath: () => {},
      roundRect: () => {},
      fill: () => {},
      stroke: () => {},
      fillText: () => {},
      measureText: () => ({ width: 60 })
    };
  }
  addTrauma(amt) {
    this.trauma += amt;
  }
  triggerScreenFlash(color, alpha) {
    this.flashColor = color;
    this.flashAlpha = alpha;
  }
  updateCamera() {}
  render() {}
  renderDemonAura() {}
}
globalWindow.SceneRenderer = MockSceneRenderer;

class MockFighter {
  constructor(x, config = {}) {
    this.x = x;
    this.y = 480;
    this.name = config.name || 'FIGHTER';
    this.maxHp = config.hp || 100;
    this.hp = this.maxHp;
    this.ghostHp = this.hp;
    this.isBoss = config.isBoss || false;
    this.bossPhase = 1;
    this.hasAwakened = false;
    this.roundsWon = 0;
    this.facing = config.facing || 1;
    this.weapon = config.weapon || 'FISTS';
    this.armor = config.armor || 'ROBE';
    this.helm = config.helm || 'HEADBAND';
    this.amulet = config.amulet || 'FLAME_AMULET';
    this.visuals = config.visuals || { auraGlow: '', eyeColor: '', eyeTrailColor: '' };
    this.activeMagicSpells = [];
  }
  resetForNewRound() {
    this.hp = this.maxHp;
    this.ghostHp = this.hp;
  }
  activateDemonAwakening() {
    this.bossPhase = 2;
    this.hasAwakened = true;
    this.visuals.auraGlow = 'rgba(231, 76, 60, 0.95)';
    this.visuals.eyeColor = '#ff1744';
    this.visuals.eyeTrailColor = 'rgba(255, 23, 68, 0.8)';
    this.hp = Math.min(this.maxHp, this.hp + 25);
    this.ghostHp = this.hp;
  }
  update() {}
}
globalWindow.Fighter = MockFighter;

class MockCombatAI {
  constructor(fighter, oppConfig) {
    this.fighter = fighter;
    this.oppConfig = oppConfig;
  }
  update() { return null; }
}
globalWindow.CombatAI = MockCombatAI;

// Load GameEngine
const gameCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'game.js'), 'utf8');
vm.runInNewContext(gameCode, globalWindow);

const Game = globalWindow.Game;
const Tournament = globalWindow.Tournament;
const Cinematics = globalWindow.Cinematics;
const Armory = globalWindow.Armory;
const ThreeScene = globalWindow.ThreeScene;

assert(Game, 'Game instance must exist');
assert(Tournament, 'Tournament instance must exist');
assert(Cinematics, 'Cinematics instance must exist');

Game.sceneRenderer = new MockSceneRenderer();

// ==========================================
// TEST SUITE 1: Tournament Pre-Fight Dialogue Triggers
// ==========================================
console.log('--- Test Suite 1: Tournament Fight Launcher & Pre-Fight Banter ---');

let dialoguePlayed = null;
let matchLaunched = null;

// Mock Cinematics.playDialogue
Cinematics.playDialogue = (key, onComplete) => {
  dialoguePlayed = key;
  // Automatically execute onComplete callback immediately
  if (onComplete) onComplete();
};

// 1.1 Disciple Dialogue: Shin (Stage 0)
dialoguePlayed = null;
Game.startTournamentFight(0);
assert.strictEqual(dialoguePlayed, 'shin', 'Stage 0 (Shin) must trigger "shin" disciple banter');
assert.strictEqual(Game.gameMode, 'TOURNAMENT', 'Game mode must be set to TOURNAMENT');
assert.strictEqual(Game.opponent.name, 'Shin', 'Opponent must be Shin');
console.log('  ✓ Disciple dialogue trigger (Shin) before fight launch verified');

// 1.2 Disciple Dialogue: Brick (Stage 2)
dialoguePlayed = null;
Game.startTournamentFight(2);
assert.strictEqual(dialoguePlayed, 'brick', 'Stage 2 (Brick) must trigger "brick" disciple banter');
assert.strictEqual(Game.opponent.name, 'Brick', 'Opponent must be Brick');
console.log('  ✓ Disciple dialogue trigger (Brick) before fight launch verified');

// 1.3 Boss Dialogue: Lynx (Stage 5)
dialoguePlayed = null;
Game.startTournamentFight(5);
assert.strictEqual(dialoguePlayed, 'LYNX_PRE_FIGHT', 'Stage 5 (Lynx) must trigger "LYNX_PRE_FIGHT" visual novel cutscene');
assert.strictEqual(Game.opponent.name, 'Lynx', 'Opponent must be Lynx');
assert.strictEqual(Game.opponent.isBoss, true, 'Opponent Lynx must have isBoss=true');
console.log('  ✓ Boss cinematic trigger ("LYNX_PRE_FIGHT") before Lynx fight verified');

// 1.4 Fallback when Cinematics is absent
const savedCinematics = globalWindow.Cinematics;
globalWindow.Cinematics = null;
Game.startTournamentFight(0);
assert.strictEqual(Game.gameMode, 'TOURNAMENT', 'Fallback must launch match without throwing when Cinematics unavailable');
globalWindow.Cinematics = savedCinematics;
console.log('  ✓ Graceful fallback when Cinematics unavailable verified');

// ==========================================
// TEST SUITE 2: Mid-Combat Boss Awakening (50% HP)
// ==========================================
console.log('\n--- Test Suite 2: Mid-Combat Boss Awakening Transition ---');

// Setup Lynx fight
Game.startTournamentFight(5);
assert.strictEqual(Game.opponent.isBoss, true);
assert.strictEqual(Game.opponent.bossPhase, 1);
assert.strictEqual(Game.opponent.hasAwakened, false);

Game.matchState = 'FIGHTING';
audioLog.length = 0;
let awakeningCutscenePlayed = false;

Cinematics.playDialogue = (key, onComplete) => {
  if (key === 'LYNX_AWAKENING') {
    awakeningCutscenePlayed = true;
    assert.strictEqual(Game.matchState, 'PAUSED', 'Match state must be PAUSED while awakening dialogue is playing');
    assert.strictEqual(Game.isAwakening, true, 'Game.isAwakening flag must be true during awakening cutscene');
  }
  if (onComplete) onComplete();
};

Game.sceneRenderer.trauma = 0;
Game.sceneRenderer.flashColor = null;

// Trigger Awakening
Game.triggerBossAwakening(Game.opponent);

assert(awakeningCutscenePlayed, 'LYNX_AWAKENING dialogue cutscene must be triggered');
assert(audioLog.includes('BOSS_ROAR'), 'Sound.playBossRoar must be invoked');
assert(Game.sceneRenderer.trauma >= 1.0, 'Trauma of at least 1.0 must be applied to camera');
assert.strictEqual(Game.sceneRenderer.flashColor, '#ff1744', 'Screen flash #ff1744 must be triggered');
assert.strictEqual(Game.opponent.bossPhase, 2, 'Boss phase must now be 2');
assert.strictEqual(Game.opponent.hasAwakened, true, 'Boss hasAwakened must be true');
assert.strictEqual(Game.isAwakening, false, 'isAwakening flag must reset to false after cutscene completes');
assert.strictEqual(Game.matchState, 'FIGHTING', 'Match state must restore to FIGHTING');
console.log('  ✓ triggerBossAwakening pauses match, plays roar, invokes LYNX_AWAKENING cutscene, activates Phase 2, flashes red, and resumes fight');

// 2.2 Re-trigger protection
const initialTrauma = Game.sceneRenderer.trauma;
Game.isAwakening = true;
Game.triggerBossAwakening(Game.opponent);
// Should not change or run because isAwakening is already true
assert.strictEqual(Game.sceneRenderer.trauma, initialTrauma, 'Guard against re-triggering awakening while already in progress verified');
Game.isAwakening = false;
console.log('  ✓ Guard against duplicate awakening triggers verified');

// ==========================================
// TEST SUITE 3: Lynx Defeat & Victory Cutscene
// ==========================================
console.log('\n--- Test Suite 3: Boss Victory Cutscene & Progression Hook ---');

let victoryDialoguePlayed = false;
let sealModalOpened = false;

Cinematics.playDialogue = (key, onComplete) => {
  if (key === 'LYNX_VICTORY') {
    victoryDialoguePlayed = true;
    assert.strictEqual(Game.matchState, 'MATCH_OVER', 'Match state must be MATCH_OVER during victory cutscene');
  }
  if (onComplete) onComplete();
};

// Simulate Player winning required rounds against Lynx
Game.gameMode = 'TOURNAMENT';
Game.opponent.isBoss = true;
Game.player.roundsWon = globalWindow.CONFIG.MAX_ROUNDS_TO_WIN; // 2
Game.opponent.roundsWon = 0;

// Spy on showSealAcquisitionModal
const origShowSeal = Game.showSealAcquisitionModal;
let sealAcquisitionInvoked = false;
Game.showSealAcquisitionModal = function() {
  sealAcquisitionInvoked = true;
  origShowSeal.call(this);
};

Game.checkMatchProgression();

assert(victoryDialoguePlayed, 'LYNX_VICTORY cutscene must play when Lynx is defeated');
assert(sealAcquisitionInvoked, 'showSealAcquisitionModal must be invoked upon LYNX_VICTORY completion');
console.log('  ✓ Defeating Lynx triggers LYNX_VICTORY cutscene and transitions to Seal Acquisition modal');

// ==========================================
// TEST SUITE 4: Seal Acquisition Modal & Reward Delivery
// ==========================================
console.log('\n--- Test Suite 4: Seal Acquisition Modal, Currency & Stage Progression ---');

// Reset Armory and Tournament state
Armory.coins = 1000;
Armory.gems = 50;
Tournament.currentStageIndex = 5;
Tournament.completedStages = [0, 1, 2, 3, 4];
audioLog.length = 0;

const modalEl = mockDoc.getElementById('seal-reward-modal');
modalEl.classList.remove('active');
assert(!modalEl.classList.contains('active'), 'Modal must initially not be active');

Game.showSealAcquisitionModal();

assert(modalEl.classList.contains('active'), '#seal-reward-modal must receive class "active"');
// Armory gets 1000 coins + completeCurrentStage reward ((5 + 1) * 150 = 900)
assert(Armory.coins >= 2000, `Coins must increase by at least 1000 (actual: ${Armory.coins})`);
assert.strictEqual(Armory.gems, 70, `Gems must increase by +20 from 50 to 70 (actual: ${Armory.gems})`);
assert(Tournament.completedStages.includes(5), 'Tournament stage 5 (Lynx) must be marked as completed');
assert(audioLog.includes('SEAL_ACQUIRED'), 'Sound.playSealAcquired must be called');
console.log('  ✓ #seal-reward-modal opens, +1000 Coins & +20 Gems awarded, stage completed, seal audio triggered');

// ==========================================
// TEST SUITE 5: Claiming Seal & Act I Conquered Tournament Map
// ==========================================
console.log('\n--- Test Suite 5: Claim Seal & Act I Conquered Banner ---');

audioLog.length = 0;
let screenShown = null;
Game.showScreen = (id) => { screenShown = id; };

Game.claimSealReward();

assert(!modalEl.classList.contains('active'), '#seal-reward-modal must close (lose "active" class)');
assert(audioLog.includes('STOP_BATTLE_MUSIC'), 'Battle music must stop when seal reward is claimed');
assert.strictEqual(screenShown, 'screen-tournament', 'Game must transition to screen-tournament');

// Verify Act I Conquered banner in Tournament Map HTML
const listEl = mockDoc.getElementById('tournament-list');
assert(listEl.innerHTML.includes('act-conquered-banner'), 'Tournament list must render .act-conquered-banner when stage 5 is completed');
assert(listEl.innerHTML.includes('ACT I CONQUERED • GATES OF SHADOWS UNLOCKED'), 'Banner text must display Act I Conquered title');
console.log('  ✓ Claiming seal hides modal, stops combat audio, transitions to tournament map, and displays "ACT I CONQUERED" banner');

// ==========================================
// TEST SUITE 6: ThreeScene.renderSealModal & 2D Fallback
// ==========================================
console.log('\n--- Test Suite 6: 3D Seal Renderer & Canvas Fallback ---');

const sealCanvas = mockDoc.getElementById('sealInspectCanvas');
assert(typeof ThreeScene.renderSealModal === 'function', 'ThreeScene.renderSealModal method must exist');

// In node environment without WebGL THREE, it gracefully returns false or degrades
const threeResult = ThreeScene.renderSealModal(sealCanvas);
assert(threeResult === false || threeResult === true, 'renderSealModal must return boolean without crashing');

// Test 2D fallback execution
modalEl.classList.add('active');
Game.startSealRenderer();
assert(Game.sealAnimFrameId !== null, 'startSealRenderer must start an animation frame loop');
Game.claimSealReward();
assert.strictEqual(Game.sealAnimFrameId, null, 'claimSealReward must cancel seal animation loop');
console.log('  ✓ ThreeScene.renderSealModal error handling and 2D animated rotating medallion fallback verified');

console.log('\n======================================================');
console.log('🎉 ALL TASK 5 MATCH CINEMATICS INTEGRATION TESTS PASSED!');
console.log('======================================================');
