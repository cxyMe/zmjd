// ============================================
// 校园寻宝模式 - 核心引擎
// ============================================

const CAMPUS_CONFIG = {
  MAP_SIZE: 800, CELL_SIZE: 1, CAREER_MAX: 5,
  BACKPACK_SIZE: 24, WEIGHT_LIMITS: [20, 40, 60], SNAPSHOT_RATE: 20
};

const CAREERS = {
  ATHLETE: {
    name: '体育生', code: '体', color: 0xff4444,
    passive: { name: '体能强化', desc: '体力恢复+50%，翻越耗时-50%' },
    active: { name: '冲刺', desc: '移速200%持续3秒，前方生成风字破障', cd: 15 },
    starter: 'dumbbell'
  },
  ENGINEER: {
    name: '工科生', code: '工', color: 0x44aaff,
    passive: { name: '破解天赋', desc: '破解时间减半，失败不触发警报' },
    active: { name: '信号干扰', desc: '8m范围摄像头失效，屏蔽声音涟漪', cd: 20 },
    starter: 'keycard'
  },
  CHEMIST: {
    name: '化学系', code: '化', color: 0x44ff44,
    passive: { name: '抗毒性', desc: '免疫毒气伤害，毒区移速+10%' },
    active: { name: '粘液陷阱', desc: '放置地面粘字，定身1.5秒+腐蚀5秒', cd: 12 },
    starter: 'trap'
  },
  ARTIST: {
    name: '美术生', code: '美', color: 0xff44ff,
    passive: { name: '锐利眼光', desc: '视觉感知+20%，提前看到敌人轮廓' },
    active: { name: '全息投影', desc: '召唤分身吸引火力8秒', cd: 25 },
    starter: 'spray'
  },
  SCHOLAR: {
    name: '文科生', code: '文', color: 0xffaa44,
    passive: { name: '博学', desc: '自动浮现隐藏线索，30%揭示撤离点' },
    active: { name: '心理威慑', desc: '金色敕字冲击波，击退+眩晕', cd: 18 },
    starter: 'whistle'
  }
};

const TREASURES = {
  usb:     { name: '上古优盘', char: 'U',  volume: 1,  weight: 1,  credits: 800,  color: 0xc0c0c0, emissive: 0x88aaff },
  trophy:  { name: '金色奖杯', char: '杯', volume: 9,  weight: 15, credits: 2500, color: 0xffd700, emissive: 0xffaa00 },
  seal:    { name: '校长印章', char: '印', volume: 4,  weight: 8,  credits: 1800, color: 0xff3333, emissive: 0xff0000 },
  scroll:  { name: '古代试卷', char: '卷', volume: 16, weight: 25, credits: 5000, color: 0xf5e6c8, emissive: 0xffdd88 },
  fungus:  { name: '神秘菌种', char: '菌', volume: 4,  weight: 5,  credits: 1200, color: 0x44ff88, emissive: 0x00ff44, throwable: true }
};

const CONSUMABLES = {
  armor_plates: { name: '复习重点护甲', char: '护', effect: 'armor', value: 30, duration: 60 },
  energy_drink: { name: '运动饮料',   char: '饮', effect: 'stamina', value: 50, duration: 0 },
  master_key:   { name: '万能钥匙卡', char: '卡', effect: 'unlock', value: 1, duration: 0 },
  whistle:      { name: '教导主任哨子', char: '哨', effect: 'stun', value: 5, radius: 5, duration: 3, cd: 9 }
};

const CAMPUS_ITEMS = {
  dumbbell:   { name: '哑铃',     char: '重重', type: 'weapon', damage: 35, range: 3,  noise: 100, volume: 4,  weight: 8 },
  slingshot:  { name: '橡皮弹弓', char: '弹弓', type: 'weapon', damage: 15, range: 15, noise: 30,  volume: 4,  weight: 3 },
  broomstick: { name: '扫把飞行器', char: '帚', type: 'mount',  speed: 1.5,  volume: 16, weight: 20, flyTrail: '\u98ce' },
  ...CONSUMABLES,
  ...TREASURES
};

// ============================================
// CampusPlayer
// ============================================

class CampusPlayer {
  constructor(engine, careerKey, isLocal, name) {
    this.engine = engine;
    this.career = CAREERS[careerKey] || CAREERS.ATHLETE;
    this.careerKey = careerKey;
    this.isLocal = isLocal || false;
    this.name = name || '玩家';
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0; this.pitch = 0;
    this.hp = 100; this.maxHp = 100;
    this.armor = 0; this.maxArmor = 0;
    this.stamina = 100; this.maxStamina = 100;
    this.isDead = false; this.isCrouching = false;
    this.isRunning = false; this.isFlying = false;
    this.backpack = new Array(CAMPUS_CONFIG.BACKPACK_SIZE).fill(null);
    this.totalWeight = 0;
    this.kills = 0; this.deaths = 0;
    this.skillCd = 0; this.skillActive = 0;
    this.mesh = this._createTextBody();
    this.engine.scene.add(this.mesh);
    if (this.career.starter) this.addToBackpack(this.career.starter, 1);
    this.addToBackpack('energy_drink', 2);
  }

  _makeSprite(text, color, w, h, fontSize, sx, sy) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.font = 'bold ' + fontSize + 'px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
    var tex = new THREE.CanvasTexture(c);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sp.scale.set(sx, sy, 1);
    return sp;
  }

  _createTextBody() {
    var g = new THREE.Group();
    // Head (torus), Body (box), Arms (cylinders), Legs (cylinders)
    var head = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.06, 8, 12),
      new THREE.MeshToonMaterial({ color: 0xffe0c0 }));
    head.position.y = 0.55; g.add(head);

    var body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.2),
      new THREE.MeshToonMaterial({ color: this.career.color }));
    body.position.y = 0.3; g.add(body);

    var armGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6);
    var armMat = new THREE.MeshToonMaterial({ color: 0xffe0c0 });
    var la = new THREE.Mesh(armGeo, armMat);
    la.position.set(-0.25, 0.3, 0); la.rotation.z = 0.5; g.add(la);
    var ra = new THREE.Mesh(armGeo, armMat);
    ra.position.set(0.25, 0.3, 0); ra.rotation.z = -0.5; g.add(ra);

    var legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.25, 6);
    var legMat = new THREE.MeshToonMaterial({ color: 0x444488 });
    var ll = new THREE.Mesh(legGeo, legMat); ll.position.set(-0.1, 0.02, 0); g.add(ll);
    var rl = new THREE.Mesh(legGeo, legMat); rl.position.set(0.1, 0.02, 0); g.add(rl);

    var label = this._makeSprite(this.career.code, this.career.color, 64, 64, 40, 0.4, 0.4);
    label.position.y = 0.9; g.add(label);
    var nameLabel = this._makeSprite(this.name, 0xffffff, 256, 48, 24, 1.0, 0.2);
    nameLabel.position.y = 1.15; g.add(nameLabel);
    return g;
  }

  getSpeedMultiplier() {
    var w = this.totalWeight;
    return w > 40 ? 0.65 : w > 20 ? 0.85 : 1.0;
  }

  addToBackpack(itemKey, count) {
    var item = CAMPUS_ITEMS[itemKey];
    if (!item) return false;
    var slots = item.volume || 1, needed = (count || 1) * slots, placed = 0;
    for (var i = 0; i < CAMPUS_CONFIG.BACKPACK_SIZE && placed < needed; i++) {
      if (!this.backpack[i]) {
        this.backpack[i] = { key: itemKey };
        placed += slots;
        this.totalWeight += (item.weight || 1);
      }
    }
    return placed >= needed;
  }

  removeFromBackpack(itemKey) {
    for (var i = 0; i < CAMPUS_CONFIG.BACKPACK_SIZE; i++) {
      if (this.backpack[i] && this.backpack[i].key === itemKey) {
        this.totalWeight -= (CAMPUS_ITEMS[itemKey]?.weight || 1);
        if (this.totalWeight < 0) this.totalWeight = 0;
        this.backpack[i] = null;
        return true;
      }
    }
    return false;
  }

  takeDamage(amount) {
    if (this.isDead) return;
    var dmg = amount;
    if (this.armor > 0) { var ab = Math.min(this.armor, dmg * 0.6); this.armor -= ab; dmg -= ab; }
    this.hp -= dmg;
    if (this.hp <= 0) { this.hp = 0; this.die(); }
  }

  useSkill() {
    if (this.isDead || this.skillCd > 0 || this.skillActive > 0) return null;
    var ck = this.careerKey;
    this.skillActive = 3;
    this.skillCd = this.career.active.cd;
    var types = { ATHLETE: 'sprint', ENGINEER: 'jammer', CHEMIST: 'trap', ARTIST: 'clone', SCHOLAR: 'intimidate' };
    return { type: types[ck] || null, duration: ck === 'ATHLETE' ? 3 : ck === 'ENGINEER' ? 8 : ck === 'ARTIST' ? 8 : 0 };
  }

  update(dt, input) {
    if (this.isDead) return;
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.yaw;
    if (this.skillCd > 0) this.skillCd = Math.max(0, this.skillCd - dt);
    if (this.skillActive > 0) { this.skillActive -= dt; if (this.skillActive <= 0) this.isRunning = false; }
    var regen = this.careerKey === 'ATHLETE' ? 1.5 : 1.0;
    this.stamina = Math.min(this.maxStamina, this.stamina + regen * dt);
    var speed = 5 * this.getSpeedMultiplier();
    if (this.isCrouching) speed *= 0.5;
    if (this.isRunning) speed *= 2;
    if (this.isFlying) speed *= 1.5;
    var fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    var rht = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    var dir = new THREE.Vector3();
    if (input.forward) dir.add(fwd);
    if (input.backward) dir.sub(fwd);
    if (input.left) dir.sub(rht);
    if (input.right) dir.add(rht);
    if (dir.lengthSq() > 0) { dir.normalize().multiplyScalar(speed); this.pos.addScaledVector(dir, dt); }
    var half = CAMPUS_CONFIG.MAP_SIZE / 2;
    this.pos.x = Math.max(-half, Math.min(half, this.pos.x));
    this.pos.z = Math.max(-half, Math.min(half, this.pos.z));
  }

  die() { this.isDead = true; this.deaths++; this.mesh.visible = false; }

  dispose() {
    this.engine.scene.remove(this.mesh);
    this.mesh.traverse(function (c) {
      if (c.geometry) c.geometry.dispose();
      if (c.material) { if (c.material.map) c.material.map.dispose(); c.material.dispose(); }
    });
  }
}

// ============================================
// CampusGuard
// ============================================

class CampusGuard {
  constructor(engine, pos, path) {
    this.engine = engine;
    this.pos = pos.clone();
    this.path = path;
    this.pathIdx = 0;
    this.yaw = 0;
    this.alertLevel = 0; // 0=patrol, 1=suspicious, 2=chasing
    this.alertTimer = 0;
    this.speed = 3;
    this.stunTimer = 0;
    this.mesh = this._createMesh();
    this.engine.scene.add(this.mesh);
    this.visionCone = this._createVisionCone();
    this.engine.scene.add(this.visionCone);
  }

  _createMesh() {
    var g = new THREE.Group();
    var c = document.createElement('canvas'); c.width = 64; c.height = 128;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#00ff88'; ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 56, 120); ctx.fillText('警', 32, 64);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
    sp.scale.set(0.8, 1.6, 1); g.add(sp);
    return g;
  }

  _createVisionCone() {
    var geo = new THREE.ConeGeometry(30, 30, 16, 1, true, -Math.PI / 6, Math.PI / 3);
    var mat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.06, side: THREE.DoubleSide });
    var cone = new THREE.Mesh(geo, mat);
    cone.rotation.x = -Math.PI / 2; cone.position.y = 0.5;
    return cone;
  }

  canSeePlayer(player) {
    if (player.isDead) return false;
    if (this.pos.distanceTo(player.pos) > 30) return false;
    var toP = player.pos.clone().sub(this.pos).normalize();
    var fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    return toP.dot(fwd) >= 0.5; // ~60 degree cone
  }

  update(dt, players) {
    if (this.stunTimer > 0) { this.stunTimer -= dt; return; }
    this.alertTimer = Math.max(0, this.alertTimer - dt);
    if (this.alertTimer <= 0 && this.alertLevel > 0) this.alertLevel = Math.max(0, this.alertLevel - 1);
    // Vision check
    for (var i = 0; i < players.length; i++) {
      if (this.canSeePlayer(players[i])) { this.alertLevel = 2; this.alertTimer = 20; break; }
    }
    // Patrol
    var spd = this.alertLevel === 2 ? this.speed * 1.5 : this.speed;
    if (this.path && this.path.length > 0) {
      var t = this.path[this.pathIdx], d = t.clone().sub(this.pos);
      if (d.length() < 2) { this.pathIdx = (this.pathIdx + 1) % this.path.length; }
      else { d.normalize().multiplyScalar(spd * dt); this.pos.add(d); this.yaw = Math.atan2(d.x, d.z); }
    }
    this.mesh.position.copy(this.pos); this.mesh.rotation.y = this.yaw;
    this.visionCone.position.copy(this.pos); this.visionCone.rotation.y = this.yaw;
    var cols = [0x00ff88, 0xffff00, 0xff3333], ops = [0.06, 0.12, 0.18];
    this.visionCone.material.color.setHex(cols[this.alertLevel]);
    this.visionCone.material.opacity = ops[this.alertLevel];
  }

  dispose() {
    this.engine.scene.remove(this.mesh); this.engine.scene.remove(this.visionCone);
    this.mesh.traverse(function (c) {
      if (c.geometry) c.geometry.dispose();
      if (c.material) { if (c.material.map) c.material.map.dispose(); c.material.dispose(); }
    });
    this.visionCone.geometry.dispose(); this.visionCone.material.dispose();
  }
}

// ============================================
// CampusMode
// ============================================

class CampusMode {
  constructor(engine, options) {
    this.engine = engine;
    this.scene = engine.scene;
    this.camera = engine.camera;
    this.renderer = engine.renderer;
    this.players = []; this.guards = []; this.treasures = [];
    this.consumables = []; this.traps = []; this.markers = [];
    this.gameTime = 0; this.maxTime = 22 * 60;
    this.isRunning = false; this.isOver = false;
    this.nextEventTime = 600;
    this.isPowerOut = false;
    this.localPlayer = null;
    this.input = { forward: false, backward: false, left: false, right: false, sprint: false, crouch: false, interact: false };
    this.onEvent = null; this.onEnd = null; this.onPickup = null;
    this._ambientLight = new THREE.AmbientLight(0x6688aa, 0.4);
    this._dirLight = new THREE.DirectionalLight(0xffeedd, 0.8);
    this._dirLight.position.set(100, 200, 100);
  }

  init(playerCareer, playerName) {
    this.scene.add(this._ambientLight); this.scene.add(this._dirLight);
    var gGeo = new THREE.PlaneGeometry(CAMPUS_CONFIG.MAP_SIZE, CAMPUS_CONFIG.MAP_SIZE);
    var gMat = new THREE.MeshToonMaterial({ color: 0x3a5f3a });
    this._ground = new THREE.Mesh(gGeo, gMat);
    this._ground.rotation.x = -Math.PI / 2; this._ground.position.y = -0.01;
    this.scene.add(this._ground);
    this.localPlayer = new CampusPlayer(this.engine, playerCareer, true, playerName);
    this.localPlayer.pos.set(-300, 0, -300);
    this.players.push(this.localPlayer);
    this._spawnGuards(); this._spawnTreasures(); this._spawnConsumables();
    this.isRunning = true;
  }

  _createTextItem(ch, color, emissive, scale) {
    var c = document.createElement('canvas'); c.width = 64; c.height = 64;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#' + emissive.toString(16).padStart(6, '0'); ctx.shadowBlur = 10;
    ctx.fillText(ch, 32, 32);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
    sp.scale.set(scale, scale, 1); return sp;
  }

  _spawnGuards() {
    var paths = [
      [v3(-200,0,-200), v3(-200,0,0), v3(0,0,0), v3(0,0,-200)],
      [v3(100,0,-150), v3(100,0,150), v3(300,0,150), v3(300,0,-150)],
      [v3(-100,0,100), v3(100,0,100), v3(100,0,300), v3(-100,0,300)]
    ];
    for (var i = 0; i < paths.length; i++)
      this.guards.push(new CampusGuard(this.engine, paths[i][0], paths[i]));
  }

  _spawnTreasures() {
    var locs = [
      { key: 'usb', pos: v3(-150, 0.5, -100) }, { key: 'trophy', pos: v3(200, 0.5, 0) },
      { key: 'seal', pos: v3(0, 0.5, -250) },   { key: 'scroll', pos: v3(300, 0.5, 200) },
      { key: 'fungus', pos: v3(-250, 0.5, 150) }, { key: 'usb', pos: v3(50, 0.5, 300) },
      { key: 'trophy', pos: v3(-300, 0.5, 50) }
    ];
    for (var i = 0; i < locs.length; i++) {
      var info = TREASURES[locs[i].key]; if (!info) continue;
      var mesh = this._createTextItem(info.char, info.color, info.emissive, 0.5);
      mesh.position.copy(locs[i].pos); mesh.userData.baseY = locs[i].pos.y;
      this.scene.add(mesh);
      this.treasures.push({ mesh: mesh, key: locs[i].key, info: info, collected: false });
    }
  }

  _spawnConsumables() {
    var items = [
      { key: 'armor_plates', pos: v3(-50, 0.3, 50) },   { key: 'energy_drink', pos: v3(100, 0.3, -100) },
      { key: 'master_key', pos: v3(-200, 0.3, 200) },    { key: 'whistle', pos: v3(250, 0.3, -200) },
      { key: 'energy_drink', pos: v3(-100, 0.3, -300) }, { key: 'armor_plates', pos: v3(150, 0.3, 250) }
    ];
    for (var i = 0; i < items.length; i++) {
      var info = CAMPUS_ITEMS[items[i].key]; if (!info) continue;
      var mesh = this._createTextItem(info.char, 0xffffff, 0x88ff88, 0.3);
      mesh.position.copy(items[i].pos); mesh.userData.baseY = items[i].pos.y;
      this.scene.add(mesh);
      this.consumables.push({ mesh: mesh, key: items[i].key, info: info, collected: false });
    }
  }

  update(dt) {
    if (!this.isRunning || this.isOver) return;
    this.gameTime += dt;
    if (this.localPlayer) {
      this.localPlayer.update(dt, this.input);
      // Camera follow
      var cd = 8, ch = 6, lp = this.localPlayer;
      var tcp = new THREE.Vector3(
        lp.pos.x + Math.sin(lp.yaw) * cd, lp.pos.y + ch, lp.pos.z + Math.cos(lp.yaw) * cd);
      this.camera.position.lerp(tcp, 0.1);
      this.camera.lookAt(lp.pos.x, lp.pos.y + 0.8, lp.pos.z);
      this._checkPickups();
      this._checkGuardDamage(dt);
      this._checkEvacuation();
    }
    for (var i = 0; i < this.guards.length; i++) this.guards[i].update(dt, this.players);
    // Animate treasures
    for (var i = 0; i < this.treasures.length; i++) {
      var t = this.treasures[i]; if (t.collected) continue;
      t.mesh.material.rotation += dt * 0.5;
      t.mesh.position.y = (t.mesh.userData.baseY || 0.5) + Math.sin(this.gameTime * 2 + i) * 0.1;
    }
    this._updateEvents(dt);
    if (this.gameTime >= this.maxTime) this.endGame(false, '时间耗尽');
  }

  _checkPickups() {
    var pp = this.localPlayer.pos, pr = 2.5;
    var lists = [this.treasures, this.consumables];
    for (var li = 0; li < lists.length; li++) {
      for (var i = 0; i < lists[li].length; i++) {
        var t = lists[li][i]; if (t.collected) continue;
        if (t.mesh.position.distanceTo(pp) < pr && this.localPlayer.addToBackpack(t.key)) {
          t.collected = true; t.mesh.visible = false;
          if (this.onPickup) this.onPickup(li === 0 ? 'treasure' : 'consumable', t.key, t.info);
        }
      }
    }
  }

  _checkGuardDamage(dt) {
    for (var i = 0; i < this.guards.length; i++) {
      var g = this.guards[i];
      if (g.alertLevel < 2 || g.stunTimer > 0) continue;
      if (g.pos.distanceTo(this.localPlayer.pos) < 2.5) this.localPlayer.takeDamage(15 * dt);
    }
  }

  _checkEvacuation() {
    if (this.localPlayer.pos.distanceTo(new THREE.Vector3(300, 0, 300)) < 10) {
      var cr = 0;
      for (var i = 0; i < this.localPlayer.backpack.length; i++) {
        var s = this.localPlayer.backpack[i];
        if (s && TREASURES[s.key]) cr += TREASURES[s.key].credits;
      }
      this.endGame(cr > 0, cr > 0 ? '成功撤离！获得 ' + cr + ' 学分' : '撤离成功但未携带任何宝物');
    }
  }

  _updateEvents(dt) {
    if (this.gameTime >= this.nextEventTime) {
      this._triggerEvent();
      this.nextEventTime += 300 + Math.random() * 300;
    }
  }

  _triggerEvent() {
    var evts = ['bell', 'blackout', 'rain'];
    var evt = evts[Math.floor(Math.random() * evts.length)];
    if (evt === 'bell') {
      for (var i = 0; i < this.guards.length; i++) { this.guards[i].alertLevel = 1; this.guards[i].alertTimer = 60; this.guards[i].speed *= 1.2; }
      if (this.onEvent) this.onEvent('bell', '晚自习铃响了！全体守卫进入警戒！');
    } else if (evt === 'blackout') {
      this.isPowerOut = true;
      this._dirLight.intensity = 0.05; this._ambientLight.intensity = 0.1;
      this.scene.fog = new THREE.FogExp2(0x000011, 0.015);
      if (this.onEvent) this.onEvent('blackout', '全楼断电！手电筒成为唯一光源！');
      var self = this;
      setTimeout(function () {
        self.isPowerOut = false;
        self._dirLight.intensity = 0.8; self._ambientLight.intensity = 0.4;
        self.scene.fog = null;
        if (self.onEvent) self.onEvent('power_on', '电力恢复！');
      }, 30000);
    } else if (evt === 'rain') {
      if (this.onEvent) this.onEvent('rain', '雨季漏水！小心地面积水！');
    }
  }

  placeMarker(type, position) {
    var mk = { danger: { ch: '危', col: 0xff3333 }, treasure: { ch: '宝', col: 0xffd700 }, retreat: { ch: '撤', col: 0x44ff44 } };
    var m = mk[type]; if (!m) return;
    var mesh = this._createTextItem(m.ch, m.col, m.col, 1.0);
    mesh.position.copy(position); mesh.position.y += 2;
    this.scene.add(mesh); this.markers.push(mesh);
  }

  handleSkillActivation() {
    if (!this.localPlayer) return;
    var r = this.localPlayer.useSkill(); if (!r) return;
    var lp = this.localPlayer;
    if (r.type === 'sprint') {
      lp.isRunning = true;
    } else if (r.type === 'jammer') {
      for (var i = 0; i < this.guards.length; i++)
        if (this.guards[i].pos.distanceTo(lp.pos) < 8) this.guards[i].stunTimer = r.duration;
    } else if (r.type === 'trap') {
      var tc = document.createElement('canvas'); tc.width = 64; tc.height = 64;
      var tctx = tc.getContext('2d');
      tctx.fillStyle = '#44ff44'; tctx.font = 'bold 48px sans-serif';
      tctx.textAlign = 'center'; tctx.textBaseline = 'middle'; tctx.fillText('粘', 32, 32);
      var tsp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(tc), transparent: true }));
      tsp.position.copy(lp.pos); tsp.position.y = 0.1; tsp.scale.set(1, 1, 1);
      this.scene.add(tsp); this.traps.push({ mesh: tsp, owner: lp, remaining: 6.5 });
    } else if (r.type === 'clone') {
      var cp = lp.pos.clone();
      cp.x += (Math.random() - 0.5) * 6; cp.z += (Math.random() - 0.5) * 6;
      var fake = new CampusPlayer(this.engine, lp.careerKey, false, '全息投影');
      fake.pos.copy(cp); this.players.push(fake);
      var self = this;
      setTimeout(function () { self.players = self.players.filter(function (p) { return p !== fake; }); fake.dispose(); }, r.duration * 1000);
    } else if (r.type === 'intimidate') {
      for (var i = 0; i < this.guards.length; i++)
        if (this.guards[i].pos.distanceTo(lp.pos) < 10) this.guards[i].stunTimer = 3;
      this.placeMarker('danger', lp.pos.clone());
    }
  }

  endGame(success, reason) {
    this.isRunning = false; this.isOver = true;
    if (this.onEnd) this.onEnd(success, reason, this.localPlayer);
  }

  dispose() {
    this.isRunning = false;
    var i;
    for (i = 0; i < this.players.length; i++) this.players[i].dispose();
    for (i = 0; i < this.guards.length; i++) this.guards[i].dispose();
    var spriteLists = [this.treasures, this.consumables, this.markers];
    for (var s = 0; s < spriteLists.length; s++)
      for (i = 0; i < spriteLists[s].length; i++) {
        this.scene.remove(spriteLists[s][i].mesh || spriteLists[s][i]);
        var mat = (spriteLists[s][i].mesh || spriteLists[s][i]).material;
        if (mat) { if (mat.map) mat.map.dispose(); mat.dispose(); }
      }
    for (i = 0; i < this.traps.length; i++) {
      this.scene.remove(this.traps[i].mesh);
      this.traps[i].mesh.material.map.dispose(); this.traps[i].mesh.material.dispose();
    }
    if (this._ground) { this.scene.remove(this._ground); this._ground.geometry.dispose(); this._ground.material.dispose(); }
    this.scene.remove(this._ambientLight); this.scene.remove(this._dirLight);
    this.players = []; this.guards = []; this.treasures = []; this.consumables = [];
    this.traps = []; this.markers = []; this.localPlayer = null;
  }
}

// Helper: create THREE.Vector3 shorthand
function v3(x, y, z) { return new THREE.Vector3(x, y, z); }