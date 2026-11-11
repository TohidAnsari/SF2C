const fs = require('fs');
const path = require('path');

// 1. Validate config.js syntax and structures
const configCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'config.js'), 'utf8');
const vm = require('vm');
const sandbox = { window: {} };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(configCode, sandbox);

const CONFIG = sandbox.CONFIG;
console.log('Testing CONFIG.AMULETS...');
if (!CONFIG.AMULETS) throw new Error('CONFIG.AMULETS missing!');
const amulets = ['FLAME_AMULET', 'DARK_AMULET', 'WIND_TALISMAN'];
amulets.forEach(key => {
  if (!CONFIG.AMULETS[key]) throw new Error(`Missing amulet ${key}`);
  console.log(`  ✓ ${key}: spellId = ${CONFIG.AMULETS[key].spellId}`);
});

console.log('Testing CONFIG.SPELLS...');
if (!CONFIG.SPELLS) throw new Error('CONFIG.SPELLS missing!');
const spells = ['FIREBALL', 'DARK_ERUPTION', 'SMOKE_TELEPORT'];
spells.forEach(key => {
  if (!CONFIG.SPELLS[key]) throw new Error(`Missing spell ${key}`);
  console.log(`  ✓ ${key}: dmg = ${CONFIG.SPELLS[key].damage}, lightColor = 0x${CONFIG.SPELLS[key].lightColor.toString(16)}`);
});

// 2. Validate audio.js syntax and methods
const audioCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'audio.js'), 'utf8');
const audioSandbox = { window: {} };
audioSandbox.window = audioSandbox;
vm.createContext(audioSandbox);
vm.runInContext(audioCode, audioSandbox);
const Sound = audioSandbox.Sound || audioSandbox.window.Sound;

['playSpellReady', 'playFireballIgnite', 'playDarkEruption', 'playSmokeTeleport'].forEach(method => {
  if (typeof Sound[method] !== 'function') throw new Error(`Sound.${method} is missing!`);
  console.log(`  ✓ Sound.${method} verified`);
});

console.log('Task 1 verified cleanly!');
