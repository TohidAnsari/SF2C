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

function startServer(port = 8090) {
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
    const mime = {
      '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
      '.glb': 'model/gltf-binary'
    }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(fullPath).pipe(res);
  });
  return new Promise(resolve => server.listen(port, () => resolve(server)));
}

async function testInspect() {
  const server = await startServer(8090);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 750 } });

  await page.goto('http://localhost:8090/index.html');
  await page.waitForTimeout(1500);

  const res = await page.evaluate(() => {
    window.Armory.inspectItem('weapon', 'KATANA');
    const model = window.ThreeScene.inspector.activeModel;
    if (!model) return { err: 'No activeModel' };
    const box = new window.THREE.Box3().setFromObject(model);
    const size = new window.THREE.Vector3();
    box.getSize(size);
    const center = new window.THREE.Vector3();
    box.getCenter(center);
    return {
      boxMin: box.min,
      boxMax: box.max,
      size: size,
      center: center,
      children: model.children.length
    };
  });

  console.log('Current Katana inspect geometry:', JSON.stringify(res, null, 2));

  await browser.close();
  server.close();
}

testInspect();

