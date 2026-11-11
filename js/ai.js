/**
 * Shadow Fight 2 Web Edition - Tactical Combat AI
 * Implements martial-arts spacing, reactive auto-blocking, whiff punishment,
 * combo chaining, and Boss abilities (Lynx Smoke Bomb).
 */

class CombatAI {
  constructor(fighter, difficultyProfile = {}) {
    this.fighter = fighter;
    this.aggro = difficultyProfile.aiAggro || 0.6;
    this.reaction = difficultyProfile.aiReaction || 0.55;
    this.hasSmokeBomb = difficultyProfile.hasSmokeBomb || false;

    this.decisionTimer = 0;
    this.smokeBombTimer = 240; // Every ~4 seconds for Lynx
    this.intendedAction = null;
  }

  update(player) {
    if (this.fighter.isBoss && this.fighter.isAwakened) {
      this.aggro = 1.0;
      this.reaction = 0.95;
    }

    if (this.fighter.state !== 'IDLE') return null;

    const dist = Math.abs(player.x - this.fighter.x);
    const facing = this.fighter.facing;

    // Boss Lynx Smoke Bomb mechanic
    if (this.hasSmokeBomb) {
      this.smokeBombTimer--;
      if (this.smokeBombTimer <= 0) {
        this.fighter.isInvisible = true;
        this.fighter.invisibleTimer = 180; // 3 seconds invisibility
        this.smokeBombTimer = 360;
        window.Sound.playWhoosh(120, 0.3);
      }
    }

    // Tactical Magic Jutsu Casting Decision Matrix
    if (this.fighter.canCastMagic()) {
      const amulet = this.fighter.amulet || 'FLAME_AMULET';
      if (amulet === 'FLAME_AMULET') {
        // Fireball cast from long/mid range
        if (dist > 180 && Math.random() < 0.65) {
          return { magic: true };
        }
      } else if (amulet === 'DARK_AMULET') {
        // Dark Eruption: subterranean spires target player anywhere
        if ((player.state === 'IDLE' || player.state === 'ATTACKING') && Math.random() < 0.7) {
          return { magic: true };
        }
      } else if (amulet === 'WIND_TALISMAN') {
        // Smoke Teleport: reactionary counter-teleport when player attacks
        if (player.state === 'ATTACKING' && Math.random() < 0.85) {
          return { magic: true };
        } else if (dist > 200 && Math.random() < 0.45) {
          return { magic: true };
        }
      }
    }

    // Reaction check against player's incoming attacks
    if (player.state === 'ATTACKING' && Math.random() < this.reaction) {
      if (this.fighter.isBoss && this.fighter.isAwakened) {
        if (dist < 120 && Math.random() < 0.45) {
          return { move: 'LYNX_FRENZY' };
        }
        return { back: true }; // Instant guard
      }
      if (player.currentMove && dist < 160) {
        // High level AI blocks or dodges
        if (player.currentMove.zone === 'head' && Math.random() < 0.45) {
          return { down: true, doubleForward: true }; // duck/roll under
        }
        return { back: true }; // Guard stance
      }
    }

    // Periodic decision cycle
    this.decisionTimer--;
    if (this.decisionTimer <= 0) {
      this.decisionTimer = Math.max(12, Math.floor(35 - this.reaction * 20));
      return this.makeTacticalDecision(player, dist);
    }

    return this.intendedAction;
  }

  makeTacticalDecision(player, dist) {
    const rand = Math.random();
    const action = {
      up: false,
      down: false,
      left: false,
      right: false,
      forward: false,
      back: false,
      punch: false,
      kick: false,
      ranged: false,
      magic: false,
      doubleForward: false,
      doubleBack: false
    };

    // Awakened Boss AI Special Decision Matrix
    if (this.fighter.isBoss && this.fighter.isAwakened) {
      // Distance > 200: 55% chance to trigger LYNX_TRUE_VANISH
      if (dist > 200 && Math.random() < 0.55) {
        const moveAction = { move: 'LYNX_TRUE_VANISH' };
        this.intendedAction = moveAction;
        return moveAction;
      }
      // Distance <= 120: 60% chance to trigger LYNX_FRENZY
      if (dist <= 120 && Math.random() < 0.60) {
        const moveAction = { move: 'LYNX_FRENZY' };
        this.intendedAction = moveAction;
        return moveAction;
      }
      // Distance between 120 and 260: 50% chance to trigger LYNX_DEMONIC_CLAWS
      if (dist > 120 && dist <= 260 && Math.random() < 0.50) {
        const moveAction = { move: 'LYNX_DEMONIC_CLAWS' };
        this.intendedAction = moveAction;
        return moveAction;
      }

      // Fallback: aggressive moves, jumping kicks, and magic jutsu if available
      if (this.fighter.canCastMagic && this.fighter.canCastMagic() && Math.random() < 0.65) {
        action.magic = true;
        this.intendedAction = action;
        return action;
      }

      if (dist > 160) {
        if (Math.random() < 0.5) {
          action.up = true;
          action.forward = true;
          action.kick = true; // Jumping kick
        } else {
          action.forward = true;
          action.punch = true; // Aggressive forward punch
        }
      } else {
        if (Math.random() < 0.5) {
          action.forward = true;
          action.punch = true;
        } else {
          action.forward = true;
          action.kick = true;
        }
      }

      this.intendedAction = action;
      return action;
    }

    if (this.fighter.canCastMagic() && rand < 0.6) {
      action.magic = true;
      this.intendedAction = action;
      return action;
    }

    // Range-Based Tactical Tree:
    if (dist > 230) {
      // Long distance
      if (rand < 0.25 && this.fighter.shurikenCooldown <= 0) {
        action.ranged = true; // Throw Shuriken
      } else if (rand < 0.65) {
        action.forward = true; // Close the gap
      } else if (rand < 0.85) {
        action.up = true;
        action.forward = true;
        action.kick = true; // Flying Dragon Kick
      } else {
        action.forward = true;
      }
    } else if (dist > 110) {
      // Mid distance (Ideal weapon attack range)
      if (rand < this.aggro * 0.4) {
        action.forward = true;
        action.punch = true; // Forward strike / Double slash
      } else if (rand < this.aggro * 0.75) {
        action.forward = true;
        action.kick = true; // Forward step kick
      } else if (rand < 0.9) {
        action.forward = true; // Step closer
      } else {
        action.back = true; // Spacing back
      }
    } else {
      // Close quarter combat (< 110)
      if (rand < 0.25) {
        action.punch = true; // Quick jab
      } else if (rand < 0.45) {
        action.down = true;
        action.kick = true; // Sweeping low kick
      } else if (rand < 0.65) {
        action.up = true;
        action.punch = true; // Uppercut
      } else if (rand < 0.82) {
        action.back = true;
        action.punch = true; // Spinning backfist
      } else if (dist < 46 && rand < 0.95) {
        action.forward = true;
        action.punch = true; // Close Shoulder Slam
      } else {
        action.doubleBack = true; // Backflip retreat
      }
    }

    this.intendedAction = action;
    return action;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CombatAI;
} else {
  window.CombatAI = CombatAI;
}

