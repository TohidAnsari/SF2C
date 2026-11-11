/**
 * Shadow Fight 2 Web Edition - Game Configuration & Data Matrix
 */

const CONFIG = {
  CANVAS_WIDTH: 1000,
  CANVAS_HEIGHT: 550,
  GROUND_Y: 450,
  GRAVITY: 0.85,
  FRICTION: 0.82,
  HITSTOP_FRAMES: 4,
  MAX_ROUNDS_TO_WIN: 2,

  WEAPONS: {
    FISTS: {
      id: 'FISTS',
      name: 'Bare Fists',
      cost: 0,
      damage: 10,
      range: 48,
      speed: 1.25,
      weight: 0.8,
      critChance: 0.12,
      dual: false,
      type: 'fists',
      desc: 'Quick martial arts hand-to-hand strikes with cloth-wrapped fists.',
      icon: '👊'
    },
    KNIVES: {
      id: 'KNIVES',
      name: 'Steel Knives',
      cost: 150,
      damage: 15,
      range: 62,
      speed: 1.15,
      weight: 1.0,
      critChance: 0.22,
      dual: true,
      type: 'knives',
      desc: 'Fast twin tactical kunai blades with lethal dual-wielding stabs.',
      icon: '🗡️'
    },
    KATANA: {
      id: 'KATANA',
      name: 'Ninja Katana',
      cost: 400,
      damage: 22,
      range: 92,
      speed: 0.95,
      weight: 1.4,
      critChance: 0.28,
      dual: false,
      type: 'katana',
      desc: 'Long curved blade with wide cutting arcs and scabbard at hip.',
      icon: '⚔️'
    },
    KUSARIGAMA: {
      id: 'KUSARIGAMA',
      name: 'Blood Reaper',
      cost: 850,
      damage: 28,
      range: 135,
      speed: 0.82,
      weight: 2.2,
      critChance: 0.20,
      dual: false,
      type: 'kusarigama',
      desc: 'Chain scythe with extraordinary reach, heavy swinging iron weight, and sweeping power.',
      icon: '⛓️'
    },
    LYNX_CLAWS: {
      id: 'LYNX_CLAWS',
      name: "Lynx's Claws",
      cost: 1500,
      damage: 34,
      range: 78,
      speed: 1.10,
      weight: 1.2,
      critChance: 0.38,
      dual: true,
      type: 'claws',
      desc: 'Vicious curved triple claws mounted on both hands, infused with demonic frenzy.',
      icon: '🐾'
    }
  },

  ARMORS: {
    ROBE: {
      id: 'ROBE',
      name: 'Monk Robe',
      cost: 0,
      defense: 8,
      weight: 0.92,
      style: 'robe',
      desc: 'Lightweight silk martial arts gi allowing swift, fluid movement.'
    },
    LEATHER_VEST: {
      id: 'LEATHER_VEST',
      name: 'Leather Vest',
      cost: 200,
      defense: 22,
      weight: 1.0,
      style: 'vest',
      desc: 'Toughened hide armor with riveted crossing chest straps and shoulder caps.'
    },
    SHADOW_ARMOR: {
      id: 'SHADOW_ARMOR',
      name: 'Shadow Carapace',
      cost: 650,
      defense: 42,
      weight: 1.12,
      style: 'carapace',
      desc: 'Heavy samurai O-Yoroi armor with tiered shoulder sode and steel breastplate.'
    }
  },

  HELMS: {
    HEADBAND: {
      id: 'HEADBAND',
      name: 'Ninja Headband',
      cost: 0,
      defense: 6,
      style: 'headband',
      desc: 'Simple cloth tied tightly around brow with hitai-ate plate and flowing ribbons.'
    },
    IRON_MASK: {
      id: 'IRON_MASK',
      name: 'Iron Face Mask',
      cost: 250,
      defense: 18,
      style: 'mask',
      desc: 'Bolted steel half-mask protecting jaw and face against devastating headshots.'
    },
    WARRIOR_HELM: {
      id: 'WARRIOR_HELM',
      name: 'Kabuto Helm',
      cost: 600,
      defense: 35,
      style: 'kabuto',
      desc: 'Imposing samurai war helm with ornate golden crescent crest and flared shikoro.'
    }
  },

  AMULETS: {
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
  },

  SPELLS: {
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
  },

  MOVES: {
    // --- PUNCH ATTACKS ---
    PUNCH_NEUTRAL: {
      id: 'PUNCH_NEUTRAL',
      name: 'Quick Jab Combo',
      type: 'punch',
      duration: 18,
      hitStart: 5,
      hitEnd: 11,
      reach: 52,
      heightOffset: -65,
      damageMultiplier: 1.0,
      zone: 'torso',
      step: 0.8,
      knockback: 3.5,
      hitstun: 14
    },
    PUNCH_FORWARD: {
      id: 'PUNCH_FORWARD',
      name: 'Double Strike',
      type: 'punch',
      duration: 25,
      hitStart: 7,
      hitEnd: 15,
      reach: 78,
      heightOffset: -60,
      damageMultiplier: 1.45,
      zone: 'torso',
      step: 2.8,
      knockback: 5.5,
      hitstun: 18
    },
    PUNCH_BACK: {
      id: 'PUNCH_BACK',
      name: 'Spinning Backfist',
      type: 'punch',
      duration: 28,
      hitStart: 9,
      hitEnd: 17,
      reach: 70,
      heightOffset: -75,
      damageMultiplier: 1.6,
      zone: 'head',
      step: 1.2,
      knockback: 7.0,
      hitstun: 22
    },
    PUNCH_UP: {
      id: 'PUNCH_UP',
      name: 'Dragon Uppercut',
      type: 'punch',
      duration: 26,
      hitStart: 7,
      hitEnd: 14,
      reach: 50,
      heightOffset: -96,
      damageMultiplier: 1.8,
      zone: 'head',
      step: 0.5,
      knockback: 6.5,
      hitstun: 24
    },
    PUNCH_DOWN: {
      id: 'PUNCH_DOWN',
      name: 'Low Strike',
      type: 'punch',
      duration: 20,
      hitStart: 6,
      hitEnd: 12,
      reach: 58,
      heightOffset: -22,
      damageMultiplier: 0.9,
      zone: 'legs',
      step: 1.0,
      knockback: 3.0,
      hitstun: 15
    },

    // --- KICK ATTACKS ---
    KICK_NEUTRAL: {
      id: 'KICK_NEUTRAL',
      name: 'Front Snap Kick',
      type: 'kick',
      duration: 22,
      hitStart: 6,
      hitEnd: 13,
      reach: 68,
      heightOffset: -52,
      damageMultiplier: 1.1,
      zone: 'torso',
      step: 1.2,
      knockback: 4.5,
      hitstun: 16
    },
    KICK_FORWARD: {
      id: 'KICK_FORWARD',
      name: 'Side Step Thrust',
      type: 'kick',
      duration: 28,
      hitStart: 9,
      hitEnd: 17,
      reach: 90,
      heightOffset: -58,
      damageMultiplier: 1.5,
      zone: 'torso',
      step: 3.5,
      knockback: 7.5,
      hitstun: 20
    },
    KICK_BACK: {
      id: 'KICK_BACK',
      name: 'Spinning Heel Kick',
      type: 'kick',
      duration: 32,
      hitStart: 11,
      hitEnd: 19,
      reach: 84,
      heightOffset: -88,
      damageMultiplier: 1.85,
      zone: 'head',
      step: 1.8,
      knockback: 9.0,
      hitstun: 26
    },
    KICK_UP: {
      id: 'KICK_UP',
      name: 'Axe Kick',
      type: 'kick',
      duration: 30,
      hitStart: 10,
      hitEnd: 18,
      reach: 64,
      heightOffset: -105,
      damageMultiplier: 1.75,
      zone: 'head',
      step: 0.6,
      knockback: 6.0,
      hitstun: 25
    },
    KICK_DOWN: {
      id: 'KICK_DOWN',
      name: 'Sweeping Low Kick',
      type: 'kick',
      duration: 24,
      hitStart: 7,
      hitEnd: 15,
      reach: 80,
      heightOffset: -12,
      damageMultiplier: 1.15,
      zone: 'legs',
      step: 1.8,
      knockback: 6.0,
      trip: true,
      hitstun: 24
    },

    // --- SPECIAL / DEFENSIVE ---
    THROW_CLOSE: {
      id: 'THROW_CLOSE',
      name: 'Shoulder Slam Throw',
      type: 'throw',
      duration: 36,
      hitStart: 4,
      hitEnd: 16,
      reach: 36,
      heightOffset: -50,
      damageMultiplier: 2.2,
      zone: 'torso',
      step: 1.0,
      knockback: 11.0,
      trip: true,
      hitstun: 35
    },
    ROLL_FORWARD: {
      id: 'ROLL_FORWARD',
      name: 'Ground Roll',
      type: 'movement',
      duration: 20,
      invulnerable: true,
      step: 5.5
    },
    BACKFLIP: {
      id: 'BACKFLIP',
      name: 'Acrobatic Backflip',
      type: 'movement',
      duration: 22,
      invulnerable: true,
      step: -5.0
    },
    SHURIKEN: {
      id: 'SHURIKEN',
      name: 'Throwing Shuriken',
      type: 'ranged',
      duration: 24,
      throwFrame: 10,
      damage: 16,
      hitstun: 16,
      hitStart: 8,
      hitEnd: 14,
      reach: 45,
      heightOffset: -65
    },

    // --- AWAKENED BOSS ABILITIES ---
    LYNX_FRENZY: {
      id: 'LYNX_FRENZY',
      name: 'Demonic Claw Frenzy',
      type: 'punch',
      duration: 42,
      hitStart: 6,
      hitEnd: 36,
      reach: 82,
      heightOffset: -60,
      damageMultiplier: 2.2,
      zone: 'torso',
      step: 2.4,
      knockback: 8.5,
      hitstun: 26,
      isAwakenedOnly: true
    },
    LYNX_TRUE_VANISH: {
      id: 'LYNX_TRUE_VANISH',
      name: 'True Shadow Vanish',
      type: 'special',
      duration: 110,
      hitStart: 85,
      hitEnd: 105,
      reach: 90,
      heightOffset: -70,
      damageMultiplier: 2.4,
      zone: 'head',
      step: 0,
      knockback: 9.0,
      hitstun: 28,
      isAwakenedOnly: true
    },
    LYNX_DEMONIC_CLAWS: {
      id: 'LYNX_DEMONIC_CLAWS',
      name: 'Demonic Floor Claws',
      type: 'special',
      duration: 45,
      hitStart: 12,
      hitEnd: 32,
      reach: 250,
      heightOffset: -30,
      damageMultiplier: 2.0,
      zone: 'legs',
      step: 0,
      knockback: 6.0,
      hitstun: 25,
      isAwakenedOnly: true
    }
  },

  OPPONENTS: [
    {
      id: 'shin',
      name: 'Shin',
      title: 'The Young Disciple',
      avatar: '🥋',
      weapon: 'FISTS',
      armor: 'ROBE',
      helm: 'HEADBAND',
      amulet: 'FLAME_AMULET',
      hp: 90,
      aiAggro: 0.35,
      aiReaction: 0.4,
      quote: 'Show me what the shadows taught you!',
      proportions: {
        heightScale: 0.94,
        widthScale: 0.88,
        armThick: 6,
        legThick: 7,
        chestWidth: 14,
        waistWidth: 8.5
      },
      visuals: {
        eyeColor: '#e0f7fa',
        eyeTrailColor: 'rgba(0, 229, 255, 0.35)',
        auraGlow: 'rgba(52, 152, 219, 0.45)',
        stance: 'karate',
        hasGiTrim: true,
        hasPrayerBeads: false,
        hasCape: false,
        hasHorns: false,
        hasEtherealTrail: false,
        hasSpikedPauldrons: false,
        cowlType: 'light_band'
      }
    },
    {
      id: 'ken',
      name: 'Ken',
      title: 'Shaolin Wandering Monk',
      avatar: '📿',
      weapon: 'KNIVES',
      armor: 'LEATHER_VEST',
      helm: 'HEADBAND',
      amulet: 'FLAME_AMULET',
      hp: 110,
      aiAggro: 0.50,
      aiReaction: 0.55,
      quote: 'Steel speaks swifter than words, traveler.',
      proportions: {
        heightScale: 0.98,
        widthScale: 0.98,
        armThick: 7,
        legThick: 8,
        chestWidth: 16.5,
        waistWidth: 9.5
      },
      visuals: {
        eyeColor: '#fff9c4',
        eyeTrailColor: 'rgba(255, 235, 59, 0.4)',
        auraGlow: 'rgba(243, 156, 18, 0.5)',
        stance: 'monk',
        hasGiTrim: false,
        hasPrayerBeads: true,
        hasCape: false,
        hasHorns: false,
        hasEtherealTrail: false,
        hasSpikedPauldrons: false,
        cowlType: 'monk_cowl'
      }
    },
    {
      id: 'brick',
      name: 'Brick',
      title: 'Underground Enforcer',
      avatar: '🧱',
      weapon: 'FISTS',
      armor: 'SHADOW_ARMOR',
      helm: 'IRON_MASK',
      amulet: 'DARK_AMULET',
      hp: 140,
      aiAggro: 0.65,
      aiReaction: 0.50,
      quote: 'You will break against my fists like water on stone!',
      proportions: {
        heightScale: 1.09,
        widthScale: 1.34,
        armThick: 10.5,
        legThick: 12,
        chestWidth: 23,
        waistWidth: 14.5
      },
      visuals: {
        eyeColor: '#ffab91',
        eyeTrailColor: 'rgba(255, 87, 34, 0.4)',
        auraGlow: 'rgba(211, 84, 0, 0.55)',
        stance: 'heavy',
        hasGiTrim: false,
        hasPrayerBeads: false,
        hasCape: false,
        hasHorns: false,
        hasEtherealTrail: false,
        hasSpikedPauldrons: true,
        cowlType: 'iron_plate'
      }
    },
    {
      id: 'needle',
      name: 'Needle',
      title: 'Silent Assassin',
      avatar: '🪡',
      weapon: 'KATANA',
      armor: 'LEATHER_VEST',
      helm: 'IRON_MASK',
      amulet: 'WIND_TALISMAN',
      hp: 125,
      aiAggro: 0.75,
      aiReaction: 0.70,
      quote: 'One stroke through your throat is all I need.',
      proportions: {
        heightScale: 1.05,
        widthScale: 0.84,
        armThick: 6,
        legThick: 7,
        chestWidth: 14.5,
        waistWidth: 8
      },
      visuals: {
        eyeColor: '#b2dfdb',
        eyeTrailColor: 'rgba(38, 166, 154, 0.45)',
        auraGlow: 'rgba(26, 188, 156, 0.45)',
        stance: 'assassin',
        hasGiTrim: false,
        hasPrayerBeads: false,
        hasCape: false,
        hasHorns: false,
        hasEtherealTrail: false,
        hasSpikedPauldrons: false,
        cowlType: 'ninja_mask'
      }
    },
    {
      id: 'ghost',
      name: 'Ghost',
      title: 'Cursed Ronin',
      avatar: '👻',
      weapon: 'KUSARIGAMA',
      armor: 'SHADOW_ARMOR',
      helm: 'WARRIOR_HELM',
      amulet: 'DARK_AMULET',
      hp: 145,
      aiAggro: 0.85,
      aiReaction: 0.80,
      quote: 'The reaper chain claims every foolish shadow.',
      proportions: {
        heightScale: 1.0,
        widthScale: 0.94,
        armThick: 6.8,
        legThick: 7.8,
        chestWidth: 16,
        waistWidth: 9.5
      },
      visuals: {
        eyeColor: '#e1bee7',
        eyeTrailColor: 'rgba(171, 71, 188, 0.6)',
        auraGlow: 'rgba(142, 68, 173, 0.65)',
        stance: 'ronin',
        hasGiTrim: false,
        hasPrayerBeads: false,
        hasCape: true,
        hasHorns: false,
        hasEtherealTrail: true,
        hasSpikedPauldrons: false,
        cowlType: 'straw_ronin'
      }
    },
    {
      id: 'lynx',
      name: 'Lynx',
      title: 'Demon of the Order',
      avatar: '👹',
      isBoss: true,
      weapon: 'LYNX_CLAWS',
      armor: 'SHADOW_ARMOR',
      helm: 'WARRIOR_HELM',
      amulet: 'WIND_TALISMAN',
      hp: 180,
      aiAggro: 0.95,
      aiReaction: 0.90,
      hasSmokeBomb: true,
      quote: 'You insolent shadow! You dare challenge the Demon of the Claws?!',
      proportions: {
        heightScale: 1.03,
        widthScale: 1.14,
        armThick: 8.5,
        legThick: 9.5,
        chestWidth: 19.5,
        waistWidth: 11
      },
      visuals: {
        eyeColor: '#ff1744',
        eyeTrailColor: 'rgba(255, 23, 68, 0.7)',
        auraGlow: 'rgba(231, 76, 60, 0.85)',
        stance: 'predator',
        hasGiTrim: false,
        hasPrayerBeads: false,
        hasCape: false,
        hasHorns: true,
        hasEtherealTrail: false,
        hasSpikedPauldrons: true,
        cowlType: 'demon'
      }
    }
  ],

  DIALOGUES: {
    DISCIPLES: {
      shin: { speaker: 'SHIN', title: 'DISCIPLE', text: 'I have trained under the Master for three winters. Let us test your shadow arts!' },
      ken: { speaker: 'KEN', title: 'MONK', text: 'Steel speaks swifter than words, traveler. Defend yourself!' },
      brick: { speaker: 'BRICK', title: 'ENFORCER', text: 'Your bones will splinter against my fists like brittle bamboo!' },
      needle: { speaker: 'NEEDLE', title: 'ASSASSIN', text: 'Blink, and you will find steel through your throat.' },
      ghost: { speaker: 'GHOST', title: 'CURSED RONIN', text: 'The chain of the reaper never returns empty, stranger.' }
    },
    LYNX_PRE_FIGHT: [
      { speaker: 'SENSEI', title: '師父 SENSEI', side: 'left', portrait: 'sensei', text: 'Shadow, steel your mind. Lynx is no ordinary martial artist—he commands the demonic powers of the Shadows!' },
      { speaker: 'LYNX', title: '山猫 LYNX', side: 'right', portrait: 'lynx', text: 'Hahaha! A wandering silhouette without a face dares challenge the Master of the Claws? Let us see how brightly your blood burns upon my steel!' },
      { speaker: 'SHADOW', title: '影 SHADOW', side: 'left', portrait: 'shadow', text: '...' }
    ],
    LYNX_AWAKENING: [
      { speaker: 'LYNX', title: '山猫 DEMON LYNX', side: 'right', portrait: 'lynx_demon', text: 'Insolent worm! You thought you had pushed me to the brink?! Behold the true curse of the Demon Order!' }
    ],
    LYNX_VICTORY: [
      { speaker: 'LYNX', title: '山猫 LYNX', side: 'right', portrait: 'lynx_defeated', text: 'Impossible... my claws... shattered by a mere mortal shadow... Take the Seal, fool... but the Gates will consume you!' },
      { speaker: 'SENSEI', title: '師父 SENSEI', side: 'left', portrait: 'sensei', text: 'Well fought, Shadow! The first demon of the Order has fallen, and the Seal of the Lynx is in our grasp. The Gates of Shadows await!' }
    ]
  }
};

// Export for module or browser window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}

