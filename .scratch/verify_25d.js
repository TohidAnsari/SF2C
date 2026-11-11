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

function startServer(port = 8088) {
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
  const server = await startServer(8088);
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
    console.log('Navigating to http://localhost:8088 ...');
    await page.goto('http://localhost:8088/index.html');
    await page.waitForTimeout(2000);

    // 1. Check 3D Scene Initialization
    const threeStatus = await page.evaluate(() => {
      return {
        threeLoaded: typeof window.THREE !== 'undefined',
        gltfLoaded: typeof window.THREE.GLTFLoader !== 'undefined',
        threeSceneReady: !!window.ThreeScene && window.ThreeScene.isReady,
        threeSceneSupported: !!window.ThreeScene && window.ThreeScene.isSupported,
        currentMode: window.ThreeScene ? window.ThreeScene.currentMode : null,
        modelsLoaded: window.ThreeScene ? Object.keys(window.ThreeScene.modelTemplates) : []
      };
    });
    console.log('ThreeScene Engine Status:', JSON.stringify(threeStatus, null, 2));

    // Capture Screenshot 1: 2.5D Dojo Lobby
    const p1 = path.join(SCREENSHOT_DIR, 'hybrid_1_dojo_lobby.png');
    await page.screenshot({ path: p1 });
    console.log(`Saved Dojo Lobby screenshot: ${p1}`);

    // 2. Open Armory and inspect Katana in 3D
    console.log('Navigating to Armory screen...');
    await page.evaluate(() => window.Game.showScreen('screen-armory'));
    await page.waitForTimeout(1000);

    console.log('Inspecting Katana in 3D...');
    await page.evaluate(() => window.Armory.inspectItem('weapon', 'KATANA'));
    await page.waitForTimeout(1500);

    // Rotate the 3D model slightly for inspection
    await page.evaluate(() => {
      if (window.ThreeScene && window.ThreeScene.inspector.activeModel) {
        window.ThreeScene.inspector.activeModel.rotation.y = 0.85;
      }
    });
    await page.waitForTimeout(500);

    const p2 = path.join(SCREENSHOT_DIR, 'hybrid_2_katana_inspect.png');
    await page.screenshot({ path: p2 });
    console.log(`Saved Katana 3D Inspection screenshot: ${p2}`);

    // 3. Inspect Dagger / Knives in 3D
    console.log('Inspecting Dagger / Knives in 3D...');
    await page.evaluate(() => window.Armory.inspectItem('weapon', 'KNIVES'));
    await page.waitForTimeout(1500);

    const p3 = path.join(SCREENSHOT_DIR, 'hybrid_3_dagger_inspect.png');
    await page.screenshot({ path: p3 });
    console.log(`Saved Dagger 3D Inspection screenshot: ${p3}`);

    // Close 3D Inspector
    await page.evaluate(() => window.ThreeScene.closeInspector());
    await page.waitForTimeout(600);

    // 4. Start Arena Match (Tournament against Shin)
    console.log('Starting Arena match against Shin...');
    await page.evaluate(() => {
      window.Game.startTournamentFight(0);
    });
    await page.waitForTimeout(1200); // Capture round intro banner

    const p4 = path.join(SCREENSHOT_DIR, 'hybrid_4_arena_torii.png');
    await page.screenshot({ path: p4 });
    console.log(`Saved Arena Torii Gate screenshot: ${p4}`);

    // Wait for Round Intro to complete and active combat to begin
    console.log('Transitioning to active combat phase...');
    await page.evaluate(() => {
      window.Game.introCounter = 0;
      window.Game.matchState = 'FIGHTING';
      window.Game.announcementText = '';
      window.Game.player.triggerMove('PUNCH_FORWARD');
      window.Game.player.vx = 4.5;
      window.Game.sceneRenderer.spawnShockwave(500, 380, 60, '#f39c12');
      window.Game.sceneRenderer.spawnSpeedLines(450, 350, 1, 65, 3);
    });
    await page.waitForTimeout(400);

    const p5 = path.join(SCREENSHOT_DIR, 'hybrid_5_arena_combat.png');
    await page.screenshot({ path: p5 });
    console.log(`Saved Arena Combat Action screenshot: ${p5}`);

    console.log('Playwright verification test completed successfully!');
    console.log(`Total browser errors recorded: ${errors.length}`);
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
    server.close();
  }
}

run();
