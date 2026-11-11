const http = require('http');
const fs = require('fs');
const path = require('path');

const globalNodePath = path.join(process.env.APPDATA, 'npm', 'node_modules');
if (!process.env.NODE_PATH) {
  process.env.NODE_PATH = globalNodePath;
  require('module').Module._initPaths();
}
const { chromium } = require('playwright');

const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.glb': 'model/gltf-binary',
  '.gltf': 'application/json'
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
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(fullPath).pipe(res);
  });
  return new Promise(resolve => server.listen(port, () => resolve(server)));
}

async function debugLayout() {
  const server = await startServer(8089);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 750 } });

  await page.goto('http://localhost:8089/index.html');
  await page.waitForTimeout(1000);

  const info = await page.evaluate(() => {
    function getBox(id) {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        id,
        x: r.x, y: r.y, w: r.width, h: r.height,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        zIndex: style.zIndex,
        position: style.position,
        pointerEvents: style.pointerEvents
      };
    }

    return {
      app: getBox('app'),
      bg3dCanvas: getBox('bg3dCanvas'),
      screenMainMenu: getBox('screen-main-menu'),
      lobbyCanvas: getBox('lobbyCanvas'),
      screenArena: getBox('screen-arena'),
      gameCanvas: getBox('gameCanvas')
    };
  });

  console.log('Layout boxes:', JSON.stringify(info, null, 2));

  await browser.close();
  server.close();
}

debugLayout();

