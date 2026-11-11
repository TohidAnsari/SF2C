const assert = require('assert');
const CONFIG = require('../js/config.js');
global.CONFIG = CONFIG;
global.window = { CONFIG: CONFIG };

const Fighter = require('../js/fighter.js');
const Skeleton = require('../js/skeleton.js');
global.window.Fighter = Fighter;
global.window.Skeleton = Skeleton;

console.log('=== Running Leg Kinematics & Shuriken Bug Regression Tests ===\n');

// Mock scene renderer
const mockScene = {
  addTrauma: () => {},
  triggerScreenFlash: () => {},
  spawnShockwave: () => {},
  spawnSparks: () => {},
  spawnDust: () => {},
  ctx: {
    save: () => {},
    restore: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    arc: () => {},
    ellipse: () => {},
    fill: () => {},
    stroke: () => {}
  }
};

// ==========================================
// TEST SUITE 1: Shuriken Head Drop Bug Test
// ==========================================
console.log('--- Test Suite 1: Shuriken Throwing Kinetics & Head Position Stability ---');

const shadow = new Fighter(300, {
  name: 'SHADOW',
  weapon: 'KATANA',
  armor: 'ROBE',
  helm: 'HEADBAND',
  facing: 1
});
const dummy = new Fighter(600, { name: 'DUMMY', hp: 200, facing: -1 });

// Ensure pose state initialized
Skeleton.ensureFighterPoseState(shadow);
assert(shadow.poseState, 'Pose state must be initialized');

const initialHeadY = shadow.poseState.head.y;
console.log(`Initial Idle Head Y: ${initialHeadY} (should be around -104)`);
assert(initialHeadY < -80, `Initial Head Y must be upright (< -80), got ${initialHeadY}`);

// Trigger SHURIKEN move
shadow.triggerMove('SHURIKEN');
assert.strictEqual(shadow.state, 'ATTACKING');
assert.strictEqual(shadow.currentMove.id, 'SHURIKEN');

// Simulate each frame of the 24-frame throw animation
for (let f = 0; f <= 30; f++) {
  // Update kinematics & interpolation
  const targetPose = Skeleton.calculateTargetPose(shadow);
  const pose = Skeleton.interpolatePose(shadow, targetPose);

  // Assert NO NaNs anywhere in pose
  assert(!isNaN(pose.head.x), `Frame ${f}: pose.head.x must not be NaN!`);
  assert(!isNaN(pose.head.y), `Frame ${f}: pose.head.y must not be NaN!`);
  assert(!isNaN(pose.hip.x), `Frame ${f}: pose.hip.x must not be NaN!`);
  assert(!isNaN(pose.hip.y), `Frame ${f}: pose.hip.y must not be NaN!`);
  assert(!isNaN(pose.spineTilt), `Frame ${f}: pose.spineTilt must not be NaN!`);
  assert(!isNaN(pose.frontHand.x), `Frame ${f}: pose.frontHand.x must not be NaN!`);
  assert(!isNaN(pose.frontHand.y), `Frame ${f}: pose.frontHand.y must not be NaN!`);

  // Assert Head is NEVER dropped near the ground (y = 0)
  assert(pose.head.y < -70, `Frame ${f}: Head dropped to ${pose.head.y}! Must remain upright (< -70)`);

  // Advance fighter attacking state
  shadow.handleAttackingState(dummy, mockScene);
}

console.log('✓ Shuriken throw completed without dropping head (Head Y remained < -70 throughout)');

// Now verify post-throw IDLE pose
assert.strictEqual(shadow.state, 'IDLE', 'Fighter must return to IDLE after throw');
for (let f = 0; f < 10; f++) {
  const target = Skeleton.calculateTargetPose(shadow);
  const pose = Skeleton.interpolatePose(shadow, target);
  assert(!isNaN(pose.head.y), 'Post-throw head.y must not be NaN');
  assert(pose.head.y < -85, `Post-throw head.y must return to ~-104, got ${pose.head.y}`);
}
console.log(`✓ Post-throw idle head position: ${shadow.poseState.head.y} (properly upright)`);

// ==========================================
// TEST SUITE 2: Leg Kinematics & Knee Flexion Direction
// ==========================================
console.log('\n--- Test Suite 2: Leg Kinematics & Forward Knee Bend ---');

const testFighter = new Fighter(400, {
  name: 'SHADOW',
  facing: 1,
  visuals: { stance: 'karate' }
});

const pose = Skeleton.calculateTargetPose(testFighter);
const hip = pose.hip;
const frontFoot = pose.frontFoot;
const backFoot = pose.backFoot;

console.log(`Hip: (${hip.x.toFixed(1)}, ${hip.y.toFixed(1)})`);
console.log(`Front Foot: (${frontFoot.x.toFixed(1)}, ${frontFoot.y.toFixed(1)})`);
console.log(`Back Foot: (${backFoot.x.toFixed(1)}, ${backFoot.y.toFixed(1)})`);

// Verify hip height is at least 45px above ground (sleek 50/50 proportion, not squatting at -38)
assert(hip.y <= -46, `Hip Y must be tall and sleek (<= -46), got ${hip.y}`);

// Compute knees using the exact IK math from drawAnatomicalLeg
function computeKnee(hip, foot) {
  const thighLen = 30;
  const shinLen = 30;
  const dx = foot.x - hip.x;
  const dy = foot.y - hip.y;
  const dist = Math.min(thighLen + shinLen - 0.5, Math.max(12, Math.sqrt(dx * dx + dy * dy)));
  const baseAngle = Math.atan2(dy, dx);
  const cosAngle = (thighLen * thighLen + dist * dist - shinLen * shinLen) / (2 * thighLen * dist);
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));
  const kneeAngleOffset = -Math.acos(clampedCos); // Forward flex

  return {
    x: hip.x + Math.cos(baseAngle + kneeAngleOffset) * thighLen,
    y: hip.y + Math.sin(baseAngle + kneeAngleOffset) * thighLen
  };
}

const frontKnee = computeKnee(hip, frontFoot);
const backKnee = computeKnee(hip, backFoot);

console.log(`Front Knee: (${frontKnee.x.toFixed(1)}, ${frontKnee.y.toFixed(1)})`);
console.log(`Back Knee: (${backKnee.x.toFixed(1)}, ${backKnee.y.toFixed(1)})`);

// In forward facing silhouette (facing = 1), knees MUST flex forward (greater or equal X than hip)
assert(frontKnee.x >= hip.x, `Front knee must flex forward (x >= ${hip.x}), got ${frontKnee.x}`);
assert(backKnee.x >= hip.x - 2, `Back knee must not be hyper-extended backwards, got ${backKnee.x}`);
assert(frontKnee.y > hip.y && frontKnee.y < frontFoot.y, 'Front knee Y must be between hip and foot');
assert(backKnee.y > hip.y && backKnee.y < backFoot.y, 'Back knee Y must be between hip and foot');

console.log('✓ Both knees naturally flex forward in fighting direction (no backward bird knees)');

// Verify Lynx predator stance
const lynxFighter = new Fighter(500, {
  name: 'LYNX',
  facing: 1,
  isBoss: true,
  visuals: { stance: 'predator' }
});
const lynxPose = Skeleton.calculateTargetPose(lynxFighter);
const lynxKnee = computeKnee(lynxPose.hip, lynxPose.frontFoot);
assert(lynxKnee.x >= lynxPose.hip.x, `Lynx knee must flex forward, got ${lynxKnee.x} vs hip ${lynxPose.hip.x}`);
console.log('✓ Lynx predator stance maintains correct athletic forward knee flexion');

console.log('\n======================================================');
console.log('🎉 ALL LEG KINEMATICS & SHURIKEN BUG TESTS PASSED (100%)');
console.log('======================================================\n');

