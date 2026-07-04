// ============================================
// 3D BED WARS GAME - Logic, AI, UI, Input
// ============================================

class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = { dx: 0, dy: 0, locked: false };
    this.buildPointer = null;
    this.touchLook = { active: false, id: null, lastX: 0, lastY: 0 };
    this.joystick = { active: false, dx: 0, dy: 0 };
    this.buttons = { jump: false, attack: false, attackHeld: false, build: false, skill: false, action: false, actionHeld: false };
    this.lookSensitivity = parseFloat(localStorage.getItem('bedwars_look_sensitivity')) || 1.8;
    this.lastTouchAction = { x: 0, y: 0 };

    // Keyboard
    document.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','Tab'].includes(e.code)) e.preventDefault();
    });
    document.addEventListener('keyup', e => this.keys[e.code] = false);

    // Mouse
    document.addEventListener('mousemove', e => {
      if (document.pointerLockElement) {
        this.mouse.dx += e.movementX;
        this.mouse.dy += e.movementY;
      }
    });
    document.addEventListener('mousedown', e => {
      if (e.target.closest?.('#mobileControls, #shopBtn, #socialBtn, #layoutBtn, #skillBtn, #comboBar, #rescueBtn, #hotbar, #resourceBar, #playerStatus, #teamInfo, #minimap, #shopPanel, #backpackPanel, #growthPanel, #layoutPanel, #socialPanel, #markWheel, #teamChestPanel, #startRolePanel, #buildPanel, #timedAction')) return;
      if (e.button === 0) { this.buttons.attack = true; this.buttons.attackHeld = true; }
      if (e.button === 2) {
        this.buttons.build = true;
        this.buildPointer = document.pointerLockElement
          ? { x: window.innerWidth / 2, y: window.innerHeight / 2 }
          : { x: e.clientX, y: e.clientY };
      }
    });
    document.addEventListener('mouseup', e => {
      if (e.button === 0) { this.buttons.attack = false; this.buttons.attackHeld = false; }
      if (e.button === 2) this.buttons.build = false;
    });
    document.addEventListener('contextmenu', e => e.preventDefault());

    // Mouse wheel for hotbar
    document.addEventListener('wheel', e => {
      this.mouse.scroll = Math.sign(e.deltaY);
    }, { passive: true });

    // Lock pointer on click
    const canvas = document.getElementById('gameCanvas');
    canvas?.addEventListener('click', () => {
      if (window.game?.gameActive && !this.isMobile()) {
        canvas.requestPointerLock();
      }
    });
    document.addEventListener('pointerlockchange', () => {
      this.mouse.locked = !!document.pointerLockElement;
    });

    const isGameUiTarget = (target) => target.closest?.('#mobileControls, #shopBtn, #socialBtn, #layoutBtn, #skillBtn, #comboBar, #rescueBtn, #hotbar, #resourceBar, #playerStatus, #teamInfo, #minimap, #shopPanel, #backpackPanel, #growthPanel, #layoutPanel, #socialPanel, #markWheel, #teamChestPanel, #startRolePanel');
    document.addEventListener('touchstart', e => {
      if (!window.game?.gameActive || !this.isMobile()) return;
      if (isGameUiTarget(e.target)) return;
      const t = e.changedTouches[0];
      this.touchLook.active = true;
      this.touchLook.id = t.identifier;
      this.touchLook.lastX = t.clientX;
      this.touchLook.lastY = t.clientY;
    }, { passive: true });
    document.addEventListener('touchmove', e => {
      if (!this.touchLook.active || !window.game?.gameActive || !this.isMobile()) return;
      const t = Array.from(e.changedTouches).find(x => x.identifier === this.touchLook.id);
      if (!t) return;
      this.mouse.dx += (t.clientX - this.touchLook.lastX) * 1.35;
      this.mouse.dy += (t.clientY - this.touchLook.lastY) * 1.2;
      this.touchLook.lastX = t.clientX;
      this.touchLook.lastY = t.clientY;
    }, { passive: true });
    const endLook = (e) => {
      if (!this.touchLook.active) return;
      const t = Array.from(e.changedTouches).find(x => x.identifier === this.touchLook.id);
      if (!t) return;
      this.touchLook.active = false;
      this.touchLook.id = null;
    };
    document.addEventListener('touchend', endLook, { passive: true });
    document.addEventListener('touchcancel', endLook, { passive: true });

    // Mobile touch
    this.setupMobile();
  }

  isMobile() {
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  }

  setupMobile() {
    const joyBase = document.getElementById('joystickBase');
    const joyKnob = document.getElementById('joystickKnob');
    const zone = document.getElementById('joystickZone');
    if (!zone) return;

    zone.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = zone.getBoundingClientRect();
      this.joystick.active = true;
      this.joystick.originX = rect.left + rect.width / 2;
      this.joystick.originY = rect.top + rect.height / 2;
    }, { passive: false });

    zone.addEventListener('touchmove', e => {
      e.preventDefault();
      if (!this.joystick.active) return;
      const t = e.touches[0];
      const maxR = 36;
      let dx = t.clientX - this.joystick.originX;
      let dy = t.clientY - this.joystick.originY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxR) { dx = (dx / dist) * maxR; dy = (dy / dist) * maxR; }
      this.joystick.dx = dx / maxR;
      this.joystick.dy = dy / maxR;
      if (joyKnob) { joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`; }
    }, { passive: false });

    const endJoy = (e) => {
      e.preventDefault();
      this.joystick.active = false;
      this.joystick.dx = 0;
      this.joystick.dy = 0;
      if (joyKnob) joyKnob.style.transform = 'translate(-50%, -50%)';
    };
    zone.addEventListener('touchend', endJoy);
    zone.addEventListener('touchcancel', endJoy);

    // Mobile buttons
    const bindBtn = (id, key) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('touchstart', e => { e.preventDefault(); const t = e.touches[0]; this.lastTouchAction.x = t.clientX; this.lastTouchAction.y = t.clientY; this.buttons[key] = true; if (key === 'action') this.buttons.actionHeld = true; });
      btn.addEventListener('touchend', e => { e.preventDefault(); this.buttons[key] = false; if (key === 'action') this.buttons.actionHeld = false; });
      btn.addEventListener('touchcancel', e => { e.preventDefault(); this.buttons[key] = false; if (key === 'action') this.buttons.actionHeld = false; });
    };
    bindBtn('jumpBtnMobile', 'jump');
    bindBtn('actionBtnMobile', 'action');
    bindBtn('skillBtn', 'skill');
  }

  getMovement() {
    if (this.isMobile() && this.joystick.active) {
      return { x: this.joystick.dx, z: -this.joystick.dy };
    }
    let x = 0, z = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) z += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) z -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;
    return { x, z };
  }

  getLook() {
    const dx = this.mouse.dx;
    const dy = this.mouse.dy;
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    return { dx, dy };
  }

  isDown(code) { return !!this.keys[code]; }
  consumeAttack() { const v = this.buttons.attack; this.buttons.attack = false; return v; }
  consumeAction() { const v = this.buttons.action; this.buttons.action = false; return v; }
  isAttackHeld() { return !!this.buttons.attackHeld; }
  isActionHeld() { return !!this.buttons.actionHeld; }
  isBuildHeld() { return !!this.buttons.build; }
  consumeBuild() {
    const v = this.buttons.build;
    this.buttons.build = false;
    const target = this.buildPointer;
    this.buildPointer = null;
    return v ? (target || { x: window.innerWidth / 2, y: window.innerHeight / 2 }) : null;
  }
  consumeJump() { const v = this.buttons.jump || this.keys['Space']; this.buttons.jump = false; this.keys['Space'] = false; return v; }
  consumeSkill() { const v = this.buttons.skill || this.keys['KeyQ']; this.buttons.skill = false; this.keys['KeyQ'] = false; return v; }
  consumeDrop() { const v = this.keys['KeyG']; this.keys['KeyG'] = false; return v; }
  consumeBackpack() { const v = this.keys['Tab']; this.keys['Tab'] = false; return v; }
  getHotbarScroll() {
    const v = this.mouse.scroll || 0;
    this.mouse.scroll = 0;
    return v;
  }
}

// ============================================
// AI System
// ============================================
class AISystem {
  constructor(game) {
    this.game = game;
  }

  update(bot, dt) {
    if (bot.isDead) return;
    const state = bot.aiState || 'collect';
    const pos = bot.pos;

    // Danger check
    let nearestEnemy = null;
    let nearestDist = 999;
    for (const p of this.game.players) {
      if (p === bot || p.isDead || p.team === bot.team) continue;
      const d = p.pos.distanceTo(pos);
      if (d < nearestDist) { nearestDist = d; nearestEnemy = p; }
    }

    // State transitions
    if (nearestEnemy && nearestDist < 4 && bot.hp < 40) {
      bot.aiState = 'retreat';
    } else if (nearestEnemy && nearestDist < bot.attackRange + 1) {
      bot.aiState = 'attack';
    } else if (bot.aiState === 'attack' && (!nearestEnemy || nearestDist > 8)) {
      bot.aiState = 'collect';
    } else if (bot.aiState === 'retreat' && (!nearestEnemy || nearestDist > 10) && bot.hp > 60) {
      bot.aiState = 'collect';
    }

    // Auto-buy when near base
    const baseDist = pos.distanceTo(bot.teamInfo.spawn);
    if (baseDist < 8) {
      this.autoBuy(bot);
    }

    // State behavior
    let target = null;
    switch (bot.aiState) {
      case 'collect': {
        // Go to nearest resource gen
        let best = null, bestD = 999;
        for (const g of this.game.gens) {
          if (g.active === false) continue;
          if (g.type === 'COPPER' && g.team !== bot.team) continue;
          const d = g.pos.distanceTo(pos);
          if (d < bestD) { bestD = d; best = g.pos; }
        }
        target = best;
        break;
      }
      case 'attack': {
        if (nearestEnemy) target = nearestEnemy.pos.clone();
        else {
          // Go attack enemy bed
          for (const [tkey, tinfo] of Object.entries(TEAMS)) {
            if (tkey === bot.team) continue;
            if (tinfo.bedAlive) { target = tinfo.bedPos.clone(); break; }
          }
        }
        break;
      }
      case 'retreat': {
        target = bot.teamInfo.spawn.clone();
        break;
      }
    }

    if (!target) target = bot.teamInfo.spawn.clone();

    // Move toward target
    const dir = new THREE.Vector3().subVectors(target, pos);
    dir.y = 0;
    const dist = dir.length();
    if (dist > 0.5) {
      dir.normalize();
      const spd = bot.speed;
      bot.vel.x = dir.x * spd;
      bot.vel.z = dir.z * spd;

      // Face target
      bot.yaw = Math.atan2(dir.x, dir.z) + Math.PI;

      // Bridge if needed
      const forward = new THREE.Vector3(-Math.sin(bot.yaw), 0, -Math.cos(bot.yaw));
      const front = pos.clone().addScaledVector(forward, 1);
      const groundH = bot.getGroundHeight(front.x, front.z);
      const woodCount = this.getBlockCount(bot, 'wood_plank');
      if (groundH < -5 && woodCount > 0) {
        const bx = Math.floor(front.x);
        const by = Math.floor(pos.y - bot.radius);
        const bz = Math.floor(front.z);
        if (this.game.engine.placeBlock(bx, by, bz, 'wood_plank', bot.team)) {
          this.consumeBlock(bot, 'wood_plank', 1);
        }
      }

      // Jump if obstacle
      const head = pos.clone().addScaledVector(forward, 0.6);
      head.y += 0.5;
      const key = this.game.engine.getBlockKey(head.x, head.y, head.z);
      if (this.game.engine.blocks.has(key) && bot.onGround) {
        bot.jump();
      }
    } else {
      bot.vel.x = 0;
      bot.vel.z = 0;
    }

    // Attack
    if (bot.aiState === 'attack' && nearestEnemy && nearestDist < bot.attackRange) {
      bot.attack();
    }
    // Attack bed
    if (bot.aiState === 'attack') {
      for (const [tkey, tinfo] of Object.entries(TEAMS)) {
        if (tkey === bot.team) continue;
        if (tinfo.bedAlive && pos.distanceTo(tinfo.bedPos) < bot.attackRange + 2) {
          bot.attack();
          break;
        }
      }
    }
  }

  autoBuy(bot) {
    const res = bot.inv;
    const woodCount = bot.hotbar.reduce((s, slot) => s + (slot && slot.key === 'wood_plank' ? slot.count : 0), 0)
      + bot.backpack.reduce((s, slot) => s + (slot && slot.key === 'wood_plank' ? slot.count : 0), 0);
    // Buy blocks
    if (woodCount < 64) {
      const cost = ITEM_DB.wood_plank.cost.copper;
      if ((res.copper || 0) >= cost) {
        res.copper -= cost;
        bot.addToBackpack('wood_plank', 1);
      }
    }
    // Buy weapon
    const hasWeapon = bot.equipped.weapon;
    const weaponTier = hasWeapon ? (hasWeapon.includes('diamond') ? 4 : hasWeapon.includes('iron') ? 3 : hasWeapon.includes('stone') ? 2 : 1) : 0;
    if (weaponTier < 2 && (res.silver || 0) >= 8) {
      res.silver -= 8;
      bot.addToBackpack('stone_sword');
      bot.equip('stone_sword');
    } else if (weaponTier < 3 && (res.gold || 0) >= 4) {
      res.gold -= 4;
      bot.addToBackpack('iron_sword');
      bot.equip('iron_sword');
    } else if (weaponTier < 4 && (res.jade || 0) >= 2) {
      res.jade -= 2;
      bot.addToBackpack('diamond_sword');
      bot.equip('diamond_sword');
    }
    // Buy armor
    if (!bot.equipped.armor && (res.gold || 0) >= 8) {
      res.gold -= 8;
      bot.addToBackpack('std_armor');
      bot.equip('std_armor');
    }
    // Buy arrows if has bow
    if (bot.equipped.weapon === 'bow' && bot.arrowCount < 16 && (res.silver || 0) >= 2) {
      res.silver -= 2;
      bot.addToBackpack('arrow');
    }
    // Buy bow
    if (!bot.equipped.weapon && (res.silver || 0) >= 12) {
      res.silver -= 12;
      bot.addToBackpack('bow');
      bot.equip('bow');
    }
  }

  getBlockCount(bot, key) {
    return bot.hotbar.reduce((s, slot) => s + (slot && slot.key === key ? slot.count : 0), 0)
      + bot.backpack.reduce((s, slot) => s + (slot && slot.key === key ? slot.count : 0), 0);
  }

  consumeBlock(bot, key, count = 1) {
    // 优先消耗快捷栏
    for (let i = 0; i < bot.hotbar.length; i++) {
      if (bot.hotbar[i] && bot.hotbar[i].key === key) {
        const take = Math.min(count, bot.hotbar[i].count);
        bot.hotbar[i].count -= take;
        count -= take;
        if (bot.hotbar[i].count <= 0) bot.hotbar[i] = null;
        if (count <= 0) return true;
      }
    }
    // 再消耗背包
    for (let i = 0; i < bot.backpack.length; i++) {
      if (bot.backpack[i] && bot.backpack[i].key === key) {
        const take = Math.min(count, bot.backpack[i].count);
        bot.backpack[i].count -= take;
        count -= take;
        if (bot.backpack[i].count <= 0) bot.backpack[i] = null;
        if (count <= 0) return true;
      }
    }
    return false;
  }
}

// ============================================
// UI Manager
// ============================================
class UIManager {
  constructor(game) {
    this.game = game;
    this.shopOpen = false;
    this.shopTab = 'blocks';
  }

  update() {
    const lp = this.game.localPlayer;
    if (!lp) return;
    const hud = document.getElementById('hud');
    if (hud) hud.classList.toggle('dead-state', !!lp.isDead);
    const countdown = document.getElementById('respawnCountdown');
    const hint = document.getElementById('respawnHint');
    if (lp.isDead && countdown) {
      countdown.textContent = lp.pendingElimination
        ? '床已被摧毁，无法复活'
        : `还剩 ${Math.max(0, Math.ceil(lp.respawnTimer))} 秒复活`;
      if (hint) hint.textContent = lp.pendingElimination ? '等待队友获胜或对局结束' : '床仍存在，正在寻找安全复活点';
    }

    // Resources
    const r = lp.inv;
    document.getElementById('resCopper').textContent = Math.floor(r.copper || 0);
    document.getElementById('resSilver').textContent = Math.floor(r.silver || 0);
    document.getElementById('resGold').textContent = Math.floor(r.gold || 0);
    document.getElementById('resJade').textContent = Math.floor(r.jade || 0);

    // HP / Armor
    document.getElementById('hpFill').style.width = `${(lp.hp / lp.maxHp) * 100}%`;
    document.getElementById('hpText').textContent = `${Math.ceil(lp.hp)}/${lp.maxHp}`;
    document.getElementById('armorFill').style.width = `${lp.armorMax ? Math.min(100, (lp.armor / lp.armorMax) * 100) : 0}%`;
    document.getElementById('armorText').textContent = `${Math.ceil(lp.armor)}${lp.armorMax ? '/' + lp.armorMax : ''}`;
    const currentNeed = GROWTH_CONFIG.levelXp[lp.matchLevel - 1] || 0;
    const nextNeed = GROWTH_CONFIG.levelXp[lp.matchLevel] || GROWTH_CONFIG.levelXp[GROWTH_CONFIG.levelXp.length - 1];
    const xpPct = lp.matchLevel >= GROWTH_CONFIG.maxInMatchLevel ? 100 : ((lp.matchXp - currentNeed) / Math.max(1, nextNeed - currentNeed)) * 100;
    document.getElementById('xpFill').style.width = `${Math.max(0, Math.min(100, xpPct))}%`;
    document.getElementById('xpText').textContent = `Lv.${lp.matchLevel}`;

    // Timer
    const mins = Math.floor(this.game.gameTime / 60);
    const secs = Math.floor(this.game.gameTime % 60);
    const timerEl = document.getElementById('gameTimer');
    if (timerEl) timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    if (this.game.shrinkActive && timerEl) timerEl.style.color = '#ff4444';

    // Team info
    const tinfo = document.getElementById('teamInfo');
    if (tinfo) {
      const bedAlive = lp.teamInfo.bedAlive;
      tinfo.querySelector('.bed-status').innerHTML = bedAlive
        ? '<span class="bed-alive">床: 安全</span>'
        : '<span class="bed-dead">床: 已摧毁</span>';
      const alive = this.game.players.filter(p => p.team === lp.team && !p.isDead).length;
      const total = this.game.players.filter(p => p.team === lp.team).length;
      tinfo.querySelector('.players').textContent = `队友存活: ${alive}/${total}`;
    }

    // Hotbar (8 slots)
    for (let i = 0; i < 8; i++) {
      const slot = document.getElementById(`slot${i}`);
      if (!slot) continue;
      const item = lp.hotbar[i];
      slot.querySelector('.slot-name').textContent = item ? ITEM_DB[item.key]?.name?.slice(0, 3) || '?' : '';
      const info = item ? ITEM_DB[item.key] : null;
      const extra = item && info?.durability ? `耐${item.durability ?? info.durability}` : item?.usesLeft ? `用${item.usesLeft}` : (item?.count > 1 ? item.count : '');
      slot.querySelector('.slot-count').textContent = item ? extra : '';
      if (lp.hotbarIndex === i) slot.classList.add('active');
      else slot.classList.remove('active');
    }

    // Minimap
    this.drawMinimap();

    // Skill CD
    const skillBtn = document.getElementById('skillBtn');
    if (skillBtn) {
      if (!lp.isDead) skillBtn.style.display = 'flex';
      if (lp.skillCd > 0) {
        skillBtn.querySelector('.skill-cd').textContent = Math.ceil(lp.skillCd) + 's';
        skillBtn.style.opacity = '0.5';
      } else {
        skillBtn.querySelector('.skill-cd').textContent = '就绪';
        skillBtn.style.opacity = '1';
      }
    }

    // 传送硬币蓄力显示
    const teleportIndicator = document.getElementById('teleportCharge');
    if (teleportIndicator) {
      if (lp.teleportCoinCharge > 0) {
        const dist = Math.min(20, Math.round(lp.teleportCoinCharge * 0.5));
        teleportIndicator.textContent = `传送硬币: ${dist}格`;
        teleportIndicator.style.display = 'block';
      } else {
        teleportIndicator.style.display = 'none';
      }
    }

    // 状态药水计时器显示
    const statusBar = document.getElementById('statusEffects');
    if (statusBar) {
      const effects = [];
      if (lp.hasRevivalToken) effects.push('<span class="eff-revival">复活金牌</span>');
      if (lp.speedPotionTimer > 0) effects.push(`<span class="eff-speed">极速 ${lp.speedPotionTimer.toFixed(1)}s</span>`);
      if (lp.burstPotionTimer > 0) effects.push(`<span class="eff-burst">爆发 ${lp.burstPotionTimer.toFixed(1)}s</span>`);
      if (lp.hurricaneDamageTimer > 0) effects.push(`<span class="eff-hurricane">飓风 ${lp.hurricaneDamageTimer.toFixed(1)}s</span>`);
      if (lp.camouflageTimer > 0) effects.push(`<span class="eff-camo">隐身 ${lp.camouflageTimer.toFixed(1)}s</span>`);
      const camoOverlay = document.getElementById('camoOverlay');
      if (camoOverlay) {
        if (lp.camouflageTimer > 0) {
          camoOverlay.style.display = 'block';
          document.getElementById('camoTime').textContent = lp.camouflageTimer.toFixed(1);
        } else {
          camoOverlay.style.display = 'none';
        }
      }
      if (lp.fatTimer > 0) effects.push(`<span class="eff-fat">肥肉 ${lp.fatTimer.toFixed(1)}s</span>`);
      if (lp.role === 'WAIWAI') effects.push(`<span class="eff-miss">miss ${lp.miss}/${lp.maxMiss}${lp.missInvulnTimer > 0 ? ` 无敌 ${lp.missInvulnTimer.toFixed(1)}s` : ''}</span>`);
      statusBar.innerHTML = effects.join(' ');
      statusBar.style.display = effects.length > 0 ? 'flex' : 'none';
    }

    const timedAction = document.getElementById('timedAction');
    if (timedAction) {
      if (lp.healAction) {
        timedAction.textContent = `${lp.healAction.info.name}：${lp.healAction.remain.toFixed(1)}秒后完成，再次点击取消`;
        timedAction.style.display = 'block';
      } else if (lp.missileControl) {
        timedAction.textContent = `导弹自动爆炸：${Math.max(0, lp.missileControl.life).toFixed(1)}秒`;
        timedAction.style.display = 'block';
      } else {
        timedAction.style.display = 'none';
      }
    }

    const actionBtn = document.getElementById('actionBtnMobile');
    if (actionBtn) {
      const item = lp.getSelectedItem();
      const info = item ? ITEM_DB[item.key] : null;
      let label = '攻击';
      if (info?.type === 'block') label = '建造';
      else if (info?.type === 'weapon') label = '攻击';
      else if (item?.key === 'trap_device') label = '装置';
      else if (item?.key === 'bear_trap') label = '捕兽夹';
      else if (item?.key === 'sensor_mine') label = '地雷';
      else if (info?.explosive) label = '放置';
      else if (item?.key === 'repair_drone') label = '无人机';
      else if (info?.healAmount || info?.healFull) label = lp.healAction ? '取消' : '治疗';
      else if (item?.key === 'portal') label = '传送';
      else if (item?.key === 'potion') label = '药水';
      else if (info?.name) label = info.name.slice(0, 3);
      actionBtn.textContent = label;
      actionBtn.dataset.mode = info?.type || item?.key || 'attack';
    }
  }

  drawMinimap() {
    const canvas = document.getElementById('minimapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;

    // Islands (simplified representation for larger map)
    ctx.fillStyle = 'rgba(100,150,100,0.5)';
    const islandR = 6 * (w / 140);
    ctx.fillRect(cx - 60 * (w/140), cy - 60 * (w/140), islandR, islandR);
    ctx.fillRect(cx + 54 * (w/140), cy - 60 * (w/140), islandR, islandR);
    ctx.fillRect(cx - 60 * (w/140), cy + 54 * (w/140), islandR, islandR);
    ctx.fillRect(cx + 54 * (w/140), cy + 54 * (w/140), islandR, islandR);
    ctx.fillStyle = 'rgba(80,120,80,0.6)';
    ctx.fillRect(cx - 13 * (w/140), cy - 13 * (w/140), 26 * (w/140), 26 * (w/140));

    // Beds
    for (const [key, t] of Object.entries(TEAMS)) {
      if (!t.bedAlive) continue;
      const bx = cx + (t.spawn.x / 140) * w * 0.5;
      const by = cy + (t.spawn.z / 140) * h * 0.5;
      ctx.fillStyle = t.hex;
      ctx.fillRect(bx - 3, by - 2, 6, 4);
    }

    // Players
    for (const p of this.game.players) {
      if (p.isDead) continue;
      const px = cx + (p.pos.x / 140) * w * 0.5;
      const py = cy + (p.pos.z / 140) * h * 0.5;
      ctx.fillStyle = p.teamInfo.hex;
      ctx.beginPath();
      ctx.arc(px, py, p.isLocal ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();
      if (p.isLocal) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Shrink boundary
    if (this.game.shrinkActive) {
      const r = (this.game.shrinkRadius / 140) * w * 0.5;
      ctx.strokeStyle = 'rgba(255,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  updateBackpack() {
    const lp = this.game.localPlayer;
    if (!lp) return;
    const grid = document.getElementById('backpackGrid');
    if (!grid) return;
    grid.innerHTML = '';
    // Hotbar
    const hotbarRow = document.createElement('div');
    hotbarRow.className = 'backpack-row';
    hotbarRow.innerHTML = '<div style="color:#888;font-size:12px;margin-bottom:4px;">快捷栏</div>';
    const hotbarGrid = document.createElement('div');
    hotbarGrid.className = 'backpack-row-grid';
    for (let i = 0; i < 8; i++) {
      const slot = document.createElement('div');
      slot.className = 'bp-slot' + (lp.hotbarIndex === i ? ' active' : '');
      const item = lp.hotbar[i];
      slot.innerHTML = item ? `<div>${ITEM_DB[item.key]?.name?.slice(0,4)||'?'}</div><div style="font-size:10px;color:#ffdd00;">${item.count}</div>` : '';
      hotbarGrid.appendChild(slot);
    }
    hotbarRow.appendChild(hotbarGrid);
    grid.appendChild(hotbarRow);
    // Backpack
    const packRow = document.createElement('div');
    packRow.className = 'backpack-row';
    packRow.innerHTML = '<div style="color:#888;font-size:12px;margin-bottom:4px;">背包</div>';
    const packGrid = document.createElement('div');
    packGrid.className = 'backpack-grid';
    for (let i = 0; i < lp.backpack.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'bp-slot';
      const item = lp.backpack[i];
      slot.innerHTML = item ? `<div>${ITEM_DB[item.key]?.name?.slice(0,4)||'?'}</div><div style="font-size:10px;color:#ffdd00;">${item.count}</div>` : '';
      packGrid.appendChild(slot);
    }
    packRow.appendChild(packGrid);
    grid.appendChild(packRow);
  }

  updateGrowthPanel() {
    if (this.game.growthPanelOpen) this.renderGrowthCenter();
  }

  renderGrowthCenter() {
    const body = document.getElementById('growthBody');
    if (!body || !this.game.growth) return;
    const gm = this.game.growth;
    if (this.game.growthTab === 'talents') return this.renderTalentPanel(body, gm);
    if (this.game.growthTab === 'mastery') return this.renderMasteryPanel(body, gm);
    if (this.game.growthTab === 'season') return this.renderSeasonPanel(body, gm);
    if (this.game.growthTab === 'rank') return this.renderRankPanel(body, gm);
  }

  renderTalentPanel(body, gm) {
    const active = gm.activeTalents || [];
    body.innerHTML = `
      <div class="growth-summary">
        <span class="growth-pill">筑梦星尘：${gm.profile.stardust || 0}</span>
        <span class="growth-pill">已激活：${active.length}/3</span>
        <span class="growth-pill">满级可点亮30节点，入场仅携带3个</span>
      </div>
      <div class="growth-grid">
        ${OUTGAME_TALENTS.map(t => `
          <div class="talent-card ${t.color} ${active.includes(t.id) ? 'active' : ''}">
            <h4>${t.name}</h4>
            <p>${t.desc}</p>
            <button data-talent="${t.id}">${active.includes(t.id) ? '取消携带' : '携带进场'}</button>
          </div>
        `).join('')}
      </div>`;
    body.querySelectorAll('[data-talent]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.talent;
        const idx = gm.activeTalents.indexOf(id);
        if (idx >= 0) gm.activeTalents.splice(idx, 1);
        else {
          if (gm.activeTalents.length >= 3) return alert('每局最多携带3个核心天赋');
          gm.activeTalents.push(id);
        }
        localStorage.setItem('bedwars_active_talents', JSON.stringify(gm.activeTalents));
        this.renderGrowthCenter();
      };
    });
  }

  renderMasteryPanel(body, gm) {
    const all = JSON.parse(localStorage.getItem('bedwars_role_mastery') || '{}');
    body.innerHTML = `<div class="growth-grid">
      ${Object.keys(ROLES).map(role => {
        const r = all[role] || { kills: 0, beds: 0, wins: 0, tier: '青铜' };
        const tier = r.tier || gm.masteryTier(r);
        const reward = tier === '筑梦大师' ? '已解锁专属搭路方块皮肤与拆床宣言' : tier === '黄金' ? '已解锁出生彩色拖尾光效' : '继续使用角色可解锁外观奖励';
        return `<div class="mastery-card"><h4>${ROLES[role].name} · ${tier}</h4><p>击杀 ${r.kills || 0}｜拆床 ${r.beds || 0}｜胜利 ${r.wins || 0}</p><p>${reward}</p></div>`;
      }).join('')}
    </div>`;
  }

  renderSeasonPanel(body, gm) {
    const seasonXp = gm.profile.seasonXp || 0;
    const level = Math.floor(seasonXp / 300) + 1;
    body.innerHTML = `
      <div class="growth-summary">
        <span class="growth-pill">赛季等级：${level}</span>
        <span class="growth-pill">赛季积分：${seasonXp}</span>
        <span class="growth-pill">赛季周期：每3个月重置</span>
      </div>
      <div class="growth-grid">
        <div class="season-card"><h4>日常：累计放置500个方块</h4><p>奖励：120赛季积分。当前局建造会计入结算。</p></div>
        <div class="season-card"><h4>周常：用弓箭击杀3人</h4><p>奖励：重置卷轴碎片，可在10分钟后重新选择觉醒。</p></div>
        <div class="season-card"><h4>奖励：重置卷轴</h4><p>稀有道具，每局10分钟后可重选一次技能分支。</p></div>
        <div class="season-card"><h4>奖励：表情动作</h4><p>击败敌人后可播放跳舞、鞠躬等表现动作。</p></div>
      </div>`;
  }

  renderRankPanel(body, gm) {
    const score = gm.profile.rankScore || 0;
    body.innerHTML = `
      <div class="growth-summary">
        <span class="growth-pill">当前段位：${gm.rankName(score)}</span>
        <span class="growth-pill">排位分：${score}</span>
        <span class="growth-pill">仅联机对局计入正式排位</span>
      </div>
      <div class="growth-grid">
        <div class="rank-card"><h4>评分维度</h4><p>关键拆床、团队资源贡献、存活时长、胜负结果共同决定加减分。</p></div>
        <div class="rank-card"><h4>团队导向</h4><p>铺路搭桥、守床、资源输送同样会提高结算评分，不鼓励单纯抢人头。</p></div>
        <div class="rank-card"><h4>最高荣誉</h4><p>筑梦传说：全区前20名玩家显示专属称号。</p></div>
      </div>`;
  }

  buildShop() {
    const body = document.getElementById('shopBody');
    if (!body) return;
    const lp = this.game.localPlayer;
    if (!lp) return;
    body.innerHTML = '';
    const tabs = {
      blocks: ['wood_plank','stone_plate','iron_plate','titanium','blast_glass'],
      weapons: ['wood_sword','stone_sword','iron_sword','diamond_sword','bow','arrow','armor_hammer','boomerang','frost_staff','javelin','smoke_launcher'],
      armor: ['crude_armor','handmade_armor','std_armor','fine_armor','rd_armor'],
      specials: ['tnt','handmade_tnt','military_c4','mini_nuke','repair_drone','bandage','medkit','surgery_station','trap_device','bear_trap','sensor_mine','portal','potion','revival_gold','teleport_coin','cd_potion','speed_potion','burst_potion']
    };
    const items = tabs[this.shopTab] || [];

    for (const key of items) {
      const item = ITEM_DB[key];
      const div = document.createElement('div');
      div.className = 'shop-item';
      let costStr = '';
      let canAfford = true;
      if (item.cost.copper) {
        const cost = item.cost.copper;
        costStr += `<span class="cost-copper">${cost}铜</span> `;
        if ((lp?.inv.copper || 0) < cost) canAfford = false;
      }
      if (item.cost.silver) { costStr += `<span class="cost-silver">${item.cost.silver}银</span> `; if ((lp?.inv.silver || 0) < item.cost.silver) canAfford = false; }
      if (item.cost.gold) { costStr += `<span class="cost-gold">${item.cost.gold}金</span> `; if ((lp?.inv.gold || 0) < item.cost.gold) canAfford = false; }
      if (item.cost.jade) { costStr += `<span class="cost-jade">${item.cost.jade}玉</span> `; if ((lp?.inv.jade || 0) < item.cost.jade) canAfford = false; }

      const countStr = item.count && item.count > 1 ? `<span class="item-count">获得 x${item.count}</span>` : '';
      div.innerHTML = `<div class="item-name">${item.name}</div><div class="item-desc">${item.desc}</div><div class="item-cost">${costStr}${countStr}</div>`;
      if (!canAfford) div.classList.add('disabled');
      div.onclick = () => { if (canAfford) this.game.buyItem(key); };
      body.appendChild(div);
    }
  }
}

// ============================================
// Main Game Class
// ============================================
class Game {
  constructor(options = {}) {
    this.engine = null;
    this.gens = [];
    this.players = [];
    this.localPlayer = null;
    this.gameTime = 0;
    this.gameActive = false;
    this.shrinkStartTime = 1500; // 第25分钟开始死亡边界
    this.shrinkTimer = this.shrinkStartTime;
    this.shrinkActive = false;
    this.shrinkInitialRadius = 125;
    this.shrinkRadius = this.shrinkInitialRadius;
    this.nextDreamTide = 300;
    this.input = new InputManager();
    this.ai = null;
    this.ui = null;
    this.lastTime = 0;
    this.killFeed = [];
    this.shrinkBoundary = null;
    this.shopDirty = true;
    this.network = options.network || null;
    this.onlineMode = !!options.onlineMode;
    this.playerName = options.playerName || '你';
    this.tick = 0;
    this.matchSnapshotTimer = 0;
    this.economyLogTimer = 0;
    this.adminCommandSub = null;
    this.growth = null;
    this.social = null;
    this.growthPanelOpen = false;
    this.growthTab = 'talents';
    this.roleSelectionActive = false;
    this.roleSelectionTimer = 0;
    this.roleChosen = false;
    this.selectedBlockKey = null;
    this.movingBlockKey = null;
    this.selectedMap = 'classic';
  }

  init() {
    const container = document.getElementById('gameCanvas');
    this.engine = new Engine(container);
    this.gens = generateWorld(this.engine, this.selectedMap);
    this.social?.initMatch?.();
    this.ai = new AISystem(this);
    this.ui = new UIManager(this);
    this.growth = new GrowthManager(this);
    this.social = new SocialManager(this);

    // Build shop tabs
    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.ui.shopTab = tab.dataset.tab;
        this.ui.buildShop();
      };
    });

    document.querySelector('.shop-close').onclick = () => this.toggleShop();
    document.getElementById('shopBtn').onclick = () => this.toggleShop();
    document.getElementById('layoutBtn').onclick = () => window.hudLayoutManager?.open();
    document.getElementById('socialBtn').onclick = () => this.social?.openSocialPanel();
    document.getElementById('comboShieldBtn').onclick = () => this.social?.castCombo('shield');
    document.getElementById('comboAssaultBtn').onclick = () => this.social?.castCombo('assault');
    document.getElementById('rescueBtn').onclick = () => this.social?.rescueVoidMate();
    document.querySelectorAll('.growth-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.growth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.growthTab = tab.dataset.growthTab;
        this.ui.renderGrowthCenter();
      };
    });
    document.getElementById('skillBtn').onclick = () => {
      if (this.localPlayer) this.localPlayer.useSkill();
    };
    document.getElementById('buildUpgradeBtn')?.addEventListener('click', () => this.upgradeSelectedBlock());
    document.getElementById('buildDestroyBtn')?.addEventListener('click', () => this.destroySelectedBlock());
    document.getElementById('buildMoveBtn')?.addEventListener('click', () => this.prepareMoveSelectedBlock());
    document.querySelectorAll('.hotbar-slot').forEach((slot, idx) => {
      const select = (e) => {
        e.preventDefault();
        if (this.gameActive) this.selectHotbar(idx);
      };
      slot.addEventListener('click', select);
      slot.addEventListener('touchstart', select, { passive: false });
    });

    // Hotbar keys & actions
    document.addEventListener('keydown', e => {
      if (!this.gameActive) return;
      if (e.code === 'Digit1') this.selectHotbar(0);
      if (e.code === 'Digit2') this.selectHotbar(1);
      if (e.code === 'Digit3') this.selectHotbar(2);
      if (e.code === 'Digit4') this.selectHotbar(3);
      if (e.code === 'Digit5') this.selectHotbar(4);
      if (e.code === 'Digit6') this.selectHotbar(5);
      if (e.code === 'Digit7') this.selectHotbar(6);
      if (e.code === 'Digit8') this.selectHotbar(7);
      if (e.code === 'KeyB') this.toggleShop();
      if (e.code === 'KeyC') this.social?.openMarkWheel();
      if (e.code === 'KeyV') this.social?.sendAid();
      if (e.code === 'KeyX') this.social?.openTeamChest();
      if (e.code === 'KeyZ') this.social?.castCombo('shield');
      if (e.code === 'KeyQ') {
        if (this.localPlayer) this.localPlayer.useSkill();
      }
      if (e.code === 'KeyG') {
        if (this.localPlayer) this.localPlayer.dropSelectedItem();
      }
      if (e.code === 'Tab') {
        e.preventDefault();
        this.toggleBackpack();
      }
    });

    // Start loop
    requestAnimationFrame(t => this.loop(t));

    // Subscribe to admin commands
    this.subscribeAdminCommands();
  }

  start(teamKey, roleKey) {
    this.gameActive = true;
    this.gameTime = 0;
    this.shrinkTimer = this.shrinkStartTime;
    this.shrinkActive = false;
    this.shrinkRadius = this.shrinkInitialRadius;
    this.nextDreamTide = 300;

    // Reset teams
    for (const t of Object.values(TEAMS)) { t.bedAlive = true; if (t.bedMesh) t.bedMesh.visible = true; }

    // Clear old entities
    for (const p of this.players) this.engine.removeEntity(p);
    this.players = [];
    this.killFeed = [];
    document.getElementById('killFeed').innerHTML = '';

    // Create local player
    const localId = this.onlineMode && this.network?.auth?.user?.id
      ? this.network.auth.user.id
      : 'local-' + Math.random().toString(36).slice(2, 10);
    this.localPlayer = new PlayerEntity(this.engine, teamKey, roleKey, true, this.playerName, localId);
    this.growth?.applyOutGameTalents(this.localPlayer);
    this.players.push(this.localPlayer);

    // Create AI bots (max 4, controlled by AIController)
    AIManager.removeAll();
    const botNames = ['Alpha','Bravo','Charlie','Delta','Echo','Foxtrot','Golf','Hotel','India','Juliet','Kilo','Lima'];
    let nameIdx = 0;
    const roles = Object.keys(ROLES);
    const desiredAiCount = this.onlineMode ? (window.lobbyAiSlots || 0) : Math.max(4, window.lobbyAiSlots || 0);
    for (const [tkey, tinfo] of Object.entries(TEAMS)) {
      const count = desiredAiCount > 0 ? 1 : 0; // 每队最多1个AI，总数不超过4
      for (let i = 0; i < count; i++) {
        if (AIManager.getCount() >= desiredAiCount) break;
        if (AIManager.getCount() >= AI_CONFIG.MAX_AI_COUNT) break;
        const role = roles[Math.floor(Math.random() * roles.length)];
        const name = botNames[nameIdx++] || 'Bot';
        const result = AIManager.createAI(this.engine, this, tkey, name, role);
        if (result) {
          result.entity.applyStarterGear?.();
          result.entity.addToBackpack('wood_plank', 32);
          result.entity.pos.x += (Math.random() - 0.5) * 4;
          result.entity.pos.z += (Math.random() - 0.5) * 4;
          this.players.push(result.entity);
        }
      }
      if (AIManager.getCount() >= desiredAiCount) break;
      if (AIManager.getCount() >= AI_CONFIG.MAX_AI_COUNT) break;
    }

    // UI
    document.querySelectorAll('.lobby-float-panel.open').forEach(panel => panel.classList.remove('open'));
    ['seasonPassPanel','passPayPanel','menuGrowthPanel','layoutPanel'].forEach(id => {
      const panel = document.getElementById(id);
      if (panel) panel.style.display = 'none';
    });
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('shopPanel').style.display = 'none';
    document.getElementById('crosshair').style.display = 'block';
    document.getElementById('skillBtn').style.display = 'flex';
    window.hudLayoutManager?.init?.();

    // Show skill info
    const skillBtn = document.getElementById('skillBtn');
    if (skillBtn) {
      skillBtn.querySelector('span:first-child').textContent = ROLES[roleKey].active.name;
    }

    // Lock pointer
    if (!this.input.isMobile()) {
      this.engine.renderer.domElement.requestPointerLock();
    }

    this.showMessage('游戏开始！保护你的床，摧毁敌人的床！');
    this.social?.initMatch?.();
    this.beginRoleSelection();
    if (this.network) {
      this.network.startSnapshotLoop?.(() => this.getNetworkState());
    }
  }

  beginRoleSelection() {
    this.roleSelectionActive = true;
    this.roleSelectionTimer = 10;
    this.roleChosen = false;
    if (this.localPlayer) this.localPlayer.isFrozen = true;
    const panel = document.getElementById('startRolePanel');
    const cards = document.getElementById('startRoleCards');
    if (!panel || !cards) return;
    const shapeClass = { FOX: 'shape-fox', PORK_DOCTOR: 'shape-pork', HURRICANE: 'shape-hurricane', DRIFTWOOD: 'shape-driftwood', STEEL_BONE: 'shape-steel', WAIWAI: 'shape-waiwai' };
    const subtitles = {
      FOX: '伪装突袭 / 残血反杀',
      PORK_DOCTOR: '高血抗压 / 持续恢复',
      HURRICANE: '位移爆发 / 远程标记',
      DRIFTWOOD: '导弹操控 / 护盾回收',
      STEEL_BONE: '搭桥 / 建筑加固',
      WAIWAI: '1血极限 / miss免伤'
    };
    const starterText = (role) => (role.starter || []).map(s => s.currency ? `${s.count}${s.currency === 'copper' ? '铜币' : s.currency}` : `${ITEM_DB[s.key]?.name || s.key}x${s.count}`).join('、') || '无';
    cards.innerHTML = Object.entries(ROLES).map(([key, role]) => `
      <div class="start-role-card" data-role="${key}">
        <div class="role-shape ${shapeClass[key]}"></div>
        <h3>${role.name}</h3>
        <div class="role-stat"><span>定位</span><b>${subtitles[key]}</b></div>
        <div class="role-stat"><span>生命</span><b>${role.hp}</b></div>
        <div class="role-stat"><span>初始</span><b>${starterText(role)}</b></div>
        <div class="role-skill-box"><b>被动：${role.passive.name}</b><p>${role.passive.desc}</p></div>
        <div class="role-skill-box"><b>主动：${role.active.name}</b><p>${role.active.desc}｜冷却 ${role.active.cd} 秒</p></div>
      </div>
    `).join('');
    cards.querySelectorAll('.start-role-card').forEach(card => {
      card.onclick = () => this.confirmRoleSelection(card.dataset.role);
    });
    panel.style.display = 'flex';
    if (document.pointerLockElement) document.exitPointerLock();
    this.updateRoleSelectionUI();
  }

  updateRoleSelection(dt) {
    if (!this.roleSelectionActive) return;
    this.roleSelectionTimer -= dt;
    this.updateRoleSelectionUI();
    if (this.roleSelectionTimer <= 0) this.confirmRoleSelection('FOX');
  }

  updateRoleSelectionUI() {
    const sec = Math.max(0, Math.ceil(this.roleSelectionTimer));
    const small = document.getElementById('roleCountdown');
    const big = document.getElementById('roleCountdownBig');
    if (small) small.textContent = sec;
    if (big) big.textContent = sec;
  }

  confirmRoleSelection(roleKey) {
    if (!this.roleSelectionActive || this.roleChosen) return;
    this.roleChosen = true;
    const role = ROLES[roleKey] ? roleKey : 'FOX';
    this.localPlayer?.setRole?.(role, true);
    if (this.localPlayer) this.localPlayer.isFrozen = false;
    const panel = document.getElementById('startRolePanel');
    if (panel) panel.style.display = 'none';
    const skillBtn = document.getElementById('skillBtn');
    if (skillBtn) {
      skillBtn.querySelector('span:first-child').textContent = ROLES[role].active.name;
      skillBtn.style.display = 'flex';
    }
    this.showMessage(`已选择角色：${ROLES[role].name}｜${ROLES[role].active.name}`, '#ffdd00');
    this.roleSelectionActive = false;
    if (!this.input.isMobile()) this.engine.renderer.domElement.requestPointerLock();
  }

  loop(time) {
    requestAnimationFrame(t => this.loop(t));
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    if (!this.gameActive) {
      this.engine.render();
      return;
    }

    this.gameTime += dt;
    this.tick++;
    this.shrinkTimer -= dt;
    this.updateRoleSelection(dt);

    // 梦域潮汐：每 5 分钟重排部分资源浮岛并刷新临时资源点
    if (this.gameTime >= this.nextDreamTide) {
      this.nextDreamTide += 300;
      if (this.engine.triggerDreamTide) {
        this.engine.triggerDreamTide(this.gens);
        this.showMessage('梦域潮汐涌动：资源浮岛路线发生变化！', '#b388ff');
      }
    }

    // Shrink
    if (this.shrinkTimer <= 0 && !this.shrinkActive) {
      this.shrinkActive = true;
      this.showMessage('警告：死亡边界开始收缩！', '#ff4444');
    }
    if (this.shrinkActive) {
      this.shrinkRadius = Math.max(8, this.shrinkInitialRadius - (this.gameTime - this.shrinkStartTime) * 0.203);
      // Damage players outside
      for (const p of this.players) {
        if (p.isDead) continue;
        const dist = Math.sqrt(p.pos.x * p.pos.x + p.pos.z * p.pos.z);
        if (dist > this.shrinkRadius) {
          p.takeDamage(10 * dt, null);
        }
      }
      // Destroy beds outside
      for (const [tkey, tinfo] of Object.entries(TEAMS)) {
        if (!tinfo.bedAlive) continue;
        const dist = Math.sqrt(tinfo.bedPos.x * tinfo.bedPos.x + tinfo.bedPos.z * tinfo.bedPos.z);
        if (dist > this.shrinkRadius) {
          tinfo.bedAlive = false;
          tinfo.bedMesh.visible = false;
          this.onBedDestroyed(tkey, null);
          this.showMessage(`${tinfo.name} 的床被毒圈吞没并自动销毁！`, '#ff4444');
        }
      }
      // 第 35 分钟按存活人数判定胜负
      if (this.gameTime > 2100) {
        this.endGameByShrink();
      }
    }

    // Local input
    if (this.localPlayer && !this.localPlayer.isDead && !this.roleSelectionActive) {
      const move = this.input.getMovement();
      this.localPlayer.moveInput(move.x, move.z, this.input.isDown('ShiftLeft'));
      const look = this.input.getLook();
      this.localPlayer.look(look.dx, look.dy);
      // Scroll hotbar
      const scroll = this.input.getHotbarScroll();
      if (scroll !== 0) {
        this.localPlayer.setHotbarIndex((this.localPlayer.hotbarIndex + scroll + 8) % 8);
      }
      if (this.input.consumeJump()) this.localPlayer.jump();
      if (this.input.consumeAction()) this.performMobileAction();
      if (this.input.consumeAttack()) {
        if (!this.tryOpenFriendlyBlockPanel()) this.localPlayer.attack();
      }
      const heldItem = this.localPlayer.getSelectedItem();
      const heldInfo = heldItem ? ITEM_DB[heldItem.key] : null;
      const canHandBreakByMobile = this.input.isActionHeld() && heldInfo?.type !== 'block' && heldInfo?.type !== 'special';
      if (this.input.isAttackHeld() || canHandBreakByMobile) {
        this.localPlayer.updateHandBreak(dt, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      }
      const buildPointer = this.input.consumeBuild();
      if (buildPointer) {
        if (this.movingBlockKey) {
          this.placeMovedBlock(buildPointer);
        } else {
          const selectedItem = this.localPlayer.getSelectedItem();
          const selectedInfo = selectedItem ? ITEM_DB[selectedItem.key] : null;
          if (selectedItem?.key === 'teleport_coin') {
            this.localPlayer.teleportCoinCharge = Math.max(0.5, this.localPlayer.teleportCoinCharge || 0);
          } else if (selectedInfo?.type === 'special') {
            this.localPlayer.useHotbarItem();
          } else if (selectedInfo?.type === 'weapon') {
            this.localPlayer.useHotbarItem();
          } else {
            this.localPlayer.placeBlock(buildPointer);
          }
        }
      }
      // 传送硬币蓄力与释放
      if (this.localPlayer.teleportCoinCharge > 0) {
        if (this.input.isBuildHeld()) {
          this.localPlayer.teleportCoinCharge = Math.min(40, this.localPlayer.teleportCoinCharge + dt * 8);
        } else {
          // 释放硬币
          this.localPlayer.throwTeleportCoin();
          this.localPlayer.teleportCoinCharge = 0;
        }
      }
      if (this.input.consumeSkill()) this.localPlayer.useSkill();
      if (this.input.consumeDrop()) this.localPlayer.dropSelectedItem();
      if (this.input.consumeBackpack()) this.toggleBackpack();
      // 按F装填最近陷阱的箭矢
      if (this.input.isDown('KeyF') && this.localPlayer.arrowCount > 0) {
        this.input.keys['KeyF'] = false;
        this.loadNearestTrap();
      }
    }

    // Resource generators spawn drop items instead of direct collection
    for (const g of this.gens) {
      if (g.active === false) continue;
      g.timer += dt;
      if (g.timer >= g.spawnSec) {
        g.timer = 0;
        g.ready = true;
        // Visual pulse
        g.mesh.scale.set(1.2, 1.2, 1.2);
        setTimeout(() => { if(g.mesh) g.mesh.scale.set(1,1,1); }, 200);
        // Spawn currency drop item
        const resKey = g.type === 'COPPER' ? 'copper' : g.type === 'SILVER' ? 'silver' : g.type === 'GOLD' ? 'gold' : 'jade';
        const dropPos = g.pos.clone();
        dropPos.x += (Math.random() - 0.5) * 2;
        dropPos.z += (Math.random() - 0.5) * 2;
        this.engine.spawnCurrencyDrop(dropPos, resKey, 1);
      }
    }

    // AI Controller update (三层架构：战略+战术+执行)
    AIManager.updateAll(dt, this.gameTime);

    // Engine update
    this.social?.update?.(dt);
    this.engine.update(dt);
    this.engine.render();

    // UI
    this.ui.update();

    // Update shop if open and dirty
    if (this.ui.shopOpen && this.shopDirty) {
      this.ui.buildShop();
      this.shopDirty = false;
    }

    // Admin data reporting
    this.matchSnapshotTimer -= dt;
    if (this.matchSnapshotTimer <= 0) {
      this.matchSnapshotTimer = 5;
      this.reportMatchSnapshot();
    }
    this.economyLogTimer -= dt;
    if (this.economyLogTimer <= 0) {
      this.economyLogTimer = 30;
      this.reportEconomyStats();
    }
  }

  selectHotbar(idx) {
    if (this.localPlayer) {
      this.localPlayer.setHotbarIndex(idx);
    }
  }

  performMobileAction() {
    const lp = this.localPlayer;
    if (!lp || lp.isDead) return;
    if (this.movingBlockKey) {
      this.placeMovedBlock({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      return;
    }
    const item = lp.getSelectedItem();
    const info = item ? ITEM_DB[item.key] : null;
    if (!item || !info) {
      if (this.tryOpenFriendlyBlockPanel()) return;
      lp.attack();
      return;
    }
    if (info.type === 'block') {
      const touchPt = this.input.lastTouchAction;
      lp.placeBlock({ x: touchPt.x, y: touchPt.y }, true);
      return;
    }
    if (info.type === 'weapon') {
      lp.attack();
      return;
    }
    lp.useHotbarItem();
  }

  getLookedBlock(maxDist = 6) {
    if (!this.localPlayer) return null;
    return this.engine.raycastBlocks(
      this.localPlayer.pos.clone().add(new THREE.Vector3(0, 0.7, 0)),
      this.localPlayer.getForwardDir(),
      maxDist
    );
  }

  tryOpenFriendlyBlockPanel() {
    const lp = this.localPlayer;
    const rc = this.getLookedBlock(6);
    if (!lp || !rc.hit || !rc.block || rc.block.type === 'ground') return false;
    if (rc.block.team !== lp.team) return false;
    this.selectedBlockKey = rc.key;
    const panel = document.getElementById('buildPanel');
    const hp = document.getElementById('buildHpText');
    const info = ITEM_DB[rc.block.type];
    if (hp) hp.textContent = `${info?.name || '建筑'} 血量：${Math.ceil(rc.block.hp)}/${rc.block.maxHp}`;
    if (panel) panel.style.display = 'block';
    if (document.pointerLockElement) document.exitPointerLock();
    return true;
  }

  closeBuildPanel() {
    const panel = document.getElementById('buildPanel');
    if (panel) panel.style.display = 'none';
  }

  nextBlockUpgrade(type) {
    const order = ['wood_plank','stone_plate','iron_plate','titanium'];
    const idx = order.indexOf(type);
    if (idx < 0 || idx >= order.length - 1) return null;
    return order[idx + 1];
  }

  upgradeSelectedBlock() {
    const lp = this.localPlayer;
    const blk = this.engine.blocks.get(this.selectedBlockKey);
    if (!lp || !blk || blk.team !== lp.team) return;
    const next = this.nextBlockUpgrade(blk.type);
    if (!next) return this.showMessage('该建筑已是最高等级', '#ffdd00');
    const cost = ITEM_DB[next].cost || {};
    for (const [k, v] of Object.entries(cost)) {
      if ((lp.inv[k] || 0) < v) return this.showMessage(`升级需要 ${v}${RES[k.toUpperCase()]?.name || k}`, '#ff5555');
    }
    for (const [k, v] of Object.entries(cost)) lp.inv[k] -= v;
    this.engine.replaceBlockType(this.selectedBlockKey, next, lp.role === 'STEEL_BONE' ? 1.2 + (lp.steelBuildBonus || 0) : 1);
    this.showMessage(`建筑已升级为${ITEM_DB[next].name}`, '#8be9fd');
    this.closeBuildPanel();
  }

  destroySelectedBlock() {
    const blk = this.engine.blocks.get(this.selectedBlockKey);
    if (!blk || blk.team !== this.localPlayer?.team) return;
    if (['iron_plate','titanium','blast_glass'].includes(blk.type) && !confirm('这是高等级建筑，确定要拆毁吗？')) return;
    const [x, y, z] = this.selectedBlockKey.split(',').map(Number);
    this.engine.removeBlock(x, y, z);
    this.showMessage('建筑已拆毁', '#ffdd00');
    this.closeBuildPanel();
  }

  prepareMoveSelectedBlock() {
    const blk = this.engine.blocks.get(this.selectedBlockKey);
    if (!blk || blk.team !== this.localPlayer?.team) return;
    this.movingBlockKey = this.selectedBlockKey;
    this.closeBuildPanel();
    this.showMessage('请选择新位置，右键/建造键放置，不消耗货币', '#8be9fd');
  }

  placeMovedBlock(pointer) {
    const lp = this.localPlayer;
    const rc = this.engine.raycastPlacement(pointer?.x, pointer?.y, 6);
    if (!lp || !rc.hit) return;
    const center = new THREE.Vector3(rc.x + 0.5, rc.y + 0.5, rc.z + 0.5);
    if (center.distanceTo(lp.pos) > 6.5) return;
    if (this.engine.moveBlock(this.movingBlockKey, rc.x, rc.y, rc.z)) {
      this.showMessage('建筑已移动', '#8be9fd');
      this.movingBlockKey = null;
      this.selectedBlockKey = null;
    } else {
      this.showMessage('目标位置已有建筑，无法移动', '#ff5555');
    }
  }

  toggleBackpack() {
    const panel = document.getElementById('backpackPanel');
    if (!panel) return;
    const showing = panel.style.display === 'flex';
    panel.style.display = showing ? 'none' : 'flex';
    if (!showing) this.ui.updateBackpack();
    if (!showing && document.pointerLockElement) document.exitPointerLock();
    else if (showing && !this.input.isMobile()) this.engine.renderer.domElement.requestPointerLock();
  }

  toggleShop() {
    this.ui.shopOpen = !this.ui.shopOpen;
    this.shopDirty = true;
    const panel = document.getElementById('shopPanel');
    if (panel) panel.style.display = this.ui.shopOpen ? 'flex' : 'none';
    if (this.ui.shopOpen) this.ui.buildShop();
    // Release pointer
    if (this.ui.shopOpen && document.pointerLockElement) {
      document.exitPointerLock();
    } else if (!this.ui.shopOpen && !this.input.isMobile()) {
      this.engine.renderer.domElement.requestPointerLock();
    }
  }

  toggleGrowthPanel() {
    this.growthPanelOpen = !this.growthPanelOpen;
    const panel = document.getElementById('growthPanel');
    if (panel) panel.style.display = this.growthPanelOpen ? 'flex' : 'none';
    if (this.growthPanelOpen) {
      this.ui.renderGrowthCenter();
      if (document.pointerLockElement) document.exitPointerLock();
    } else if (!this.input.isMobile()) {
      this.engine.renderer.domElement.requestPointerLock();
    }
  }

  buyItem(key) {
    const lp = this.localPlayer;
    if (!lp) return;
    const item = ITEM_DB[key];
    if (!item) return;

    // Check cost
    const cost = {};
    if (item.cost.copper) cost.copper = item.cost.copper;
    if (item.cost.silver) cost.silver = item.cost.silver;
    if (item.cost.gold) cost.gold = item.cost.gold;
    if (item.cost.jade) cost.jade = item.cost.jade;

    for (const [rk, rv] of Object.entries(cost)) {
      if ((lp.inv[rk] || 0) < rv) return;
    }
    for (const [rk, rv] of Object.entries(cost)) {
      lp.inv[rk] -= rv;
    }

    lp.addToBackpack(key, item.count || 1);
    this.network?.logEconomy?.(lp.playerId, 'buy_item', Object.keys(cost)[0], -Object.values(cost)[0], key, lp.pos, Math.floor(this.gameTime));
    if (item.type === 'weapon' || item.type === 'armor') {
      lp.equip(key);
    }
    this.shopDirty = true;
  }

  loadNearestTrap() {
    const lp = this.localPlayer;
    if (!lp || lp.arrowCount <= 0) return;
    let nearest = null, nearestDist = 3;
    for (const trap of this.engine.trapDevices) {
      if (!trap.active) continue;
      if (trap.team !== lp.team) continue;
      if (trap.arrows >= trap.maxArrows) continue;
      const dist = lp.pos.distanceTo(trap.pos);
      if (dist < nearestDist) { nearestDist = dist; nearest = trap; }
    }
    if (nearest) {
      const loaded = this.engine.loadTrapArrows(nearest, Math.min(lp.arrowCount, nearest.maxArrows - nearest.arrows));
      lp.arrowCount -= loaded;
      this.showMessage(`已装填 ${loaded} 支箭矢到追踪装置（剩余 ${nearest.arrows}/${nearest.maxArrows}）`, '#8be9fd');
    }
  }

  onPlayerKilled(victim, killer) {
    let msg = '';
    if (killer) {
      msg = `${killer.name} 消灭了 ${victim.name}`;
    } else {
      msg = `${victim.name} 坠入了虚空`;
    }
    this.addKillFeed(msg);
    // Kill replay log
    this.network?.roomNet?.client?.from('kill_replay_events').insert({
      room_id: this.network?.roomNet?.room?.id || 'local',
      match_tick: Math.floor(this.gameTime),
      event_type: 'player_killed',
      actor_id: killer?.playerId || null,
      target_id: victim.playerId,
      details: { victimHp: victim.hp, victimArmor: victim.armor, killerWeapon: killer?.equipped?.weapon || null }
    }).catch(()=>{});
    if (this.network?.sendPlayerKilled) {
      this.network.sendPlayerKilled(victim.playerId || victim.name, killer?.playerId || killer?.name || null);
    }
    this.checkWinCondition();
  }

  onBedDestroyed(teamKey, destroyer) {
    const t = TEAMS[teamKey];
    let msg = `${t.name}的床被摧毁了！`;
    if (destroyer) msg = `${destroyer.name} 摧毁了 ${t.name}的床！`;
    this.showMessage(msg, t.hex);
    this.addKillFeed(msg);
    if (this.network?.sendBedDestroyed) {
      this.network.sendBedDestroyed(teamKey, destroyer?.playerId || destroyer?.name || null);
    }
    this.checkWinCondition();
  }

  checkWinCondition() {
    const aliveTeams = [];
    for (const [tkey, tinfo] of Object.entries(TEAMS)) {
      const hasBed = tinfo.bedAlive;
      const hasAlive = this.players.some(p => p.team === tkey && !p.isDead);
      if (hasBed || hasAlive) aliveTeams.push(tkey);
    }
    if (aliveTeams.length <= 1) {
      const winner = aliveTeams[0];
      this.endGame(winner ? TEAMS[winner].name : '无');
    }
  }

  endGameByShrink() {
    // Count alive players per team
    const counts = {};
    for (const p of this.players) {
      if (!p.isDead) counts[p.team] = (counts[p.team] || 0) + 1;
    }
    let bestTeam = null, bestCount = -1;
    for (const [t, c] of Object.entries(counts)) {
      if (c > bestCount) { bestCount = c; bestTeam = t; }
    }
    this.endGame(bestTeam ? TEAMS[bestTeam].name : '无');
  }

  endGame(winnerName) {
    this.gameActive = false;
    if (this.network?.roomNet?.setRoomStatus) {
      this.network.roomNet.setRoomStatus('ended').catch(console.warn);
    }
    if (this.network?.sendGameOver) {
      this.network.sendGameOver(winnerName).catch(console.warn);
    }
    if (document.pointerLockElement) document.exitPointerLock();
    this.social?.showPostMatchGallery?.(winnerName);
    const screen = document.getElementById('gameOverScreen');
    screen.style.display = 'flex';
    screen.querySelector('h1').textContent = winnerName === '无' ? '平局！' : '游戏结束！';
    screen.querySelector('.winner').textContent = winnerName === '无' ? '所有队伍都覆灭了' : `胜利者: ${winnerName}`;

    const lp = this.localPlayer;
    const stats = screen.querySelector('.stats');
    stats.innerHTML = '';
    const growthResult = this.growth?.settlement?.(winnerName);
    const passResult = window.seasonPass?.addMatchSettlement?.(lp?.matchStats || {}, winnerName === lp?.teamInfo?.name, false);
    // 反作弊：AI对局经验减半
    const aiKillRatio = Math.min(1, (lp?.matchStats?.kills || 0) / Math.max(1, this.players.length - 1));
    const xpMult = 1 - aiKillRatio * (1 - AI_CONFIG.XP_REDUCTION);
    const rows = [
      ['存活时间', `${Math.floor(this.gameTime / 60)}分${Math.floor(this.gameTime % 60)}秒`],
      ['最终生命', `${Math.ceil(lp?.hp || 0)}/${lp?.maxHp || 0}`],
      ['本局等级', `Lv.${lp?.matchLevel || 1} / 8`],
      ['本局表现', `击杀:${lp?.matchStats.kills || 0} 拆床:${lp?.matchStats.beds || 0} 建造:${lp?.matchStats.blocksPlaced || 0}`],
      ['持有资源', `铜:${Math.floor(lp?.inv.copper||0)} 银:${Math.floor(lp?.inv.silver||0)} 金:${Math.floor(lp?.inv.gold||0)}`],
      ['筑梦星尘', `+${growthResult?.stardust || 0}`],
      ['排位变化', `${growthResult?.rankDelta >= 0 ? '+' : ''}${growthResult?.rankDelta || 0}（${growthResult?.rankName || '沉睡梦游者'}）`],
      ['赛季积分', `${growthResult?.seasonXp || 0}`],
      ['手册经验', `+${passResult?.xp || 0}${passResult?.capped ? '（对局经验周上限）' : ''}`],
      ['赛季券', `+${passResult?.coupons || 0}`]
    ];
    for (const [label, val] of rows) {
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = `<span>${label}</span><span>${val}</span>`;
      stats.appendChild(row);
    }
  }

  showMessage(text, color = '#fff') {
    const container = document.getElementById('gameMessages');
    const div = document.createElement('div');
    div.className = 'game-msg';
    div.textContent = text;
    div.style.color = color;
    container.appendChild(div);
    setTimeout(() => div.remove(), 3500);
  }

  addKillFeed(text) {
    const container = document.getElementById('killFeed');
    const div = document.createElement('div');
    div.className = 'kill-msg';
    div.textContent = text;
    container.appendChild(div);
    setTimeout(() => div.remove(), 6000);
    if (container.children.length > 6) container.removeChild(container.firstChild);
  }

  getNetworkState() {
    return {
      tick: this.tick,
      gameTime: this.gameTime,
      shrinkActive: this.shrinkActive,
      shrinkRadius: this.shrinkRadius,
      teams: Object.fromEntries(Object.entries(TEAMS).map(([key, team]) => [key, { bedAlive: team.bedAlive }])),
      players: this.players.map(p => ({
        name: p.name,
        team: p.team,
        role: p.role,
        isLocal: p.isLocal,
        hp: Math.max(0, Math.round(p.hp)),
        armor: p.armor,
        isDead: p.isDead,
        pos: { x: Number(p.pos.x.toFixed(2)), y: Number(p.pos.y.toFixed(2)), z: Number(p.pos.z.toFixed(2)) },
        yaw: Number(p.yaw.toFixed(3)),
        inv: p.inv,
        blocks: p.blocks,
        weapon: p.equipped.weapon,
        armorItem: p.equipped.armor
      })),
      blocks: Array.from(this.engine.blocks.entries())
        .filter(([, b]) => b.type !== 'ground')
        .slice(-300)
        .map(([key, b]) => ({ key, type: b.type, hp: b.hp, team: b.team || null }))
    };
  }

  reportMatchSnapshot() {
    const alive = { RED: 0, BLUE: 0, GREEN: 0, YELLOW: 0 };
    for (const p of this.players) if (!p.isDead) alive[p.team]++;
    const snapshot = {
      room_id: this.network?.roomNet?.room?.id || 'local',
      match_code: this.network?.roomNet?.room?.code || 'LOCAL',
      status: this.gameActive ? 'playing' : 'ended',
      team_red_alive: alive.RED,
      team_blue_alive: alive.BLUE,
      team_green_alive: alive.GREEN,
      team_yellow_alive: alive.YELLOW,
      red_bed_alive: TEAMS.RED.bedAlive,
      blue_bed_alive: TEAMS.BLUE.bedAlive,
      green_bed_alive: TEAMS.GREEN.bedAlive,
      yellow_bed_alive: TEAMS.YELLOW.bedAlive,
      tick: Math.floor(this.gameTime),
      updated_at: new Date().toISOString()
    };
    this.network?.roomNet?.client?.from('active_matches').upsert(snapshot, { onConflict: 'room_id' }).catch(()=>{});
  }

  reportEconomyStats() {
    const hourKey = new Date().toISOString().slice(0, 13);
    let copper = 0, silver = 0, gold = 0, jade = 0;
    for (const p of this.players) {
      copper += p.inv.copper || 0;
      silver += p.inv.silver || 0;
      gold += p.inv.gold || 0;
      jade += p.inv.jade || 0;
    }
    const stats = {
      hour_key: hourKey,
      copper_total: copper,
      silver_total: silver,
      gold_total: gold,
      jade_total: jade,
      match_count: 1,
      player_count: this.players.length
    };
    this.network?.roomNet?.client?.from('economy_stats').upsert(stats, { onConflict: 'hour_key' }).catch(()=>{});
  }

  reportCheat(playerId, type, details, severity) {
    const alert = {
      player_id: playerId,
      room_id: this.network?.roomNet?.room?.id || 'local',
      alert_type: type,
      severity,
      details,
      tick: Math.floor(this.gameTime),
      pos_x: this.localPlayer?.pos?.x || 0,
      pos_y: this.localPlayer?.pos?.y || 0,
      pos_z: this.localPlayer?.pos?.z || 0
    };
    this.network?.roomNet?.client?.from('cheat_alerts').insert(alert).catch(()=>{});
  }

  async subscribeAdminCommands() {
    if (!this.network?.roomNet?.client) return;
    const client = this.network.roomNet.client;
    this.adminCommandSub = client.channel('admin_broadcast')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_events', filter: "room_id=eq.broadcast" }, payload => {
        const evt = payload.new;
        if (evt.event_type === 'admin_command') this.handleAdminCommand(evt.event_data);
      })
      .subscribe();
  }

  handleAdminCommand(data) {
    const cmd = data.cmd;
    if (cmd === 'force_shrink') {
      this.shrinkActive = true; this.shrinkRadius = 30; this.showMessage('管理员触发缩圈！', '#ff4444');
    } else if (cmd === 'force_final') {
      this.shrinkActive = true; this.shrinkRadius = 5; this.showMessage('胜利之炉已激活！', '#ff4444');
    } else if (cmd === 'force_tide') {
      this.engine.triggerDreamTide?.(this.gens);
      this.showMessage('管理员触发梦域潮汐！', '#00d4ff');
    } else if (cmd === 'force_time') {
      this.gameTime = (data.minutes || 0) * 60;
      this.showMessage(`时间已调整至 ${data.minutes} 分钟`, '#ffdd00');
    } else if (cmd === 'send_gift' && data.player === this.localPlayer?.playerId) {
      this.localPlayer?.addToBackpack?.(data.item, data.count);
      this.showMessage(`收到管理员补给: ${data.item} x${data.count}`, '#00d4ff');
    } else if (cmd === 'ai_takeover') {
      const p = this.players.find(x => x.playerId === data.player);
      if (p) p.aiTakeover = data.enable;
    }
  }
}
