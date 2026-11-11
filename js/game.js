/**
 * Shadow Fight 2 Web Edition - Enhanced Master Game Orchestrator
 * Coordinates Dojo Lobby mode, Match lifecycle, Tournament Ladder,
 * Audio transition between peaceful dojo and intense combat, and UI modals.
 */

class GameEngine {
  constructor() {
    this.canvas = null;
    this.lobbyCanvas = null;
    this.sceneRenderer = null;

    this.player = null;
    this.opponent = null;
    this.ai = null;

    this.gameMode = 'TOURNAMENT';
    this.matchState = 'MENU'; // 'MENU', 'ROUND_INTRO', 'FIGHTING', 'ROUND_OVER', 'MATCH_OVER', 'PAUSED'
    this.previousMatchState = null;
    this.isAwakening = false;
    this.sealAnimFrameId = null;

    this.roundNumber = 1;
    this.roundTimer = 99;
    this.timerTicks = 0;
    this.slowMotionFrames = 0;
    this.introCounter = 0;

    this.announcementText = '';
    this.announcementSubtext = '';
    this.floatingTexts = [];
  }

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.lobbyCanvas = document.getElementById('lobbyCanvas');

    // Initialize 2.5D WebGL Hybrid Engine
    if (window.ThreeScene) {
      window.ThreeScene.init('bg3dCanvas', 'armoryInspectCanvas');
    }

    this.sceneRenderer = new window.SceneRenderer(this.canvas);
    if (window.Dojo && this.lobbyCanvas) {
      window.Dojo.init(this.lobbyCanvas);
    }

    this.showScreen('screen-main-menu');
    if (window.Armory) window.Armory.updateUI();

    requestAnimationFrame(() => this.loop());
  }

  showScreen(screenId) {
    document.querySelectorAll('.game-screen').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');

    if (window.ThreeScene) {
      if (screenId === 'screen-main-menu') {
        window.ThreeScene.setupDojoEnvironment();
      } else if (screenId === 'screen-arena') {
        window.ThreeScene.setupArenaEnvironment();
      } else {
        window.ThreeScene.currentMode = 'none';
      }
    }

    if (screenId === 'screen-main-menu') {
      this.matchState = 'MENU';
      if (window.Dojo) {
        window.Dojo.isActive = true;
        window.Dojo.resetLobbyFighter();
      }
      window.Sound.startLobbyMusic();
    } else {
      if (window.Dojo) window.Dojo.isActive = false;
      if (screenId === 'screen-tournament') {
        window.Tournament.renderTournamentMap();
      } else if (screenId === 'screen-armory') {
        window.Armory.updateUI();
      }
    }
  }

  startTournamentFight(opponentIndex) {
    if (window.Tournament) {
      window.Tournament.currentStageIndex = opponentIndex;
    }
    const oppConfig = window.Tournament ? window.Tournament.getCurrentOpponent() : (window.CONFIG.OPPONENTS[opponentIndex] || window.CONFIG.OPPONENTS[0]);

    if (oppConfig.isBoss) {
      if (window.Cinematics && window.Cinematics.playDialogue) {
        window.Cinematics.playDialogue('LYNX_PRE_FIGHT', () => {
          this.launchMatch(oppConfig);
        });
      } else {
        this.launchMatch(oppConfig);
      }
      return;
    }

    const discipleId = oppConfig.name ? oppConfig.name.toLowerCase() : '';
    const hasDiscipleDialogue = window.CONFIG &&
      window.CONFIG.DIALOGUES &&
      window.CONFIG.DIALOGUES.DISCIPLES &&
      window.CONFIG.DIALOGUES.DISCIPLES[discipleId];

    if (hasDiscipleDialogue) {
      if (window.Cinematics && window.Cinematics.playDialogue) {
        window.Cinematics.playDialogue(discipleId, () => {
          this.launchMatch(oppConfig);
        });
      } else {
        this.launchMatch(oppConfig);
      }
      return;
    }

    this.launchMatch(oppConfig);
  }

  launchMatch(oppConfig) {
    this.gameMode = 'TOURNAMENT';
    this.setupMatch(oppConfig);
  }

  startTrainingDojo() {
    this.gameMode = 'TRAINING';
    this.setupMatch({
      name: 'TRAINING DUMMY',
      avatar: '🥋',
      weapon: 'FISTS',
      armor: 'ROBE',
      helm: 'HEADBAND',
      hp: 999,
      aiAggro: 0.05,
      aiReaction: 0.1
    });
  }

  startLocalPvP() {
    this.gameMode = 'LOCAL_PVP';
    this.setupMatch({
      name: 'SHADOW II',
      avatar: '🥷',
      weapon: 'KATANA',
      armor: 'LEATHER_VEST',
      helm: 'IRON_MASK',
      hp: 100
    });
  }

  setupMatch(oppConfig) {
    if (window.ThreeScene) {
      window.ThreeScene.setupArenaEnvironment();
    }

    if (window.Armory) {
      window.Armory.consumeEnergy();
    }

    if (window.Dojo) {
      window.Dojo.isActive = false;
    }

    const p1Weapon = window.Armory.equipped.weapon;
    const p1Armor = window.Armory.equipped.armor;
    const p1Helm = window.Armory.equipped.helm;
    const p1Amulet = window.Armory.equipped.amulet || 'FLAME_AMULET';

    this.player = new window.Fighter(280, {
      name: 'SHADOW',
      glow: 'rgba(230, 126, 34, 0.45)',
      facing: 1,
      weapon: p1Weapon,
      armor: p1Armor,
      helm: p1Helm,
      amulet: p1Amulet,
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

    this.opponent = new window.Fighter(720, {
      name: oppConfig.name,
      glow: (oppConfig.visuals && oppConfig.visuals.auraGlow) || (oppConfig.isBoss ? 'rgba(231, 76, 60, 0.7)' : 'rgba(231, 76, 60, 0.35)'),
      facing: -1,
      weapon: oppConfig.weapon,
      armor: oppConfig.armor,
      helm: oppConfig.helm,
      amulet: oppConfig.amulet || 'DARK_AMULET',
      hp: oppConfig.hp,
      proportions: oppConfig.proportions,
      visuals: oppConfig.visuals,
      avatar: oppConfig.avatar,
      isAI: this.gameMode !== 'LOCAL_PVP',
      isBoss: oppConfig.isBoss
    });

    if (this.gameMode !== 'LOCAL_PVP') {
      this.ai = new window.CombatAI(this.opponent, oppConfig);
    } else {
      this.ai = null;
    }

    this.roundNumber = 1;
    this.player.roundsWon = 0;
    this.opponent.roundsWon = 0;
    this.floatingTexts = [];
    this.isAwakening = false;

    // HUD Configuration
    document.getElementById('hud-p1-name').textContent = this.player.name;
    document.getElementById('hud-p2-name').textContent = this.opponent.name;
    document.getElementById('hud-p1-weapon').textContent = window.CONFIG.WEAPONS[p1Weapon].name;
    document.getElementById('hud-p2-weapon').textContent = window.CONFIG.WEAPONS[oppConfig.weapon].name;

    this.updateRoundIndicators();
    this.showScreen('screen-arena');
    this.startRoundIntro();

    window.Sound.startBattleMusic();
  }

  triggerBossAwakening(bossFighter) {
    if (this.isAwakening) return;
    this.isAwakening = true;

    this.previousMatchState = this.matchState;
    this.matchState = 'PAUSED';

    if (window.Sound && window.Sound.playBossRoar) {
      window.Sound.playBossRoar();
    }
    if (this.sceneRenderer && this.sceneRenderer.addTrauma) {
      this.sceneRenderer.addTrauma(1.0);
    }

    if (window.Cinematics && window.Cinematics.playDialogue) {
      window.Cinematics.playDialogue('LYNX_AWAKENING', () => {
        bossFighter.activateDemonAwakening();
        if (this.sceneRenderer) {
          if (this.sceneRenderer.triggerScreenFlash) this.sceneRenderer.triggerScreenFlash('#ff1744', 0.85);
          if (this.sceneRenderer.addTrauma) this.sceneRenderer.addTrauma(1.0);
        }
        this.matchState = this.previousMatchState || 'FIGHTING';
        this.isAwakening = false;
      });
    } else {
      bossFighter.activateDemonAwakening();
      if (this.sceneRenderer) {
        if (this.sceneRenderer.triggerScreenFlash) this.sceneRenderer.triggerScreenFlash('#ff1744', 0.85);
        if (this.sceneRenderer.addTrauma) this.sceneRenderer.addTrauma(1.0);
      }
      this.matchState = this.previousMatchState || 'FIGHTING';
      this.isAwakening = false;
    }
  }

  startRoundIntro() {
    this.matchState = 'ROUND_INTRO';
    this.introCounter = 120;
    this.roundTimer = 99;
    this.timerTicks = 0;
    this.announcementText = `ROUND ${this.roundNumber}`;
    this.announcementSubtext = 'READY...';

    this.player.resetForNewRound(280, 1);
    this.opponent.resetForNewRound(720, -1);
    this.updateHpBars();

    window.Sound.playTaikoDrum(true);
  }

  updateHpBars() {
    const p1HpPercent = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
    const p1GhostPercent = Math.max(0, (this.player.ghostHp / this.player.maxHp) * 100);

    const p2HpPercent = Math.max(0, (this.opponent.hp / this.opponent.maxHp) * 100);
    const p2GhostPercent = Math.max(0, (this.opponent.ghostHp / this.opponent.maxHp) * 100);

    const bar1 = document.getElementById('hud-p1-fill');
    const bar2 = document.getElementById('hud-p2-fill');
    if (bar1) bar1.style.width = `${p1HpPercent}%`;
    if (bar2) bar2.style.width = `${p2HpPercent}%`;

    const ghost1 = document.getElementById('hud-p1-ghost');
    const ghost2 = document.getElementById('hud-p2-ghost');
    if (ghost1) ghost1.style.width = `${p1GhostPercent}%`;
    if (ghost2) ghost2.style.width = `${p2GhostPercent}%`;

    // Magic Orb HUD Updates
    const p1Magic = this.player ? this.player.magicMeter : 0;
    const p2Magic = this.opponent ? this.opponent.magicMeter : 0;

    const p1Fill = document.getElementById('hud-p1-magic-fill');
    const p1Orb = document.getElementById('hud-p1-magic-orb');
    const p1Icon = document.getElementById('hud-p1-magic-icon');
    const p2Fill = document.getElementById('hud-p2-magic-fill');
    const p2Orb = document.getElementById('hud-p2-magic-orb');
    const p2Icon = document.getElementById('hud-p2-magic-icon');

    if (p1Fill) p1Fill.style.height = `${p1Magic}%`;
    if (p2Fill) p2Fill.style.height = `${p2Magic}%`;

    if (p1Orb) {
      if (p1Magic >= 100) p1Orb.classList.add('ready');
      else p1Orb.classList.remove('ready');
    }
    if (p2Orb) {
      if (p2Magic >= 100) p2Orb.classList.add('ready');
      else p2Orb.classList.remove('ready');
    }

    if (this.player && window.CONFIG.AMULETS) {
      const p1Amulet = window.CONFIG.AMULETS[this.player.amulet];
      if (p1Icon && p1Amulet) p1Icon.textContent = p1Amulet.icon;
    }
    if (this.opponent && window.CONFIG.AMULETS) {
      const p2Amulet = window.CONFIG.AMULETS[this.opponent.amulet];
      if (p2Icon && p2Amulet) p2Icon.textContent = p2Amulet.icon;
    }

    const btnMagic = document.getElementById('btn-magic');
    if (btnMagic) {
      if (p1Magic >= 100) btnMagic.classList.add('ready');
      else btnMagic.classList.remove('ready');
    }

    const timerEl = document.getElementById('round-timer-digits');
    if (timerEl) timerEl.textContent = this.roundTimer < 10 ? `0${this.roundTimer}` : this.roundTimer;
  }

  updateRoundIndicators() {
    const p1Wins = this.player ? this.player.roundsWon : 0;
    const p2Wins = this.opponent ? this.opponent.roundsWon : 0;

    const p1m1 = document.getElementById('p1-win-1');
    const p1m2 = document.getElementById('p1-win-2');
    const p2m1 = document.getElementById('p2-win-1');
    const p2m2 = document.getElementById('p2-win-2');

    if (p1m1) p1m1.className = `win-dot ${p1Wins >= 1 ? 'active' : ''}`;
    if (p1m2) p1m2.className = `win-dot ${p1Wins >= 2 ? 'active' : ''}`;
    if (p2m1) p2m1.className = `win-dot ${p2Wins >= 1 ? 'active' : ''}`;
    if (p2m2) p2m2.className = `win-dot ${p2Wins >= 2 ? 'active' : ''}`;
  }

  spawnFloatingCombatText(x, y, text, color = '#f1c40f') {
    this.floatingTexts.push({
      x: x + (Math.random() - 0.5) * 20,
      y,
      text,
      color,
      alpha: 1.0,
      scale: 1.3,
      vy: -1.8
    });
  }

  loop() {
    if (this.matchState === 'MENU') {
      // Render Interactive Dojo Lobby Scene
      if (window.Dojo && window.Dojo.isActive) {
        window.Dojo.updateAndRender();
      }
    } else if (this.matchState !== 'PAUSED' && this.player && this.opponent) {
      // Render Battle Arena
      this.updateCombat();
      this.sceneRenderer.updateCamera(this.player, this.opponent);
      if (window.ThreeScene) {
        window.ThreeScene.updateCamera(this.sceneRenderer.camera.x, this.sceneRenderer.camera.zoom);
        window.ThreeScene.updateSpellLighting(this.player, this.opponent);
      }
      this.sceneRenderer.render(this.player, this.opponent, this.slowMotionFrames > 0 ? 0.35 : 1.0);
      this.renderFloatingCombatText();
      this.renderAnnouncements();
    }
    requestAnimationFrame(() => this.loop());
  }

  updateCombat() {
    if (this.matchState === 'ROUND_INTRO') {
      this.introCounter--;
      if (this.introCounter === 50) {
        this.announcementText = 'FIGHT!';
        this.announcementSubtext = '';
        window.Sound.playGong();
        if (this.sceneRenderer.triggerScreenFlash) {
          this.sceneRenderer.triggerScreenFlash('#ffeedd', 0.5);
          this.sceneRenderer.spawnRadialSpeedLines(this.canvas.width / 2, 200, 28);
        }
      }
      if (this.introCounter <= 0) {
        this.matchState = 'FIGHTING';
        this.announcementText = '';
      }
      return;
    }

    if (this.matchState === 'FIGHTING') {
      this.timerTicks++;
      if (this.timerTicks >= 60) {
        this.timerTicks = 0;
        if (this.roundTimer > 0) {
          this.roundTimer--;
          if (this.roundTimer === 10) {
            window.Sound.playTaikoDrum(false);
          }
        } else {
          this.triggerTimeOut();
          return;
        }
      }

      const p1Input = window.Input.getPlayer1Input(this.player.facing);
      let p2Input = null;

      if (this.gameMode === 'LOCAL_PVP') {
        p2Input = window.Input.getPlayer2Input(this.opponent.facing);
      } else if (this.ai) {
        p2Input = this.ai.update(this.player);
      }

      this.player.update(this.opponent, p1Input, this.sceneRenderer);
      this.opponent.update(this.player, p2Input, this.sceneRenderer);

      this.updateHpBars();

      if (this.player.hp <= 0 || this.opponent.hp <= 0) {
        this.triggerRoundOver();
      }
    }

    if (this.matchState === 'ROUND_OVER') {
      this.introCounter--;
      if (this.slowMotionFrames > 0) this.slowMotionFrames--;

      this.updateHpBars();

      if (this.introCounter <= 0) {
        this.checkMatchProgression();
      }
    }
  }

  triggerTimeOut() {
    this.matchState = 'ROUND_OVER';
    this.introCounter = 150;
    this.announcementText = 'TIME UP';

    const p1Hp = this.player.hp;
    const p2Hp = this.opponent.hp;

    if (p1Hp > p2Hp) {
      this.player.roundsWon++;
      this.announcementSubtext = 'SHADOW WINS BY DECISION';
    } else if (p2Hp > p1Hp) {
      this.opponent.roundsWon++;
      this.announcementSubtext = `${this.opponent.name} WINS BY DECISION`;
    } else {
      this.announcementSubtext = 'DRAW';
    }

    this.updateRoundIndicators();
    window.Sound.playGong();
  }

  triggerRoundOver() {
    this.matchState = 'ROUND_OVER';
    this.introCounter = 150;
    this.slowMotionFrames = 25;
    this.sceneRenderer.addTrauma(0.85);

    const p1Won = this.player.hp > 0;
    if (p1Won) {
      this.player.roundsWon++;
      this.announcementText = 'K.O.';
      this.announcementSubtext = this.player.hp === this.player.maxHp ? 'PERFECT!' : 'ROUND WON';
    } else {
      this.opponent.roundsWon++;
      this.announcementText = 'K.O.';
      this.announcementSubtext = 'ROUND LOST';
    }

    this.updateRoundIndicators();
    window.Sound.playGong();
  }

  checkMatchProgression() {
    const maxWins = window.CONFIG.MAX_ROUNDS_TO_WIN;

    if (this.player.roundsWon >= maxWins) {
      if (this.gameMode === 'TOURNAMENT' && this.opponent && this.opponent.isBoss) {
        this.matchState = 'MATCH_OVER';
        if (window.Cinematics && window.Cinematics.playDialogue) {
          window.Cinematics.playDialogue('LYNX_VICTORY', () => {
            this.showSealAcquisitionModal();
          });
          return;
        } else {
          this.showSealAcquisitionModal();
          return;
        }
      }

      this.matchState = 'MATCH_OVER';
      let rewardText = '';
      if (this.gameMode === 'TOURNAMENT') {
        const reward = window.Tournament.completeCurrentStage();
        rewardText = `+${reward} GOLD EARNED`;
      }
      this.showMatchEndModal('VICTORY', rewardText, true);
    } else if (this.opponent.roundsWon >= maxWins) {
      this.matchState = 'MATCH_OVER';
      this.showMatchEndModal('DEFEAT', 'TRAIN HARDER IN THE DOJO', false);
    } else {
      this.roundNumber++;
      this.startRoundIntro();
    }
  }

  renderFloatingCombatText() {
    const ctx = this.sceneRenderer.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const item = this.floatingTexts[i];
      item.y += item.vy;
      item.alpha -= 0.022;
      item.scale = Math.max(1.0, item.scale - 0.015);

      if (item.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = item.alpha;
      const fontSize = Math.round(15 * item.scale);
      ctx.font = `900 ${fontSize}px "Rajdhani", sans-serif`;

      // Measure text for motion badge pill
      const metrics = ctx.measureText(item.text);
      const paddingX = 14;
      const paddingY = 6;
      const badgeW = metrics.width + paddingX * 2;
      const badgeH = fontSize + paddingY * 2;

      // Motion Graphic Pill Background
      ctx.fillStyle = 'rgba(12, 6, 10, 0.85)';
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.roundRect(item.x - badgeW / 2, item.y - badgeH / 2, badgeW, badgeH, 4);
      ctx.fill();
      ctx.stroke();

      // Sharp Text with glow
      ctx.fillStyle = item.color;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 10;
      ctx.fillText(item.text, item.x, item.y + 1);

      ctx.restore();
    }

    ctx.restore();
  }

  renderAnnouncements() {
    if (!this.announcementText) return;
    const ctx = this.sceneRenderer.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;

    ctx.save();

    // 1. ROUND INTRO CINEMATIC BANNER
    if (this.matchState === 'ROUND_INTRO') {
      const introRatio = Math.max(0, this.introCounter / 120);

      // Diagonal Cinematic Banner Slash across center
      ctx.save();
      ctx.fillStyle = 'rgba(10, 4, 8, 0.72)';
      ctx.beginPath();
      ctx.moveTo(0, 160);
      ctx.lineTo(w, 130);
      ctx.lineTo(w, 270);
      ctx.lineTo(0, 300);
      ctx.closePath();
      ctx.fill();

      // Top & Bottom Gold Foil Border Lines
      ctx.strokeStyle = '#c98836';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f39c12';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(0, 160);
      ctx.lineTo(w, 130);
      ctx.moveTo(0, 300);
      ctx.lineTo(w, 270);
      ctx.stroke();
      ctx.restore();

      // Main Announcement Typography
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (this.announcementText === 'FIGHT!') {
        // Explosive "FIGHT!" Slash Graphic
        const fightScale = 1.0 + (this.introCounter / 50) * 0.4;
        ctx.font = `900 ${Math.round(82 * fightScale)}px "Cinzel", serif`;

        // Outer Crimson Glow
        ctx.fillStyle = '#ff1744';
        ctx.shadowColor = '#d50000';
        ctx.shadowBlur = 28;
        ctx.fillText('FIGHT!', cx, 215);

        // Core Radiant Gold
        ctx.fillStyle = '#fff9c4';
        ctx.shadowColor = '#f39c12';
        ctx.shadowBlur = 12;
        ctx.fillText('FIGHT!', cx, 215);
      } else {
        // "ROUND 1" / "ROUND 2" Motion Graphic
        ctx.font = '900 64px "Cinzel", serif';

        // Drop shadow
        ctx.fillStyle = '#060408';
        ctx.fillText(this.announcementText, cx + 3, 208);

        // Gold Gradient Text
        const textGrad = ctx.createLinearGradient(cx, 175, cx, 235);
        textGrad.addColorStop(0, '#fff2a8');
        textGrad.addColorStop(0.5, '#f1c40f');
        textGrad.addColorStop(1, '#d35400');

        ctx.fillStyle = textGrad;
        ctx.shadowColor = '#d35400';
        ctx.shadowBlur = 20;
        ctx.fillText(this.announcementText, cx, 205);

        // Kanji Subtitle "第一局" (First Match) / "決戦" (Decisive Battle)
        const kanji = this.roundNumber === 1 ? '第一局' : this.roundNumber === 2 ? '第二局' : '決戦';
        ctx.font = '900 24px serif';
        ctx.fillStyle = 'rgba(255, 235, 180, 0.85)';
        ctx.shadowBlur = 6;
        ctx.fillText(`— ${kanji} —`, cx, 255);
      }
    } else if (this.matchState === 'ROUND_OVER') {
      // 2. K.O. DECISIVE FINISH BANNER ("勝負あり")
      ctx.save();

      // Darkened Center Stage Strip
      ctx.fillStyle = 'rgba(6, 2, 4, 0.78)';
      ctx.fillRect(0, 150, w, 150);

      // Gold Borders
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#e67e22';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(0, 150);
      ctx.lineTo(w, 150);
      ctx.moveTo(0, 300);
      ctx.lineTo(w, 300);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Giant Japanese Calligraphic "K.O."
      ctx.font = '900 92px "Cinzel", serif';

      // Deep Crimson Glow
      ctx.fillStyle = '#e74c3c';
      ctx.shadowColor = '#c0392b';
      ctx.shadowBlur = 32;
      ctx.fillText(this.announcementText, cx + 2, 212);

      // Golden Metallic Foreground
      ctx.fillStyle = '#fff0a6';
      ctx.shadowColor = '#f39c12';
      ctx.shadowBlur = 16;
      ctx.fillText(this.announcementText, cx, 210);

      // Subtext: "勝負あり" (Match Decided) or Subtitle
      if (this.announcementSubtext) {
        ctx.font = '800 22px "Rajdhani", sans-serif';
        ctx.fillStyle = '#ecf0f1';
        ctx.shadowBlur = 8;
        ctx.fillText(this.announcementSubtext.toUpperCase(), cx, 268);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  togglePause() {
    if (this.matchState === 'MENU' || this.matchState === 'MATCH_OVER' || this.isAwakening) return;

    if (this.matchState === 'PAUSED') {
      this.resumeFight();
    } else {
      this.previousMatchState = this.matchState;
      this.matchState = 'PAUSED';
      const modal = document.getElementById('pause-modal');
      if (modal) modal.classList.add('active');
    }
  }

  resumeFight() {
    this.matchState = this.previousMatchState || 'FIGHTING';
    const modal = document.getElementById('pause-modal');
    if (modal) modal.classList.remove('active');
  }

  restartMatch() {
    this.resumeFight();
    if (this.gameMode === 'TOURNAMENT') {
      this.startTournamentFight(window.Tournament.currentStageIndex);
    } else if (this.gameMode === 'TRAINING') {
      this.startTrainingDojo();
    } else {
      this.startLocalPvP();
    }
  }

  quitToMainMenu() {
    this.resumeFight();
    this.showScreen('screen-main-menu');
  }

  showMoveListModal() {
    const modal = document.getElementById('moves-modal');
    if (modal) modal.classList.add('active');
  }

  closeMoveListModal() {
    const modal = document.getElementById('moves-modal');
    if (modal) modal.classList.remove('active');
  }

  showPerksModal() {
    const modal = document.getElementById('perks-modal');
    if (modal) modal.classList.add('active');
  }

  closePerksModal() {
    const modal = document.getElementById('perks-modal');
    if (modal) modal.classList.remove('active');
  }

  showQuestsModal() {
    const modal = document.getElementById('quests-modal');
    if (modal) modal.classList.add('active');
  }

  closeQuestsModal() {
    const modal = document.getElementById('quests-modal');
    if (modal) modal.classList.remove('active');
  }

  showMatchEndModal(title, subtext, won) {
    const modal = document.getElementById('match-end-modal');
    if (!modal) return;

    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-title').style.color = won ? '#f1c40f' : '#e74c3c';
    document.getElementById('modal-subtext').textContent = subtext;

    modal.classList.add('active');
  }

  closeMatchModal() {
    const modal = document.getElementById('match-end-modal');
    if (modal) modal.classList.remove('active');

    window.Sound.stopBattleMusic();
    if (this.gameMode === 'TOURNAMENT') {
      this.showScreen('screen-tournament');
    } else {
      this.showScreen('screen-main-menu');
    }
  }

  showSealAcquisitionModal() {
    const modal = document.getElementById('seal-reward-modal');
    if (modal) modal.classList.add('active');

    if (window.Armory) {
      if (window.Armory.addCoins) window.Armory.addCoins(1000);
      if (window.Armory.addGems) window.Armory.addGems(20);
      if (window.Armory.updateUI) window.Armory.updateUI();
    }
    if (window.Tournament && window.Tournament.completeCurrentStage) {
      window.Tournament.completeCurrentStage();
    }

    if (window.Sound && window.Sound.playSealAcquired) {
      window.Sound.playSealAcquired();
    }

    this.startSealRenderer();
  }

  startSealRenderer() {
    const canvas = document.getElementById('sealInspectCanvas');
    if (!canvas) return;

    if (window.ThreeScene && typeof window.ThreeScene.renderSealModal === 'function') {
      try {
        if (window.ThreeScene.renderSealModal(canvas)) {
          return;
        }
      } catch (e) {
        console.warn('[Game] ThreeScene renderSealModal fallback:', e);
      }
    }

    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return;

    let rotationAngle = 0;
    const modal = document.getElementById('seal-reward-modal');

    const render2DSeal = () => {
      if (!modal || !modal.classList.contains('active')) {
        this.sealAnimFrameId = null;
        return;
      }

      const w = canvas.width || 260;
      const h = canvas.height || 260;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(cx, cy) - 24;

      ctx.clearRect(0, 0, w, h);
      rotationAngle += 0.025;

      ctx.save();
      ctx.translate(cx, cy);

      // 1. Ray glow behind medallion
      ctx.save();
      ctx.rotate(rotationAngle * 0.5);
      const numRays = 12;
      for (let i = 0; i < numRays; i++) {
        const a = (i * 2 * Math.PI) / numRays;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a - 0.12) * (radius + 20), Math.sin(a - 0.12) * (radius + 20));
        ctx.lineTo(Math.cos(a + 0.12) * (radius + 20), Math.sin(a + 0.12) * (radius + 20));
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? 'rgba(241, 196, 15, 0.15)' : 'rgba(231, 76, 60, 0.15)';
        ctx.fill();
      }
      ctx.restore();

      // 2. Outer golden rim
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#b78727';
      ctx.shadowColor = '#f1c40f';
      ctx.shadowBlur = 16;
      ctx.fill();

      // Golden inner border
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#f9e79f';
      ctx.stroke();

      // 3. Crimson Core
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
      const radGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, radius * 0.72);
      radGrad.addColorStop(0, '#ff1744');
      radGrad.addColorStop(0.65, '#c0392b');
      radGrad.addColorStop(1, '#4a0404');
      ctx.fillStyle = radGrad;
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 20;
      ctx.fill();

      // 4. Rotating Claws / Prongs
      ctx.save();
      ctx.rotate(rotationAngle);
      ctx.fillStyle = '#f1c40f';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        ctx.save();
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(radius * 0.45, -7);
        ctx.lineTo(radius * 0.9, 0);
        ctx.lineTo(radius * 0.45, 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // 5. Kanji '山猫' in center
      ctx.font = '900 34px "Cinzel", serif, "Noto Serif JP", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff8e7';
      ctx.shadowColor = '#f1c40f';
      ctx.shadowBlur = 12;
      ctx.fillText('山猫', 0, 2);

      ctx.restore();

      this.sealAnimFrameId = requestAnimationFrame(render2DSeal);
    };

    render2DSeal();
  }

  claimSealReward() {
    const modal = document.getElementById('seal-reward-modal');
    if (modal) modal.classList.remove('active');

    if (this.sealAnimFrameId) {
      cancelAnimationFrame(this.sealAnimFrameId);
      this.sealAnimFrameId = null;
    }

    if (window.Sound && window.Sound.stopBattleMusic) {
      window.Sound.stopBattleMusic();
    }

    this.showScreen('screen-tournament');
    if (window.Tournament && window.Tournament.renderTournamentMap) {
      window.Tournament.renderTournamentMap();
    }
  }
}

const Game = new GameEngine();
if (typeof window !== 'undefined') {
  window.Game = Game;
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('DOMContentLoaded', () => {
      Game.init();
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameEngine, Game };
}
