/**
 * Shadow Fight 2 Web Edition - Master Visual & Motion Graphics Renderer
 * 
 * Motion Graphics & Cinematics:
 * - Dynamic Shockwaves: Expanding refraction distortion rings on heavy impacts & throws
 * - Sumi-e Japanese Ink Splatters: Authentic calligraphic ink droplets & spray arcs
 * - Kinetic Action Speedlines: Directional dash trails and radial impact starburst lines
 * - High-Impact Screen Flash Shutter: Visceral impact strobe for critical hits & K.O.
 * - Deep Cinematic Lens Vignette: Dynamic atmospheric focus vignette
 * - Multi-Layer Parallax: Sunset gradient, mountains, bamboo grove, torii gate, pagoda
 * - Wind Physics Sakura Petals, Footstep Dust, Ground Contact Shadows
 * - Quadratic Trauma Screen Shake and Dynamic Distance-Framed Camera
 */

class SceneRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      zoom: 1.0,
      targetZoom: 1.0
    };

    this.trauma = 0;
    this.particles = [];
    this.dustPuffs = [];
    this.sakuraPetals = [];

    // Motion Graphics Systems
    this.shockwaves = [];
    this.inkSplatters = [];
    this.speedLines = [];
    this.radialSpeedLines = [];
    this.flashAlpha = 0;
    this.flashColor = '#ffffff';

    this.initSakura();
  }

  initSakura() {
    this.sakuraPetals = [];
    for (let i = 0; i < 55; i++) {
      this.sakuraPetals.push({
        x: Math.random() * (this.canvas.width + 300) - 150,
        y: Math.random() * this.canvas.height,
        size: 3.5 + Math.random() * 4.5,
        speedX: 0.9 + Math.random() * 1.6,
        speedY: 0.7 + Math.random() * 1.2,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: 0.02 + Math.random() * 0.035,
        oscAmp: 16 + Math.random() * 22,
        oscFreq: 0.002 + Math.random() * 0.003,
        seed: Math.random() * 1000
      });
    }
  }

  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  // --- MOTION GRAPHICS: IMPACT FLASH SHUTTER ---
  triggerScreenFlash(color = '#ffffff', alpha = 0.45) {
    this.flashColor = color;
    this.flashAlpha = Math.min(1.0, this.flashAlpha + alpha);
  }

  // --- MOTION GRAPHICS: EXPANDING DISTORTION SHOCKWAVE ---
  spawnShockwave(x, y, maxRadius = 55, color = '#f39c12', lineWidth = 4) {
    this.shockwaves.push({
      x,
      y,
      radius: 8,
      maxRadius,
      color,
      lineWidth,
      alpha: 1.0,
      speed: (maxRadius - 8) / 14
    });
  }

  // --- MOTION GRAPHICS: SUMI-E INK SPLATTERS ---
  spawnInkSplatter(x, y, count = 16, directionAngle = 0, spread = 0.8) {
    for (let i = 0; i < count; i++) {
      const angle = directionAngle + (Math.random() - 0.5) * spread;
      const speed = 3.5 + Math.random() * 9.5;
      this.inkSplatters.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: 2.2 + Math.random() * 4.5,
        tailLength: 6 + Math.random() * 14,
        alpha: 1.0,
        decay: 0.032 + Math.random() * 0.035
      });
    }
  }

  // --- MOTION GRAPHICS: HORIZONTAL ACTION SPEEDLINES ---
  spawnSpeedLines(x, y, facing, length = 75, count = 4) {
    for (let i = 0; i < count; i++) {
      this.speedLines.push({
        x: x - facing * (Math.random() * 25),
        y: y + (Math.random() - 0.5) * 45,
        length: length + Math.random() * 35,
        vx: facing * (12 + Math.random() * 8),
        alpha: 0.85,
        width: 1.5 + Math.random() * 2.0
      });
    }
  }

  // --- MOTION GRAPHICS: RADIAL IMPACT STARBURST SPEEDLINES ---
  spawnRadialSpeedLines(centerX, centerY, count = 24) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const innerDist = 20 + Math.random() * 30;
      const outerDist = innerDist + 50 + Math.random() * 70;
      this.radialSpeedLines.push({
        cx: centerX,
        cy: centerY,
        angle,
        r1: innerDist,
        r2: outerDist,
        alpha: 1.0,
        decay: 0.065
      });
    }
  }

  spawnSparks(x, y, count, color, speed = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.7) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 1.8,
        color,
        size: 2 + Math.random() * 3.5,
        life: 1.0,
        decay: 0.03 + Math.random() * 0.04
      });
    }
  }

  spawnDust(x, y) {
    for (let i = 0; i < 3; i++) {
      this.dustPuffs.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 2,
        vy: -0.4 - Math.random() * 0.8,
        size: 4 + Math.random() * 4,
        life: 1.0,
        decay: 0.05
      });
    }
  }

  updateCamera(p1, p2) {
    const midX = (p1.x + p2.x) / 2;
    const dist = Math.abs(p1.x - p2.x);

    this.camera.targetX = (this.canvas.width / 2) - midX;
    this.camera.targetY = 0;

    // Distance-based dynamic framing
    const clampedDist = Math.max(130, Math.min(680, dist));
    this.camera.targetZoom = 1.24 - ((clampedDist - 130) / 550) * 0.34;

    // Smooth Lerp
    this.camera.x += (this.camera.targetX - this.camera.x) * 0.08;
    this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.06;

    // Sync 2.5D WebGL Background Camera
    if (window.ThreeScene && window.ThreeScene.isSupported) {
      window.ThreeScene.updateCamera(this.camera.x, this.camera.zoom);
    }

    // Trigger footstep dust and speedlines when running
    if (Math.abs(p1.vx) > 2.5 && p1.y >= window.CONFIG.GROUND_Y) {
      if (Math.random() < 0.25) this.spawnDust(p1.x, window.CONFIG.GROUND_Y);
      if (Math.random() < 0.35) this.spawnSpeedLines(p1.x, p1.y - 45, p1.facing, 45, 1);
    }
    if (Math.abs(p2.vx) > 2.5 && p2.y >= window.CONFIG.GROUND_Y) {
      if (Math.random() < 0.25) this.spawnDust(p2.x, window.CONFIG.GROUND_Y);
      if (Math.random() < 0.35) this.spawnSpeedLines(p2.x, p2.y - 45, p2.facing, 45, 1);
    }
  }

  render(p1, p2, slowMotionFactor = 1.0) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();

    // Screen Shake based on Quadratic Trauma
    let shakeX = 0;
    let shakeY = 0;
    if (this.trauma > 0) {
      const shakeAmt = Math.pow(this.trauma, 2) * 26;
      shakeX = (Math.random() * 2 - 1) * shakeAmt;
      shakeY = (Math.random() * 2 - 1) * shakeAmt;
      this.trauma = Math.max(0, this.trauma - 0.045);
    }

    ctx.translate(this.canvas.width / 2 + shakeX, this.canvas.height / 2 + shakeY);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.canvas.width / 2 + this.camera.x * 0.4, -this.canvas.height / 2);

    // 1. Multi-Layer Parallax Scenery
    this.drawParallaxBackground();

    // 2. Atmospheric Sunbeams / God-Rays
    this.drawSunbeams();

    // 3. Falling Sakura Blossom Petals
    this.drawSakura();

    // 4. Ground Contact Shadows
    this.drawGroundShadow(ctx, p1);
    this.drawGroundShadow(ctx, p2);

    // 5. Draw Motion Speedlines (Behind fighters)
    this.updateAndDrawSpeedLines();

    // 6. Draw Fighters
    window.Skeleton.draw(ctx, p1);
    window.Skeleton.draw(ctx, p2);

    // 6.5 Draw Burning Status FX
    this.drawBurnStatus(p1);
    this.drawBurnStatus(p2);

    // 6.6 Draw Demon Awakening Aura FX
    this.drawDemonAura(p1);
    this.drawDemonAura(p2);

    // 7. Draw Shurikens
    this.drawProjectiles(p1);
    this.drawProjectiles(p2);

    // 7.5 Draw Active Magic Jutsu Spells
    this.drawActiveSpells(p1, p2);

    // 8. Draw Expanding Shockwaves
    this.updateAndDrawShockwaves();

    // 9. Draw Japanese Sumi-e Ink Splatters
    this.updateAndDrawInkSplatters();

    // 10. Draw Radial Impact Speedlines
    this.updateAndDrawRadialSpeedLines();

    // 11. Dust Puffs & Particle VFX
    this.updateAndDrawDust();
    this.updateAndDrawParticles();

    ctx.restore();

    // 12. Fullscreen Screen Flash Shutter Overlay (Screen-space)
    if (this.flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.flashAlpha = Math.max(0, this.flashAlpha - 0.12);
      ctx.restore();
    }

    // 13. Deep Cinematic Lens Vignette
    this.drawCinematicVignette(ctx);

    // 14. Draw Canvas HUD Magic Orbs (Screen-space)
    this.drawMagicOrbs(p1, p2);
  }

  drawCinematicVignette(ctx) {
    ctx.save();
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    const grad = ctx.createRadialGradient(cx, cy, Math.min(cx, cy) * 0.65, cx, cy, Math.max(cx, cy) * 1.15);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.7, 'rgba(10, 4, 6, 0.35)');
    grad.addColorStop(1, 'rgba(4, 1, 2, 0.85)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // --- UPDATE & DRAW MOTION GRAPHICS: SHOCKWAVES ---
  updateAndDrawShockwaves() {
    const ctx = this.ctx;
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha -= 0.055;

      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = sw.alpha;
      ctx.strokeStyle = sw.color;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 12;
      ctx.lineWidth = sw.lineWidth * sw.alpha;

      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner faint ring
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius * 0.85, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  // --- UPDATE & DRAW MOTION GRAPHICS: SUMI-E INK SPLATTERS ---
  updateAndDrawInkSplatters() {
    const ctx = this.ctx;
    for (let i = this.inkSplatters.length - 1; i >= 0; i--) {
      const ink = this.inkSplatters[i];
      ink.x += ink.vx;
      ink.y += ink.vy;
      ink.vy += 0.24; // Gravity
      ink.vx *= 0.94; // Air resistance
      ink.alpha -= ink.decay;

      if (ink.alpha <= 0) {
        this.inkSplatters.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, ink.alpha);
      ctx.fillStyle = '#060608';
      ctx.strokeStyle = '#060608';
      ctx.lineWidth = ink.size * 0.7;

      // Ink Droplet with streak tail
      ctx.beginPath();
      ctx.arc(ink.x, ink.y, ink.size, 0, Math.PI * 2);
      ctx.fill();

      // Tail line
      ctx.beginPath();
      ctx.moveTo(ink.x, ink.y);
      ctx.lineTo(ink.x - ink.vx * 2.5, ink.y - ink.vy * 2.5);
      ctx.stroke();

      ctx.restore();
    }
  }

  // --- UPDATE & DRAW MOTION GRAPHICS: SPEEDLINES ---
  updateAndDrawSpeedLines() {
    const ctx = this.ctx;
    for (let i = this.speedLines.length - 1; i >= 0; i--) {
      const sl = this.speedLines[i];
      sl.x += sl.vx;
      sl.alpha -= 0.08;

      if (sl.alpha <= 0) {
        this.speedLines.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = sl.alpha;
      ctx.strokeStyle = 'rgba(255, 240, 220, 0.65)';
      ctx.lineWidth = sl.width;
      ctx.beginPath();
      ctx.moveTo(sl.x, sl.y);
      ctx.lineTo(sl.x - sl.vx * 3.5, sl.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  // --- UPDATE & DRAW MOTION GRAPHICS: RADIAL IMPACT STARBURST ---
  updateAndDrawRadialSpeedLines() {
    const ctx = this.ctx;
    for (let i = this.radialSpeedLines.length - 1; i >= 0; i--) {
      const rsl = this.radialSpeedLines[i];
      rsl.r1 += 6;
      rsl.r2 += 12;
      rsl.alpha -= rsl.decay;

      if (rsl.alpha <= 0) {
        this.radialSpeedLines.splice(i, 1);
        continue;
      }

      const x1 = rsl.cx + Math.cos(rsl.angle) * rsl.r1;
      const y1 = rsl.cy + Math.sin(rsl.angle) * rsl.r1;
      const x2 = rsl.cx + Math.cos(rsl.angle) * rsl.r2;
      const y2 = rsl.cy + Math.sin(rsl.angle) * rsl.r2;

      ctx.save();
      ctx.globalAlpha = rsl.alpha * 0.75;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawGroundShadow(ctx, fighter) {
    ctx.save();
    const groundY = window.CONFIG.GROUND_Y;
    const heightAboveGround = groundY - fighter.y;
    const shadowScale = Math.max(0.35, 1.0 - heightAboveGround / 190);
    const shadowAlpha = Math.max(0.12, 0.68 - heightAboveGround / 220);
    const widthScale = (fighter.proportions && fighter.proportions.widthScale) || 1.0;

    ctx.translate(fighter.x, groundY);
    ctx.fillStyle = `rgba(10, 4, 3, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36 * shadowScale * widthScale, 7.5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawParallaxBackground() {
    const ctx = this.ctx;
    const w = this.canvas.width + 450;
    const h = this.canvas.height;
    const groundY = window.CONFIG.GROUND_Y;
    const camPan = this.camera.x;

    const is3DActive = window.ThreeScene && window.ThreeScene.isSupported && window.ThreeScene.currentMode === 'arena';
    if (is3DActive) {
      // 2.5D Hybrid WebGL Mode: Background is rendered in true 3D on #bg3dCanvas.
      // Clear 2D canvas transparently so the 3D Torii Gate, glowing lanterns and lighting show through!
      ctx.clearRect(-220, 0, w, h);

      // Layer 4: Dojo Arena Floor
      ctx.fillStyle = '#050101';
      ctx.fillRect(-220, groundY, w, h - groundY);

      // Polished Red Lacquer Mat Line
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-220, groundY);
      ctx.lineTo(w, groundY);
      ctx.stroke();
      return;
    }

    // Layer 0: Sunset Sky Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#e65c00');    // Radiant sunset orange
    sky.addColorStop(0.32, '#8f2602'); // Rust crimson
    sky.addColorStop(0.72, '#3a0c06'); // Deep burgundy
    sky.addColorStop(1, '#160302');    // Pitch dark red
    ctx.fillStyle = sky;
    ctx.fillRect(-220, 0, w, h);

    // Giant Blood Sun
    ctx.save();
    ctx.fillStyle = 'rgba(255, 238, 218, 0.22)';
    ctx.shadowColor = 'rgba(230, 126, 34, 0.6)';
    ctx.shadowBlur = 50;
    ctx.beginPath();
    ctx.arc(this.canvas.width / 2 + camPan * 0.03, 165, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Layer 1: Distant Mountain Ridges
    ctx.save();
    ctx.translate(camPan * 0.08, 0);
    ctx.fillStyle = '#220603';
    ctx.beginPath();
    ctx.moveTo(-220, groundY);
    ctx.lineTo(-60, 275);
    ctx.lineTo(130, 345);
    ctx.lineTo(370, 225);
    ctx.lineTo(600, 315);
    ctx.lineTo(840, 215);
    ctx.lineTo(1080, 325);
    ctx.lineTo(1280, 235);
    ctx.lineTo(1280, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Layer 2: Traditional Pagoda & Bamboo Grove
    ctx.save();
    ctx.translate(camPan * 0.18, 0);
    ctx.fillStyle = '#120202';

    // Pagoda multi-tier curved roof silhouette
    ctx.beginPath();
    ctx.moveTo(35, groundY);
    ctx.lineTo(35, 240);
    ctx.lineTo(5, 255);
    ctx.quadraticCurveTo(75, 228, 145, 255);
    ctx.lineTo(115, 240);
    ctx.lineTo(115, 185);
    ctx.lineTo(65, 202);
    ctx.quadraticCurveTo(75, 175, 85, 145);
    ctx.lineTo(85, groundY);
    ctx.fill();

    // Bamboo stalks & leaves
    for (let i = 0; i < 15; i++) {
      const bx = i * 95 - 110;
      ctx.fillRect(bx, 160, 4.5, groundY - 160);
      ctx.beginPath();
      ctx.ellipse(bx + 9, 215, 13, 3.5, Math.PI * 0.22, 0, Math.PI * 2);
      ctx.ellipse(bx - 9, 265, 13, 3.5, -Math.PI * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Layer 3: Torii Gate with Glowing Paper Lantern
    ctx.save();
    ctx.translate(camPan * 0.32, 0);
    ctx.fillStyle = '#090101';
    const toriiX = 790;
    ctx.fillRect(toriiX, 135, 18, groundY - 135);
    ctx.fillRect(toriiX + 135, 135, 18, groundY - 135);
    ctx.fillRect(toriiX - 25, 150, 205, 14);
    ctx.fillRect(toriiX - 15, 182, 185, 10);

    // Glowing Torii Lantern
    ctx.fillStyle = '#f39c12';
    ctx.shadowColor = '#d35400';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(toriiX + 68, 202, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Layer 4: Dojo Arena Floor
    ctx.fillStyle = '#050101';
    ctx.fillRect(-220, groundY, w, h - groundY);

    // Polished Red Lacquer Mat Line
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-220, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();
  }

  drawSunbeams() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#ffeedd';

    for (let i = 0; i < 4; i++) {
      const startX = 220 + i * 160;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX + 80, 0);
      ctx.lineTo(startX - 120, window.CONFIG.GROUND_Y);
      ctx.lineTo(startX - 220, window.CONFIG.GROUND_Y);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  drawSakura() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(240, 110, 98, 0.78)';

    const time = Date.now();
    this.sakuraPetals.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rot += p.rotSpeed;

      const oscX = Math.sin((time + p.seed) * p.oscFreq) * p.oscAmp;

      if (p.y > window.CONFIG.GROUND_Y + 45 || p.x > this.canvas.width + 120) {
        p.y = -10;
        p.x = Math.random() * (this.canvas.width + 250) - 120;
      }

      ctx.save();
      ctx.translate(p.x + oscX, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }

  drawProjectiles(fighter) {
    if (!fighter.activeShurikens) return;
    const ctx = this.ctx;
    ctx.save();

    fighter.activeShurikens.forEach(s => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);
      ctx.fillStyle = '#060608';
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;

      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(Math.cos((i * Math.PI) / 2) * 13, Math.sin((i * Math.PI) / 2) * 13);
        ctx.lineTo(Math.cos((i * Math.PI) / 2 + Math.PI / 4) * 4.5, Math.sin((i * Math.PI) / 2 + Math.PI / 4) * 4.5);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    });

    ctx.restore();
  }

  updateAndDrawDust() {
    const ctx = this.ctx;
    for (let i = this.dustPuffs.length - 1; i >= 0; i--) {
      const d = this.dustPuffs[i];
      d.x += d.vx;
      d.y += d.vy;
      d.size += 0.3;
      d.life -= d.decay;

      if (d.life <= 0) {
        this.dustPuffs.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = d.life * 0.3;
      ctx.fillStyle = '#3a1f18';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  updateAndDrawParticles() {
    const ctx = this.ctx;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawBurnStatus(fighter) {
    if (!fighter || !fighter.isBurning || fighter.hp <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    const time = Date.now() * 0.007;

    // Rising flame embers around fighter silhouette
    for (let i = 0; i < 5; i++) {
      const emberSeed = i * 1.35;
      const px = fighter.x + Math.sin(time + emberSeed) * 22;
      const progress = ((time * 35 + emberSeed * 25) % 85);
      const py = (fighter.y - 10) - progress;
      const alpha = Math.max(0, 1.0 - progress / 85);

      ctx.fillStyle = i % 2 === 0 ? '#ff4500' : '#ffaa00';
      ctx.shadowColor = '#ff5500';
      ctx.shadowBlur = 9;
      ctx.globalAlpha = alpha * 0.85;
      ctx.beginPath();
      ctx.arc(px, py, 2.8 + Math.sin(time * 2 + i) * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawDemonAura(fighter, customCtx = null) {
    if (!fighter || !fighter.isAwakened) return;
    const ctx = customCtx || this.ctx;
    if (!ctx) return;

    ctx.save();
    const time = Date.now() * 0.007;

    // Rising dark-red and black demonic flame ember particles around base and torso
    for (let i = 0; i < 8; i++) {
      const emberSeed = i * 1.35;
      const px = fighter.x + Math.sin(time * 1.8 + emberSeed) * 26;
      const progress = ((time * 40 + emberSeed * 28) % 90);
      const py = (fighter.y - 12) - progress;
      const alpha = Math.max(0, 1.0 - progress / 90);

      const isCrimson = i % 2 === 0;
      ctx.fillStyle = isCrimson ? `rgba(214, 48, 49, ${alpha * 0.9})` : `rgba(20, 20, 20, ${alpha * 0.85})`;
      ctx.shadowColor = '#d63031';
      ctx.shadowBlur = isCrimson ? 14 : 6;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(px, py, 3.2 + Math.sin(time * 3 + i) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Procedural sine wave flame tongues
    ctx.shadowColor = '#d63031';
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3.5;
    for (let j = 0; j < 4; j++) {
      const waveOffset = (j - 1.5) * 16;
      const tongueHeight = 35 + Math.sin(time * 4 + j) * 16;
      const tongueBaseX = fighter.x + waveOffset;
      const tongueBaseY = fighter.y;
      const sway = Math.sin(time * 3 + j * 1.8) * 8;

      ctx.strokeStyle = j % 2 === 0 ? 'rgba(214, 48, 49, 0.75)' : 'rgba(20, 20, 20, 0.65)';
      ctx.beginPath();
      ctx.moveTo(tongueBaseX, tongueBaseY);
      ctx.quadraticCurveTo(tongueBaseX + sway, tongueBaseY - tongueHeight * 0.5, tongueBaseX + sway * 1.5, tongueBaseY - tongueHeight);
      ctx.stroke();
    }

    // Trailing crimson eye streaks if moving
    if (Math.abs(fighter.vx) > 0.4) {
      const trailDir = -fighter.facing;
      const headY = fighter.y - 88;
      ctx.strokeStyle = 'rgba(214, 48, 49, 0.85)';
      ctx.shadowColor = '#d63031';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(fighter.x + (fighter.facing * 7), headY);
      ctx.quadraticCurveTo(fighter.x + trailDir * 14, headY - 3, fighter.x + trailDir * 28, headY);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawActiveSpells(p1, p2) {
    const ctx = this.ctx;
    const spells = [];
    if (p1 && p1.activeMagicSpells) spells.push(...p1.activeMagicSpells);
    if (p2 && p2.activeMagicSpells) spells.push(...p2.activeMagicSpells);
    if (spells.length === 0) return;

    ctx.save();
    const time = Date.now() * 0.006;

    for (const s of spells) {
      if (s.id === 'FIREBALL') {
        // Fireball Projectile
        ctx.save();
        ctx.translate(s.x, s.y);

        // Trailing plasma flames
        const tailDir = -s.facing;
        for (let i = 0; i < 4; i++) {
          const tailLen = (32 - i * 6) + Math.sin(time * 4 + i) * 8;
          const tailWidth = (14 - i * 3);
          const tailOffset = (i * 12);
          ctx.fillStyle = i === 0 ? '#ff4400' : (i === 1 ? '#ff7700' : '#cc2200');
          ctx.globalAlpha = 0.7 - i * 0.15;
          ctx.beginPath();
          ctx.ellipse(tailDir * tailOffset, Math.sin(time * 3 + i) * 3, tailLen, tailWidth, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Outer Flame Aura & Bloom
        ctx.shadowColor = '#ff5500';
        ctx.shadowBlur = 24;
        const outerGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, s.radius * 1.6);
        outerGrad.addColorStop(0, '#ffffff');
        outerGrad.addColorStop(0.3, '#ffaa00');
        outerGrad.addColorStop(0.7, '#ff3300');
        outerGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
        ctx.fillStyle = outerGrad;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.arc(0, 0, s.radius * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // White-hot incandescent core
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.arc(s.facing * 3, 0, s.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (s.id === 'DARK_ERUPTION') {
        ctx.save();
        ctx.translate(s.x, s.y);

        if (s.delay > 0) {
          // Warning Subterranean Fissure Runes
          const pulse = Math.sin(time * 8) * 0.25 + 0.75;
          ctx.shadowColor = '#9933ff';
          ctx.shadowBlur = 16 * pulse;
          ctx.strokeStyle = '#9933ff';
          ctx.lineWidth = 3;
          ctx.globalAlpha = pulse * 0.9;

          // Glowing ground fracture
          ctx.beginPath();
          ctx.moveTo(-s.width / 2, 0);
          ctx.lineTo(-s.width / 4, -4);
          ctx.lineTo(0, 2);
          ctx.lineTo(s.width / 4, -3);
          ctx.lineTo(s.width / 2, 0);
          ctx.stroke();

          // Dark runic circle
          ctx.beginPath();
          ctx.ellipse(0, 0, s.width / 2, 6, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Erupting Obsidian Spires
          const progress = Math.min(1.0, (38 - s.life) / 8);
          const currentHeight = s.height * progress;

          ctx.shadowColor = '#9933ff';
          ctx.shadowBlur = 22;

          // Central jagged obsidian spire
          const spireGrad = ctx.createLinearGradient(0, 0, 0, -currentHeight);
          spireGrad.addColorStop(0, '#050109');
          spireGrad.addColorStop(0.6, '#1a052e');
          spireGrad.addColorStop(1, '#9b59b6');

          ctx.fillStyle = spireGrad;
          ctx.strokeStyle = '#c39bd3';
          ctx.lineWidth = 2.5;

          // Left spire
          ctx.beginPath();
          ctx.moveTo(-s.width * 0.35, 0);
          ctx.lineTo(-s.width * 0.22, -currentHeight * 0.65);
          ctx.lineTo(-s.width * 0.08, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Right spire
          ctx.beginPath();
          ctx.moveTo(s.width * 0.08, 0);
          ctx.lineTo(s.width * 0.22, -currentHeight * 0.72);
          ctx.lineTo(s.width * 0.35, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Main Center Mega Spire
          ctx.beginPath();
          ctx.moveTo(-s.width * 0.2, 0);
          ctx.lineTo(0, -currentHeight);
          ctx.lineTo(s.width * 0.2, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Void purple ground bloom
          ctx.fillStyle = 'rgba(155, 89, 182, 0.4)';
          ctx.beginPath();
          ctx.ellipse(0, 0, s.width * 0.6, 9, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (s.id === 'SMOKE_TELEPORT') {
        ctx.save();
        // Sumi-e Japanese Ink Dispersal & Condensation Cloud
        const renderCloud = (cx, cy, progress, isDisperse) => {
          const radius = (isDisperse ? 25 + progress * 25 : 50 - progress * 20);
          const alpha = Math.max(0, isDisperse ? (1.0 - progress) : progress);

          ctx.save();
          ctx.translate(cx, cy);
          ctx.globalAlpha = alpha * 0.85;

          for (let k = 0; k < 6; k++) {
            const angle = (k * Math.PI) / 3 + time;
            const dist = radius * (0.35 + Math.sin(time + k) * 0.2);
            const ox = Math.cos(angle) * dist;
            const oy = Math.sin(angle) * dist;
            const blobR = radius * (0.4 + (k % 3) * 0.15);

            ctx.fillStyle = k % 2 === 0 ? '#0d1117' : '#1f2937';
            ctx.shadowColor = '#3b82f6';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(ox, oy, blobR, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        };

        if (s.frame < 12) {
          renderCloud(s.startX, s.startY - 50, s.frame / 12, true);
        }
        if (s.frame >= 8 && s.frame <= 22) {
          renderCloud(s.targetX, s.startY - 50, (s.frame - 8) / 14, false);
        }
        ctx.restore();
      } else if (s.id === 'LYNX_DEMONIC_CLAWS') {
        ctx.save();
        ctx.translate(s.x, s.y);
        if (s.frame < s.eruptFrame) {
          // Warning ground fractures glowing crimson
          const pulse = Math.sin(time * 10) * 0.3 + 0.7;
          ctx.shadowColor = '#e74c3c';
          ctx.shadowBlur = 18 * pulse;
          ctx.strokeStyle = '#e74c3c';
          ctx.lineWidth = 3;
          ctx.globalAlpha = pulse * 0.95;
          ctx.beginPath();
          ctx.moveTo(-35, 0);
          ctx.lineTo(-15, -4);
          ctx.lineTo(0, 2);
          ctx.lineTo(18, -3);
          ctx.lineTo(35, 0);
          ctx.stroke();
        } else {
          // Erupting giant crimson demon claws!
          const eruptProgress = Math.min(1.0, (s.frame - s.eruptFrame) / 6);
          const clawHeight = (s.height || 120) * eruptProgress;
          ctx.shadowColor = '#ff1744';
          ctx.shadowBlur = 24;
          ctx.fillStyle = '#b71c1c';
          ctx.strokeStyle = '#ff5252';
          ctx.lineWidth = 2.5;

          for (let c = -1; c <= 1; c++) {
            const cx = c * 22;
            const ch = clawHeight * (c === 0 ? 1.0 : 0.82);
            ctx.beginPath();
            ctx.moveTo(cx - 8, 0);
            ctx.quadraticCurveTo(cx - 12, -ch * 0.6, cx + (c * 6), -ch);
            ctx.quadraticCurveTo(cx + 6, -ch * 0.5, cx + 8, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }

  drawMagicOrbs(p1, p2) {
    if (!p1 || !p2) return;
    const ctx = this.ctx;
    ctx.save();

    const drawOrb = (fighter, cx, cy) => {
      const meter = fighter.magicMeter || 0;
      const isReady = meter >= 100;
      const radius = 17;
      const fillPct = Math.min(1.0, Math.max(0, meter / 100));

      const amuletKey = fighter.amulet || 'FLAME_AMULET';
      const amuletCfg = window.CONFIG.AMULETS ? window.CONFIG.AMULETS[amuletKey] : null;
      const icon = amuletCfg ? amuletCfg.icon : '🔥';
      const elemColor = amuletKey === 'DARK_AMULET' ? '#9933ff' : (amuletKey === 'WIND_TALISMAN' ? '#3498db' : '#ff5500');

      ctx.save();
      ctx.translate(cx, cy);

      // Ready pulsating flare
      if (isReady) {
        const pulse = Math.sin(Date.now() * 0.009) * 0.25 + 0.75;
        ctx.shadowColor = elemColor;
        ctx.shadowBlur = 18 * pulse;

        // Radiating sunburst rays
        ctx.strokeStyle = elemColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 * pulse;
        for (let r = 0; r < 8; r++) {
          const rayAngle = (r * Math.PI) / 4 + Date.now() * 0.002;
          ctx.beginPath();
          ctx.moveTo(Math.cos(rayAngle) * (radius + 2), Math.sin(rayAngle) * (radius + 2));
          ctx.lineTo(Math.cos(rayAngle) * (radius + 7 + pulse * 4), Math.sin(rayAngle) * (radius + 7 + pulse * 4));
          ctx.stroke();
        }
      }

      // Outer bezel ring
      ctx.strokeStyle = isReady ? '#ffd700' : '#4a4437';
      ctx.lineWidth = 3;
      ctx.fillStyle = '#0a0910';
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Fluid radial fill clipping
      if (fillPct > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
        ctx.clip();

        const fillH = (radius * 2) * fillPct;
        const fillY = radius - fillH;

        const fluidGrad = ctx.createLinearGradient(0, radius, 0, fillY);
        fluidGrad.addColorStop(0, '#220033');
        fluidGrad.addColorStop(0.5, elemColor);
        fluidGrad.addColorStop(1, '#ffffff');

        ctx.fillStyle = fluidGrad;
        ctx.fillRect(-radius, fillY, radius * 2, fillH);
        ctx.restore();
      }

      // Glass specular reflection highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, radius - 4, -Math.PI * 0.75, -Math.PI * 0.25);
      ctx.stroke();

      // Elemental icon glyph
      ctx.font = '12px "Segoe UI Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, 0, 1);

      ctx.restore();
    };

    // Draw P1 Orb and P2 Orb
    drawOrb(p1, 52, 72);
    drawOrb(p2, this.canvas.width - 52, 72);

    ctx.restore();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SceneRenderer;
} else {
  window.SceneRenderer = SceneRenderer;
}
