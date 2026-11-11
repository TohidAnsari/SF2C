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

function startServer(port = 8089) {
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
  const server = await startServer(8089);
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
      console.error(`[Browser Error] ${msg.text()}`);
      errors.push(msg.text());
    } else {
      console.log(`[Browser Log] ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    console.error(`[Page Error] ${err.message}`);
    errors.push(err.message);
  });

  try {
    console.log('Navigating to http://localhost:8089/index.html ...');
    await page.goto('http://localhost:8089/index.html');
    await page.waitForTimeout(2000);

    // TEST 1: Open Armory & Inspect Mystical Amulets
    console.log('--- TEST 1: Armory Mystical Amulets ---');
    await page.evaluate(() => window.Game.showScreen('screen-armory'));
    await page.waitForTimeout(800);

    const amuletsRendered = await page.evaluate(() => {
      const cards = document.querySelectorAll('.armory-card');
      return {
        cardCount: cards.length,
        hasFlame: !!document.querySelector("button[onclick*='FLAME_AMULET']"),
        hasDark: !!document.querySelector("button[onclick*='DARK_AMULET']"),
        hasWind: !!document.querySelector("button[onclick*='WIND_TALISMAN']")
      };
    });
    console.log('Amulets in Armory:', JSON.stringify(amuletsRendered, null, 2));

    // Inspect Flame Amulet in 3D
    await page.evaluate(() => window.Armory.inspectItem('amulet', 'FLAME_AMULET'));
    await page.waitForTimeout(1000);

    const pArmory = path.join(SCREENSHOT_DIR, 'magic_4_armory_amulets.png');
    await page.screenshot({ path: pArmory });
    console.log(`Saved screenshot: ${pArmory}`);
    await page.evaluate(() => window.ThreeScene.closeInspector());
    await page.waitForTimeout(400);

    // TEST 2: Start Match & Cast FIREBALL
    console.log('--- TEST 2: Fireball Cast & Dynamic 2.5D Lighting ---');
    await page.evaluate(() => {
      window.Armory.equipped.amulet = 'FLAME_AMULET';
      window.Game.startTrainingDojo();
    });
    await page.waitForTimeout(1000);

    // Charge magic meter to 100%
    await page.evaluate(() => {
      window.Game.player.addMagic(100);
      window.Game.matchState = 'FIGHTING';
    });
    await page.waitForTimeout(300);

    // Trigger Fireball cast
    await page.evaluate(() => {
      window.Game.player.castMagic(window.Game.opponent, window.Game.sceneRenderer);
    });

    // Advance 8 frames for active airborne projectile and 2.5D lighting
    for (let f = 0; f < 8; f++) {
      await page.evaluate(() => {
        window.Game.player.updateMagicSpells(window.Game.opponent, window.Game.sceneRenderer);
        if (window.ThreeScene) window.ThreeScene.updateSpellLighting(window.Game.player, window.Game.opponent);
      });
    }
    await page.waitForTimeout(400);

    const pFireball = path.join(SCREENSHOT_DIR, 'magic_1_fireball.png');
    await page.screenshot({ path: pFireball });
    console.log(`Saved screenshot: ${pFireball}`);

    // TEST 3: Dark Eruption Cast & Airborne Juggle
    console.log('--- TEST 3: Dark Eruption Cast & Juggle Launch ---');
    await page.evaluate(() => {
      window.Game.player.activeMagicSpells = [];
      window.Game.player.amulet = 'DARK_AMULET';
      window.Game.player.addMagic(100);
      window.Game.player.castMagic(window.Game.opponent, window.Game.sceneRenderer);
    });

    // Advance 18 frames: delay finishes and obsidian spires erupt & launch opponent
    for (let f = 0; f < 18; f++) {
      await page.evaluate(() => {
        window.Game.player.updateMagicSpells(window.Game.opponent, window.Game.sceneRenderer);
        window.Game.opponent.update(window.Game.player, null, window.Game.sceneRenderer);
        if (window.ThreeScene) window.ThreeScene.updateSpellLighting(window.Game.player, window.Game.opponent);
      });
    }
    await page.waitForTimeout(400);

    const pEruption = path.join(SCREENSHOT_DIR, 'magic_2_dark_eruption.png');
    await page.screenshot({ path: pEruption });
    console.log(`Saved screenshot: ${pEruption}`);

    // TEST 4: Smoke Teleport & Ambush Reposition
    console.log('--- TEST 4: Smoke Teleport & Ambush Strike ---');
    await page.evaluate(() => {
      window.Game.player.activeMagicSpells = [];
      window.Game.player.amulet = 'WIND_TALISMAN';
      window.Game.player.x = 240;
      window.Game.opponent.x = 680;
      window.Game.player.addMagic(100);
      window.Game.player.castMagic(window.Game.opponent, window.Game.sceneRenderer);
    });

    // Advance 10 frames: teleport has positioned player behind opponent
    for (let f = 0; f < 10; f++) {
      await page.evaluate(() => {
        window.Game.player.updateMagicSpells(window.Game.opponent, window.Game.sceneRenderer);
        if (window.ThreeScene) window.ThreeScene.updateSpellLighting(window.Game.player, window.Game.opponent);
      });
    }
    await page.waitForTimeout(400);

    const pSmoke = path.join(SCREENSHOT_DIR, 'magic_3_smoke_teleport.png');
    await page.screenshot({ path: pSmoke });
    console.log(`Saved screenshot: ${pSmoke}`);

    console.log('Errors count during run:', errors.length);
    if (errors.length > 0) {
      console.warn('Errors encountered:', errors);
    } else {
      console.log('✅ 0 CONSOLE ERRORS DETECTED!');
    }

  } catch (err) {
    console.error('Test Execution Failure:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
    console.log('Test execution completed and server stopped.');
  }
}

run();

