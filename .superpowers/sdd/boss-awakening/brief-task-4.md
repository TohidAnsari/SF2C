# Task 4 Brief: Enraged Combat AI & 2.5D Demon Lighting

**Plan:** `docs/superpowers/plans/2026-10-29-boss-awakening-cinematics.md`  
**Spec:** `docs/superpowers/specs/2026-10-29-boss-awakening-cinematics-design.md`  

## Objectives:

1. **In `js/ai.js` (Combat AI for Awakened Boss)**:
   - In `update(dt)` / `chooseAction(opponent)`:
     - Check `if (this.fighter.isBoss && this.fighter.isAwakened)`:
       - Set enraged baseline: `this.aggro = 1.0; this.reaction = 0.95; this.mistakeChance = 0.0;`
       - Tactical awakened decision tree:
         - Spacing: if distance `dist > 200` and `Math.random() < 0.4` -> trigger `LYNX_TRUE_VANISH`.
         - Pressure: if distance `dist <= 120` and `Math.random() < 0.45` -> trigger `LYNX_FRENZY`.
         - Trap/Range: if distance `120 < dist <= 260` and `Math.random() < 0.35` -> trigger `LYNX_DEMONIC_CLAWS`.
         - Fallback: aggressive combos, jumping attacks, and spells if amulets equipped.

2. **In `js/three_scene.js` (Dynamic 2.5D Demon Lighting)**:
   - In `ThreeScene` class:
     - Add `this.demonLight = new THREE.PointLight(0xd63031, 0, 800, 1.2);` and add it to `this.scene`.
     - In `update(f1, f2, dt)`:
       - Check `const isDemonActive = (f1 && f1.isAwakened) || (f2 && f2.isAwakened);`
       - If active:
         - `const awakenedFighter = (f1 && f1.isAwakened) ? f1 : f2;`
         - Pulse intensity: `this.demonLight.intensity = 2.4 + Math.sin(Date.now() * 0.009) * 0.5;`
         - Position: match fighter's world position or arena center: `this.demonLight.position.set((awakenedFighter.x - 480) * 0.05, 12, 10);`
         - Tint Torii gate and arena floor with deep blood-crimson light.
       - Else:
         - `this.demonLight.intensity = 0;`

3. **In `js/renderer.js` (Demon Form Visual FX)**:
   - In `drawFighter(fighter)`:
     - If `fighter.isAwakened`:
       - Call `this.drawDemonAura(fighter, ctx);`
     - If `fighter.isInvisible`:
       - Do NOT render the main shadow silhouette!
       - ONLY render the two piercing scarlet glowing eyes (`ctx.fillStyle = '#ff1100'; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 12;`) hovering at the head position.
   - Implement `drawDemonAura(fighter, ctx)`:
     - Render rising dark-red/black demonic flame particles (`rgba(214, 48, 49, alpha)`, `rgba(20, 20, 20, alpha)`).
     - Render red glowing eye streak trailing behind the head.
   - Ground claw VFX for `LYNX_DEMONIC_CLAWS`:
     - Render jagged obsidian/crimson claws erupting from floor where the move is active.

4. **Verify**:
   - Write `.scratch/test_boss_ai_lighting.js` verifying AI behavior and ThreeScene demon light properties.
   - Confirm with `node .scratch/test_boss_ai_lighting.js`.

