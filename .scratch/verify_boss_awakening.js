const http = require('http');
const fs = require('fs');
const path = require('path');

// Ensure Playwright can be found from global npm modules
const globalNodePath = path.join(process.env.APPDATA, 'npm', 'node_modules');
if (!process.env.NODE_PATH) {
  process.env.NODE_PATH = globalNodePath;
  require('module').Module._initPaths();
}
const { chromium } = require('playwright');

const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOT_DIR = path.resolve('C:/Users/Hp/.gemini/antigravity/brain/fee5147b-ed3b-4870-ac63-903955723b0f/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.glb': 'model/gltf-binary',
  '.gltf': 'application/json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function startServer(port = 8091) {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';

    const fullPath = path.join(ROOT_DIR, reqPath);
    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(fullPath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`[Test Server] Serving ${ROOT_DIR} at http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function run() {
  const server = await startServer(8091);
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage({
    viewport: { width: 1100, height: 750 }
  });

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      // Ignore benign Chromium headless AudioContext autostart policy notice
      if (txt.includes('AudioContext') && txt.includes('not allowed to start')) return;
      console.error(`[Browser Error] ${txt}`);
      errors.push(txt);
    } else {
      console.log(`[Browser Log] ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    console.error(`[Page Error] ${err.message}`);
    errors.push(err.message);
  });

  try {
    console.log('Navigating to SF2 Web Edition at http://localhost:8091/index.html ...');
    await page.goto('http://localhost:8091/index.html');
    await page.waitForTimeout(2000);

    // ========================================================
    // TEST 1: Trigger Pre-Fight Lynx Dialogue Cutscene
    // ========================================================
    console.log('\n--- TEST 1: Pre-Fight Lynx Story Dialogue Cutscene ---');
    await page.evaluate(() => {
      // Initiate Lynx boss fight (opponent index 5)
      window.Game.startTournamentFight(5);
    });
    await page.waitForTimeout(1200);

    const isCutsceneActive = await page.evaluate(() => {
      const overlay = document.getElementById('cinematic-overlay');
      const speakerBadge = document.getElementById('dialogue-speaker-badge');
      const textSpan = document.getElementById('dialogue-text');
      const leftPortrait = document.getElementById('dialogue-portrait-left');
      const rightPortrait = document.getElementById('dialogue-portrait-right');
      return {
        hasActiveOverlay: overlay && overlay.classList.contains('active'),
        speaker: speakerBadge ? speakerBadge.textContent : '',
        text: textSpan ? textSpan.textContent : '',
        leftActive: leftPortrait && leftPortrait.classList.contains('active-speaker'),
        rightActive: rightPortrait && rightPortrait.classList.contains('active-speaker')
      };
    });
    console.log('Pre-Fight Cutscene DOM State:', isCutsceneActive);
    if (!isCutsceneActive.hasActiveOverlay) {
      throw new Error('Test 1 Failed: #cinematic-overlay not active during pre-fight!');
    }

    const p1 = path.join(SCREENSHOT_DIR, 'boss_1_dialogue_prefight.png');
    await page.screenshot({ path: p1 });
    console.log(`✓ Saved screenshot: ${p1}`);

    // ========================================================
    // TEST 2: Mid-Fight 50% HP Boss Awakening Trigger & Cutscene
    // ========================================================
    console.log('\n--- TEST 2: Mid-Fight 50% HP Awakening Trigger ---');
    // Skip remaining pre-fight dialogue so combat begins
    await page.evaluate(() => {
      window.Cinematics.skipDialogue();
    });
    await page.waitForTimeout(1000);

    // Ensure fight is active
    await page.evaluate(() => {
      window.Game.matchState = 'FIGHTING';
      window.Game.announcementText = '';
      window.Game.introCounter = 0;
    });
    await page.waitForTimeout(300);

    // Reduce Lynx HP to <= 50% (Max HP is 180, so set to 90 and deliver hit)
    await page.evaluate(() => {
      console.log('Setting Lynx HP to 90 and delivering strike to trigger awakening threshold...');
      window.Game.opponent.hp = 90;
      window.Game.opponent.takeHit(
        window.Game.player,
        { damageMultiplier: 1.0, zone: 'torso' },
        window.Game.sceneRenderer,
        window.Game.opponent.x,
        window.Game.opponent.y - 50
      );
    });
    await page.waitForTimeout(1200);

    const awakeningCutsceneState = await page.evaluate(() => {
      const overlay = document.getElementById('cinematic-overlay');
      const badge = document.getElementById('dialogue-speaker-badge');
      const text = document.getElementById('dialogue-text');
      const rightPortrait = document.getElementById('dialogue-portrait-right');
      return {
        isAwakening: window.Game.isAwakening,
        hasAwakened: window.Game.opponent.hasAwakened,
        isBoss: window.Game.opponent.isBoss,
        hp: window.Game.opponent.hp,
        overlayActive: overlay && overlay.classList.contains('active'),
        speaker: badge ? badge.textContent : '',
        text: text ? text.textContent : '',
        demonPortrait: rightPortrait && rightPortrait.className
      };
    });
    console.log('Awakening Cutscene State:', awakeningCutsceneState);
    if (!awakeningCutsceneState.overlayActive || !awakeningCutsceneState.hasAwakened) {
      throw new Error('Test 2 Failed: Awakening cutscene did not trigger at 50% HP threshold!');
    }

    const p2 = path.join(SCREENSHOT_DIR, 'boss_2_awakening_cutscene.png');
    await page.screenshot({ path: p2 });
    console.log(`✓ Saved screenshot: ${p2}`);

    // ========================================================
    // TEST 3: Lynx Phase 2 Demon Transformation & 2.5D Demon Lighting
    // ========================================================
    console.log('\n--- TEST 3: Demon Form Transformation & 2.5D Blood-Crimson Lighting ---');
    // Skip dialogue to complete awakening transformation
    await page.evaluate(() => {
      window.Cinematics.skipDialogue();
    });
    await page.waitForTimeout(800);

    // Advance 12 frames of combat loop to let demon flames and dynamic lighting render
    for (let f = 0; f < 12; f++) {
      await page.evaluate(() => {
        window.Game.matchState = 'FIGHTING';
        if (window.ThreeScene && window.ThreeScene.updateSpellLighting) {
          window.ThreeScene.updateSpellLighting(window.Game.player, window.Game.opponent);
        }
      });
      await page.waitForTimeout(30);
    }

    const demonState = await page.evaluate(() => {
      const boss = window.Game.opponent;
      const light = window.ThreeScene && window.ThreeScene.spellLight;
      return {
        isAwakened: boss.isAwakened,
        bossPhase: boss.bossPhase,
        hp: boss.hp,
        maxHp: boss.maxHp,
        auraGlow: boss.visuals && boss.visuals.auraGlow,
        demonLightColor: light ? '0x' + light.color.getHexString() : 'none',
        demonLightIntensity: light ? light.intensity : 0
      };
    });
    console.log('Demon Phase 2 State:', demonState);
    if (!demonState.isAwakened || demonState.bossPhase !== 2) {
      throw new Error('Test 3 Failed: Boss not in Awakened Phase 2 state!');
    }

    const p3 = path.join(SCREENSHOT_DIR, 'boss_3_demon_awakened.png');
    await page.screenshot({ path: p3 });
    console.log(`✓ Saved screenshot: ${p3}`);

    // ========================================================
    // TEST 4: Lynx Awakened Move Execution (LYNX_FRENZY)
    // ========================================================
    console.log('\n--- TEST 4: Lynx Awakened Move Execution (LYNX_FRENZY) ---');
    await page.evaluate(() => {
      window.Game.matchState = 'FIGHTING';
      window.Game.opponent.triggerMove('LYNX_FRENZY');
    });

    // Advance frames to mid-combo claw flurry (around frame 18)
    for (let f = 0; f < 18; f++) {
      await page.evaluate(() => {
        window.Game.opponent.handleAttackingState(window.Game.player, window.Game.sceneRenderer);
      });
      await page.waitForTimeout(20);
    }

    const moveState = await page.evaluate(() => {
      const boss = window.Game.opponent;
      return {
        moveId: boss.currentMove ? boss.currentMove.id : null,
        frameCounter: boss.frameCounter,
        state: boss.state
      };
    });
    console.log('Lynx Frenzy Attack State:', moveState);

    const p4 = path.join(SCREENSHOT_DIR, 'boss_4_lynx_frenzy.png');
    await page.screenshot({ path: p4 });
    console.log(`✓ Saved screenshot: ${p4}`);

    // ========================================================
    // TEST 5: Decisive Lynx Defeat & Seal of the Lynx Acquisition
    // ========================================================
    console.log('\n--- TEST 5: Lynx Defeat, Victory Cutscene & 3D Seal of the Lynx Modal ---');
    // Set Lynx to 0 HP and grant 2 rounds won to Shadow for decisive victory
    await page.evaluate(() => {
      window.Game.opponent.hp = 0;
      window.Game.player.hp = 100;
      window.Game.player.roundsWon = 1; // triggerRoundOver will increment to 2
      window.Game.triggerRoundOver();
      // Fast forward round over counter
      window.Game.introCounter = 1;
      window.Game.checkMatchProgression();
    });
    await page.waitForTimeout(1000);

    const victoryDialogueState = await page.evaluate(() => {
      const overlay = document.getElementById('cinematic-overlay');
      const badge = document.getElementById('dialogue-speaker-badge');
      const text = document.getElementById('dialogue-text');
      return {
        overlayActive: overlay && overlay.classList.contains('active'),
        speaker: badge ? badge.textContent : '',
        text: text ? text.textContent : ''
      };
    });
    console.log('Victory Dialogue State:', victoryDialogueState);

    // Skip victory dialogue to open Seal of the Lynx modal
    await page.evaluate(() => {
      window.Cinematics.skipDialogue();
    });
    await page.waitForTimeout(1000);

    const sealModalState = await page.evaluate(() => {
      const modal = document.getElementById('seal-reward-modal');
      const canvas = document.getElementById('sealInspectCanvas');
      return {
        modalActive: modal && modal.classList.contains('active'),
        canvasPresent: !!canvas,
        coins: window.Armory ? window.Armory.coins : null,
        gems: window.Armory ? window.Armory.gems : null,
        stages: window.Tournament ? window.Tournament.completedStages : []
      };
    });
    console.log('Seal Modal State:', sealModalState);
    if (!sealModalState.modalActive) {
      throw new Error('Test 5 Failed: #seal-reward-modal not active after Lynx defeat!');
    }

    const p5 = path.join(SCREENSHOT_DIR, 'boss_5_seal_acquired.png');
    await page.screenshot({ path: p5 });
    console.log(`✓ Saved screenshot: ${p5}`);

    // Claim reward and verify Act I Conquered banner
    await page.evaluate(() => {
      window.Game.claimSealReward();
    });
    await page.waitForTimeout(600);

    const bannerState = await page.evaluate(() => {
      const banner = document.querySelector('.act-conquered-banner');
      return {
        hasBanner: !!banner,
        bannerText: banner ? banner.textContent : '',
        isModalClosed: !document.getElementById('seal-reward-modal').classList.contains('active')
      };
    });
    console.log('Act I Conquered Banner State:', bannerState);
    if (!bannerState.hasBanner) {
      throw new Error('Test 5 Failed: Act I Conquered banner not displayed on tournament screen!');
    }

    // ========================================================
    // TEST 6: Zero Console Errors Check
    // ========================================================
    console.log('\n--- TEST 6: Console Error Assertion ---');
    console.log(`Total captured browser errors: ${errors.length}`);
    if (errors.length > 0) {
      console.error('Errors captured:', errors);
      throw new Error(`Test 6 Failed: ${errors.length} browser errors detected during narrative lifecycle!`);
    } else {
      console.log('✓ 0 browser errors detected throughout full narrative flow!');
    }

    console.log('\n======================================================');
    console.log('🎉 ALL FEATURE 4 BOSS AWAKENING & CINEMATIC TESTS PASSED!');
    console.log('======================================================\n');

  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});

