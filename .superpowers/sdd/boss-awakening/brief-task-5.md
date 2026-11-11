# Task 5 Brief: Match Lifecycle & Cutscene Progression Integration

**Plan:** `docs/superpowers/plans/2026-10-29-boss-awakening-cinematics.md`  
**Spec:** `docs/superpowers/specs/2026-10-29-boss-awakening-cinematics-design.md`  

## Objectives:

1. **In `js/tournament.js`**:
   - In `startMatch(opponentIndex)` or equivalent fight launcher:
     - If opponent is Lynx (`opp.isBoss`):
       - Before starting round, invoke:
         ```javascript
         if (window.Cinematics && window.Cinematics.playDialogue) {
           window.Cinematics.playDialogue('LYNX_PRE_FIGHT', () => {
             this.launchMatch(opp);
           });
         } else {
           this.launchMatch(opp);
         }
         ```
     - For other tournament disciples (`shin`, `brick`, `needle`, `ghost`):
       - Check `CONFIG.DIALOGUES.DISCIPLES[opp.name.toUpperCase()]`:
       - Show brief 1-line banter before launching match.

2. **In `js/game.js`**:
   - In `GameManager` class:
     - Implement `triggerBossAwakening(bossFighter)`:
       - Set `this.isPaused = true;` or `this.isAwakening = true;`
       - Call `window.Cinematics.playDialogue('LYNX_AWAKENING', () => {`
         - `bossFighter.activateDemonAwakening();`
         - Trigger screen flash & heavy trauma: `this.renderer.triggerFlash('rgba(231, 76, 60, 0.7)', 30);`
         - `this.isAwakening = false; this.isPaused = false;`
       - `});`
     - In round victory handling (when Lynx is defeated in round 2/decisive round):
       - Trigger post-fight cutscene:
         ```javascript
         if (opponent.isBoss && winner === this.player) {
           window.Cinematics.playDialogue('LYNX_VICTORY', () => {
             this.showSealAcquisitionModal();
           });
         }
         ```
     - Implement `showSealAcquisitionModal()`:
       - Show `#seal-reward-modal` (add class `active`).
       - Render rotating 3D Seal or high-fidelity radial medallion on `#sealInspectCanvas`.
       - Award +1000 Coins and +20 Gems (`window.Profile.addReward(1000, 20)`).
       - Play `window.Sound.playSealAcquired()`.
       - Hook `#seal-claim-btn` click: hide modal, mark Lynx as defeated in tournament progress, return to tournament screen.

3. **Verify**:
   - Write `.scratch/test_match_cinematics.js` verifying the dialogue triggers during match initialization, 50% HP awakening, and victory seal modal presentation.
   - Run `node .scratch/test_match_cinematics.js` and verify exit code 0.

