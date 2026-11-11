/**
 * Test Suite for Visual Novel Cinematic Engine (js/cinematics.js) & UI Layout
 * Shadow Fight 2 Web Edition - Boss Awakening Cinematics (Task 2)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Running Task 2: Visual Novel Cinematic Engine Tests ===\n');

// ==========================================
// TEST SUITE 1: index.html DOM Layout Verification
// ==========================================
console.log('--- Test Suite 1: index.html DOM Structure ---');

const htmlPath = path.resolve(__dirname, '../index.html');
assert(fs.existsSync(htmlPath), 'index.html must exist');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 1.1 Cinematic Overlay & Letterbox Bars
assert(htmlContent.includes('id="cinematic-overlay"'), 'index.html must contain #cinematic-overlay');
assert(htmlContent.includes('class="cinematic-bar-top"'), 'index.html must contain .cinematic-bar-top');
assert(htmlContent.includes('class="cinematic-bar-bottom"'), 'index.html must contain .cinematic-bar-bottom');
console.log('  ✓ #cinematic-overlay and letterbox bars verified');

// 1.2 Stage & Portrait Cards
assert(htmlContent.includes('class="cinematic-stage"'), 'index.html must contain .cinematic-stage');
assert(htmlContent.includes('id="dialogue-portrait-left"'), 'index.html must contain #dialogue-portrait-left');
assert(htmlContent.includes('id="dialogue-portrait-right"'), 'index.html must contain #dialogue-portrait-right');
assert(htmlContent.includes('class="cinematic-portrait-card'), 'index.html must contain .cinematic-portrait-card');
console.log('  ✓ Portrait cards (#dialogue-portrait-left & #dialogue-portrait-right) verified');

// 1.3 Dialogue Box, Speaker Badge, Text, Prompt, Skip Button
assert(htmlContent.includes('id="cinematic-dialogue-box"'), 'index.html must contain #cinematic-dialogue-box');
assert(htmlContent.includes('id="dialogue-speaker-badge"'), 'index.html must contain #dialogue-speaker-badge');
assert(htmlContent.includes('id="dialogue-text"'), 'index.html must contain #dialogue-text');
assert(htmlContent.includes('class="cinematic-prompt"'), 'index.html must contain .cinematic-prompt');
assert(htmlContent.includes('id="cinematic-skip-btn"'), 'index.html must contain #cinematic-skip-btn');
console.log('  ✓ Dialogue box, badge, text span, prompt, and skip button verified');

// 1.4 Seal Reward Modal (Act I Lynx Victory)
assert(htmlContent.includes('id="seal-reward-modal"'), 'index.html must contain #seal-reward-modal');
assert(htmlContent.includes('id="sealInspectCanvas"'), 'index.html must contain #sealInspectCanvas');
assert(htmlContent.includes('SEAL OF THE LYNX'), 'index.html must contain title "SEAL OF THE LYNX"');
assert(htmlContent.includes('DEMON CONQUERED • ACT I COMPLETE'), 'index.html must contain subtitle "DEMON CONQUERED • ACT I COMPLETE"');
assert(htmlContent.includes('+1000 COINS'), 'index.html must contain reward "+1000 COINS"');
assert(htmlContent.includes('+20 GEMS'), 'index.html must contain reward "+20 GEMS"');
assert(htmlContent.includes('CLAIM & ADVANCE'), 'index.html must contain "CLAIM & ADVANCE" button');
console.log('  ✓ #seal-reward-modal structure verified');

// 1.5 Script inclusion
assert(htmlContent.includes('<script src="js/cinematics.js"></script>'), 'index.html must include <script src="js/cinematics.js"></script>');
console.log('  ✓ <script src="js/cinematics.js"></script> script inclusion verified');


// ==========================================
// TEST SUITE 2: css/style.css Styling Verification
// ==========================================
console.log('\n--- Test Suite 2: css/style.css Styling Rules ---');

const cssPath = path.resolve(__dirname, '../css/style.css');
assert(fs.existsSync(cssPath), 'css/style.css must exist');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert(cssContent.includes('.cinematic-bar-top'), 'style.css must contain .cinematic-bar-top');
assert(cssContent.includes('.cinematic-bar-bottom'), 'style.css must contain .cinematic-bar-bottom');
assert(cssContent.includes('.cinematic-portrait-card'), 'style.css must contain .cinematic-portrait-card');
assert(cssContent.includes('.cinematic-dialogue-box'), 'style.css must contain .cinematic-dialogue-box');
assert(cssContent.includes('.typewriter-cursor'), 'style.css must contain .typewriter-cursor');
assert(cssContent.includes('.cinematic-prompt'), 'style.css must contain .cinematic-prompt');
assert(cssContent.includes('.seal-reward-content'), 'style.css must contain .seal-reward-content');
assert(cssContent.includes('.seal-rays-effect'), 'style.css must contain .seal-rays-effect');
assert(cssContent.includes('.eye-cyan'), 'style.css must contain .eye-cyan');
assert(cssContent.includes('.eye-red'), 'style.css must contain .eye-red');

console.log('  ✓ Letterbox bars, Japanese lacquer dialogue box, and Seal modal CSS verified');


// ==========================================
// TEST SUITE 3: js/cinematics.js Engine & State Machine
// ==========================================
console.log('\n--- Test Suite 3: CinematicsManager Engine & Methods ---');

const CONFIG = require('../js/config.js');
const Sound = require('../js/audio.js');
const { CinematicsManager, Cinematics } = require('../js/cinematics.js');

assert(CinematicsManager, 'CinematicsManager class must be exported');
assert(Cinematics, 'Cinematics singleton must be exported');
assert(Cinematics instanceof CinematicsManager, 'Cinematics must be an instance of CinematicsManager');
console.log('  ✓ CinematicsManager export verified');

// Setup Mock DOM
class MockElement {
  constructor(id = '', className = '') {
    this.id = id;
    this.className = className;
    this.classList = {
      _classes: new Set(className.split(' ').filter(Boolean)),
      add: (...cls) => cls.forEach(c => this.classList._classes.add(c)),
      remove: (...cls) => cls.forEach(c => this.classList._classes.delete(c)),
      contains: (c) => this.classList._classes.has(c),
      toggle: (c) => {
        if (this.classList._classes.has(c)) {
          this.classList._classes.delete(c);
          return false;
        } else {
          this.classList._classes.add(c);
          return true;
        }
      }
    };
    this.textContent = '';
    this.children = [];
    this._listeners = {};
  }

  addEventListener(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }

  dispatchEvent(event) {
    const list = this._listeners[event.type || event] || [];
    list.forEach(fn => fn(event));
  }

  querySelector(selector) {
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      return this.children.find(ch => ch.classList.contains(cls)) || null;
    }
    return null;
  }
}

class MockDocument {
  constructor() {
    this.elements = {};
    this._listeners = {};
  }

  register(el) {
    if (el.id) this.elements[el.id] = el;
    return el;
  }

  getElementById(id) {
    return this.elements[id] || null;
  }

  querySelector(selector) {
    if (selector.startsWith('#')) {
      return this.getElementById(selector.slice(1));
    }
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      return Object.values(this.elements).find(el => el.classList.contains(cls)) || null;
    }
    return null;
  }

  addEventListener(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }
}

// Build mock document with exact required elements
const mockDoc = new MockDocument();
const overlay = mockDoc.register(new MockElement('cinematic-overlay', 'cinematic-overlay'));
const barTop = mockDoc.register(new MockElement('bar-top', 'cinematic-bar-top'));
const barBottom = mockDoc.register(new MockElement('bar-bottom', 'cinematic-bar-bottom'));
const stage = mockDoc.register(new MockElement('cinematic-stage', 'cinematic-stage'));
const portraitLeft = mockDoc.register(new MockElement('dialogue-portrait-left', 'cinematic-portrait-card portrait-left'));
const portraitRight = mockDoc.register(new MockElement('dialogue-portrait-right', 'cinematic-portrait-card portrait-right'));
const portraitLeftName = mockDoc.register(new MockElement('portrait-left-name', 'portrait-card-name'));
const portraitRightName = mockDoc.register(new MockElement('portrait-right-name', 'portrait-card-name'));
const leftEye = new MockElement('left-eye', 'portrait-eye eye-cyan');
const rightEye = new MockElement('right-eye', 'portrait-eye eye-red');
portraitLeft.children.push(leftEye);
portraitRight.children.push(rightEye);

const dialogueBox = mockDoc.register(new MockElement('cinematic-dialogue-box', 'cinematic-dialogue-box'));
const speakerBadge = mockDoc.register(new MockElement('dialogue-speaker-badge', 'dialogue-speaker-badge'));
const dialogueText = mockDoc.register(new MockElement('dialogue-text', 'dialogue-text'));
const promptEl = mockDoc.register(new MockElement('prompt', 'cinematic-prompt'));
const skipBtn = mockDoc.register(new MockElement('cinematic-skip-btn', 'cinematic-skip-btn'));

// Provide global mock window/CONFIG/Sound
global.CONFIG = CONFIG;
let chimesPlayed = 0;
global.Sound = {
  playDialogueChime: () => { chimesPlayed++; }
};

const globalListeners = {};
global.addEventListener = (event, fn) => {
  if (!globalListeners[event]) globalListeners[event] = [];
  globalListeners[event].push(fn);
};
global._dispatchEvent = (event) => {
  const type = event.type || 'keydown';
  (globalListeners[type] || []).forEach(fn => fn(event));
};

const engine = new CinematicsManager();
engine.typewriterInterval = 1; // Speed up interval for fast unit test
engine.init(mockDoc);

assert.strictEqual(engine.overlay, overlay);
assert.strictEqual(engine.dialogueBox, dialogueBox);
assert.strictEqual(engine.speakerBadge, speakerBadge);
assert.strictEqual(engine.dialogueText, dialogueText);
assert.strictEqual(engine.skipBtn, skipBtn);
console.log('  ✓ Mock DOM successfully bound to CinematicsManager');


// ==========================================
// TEST SUITE 4: Dialogue Resolution
// ==========================================
console.log('\n--- Test Suite 4: Dialogue Resolution ---');

// 4.1 Key resolution
const resolvedPrefight = engine.resolveDialogue('LYNX_PRE_FIGHT');
assert(Array.isArray(resolvedPrefight), 'resolveDialogue should resolve LYNX_PRE_FIGHT as array');
assert.strictEqual(resolvedPrefight.length, 3);
assert.strictEqual(resolvedPrefight[0].speaker, 'SENSEI');

const resolvedAwakening = engine.resolveDialogue('LYNX_AWAKENING');
assert.strictEqual(resolvedAwakening.length, 1);
assert.strictEqual(resolvedAwakening[0].speaker, 'LYNX');

const resolvedVictory = engine.resolveDialogue('LYNX_VICTORY');
assert.strictEqual(resolvedVictory.length, 2);

const resolvedShin = engine.resolveDialogue('DISCIPLES.shin');
assert.strictEqual(resolvedShin.length, 1);
assert.strictEqual(resolvedShin[0].speaker, 'SHIN');

const resolvedKen = engine.resolveDialogue('ken');
assert.strictEqual(resolvedKen.length, 1);
assert.strictEqual(resolvedKen[0].speaker, 'KEN');

// 4.2 Array pass-through
const customArray = [{ speaker: 'WARRIOR', text: 'Custom banter.' }];
const resolvedCustom = engine.resolveDialogue(customArray);
assert.strictEqual(resolvedCustom.length, 1);
assert.strictEqual(resolvedCustom[0].text, 'Custom banter.');

console.log('  ✓ Dialogue keys (LYNX_PRE_FIGHT, LYNX_AWAKENING, LYNX_VICTORY, DISCIPLES) resolved cleanly');


// ==========================================
// TEST SUITE 5: playDialogue & Typewriter Flow
// ==========================================
console.log('\n--- Test Suite 5: Typewriter & Flow Execution ---');

async function runAsyncTests() {
  // 5.1 playDialogue with pre-fight
  let completed = false;
  chimesPlayed = 0;

  const started = engine.playDialogue('LYNX_PRE_FIGHT', () => {
    completed = true;
  });

  assert(started, 'playDialogue should return true for valid dialogue');
  assert(engine.isActive, 'engine.isActive must be true');
  assert(overlay.classList.contains('active'), '#cinematic-overlay must have "active" class');
  assert.strictEqual(speakerBadge.textContent, '師父 SENSEI', 'First speaker badge must be Sensei');
  assert(portraitLeft.classList.contains('speaker-active'), 'Left portrait must be active');
  assert(portraitRight.classList.contains('speaker-dimmed'), 'Right portrait must be dimmed');
  assert(engine.isTyping, 'engine.isTyping must be true while typing');

  console.log('  ✓ playDialogue started with letterbox activation and Sensei portrait highlight');

  // Wait a short time for typewriter to type characters and trigger sound chimes
  await new Promise(resolve => setTimeout(resolve, 80));
  assert(dialogueText.textContent.length > 0, 'dialogueText should have typed initial characters');
  assert(chimesPlayed >= 1, `Sound chimes should be triggered during typing (played: ${chimesPlayed})`);
  console.log(`  ✓ Typewriter actively typing character-by-character with procedural chimes`);

  // 5.2 Test instant-finish when advancing while isTyping = true
  engine.advanceDialogue();
  assert.strictEqual(engine.isTyping, false, 'advancing while typing must instantly complete line');
  assert.strictEqual(engine.lineIndex, 0, 'instant complete must remain on lineIndex 0');
  assert(dialogueText.textContent.startsWith('Shadow, steel your mind'), 'Instant complete must show full text');
  console.log('  ✓ advanceDialogue() instantly completes line if called during active typewriter');

  // 5.3 Advance to Line 1 (Lynx)
  chimesPlayed = 0;
  engine.advanceDialogue();
  assert.strictEqual(engine.lineIndex, 1, 'Should advance to lineIndex 1');
  assert.strictEqual(speakerBadge.textContent, '山猫 LYNX', 'Second speaker badge must be Lynx');
  assert(portraitRight.classList.contains('speaker-active'), 'Right portrait must be active');
  assert(portraitLeft.classList.contains('speaker-dimmed'), 'Left portrait must be dimmed');
  assert(engine.isTyping, 'Lynx line should start typing');

  // Instant finish line 1
  engine.advanceDialogue();
  assert.strictEqual(engine.isTyping, false);
  assert(dialogueText.textContent.startsWith('Hahaha!'));
  console.log('  ✓ Line 1 (Lynx) successfully advanced and displayed');

  // 5.4 Advance to Line 2 (Shadow - short text "...")
  engine.advanceDialogue();
  assert.strictEqual(engine.lineIndex, 2, 'Should advance to lineIndex 2');
  assert.strictEqual(speakerBadge.textContent, '影 SHADOW');
  assert(portraitLeft.classList.contains('speaker-active'), 'Left portrait active for Shadow');

  // Wait for short 3-char text to complete naturally
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.strictEqual(engine.isTyping, false, 'Short 3-character text should complete typing naturally');
  assert.strictEqual(dialogueText.textContent, '...', 'Shadow text should be complete');
  console.log('  ✓ Typewriter completes naturally without manual advance on short line');

  // 5.5 Advance past final line -> close dialogue
  engine.advanceDialogue();
  assert.strictEqual(engine.isActive, false, 'engine.isActive should be false after last line');
  assert.strictEqual(overlay.classList.contains('active'), false, 'overlay should deactivate');
  assert.strictEqual(completed, true, 'onComplete callback must be fired on completion');
  console.log('  ✓ advanceDialogue() advances cleanly to end and fires onComplete callback');

  // ==========================================
  // TEST SUITE 6: skipDialogue Flow
  // ==========================================
  console.log('\n--- Test Suite 6: skipDialogue Execution ---');

  let skippedCompleted = false;
  engine.playDialogue('LYNX_PRE_FIGHT', () => {
    skippedCompleted = true;
  });

  assert(engine.isActive, 'Engine should be active');
  engine.skipDialogue();

  assert.strictEqual(engine.isActive, false, 'Engine should be inactive immediately on skip');
  assert.strictEqual(overlay.classList.contains('active'), false, 'Overlay should be deactivated on skip');
  assert.strictEqual(skippedCompleted, true, 'onComplete callback must fire on skip');
  console.log('  ✓ skipDialogue() immediately terminates dialogue and fires onComplete');

  // ==========================================
  // TEST SUITE 7: Interactive Triggers (Click & Keyboard)
  // ==========================================
  console.log('\n--- Test Suite 7: Interactive Triggers (Click & Keydown) ---');

  // 7.1 Click on dialogueBox advances
  engine.playDialogue('LYNX_PRE_FIGHT');
  assert.strictEqual(engine.lineIndex, 0);
  assert(engine.isTyping);
  dialogueBox.dispatchEvent({ type: 'click', target: dialogueBox });
  assert.strictEqual(engine.isTyping, false, 'Click on dialogueBox finishes typing instantly');
  dialogueBox.dispatchEvent({ type: 'click', target: dialogueBox });
  assert.strictEqual(engine.lineIndex, 1, 'Second click advances to line 1');
  console.log('  ✓ Dialogue box click interaction verified');

  // 7.2 Click on skipBtn skips dialogue
  skipBtn.dispatchEvent({ type: 'click', target: skipBtn, stopPropagation: () => {} });
  assert.strictEqual(engine.isActive, false, 'Skip button click terminates dialogue');
  console.log('  ✓ Skip button click interaction verified');

  // 7.3 Keydown Space/Escape
  if (global.addEventListener) {
    let keyDone = false;
    engine.playDialogue('LYNX_PRE_FIGHT', () => { keyDone = true; });
    assert(engine.isActive);
    global._dispatchEvent({ code: 'Escape', preventDefault: () => {} });
    assert.strictEqual(engine.isActive, false, 'Escape key skips dialogue');
    assert.strictEqual(keyDone, true);
    console.log('  ✓ Keyboard shortcut (Escape) verified');
  }

  console.log('\n🎉 ALL TASK 2 CINEMATIC ENGINE TESTS PASSED SUCCESSFULLY! 🎉\n');
}

runAsyncTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
