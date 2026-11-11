/**
 * Shadow Fight 2 Web Edition - Master Biomechanical Kinematics & Silhouette Renderer
 * 
 * Features:
 * - Persistent Frame-to-Frame Pose Interpolation (Exponential Smoothing / LERP) for buttery smooth motion
 * - Biomechanical 4-Phase Human Gait Cycle (Heel-strike, Flat, Midstance, Toe-off, Hip Pelvic Oscillation)
 * - 6-Phase Kinetic Chain Combat Strikes (Anticipation, Hip Drive, Explosive Snap, Impact Lock, Follow-through, Recovery)
 * - Full Per-Character Proportional & Visual Identity:
 *     * Shin: Lean agile youth, karate stance, white gi lapels, headband ribbons
 *     * Ken: Shaolin monk, prayer beads (Mala), dual tactical daggers, shaved crown
 *     * Brick: Massive hulking giant enforcer (+35% mass), bolted iron mask, studded armor plates
 *     * Needle: Tall razor-slender assassin, back scabbard, ninja cowl, low stealth stance
 *     * Ghost: Spectral cursed ronin, tattered haori cape with cloth physics, translucent afterimages, purple aura
 *     * Lynx: Demonic predator, sharp demon horns, crouched feral stance, dual triple claws, crimson eye trails
 *     * Shadow: Balanced iconic ninja silhouette, cyan eye streak, customizable equipped gear
 * - Authentic Equipment Visual System (Helms: Headband, Iron Mask, Kabuto | Armors: Robe, Vest, Carapace | Weapons: Fists, Dual Knives, Katana, Kusarigama Chain, Dual Claws)
 * - Multi-Segment Physics Cloth & Ribbons (Bandana, Obi Sash, Kusarigama 6-Link Chain, Ghost Cape)
 */

class SkeletonRenderer {
  constructor() {
    this.trailPoints = [];
  }

  // --- MAIN RENDER ENTRY ---
  draw(ctx, fighter) {
    if (!fighter) return;

    // Ensure fighter has an active pose state for buttery-smooth interpolation
    this.ensureFighterPoseState(fighter);

    ctx.save();
    ctx.translate(fighter.x, fighter.y);
    ctx.scale(fighter.facing, 1);

    // Lynx Smoke Bomb Invisibility & True Vanish
    if (fighter.isInvisible) {
      if (fighter.currentMove && fighter.currentMove.id === 'LYNX_TRUE_VANISH') {
        ctx.globalAlpha = 0.05;
      } else {
        ctx.globalAlpha = 0.22;
      }
    }

    // Ghost Cursed Ronin Afterimage Trail
    if (fighter.visuals && fighter.visuals.hasEtherealTrail) {
      this.drawEtherealAfterimages(ctx, fighter);
    }

    // Outer silhouette aura glow
    const auraColor = fighter.visuals ? fighter.visuals.auraGlow : fighter.glow;
    ctx.shadowColor = auraColor;
    ctx.shadowBlur = fighter.isBoss ? 22 : (fighter.visuals && fighter.visuals.hasEtherealTrail ? 18 : 10);
    ctx.fillStyle = '#060608';
    ctx.strokeStyle = '#060608';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Calculate Target Kinematics & Smoothly LERP Active Pose
    const targetPose = this.calculateTargetPose(fighter);
    const pose = this.interpolatePose(fighter, targetPose);

    // 2. Draw Back Limbs (Layer 1 - behind body)
    this.drawAnatomicalLeg(ctx, pose.hip, pose.backFoot, -1, pose.legWidth, fighter, false);
    this.drawAnatomicalArm(ctx, pose.backShoulder, pose.backHand, -1, pose.armWidth, fighter, false);

    // 3. Draw Back Accessories (Katana Scabbard on back for Needle/Katana users)
    this.drawBackAccessories(ctx, pose, fighter);

    // 4. Draw Spectral Haori Cape (for Ghost)
    if (fighter.visuals && fighter.visuals.hasCape) {
      this.drawSpectralCape(ctx, pose, fighter);
    }

    // 5. Draw Torso, Musculature & Armor Cuirass
    this.drawAnatomicalTorso(ctx, pose, fighter);

    // 6. Draw Shaolin Prayer Beads (Mala) for Ken
    if (fighter.visuals && fighter.visuals.hasPrayerBeads) {
      this.drawPrayerBeads(ctx, pose);
    }

    // 7. Draw Dynamic Belt Sash / Obi Ribbon Physics
    this.drawDynamicSash(ctx, pose.hip, fighter);

    // 8. Draw Head, Cowl Profile, Helmet & Ocular Light
    this.drawHeadAndFace(ctx, pose.head, fighter);

    // 9. Draw Front Limbs (Layer 3 - in front of body)
    this.drawAnatomicalLeg(ctx, pose.hip, pose.frontFoot, 1, pose.legWidth, fighter, true);
    this.drawAnatomicalArm(ctx, pose.frontShoulder, pose.frontHand, 1, pose.armWidth, fighter, true);

    // 10. Draw Kusarigama Multi-Segment Dynamic Chain
    if (fighter.weapon === 'KUSARIGAMA') {
      this.drawKusarigamaChain(ctx, pose.frontHand, fighter);
    }

    // 11. Draw Calligraphic Weapon Slash Arcs during active attack frames
    if (fighter.state === 'ATTACKING' && fighter.currentMove) {
      const progress = fighter.frameCounter / fighter.currentMove.duration;
      if (fighter.frameCounter >= fighter.currentMove.hitStart && fighter.frameCounter <= fighter.currentMove.hitEnd) {
        this.drawInkBrushTrail(ctx, pose.frontHand, fighter.weapon, progress, auraColor);
      }
    }

    ctx.restore();
  }

  // --- INITIALIZE POSE STATE FOR LERP SMOOTHING ---
  ensureFighterPoseState(fighter) {
    if (fighter.poseState) return;

    const props = this.getFighterProportions(fighter);

    fighter.poseState = {
      hip: { x: 0, y: -50 * props.heightScale },
      head: { x: 2, y: -104 * props.heightScale },
      spineTilt: 0,
      frontShoulder: { x: 8 * props.widthScale, y: -82 * props.heightScale },
      backShoulder: { x: -8 * props.widthScale, y: -86 * props.heightScale },
      frontFoot: { x: 18 * props.widthScale, y: 0 },
      backFoot: { x: -20 * props.widthScale, y: 0 },
      frontHand: { x: 24 * props.widthScale, y: -64 * props.heightScale },
      backHand: { x: 12 * props.widthScale, y: -72 * props.heightScale },
      legWidth: props.legThick,
      armWidth: props.armThick,
      // Cloth & Chain physics states
      bandanaTails: [
        { x: -16, y: -102, vx: 0, vy: 0 },
        { x: -28, y: -100, vx: 0, vy: 0 },
        { x: -42, y: -98, vx: 0, vy: 0 }
      ],
      sashTails: [
        { x: -4, y: -46, vx: 0, vy: 0 },
        { x: -8, y: -32, vx: 0, vy: 0 },
        { x: -12, y: -18, vx: 0, vy: 0 }
      ],
      chainLinks: [
        { x: 0, y: 0, vx: 0, vy: 0 },
        { x: 15, y: 10, vx: 0, vy: 0 },
        { x: 30, y: 15, vx: 0, vy: 0 },
        { x: 45, y: 12, vx: 0, vy: 0 },
        { x: 60, y: 5, vx: 0, vy: 0 },
        { x: 75, y: -5, vx: 0, vy: 0 }
      ],
      afterimages: []
    };
  }

  // --- GET CHARACTER PROPORTIONS ---
  getFighterProportions(fighter) {
    if (fighter.proportions) return fighter.proportions;

    // Check CONFIG opponents
    if (window.CONFIG && window.CONFIG.OPPONENTS) {
      const opp = window.CONFIG.OPPONENTS.find(o => o.name === fighter.name || o.id === fighter.name.toLowerCase());
      if (opp && opp.proportions) return opp.proportions;
    }

    // Default Proportions for Shadow (Athletic Ninja)
    return {
      heightScale: 1.0,
      widthScale: 1.0,
      armThick: 7,
      legThick: 8,
      chestWidth: 17,
      waistWidth: 10
    };
  }

  // --- POSE INTERPOLATION ENGINE (BUTTERY SMOOTH TRANSITIONS) ---
  interpolatePose(fighter, target) {
    const s = fighter.poseState;
    if (!s) return target;

    // Determine adaptive smoothing factor based on state
    // Fast snap for attacks, smooth blend for idle/walk, heavy damp for knockdown
    let lerpRate = 0.22;
    if (fighter.state === 'ATTACKING') {
      lerpRate = 0.42; // Snappy martial arts extension
    } else if (fighter.state === 'HITSTUN') {
      lerpRate = 0.38; // Sharp whiplash
    } else if (fighter.state === 'KNOCKED_DOWN') {
      lerpRate = 0.18; // Weighty ragdoll collapse
    } else if (fighter.state === 'ROLLING') {
      lerpRate = 0.32;
    } else {
      lerpRate = 0.18; // Buttery fluid idle/walking
    }

    const lerp = (curr, tgt, rate) => {
      if (typeof tgt !== 'number' || isNaN(tgt)) return (typeof curr === 'number' && !isNaN(curr)) ? curr : 0;
      if (typeof curr !== 'number' || isNaN(curr)) return tgt;
      return curr + (tgt - curr) * rate;
    };

    // Sanitize any existing corrupted NaN states
    if (isNaN(s.hip.x)) s.hip.x = target.hip.x;
    if (isNaN(s.hip.y)) s.hip.y = target.hip.y;
    if (isNaN(s.head.x)) s.head.x = target.head.x;
    if (isNaN(s.head.y)) s.head.y = target.head.y;
    if (isNaN(s.spineTilt)) s.spineTilt = target.spineTilt;
    if (isNaN(s.frontShoulder.x)) s.frontShoulder.x = target.frontShoulder.x;
    if (isNaN(s.frontShoulder.y)) s.frontShoulder.y = target.frontShoulder.y;
    if (isNaN(s.backShoulder.x)) s.backShoulder.x = target.backShoulder.x;
    if (isNaN(s.backShoulder.y)) s.backShoulder.y = target.backShoulder.y;
    if (isNaN(s.frontFoot.x)) s.frontFoot.x = target.frontFoot.x;
    if (isNaN(s.frontFoot.y)) s.frontFoot.y = target.frontFoot.y;
    if (isNaN(s.backFoot.x)) s.backFoot.x = target.backFoot.x;
    if (isNaN(s.backFoot.y)) s.backFoot.y = target.backFoot.y;
    if (isNaN(s.frontHand.x)) s.frontHand.x = target.frontHand.x;
    if (isNaN(s.frontHand.y)) s.frontHand.y = target.frontHand.y;
    if (isNaN(s.backHand.x)) s.backHand.x = target.backHand.x;
    if (isNaN(s.backHand.y)) s.backHand.y = target.backHand.y;

    // Interpolate key anatomical anchors
    s.hip.x = lerp(s.hip.x, target.hip.x, lerpRate);
    s.hip.y = lerp(s.hip.y, target.hip.y, lerpRate);

    s.head.x = lerp(s.head.x, target.head.x, lerpRate);
    s.head.y = lerp(s.head.y, target.head.y, lerpRate);

    s.spineTilt = lerp(s.spineTilt, target.spineTilt, lerpRate);

    s.frontShoulder.x = lerp(s.frontShoulder.x, target.frontShoulder.x, lerpRate);
    s.frontShoulder.y = lerp(s.frontShoulder.y, target.frontShoulder.y, lerpRate);

    s.backShoulder.x = lerp(s.backShoulder.x, target.backShoulder.x, lerpRate);
    s.backShoulder.y = lerp(s.backShoulder.y, target.backShoulder.y, lerpRate);

    s.frontFoot.x = lerp(s.frontFoot.x, target.frontFoot.x, lerpRate);
    s.frontFoot.y = lerp(s.frontFoot.y, target.frontFoot.y, lerpRate);

    s.backFoot.x = lerp(s.backFoot.x, target.backFoot.x, lerpRate);
    s.backFoot.y = lerp(s.backFoot.y, target.backFoot.y, lerpRate);

    s.frontHand.x = lerp(s.frontHand.x, target.frontHand.x, lerpRate);
    s.frontHand.y = lerp(s.frontHand.y, target.frontHand.y, lerpRate);

    s.backHand.x = lerp(s.backHand.x, target.backHand.x, lerpRate);
    s.backHand.y = lerp(s.backHand.y, target.backHand.y, lerpRate);

    s.legWidth = target.legWidth;
    s.armWidth = target.armWidth;

    return s;
  }

  // --- TARGET KINEMATICS GENERATOR ---
  calculateTargetPose(fighter) {
    const isAttacking = fighter.state === 'ATTACKING' && fighter.currentMove;
    const isHitstun = fighter.state === 'HITSTUN';
    const isKnockedDown = fighter.state === 'KNOCKED_DOWN';
    const isRolling = fighter.state === 'ROLLING';
    const move = fighter.currentMove;

    const props = this.getFighterProportions(fighter);
    const hs = props.heightScale;
    const ws = props.widthScale;

    const time = Date.now();
    // Diaphragm breathing with subtle shoulder rise
    const idleCycle = Math.sin(time * 0.0032);
    const breatheY = idleCycle * (2.0 * hs);

    // Base Skeletal Anchors (Sleek 50/50 Human Martial Arts Silhouette Proportions)
    let hip = { x: 0, y: -50 * hs + breatheY * 0.4 };
    let spineTilt = 0;
    let shoulderY = -84 * hs + breatheY;
    let head = { x: 3 * ws, y: -104 * hs + breatheY * 1.2 };

    let frontShoulder = { x: 8 * ws, y: shoulderY + 2 };
    let backShoulder = { x: -8 * ws, y: shoulderY - 2 };

    // Default Stance Feet (Natural athletic fighting stance, feet firmly grounded at y=0)
    let frontFoot = { x: 18 * ws, y: 0 };
    let backFoot = { x: -20 * ws, y: 0 };

    // Default Stance Guard Hands
    let frontHand = { x: 26 * ws, y: -64 * hs + idleCycle * 2 };
    let backHand = { x: 12 * ws, y: -72 * hs + idleCycle * 1.5 };

    // Stance Variations
    const stance = (fighter.visuals && fighter.visuals.stance) || 'karate';
    if (stance === 'predator') { // Lynx feral stance (low predatory center of gravity)
      head.y += 6 * hs;
      head.x += 10 * ws;
      hip.y += 5 * hs;
      spineTilt = 0.14;
      frontHand = { x: 32 * ws, y: -58 * hs + idleCycle * 2 };
      backHand = { x: 18 * ws, y: -64 * hs };
      frontFoot.x = 22 * ws;
      backFoot.x = -24 * ws;
    } else if (stance === 'heavy') { // Brick underground enforcer
      head.x -= 2 * ws;
      spineTilt = -0.04;
      frontHand = { x: 22 * ws, y: -74 * hs + idleCycle * 1.5 };
      backHand = { x: 8 * ws, y: -80 * hs };
      frontFoot.x = 22 * ws;
      backFoot.x = -26 * ws;
    } else if (stance === 'assassin') { // Needle silent assassin
      head.x += 6 * ws;
      head.y += 4 * hs;
      spineTilt = 0.10;
      frontHand = { x: 30 * ws, y: -70 * hs };
      backHand = { x: -4 * ws, y: -78 * hs }; // Hand near back katana hilt!
      frontFoot.x = 20 * ws;
      backFoot.x = -22 * ws;
    } else if (stance === 'ronin') { // Ghost cursed ronin
      spineTilt = -0.05;
      frontHand = { x: 24 * ws, y: -60 * hs + idleCycle * 2 };
      backHand = { x: 10 * ws, y: -68 * hs };
      frontFoot.x = 18 * ws;
      backFoot.x = -22 * ws;
    }

    // --- BIOMECHANICAL 4-PHASE HUMAN GAIT CYCLE ---
    if (Math.abs(fighter.vx) > 0.35 && !isAttacking && !isHitstun && !isRolling) {
      const walkCadence = 0.013;
      const walkProgress = time * walkCadence;
      const walkSine = Math.sin(walkProgress);
      const walkCos = Math.cos(walkProgress);

      // Stride Length & Apex
      const strideLen = 26 * ws;
      const stepLift = 12 * hs;

      // Heel-strike to Toe-off foot trajectories
      frontFoot.x = walkSine * strideLen + 4 * ws;
      frontFoot.y = Math.min(0, -Math.max(0, walkCos) * stepLift);

      backFoot.x = -walkSine * strideLen - 4 * ws;
      backFoot.y = Math.min(0, -Math.max(0, -walkCos) * stepLift);

      // Inverted Pendulum Pelvic Bounce (Two vertical oscillations per full stride!)
      const pelvicBounce = Math.abs(walkCos) * (3.8 * hs);
      hip.y = -50 * hs + pelvicBounce;

      // Natural Human Reciprocal Arm-Leg Counter-Swing
      frontHand.x = 20 * ws - walkSine * (20 * ws);
      frontHand.y = -64 * hs + walkCos * (8 * hs);
      backHand.x = 8 * ws + walkSine * (18 * ws);
      backHand.y = -72 * hs - walkCos * (8 * hs);

      // Torso Leaning into Direction of Motion
      const forwardLean = (fighter.vx * fighter.facing > 0) ? 0.12 : -0.08;
      spineTilt = forwardLean;
      head.x += forwardLean * 20 * ws;
    }

    // --- DEFENSIVE GUARD (TIGHT HIGH GUARD) ---
    if (fighter.isBlocking) {
      frontHand = { x: 18 * ws, y: -90 * hs };
      backHand = { x: 10 * ws, y: -84 * hs };
      head.x -= 4 * ws;
      head.y += 2 * hs;
      spineTilt = -0.08;
      frontFoot.x = 14 * ws;
      backFoot.x = -24 * ws;
    }

    // --- HITSTUN REACTION (WHIPLASH & SPINAL ARC) ---
    if (isHitstun) {
      const stunProg = Math.min(1.0, fighter.frameCounter / 18);
      const stunArc = Math.sin(stunProg * Math.PI);
      head.x = -26 * stunArc * ws;
      head.y = -86 * hs - stunArc * 8 * hs;
      spineTilt = -0.26 * stunArc;
      frontHand = { x: -8 * ws, y: -62 * hs };
      backHand = { x: -18 * ws, y: -52 * hs };
      hip.y += stunArc * 5 * hs;
    }

    // --- KNOCKED DOWN (WEIGHTY FLOOR RAGDOLL COLLAPSE) ---
    if (isKnockedDown) {
      hip = { x: 0, y: -10 * hs };
      head = { x: -56 * ws, y: -8 * hs };
      frontShoulder = { x: -28 * ws, y: -10 * hs };
      backShoulder = { x: -32 * ws, y: -10 * hs };
      frontFoot = { x: 38 * ws, y: -4 * hs };
      backFoot = { x: 22 * ws, y: -12 * hs };
      frontHand = { x: -12 * ws, y: -4 * hs };
      backHand = { x: -22 * ws, y: -4 * hs };
      spineTilt = -1.45;
    }

    // --- ACROBATIC ROLLS & DODGES ---
    if (isRolling) {
      const rollAngle = (fighter.frameCounter / 20) * Math.PI * 2;
      hip.y = -26 * hs + Math.sin(rollAngle) * (12 * hs);
      head.x = Math.cos(rollAngle) * (26 * ws);
      head.y = hip.y + Math.sin(rollAngle) * (26 * hs) - 10 * hs;
      frontFoot.x = -Math.cos(rollAngle) * (24 * ws);
      frontFoot.y = hip.y - Math.sin(rollAngle) * (24 * hs);
      backFoot.x = -Math.cos(rollAngle + 0.5) * (20 * ws);
      backFoot.y = hip.y - Math.sin(rollAngle + 0.5) * (20 * hs);
      frontHand.x = Math.sin(rollAngle) * (20 * ws);
      frontHand.y = hip.y + Math.cos(rollAngle) * (20 * hs);
      spineTilt = rollAngle;
    }

    // --- 6-PHASE KINETIC CHAIN COMBAT STRIKES ---
    if (isAttacking) {
      const duration = Math.max(1, move.duration || 20);
      const progress = Math.min(1.0, Math.max(0, fighter.frameCounter / duration));
      const hitStart = move.hitStart !== undefined ? move.hitStart : Math.floor(duration * 0.35);
      const hitEnd = move.hitEnd !== undefined ? move.hitEnd : Math.floor(duration * 0.65);
      const hitStartRatio = hitStart / duration;
      const hitEndRatio = hitEnd / duration;

      let strikeFactor = 0;
      let hipTorque = 0;

      if (progress < hitStartRatio) {
        // Phase 1: Anticipation / Coiling (Kinetic Windup)
        const denom = hitStartRatio > 0 ? hitStartRatio : 0.001;
        const t = progress / denom;
        strikeFactor = -0.22 * Math.sin(t * Math.PI * 0.5); // Slight coiling back
        hipTorque = -0.14 * t;
      } else if (progress <= hitEndRatio) {
        // Phase 2 & 3: Hip Drive & Explosive Extension
        const denom = (hitEndRatio - hitStartRatio) || 0.001;
        const t = (progress - hitStartRatio) / denom;
        strikeFactor = Math.sin(t * Math.PI * 0.5); // Fast explosive snap
        hipTorque = 0.24 * strikeFactor;
      } else {
        // Phase 4, 5 & 6: Impact Hold, Momentum Follow-through & Controlled Recovery
        const denom = (1.0 - hitEndRatio) || 0.001;
        const t = (progress - hitEndRatio) / denom;
        strikeFactor = Math.cos(t * Math.PI * 0.5); // Smooth natural deceleration
        hipTorque = 0.24 * strikeFactor;
      }

      if (!isNaN(hipTorque)) {
        spineTilt = hipTorque;
        head.x += hipTorque * (24 * ws);
      }

      if (move.type === 'punch') {
        const fullReach = (move.reach + 30) * strikeFactor * ws;
        frontHand.x = 20 * ws + fullReach;
        frontHand.y = (move.heightOffset || -60) * hs;

        // Opposite arm chambers tightly back to ribs
        backHand.x = 5 * ws - strikeFactor * (16 * ws);
        backHand.y = -70 * hs + strikeFactor * (4 * hs);

        // Front plant foot steps firmly forward into strike
        frontFoot.x += strikeFactor * (18 * ws);
      } else if (move.type === 'kick') {
        const fullReach = (move.reach + 35) * strikeFactor * ws;
        frontFoot.x = 10 * ws + fullReach;
        frontFoot.y = (move.heightOffset || -50) * hs;

        // Biomechanical Counter-Balance: Torso leans back to balance heavy leg mass
        head.x -= strikeFactor * (24 * ws);
        spineTilt -= strikeFactor * 0.38;
        backHand.x -= strikeFactor * (22 * ws);
        frontHand.y = -80 * hs; // Guard remains raised defensively
      } else if (move.type === 'throw') {
        const throwProgress = Math.sin(progress * Math.PI);
        frontHand.x = 36 * throwProgress * ws;
        frontHand.y = -65 * hs - throwProgress * 10 * hs;
        backHand.x = 26 * throwProgress * ws;
        backHand.y = -75 * hs;
        spineTilt = throwProgress * 0.4;
      } else if (move.type === 'ranged') {
        // Dedicated authentic Ninja Shuriken Throwing Kinetics
        const throwProgress = progress;
        if (throwProgress < 0.42) {
          // Windup / Cocking: throwing hand raised near ear/shoulder
          const t = throwProgress / 0.42;
          frontHand.x = 24 * ws - t * (36 * ws);
          frontHand.y = -64 * hs - t * (16 * hs);
          backHand.x = 8 * ws - t * (12 * ws);
          backHand.y = -56 * hs;
          spineTilt = -0.16 * t;
          head.x -= 4 * ws * t;
          frontFoot.x = 16 * ws;
          backFoot.x = -22 * ws;
        } else if (throwProgress < 0.70) {
          // Explosive whip snap release: arm whips forward pointing at target
          const t = (throwProgress - 0.42) / 0.28;
          frontHand.x = -12 * ws + t * (54 * ws);
          frontHand.y = -80 * hs + t * (12 * hs);
          backHand.x = -4 * ws - t * (10 * ws);
          backHand.y = -62 * hs;
          spineTilt = -0.16 + t * 0.32;
          head.x += t * (6 * ws);
          frontFoot.x = 20 * ws;
        } else {
          // Smooth recovery back to idle guard
          const t = (throwProgress - 0.70) / 0.30;
          frontHand.x = 42 * ws - t * (16 * ws);
          frontHand.y = -68 * hs + t * (4 * hs);
          backHand.x = -14 * ws + t * (26 * ws);
          backHand.y = -62 * hs - t * (10 * hs);
          spineTilt = 0.16 * (1 - t);
          head.x = 3 * ws;
        }
      }
    }

    return {
      hip, head, spineTilt,
      frontShoulder, backShoulder,
      frontFoot, backFoot,
      frontHand, backHand,
      legWidth: props.legThick,
      armWidth: props.armThick
    };
  }

  // --- 2-BONE ANALYTICAL IK LEGS ---
  drawAnatomicalLeg(ctx, hip, foot, bendDir, width, fighter, isFront) {
    const props = this.getFighterProportions(fighter);
    const thighLen = 30 * props.heightScale;
    const shinLen = 30 * props.heightScale;

    const dx = foot.x - hip.x;
    const dy = foot.y - hip.y;
    const dist = Math.min(thighLen + shinLen - 0.5, Math.max(12, Math.sqrt(dx * dx + dy * dy)));

    const baseAngle = Math.atan2(dy, dx);
    const cosAngle = (thighLen * thighLen + dist * dist - shinLen * shinLen) / (2 * thighLen * dist);
    const clampedCos = Math.max(-1, Math.min(1, cosAngle));
    // Both knees naturally flex forward in human anatomy
    const kneeAngleOffset = -Math.acos(clampedCos);

    const knee = {
      x: hip.x + Math.cos(baseAngle + kneeAngleOffset) * thighLen,
      y: hip.y + Math.sin(baseAngle + kneeAngleOffset) * thighLen
    };

    // 1. Thigh Musculature Contour
    ctx.lineWidth = width + 3.0;
    ctx.beginPath();
    ctx.moveTo(hip.x, hip.y);
    ctx.quadraticCurveTo((hip.x + knee.x) / 2 + (isFront ? 2 : 1), (hip.y + knee.y) / 2, knee.x, knee.y);
    ctx.stroke();

    // Knee cap solid joint fill (eliminates joint gaps/creases)
    ctx.beginPath();
    ctx.arc(knee.x, knee.y, (width + 3.0) / 2, 0, Math.PI * 2);
    ctx.fill();

    // 2. Calf & Wrapped Shin (Kyahan / Suneate Armor)
    ctx.lineWidth = width + 1.2;
    ctx.beginPath();
    ctx.moveTo(knee.x, knee.y);
    ctx.quadraticCurveTo((knee.x + foot.x) / 2 - 1.5, (knee.y + foot.y) / 2, foot.x, foot.y);
    ctx.stroke();

    // Armored Greaves (Suneate) for Heavy Armor / Brick
    if (fighter.armor === 'SHADOW_ARMOR' || (fighter.proportions && fighter.proportions.legThick > 10)) {
      ctx.lineWidth = width + 4.0;
      ctx.strokeStyle = '#100c14';
      ctx.beginPath();
      ctx.moveTo(knee.x + 1, knee.y + 4);
      ctx.lineTo(foot.x, foot.y - 6);
      ctx.stroke();
      ctx.strokeStyle = '#060608'; // Restore
    }

    // 3. Ninja Tabi Foot (Split-Toe and Arch)
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(foot.x - 7, foot.y); // Heel
    ctx.lineTo(foot.x + 10, foot.y); // Sole
    ctx.lineTo(foot.x + 11, foot.y - 4); // Split toe
    ctx.lineTo(foot.x + 2, foot.y - 5);  // Ankle bridge
    ctx.lineTo(foot.x - 6, foot.y - 4);
    ctx.closePath();
    ctx.fill();
  }

  // --- 2-BONE ANALYTICAL IK ARMS & WEAPONS ---
  drawAnatomicalArm(ctx, shoulder, hand, bendDir, width, fighter, isFront) {
    const props = this.getFighterProportions(fighter);
    const bicepLen = 26 * props.heightScale;
    const forearmLen = 26 * props.heightScale;

    const dx = hand.x - shoulder.x;
    const dy = hand.y - shoulder.y;
    const dist = Math.min(bicepLen + forearmLen - 0.5, Math.max(8, Math.sqrt(dx * dx + dy * dy)));

    const baseAngle = Math.atan2(dy, dx);
    const cosAngle = (bicepLen * bicepLen + dist * dist - forearmLen * forearmLen) / (2 * bicepLen * dist);
    const clampedCos = Math.max(-1, Math.min(1, cosAngle));
    const elbowOffset = Math.acos(clampedCos) * (bendDir > 0 ? -1 : 1);

    const elbow = {
      x: shoulder.x + Math.cos(baseAngle + elbowOffset) * bicepLen,
      y: shoulder.y + Math.sin(baseAngle + elbowOffset) * bicepLen
    };

    // 1. Deltoid & Bicep
    ctx.lineWidth = width + 2.5;
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.lineTo(elbow.x, elbow.y);
    ctx.stroke();

    // 2. Forearm Bracer (Kote)
    ctx.lineWidth = width + 0.5;
    ctx.beginPath();
    ctx.moveTo(elbow.x, elbow.y);
    ctx.lineTo(hand.x, hand.y);
    ctx.stroke();

    // Armored Gauntlets (Kote plates) for Heavy Armor
    if (fighter.armor === 'SHADOW_ARMOR' || (fighter.proportions && fighter.proportions.armThick > 9)) {
      ctx.lineWidth = width + 3.5;
      ctx.strokeStyle = '#120e18';
      ctx.beginPath();
      ctx.moveTo(elbow.x, elbow.y);
      ctx.lineTo(hand.x - 2, hand.y - 2);
      ctx.stroke();
      ctx.strokeStyle = '#060608';
    }

    // 3. Hand & Fist / Weapon Attachment
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw Weapon (Front hand always, back hand if dual-wielding like KNIVES or LYNX_CLAWS)
    const isDual = fighter.weapon === 'KNIVES' || fighter.weapon === 'LYNX_CLAWS';
    if (isFront || isDual) {
      this.drawDetailedWeapon(ctx, hand, elbow, fighter.weapon, isFront, fighter);
    }
  }

  // --- ANATOMICAL TORSO & MULTI-TIER ARMOR CUIRASS ---
  drawAnatomicalTorso(ctx, pose, fighter) {
    const hip = pose.hip;
    const shoulderY = (pose.frontShoulder.y + pose.backShoulder.y) / 2;
    const props = this.getFighterProportions(fighter);
    const chestWidth = props.chestWidth;
    const waistWidth = props.waistWidth;

    ctx.save();
    ctx.translate(hip.x, hip.y);
    ctx.rotate(pose.spineTilt);

    const dy = shoulderY - hip.y;

    // Muscular V-Taper Torso Silhouette
    ctx.beginPath();
    ctx.moveTo(-chestWidth, dy + 4);       // Left Deltoid
    ctx.lineTo(-chestWidth + 3, dy - 2);   // Clavicle Peak
    ctx.lineTo(0, dy + 2);                 // Neck Root
    ctx.lineTo(chestWidth - 3, dy - 2);    // Right Clavicle
    ctx.lineTo(chestWidth, dy + 4);        // Right Deltoid
    ctx.lineTo(waistWidth, -8);            // Tapered Waist
    ctx.lineTo(waistWidth + 3, 2);         // Hip Iliac Crest
    ctx.lineTo(-waistWidth - 3, 2);
    ctx.lineTo(-waistWidth, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // White Gi Lapel Accents for Shin
    if (fighter.visuals && fighter.visuals.hasGiTrim) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-chestWidth + 4, dy + 2);
      ctx.lineTo(3, -6);
      ctx.moveTo(chestWidth - 4, dy + 2);
      ctx.lineTo(-3, -6);
      ctx.stroke();
    }

    // ARMOR RENDERING ACCORDING TO EQUIPPED ARMOR
    if (fighter.armor === 'LEATHER_VEST') {
      // Leather Vest: Riveted Cross Straps & Chest Plate
      ctx.strokeStyle = '#181216';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-chestWidth + 3, dy + 6);
      ctx.lineTo(waistWidth - 2, -6);
      ctx.moveTo(chestWidth - 3, dy + 6);
      ctx.lineTo(-waistWidth + 2, -6);
      ctx.stroke();

      // Brass Buckle Rivet
      ctx.fillStyle = '#c98836';
      ctx.beginPath();
      ctx.arc(0, (dy - 6) / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (fighter.armor === 'SHADOW_ARMOR' || (fighter.visuals && fighter.visuals.hasSpikedPauldrons)) {
      // Samurai O-Yoroi: Tiered Sode Shoulder Pauldrons & Cuirass Plates
      ctx.fillStyle = '#060608';
      ctx.strokeStyle = '#221a24';
      ctx.lineWidth = 2.5;

      // Left & Right Tiered Pauldrons (Sode)
      [-1, 1].forEach(side => {
        const px = side * (chestWidth + 2);
        for (let tier = 0; tier < 3; tier++) {
          const ty = dy + tier * 5;
          ctx.beginPath();
          ctx.rect(px - (side > 0 ? 2 : 7), ty, 9, 4.5);
          ctx.fill();
          ctx.stroke();
        }
      });

      // Segmented Breastplate (Do) Horizontal Ribs
      ctx.strokeStyle = '#1a1420';
      ctx.lineWidth = 2;
      for (let r = 0; r < 3; r++) {
        const ry = dy + 12 + r * 7;
        ctx.beginPath();
        ctx.moveTo(-chestWidth + 4, ry);
        ctx.lineTo(chestWidth - 4, ry);
        ctx.stroke();
      }
    }

    // Broad Martial Arts Belt (Obi Sash)
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#08080a';
    ctx.beginPath();
    ctx.moveTo(-waistWidth - 2, -4);
    ctx.lineTo(waistWidth + 2, -4);
    ctx.stroke();

    ctx.restore();
  }

  // --- BACK ACCESSORIES (KATANA SCABBARD / SAYA) ---
  drawBackAccessories(ctx, pose, fighter) {
    if (fighter.weapon !== 'KATANA' && (!fighter.visuals || fighter.visuals.stance !== 'assassin')) return;

    ctx.save();
    ctx.translate(pose.hip.x, pose.hip.y);
    ctx.rotate(pose.spineTilt);

    // Diagonal Scabbard across back
    ctx.strokeStyle = '#0c0a10';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-16, -12);
    ctx.lineTo(18, -48);
    ctx.stroke();

    // Golden Kojiri end-cap
    ctx.fillStyle = '#c98836';
    ctx.beginPath();
    ctx.arc(-16, -12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- SHAOLIN PRAYER BEADS (MALA) FOR KEN ---
  drawPrayerBeads(ctx, pose) {
    ctx.save();
    ctx.translate(pose.hip.x, pose.hip.y);
    ctx.rotate(pose.spineTilt);

    const shoulderY = (pose.frontShoulder.y + pose.backShoulder.y) / 2 - pose.hip.y;
    ctx.fillStyle = '#8b5a2b';

    // Loop of prayer beads around neck
    for (let i = 0; i < 9; i++) {
      const angle = (i / 8) * Math.PI;
      const bx = Math.cos(angle) * 11;
      const by = shoulderY + 8 + Math.sin(angle) * 14;
      ctx.beginPath();
      ctx.arc(bx, by, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- SPECTRAL HAORI CAPE FOR GHOST ---
  drawSpectralCape(ctx, pose, fighter) {
    ctx.save();
    ctx.translate(pose.hip.x, pose.hip.y);
    ctx.rotate(pose.spineTilt);

    const time = Date.now();
    const wind = Math.sin(time * 0.006) * 8 - (fighter.vx * fighter.facing) * 5;

    ctx.fillStyle = 'rgba(15, 8, 20, 0.85)';
    ctx.strokeStyle = 'rgba(142, 68, 173, 0.45)';
    ctx.lineWidth = 1.5;

    const shoulderY = (pose.frontShoulder.y + pose.backShoulder.y) / 2 - pose.hip.y;

    // Tattered ragged haori cape blowing backward
    ctx.beginPath();
    ctx.moveTo(-12, shoulderY + 4);
    ctx.quadraticCurveTo(-28 + wind * 0.6, shoulderY + 25, -38 + wind, 20);
    ctx.lineTo(-24 + wind * 0.7, 24);
    ctx.quadraticCurveTo(-18 + wind * 0.4, shoulderY + 30, -4, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // --- ETHEREAL AFTERIMAGE GHOST TRAIL ---
  drawEtherealAfterimages(ctx, fighter) {
    const s = fighter.poseState;
    if (!s) return;

    // Cache afterimage position every few frames when moving
    if (Math.abs(fighter.vx) > 0.6 || fighter.state === 'ATTACKING') {
      if (!s.afterimages) s.afterimages = [];
      s.afterimages.unshift({
        x: -fighter.vx * 3.5,
        alpha: 0.38
      });
      if (s.afterimages.length > 3) s.afterimages.pop();
    }

    if (s.afterimages) {
      s.afterimages.forEach((img, i) => {
        img.alpha *= 0.86;
        if (img.alpha > 0.04) {
          ctx.save();
          ctx.translate(img.x * (i + 1), 0);
          ctx.globalAlpha = img.alpha;
          ctx.shadowColor = '#9b59b6';
          ctx.shadowBlur = 14;
          ctx.fillStyle = 'rgba(74, 20, 90, 0.35)';
          // Silhouette placeholder
          ctx.beginPath();
          ctx.ellipse(0, -45, 16, 45, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
    }
  }

  // --- HEAD & FACE ENTRY POINT ---
  drawHeadAndFace(ctx, head, fighter) {
    const isTrueVanish = fighter && fighter.isInvisible && fighter.currentMove && fighter.currentMove.id === 'LYNX_TRUE_VANISH';
    if (isTrueVanish) {
      ctx.globalAlpha = 1.0;
    }
    this.drawAnatomicalHead(ctx, head, fighter);
    if (isTrueVanish) {
      ctx.globalAlpha = 0.05;
    }
  }

  // --- ANATOMICAL HEAD, HELMETS & OCULAR LIGHT ---
  drawAnatomicalHead(ctx, head, fighter) {
    ctx.save();
    ctx.translate(head.x, head.y);

    const props = this.getFighterProportions(fighter);
    const helm = fighter.helm || 'HEADBAND';

    // 1. Base Ninja Cowl & Mask Silhouette
    ctx.beginPath();
    ctx.moveTo(-10, -12); // Brow peak
    ctx.quadraticCurveTo(0, -16, 11, -11); // Cowl curve
    ctx.lineTo(13, -3);   // Forehead angle
    ctx.lineTo(14, 4);    // Cheekbone
    ctx.lineTo(8, 12);    // Jawline
    ctx.lineTo(1, 14);    // Chin
    ctx.lineTo(-8, 9);    // Neck connector
    ctx.lineTo(-12, -2);  // Ear cowl curve
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. HELMET SPECIFIC VISUALS
    if (helm === 'WARRIOR_HELM' || (fighter.visuals && fighter.visuals.cowlType === 'straw_ronin')) {
      // Authentic Samurai Kabuto Helmet!
      // Flared Neck Guard (Shikoro)
      ctx.fillStyle = '#060608';
      ctx.strokeStyle = '#2a1a14';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(-14, -4);
      ctx.quadraticCurveTo(-22, 6, -18, 16);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Side Flanges (Fukigaeshi)
      ctx.beginPath();
      ctx.arc(-8, -8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Golden Crescent Maedate Horn Crest
      ctx.strokeStyle = '#f1c40f';
      ctx.shadowColor = '#f39c12';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(3, -22, 14, -Math.PI * 0.75, -Math.PI * 0.25);
      ctx.stroke();
      ctx.shadowBlur = 0; // Restore
    } else if (helm === 'IRON_MASK' || (fighter.visuals && fighter.visuals.cowlType === 'iron_plate')) {
      // Bolted Iron Half-Mask covering jaw and cheek
      ctx.strokeStyle = '#222';
      ctx.fillStyle = '#0a080d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(14, 2);
      ctx.lineTo(14, 6);
      ctx.lineTo(8, 13);
      ctx.lineTo(1, 15);
      ctx.lineTo(-4, 11);
      ctx.lineTo(-2, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Steel Rivets
      ctx.fillStyle = '#7f8c8d';
      [ [11, 4], [7, 10], [2, 12] ].forEach(([rx, ry]) => {
        ctx.beginPath();
        ctx.arc(rx, ry, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      // Ninja Headband (Hitai-ate Plate)
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#18141d';
      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.lineTo(11, -5);
      ctx.stroke();
    }

    // 3. Glowing Ocular Energy (Signature Shadow Fight Look)
    if (fighter.isInvisible && fighter.currentMove && fighter.currentMove.id === 'LYNX_TRUE_VANISH') {
      ctx.globalAlpha = 1.0;
    }
    const eyeX = 7;
    const eyeY = -3;
    const eyeColor = fighter.visuals ? fighter.visuals.eyeColor : (fighter.isBoss ? '#ff1744' : '#e0f7fa');
    const eyeTrail = fighter.visuals ? fighter.visuals.eyeTrailColor : (fighter.isBoss ? 'rgba(255, 23, 68, 0.6)' : 'rgba(0, 229, 255, 0.45)');

    ctx.fillStyle = eyeColor;
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = fighter.isBoss ? 16 : 10;

    // Sharp glowing eye ellipse
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, 4.8, 1.8, Math.PI * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Razor-Sharp Horizontal Eye Energy Streak
    ctx.strokeStyle = eyeTrail;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(eyeX - 1, eyeY);
    ctx.quadraticCurveTo(eyeX - 8, eyeY - 2, eyeX - 18, eyeY - 1);
    ctx.stroke();

    // 4. Demonic Curved Horns for Lynx Boss
    if (fighter.isBoss || (fighter.visuals && fighter.visuals.hasHorns)) {
      ctx.fillStyle = '#060608';
      ctx.strokeStyle = '#22080a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, -14);
      ctx.quadraticCurveTo(-12, -32, -18, -38);
      ctx.quadraticCurveTo(-8, -28, 2, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 5. Bandana Knot & Multi-Segment Physics Ribbon Tails
    this.drawBandanaPhysics(ctx, fighter);

    ctx.restore();
  }

  // --- DYNAMIC CLOTH PHYSICS (BANDANA TAILS) ---
  drawBandanaPhysics(ctx, fighter) {
    ctx.strokeStyle = '#060608';
    ctx.lineWidth = 3.5;
    const time = Date.now();
    const tail1 = Math.sin(time * 0.011) * 6 - fighter.vx * 3.8;
    const tail2 = Math.cos(time * 0.013) * 7 - fighter.vx * 4.8;

    ctx.beginPath();
    ctx.moveTo(-11, -5);
    ctx.quadraticCurveTo(-22, -4 + tail1 * 0.6, -38, -8 + tail1);
    ctx.moveTo(-11, -2);
    ctx.quadraticCurveTo(-20, 4 + tail2 * 0.5, -36, 8 + tail2);
    ctx.stroke();
  }

  // --- DYNAMIC OBI SASH (BELT PHYSICS) ---
  drawDynamicSash(ctx, hip, fighter) {
    ctx.save();
    ctx.translate(hip.x, hip.y);
    ctx.strokeStyle = '#060608';
    ctx.lineWidth = 4.5;

    const sway = Math.sin(Date.now() * 0.007) * 4 - (fighter.vx * fighter.facing) * 3.5;
    ctx.beginPath();
    ctx.moveTo(-3, 2);
    ctx.quadraticCurveTo(-5 + sway * 0.7, 14, -8 + sway * 1.5, 28);
    ctx.stroke();
    ctx.restore();
  }

  // --- DETAILED WEAPONS ENGINE WITH SPECULAR GLEAM & INERTIA SWAY ---
  drawDetailedWeapon(ctx, hand, elbow, weaponId, isFront, fighter) {
    ctx.save();
    ctx.translate(hand.x, hand.y);

    const angle = Math.atan2(hand.y - elbow.y, hand.x - elbow.x);

    // Secondary Weapon Sway based on Fighter Inertia
    let swayAngle = 0;
    if (fighter && Math.abs(fighter.vx) > 0.4) {
      const wpn = window.CONFIG.WEAPONS[weaponId] || window.CONFIG.WEAPONS.FISTS;
      const weight = wpn.weight || 1.0;
      swayAngle = -fighter.vx * fighter.facing * (0.018 * weight);
    }
    ctx.rotate(angle + swayAngle);

    // Dynamic Specular Blade Reflection Angle Physics
    const gleamPulse = Math.abs(Math.sin(angle * 2.2 + Date.now() * 0.0035));
    const gleamAlpha = Math.min(1.0, 0.4 + gleamPulse * 0.55).toFixed(2);

    if (weaponId === 'KATANA' && isFront) {
      // Long Samurai Katana with Curved Hamon Blade & Brass Tsuba
      ctx.lineWidth = 4.2;
      ctx.strokeStyle = '#0a0a0e';
      ctx.beginPath();
      ctx.moveTo(-14, 0); // Wrapped Tsuka hilt
      ctx.lineTo(2, 0);
      ctx.quadraticCurveTo(48, -7, 82, -22); // Elegant curved cutting edge
      ctx.stroke();

      // Brass Guard (Tsuba)
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#c98836';
      ctx.beginPath();
      ctx.moveTo(2, -8);
      ctx.lineTo(2, 8);
      ctx.stroke();

      // Kinetic Specular Blade Gleam
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = `rgba(255, 255, 255, ${gleamAlpha})`;
      ctx.beginPath();
      ctx.moveTo(8, -2);
      ctx.lineTo(76, -19);
      ctx.stroke();
    } else if (weaponId === 'KNIVES') {
      // Twin Tactical Kunai / Combat Daggers
      ctx.lineWidth = 3.8;
      ctx.strokeStyle = '#0a0a0d';
      ctx.beginPath();
      ctx.moveTo(-8, 0); // Ring pommel
      ctx.lineTo(0, 0);
      ctx.lineTo(32, -4); // Double-edged leaf blade
      ctx.lineTo(26, -9);
      ctx.lineTo(0, -3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Blade ridge line gleam
      ctx.strokeStyle = `rgba(255, 255, 255, ${gleamAlpha})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(2, -2);
      ctx.lineTo(30, -4);
      ctx.stroke();
    } else if (weaponId === 'KUSARIGAMA' && isFront) {
      // Blood Reaper Kama Sickle Head
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = '#0a0a0d';
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(14, 0);
      ctx.lineTo(24, -28); // Curved sickle blade
      ctx.quadraticCurveTo(12, -26, 8, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sickle Edge Gleam
      ctx.strokeStyle = `rgba(255, 255, 255, ${gleamAlpha})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(14, -2);
      ctx.lineTo(22, -26);
      ctx.stroke();
    } else if (weaponId === 'LYNX_CLAWS') {
      // Demonic Triple Steel Claws
      ctx.lineWidth = 3.0;
      ctx.strokeStyle = '#141418';
      [-6, 0, 6].forEach(offsetY => {
        ctx.beginPath();
        ctx.moveTo(0, offsetY);
        ctx.quadraticCurveTo(22, offsetY - 10, 40, offsetY - 3);
        ctx.stroke();
      });

      // Sharp Claw Tips Gleam
      ctx.fillStyle = `rgba(255, 255, 255, ${gleamAlpha})`;
      [-6, 0, 6].forEach(offsetY => {
        ctx.beginPath();
        ctx.arc(38, offsetY - 3, 1.3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.restore();
  }

  // --- KUSARIGAMA 6-LINK DYNAMIC CHAIN PHYSICS ---
  drawKusarigamaChain(ctx, frontHand, fighter) {
    ctx.save();
    ctx.translate(frontHand.x, frontHand.y);

    const time = Date.now();
    const isAttacking = fighter.state === 'ATTACKING';
    const chainSwing = isAttacking ? Math.sin(time * 0.02) * 35 : Math.sin(time * 0.005) * 12;

    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2.2;

    // 6-Segment Chain Curve
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(25 + chainSwing * 0.5, 20, 50 + chainSwing, 10);
    ctx.quadraticCurveTo(65 + chainSwing * 0.8, -5, 80 + chainSwing * 1.2, -18);
    ctx.stroke();

    // Iron Weight (Fundo) at chain terminus
    ctx.fillStyle = '#060608';
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(80 + chainSwing * 1.2, -18, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // --- CALLIGRAPHIC INK-BRUSH WEAPON SLASH TRAIL ---
  drawInkBrushTrail(ctx, hand, weaponId, progress, glowColor) {
    ctx.save();
    ctx.translate(hand.x - 10, hand.y);

    const radius = 56;
    const startAngle = -0.65;
    const endAngle = 1.15;
    const sweep = startAngle + (endAngle - startAngle) * progress;

    // Outer translucent ink blur
    ctx.strokeStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 10;
    ctx.globalAlpha = 0.7 * Math.sin(progress * Math.PI);

    ctx.beginPath();
    ctx.arc(0, 0, radius, startAngle, sweep);
    ctx.stroke();

    // Inner bright razor cutting edge
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.2;
    ctx.globalAlpha = 0.95 * Math.sin(progress * Math.PI);
    ctx.beginPath();
    ctx.arc(0, 0, radius, startAngle + 0.1, sweep);
    ctx.stroke();

    ctx.restore();
  }
}

const Skeleton = new SkeletonRenderer();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Skeleton;
} else {
  window.Skeleton = Skeleton;
}
