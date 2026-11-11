# Boss Awakening & Dialogue Cinematics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the authentic *Shadow Fight 2* Act I climax: the Visual Novel Cinematic Dialogue Engine with letterbox bars and portrait panels, narrative dialogues, Lynx mid-battle Phase 2 Demon Awakening at 50% HP with permanent crimson demon aura, 3 awakened boss attacks (Claws Frenzy, True Shadow Vanish, Demonic Claws), and post-fight Seal of the Lynx victory sequence.

**Architecture:** A visual novel dialogue overlay engine in `js/cinematics.js` integrated with the combat lifecycle in `js/game.js`. Combat state pauses during cutscenes. Mid-fight health threshold triggers Lynx's Awakening transition with screen-space trauma, Web Audio thunder, and Three.js 2.5D deep-crimson Torii Gate lighting. Lynx gains an enraged AI profile and special combo attacks in `js/fighter.js` and `js/ai.js`.

**Tech Stack:** JavaScript (ES6+), Canvas 2D, Three.js (r128), Web Audio API, Playwright.

**Spec:** [`docs/superpowers/specs/2026-10-29-boss-awakening-cinematics-design.md`](file:///d:/OLLAMA/SF2C/docs/superpowers/specs/2026-10-29-boss-awakening-cinematics-design.md)

## Global Constraints
- Standalone execution: all dialogue assets, scripts, audio synthesizers, and visual VFX run 100% offline.
- Zero regression on existing 8-way movement, Magic & Jutsu spells, 2.5D background rendering, or tournament progression.
- Graceful degradation: cinematics and boss mechanics function completely in 2D mode if WebGL is disabled.
- Verification gate: every task must be verified with automated unit tests or Playwright scripts before advancing.

---

## File Structure & Responsibilities

- `js/config.js`: Declarative `CONFIG.DIALOGUES` (disciples, pre-fight Lynx, awakening, victory) and `CONFIG.MOVES` (`LYNX_FRENZY`, `LYNX_TRUE_VANISH`, `LYNX_DEMONIC_CLAWS`).
- `js/audio.js`: Procedural Web Audio synthesizers for boss roar, demonic thunder, bamboo dialogue chimes, and seal acquisition celestial chord.
- `js/cinematics.js`: Visual novel cinematic dialogue engine managing typewriter text, character portraits, letterbox animation, audio chimes, and callbacks.
- `index.html`: DOM structure for `#cinematic-overlay`, letterbox bars, portrait cards, dialogue box, skip buttons, and Seal of the Lynx reward modal.
- `css/style.css`: Styling for 2.35:1 letterbox bars, Japanese lacquer dialogue box, character portrait badges, and demonic aura VFX.
- `js/fighter.js`: Boss phase tracking (`isBoss`, `bossPhase`, `hasAwakened`, `isAwakened`), 50% HP threshold hook, awakened move executions, and demon eye trails.
- `js/ai.js`: Awakened Boss AI decision matrix (aggro 1.0, reaction 0.95, tactical vanish, and claw frenzies).
- `js/three_scene.js`: 2.5D dynamic crimson lighting (`0xd63031`) illuminating the 3D Torii Gate and lanterns during Phase 2.
- `js/game.js`: Orchestrating mid-battle slow-motion awakening freeze, time-stop, dialogue transitions, and Act I Seal victory flow.
- `js/tournament.js`: Triggering pre-fight banters and Lynx story cinematics when entering tournament stages.

---

## Tasks

### Task 1: Narrative Data Models & Procedural Audio Assets
- [x] In `js/config.js`, define `CONFIG.DIALOGUES`:
  - `DISCIPLES`: Quick pre-fight martial quotes for Shin, Ken, Brick, Needle, Ghost.
  - `LYNX_PRE_FIGHT`: 3-part dialogue exchange between Sensei, Lynx, and Shadow.
  - `LYNX_AWAKENING`: Mid-fight 50% HP roar and transformation quote.
  - `LYNX_VICTORY`: Post-fight Lynx defeat and Sensei Act I completion speech.
- [x] In `js/config.js`, add `CONFIG.MOVES` for awakened Lynx:
  - `LYNX_FRENZY`: 5-hit rapid forward claw slash combo (18 dmg/hit, ending in explosive cross-slash).
  - `LYNX_TRUE_VANISH`: 110-frame total invisibility (eyes visible in dark), dive kick `vy = 18.0`.
  - `LYNX_DEMONIC_CLAWS`: Demonic floor eruption summoning crimson claws dealing 38 dmg with juggle launch.
- [x] In `js/audio.js`, implement procedural Web Audio synthesizers:
  - `playBossRoar()`: Dual-oscillator sub-bass frequency-modulated growl with low-pass resonance sweep.
  - `playDemonicThunder()`: Explosive white-noise burst with sharp exponential decay and bass boom.
  - `playDialogueChime()`: Resonant bamboo percussion tap on each text line.
  - `playSealAcquired()`: Multi-tone harmonious celestial gong celebrating Act I victory.
- [x] Verify dialogue models and audio synthesizers via Node test script `.scratch/test_cinematics_audio.js`.

### Task 2: Visual Novel Cinematic Engine (`js/cinematics.js`) & UI Layout
- [x] In `index.html`:
  - Add `#cinematic-overlay` container with top/bottom letterbox bars (`.cinematic-bar-top`, `.cinematic-bar-bottom`).
  - Add left/right speaker portrait cards (`#dialogue-speaker-left`, `#dialogue-speaker-right`).
  - Add dialogue box (`#cinematic-dialogue-box`) with speaker title tag, dialogue text span, and skip button.
  - Add `#seal-reward-modal` for the 3D Seal of the Lynx victory presentation.
  - Add script tag `<script src="js/cinematics.js"></script>`.
- [x] In `css/style.css`:
  - Style 2.35:1 letterbox bars with smooth vertical sliding animation.
  - Style Japanese lacquer dialogue box with gold filigree border and sumi paper texture.
  - Style portrait cards with glowing eye highlights and speaker name tags.
  - Style Seal reward modal with glowing golden/crimson crest.
- [x] Create `js/cinematics.js`:
  - Implement `CinematicsManager` class:
    - `playDialogue(dialogueKey, onComplete)`: Slides in letterbox bars, loads lines, initiates typewriter effect.
    - `typeWriter(text, onComplete)`: Types characters at 22ms per char with `Sound.playDialogueChime()`.
    - `advanceDialogue()`: Advances to next line or finishes line instantly if still typing.
    - `skipDialogue()`: Immediately bypasses remaining dialogue lines and fires `onComplete()`.
    - `closeDialogue()`: Smoothly retracts letterbox bars and resumes gameplay.
- [x] Verify cutscene engine logic and DOM layout with test script `.scratch/test_cinematics_engine.js`.

### Task 3: Lynx Multi-Phase Boss State Machine & Combat Mechanics (`js/fighter.js`)
- [x] In `js/fighter.js`, initialize properties:
  - `isBoss = config.isBoss || false`, `bossPhase = 1`, `hasAwakened = false`, `isAwakened = false`, `awakeningShield = 0`.
- [x] In `js/fighter.js` `resetForNewRound`:
  - Reset `bossPhase = 1`, `hasAwakened = false`, `isAwakened = false`, `awakeningShield = 0`.
- [x] In `fighter.takeHit()`:
  - Add 50% HP threshold check:
    - If `this.isBoss && !this.hasAwakened && this.hp <= this.maxHp * 0.5`:
      - Set `this.hasAwakened = true;`
      - Call `window.Game.triggerBossAwakening(this);`
- [x] Implement `activateDemonAwakening()`:
  - `this.isAwakened = true;`
  - `this.bossPhase = 2;`
  - `this.visuals.auraGlow = 'rgba(231, 76, 60, 0.95)';`
  - Restores bonus shield health (`this.hp = Math.min(this.maxHp, this.hp + 25);`).
- [x] Implement awakened move execution in `handleAttackingState`:
  - `LYNX_FRENZY`: multi-hit step sequence triggering rapid claw slashes and final cross-knockback with ink splatter.
  - `LYNX_TRUE_VANISH`: sets `this.isInvisible = true` and `this.isInvulnerable = true`, teleports above player, then dives with `vy = 18.0`.
  - `LYNX_DEMONIC_CLAWS`: spawns crimson ground claws beneath player with vertical launch.
- [x] Verify state machine and ability math with Node test script `.scratch/test_boss_mechanics.js`.

### Task 4: Enraged Combat AI & 2.5D Demon Lighting
- [x] In `js/ai.js`:
  - In `update(player)`:
    - Check if `this.fighter.isAwakened`:
      - Boost `this.aggro = 1.0; this.reaction = 0.95;`
      - Tactical True Vanish: triggers if player keeps distance (`dist > 220px`).
      - Claw Frenzy: triggers when player is pressured against wall or cornered.
      - Floor Demonic Claws: triggers when player attempts long recovery moves.
- [x] In `js/three_scene.js`:
  - In `updateSpellLighting(p1, p2)`:
    - If either fighter `isBoss && isAwakened`:
      - Set `spellLight.color.setHex(0xd63031);`
      - Set `spellLight.intensity = Math.max(spellLight.intensity, 2.2 + Math.random() * 0.4);`
      - Deep crimson demonic ambient floods the 3D Torii Gate and lanterns!
- [x] In `js/renderer.js`:
  - In `drawBurnStatus(fighter)` or new `drawDemonAura(fighter)`:
    - Render rising dark-red and black demonic flame embers around awakened Lynx.
    - Render radiant glowing crimson eye trails behind Lynx's movements.
- [x] Verify AI decision tree and Three.js lighting updates without performance degradation.

### Task 5: Match Lifecycle & Cutscene Progression Integration (`js/game.js` & `js/tournament.js`)
- [x] In `js/tournament.js`:
  - In `startTournamentFight(opponentIndex)`:
    - If opponent is Lynx (`oppConfig.isBoss`):
      - Trigger `window.Cinematics.playDialogue('LYNX_PRE_FIGHT', () => this.launchMatch(oppConfig));`
    - Else:
      - Trigger quick 1-line disciple banter, then launch match.
- [x] In `js/game.js`:
  - Implement `triggerBossAwakening(bossFighter)`:
    - Set `this.matchState = 'PAUSED';`
    - Trigger slow-motion freeze (`this.slowMotionFrames = 40;`).
    - Play `Sound.playBossRoar()` and screen trauma `this.sceneRenderer.addTrauma(1.0);`.
    - Trigger `window.Cinematics.playDialogue('LYNX_AWAKENING', () => { ... resume combat with boss awakened ... });`.
  - In `triggerRoundOver()`:
    - If Lynx is defeated and match won:
      - Trigger `window.Cinematics.playDialogue('LYNX_VICTORY', () => { window.Game.showSealAcquisitionModal(); });`.
  - Implement `showSealAcquisitionModal()`:
    - Display 3D rotating Seal of the Lynx, award +1000 Coins & +20 Gems, and unlock Act II.
- [x] Verify end-to-end tournament flow from pre-fight to victory sequence.

### Task 6: Automated Playwright Verification & Visual Evidence
- [x] Create automated Playwright verification test `.scratch/verify_boss_awakening.js`:
  - Test 1: Trigger pre-fight Lynx dialogue cutscene, verify letterbox bars, portrait cards, typewriter text (capture `boss_1_dialogue_prefight.png`).
  - Test 2: Fight Lynx to 50% HP, verify mid-fight slow motion freeze and Awakening dialogue cutscene (capture `boss_2_awakening_cutscene.png`).
  - Test 3: Verify Lynx Phase 2 Demon transformation, crimson demon flame aura, and 2.5D red Torii Gate lighting (capture `boss_3_demon_awakened.png`).
  - Test 4: Verify Lynx executing `LYNX_FRENZY` / `LYNX_TRUE_VANISH` (capture `boss_4_lynx_frenzy.png`).
  - Test 5: Defeat Lynx, verify post-fight dialogue and 3D Seal of the Lynx reward modal (capture `boss_5_seal_acquired.png`).
  - Test 6: Verify 0 console errors throughout entire narrative flow.
- [x] Generate comprehensive verification report artifact with visual gallery.

