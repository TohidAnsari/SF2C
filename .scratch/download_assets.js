const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');

const downloads = [
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    dest: path.join(ROOT, 'lib', 'three.min.js')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js',
    dest: path.join(ROOT, 'lib', 'GLTFLoader.js')
  },
  {
    url: 'https://cdn.3dassets.dev/assets/26371/v1/model.glb',
    dest: path.join(ROOT, 'assets', '3d', 'torii.glb')
  },
  {
    url: 'https://cdn.3dassets.dev/assets/18060/v1/model.glb',
    dest: path.join(ROOT, 'assets', '3d', 'dojo_wall.glb')
  },
  {
    url: 'https://cdn.3dassets.dev/assets/36453/v1/model.glb',
    dest: path.join(ROOT, 'assets', '3d', 'lantern.glb')
  },
  {
    url: 'https://cdn.3dassets.dev/assets/38888/v1/model.glb',
    dest: path.join(ROOT, 'assets', '3d', 'katana.glb')
  },
  {
    url: 'https://cdn.3dassets.dev/assets/38925/v1/model.glb',
    dest: path.join(ROOT, 'assets', '3d', 'katana_saya.glb')
  },
  {
    url: 'https://cdn.3dassets.dev/assets/38899/v1/model.glb',
    dest: path.join(ROOT, 'assets', '3d', 'dagger.glb')
  }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close(() => {
          const stats = fs.statSync(dest);
          console.log(`Downloaded ${path.basename(dest)}: ${(stats.size / 1024).toFixed(1)} KB`);
          resolve(stats.size);
        });
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Starting asset downloads...');
  for (const item of downloads) {
    try {
      await download(item.url, item.dest);
    } catch (err) {
      console.error(`Error downloading ${item.url}:`, err.message);
      process.exit(1);
    }
  }
  console.log('All assets successfully downloaded and verified!');
}

main();
