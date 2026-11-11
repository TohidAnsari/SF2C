# Task 2 Brief: Visual Novel Cinematic Engine (`js/cinematics.js`) & UI Layout

**Plan:** `docs/superpowers/plans/2026-10-29-boss-awakening-cinematics.md`  
**Spec:** `docs/superpowers/specs/2026-10-29-boss-awakening-cinematics-design.md`  

## Objectives:

1. **In `index.html`**:
   - Add `#cinematic-overlay` with:
     - `.cinematic-bar-top` and `.cinematic-bar-bottom` (2.35:1 letterbox bars)
     - `.cinematic-stage` containing:
       - `#dialogue-portrait-left` (`.cinematic-portrait-card`)
       - `#dialogue-portrait-right` (`.cinematic-portrait-card`)
       - `#cinematic-dialogue-box` containing:
         - `#dialogue-speaker-badge`
         - `#dialogue-text`
         - `.cinematic-prompt` (e.g. "Tap to Continue ▶")
         - `<button id="cinematic-skip-btn" class="cinematic-skip-btn">SKIP ⏭</button>`
   - Add `#seal-reward-modal` (for Act I Lynx Seal acquisition presentation):
     - Modal dialog with rotating 3D Seal Canvas (`#sealInspectCanvas`), title "SEAL OF THE LYNX", subtitle "DEMON CONQUERED • ACT I COMPLETE", rewards pill (+1000 Coins, +20 Gems), and "CLAIM & ADVANCE" button.
   - Include `<script src="js/cinematics.js"></script>` in scripts list.

2. **In `css/style.css`**:
   - Letterbox bars `.cinematic-bar-top` and `.cinematic-bar-bottom` (height ~70px, black, fixed at top/bottom of game screen with smooth cubic-bezier transition).
   - `.cinematic-dialogue-box`: dark lacquer gradient (`#1b1016` to `#090407`), 2px gold border (`var(--border-gold)`), inner shadow, Japanese corner flourishes.
   - Portrait cards: dark lacquer background, glowing cyan eye accent for Shadow/Sensei, glowing scarlet red eye accent for Lynx.
   - Smooth typewriter blinking cursor, pulsating prompt indicator, and styled skip button.
   - Seal modal styles with spinning radial rays and gold/crimson glow.

3. **In `js/cinematics.js`**:
   - Implement `CinematicsManager` class:
     - Properties: `isActive = false`, `currentDialogue = null`, `lineIndex = 0`, `isTyping = false`, `typewriterTimer = null`, `onCompleteCallback = null`.
     - `playDialogue(dialogueKeyOrArray, onComplete)`:
       - Supports passing string key (e.g. `'LYNX_PRE_FIGHT'`) or direct array of frames.
       - Activates `#cinematic-overlay`, slides in letterbox bars.
       - Displays first line with `showLine(0)`.
     - `showLine(index)`:
       - Updates portrait cards (highlights active speaker, dims inactive).
       - Sets speaker badge text.
       - Starts `typeWriter(line.text)`.
     - `typeWriter(text)`:
       - Clears text, types character by character every 22ms.
       - Plays `Sound.playDialogueChime()` every 3 characters.
     - `advanceDialogue()`:
       - If `isTyping`: immediately finishes typing the current line.
       - If line is finished: advances to `lineIndex + 1`. If no more lines, calls `closeDialogue()`.
     - `skipDialogue()`:
       - Bypasses all lines immediately, calls `closeDialogue()`.
     - `closeDialogue()`:
       - Slides out letterbox bars, deactivates overlay.
       - Fires `onCompleteCallback()`.
     - Expose `window.Cinematics = new CinematicsManager();`.

4. **Verify**:
   - Test DOM structure and typing logic in `.scratch/test_cinematics_engine.js`.

