// ============================================
// 3D BED WARS ENGINE - Scene, World, Entities
// ============================================

const TEAMS = {
  RED:    { name: '红队', color: 0xff4444, hex: '#ff4444', spawn: new THREE.Vector3(-60, 3, -60) },
  BLUE:   { name: '蓝队', color: 0x4444ff, hex: '#4444ff', spawn: new THREE.Vector3( 60, 3, -60) },
  GREEN:  { name: '绿队', color: 0x44ff44, hex: '#44ff44', spawn: new THREE.Vector3(-60, 3,  60) },
  YELLOW: { name: '黄队', color: 0xffdd00, hex: '#ffdd00', spawn: new THREE.Vector3( 60, 3,  60) }
};

const ROLES = {
  WARRIOR: {
    name: '战士', hp: 120,
    passive: { name: '坚韧', desc: '每秒恢复1点生命值' },
    active: { name: '狂暴', desc: '5秒内攻击力翻倍', cd: 30 }
  },
  BUILDER: {
    name: '建筑师', hp: 90,
    passive: { name: '工匠', desc: '方块价格减半' },
    active: { name: '要塞', desc: '面前生成3x3防御墙', cd: 20 }
  },
  ASSASSIN: {
    name: '刺客', hp: 80,
    passive: { name: '疾风', desc: '移动速度+20%' },
    active: { name: '隐匿', desc: '隐身3秒', cd: 25 }
  },
  ARCHER: {
    name: '射手', hp: 100,
    passive: { name: '精准', desc: '弓箭伤害+30%' },
    active: { name: '连射', desc: '一次射出3支箭', cd: 15 }
  }
};

// ============================================
// Resource Types (刷新速度减缓)
// ============================================
const RES = {
  COPPER: { name: '铜币', color: 0xcd7f32, spawnSec: 4,  key: 'copper' },
  SILVER: { name: '银币', color: 0xc0c0c0, spawnSec: 12, key: 'silver' },
  GOLD:   { name: '金币', color: 0xffd700, spawnSec: 30, key: 'gold'   },
  JADE:   { name: '玉佩', color: 0x00a86b, spawnSec: 90, key: 'jade'   }
};

// ============================================
// Item Database
// ============================================
const ITEM_DB = {
  wood_plank:   { name: '木板',  type: 'block',  cost: { copper: 16 },       hp: 20,  desc: '基础建筑材料', stack: 64 },
  stone_plate:  { name: '石板',  type: 'block',  cost: { silver: 8 },        hp: 60,  desc: '中级建筑材料', stack: 64 },
  iron_plate:   { name: '铁板',  type: 'block',  cost: { gold: 4 },          hp: 120, desc: '高级建筑材料', stack: 64 },
  titanium:     { name: '钛板',  type: 'block',  cost: { jade: 2 },          hp: 300, desc: '顶级建筑材料', stack: 64 },
  wood_sword:   { name: '木剑',  type: 'weapon', cost: { silver: 4 },        dmg: 4,  desc: '基础近战武器', stack: 1 },
  stone_sword:  { name: '石剑',  type: 'weapon', cost: { silver: 8 },        dmg: 8,  desc: '中级近战武器', stack: 1 },
  iron_sword:   { name: '铁剑',  type: 'weapon', cost: { gold: 4 },          dmg: 12, desc: '高级近战武器', stack: 1 },
  diamond_sword:{ name: '钻石剑',type: 'weapon', cost: { jade: 2 },          dmg: 20, desc: '顶级近战武器', stack: 1 },
  bow:          { name: '弓',    type: 'weapon', cost: { silver: 12 },       dmg: 6,  desc: '远程武器', ranged: true, stack: 1 },
  arrow:        { name: '箭',    type: 'ammo',   cost: { silver: 2 },        count: 8, desc: '箭矢x8', stack: 64 },
  std_armor:    { name: '标准甲',type: 'armor',  cost: { gold: 8 },          armor: 20, desc: '基础防护', stack: 1 },
  fine_armor:   { name: '精制甲',type: 'armor',  cost: { gold: 16 },         armor: 40, desc: '中级防护', stack: 1 },
  rd_armor:     { name: '研发甲',type: 'armor',  cost: { jade: 4 },          armor: 60, desc: '顶级防护', stack: 1 },
  tnt:          { name: '炸药',  type: 'special',cost: { gold: 8 },          desc: '破坏3x3范围方块', stack: 4 },
  portal:       { name: '传送门',type: 'special',cost: { jade: 2 },          desc: '瞬移至基地', stack: 2 },
  potion:       { name: '生命药水',type:'special',cost: { gold: 4 },          desc: '恢复全部生命', stack: 8 }
};

// ============================================
// Engine Core
// ============================================
class Engine {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 70, 190);
    this.clock = new THREE.Clock();
    this.entities = [];
    this.blocks = new Map(); // key="x,y,z"
    this.particles = [];
    this.projectiles = [];
    this.dropItems = [];     // 地面掉落物

    // Camera
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(50, 80, 30);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.left = -110; dir.shadow.camera.right = 110;
    dir.shadow.camera.top = 110; dir.shadow.camera.bottom = -110;
    this.scene.add(dir);

    // Void plane (visual only)
    const voidGeo = new THREE.PlaneGeometry(320, 320);
    const voidMat = new THREE.MeshBasicMaterial({ color: 0x000510 });
    const voidPlane = new THREE.Mesh(voidGeo, voidMat);
    voidPlane.rotation.x = -Math.PI / 2;
    voidPlane.position.y = -15;
    this.scene.add(voidPlane);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 300; i++) {
      starPos.push((Math.random() - 0.5) * 200, 30 + Math.random() * 80, (Math.random() - 0.5) * 200);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, transparent: true, opacity: 0.8 });
    this.scene.add(new THREE.Points(starGeo, starMat));

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  addEntity(ent) { this.entities.push(ent); this.scene.add(ent.mesh); }
  removeEntity(ent) {
    const i = this.entities.indexOf(ent);
    if (i >= 0) { this.entities.splice(i, 1); this.scene.remove(ent.mesh); }
  }

  getBlockKey(x, y, z) { return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`; }

  placeBlock(x, y, z, typeKey, team) {
    const key = this.getBlockKey(x, y, z);
    if (this.blocks.has(key)) return false;
    const info = ITEM_DB[typeKey];
    if (!info) return false;

    const geo = new THREE.BoxGeometry(1, 1, 1);
    let color = 0xcccccc;
    if (typeKey === 'wood_plank') color = 0x8B4513;
    else if (typeKey === 'stone_plate') color = 0x808080;
    else if (typeKey === 'iron_plate') color = 0xaaaaaa;
    else if (typeKey === 'titanium') color = 0x66aaff;

    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(Math.floor(x) + 0.5, Math.floor(y) + 0.5, Math.floor(z) + 0.5);
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.scene.add(mesh);

    this.blocks.set(key, { mesh, type: typeKey, hp: info.hp || 20, maxHp: info.hp || 20, team });
    return true;
  }

  removeBlock(x, y, z) {
    const key = this.getBlockKey(x, y, z);
    const blk = this.blocks.get(key);
    if (!blk) return false;
    this.scene.remove(blk.mesh);
    this.blocks.delete(key);
    this.spawnParticles(blk.mesh.position, 0xcccccc, 6);
    return true;
  }

  damageBlock(x, y, z, dmg) {
    const key = this.getBlockKey(x, y, z);
    const blk = this.blocks.get(key);
    if (!blk) return false;
    blk.hp -= dmg;
    if (blk.hp <= 0) {
      this.removeBlock(x, y, z);
      return true;
    }
    const ratio = blk.hp / blk.maxHp;
    blk.mesh.material.color.setHex(ratio > 0.5 ? 0xcccccc : 0xff6666);
    return false;
  }

  spawnParticles(pos, color, count) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.position.x += (Math.random() - 0.5) * 0.8;
      mesh.position.y += (Math.random() - 0.5) * 0.8;
      mesh.position.z += (Math.random() - 0.5) * 0.8;
      this.scene.add(mesh);
      this.particles.push({
        mesh, life: 1.0,
        vel: new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3)
      });
    }
  }

  raycastBlocks(origin, dir, maxDist = 5) {
    const step = 0.1;
    const p = origin.clone();
    for (let d = 0; d < maxDist; d += step) {
      p.addScaledVector(dir, step);
      const key = this.getBlockKey(p.x, p.y, p.z);
      if (this.blocks.has(key)) {
        return { hit: true, pos: p.clone(), key, block: this.blocks.get(key) };
      }
    }
    return { hit: false };
  }

  // ============================================
  // Drop Item System
  // ============================================
  spawnDropItem(pos, typeKey, count = 1) {
    const item = ITEM_DB[typeKey];
    if (!item) return null;

    const geo = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12);
    const mat = new THREE.MeshLambertMaterial({ color: item.type === 'block' ? 0x8B4513 : RES[typeKey.toUpperCase()]?.color || 0xcccccc, emissive: 0x222222 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y = Math.max(0.5, pos.y + 0.5);
    mesh.castShadow = true;
    this.scene.add(mesh);

    // 名字标签
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${item.name}${count > 1 ? ' x' + count : ''}`, 64, 22);
    const tex = new THREE.CanvasTexture(canvas);
    const labelMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.85 });
    const label = new THREE.Sprite(labelMat);
    label.scale.set(1.2, 0.3, 1);
    label.position.y = 0.5;
    mesh.add(label);

    const drop = {
      mesh, label,
      pos: mesh.position.clone(),
      typeKey,
      count,
      life: 60, // 60秒后消失
      floatOffset: Math.random() * Math.PI * 2,
      radius: 0.35
    };
    this.dropItems.push(drop);
    return drop;
  }

  spawnCurrencyDrop(pos, resKey, count = 1) {
    const resInfo = RES[resKey.toUpperCase()];
    if (!resInfo) return null;

    const geo = new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16);
    const mat = new THREE.MeshLambertMaterial({ color: resInfo.color, emissive: resInfo.color, emissiveIntensity: 0.3 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y = Math.max(0.5, pos.y + 0.5);
    mesh.castShadow = true;
    this.scene.add(mesh);

    const drop = {
      mesh, label: null,
      pos: mesh.position.clone(),
      currency: resInfo.key,
      count,
      life: 45, // 货币45秒消失
      floatOffset: Math.random() * Math.PI * 2,
      radius: 0.35,
      isCurrency: true
    };
    this.dropItems.push(drop);
    return drop;
  }

  removeDropItem(drop) {
    const i = this.dropItems.indexOf(drop);
    if (i >= 0) {
      this.scene.remove(drop.mesh);
      this.dropItems.splice(i, 1);
    }
  }

  explodeAt(pos, radius, dmg) {
    // 炸毁方块
    const rx = Math.floor(pos.x);
    const ry = Math.floor(pos.y);
    const rz = Math.floor(pos.z);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          this.damageBlock(rx + dx, ry + dy, rz + dz, dmg);
        }
      }
    }
    // 炸毁范围内的掉落物
    for (let i = this.dropItems.length - 1; i >= 0; i--) {
      const d = this.dropItems[i];
      if (d.pos.distanceTo(pos) <= radius + 1.5) {
        this.spawnParticles(d.pos, 0xff4400, 5);
        this.removeDropItem(d);
      }
    }
    this.spawnParticles(pos, 0xff4400, 20);
  }

  update(dt) {
    // Entities
    for (const e of this.entities) e.update(dt);

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.vel.y -= 5 * dt;
      p.mesh.material.opacity = p.life;
      p.mesh.rotation.x += dt * 3;
      p.mesh.rotation.y += dt * 2;
      if (p.life <= 0) { this.scene.remove(p.mesh); this.particles.splice(i, 1); }
    }

    // Drop Items (浮动动画 + 自动拾取 + 超时消失)
    for (let i = this.dropItems.length - 1; i >= 0; i--) {
      const d = this.dropItems[i];
      d.life -= dt;
      d.floatOffset += dt * 2;
      d.mesh.position.y = d.pos.y + Math.sin(d.floatOffset) * 0.15;
      d.mesh.rotation.y += dt * 1.5;

      if (d.life <= 0) {
        this.spawnParticles(d.mesh.position, d.isCurrency ? RES[d.currency.toUpperCase()]?.color : 0xcccccc, 3);
        this.removeDropItem(d);
        continue;
      }

      // 玩家靠近自动拾取
      for (const ent of this.entities) {
        if (ent.isDead || !ent.isLocal) continue;
        const dist = ent.pos.distanceTo(d.mesh.position);
        if (dist < 1.8) {
          // 向玩家移动
          const pull = ent.pos.clone().sub(d.mesh.position).normalize().multiplyScalar(6 * dt);
          d.mesh.position.add(pull);
          d.pos.copy(d.mesh.position);
          if (dist < 0.6) {
            // 拾取
            if (d.isCurrency) {
              ent.inv[d.currency] = (ent.inv[d.currency] || 0) + d.count;
            } else {
              ent.addToBackpack(d.typeKey, d.count);
            }
            this.spawnParticles(d.mesh.position, d.isCurrency ? RES[d.currency.toUpperCase()]?.color : 0xffdd00, 4);
            this.removeDropItem(d);
            break;
          }
        }
      }
    }

    // Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.mesh.position.addScaledVector(proj.vel, dt);
      proj.vel.y -= 9.8 * dt;
      proj.life -= dt;

      // Block collision
      const rc = this.raycastBlocks(proj.mesh.position, proj.vel.clone().normalize(), 0.5);
      if (rc.hit) {
        this.damageBlock(rc.pos.x, rc.pos.y, rc.pos.z, proj.damage);
        this.spawnParticles(proj.mesh.position, 0xffaa00, 4);
        this.scene.remove(proj.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Entity collision
      for (const ent of this.entities) {
        if (ent === proj.owner) continue;
        if (ent.isDead) continue;
        const dist = proj.mesh.position.distanceTo(ent.mesh.position);
        if (dist < (ent.radius || 0.5) + 0.2) {
          ent.takeDamage(proj.damage, proj.owner);
          this.spawnParticles(proj.mesh.position, 0xff0000, 5);
          this.scene.remove(proj.mesh);
          this.projectiles.splice(i, 1);
          break;
        }
      }

      if (proj.life <= 0 || proj.mesh.position.y < -20) {
        this.scene.remove(proj.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  render() { this.renderer.render(this.scene, this.camera); }
}

// ============================================
// World Generator (减少资源点)
// ============================================
function generateWorld(engine) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  engine.tidalIslands = [];
  engine.temporaryGens = [];

  function createIsland(cx, cz, size, color, options = {}) {
    const mat = new THREE.MeshLambertMaterial({ color });
    const island = { cx, cz, baseX: cx, baseZ: cz, size, color, blocks: [], active: true, tidal: !!options.tidal };
    for (let x = -size; x <= size; x++) {
      for (let z = -size; z <= size; z++) {
        if (x * x + z * z > size * size + 2) continue;
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(cx + x, 0, cz + z);
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        const key = engine.getBlockKey(cx + x, 0, cz + z);
        engine.blocks.set(key, { mesh, type: 'ground', hp: 9999, maxHp: 9999, island });
        const mesh2 = new THREE.Mesh(geo, mat);
        mesh2.position.set(cx + x, -1, cz + z);
        engine.scene.add(mesh2);
        island.blocks.push({ relX: x, relZ: z, mesh, mesh2, key });
      }
    }
    if (options.tidal) engine.tidalIslands.push(island);
    return island;
  }

  function moveIsland(island, nx, nz) {
    for (const b of island.blocks) engine.blocks.delete(b.key);
    island.cx = nx; island.cz = nz;
    for (const b of island.blocks) {
      const x = nx + b.relX;
      const z = nz + b.relZ;
      b.mesh.position.set(x, 0, z);
      b.mesh2.position.set(x, -1, z);
      b.key = engine.getBlockKey(x, 0, z);
      if (island.active) engine.blocks.set(b.key, { mesh: b.mesh, type: 'ground', hp: 9999, maxHp: 9999, island });
    }
  }

  function setIslandActive(island, active) {
    island.active = active;
    for (const b of island.blocks) {
      b.mesh.visible = active;
      b.mesh2.visible = active;
      if (active) engine.blocks.set(b.key, { mesh: b.mesh, type: 'ground', hp: 9999, maxHp: 9999, island });
      else engine.blocks.delete(b.key);
    }
    if (island.generator) {
      island.generator.active = active;
      island.generator.mesh.visible = active;
    }
  }

  // 筑梦岛：四队专属基地岛
  const islandSize = 6;
  createIsland(TEAMS.RED.spawn.x, TEAMS.RED.spawn.z, islandSize, TEAMS.RED.color);
  createIsland(TEAMS.BLUE.spawn.x, TEAMS.BLUE.spawn.z, islandSize, TEAMS.BLUE.color);
  createIsland(TEAMS.GREEN.spawn.x, TEAMS.GREEN.spawn.z, islandSize, TEAMS.GREEN.color);
  createIsland(TEAMS.YELLOW.spawn.x, TEAMS.YELLOW.spawn.z, islandSize, TEAMS.YELLOW.color);

  // 中枢梦域：大型中心岛 + 四个附岛
  createIsland(0, 0, 13, 0x5a7a5a);
  createIsland(-22, 0, 4, 0x4f7f7a);
  createIsland(22, 0, 4, 0x4f7f7a);
  createIsland(0, -22, 4, 0x4f7f7a);
  createIsland(0, 22, 4, 0x4f7f7a);

  // Beds
  const bedGeo = new THREE.BoxGeometry(2, 0.6, 1.2);
  const bedMatRed = new THREE.MeshLambertMaterial({ color: 0xff3333 });
  for (const [key, team] of Object.entries(TEAMS)) {
    const bed = new THREE.Mesh(bedGeo, bedMatRed.clone());
    bed.material.color.setHex(team.color);
    const s = team.spawn;
    bed.position.set(s.x, 0.8, s.z);
    bed.castShadow = true;
    engine.scene.add(bed);
    team.bedMesh = bed;
    team.bedPos = new THREE.Vector3(s.x, 0.8, s.z);
    team.bedAlive = true;
  }

  // Resource Generators (减少数量，减缓刷新)
  const genGeo = new THREE.CylinderGeometry(0.6, 0.8, 1.2, 8);
  const gens = [];

  // 筑梦岛基础资源生成器：铜币（每队1个）
  for (const [key, team] of Object.entries(TEAMS)) {
    const mat = new THREE.MeshLambertMaterial({ color: RES.COPPER.color });
    const mesh = new THREE.Mesh(genGeo, mat);
    const dirX = team.spawn.x > 0 ? -1 : 1;
    const dirZ = team.spawn.z > 0 ? -1 : 1;
    mesh.position.set(team.spawn.x + dirX * 4, 1.1, team.spawn.z + dirZ * 4);
    mesh.castShadow = true;
    engine.scene.add(mesh);
    gens.push({ mesh, type: 'COPPER', team: key, pos: mesh.position.clone(), timer: 0, spawnSec: RES.COPPER.spawnSec, ready: true });
  }

  // 资源浮岛：减少到4座（银/金混合）
  const silverMat = new THREE.MeshLambertMaterial({ color: RES.SILVER.color });
  const goldMat = new THREE.MeshLambertMaterial({ color: RES.GOLD.color });
  const jadeMat = new THREE.MeshLambertMaterial({ color: RES.JADE.color });
  const floatingMatColor = 0x6c6aa8;

  const floatingIslands = [
    { x: -38, z: -18, type: 'SILVER' },
    { x:  38, z: -18, type: 'SILVER' },
    { x: -38, z:  18, type: 'GOLD' },
    { x:  38, z:  18, type: 'GOLD' }
  ];

  for (const f of floatingIslands) {
    const island = createIsland(f.x, f.z, 4, floatingMatColor, { tidal: true });
    const mat = (f.type === 'GOLD' ? goldMat : silverMat).clone();
    const mesh = new THREE.Mesh(genGeo, mat);
    mesh.position.set(f.x, 1.1, f.z);
    mesh.castShadow = true;
    engine.scene.add(mesh);
    const gen = { mesh, type: f.type, pos: mesh.position.clone(), timer: 0, spawnSec: RES[f.type].spawnSec, ready: true, island, active: true };
    island.generator = gen;
    gens.push(gen);
  }

  // 中心岛资源生成器（减少到7个）
  const centerGens = [
    { pos: new THREE.Vector3( 0, 1.1,  0), type: 'JADE',   mat: jadeMat },
    { pos: new THREE.Vector3(-8, 1.1,  0), type: 'GOLD',   mat: goldMat },
    { pos: new THREE.Vector3( 8, 1.1,  0), type: 'GOLD',   mat: goldMat },
    { pos: new THREE.Vector3( 0, 1.1, -8), type: 'GOLD',   mat: goldMat },
    { pos: new THREE.Vector3( 0, 1.1,  8), type: 'GOLD',   mat: goldMat },
    { pos: new THREE.Vector3(-10, 1.1, -10), type: 'SILVER', mat: silverMat },
    { pos: new THREE.Vector3( 10, 1.1,  10), type: 'SILVER', mat: silverMat }
  ];
  for (const g of centerGens) {
    const mesh = new THREE.Mesh(genGeo, g.mat.clone());
    mesh.position.copy(g.pos);
    mesh.castShadow = true;
    engine.scene.add(mesh);
    gens.push({ mesh, type: g.type, pos: g.pos.clone(), timer: 0, spawnSec: RES[g.type].spawnSec, ready: true });
  }

  // 梦域潮汐
  engine.triggerDreamTide = function(gensRef) {
    const activeCount = 2 + Math.floor(Math.random() * 2);
    const shuffled = [...engine.tidalIslands].sort(() => Math.random() - 0.5);
    shuffled.forEach((island, index) => {
      const active = index < activeCount;
      const angle = Math.atan2(island.baseZ, island.baseX) + (Math.random() - 0.5) * 0.55;
      const radius = 35 + Math.random() * 10;
      const nx = Math.round(Math.cos(angle) * radius);
      const nz = Math.round(Math.sin(angle) * radius);
      moveIsland(island, nx, nz);
      setIslandActive(island, active);
      if (island.generator) {
        island.generator.mesh.position.set(nx, 1.1, nz);
        island.generator.pos.set(nx, 1.1, nz);
        island.generator.ready = true;
        island.generator.type = Math.random() < 0.3 ? 'GOLD' : 'SILVER';
        island.generator.mesh.material.color.setHex(RES[island.generator.type].color);
      }
    });

    for (const g of engine.temporaryGens) {
      g.mesh.visible = false;
      g.active = false;
      if (g.tempIsland) setIslandActive(g.tempIsland, false);
    }
    engine.temporaryGens.length = 0;

    const tempCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < tempCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 18 + Math.random() * 18;
      const type = Math.random() < 0.6 ? 'GOLD' : 'JADE';
      const ix = Math.round(Math.cos(angle) * radius);
      const iz = Math.round(Math.sin(angle) * radius);
      const tempIsland = createIsland(ix, iz, 2, 0x7f57c2);
      const mat = new THREE.MeshLambertMaterial({ color: RES[type].color, emissive: RES[type].color, emissiveIntensity: 0.25 });
      const mesh = new THREE.Mesh(genGeo, mat);
      mesh.position.set(ix, 1.3, iz);
      mesh.castShadow = true;
      engine.scene.add(mesh);
      const gen = { mesh, type, pos: mesh.position.clone(), timer: 0, spawnSec: Math.max(15, RES[type].spawnSec - 10), ready: true, active: true, temporary: true, tempIsland };
      engine.temporaryGens.push(gen);
      gensRef.push(gen);
    }
  };

  return gens;
}

// ============================================
// Player Entity (带背包系统)
// ============================================
class PlayerEntity {
  constructor(engine, teamKey, roleKey, isLocal = false, name = 'Player', playerId = null) {
    this.engine = engine;
    this.team = teamKey;
    this.role = roleKey;
    this.isLocal = isLocal;
    this.name = name;
    this.playerId = playerId || name;
    this.roleInfo = ROLES[roleKey];
    this.teamInfo = TEAMS[teamKey];

    // Stats
    this.maxHp = this.roleInfo.hp;
    this.hp = this.maxHp;
    this.armor = 0;
    this.isDead = false;
    this.respawnTimer = 0;
    this.radius = 0.4;

    // Movement
    this.pos = this.teamInfo.spawn.clone();
    this.vel = new THREE.Vector3();
    this.onGround = false;
    this.speed = roleKey === 'ASSASSIN' ? 7 : 6;
    this.jumpPower = 7;
    this.yaw = 0; this.pitch = 0;

    // ====== 全新背包系统 ======
    this.inv = { copper: 0, silver: 0, gold: 0, jade: 0 };
    // 快捷栏：8个槽位，每个存 { key, count }
    this.hotbar = Array(8).fill(null);
    this.hotbarIndex = 0; // 当前选中的快捷栏槽位
    // 背包：20格
    this.backpack = Array(20).fill(null);
    // 已装备
    this.equipped = { weapon: null, armor: null };
    // 箭矢
    this.arrowCount = 0;

    // Combat
    this.attackCd = 0;
    this.attackRange = 2.2;
    this.baseDmg = 2;

    // Anti-cheat tracking
    this.acBlocksPlaced = 0;
    this.acBlockPlaceWindow = 0;
    this.acJumpCount = 0;
    this.acJumpWindow = 0;
    this.acLastPos = this.pos.clone();
    this.acSpeedCheckTimer = 0;
    this.acAlertSent = false;
    this.isFrozen = false;
    this.isMuted = false;
    this.aiTakeover = false;

    // Skills
    this.skillCd = 0;
    this.skillActive = 0;
    this.isInvisible = false;

    // Mesh
    const geo = new THREE.CapsuleGeometry(0.35, 0.9, 4, 8);
    const mat = new THREE.MeshLambertMaterial({ color: this.teamInfo.color });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(this.pos);
    this.mesh.castShadow = true;

    // Name label
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = this.teamInfo.hex;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, 128, 42);
    const tex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    this.nameTag = new THREE.Sprite(spriteMat);
    this.nameTag.scale.set(2, 0.5, 1);
    this.nameTag.position.y = 1.4;
    this.mesh.add(this.nameTag);

    // Weapon mesh
    this.weaponMesh = null;

    engine.addEntity(this);
  }

  // ====== 快捷栏/背包操作 ======
  getSelectedItem() {
    return this.hotbar[this.hotbarIndex];
  }

  setHotbarIndex(idx) {
    this.hotbarIndex = Math.max(0, Math.min(7, idx));
    const item = this.getSelectedItem();
    if (item && ITEM_DB[item.key]?.type === 'weapon') {
      this.equipped.weapon = item.key;
      this.updateWeaponMesh();
    }
  }

  // 添加物品到背包系统
  addToBackpack(key, count = 1) {
    const info = ITEM_DB[key];
    if (!info) return false;

    // 货币直接存
    if (key === 'copper' || key === 'silver' || key === 'gold' || key === 'jade') {
      this.inv[key] = (this.inv[key] || 0) + count;
      return true;
    }

    // 箭矢特殊处理
    if (key === 'arrow') {
      this.arrowCount += info.count || 8;
      return true;
    }

    // 特殊物品：药水直接使用
    if (key === 'potion') {
      this.hp = this.maxHp;
      return true;
    }
    if (key === 'portal') {
      this.pos.copy(this.teamInfo.spawn);
      this.vel.set(0, 0, 0);
      return true;
    }
    if (key === 'tnt') {
      // TNT 使用逻辑在游戏层处理
    }

    const stack = info.stack || 1;

    // 先尝试合并到快捷栏
    for (let i = 0; i < this.hotbar.length; i++) {
      const slot = this.hotbar[i];
      if (slot && slot.key === key && slot.count < stack) {
        const add = Math.min(count, stack - slot.count);
        slot.count += add;
        count -= add;
        if (count <= 0) return true;
      }
    }

    // 再尝试放入空快捷栏槽
    for (let i = 0; i < this.hotbar.length; i++) {
      if (!this.hotbar[i]) {
        this.hotbar[i] = { key, count: Math.min(count, stack) };
        count -= this.hotbar[i].count;
        if (count <= 0) return true;
      }
    }

    // 最后放入背包
    for (let i = 0; i < this.backpack.length; i++) {
      const slot = this.backpack[i];
      if (slot && slot.key === key && slot.count < stack) {
        const add = Math.min(count, stack - slot.count);
        slot.count += add;
        count -= add;
        if (count <= 0) return true;
      }
    }
    for (let i = 0; i < this.backpack.length; i++) {
      if (!this.backpack[i]) {
        this.backpack[i] = { key, count: Math.min(count, stack) };
        count -= this.backpack[i].count;
        if (count <= 0) return true;
      }
    }

    return count <= 0; // 是否全部放入
  }

  // 丢弃当前快捷栏选中的物品
  dropSelectedItem() {
    const item = this.hotbar[this.hotbarIndex];
    if (!item) return false;
    const dropPos = this.pos.clone();
    dropPos.x += (Math.random() - 0.5) * 0.5;
    dropPos.z += (Math.random() - 0.5) * 0.5;
    this.engine.spawnDropItem(dropPos, item.key, item.count);
    this.hotbar[this.hotbarIndex] = null;
    // 如果丢弃的是当前装备武器，取消装备
    if (this.equipped.weapon === item.key) {
      this.equipped.weapon = null;
      this.updateWeaponMesh();
    }
    return true;
  }

  // 快捷栏物品使用/装备
  useHotbarItem() {
    const item = this.getSelectedItem();
    if (!item) return;
    const info = ITEM_DB[item.key];
    if (!info) return;

    if (info.type === 'weapon') {
      this.equipped.weapon = item.key;
      this.updateWeaponMesh();
    } else if (info.type === 'armor') {
      this.equipped.armor = item.key;
      this.armor = info.armor;
      // 护甲使用后从快捷栏移除（或减1）
      item.count--;
      if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
    } else if (info.type === 'block') {
      // 放置方块由外部调用 placeBlock 处理
    } else if (item.key === 'tnt') {
      // TNT 爆炸
      const dir = this.getForwardDir();
      const rc = this.engine.raycastBlocks(this.pos.clone().add(new THREE.Vector3(0, 0.5, 0)), dir, 5);
      if (rc.hit) {
        this.engine.explodeAt(rc.pos, 3, 999);
        item.count--;
        if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
      }
    } else if (item.key === 'potion') {
      this.hp = this.maxHp;
      item.count--;
      if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
    } else if (item.key === 'portal') {
      this.pos.copy(this.teamInfo.spawn);
      this.vel.set(0, 0, 0);
      item.count--;
      if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
    }
  }

  // 快捷栏选中的是否为方块
  isBlockSelected() {
    const item = this.getSelectedItem();
    return item && ITEM_DB[item.key]?.type === 'block';
  }

  getSelectedBlockType() {
    const item = this.getSelectedItem();
    return item?.key || null;
  }

  update(dt) {
    if (this.isDead) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.respawn();
      return;
    }

    // Passive heal (Warrior)
    if (this.role === 'WARRIOR' && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + dt);
    }

    // Skill timers
    if (this.attackCd > 0) this.attackCd -= dt;
    if (this.skillCd > 0) this.skillCd -= dt;
    if (this.skillActive > 0) {
      this.skillActive -= dt;
      if (this.skillActive <= 0) this.deactivateSkill();
    }

    // Physics
    this.vel.y -= 18 * dt;
    this.pos.addScaledVector(this.vel, dt);

    // Ground collision
    this.onGround = false;
    const groundH = this.getGroundHeight(this.pos.x, this.pos.z);
    if (this.pos.y <= groundH + this.radius) {
      this.pos.y = groundH + this.radius;
      this.vel.y = 0;
      this.onGround = true;
    }

    // Block collision
    this.resolveBlockCollision();

    // Void death
    if (this.pos.y < -15) {
      this.die(null);
      return;
    }

    // Anti-cheat detection
    if (!this.isDead && !this.acAlertSent) {
      this.acBlockPlaceWindow -= dt;
      if (this.acBlockPlaceWindow <= 0) { this.acBlocksPlaced = 0; this.acBlockPlaceWindow = 1; }
      this.acJumpWindow -= dt;
      if (this.acJumpWindow <= 0) { this.acJumpCount = 0; this.acJumpWindow = 0.5; }
      this.acSpeedCheckTimer -= dt;
      if (this.acSpeedCheckTimer <= 0) {
        this.acSpeedCheckTimer = 1;
        const dist = this.pos.distanceTo(this.acLastPos);
        const maxSpeed = this.speed * 3;
        if (dist > maxSpeed && this.pos.y > -10) {
          window.game?.reportCheat?.(this.playerId, 'speed_hack', { dist, maxSpeed, pos: this.pos.toArray() }, 4);
        }
        this.acLastPos.copy(this.pos);
      }
    }

    // Update mesh
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.yaw;

    // Invisibility visual
    if (this.isInvisible) {
      this.mesh.material.transparent = true;
      this.mesh.material.opacity = 0.3;
    } else {
      this.mesh.material.transparent = false;
      this.mesh.material.opacity = 1;
    }

    // Camera follow
    if (this.isLocal) {
      const camDist = 4;
      const camHeight = 2.5;
      const targetPos = new THREE.Vector3(
        this.pos.x - Math.sin(this.yaw) * Math.cos(this.pitch) * camDist,
        this.pos.y + camHeight + Math.sin(this.pitch) * camDist * 0.5,
        this.pos.z - Math.cos(this.yaw) * Math.cos(this.pitch) * camDist
      );
      this.engine.camera.position.lerp(targetPos, 10 * dt);
      this.engine.camera.lookAt(this.pos.x, this.pos.y + 1, this.pos.z);
    }
  }

  getGroundHeight(x, z) {
    for (let y = Math.floor(this.pos.y + 2); y >= -5; y--) {
      const key = this.engine.getBlockKey(x, y, z);
      const blk = this.engine.blocks.get(key);
      if (blk && blk.type !== 'ground') return y + 0.5;
      if (blk && blk.type === 'ground') return y + 0.5;
    }
    return -100;
  }

  resolveBlockCollision() {
    const check = [
      { dx: 1, dz: 0 }, { dx: -1, dz: 0 },
      { dx: 0, dz: 1 }, { dx: 0, dz: -1 }
    ];
    for (const c of check) {
      const key = this.engine.getBlockKey(this.pos.x + c.dx * this.radius, this.pos.y, this.pos.z + c.dz * this.radius);
      const blk = this.engine.blocks.get(key);
      if (blk && blk.type !== 'ground') {
        const blockY = parseInt(key.split(',')[1]);
        const blockTop = blockY + 0.5;
        const feetY = this.pos.y - this.radius;
        const diff = blockTop - feetY;
        if (diff > 0 && diff <= 0.6) {
          this.pos.y += diff + 0.02;
          continue;
        }
        if (feetY >= blockTop - 0.15) continue;
        if (c.dx !== 0) this.pos.x = Math.round(this.pos.x + c.dx * this.radius) - c.dx * (this.radius + 0.51);
        if (c.dz !== 0) this.pos.z = Math.round(this.pos.z + c.dz * this.radius) - c.dz * (this.radius + 0.51);
      }
    }
  }

  moveInput(dx, dz, sprint = false) {
    if (this.isDead) return;
    const spd = (sprint ? 1.5 : 1) * this.speed;
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(-Math.cos(this.yaw), 0, Math.sin(this.yaw));
    const moveDir = new THREE.Vector3();
    moveDir.addScaledVector(forward, -dz);
    moveDir.addScaledVector(right, dx);
    this.vel.x = moveDir.x * spd;
    this.vel.z = moveDir.z * spd;
  }

  jump() {
    if (this.onGround && !this.isDead) {
      this.vel.y = this.jumpPower;
      this.onGround = false;
      this.acJumpCount++;
      if (this.acJumpCount > 3 && this.pos.y < -5) {
        window.game?.reportCheat?.(this.playerId, 'void_jump', { count: this.acJumpCount, y: this.pos.y }, 3);
      }
    }
  }

  look(dx, dy) {
    this.yaw -= dx * 0.003;
    this.pitch -= dy * 0.003;
    this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch));
  }

  getForwardDir() {
    return new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    );
  }

  attack() {
    if (this.isDead || this.attackCd > 0) return;
    this.attackCd = 0.35;

    let dmg = this.baseDmg;
    let range = this.attackRange;
    let isRanged = false;

    if (this.equipped.weapon) {
      const w = ITEM_DB[this.equipped.weapon];
      dmg = w.dmg;
      isRanged = w.ranged;
    }

    if (this.role === 'WARRIOR' && this.skillActive > 0) dmg *= 2;

    if (isRanged && this.arrowCount > 0) {
      this.arrowCount--;
      const dir = this.getForwardDir();
      const start = this.pos.clone().add(new THREE.Vector3(0, 0.8, 0));
      const arrowGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6);
      arrowGeo.rotateX(Math.PI / 2);
      const arrowMat = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
      const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
      arrowMesh.position.copy(start);
      arrowMesh.lookAt(start.clone().add(dir));
      this.engine.scene.add(arrowMesh);
      const speed = 25;
      let finalDmg = dmg;
      if (this.role === 'ARCHER') finalDmg *= 1.3;
      this.engine.projectiles.push({
        mesh: arrowMesh, vel: dir.multiplyScalar(speed), life: 3,
        damage: finalDmg, owner: this
      });
    } else if (!isRanged) {
      const dir = this.getForwardDir();
      const hitPos = this.pos.clone().add(new THREE.Vector3(0, 0.5, 0)).addScaledVector(dir, range * 0.5);
      this.engine.spawnParticles(hitPos, 0xffffff, 3);

      for (const ent of this.engine.entities) {
        if (ent === this || ent.isDead) continue;
        if (ent.team === this.team) continue;
        const dist = ent.pos.distanceTo(this.pos);
        if (dist < range) {
          ent.takeDamage(dmg, this);
        }
      }

      for (const [tkey, tinfo] of Object.entries(TEAMS)) {
        if (tkey === this.team) continue;
        if (!tinfo.bedAlive) continue;
        const d = this.pos.distanceTo(tinfo.bedPos);
        if (d < range + 1.5) {
          tinfo.bedAlive = false;
          tinfo.bedMesh.visible = false;
          this.engine.spawnParticles(tinfo.bedPos, tinfo.color, 20);
          window.game?.onBedDestroyed(tkey, this);
        }
      }
    }
  }

  placeBlock() {
    if (this.isDead) return;
    const blockType = this.getSelectedBlockType();
    if (!blockType) return;
    const item = this.getSelectedItem();
    if (!item || item.count <= 0) return;

    const dir = this.getForwardDir();
    const reach = 4;
    const rc = this.engine.raycastBlocks(
      this.pos.clone().add(new THREE.Vector3(0, 0.5, 0)),
      dir, reach
    );
    if (rc.hit) {
      const placePos = rc.pos.clone().add(dir.multiplyScalar(0.6));
      const px = Math.round(placePos.x);
      const py = Math.round(placePos.y);
      const pz = Math.round(placePos.z);
      if (Math.abs(px - this.pos.x) < 0.8 && Math.abs(py - this.pos.y) < 1.5 && Math.abs(pz - this.pos.z) < 0.8) return;
      if (this.engine.placeBlock(px, py, pz, blockType, this.team)) {
        item.count--;
        if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
        this.acBlocksPlaced++;
        if (this.acBlocksPlaced > 15) {
          window.game?.reportCheat?.(this.playerId, 'rapid_build', { count: this.acBlocksPlaced }, 3);
        }
      }
    }
  }

  useSkill() {
    if (this.isDead || this.skillCd > 0) return;
    const info = this.roleInfo;
    this.skillCd = info.active.cd;
    this.skillActive = info.active.name === '狂暴' ? 5 : info.active.name === '隐匿' ? 3 : 0;

    if (this.role === 'WARRIOR') {
      window.game?.showMessage(`${this.name} 发动了狂暴！`);
    } else if (this.role === 'ASSASSIN') {
      this.isInvisible = true;
      window.game?.showMessage(`${this.name} 隐身了！`);
    } else if (this.role === 'ARCHER') {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => this.attack(), i * 100);
      }
      window.game?.showMessage(`${this.name} 三连射！`);
    } else if (this.role === 'BUILDER') {
      const dir = this.getForwardDir();
      const face = Math.abs(dir.x) > Math.abs(dir.z) ? 'x' : 'z';
      const center = this.pos.clone().addScaledVector(dir, 2);
      for (let dy = 0; dy < 3; dy++) {
        for (let ds = -1; ds <= 1; ds++) {
          const px = face === 'x' ? Math.floor(center.x) + 1 : Math.floor(center.x) + ds;
          const pz = face === 'z' ? Math.floor(center.z) + 1 : Math.floor(center.z) + ds;
          const py = Math.floor(center.y) + dy;
          this.engine.placeBlock(px, py, pz, 'wood_plank', this.team);
        }
      }
      window.game?.showMessage(`${this.name} 建造了防御墙！`);
    }
  }

  deactivateSkill() {
    if (this.role === 'ASSASSIN') {
      this.isInvisible = false;
    }
  }

  takeDamage(amount, attacker) {
    if (this.isDead) return;
    const reduction = this.armor / (this.armor + 50);
    const actual = Math.max(1, amount * (1 - reduction));
    this.hp -= actual;
    if (attacker) {
      const kb = this.pos.clone().sub(attacker.pos).normalize().multiplyScalar(3);
      kb.y = 2;
      this.vel.add(kb);
    }
    if (this.hp <= 0) {
      this.die(attacker);
    }
  }

  die(killer) {
    if (this.isDead) return;
    this.isDead = true;
    this.hp = 0;
    this.mesh.visible = false;
    this.respawnTimer = 5;
    // 死亡掉落所有快捷栏和背包物品
    for (let i = 0; i < this.hotbar.length; i++) {
      if (this.hotbar[i]) {
        const dropPos = this.pos.clone();
        dropPos.x += (Math.random() - 0.5) * 2;
        dropPos.z += (Math.random() - 0.5) * 2;
        this.engine.spawnDropItem(dropPos, this.hotbar[i].key, this.hotbar[i].count);
        this.hotbar[i] = null;
      }
    }
    for (let i = 0; i < this.backpack.length; i++) {
      if (this.backpack[i]) {
        const dropPos = this.pos.clone();
        dropPos.x += (Math.random() - 0.5) * 2;
        dropPos.z += (Math.random() - 0.5) * 2;
        this.engine.spawnDropItem(dropPos, this.backpack[i].key, this.backpack[i].count);
        this.backpack[i] = null;
      }
    }
    this.engine.spawnParticles(this.pos, this.teamInfo.color, 15);
    window.game?.onPlayerKilled(this, killer);
  }

  respawn() {
    const canRespawn = this.teamInfo.bedAlive;
    if (!canRespawn) {
      window.game?.checkWinCondition();
      return;
    }
    this.isDead = false;
    this.hp = this.maxHp;
    this.pos.copy(this.teamInfo.spawn);
    this.vel.set(0, 0, 0);
    this.mesh.visible = true;
    this.mesh.position.copy(this.pos);
  }

  // 兼容旧 addItem 接口
  addItem(key, count = 1) {
    this.addToBackpack(key, count);
  }

  equip(key) {
    const item = ITEM_DB[key];
    if (!item) return;
    if (item.type === 'weapon') {
      this.equipped.weapon = key;
      this.updateWeaponMesh();
    } else if (item.type === 'armor') {
      this.equipped.armor = key;
      this.armor = item.armor;
    }
  }

  updateWeaponMesh() {
    if (this.weaponMesh) { this.mesh.remove(this.weaponMesh); this.weaponMesh = null; }
    if (!this.equipped.weapon) return;
    const w = ITEM_DB[this.equipped.weapon];
    let geo, color;
    if (w.ranged) {
      geo = new THREE.BoxGeometry(0.1, 0.1, 1.2);
      color = 0x8B4513;
    } else {
      geo = new THREE.BoxGeometry(0.15, 0.15, 0.8);
      if (this.equipped.weapon.includes('wood')) color = 0x8B4513;
      else if (this.equipped.weapon.includes('stone')) color = 0x808080;
      else if (this.equipped.weapon.includes('iron')) color = 0xaaaaaa;
      else color = 0x00ffff;
    }
    const mat = new THREE.MeshLambertMaterial({ color });
    this.weaponMesh = new THREE.Mesh(geo, mat);
    this.weaponMesh.position.set(0.4, 0.3, 0.3);
    this.mesh.add(this.weaponMesh);
  }
}
