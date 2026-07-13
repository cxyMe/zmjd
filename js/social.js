// ============================================
// 筑梦决斗社交与互动系统
// ============================================

const SOCIAL_CONFIG = {
  markDuration: 8,
  markCooldown: 3,
 援助冷却: 10,
  comboCooldown: 600,
  rescueWindow: 3,
  rescueCostRate: 0.2
};

class SocialManager {
  constructor(game) {
    this.game = game;
    this.markCd = 0;
    this.aidCd = 0;
    this.comboEnergy = 0;
    this.comboCd = 0;
    this.comboReady = false;
    this.teamChests = {};
    this.chestPlunderCd = {};
    this.markers = [];
    this.rescueTarget = null;
    this.rescueTimer = 0;
    this.settings = JSON.parse(localStorage.getItem('bedwars_social_settings') || '{"dnd":false,"blockMarks":false,"blockBounties":false}');
  }

  initMatch() {
    this.comboEnergy = 0;
    this.comboCd = 0;
    this.comboReady = false;
    this.teamChests = {};
    for (const [key, team] of Object.entries(TEAMS)) {
      this.teamChests[key] = { copper: 0, silver: 0, gold: 0, jade: 0 };
      this.chestPlunderCd[key] = 0;
      this.createChestVisual(key, team);
    }
    this.updateComboUI();
  }

  createChestVisual(teamKey, team) {
    if (!this.game.engine?.scene || !team.bedPos) return;
    const old = team.chestMesh;
    if (old) this.game.engine._disposeMesh(old);
    const geo = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    const mat = new THREE.MeshLambertMaterial({ color: team.color, emissive: team.color, emissiveIntensity: 0.15 });
    const mesh = new THREE.Mesh(geo, mat);
    const dirX = team.spawn.x > 0 ? -1 : 1;
    mesh.position.set(team.bedPos.x + dirX * 2.4, 0.85, team.bedPos.z);
    mesh.castShadow = true;
    this.game.engine.scene.add(mesh);
    team.chestMesh = mesh;
  }

  update(dt) {
    this.markCd = Math.max(0, this.markCd - dt);
    this.aidCd = Math.max(0, this.aidCd - dt);
    this.comboCd = Math.max(0, this.comboCd - dt);
    this.updateMarkers(dt);
    this.updateCombo(dt);
    this.checkVoidRescue(dt);
    this.checkChestPlunder(dt);
  }

  updateMarkers(dt) {
    for (let i = this.markers.length - 1; i >= 0; i--) {
      const m = this.markers[i];
      m.life -= dt;
      if (m.mesh) {
        m.mesh.rotation.y += dt;
        m.mesh.material.opacity = Math.max(0, m.life / SOCIAL_CONFIG.markDuration);
      }
      if (m.life <= 0) {
        this.game.engine._disposeMesh(m.mesh);
        this.markers.splice(i, 1);
      }
    }
  }

  updateCombo(dt) {
    return; // 三人连携功能已移除
    const lp = this.game.localPlayer;
    if (!lp || lp.isDead || this.comboCd > 0) {
      this.updateComboUI();
      return;
    }
    const mates = this.game.players.filter(p => p.team === lp.team && !p.isDead);
    const closeEnough = mates.length >= 3 && mates.every(p => p.pos.distanceTo(lp.pos) <= 30);
    if (closeEnough) this.comboEnergy = Math.min(100, this.comboEnergy + dt * 1.2);
    if (this.comboEnergy >= 100) this.comboReady = true;
    this.updateComboUI();
  }

  updateComboUI() {
    return; // 三人连携功能已移除
  }

  checkChestPlunder(dt) {
    for (const [teamKey, team] of Object.entries(TEAMS)) {
      this.chestPlunderCd[teamKey] = Math.max(0, (this.chestPlunderCd[teamKey] || 0) - dt);
      if (this.chestPlunderCd[teamKey] > 0 || !team.chestMesh) continue;
      const attacker = this.game.players.find(p => p.team !== teamKey && !p.isDead && p.attackCd > 0.22 && p.pos.distanceTo(team.chestMesh.position) < 2.2);
      if (!attacker) continue;
      const chest = this.teamChests[teamKey];
      let total = 0;
      for (const cur of ['copper','silver','gold','jade']) {
        const lost = Math.floor((chest[cur] || 0) / 2);
        if (lost > 0) {
          chest[cur] -= lost;
          total += lost;
          this.game.engine.spawnCurrencyDrop(team.chestMesh.position.clone(), cur, lost);
        }
      }
      if (total > 0) {
        this.chestPlunderCd[teamKey] = 8;
        this.game.showMessage(`${attacker.name} 掠夺了 ${team.name} 团队保险箱！`, '#ff4444');
        this.logSocialEvent('team_chest_plunder', attacker.playerId, { team: teamKey, total });
      }
    }
  }

  openMarkWheel() {
    if (this.markCd > 0) return this.game.showMessage(`标记冷却 ${Math.ceil(this.markCd)} 秒`, '#ffaa00');
    if (this.settings.blockMarks) return this.game.showMessage('你已开启免打扰标记屏蔽', '#aaa');
    const target = this.detectMarkTarget();
    const panel = document.getElementById('markWheel');
    const body = document.getElementById('markOptions');
    if (!panel || !body) return;
    const options = this.optionsForTarget(target);
    body.innerHTML = options.map(o => `<button data-type="${o.type}">${o.label}</button>`).join('');
    body.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        const opt = options.find(o => o.type === btn.dataset.type);
        this.placeMark(target.pos, opt);
        panel.style.display = 'none';
      };
    });
    panel.style.display = 'flex';
    if (document.pointerLockElement) document.exitPointerLock();
  }

  detectMarkTarget() {
    const lp = this.game.localPlayer;
    const origin = lp.pos.clone().add(new THREE.Vector3(0, 0.7, 0));
    const dir = lp.getForwardDir();
    let bestEnemy = null, bestDist = Infinity;
    for (const p of this.game.players) {
      if (p.team === lp.team || p.isDead) continue;
      const to = p.pos.clone().sub(origin);
      const forwardDot = to.normalize().dot(dir);
      const dist = p.pos.distanceTo(origin);
      if (forwardDot > 0.85 && dist < bestDist && dist < 35) { bestEnemy = p; bestDist = dist; }
    }
    if (bestEnemy) return { kind: 'enemy', pos: bestEnemy.pos.clone(), target: bestEnemy };
    for (const g of this.game.gens) {
      if (g.pos.distanceTo(lp.pos) < 18) return { kind: 'generator', pos: g.pos.clone(), target: g };
    }
    const enemyBed = Object.entries(TEAMS).find(([k, t]) => k !== lp.team && t.bedAlive);
    if (enemyBed && lp.pos.distanceTo(enemyBed[1].bedPos) < 18) return { kind: 'bed', pos: enemyBed[1].bedPos.clone(), target: enemyBed[1] };
    const rc = this.game.engine.raycastBlocks(origin, dir, 18);
    return { kind: rc.hit ? 'danger' : 'void', pos: rc.hit ? rc.pos.clone() : origin.clone().addScaledVector(dir, 12) };
  }

  optionsForTarget(target) {
    if (target.kind === 'generator') return [
      { type: 'capture', label: '集火抢占此点', color: 0x44ff88 },
      { type: 'empty', label: '资源已空，撤退', color: 0xaaaaaa }
    ];
    if (target.kind === 'bed') return [{ type: 'rush_bed', label: '准备突袭拆床！', color: 0xff3333 }];
    if (target.kind === 'enemy') return [{ type: 'focus_enemy', label: '集火目标', color: 0xffaa00 }];
    return [{ type: 'danger', label: '此处危险，勿搭路！', color: 0xff4444 }];
  }

  placeMark(pos, option) {
    this.markCd = SOCIAL_CONFIG.markCooldown;
    const geo = new THREE.CylinderGeometry(0.25, 0.45, 8, 16, 1, true);
    const mat = new THREE.MeshBasicMaterial({ color: option.color, transparent: true, opacity: 0.72, depthTest: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y += 4;
    mesh.renderOrder = 10;
    this.game.engine.scene.add(mesh);
    this.markers.push({ mesh, life: SOCIAL_CONFIG.markDuration, type: option.type });
    this.game.showMessage(`梦之印记：${option.label}`, '#8be9fd');
    if (option.type === 'rush_bed') this.teamRushBuff();
    this.logSocialEvent('dream_mark', null, { type: option.type, label: option.label, pos: pos.toArray?.() || [] });
  }

  teamRushBuff() {
    for (const p of this.game.players.filter(p => p.team === this.game.localPlayer.team && !p.isDead)) {
      p.socialSpeedBuff = 2;
      p.speed *= 1.03;
      setTimeout(() => { p.speed /= 1.03; }, 2000);
    }
    document.body.classList.add('rush-flash');
    setTimeout(() => document.body.classList.remove('rush-flash'), 350);
  }

  openTeamChest() {
    const lp = this.game.localPlayer;
    const chest = this.teamChests[lp.team];
    const panel = document.getElementById('teamChestPanel');
    const body = document.getElementById('teamChestBody');
    if (!panel || !body || !chest) return;
    body.innerHTML = ['copper','silver','gold','jade'].map(k => `
      <div class="chest-row">
        <span>${this.currencyName(k)}：背包 ${Math.floor(lp.inv[k] || 0)}｜保险箱 ${Math.floor(chest[k] || 0)}</span>
        <button data-act="deposit" data-cur="${k}">存10</button>
        <button data-act="withdraw" data-cur="${k}">取10</button>
      </div>`).join('');
    body.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => this.chestMove(btn.dataset.cur, btn.dataset.act);
    });
    panel.style.display = 'flex';
    if (document.pointerLockElement) document.exitPointerLock();
  }

  chestMove(cur, act) {
    const lp = this.game.localPlayer;
    const chest = this.teamChests[lp.team];
    const amount = Math.min(10, act === 'deposit' ? (lp.inv[cur] || 0) : (chest[cur] || 0));
    if (amount <= 0) return;
    if (act === 'deposit') { lp.inv[cur] -= amount; chest[cur] += amount; }
    else { chest[cur] -= amount; lp.inv[cur] += amount; }
    this.openTeamChest();
  }

  sendAid() {
    const lp = this.game.localPlayer;
    if (this.aidCd > 0) return this.game.showMessage(`急援冷却 ${Math.ceil(this.aidCd)} 秒`, '#ffaa00');
    const mate = this.game.players.filter(p => p.team === lp.team && p !== lp && !p.isDead)
      .sort((a,b) => a.pos.distanceTo(lp.pos) - b.pos.distanceTo(lp.pos))[0];
    if (!mate) return this.game.showMessage('附近没有可急援队友', '#aaa');
    const cur = ['silver','gold','copper','jade'].find(k => (lp.inv[k] || 0) > 0);
    if (!cur) return this.game.showMessage('没有可急援资源', '#aaa');
    const amount = Math.min(cur === 'copper' ? 20 : 5, Math.floor(lp.inv[cur] || 0));
    lp.inv[cur] -= amount;
    mate.inv[cur] = (mate.inv[cur] || 0) + amount;
    this.aidCd = SOCIAL_CONFIG.援助冷却;
    this.createAidTrail(lp.pos, mate.pos, RES[cur.toUpperCase()]?.color || 0xffffff);
    this.game.showMessage(`物资急援：${this.currencyName(cur)} x${amount} → ${mate.name}`, '#8be9fd');
    this.logSocialEvent('resource_aid', mate.playerId, { currency: cur, amount });
  }

  createAidTrail(from, to, color) {
    const geo = new THREE.BufferGeometry().setFromPoints([from.clone().add(new THREE.Vector3(0,1,0)), to.clone().add(new THREE.Vector3(0,1,0))]);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const line = new THREE.Line(geo, mat);
    this.game.engine.scene.add(line);
    setTimeout(() => this.game.engine._disposeMesh(line), 900);
  }

  castCombo(type = 'shield') {
    return; // 三人连携功能已移除
    const team = this.game.players.filter(p => p.team === this.game.localPlayer.team && !p.isDead);
    if (team.length < 3) return this.game.showMessage('三人齐整才可释放连携技', '#ffaa00');
    if (type === 'assault') {
      for (const p of team) { p.isInvisible = true; p.speed *= 1.2; setTimeout(() => { p.isInvisible = false; p.speed /= 1.2; }, 2000); }
      this.game.showMessage('绝境连携：战术突袭！', '#b388ff');
    } else {
      for (const p of team) { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.15); p.socialShield = 3; }
      this.game.showMessage('绝境连携：铁壁防御！', '#8be9fd');
    }
    this.comboEnergy = 0; this.comboReady = false; this.comboCd = SOCIAL_CONFIG.comboCooldown;
    this.logSocialEvent('team_combo', null, { type });
  }

  checkVoidRescue(dt) {
    const lp = this.game.localPlayer;
    if (!lp || lp.isDead) return;
    const fallingMate = this.game.players.find(p => p.team === lp.team && p !== lp && !p.isDead && p.pos.y < -8 && p.pos.y > -16 && p.pos.distanceTo(lp.pos) < 28);
    const btn = document.getElementById('rescueBtn');
    if (!btn) return;
    if (fallingMate) {
      this.rescueTarget = fallingMate;
      this.rescueTimer += dt;
      btn.style.display = this.rescueTimer <= SOCIAL_CONFIG.rescueWindow ? 'flex' : 'none';
      btn.textContent = `救援 ${fallingMate.name}`;
    } else {
      this.rescueTarget = null;
      this.rescueTimer = 0;
      btn.style.display = 'none';
    }
  }

  rescueVoidMate() {
    const rescuer = this.game.localPlayer;
    const target = this.rescueTarget;
    if (!rescuer || !target || this.rescueTimer > SOCIAL_CONFIG.rescueWindow) return;
    rescuer.hp = Math.max(1, rescuer.hp * (1 - SOCIAL_CONFIG.rescueCostRate));
    target.pos.copy(rescuer.pos.clone().add(new THREE.Vector3(1.2, 0, 0)));
    target.vel.set(0, 2, 0);
    this.createAidTrail(rescuer.pos, target.pos, 0x8be9fd);
    this.game.showMessage(`${rescuer.name} 使用牵引钩锁救回 ${target.name}`, '#8be9fd');
    this.logSocialEvent('void_rescue', target.playerId, { costRate: SOCIAL_CONFIG.rescueCostRate });
  }

  showPostMatchGallery(winnerName) {
    const panel = document.getElementById('postMatchGallery');
    const body = document.getElementById('postMatchBody');
    if (!panel || !body) return;
    const esc = s => (s || '-').replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
    const players = [...this.game.players];
    const bestBuilder = players.sort((a,b) => (b.matchStats.blocksPlaced||0)-(a.matchStats.blocksPlaced||0))[0];
    const bedHunter = players.sort((a,b) => (b.matchStats.beds||0)-(a.matchStats.beds||0))[0];
    const survivor = players.filter(p => !p.isDead)[0] || this.game.localPlayer;
    body.innerHTML = `
      <div class="poster-card"><h3>最佳铺路人</h3><p>${esc(bestBuilder?.name)} 放置 ${bestBuilder?.matchStats.blocksPlaced || 0} 个方块</p></div>
      <div class="poster-card"><h3>拆床猎手</h3><p>${esc(bedHunter?.name)} 拆床 ${bedHunter?.matchStats.beds || 0} 次</p></div>
      <div class="poster-card"><h3>生存大师</h3><p>${esc(survivor?.name)} 坚持到最后</p></div>
      <div class="poster-actions"><button onclick="window.game?.social?.voteTeammate('best_partner')">送出最佳搭档赞</button><button onclick="window.game?.social?.voteTeammate('funny_blame')">匿名猪队友标签</button></div>
      <p class="poster-tip">10秒后可继续操作，战报仅作展示，不影响排位分。</p>`;
    panel.style.display = 'flex';
    setTimeout(() => { if (panel.style.display === 'flex') panel.style.display = 'none'; }, 10000);
  }

  voteTeammate(type) {
    const lp = this.game.localPlayer;
    const mate = this.game.players.find(p => p.team === lp.team && p !== lp);
    if (!mate) return;
    this.logSocialEvent(type, mate.playerId, { room: this.game.network?.roomNet?.room?.id || 'local' });
    this.game.showMessage(type === 'best_partner' ? '已送出最佳搭档赞' : '娱乐标签已送出', '#ffdd00');
  }

  openSocialPanel() {
    const panel = document.getElementById('socialPanel');
    const body = document.getElementById('socialBody');
    if (!panel || !body) return;
    body.innerHTML = `
      <div class="social-row"><label><input type="checkbox" id="setDnd" ${this.settings.dnd ? 'checked' : ''}> 免打扰令：禁止陌生互动</label></div>
      <div class="social-row"><label><input type="checkbox" id="setMarks" ${this.settings.blockMarks ? 'checked' : ''}> 屏蔽陌生标记</label></div>
      <div class="social-row"><label><input type="checkbox" id="setBounty" ${this.settings.blockBounties ? 'checked' : ''}> 拒绝悬赏纠缠</label></div>
      <div class="social-row"><button onclick="window.game?.social?.createBounty()">向连续击杀者发布悬赏</button></div>
      <div class="social-row"><button onclick="window.game?.social?.avoidWorstMate()">赛后避雷：3天不同队</button></div>
      <p class="poster-tip">礼貌值过低的玩家会被限制标记/语音，并优先进入低礼貌匹配池。</p>`;
    panel.style.display = 'flex';
    body.querySelectorAll('input').forEach(input => input.onchange = () => this.saveSettings());
    if (document.pointerLockElement) document.exitPointerLock();
  }

  saveSettings() {
    this.settings = {
      dnd: document.getElementById('setDnd')?.checked || false,
      blockMarks: document.getElementById('setMarks')?.checked || false,
      blockBounties: document.getElementById('setBounty')?.checked || false
    };
    localStorage.setItem('bedwars_social_settings', JSON.stringify(this.settings));
  }

  createBounty() { this.game.showMessage('悬赏令已记录：后续匹配将优先制造复仇局', '#ff4444'); this.logSocialEvent('bounty_preview', null, {}); }
  avoidWorstMate() { this.game.showMessage('已加入临时避雷名单：3天内尽量不同队', '#ffaa00'); this.logSocialEvent('avoid_preview', null, {}); }
  currencyName(k) { return ({ copper:'铜币', silver:'银币', gold:'金币', jade:'玉佩' })[k] || k; }

  logSocialEvent(type, targetId, details = {}) {
    const client = this.game.network?.roomNet?.client;
    if (!client) return;
    client.from('match_social_events').insert({
      room_id: this.game.network?.roomNet?.room?.id || 'local',
      event_type: type,
      actor_id: this.game.localPlayer?.playerId,
      target_id: targetId,
      details,
      tick: Math.floor(this.game.gameTime || 0)
    }).catch(()=>{});
  }
}

window.SOCIAL_CONFIG = SOCIAL_CONFIG;
window.SocialManager = SocialManager;
