# Task 3 Brief: Lynx Multi-Phase Boss State Machine & Combat Mechanics

**Plan:** `docs/superpowers/plans/2026-10-29-boss-awakening-cinematics.md`  
**Spec:** `docs/superpowers/specs/2026-10-29-boss-awakening-cinematics-design.md`  

## Objectives:

1. **In `js/fighter.js` Constructor**:
   - Initialize boss properties:
     - `this.isBoss = config.isBoss || false;`
     - `this.bossPhase = 1;`
     - `this.hasAwakened = false;`
     - `this.isAwakened = false;`

2. **In `js/fighter.js` `resetForNewRound`**:
   - Reset:
     - `this.bossPhase = 1;`
     - `this.hasAwakened = false;`
     - `this.isAwakened = false;`

3. **In `fighter.takeHit()`**:
   - Check 50% HP threshold:
     ```javascript
     if (this.isBoss && !this.hasAwakened && this.hp <= this.maxHp * 0.5 && this.hp > 0) {
       this.hasAwakened = true;
       if (window.Game && window.Game.triggerBossAwakening) {
         window.Game.triggerBossAwakening(this);
       }
     }
     ```

4. **Implement `activateDemonAwakening()` on `Fighter`**:
   ```javascript
   activateDemonAwakening() {
     this.isAwakened = true;
     this.bossPhase = 2;
     if (!this.visuals) this.visuals = {};
     this.visuals.auraGlow = 'rgba(231, 76, 60, 0.95)';
     this.hp = Math.min(this.maxHp, this.hp + 25); // +25 bonus shield health
     if (window.Sound && window.Sound.playBossRoar) window.Sound.playBossRoar();
     if (window.Sound && window.Sound.playDemonicThunder) window.Sound.playDemonicThunder();
   }
   ```

5. **In `handleAttackingState(opponent, sceneRenderer)`**:
   - Handle Awakened Move Special Logic:
     - `LYNX_FRENZY`:
       - During `hitStart` to `hitEnd`, every 6 frames trigger a claw slash check, advancing `this.vx = 3.2 * this.facing`.
       - Final hit at frame 36 delivers `knockback: 8.5` with cross-screen ink splatter.
     - `LYNX_TRUE_VANISH`:
       - From frame 0 to 65: `this.isInvisible = true; this.isInvulnerable = true;`
       - At frame 66: reposition directly above opponent `this.x = opponent.x - (30 * opponent.facing); this.y = opponent.y - 140; this.vy = 18.0; this.isInvisible = false;`
       - At frame 85: dive kick impact check dealing 2.4x damage and `sceneRenderer.spawnShockwave`.
       - At frame 105: clear invulnerability, land on ground.
     - `LYNX_DEMONIC_CLAWS`:
       - Spawns ground claw spell/entity at `opponent.x`, erupting at frame 18 dealing 38 dmg and vertical launch `opponent.vy = -13.5`.

6. **Verify**:
   - Write `.scratch/test_boss_mechanics.js` verifying:
     - 50% HP threshold trigger
     - `activateDemonAwakening()` state transitions & shield recovery
     - Move execution frames and invulnerability flags
   - Run `node .scratch/test_boss_mechanics.js` and verify exit code 0.

