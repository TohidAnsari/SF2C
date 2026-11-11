/**
 * Shadow Fight 2 Web Edition - Enhanced Fighter Entity & Combat Mechanics
 * Features:
 * - Ghost Health Damage Tracking (Lagging Yellow Health Drain)
 * - Combo Counter & Multi-Hit Tracking
 * - Floating Combat Text Notifications (Critical, Head Hit, Blocked, Shocked)
 * - Dedicated Roll (Space/Button) & Manual Guard (Shift/Button)
 * - Skeletal Hitbox & Hurtbox Collision
 * - Magic & Special Jutsu System (Fireball, Dark Eruption, Smoke Teleport, Magic Meter)
 */

class Fighter {
  constructor(x, config = {}) {
    this.x = x;
    this.y = window.CONFIG.GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = config.facing || 1;
    this.name = config.name || 'Shadow';
    this.glow = config.glow || 'rgba(230, 126, 34, 0.45)';
    this.isAI = config.isAI || false;
    this.isBoss = config.isBoss || false;
    this.bossPhase = 1;
    this.hasAwakened = false;
    this.isAwakened = false;
    this.awakeningShield = 0;

    // Equipment
    this.weapon = config.weapon || 'FISTS';
    this.armor = config.armor || 'ROBE';
    this.helm = config.helm || 'HEADBAND';
    this.amulet = config.amulet || 'FLAME_AMULET';

    // Magic & Jutsu System
    this.magicMeter = 0.0;
    this.maxMagicMeter = 100.0;
    this.activeMagicSpells = [];
    this.isBurning = false;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
    this.isInvulnerable = false;

    // Character Visuals & Proportions
    this.proportions = config.proportions || null;
    this.visuals = config.visuals || null;
    this.avatar = config.avatar || '🥋';

    // Stats & Health Ghosting
    this.maxHp = config.hp || 100;
    this.hp = this.maxHp;
    this.ghostHp = this.maxHp;

    // Combat State Machine: 'IDLE', 'ATTACKING', 'HITSTUN', 'KNOCKED_DOWN', 'ROLLING'
    this.state = 'IDLE';
    this.currentMove = null;
    this.frameCounter = 0;
    this.hasHitCurrentMove = false;
    this.isBlocking = false;
    this.isInvisible = false;
    this.invisibleTimer = 0;
    this.hitstopTimer = 0; // Impact crunch freeze
    this.wasInAir = false;

    // Pose State for smooth skeletal LERP
    this.poseState = null;

    // Combo system
    this.comboHits = 0;
    this.comboTimer = 0;

    // Projectiles
    this.activeShurikens = [];
    this.shurikenCooldown = 0;

    // Rounds Won
    this.roundsWon = 0;
  }

  resetForNewRound(spawnX, facing) {
    this.x = spawnX;
    this.y = window.CONFIG.GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.hp = this.maxHp;
    this.ghostHp = this.maxHp;
    this.state = 'IDLE';
    this.currentMove = null;
    this.frameCounter = 0;
    this.hasHitCurrentMove = false;
    this.isBlocking = false;
    this.isInvisible = false;
    this.hitstopTimer = 0;
    this.wasInAir = false;
    this.comboHits = 0;
    this.comboTimer = 0;
    this.activeShurikens = [];
    this.activeMagicSpells = [];
    this.isBurning = false;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
    this.isInvulnerable = false;
    this.bossPhase = 1;
    this.hasAwakened = false;
    this.isAwakened = false;
    this.awakeningShield = 0;
  }

  update(opponent, inputState, sceneRenderer) {
    if (this.shurikenCooldown > 0) this.shurikenCooldown--;

    // Ghost Health Bar Smooth Decay (Fighting Game damage linger)
    if (this.ghostHp > this.hp) {
      this.ghostHp -= (this.ghostHp - this.hp) * 0.05 + 0.3;
      if (this.ghostHp < this.hp) this.ghostHp = this.hp;
    }

    // Hitstop Frame Freeze (Crunchy combat impact pause)
    if (this.hitstopTimer > 0) {
      this.hitstopTimer--;
      return; // Freeze logic for impact crunch
    }

    // Combo Reset Timer
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.comboHits = 0;
      }
    }

    // Burning DoT Status Effect
    if (this.isBurning && this.hp > 0) {
      this.burnTimer--;
      this.burnTickTimer++;
      if (this.burnTickTimer >= 60) {
        this.burnTickTimer = 0;
        const burnDmg = 4;
        this.hp = Math.max(0, this.hp - burnDmg);
        if (window.Sound && window.Sound.playFistHit) window.Sound.playFistHit();
        if (window.Game && window.Game.spawnFloatingCombatText) {
          window.Game.spawnFloatingCombatText(this.x, this.y - 75, '🔥 4', '#ff5500');
        }
      }
      if (this.burnTimer <= 0 || this.hp <= 0) {
        this.isBurning = false;
        this.burnTimer = 0;
        this.burnTickTimer = 0;
      }
    }

    // Handle Invisibility for Lynx Boss
    if (this.invisibleTimer > 0) {
      this.invisibleTimer--;
      if (this.invisibleTimer <= 0) {
        this.isInvisible = false;
      }
    }

    // Auto-Face opponent when idle/blocking
    if (this.state === 'IDLE' || this.state === 'BLOCKING') {
      this.facing = opponent.x > this.x ? 1 : -1;
    }

    // State Machine Processing
    switch (this.state) {
      case 'IDLE':
        this.handleIdleState(opponent, inputState, sceneRenderer);
        break;
      case 'ATTACKING':
        this.handleAttackingState(opponent, sceneRenderer);
        break;
      case 'HITSTUN':
        this.handleHitstunState();
        break;
      case 'KNOCKED_DOWN':
        this.handleKnockedDownState();
        break;
      case 'ROLLING':
        this.handleRollingState();
        break;
    }

    // Physics with Equipment Weight factor
    this.x += this.vx;
    this.y += this.vy;

    // Gravity & Ground Impact Shock Absorption
    const isCurrentlyInAir = this.y < window.CONFIG.GROUND_Y;
    if (isCurrentlyInAir) {
      this.vy += window.CONFIG.GRAVITY;
      this.wasInAir = true;
    } else {
      if (this.wasInAir) {
        // Landing Impact! Spawn footstep dust puff and absorb shock
        if (sceneRenderer && sceneRenderer.spawnDust) {
          sceneRenderer.spawnDust(this.x, window.CONFIG.GROUND_Y);
        }
        this.wasInAir = false;
      }
      this.y = window.CONFIG.GROUND_Y;
      this.vy = 0;
    }

    // Clamping to arena borders
    this.x = Math.max(75, Math.min(window.CONFIG.CANVAS_WIDTH - 75, this.x));

    // Update Shurikens
    this.updateShurikens(opponent, sceneRenderer);

    // Update Active Magic Jutsu Spells
    this.updateMagicSpells(opponent, sceneRenderer);
  }

  handleIdleState(opponent, input, sceneRenderer) {
    if (!input) return;

    if (input.move) {
      this.triggerMove(input.move);
      return;
    }

    // Magic Jutsu Cast Check
    if (input.magic && this.canCastMagic()) {
      this.castMagic(opponent, sceneRenderer);
      return;
    }

    // Weight factor derived from equipped armor and body proportions
    const armConfig = window.CONFIG.ARMORS[this.armor];
    const armWeight = armConfig ? armConfig.weight : 1.0;
    const bodyWidth = this.proportions ? this.proportions.widthScale : 1.0;
    const agility = 1.0 / (armWeight * bodyWidth);

    // Guard Check: Moving back OR holding manual guard button
    this.isBlocking = (input.back || input.manualGuard) && !input.punch && !input.kick && !input.up;

    // Movement: Forward / Backward with weight-influenced acceleration
    if (input.forward) {
      this.vx = 3.6 * agility * this.facing;
    } else if (input.back) {
      this.vx = -2.6 * agility * this.facing;
    } else {
      this.vx *= window.CONFIG.FRICTION;
    }

    // Jump with weight influence
    if (input.up && this.y === window.CONFIG.GROUND_Y) {
      this.vy = -14.5 * Math.min(1.05, Math.max(0.88, agility));
      if (input.forward) this.vx = 4.2 * agility * this.facing;
      if (input.back) this.vx = -3.8 * agility * this.facing;
      window.Sound.playWhoosh(220, 0.2);
    }

    // Dedicated Evasive Roll / Backflip
    if (input.roll || input.doubleForward) {
      this.startRoll(input.back ? 'BACKFLIP' : 'ROLL_FORWARD');
      return;
    }
    if (input.doubleBack) {
      this.startRoll('BACKFLIP');
      return;
    }

    // Close-Range Throw / Takedown (Forward + Punch within 48px)
    const dist = Math.abs(opponent.x - this.x);
    if (dist < 48 && input.forward && input.punch) {
      this.triggerMove('THROW_CLOSE');
      return;
    }

    // 8-Directional Attack Matrix
    if (input.punch) {
      if (input.up) this.triggerMove('PUNCH_UP');
      else if (input.down) this.triggerMove('PUNCH_DOWN');
      else if (input.forward) this.triggerMove('PUNCH_FORWARD');
      else if (input.back) this.triggerMove('PUNCH_BACK');
      else this.triggerMove('PUNCH_NEUTRAL');
      return;
    }

    if (input.kick) {
      if (input.up) this.triggerMove('KICK_UP');
      else if (input.down) this.triggerMove('KICK_DOWN');
      else if (input.forward) this.triggerMove('KICK_FORWARD');
      else if (input.back) this.triggerMove('KICK_BACK');
      else this.triggerMove('KICK_NEUTRAL');
      return;
    }

    // Shuriken Throw
    if (input.ranged && this.shurikenCooldown <= 0) {
      this.triggerMove('SHURIKEN');
    }
  }

  triggerMove(moveKey) {
    const configMoves = (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.MOVES) ||
                        (typeof CONFIG !== 'undefined' && CONFIG.MOVES) || {};
    const move = configMoves[moveKey];
    if (!move) return;

    this.currentMove = move;
    this.state = 'ATTACKING';
    this.frameCounter = 0;
    this.hasHitCurrentMove = false;
    this.isBlocking = false;

    if (move.id === 'LYNX_TRUE_VANISH') {
      this.isInvisible = true;
      this.isInvulnerable = true;
    }

    if (move.type === 'punch' || move.type === 'kick') {
      const pitch = move.zone === 'head' ? 240 : 170;
      if (typeof window !== 'undefined' && window.Sound && window.Sound.playWhoosh) {
        window.Sound.playWhoosh(pitch, 0.18);
      }
    } else if (move.type === 'ranged') {
      if (typeof window !== 'undefined' && window.Sound && window.Sound.playShurikenThrow) {
        window.Sound.playShurikenThrow();
      }
    }
  }

  startRoll(moveKey) {
    const move = window.CONFIG.MOVES[moveKey];
    this.currentMove = move;
    this.state = 'ROLLING';
    this.frameCounter = 0;
    this.isBlocking = false;
    window.Sound.playWhoosh(150, 0.2);
  }

  handleAttackingState(opponent, sceneRenderer) {
    this.frameCounter++;
    const move = this.currentMove;
    if (!move) {
      this.state = 'IDLE';
      this.frameCounter = 0;
      return;
    }

    const weapons = (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.WEAPONS) ||
                    (typeof CONFIG !== 'undefined' && CONFIG.WEAPONS) || {};
    const wpn = weapons[this.weapon] || weapons.FISTS || { weight: 1.0, range: 48 };
    const wpnWeight = wpn.weight || 1.0;

    // --- AWAKENED BOSS MOVE 1: LYNX_FRENZY ---
    if (move.id === 'LYNX_FRENZY') {
      if (this.frameCounter >= move.hitStart && this.frameCounter <= move.hitEnd) {
        if ((this.frameCounter - move.hitStart) % 6 === 0) {
          this.vx = 3.2 * this.facing;
          this.hasHitCurrentMove = false;
          const isFinalHit = (this.frameCounter === 36 || this.frameCounter >= move.hitEnd);
          const frenzyStrike = {
            ...move,
            damageMultiplier: isFinalHit ? 1.4 : 0.45,
            knockback: isFinalHit ? 8.5 : 2.5
          };
          if (opponent) {
            this.checkHit(opponent, frenzyStrike, sceneRenderer);
          }
          if (isFinalHit) {
            if (sceneRenderer && sceneRenderer.spawnInkSplatter && opponent) {
              const inkDir = this.facing > 0 ? 0.15 : Math.PI - 0.15;
              sceneRenderer.spawnInkSplatter(opponent.x, opponent.y - 60, 36, inkDir, 2.0);
            }
            if (sceneRenderer && sceneRenderer.triggerScreenFlash) {
              sceneRenderer.triggerScreenFlash('#e74c3c', 0.3);
            }
          }
        }
      } else {
        this.vx *= 0.85;
      }
    }
    // --- AWAKENED BOSS MOVE 2: LYNX_TRUE_VANISH ---
    else if (move.id === 'LYNX_TRUE_VANISH') {
      if (this.frameCounter <= 65) {
        this.isInvisible = true;
        this.isInvulnerable = true;
        this.vx = 0;
        this.vy = 0;
      } else if (this.frameCounter === 66) {
        if (opponent) {
          this.x = opponent.x - (30 * opponent.facing);
          this.y = opponent.y - 140;
          this.facing = opponent.x >= this.x ? 1 : -1;
        } else {
          this.y -= 140;
        }
        this.vy = 18.0;
        this.isInvisible = false;
        this.isInvulnerable = true;
        if (typeof window !== 'undefined' && window.Sound && window.Sound.playWhoosh) {
          window.Sound.playWhoosh(320, 0.25);
        }
      } else if (this.frameCounter > 66 && this.frameCounter < 85) {
        const groundY = (typeof window !== 'undefined' && window.CONFIG ? window.CONFIG.GROUND_Y : 450);
        this.y = Math.min(groundY, this.y + this.vy);
        this.vx *= 0.9;
      } else if (this.frameCounter === 85) {
        const groundY = (typeof window !== 'undefined' && window.CONFIG ? window.CONFIG.GROUND_Y : 450);
        this.y = groundY;
        this.vy = 0;
        if (opponent) {
          const dist = Math.hypot(this.x - opponent.x, this.y - opponent.y);
          if (dist < 140 && !opponent.isInvulnerable && opponent.state !== 'ROLLING') {
            this.hasHitCurrentMove = true;
            this.comboHits++;
            this.comboTimer = 75;
            this.addMagic(20.0);
            const hitstop = ((typeof window !== 'undefined' && window.CONFIG && window.CONFIG.HITSTOP_FRAMES) ||
                            (typeof CONFIG !== 'undefined' && CONFIG.HITSTOP_FRAMES) || 4);
            this.hitstopTimer = hitstop;
            opponent.hitstopTimer = hitstop;

            const diveMove = {
              ...move,
              damageMultiplier: 2.4,
              zone: 'head',
              knockback: 9.0
            };
            opponent.takeHit(this, diveMove, sceneRenderer, opponent.x, opponent.y - 60, true);
            if (typeof window !== 'undefined' && window.Game && window.Game.spawnFloatingCombatText) {
              window.Game.spawnFloatingCombatText(opponent.x, opponent.y - 95, '⚡ DIVE KICK!', '#e74c3c');
            }
          }
        }
        if (sceneRenderer && sceneRenderer.spawnShockwave) {
          const groundY = (typeof window !== 'undefined' && window.CONFIG ? window.CONFIG.GROUND_Y : 450);
          sceneRenderer.spawnShockwave(this.x, groundY - 20, 85, '#e74c3c', 6);
        }
        if (sceneRenderer && sceneRenderer.addTrauma) {
          sceneRenderer.addTrauma(0.5);
        }
      } else if (this.frameCounter >= 105) {
        this.isInvulnerable = false;
        this.isInvisible = false;
        const groundY = (typeof window !== 'undefined' && window.CONFIG ? window.CONFIG.GROUND_Y : 450);
        this.y = groundY;
        this.vy = 0;
      }
    }
    // --- AWAKENED BOSS MOVE 3: LYNX_DEMONIC_CLAWS ---
    else if (move.id === 'LYNX_DEMONIC_CLAWS') {
      this.vx *= 0.85;
      if (this.frameCounter === 1 && opponent) {
        this.groundClawTargetX = opponent.x;
        const groundY = (typeof window !== 'undefined' && window.CONFIG ? window.CONFIG.GROUND_Y : 450);
        this.activeMagicSpells.push({
          id: 'LYNX_DEMONIC_CLAWS',
          type: 'eruption',
          x: opponent.x,
          y: groundY,
          frame: 0,
          eruptFrame: 18,
          damage: 38,
          launchForce: -13.5,
          width: 75,
          height: 130,
          hasHit: false
        });
        if (sceneRenderer && sceneRenderer.spawnSparks) {
          sceneRenderer.spawnSparks(opponent.x, groundY - 5, 8, '#e74c3c', 4);
        }
      }

      if (this.frameCounter === 18 && opponent) {
        const targetX = this.groundClawTargetX !== undefined ? this.groundClawTargetX : opponent.x;
        const dist = Math.abs(opponent.x - targetX);
        const groundY = (typeof window !== 'undefined' && window.CONFIG ? window.CONFIG.GROUND_Y : 450);
        if (dist < 75 && !opponent.isInvulnerable && opponent.state !== 'ROLLING') {
          opponent.hp = Math.max(0, opponent.hp - 38);
          opponent.state = 'HITSTUN';
          opponent.frameCounter = 0;
          opponent.vy = -13.5;
          opponent.vx = (opponent.x >= this.x ? 1 : -1) * 2.5;
          opponent.addMagic(6.0);
          this.hasHitCurrentMove = true;
          if (typeof window !== 'undefined' && window.Sound && window.Sound.playCriticalHit) {
            window.Sound.playCriticalHit();
          }
          if (typeof window !== 'undefined' && window.Game && window.Game.spawnFloatingCombatText) {
            window.Game.spawnFloatingCombatText(opponent.x, opponent.y - 100, '🐾 DEMONIC CLAWS!', '#e74c3c');
          }
        }
        if (sceneRenderer && sceneRenderer.spawnShockwave) {
          sceneRenderer.spawnShockwave(targetX, groundY - 20, 85, '#e74c3c', 6);
        }
        if (sceneRenderer && sceneRenderer.spawnInkSplatter) {
          sceneRenderer.spawnInkSplatter(targetX, groundY - 30, 24, -Math.PI / 2, 1.5);
        }
        if (sceneRenderer && sceneRenderer.triggerScreenFlash) {
          sceneRenderer.triggerScreenFlash('#e74c3c', 0.35);
        }
        if (sceneRenderer && sceneRenderer.addTrauma) {
          sceneRenderer.addTrauma(0.45);
        }
      }
    }
    // --- STANDARD ATTACKS ---
    else {
      // Weapon Mass & Kinetic Strike Inertia
      if (move.step && this.frameCounter >= move.hitStart && this.frameCounter <= move.hitEnd) {
        // Heavier weapons carry stronger forward momentum
        this.vx = move.step * this.facing * (0.85 + wpnWeight * 0.15);
      } else {
        // Damping with weapon follow-through inertia (heavy weapons have slight swing-through lag)
        const inertiaDamping = 0.82 + Math.min(0.08, (wpnWeight - 1.0) * 0.05);
        this.vx *= inertiaDamping;
      }

      if (this.frameCounter >= move.hitStart && this.frameCounter <= move.hitEnd && !this.hasHitCurrentMove) {
        if (opponent) this.checkHit(opponent, move, sceneRenderer);
      }

      if (move.id === 'SHURIKEN' && this.frameCounter === move.throwFrame) {
        this.activeShurikens.push({
          x: this.x + 25 * this.facing,
          y: this.y - 65,
          vx: 13 * this.facing,
          rotation: 0,
          damage: move.damage
        });
        this.shurikenCooldown = 90;
      }
    }

    // Weapon Weight Influences Recovery Duration
    const totalDuration = Math.round(move.duration * (0.92 + wpnWeight * 0.08));
    if (this.frameCounter >= totalDuration) {
      this.state = 'IDLE';
      this.currentMove = null;
      this.frameCounter = 0;
      this.isInvulnerable = false;
      this.isInvisible = false;
    }
  }

  checkHit(target, move, sceneRenderer) {
    if (target.isInvulnerable || target.state === 'ROLLING') return;

    const weapons = (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.WEAPONS) ||
                    (typeof CONFIG !== 'undefined' && CONFIG.WEAPONS) || {};
    const wpn = weapons[this.weapon] || weapons.FISTS || { range: 48, critChance: 0.1 };
    const effectiveReach = (move.reach + (wpn.range || 48) * 0.4);

    const hitboxX = this.x + (effectiveReach * this.facing);
    const hitboxY = this.y + (move.heightOffset || -50);
    const hitboxRadius = 26;

    let hurtboxY = target.y - 55;
    if (move.zone === 'head') hurtboxY = target.y - 90;
    if (move.zone === 'legs') hurtboxY = target.y - 18;

    const dx = hitboxX - target.x;
    const dy = hitboxY - hurtboxY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Hit connects if within circular tip hitbox OR along the sweeping strike lane between attacker and reach
    const minX = Math.min(this.x, hitboxX) - 15;
    const maxX = Math.max(this.x, hitboxX) + hitboxRadius + 32;
    const isForward = (target.x - this.x) * this.facing >= -15;
    const inRange = (dist < hitboxRadius + 32) || (isForward && target.x >= minX && target.x <= maxX && Math.abs(dy) <= 65);

    if (inRange) {
      this.hasHitCurrentMove = true;
      this.comboHits++;
      this.comboTimer = 75; // 1.25 seconds to continue combo

      const isCrit = Math.random() < wpn.critChance;
      this.addMagic(isCrit ? 25.0 : 14.0);

      // Signature fighting game hitstop impact freeze
      const hitstop = window.CONFIG.HITSTOP_FRAMES || 3;
      this.hitstopTimer = hitstop;
      target.hitstopTimer = hitstop;

      target.takeHit(this, move, sceneRenderer, hitboxX, hitboxY, isCrit);

      // Trigger Combo UI popups on attacker
      if (this.comboHits >= 2) {
        if (window.Game) {
          window.Game.spawnFloatingCombatText(hitboxX, hitboxY - 25, `${this.comboHits}x COMBO!`, '#f1c40f');
        }
      }
    }
  }

  takeHit(attacker, move, sceneRenderer, hitX, hitY, isCritPrecalc = false) {
    if (this.isInvulnerable) return false;

    // 1. Guard / Block Logic
    if (this.isBlocking && move.type !== 'throw') {
      if (typeof window !== 'undefined' && window.Sound && window.Sound.playBlockClang) {
        window.Sound.playBlockClang();
      }
      this.addMagic(8.0);
      if (sceneRenderer && sceneRenderer.spawnSparks) {
        sceneRenderer.spawnSparks(hitX, hitY, 16, '#3498db', 7);
      }
      if (sceneRenderer && sceneRenderer.spawnShockwave) {
        sceneRenderer.spawnShockwave(hitX, hitY, 34, '#3498db', 3);
      }
      if (sceneRenderer && sceneRenderer.addTrauma) {
        sceneRenderer.addTrauma(0.18);
      }
      this.vx = (attacker ? attacker.facing : 1) * 3.2;
      this.hp = Math.max(0, this.hp - 2);

      if (typeof window !== 'undefined' && window.Game && window.Game.spawnFloatingCombatText) {
        window.Game.spawnFloatingCombatText(this.x, this.y - 80, 'BLOCKED', '#3498db');
      }

      if (this.isBoss && !this.hasAwakened && this.hp <= this.maxHp * 0.5 && this.hp > 0) {
        this.hasAwakened = true;
        if (typeof window !== 'undefined' && window.Game && window.Game.triggerBossAwakening) {
          window.Game.triggerBossAwakening(this);
        }
      }
      return;
    }

    // 2. Damage Formula
    const weapons = (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.WEAPONS) ||
                    (typeof CONFIG !== 'undefined' && CONFIG.WEAPONS) || {};
    const armors = (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.ARMORS) ||
                   (typeof CONFIG !== 'undefined' && CONFIG.ARMORS) || {};
    const helms = (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.HELMS) ||
                  (typeof CONFIG !== 'undefined' && CONFIG.HELMS) || {};

    const attackerWeapon = attacker ? attacker.weapon : 'FISTS';
    const wpn = weapons[attackerWeapon] || weapons.FISTS || { damage: 10, critChance: 0.1 };
    const arm = armors[this.armor] || armors.ROBE || { defense: 8 };
    const hlm = helms[this.helm] || helms.HEADBAND || { defense: 6 };

    let baseDamage = wpn.damage * (move.damageMultiplier || 1.0);
    const isHead = move.zone === 'head';
    const isCrit = isCritPrecalc || (Math.random() < (wpn.critChance || 0.1));

    if (isHead) baseDamage *= 1.7;
    if (isCrit) baseDamage *= 1.5;

    const totalDefense = arm.defense + (isHead ? hlm.defense * 1.5 : 0);
    const damageDealt = Math.max(3, Math.round(baseDamage * (1 - totalDefense / (totalDefense + 180))));

    this.hp = Math.max(0, this.hp - damageDealt);
    this.addMagic(6.0);

    if (this.isBoss && !this.hasAwakened && this.hp <= this.maxHp * 0.5 && this.hp > 0) {
      this.hasAwakened = true;
      if (typeof window !== 'undefined' && window.Game && window.Game.triggerBossAwakening) {
        window.Game.triggerBossAwakening(this);
      }
    }

    // 3. Floating Combat Messages
    if (typeof window !== 'undefined' && window.Game && window.Game.spawnFloatingCombatText) {
      if (isCrit) {
        window.Game.spawnFloatingCombatText(this.x, this.y - 95, 'CRITICAL HIT!', '#e74c3c');
      } else if (isHead) {
        window.Game.spawnFloatingCombatText(this.x, this.y - 90, 'HEAD HIT!', '#e67e22');
      } else if (move.trip) {
        window.Game.spawnFloatingCombatText(this.x, this.y - 30, 'TRIPPED!', '#9b59b6');
      } else if (move.type === 'throw') {
        window.Game.spawnFloatingCombatText(this.x, this.y - 60, 'TAKEDOWN!', '#e67e22');
      }
    }

    // 4. Motion Graphics & VFX
    const isLethal = this.hp <= 0;
    const attackerFacing = attacker ? attacker.facing : 1;

    // Sumi-e Japanese Ink Splatters
    if (sceneRenderer && sceneRenderer.spawnInkSplatter) {
      const inkDir = attackerFacing > 0 ? 0.1 : Math.PI - 0.1;
      sceneRenderer.spawnInkSplatter(hitX || this.x, hitY || this.y - 50, isCrit || isLethal ? 24 : 14, inkDir, 1.1);
    }

    if (isLethal) {
      // Cinematic Finish K.O. Mega Impact
      if (sceneRenderer && sceneRenderer.triggerScreenFlash) sceneRenderer.triggerScreenFlash('#ffffff', 0.65);
      if (sceneRenderer && sceneRenderer.spawnRadialSpeedLines) sceneRenderer.spawnRadialSpeedLines(this.x, this.y - 50, 32);
      if (sceneRenderer && sceneRenderer.spawnShockwave) sceneRenderer.spawnShockwave(this.x, this.y - 50, 105, '#e74c3c', 6);
    } else if (isCrit || isHead) {
      // Critical / Head Hit Cinematic Strobe
      if (sceneRenderer && sceneRenderer.triggerScreenFlash) sceneRenderer.triggerScreenFlash('#ffeedd', 0.42);
      if (sceneRenderer && sceneRenderer.spawnRadialSpeedLines) sceneRenderer.spawnRadialSpeedLines(hitX || this.x, hitY || this.y - 50, 20);
      if (sceneRenderer && sceneRenderer.spawnShockwave) sceneRenderer.spawnShockwave(hitX || this.x, hitY || this.y - 50, 68, isCrit ? '#e74c3c' : '#f39c12', 4);
    } else if (move.type === 'throw') {
      if (sceneRenderer && sceneRenderer.spawnShockwave) sceneRenderer.spawnShockwave(hitX || this.x, hitY || this.y - 50, 75, '#e67e22', 4.5);
    }

    // Audio & Sparks
    if (isCrit || isHead) {
      if (typeof window !== 'undefined' && window.Sound && window.Sound.playCriticalHit) {
        window.Sound.playCriticalHit();
      }
      if (sceneRenderer && sceneRenderer.spawnSparks) sceneRenderer.spawnSparks(hitX || this.x, hitY || this.y - 50, 24, '#e74c3c', 10);
      if (sceneRenderer && sceneRenderer.addTrauma) sceneRenderer.addTrauma(0.55);
    } else if (wpn.id === 'KATANA' || wpn.id === 'KNIVES' || wpn.id === 'KUSARIGAMA' || wpn.id === 'LYNX_CLAWS') {
      if (typeof window !== 'undefined' && window.Sound && window.Sound.playBladeSlash) {
        window.Sound.playBladeSlash();
      }
      if (sceneRenderer && sceneRenderer.spawnSparks) sceneRenderer.spawnSparks(hitX || this.x, hitY || this.y - 50, 18, '#f39c12', 8);
      if (sceneRenderer && sceneRenderer.addTrauma) sceneRenderer.addTrauma(0.35);
    } else {
      if (typeof window !== 'undefined' && window.Sound && window.Sound.playFistHit) {
        window.Sound.playFistHit();
      }
      if (sceneRenderer && sceneRenderer.spawnSparks) sceneRenderer.spawnSparks(hitX || this.x, hitY || this.y - 50, 14, '#e67e22', 7);
      if (sceneRenderer && sceneRenderer.addTrauma) sceneRenderer.addTrauma(0.28);
    }

    // 5. Knockdown or Hitstun
    if (move.trip || move.type === 'throw' || this.hp <= 0) {
      this.state = 'KNOCKED_DOWN';
      this.frameCounter = 0;
      this.vx = attackerFacing * (move.knockback || 8.0);
      this.vy = -6;
    } else {
      this.state = 'HITSTUN';
      this.frameCounter = 0;
      this.vx = attackerFacing * (move.knockback || 4.5);
    }

    this.currentMove = null;
  }

  activateDemonAwakening() {
    this.isAwakened = true;
    this.bossPhase = 2;
    if (!this.visuals) this.visuals = {};
    this.visuals.auraGlow = 'rgba(231, 76, 60, 0.95)';
    this.glow = 'rgba(231, 76, 60, 0.95)';
    this.hp = Math.min(this.maxHp, this.hp + 25);
    this.awakeningShield = 25;
    if (typeof window !== 'undefined' && window.Sound) {
      if (window.Sound.playBossRoar) window.Sound.playBossRoar();
      if (window.Sound.playDemonicThunder) window.Sound.playDemonicThunder();
    }
  }

  handleHitstunState() {
    this.frameCounter++;
    this.vx *= 0.85;
    if (this.frameCounter > 18) {
      this.state = 'IDLE';
      this.frameCounter = 0;
    }
  }

  handleKnockedDownState() {
    this.frameCounter++;
    this.vx *= 0.88;
    if (this.frameCounter > 35) {
      this.state = 'IDLE';
      this.frameCounter = 0;
      this.vx = -this.facing * 3.5;
    }
  }

  handleRollingState() {
    this.frameCounter++;
    const move = this.currentMove;
    if (move && move.step) {
      this.vx = move.step * this.facing;
    }
    if (this.frameCounter >= (move ? move.duration : 20)) {
      this.state = 'IDLE';
      this.currentMove = null;
      this.frameCounter = 0;
    }
  }

  updateShurikens(opponent, sceneRenderer) {
    for (let i = this.activeShurikens.length - 1; i >= 0; i--) {
      const s = this.activeShurikens[i];
      s.x += s.vx;
      s.rotation += 0.35;

      if (Math.abs(s.x - opponent.x) < 26 && Math.abs(s.y - (opponent.y - 55)) < 45) {
        if (opponent.state !== 'ROLLING') {
          opponent.takeHit(this, {
            name: 'Shuriken Hit',
            damageMultiplier: 1.0,
            zone: 'torso',
            knockback: 4.5
          }, sceneRenderer, s.x, s.y);
        }
        this.activeShurikens.splice(i, 1);
        continue;
      }

      if (s.x < 0 || s.x > window.CONFIG.CANVAS_WIDTH) {
        this.activeShurikens.splice(i, 1);
      }
    }
  }

  addMagic(amount) {
    const prev = this.magicMeter;
    this.magicMeter = Math.min(this.maxMagicMeter, Math.max(0, this.magicMeter + amount));
    if (prev < 100.0 && this.magicMeter >= 100.0) {
      if (window.Sound && window.Sound.playSpellReady) {
        window.Sound.playSpellReady();
      }
    }
  }

  canCastMagic() {
    return this.magicMeter >= 100.0 &&
           this.state !== 'HITSTUN' &&
           this.state !== 'KNOCKED_DOWN' &&
           this.hp > 0;
  }

  castMagic(opponent, sceneRenderer) {
    if (!this.canCastMagic()) return false;
    this.magicMeter = 0.0;

    const amuletKey = this.amulet || 'FLAME_AMULET';
    const amuletCfg = window.CONFIG.AMULETS ? window.CONFIG.AMULETS[amuletKey] : null;
    const spellId = amuletCfg ? amuletCfg.spellId : 'FIREBALL';
    const spellCfg = window.CONFIG.SPELLS ? (window.CONFIG.SPELLS[spellId] || window.CONFIG.SPELLS.FIREBALL) : { damage: 32 };

    if (spellId === 'FIREBALL') {
      this.activeMagicSpells.push({
        id: 'FIREBALL',
        type: 'projectile',
        x: this.x + 35 * this.facing,
        y: this.y - 58,
        vx: (spellCfg.speed || 14.0) * this.facing,
        facing: this.facing,
        radius: spellCfg.radius || 18,
        damage: spellCfg.damage || 32,
        burnDamage: spellCfg.burnDamage || 12,
        burnDuration: spellCfg.burnDuration || 180,
        lightColor: spellCfg.lightColor || 0xff6600,
        life: 75
      });
      if (window.Sound && window.Sound.playFireballIgnite) window.Sound.playFireballIgnite();
      if (sceneRenderer && sceneRenderer.addTrauma) sceneRenderer.addTrauma(0.35);
      if (sceneRenderer && sceneRenderer.triggerScreenFlash) sceneRenderer.triggerScreenFlash('#ff7700', 0.25);
    } else if (spellId === 'DARK_ERUPTION') {
      this.activeMagicSpells.push({
        id: 'DARK_ERUPTION',
        type: 'eruption',
        x: opponent.x,
        y: window.CONFIG.GROUND_Y,
        width: spellCfg.width || 65,
        height: spellCfg.height || 120,
        delay: 14,
        life: 38,
        damage: spellCfg.damage || 42,
        launchForce: spellCfg.launchForce || -14.0,
        lightColor: spellCfg.lightColor || 0x9933ff,
        hasHit: false
      });
      if (window.Sound && window.Sound.playDarkEruption) window.Sound.playDarkEruption();
      if (sceneRenderer && sceneRenderer.addTrauma) sceneRenderer.addTrauma(0.42);
      if (sceneRenderer && sceneRenderer.triggerScreenFlash) sceneRenderer.triggerScreenFlash('#9933ff', 0.28);
    } else if (spellId === 'SMOKE_TELEPORT') {
      const targetX = opponent.x - (70 * opponent.facing);
      this.activeMagicSpells.push({
        id: 'SMOKE_TELEPORT',
        type: 'teleport',
        startX: this.x,
        startY: this.y,
        targetX: targetX,
        targetFacing: opponent.facing,
        frame: 0,
        totalFrames: 22,
        damage: spellCfg.damage || 24,
        lightColor: spellCfg.lightColor || 0x4466aa
      });
      this.isInvulnerable = true;
      if (window.Sound && window.Sound.playSmokeTeleport) window.Sound.playSmokeTeleport();
      if (sceneRenderer && sceneRenderer.spawnInkSplatter) {
        sceneRenderer.spawnInkSplatter(this.x, this.y - 50, 26, 0, 1.4);
      }
      if (sceneRenderer && sceneRenderer.spawnRadialSpeedLines) {
        sceneRenderer.spawnRadialSpeedLines(this.x, this.y - 50, 16);
      }
    }
    return true;
  }

  updateMagicSpells(opponent, sceneRenderer) {
    for (let i = this.activeMagicSpells.length - 1; i >= 0; i--) {
      const s = this.activeMagicSpells[i];

      if (s.id === 'FIREBALL') {
        s.x += s.vx;
        s.life--;

        // Trailing sparks
        if (sceneRenderer && sceneRenderer.spawnSparks && Math.random() < 0.6) {
          sceneRenderer.spawnSparks(s.x, s.y, 2, '#ff6600', 3);
        }

        // Collision check with opponent hurtbox
        if (!opponent.isInvulnerable && opponent.state !== 'ROLLING') {
          const hurtY = opponent.y - 55;
          const dist = Math.hypot(s.x - opponent.x, s.y - hurtY);
          if (dist < s.radius + 30) {
            // Impact!
            if (opponent.isBlocking) {
              opponent.hp = Math.max(0, opponent.hp - 8);
              opponent.vx = s.facing * 3.5;
              opponent.addMagic(8.0);
              if (window.Sound && window.Sound.playBlockClang) window.Sound.playBlockClang();
              if (sceneRenderer && sceneRenderer.spawnSparks) sceneRenderer.spawnSparks(s.x, s.y, 14, '#3498db', 6);
              if (window.Game && window.Game.spawnFloatingCombatText) {
                window.Game.spawnFloatingCombatText(opponent.x, opponent.y - 80, 'BLOCKED', '#3498db');
              }
            } else {
              opponent.hp = Math.max(0, opponent.hp - s.damage);
              opponent.state = 'HITSTUN';
              opponent.frameCounter = 0;
              opponent.vx = s.facing * 5.5;
              opponent.addMagic(6.0);
              opponent.isBurning = true;
              opponent.burnTimer = s.burnDuration;
              opponent.burnTickTimer = 0;

              if (window.Sound && window.Sound.playCriticalHit) window.Sound.playCriticalHit();
              if (window.Game && window.Game.spawnFloatingCombatText) {
                window.Game.spawnFloatingCombatText(opponent.x, opponent.y - 95, '🔥 FIREBALL!', '#ff5500');
              }
            }

            if (sceneRenderer && sceneRenderer.spawnShockwave) {
              sceneRenderer.spawnShockwave(s.x, s.y, 65, '#ff5500', 5);
            }
            if (sceneRenderer && sceneRenderer.triggerScreenFlash) {
              sceneRenderer.triggerScreenFlash('#ff5500', 0.35);
            }
            if (sceneRenderer && sceneRenderer.addTrauma) {
              sceneRenderer.addTrauma(0.5);
            }

            this.activeMagicSpells.splice(i, 1);
            continue;
          }
        }

        if (s.x < 0 || s.x > window.CONFIG.CANVAS_WIDTH || s.life <= 0) {
          this.activeMagicSpells.splice(i, 1);
        }
      } else if (s.id === 'DARK_ERUPTION') {
        if (s.delay > 0) {
          s.delay--;
          if (sceneRenderer && sceneRenderer.spawnSparks && s.delay % 3 === 0) {
            sceneRenderer.spawnSparks(s.x, s.y - 5, 3, '#9933ff', 4);
          }
        } else {
          s.life--;
          if (!s.hasHit && !opponent.isInvulnerable) {
            const xDist = Math.abs(s.x - opponent.x);
            if (xDist < (s.width / 2 + 25)) {
              s.hasHit = true;
              opponent.hp = Math.max(0, opponent.hp - s.damage);
              opponent.state = 'HITSTUN';
              opponent.frameCounter = 0;
              opponent.vy = s.launchForce;
              opponent.vx = (opponent.x >= this.x ? 1 : -1) * 3.0;
              opponent.addMagic(6.0);

              if (window.Sound && window.Sound.playCriticalHit) window.Sound.playCriticalHit();
              if (sceneRenderer && sceneRenderer.spawnShockwave) {
                sceneRenderer.spawnShockwave(s.x, s.y - 30, 85, '#9933ff', 5);
              }
              if (sceneRenderer && sceneRenderer.triggerScreenFlash) {
                sceneRenderer.triggerScreenFlash('#9933ff', 0.4);
              }
              if (sceneRenderer && sceneRenderer.addTrauma) {
                sceneRenderer.addTrauma(0.55);
              }
              if (window.Game && window.Game.spawnFloatingCombatText) {
                window.Game.spawnFloatingCombatText(opponent.x, opponent.y - 110, '🌑 DARK ERUPTION!', '#9b59b6');
              }
            }
          }
          if (s.life <= 0) {
            this.activeMagicSpells.splice(i, 1);
          }
        }
      } else if (s.id === 'SMOKE_TELEPORT') {
        s.frame++;
        if (s.frame === 8) {
          // Relocate fighter behind opponent
          this.x = Math.max(80, Math.min(window.CONFIG.CANVAS_WIDTH - 80, s.targetX));
          this.facing = s.targetFacing;
          if (sceneRenderer && sceneRenderer.spawnInkSplatter) {
            sceneRenderer.spawnInkSplatter(this.x, this.y - 50, 28, 0, 1.5);
          }
        } else if (s.frame === 14) {
          // Ambush strike
          this.isInvulnerable = false;
          const hitDist = Math.abs(this.x - opponent.x);
          if (hitDist < 85 && !opponent.isInvulnerable) {
            opponent.hp = Math.max(0, opponent.hp - s.damage);
            opponent.state = 'HITSTUN';
            opponent.frameCounter = 0;
            opponent.vx = this.facing * 5.5;
            opponent.addMagic(6.0);

            if (window.Sound && window.Sound.playBladeSlash) window.Sound.playBladeSlash();
            if (sceneRenderer && sceneRenderer.spawnSparks) {
              sceneRenderer.spawnSparks(opponent.x, opponent.y - 55, 20, '#4466aa', 8);
            }
            if (sceneRenderer && sceneRenderer.spawnShockwave) {
              sceneRenderer.spawnShockwave(opponent.x, opponent.y - 55, 60, '#3498db', 4);
            }
            if (window.Game && window.Game.spawnFloatingCombatText) {
              window.Game.spawnFloatingCombatText(opponent.x, opponent.y - 85, '🌪️ AMBUSH!', '#3498db');
            }
          }
        }
        if (s.frame >= s.totalFrames) {
          this.isInvulnerable = false;
          this.activeMagicSpells.splice(i, 1);
        }
      } else if (s.id === 'LYNX_DEMONIC_CLAWS') {
        s.frame++;
        if (s.frame >= 45) {
          this.activeMagicSpells.splice(i, 1);
        }
      }
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Fighter;
} else {
  window.Fighter = Fighter;
}