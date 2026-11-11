# Magic & Special Jutsu System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the authentic *Shadow Fight 2* Magic & Special Jutsu system in *Shadow Fight 2 Web Edition*, featuring an accumulation Magic Meter, HUD Magic Orb, equippable Amulets in the Armory, 3 unique spell archetypes (Fireball, Dark Eruption, Smoke Teleport), dynamic 2.5D Three.js spell lighting on the 3D Torii Gate and arena, opponent AI casting, and procedural Web Audio SFX.

**Architecture:** A decoupled, event-driven combat magic architecture. Spells are defined declaratively in `config.js` and bound via equipped Amulets in `armory.js`. Meter state is tracked on `Fighter` entities and updated via combat collisions. Active spells are simulated in `fighter.update()`, rendered with authentic Sumi-e & particle effects in `renderer.js`, tracked by dynamic point lights in `three_scene.js`, and triggered by keyboard (`U`) or virtual touch controls.

**Tech Stack:** JavaScript (ES6+), Canvas 2D, Three.js (r128), Web Audio API, Playwright.

**Spec:** [`docs/superpowers/specs/2026-10-29-magic-jutsu-system-design.md`](file:///d:/OLLAMA/SF2C/docs/superpowers/specs/2026-10-29-magic-jutsu-system-design.md)

## Global Constraints
- Standalone execution: all assets, scripts, and spell visuals must run 100% offline.
- Zero regression on existing 8-way movement, 2-bone IK kinematics, 2.5D background rendering, or tournament progression.
- Graceful degradation: all spells and effects operate cleanly in 2D mode if WebGL is disabled.
- Verification gate: every task must be verified with automated unit tests or Playwright scripts before advancing.

---

## File Structure & Responsibilities

- `js/config.js`: Declarative `AMULETS` dictionary, `SPELLS` matrix (damage, velocity, burn parameters, light colors), and opponent amulet assignments.
- `js/audio.js`: Procedural Web Audio synthesizers for spell charge hum, fireball ignite/whoosh, subterranean dark eruption rumble, and smoke teleport poof.
- `js/input.js`: Input mapping for key `U` (`KeyU`) and virtual touch magic button.
- `js/fighter.js`: Fighter entity magic meter management (`magicMeter`), clean hit/guard/critical charge increments, spell spawning, projectile trajectory, juggle physics, and burning DoT status effect.
- `js/renderer.js`: Visual rendering of active spells (Fireball plasma + trail, Dark Eruption obsidian spires, Smoke Teleport cloud + afterimage), burning outline FX, and HUD spherical Magic Orb with pulsing flare at 100%.
- `js/three_scene.js`: Dynamic 2.5D spell point light system tracking active projectiles/eruptions and casting real-time colored illumination onto the 3D Torii Gate, lanterns, and arena floor.
- `js/armory.js`: 4th Armory category for Amulets & Talismans, buy/equip mechanics, localStorage persistence, and 3D Inspector integration.
- `js/ai.js`: AI opponent tactical magic casting logic based on distance, player state, and equipped amulet.
- `index.html`: Virtual touch Magic button (`#btn-magic`) and HUD Magic Orb elements.
- `css/style.css`: Styling for HUD Magic Orbs, virtual touch magic button, and Amulet armory cards.

---

## Tasks

### Task 1: Configuration, Data Models & Procedural Audio Assets
- [x] In `js/config.js`, add `CONFIG.AMULETS`:
  - `FLAME_AMULET`: `spellId: 'FIREBALL'`, `cost: 300`, `icon: '🔥'`, `element: 'fire'`, `bonusText: '+32 Fire DMG & 3s Burn'`
  - `DARK_AMULET`: `spellId: 'DARK_ERUPTION'`, `cost: 750`, `icon: '🌑'`, `element: 'dark'`, `bonusText: '+42 Shadow DMG & Juggle Launch'`
  - `WIND_TALISMAN`: `spellId: 'SMOKE_TELEPORT'`, `cost: 1200`, `icon: '🌪️'`, `element: 'wind'`, `bonusText: 'Invulnerable Vanish & Ambush'`
- [x] In `js/config.js`, add `CONFIG.SPELLS`:
  - `FIREBALL`: `damage: 32`, `burnDamage: 12`, `burnDuration: 180`, `speed: 14.0`, `lightColor: 0xff6600`, `radius: 18`
  - `DARK_ERUPTION`: `damage: 42`, `launchForce: -14.0`, `lightColor: 0x9933ff`, `width: 65`, `height: 120`
  - `SMOKE_TELEPORT`: `damage: 24`, `invulnFrames: [4, 16]`, `lightColor: 0x4466aa`
- [x] In `js/audio.js`, implement procedural Web Audio synthesizers:
  - `playSpellReady()`: High-frequency resonant shimmer chime when meter hits 100%.
  - `playFireballIgnite()`: Deep explosive whoosh with roaring band-pass filtered noise.
  - `playDarkEruption()`: Sub-bass tectonic rumble followed by sharp stone crack.
  - `playSmokeTeleport()`: Airy dispersion puff with rapid pitch drop.
- [x] Verify configuration and audio methods with Node syntax and unit test script `.scratch/test_config_audio.js`.

### Task 2: Fighter Magic Meter & Spell Physics Engine
- [x] In `js/input.js`, bind key `U` (`e.code === 'KeyU'`) to `inputState.magic`.
- [x] In `js/fighter.js`, initialize properties:
  - `magicMeter = 0.0`, `amulet = 'FLAME_AMULET'`, `activeMagicSpells = []`, `isBurning = false`, `burnTimer = 0`, `burnTickTimer = 0`, `isInvulnerable = false`.
- [x] Implement meter accumulation methods:
  - `addMagic(amount)`: increments `magicMeter` up to 100.0, triggers `playSpellReady()` when crossing 100.0.
  - On hit landed: `+14.0` (or `+25.0` on critical hit).
  - On hit guarded: `+8.0`.
  - On damage taken: `+6.0`.
- [x] Implement `castMagic(opponent, sceneRenderer)`:
  - Validates `canCastMagic()`.
  - Deducts `100.0` meter.
  - Spawns spell instance based on `this.amulet`:
    - `FIREBALL`: linear projectile with `x, y, vx: 14 * facing, radius: 18, life: 60`.
    - `DARK_ERUPTION`: targeted AoE spawned at `x = opponent.x, y = GROUND_Y, delay: 12, life: 35`.
    - `SMOKE_TELEPORT`: sets `isInvulnerable = true`, schedules instant teleport to `opponent.x - (70 * opponent.facing)` after 8 frames, followed by surprise strike.
- [x] Implement spell update and collision handling in `fighter.update()`:
  - Fireball: advances `x += vx`, detects opponent hurtbox, applies 32 damage + applies `isBurning = true` for 180 frames.
  - Dark Eruption: when `delay <= 0`, erupts upward, detects opponent collision, applies 42 damage, and sets `opponent.vy = -14.0` (airborne juggle).
  - Burning tick: decrements `burnTimer`, every 60 frames applies 4 chip damage and spawns floating combat text `🔥 4`.
- [x] Verify physics, meter transitions, and collisions via Node test script `.scratch/test_fighter_magic.js`.

### Task 3: 2D HUD Magic Orb & Visual Spell VFX
- [x] In `js/renderer.js`, implement `drawMagicOrbs(p1, p2)`:
  - Positioned directly below P1 and P2 health bars in the HUD.
  - Spherical jewel orb with dark gold bezel.
  - Radial fluid fill reflecting current `magicMeter / 100`.
  - When `magicMeter >= 100`: renders energetic swirling flame corona and pulsating bloom.
- [x] In `js/renderer.js`, implement `drawActiveSpells(p1, p2)`:
  - **Fireball**: White-hot plasma core (`#ffffff`), surrounded by radiant orange-red corona (`#ff5500`), emitting continuous particle smoke trail and expanding shockwave upon collision.
  - **Dark Eruption**: Jagged shadowy obsidian spires erupting from ground fissures with deep violet particles (`#9b59b6`) and purple glow.
  - **Smoke Teleport**: Expanding circular plume of Sumi-e Japanese ink smoke with fading afterimages.
- [x] In `js/renderer.js`, implement `drawBurnStatus(fighter)`:
  - Rising embers and flickering orange silhouette edge highlighting while `isBurning` is active.

### Task 4: 2.5D Dynamic Spell Lighting Subsystem
- [x] In `js/three_scene.js`, add `this.spellLight = new THREE.PointLight(0xff6600, 0, 18)` to the WebGL scene.
- [x] Implement `updateSpellLighting(p1, p2)`:
  - Checks if either fighter has an active `FIREBALL`, `DARK_ERUPTION`, or `SMOKE_TELEPORT`.
  - If Fireball is airborne:
    - Maps 2D position `(x, y)` to 3D world coordinates `((x - 500) * 0.015, (450 - y) * 0.015, -1.5)`.
    - Sets `spellLight.color.setHex(0xff5500)`.
    - Sets `spellLight.intensity = 2.6 + Math.random() * 0.4`.
    - Illuminates the 3D Torii Gate, lanterns, and floor dynamically in real-time as the fireball passes!
  - If Dark Eruption:
    - Positions light at eruption X with violet color (`0x9933ff`), intensity pulse up to `3.2`.
  - If no active spell:
    - Smoothly lerps `spellLight.intensity` back to `0.0`.
- [x] Verify Three.js dynamic spell light updates cleanly without memory leak or performance degradation.

### Task 5: Armory Amulets Section & Controls Integration
- [x] In `js/armory.js`:
  - Initialize `this.equipped.amulet = 'FLAME_AMULET'`.
  - Initialize `this.owned.amulets = ['FLAME_AMULET']`.
  - Update `loadSave()` and `save()` to persist `amulet` and `owned.amulets` in `localStorage`.
  - Implement `buyAmulet(amuletId)` and `equipAmulet(amuletId)`.
  - Update `inspectItem(category, id)` to handle `'amulet'`.
- [x] In `js/armory.js`, update `updateUI()`:
  - Render `🔮 Mystical Amulets & Talismans` grid with cards for `FLAME_AMULET`, `DARK_AMULET`, and `WIND_TALISMAN`.
  - Add "🔍 3D" inspect button and "EQUIP" / "BUY" actions.
- [x] In `index.html`:
  - Add on-screen virtual Magic Orb button: `<button id="btn-magic" class="action-btn btn-magic" title="Cast Magic (U)">🔮</button>` in `#touch-controls`.
- [x] In `css/style.css`:
  - Style `.btn-magic` with glowing violet/amber gradient border and active pulse.
  - Style HUD Magic Orbs and Amulet armory cards.

### Task 6: Tournament Opponents & AI Magic Casting
- [x] In `js/config.js`, assign thematic amulets to tournament opponents:
  - `SHIN`: `amulet: 'FLAME_AMULET'`
  - `BRICK`: `amulet: 'DARK_AMULET'`
  - `NEEDLE`: `amulet: 'WIND_TALISMAN'`
  - `GHOST`: `amulet: 'DARK_AMULET'`
  - `LYNX`: `amulet: 'WIND_TALISMAN'`
- [x] In `js/ai.js`, implement AI magic decision matrix in `ai.update(player)`:
  - When `opponent.canCastMagic()`:
    - If `FLAME_AMULET`: triggers cast when `dist > 220px`.
    - If `DARK_AMULET`: triggers cast when `player.state === 'IDLE'` or `player.state === 'ATTACKING'`.
    - If `WIND_TALISMAN`: triggers cast when player initiates an attack, counter-teleporting behind them.
- [x] In `js/tournament.js`, display the opponent's equipped Amulet icon in the stage match cards.

### Task 7: Automated Playwright Verification & Visual Evidence
- [x] Create automated Playwright verification test `.scratch/verify_magic_system.js`:
  - Test 1: Verify HUD Magic Orb renders and fills as strikes land.
  - Test 2: Cast `FIREBALL`, verify projectile flight, 2.5D Torii Gate dynamic lighting, and burning status effect (capture `magic_1_fireball.png`).
  - Test 3: Cast `DARK_ERUPTION`, verify subterranean obsidian spires and juggle launch physics (capture `magic_2_dark_eruption.png`).
  - Test 4: Cast `SMOKE_TELEPORT`, verify smoke vanish and ambush repositioning (capture `magic_3_smoke_teleport.png`).
  - Test 5: Open Armory, verify `🔮 Mystical Amulets & Talismans` category, buy and equip amulets (capture `magic_4_armory_amulets.png`).
  - Test 6: Verify 0 console errors and clean 60fps performance.
- [x] Generate comprehensive verification report artifact with visual gallery.

