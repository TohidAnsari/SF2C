/**
 * Shadow Fight 2 Web Edition - Visual Novel Cinematic Engine
 * Manages narrative dialogue cutscenes, letterbox black bars, character portrait cards,
 * typewriter text animation, audio chimes, and smooth scene transitions.
 */

class CinematicsManager {
  constructor() {
    this.isActive = false;
    this.currentDialogue = null;
    this.lineIndex = 0;
    this.isTyping = false;
    this.typewriterTimer = null;
    this.typewriterInterval = 22; // 22ms per character
    this.onCompleteCallback = null;
    this.currentText = '';

    // Cached DOM elements
    this.overlay = null;
    this.barTop = null;
    this.barBottom = null;
    this.stage = null;
    this.dialogueBox = null;
    this.speakerBadge = null;
    this.dialogueText = null;
    this.promptEl = null;
    this.skipBtn = null;
    this.portraitLeft = null;
    this.portraitRight = null;
    this.portraitLeftName = null;
    this.portraitRightName = null;
    this.portraitLeftEye = null;
    this.portraitRightEye = null;

    this._initialized = false;
  }

  /**
   * Initializes or updates DOM element references and attaches interactive listeners.
   */
  init(customDoc) {
    const doc = customDoc || (typeof document !== 'undefined' ? document : null);
    if (!doc) return this;

    this.overlay = doc.getElementById('cinematic-overlay');
    this.barTop = doc.querySelector('.cinematic-bar-top');
    this.barBottom = doc.querySelector('.cinematic-bar-bottom');
    this.stage = doc.querySelector('.cinematic-stage');
    this.dialogueBox = doc.getElementById('cinematic-dialogue-box');
    this.speakerBadge = doc.getElementById('dialogue-speaker-badge');
    this.dialogueText = doc.getElementById('dialogue-text');
    this.promptEl = doc.querySelector('.cinematic-prompt');
    this.skipBtn = doc.getElementById('cinematic-skip-btn');

    this.portraitLeft = doc.getElementById('dialogue-portrait-left');
    this.portraitRight = doc.getElementById('dialogue-portrait-right');
    this.portraitLeftName = doc.getElementById('portrait-left-name');
    this.portraitRightName = doc.getElementById('portrait-right-name');

    if (this.portraitLeft) {
      this.portraitLeftEye = this.portraitLeft.querySelector('.portrait-eye');
    }
    if (this.portraitRight) {
      this.portraitRightEye = this.portraitRight.querySelector('.portrait-eye');
    }

    // Attach listeners only once
    if (!this._initialized && typeof doc.addEventListener === 'function') {
      // Advance on dialogue box click
      if (this.dialogueBox) {
        this.dialogueBox.addEventListener('click', (e) => {
          if (e.target && (e.target.id === 'cinematic-skip-btn' || (e.target.classList && e.target.classList.contains('cinematic-skip-btn')))) {
            return; // handled by skip button
          }
          this.advanceDialogue();
        });
      } else if (this.overlay) {
        this.overlay.addEventListener('click', (e) => {
          if (e.target && (e.target.id === 'cinematic-skip-btn' || (e.target.classList && e.target.classList.contains('cinematic-skip-btn')))) {
            return;
          }
          this.advanceDialogue();
        });
      }

      // Skip button listener
      if (this.skipBtn) {
        this.skipBtn.addEventListener('click', (e) => {
          if (e && e.stopPropagation) e.stopPropagation();
          this.skipDialogue();
        });
      }

      // Keyboard navigation
      const win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null);
      if (win && typeof win.addEventListener === 'function') {
        win.addEventListener('keydown', (e) => {
          if (!this.isActive) return;

          if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
            if (e.preventDefault) e.preventDefault();
            this.advanceDialogue();
          } else if (e.code === 'Escape') {
            if (e.preventDefault) e.preventDefault();
            this.skipDialogue();
          }
        });
      }

      this._initialized = true;
    }

    return this;
  }

  /**
   * Resolves dialogue key string or frame array against CONFIG.DIALOGUES.
   */
  resolveDialogue(input) {
    if (Array.isArray(input)) {
      return input.map(item => ({ ...item }));
    }
    if (typeof input === 'object' && input !== null) {
      if (input.text) return [{ ...input }];
      return null;
    }
    if (typeof input === 'string') {
      const cfg = (typeof CONFIG !== 'undefined' && CONFIG) ||
                  (typeof window !== 'undefined' && window.CONFIG) ||
                  (typeof global !== 'undefined' && global.CONFIG);
      const dialogues = cfg && cfg.DIALOGUES;
      if (!dialogues) return null;

      // 1. Direct key match: 'LYNX_PRE_FIGHT', 'LYNX_AWAKENING', 'LYNX_VICTORY'
      if (dialogues[input]) {
        const val = dialogues[input];
        return Array.isArray(val) ? val.map(f => ({ ...f })) : [{ ...val }];
      }

      // 2. Dot-notation: 'DISCIPLES.shin'
      if (input.includes('.')) {
        const parts = input.split('.');
        let curr = dialogues;
        for (const p of parts) {
          if (!curr) break;
          curr = curr[p];
        }
        if (curr) {
          return Array.isArray(curr) ? curr.map(f => ({ ...f })) : [{ ...curr }];
        }
      }

      // 3. Direct disciple lookup: 'shin', 'ken', 'brick', etc.
      if (dialogues.DISCIPLES && dialogues.DISCIPLES[input.toLowerCase()]) {
        return [{ ...dialogues.DISCIPLES[input.toLowerCase()] }];
      }
    }
    return null;
  }

  /**
   * Initiates visual novel cutscene dialogue.
   * @param {string|Array} dialogueKeyOrArray - Key in CONFIG.DIALOGUES or array of line objects.
   * @param {Function} [onComplete] - Callback executed when dialogue finishes or is skipped.
   */
  playDialogue(dialogueKeyOrArray, onComplete) {
    this.init();

    const frames = this.resolveDialogue(dialogueKeyOrArray);
    if (!frames || frames.length === 0) {
      if (typeof onComplete === 'function') onComplete();
      return false;
    }

    // If currently active, reset timer and cleanup
    if (this.isActive) {
      if (this.typewriterTimer) {
        clearInterval(this.typewriterTimer);
        this.typewriterTimer = null;
      }
    }

    this.isActive = true;
    this.currentDialogue = frames;
    this.lineIndex = 0;
    this.onCompleteCallback = onComplete || null;

    // Show overlay and slide in letterbox bars
    if (this.overlay && this.overlay.classList) {
      this.overlay.classList.add('active');
    }

    // Display first dialogue frame
    this.showLine(0);
    return true;
  }

  /**
   * Displays the dialogue line at the specified index.
   */
  showLine(index) {
    if (!this.currentDialogue || index >= this.currentDialogue.length) {
      this.closeDialogue();
      return;
    }

    this.lineIndex = index;
    const line = this.currentDialogue[index];

    // 1. Update Speaker Badge
    if (this.speakerBadge) {
      this.speakerBadge.textContent = line.title || line.speaker || '';
    }

    // 2. Determine Speaker Side
    const speakerUpper = (line.speaker || '').toUpperCase();
    const isHeroSide = speakerUpper === 'SHADOW' || speakerUpper === 'SENSEI';
    const side = (line.side || (isHeroSide ? 'left' : 'right')).toLowerCase();

    // 3. Update Left Portrait (Hero / Sensei)
    if (this.portraitLeft) {
      if (side === 'left') {
        if (this.portraitLeft.classList) {
          this.portraitLeft.classList.remove('speaker-dimmed');
          this.portraitLeft.classList.add('speaker-active');
        }
      } else {
        if (this.portraitLeft.classList) {
          this.portraitLeft.classList.remove('speaker-active');
          this.portraitLeft.classList.add('speaker-dimmed');
        }
      }

      if (this.portraitLeftName) {
        this.portraitLeftName.textContent = speakerUpper === 'SENSEI' ? 'SENSEI' : 'SHADOW';
      }
      if (this.portraitLeftEye && this.portraitLeftEye.classList) {
        this.portraitLeftEye.classList.remove('eye-red');
        this.portraitLeftEye.classList.add('eye-cyan');
      }
    }

    // 4. Update Right Portrait (Lynx / Disciples)
    if (this.portraitRight) {
      if (side === 'right') {
        if (this.portraitRight.classList) {
          this.portraitRight.classList.remove('speaker-dimmed');
          this.portraitRight.classList.add('speaker-active');
        }
      } else {
        if (this.portraitRight.classList) {
          this.portraitRight.classList.remove('speaker-active');
          this.portraitRight.classList.add('speaker-dimmed');
        }
      }

      if (this.portraitRightName) {
        const isDemon = line.portrait === 'lynx_demon' || line.title?.includes('DEMON');
        this.portraitRightName.textContent = isDemon ? 'DEMON LYNX' : (line.speaker || 'LYNX');
      }
      if (this.portraitRightEye && this.portraitRightEye.classList) {
        this.portraitRightEye.classList.remove('eye-cyan');
        this.portraitRightEye.classList.add('eye-red');
      }
    }

    // 5. Start Typewriter
    this.typeWriter(line.text || '');
  }

  /**
   * Types text character-by-character every 22ms with procedural audio chime tap.
   */
  typeWriter(text, onFinished) {
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }

    this.isTyping = true;
    this.currentText = text || '';

    if (this.dialogueText) {
      this.dialogueText.textContent = '';
    }

    let charIndex = 0;
    const len = this.currentText.length;

    // Immediate complete if empty string
    if (len === 0) {
      this.isTyping = false;
      if (typeof onFinished === 'function') onFinished();
      return;
    }

    const sound = (typeof Sound !== 'undefined' && Sound) ||
                  (typeof window !== 'undefined' && window.Sound) ||
                  (typeof global !== 'undefined' && global.Sound);

    this.typewriterTimer = setInterval(() => {
      charIndex++;
      if (this.dialogueText) {
        this.dialogueText.textContent = this.currentText.slice(0, charIndex);
      }

      // Procedural audio chime every 3 characters on non-space
      if (charIndex % 3 === 0 && sound && typeof sound.playDialogueChime === 'function') {
        try {
          sound.playDialogueChime();
        } catch (e) {
          // Non-critical audio error handling
        }
      }

      if (charIndex >= len) {
        clearInterval(this.typewriterTimer);
        this.typewriterTimer = null;
        this.isTyping = false;
        if (typeof onFinished === 'function') onFinished();
      }
    }, this.typewriterInterval);
  }

  /**
   * Advances dialogue:
   * - If currently typing: instantly completes current text.
   * - If typing finished: advances to next line (or completes sequence).
   */
  advanceDialogue() {
    if (!this.isActive) return;

    if (this.isTyping) {
      // Instantly finish typing current line
      if (this.typewriterTimer) {
        clearInterval(this.typewriterTimer);
        this.typewriterTimer = null;
      }
      this.isTyping = false;
      if (this.dialogueText) {
        this.dialogueText.textContent = this.currentText;
      }
      return;
    }

    // Advance to next frame
    this.showLine(this.lineIndex + 1);
  }

  /**
   * Immediately skips all remaining dialogue lines and completes the sequence.
   */
  skipDialogue() {
    if (!this.isActive) return;
    this.closeDialogue();
  }

  /**
   * Closes the dialogue overlay, retracts letterbox bars, and fires onComplete callback.
   */
  closeDialogue() {
    if (!this.isActive) return;

    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }

    this.isTyping = false;
    this.isActive = false;

    // Retract letterbox bars and hide overlay
    if (this.overlay && this.overlay.classList) {
      this.overlay.classList.remove('active');
    }

    // Reset portrait active states
    if (this.portraitLeft && this.portraitLeft.classList) {
      this.portraitLeft.classList.remove('speaker-active', 'speaker-dimmed');
    }
    if (this.portraitRight && this.portraitRight.classList) {
      this.portraitRight.classList.remove('speaker-active', 'speaker-dimmed');
    }

    if (this.dialogueText) {
      this.dialogueText.textContent = '';
    }

    const cb = this.onCompleteCallback;
    this.onCompleteCallback = null;
    this.currentDialogue = null;

    if (typeof cb === 'function') {
      cb();
    }
  }
}

// Global instance & export
const Cinematics = new CinematicsManager();

// Automatically initialize once DOM is loaded in browser
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Cinematics.init());
  } else {
    Cinematics.init();
  }
}

if (typeof window !== 'undefined') {
  window.Cinematics = Cinematics;
  window.CinematicsManager = CinematicsManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Cinematics;
  module.exports.Cinematics = Cinematics;
  module.exports.CinematicsManager = CinematicsManager;
}
