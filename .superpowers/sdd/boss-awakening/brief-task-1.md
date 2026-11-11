# Task 1 Brief: Narrative Data Models & Procedural Audio Assets

**Plan:** `docs/superpowers/plans/2026-10-29-boss-awakening-cinematics.md`  
**Spec:** `docs/superpowers/specs/2026-10-29-boss-awakening-cinematics-design.md`  

## Objectives:

1. **In `js/config.js`**, define `CONFIG.DIALOGUES`:
   - `DISCIPLES`:
     - `shin`: `{ speaker: 'SHIN', title: 'DISCIPLE', text: 'I have trained under the Master for three winters. Let us test your shadow arts!' }`
     - `ken`: `{ speaker: 'KEN', title: 'MONK', text: 'Steel speaks swifter than words, traveler. Defend yourself!' }`
     - `brick`: `{ speaker: 'BRICK', title: 'ENFORCER', text: 'Your bones will splinter against my fists like brittle bamboo!' }`
     - `needle`: `{ speaker: 'NEEDLE', title: 'ASSASSIN', text: 'Blink, and you will find steel through your throat.' }`
     - `ghost`: `{ speaker: 'GHOST', title: 'CURSED RONIN', text: 'The chain of the reaper never returns empty, stranger.' }`
   - `LYNX_PRE_FIGHT`: array of 3 dialogue frames:
     - Frame 0: `{ speaker: 'SENSEI', title: '師父 SENSEI', side: 'left', portrait: 'sensei', text: 'Shadow, steel your mind. Lynx is no ordinary martial artist—he commands the demonic powers of the Shadows!' }`
     - Frame 1: `{ speaker: 'LYNX', title: '山猫 LYNX', side: 'right', portrait: 'lynx', text: 'Hahaha! A wandering silhouette without a face dares challenge the Master of the Claws? Let us see how brightly your blood burns upon my steel!' }`
     - Frame 2: `{ speaker: 'SHADOW', title: '影 SHADOW', side: 'left', portrait: 'shadow', text: '...' }`
   - `LYNX_AWAKENING`: array of 1 dramatic transformation line:
     - Frame 0: `{ speaker: 'LYNX', title: '山猫 DEMON LYNX', side: 'right', portrait: 'lynx_demon', text: 'Insolent worm! You thought you had pushed me to the brink?! Behold the true curse of the Demon Order!' }`
   - `LYNX_VICTORY`: array of 2 lines:
     - Frame 0: `{ speaker: 'LYNX', title: '山猫 LYNX', side: 'right', portrait: 'lynx_defeated', text: 'Impossible... my claws... shattered by a mere mortal shadow... Take the Seal, fool... but the Gates will consume you!' }`
     - Frame 1: `{ speaker: 'SENSEI', title: '師父 SENSEI', side: 'left', portrait: 'sensei', text: 'Well fought, Shadow! The first demon of the Order has fallen, and the Seal of the Lynx is in our grasp. The Gates of Shadows await!' }`

2. **In `js/config.js`**, add `CONFIG.MOVES`:
   - `LYNX_FRENZY`: `{ id: 'LYNX_FRENZY', name: 'Demonic Claw Frenzy', type: 'punch', duration: 42, hitStart: 6, hitEnd: 36, reach: 82, heightOffset: -60, damageMultiplier: 2.2, zone: 'torso', step: 2.4, knockback: 8.5, hitstun: 26, isAwakenedOnly: true }`
   - `LYNX_TRUE_VANISH`: `{ id: 'LYNX_TRUE_VANISH', name: 'True Shadow Vanish', type: 'special', duration: 110, hitStart: 85, hitEnd: 105, reach: 90, heightOffset: -70, damageMultiplier: 2.4, zone: 'head', step: 0, knockback: 9.0, hitstun: 28, isAwakenedOnly: true }`
   - `LYNX_DEMONIC_CLAWS`: `{ id: 'LYNX_DEMONIC_CLAWS', name: 'Demonic Floor Claws', type: 'special', duration: 45, hitStart: 12, hitEnd: 32, reach: 250, heightOffset: -30, damageMultiplier: 2.0, zone: 'legs', step: 0, knockback: 6.0, hitstun: 25, isAwakenedOnly: true }`

3. **In `js/audio.js`**, implement procedural Web Audio synthesizers:
   - `playBossRoar()`: Dual-oscillator sub-bass frequency-modulated growl with low-pass resonance sweep.
   - `playDemonicThunder()`: Explosive white-noise burst with sharp exponential decay and bass boom.
   - `playDialogueChime()`: Resonant bamboo percussion tap on each text line.
   - `playSealAcquired()`: Multi-tone harmonious celestial gong celebrating Act I victory.

4. **Verify**:
   - Write `.scratch/test_cinematics_audio.js` testing `CONFIG.DIALOGUES`, `CONFIG.MOVES`, and `Sound` synthesizer methods.
   - Run `node .scratch/test_cinematics_audio.js` and ensure it exits with code 0.

