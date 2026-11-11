/**
 * Shadow Fight 2 Web Edition - Interactive Dojo Lobby Manager
 * Renders the authentic Japanese training dojo with tatami mats, shoji screens,
 * weapon racks, dynamic hanging sandbag with pendulum physics, and an interactive
 * Shadow fighter who can practice moves right inside the main lobby.
 */

class DojoLobbyManager {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.lobbyFighter = null;

    // Hanging Punching Sandbag Physics
    this.sandbag = {
      anchorX: 740,
      anchorY: 70,
      length: 260,
      width: 44,
      height: 140,
      angle: 0,
      angularVelocity: 0,
      angularAccel: 0,
      damping: 0.975,
      impactDent: 0
    };

    this.dustParticles = [];
    this.shockwaves = [];
    this.sunbeams = [];
    this.isActive = false;
  }

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Create Lobby Fighter Entity
    this.resetLobbyFighter();

    // Setup Click/Touch to Attack on Dojo Canvas
    this.setupInteractions();
  }

  resetLobbyFighter() {
    const equipped = window.Armory ? window.Armory.equipped : { weapon: 'FISTS', armor: 'ROBE', helm: 'HEADBAND' };

    this.lobbyFighter = new window.Fighter(420, {
      name: 'SHADOW',
      glow: 'rgba(230, 126, 34, 0.45)',
      facing: 1,
      weapon: equipped.weapon,
      armor: equipped.armor,
      helm: equipped.helm,
      hp: 100,
      proportions: {
        heightScale: 1.0,
        widthScale: 1.0,
        armThick: 7,
        legThick: 8,
        chestWidth: 17,
        waistWidth: 10
      },
      visuals: {
        eyeColor: '#e0f7fa',
        eyeTrailColor: 'rgba(0, 229, 255, 0.45)',
        auraGlow: 'rgba(230, 126, 34, 0.45)',
        stance: 'karate'
      },
      isAI: false
    });
  }

  setupInteractions() {
    if (!this.canvas) return;

    this.canvas.addEventListener('pointerdown', (e) => {
      if (!this.isActive || !this.lobbyFighter) return;
      if (window.Sound) window.Sound.init();

      const rect = this.canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const clickY = (e.clientY - rect.top) * (this.canvas.height / rect.height);

      // If clicked near sandbag, perform attack toward it
      if (clickX > 600) {
        this.lobbyFighter.facing = 1;
        const moves = ['PUNCH_FORWARD', 'KICK_FORWARD', 'PUNCH_NEUTRAL', 'KICK_NEUTRAL', 'PUNCH_UP'];
        const chosen = moves[Math.floor(Math.random() * moves.length)];
        this.lobbyFighter.triggerMove(chosen);
      } else {
        // Attack in current facing
        this.lobbyFighter.triggerMove(Math.random() > 0.5 ? 'PUNCH_FORWARD' : 'KICK_FORWARD');
      }
    });
  }

  updateAndRender() {
    if (!this.ctx || !this.lobbyFighter) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Synchronize equipped weapon/armor from Armory
    if (window.Armory) {
      this.lobbyFighter.weapon = window.Armory.equipped.weapon;
      this.lobbyFighter.armor = window.Armory.equipped.armor;
      this.lobbyFighter.helm = window.Armory.equipped.helm;
    }

    // 1. Process Player Input inside the Dojo
    const input = window.Input.getPlayer1Input(this.lobbyFighter.facing);
    this.updateLobbyFighter(input);

    // 2. Update Sandbag Pendulum Physics
    this.updateSandbagPhysics();

    // 3. Render Dojo Background & Elements
    this.renderDojoScene();

    // 4. Render Sandbag
    this.renderSandbag();

    // 5. Render Shadow Fighter
    window.Skeleton.draw(this.ctx, this.lobbyFighter);

    // 6. Render Particles & Projectiles
    this.updateAndRenderParticles();
    this.updateAndRenderShockwaves();
    this.renderLobbyProjectiles();
  }

  updateAndRenderShockwaves() {
    const ctx = this.ctx;
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha -= 0.06;

      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = sw.alpha;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 3.5 * sw.alpha;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  updateLobbyFighter(input) {
    const f = this.lobbyFighter;

    // Boundaries inside Dojo
    f.x = Math.max(120, Math.min(840, f.x));

    // Simple dummy opponent reference for state machine
    const dummyOpponent = {
      x: this.getSandbagPosition().x,
      y: window.CONFIG.GROUND_Y,
      hp: 999,
      takeHit: (attacker, move) => {
        this.hitSandbag(attacker, move);
      }
    };

    // Update fighter state
    f.update(dummyOpponent, input, {
      spawnSparks: (x, y, count, color) => {
        this.spawnImpactSparks(x, y, count, color);
      },
      addTrauma: () => {}
    });

    // Check direct strike against Sandbag
    if (f.state === 'ATTACKING' && f.currentMove && !f.hasHitCurrentMove) {
      if (f.frameCounter >= f.currentMove.hitStart && f.frameCounter <= f.currentMove.hitEnd) {
        const bagPos = this.getSandbagPosition();
        const dist = Math.abs((f.x + f.currentMove.reach * f.facing) - bagPos.x);
        if (dist < 42 && f.facing === 1) {
          f.hasHitCurrentMove = true;
          this.hitSandbag(f, f.currentMove);
        }
      }
    }
  }

  hitSandbag(attacker, move) {
    const impulse = (move.knockback || 5.5) * 0.015;
    this.sandbag.angularVelocity += impulse;
    this.sandbag.impactDent = 12;

    window.Sound.playSandbagHit();

    // Spawn leather impact dust & shockwave
    const pos = this.getSandbagPosition();
    this.spawnImpactSparks(pos.x - 10, pos.y, 16, '#c98836');

    this.shockwaves.push({
      x: pos.x - 10,
      y: pos.y,
      radius: 6,
      maxRadius: 48,
      color: '#f39c12',
      alpha: 1.0,
      speed: 3.2
    });

    if (window.Game) {
      window.Game.spawnFloatingCombatText(pos.x, pos.y - 40, 'HIT!', '#f39c12');
    }
  }

  updateSandbagPhysics() {
    const gravity = 0.0018;
    this.sandbag.angularAccel = -gravity * Math.sin(this.sandbag.angle);
    this.sandbag.angularVelocity += this.sandbag.angularAccel;
    this.sandbag.angularVelocity *= this.sandbag.damping;
    this.sandbag.angle += this.sandbag.angularVelocity;

    if (this.sandbag.impactDent > 0) {
      this.sandbag.impactDent *= 0.82;
      if (this.sandbag.impactDent < 0.2) this.sandbag.impactDent = 0;
    }
  }

  getSandbagPosition() {
    const x = this.sandbag.anchorX + Math.sin(this.sandbag.angle) * (this.sandbag.length - 40);
    const y = this.sandbag.anchorY + Math.cos(this.sandbag.angle) * (this.sandbag.length - 40);
    return { x, y };
  }

  spawnImpactSparks(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 5;
      this.dustParticles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 1,
        color,
        size: 2.5 + Math.random() * 3,
        life: 1.0,
        decay: 0.04
      });
    }
  }

  renderDojoScene() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const groundY = window.CONFIG.GROUND_Y;

    const is3DActive = window.ThreeScene && window.ThreeScene.isSupported && window.ThreeScene.currentMode === 'dojo';

    if (is3DActive) {
      // 2.5D Hybrid WebGL Mode: 3D Dojo Wall & Weapon Racks are rendered on #bg3dCanvas.
      // Clear 2D canvas transparently so the 3D scene shows through!
      ctx.clearRect(0, 0, w, h);

      // 2. Wall Calligraphy Scroll Banners ("影" Shadow & "武道" Budo)
      this.renderCalligraphyScroll(ctx, 160, 80, '武道');
      this.renderCalligraphyScroll(ctx, 520, 70, '影');

      // 4. Heavy Cedar Wooden Pillars
      ctx.fillStyle = '#180d09';
      ctx.fillRect(40, 0, 32, groundY);
      ctx.fillRect(w - 72, 0, 32, groundY);

      // Ceiling Crossbeam
      ctx.fillStyle = '#140a07';
      ctx.fillRect(0, 40, w, 22);

      // 5. Tatami Floor Line
      ctx.fillStyle = 'rgba(36, 23, 13, 0.45)';
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.strokeStyle = '#5a3118';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(w, groundY);
      ctx.stroke();

      // 6. Subtle Sunlight Streamers
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#ffe9cc';
      ctx.beginPath();
      ctx.moveTo(180, 0);
      ctx.lineTo(340, 0);
      ctx.lineTo(460, groundY);
      ctx.lineTo(260, groundY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return;
    }

    // 1. Back Wall Shoji Paper Lattice & Sunlight
    const wallGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    wallGrad.addColorStop(0, '#3a2016');
    wallGrad.addColorStop(0.5, '#241410');
    wallGrad.addColorStop(1, '#120907');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, w, groundY);

    // Shoji Screen Sliding Doors in Background
    ctx.strokeStyle = '#4e2d1d';
    ctx.lineWidth = 2;
    for (let col = 0; col < 8; col++) {
      const sx = col * 130 + 10;
      ctx.fillStyle = 'rgba(255, 230, 200, 0.06)';
      ctx.fillRect(sx, 40, 115, groundY - 80);
      ctx.strokeRect(sx, 40, 115, groundY - 80);

      // Shoji grid pattern
      for (let row = 1; row <= 5; row++) {
        const sy = 40 + row * 60;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 115, sy);
        ctx.stroke();
      }
    }

    // 2. Wall Calligraphy Scroll Banners ("影" Shadow & "武道" Budo)
    this.renderCalligraphyScroll(ctx, 160, 80, '武道');
    this.renderCalligraphyScroll(ctx, 480, 70, '影');

    // 3. Wooden Weapon Display Rack
    this.renderWeaponRack(ctx, 300, 150);

    // 4. Heavy Cedar Wooden Pillars
    ctx.fillStyle = '#180d09';
    ctx.fillRect(40, 0, 32, groundY);
    ctx.fillRect(w - 72, 0, 32, groundY);

    // Ceiling Crossbeam
    ctx.fillStyle = '#140a07';
    ctx.fillRect(0, 40, w, 22);

    // 5. Tatami Floor Mats
    const floorGrad = ctx.createLinearGradient(0, groundY, 0, h);
    floorGrad.addColorStop(0, '#2d180d');
    floorGrad.addColorStop(0.4, '#1b0e07');
    floorGrad.addColorStop(1, '#090403');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, groundY, w, h - groundY);

    // Tatami mat borders
    ctx.strokeStyle = '#5a3118';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();

    for (let i = 1; i < 5; i++) {
      const tx = i * 200;
      ctx.beginPath();
      ctx.moveTo(tx, groundY);
      ctx.lineTo(tx, h);
      ctx.stroke();
    }

    // 6. Sunlight Streamers (God-Rays)
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#ffe9cc';
    ctx.beginPath();
    ctx.moveTo(180, 0);
    ctx.lineTo(340, 0);
    ctx.lineTo(240, groundY);
    ctx.lineTo(80, groundY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(540, 0);
    ctx.lineTo(700, 0);
    ctx.lineTo(600, groundY);
    ctx.lineTo(440, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  renderCalligraphyScroll(ctx, x, y, kanji) {
    ctx.save();
    // Silk scroll backing
    ctx.fillStyle = '#221510';
    ctx.strokeStyle = '#5c331d';
    ctx.lineWidth = 2;
    ctx.fillRect(x - 24, y, 48, 120);
    ctx.strokeRect(x - 24, y, 48, 120);

    // Parchment center
    ctx.fillStyle = '#f0d9b5';
    ctx.fillRect(x - 18, y + 10, 36, 100);

    // Kanji Character
    ctx.font = '900 24px serif';
    ctx.fillStyle = '#0f0a07';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(kanji, x, y + 60);

    // Wooden scroll rollers
    ctx.fillStyle = '#421a08';
    ctx.fillRect(x - 28, y - 4, 56, 7);
    ctx.fillRect(x - 28, y + 118, 56, 7);
    ctx.restore();
  }

  renderWeaponRack(ctx, x, y) {
    ctx.save();
    // Stand
    ctx.fillStyle = '#2a160d';
    ctx.fillRect(x, y, 8, 85);
    ctx.fillRect(x + 110, y, 8, 85);

    // Cross bars
    ctx.fillRect(x - 10, y + 25, 138, 6);
    ctx.fillRect(x - 10, y + 55, 138, 6);

    // Katana Daisho on rack
    ctx.strokeStyle = '#0a080c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 18, y + 22);
    ctx.lineTo(x + 130, y + 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - 12, y + 52);
    ctx.lineTo(x + 120, y + 50);
    ctx.stroke();

    ctx.restore();
  }

  renderSandbag() {
    const ctx = this.ctx;
    const bag = this.sandbag;

    ctx.save();
    ctx.translate(bag.anchorX, bag.anchorY);
    ctx.rotate(bag.angle);

    // 1. Hanging Iron Chain
    ctx.strokeStyle = '#3d251a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, bag.length - bag.height);
    ctx.stroke();

    // 2. Leather Punching Bag Body
    ctx.translate(0, bag.length - bag.height);

    // Shadow / Lighting Gradient on curved leather
    const leatherGrad = ctx.createLinearGradient(-bag.width / 2, 0, bag.width / 2, 0);
    leatherGrad.addColorStop(0, '#5a1e12');
    leatherGrad.addColorStop(0.35, '#872b1b');
    leatherGrad.addColorStop(0.7, '#4f1a10');
    leatherGrad.addColorStop(1, '#240b07');

    ctx.fillStyle = leatherGrad;
    ctx.strokeStyle = '#2b0c07';
    ctx.lineWidth = 3;

    const dent = bag.impactDent;
    ctx.beginPath();
    ctx.moveTo(-bag.width / 2 + dent, 0);
    ctx.lineTo(bag.width / 2, 0);
    ctx.lineTo(bag.width / 2, bag.height);
    ctx.lineTo(-bag.width / 2 + dent, bag.height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Reinforced leather strap rings
    ctx.strokeStyle = '#c98836';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-bag.width / 2, 18);
    ctx.lineTo(bag.width / 2, 18);
    ctx.moveTo(-bag.width / 2, bag.height - 18);
    ctx.lineTo(bag.width / 2, bag.height - 18);
    ctx.stroke();

    // Iron ring mounts on top
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(-14, 0, 4, 0, Math.PI * 2);
    ctx.arc(14, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  updateAndRenderParticles() {
    const ctx = this.ctx;
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.dustParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderLobbyProjectiles() {
    if (!this.lobbyFighter || !this.lobbyFighter.activeShurikens) return;
    const ctx = this.ctx;
    ctx.save();

    this.lobbyFighter.activeShurikens.forEach(s => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);
      ctx.fillStyle = '#060608';
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(Math.cos((i * Math.PI) / 2) * 12, Math.sin((i * Math.PI) / 2) * 12);
        ctx.lineTo(Math.cos((i * Math.PI) / 2 + Math.PI / 4) * 4, Math.sin((i * Math.PI) / 2 + Math.PI / 4) * 4);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }
}

const Dojo = new DojoLobbyManager();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dojo;
} else {
  window.Dojo = Dojo;
}

