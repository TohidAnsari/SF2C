const fs = require('fs');
const path = require('path');

// Read GLB header and chunk info
function inspectGLB(filename) {
  const filePath = path.join(__dirname, '..', 'assets', '3d', filename);
  const buf = fs.readFileSync(filePath);
  
  const magic = buf.toString('utf8', 0, 4);
  const version = buf.readUInt32LE(4);
  const length = buf.readUInt32LE(8);
  
  const chunk0Length = buf.readUInt32LE(12);
  const chunk0Type = buf.toString('utf8', 16, 20); // 'JSON'
  
  const jsonStr = buf.toString('utf8', 20, 20 + chunk0Length);
  const gltf = JSON.parse(jsonStr);
  
  console.log(`\n=== ${filename} ===`);
  console.log(`Magic: ${magic}, Version: ${version}, Size: ${(length / 1024).toFixed(1)} KB`);
  console.log(`Nodes: ${gltf.nodes ? gltf.nodes.length : 0}, Meshes: ${gltf.meshes ? gltf.meshes.length : 0}`);
  if (gltf.meshes) {
    gltf.meshes.forEach((m, idx) => {
      console.log(`  Mesh [${idx}]: "${m.name || 'unnamed'}", Primitives: ${m.primitives.length}`);
    });
  }
}

['torii.glb', 'dojo_wall.glb', 'lantern.glb', 'katana.glb', 'katana_saya.glb', 'dagger.glb'].forEach(inspectGLB);

