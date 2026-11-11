/**
 * Shadow Fight 2 Web Edition - Enhanced Input Controller
 * Features:
 * - 8-Way Directional Detection with Angular Quadrants & Visual Notches
 * - Pointer Event Support (Desktop Mouse & Mobile Touch Dragging)
 * - 8-Frame Action Input Buffering for Fluid Combos
 * - Dedicated Roll / Dodge (Space), Guard (Shift), and Pause (Esc)
 * - Full Gamepad API & Customizable Keyboard Mappings
 */

class InputController {
  constructor() {
    this.keys = {};
    this.keyPressTime = {};
    this.doubleTapWindow = 260; // ms for double-tap roll

    // 8-Frame Action Input Buffer Queue
    this.bufferQueue = [];
    this.bufferLifetime = 8; // frames (~130ms)

    this.virtualJoystick = {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      dirX: 0,
      dirY: 0,
      activeQuadrant: null // 'up', 'up-forward', 'forward', etc.
    };

    this.actionButtons = {
      punch: false,
      kick: false,
      ranged: false,
      roll: false,
      guard: false,
      magic: false
    };

    this.setupKeyboardListeners();
    this.setupPointerControls();
  }

  setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      const code = e.code.toLowerCase();
      const key = e.key.toLowerCase();

      // Audio init trigger
      if (window.Sound) window.Sound.init();

      // Pause toggle
      if (code === 'escape' || code === 'keyp') {
        if (window.Game) window.Game.togglePause();
        return;
      }

      if (!this.keys[code]) {
        const now = performance.now();
        const lastPress = this.keyPressTime[code] || 0;
        if (now - lastPress < this.doubleTapWindow) {
          this.keys[code + '_double'] = true;
        }
        this.keyPressTime[code] = now;

        // Push to Input Buffer
        if (code === 'keyj' || code === 'numpad1') this.pushBuffer('punch');
        if (code === 'keyk' || code === 'numpad2') this.pushBuffer('kick');
        if (code === 'keyl' || code === 'numpad3') this.pushBuffer('ranged');
        if (code === 'keyu' || code === 'numpad4') this.pushBuffer('magic');
        if (code === 'space') this.pushBuffer('roll');
      }

      this.keys[code] = true;
      this.keys[key] = true;

      // Prevent window scrolling on fighting keys
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space'].includes(key)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code.toLowerCase();
      const key = e.key.toLowerCase();
      this.keys[code] = false;
      this.keys[key] = false;
      this.keys[code + '_double'] = false;
    });
  }

  setupPointerControls() {
    const stickZone = document.getElementById('touch-stick-zone');
    const stickNub = document.getElementById('touch-stick-nub');

    if (stickZone && stickNub) {
      const onPointerDown = (e) => {
        stickZone.setPointerCapture(e.pointerId);
        this.virtualJoystick.active = true;
        this.virtualJoystick.pointerId = e.pointerId;
        const rect = stickZone.getBoundingClientRect();
        this.virtualJoystick.startX = rect.left + rect.width / 2;
        this.virtualJoystick.startY = rect.top + rect.height / 2;
        this.updateJoystickPosition(e.clientX, e.clientY, stickNub);
      };

      const onPointerMove = (e) => {
        if (!this.virtualJoystick.active || e.pointerId !== this.virtualJoystick.pointerId) return;
        this.updateJoystickPosition(e.clientX, e.clientY, stickNub);
      };

      const onPointerUp = (e) => {
        if (e.pointerId !== this.virtualJoystick.pointerId) return;
        this.resetJoystick(stickNub);
      };

      stickZone.addEventListener('pointerdown', onPointerDown);
      stickZone.addEventListener('pointermove', onPointerMove);
      stickZone.addEventListener('pointerup', onPointerUp);
      stickZone.addEventListener('pointercancel', onPointerUp);
    }

    // Action buttons pointer bindings
    const bindAction = (id, action) => {
      const el = document.getElementById(id);
      if (!el) return;

      const triggerDown = (e) => {
        e.preventDefault();
        el.classList.add('pressed');
        this.actionButtons[action] = true;
        this.pushBuffer(action);
        if (window.Sound) window.Sound.init();
      };

      const triggerUp = (e) => {
        e.preventDefault();
        el.classList.remove('pressed');
        this.actionButtons[action] = false;
      };

      el.addEventListener('pointerdown', triggerDown);
      el.addEventListener('pointerup', triggerUp);
      el.addEventListener('pointercancel', triggerUp);
      el.addEventListener('pointerleave', triggerUp);
    };

    bindAction('btn-punch', 'punch');
    bindAction('btn-kick', 'kick');
    bindAction('btn-ranged', 'ranged');
    bindAction('btn-magic', 'magic');
    bindAction('btn-roll', 'roll');
    bindAction('btn-guard', 'guard');
  }

  updateJoystickPosition(clientX, clientY, stickNub) {
    const dx = clientX - this.virtualJoystick.startX;
    const dy = clientY - this.virtualJoystick.startY;
    const maxRadius = 46;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const clampedDist = Math.min(maxRadius, dist);
    const angle = Math.atan2(dy, dx);

    const nx = Math.cos(angle) * clampedDist;
    const ny = Math.sin(angle) * clampedDist;

    stickNub.style.transform = `translate(${nx}px, ${ny}px)`;

    if (dist > 14) {
      this.virtualJoystick.dirX = Math.cos(angle);
      this.virtualJoystick.dirY = Math.sin(angle);
      this.updateDirectionalCompass(angle);
    } else {
      this.virtualJoystick.dirX = 0;
      this.virtualJoystick.dirY = 0;
      this.clearCompass();
    }
  }

  resetJoystick(stickNub) {
    this.virtualJoystick.active = false;
    this.virtualJoystick.pointerId = null;
    this.virtualJoystick.dirX = 0;
    this.virtualJoystick.dirY = 0;
    stickNub.style.transform = `translate(0px, 0px)`;
    this.clearCompass();
  }

  updateDirectionalCompass(angle) {
    // 8 quadrants (-PI to PI)
    // -PI/2 is UP, 0 is RIGHT, PI/2 is DOWN, PI is LEFT
    const deg = (angle * 180) / Math.PI;
    let dir = '';

    if (deg >= -67.5 && deg < -22.5) dir = 'dir-ur'; // Up-Right
    else if (deg >= -22.5 && deg < 22.5) dir = 'dir-r'; // Right
    else if (deg >= 22.5 && deg < 67.5) dir = 'dir-dr'; // Down-Right
    else if (deg >= 67.5 && deg < 112.5) dir = 'dir-d'; // Down
    else if (deg >= 112.5 && deg < 157.5) dir = 'dir-dl'; // Down-Left
    else if (deg >= 157.5 || deg < -157.5) dir = 'dir-l'; // Left
    else if (deg >= -157.5 && deg < -112.5) dir = 'dir-ul'; // Up-Left
    else if (deg >= -112.5 && deg < -67.5) dir = 'dir-u'; // Up

    this.virtualJoystick.activeQuadrant = dir;

    // Highlight on-screen directional indicators
    document.querySelectorAll('.stick-notch').forEach(el => el.classList.remove('active'));
    const activeEl = document.getElementById(dir);
    if (activeEl) activeEl.classList.add('active');
  }

  clearCompass() {
    this.virtualJoystick.activeQuadrant = null;
    document.querySelectorAll('.stick-notch').forEach(el => el.classList.remove('active'));
  }

  // Action Buffer
  pushBuffer(action) {
    this.bufferQueue.push({ action, lifetime: this.bufferLifetime });
  }

  consumeBuffer(action) {
    const idx = this.bufferQueue.findIndex(item => item.action === action);
    if (idx !== -1) {
      this.bufferQueue.splice(idx, 1);
      return true;
    }
    return false;
  }

  updateBuffer() {
    for (let i = this.bufferQueue.length - 1; i >= 0; i--) {
      this.bufferQueue[i].lifetime--;
      if (this.bufferQueue[i].lifetime <= 0) {
        this.bufferQueue.splice(i, 1);
      }
    }
  }

  // Poll input state for Player 1
  getPlayer1Input(facing) {
    this.updateBuffer();

    // Check Gamepad
    let gpAxesX = 0;
    let gpAxesY = 0;
    let gpPunch = false;
    let gpKick = false;
    let gpRanged = false;
    let gpRoll = false;
    let gpGuard = false;

    if (navigator.getGamepads) {
      const gamepads = navigator.getGamepads();
      if (gamepads && gamepads[0]) {
        const gp = gamepads[0];
        if (Math.abs(gp.axes[0]) > 0.25) gpAxesX = gp.axes[0];
        if (Math.abs(gp.axes[1]) > 0.25) gpAxesY = gp.axes[1];
        gpPunch = gp.buttons[2] && gp.buttons[2].pressed;  // X / Square
        gpKick = gp.buttons[0] && gp.buttons[0].pressed;   // A / Cross
        gpRanged = gp.buttons[1] && gp.buttons[1].pressed; // B / Circle
        gpRoll = gp.buttons[5] && gp.buttons[5].pressed;   // R1 / RB
        gpGuard = gp.buttons[4] && gp.buttons[4].pressed;  // L1 / LB
      }
    }

    const up = this.keys['keyw'] || this.keys['arrowup'] || gpAxesY < -0.45 || this.virtualJoystick.dirY < -0.45;
    const down = this.keys['keys'] || this.keys['arrowdown'] || gpAxesY > 0.45 || this.virtualJoystick.dirY > 0.45;
    const left = this.keys['keya'] || this.keys['arrowleft'] || gpAxesX < -0.45 || this.virtualJoystick.dirX < -0.45;
    const right = this.keys['keyd'] || this.keys['arrowright'] || gpAxesX > 0.45 || this.virtualJoystick.dirX > 0.45;

    const punch = this.consumeKey('keyj') || this.consumeKey('numpad1') || gpPunch || this.consumeBuffer('punch');
    const kick = this.consumeKey('keyk') || this.consumeKey('numpad2') || gpKick || this.consumeBuffer('kick');
    const ranged = this.consumeKey('keyl') || this.consumeKey('numpad3') || gpRanged || this.consumeBuffer('ranged');
    const magic = this.consumeKey('keyu') || this.consumeKey('numpad4') || this.consumeBuffer('magic') || this.actionButtons.magic;
    const roll = this.consumeKey('space') || gpRoll || this.consumeBuffer('roll');
    const manualGuard = this.keys['shiftleft'] || this.keys['shiftright'] || gpGuard || this.actionButtons.guard;

    const forward = (facing === 1 && right) || (facing === -1 && left);
    const back = (facing === 1 && left) || (facing === -1 && right);

    const doubleForward = (facing === 1 && this.consumeKey('keyd_double')) ||
                          (facing === -1 && this.consumeKey('keya_double'));
    const doubleBack = (facing === 1 && this.consumeKey('keya_double')) ||
                       (facing === -1 && this.consumeKey('keyd_double'));

    return {
      up,
      down,
      left,
      right,
      forward,
      back,
      punch,
      kick,
      ranged,
      magic,
      roll,
      manualGuard,
      doubleForward,
      doubleBack
    };
  }

  // Poll input state for Player 2 (Local PvP)
  getPlayer2Input(facing) {
    const up = this.keys['arrowup'] || this.keys['numpad8'];
    const down = this.keys['arrowdown'] || this.keys['numpad5'] || this.keys['numpad2'];
    const left = this.keys['arrowleft'] || this.keys['numpad4'];
    const right = this.keys['arrowright'] || this.keys['numpad6'];

    const punch = this.consumeKey('numpad1') || this.consumeKey('period');
    const kick = this.consumeKey('numpad2') || this.consumeKey('slash');
    const ranged = this.consumeKey('numpad3') || this.consumeKey('quote');
    const magic = this.consumeKey('numpad7') || this.consumeKey('semicolon');
    const roll = this.consumeKey('numpad0') || this.consumeKey('enter');
    const manualGuard = this.keys['controlright'] || this.keys['numpadplus'];

    const forward = (facing === 1 && right) || (facing === -1 && left);
    const back = (facing === 1 && left) || (facing === -1 && right);

    const doubleForward = (facing === 1 && this.consumeKey('arrowright_double')) ||
                          (facing === -1 && this.consumeKey('arrowleft_double'));
    const doubleBack = (facing === 1 && this.consumeKey('arrowleft_double')) ||
                       (facing === -1 && this.consumeKey('arrowright_double'));

    return {
      up,
      down,
      left,
      right,
      forward,
      back,
      punch,
      kick,
      ranged,
      magic,
      roll,
      manualGuard,
      doubleForward,
      doubleBack
    };
  }

  consumeKey(code) {
    if (this.keys[code]) {
      this.keys[code] = false;
      return true;
    }
    return false;
  }
}

const Input = new InputController();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Input;
} else {
  window.Input = Input;
}
