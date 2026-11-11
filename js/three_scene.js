/**
 * Shadow Fight 2 Web Edition - 2.5D Hybrid WebGL Scene Manager
 * Powered by Three.js & CC0 3D Assets (Torii Gate, Dojo Weapon Racks, Paper Lanterns, Katanas)
 * 
 * Capabilities:
 * - Dynamic 2.5D Camera Tracking: Syncs 3D perspective camera with 2D fighter coordinates and zoom
 * - Atmospheric Feudal Japan Arena: 3D Torii Gate, swaying paper lanterns with flickering point lights, sunset directional lighting
 * - Traditional Dojo Environment: 3D Dojo wall with weapon racks, warm tatami illumination, floating golden dust motes
 * - Interactive 3D Armory Inspector: 360° orbit rotation, specular metallic gleam, blade edge reflections, equipment stats
 * - Resilient Offline & Fallback: Gracefully degrades to procedural 2D canvas if WebGL or assets are unavailable
 */

class ThreeSceneManager {
  constructor() {
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.isReady = false;
    this.isSupported = false;
    this.currentMode = 'none'; // 'arena', 'dojo', 'none'

    // Loaded 3D models cache
    this.models = {};
    this.modelTemplates = {};

    // Dynamic objects in scene
    this.lanterns = [];
    this.spellLight = null;
    this.demonLight = null;
    this.sakuraParticles = null;
    this.dustParticles = null;

    // Camera synchronization state
    this.camSync = {
      x: 0,
      y: 0,
      zoom: 1.0,
      targetX: 0,
      targetY: 0,
      targetZoom: 1.0
    };

    // Sub-scene: Interactive 3D Armory Inspector
    this.inspector = {
      modal: null,
      canvas: null,
      renderer: null,
      scene: null,
      camera: null,
      activeModel: null,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0,
      rotX: 0.15,
      rotY: 0.0,
      targetRotX: 0.15,
      targetRotY: 0.0,
      zoomDist: 3.2,
      targetZoomDist: 3.2,
      autoSpin: true,
      currentItem: null
    };

    this.sealRendererInstance = null;
    this.sealMeshGroup = null;
    this.sealAnimId = null;

    this.clock = null;
    this.animationFrameId = null;
  }

  // --- INITIALIZATION ---
  init(bgCanvasId = 'bg3dCanvas', inspectCanvasId = 'armoryInspectCanvas') {
    if (typeof window.THREE === 'undefined') {
      console.warn('[ThreeScene] THREE.js not loaded. Operating in 2D fallback mode.');
      return false;
    }

    try {
      this.canvas = document.getElementById(bgCanvasId);
      if (!this.canvas) {
        console.warn(`[ThreeScene] Canvas #${bgCanvasId} not found in DOM.`);
        return false;
      }

      // Check WebGL context
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(this.canvas.width || 1000, this.canvas.height || 588);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(42, (this.canvas.width || 1000) / (this.canvas.height || 588), 0.1, 500);
      this.camera.position.set(0, 1.8, 8.5);
      this.camera.lookAt(0, 1.4, 0);

      this.clock = new THREE.Clock();
      this.isSupported = true;

      // Init 3D Armory Inspector Subsystem
      this.initArmoryInspector(inspectCanvasId);

      // Preload 3D Models
      this.loadAssets().then(() => {
        this.isReady = true;
        console.log('[ThreeScene] 2.5D Hybrid WebGL Engine ready with CC0 3D assets.');
      }).catch(err => {
        console.warn('[ThreeScene] Asset loading notice:', err.message);
        this.isReady = true; // Still ready for procedural fallbacks
      });

      // Start tick loop
      this.animate();
      return true;
    } catch (err) {
      console.error('[ThreeScene] WebGL initialization error:', err);
      this.isSupported = false;
      return false;
    }
  }

  // --- 3D ASSET LOADING ---
  async loadAssets() {
    if (typeof THREE.GLTFLoader === 'undefined') {
      console.warn('[ThreeScene] GLTFLoader not available. Building procedural 3D scenery.');
      this.createProceduralAssets();
      return;
    }

    const loader = new THREE.GLTFLoader();

    // 1. Scenery & Architecture
    const sceneryAssets = [
      { key: 'torii', path: 'assets/3d/torii.glb', height: 4.8 },
      { key: 'dojo_wall', path: 'assets/3d/dojo_wall.glb', height: 4.2 },
      { key: 'lantern', path: 'assets/3d/lantern.glb', height: 1.1 }
    ];

    for (const item of sceneryAssets) {
      try {
        const gltf = await this.loadGLTFPromise(loader, item.path);
        this.modelTemplates[item.key] = this.normalizeScenery(gltf.scene, item.height);
      } catch (e) {
        console.warn(`[ThreeScene] Could not load ${item.path}, generating procedural substitute.`, e.message);
        this.modelTemplates[item.key] = this.createProceduralAsset(item.key, item.height);
      }
    }

    // 2. Weapons & Equipment
    const weaponAssets = [
      { key: 'katana', path: 'assets/3d/katana.glb', length: 1.9 },
      { key: 'katana_saya', path: 'assets/3d/katana_saya.glb', length: 1.5 },
      { key: 'dagger', path: 'assets/3d/dagger.glb', length: 1.3 }
    ];

    for (const item of weaponAssets) {
      try {
        const gltf = await this.loadGLTFPromise(loader, item.path);
        this.modelTemplates[item.key] = this.normalizeWeapon(gltf.scene, item.length);
      } catch (e) {
        console.warn(`[ThreeScene] Could not load ${item.path}, generating procedural substitute.`, e.message);
        this.modelTemplates[item.key] = this.createProceduralAsset(item.key, item.length);
      }
    }
  }

  loadGLTFPromise(loader, url) {
    return new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
  }

  // Normalizes architectural scenery props (Y = height)
  normalizeScenery(scene, targetHeight = 1.0) {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const scale = targetHeight / (size.y || 1);
    scene.scale.set(scale, scale, scale);

    // Center X/Z, place bottom on ground (Y=0)
    scene.position.x = -center.x * scale;
    scene.position.y = -box.min.y * scale;
    scene.position.z = -center.z * scale;

    const wrapper = new THREE.Group();
    wrapper.add(scene);

    wrapper.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.roughness = 0.75;
        }
      }
    });

    return wrapper;
  }

  // Normalizes weapon models (maxDim = length, aligned along Y)
  normalizeWeapon(scene, targetLength = 1.8) {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1.0;
    const scale = targetLength / maxDim;
    scene.scale.set(scale, scale, scale);

    // Center visual pivot at (0, 0, 0)
    scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    const wrapper = new THREE.Group();
    // In our downloaded GLTF models, weapons extend along Z. Rotate so blade extends along Y axis.
    if (size.z > size.y && size.z > size.x) {
      scene.rotation.x = Math.PI / 2;
    }
    wrapper.add(scene);

    wrapper.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.metalness = 0.90;
          child.material.roughness = 0.18;
        }
      }
    });

    return wrapper;
  }

  // --- PROCEDURAL 3D ASSETS FALLBACK ---
  createProceduralAsset(key, height = 2.0) {
    const group = new THREE.Group();
    if (key === 'torii') {
      const redMat = new THREE.MeshStandardMaterial({ color: 0xb71c1c, roughness: 0.6 });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.5 });
      // Left pillar
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, height, 16), redMat);
      p1.position.set(-1.8, height / 2, 0);
      // Right pillar
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, height, 16), redMat);
      p2.position.set(1.8, height / 2, 0);
      // Top curved beam
      const beam = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.35, 0.4), darkMat);
      beam.position.set(0, height * 0.95, 0);
      // Secondary crossbeam
      const subBeam = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.25, 0.3), redMat);
      subBeam.position.set(0, height * 0.8, 0);

      group.add(p1, p2, beam, subBeam);
    } else if (key === 'lantern') {
      const paperMat = new THREE.MeshStandardMaterial({ color: 0xfff8e1, emissive: 0xff8f00, emissiveIntensity: 0.6 });
      const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(height * 0.4, 16, 16), paperMat);
      body.scale.set(1, 1.25, 1);
      body.position.y = height * 0.5;
      const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16), blackMat);
      topCap.position.y = height * 0.85;
      group.add(body, topCap);
    } else if (key === 'katana') {
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, metalness: 0.95, roughness: 0.15 });
      const hiltMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
      const guardMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 });

      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, height * 0.72, 0.12), bladeMat);
      blade.position.y = height * 0.55;
      const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), guardMat);
      tsuba.position.y = height * 0.2;
      const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, height * 0.24, 12), hiltMat);
      hilt.position.y = height * 0.08;

      group.add(blade, tsuba, hilt);
    } else {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(height * 0.5, height, height * 0.3),
        new THREE.MeshStandardMaterial({ color: 0x5d4037 })
      );
      box.position.y = height / 2;
      group.add(box);
    }
    return group;
  }

  // --- ENVIRONMENT: COMBAT ARENA ---
  setupArenaEnvironment() {
    if (!this.isSupported) return;
    this.currentMode = 'arena';
    this.clearScene();

    // 0. Atmospheric Sunset Sky Gradient
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 16;
    skyCanvas.height = 256;
    const sCtx = skyCanvas.getContext('2d');
    const sGrad = sCtx.createLinearGradient(0, 0, 0, 256);
    sGrad.addColorStop(0, '#e65c00');    // Radiant sunset orange
    sGrad.addColorStop(0.35, '#8f2602'); // Rust crimson
    sGrad.addColorStop(0.72, '#3a0c06'); // Deep burgundy
    sGrad.addColorStop(1, '#160302');    // Pitch dark red
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 16, 256);
    this.scene.background = new THREE.CanvasTexture(skyCanvas);

    // 1. Atmospheric Sunset Lighting
    const hemiLight = new THREE.HemisphereLight(0xff7744, 0x111122, 0.9);
    this.scene.add(hemiLight);

    const sunDir = new THREE.DirectionalLight(0xff9944, 1.8);
    sunDir.position.set(4, 7, -3);
    sunDir.castShadow = true;
    sunDir.shadow.mapSize.width = 1024;
    sunDir.shadow.mapSize.height = 1024;
    this.scene.add(sunDir);

    const rimLight = new THREE.DirectionalLight(0x4466aa, 0.6);
    rimLight.position.set(-6, 3, 5);
    this.scene.add(rimLight);

    // 2. Ground Plane
    const groundGeo = new THREE.PlaneGeometry(60, 30);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x140a08,
      roughness: 0.9,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 3. Central Feudal Torii Gate (Positioned in Midground Parallax)
    if (this.modelTemplates['torii']) {
      const torii = this.modelTemplates['torii'].clone();
      torii.position.set(0, 0, -4.5);
      torii.scale.set(1.35, 1.35, 1.35);
      this.scene.add(torii);
    }

    // 4. Swaying Paper Lanterns with Point Lights
    this.lanterns = [];
    const lanternPositions = [
      { x: -5.2, y: 1.9, z: -2.8, lightColor: 0xffaa33 },
      { x: 5.2, y: 1.9, z: -2.8, lightColor: 0xffaa33 },
      { x: -8.8, y: 2.2, z: -5.0, lightColor: 0xff7722 },
      { x: 8.8, y: 2.2, z: -5.0, lightColor: 0xff7722 }
    ];

    lanternPositions.forEach((pos, index) => {
      const group = new THREE.Group();
      group.position.set(pos.x, pos.y, pos.z);

      if (this.modelTemplates['lantern']) {
        const lanternMesh = this.modelTemplates['lantern'].clone();
        lanternMesh.scale.set(0.85, 0.85, 0.85);
        group.add(lanternMesh);
      }

      // Point Light with warm amber glow
      const pLight = new THREE.PointLight(pos.lightColor, 1.8, 8.5);
      pLight.position.set(0, 0.4, 0);
      pLight.castShadow = true;
      group.add(pLight);

      this.scene.add(group);
      this.lanterns.push({
        group,
        light: pLight,
        baseIntensity: 1.8,
        seed: index * 1.57,
        swaySpeed: 1.6 + Math.random() * 0.4
      });
    });

    // 5. Falling 3D Sakura Blossom Particle System
    this.initSakuraParticles();

    // 6. Dynamic 2.5D Spell Point Light (Real-time arena & torii gate illumination)
    this.spellLight = new THREE.PointLight(0xff6600, 0, 18);
    this.spellLight.position.set(0, 1.5, -1.5);
    this.spellLight.castShadow = true;
    this.scene.add(this.spellLight);
    this.demonLight = this.spellLight;

    // Reset Camera
    this.camera.position.set(0, 1.8, 8.5);
    this.camera.lookAt(0, 1.4, 0);
  }

  // --- ENVIRONMENT: DOJO LOBBY ---
  setupDojoEnvironment() {
    if (!this.isSupported) return;
    this.currentMode = 'dojo';
    this.clearScene();
    this.scene.background = new THREE.Color(0x180d09);

    // Warm Interior Ambient
    const ambientLight = new THREE.AmbientLight(0xffe5cc, 1.1);
    this.scene.add(ambientLight);

    const windowLight = new THREE.DirectionalLight(0xffb07c, 1.6);
    windowLight.position.set(5, 5, 2);
    windowLight.castShadow = true;
    this.scene.add(windowLight);

    // Floor Plane (Tatami tone)
    const floorGeo = new THREE.PlaneGeometry(40, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x24170d,
      roughness: 0.8,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.05;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 3D Dojo Wall with Weapon Racks
    if (this.modelTemplates['dojo_wall']) {
      const wallCenter = this.modelTemplates['dojo_wall'].clone();
      wallCenter.position.set(0, 0, -3.8);
      wallCenter.scale.set(1.3, 1.3, 1.3);
      this.scene.add(wallCenter);

      const wallLeft = this.modelTemplates['dojo_wall'].clone();
      wallLeft.position.set(-5.6, 0, -3.8);
      wallLeft.scale.set(1.3, 1.3, 1.3);
      this.scene.add(wallLeft);

      const wallRight = this.modelTemplates['dojo_wall'].clone();
      wallRight.position.set(5.6, 0, -3.8);
      wallRight.scale.set(1.3, 1.3, 1.3);
      this.scene.add(wallRight);
    }

    // Dojo Paper Lanterns
    this.lanterns = [];
    const dojoLanterns = [
      { x: -4.5, y: 2.1, z: -2.5, lightColor: 0xffb347 },
      { x: 4.5, y: 2.1, z: -2.5, lightColor: 0xffb347 }
    ];

    dojoLanterns.forEach((pos, index) => {
      const group = new THREE.Group();
      group.position.set(pos.x, pos.y, pos.z);

      if (this.modelTemplates['lantern']) {
        const lanternMesh = this.modelTemplates['lantern'].clone();
        lanternMesh.scale.set(0.9, 0.9, 0.9);
        group.add(lanternMesh);
      }

      const pLight = new THREE.PointLight(pos.lightColor, 2.2, 10.0);
      pLight.position.set(0, 0.4, 0);
      group.add(pLight);

      this.scene.add(group);
      this.lanterns.push({
        group,
        light: pLight,
        baseIntensity: 2.2,
        seed: index * 2.1,
        swaySpeed: 1.2
      });
    });

    // Floating Golden Dust Motes
    this.initDustParticles();

    this.camera.position.set(0, 1.7, 7.8);
    this.camera.lookAt(0, 1.3, 0);
  }

  clearScene() {
    while (this.scene.children.length > 0) {
      const obj = this.scene.children[0];
      this.scene.remove(obj);
    }
    this.lanterns = [];
    this.sakuraParticles = null;
    this.dustParticles = null;
  }

  // --- 3D PARTICLE SYSTEMS ---
  initSakuraParticles() {
    const count = 120;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
      scales[i] = 0.08 + Math.random() * 0.12;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffb7c5,
      size: 0.16,
      transparent: true,
      opacity: 0.85
    });

    this.sakuraParticles = new THREE.Points(geom, mat);
    this.scene.add(this.sakuraParticles);
  }

  initDustParticles() {
    const count = 80;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffd180,
      size: 0.09,
      transparent: true,
      opacity: 0.65
    });

    this.dustParticles = new THREE.Points(geom, mat);
    this.scene.add(this.dustParticles);
  }

  // --- 2.5D DYNAMIC CAMERA TRACKING ---
  updateCamera(camX, zoom = 1.0) {
    if (!this.isSupported || !this.camera) return;

    // Parallax tracking with 2D camera coordinates
    // camX is in 2D canvas pixel offset (typically -300 to +300)
    const factor = 0.0075;
    const target3DX = -camX * factor;
    const target3DZoom = Math.max(0.85, Math.min(1.4, zoom));

    // Smooth Lerp
    this.camSync.x += (target3DX - this.camSync.x) * 0.12;
    this.camSync.zoom += (target3DZoom - this.camSync.zoom) * 0.1;

    // Apply to 3D perspective camera
    this.camera.position.x = this.camSync.x;
    this.camera.position.z = 8.5 / this.camSync.zoom;
    this.camera.lookAt(this.camSync.x * 0.75, 1.4, 0);
  }

  // --- DYNAMIC 2.5D SPELL ILLUMINATION ---
  updateSpellLighting(p1, p2) {
    if (!this.isSupported || !this.spellLight || this.currentMode !== 'arena') return;

    const spells = [];
    if (p1 && p1.activeMagicSpells) spells.push(...p1.activeMagicSpells);
    if (p2 && p2.activeMagicSpells) spells.push(...p2.activeMagicSpells);

    const awakenedBoss = (p1 && p1.isBoss && p1.isAwakened) ? p1 : ((p2 && p2.isBoss && p2.isAwakened) ? p2 : null);

    if (spells.length > 0) {
      const s = spells[0];
      if (s.id === 'FIREBALL') {
        const x3d = (s.x - 500) * 0.016;
        const y3d = Math.max(0.4, (450 - s.y) * 0.012);
        this.spellLight.position.set(x3d, y3d, -1.5);
        this.spellLight.color.setHex(0xff5500);
        this.spellLight.intensity = 2.8 + Math.random() * 0.5;
      } else if (s.id === 'DARK_ERUPTION') {
        const x3d = (s.x - 500) * 0.016;
        this.spellLight.position.set(x3d, 1.2, -2.0);
        this.spellLight.color.setHex(0x9933ff);
        this.spellLight.intensity = s.delay > 0 ? 1.2 : 3.5;
      } else if (s.id === 'SMOKE_TELEPORT') {
        const currentX = s.frame < 8 ? s.startX : s.targetX;
        const x3d = (currentX - 500) * 0.016;
        this.spellLight.position.set(x3d, 1.5, -1.0);
        this.spellLight.color.setHex(0x3b82f6);
        this.spellLight.intensity = 1.9;
      }
    } else if (awakenedBoss) {
      this.spellLight.color.setHex(0xd63031);
      this.spellLight.intensity = 2.4 + Math.sin(Date.now() * 0.008) * 0.45;
      this.spellLight.position.set((awakenedBoss.x - 500) * 0.016, 1.6, -1.8);
    } else {
      // Smoothly fade intensity to 0
      this.spellLight.intensity += (0 - this.spellLight.intensity) * 0.18;
      if (this.spellLight.intensity < 0.02) this.spellLight.intensity = 0;
    }
  }

  // --- INTERACTIVE 3D ARMORY INSPECTOR ---
  initArmoryInspector(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    this.inspector.canvas = canvas;
    this.inspector.modal = document.getElementById('armory-3d-modal');

    this.inspector.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    this.inspector.renderer.setSize(420, 420);
    this.inspector.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.inspector.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.inspector.renderer.toneMappingExposure = 1.35;

    this.inspector.scene = new THREE.Scene();
    this.inspector.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    this.inspector.camera.position.set(0, 0, 3.2);

    // Inspector Studio Lighting (High Specular Blade Highlights)
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.inspector.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    keyLight.position.set(3, 4, 3);
    this.inspector.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x70b0ff, 1.6);
    rimLight.position.set(-4, -2, -2);
    this.inspector.scene.add(rimLight);

    const bottomGleam = new THREE.DirectionalLight(0xffa040, 1.0);
    bottomGleam.position.set(0, -3, 2);
    this.inspector.scene.add(bottomGleam);

    // Orbit Drag Controls
    this.setupInspectorControls();
  }

  setupInspectorControls() {
    const canvas = this.inspector.canvas;
    if (!canvas) return;

    const onPointerDown = (e) => {
      this.inspector.isDragging = true;
      this.inspector.autoSpin = false;
      this.inspector.lastMouseX = e.clientX;
      this.inspector.lastMouseY = e.clientY;
    };

    const onPointerMove = (e) => {
      if (!this.inspector.isDragging) return;
      const dx = e.clientX - this.inspector.lastMouseX;
      const dy = e.clientY - this.inspector.lastMouseY;
      this.inspector.lastMouseX = e.clientX;
      this.inspector.lastMouseY = e.clientY;

      this.inspector.targetRotY += dx * 0.015;
      this.inspector.targetRotX += dy * 0.012;
      this.inspector.targetRotX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.inspector.targetRotX));
    };

    const onPointerUp = () => {
      this.inspector.isDragging = false;
      // Resume slow auto spin after 3 seconds of inactivity
      clearTimeout(this.inspector.spinTimeout);
      this.inspector.spinTimeout = setTimeout(() => {
        this.inspector.autoSpin = true;
      }, 3000);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Zoom wheel
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.inspector.targetZoomDist = Math.max(1.8, Math.min(5.5, this.inspector.targetZoomDist + e.deltaY * 0.003));
    }, { passive: false });
  }

  openInspector(item) {
    if (!this.inspector.modal) return;
    this.inspector.currentItem = item;
    this.inspector.modal.classList.add('active');

    // Populate UI Fields
    const titleEl = document.getElementById('inspect-item-title');
    const typeEl = document.getElementById('inspect-item-type');
    const dmgEl = document.getElementById('inspect-stat-dmg');
    const defEl = document.getElementById('inspect-stat-def');
    const weightEl = document.getElementById('inspect-stat-weight');
    const equipBtn = document.getElementById('inspect-equip-btn');

    if (titleEl) titleEl.textContent = item.name || 'EQUIPMENT';
    if (typeEl) typeEl.textContent = `${item.category || 'WEAPON'} • LEVEL ${item.tier || 1}`;
    if (dmgEl) dmgEl.textContent = item.dmg ? `+${item.dmg}` : '--';
    if (defEl) defEl.textContent = item.def ? `+${item.def}` : '--';
    if (weightEl) weightEl.textContent = `${item.weight || 1.0} KG`;

    if (equipBtn) {
      equipBtn.onclick = () => {
        if (window.Armory) {
          window.Armory.equip(item.category ? item.category.toLowerCase() : 'weapon', item.id);
          this.closeInspector();
        }
      };
    }

    // Mount 3D Model in Inspector
    this.mountInspectorModel(item);
  }

  closeInspector() {
    if (this.inspector.modal) {
      this.inspector.modal.classList.remove('active');
    }
  }

  mountInspectorModel(item) {
    // Clear existing model
    if (this.inspector.activeModel) {
      this.inspector.scene.remove(this.inspector.activeModel);
      this.inspector.activeModel = null;
    }

    const group = new THREE.Group();
    const itemId = (item.id || '').toUpperCase();

    // 3D Mystical Amulet / Talisman Inspector Model
    if (itemId.includes('AMULET') || itemId.includes('TALISMAN') || item.category === 'amulet') {
      const isFire = itemId.includes('FLAME') || itemId.includes('FIRE');
      const isDark = itemId.includes('DARK');
      const jewelColor = isFire ? 0xff4500 : (isDark ? 0x9933ff : 0x00d2d3);

      const ringGeo = new THREE.TorusGeometry(0.85, 0.12, 16, 48);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.95,
        roughness: 0.2
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);

      const gemGeo = new THREE.OctahedronGeometry(0.55, 0);
      const gemMat = new THREE.MeshStandardMaterial({
        color: jewelColor,
        emissive: jewelColor,
        emissiveIntensity: 0.75,
        metalness: 0.2,
        roughness: 0.1,
        transparent: true,
        opacity: 0.9
      });
      const gem = new THREE.Mesh(gemGeo, gemMat);

      const gemLight = new THREE.PointLight(jewelColor, 2.2, 4);
      group.add(ring, gem, gemLight);

      this.inspector.activeModel = group;
      this.inspector.scene.add(group);
      return;
    }

    let modelKey = 'katana';

    if (itemId.includes('KNIF') || itemId.includes('KNIV') || itemId.includes('DAGGER') || itemId.includes('KUNAI')) {
      modelKey = 'dagger';
    } else if (itemId.includes('SWORD') || itemId.includes('KATANA') || itemId.includes('BLADE')) {
      modelKey = 'katana';
    }

    if (this.modelTemplates[modelKey]) {
      const mainModel = this.modelTemplates[modelKey].clone();
      mainModel.position.set(0, 0, 0);
      group.add(mainModel);

      // If Katana, pair with scabbard
      if (modelKey === 'katana' && this.modelTemplates['katana_saya']) {
        const saya = this.modelTemplates['katana_saya'].clone();
        saya.position.set(0.25, -0.12, 0.06);
        saya.rotation.z = 0.08;
        group.add(saya);
      }
    } else {
      // Procedural substitute
      const proc = this.createProceduralAsset(modelKey, 1.8);
      group.add(proc);
    }

    // Orient blade diagonally for heroic display
    group.rotation.z = -Math.PI / 4;
    this.inspector.activeModel = group;
    this.inspector.scene.add(group);

    // Reset rotation & zoom
    this.inspector.rotX = 0.15;
    this.inspector.rotY = 0.0;
    this.inspector.targetRotX = 0.15;
    this.inspector.targetRotY = 0.0;
    this.inspector.zoomDist = 2.4;
    this.inspector.targetZoomDist = 2.4;
    this.inspector.autoSpin = true;
  }

  // --- 3D SEAL OF THE LYNX REWARD MODAL ---
  renderSealModal(canvas) {
    if (typeof THREE === 'undefined' || !canvas) return false;

    try {
      if (this.sealAnimId) {
        cancelAnimationFrame(this.sealAnimId);
        this.sealAnimId = null;
      }
      if (this.sealRendererInstance && typeof this.sealRendererInstance.dispose === 'function') {
        this.sealRendererInstance.dispose();
      }

      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
      });
      renderer.setSize(canvas.width || 260, canvas.height || 260);
      renderer.setPixelRatio(Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, (canvas.width || 260) / (canvas.height || 260), 0.1, 100);
      camera.position.set(0, 0, 4.5);

      // Lights: ambient light, golden key light, crimson rim light
      const ambientLight = new THREE.AmbientLight(0xffeedd, 0.8);
      scene.add(ambientLight);

      const goldenKeyLight = new THREE.DirectionalLight(0xffd700, 2.5);
      goldenKeyLight.position.set(2, 3, 4);
      scene.add(goldenKeyLight);

      const crimsonRimLight = new THREE.DirectionalLight(0xff1744, 2.0);
      crimsonRimLight.position.set(-3, -2, -2);
      scene.add(crimsonRimLight);

      // Create Seal mesh group (gold coin cylinder, crimson center gemstone, 4 curved prongs)
      const sealGroup = new THREE.Group();

      // 1. Gold coin cylinder base
      const coinGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.18, 36);
      const coinMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.9,
        roughness: 0.25
      });
      const coinMesh = new THREE.Mesh(coinGeo, coinMat);
      coinMesh.rotation.x = Math.PI / 2;
      sealGroup.add(coinMesh);

      // 2. Outer decorative golden rim
      const rimGeo = new THREE.TorusGeometry(1.22, 0.08, 16, 48);
      const rimMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.95,
        roughness: 0.15
      });
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      sealGroup.add(rimMesh);

      // 3. Crimson center gemstone
      const gemGeo = new THREE.OctahedronGeometry(0.55, 1);
      const gemMat = new THREE.MeshStandardMaterial({
        color: 0xd63031,
        emissive: 0xff1744,
        emissiveIntensity: 0.6,
        metalness: 0.3,
        roughness: 0.15,
        transparent: true,
        opacity: 0.92
      });
      const gemMesh = new THREE.Mesh(gemGeo, gemMat);
      sealGroup.add(gemMesh);

      // 4. Four curved prongs / talons
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const prongGeo = new THREE.ConeGeometry(0.12, 0.7, 8);
        const prongMat = new THREE.MeshStandardMaterial({
          color: 0xffd700,
          metalness: 0.85,
          roughness: 0.2
        });
        const prong = new THREE.Mesh(prongGeo, prongMat);
        prong.position.set(Math.cos(angle) * 0.75, Math.sin(angle) * 0.75, 0.1);
        prong.rotation.z = angle - Math.PI / 2;
        prong.rotation.x = 0.25;
        sealGroup.add(prong);
      }

      scene.add(sealGroup);

      this.sealRendererInstance = renderer;
      this.sealMeshGroup = sealGroup;

      const modalEl = typeof document !== 'undefined' ? document.getElementById('seal-reward-modal') : null;

      const animateSeal = () => {
        if (!modalEl || !modalEl.classList.contains('active')) {
          this.sealAnimId = null;
          return;
        }
        sealGroup.rotation.y += 0.02;
        sealGroup.rotation.x = Math.sin(Date.now() * 0.002) * 0.15;
        renderer.render(scene, camera);
        this.sealAnimId = requestAnimationFrame(animateSeal);
      };

      animateSeal();
      return true;
    } catch (e) {
      console.warn('[ThreeScene] Failed to render 3D seal modal:', e);
      return false;
    }
  }

  // --- ANIMATION & RENDER TICK ---
  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    const delta = this.clock ? this.clock.getDelta() : 0.016;
    const time = this.clock ? this.clock.getElapsedTime() : Date.now() * 0.001;

    // 1. Lantern Wind Sway & Point Light Flicker
    if (this.lanterns && this.lanterns.length > 0) {
      this.lanterns.forEach((item) => {
        // Natural wind pendulum sway on Z and X
        const sway = Math.sin(time * item.swaySpeed + item.seed) * 0.075;
        item.group.rotation.z = sway;
        item.group.rotation.x = Math.cos(time * (item.swaySpeed * 0.7) + item.seed) * 0.035;

        // Subtle candle/flame flicker
        const flicker = (Math.sin(time * 12 + item.seed) + Math.cos(time * 24 + item.seed)) * 0.08;
        item.light.intensity = item.baseIntensity + flicker;
      });
    }

    // 2. Sakura Blossom Petal drift
    if (this.sakuraParticles) {
      const positions = this.sakuraParticles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 0] += 0.025; // drift right
        positions[i + 1] -= 0.018; // fall down
        // wrap around
        if (positions[i + 1] < -0.2) positions[i + 1] = 7.5;
        if (positions[i + 0] > 12) positions[i + 0] = -12;
      }
      this.sakuraParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Floating Dust Motes drift
    if (this.dustParticles) {
      const positions = this.dustParticles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time + i) * 0.003;
        positions[i + 0] += Math.cos(time * 0.5 + i) * 0.002;
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 4. Armory 3D Inspector Rotation & Render
    if (this.inspector.modal && this.inspector.modal.classList.contains('active')) {
      if (this.inspector.autoSpin && this.inspector.activeModel) {
        this.inspector.targetRotY += 0.012;
      }

      this.inspector.rotX += (this.inspector.targetRotX - this.inspector.rotX) * 0.1;
      this.inspector.rotY += (this.inspector.targetRotY - this.inspector.rotY) * 0.1;
      this.inspector.zoomDist += (this.inspector.targetZoomDist - this.inspector.zoomDist) * 0.1;

      if (this.inspector.activeModel) {
        this.inspector.activeModel.rotation.y = this.inspector.rotY;
        this.inspector.activeModel.rotation.x = this.inspector.rotX;
      }

      this.inspector.camera.position.set(0, 0, this.inspector.zoomDist);
      this.inspector.renderer.render(this.inspector.scene, this.inspector.camera);
    }

    // 5. Main 2.5D Background Render
    if (this.renderer && this.scene && this.camera && this.currentMode !== 'none') {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.sealAnimId) {
      cancelAnimationFrame(this.sealAnimId);
      this.sealAnimId = null;
    }
  }
}

// Global Singleton
if (typeof window !== 'undefined') {
  window.ThreeSceneManager = ThreeSceneManager;
  window.ThreeScene = new ThreeSceneManager();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ThreeSceneManager, ThreeScene: (typeof window !== 'undefined' && window.ThreeScene) ? window.ThreeScene : new ThreeSceneManager() };
}
