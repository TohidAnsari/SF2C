/**
 * Shadow Fight 2 Web Edition - Tournament & Act Ladder Manager
 * Manages opponent progression, stage unlocks, gold rewards, and pre-fight dialogue.
 */

class TournamentManager {
  constructor() {
    this.currentStageIndex = 0;
    this.completedStages = [];
    this.loadProgress();
  }

  loadProgress() {
    try {
      const data = localStorage.getItem('sf2_tournament_v1');
      if (data) {
        const parsed = JSON.parse(data);
        this.currentStageIndex = parsed.currentStageIndex || 0;
        this.completedStages = parsed.completedStages || [];
      }
    } catch (e) {
      console.warn('Could not load tournament progress');
    }
  }

  saveProgress() {
    try {
      localStorage.setItem('sf2_tournament_v1', JSON.stringify({
        currentStageIndex: this.currentStageIndex,
        completedStages: this.completedStages
      }));
    } catch (e) {
      // Ignore
    }
  }

  getCurrentOpponent() {
    return window.CONFIG.OPPONENTS[this.currentStageIndex] || window.CONFIG.OPPONENTS[0];
  }

  completeCurrentStage() {
    if (!this.completedStages.includes(this.currentStageIndex)) {
      this.completedStages.push(this.currentStageIndex);
    }

    const reward = (this.currentStageIndex + 1) * 150;
    window.Armory.addCoins(reward);

    if (this.currentStageIndex < window.CONFIG.OPPONENTS.length - 1) {
      this.currentStageIndex++;
    }

    this.saveProgress();
    return reward;
  }

  renderTournamentMap() {
    const listEl = document.getElementById('tournament-list');
    if (!listEl) return;

    let html = '';
    if (this.completedStages.includes(5)) {
      html += '<div class="act-conquered-banner">🏆 ACT I CONQUERED • GATES OF SHADOWS UNLOCKED</div>';
    }

    const opponents = (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.OPPONENTS) ||
                      (typeof CONFIG !== 'undefined' && CONFIG.OPPONENTS) || [];
    const amulets = (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.AMULETS) ||
                    (typeof CONFIG !== 'undefined' && CONFIG.AMULETS) || {};

    opponents.forEach((opp, idx) => {
      const isCompleted = this.completedStages.includes(idx);
      const isCurrent = this.currentStageIndex === idx;
      const isLocked = idx > this.currentStageIndex;
      const amu = opp.amulet && amulets ? amulets[opp.amulet] : null;
      const amuBadge = amu ? `<span class="stage-amulet-badge" title="Equipped Jutsu: ${amu.bonusText}">${amu.icon} ${amu.name}</span>` : '';

      html += `
        <div class="tournament-stage-card ${isCurrent ? 'active-stage' : ''} ${isLocked ? 'locked' : ''} ${isCompleted ? 'cleared' : ''}"
             onclick="${!isLocked ? `Game.startTournamentFight(${idx})` : ''}">
          <div class="stage-avatar">${opp.avatar}</div>
          <div class="stage-info">
            <div class="stage-title">${opp.name} ${opp.isBoss ? '👑 (DEMON BOSS)' : ''} ${amuBadge}</div>
            <div class="stage-sub">${opp.title}</div>
            <div class="stage-quote">"${opp.quote}"</div>
          </div>
          <div class="stage-status">
            ${isCompleted ? '⭐ CLEARED' : isCurrent ? '⚔️ CHALLENGE' : '🔒 LOCKED'}
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;
  }
}

const Tournament = new TournamentManager();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Tournament;
}
if (typeof window !== 'undefined') {
  window.Tournament = Tournament;
}

