/**
 * Shadow Fight 2 Web Edition - Armory & Player Profile Manager
 * Handles player currency (Gold & Rubies), Energy, Level & EXP progression,
 * equipment purchase, upgrades, and local persistence.
 */

class ArmoryManager {
  constructor() {
    this.coins = 200;
    this.gems = 15;
    this.energy = 5;
    this.maxEnergy = 5;
    this.level = 1;
    this.exp = 350;
    this.maxExp = 500;
    this.danTitle = 'NOVICE';

    this.equipped = {
      weapon: 'FISTS',
      armor: 'ROBE',
      helm: 'HEADBAND',
      amulet: 'FLAME_AMULET'
    };
    this.owned = {
      weapons: ['FISTS'],
      armors: ['ROBE'],
      helms: ['HEADBAND'],
      amulets: ['FLAME_AMULET']
    };

    this.loadSave();
  }

  loadSave() {
    try {
      const data = localStorage.getItem('sf2_save_v2');
      if (data) {
        const parsed = JSON.parse(data);
        this.coins = parsed.coins ?? 200;
        this.gems = parsed.gems ?? 15;
        this.energy = parsed.energy ?? 5;
        this.level = parsed.level ?? 1;
        this.exp = parsed.exp ?? 350;
        this.maxExp = parsed.maxExp ?? 500;
        this.danTitle = parsed.danTitle ?? 'NOVICE';
        this.equipped = parsed.equipped || this.equipped;
        this.owned = parsed.owned || this.owned;
        if (!this.equipped.amulet) this.equipped.amulet = 'FLAME_AMULET';
        if (!this.owned.amulets) this.owned.amulets = ['FLAME_AMULET'];
      }
    } catch (e) {
      console.warn('Could not load local save, using defaults');
    }
  }

  save() {
    try {
      localStorage.setItem('sf2_save_v2', JSON.stringify({
        coins: this.coins,
        gems: this.gems,
        energy: this.energy,
        level: this.level,
        exp: this.exp,
        maxExp: this.maxExp,
        danTitle: this.danTitle,
        equipped: this.equipped,
        owned: this.owned
      }));
    } catch (e) {
      // Ignore
    }
  }

  addCoins(amount) {
    this.coins += amount;
    this.addExp(Math.round(amount * 0.75));
    this.save();
    this.updateUI();
  }

  addGems(amount) {
    this.gems += amount;
    this.save();
    this.updateUI();
  }

  addExp(amount) {
    this.exp += amount;
    if (this.exp >= this.maxExp) {
      this.level++;
      this.exp -= this.maxExp;
      this.maxExp = Math.round(this.maxExp * 1.4);
      this.danTitle = this.level === 2 ? 'DISCIPLE' : this.level === 3 ? 'WARRIOR' : 'MASTER';
      this.gems += 5; // Level up reward!
      if (window.Sound) window.Sound.playGong();
    }
    this.save();
  }

  consumeEnergy() {
    if (this.energy > 0) {
      this.energy--;
      this.save();
      this.updateUI();
      return true;
    }
    return false;
  }

  buyWeapon(weaponId) {
    const wpn = window.CONFIG.WEAPONS[weaponId];
    if (!wpn || this.owned.weapons.includes(weaponId)) return false;
    if (this.coins < wpn.cost) return false;

    this.coins -= wpn.cost;
    this.owned.weapons.push(weaponId);
    this.equipped.weapon = weaponId;
    this.save();
    this.updateUI();
    if (window.Dojo) window.Dojo.resetLobbyFighter();
    if (window.Sound) window.Sound.playBladeSlash();
    return true;
  }

  equipWeapon(weaponId) {
    if (this.owned.weapons.includes(weaponId)) {
      this.equipped.weapon = weaponId;
      this.save();
      this.updateUI();
      if (window.Dojo) window.Dojo.resetLobbyFighter();
      if (window.Sound) window.Sound.playBladeSlash();
    }
  }

  buyArmor(armorId) {
    const arm = window.CONFIG.ARMORS[armorId];
    if (!arm || this.owned.armors.includes(armorId)) return false;
    if (this.coins < arm.cost) return false;

    this.coins -= arm.cost;
    this.owned.armors.push(armorId);
    this.equipped.armor = armorId;
    this.save();
    this.updateUI();
    if (window.Dojo) window.Dojo.resetLobbyFighter();
    return true;
  }

  equipArmor(armorId) {
    if (this.owned.armors.includes(armorId)) {
      this.equipped.armor = armorId;
      this.save();
      this.updateUI();
      if (window.Dojo) window.Dojo.resetLobbyFighter();
    }
  }

  buyHelm(helmId) {
    const hlm = window.CONFIG.HELMS[helmId];
    if (!hlm || this.owned.helms.includes(helmId)) return false;
    if (this.coins < hlm.cost) return false;

    this.coins -= hlm.cost;
    this.owned.helms.push(helmId);
    this.equipped.helm = helmId;
    this.save();
    this.updateUI();
    if (window.Dojo) window.Dojo.resetLobbyFighter();
    return true;
  }

  equipHelm(helmId) {
    if (this.owned.helms.includes(helmId)) {
      this.equipped.helm = helmId;
      this.save();
      this.updateUI();
      if (window.Dojo) window.Dojo.resetLobbyFighter();
    }
  }

  buyAmulet(amuletId) {
    const amu = window.CONFIG.AMULETS ? window.CONFIG.AMULETS[amuletId] : null;
    if (!amu || (this.owned.amulets && this.owned.amulets.includes(amuletId))) return false;
    if (this.coins < amu.cost) return false;

    this.coins -= amu.cost;
    if (!this.owned.amulets) this.owned.amulets = ['FLAME_AMULET'];
    this.owned.amulets.push(amuletId);
    this.equipped.amulet = amuletId;
    this.save();
    this.updateUI();
    if (window.Dojo && window.Dojo.lobbyFighter) {
      window.Dojo.lobbyFighter.amulet = amuletId;
    }
    if (window.Game && window.Game.player) {
      window.Game.player.amulet = amuletId;
    }
    if (window.Sound && window.Sound.playSpellReady) window.Sound.playSpellReady();
    return true;
  }

  equipAmulet(amuletId) {
    if (this.owned.amulets && this.owned.amulets.includes(amuletId)) {
      this.equipped.amulet = amuletId;
      this.save();
      this.updateUI();
      if (window.Dojo && window.Dojo.lobbyFighter) {
        window.Dojo.lobbyFighter.amulet = amuletId;
      }
      if (window.Game && window.Game.player) {
        window.Game.player.amulet = amuletId;
      }
      if (window.Sound && window.Sound.playSpellReady) window.Sound.playSpellReady();
    }
  }

  equip(category, id) {
    if (category === 'weapon') this.equipWeapon(id);
    else if (category === 'armor') this.equipArmor(id);
    else if (category === 'helm' || category === 'helmet') this.equipHelm(id);
    else if (category === 'amulet') this.equipAmulet(id);
  }

  inspectItem(category, id) {
    let item = null;
    if (category === 'weapon') {
      const w = window.CONFIG.WEAPONS[id];
      if (w) item = { id: w.id, name: w.name, category: 'WEAPON', dmg: w.damage, weight: w.weight || 1.4, tier: 1 };
    } else if (category === 'armor') {
      const a = window.CONFIG.ARMORS[id];
      if (a) item = { id: a.id, name: a.name, category: 'ARMOR', def: a.defense, weight: a.weight || 2.5, tier: 1 };
    } else if (category === 'helm') {
      const h = window.CONFIG.HELMS[id];
      if (h) item = { id: h.id, name: h.name, category: 'HELMET', def: h.defense, weight: 1.0, tier: 1 };
    } else if (category === 'amulet') {
      const amu = window.CONFIG.AMULETS ? window.CONFIG.AMULETS[id] : null;
      if (amu) item = { id: amu.id, name: amu.name, category: 'AMULET', dmg: amu.bonusText || '+JUTSU', def: 0, weight: 0.2, tier: 1 };
    }

    if (item && window.ThreeScene) {
      window.ThreeScene.openInspector(item);
    }
  }

  updateUI() {
    // 1. Top Bar Currency & Profile Badges
    const coinEl = document.getElementById('currency-coins');
    const gemsEl = document.getElementById('currency-gems');
    const energyEl = document.getElementById('currency-energy');
    const lvlEl = document.getElementById('profile-lvl-num');
    const titleEl = document.getElementById('profile-dan-title');
    const expFill = document.getElementById('profile-exp-fill');

    if (coinEl) coinEl.textContent = this.coins;
    if (gemsEl) gemsEl.textContent = this.gems;
    if (energyEl) energyEl.textContent = `${this.energy}/${this.maxEnergy}`;
    if (lvlEl) lvlEl.textContent = this.level;
    if (titleEl) titleEl.textContent = this.danTitle;
    if (expFill) expFill.style.width = `${Math.min(100, (this.exp / this.maxExp) * 100)}%`;

    // 2. Armory Cards
    const container = document.getElementById('armory-cards-container');
    if (!container) return;

    let html = '';
    // Weapons
    html += '<h3 class="armory-section-title">⚔️ Ninja Weapons</h3><div class="armory-grid">';
    Object.values(window.CONFIG.WEAPONS).forEach(w => {
      const isOwned = this.owned.weapons.includes(w.id);
      const isEquipped = this.equipped.weapon === w.id;
      const critPct = Math.round(w.critChance * 100);

      html += `
        <div class="armory-card ${isEquipped ? 'equipped' : ''}">
          <div class="card-icon" onclick="Armory.inspectItem('weapon', '${w.id}')" title="Click to Inspect in 3D" style="cursor:pointer;">${w.icon}</div>
          <div class="card-title" onclick="Armory.inspectItem('weapon', '${w.id}')" style="cursor:pointer;">${w.name} ${w.dual ? '<span style="font-size:11px;color:#f39c12;">(DUAL)</span>' : ''}</div>
          <div class="card-stats">DMG: <b>${w.damage}</b> | RNG: <b>${w.range}</b> | MASS: <b>${w.weight || 1.4}kg</b></div>
          <div class="card-desc">${w.desc}</div>
          <div class="card-action">
            <button class="btn-inspect-3d" onclick="Armory.inspectItem('weapon', '${w.id}')" title="Inspect 3D Model">🔍 3D</button>
            ${isEquipped ? '<button class="btn-equipped" disabled>EQUIPPED</button>' :
              isOwned ? `<button class="btn-equip" onclick="Armory.equipWeapon('${w.id}')">EQUIP</button>` :
              `<button class="btn-buy" onclick="Armory.buyWeapon('${w.id}')">BUY 💰${w.cost}</button>`}
          </div>
        </div>
      `;
    });
    html += '</div>';

    // Body Armor
    html += '<h3 class="armory-section-title">🥋 Body Armor & Cuirass</h3><div class="armory-grid">';
    Object.values(window.CONFIG.ARMORS).forEach(a => {
      const isOwned = this.owned.armors.includes(a.id);
      const isEquipped = this.equipped.armor === a.id;
      const weightDesc = a.weight < 1.0 ? 'Light / Swift' : a.weight === 1.0 ? 'Balanced' : 'Heavy / Sturdy';

      html += `
        <div class="armory-card ${isEquipped ? 'equipped' : ''}">
          <div class="card-icon" onclick="Armory.inspectItem('armor', '${a.id}')" style="cursor:pointer;">🥋</div>
          <div class="card-title" onclick="Armory.inspectItem('armor', '${a.id}')" style="cursor:pointer;">${a.name}</div>
          <div class="card-stats">DEF: <b>${a.defense}</b> | WEIGHT: <b>${weightDesc}</b></div>
          <div class="card-desc">${a.desc}</div>
          <div class="card-action">
            <button class="btn-inspect-3d" onclick="Armory.inspectItem('armor', '${a.id}')" title="Inspect in 3D">🔍 3D</button>
            ${isEquipped ? '<button class="btn-equipped" disabled>EQUIPPED</button>' :
              isOwned ? `<button class="btn-equip" onclick="Armory.equipArmor('${a.id}')">EQUIP</button>` :
              `<button class="btn-buy" onclick="Armory.buyArmor('${a.id}')">BUY 💰${a.cost}</button>`}
          </div>
        </div>
      `;
    });
    html += '</div>';

    // Helmets & Masks
    html += '<h3 class="armory-section-title">🎭 Helmets & Masks</h3><div class="armory-grid">';
    Object.values(window.CONFIG.HELMS).forEach(h => {
      const isOwned = this.owned.helms.includes(h.id);
      const isEquipped = this.equipped.helm === h.id;
      const icon = h.id === 'HEADBAND' ? '🥷' : h.id === 'IRON_MASK' ? '🎭' : '⛑️';

      html += `
        <div class="armory-card ${isEquipped ? 'equipped' : ''}">
          <div class="card-icon" onclick="Armory.inspectItem('helm', '${h.id}')" style="cursor:pointer;">${icon}</div>
          <div class="card-title" onclick="Armory.inspectItem('helm', '${h.id}')" style="cursor:pointer;">${h.name}</div>
          <div class="card-stats">HEAD DEF: <b>+${h.defense}</b></div>
          <div class="card-desc">${h.desc}</div>
          <div class="card-action">
            <button class="btn-inspect-3d" onclick="Armory.inspectItem('helm', '${h.id}')" title="Inspect in 3D">🔍 3D</button>
            ${isEquipped ? '<button class="btn-equipped" disabled>EQUIPPED</button>' :
              isOwned ? `<button class="btn-equip" onclick="Armory.equipHelm('${h.id}')">EQUIP</button>` :
              `<button class="btn-buy" onclick="Armory.buyHelm('${h.id}')">BUY 💰${h.cost}</button>`}
          </div>
        </div>
      `;
    });
    html += '</div>';

    // Mystical Amulets & Talismans
    if (window.CONFIG.AMULETS) {
      html += '<h3 class="armory-section-title">🔮 Mystical Amulets & Talismans</h3><div class="armory-grid">';
      Object.values(window.CONFIG.AMULETS).forEach(amu => {
        const isOwned = this.owned.amulets && this.owned.amulets.includes(amu.id);
        const isEquipped = this.equipped.amulet === amu.id;

        html += `
          <div class="armory-card ${isEquipped ? 'equipped' : ''}">
            <div class="card-icon" onclick="Armory.inspectItem('amulet', '${amu.id}')" style="cursor:pointer;">${amu.icon}</div>
            <div class="card-title" onclick="Armory.inspectItem('amulet', '${amu.id}')" style="cursor:pointer;">${amu.name}</div>
            <div class="card-stats" style="color:#d35400;">SPELL: <b>${amu.bonusText}</b></div>
            <div class="card-desc">${amu.desc}</div>
            <div class="card-action">
              <button class="btn-inspect-3d" onclick="Armory.inspectItem('amulet', '${amu.id}')" title="Inspect in 3D">🔍 3D</button>
              ${isEquipped ? '<button class="btn-equipped" disabled>EQUIPPED</button>' :
                isOwned ? `<button class="btn-equip" onclick="Armory.equipAmulet('${amu.id}')">EQUIP</button>` :
                `<button class="btn-buy" onclick="Armory.buyAmulet('${amu.id}')">BUY 💰${amu.cost}</button>`}
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    container.innerHTML = html;
  }
}

const Armory = new ArmoryManager();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Armory;
} else {
  window.Armory = Armory;
}
