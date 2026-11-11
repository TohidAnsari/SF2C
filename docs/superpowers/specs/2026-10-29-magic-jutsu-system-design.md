# Magic & Special Jutsu System Design Document

**Date:** 2026-10-29  
**Status:** Approved  
**Target:** Shadow Fight 2 — Web Edition  
**Subsystem:** Combat Magic, Amulet Equipment, 2.5D Spell Lighting, & AI Jutsu Casting  

---

## 1. Executive Summary

This specification defines the architecture, mechanics, rendering, and progression systems for the **Magic & Special Jutsu System** in *Shadow Fight 2 — Web Edition*. 

The system introduces a full magical combat dimension:
- **Magic Resource Meter**: Spherical Magic Orb charged by martial actions (strikes, parries, criticals).
- **Equippable Amulets & Talismans**: A 4th Armory category where equipped amulets bind specific spells to the player.
- **Three Distinct Spell Archetypes**:
  1. **Fireball (*Katon*)**: High-velocity projectile with lingering burn chip damage.
  2. **Dark Eruption (*Kage Kenzan*)**: Underground subterranean spires launching the enemy into juggle state.
  3. **Smoke Teleport (*Shunshin*)**: Invulnerable vanish and sudden back-stab repositioning.
- **2.5D Dynamic Lighting**: Spells emit Three.js point lights that realistically illuminate the 3D Torii Gate, lanterns, and floor.
- **Opponent & AI Jutsu**: Tournament opponents build magic and cast their own thematic spells.
- **Web Audio Synthesis**: Procedural audio effects for mystical chanting, flaming projectiles, ground eruptions, and smoke poofs.

---

## 2. Mathematical Model & Combat Rules

### 2.1 Magic Meter Accumulation
The Magic Meter is modeled as a floating-point value in the range `[0.0, 100.0]`.
- **Base Rate**: `0.0` at the start of every round.
- **Clean Strike Landed**: `+14.0%`
- **Critical Strike Landed**: `+25.0%`
- **Successful Guard / Block**: `+8.0%`
- **Damage Received (Chip / Hit)**: `+6.0%`
- **Spell Cost**: Casting consumes `100.0%` of the meter.
- **Readiness State**: When `magicMeter >= 100.0`, `isMagicReady = true`. The HUD Magic Orb transitions to a glowing, pulsing state with particle flares.

### 2.2 Spell Archetypes & Specifications

| Spell Name | Key ID | Bound Amulet | Type | Damage | Cast Time | Active Time | Properties |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Fireball** (*Katon: Gōkakyū*) | `FIREBALL` | `FLAME_AMULET` | Linear Projectile | 32 direct + 12 burn | 18 frames | 60 frames (travel) | Speed `14.0` px/f, unblockable chip, inflicts 3s burn (`4 dmg/s`). |
| **Dark Eruption** (*Kage Kenzan*) | `DARK_ERUPTION` | `DARK_AMULET` | Targeted AoE | 42 direct | 22 frames | 35 frames | Erupts under opponent X. Vertical launch velocity `vy = -14.0` (juggle state). |
| **Smoke Teleport** (*Shunshin*) | `SMOKE_TELEPORT` | `WIND_TALISMAN` | Utility / Ambush | 24 sneak attack | 12 frames | 20 frames | Invulnerability during frames 4–16. Reappears `70px` behind target facing their back. |

### 2.3 Status Effect: Burning (DoT)
When hit by `FIREBALL`:
- Target receives `isBurning = true` for `180` frames (3 seconds at 60fps).
- Every `60` frames, target takes `4` burn damage (ignores armor).
- Visual FX: Glowing orange ember sparks rise from the fighter's silhouette, accompanied by faint smoke puffs.

---

## 3. Data Structures (`js/config.js`)

```javascript
CONFIG.AMULETS = {
  FLAME_AMULET: {
    id: 'FLAME_AMULET',
    name: 'Flame Amulet',
    spellId: 'FIREBALL',
    cost: 300,
    icon: '🔥',
    element: 'fire',
    bonusText: '+32 Direct Fire DMG & 3s Burn',
    desc: 'Forged in volcanic embers. Unleashes a blazing fire orb that incinerates enemies.'
  },
  DARK_AMULET: {
    id: 'DARK_AMULET',
    name: 'Dark Amulet',
    spellId: 'DARK_ERUPTION',
    cost: 750,
    icon: '🌑',
    element: 'dark',
    bonusText: '+42 Shadow DMG & Juggle Launch',
    desc: 'Infused with Nether realm energy. Calls forth shadowy obsidian spires from beneath the foe.'
  },
  WIND_TALISMAN: {
    id: 'WIND_TALISMAN',
    name: 'Wind Talisman',
    spellId: 'SMOKE_TELEPORT',
    cost: 1200,
    icon: '🌪️',
    element: 'wind',
    bonusText: 'Invulnerable Vanish & Behind Ambush',
    desc: 'Ancient ninja stealth charm. Dissolves the user in black smoke to strike from behind.'
  }
};

CONFIG.SPELLS = {
  FIREBALL: {
    id: 'FIREBALL',
    name: 'Fireball',
    damage: 32,
    burnDamage: 12,
    burnDuration: 180,
    speed: 14.0,
    lightColor: 0xff6600,
    radius: 18
  },
  DARK_ERUPTION: {
    id: 'DARK_ERUPTION',
    name: 'Dark Eruption',
    damage: 42,
    launchForce: -14.0,
    lightColor: 0x9933ff,
    width: 65,
    height: 120
  },
  SMOKE_TELEPORT: {
    id: 'SMOKE_TELEPORT',
    name: 'Smoke Teleport',
    damage: 24,
    invulnFrames: [4, 16],
    lightColor: 0x4466aa
  }
};
```

---

## 4. Component Interaction & State Flow

```
[User Input: Key 'U' or Virtual Magic Button]
                  │
                  ▼
         [Fighter.castMagic()]
                  │
        Check: meter >= 100?
             /          \
           No           Yes
          /               \
       [Ignore]       [Consume 100% Meter]
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
        [FIREBALL]   [DARK_ERUPTION] [SMOKE_TELEPORT]
       Spawn Proj     Target X Spire  Vanish & Reposition
             │             │             │
             └─────────────┼─────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
  [2D Action Canvas]            [3D WebGL ThreeScene]
• Spell VFX Rendering         • Dynamic Point Light
• Fighter Burn Particles      • Casts Light on Torii & Floor
• Juggle / Knockback Physics  • Screen Color Tint Pulse
```

---

## 5. Subsystem Implementations

### 5.1 Fighter Entity (`js/fighter.js`)
- **Properties**:
  - `magicMeter`: float `[0.0, 100.0]` (defaults to `0.0`).
  - `amulet`: string (e.g. `'FLAME_AMULET'`).
  - `activeSpells`: Array of active projectile/AoE spell instances.
  - `isBurning`: boolean, with `burnTimer` and `burnTickTimer`.
  - `isInvulnerable`: boolean (set during smoke teleport vanish).
- **Methods**:
  - `addMagic(amount)`: increments `magicMeter`, clamped at `100.0`.
  - `canCastMagic()`: returns `magicMeter >= 100.0 && state !== 'HITSTUN' && state !== 'KNOCKED_DOWN'`.
  - `castMagic(opponent, sceneRenderer)`: triggers spell casting animation, deducts `100.0` meter, spawns active spell entity, and triggers procedural audio.
  - `updateMagic(opponent, sceneRenderer)`: advances projectile travel, checks hitboxes against `opponent`, handles juggle velocities, and decrements burn timers.

### 5.2 2D Rendering & HUD (`js/renderer.js`)
- **HUD Magic Orb**:
  - Rendered below health bars (Player 1 on left, Opponent on right).
  - Octagonal/Spherical jewel badge with radial gradient filling as meter rises.
  - When `meter >= 100.0`: renders an animated swirling magical flare (`Math.sin(time * 8)`) and high-intensity bloom glow.
- **Spell VFX**:
  - **Fireball**: Core white-orange gradient circle, trailing flame particles with randomized size decay, and expanding impact fireball shockwave.
  - **Dark Eruption**: 5 overlapping jagged dark obsidian spikes rising rapidly from the ground with purple particle smoke.
  - **Smoke Teleport**: Expanding circular cloud of Sumi-e calligraphic ink smoke with afterimage ghost trailing.
- **Burning Status Effect**:
  - While `fighter.isBurning`, small flame embers float up from the fighter's joints with an orange silhouette glow.

### 5.3 2.5D Dynamic Lighting (`js/three_scene.js`)
- Add dynamic spell light handles:
  - `this.spellLight = new THREE.PointLight(0xff6600, 0, 18);`
  - Added to the 3D scene.
- During `update(deltaTime)`:
  - If a Fireball is airborne at 2D coordinate `(spell.x, spell.y)`:
    - Map 2D position to 3D world: `spellLight.position.set((spell.x - 500) * 0.015, (450 - spell.y) * 0.015, -1.5)`.
    - Set `spellLight.intensity = 2.5 + Math.random() * 0.5`.
    - Set `spellLight.color.setHex(0xff5500)`.
    - The 3D Torii Gate and lanterns dynamically light up as the fireball streaks past them!
  - When spell terminates, fade `spellLight.intensity` smoothly to `0`.

### 5.4 AI Magic Casting (`js/ai.js`)
- Tournament opponents are assigned amulets based on their identity:
  - *Shin* (Novice): `FLAME_AMULET`
  - *Brick* (Heavy): `DARK_AMULET`
  - *Needle* (Assassin): `WIND_TALISMAN`
  - *Ghost* (Ronin): `DARK_AMULET`
  - *Lynx* (Demon Boss): `WIND_TALISMAN` + Demon Frenzy
- In `ai.update()`:
  - When `opponent.magicMeter >= 100`:
    - If `FLAME_AMULET`: cast when distance > `220px` (ranged attack).
    - If `DARK_AMULET`: cast when player is stationary or attacking.
    - If `WIND_TALISMAN`: cast when player attempts an attack to dodge and counter.

### 5.5 Armory Amulets Section (`js/armory.js`)
- In `ArmoryManager`:
  - `this.equipped.amulet = 'FLAME_AMULET'`.
  - `this.owned.amulets = ['FLAME_AMULET']`.
- In `updateUI()`:
  - Add section: `🔮 Mystical Amulets & Jutsu Talismans`.
  - Cards displaying amulet icon, spell name, damage, special properties, and "EQUIP" / "BUY" buttons.
  - Integrated with 3D Inspector: Inspecting an amulet displays the spinning magical talisman with pulsing runic glow.

### 5.6 Audio Synthesis (`js/audio.js`)
- `playSpellCast()`: High-frequency shimmering energy charge sound.
- `playFireballIgnite()`: Deep whoosh with roaring flame resonance.
- `playDarkEruption()`: Sub-bass rumble followed by sharp tectonic stone crack.
- `playSmokePoof()`: Sudden airy dispersion puff.

---

## 6. Verification & Acceptance Criteria

1. **Meter Charging**: Clean hits, blocks, and criticals accurately increment the magic meter.
2. **Casting Trigger**: Pressing `U` (or tapping touch orb) at 100% meter casts the equipped amulet's spell and resets the meter to 0.
3. **Spell Mechanics**:
   - Fireball travels across screen, deals damage, and applies 3-second burning DoT.
   - Dark Eruption spawns under opponent, deals damage, and launches them into juggle state.
   - Smoke Teleport grants invulnerability, repositions behind enemy, and enables surprise strike.
4. **2.5D Lighting**: Three.js point light tracks active spells and illuminates the 3D Torii Gate and arena scenery.
5. **Armory Integration**: Players can purchase and equip different amulets in the Armory, persisting to localStorage.
6. **Automated Playwright Suite**: Verification script executes all 3 spells, validates HUD meter charge, captures screenshots, and reports 0 console errors.

