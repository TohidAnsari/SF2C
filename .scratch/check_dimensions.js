const fs = require('fs');
const path = require('path');

// Mock browser globals for Three.js in Node
global.THREE = require(path.join(__dirname, '..', 'lib', 'three.min.js'));
require(path.join(__dirname, '..', 'lib', 'GLTFLoader.js'));

function checkModel(filename) {
  const filePath = path.join(__dirname, '..', 'assets', '3d', filename);
  const buf = fs.readFileSync(filePath);
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

  const loader = new THREE.GLTFLoader();
  loader.parse(arrayBuffer, '', (gltf) => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    console.log(`\n=== ${filename} ===`);
    console.log(`Min: (${box.min.x.toFixed(3)}, ${box.min.y.toFixed(3)}, ${box.min.z.toFixed(3)})`);
    console.log(`Max: (${box.max.x.toFixed(3)}, ${box.max.y.toFixed(3)}, ${box.max.z.toFixed(3)})`);
    console.log(`Size: (${size.x.toFixed(3)}, ${size.y.toFixed(3)}, ${size.z.toFixed(3)})`);
    console.log(`Center: (${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)})`);
    console.log(`Max dimension: ${Math.max(size.x, size.y, size.z).toFixed(3)}`);
  }, (err) => console.error(err));
}

['torii.glb', 'dojo_wall.glb', 'lantern.glb', 'katana.glb', 'katana_saya.glb', 'dagger.glb'].forEach(checkModel);

