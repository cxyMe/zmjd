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
    this.buttons = { jump: false, attack: false, attackHeld: false, build: false, skill: false, skillHeld: false, action: false, actionHeld: false };
    this.lookSensitivity = parseFloat(localStorage.getItem('bedwars_look_sensitivity')) || 1.8;
    this.lastTouchAction = { x: 0, y: 0 };

    // Keyboard
    document.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','Tab'].includes(e.code)) e.preventDefault();
    });
    document.addEventListener('keyup', e => {
      this.keys[e.code] = false;
      if (e.code === 'KeyQ') this.buttons.skill = true;
    });

    // Mouse
    document.addEventListener('mousemove', e => {
      if (document.pointerLockElement) {
        this.mouse.dx += e.movementX;
        this.mouse.dy += e.movementY;
      }
    });
    document.addEventListener('mousedown', e => {
      if (e.target.closest?.('#mobileControls, #shopBtn, #layoutBtn, #skillBtn, #rescueBtn, #hotbar, #resourceBar, #playerStatus, #teamInfo, #minimap, #shopPanel, #backpackPanel, #growthPanel, #layoutPanel, #socialPanel, #markWheel, #teamChestPanel, #startRolePanel, #buildPanel, #timedAction')) return;
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

    const isGameUiTarget = (target) => target.closest?.('#mobileControls, #shopBtn, #layoutBtn, #skillBtn, #rescueBtn, #hotbar, #resourceBar, #playerStatus, #teamInfo, #minimap, #shopPanel, #backpackPanel, #growthPanel, #layoutPanel, #socialPanel, #markWheel, #teamChestPanel, #startRolePanel');
    document.addEventListener('touchstart', e => {
      if (!window.game?.gameActive || !this.isMobile()) return;
      if (isGameUiTarget(e.target)) return;
      const t = e.changedTouches[0];
      const lp = window.game.localPlayer;
      const item = lp?.getSelectedItem();
      const info = item ? ITEM_DB[item.key] : null;
      if (info?.type === 'block') {
        lp.placeBlock({ x: t.clientX, y: t.clientY }, true);
      } else {
        const rc = window.game.engine.raycastPlacement(t.clientX, t.clientY, 5);
        if (rc.hit && rc.baseKey) {
          const blk = window.game.engine.blocks.get(rc.baseKey);
          if (blk && blk.type !== 'ground') {
            window.game.selectedBlockKey = rc.baseKey;
            const panel = document.getElementById('buildPanel');
            const hpText = document.getElementById('buildHpText');
            const blockInfo = ITEM_DB[blk.type];
            if (hpText) hpText.textContent = `${blockInfo?.name || '建筑'} 血量：${Math.ceil(blk.hp)}/${blk.maxHp}`;
            if (panel) panel.style.display = 'block';
            if (document.pointerLockElement) document.exitPointerLock();
          }
        }
      }
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
      const maxR = 50;
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
    // Skill button with hold support
    const skillBtn = document.getElementById('skillBtn');
    if (skillBtn) {
      skillBtn.addEventListener('touchstart', e => { e.preventDefault(); const t = e.touches[0]; this.lastTouchAction.x = t.clientX; this.lastTouchAction.y = t.clientY; this.buttons.skillHeld = true; });
      skillBtn.addEventListener('touchend', e => { e.preventDefault(); this.buttons.skillHeld = false; this.buttons.skill = true; });
      skillBtn.addEventListener('touchcancel', e => { e.preventDefault(); this.buttons.skillHeld = false; });
      skillBtn.addEventListener('mousedown', e => { e.preventDefault(); this.buttons.skillHeld = true; });
      skillBtn.addEventListener('mouseup', e => { e.preventDefault(); this.buttons.skillHeld = false; this.buttons.skill = true; });
      skillBtn.addEventListener('mouseleave', e => { if (this.buttons.skillHeld) { this.buttons.skillHeld = false; this.buttons.skill = true; } });
    }

    // 移动端视角缩放
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomThumb = document.getElementById('zoomThumb');
    if (zoomSlider && zoomThumb) {
      let zoomTouch = { active: false, id: null, startY: 0, startFov: 70 };
      zoomSlider.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t = e.changedTouches[0];
        zoomTouch.active = true;
        zoomTouch.id = t.identifier;
        zoomTouch.startY = t.clientY;
        zoomTouch.startFov = window.game?.engine?.camera?.fov || 70;
      }, { passive: false });
      zoomSlider.addEventListener('touchmove', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!zoomTouch.active) return;
        const t = Array.from(e.changedTouches).find(x => x.identifier === zoomTouch.id);
        if (!t) return;
        const dy = t.clientY - zoomTouch.startY;
        // 向上滑=放大(fov减小)，向下滑=缩小(fov增大)
        const fov = Math.max(40, Math.min(90, zoomTouch.startFov - dy * 0.3));
        const cam = window.game?.engine?.camera;
        if (cam) { cam.fov = fov; cam.updateProjectionMatrix(); }
        const pct = ((90 - fov) / 50) * 100;
        zoomThumb.style.top = `${50 - pct * 0.5}%`;
      }, { passive: false });
      const endZoom = (e) => { zoomTouch.active = false; };
      zoomSlider.addEventListener('touchend', endZoom);
      zoomSlider.addEventListener('touchcancel', endZoom);
    }
  }

  getMovement() {
    if (this.isMobile() && this.joystick.active) {
      const joyMult = 1.3; // 移动端摇杆灵敏度加成
      return { x: this.joystick.dx * joyMult, z: -this.joystick.dy * joyMult };
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
  consumeSkill() { const v = this.buttons.skill; this.buttons.skill = false; return v; }
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
    this.bigMapOpen = false;
    this._minimapClickBound = this._onMinimapClick.bind(this);
    const minimap = document.getElementById('minimap');
    if (minimap) minimap.addEventListener('click', this._minimapClickBound);
    const bigMapClose = document.getElementById('bigMapCloseBtn');
    if (bigMapClose) bigMapClose.addEventListener('click', () => this.toggleBigMap(false));
  }

  _onMinimapClick() {
    this.toggleBigMap(true);
  }

  toggleBigMap(show) {
    this.bigMapOpen = show;
    const panel = document.getElementById('bigMapPanel');
    if (panel) panel.style.display = show ? 'flex' : 'none';
    if (show) this.drawBigMap();
    if (show && document.pointerLockElement) document.exitPointerLock();
    else if (!show && window.game?.gameActive && !window.game?.input?.isMobile?.()) {
      window.game.engine.renderer.domElement.requestPointerLock();
    }
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

    // 弓蓄力显示
    const bowIndicator = document.getElementById('bowCharge');
    if (bowIndicator) {
      if (lp.bowCharge > 0) {
        const pct = Math.min(100, Math.round((lp.bowCharge / 4) * 100));
        const dist = Math.round(4 + lp.bowCharge * 3);
        bowIndicator.textContent = `蓄力 ${pct}% | 射程 ${dist}格`;
        bowIndicator.style.display = 'block';
      } else {
        bowIndicator.style.display = 'none';
      }
    }

    // 探测仪 HUD
    const detectorHud = document.getElementById('detectorHud');
    if (detectorHud) {
      if (lp.detectorEnemyCount > 0) {
        detectorHud.textContent = `探测仪: 附近 ${lp.detectorEnemyCount} 名敌人`;
        detectorHud.style.display = 'block';
      } else {
        detectorHud.style.display = 'none';
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
      if (lp.jetpackTimer > 0) effects.push(`<span class="eff-jetpack">喷气 ${lp.jetpackTimer.toFixed(1)}s</span>`);
      if (lp.frostTimer > 0 || lp.rootTimer > 0) effects.push(`<span class="eff-frozen">冰冻 ${Math.max(lp.frostTimer||0, lp.rootTimer||0).toFixed(1)}s</span>`);
      const camoOverlay = document.getElementById('camoOverlay');
      if (camoOverlay) {
        if (lp.camouflageTimer > 0) {
          camoOverlay.style.display = 'block';
          document.getElementById('camoTime').textContent = lp.camouflageTimer.toFixed(1);
        } else {
          camoOverlay.style.display = 'none';
        }
      }
      // 高能人悬浮时间HUD
      const jetpackOverlay = document.getElementById('jetpackOverlay');
      if (jetpackOverlay) {
        if (lp.jetpackTimer > 0) {
          jetpackOverlay.style.display = 'block';
          document.getElementById('jetpackTime').textContent = lp.jetpackTimer.toFixed(1);
        } else {
          jetpackOverlay.style.display = 'none';
        }
      }
      // 冰冻状态HUD
      const frostOverlay = document.getElementById('frostOverlay');
      if (frostOverlay) {
        if (lp.frostTimer > 0 || lp.rootTimer > 0) {
          frostOverlay.style.display = 'block';
          document.getElementById('frostTime').textContent = Math.max(lp.frostTimer || 0, lp.rootTimer || 0).toFixed(1);
          // 冰冻边框效果
          const hud = document.getElementById('hud');
          if (hud) hud.classList.add('frozen-state');
        } else {
          frostOverlay.style.display = 'none';
          const hud = document.getElementById('hud');
          if (hud) hud.classList.remove('frozen-state');
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

    // Players (只显示自己和队友)
    const lpTeam = this.game.localPlayer?.team;
    for (const p of this.game.players) {
      if (p.isDead) continue;
      if (p.team !== lpTeam) continue;
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

  drawBigMap() {
    const canvas = document.getElementById('bigMapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;
    const scale = Math.min(w, h) / 300;

    // Islands
    ctx.fillStyle = 'rgba(100,150,100,0.6)';
    const islandR = 16 * scale;
    ctx.fillRect(cx - 120 * scale, cy - 120 * scale, islandR, islandR);
    ctx.fillRect(cx + 108 * scale, cy - 120 * scale, islandR, islandR);
    ctx.fillRect(cx - 120 * scale, cy + 108 * scale, islandR, islandR);
    ctx.fillRect(cx + 108 * scale, cy + 108 * scale, islandR, islandR);
    ctx.fillStyle = 'rgba(80,120,80,0.7)';
    ctx.fillRect(cx - 26 * scale, cy - 26 * scale, 52 * scale, 52 * scale);

    // Beds
    for (const [key, t] of Object.entries(TEAMS)) {
      if (!t.bedAlive) continue;
      const bx = cx + (t.spawn.x / 140) * w * 0.5;
      const by = cy + (t.spawn.z / 140) * h * 0.5;
      ctx.fillStyle = t.hex;
      ctx.fillRect(bx - 8, by - 6, 16, 12);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx - 8, by - 6, 16, 12);
    }

    // Players (只显示自己和队友)
    const localTeam = this.game.localPlayer?.team;
    for (const p of this.game.players) {
      if (p.isDead) continue;
      if (p.team !== localTeam) continue;
      const px = cx + (p.pos.x / 140) * w * 0.5;
      const py = cy + (p.pos.z / 140) * h * 0.5;
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(px, py, p.isLocal ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
      if (p.isLocal) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.name || '', px, py - 10);
    }

    // Shrink boundary
    if (this.game.shrinkActive) {
      const r = (this.game.shrinkRadius / 140) * w * 0.5;
      ctx.strokeStyle = 'rgba(255,0,0,0.6)';
      ctx.lineWidth = 3;
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
    if (this.game.growthTab === 'mastery') return this.renderMasteryPanel(body, gm);
    if (this.game.growthTab === 'season') return this.renderSeasonPanel(body, gm);
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
      specials: ['tnt','handmade_tnt','military_c4','mini_nuke','repair_drone','bandage','medkit','surgery_station','trap_device','bear_trap','sensor_mine','portal','potion','revival_gold','teleport_coin','cd_potion','speed_potion','burst_potion','detector']
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
      if (canAfford) {
        const buyBtn = document.createElement('div');
        buyBtn.className = 'shop-buy-controls';
        buyBtn.innerHTML = `<button class="shop-buy-1" data-key="${key}">x1</button><button class="shop-buy-max" data-key="${key}">最多</button>`;
        div.appendChild(buyBtn);
        div.onclick = (e) => {
          const btn = e.target.closest('[data-key]');
          if (!btn) return;
          const k = btn.dataset.key;
          if (btn.classList.contains('shop-buy-max')) {
            // 计算最大可购买数量
            const it = ITEM_DB[k];
            let maxCount = Infinity;
            if (it.cost.copper) maxCount = Math.min(maxCount, Math.floor((lp.inv.copper || 0) / it.cost.copper));
            if (it.cost.silver) maxCount = Math.min(maxCount, Math.floor((lp.inv.silver || 0) / it.cost.silver));
            if (it.cost.gold) maxCount = Math.min(maxCount, Math.floor((lp.inv.gold || 0) / it.cost.gold));
            if (it.cost.jade) maxCount = Math.min(maxCount, Math.floor((lp.inv.jade || 0) / it.cost.jade));
            if (maxCount > 0 && isFinite(maxCount)) this.game.buyItem(k, maxCount);
          } else {
            this.game.buyItem(k, 1);
          }
        };
      }
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
    this.shrinkStartTime = GAME_RULES.shrinkStartTime;
    this.shrinkTimer = this.shrinkStartTime;
    this.shrinkActive = false;
    this.shrinkInitialRadius = GAME_RULES.shrinkInitialRadius;
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
    this.growthTab = 'mastery';
    this.roleSelectionActive = false;
    this.roleSelectionTimer = 0;
    this.roleChosen = false;
    this.selectedBlockKey = null;
    this.movingBlockKey = null;
    this.selectedMap = 'classic';
    this.isSecretKiller = false;
    this.skState = 'waiting'; // waiting, countdown, playing, ended
    this.skCountdown = 0;
    this.skRoles = {}; // playerId -> 'killer'/'detective'/'civilian'
    this.skFragmentTimer = 0;
    this.skFragmentPoints = [];
    this.skTimeLimit = GAME_RULES.skTimeLimit;
    this.skRoleRevealed = false;
    this.genLabels = [];
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
    document.getElementById('rescueBtn').onclick = () => this.social?.rescueVoidMate();
    document.querySelectorAll('.growth-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.growth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.growthTab = tab.dataset.growthTab;
        this.ui.renderGrowthCenter();
      };
    });
    // Skill button onclick removed; useSkill triggered via consumeSkill in loop
    document.getElementById('buildUpgradeBtn')?.addEventListener('click', () => this.upgradeSelectedBlock());
    document.getElementById('buildDestroyBtn')?.addEventListener('click', () => this.destroySelectedBlock());
    document.getElementById('buildMoveBtn')?.addEventListener('click', () => this.prepareMoveSelectedBlock());
    document.getElementById('buildCancelBtn')?.addEventListener('click', () => this.closeBuildPanel());
    document.querySelectorAll('.hotbar-slot').forEach((slot, idx) => {
      let longPressTimer = null;
      let longPressTriggered = false;

      const select = (e) => {
        if (longPressTriggered) {
          e.preventDefault();
          e.stopPropagation();
          longPressTriggered = false;
          return;
        }
        e.preventDefault();
        if (this.gameActive) {
          // 密室杀手：杀手点击道具栏的刀即掷出
          if (this.isSecretKiller && this.localPlayer?.skRole === 'killer') {
            const item = this.localPlayer.hotbar[idx];
            if (item?.key === 'killer_knife') {
              const dir = this.localPlayer.getForwardDir();
              const start = this.localPlayer.pos.clone().add(new THREE.Vector3(0, 0.8, 0));
              this.engine.spawnWeaponProjectile(this.localPlayer, 'arrow', start, dir, {
                damage: 1000, speed: 20, life: 2.5
              });
              this.showMessage('刀已掷出！', '#ff4444');
              return;
            }
          }
          this.selectHotbar(idx);
        }
      };

      const startLongPress = () => {
        if (!this.gameActive) return;
        longPressTriggered = false;
        longPressTimer = setTimeout(() => {
          longPressTriggered = true;
          this.showSlotContextMenu(slot, idx);
        }, 800);
      };

      const cancelLongPress = () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      };

      slot.addEventListener('click', select);
      slot.addEventListener('touchstart', (e) => {
        startLongPress();
      }, { passive: false });
      slot.addEventListener('touchend', cancelLongPress);
      slot.addEventListener('touchmove', cancelLongPress);
      slot.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (this.gameActive) this.showSlotContextMenu(slot, idx);
      });
    });

    // Slot context menu actions
    document.getElementById('ctxDrop')?.addEventListener('click', () => {
      if (this.localPlayer) {
        this.localPlayer.dropSelectedItem();
        this.hideSlotContextMenu();
      }
    });
    document.getElementById('ctxSplit')?.addEventListener('click', () => this.splitSelectedItem());
    document.getElementById('ctxCancel')?.addEventListener('click', () => this.hideSlotContextMenu());

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
      // KeyQ skill handled by InputManager keyup -> consumeSkill in loop
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

  start(teamKey, roleKey, mode = 'classic') {
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

    // Secret killer mode branch
    if (mode === 'secret_killer') {
      this.isSecretKiller = true;
      this.skState = 'countdown';
      this.skCountdown = 5;
      this.skFragmentTimer = 0;
      this.skRoles = {};
      this.skRoleRevealed = false;
      // Disable shrink for this mode
      this.shrinkActive = false;
      this.shrinkTimer = 99999;

      // Create all 10 players (1 local + 9 AI)
      AIManager.MAX_AI_COUNT_SAVE = AIManager.MAX_AI_COUNT;
      AIManager.MAX_AI_COUNT = 12;

      // Local player at center
      const localId = this.onlineMode && this.network?.auth?.user?.id
        ? this.network.auth.user.id
        : 'local-' + Math.random().toString(36).slice(2, 10);
      this.localPlayer = new PlayerEntity(this.engine, 'RED', 'FOX', true, this.playerName, localId);
      this.localPlayer.pos.set(0, 1, 0);
      this.players.push(this.localPlayer);

      // Create 9 AI
      AIManager.removeAll();
      const botNames = ['Alpha','Bravo','Charlie','Delta','Echo','Foxtrot','Golf','Hotel','India'];
      let nameIdx = 0;
      for (let i = 0; i < 9; i++) {
        const spawnAngles = [0, Math.PI/2, Math.PI, Math.PI*1.5, Math.PI/4, Math.PI*3/4, Math.PI*5/4, Math.PI*7/4, Math.PI/6];
        const angle = spawnAngles[i] || Math.random() * Math.PI * 2;
        const result = AIManager.createAI(this.engine, this, 'RED', botNames[nameIdx++] || 'Bot', 'FOX');
        if (result) {
          result.entity.pos.set(Math.cos(angle) * 8, 1, Math.sin(angle) * 8);
          result.entity.inv = { copper: 0, silver: 0, gold: 0, jade: 0 };
          result.entity.maxHp = 100;
          result.entity.hp = 100;
          result.entity.baseSpeed = 5.5;
          result.entity.speed = 5.5;
          result.entity.hotbar = Array(8).fill(null);
          result.entity.backpack = Array(20).fill(null);
          result.entity.equipped = { weapon: null, armor: null };
          result.entity.arrowCount = 0;
          this.players.push(result.entity);
        }
      }

      // Hide UI elements not needed in secret killer
      document.querySelectorAll('.lobby-float-panel.open').forEach(panel => panel.classList.remove('open'));
      ['seasonPassPanel','passPayPanel','menuGrowthPanel','layoutPanel'].forEach(id => {
        const panel = document.getElementById(id);
        if (panel) panel.style.display = 'none';
      });
      document.getElementById('mainMenu').style.display = 'none';
      document.getElementById('hud').style.display = 'block';
      document.getElementById('gameOverScreen').style.display = 'none';
      document.getElementById('shopPanel').style.display = 'none';
      document.getElementById('shopBtn').style.display = 'none';
      document.getElementById('skillBtn').style.display = 'none';
      document.getElementById('resourceBar').style.display = 'none';
      document.getElementById('teamInfo').style.display = 'none';
      document.getElementById('crosshair').style.display = 'block';
      window.hudLayoutManager?.init?.();

      // Show secret killer HUD
      const skHud = document.getElementById('secretKillerHud');
      if (skHud) skHud.style.display = 'block';

      // Lock pointer
      if (!this.input.isMobile()) {
        this.engine.renderer.domElement.requestPointerLock();
      }

      return; // Skip normal start logic
    }

    // Create local player (classic mode)
    const localId = this.onlineMode && this.network?.auth?.user?.id
      ? this.network.auth.user.id
      : 'local-' + Math.random().toString(36).slice(2, 10);
    this.localPlayer = new PlayerEntity(this.engine, teamKey, roleKey, true, this.playerName, localId);
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

    // Secret Killer state machine
    if (this.isSecretKiller) {
      if (this.skState === 'countdown') {
        this.skCountdown -= dt;
        const cdEl = document.getElementById('skCountdown');
        if (cdEl) cdEl.textContent = Math.ceil(this.skCountdown);
        if (this.skCountdown <= 0) {
          this.skState = 'playing';
          this.assignSecretKillerRoles();
          if (cdEl) cdEl.style.display = 'none';
        }
        // Still render during countdown
        this.engine.render();
        return;
      }

      if (this.skState === 'playing') {
        // Fragment spawning
        this.skFragmentTimer += dt;
        if (this.skFragmentTimer >= 5) {
          this.skFragmentTimer = 0;
          this.spawnFragment();
        }

        // Time display
        const timeEl = document.getElementById('skTimeDisplay');
        if (timeEl) {
          const remaining = Math.max(0, this.skTimeLimit - this.gameTime);
          const mins = Math.floor(remaining / 60);
          const secs = Math.floor(remaining % 60);
          timeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        // Time limit check
        if (this.gameTime >= this.skTimeLimit) {
          this.endSecretKiller('good'); // Time up = good wins
          return;
        }

        // Win condition checked in checkSecretKillerWin()
        this.checkSecretKillerWin();
      }
    }

    // 梦域潮汐：每 5 分钟重排部分资源浮岛并刷新临时资源点
    if (!this.isSecretKiller && GAME_RULES.enableDreamTide && this.gameTime >= this.nextDreamTide) {
      this.nextDreamTide += GAME_RULES.dreamTideInterval;
      if (this.engine.triggerDreamTide) {
        this.engine.triggerDreamTide(this.gens);
        this.showMessage('梦域潮汐涌动：资源浮岛路线发生变化！', '#b388ff');
      }
    }

    // Shrink (classic mode only)
    if (!this.isSecretKiller && GAME_RULES.enableShrink) {
    if (this.shrinkTimer <= 0 && !this.shrinkActive) {
      this.shrinkActive = true;
      this.showMessage('警告：死亡边界开始收缩！', '#ff4444');
    }
    if (this.shrinkActive) {
      this.shrinkRadius = Math.max(GAME_RULES.shrinkFinalRadius, this.shrinkInitialRadius - (this.gameTime - this.shrinkStartTime) * GAME_RULES.shrinkSpeed);
      // Damage players outside
      for (const p of this.players) {
        if (p.isDead) continue;
        const dist = Math.sqrt(p.pos.x * p.pos.x + p.pos.z * p.pos.z);
        if (dist > this.shrinkRadius) {
          p.takeDamage(GAME_RULES.shrinkDamage * dt, null);
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
    } // end isSecretKiller check

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
        if (!this.tryOpenFriendlyBlockPanel()) {
          const weaponInfo = this.localPlayer.equipped.weapon ? ITEM_DB[this.localPlayer.equipped.weapon] : null;
          if (weaponInfo?.ranged && this.localPlayer.arrowCount > 0) {
            this.localPlayer.startBowCharge();
          } else {
            this.localPlayer.attack();
          }
        }
      }
      const heldItem = this.localPlayer.getSelectedItem();
      const heldInfo = heldItem ? ITEM_DB[heldItem.key] : null;
      const canHandBreakByMobile = this.input.isActionHeld() && heldInfo?.type !== 'block' && heldInfo?.type !== 'special';
      if (this.localPlayer.bowCharge > 0) {
        if (this.input.isAttackHeld()) {
          this.localPlayer.updateBowCharge(dt);
        } else {
          this.localPlayer.releaseBowCharge();
        }
      } else if (this.input.isAttackHeld() || canHandBreakByMobile) {
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
      // 密室杀手：右键投掷杀手刀
      if (this.isSecretKiller && this.input.isBuildHeld()) {
        this.input.buttons.build = false; // 消耗build按下
        if (this.localPlayer.skRole === 'killer') {
          const dir = this.localPlayer.getForwardDir();
          const start = this.localPlayer.pos.clone().add(new THREE.Vector3(0, 0.8, 0));
          this.engine.spawnWeaponProjectile(this.localPlayer, 'arrow', start, dir, {
            damage: 1000,
            speed: 20,
            life: 2.5
          });
          this.showMessage('刀已掷出！', '#ff4444');
        }
      }
      if (this.input.consumeBackpack()) this.toggleBackpack();
      // 按F装填最近陷阱的箭矢
      if (this.input.isDown('KeyF') && this.localPlayer.arrowCount > 0) {
        this.input.keys['KeyF'] = false;
        this.loadNearestTrap();
      }
    }

    // Secret Killer: fragment pickup & bow transfer
    if (this.isSecretKiller && this.skState === 'playing' && this.localPlayer && !this.localPlayer.isDead) {
      const lp = this.localPlayer;
      for (let i = this.engine.dropItems.length - 1; i >= 0; i--) {
        const drop = this.engine.dropItems[i];
        if (drop.pos.distanceTo(lp.pos) < 2.5) {
          if (drop.typeKey === 'fragment') {
            lp.skFragments = (lp.skFragments || 0) + drop.count;
            this.engine.removeDropItem(drop);
            const fragEl = document.getElementById('skFragmentCount');
            if (fragEl) fragEl.textContent = lp.skFragments + '/10';
            // 10 fragments = bow
            if (lp.skFragments >= 10) {
              lp.skFragments -= 10;
              if (fragEl) fragEl.textContent = lp.skFragments + '/10';
              lp.hotbar[1] = { key: 'detective_bow', count: 1 };
              lp.skRole = 'detective'; // Become detective
              lp.arrowCount = 999;
              lp.bowCdTimer = 0;
              const roleEl = document.getElementById('skRoleText');
              if (roleEl) {
                roleEl.textContent = '🏹 侦探 - 找到并击杀杀手！';
                roleEl.style.color = '#44ff44';
              }
              this.showMessage('你收集了10碎片，获得侦探之弓！', '#44ff44');
            }
          } else if (drop.typeKey === 'detective_bow') {
            // Pick up dropped detective bow
            lp.hotbar[1] = { key: 'detective_bow', count: 1 };
            this.engine.removeDropItem(drop);
            if (lp.skRole === 'civilian') {
              lp.skRole = 'detective';
              lp.arrowCount = 999;
              lp.bowCdTimer = 0;
              const roleEl = document.getElementById('skRoleText');
              if (roleEl) {
                roleEl.textContent = '🏹 侦探 - 捡起了侦探之弓，你现在是侦探！';
                roleEl.style.color = '#44ff44';
              }
              this.showMessage('你捡起了侦探之弓，成为新侦探！', '#44ff44');
            }
          }
        }
      }
    }

    // Resource generators spawn drop items instead of direct collection (classic mode only)
    if (!this.isSecretKiller) {
    for (const g of this.gens) {
      if (g.active === false) continue;
      if (g.activated !== true) {
        if (this.localPlayer) {
          const dist = this.localPlayer.pos.distanceTo(g.pos);
          if (dist < 15) {
            g.activated = true;
            if (!g.label) {
              const label = this.engine.makeTextSprite(`${g.spawnSec.toFixed(1)}s`, '#ffffff');
              label.position.copy(g.pos).add(new THREE.Vector3(0, 1.8, 0));
              this.engine.scene.add(label);
              g.label = label;
              this.genLabels.push(label);
            }
          }
        }
        continue;
      }
      g.timer += dt;
      if (g.label) {
        const remaining = Math.max(0, g.spawnSec - g.timer);
        this.engine.updateTextSprite(g.label, `${remaining.toFixed(1)}s`);
      }
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
    } // end classic resource gen check

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
    const order = GAME_RULES.blockUpgradeChain;
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

  buyItem(key, count = 1) {
    const lp = this.localPlayer;
    if (!lp) return;
    const item = ITEM_DB[key];
    if (!item) return;

    const totalCost = {};
    if (item.cost.copper) totalCost.copper = item.cost.copper * count;
    if (item.cost.silver) totalCost.silver = item.cost.silver * count;
    if (item.cost.gold) totalCost.gold = item.cost.gold * count;
    if (item.cost.jade) totalCost.jade = item.cost.jade * count;

    for (const [rk, rv] of Object.entries(totalCost)) {
      if ((lp.inv[rk] || 0) < rv) return;
    }
    for (const [rk, rv] of Object.entries(totalCost)) {
      lp.inv[rk] -= rv;
    }

    lp.addToBackpack(key, (item.count || 1) * count);
    this.network?.logEconomy?.(lp.playerId, 'buy_item', Object.keys(totalCost)[0], -Object.values(totalCost)[0], key, lp.pos, Math.floor(this.gameTime));
    if (item.type === 'weapon') {
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
    if (this.isSecretKiller) return; // 密室杀手使用 checkSecretKillerWin
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

    // MVP 计算
    let mvp = null, mvpScore = -1;
    for (const p of this.players) {
      const s = (p.matchStats?.kills || 0) * 3 + (p.matchStats?.beds || 0) * 10 + (p.matchStats?.blocksPlaced || 0);
      if (s > mvpScore) { mvpScore = s; mvp = p; }
    }
    const mvpSection = document.getElementById('mvpSection');
    if (mvp && mvpSection) {
      const winTeam = Object.entries(TEAMS).find(([k]) => TEAMS[k].name === winnerName);
      let finalMvp = mvp;
      if (winTeam) {
        let winMvpScore = -1;
        for (const p of this.players) {
          if (p.team === winTeam[0]) {
            const s = (p.matchStats?.kills || 0) * 3 + (p.matchStats?.beds || 0) * 10 + (p.matchStats?.blocksPlaced || 0);
            if (s > winMvpScore) { winMvpScore = s; finalMvp = p; }
          }
        }
      }
      mvpSection.style.display = 'block';
      document.getElementById('mvpName').textContent = finalMvp ? `${finalMvp.name} (${TEAMS[finalMvp.team]?.name || ''})` : '--';
      document.getElementById('mvpStats').textContent = finalMvp ? `击杀:${finalMvp.matchStats?.kills || 0} 拆床:${finalMvp.matchStats?.beds || 0} 建造:${finalMvp.matchStats?.blocksPlaced || 0}` : '--';
    }

    // 友方对战数据
    if (lp) {
      const allies = this.players.filter(p => p.team === lp.team && p !== lp);
      const allySection = document.getElementById('allyStatsSection');
      if (allies.length > 0 && allySection) {
        allySection.style.display = 'block';
        document.getElementById('allyStatsList').innerHTML = allies.map(a =>
          `<div class="ally-stat-row"><span>${a.name}</span><span>击杀:${a.matchStats?.kills || 0} 拆床:${a.matchStats?.beds || 0} 建筑:${a.matchStats?.blocksPlaced || 0}</span></div>`
        ).join('');
      }
    }

    // 段位变化（总段位，不按角色）
    const gm = this.growth;
    const rankScore = gm?.profile?.rankScore || 0;
    const isWinner = winnerName === (lp?.teamInfo?.name);
    const rankDelta = isWinner ? (15 + Math.floor((lp?.matchStats?.kills || 0) * 2 + (lp?.matchStats?.beds || 0) * 5)) : -10;
    const newRankScore = Math.max(0, rankScore + rankDelta);
    if (gm?.profile) {
      gm.profile.rankScore = newRankScore;
      localStorage.setItem('bedwars_profile', JSON.stringify(gm.profile));
    }
    const rankChangeEl = document.getElementById('rankChange');
    if (rankChangeEl) {
      rankChangeEl.style.display = 'block';
      const rn = gm?.rankName?.(newRankScore) || '沉睡梦游者';
      rankChangeEl.innerHTML = `<span class="rank-${isWinner ? 'up' : 'down'}">${isWinner ? '▲' : '▼'} 段位 ${rankDelta >= 0 ? '+' : ''}${rankDelta}</span><br><span>${rn}</span>`;
    }

    // 失败队伍提前退出
    const exitBtn = document.getElementById('earlyExitBtn');
    if (exitBtn && !isWinner) {
      exitBtn.style.display = 'block';
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

  showSlotContextMenu(slotEl, idx) {
    this.selectHotbar(idx);
    const menu = document.getElementById('slotContextMenu');
    if (!menu) return;
    const rect = slotEl.getBoundingClientRect();
    menu.style.display = 'flex';
    const menuRect = menu.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - menuRect.width / 2;
    let top = rect.top - menuRect.height - 8;
    left = Math.max(8, Math.min(left, window.innerWidth - menuRect.width - 8));
    top = Math.max(8, top);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    this._ctxSlotIdx = idx;
  }

  hideSlotContextMenu() {
    const menu = document.getElementById('slotContextMenu');
    if (menu) menu.style.display = 'none';
    this._ctxSlotIdx = null;
  }

  splitSelectedItem() {
    const lp = this.localPlayer;
    if (!lp) return;
    const idx = this._ctxSlotIdx !== undefined && this._ctxSlotIdx !== null ? this._ctxSlotIdx : lp.hotbarIndex;
    const item = lp.hotbar[idx];
    if (!item || item.count <= 1) {
      this.showMessage('该物品无法拆分', '#ff5555');
      this.hideSlotContextMenu();
      return;
    }
    const defaultHalf = Math.floor(item.count / 2);
    const amountStr = prompt(`拆分数量 (1-${item.count - 1}):`, String(defaultHalf));
    if (amountStr === null) {
      this.hideSlotContextMenu();
      return;
    }
    const amount = parseInt(amountStr, 10);
    if (!amount || amount < 1 || amount >= item.count) {
      this.showMessage('无效拆分数量', '#ff5555');
      this.hideSlotContextMenu();
      return;
    }

    const stack = (ITEM_DB[item.key]?.stack || 1);
    let hasSpace = false;
    for (let i = 0; i < lp.hotbar.length; i++) {
      const s = lp.hotbar[i];
      if (!s || (s.key === item.key && s.count < stack)) {
        hasSpace = true; break;
      }
    }
    if (!hasSpace) {
      for (let i = 0; i < lp.backpack.length; i++) {
        const s = lp.backpack[i];
        if (!s || (s.key === item.key && s.count < stack)) {
          hasSpace = true; break;
        }
      }
    }
    if (!hasSpace) {
      this.showMessage('道具栏已满，无法拆分', '#ff5555');
      this.hideSlotContextMenu();
      return;
    }

    item.count -= amount;
    if (item.count <= 0) {
      lp.hotbar[idx] = null;
    }
    lp.addToBackpack(item.key, amount);
    this.hideSlotContextMenu();
    this.ui.update();
    if (document.getElementById('backpackPanel')?.style.display === 'flex') {
      this.ui.updateBackpack();
    }
    this.showMessage('物品已拆分', '#8be9fd');
  }

  // ========== Secret Killer Mode Methods ==========

  assignSecretKillerRoles() {
    const alive = this.players.filter(p => !p.isDead);
    const shuffled = [...alive].sort(() => Math.random() - 0.5);

    // Assign roles
    shuffled[0].skRole = 'killer';
    shuffled[1].skRole = 'detective';
    for (let i = 2; i < shuffled.length; i++) {
      shuffled[i].skRole = 'civilian';
    }

    // Give equipment
    for (const p of shuffled) {
      this.skRoles[p.playerId] = p.skRole;
      if (p.skRole === 'killer') {
        p.hotbar[0] = { key: 'killer_knife', count: 1 };
        p.equipped.weapon = 'killer_knife';
      } else if (p.skRole === 'detective') {
        p.hotbar[0] = { key: 'detective_bow', count: 1 };
        p.equipped.weapon = 'detective_bow';
        p.arrowCount = 999;
        p.bowCdTimer = 0;
      }
    }

    // Show role to local player
    this.skRoleRevealed = true;
    const roleEl = document.getElementById('skRoleText');
    const roleHud = document.getElementById('secretKillerHud');
    if (roleEl && this.localPlayer.skRole) {
      const roleNames = { killer: '🔪 杀手', detective: '🏹 侦探', civilian: '👤 平民' };
      const roleDescs = {
        killer: '消灭所有好人！右键掷刀',
        detective: '找到并击杀杀手！弓有8秒CD',
        civilian: '收集10碎片可获得弓'
      };
      roleEl.textContent = roleNames[this.localPlayer.skRole] + ' - ' + roleDescs[this.localPlayer.skRole];
      roleEl.style.color = this.localPlayer.skRole === 'killer' ? '#ff4444' : this.localPlayer.skRole === 'detective' ? '#44ff44' : '#aaaaaa';
    }
    this.showMessage('身份已分配！查看左上角', '#ffdd00');
  }

  spawnFragment() {
    const points = this.engine.mapFeatures?.fragmentPoints || [];
    if (points.length === 0) return;
    // Pick a random point
    const pt = points[Math.floor(Math.random() * points.length)];
    this.engine.spawnDropItem(pt, 'fragment', 1);
  }

  checkSecretKillerWin() {
    const alive = this.players.filter(p => !p.isDead);
    const killer = alive.find(p => p.skRole === 'killer');
    const goodGuys = alive.filter(p => p.skRole !== 'killer');

    if (!killer) {
      this.endSecretKiller('good'); // Killer is dead
      return;
    }
    if (goodGuys.length === 0) {
      this.endSecretKiller('killer'); // All good guys dead
      return;
    }
  }

  endSecretKiller(winner) {
    this.skState = 'ended';
    this.gameActive = false;

    const lp = this.localPlayer;
    let playerWon = false;
    if (winner === 'good') {
      playerWon = lp.skRole !== 'killer';
    } else {
      playerWon = lp.skRole === 'killer';
    }

    const winnerText = winner === 'good' ? '好人阵营胜利！' : '杀手胜利！';
    if (document.pointerLockElement) document.exitPointerLock();

    const screen = document.getElementById('gameOverScreen');
    screen.style.display = 'flex';
    screen.querySelector('h1').textContent = '游戏结束！';
    screen.querySelector('.winner').textContent = winnerText;

    const stats = screen.querySelector('.stats');
    stats.innerHTML = '';
    const rows = [
      ['你的身份', lp.skRole === 'killer' ? '杀手' : lp.skRole === 'detective' ? '侦探' : '平民'],
      ['游戏结果', playerWon ? '胜利' : '失败'],
      ['存活时间', `${Math.floor(this.gameTime / 60)}分${Math.floor(this.gameTime % 60)}秒`],
      ['收集碎片', `${lp.skFragments || 0}`],
      ['最终生命', `${Math.ceil(lp?.hp || 0)}`]
    ];
    for (const [label, val] of rows) {
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = `<span>${label}</span><span>${val}</span>`;
      stats.appendChild(row);
    }

    // Hide secret killer HUD
    const skHud = document.getElementById('secretKillerHud');
    if (skHud) skHud.style.display = 'none';
    document.getElementById('mvpSection').style.display = 'none';
  }
}
