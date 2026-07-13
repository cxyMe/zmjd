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
  FOX: {
    name: '狐狸', hp: 90, skinClass: 'role-fox',
    passive: { name: '狐假虎威', desc: '生命低于20%时，造成伤害增加20%' },
    active: { name: '伪装', desc: '12秒隐身，移速+50%；跳跃和移动不破隐，其他操作破隐', cd: 16 },
    starter: [{ key: 'wood_sword', count: 1 }, { currency: 'copper', count: 10 }]
  },
  PORK_DOCTOR: {
    name: '猪排博士', hp: 110, skinClass: 'role-pork',
    passive: { name: '吃饱喝足', desc: '每15秒恢复5点生命' },
    active: { name: '五斤肥肉', desc: '获得150额外生命并立即回复150，体积+20%，移速-25%，持续8秒', cd: 22 },
    starter: [{ currency: 'copper', count: 15 }]
  },
  HURRICANE: {
    name: '飓风', hp: 95, skinClass: 'role-hurricane',
    passive: { name: '透视箭', desc: '远程武器命中目标后透视标记3秒' },
    active: { name: '飓风之力', desc: '向准心方向位移6格，5秒内伤害固定+12', cd: 16 },
    starter: [{ key: 'bow', count: 1 }, { key: 'arrow', count: 5 }]
  },
  DRIFTWOOD: {
    name: '浮木', hp: 100, skinClass: 'role-driftwood',
    passive: { name: '动能回收', desc: '每次攻击命中目标获得3点护盾' },
    active: { name: '天罚', desc: '操控一枚高速导弹，8秒内自动爆炸或碰撞爆炸，可被远程武器摧毁', cd: 30 },
    starter: [{ key: 'wood_sword', count: 1 }]
  },
  STEEL_BONE: {
    name: '钢骨', hp: 105, skinClass: 'role-steel',
    passive: { name: '建筑加固', desc: '自己放置的建筑血量增加20%' },
    active: { name: '玻璃桥', desc: '从玩家位置向前生成宽2格长15格玻璃桥，无法被爆炸摧毁，持续12秒', cd: 25 },
    starter: [{ key: 'wood_plank', count: 35 }]
  },
  HIGH_ENERGY: {
    name: '高能人', hp: 75, skinClass: 'role-highenergy',
    passive: { name: '附魔箭矢', desc: '发射的箭落地后留下3x3火焰区域3秒，每秒15点伤害' },
    active: { name: '超能喷气', desc: '悬浮22秒可自由移动/攻击，跳跃加速消耗30%悬浮时间，冷却30秒', cd: 30 },
    starter: [{ currency: 'silver', count: 5 }]
  },
  FROST: {
    name: '冰霜', hp: 90, skinClass: 'role-frost',
    passive: { name: '霜降', desc: '受伤后在自身位置留下2x2冰霜区域，敌人移速-60%且3秒后冰冻' },
    active: { name: '绝对零度', desc: '向准心发射3个冰锥，击中冰冻3秒，落地产生3x3冰霜2秒', cd: 27 },
    starter: []
  },
  WAIWAI: {
    name: '歪歪', hp: 1, skinClass: 'role-waiwai',
    passive: { name: 'miss体质', desc: '复活获得3点miss；每30秒恢复1点；每点miss抵挡一次任意伤害并无敌1.2秒' },
    active: { name: '骨头阵', desc: '在地上生成2×4骨头阵，敌人每0.1秒损失2点生命', cd: 35 },
    starter: [{ key: 'bow', count: 1 }, { key: 'arrow', count: 5 }]
  }
};

// ============================================
// Resource Types (刷新速度减缓)
// ============================================
const RES = {
  COPPER: { name: '铜币', color: 0xcd7f32, spawnSec: 2,  key: 'copper' },
  SILVER: { name: '银币', color: 0xc0c0c0, spawnSec: 6,  key: 'silver' },
  GOLD:   { name: '金币', color: 0xffd700, spawnSec: 15, key: 'gold'   },
  JADE:   { name: '玉佩', color: 0x00a86b, spawnSec: 42, key: 'jade'   }
};

// ============================================
// 可配置游戏规则（乐园系统：规则工坊）
// ============================================
const DEFAULT_GAME_RULES = {
  // 胜利条件
  winCondition: 'last_team_standing', // 'last_team_standing' | 'destroy_all_beds' | 'elimination' | 'score_target'
  scoreTarget: 50,
  gameDuration: 1800, // 30分钟（秒）
  enableShrink: true,
  shrinkStartTime: 1500, // 25分钟后开始缩圈
  shrinkInitialRadius: 125,
  shrinkFinalRadius: 8,
  shrinkSpeed: 0.203, // 每秒缩小的半径
  shrinkDamage: 10, // 缩圈外每秒伤害

  // 复活机制
  respawnBaseTime: 3,
  respawnMaxTime: 30,
  respawnIncrement: 2,
  respawnInvulnTime: 1.5,
  maxRespawnCount: -1, // -1 = 无限

  // 资源生成
  resourceSpawnRates: {
    copper: 2,
    silver: 6,
    gold: 15,
    jade: 42
  },
  resourceGeneratorsInvincible: false, // 资源生成器是否可被摧毁
  initialResources: { copper: 0, silver: 0, gold: 0, jade: 0 },
  enableAdvancedResources: true, // 是否启用金/玉佩

  // 商店
  shopPriceMultiplier: 1.0,
  disabledShopItems: [], // 禁用物品key列表

  // 特殊规则
  enableDreamTide: true,
  dreamTideInterval: 300, // 5分钟
  enableAutoUpgrade: true, // 自动升级方块
  blockUpgradeChain: ['wood_plank','stone_plate','iron_plate','titanium'],

  // 密室杀手专用
  skTimeLimit: 300,
  skFragmentCount: 5,
  skKillerRatio: 0.25,

  // 其他
  enableGrowth: true,
  growthSpeed: 1.0,
  aiCount: 4,

  // 角色配置
  roleOverrides: {},
};

let GAME_RULES = JSON.parse(JSON.stringify(DEFAULT_GAME_RULES));

function loadCustomRules() {
  try {
    const saved = JSON.parse(localStorage.getItem('bedwars_custom_rules') || '{}');
    GAME_RULES = {
      ...DEFAULT_GAME_RULES,
      ...saved,
      resourceSpawnRates: { ...DEFAULT_GAME_RULES.resourceSpawnRates, ...(saved.resourceSpawnRates || {}) },
      initialResources: { ...DEFAULT_GAME_RULES.initialResources, ...(saved.initialResources || {}) }
    };
  } catch (_) {
    GAME_RULES = JSON.parse(JSON.stringify(DEFAULT_GAME_RULES));
  }
  // 同步到 RES 常量（向后兼容）
  if (GAME_RULES.resourceSpawnRates.copper !== undefined) RES.COPPER.spawnSec = GAME_RULES.resourceSpawnRates.copper;
  if (GAME_RULES.resourceSpawnRates.silver !== undefined) RES.SILVER.spawnSec = GAME_RULES.resourceSpawnRates.silver;
  if (GAME_RULES.resourceSpawnRates.gold !== undefined) RES.GOLD.spawnSec = GAME_RULES.resourceSpawnRates.gold;
  if (GAME_RULES.resourceSpawnRates.jade !== undefined) RES.JADE.spawnSec = GAME_RULES.resourceSpawnRates.jade;
  loadRoleOverrides();
}

function saveCustomRules(rules) {
  GAME_RULES = {
    ...DEFAULT_GAME_RULES,
    ...rules,
    resourceSpawnRates: { ...DEFAULT_GAME_RULES.resourceSpawnRates, ...(rules.resourceSpawnRates || {}) },
    initialResources: { ...DEFAULT_GAME_RULES.initialResources, ...(rules.initialResources || {}) }
  };
  localStorage.setItem('bedwars_custom_rules', JSON.stringify(GAME_RULES));
  // 同步到 RES 常量（向后兼容）
  if (GAME_RULES.resourceSpawnRates.copper !== undefined) RES.COPPER.spawnSec = GAME_RULES.resourceSpawnRates.copper;
  if (GAME_RULES.resourceSpawnRates.silver !== undefined) RES.SILVER.spawnSec = GAME_RULES.resourceSpawnRates.silver;
  if (GAME_RULES.resourceSpawnRates.gold !== undefined) RES.GOLD.spawnSec = GAME_RULES.resourceSpawnRates.gold;
  if (GAME_RULES.resourceSpawnRates.jade !== undefined) RES.JADE.spawnSec = GAME_RULES.resourceSpawnRates.jade;
}

function resetRules() {
  localStorage.removeItem('bedwars_custom_rules');
  GAME_RULES = JSON.parse(JSON.stringify(DEFAULT_GAME_RULES));
  // 同步到 RES 常量（向后兼容）
  if (GAME_RULES.resourceSpawnRates.copper !== undefined) RES.COPPER.spawnSec = GAME_RULES.resourceSpawnRates.copper;
  if (GAME_RULES.resourceSpawnRates.silver !== undefined) RES.SILVER.spawnSec = GAME_RULES.resourceSpawnRates.silver;
  if (GAME_RULES.resourceSpawnRates.gold !== undefined) RES.GOLD.spawnSec = GAME_RULES.resourceSpawnRates.gold;
  if (GAME_RULES.resourceSpawnRates.jade !== undefined) RES.JADE.spawnSec = GAME_RULES.resourceSpawnRates.jade;
}

function loadRoleOverrides() {
  try {
    const saved = JSON.parse(localStorage.getItem('bedwars_role_overrides') || '{}');
    GAME_RULES.roleOverrides = saved;
  } catch (_) {
    GAME_RULES.roleOverrides = {};
  }
}

function saveRoleOverrides(overrides) {
  localStorage.setItem('bedwars_role_overrides', JSON.stringify(overrides));
  GAME_RULES.roleOverrides = overrides;
}

function getRoleConfig(roleKey) {
  const base = ROLES[roleKey] || {};
  const override = GAME_RULES.roleOverrides[roleKey] || {};
  return { ...base, ...override };
}

// 页面加载时自动读取自定义规则
loadCustomRules();

// ============================================
// Item Database
// ============================================
const ITEM_DB = {
  wood_plank:   { name: '木板',  type: 'block',  cost: { copper: 1 },        hp: 20,  desc: '基础建筑材料x2', stack: 64, count: 2 },
  stone_plate:  { name: '石板',  type: 'block',  cost: { silver: 8 },        hp: 60,  desc: '中级建筑材料', stack: 64 },
  iron_plate:   { name: '铁板',  type: 'block',  cost: { gold: 4 },          hp: 120, desc: '高级建筑材料', stack: 64 },
  titanium:     { name: '钛板',  type: 'block',  cost: { jade: 2 },          hp: 300, desc: '顶级建筑材料', stack: 64 },
  blast_glass:  { name: '防爆玻璃',type:'block', cost: { gold: 2 },          hp: 1,   desc: '阻挡一次爆炸，遇爆即碎', stack: 64, blastOnly: true, handImmune: false },
  wood_sword:   { name: '木质剑',type: 'weapon', cost: { copper: 4 },        dmg: 12, durability: 20, desc: '耐久20，伤害12', stack: 1 },
  stone_sword:  { name: '手工剑',type: 'weapon', cost: { silver: 3 },        dmg: 22, durability: 20, desc: '耐久20，伤害22', stack: 1 },
  iron_sword:   { name: '精致剑',type: 'weapon', cost: { gold: 4 },          dmg: 35, durability: 30, desc: '耐久30，伤害35', stack: 1 },
  diamond_sword:{ name: '研发剑',type: 'weapon', cost: { jade: 2 },          dmg: 60, durability: 45, desc: '耐久45，伤害60', stack: 1 },
  bow:          { name: '弓',    type: 'weapon', cost: { silver: 12 },       dmg: 6,  desc: '远程武器', ranged: true, stack: 1 },
  armor_hammer: { name: '破甲锤',type: 'weapon', cost: { silver: 30 },       dmg: 14, desc: '攻速极慢，对建筑和护盾3倍伤害；右键扇形击退', stack: 1, slow: true, blockMult: 3, shieldMult: 3 },
  boomerang:    { name: '回旋镖',type: 'weapon', cost: { silver: 15 },       dmg: 7,  desc: '直线飞出后折返，去回程均可造成伤害，可被击落', stack: 1, projectileType: 'boomerang' },
  frost_staff:  { name: '冰霜法杖',type:'weapon', cost: { gold: 40 },        dmg: 5,  desc: '远程命中造成冻伤2秒：移速-30%，跳跃减半', stack: 1, projectileType: 'frost' },
  javelin:      { name: '标枪',  type: 'weapon', cost: { silver: 10 },       dmg: 8,  desc: '钉住敌人暴露5秒；钉在方块可作为弹跳踮脚石', stack: 1, projectileType: 'javelin' },
  smoke_launcher:{ name:'烟雾弹发射器',type:'weapon',cost:{ silver:25 },     dmg: 0,  desc: '发射烟雾弹，落地形成8秒烟区，友军进烟隐身2秒', stack: 1, projectileType: 'smoke' },
  arrow:        { name: '箭',    type: 'ammo',   cost: { silver: 2 },        count: 8, desc: '箭矢x8', stack: 64 },
  crude_armor:  { name: '粗制护甲',type:'armor', cost: { copper: 2 },        armor: 30, protectRate: 0.20, desc: '耐久30，防护率20%', stack: 1 },
  handmade_armor:{name: '手工护甲',type:'armor', cost: { silver: 2 },        armor: 40, protectRate: 0.25, desc: '耐久40，防护率25%', stack: 1 },
  std_armor:    { name: '标准护甲',type:'armor', cost: { silver: 10 },       armor: 60, protectRate: 0.40, desc: '耐久60，防护率40%', stack: 1 },
  fine_armor:   { name: '精致护甲',type:'armor', cost: { gold: 8 },          armor: 150, protectRate: 0.60, desc: '耐久150，防护率60%', stack: 1 },
  rd_armor:     { name: '研发护甲',type:'armor', cost: { jade: 3 },          armor: 180, protectRate: 0.85, reflectChance: 0.20, reflectRate: 0.40, desc: '耐久180，防护率85%，20%概率反弹40%伤害', stack: 1 },
  tnt:          { name: '粗制炸药包',type:'special',cost: { copper: 1 },     desc: '伤害35，范围2×2，延迟2秒', stack: 8, explosive: true, explosionDamage: 35, explosionRadius: 2, explosionDelay: 2 },
  handmade_tnt: { name: '手工炸药包',type:'special',cost: { silver: 2 },     desc: '伤害90，范围3×3，延迟1.6秒', stack: 8, explosive: true, explosionDamage: 90, explosionRadius: 3, explosionDelay: 1.6 },
  military_c4:  { name: 'C4',type:'special',cost: { gold: 5 },               desc: '伤害180，范围4×4，延迟1.5秒', stack: 4, explosive: true, explosionDamage: 180, explosionRadius: 4, explosionDelay: 1.5 },
  mini_nuke:    { name: '研发炸药',type:'special',cost: { jade: 3 },         desc: '伤害350，范围6×6，延迟3秒', stack: 2, explosive: true, explosionDamage: 350, explosionRadius: 6, explosionDelay: 3 },
  repair_drone: { name: '自动修复无人机',type:'special',cost: { silver: 20 },desc: '跟随玩家20秒，修复5×5范围建筑，每秒回复2点耐久', stack: 2 },
  bandage:      { name: '简易绷带',type:'special',cost: { silver: 3 },       desc: '回血25，使用3.5秒，耐久2次', stack: 4, healAmount: 25, useTime: 3.5, uses: 2 },
  medkit:       { name: '医疗箱',type:'special',cost: { gold: 5 },           desc: '回血50，使用2秒，耐久3次', stack: 3, healAmount: 50, useTime: 2, uses: 3 },
  surgery_station:{name:'移动手术台',type:'special',cost:{ gold: 15 },       desc: '回满血，使用2秒，耐久2次', stack: 2, healFull: true, useTime: 2, uses: 2 },
  trap_device:  { name: '追踪装置',type:'special',cost: { gold: 12 },         desc: '自动攻击附近敌人，可装填100支箭', stack: 2 },
  bear_trap:    { name: '捕兽夹',type:'special',cost: { silver: 20 },        desc: '隐形地面陷阱，定身敌人3秒并预警', stack: 4 },
  sensor_mine:  { name: '感应地雷',type:'special',cost:{ gold: 30 },         desc: '隐形感应雷，敌人靠近后1秒延迟爆炸', stack: 3 },
  portal:       { name: '传送门',type: 'special',cost: { jade: 2 },          desc: '瞬移至基地', stack: 2 },
  potion:       { name: '生命药水',type:'special',cost: { gold: 4 },          desc: '恢复全部生命', stack: 8 },
  revival_gold: { name: '复活金牌',type:'special',cost: { gold: 10 },        desc: '抵挡一次致命伤害，抵挡后自动销毁', stack: 1 },
  teleport_coin:{ name: '传送硬币',type:'special',cost: { gold: 7 },        desc: '投掷后按住越久传送越远，最大20格，命中虚空不传送', stack: 4 },
  cd_potion:    { name: '冷却药水',type:'special',cost: { gold: 3 },         desc: '立即减少5秒主动技能冷却', stack: 8 },
  speed_potion: { name: '极速药水',type:'special',cost: { gold: 3 },         desc: '移动速度增加25%，持续3秒', stack: 8 },
  burst_potion: { name: '爆发药水',type:'special',cost: { gold: 4 },         desc: '造成伤害增加45%，持续3秒', stack: 8 },
  detector:     { name: '探测仪',type:'special',cost: { silver: 5 },         durability: 20, desc: '手持检测附近10格敌人数量，每秒消耗1耐久', stack: 1 },
  killer_knife:    { name: '杀手之刃',type:'weapon',cost: {},                   dmg: 1000, durability: 999, desc: '杀手专属武器，近战/可投掷，一击必杀', stack: 1, throwable: true, throwDmg: 1000 },
  detective_bow:   { name: '侦探之弓',type:'weapon',cost: {},                   dmg: 1000, durability: 999, desc: '侦探专属弓，无限箭矢，8秒CD，一击必杀', ranged: true, stack: 1, detectiveBow: true, bowCd: 8 },
  fragment:        { name: '碎片',  type: 'special',cost: {},                    desc: '收集10碎片可获得一把弓', stack: 64, isFragment: true }
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
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.projectiles = [];
    this.dropItems = [];     // 地面掉落物
    this.deathBoxes = [];   // 死亡掉落盒子
    this.trapDevices = [];  // 陷阱装置
    this.groundDevices = []; // 捕兽夹、感应地雷、标枪踏板
    this.smokeZones = [];    // 烟雾区域
    this.boneZones = [];     // 歪歪骨头阵
    this.explosives = [];    // 定时爆炸物
    this.repairDrones = [];  // 自动修复无人机
    this.frostZones = [];    // 冰霜/火焰区域
    this.mapEditor = new MapEditor(this);

    // 键盘状态跟踪（用于地图编辑器飞行控制）
    this.keys = {};
    this._onKeyDown = (e) => { this.keys[e.key.toLowerCase()] = true; };
    this._onKeyUp = (e) => { this.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);

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

  placeBlock(x, y, z, typeKey, team, hpMult = 1, owner = null) {
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
    else if (typeKey === 'blast_glass') color = 0x9eefff;

    const mat = new THREE.MeshLambertMaterial({ color, transparent: typeKey === 'blast_glass', opacity: typeKey === 'blast_glass' ? 0.48 : 1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(Math.floor(x) + 0.5, Math.floor(y) + 0.5, Math.floor(z) + 0.5);
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.scene.add(mesh);

    const baseHp = info.hp || 20;
    const hp = Math.round(baseHp * hpMult);
    this.blocks.set(key, { mesh, type: typeKey, hp, maxHp: hp, team, ownerId: owner?.playerId || owner?.name || null });
    return true;
  }

  replaceBlockType(key, typeKey, hpMult = 1) {
    const blk = this.blocks.get(key);
    const info = ITEM_DB[typeKey];
    if (!blk || !info) return false;
    const [x, y, z] = key.split(',').map(Number);
    const team = blk.team;
    const ownerId = blk.ownerId;
    this._disposeMesh(blk.mesh);
    this.blocks.delete(key);
    const ok = this.placeBlock(x, y, z, typeKey, team, hpMult);
    const next = this.blocks.get(key);
    if (next) next.ownerId = ownerId;
    return ok;
  }

  moveBlock(key, x, y, z) {
    const blk = this.blocks.get(key);
    if (!blk) return false;
    const newKey = this.getBlockKey(x, y, z);
    if (this.blocks.has(newKey)) return false;
    this.blocks.delete(key);
    blk.mesh.position.set(Math.floor(x) + 0.5, Math.floor(y) + 0.5, Math.floor(z) + 0.5);
    this.blocks.set(newKey, blk);
    return true;
  }

  removeBlock(x, y, z) {
    const key = this.getBlockKey(x, y, z);
    const blk = this.blocks.get(key);
    if (!blk) return false;
    this._disposeMesh(blk.mesh);
    this.blocks.delete(key);
    this.spawnParticles(blk.mesh.position, 0xcccccc, 6);
    return true;
  }

  damageBlock(x, y, z, dmg) {
    const key = this.getBlockKey(x, y, z);
    const blk = this.blocks.get(key);
    if (!blk) return false;
    if (blk.type === 'ground') return false;
    if (blk.type === 'bed_block') {
      // 床方块被任何伤害都会破坏
      this.destroyBedBlock(x, y, z, blk);
      return true;
    }
    blk.hp -= dmg;
    if (blk.hp <= 0) {
      this.removeBlock(x, y, z);
      return true;
    }
    const ratio = blk.hp / blk.maxHp;
    blk.mesh.material.color.setHex(ratio > 0.5 ? 0xcccccc : 0xff6666);
    return false;
  }

  destroyBedBlock(x, y, z, blk) {
    this.blocks.delete(this.getBlockKey(x, y, z));
    // 检查这个队伍的所有床方块是否都被清除
    const teamKey = blk.teamKey;
    const team = TEAMS[teamKey];
    if (!team || !team.bedAlive) return;
    // 检查是否还有其他床方块
    let remaining = false;
    for (const [k, v] of this.blocks) {
      if (v.type === 'bed_block' && v.teamKey === teamKey) { remaining = true; break; }
    }
    if (!remaining) {
      team.bedAlive = false;
      team.bedMesh.visible = false;
      this.spawnParticles(team.bedPos, team.color, 20);
      window.game?.onBedDestroyed(teamKey, null);
    }
  }

  handDamageBlock(x, y, z, dmg = 1) {
    const key = this.getBlockKey(x, y, z);
    const blk = this.blocks.get(key);
    if (!blk) return false;
    if (blk.type === 'ground') return false;
    if (blk.type === 'bed_block') {
      this.destroyBedBlock(x, y, z, blk);
      return true;
    }
    const info = ITEM_DB[blk.type];
    if (info?.handImmune && blk.type !== 'blast_glass') {
      window.game?.showMessage?.(`${info.name} 不可徒手拆毁`, '#8be9fd');
      return false;
    }
    return this.damageBlock(x, y, z, dmg);
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

  spawnExplosionFX(pos, radius, itemKey) {
    // 爆炸物等级 -> 粒子数量和闪耀度
    const fxMap = {
      tnt:          { count: 30, emissiveIntensity: 0.3, colors: [0xff4400, 0xff6600, 0xffaa00] },
      handmade_tnt: { count: 50, emissiveIntensity: 0.5, colors: [0xff2200, 0xff5500, 0xffcc00, 0xff8800] },
      military_c4:  { count: 80, emissiveIntensity: 0.8, colors: [0xff0000, 0xff4400, 0xffdd00, 0xffffff] },
      mini_nuke:    { count: 150, emissiveIntensity: 1.2, colors: [0xff0000, 0xff6600, 0xffff00, 0xffffff, 0x00ffff] }
    };
    const fx = fxMap[itemKey] || fxMap.tnt;
    for (let i = 0; i < fx.count; i++) {
      const c = fx.colors[Math.floor(Math.random() * fx.colors.length)];
      const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const mat = new THREE.MeshBasicMaterial({ color: c, transparent: true });
      mat.emissive = new THREE.Color(c);
      mat.emissiveIntensity = fx.emissiveIntensity;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * radius * 1.5;
      mesh.position.x += (Math.random() - 0.5) * 1.5;
      mesh.position.y += Math.random() * 0.5;
      mesh.position.z += (Math.random() - 0.5) * 1.5;
      this.scene.add(mesh);
      this.particles.push({
        mesh, life: 1.0 + Math.random() * 0.8,
        vel: new THREE.Vector3(
          Math.cos(angle) * speed * (0.5 + Math.random()),
          Math.random() * radius * 2.5 + 2,
          Math.sin(angle) * speed * (0.5 + Math.random())
        ),
        emissiveIntensity: fx.emissiveIntensity
      });
    }
    // 屏幕抖动
    const intensity = radius <= 2 ? 1 : radius <= 4 ? 2 : 3;
    const duration = radius <= 2 ? 0.3 : radius <= 4 ? 0.5 : 0.8;
    this.shakeTimer = duration;
    this.shakeIntensity = intensity;
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

  raycastPlacement(screenX = window.innerWidth / 2, screenY = window.innerHeight / 2, maxDist = 6) {
    const ndc = new THREE.Vector2(
      (screenX / window.innerWidth) * 2 - 1,
      -(screenY / window.innerHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, this.camera);
    raycaster.far = maxDist + 10;

    const blockEntries = Array.from(this.blocks.entries());
    const blockMeshes = blockEntries.map(([, blk]) => blk.mesh);
    const hits = raycaster.intersectObjects(blockMeshes, false);
    if (hits.length) {
      const hit = hits[0];
      const entry = blockEntries.find(([, blk]) => blk.mesh === hit.object);
      const base = hit.object.position.clone().floor();
      const normal = hit.face?.normal?.clone() || new THREE.Vector3(0, 1, 0);
      normal.transformDirection(hit.object.matrixWorld);
      const place = base.add(new THREE.Vector3(
        Math.round(normal.x),
        Math.round(normal.y),
        Math.round(normal.z)
      ));
      return { hit: true, x: place.x, y: place.y, z: place.z, source: 'block', baseKey: entry?.[0] };
    }

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const point = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, point)) {
      return {
        hit: true,
        x: Math.floor(point.x),
        y: 0,
        z: Math.floor(point.z),
        source: 'ground'
      };
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
      isCurrency: false, // 普通道具掉落物：拾取时走 addToBackpack 物品分支，而非货币分支
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

  _disposeMesh(mesh) {
    if (!mesh) return;
    this.scene.remove(mesh);
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose ? m.dispose() : null);
      else if (mesh.material.dispose) mesh.material.dispose();
    }
    if (mesh.children) mesh.children.forEach(c => this._disposeMesh(c));
  }

  removeDropItem(drop) {
    const i = this.dropItems.indexOf(drop);
    if (i >= 0) {
      this._disposeMesh(drop.mesh);
      if (drop.label) this._disposeMesh(drop.label);
      this.dropItems.splice(i, 1);
    }
  }

  // ============================================
  // Death Drop Box System
  // ============================================
  createDeathBox(pos, playerName, teamColor, items, currencies) {
    // 创建盒子
    const boxGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const boxMat = new THREE.MeshLambertMaterial({ color: teamColor, emissive: teamColor, emissiveIntensity: 0.4 });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.position.copy(pos);
    boxMesh.position.y = Math.max(0.5, pos.y + 0.5);
    boxMesh.castShadow = true;
    this.scene.add(boxMesh);

    // 名字标签
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${playerName}的遗物`, 128, 32);
    const tex = new THREE.CanvasTexture(canvas);
    const labelMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.9 });
    const label = new THREE.Sprite(labelMat);
    label.scale.set(1.8, 0.34, 1);
    label.position.y = 0.8;
    boxMesh.add(label);

    // 粒子光环
    const ringGeo = new THREE.TorusGeometry(0.6, 0.05, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: teamColor, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0;
    boxMesh.add(ring);

    const deathBox = {
      mesh: boxMesh,
      label,
      ring,
      pos: boxMesh.position.clone(),
      playerName,
      teamColor,
      items: items || [],      // [{key, count}, ...]
      currencies: currencies || {}, // {copper: n, silver: n, ...}
      life: 90,               // 90秒后消失
      floatOffset: Math.random() * Math.PI * 2,
      radius: 0.7,
      opened: false
    };
    this.deathBoxes.push(deathBox);
    return deathBox;
  }

  removeDeathBox(box) {
    const i = this.deathBoxes.indexOf(box);
    if (i >= 0) {
      this._disposeMesh(box.mesh);
      this._disposeMesh(box.label);
      this._disposeMesh(box.ring);
      this.deathBoxes.splice(i, 1);
    }
  }

  // ============================================
  // Trap Device System (追踪连发装置)
  // ============================================
  createTrapDevice(pos, team, owner) {
    // 底座
    const baseGeo = new THREE.CylinderGeometry(0.45, 0.55, 0.3, 8);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(pos.x, pos.y + 0.15, pos.z);
    base.castShadow = true;
    this.scene.add(base);

    // 炮塔
    const turretGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.5, 8);
    const turretMat = new THREE.MeshLambertMaterial({ color: 0x666666, emissive: 0x222222 });
    const turret = new THREE.Mesh(turretGeo, turretMat);
    turret.position.y = 0.35;
    base.add(turret);

    // 红色指示灯
    const lightGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.y = 0.65;
    base.add(light);

    // 团队标识环
    const ringGeo = new THREE.TorusGeometry(0.4, 0.04, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: TEAMS[team]?.color || 0xffffff, transparent: true, opacity: 0.7 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.3;
    base.add(ring);

    // 标签
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('追踪装置', 64, 22);
    const tex = new THREE.CanvasTexture(canvas);
    const labelMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.8 });
    const label = new THREE.Sprite(labelMat);
    label.scale.set(1.0, 0.25, 1);
    label.position.y = 1.0;
    base.add(label);

    const trap = {
      mesh: base,
      turret,
      light,
      ring,
      label,
      pos: new THREE.Vector3(pos.x, pos.y, pos.z),
      team,
      owner,
      arrows: 0,           // 当前装填箭矢数
      maxArrows: 100,      // 最大装填量
      range: 8,            // 探测范围
      fireInterval: 0.05,  // 发射间隔（秒）
      fireTimer: 0,
      hp: 80,              // 生命值
      maxHp: 80,
      active: true
    };
    this.trapDevices.push(trap);
    return trap;
  }

  removeTrapDevice(trap) {
    const i = this.trapDevices.indexOf(trap);
    if (i >= 0) {
      this._disposeMesh(trap.mesh);
      this.trapDevices.splice(i, 1);
    }
  }

  // 装填陷阱箭矢
  loadTrapArrows(trap, count) {
    if (!trap || !trap.active) return 0;
    const canLoad = Math.min(count, trap.maxArrows - trap.arrows);
    trap.arrows += canLoad;
    return canLoad;
  }

  spawnWeaponProjectile(owner, type, start, dir, options = {}) {
    const colors = { boomerang: 0xffdd00, frost: 0x8be9fd, javelin: 0xd9a066, smoke: 0x8899aa, arrow: 0x8B4513 };
    let geo;
    if (type === 'boomerang') geo = new THREE.TorusGeometry(0.24, 0.04, 8, 18);
    else if (type === 'frost') geo = new THREE.SphereGeometry(0.14, 10, 10);
    else if (type === 'smoke') geo = new THREE.SphereGeometry(0.18, 10, 10);
    if (type === 'javelin') {
      geo = new THREE.CylinderGeometry(0.03, 0.04, 0.9);
      geo.rotateX(Math.PI / 2);
    } else if (type === 'arrow') {
      geo = new THREE.ConeGeometry(0.03, 0.6, 6);
    }
    const mat = new THREE.MeshBasicMaterial({ color: colors[type] || 0xffffff, transparent: true, opacity: type === 'smoke' ? 0.9 : 1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(start);
    if (type === 'arrow') {
      const up = new THREE.Vector3(0, 1, 0);
      const q = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
      mesh.setRotationFromQuaternion(q);
    } else {
      mesh.lookAt(start.clone().add(dir));
    }
    this.scene.add(mesh);
    const speed = options.speed || (type === 'frost' ? 20 : type === 'smoke' ? 14 : type === 'boomerang' ? 18 : 24);
    const projectile = {
      mesh,
      vel: dir.clone().multiplyScalar(speed),
      life: options.life || (type === 'smoke' ? 2.2 : 3),
      damage: options.damage || 0,
      owner,
      type,
      start: start.clone(),
      dir: dir.clone(),
      returning: false,
      hitSet: new Set(),
      canBeShotDown: type === 'boomerang',
      gravity: type === 'smoke' ? 6 : (type === 'javelin' ? 4 : 0)
    };
    this.projectiles.push(projectile);
    return projectile;
  }

  createGroundDevice(pos, type, team, owner) {
    const isMine = type === 'sensor_mine';
    const isTrap = type === 'bear_trap';
    const isJavelin = type === 'javelin_step';
    const geo = isJavelin ? new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8) : new THREE.CylinderGeometry(0.42, 0.48, 0.12, 10);
    const mat = new THREE.MeshLambertMaterial({
      color: isMine ? 0xff5533 : isTrap ? 0x777777 : 0xd9a066,
      transparent: true,
      opacity: isJavelin ? 0.85 : 0.18
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y = Math.max(0.12, pos.y + 0.08);
    if (isJavelin) mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = true;
    this.scene.add(mesh);
    const dev = {
      mesh, pos: mesh.position.clone(), type, team, owner,
      life: isJavelin ? 18 : 120,
      radius: isMine ? 2.4 : isTrap ? 0.95 : 0.8,
      triggered: false,
      triggerTimer: isMine ? 1 : 0
    };
    this.groundDevices.push(dev);
    return dev;
  }

  removeGroundDevice(dev) {
    const i = this.groundDevices.indexOf(dev);
    if (i >= 0) {
      this._disposeMesh(dev.mesh);
      this.groundDevices.splice(i, 1);
    }
  }

  createSmokeZone(pos, team, owner) {
    const geo = new THREE.SphereGeometry(3.2, 16, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0x8899aa, transparent: true, opacity: 0.35, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y = Math.max(1.2, pos.y + 1.2);
    this.scene.add(mesh);
    const zone = { mesh, pos: mesh.position.clone(), team, owner, life: 8, radius: 3.2, pulse: 0 };
    this.smokeZones.push(zone);
    return zone;
  }

  removeSmokeZone(zone) {
    const i = this.smokeZones.indexOf(zone);
    if (i >= 0) {
      this._disposeMesh(zone.mesh);
      this.smokeZones.splice(i, 1);
    }
  }

  createBoneZone(owner) {
    const dir = owner.getForwardDir();
    dir.y = 0;
    if (dir.lengthSq() < 0.0001) dir.set(0, 0, -1);
    dir.normalize();
    const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
    const ground = owner.getGroundHeight(owner.pos.x, owner.pos.z);
    const center = owner.pos.clone().addScaledVector(dir, 2.3);
    center.y = Math.max(ground + 0.08, owner.pos.y - owner.radius + 0.08);

    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xf5f0dc, transparent: true, opacity: 0.62 });
    for (let i = 0; i < 8; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const pos = center.clone()
        .addScaledVector(dir, row - 1.5)
        .addScaledVector(right, col === 0 ? -0.5 : 0.5);
      const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), mat);
      bone.rotation.z = Math.PI / 2;
      bone.position.copy(pos);
      bone.position.y += 0.08;
      bone.userData.baseY = bone.position.y;
      group.add(bone);
    }
    this.scene.add(group);
    const zone = { owner, team: owner.team, center, dir, right, length: 4, width: 2, life: 6, tick: 0, pulse: 0, group };
    this.boneZones.push(zone);
    return zone;
  }

  removeBoneZone(zone) {
    const i = this.boneZones.indexOf(zone);
    if (i >= 0) {
      this._disposeMesh(zone.group);
      this.boneZones.splice(i, 1);
    }
  }

  makeTextSprite(text, color = '#ffffff') {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 96;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(18, 18, 220, 56);
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 56);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.3, 0.85, 1);
    sprite.userData.canvas = canvas;
    sprite.userData.ctx = ctx;
    sprite.userData.tex = tex;
    sprite.userData.color = color;
    return sprite;
  }

  updateTextSprite(sprite, text) {
    const { canvas, ctx, tex, color } = sprite.userData;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(18, 18, 220, 56);
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = color || '#ffffff';
    ctx.fillText(text, 128, 56);
    tex.needsUpdate = true;
  }

  createTimedExplosive(owner, itemKey, pos) {
    const info = ITEM_DB[itemKey];
    if (!info?.explosive) return null;
    const geo = new THREE.BoxGeometry(0.55, 0.32, 0.55);
    const mat = new THREE.MeshLambertMaterial({ color: itemKey === 'mini_nuke' ? 0x00ff66 : itemKey === 'military_c4' ? 0x333333 : 0xaa4422 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y += 0.18;
    mesh.castShadow = true;
    const label = this.makeTextSprite(`${info.explosionDelay.toFixed(1)}s`, '#ffdd00');
    label.position.set(0, 0.85, 0);
    mesh.add(label);
    this.scene.add(mesh);
    const ex = { mesh, label, pos: mesh.position.clone(), owner, team: owner?.team, life: info.explosionDelay, radius: info.explosionRadius, damage: info.explosionDamage };
    this.explosives.push(ex);
    return ex;
  }

  createRepairDrone(owner) {
    const geo = new THREE.SphereGeometry(0.22, 12, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0x8be9fd });
    const mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);
    const label = this.makeTextSprite('修复', '#8be9fd');
    label.position.set(0, 0.55, 0);
    mesh.add(label);
    const drone = { mesh, label, owner, team: owner.team, life: 20, tick: 0, angle: 0 };
    this.repairDrones.push(drone);
    return drone;
  }

  explodeAt(pos, radius, dmg, owner = null, itemKey = '') {
    // 炸毁方块
    const rx = Math.floor(pos.x);
    const ry = Math.floor(pos.y);
    const rz = Math.floor(pos.z);
    const r = Math.max(1, Math.ceil(radius));
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.sqrt(dx * dx + dy * dy + dz * dz) > radius) continue;
          const key = this.getBlockKey(rx + dx, ry + dy, rz + dz);
          const blk = this.blocks.get(key);
          if (blk?.type !== 'blast_glass') this.damageBlock(rx + dx, ry + dy, rz + dz, dmg);
        }
      }
    }
    for (const ent of this.entities) {
      if (ent.isDead) continue;
      const dist = ent.pos.distanceTo(pos);
      if (dist <= radius + 0.8) {
        const falloff = Math.max(0.25, 1 - dist / (radius + 1));
        ent.takeDamage(dmg * falloff, owner);
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
    // 炸毁范围内的陷阱装置
    for (let i = this.trapDevices.length - 1; i >= 0; i--) {
      const trap = this.trapDevices[i];
      if (trap.pos.distanceTo(pos) <= radius + 2) {
        this.spawnParticles(trap.pos.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xff4400, 15);
        this.removeTrapDevice(trap);
      }
    }
    // 炸毁范围内的死亡盒子
    for (let i = this.deathBoxes.length - 1; i >= 0; i--) {
      const box = this.deathBoxes[i];
      if (box.pos.distanceTo(pos) <= radius + 2) {
        this.spawnParticles(box.pos, 0xff4400, 10);
        this.removeDeathBox(box);
      }
    }
    // 炸毁范围内的地面装置
    for (let i = this.groundDevices.length - 1; i >= 0; i--) {
      const dev = this.groundDevices[i];
      if (dev.pos.distanceTo(pos) <= radius + 1.5) {
        this.spawnParticles(dev.pos, 0xff4400, 8);
        this.removeGroundDevice(dev);
      }
    }
    this.spawnExplosionFX(pos, radius, itemKey || '');
    this.spawnParticles(pos, 0xff4400, 20);
  }

  update(dt) {
    // Entities
    for (const e of this.entities) e.update(dt);

    // 地图编辑器更新
    this.mapEditor.update(dt, { keys: this.keys || {} });

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.vel.y -= 5 * dt;
      p.mesh.material.opacity = p.life;
      if (p.emissiveIntensity) {
        p.mesh.material.emissiveIntensity = p.emissiveIntensity * p.life;
      }
      p.mesh.rotation.x += dt * 3;
      p.mesh.rotation.y += dt * 2;
      if (p.life <= 0) { this.scene.remove(p.mesh); this.particles.splice(i, 1); }
    }

    // Screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const s = this.shakeIntensity * (this.shakeTimer / 0.8);
      this.camera.position.x += (Math.random() - 0.5) * s * 0.15;
      this.camera.position.y += (Math.random() - 0.5) * s * 0.15;
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
        const pickupRange = 1.8 * (1 + (ent.pickupRangeBonus || 0));
        const dist = ent.pos.distanceTo(d.mesh.position);
        if (dist < pickupRange) {
          // 向玩家移动
          const pullDir = ent.pos.clone().sub(d.mesh.position);
          if (pullDir.lengthSq() < 0.0001) continue;
          const pull = pullDir.normalize().multiplyScalar(6 * dt);
          d.mesh.position.add(pull);
          d.pos.copy(d.mesh.position);
          if (dist < 0.6) {
            // 拾取
            if (d.isCurrency) {
              ent.inv[d.currency] = (ent.inv[d.currency] || 0) + d.count;
              ent.matchStats.resourceContribution += d.count * (d.currency === 'jade' ? 18 : d.currency === 'gold' ? 8 : d.currency === 'silver' ? 3 : 1);
              window.game?.growth?.addXp?.(ent, GROWTH_CONFIG.xp.collectResource[d.currency] || 1, '收集资源');
            } else {
              const added = ent.addToBackpack(d.typeKey, d.count);
              if (!added) continue;
            }
            this.spawnParticles(d.mesh.position, d.isCurrency ? RES[d.currency.toUpperCase()]?.color : 0xffdd00, 4);
            this.removeDropItem(d);
            break;
          }
        }
      }
    }

    // Death Boxes (浮动动画 + 拾取 + 超时)
    for (let i = this.deathBoxes.length - 1; i >= 0; i--) {
      const box = this.deathBoxes[i];
      box.life -= dt;
      box.floatOffset += dt * 1.5;
      box.mesh.position.y = box.pos.y + Math.sin(box.floatOffset) * 0.2;
      box.mesh.rotation.y += dt * 0.8;
      box.ring.rotation.z += dt * 2;
      box.ring.rotation.x += dt * 1.5;

      if (box.life <= 0) {
        this.spawnParticles(box.mesh.position, box.teamColor, 10);
        this.removeDeathBox(box);
        continue;
      }

      // 玩家靠近自动拾取
      for (const ent of this.entities) {
        if (ent.isDead || !ent.isLocal) continue;
        const pickupRange = 2.0 * (1 + (ent.pickupRangeBonus || 0));
        const dist = ent.pos.distanceTo(box.mesh.position);
        if (dist < pickupRange) {
          const pullDir = ent.pos.clone().sub(box.mesh.position);
          if (pullDir.lengthSq() < 0.0001) continue;
          const pull = pullDir.normalize().multiplyScalar(5 * dt);
          box.mesh.position.add(pull);
          box.pos.copy(box.mesh.position);
          if (dist < 0.8) {
            // 打开盒子，拾取所有物品
            for (const item of box.items) {
              ent.addToBackpack(item.key, item.count);
            }
            for (const [rk, rv] of Object.entries(box.currencies)) {
              if (rv > 0) ent.inv[rk] = (ent.inv[rk] || 0) + rv;
            }
            this.spawnParticles(box.mesh.position, 0xffdd00, 10);
            this.removeDeathBox(box);
            window.game?.showMessage(`打开了 ${box.playerName} 的遗物！`, '#ffdd00');
            break;
          }
        }
      }
    }

    // Smoke Zones (视野压制 + 友军隐身)
    for (let i = this.smokeZones.length - 1; i >= 0; i--) {
      const zone = this.smokeZones[i];
      zone.life -= dt;
      zone.pulse += dt * 2;
      const scale = 1 + Math.sin(zone.pulse) * 0.08;
      zone.mesh.scale.set(scale, scale * 0.72, scale);
      zone.mesh.material.opacity = Math.max(0.05, Math.min(0.36, zone.life / 8 * 0.36));
      for (const ent of this.entities) {
        if (ent.isDead) continue;
        const dist = ent.pos.distanceTo(zone.pos);
        if (dist < zone.radius) {
          if (ent.team === zone.team) {
            ent.isInvisible = true;
            ent.smokeInvisibleTimer = Math.max(ent.smokeInvisibleTimer || 0, 2);
          } else {
            ent.smokeBlindTimer = Math.max(ent.smokeBlindTimer || 0, 0.4);
          }
        }
      }
      if (zone.life <= 0) this.removeSmokeZone(zone);
    }

    // Bone Zones（歪歪骨头阵）
    for (let i = this.boneZones.length - 1; i >= 0; i--) {
      const zone = this.boneZones[i];
      zone.life -= dt;
      zone.tick -= dt;
      zone.pulse += dt * 8;
      zone.group.children.forEach((bone, idx) => {
        bone.position.y = bone.userData.baseY + Math.sin(zone.pulse + idx) * 0.05;
        bone.rotation.y += dt * 1.8;
        bone.material.opacity = Math.max(0.1, Math.min(0.62, zone.life / 6 * 0.62));
      });
      if (zone.tick <= 0) {
        zone.tick = 0.1;
        for (const ent of this.entities) {
          if (ent.isDead || ent.team === zone.team) continue;
          const rel = ent.pos.clone().sub(zone.center);
          const f = rel.dot(zone.dir);
          const r = rel.dot(zone.right);
          if (Math.abs(f) <= zone.length / 2 && Math.abs(r) <= zone.width / 2 && Math.abs(ent.pos.y - zone.center.y) < 2) {
            ent.takeDamage(2 + (zone.owner.boneZoneDamageBonus || 0), zone.owner);
          }
        }
      }
      if (zone.life <= 0) this.removeBoneZone(zone);
    }

    // Frost/Fire Zones (冰霜和火焰区域)
    if (!this.frostZones) this.frostZones = [];
    for (let i = this.frostZones.length - 1; i >= 0; i--) {
      const zone = this.frostZones[i];
      zone.life -= dt;
      if (zone.type === 'fire') {
        zone.mesh.material.opacity = Math.max(0.1, (zone.life / zone.maxLife) * 0.6);
      } else {
        zone.mesh.material.opacity = Math.max(0.1, (zone.life / zone.maxLife) * 0.5);
      }
      // 对区域内敌人造成效果
      for (const ent of this.entities) {
        if (ent.isDead) continue;
        if (ent.team === zone.team) continue;
        const dx = ent.pos.x - (zone.cx + 0.5);
        const dz = ent.pos.z - (zone.cz + 0.5);
        const inX = Math.abs(dx) <= zone.radius + 0.5;
        const inZ = Math.abs(dz) <= zone.radius + 0.5;
        if (!inX || !inZ) continue;

        if (zone.type === 'fire') {
          // 火焰：每秒15伤害
          ent.takeDamage(zone.damage * dt, zone.owner);
        } else if (zone.type === 'frost') {
          // 冰霜：减速60%
          ent.slowTimer = Math.max(ent.slowTimer || 0, 0.5);
          // 跟踪停留时间（用zone对象引用作为键，避免splice索引变化）
          if (!ent._frostZoneTime) ent._frostZoneTime = new Map();
          const elapsed = (ent._frostZoneTime.get(zone) || 0) + dt;
          ent._frostZoneTime.set(zone, elapsed);
          if (elapsed >= zone.freezeAfter) {
            ent.frostTimer = Math.max(ent.frostTimer || 0, 3);
            ent.rootTimer = Math.max(ent.rootTimer || 0, 3);
            ent._frostZoneTime.delete(zone); // 重置计时避免重复
            if (ent.isLocal) {
              window.game?.showMessage?.('你被冰冻了！无法移动3秒', '#88ccff');
            }
          }
        }
      }
      if (zone.life <= 0) {
        this._disposeMesh(zone.mesh);
        this.frostZones.splice(i, 1);
      }
    }

    // Timed explosives
    for (let i = this.explosives.length - 1; i >= 0; i--) {
      const ex = this.explosives[i];
      ex.life -= dt;
      ex.mesh.rotation.y += dt * 2.5;
      this.updateTextSprite(ex.label, `${Math.max(0, ex.life).toFixed(1)}s`);
      if (ex.life <= 0) {
        this.explodeAt(ex.pos.clone(), ex.radius, ex.damage, ex.owner, ex.itemKey);
        this.scene.remove(ex.mesh);
        this.explosives.splice(i, 1);
      }
    }

    // Repair drones
    for (let i = this.repairDrones.length - 1; i >= 0; i--) {
      const d = this.repairDrones[i];
      d.life -= dt;
      d.tick -= dt;
      d.angle += dt * 2.8;
      if (!d.owner || d.owner.isDead || d.life <= 0) {
        this.scene.remove(d.mesh);
        this.repairDrones.splice(i, 1);
        continue;
      }
      d.mesh.position.copy(d.owner.pos).add(new THREE.Vector3(Math.cos(d.angle) * 1.4, 1.35 + Math.sin(d.angle * 1.7) * 0.18, Math.sin(d.angle) * 1.4));
      this.updateTextSprite(d.label, `${Math.ceil(d.life)}s`);
      if (d.tick <= 0) {
        d.tick = 1;
        for (const blk of this.blocks.values()) {
          if (blk.team !== d.team || blk.type === 'ground') continue;
          if (blk.mesh.position.distanceTo(d.owner.pos) <= 2.5) {
            blk.hp = Math.min(blk.maxHp, blk.hp + 2);
            this.spawnParticles(blk.mesh.position, 0x8be9fd, 2);
          }
        }
      }
    }

    // Ground Devices (捕兽夹/感应雷/标枪踏板)
    for (let i = this.groundDevices.length - 1; i >= 0; i--) {
      const dev = this.groundDevices[i];
      dev.life -= dt;
      if (dev.life <= 0) {
        this.removeGroundDevice(dev);
        continue;
      }
      dev.mesh.rotation.y += dt * (dev.type === 'javelin_step' ? 1.5 : 0.2);

      if (dev.type === 'sensor_mine' && dev.triggered) {
        dev.triggerTimer -= dt;
        dev.mesh.material.opacity = 0.75;
        dev.mesh.scale.setScalar(1 + Math.sin(performance.now() * 0.03) * 0.12);
        if (dev.triggerTimer <= 0) {
          this.explodeAt(dev.pos.clone(), 3.2, 65);
          this.removeGroundDevice(dev);
          continue;
        }
      }

      for (const ent of this.entities) {
        if (ent.isDead) continue;
        const dist = ent.pos.distanceTo(dev.pos);
        if (dev.type === 'javelin_step' && dist < 0.85 && ent.vel.y <= 0.2) {
          ent.vel.y = Math.max(ent.vel.y, 10);
          this.spawnParticles(dev.pos, 0xd9a066, 5);
          dev.life = Math.min(dev.life, 1);
          continue;
        }
        if (ent.team === dev.team) continue;
        if (dist > dev.radius) continue;
        if (dev.type === 'bear_trap') {
          ent.rootTimer = Math.max(ent.rootTimer || 0, 3);
          ent.takeDamage(6, dev.owner);
          this.spawnParticles(dev.pos, 0xffdd00, 12);
          window.game?.showMessage?.('警报：捕兽夹触发！', '#ffdd00');
          this.removeGroundDevice(dev);
          break;
        }
        if (dev.type === 'sensor_mine' && !dev.triggered) {
          dev.triggered = true;
          dev.triggerTimer = 1;
          window.game?.showMessage?.('感应地雷已触发！', '#ff5533');
        }
      }
    }

    // Trap Devices (扫描敌人 + 发射)
    for (let i = this.trapDevices.length - 1; i >= 0; i--) {
      const trap = this.trapDevices[i];
      if (!trap.active) continue;

      // 视觉更新
      trap.light.material.color.setHex(trap.arrows > 0 ? 0x00ff00 : 0xff0000);
      trap.ring.rotation.z += dt * 3;

      if (trap.arrows <= 0) continue;

      trap.fireTimer -= dt;
      if (trap.fireTimer > 0) continue;

      // 扫描范围内的敌方玩家
      let nearestEnemy = null;
      let nearestDist = trap.range;
      for (const ent of this.entities) {
        if (ent.isDead) continue;
        if (ent.team === trap.team) continue;
        const dist = trap.pos.distanceTo(ent.pos);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = ent;
        }
      }

      if (nearestEnemy) {
        // 炮塔转向敌人
        const dir = nearestEnemy.pos.clone().sub(trap.pos);
        dir.y = 0;
        const angle = Math.atan2(dir.x, dir.z);
        trap.turret.rotation.y = angle;

        // 发射箭矢
        const arrowDir = nearestEnemy.pos.clone().sub(trap.pos.clone().add(new THREE.Vector3(0, 0.5, 0))).normalize();
        const start = trap.pos.clone().add(new THREE.Vector3(0, 0.6, 0));
        const arrowGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4);
        arrowGeo.rotateX(Math.PI / 2);
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
        const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
        arrowMesh.position.copy(start);
        arrowMesh.lookAt(start.clone().add(arrowDir));
        this.scene.add(arrowMesh);
        this.projectiles.push({
          mesh: arrowMesh,
          vel: arrowDir.clone().multiplyScalar(22),
          life: 2,
          damage: 6,
          owner: trap.owner || this.entities.find(e => e.team === trap.team && !e.isDead) || null
        });
        trap.arrows--;
        trap.fireTimer = trap.fireInterval;
      }
    }

    // Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (proj.type !== 'missile') {
        const missileIndex = this.projectiles.findIndex(p => p.type === 'missile' && p.owner?.team !== proj.owner?.team && p.mesh.position.distanceTo(proj.mesh.position) < 0.8);
        if (missileIndex >= 0) {
          const missile = this.projectiles[missileIndex];
          this.spawnParticles(missile.mesh.position, 0xffdd00, 18);
          if (missile.owner?.missileControl === missile) missile.owner.missileControl = null;
          this._disposeMesh(missile.mesh);
          this._disposeMesh(proj.mesh);
          // 确保按索引从大到小移除，避免索引错乱
          const [first, second] = i > missileIndex ? [i, missileIndex] : [missileIndex, i];
          this.projectiles.splice(first, 1);
          this.projectiles.splice(second, 1);
          continue;
        }
      }
      if (proj.type === 'missile' && proj.owner) {
        const dir = proj.owner.getForwardDir().normalize();
        proj.vel.lerp(dir.multiplyScalar(proj.boosted ? 15 : 8), 0.22);
        proj.mesh.lookAt(proj.mesh.position.clone().add(proj.vel));
        if (proj.owner.isLocal && proj.owner.missileControl === proj) {
          this.camera.position.lerp(proj.mesh.position.clone().addScaledVector(proj.vel.clone().normalize(), -3).add(new THREE.Vector3(0, 1.2, 0)), 0.35);
          this.camera.lookAt(proj.mesh.position);
        }
      }
      if (proj.type === 'boomerang' && !proj.returning && proj.start.distanceTo(proj.mesh.position) > 9) {
        proj.returning = true;
      }
      if (proj.type === 'boomerang' && proj.returning && proj.owner) {
        const backDir = proj.owner.pos.clone().add(new THREE.Vector3(0, 0.7, 0)).sub(proj.mesh.position).normalize();
        proj.vel.lerp(backDir.multiplyScalar(20), 0.18);
      }
      proj.mesh.position.addScaledVector(proj.vel, dt);
      proj.vel.y -= (proj.gravity ?? 9.8) * dt;
      proj.life -= dt;
      if (proj.type === 'boomerang') proj.mesh.rotation.z += dt * 14;

      // Block collision
      const rc = this.raycastBlocks(proj.mesh.position, proj.vel.clone().normalize(), 0.5);
      if (rc.hit) {
        if (proj.type === 'missile') {
          this.explodeAt(proj.mesh.position.clone(), 4.5, 95, proj.owner);
          if (proj.owner?.missileControl === proj) proj.owner.missileControl = null;
        } else if (proj.type === 'smoke') {
          this.createSmokeZone(proj.mesh.position.clone(), proj.owner?.team, proj.owner);
        } else if (proj.type === 'javelin') {
          const pos = new THREE.Vector3(Math.floor(rc.pos.x) + 0.5, Math.floor(rc.pos.y) + 1.0, Math.floor(rc.pos.z) + 0.5);
          this.createGroundDevice(pos, 'javelin_step', proj.owner?.team, proj.owner);
        } else {
          this.damageBlock(rc.pos.x, rc.pos.y, rc.pos.z, proj.damage);
        }
        this.spawnParticles(proj.mesh.position, 0xffaa00, 4);
        this._disposeMesh(proj.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Entity collision
      for (const ent of this.entities) {
        if (ent === proj.owner) continue;
        if (ent.isDead) continue;
        // 密室杀手：同阵营不伤害
        if (window.game?.isSecretKiller && proj.owner?.skRole && ent.skRole === proj.owner.skRole) continue;
        const dist = proj.mesh.position.distanceTo(ent.mesh.position);
        if (dist < (ent.radius || 0.5) + 0.2) {
          const key = ent.playerId || ent.name;
          if (proj.type === 'boomerang' && proj.hitSet?.has(key + ':' + (proj.returning ? 'back' : 'out'))) continue;
          proj.hitSet?.add(key + ':' + (proj.returning ? 'back' : 'out'));
          ent.takeDamage(proj.damage, proj.owner);
          if (proj.owner?.role === 'DRIFTWOOD') proj.owner.extraShield = Math.min(60 + (proj.owner.shieldCapBonus || 0), (proj.owner.extraShield || 0) + 3);
          if (proj.type === 'missile') {
            this.explodeAt(proj.mesh.position.clone(), 4.5, 95, proj.owner);
            if (proj.owner?.missileControl === proj) proj.owner.missileControl = null;
          }
          if (proj.type === 'frost') {
            ent.frostTimer = Math.max(ent.frostTimer || 0, 2);
            ent.slowTimer = Math.max(ent.slowTimer || 0, 2);
          }
          if (proj.type === 'ice_spike') {
            ent.frostTimer = Math.max(ent.frostTimer || 0, 3);
            ent.rootTimer = Math.max(ent.rootTimer || 0, 3);
            ent.slowTimer = Math.max(ent.slowTimer || 0, 3);
            if (ent.isLocal) {
              window.game?.showMessage?.('你被冰锥击中！冰冻3秒', '#88ccff');
            }
          }
          if (proj.owner?.role === 'HURRICANE' && proj.owner.equipped.weapon === 'bow') {
            ent.revealedTimer = Math.max(ent.revealedTimer || 0, 3);
            ent.nameTag.visible = true;
          }
          if (proj.type === 'javelin') {
            ent.revealedTimer = Math.max(ent.revealedTimer || 0, 5);
            ent.nameTag.visible = true;
            window.game?.showMessage?.(`${ent.name} 被标枪暴露了！`, '#ffdd00');
          }
          this.spawnParticles(proj.mesh.position, 0xff0000, 5);
          if (proj.type !== 'boomerang') {
            this._disposeMesh(proj.mesh);
            this.projectiles.splice(i, 1);
          } else if (!proj.returning) {
            proj.returning = true;
          }
          break;
        }
      }

      if ((proj.type === 'boomerang' && proj.returning && proj.owner && proj.mesh.position.distanceTo(proj.owner.pos) < 0.8) ||
          proj.life <= 0 || proj.mesh.position.y < -20) {
        if (proj.type === 'smoke' && proj.mesh.position.y > -20) {
          this.createSmokeZone(proj.mesh.position.clone(), proj.owner?.team, proj.owner);
        }
        if (proj.type === 'missile' && proj.mesh.position.y > -20) {
          this.explodeAt(proj.mesh.position.clone(), 4.5, 95, proj.owner);
          if (proj.owner?.missileControl === proj) proj.owner.missileControl = null;
        }
        // 冰锥落地产生冰霜区域
        if (proj.type === 'ice_spike' && proj.owner) {
          proj.owner.createFrostZone(proj.mesh.position, 3, 2);
        }
        // 高能人附魔箭矢落地产生火焰区域
        if (proj.type === 'arrow' && proj.owner?.role === 'HIGH_ENERGY') {
          proj.owner.createFireZone(proj.mesh.position);
          this.spawnParticles(proj.mesh.position, 0xff4400, 8);
        }
        this._disposeMesh(proj.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  render() { this.renderer.render(this.scene, this.camera); }
}

// ============================================
// Map System
// ============================================
const MAPS = {
  classic: {
    id: 'classic', name: '经典方块', desc: '四队基地环绕中心岛，梦域潮汐带来随机资源浮岛',
    thumbnail: 'default'
  },
  twilight_forest: {
    id: 'twilight_forest', name: '暮色森林', desc: '树冠基地、地面黑雾迷雾，视线封锁，幻影爪痕持续伤害',
    thumbnail: 'forest'
  },
  secret_killer: {
    id: 'secret_killer', name: '密室杀手', desc: '10人局：1杀手、1侦探、8平民，收集碎片、找出杀手',
    thumbnail: 'default'
  }
};

// ============================================
// World Generator (减少资源点)
// ============================================
function generateWorld(engine, mapId = 'classic') {
  engine.mapId = mapId;
  if (mapId === 'twilight_forest') return generateTwilightForest(engine);
  if (mapId === 'secret_killer') return generateSecretKillerMap(engine);
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
    // 床碰撞方块：2格宽1格高
    for (let dx = 0; dx <= 1; dx++) {
      const bk = engine.getBlockKey(s.x + dx, 1, s.z);
      engine.blocks.set(bk, { mesh: bed, type: 'bed_block', hp: 9999, maxHp: 9999, teamKey: key, bedRef: true });
    }
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

function generateTwilightForest(engine) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  engine.tidalIslands = [];
  engine.temporaryGens = [];
  engine.mapFeatures = { canopyCenters: [], rootCaveTimers: [] };

  const trunkColor = 0x3d2b1f;
  const leafColor = 0x1a4d1a;
  const plankColor = 0x8B5A2B;
  const birchColor = 0xE3CAA5;
  const fogColor = 0x0a0a15;
  const stoneColor = 0x555555;

  function placeBlock(x, y, z, color, type = 'ground') {
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (type === 'ground') mesh.receiveShadow = true;
    else mesh.castShadow = true;
    engine.scene.add(mesh);
    const key = engine.getBlockKey(x, y, z);
    engine.blocks.set(key, { mesh, type, hp: 9999, maxHp: 9999 });
    return mesh;
  }

  function createTrunk(cx, cz, yStart, height, diameter) {
    const r = Math.floor(diameter / 2);
    const mat = new THREE.MeshLambertMaterial({ color: trunkColor });
    for (let y = yStart; y < yStart + height; y++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (dx * dx + dz * dz > r * r + 1) continue;
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(cx + dx, y, cz + dz);
          mesh.castShadow = true;
          engine.scene.add(mesh);
          const key = engine.getBlockKey(cx + dx, y, cz + dz);
          engine.blocks.set(key, { mesh, type: 'ground', hp: 9999, maxHp: 9999 });
        }
      }
    }
  }

  function createCanopy(cx, cy, cz, radius) {
    const leafMat = new THREE.MeshLambertMaterial({ color: leafColor, transparent: true, opacity: 0.9 });
    const plankMat = new THREE.MeshLambertMaterial({ color: plankColor });
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        for (let dy = -2; dy <= 2; dy++) {
          const distSq = dx * dx + dz * dz + dy * dy * 2;
          if (distSq > radius * radius + 3) continue;
          const isPlank = Math.random() < 0.25;
          const mat = isPlank ? plankMat : leafMat;
          const mesh = new THREE.Mesh(geo, mat.clone());
          mesh.position.set(cx + dx, cy + dy, cz + dz);
          mesh.receiveShadow = true;
          engine.scene.add(mesh);
          const key = engine.getBlockKey(cx + dx, cy + dy, cz + dz);
          engine.blocks.set(key, { mesh, type: 'ground', hp: 9999, maxHp: 9999 });
        }
      }
    }
  }

  function createBirchPlatform(cx, cy, cz, radius) {
    const mat = new THREE.MeshLambertMaterial({ color: birchColor });
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (dx * dx + dz * dz > radius * radius + 1) continue;
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(cx + dx, cy, cz + dz);
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        const key = engine.getBlockKey(cx + dx, cy, cz + dz);
        engine.blocks.set(key, { mesh, type: 'ground', hp: 9999, maxHp: 9999 });
      }
    }
  }

  // Four bases in cross layout
  const treePositions = [
    { cx: 0, cz: -50, team: TEAMS.RED },
    { cx: 0, cz: 50, team: TEAMS.BLUE },
    { cx: 50, cz: 0, team: TEAMS.GREEN },
    { cx: -50, cz: 0, team: TEAMS.YELLOW }
  ];

  for (const tp of treePositions) {
    // Trunk: diameter 5, height 25 (y=1..25)
    createTrunk(tp.cx, tp.cz, 1, 25, 5);
    // Canopy: diameter 18 (radius 9), centered at y=35
    createCanopy(tp.cx, 35, tp.cz, 9);
    // Birch platform at y=42, radius 4
    createBirchPlatform(tp.cx, 42, tp.cz, 4);
    // Spawn on platform
    tp.team.spawn.set(tp.cx, 43, tp.cz);
    engine.mapFeatures.canopyCenters.push(new THREE.Vector3(tp.cx, 35, tp.cz));
  }

  // Ground fog layer blocks (y=5-12)
  const fogMat = new THREE.MeshLambertMaterial({ color: fogColor, transparent: true, opacity: 0.82 });
  for (let x = -64; x <= 64; x += 2) {
    for (let z = -64; z <= 64; z += 2) {
      let nearTrunk = false;
      for (const tp of treePositions) {
        const dx = x - tp.cx, dz = z - tp.cz;
        if (dx * dx + dz * dz < 64) { nearTrunk = true; break; }
      }
      if (nearTrunk) continue;
      const mesh = new THREE.Mesh(geo, fogMat.clone());
      mesh.position.set(x, 8, z);
      mesh.scale.set(2, 6, 2);
      engine.scene.add(mesh);
    }
  }

  // Beds on birch platforms
  const bedGeo = new THREE.BoxGeometry(2, 0.6, 1.2);
  for (const [key, team] of Object.entries(TEAMS)) {
    const bed = new THREE.Mesh(bedGeo, new THREE.MeshLambertMaterial({ color: team.color }));
    bed.position.copy(team.bedPos = team.spawn.clone().add(new THREE.Vector3(0, -0.5, 0)));
    bed.castShadow = true;
    engine.scene.add(bed);
    const bx = team.spawn.x, bz = team.spawn.z, by = Math.floor(team.spawn.y) - 1;
    for (let dx = 0; dx <= 1; dx++) {
      const bk = engine.getBlockKey(bx + dx, by, bz);
      engine.blocks.set(bk, { mesh: bed, type: 'bed_block', hp: 9999, maxHp: 9999, teamKey: key, bedRef: true });
    }
    team.bedMesh = bed;
    team.bedAlive = true;
  }

  // Resource generators
  const genGeo = new THREE.CylinderGeometry(0.6, 0.8, 1.2, 8);
  const gens = [];
  const slowSpawn = sec => sec * 1.15;

  // Root caves: under each tree at y=6, 4 silver + 1 gold, 15% slower
  for (const tp of treePositions) {
    const baseX = tp.cx + 5;
    const baseZ = tp.cz;
    const baseY = 6;
    const sMat = new THREE.MeshLambertMaterial({ color: RES.SILVER.color, emissive: RES.SILVER.color, emissiveIntensity: 0.2 });
    const gMat = new THREE.MeshLambertMaterial({ color: RES.GOLD.color, emissive: RES.GOLD.color, emissiveIntensity: 0.2 });
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(genGeo, sMat.clone());
      mesh.position.set(baseX + i * 0.6, baseY, baseZ);
      engine.scene.add(mesh);
      gens.push({ mesh, type: 'SILVER', pos: mesh.position.clone(), timer: 0, spawnSec: slowSpawn(RES.SILVER.spawnSec), ready: true });
    }
    const gm = new THREE.Mesh(genGeo, gMat.clone());
    gm.position.set(baseX + 1.5, baseY, baseZ + 0.8);
    engine.scene.add(gm);
    gens.push({ mesh: gm, type: 'GOLD', pos: gm.position.clone(), timer: 0, spawnSec: slowSpawn(RES.GOLD.spawnSec), ready: true });
  }

  // Copper near each bed
  for (const tp of treePositions) {
    const mat = new THREE.MeshLambertMaterial({ color: RES.COPPER.color, emissive: RES.COPPER.color, emissiveIntensity: 0.2 });
    const mesh = new THREE.Mesh(genGeo, mat);
    mesh.position.set(tp.cx - 3, 42, tp.cz);  // 床铺附近
    engine.scene.add(mesh);
    gens.push({ mesh, type: 'COPPER', team: undefined, pos: mesh.position.clone(), timer: 0, spawnSec: RES.COPPER.spawnSec, ready: true });
  }

  // Diamond points (JADE): center (0,5,0), radius 8 circle, 3 points, 45s, 2 each
  const jadeMat = new THREE.MeshLambertMaterial({ color: RES.JADE.color, emissive: RES.JADE.color, emissiveIntensity: 0.3 });
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 / 3) * i + Math.random() * 0.4;
    const r = 8;
    const px = Math.round(Math.cos(angle) * r);
    const pz = Math.round(Math.sin(angle) * r);
    for (let j = 0; j < 2; j++) {
      const mesh = new THREE.Mesh(genGeo, jadeMat.clone());
      mesh.position.set(px + j * 0.5, 5, pz);
      engine.scene.add(mesh);
      gens.push({ mesh, type: 'JADE', pos: mesh.position.clone(), timer: 0, spawnSec: 45, ready: true });
    }
  }

  // Emerald points (JADE): four corners at +/-55,+/-55, y=45, on floating stone pillars
  const corners = [{ x: 55, z: 55 }, { x: 55, z: -55 }, { x: -55, z: 55 }, { x: -55, z: -55 }];
  for (const cp of corners) {
    const pMat = new THREE.MeshLambertMaterial({ color: stoneColor });
    for (let y = 5; y <= 44; y++) {
      const mesh = new THREE.Mesh(geo, pMat);
      mesh.position.set(cp.x, y, cp.z);
      engine.scene.add(mesh);
      engine.blocks.set(engine.getBlockKey(cp.x, y, cp.z), { mesh, type: 'ground', hp: 9999, maxHp: 9999 });
    }
    const tMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const mesh = new THREE.Mesh(geo, tMat);
        mesh.position.set(cp.x + dx, 45, cp.z + dz);
        engine.scene.add(mesh);
        engine.blocks.set(engine.getBlockKey(cp.x + dx, 45, cp.z + dz), { mesh, type: 'ground', hp: 9999, maxHp: 9999 });
      }
    }
    const mesh = new THREE.Mesh(genGeo, jadeMat.clone());
    mesh.position.set(cp.x, 46.1, cp.z);
    engine.scene.add(mesh);
    gens.push({ mesh, type: 'JADE', pos: mesh.position.clone(), timer: 0, spawnSec: RES.JADE.spawnSec, ready: true });
  }

  // Dream tide no-op for twilight forest
  engine.triggerDreamTide = function(gensRef) {};

  return gens;
}

// ============================================
// 密室杀手地图系统：3个地图 + 随机选择
// ============================================

const SECRET_KILLER_MAPS = [
  {
    id: 'sk_abandoned_mansion',
    name: '废弃庄园',
    generate: generateSKMap_AbandonedMansion
  },
  {
    id: 'sk_underground_lab',
    name: '地下实验室',
    generate: generateSKMap_UndergroundLab
  },
  {
    id: 'sk_cursed_temple',
    name: '诅咒神殿',
    generate: generateSKMap_CursedTemple
  }
];

function generateSecretKillerMap(engine, mapIndex) {
  // mapIndex 可选，不传则随机选择
  let idx = mapIndex;
  if (idx === undefined || idx === null) {
    idx = Math.floor(Math.random() * SECRET_KILLER_MAPS.length);
  }
  const mapDef = SECRET_KILLER_MAPS[idx];
  engine.skMapIndex = idx;
  engine.skMapId = mapDef.id;
  engine.skMapName = mapDef.name;
  return mapDef.generate(engine);
}

// ============================================
// 地图1：废弃庄园（64x64，双层建筑，多个房间）
// ============================================
function generateSKMap_AbandonedMansion(engine) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  engine.tidalIslands = [];
  engine.temporaryGens = [];

  const wallColor = 0x5c4033;
  const floorColor1 = 0x8B7355;
  const floorColor2 = 0x6B5B45;
  const carpetColor = 0x8B0000;
  const stairsColor = 0x654321;
  const crateColor = 0x8B6914;
  const pillarColor = 0x4a3728;

  const fragmentPoints = [
    { x: -25, y: 1, z: -25 }, { x: 25, y: 1, z: -25 },
    { x: -25, y: 1, z: 25 },  { x: 25, y: 1, z: 25 },
    { x: 0, y: 1, z: 0 },
    { x: -20, y: 5, z: 0 },  { x: 20, y: 5, z: 0 }
  ];

  engine.mapFeatures = { fragmentPoints: fragmentPoints.map(p => new THREE.Vector3(p.x, p.y, p.z)) };
  engine.skSpawn = new THREE.Vector3(0, 3, 0);

  function pb(x, y, z, color, type = 'ground') {
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (type === 'ground') mesh.receiveShadow = true;
    else mesh.castShadow = true;
    engine.scene.add(mesh);
    engine.blocks.set(engine.getBlockKey(x, y, z), { mesh, type, hp: 9999, maxHp: 9999 });
  }

  // 一楼地面：-30到30
  for (let x = -30; x <= 30; x++) {
    for (let z = -30; z <= 30; z++) {
      pb(x, 0, z, (Math.abs(x + z) % 2 === 0) ? floorColor1 : floorColor2);
    }
  }

  // 外墙
  for (let y = 0; y <= 8; y++) {
    for (let i = -30; i <= 30; i++) {
      pb(i, y, -30, wallColor); pb(i, y, 30, wallColor);
      pb(-30, y, i, wallColor); pb(30, y, i, wallColor);
    }
  }

  // 内墙分割房间 - 十字走廊（留4格宽通道）
  // X方向内墙：z=-10和z=10（留走廊x=-4到4）
  for (let y = 1; y <= 6; y++) {
    for (let x = -30; x <= 30; x++) {
      if (x >= -4 && x <= 4) continue; // 走廊
      // 门洞：每隔8格留2格
      if ((Math.abs(x) % 10 < 2)) continue;
      pb(x, y, -10, wallColor); pb(x, y, 10, wallColor);
    }
  }
  // Z方向内墙：x=-10和x=10（留走廊z=-4到4）
  for (let y = 1; y <= 6; y++) {
    for (let z = -30; z <= 30; z++) {
      if (z >= -4 && z <= 4) continue;
      if ((Math.abs(z) % 10 < 2)) continue;
      pb(-10, y, z, wallColor); pb(10, y, z, wallColor);
    }
  }

  // 二楼平台（中央区域 x=-15..15, z=-15..15）
  for (let x = -15; x <= 15; x++) {
    for (let z = -15; z <= 15; z++) {
      pb(x, 4, z, floorColor2);
    }
  }

  // 二楼外墙
  for (let y = 5; y <= 8; y++) {
    for (let i = -15; i <= 15; i++) {
      pb(i, y, -15, wallColor); pb(i, y, 15, wallColor);
      pb(-15, y, i, wallColor); pb(15, y, i, wallColor);
    }
  }
  // 二楼门洞
  for (let x = -2; x <= 2; x++) { pb(x, 5, -15, 0); pb(x, 6, -15, 0); pb(x, 7, -15, 0); pb(x, 8, -15, 0); }
  for (let x = -2; x <= 2; x++) { pb(x, 5, 15, 0); pb(x, 6, 15, 0); pb(x, 7, 15, 0); pb(x, 8, 15, 0); }
  for (let z = -2; z <= 2; z++) { pb(-15, 5, z, 0); pb(-15, 6, z, 0); pb(-15, 7, z, 0); pb(-15, 8, z, 0); }
  for (let z = -2; z <= 2; z++) { pb(15, 5, z, 0); pb(15, 6, z, 0); pb(15, 7, z, 0); pb(15, 8, z, 0); }

  // 楼梯（四角各一个）
  const stairPositions = [{ x: -14, z: -14 }, { x: 14, z: -14 }, { x: -14, z: 14 }, { x: 14, z: 14 }];
  for (const sp of stairPositions) {
    for (let i = 0; i < 4; i++) {
      pb(sp.x, 1 + i, sp.z, stairsColor);
    }
  }

  // 装饰：箱子
  const crates = [
    { x: -25, z: -25 }, { x: -22, z: -20 }, { x: 22, z: -25 }, { x: 25, z: -20 },
    { x: -25, z: 22 }, { x: -20, z: 25 }, { x: 25, z: 22 }, { x: 20, z: 25 },
    { x: -8, z: -8 }, { x: 8, z: -8 }, { x: -8, z: 8 }, { x: 8, z: 8 }
  ];
  for (const c of crates) {
    for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) {
      pb(c.x + dx, 1 + dy, c.z + dz, crateColor);
    }
  }

  // 地毯（中央大厅）
  for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) pb(x, 0.01, z, carpetColor);

  // 碎片标记
  const diamondGeo = new THREE.OctahedronGeometry(0.6, 0);
  for (const fp of fragmentPoints) {
    const mat = new THREE.MeshLambertMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.8, transparent: true, opacity: 0.85 });
    const marker = new THREE.Mesh(diamondGeo, mat);
    marker.position.set(fp.x, fp.y + 1.5, fp.z);
    engine.scene.add(marker);
    const light = new THREE.PointLight(0x00ffff, 1.2, 10);
    light.position.set(fp.x, fp.y + 2, fp.z);
    engine.scene.add(light);
  }

  // 灯光
  const amb = new THREE.AmbientLight(0x302518, 0.8);
  engine.scene.add(amb);
  const lights = [
    { x: -20, z: -20, c: 0xff6633 }, { x: 20, z: -20, c: 0x3366ff },
    { x: -20, z: 20, c: 0x33ff66 }, { x: 20, z: 20, c: 0xffcc33 },
    { x: 0, z: 0, c: 0xff9944 }, { x: -12, z: 0, c: 0xcc66ff }, { x: 12, z: 0, c: 0x66ccff }
  ];
  for (const l of lights) {
    const pl = new THREE.PointLight(l.c, 1.8, 22);
    pl.position.set(l.x, 5, l.z);
    engine.scene.add(pl);
  }

  engine.triggerDreamTide = function(gensRef) {};
  return [];
}

// ============================================
// 地图2：地下实验室（48x48，走廊+实验舱）
// ============================================
function generateSKMap_UndergroundLab(engine) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  engine.tidalIslands = [];
  engine.temporaryGens = [];

  const wallColor = 0x3a3a4a;
  const floorColor = 0x2a2a35;
  const tileColor = 0x3a4a5a;
  const labColor = 0x2a4a3a;
  const pipeColor = 0x555566;
  const glassColor = 0x4488aa;

  const fragmentPoints = [
    { x: -18, y: 1, z: -18 }, { x: 18, y: 1, z: -18 },
    { x: -18, y: 1, z: 18 },  { x: 18, y: 1, z: 18 },
    { x: 0, y: 1, z: 0 },
    { x: -12, y: 1, z: 0 },  { x: 12, y: 1, z: 0 }
  ];

  engine.mapFeatures = { fragmentPoints: fragmentPoints.map(p => new THREE.Vector3(p.x, p.y, p.z)) };
  engine.skSpawn = new THREE.Vector3(0, 3, 0);

  function pb(x, y, z, color, type = 'ground') {
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (type === 'ground') mesh.receiveShadow = true;
    else mesh.castShadow = true;
    engine.scene.add(mesh);
    engine.blocks.set(engine.getBlockKey(x, y, z), { mesh, type, hp: 9999, maxHp: 9999 });
  }

  // 地面
  for (let x = -22; x <= 22; x++) {
    for (let z = -22; z <= 22; z++) {
      pb(x, 0, z, (x + z) % 3 === 0 ? tileColor : floorColor);
    }
  }

  // 外墙
  for (let y = 0; y <= 7; y++) {
    for (let i = -22; i <= 22; i++) {
      pb(i, y, -22, wallColor); pb(i, y, 22, wallColor);
      pb(-22, y, i, wallColor); pb(22, y, i, wallColor);
    }
  }

  // H型走廊结构
  // 主走廊：x方向 z=-2..2
  for (let z = -2; z <= 2; z++) for (let x = -22; x <= 22; x++) pb(x, 0, z, tileColor);
  // 主走廊：z方向 x=-2..2
  for (let x = -2; x <= 2; x++) for (let z = -22; z <= 22; z++) pb(x, 0, z, tileColor);

  // 实验舱（6个）: 8x8房间
  const rooms = [
    { cx: -14, cz: -14 }, { cx: 14, cz: -14 },
    { cx: -14, cz: 14 },  { cx: 14, cz: 14 },
    { cx: -14, cz: 0 },   { cx: 14, cz: 0 }
  ];
  for (const r of rooms) {
    // 房间地板
    for (let x = r.cx - 4; x <= r.cx + 4; x++) {
      for (let z = r.cz - 4; z <= r.cz + 4; z++) {
        pb(x, 0, z, labColor);
      }
    }
    // 房间墙壁（留门洞朝走廊）
    for (let y = 1; y <= 5; y++) {
      for (let d = -4; d <= 4; d++) {
        if (Math.abs(d) <= 1) continue; // 门洞
        if (r.cx < 0) { pb(r.cx + 4, y, r.cz + d, wallColor); } // 右墙
        else { pb(r.cx - 4, y, r.cz + d, wallColor); } // 左墙
        // 上下墙
        if (r.cz < 0) { pb(r.cx + d, y, r.cz + 4, wallColor); }
        else if (r.cz > 0) { pb(r.cx + d, y, r.cz - 4, wallColor); }
      }
    }
  }

  // 管道装饰（天花板上）
  for (let i = -20; i <= 20; i += 5) {
    pb(i, 6, -3, pipeColor); pb(i, 6, 3, pipeColor);
    pb(-3, 6, i, pipeColor); pb(3, 6, i, pipeColor);
  }

  // 碎片标记
  const diamondGeo = new THREE.OctahedronGeometry(0.6, 0);
  for (const fp of fragmentPoints) {
    const mat = new THREE.MeshLambertMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.8, transparent: true, opacity: 0.85 });
    const marker = new THREE.Mesh(diamondGeo, mat);
    marker.position.set(fp.x, fp.y + 1.5, fp.z);
    engine.scene.add(marker);
    const light = new THREE.PointLight(0x00ff88, 1.2, 10);
    light.position.set(fp.x, fp.y + 2, fp.z);
    engine.scene.add(light);
  }

  // 冷色灯光
  engine.scene.add(new THREE.AmbientLight(0x1a1a2e, 0.7));
  const labLights = [
    { x: -14, z: -14, c: 0x00ffcc }, { x: 14, z: -14, c: 0x00ccff },
    { x: -14, z: 14, c: 0xcc00ff }, { x: 14, z: 14, c: 0xffcc00 },
    { x: 0, z: 0, c: 0x4488ff }, { x: -14, z: 0, c: 0x00ff88 }, { x: 14, z: 0, c: 0xff4488 }
  ];
  for (const l of labLights) {
    const pl = new THREE.PointLight(l.c, 1.5, 18);
    pl.position.set(l.x, 4, l.z);
    engine.scene.add(pl);
  }

  engine.triggerDreamTide = function(gensRef) {};
  return [];
}

// ============================================
// 地图3：诅咒神殿（80x80，露天+神殿内部）
// ============================================
function generateSKMap_CursedTemple(engine) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  engine.tidalIslands = [];
  engine.temporaryGens = [];

  const stoneColor = 0x555555;
  const stoneDark = 0x3a3a3a;
  const sandColor = 0xc2b280;
  const grassColor = 0x4a6b3a;
  const waterColor = 0x2244aa;
  const goldColor = 0xdaa520;
  const pillarColor = 0x666666;

  const fragmentPoints = [
    { x: -30, y: 1, z: -30 }, { x: 30, y: 1, z: -30 },
    { x: -30, y: 1, z: 30 },  { x: 30, y: 1, z: 30 },
    { x: 0, y: 1, z: 0 },
    { x: -20, y: 1, z: 0 },  { x: 20, y: 1, z: 0 },
    { x: 0, y: 1, z: -20 }, { x: 0, y: 1, z: 20 }
  ];

  engine.mapFeatures = { fragmentPoints: fragmentPoints.map(p => new THREE.Vector3(p.x, p.y, p.z)) };
  engine.skSpawn = new THREE.Vector3(0, 3, 0);

  function pb(x, y, z, color, type = 'ground') {
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (type === 'ground') mesh.receiveShadow = true;
    else mesh.castShadow = true;
    engine.scene.add(mesh);
    engine.blocks.set(engine.getBlockKey(x, y, z), { mesh, type, hp: 9999, maxHp: 9999 });
  }

  // 地面：80x80 草地+沙地
  for (let x = -38; x <= 38; x++) {
    for (let z = -38; z <= 38; z++) {
      const dist = Math.sqrt(x * x + z * z);
      if (dist > 38) continue; // 圆形边界
      const color = dist < 15 ? sandColor : (dist < 25 ? grassColor : (Math.random() > 0.5 ? grassColor : sandColor));
      pb(x, 0, z, color);
    }
  }

  // 护城河（环形水）
  for (let x = -38; x <= 38; x++) {
    for (let z = -38; z <= 38; z++) {
      const dist = Math.sqrt(x * x + z * z);
      if (dist >= 14 && dist <= 16) {
        pb(x, -1, z, waterColor);
      }
    }
  }

  // 中央神殿 (12x12)
  for (let x = -10; x <= 10; x++) {
    for (let z = -10; z <= 10; z++) {
      pb(x, 1, z, stoneColor); // 神殿地面抬高
    }
  }

  // 神殿柱子（12根圆柱，4格高）
  const templePillars = [
    { x: -9, z: -9 }, { x: -3, z: -9 }, { x: 3, z: -9 }, { x: 9, z: -9 },
    { x: -9, z: 9 },  { x: -3, z: 9 },  { x: 3, z: 9 },  { x: 9, z: 9 },
    { x: -9, z: 0 },  { x: 9, z: 0 }
  ];
  for (const pp of templePillars) {
    for (let y = 2; y <= 6; y++) {
      pb(pp.x, y, pp.z, pillarColor);
    }
  }

  // 神殿内部圣坛
  for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) pb(x, 2, z, goldColor);

  // 外围废墟墙（断壁残垣）
  const ruins = [
    { x: -25, z: -25, w: 8, h: 4 }, { x: 20, z: -20, w: 6, h: 3 },
    { x: -22, z: 20, w: 10, h: 5 }, { x: 25, z: 25, w: 7, h: 3 },
    { x: -30, z: 0, w: 5, h: 3 }, { x: 30, z: 0, w: 5, h: 4 }
  ];
  for (const r of ruins) {
    for (let y = 1; y <= r.h; y++) {
      for (let d = 0; d < r.w; d++) {
        if (Math.random() > 0.7) continue; // 随机缺口
        pb(r.x + d, y, r.z, stoneDark);
      }
    }
  }

  // 外围边界墙
  for (let y = 0; y <= 6; y++) {
    for (let a = 0; a < 360; a += 1) {
      const rad = a * Math.PI / 180;
      const px = Math.round(Math.cos(rad) * 38);
      const pz = Math.round(Math.sin(rad) * 38);
      if (y === 0 || Math.random() > 0.3) { // 顶部稀疏
        pb(px, y, pz, stoneDark);
      }
    }
  }

  // 碎片标记
  const diamondGeo = new THREE.OctahedronGeometry(0.7, 0);
  for (const fp of fragmentPoints) {
    const mat = new THREE.MeshLambertMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0.9, transparent: true, opacity: 0.85 });
    const marker = new THREE.Mesh(diamondGeo, mat);
    marker.position.set(fp.x, fp.y + 2, fp.z);
    engine.scene.add(marker);
    const light = new THREE.PointLight(0xffaa00, 1.5, 12);
    light.position.set(fp.x, fp.y + 3, fp.z);
    engine.scene.add(light);
  }

  // 灯光：月光效果
  engine.scene.add(new THREE.AmbientLight(0x1a1a30, 0.6));
  engine.scene.add(new THREE.DirectionalLight(0x8888ff, 0.5).translateY(50));
  const templeLights = [
    { x: 0, z: 0, c: 0xffcc44 }, { x: -25, z: -25, c: 0xff6644 },
    { x: 25, z: -25, c: 0x44aaff }, { x: -25, z: 25, c: 0x44ff88 },
    { x: 25, z: 25, c: 0xff88cc }
  ];
  for (const l of templeLights) {
    const pl = new THREE.PointLight(l.c, 1.5, 25);
    pl.position.set(l.x, 6, l.z);
    engine.scene.add(pl);
  }

  engine.triggerDreamTide = function(gensRef) {};
  return [];
}

// ============================================
// Player Entity (带背包系统)
// ============================================
class PlayerEntity {
  constructor(engine, teamKey, roleKey, isLocal = false, name = 'Player', playerId = null) {
    this.engine = engine;
    this.team = teamKey;
    this.role = ROLES[roleKey] ? roleKey : 'FOX';
    this.isLocal = isLocal;
    this.name = name;
    this.playerId = playerId || name;
    this.roleInfo = ROLES[this.role];
    this.teamInfo = TEAMS[teamKey];

    // Stats
    const rc = typeof getRoleConfig === 'function' ? getRoleConfig(this.role) : (ROLES[this.role] || {});
    this.maxHp = rc.hp || 100;
    this.hp = this.maxHp;
    this.armor = 0;
    this.armorMax = 0;
    this.armorProtectRate = 0;
    this.armorReflectChance = 0;
    this.armorReflectRate = 0;
    this.armorInfo = null;
    this._lastArmorText = '';
    this.isDead = false;
    this.respawnTimer = 0;
    this.deathCount = 0;
    this.pendingElimination = false;
    this.radius = 0.4;

    // Movement
    this.pos = this.teamInfo.spawn.clone();
    this.vel = new THREE.Vector3();
    this.onGround = false;
    this.baseSpeed = 6;
    this.speed = this.baseSpeed;
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
    this.matchLevel = 1;
    this.matchXp = 0;
    this.matchStats = { kills: 0, beds: 0, damage: 0, blocksPlaced: 0, resourceContribution: 0 };
    this.handBreakTimer = 0;
    this.handBreakKey = null;
    this.skillCdBonus = 0;
    this.voidGrace = 0;
    this.voidGraceTimer = 0;
    this.knockbackReduce = 0;
    this.pickupRangeBonus = 0;
    this.silencedTimer = 0;
    this.slowTimer = 0;
    this.frostTimer = 0;
    this.rootTimer = 0;
    this.revealedTimer = 0;
    this.smokeBlindTimer = 0;
    this.smokeInvisibleTimer = 0;
    this.extraShield = 0;
    this.fatTimer = 0;
    this.porkHealTimer = 15;
    this.hurricaneDamageTimer = 0;
    this.camouflageTimer = 0;
    this.missileControl = null;
    this.hasRevivalToken = false;
    this.teleportCoinCharge = 0;
    this.bowCharge = 0;
    this.speedPotionTimer = 0;
    this.burstPotionTimer = 0;
    this.skFragments = 0;
    this.skRole = null;
    this.bowCdTimer = 0;
    this.jetpackTimer = 0;       // 高能人悬浮剩余时间
    this.jetpackMaxTime = 22;    // 高能人悬浮最大时间
    this.frostZones = [];        // 冰霜角色创建的冰霜区域
    this.voidBridgeBlocks = [];
    this.healAction = null;
    this.miss = this.role === 'WAIWAI' ? 3 : 0;
    this.maxMiss = this.role === 'WAIWAI' ? 3 : 0;
    this.missRegenTimer = 30;
    this.missInvulnTimer = 0;
    this.invulnTimer = 0;
    this.placePreviewMesh = null;
    this.detectorEnemyCount = 0;
    this.detectorDurabilityTimer = 0;
    this.skillHoldTime = 0;
    this.skillPreviewMesh = null;
    this.glassBridgeBlocks = [];
    this.glassBridgeTimer = 0;
    this.glassBridgeLabel = null;
    this.glassBridgeCdPending = false;
    this.jetpackTimer = 0;
    this.frostZones = [];

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
    const geo = this.createRoleGeometry(this.role);
    this.skinColor = this.getEquippedSkinColor();
    const mat = new THREE.MeshLambertMaterial({
      color: this.skinColor,
      emissive: this.skinColor !== this.teamInfo.color ? this.skinColor : 0x000000,
      emissiveIntensity: this.skinColor !== this.teamInfo.color ? 0.18 : 0
    });
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

    // 护甲信息标签
    const armorCanvas = document.createElement('canvas');
    armorCanvas.width = 256; armorCanvas.height = 48;
    const armorCtx = armorCanvas.getContext('2d');
    const armorTex = new THREE.CanvasTexture(armorCanvas);
    const armorSpriteMat = new THREE.SpriteMaterial({ map: armorTex, transparent: true });
    this.armorTag = new THREE.Sprite(armorSpriteMat);
    this.armorTag.scale.set(1.6, 0.3, 1);
    this.armorTag.position.y = 1.0;
    this.armorTag.visible = false;
    this.mesh.add(this.armorTag);

    // Weapon mesh
    this.weaponMesh = null;

    engine.addEntity(this);
  }

  createRoleGeometry(roleKey) {
    if (roleKey === 'FOX') return new THREE.ConeGeometry(0.48, 1.35, 6);
    if (roleKey === 'PORK_DOCTOR') return new THREE.SphereGeometry(0.68, 12, 10);
    if (roleKey === 'HURRICANE') {
      const geo = new THREE.OctahedronGeometry(0.72, 0);
      geo.scale(0.62, 1.05, 0.62);
      return geo;
    }
    if (roleKey === 'DRIFTWOOD') return new THREE.CapsuleGeometry(0.36, 0.92, 4, 8);
    if (roleKey === 'STEEL_BONE') return new THREE.BoxGeometry(0.55, 1.05, 0.55);
    if (roleKey === 'HIGH_ENERGY') {
      const geo = new THREE.OctahedronGeometry(0.5, 1);
      geo.scale(0.7, 1.1, 0.7);
      return geo;
    }
    if (roleKey === 'FROST') {
      const geo = new THREE.IcosahedronGeometry(0.5, 0);
      geo.scale(0.8, 1.05, 0.8);
      return geo;
    }
    if (roleKey === 'WAIWAI') {
      const geo = new THREE.ConeGeometry(0.42, 1.12, 5);
      geo.scale(0.82, 0.82, 0.82);
      return geo;
    }
    return new THREE.CapsuleGeometry(0.35, 0.9, 4, 8);
  }

  setRole(roleKey, grantStarter = false) {
    if (!ROLES[roleKey]) return;
    const oldRatio = this.maxHp ? this.hp / this.maxHp : 1;
    this.role = roleKey;
    this.roleInfo = ROLES[roleKey];
    const rc = typeof getRoleConfig === 'function' ? getRoleConfig(roleKey) : (ROLES[roleKey] || {});
    this.maxHp = this.role === 'WAIWAI'
      ? 1
      : rc.hp + Math.max(0, this.matchLevel - 1) * (window.GROWTH_CONFIG?.hpPerLevel || 2);
    this.hp = Math.max(1, Math.min(this.maxHp, Math.round(this.maxHp * oldRatio)));
    this.baseSpeed = 6;
    this.speed = this.baseSpeed;
    this.skillCd = 0;
    this.skillActive = 0;
    this.isInvisible = false;
    this.extraShield = 0;
    this.fatTimer = 0;
    this.hurricaneDamageTimer = 0;
    this.camouflageTimer = 0;
    this.mesh.scale.set(1, 1, 1);
    this.missileControl = null;
    this.porkHealTimer = 15;
    this.voidBridgeBlocks = [];
    this.attackCd = 0;
    this.rootTimer = 0;
    this.slowTimer = 0;
    this.frostTimer = 0;
    this.silencedTimer = 0;
    this.smokeBlindTimer = 0;
    this.smokeInvisibleTimer = 0;
    this.socialShield = 0;
    this.speedPotionTimer = 0;
    this.burstPotionTimer = 0;
    this.teleportCoinCharge = 0;
    this.hasRevivalToken = false;
    this.maxMiss = roleKey === 'WAIWAI' ? 3 : 0;
    this.miss = roleKey === 'WAIWAI' ? 3 : 0;
    this.missRegenTimer = 30;
    this.missInvulnTimer = 0;
    this.invulnTimer = 0;
    this.handBreakTimer = 0;
    this.handBreakKey = null;
    const oldTag = this.nameTag;
    const oldWeapon = this.weaponMesh;
    if (oldTag) this.mesh.remove(oldTag);
    if (oldWeapon) this.mesh.remove(oldWeapon);
    if (this.mesh.geometry) this.mesh.geometry.dispose();
    if (this.mesh.material) this.mesh.material.dispose();
    this.mesh.geometry = this.createRoleGeometry(roleKey);
    this.skinColor = this.getEquippedSkinColor();
    this.mesh.material = new THREE.MeshStandardMaterial({ color: this.skinColor });
    if (oldTag) this.mesh.add(oldTag);
    this.weaponMesh = null;
    this.updateWeaponMesh();
    if (grantStarter) this.applyStarterGear();
  }

  applyStarterGear() {
    this.hotbar = Array(8).fill(null);
    this.backpack = Array(20).fill(null);
    this.inv = { copper: 0, silver: 0, gold: 0, jade: 0 };
    this.equipped = { weapon: null, armor: null };
    this.armor = 0;
    this.armorMax = 0;
    this.armorProtectRate = 0;
    this.armorReflectChance = 0;
    this.armorReflectRate = 0;
    this.arrowCount = 0;
    for (const starter of (this.roleInfo.starter || [])) {
      if (starter.currency) {
        this.inv[starter.currency] = (this.inv[starter.currency] || 0) + starter.count;
      } else if (starter.key === 'arrow') {
        this.arrowCount += starter.count;
      } else {
        this.addToBackpack(starter.key, starter.count);
        if (ITEM_DB[starter.key]?.type === 'weapon') this.equip(starter.key);
      }
    }
  }

  getEquippedSkinColor() {
    try {
      const pass = JSON.parse(localStorage.getItem('bedwars_season_pass') || '{}');
      const equipped = pass.equippedCosmetics || {};
      const skin = equipped['角色皮肤'] || equipped['角色换色'];
      if (skin === 'void_team_set' || skin === 'void_warrior' || skin === 'void_assassin' || skin === 'void_chanter') return 0x2b163d;
      if (skin === 'void_miner_uniform') return 0xff8a00;
      if (skin === 'metal_red') return 0xff3333;
      if (skin === 'metal_blue') return 0x33aaff;
      if (skin === 'metal_green') return 0x44ff88;
    } catch (e) {}
    if (this.role === 'FOX') return 0xff8a00;
    if (this.role === 'PORK_DOCTOR') return 0xff6f91;
    if (this.role === 'HURRICANE') return 0x33aaff;
    if (this.role === 'DRIFTWOOD') return 0x8b5a2b;
    if (this.role === 'STEEL_BONE') return 0x9ca3af;
    if (this.role === 'WAIWAI') return 0xf5f0dc;
    return this.teamInfo.color;
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
      this.arrowCount += count || info.count || 8;
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
    if (key === 'revival_gold') {
      this.hasRevivalToken = true;
      window.game?.showMessage?.('复活金牌已激活，下次致命伤害将自动抵挡！', '#ffd700');
      return true;
    }
    if (key === 'cd_potion') {
      this.skillCd = Math.max(0, this.skillCd - 5);
      window.game?.showMessage?.('技能冷却减少5秒！', '#8be9fd');
      return true;
    }
    if (key === 'speed_potion') {
      this.speedPotionTimer = 3;
      window.game?.showMessage?.('移动速度+25%，持续3秒！', '#50fa7b');
      return true;
    }
    if (key === 'burst_potion') {
      this.burstPotionTimer = 3;
      window.game?.showMessage?.('伤害增加45%，持续3秒！', '#ff5555');
      return true;
    }
    if (key === 'tnt') {
      // TNT 使用逻辑在游戏层处理
    }

    const stack = info.stack || 1;

    // 检查快捷栏和背包是否已满
    let hasSpace = false;
    for (let i = 0; i < this.hotbar.length; i++) {
      const slot = this.hotbar[i];
      if (!slot || (slot.key === key && slot.count < stack)) {
        hasSpace = true;
        break;
      }
    }
    if (!hasSpace) {
      for (let i = 0; i < this.backpack.length; i++) {
        const slot = this.backpack[i];
        if (!slot || (slot.key === key && slot.count < stack)) {
          hasSpace = true;
          break;
        }
      }
    }
    if (!hasSpace) return false;

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
    this.breakCamouflage();
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
    this.breakCamouflage();
    const item = this.getSelectedItem();
    if (!item) return;
    const info = ITEM_DB[item.key];
    if (!info) return;

    if (info.type === 'weapon') {
      if (this.equipped.weapon === item.key && (item.key === 'armor_hammer' || info.projectileType)) {
        this.useWeaponAlt();
      } else {
        this.equipped.weapon = item.key;
        this.updateWeaponMesh();
        window.game?.showMessage?.(`已装备：${info.name}`, '#8be9fd');
      }
    } else if (info.type === 'armor') {
      if (this.equipped.armor === item.key) {
        // 卸下当前护甲
        this.equipped.armor = null;
        this.armorInfo = null;
        this.armor = 0;
        this.armorMax = 0;
        this.armorProtectRate = 0;
        this.armorReflectChance = 0;
        this.armorReflectRate = 0;
        window.game?.showMessage?.(`已卸下：${info.name}`, '#ffaa00');
      } else {
        // 装备新护甲
        this.equipped.armor = item.key;
        this.armorInfo = item.key;
        this.armor = info.armor;
        this.armorMax = info.armor;
        this.armorProtectRate = info.protectRate || 0;
        this.armorReflectChance = info.reflectChance || 0;
        this.armorReflectRate = info.reflectRate || 0;
        item.count--;
        if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
        window.game?.showMessage?.(`已装备：${info.name}`, '#8be9fd');
      }
    } else if (info.type === 'block') {
      // 放置方块由外部调用 placeBlock 处理
    } else if (info.explosive) {
      const dir = this.getForwardDir();
      const placePos = this.pos.clone().addScaledVector(dir, 1.5);
      placePos.y = Math.max(this.getGroundHeight(placePos.x, placePos.z) + 0.05, this.pos.y - this.radius + 0.05);
      this.engine.createTimedExplosive(this, item.key, placePos);
      item.count--;
      if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
      window.game?.showMessage?.(`${info.name} 已放置，${info.explosionDelay}s 后爆炸`, '#ffdd00');
    } else if (item.key === 'repair_drone') {
      this.engine.createRepairDrone(this);
      item.count--;
      if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
      window.game?.showMessage?.('自动修复无人机已启动，持续20秒', '#8be9fd');
    } else if (info.healAmount || info.healFull) {
      this.startHealAction(item, info);
    } else if (item.key === 'potion') {
      this.hp = this.maxHp;
      item.count--;
      if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
    } else if (item.key === 'revival_gold') {
      this.hasRevivalToken = true;
      item.count--;
      if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
      window.game?.showMessage?.('复活金牌已激活，下次致命伤害将自动抵挡！', '#ffd700');
    } else if (item.key === 'cd_potion') {
      this.skillCd = Math.max(0, this.skillCd - 5);
      item.count--;
      if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
      window.game?.showMessage?.('技能冷却减少5秒！', '#8be9fd');
    } else if (item.key === 'speed_potion') {
      this.speedPotionTimer = 3;
      item.count--;
      if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
      window.game?.showMessage?.('移动速度+25%，持续3秒！', '#50fa7b');
    } else if (item.key === 'burst_potion') {
      this.burstPotionTimer = 3;
      item.count--;
      if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
      window.game?.showMessage?.('伤害增加45%，持续3秒！', '#ff5555');
    } else if (item.key === 'teleport_coin') {
      // 传送硬币由游戏循环蓄力处理，此处不执行
      return;
    } else if (item.key === 'portal') {
      this.pos.copy(this.teamInfo.spawn);
      this.vel.set(0, 0, 0);
      item.count--;
      if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
    } else if (item.key === 'trap_device') {
      // 放置追踪装置
      const dir = this.getForwardDir();
      const placePos = this.pos.clone().add(new THREE.Vector3(0, 0, 0)).addScaledVector(dir, 1.5);
      placePos.y = Math.max(0.5, placePos.y);
      const trap = this.engine.createTrapDevice(placePos, this.team, this);
      item.count--;
      if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
      window.game?.showMessage(`${this.name} 放置了追踪装置！`, '#8be9fd');
      // 自动装填箭矢
      if (this.arrowCount > 0) {
        const loaded = this.engine.loadTrapArrows(trap, Math.min(this.arrowCount, 100));
        this.arrowCount -= loaded;
        window.game?.showMessage(`已装填 ${loaded} 支箭矢`, '#ffdd00');
      }
    } else if (item.key === 'bear_trap' || item.key === 'sensor_mine') {
      const dir = this.getForwardDir();
      const placePos = this.pos.clone().addScaledVector(dir, 1.6);
      placePos.y = this.getGroundHeight(placePos.x, placePos.z);
      this.engine.createGroundDevice(placePos, item.key, this.team, this);
      item.count--;
      if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
      window.game?.showMessage(`${this.name} 放置了${ITEM_DB[item.key].name}`, item.key === 'sensor_mine' ? '#ff5533' : '#ffdd00');
    }
  }

  startHealAction(item, info) {
    if (this.healAction) {
      this.healAction = null;
      window.game?.showMessage?.('已取消治疗', '#cccccc');
      return;
    }
    this.vel.x *= 0.2;
    this.vel.z *= 0.2;
    this.healAction = { item, info, remain: info.useTime, total: info.useTime };
    window.game?.showMessage?.(`开始使用${info.name}，再次点击可取消`, '#50fa7b');
  }

  useWeaponAlt() {
    this.breakCamouflage();
    if (!this.equipped.weapon || this.attackCd > 0 || this.isDead || this.isFrozen) return;
    const w = ITEM_DB[this.equipped.weapon];
    if (!w) return;
    if (this.equipped.weapon === 'armor_hammer') {
      this.attackCd = 1.15;
      const dir = this.getForwardDir();
      for (const ent of this.engine.entities) {
        if (ent === this || ent.isDead || ent.team === this.team) continue;
        const to = ent.pos.clone().sub(this.pos);
        const dist = to.length();
        if (dist > 4) continue;
        const angle = dir.angleTo(to.clone().normalize());
        if (angle < Math.PI / 4) {
          ent.vel.add(to.normalize().multiplyScalar(9));
          ent.vel.y = Math.max(ent.vel.y, 4);
          ent.takeDamage(6, this);
        }
      }
      this.engine.spawnParticles(this.pos.clone().addScaledVector(dir, 2), 0xffdd00, 12);
      window.game?.showMessage?.('破甲锤蓄力震退！', '#ffdd00');
      return;
    }
    if (w.projectileType) {
      this.attack();
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

  consumeWeaponDurability() {
    const item = this.getSelectedItem();
    const info = item ? ITEM_DB[item.key] : null;
    if (!item || item.key !== this.equipped.weapon || !info?.durability) return;
    item.durability = item.durability ?? info.durability ?? 1;
    item.durability--;
    if (item.durability <= 0) {
      window.game?.showMessage?.(`${info.name} 已损坏`, '#ff5555');
      this.hotbar[this.hotbarIndex] = null;
      this.equipped.weapon = null;
      this.updateWeaponMesh();
    }
  }

  update(dt) {
    if (this.isDead) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.respawn();
      return;
    }

    // 新角色被动
    if (this.role === 'PORK_DOCTOR') {
      this.porkHealTimer -= dt;
      if (this.porkHealTimer <= 0) {
        this.hp = Math.min(this.maxHp, this.hp + 5 + (this.porkHealBonus || 0));
        this.porkHealTimer = 15;
      }
    }
    if (this.invulnTimer > 0) {
      this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    }
    if (this.role === 'WAIWAI') {
      if (this.missInvulnTimer > 0) this.missInvulnTimer = Math.max(0, this.missInvulnTimer - dt);
      if (this.miss < this.maxMiss) {
        this.missRegenTimer -= dt;
        if (this.missRegenTimer <= 0) {
          this.miss = Math.min(this.maxMiss, this.miss + 1);
          this.missRegenTimer = Math.max(5, 30 - (this.missRegenBonus || 0));
          window.game?.showMessage?.(`${this.name} 回复了1点miss`, '#f5f0dc');
        }
      } else {
        this.missRegenTimer = Math.max(5, 30 - (this.missRegenBonus || 0));
      }
    }
    if (this.healAction) {
      this.healAction.remain -= dt;
      this.vel.x *= 0.86;
      this.vel.z *= 0.86;
      if (this.healAction.remain <= 0) {
        const { item, info } = this.healAction;
        this.hp = info.healFull ? this.maxHp : Math.min(this.maxHp, this.hp + info.healAmount);
        item.usesLeft = item.usesLeft ?? info.uses;
        item.usesLeft--;
        if (item.usesLeft <= 0) {
          item.count--;
          delete item.usesLeft;
          if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
        }
        window.game?.showMessage?.(`${info.name} 治疗完成`, '#50fa7b');
        this.healAction = null;
      }
    }

    // Skill timers
    if (this.attackCd > 0) this.attackCd -= dt;
    if (this.bowCdTimer > 0) this.bowCdTimer -= dt;
    if (this.skillCd > 0) this.skillCd -= dt;
    if (this.skillActive > 0) {
      this.skillActive -= dt;
      if (this.skillActive <= 0) this.deactivateSkill();
    }
    if (this.fatTimer > 0) this.fatTimer -= dt;
    if (this.speedPotionTimer > 0) this.speedPotionTimer = Math.max(0, this.speedPotionTimer - dt);
    if (this.burstPotionTimer > 0) this.burstPotionTimer = Math.max(0, this.burstPotionTimer - dt);
    if (this.hurricaneDamageTimer > 0) this.hurricaneDamageTimer -= dt;
    if (this.camouflageTimer > 0) {
      this.camouflageTimer -= dt;
      this.isInvisible = true;
      if (this.camouflageTimer <= 0) this.breakCamouflage(false);
    }

    // Detector logic
    const selectedItem = this.getSelectedItem();
    const selectedInfo = selectedItem ? ITEM_DB[selectedItem.key] : null;
    if (selectedItem?.key === 'detector') {
      let enemyCount = 0;
      for (const ent of this.engine.entities) {
        if (ent !== this && !ent.isDead && ent.team !== this.team) {
          if (ent.pos.distanceTo(this.pos) <= 10) enemyCount++;
        }
      }
      this.detectorEnemyCount = enemyCount;
      this.detectorDurabilityTimer += dt;
      if (this.detectorDurabilityTimer >= 1) {
        this.detectorDurabilityTimer -= 1;
        selectedItem.durability = (selectedItem.durability ?? selectedInfo.durability) - 1;
        if (selectedItem.durability <= 0) {
          this.hotbar[this.hotbarIndex] = null;
          window.game?.showMessage?.('探测仪耐久耗尽，已自动销毁', '#ff5555');
          this.detectorEnemyCount = 0;
        }
      }
    } else {
      this.detectorEnemyCount = 0;
      this.detectorDurabilityTimer = 0;
    }

    // Glass bridge timer
    if (this.glassBridgeTimer > 0) {
      this.glassBridgeTimer -= dt;
      if (this.glassBridgeLabel) {
        this.engine.updateTextSprite(this.glassBridgeLabel, `${Math.max(0, this.glassBridgeTimer).toFixed(1)}s`);
      }
      if (this.glassBridgeTimer <= 0) {
        for (const block of this.glassBridgeBlocks) {
          this.engine.removeBlock(block.x, block.y, block.z);
        }
        if (this.glassBridgeLabel) {
          this.engine.scene.remove(this.glassBridgeLabel);
          this.glassBridgeLabel = null;
        }
        this.glassBridgeBlocks = [];
        if (this.glassBridgeCdPending) {
          this.skillCd = Math.max(3, this.roleInfo.active.cd - (this.skillCdBonus || 0));
          this.glassBridgeCdPending = false;
        }
      }
    }

    // Steel Bone skill hold preview
    if (this.isLocal && this.role === 'STEEL_BONE' && this.skillCd <= 0 && this.glassBridgeTimer <= 0) {
      const input = window.game?.input;
      if (input && (input.buttons.skillHeld || input.keys['KeyQ'])) {
        this.skillHoldTime += dt;
        if (this.skillHoldTime > 0.2) {
          if (!this.skillPreviewMesh) {
            const geo = new THREE.BoxGeometry(2, 1, 15);
            const mat = new THREE.MeshBasicMaterial({ color: 0x9eefff, transparent: true, opacity: 0.25, wireframe: true });
            this.skillPreviewMesh = new THREE.Mesh(geo, mat);
            this.engine.scene.add(this.skillPreviewMesh);
          }
          const dir = this.getForwardDir();
          dir.y = 0;
          dir.normalize();
          const previewPos = this.pos.clone().addScaledVector(dir, 7.5);
          previewPos.y = Math.floor(this.pos.y);
          this.skillPreviewMesh.position.copy(previewPos);
          this.skillPreviewMesh.lookAt(previewPos.clone().add(dir));
          this.skillPreviewMesh.visible = true;
        }
      } else {
        this.skillHoldTime = 0;
        if (this.skillPreviewMesh) {
          this.engine.scene.remove(this.skillPreviewMesh);
          this.skillPreviewMesh = null;
        }
      }
    } else {
      this.skillHoldTime = 0;
      if (this.skillPreviewMesh) {
        this.engine.scene.remove(this.skillPreviewMesh);
        this.skillPreviewMesh = null;
      }
    }

    // ============================================
    // Twilight Forest: Fog Erosion System
    // ============================================
    if (this.engine.mapId === 'twilight_forest') {
      // Ground fog Y<=12: force 5-block vision + screen darkness + fog damage
      if (this.pos.y <= 12) {
        this.fogDistance = 5;
        this.screenDarkness = Math.min(0.65, (this.screenDarkness || 0) + dt * 0.35);
        this.fogDamageTimer = (this.fogDamageTimer || 0) + dt;
        if (this.fogDamageTimer >= 2) {
          this.fogDamageTimer -= 2;
          this.hp -= 0.5;
          if (this.hp <= 0) {
            this.die(null, false);
            return;
          }
        }
      } else {
        this.fogDistance = null;
        this.screenDarkness = Math.max(0, (this.screenDarkness || 0) - dt * 0.35);
        this.fogDamageTimer = 0;
      }

      // Apply visual effects for local player
      if (this.isLocal) {
        if (this.fogDistance) {
          this.engine.scene.fog.near = 3;
          this.engine.scene.fog.far = 6;
        } else {
          this.engine.scene.fog.near = 50;
          this.engine.scene.fog.far = 140;
        }
        const brightness = 1 - (this.screenDarkness || 0);
        this.engine.renderer.domElement.style.filter = `brightness(${brightness.toFixed(2)})`;
      }

      // Canopy footsteps scale 2x (visual dust particles)
      if (this.pos.y >= 30 && this.pos.y <= 40 && this.onGround) {
        this.footstepScale = 2;
        if (Math.abs(this.vel.x) > 0.2 || Math.abs(this.vel.z) > 0.2) {
          this.footstepTimer = (this.footstepTimer || 0) + dt;
          if (this.footstepTimer >= 0.25) {
            this.footstepTimer -= 0.25;
            this.engine.spawnParticles(this.pos.clone().add(new THREE.Vector3(0, -0.4, 0)), 0x8B4513, 4);
          }
        }
      } else {
        this.footstepScale = 1;
        this.footstepTimer = 0;
      }

      // Grey claw marks when enemy is under canopy (within 20 blocks horizontally)
      if (this.isLocal) {
        let clawActive = false;
        for (const ent of this.engine.entities) {
          if (ent !== this && !ent.isDead && ent.team !== this.team) {
            const canopyCenters = [[0, -50], [0, 50], [50, 0], [-50, 0]];
            for (const [ccx, ccz] of canopyCenters) {
              const ddx = ent.pos.x - ccx;
              const ddz = ent.pos.z - ccz;
              if (ddx * ddx + ddz * ddz <= 400) {
                clawActive = true;
                break;
              }
            }
            if (clawActive) break;
          }
        }
        if (clawActive) {
          this.clawMarkTimer = (this.clawMarkTimer || 0) + dt;
          if (this.clawMarkTimer >= 0.45) {
            this.clawMarkTimer = 0;
            for (let i = 0; i < 4; i++) {
              const angle = Math.random() * Math.PI * 2;
              const r = 2.5 + Math.random() * 2;
              const ppos = this.pos.clone().add(new THREE.Vector3(Math.cos(angle) * r, 0.2 + Math.random() * 0.6, Math.sin(angle) * r));
              this.engine.spawnParticles(ppos, 0x888888, 1);
            }
          }
        } else {
          this.clawMarkTimer = 0;
        }
      }
    }
    // ============================================

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

    // Void death with optional out-game grace talent
    if (this.pos.y < -15) {
      if (this.voidGrace > 0 && this.voidGraceTimer < this.voidGrace) {
        this.voidGraceTimer += dt;
        this.vel.y = Math.max(this.vel.y, -2);
      } else {
        this.die(null, true);
        return;
      }
    } else {
      this.voidGraceTimer = 0;
    }

    if (this.silencedTimer > 0) this.silencedTimer -= dt;
    if (this.slowTimer > 0) this.slowTimer -= dt;
    if (this.frostTimer > 0) this.frostTimer -= dt;
    if (this.rootTimer > 0) this.rootTimer -= dt;
    // 高能人悬浮逻辑
    if (this.jetpackTimer > 0) {
      this.jetpackTimer = Math.max(0, this.jetpackTimer - dt);
      this.vel.y = 0; // 悬浮不坠落
      this.onGround = false;
      if (this.jetpackTimer <= 0) {
        // 悬浮结束，进入冷却
        this.skillCd = Math.max(3, (ROLES.HIGH_ENERGY?.active?.cd || 30) - (this.skillCdBonus || 0));
        window.game?.showMessage?.('超能喷气已结束，进入冷却', '#ff8800');
      }
    }
    if (this.revealedTimer > 0) this.revealedTimer -= dt;
    if (this.smokeBlindTimer > 0) this.smokeBlindTimer -= dt;
    if (this.smokeInvisibleTimer > 0) this.smokeInvisibleTimer -= dt;
    if (this.socialShield > 0) this.socialShield -= dt;

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

    // 隐身视觉：狐狸伪装只留下非常淡的白色轮廓，武器和名称全部隐藏
    if (this.smokeInvisibleTimer <= 0 && this.camouflageTimer <= 0) this.isInvisible = false;
    if (this.camouflageTimer > 0) {
      this.mesh.material.transparent = true;
      this.mesh.material.opacity = 0.072;
      this.mesh.material.depthWrite = false;
      this.mesh.material.wireframe = true;
      this.mesh.material.color.setHex(0xf8fbff);
      this.mesh.material.emissive?.setHex?.(0xf8fbff);
      this.mesh.material.emissiveIntensity = 0.05;
      if (this.weaponMesh) this.weaponMesh.visible = false;
      if (this.nameTag) this.nameTag.visible = false;
    } else if (this.isInvisible || this.smokeInvisibleTimer > 0) {
      this.mesh.material.transparent = true;
      this.mesh.material.opacity = 0.18;
      this.mesh.material.depthWrite = false;
      this.mesh.material.wireframe = false;
      if (this.weaponMesh) this.weaponMesh.visible = false;
      if (this.nameTag) this.nameTag.visible = this.revealedTimer > 0;
    } else {
      this.mesh.material.transparent = false;
      this.mesh.material.opacity = 1;
      this.mesh.material.depthWrite = true;
      this.mesh.material.wireframe = false;
      if (this.weaponMesh) this.weaponMesh.visible = true;
      // 距离检测：10格以内显示名签
      if (this.nameTag) {
        const localPlayer = this.engine.entities.find(e => e.isLocal);
        if (localPlayer) {
          const dist = this.pos.distanceTo(localPlayer.pos);
          this.nameTag.visible = dist < 10;
        } else {
          this.nameTag.visible = true;
        }
      }
    }
    // 死亡时隐藏名签和护甲标签
    if (this.isDead && this.nameTag) this.nameTag.visible = false;
    // 更新护甲信息标签
    if (this.armorTag) {
      if (this.isLocal || !this.nameTag?.visible) {
        this.armorTag.visible = false;
      } else {
        this.armorTag.visible = true;
        const armor = this.armor || 0;
        const armorInfo = this.armorInfo ? ITEM_DB[this.armorInfo] : null;
        const text = armor > 0 ? `\u{1F6E1}${Math.ceil(armor)}` : '';
        if (text !== this._lastArmorText) {
          this._lastArmorText = text;
          const ac = this.armorTag.material.map.image.getContext('2d');
          ac.clearRect(0, 0, 256, 48);
          ac.fillStyle = '#ffffff';
          ac.font = 'bold 24px Arial';
          ac.textAlign = 'center';
          ac.fillText(text, 128, 32);
          this.armorTag.material.map.needsUpdate = true;
        }
      }
    }
    if (this.camouflageTimer <= 0) {
      this.mesh.material.emissive?.setHex?.(this.skinColor !== this.teamInfo.color ? this.skinColor : 0x000000);
      this.mesh.material.emissiveIntensity = this.skinColor !== this.teamInfo.color ? 0.18 : 0;
      if (this.frostTimer > 0) this.mesh.material.color.setHex(0x8be9fd);
      else this.mesh.material.color.setHex(this.skinColor || this.teamInfo.color);
    }

    // 电脑端预放置轮廓
    if (this.isLocal && !window.game?.input?.isMobile?.()) {
      const blockType = this.getSelectedBlockType();
      if (blockType) {
        const rc = this.engine.raycastPlacement(window.innerWidth / 2, window.innerHeight / 2, 12);
        if (rc.hit) {
          const px = rc.x, py = rc.y, pz = rc.z;
          const center = new THREE.Vector3(px + 0.5, py + 0.5, pz + 0.5);
          if (center.distanceTo(this.pos) <= 10 && !(Math.abs(px - this.pos.x) < 0.8 && Math.abs(py - this.pos.y) < 1.5 && Math.abs(pz - this.pos.z) < 0.8)) {
            if (!this.placePreviewMesh) {
              const geo = new THREE.BoxGeometry(1, 1, 1);
              const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, wireframe: true });
              this.placePreviewMesh = new THREE.Mesh(geo, mat);
              this.engine.scene.add(this.placePreviewMesh);
            }
            this.placePreviewMesh.position.copy(center);
            this.placePreviewMesh.visible = true;
          } else {
            if (this.placePreviewMesh) this.placePreviewMesh.visible = false;
          }
        } else {
          if (this.placePreviewMesh) this.placePreviewMesh.visible = false;
        }
      } else {
        if (this.placePreviewMesh) {
          this.engine.scene.remove(this.placePreviewMesh);
          this.placePreviewMesh = null;
        }
      }
    } else {
      if (this.placePreviewMesh) {
        this.engine.scene.remove(this.placePreviewMesh);
        this.placePreviewMesh = null;
      }
    }

    // Camera follow
    if (this.isLocal && !this.missileControl) {
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
    if (this.isDead || this.isFrozen || this.rootTimer > 0) return;
    const slowMult = this.frostTimer > 0 ? 0.7 : (this.slowTimer > 0 ? 0.65 : 1);
    const roleSpeedMult = (this.camouflageTimer > 0 ? 1.5 : 1) * (this.fatTimer > 0 ? 0.75 : 1);
    const spd = (sprint ? 1.5 : 1) * this.speed * slowMult * roleSpeedMult * (this.speedPotionTimer > 0 ? 1.25 : 1) * (this.healAction ? 0.5 : 1);
    const moveDir = new THREE.Vector3();
    if (this.isLocal) {
      const forward = new THREE.Vector3();
      this.engine.camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 0.0001) forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      forward.normalize();
      const right = new THREE.Vector3().setFromMatrixColumn(this.engine.camera.matrixWorld, 0);
      right.y = 0;
      right.normalize();
      moveDir.addScaledVector(forward, dz);
      moveDir.addScaledVector(right, dx);
    } else {
      const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      moveDir.addScaledVector(forward, -dz);
      moveDir.addScaledVector(right, dx);
    }
    if (moveDir.lengthSq() > 1) moveDir.normalize();
    this.vel.x = moveDir.x * spd;
    this.vel.z = moveDir.z * spd;
  }

  jump() {
    if (this.healAction) return;
    if (this.onGround && !this.isDead && !this.isFrozen && this.rootTimer <= 0) {
      this.vel.y = this.jumpPower * (this.frostTimer > 0 ? 0.5 : 1);
      this.onGround = false;
      // 高能人悬浮时跳跃加速消耗
      if (this.jetpackTimer > 0) {
        this.jetpackTimer = Math.max(0, this.jetpackTimer - 0.7); // 额外消耗0.7秒（约30%）
        this.vel.y = 8; // 快速上升
      }
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
    if (this.isDead || this.isFrozen || this.attackCd > 0 || this.silencedTimer > 0) return;
    this.breakCamouflage();
    this.attackCd = 0.35;

    let dmg = this.baseDmg;
    let range = this.attackRange;
    let isRanged = false;

    if (this.equipped.weapon) {
      const w = ITEM_DB[this.equipped.weapon];
      dmg = w.dmg;
      isRanged = w.ranged;
      if (w.slow) this.attackCd = 1.15;
    }

    if (this.role === 'FOX' && this.hp / this.maxHp < 0.2) dmg *= 1.2;
    if (this.hurricaneDamageTimer > 0) dmg += 12;
    if (this.burstPotionTimer > 0) dmg *= 1.45;
    if (this.lowHpDamageBoost && this.hp / this.maxHp < 0.3) dmg *= (1 + this.lowHpDamageBoost);

    const weaponInfo = this.equipped.weapon ? ITEM_DB[this.equipped.weapon] : null;
    if (weaponInfo?.projectileType) {
      const dir = this.getForwardDir();
      const start = this.pos.clone().add(new THREE.Vector3(0, 0.8, 0));
      const type = weaponInfo.projectileType;
      const finalDmg = (type === 'frost' ? 5 : type === 'boomerang' ? 7 : type === 'javelin' ? 8 : 0) + (this.hurricaneDamageTimer > 0 ? 12 : 0);
      this.engine.spawnWeaponProjectile(this, type, start, dir, {
        damage: finalDmg,
        speed: type === 'smoke' ? 14 : type === 'frost' ? 20 : type === 'boomerang' ? 18 : 24,
        life: type === 'smoke' ? 2.1 : type === 'boomerang' ? 2.8 : 3
      });
      window.game?.showMessage?.(`${weaponInfo.name}已使用`, '#8be9fd');
    } else if (weaponInfo?.detectiveBow) {
      // 侦探弓：无限箭矢，8秒冷却
      if ((this.bowCdTimer || 0) > 0) return;
      this.bowCdTimer = weaponInfo.bowCd || 8;
      this.fireArrow(0);
    } else if (isRanged && this.arrowCount > 0) {
      if (this.isAI) {
        this.fireArrow(0);
      } else {
        this.startBowCharge();
      }
    } else if (!isRanged) {
      const dir = this.getForwardDir();
      const hitPos = this.pos.clone().add(new THREE.Vector3(0, 0.5, 0)).addScaledVector(dir, range * 0.5);
      this.engine.spawnParticles(hitPos, 0xffffff, 3);

      let hitAny = false;
      const isSK = window.game?.isSecretKiller;
      for (const ent of this.engine.entities) {
        if (ent === this || ent.isDead) continue;
        if (!isSK && ent.team === this.team) continue; // 密室杀手不检查队伍
        if (isSK && ent.skRole === this.skRole) continue; // 同阵营不伤害
        const dist = ent.pos.distanceTo(this.pos);
        if (dist < 2) {
          let finalDmg = dmg;
          ent.takeDamage(finalDmg, this);
          hitAny = true;
          if (this.role === 'DRIFTWOOD') this.extraShield = Math.min(60 + (this.shieldCapBonus || 0), (this.extraShield || 0) + 3);
        }
      }
      if (hitAny) this.consumeWeaponDurability();

      const rc = this.engine.raycastBlocks(this.pos.clone().add(new THREE.Vector3(0, 0.6, 0)), dir, range + 0.8);
      if (rc.hit) {
        const blockDmg = this.equipped.weapon === 'armor_hammer' ? dmg * 3 : dmg;
        this.engine.damageBlock(rc.pos.x, rc.pos.y, rc.pos.z, blockDmg);
      }

      // 可击落空中的回旋镖
      for (let i = this.engine.projectiles.length - 1; i >= 0; i--) {
        const proj = this.engine.projectiles[i];
        if (!proj.canBeShotDown || proj.owner?.team === this.team) continue;
        if (proj.mesh.position.distanceTo(hitPos) < 1.2) {
          this.engine.spawnParticles(proj.mesh.position, 0xffdd00, 8);
          this.engine.scene.remove(proj.mesh);
          this.engine.projectiles.splice(i, 1);
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
          this.matchStats.beds++;
          window.game?.growth?.addXp?.(this, GROWTH_CONFIG.xp.bedBreak, '拆床');
          window.game?.onBedDestroyed(tkey, this);
        }
      }
    }
  }

  startBowCharge() {
    if (this.bowCharge > 0) return;
    this.bowCharge = 0.01;
    if (!this.bowChargeLine) {
      const points = [];
      for (let i = 0; i <= 20; i++) points.push(new THREE.Vector3(0, 0, 0));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineDashedMaterial({ color: 0xffdd00, dashSize: 0.3, gapSize: 0.15, opacity: 0.6, transparent: true });
      this.bowChargeLine = new THREE.Line(geometry, material);
      this.engine.scene.add(this.bowChargeLine);
    }
  }

  updateBowCharge(dt) {
    if (this.bowCharge <= 0) return;
    this.bowCharge = Math.min(4, this.bowCharge + dt);
    const distance = 4 + this.bowCharge * 3;
    if (this.bowChargeLine) {
      const dir = this.getForwardDir();
      const start = this.pos.clone().add(new THREE.Vector3(0, 0.8, 0));
      const positions = this.bowChargeLine.geometry.attributes.position.array;
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const point = start.clone().addScaledVector(dir, distance * t);
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
      }
      this.bowChargeLine.geometry.attributes.position.needsUpdate = true;
      this.bowChargeLine.computeLineDistances();
    }
  }

  releaseBowCharge() {
    if (this.bowCharge <= 0) return;
    this.fireArrow(this.bowCharge);
    this.bowCharge = 0;
    if (this.bowChargeLine) {
      if (this.bowChargeLine.geometry) this.bowChargeLine.geometry.dispose();
      if (this.bowChargeLine.material) this.bowChargeLine.material.dispose();
      this.engine.scene.remove(this.bowChargeLine);
      this.bowChargeLine = null;
    }
  }

  fireArrow(charge = 0) {
    const weaponInfo = ITEM_DB[this.equipped.weapon];
    const dmg = (weaponInfo?.dmg || 20) * (1 + charge * 0.25);
    const speed = 45 + charge * 15;
    const range = (weaponInfo?.range || 20) + charge * 10;

    const dir = this.getForwardDir().clone().normalize();
    const start = this.pos.clone().add(new THREE.Vector3(0, 0.8, 0));

    // Use ConeGeometry for clear directional arrow
    const arrowGeo = new THREE.ConeGeometry(0.03, 0.6, 6);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    arrowMesh.position.copy(start);

    // Point cone tip (Y+) towards dir using quaternion
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);
    arrowMesh.setRotationFromQuaternion(quaternion);

    this.engine.scene.add(arrowMesh);

    const life = range / speed;
    const finalDmg = dmg; // 伤害已在上方计算时包含蓄力加成，不再重复乘算
    this.engine.projectiles.push({
      mesh: arrowMesh,
      vel: dir.clone().multiplyScalar(speed),
      life,
      damage: finalDmg,
      owner: this
    });
    this.arrowCount--;
    if (this.engine.ui) this.engine.ui.updateArrowCount();
  }

  updateHandBreak(dt, pointer = null) {
    if (this.isDead || this.isFrozen || this.rootTimer > 0) return;
    const rc = pointer
      ? this.engine.raycastPlacement(pointer.x, pointer.y, 5.5)
      : this.engine.raycastBlocks(this.pos.clone().add(new THREE.Vector3(0, 0.7, 0)), this.getForwardDir(), 5.5);
    if (!rc.hit) {
      this.handBreakTimer = 0;
      this.handBreakKey = null;
      return;
    }
    const key = rc.key || rc.baseKey || this.engine.getBlockKey(rc.x, rc.y, rc.z);
    const blk = this.engine.blocks.get(key);
    if (!blk || blk.type === 'ground') {
      this.handBreakTimer = 0;
      this.handBreakKey = null;
      return;
    }
    if (ITEM_DB[blk.type]?.handImmune) {
      this.handBreakTimer = 0;
      this.handBreakKey = key;
      return;
    }
    if (this.handBreakKey !== key) {
      this.handBreakKey = key;
      this.handBreakTimer = 0;
    }
    this.handBreakTimer += dt;
    if (this.handBreakTimer >= 0.5) {
      this.handBreakTimer = 0;
      const [x, y, z] = key.split(',').map(Number);
      this.engine.handDamageBlock(x, y, z, 1);
      this.engine.spawnParticles(blk.mesh.position, 0xffffff, 2);
      window.game?.showMessage?.('徒手拆毁：建筑耐久 -1', '#ffdd00');
    }
  }

  placeBlock(pointer = null, mobileMode = false) {
    if (this.isDead || this.isFrozen) return;
    this.breakCamouflage();
    const blockType = this.getSelectedBlockType();
    if (!blockType) return;
    const item = this.getSelectedItem();
    if (!item || item.count <= 0) return;

    const rc = this.engine.raycastPlacement(mobileMode && pointer ? pointer.x : (pointer?.x || window.innerWidth / 2), mobileMode && pointer ? pointer.y : (pointer?.y || window.innerHeight / 2), mobileMode ? 10 : 12);
    if (rc.hit) {
      const px = rc.x;
      const py = rc.y;
      const pz = rc.z;
      const center = new THREE.Vector3(px + 0.5, py + 0.5, pz + 0.5);
      if (center.distanceTo(this.pos) > (mobileMode ? 8 : 10)) return;
      if (Math.abs(px - this.pos.x) < 0.8 && Math.abs(py - this.pos.y) < 1.5 && Math.abs(pz - this.pos.z) < 0.8) return;
      const steelBonus = this.role === 'STEEL_BONE' ? 1.2 + (this.steelBuildBonus || 0) : 1;
      // 检查放置位置是否有支撑（6面相邻至少一个已有方块，或地面）
      const hasSupport = (() => {
        const neighbors = [
          [px, py - 1, pz], [px, py + 1, pz],
          [px - 1, py, pz], [px + 1, py, pz],
          [px, py, pz - 1], [px, py, pz + 1]
        ];
        for (const [nx, ny, nz] of neighbors) {
          const nk = this.engine.getBlockKey(nx, ny, nz);
          if (this.engine.blocks.has(nk)) return true;
        }
        // 检查是否在地面高度（y=0 或有 ground 类型方块）
        if (py <= 0) return true;
        return false;
      })();
      if (!hasSupport) return;
      if (this.engine.placeBlock(px, py, pz, blockType, this.team, steelBonus, this)) {
        item.count--;
        if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
        this.matchStats.blocksPlaced++;
        const equipped = JSON.parse(localStorage.getItem('bedwars_season_pass') || '{}')?.equippedCosmetics || {};
        const bridgeFx = equipped['搭路特效'];
        const fxColor = bridgeFx === 'starlight_bridge_fx' ? 0x8be9fd
          : bridgeFx === 'frost_path_fx' ? 0xdff9ff
          : bridgeFx === 'flower_bridge_fx' ? 0xff78c8
          : bridgeFx === 'miner_bridge_fx' ? 0xb388ff
          : 0xffffff;
        if (bridgeFx) this.engine.spawnParticles(center, fxColor, bridgeFx === 'starlight_bridge_fx' ? 12 : 8);
        const xp = GROWTH_CONFIG.xp.placeBlock * (1 + (this.blockXpBoost || 0));
        window.game?.growth?.addXp?.(this, xp, '建造');
        this.acBlocksPlaced++;
        if (this.acBlocksPlaced > 15) {
          window.game?.reportCheat?.(this.playerId, 'rapid_build', { count: this.acBlocksPlaced }, 3);
        }
        // 放置成功后在前方1格显示新的预览方块
        const forward = this.getForwardDir();
        forward.y = 0;
        forward.normalize();
        const nextPx = px + Math.round(forward.x);
        const nextPz = pz + Math.round(forward.z);
        if (!this.placePreviewMesh) {
          const geo = new THREE.BoxGeometry(1, 1, 1);
          const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, wireframe: true });
          this.placePreviewMesh = new THREE.Mesh(geo, mat);
          this.engine.scene.add(this.placePreviewMesh);
        }
        this.placePreviewMesh.position.set(nextPx + 0.5, py + 0.5, nextPz + 0.5);
        this.placePreviewMesh.visible = true;
      }
    }
  }

  useSkill() {
    if (this.role === 'DRIFTWOOD' && this.missileControl) {
      this.missileControl.boosted = true;
      window.game?.showMessage?.('导弹已加速至15格/秒！', '#ffdd00');
      return;
    }
    if (this.isDead || this.isFrozen || this.skillCd > 0) return;
    if (this.role === 'STEEL_BONE' && this.glassBridgeTimer > 0) return;
    if (this.role !== 'FOX') this.breakCamouflage();
    const info = this.roleInfo;
    if (this.role !== 'STEEL_BONE') {
      this.skillCd = Math.max(3, info.active.cd - (this.skillCdBonus || 0));
    }
    this.skillActive = 0;

    if (this.role === 'FOX') {
      this.isInvisible = true;
      this.camouflageTimer = 12;
    } else if (this.role === 'PORK_DOCTOR') {
      this.maxHp += 150;
      this.hp = Math.min(this.maxHp, this.hp + 150);
      this.fatTimer = 8;
      this.skillActive = 8;
      this.mesh.scale.set(1.2, 1.2, 1.2);
    } else if (this.role === 'HURRICANE') {
      const dir = this.getForwardDir();
      const target = this.pos.clone().addScaledVector(dir, 6);
      target.y = Math.max(this.getGroundHeight(target.x, target.z) + this.radius, target.y);
      this.pos.copy(target);
      this.hurricaneDamageTimer = 5;
      this.engine.spawnParticles(this.pos, 0x8be9fd, 18);
    } else if (this.role === 'DRIFTWOOD') {
      this.launchMissile();
    } else if (this.role === 'STEEL_BONE') {
      this.createGlassBridge();
    } else if (this.role === 'HIGH_ENERGY') {
      this.jetpackTimer = this.jetpackMaxTime;
      this.vel.y = 4; // 初始弹起
      this.onGround = false;
      this.engine.spawnParticles(this.pos, 0xff8800, 20);
      window.game?.showMessage?.('超能喷气启动！悬浮22秒', '#ff8800');
    } else if (this.role === 'FROST') {
      this.castAbsoluteZero();
    } else if (this.role === 'WAIWAI') {
      this.engine.createBoneZone(this);
    }
  }

  deactivateSkill() {
    if (this.role === 'PORK_DOCTOR') {
      this.maxHp = Math.max(this.roleInfo.hp, this.maxHp - 150);
      this.hp = Math.min(this.hp, this.maxHp);
      this.mesh.scale.set(1, 1, 1);
    }
  }

  breakCamouflage(show = true) {
    if (this.camouflageTimer > 0) {
      this.camouflageTimer = 0;
      this.isInvisible = false;
      this.skillCd = ROLES.FOX.active.cd;
      if (show) window.game?.showMessage?.(`${this.name} 退出伪装`, '#cccccc');
    }
  }

  launchMissile() {
    if (this.missileControl) return;
    const dir = this.getForwardDir().normalize();
    const start = this.pos.clone().add(new THREE.Vector3(0, 1, 0)).addScaledVector(dir, 2);
    const geo = new THREE.ConeGeometry(0.22, 0.75, 10);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(start);
    mesh.lookAt(start.clone().add(dir));
    this.engine.scene.add(mesh);
    const missile = {
      mesh,
      vel: dir.multiplyScalar(8),
      life: 8,
      damage: 0,
      owner: this,
      type: 'missile',
      start: start.clone(),
      dir: dir.clone(),
      gravity: 0
    };
    this.missileControl = missile;
    this.engine.projectiles.push(missile);
  }

  createGlassBridge() {
    const dir = this.getForwardDir();
    dir.y = 0;
    dir.normalize();
    const right = new THREE.Vector3(-dir.z, 0, dir.x);
    this.glassBridgeBlocks = [];
    const startY = Math.floor(this.pos.y);
    for (let i = 1; i <= 15; i++) {
      const center = this.pos.clone().addScaledVector(dir, i);
      const positions = [
        { x: Math.floor(center.x), y: startY, z: Math.floor(center.z) },
        { x: Math.floor(center.x + right.x), y: startY, z: Math.floor(center.z + right.z) }
      ];
      for (const p of positions) {
        const key = this.engine.getBlockKey(p.x, p.y, p.z);
        if (!this.engine.blocks.has(key)) {
          this.engine.placeBlock(p.x, p.y, p.z, 'blast_glass', this.team, 1, this);
          this.glassBridgeBlocks.push(p);
        }
      }
    }
    this.glassBridgeTimer = 12;
    this.glassBridgeCdPending = true;
    if (this.glassBridgeBlocks.length > 0) {
      const mid = this.glassBridgeBlocks[Math.floor(this.glassBridgeBlocks.length / 2)];
      this.glassBridgeLabel = this.engine.makeTextSprite('12.0s', '#9eefff');
      this.glassBridgeLabel.position.set(mid.x + 0.5, mid.y + 1.5, mid.z + 0.5);
      this.engine.scene.add(this.glassBridgeLabel);
    }
    window.game?.showMessage?.('玻璃桥已生成，持续12秒', '#9eefff');
  }

  // ========== 高能人：附魔箭矢（被动） ==========
  createFireZone(pos) {
    // 创建3x3火焰区域
    const bx = Math.floor(pos.x);
    const bz = Math.floor(pos.z);
    const by = Math.floor(pos.y);
    const geo = new THREE.BoxGeometry(3, 0.2, 3);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.6 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(bx + 0.5, by + 0.1, bz + 0.5);
    this.engine.scene.add(mesh);
    const zone = {
      mesh, owner: this, team: this.team,
      cx: bx, cz: bz, radius: 1,
      life: 3, maxLife: 3, damage: 15, // 每秒15伤害
      type: 'fire'
    };
    this.engine.frostZones = this.engine.frostZones || [];
    this.engine.frostZones.push(zone);
    return zone;
  }

  // ========== 冰霜：绝对零度（主动） ==========
  castAbsoluteZero() {
    const dir = this.getForwardDir().normalize();
    const start = this.pos.clone().add(new THREE.Vector3(0, 1, 0));
    // 发射3个冰锥，间隔0.15秒（简化：同时发射3个，略微偏移角度）
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * 0.08; // -0.08, 0, 0.08
      const fireDir = dir.clone();
      fireDir.x += offset * fireDir.z;
      fireDir.z -= offset * fireDir.x;
      fireDir.normalize();
      const geo = new THREE.ConeGeometry(0.15, 0.8, 6);
      const mat = new THREE.MeshBasicMaterial({ color: 0x88ccff });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(start).addScaledVector(fireDir, 1.5);
      const up = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, fireDir);
      mesh.setRotationFromQuaternion(quat);
      this.engine.scene.add(mesh);
      this.engine.projectiles.push({
        mesh, vel: fireDir.multiplyScalar(35),
        life: 2, damage: 10, // 冰锥伤害较低，主要效果是冰冻
        owner: this, type: 'ice_spike',
        gravity: 0, hitSet: new Set()
      });
    }
    this.engine.spawnParticles(this.pos, 0x88ccff, 12);
    window.game?.showMessage?.('绝对零度！', '#88ccff');
  }

  // ========== 冰霜：霜降（被动） ==========
  createFrostZone(pos, size, life) {
    const halfSize = Math.floor(size / 2);
    const bx = Math.floor(pos.x);
    const bz = Math.floor(pos.z);
    const by = Math.max(0, Math.floor(pos.y));
    const geo = new THREE.BoxGeometry(size, 0.15, size);
    const mat = new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(bx + 0.5, by + 0.1, bz + 0.5);
    this.engine.scene.add(mesh);
    const zone = {
      mesh, owner: this, team: this.team,
      cx: bx, cz: bz, radius: halfSize,
      life: life, maxLife: life,
      slowAmount: 0.6, // 60%减速
      freezeAfter: 3, // 停留3秒后冰冻
      type: 'frost'
    };
    this.engine.frostZones = this.engine.frostZones || [];
    this.engine.frostZones.push(zone);
    return zone;
  }

  throwTeleportCoin() {
    const charge = this.teleportCoinCharge || 0;
    const dist = Math.min(20, charge * 0.5);
    if (dist <= 0.5) return;
    const dir = this.getForwardDir();
    const target = this.pos.clone().addScaledVector(dir, dist);
    target.y = this.getGroundHeight(target.x, target.z);
    // 如果目标在虚空（y < -10），不传送，硬币消失
    if (target.y < -10) {
      window.game?.showMessage?.('传送硬币落入虚空，传送失败！', '#ff4444');
      const item = this.getSelectedItem();
      if (item && item.key === 'teleport_coin') {
        item.count--;
        if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
      }
      return;
    }
    this.engine.spawnParticles(target, 0xffdd00, 12);
    this.pos.copy(target);
    this.pos.y = target.y + 0.5;
    this.vel.set(0, 0, 0);
    const item = this.getSelectedItem();
    if (item && item.key === 'teleport_coin') {
      item.count--;
      if (item.count <= 0) this.hotbar[this.hotbarIndex] = null;
    }
    window.game?.showMessage?.(`传送成功！距离 ${Math.round(dist)} 格`, '#ffdd00');
  }

  takeDamage(amount, attacker) {
    if (this.isDead) return;
    if (this.invulnTimer > 0) return; // 无敌帧期间不受伤害
    if (this.role === 'WAIWAI') {
      if (this.missInvulnTimer > 0) return;
      if (this.miss > 0) {
        this.miss--;
        this.missInvulnTimer = 1.2 + (this.missInvulnBonus || 0);
        this.missRegenTimer = Math.max(5, 30 - (this.missRegenBonus || 0));
        this.engine.spawnParticles(this.pos, 0xf5f0dc, 14);
        window.game?.showMessage?.(`${this.name} miss！抵挡了一次伤害`, '#f5f0dc');
        return;
      }
    }
    if (this.missileControl) {
      this.engine.explodeAt(this.missileControl.mesh.position.clone(), 4.5, 95, this);
      const idx = this.engine.projectiles.indexOf(this.missileControl);
      if (idx >= 0) this.engine.projectiles.splice(idx, 1);
      this.engine._disposeMesh(this.missileControl.mesh);
      this.missileControl = null;
    }
    const shieldReduce = this.socialShield > 0 ? 0.35 : 0;
    let incoming = amount * (1 - shieldReduce) * (1 - (this.flatDamageReduce || 0));
    let armorAbsorb = 0;
    if (this.armor > 0 && this.armorProtectRate > 0) {
      armorAbsorb = Math.min(this.armor, incoming * this.armorProtectRate);
      this.armor -= armorAbsorb;
      incoming -= armorAbsorb;
      if (this.armor <= 0) {
        this.armor = 0;
        this.equipped.armor = null;
        this.armorMax = 0;
        this.armorProtectRate = 0;
        this.armorReflectChance = 0;
        this.armorReflectRate = 0;
        this.armorInfo = null;
        window.game?.showMessage?.(`${this.name} 的护甲已损坏`, '#ff5555');
      }
      if (attacker && typeof attacker.takeDamage === 'function' && this.armorReflectChance > 0 && Math.random() < this.armorReflectChance) {
        attacker.takeDamage(amount * this.armorReflectRate, this);
        window.game?.showMessage?.('研发护甲触发反弹伤害！', '#b388ff');
      }
    }
    // 冰霜被动（霜降）：受伤后在自身位置留下2x2冰霜区域
    if (this.role === 'FROST' && !this.isDead) {
      this.createFrostZone(this.pos, 2, 3);
    }
    let actual = Math.max(1, incoming);
    if (this.extraShield > 0) {
      const absorbed = Math.min(this.extraShield, actual);
      this.extraShield -= absorbed;
      actual -= absorbed;
    }
    if (actual <= 0) return;
    this.hp -= actual;
    if (attacker) {
      attacker.matchStats.damage += actual;
      window.game?.growth?.addXp?.(attacker, actual * GROWTH_CONFIG.xp.damage, '造成伤害');
      if (attacker.arrowSlow) this.slowTimer = Math.max(this.slowTimer || 0, 1.2);
      const kbPower = 3 * (1 - (this.knockbackReduce || 0));
      const kb = this.pos.clone().sub(attacker.pos).normalize().multiplyScalar(kbPower);
      kb.y = 2;
      this.vel.add(kb);
    }
    if (this.hp <= 0) {
      if (this.hasRevivalToken) {
        this.hasRevivalToken = false;
        this.hp = Math.max(1, Math.floor(this.maxHp * 0.5));
        this.invulnTimer = 2.0; // 复活金牌触发后2秒无敌
        this.engine.spawnParticles(this.pos, 0xffd700, 20);
        window.game?.showMessage?.(`${this.name} 的复活金牌抵挡了致命伤害！`, '#ffd700');
        return;
      }
      // 密室杀手：侦探杀了好人（且不是同角色误杀）则自己也会死
      if (window.game?.isSecretKiller && attacker && attacker.skRole === 'detective' && this.skRole !== 'killer' && this.skRole !== attacker.skRole) {
        window.game?.showMessage?.(`侦探误杀了好人，自己也倒下了！`, '#ff4444');
        attacker.die(null);
      }
      this.die(attacker);
    }
  }

  die(killer, isVoidDeath = false) {
    if (this.isDead) return;
    this.isDead = true;
    this.hp = 0;
    this.mesh.visible = false;
    if (this.placePreviewMesh) {
      this.engine.scene.remove(this.placePreviewMesh);
      this.placePreviewMesh = null;
    }
    if (this.fatTimer > 0 || this.skillActive > 0) this.deactivateSkill();
    this.fatTimer = 0;
    if (this.missileControl) {
      this.engine.scene.remove(this.missileControl.mesh);
      const missileIdx = this.engine.projectiles.indexOf(this.missileControl);
      if (missileIdx >= 0) this.engine.projectiles.splice(missileIdx, 1);
      this.missileControl = null;
    }
    if (!isVoidDeath) this.deathCount++;
    this.respawnTimer = Math.min(GAME_RULES.respawnMaxTime, GAME_RULES.respawnBaseTime + (this.deathCount - 1) * GAME_RULES.respawnIncrement);
    this.pendingElimination = !this.teamInfo?.bedAlive;
    this.engine.spawnParticles(this.pos, this.teamInfo.color, 15);

    // 密室杀手：侦探死亡时掉落弓，杀手死亡不掉落刀
    if (window.game?.isSecretKiller && this.skRole === 'detective') {
      this.engine.spawnDropItem(this.pos.clone(), 'detective_bow', 1);
      // 从掉落列表中移除弓（防止重复）
      this.equipped.weapon = null;
      for (let i = 0; i < this.hotbar.length; i++) {
        if (this.hotbar[i]?.key === 'detective_bow') this.hotbar[i] = null;
      }
      window.game?.showMessage?.('侦探阵亡，弓掉落在地！', '#ff4444');
    }
    if (window.game?.isSecretKiller) {
      this.pendingElimination = true; // 密室杀手没有重生
      this.respawnTimer = 999999;
      window.game?.checkSecretKillerWin?.();
    }

    if (isVoidDeath) {
      // 虚空死亡：清空所有装备和物品
      this.hotbar = Array(8).fill(null);
      this.backpack = Array(20).fill(null);
      this.equipped = { weapon: null, armor: null };
      this.arrowCount = 0;
      this.armor = 0;
      this.armorMax = 0;
      this.armorProtectRate = 0;
      this.armorReflectChance = 0;
      this.armorReflectRate = 0;
      this.armorInfo = null;
      this.inv = { copper: 0, silver: 0, gold: 0, jade: 0 };
      this.updateWeaponMesh();
    } else {
      // 收集所有物品和货币
      const allItems = [];
      for (let i = 0; i < this.hotbar.length; i++) {
        if (this.hotbar[i]) {
          allItems.push({ key: this.hotbar[i].key, count: this.hotbar[i].count });
          this.hotbar[i] = null;
        }
      }
      for (let i = 0; i < this.backpack.length; i++) {
        if (this.backpack[i]) {
          allItems.push({ key: this.backpack[i].key, count: this.backpack[i].count });
          this.backpack[i] = null;
        }
      }
      // 装备也掉落
      if (this.equipped.weapon) {
        allItems.push({ key: this.equipped.weapon, count: 1 });
        this.equipped.weapon = null;
      }
      if (this.equipped.armor) {
        allItems.push({ key: this.equipped.armor, count: 1 });
        this.equipped.armor = null;
        this.armor = 0;
        this.armorMax = 0;
        this.armorProtectRate = 0;
        this.armorReflectChance = 0;
        this.armorReflectRate = 0;
        this.armorInfo = null;
      }
      // 箭矢也掉落
      if (this.arrowCount > 0) {
        allItems.push({ key: 'arrow', count: this.arrowCount });
        this.arrowCount = 0;
      }
      this.updateWeaponMesh();

      // 货币掉落
      const currencies = { ...this.inv };
      this.inv = { copper: 0, silver: 0, gold: 0, jade: 0 };

      // 创建死亡盒子
      if (allItems.length > 0 || Object.values(currencies).some(v => v > 0)) {
        const boxPos = this.pos.clone();
        boxPos.y = Math.max(0.5, boxPos.y);
        this.engine.createDeathBox(boxPos, this.name, this.teamInfo.color, allItems, currencies);
      }
    }

    if (killer) {
      killer.matchStats.kills++;
      // 反作弊：AI击杀不计排位段位，AI被杀时击杀者经验减半
      if (!killer.isAI) {
        const xpAmount = this.isAI ? GROWTH_CONFIG.xp.kill * AI_CONFIG.XP_REDUCTION : GROWTH_CONFIG.xp.kill;
        window.game?.growth?.addXp?.(killer, xpAmount, '击杀');
      }
      if (killer.killHeal) killer.hp = Math.min(killer.maxHp, killer.hp + killer.killHeal);
      if (killer.killResetSkill) killer.skillCd = 0;
      if (killer.killSkillCdReduce) killer.skillCd = Math.max(0, killer.skillCd - killer.killSkillCdReduce);
      if (killer.killArrowRefund) killer.arrowCount += killer.killArrowRefund;
    }
    window.game?.onPlayerKilled(this, killer);
  }

  respawn() {
    const canRespawn = this.teamInfo.bedAlive;
    if (!canRespawn) {
      this.pendingElimination = true;
      this.respawnTimer = 999999;
      window.game?.checkWinCondition();
      return;
    }
    this.isDead = false;
    this.pendingElimination = false;
    this.hp = this.maxHp;
    if (this.placePreviewMesh) {
      this.engine._disposeMesh(this.placePreviewMesh);
      this.placePreviewMesh = null;
    }
    if (this.role === 'WAIWAI') {
      this.maxMiss = 3;
      this.miss = 3;
      this.missRegenTimer = Math.max(5, 30 - (this.missRegenBonus || 0));
      this.missInvulnTimer = 0;
    }
    // 重置所有临时状态
    this.healAction = null;
    this.camouflageTimer = 0;
    this.missileControl = null;
    this.skillActive = 0;
    this.fatTimer = 0;
    this.hurricaneDamageTimer = 0;
    this.slowTimer = 0;
    this.frostTimer = 0;
    this.rootTimer = 0;
    this.revealedTimer = 0;
    this.smokeBlindTimer = 0;
    this.smokeInvisibleTimer = 0;
    this.extraShield = 0;
    this.hasRevivalToken = false;
    this.speedPotionTimer = 0;
    this.burstPotionTimer = 0;
    this.socialShield = 0;
    this.detectorEnemyCount = 0;
    this.jetpackTimer = 0;
    this._frostZoneTime = null;
    this.invulnTimer = GAME_RULES.respawnInvulnTime;
    this.mesh.visible = true;
    if (this.mesh.material) {
      this.mesh.material.transparent = false;
      this.mesh.material.opacity = 1;
      this.mesh.material.wireframe = false;
      if (this.mesh.material.emissive) this.mesh.material.emissive.setHex(0x000000);
    }
    this.pos.copy(this.findSafeRespawnPosition());
    this.vel.set(0, 0, 0);
    this.mesh.position.copy(this.pos);
  }

  findSafeRespawnPosition() {
    const base = this.teamInfo.bedPos?.clone?.() || this.teamInfo.spawn.clone();
    const candidates = [];
    for (let r = 1; r <= 8; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
          candidates.push(new THREE.Vector3(base.x + dx, base.y + 1, base.z + dz));
        }
      }
    }
    candidates.unshift(this.teamInfo.spawn.clone());
    for (const c of candidates) {
      const ground = this.getGroundHeight(c.x, c.z);
      if (ground < -10) continue;
      const pos = new THREE.Vector3(c.x, Math.max(ground + this.radius + 0.05, 0.8), c.z);
      const feet = this.engine.getBlockKey(Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
      const head = this.engine.getBlockKey(Math.floor(pos.x), Math.floor(pos.y + 1), Math.floor(pos.z));
      const below = this.engine.getBlockKey(Math.floor(pos.x), Math.floor(pos.y - this.radius - 0.1), Math.floor(pos.z));
      if (!this.engine.blocks.has(below)) continue;
      if (!this.engine.blocks.has(feet) && !this.engine.blocks.has(head)) return pos;
    }
    const spawnGround = this.getGroundHeight(this.teamInfo.spawn.x, this.teamInfo.spawn.z);
    if (spawnGround > -10) return new THREE.Vector3(this.teamInfo.spawn.x, spawnGround + this.radius + 0.05, this.teamInfo.spawn.z);
    return this.teamInfo.spawn.clone().add(new THREE.Vector3(0, 6, 0));
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
      this.armorInfo = key;
      this.armor = item.armor;
      this.armorMax = item.armor;
      this.armorProtectRate = item.protectRate || 0;
      this.armorReflectChance = item.reflectChance || 0;
      this.armorReflectRate = item.reflectRate || 0;
    }
  }

  updateWeaponMesh() {
    if (this.weaponMesh) {
      if (this.weaponMesh.geometry) this.weaponMesh.geometry.dispose();
      if (this.weaponMesh.material) this.weaponMesh.material.dispose();
      this.mesh.remove(this.weaponMesh);
      this.weaponMesh = null;
    }
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
    try {
      const equipped = JSON.parse(localStorage.getItem('bedwars_season_pass') || '{}')?.equippedCosmetics || {};
      const weaponSkin = equipped['武器皮肤'];
      if (weaponSkin === 'abyss_blade' || weaponSkin === 'abyss_bow' || weaponSkin === 'abyss_hammer') color = 0x7b2cff;
      if (weaponSkin === 'compass_sword') color = 0xffdd00;
    } catch (e) {}
    const mat = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: color === 0x7b2cff ? 0.28 : 0.08 });
    this.weaponMesh = new THREE.Mesh(geo, mat);
    this.weaponMesh.position.set(0.4, 0.3, 0.3);
    this.mesh.add(this.weaponMesh);
  }
}

// ============================================
// 简易地图编辑器（乐园系统）
// ============================================

class MapEditor {
  constructor(engine) {
    this.engine = engine;
    this.active = false;
    this.tool = 'place'; // 'place' | 'erase' | 'spawn' | 'bed' | 'generator'
    this.selectedBlock = 'wood_plank';
    this.flying = true;
    this.flySpeed = 15;
    this.markers = []; // { type, pos, team }
    this.undoStack = [];
    this.redoStack = [];
  }

  activate() {
    this.active = true;
    this.engine.renderer.domElement.style.cursor = 'crosshair';
    this.flying = true;
  }

  deactivate() {
    this.active = false;
    this.engine.renderer.domElement.style.cursor = 'default';
    this.flying = false;
  }

  update(dt, input) {
    if (!this.active || !this.flying) return;
    const cam = this.engine.camera;
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    let move = new THREE.Vector3();
    if (input.keys.w || input.keys.arrowup) move.add(dir);
    if (input.keys.s || input.keys.arrowdown) move.sub(dir);
    if (input.keys.a || input.keys.arrowleft) move.sub(right);
    if (input.keys.d || input.keys.arrowright) move.add(right);
    if (input.keys.q || input.keys.space) move.add(up);
    if (input.keys.e || input.keys.shift) move.sub(up);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(this.flySpeed * dt);
      cam.position.add(move);
    }
  }

  raycastToGround(mx, my) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(
      (mx / window.innerWidth) * 2 - 1,
      -(my / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, this.engine.camera);

    // 先检测现有方块
    const blockMeshes = Array.from(this.engine.blocks.values()).map(b => b.mesh);
    const hitBlocks = raycaster.intersectObjects(blockMeshes);
    if (hitBlocks.length > 0) {
      const hit = hitBlocks[0];
      const normal = hit.face.normal;
      const pos = hit.point.clone().add(normal.multiplyScalar(0.5));
      return { x: Math.floor(pos.x), y: Math.floor(pos.y), z: Math.floor(pos.z), hit: true };
    }

    // 检测地面平面 y=0
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);
    if (target) {
      return { x: Math.floor(target.x), y: 0, z: Math.floor(target.z), hit: true };
    }
    return null;
  }

  onClick(mx, my, isRight = false) {
    if (!this.active) return;
    const rc = this.raycastToGround(mx, my);
    if (!rc) return;

    if (this.tool === 'place' && !isRight) {
      this.placeBlock(rc.x, rc.y, rc.z, this.selectedBlock);
    } else if (this.tool === 'erase' || (this.tool === 'place' && isRight)) {
      this.removeBlock(rc.x, rc.y, rc.z);
    } else if (this.tool === 'spawn') {
      this.addMarker('spawn', new THREE.Vector3(rc.x + 0.5, rc.y + 1, rc.z + 0.5), 'RED');
    } else if (this.tool === 'bed') {
      this.addMarker('bed', new THREE.Vector3(rc.x + 0.5, rc.y + 0.5, rc.z + 0.5), 'RED');
    } else if (this.tool === 'generator') {
      this.addMarker('generator', new THREE.Vector3(rc.x + 0.5, rc.y + 1, rc.z + 0.5), 'COPPER');
    }
  }

  placeBlock(x, y, z, type) {
    const key = this.engine.getBlockKey(x, y, z);
    if (this.engine.blocks.has(key)) return;
    this.undoStack.push({ action: 'place', x, y, z, type });
    this.redoStack = [];
    // 使用 engine 的 placeBlock 逻辑
    this.engine.placeBlock(x, y, z, type);
  }

  removeBlock(x, y, z) {
    const key = this.engine.getBlockKey(x, y, z);
    const blk = this.engine.blocks.get(key);
    if (!blk) return;
    this.undoStack.push({ action: 'remove', x, y, z, type: blk.type });
    this.redoStack = [];
    this.engine.removeBlock(x, y, z);
  }

  addMarker(type, pos, subtype) {
    const marker = { type, pos: pos.clone(), subtype, id: Date.now() + Math.random() };
    this.markers.push(marker);
    this.showMarkerVisual(marker);
  }

  showMarkerVisual(marker) {
    const colorMap = { spawn: 0x00ff00, bed: 0xff5555, generator: 0xffd700 };
    const geo = new THREE.SphereGeometry(0.3, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: colorMap[marker.type] || 0xffffff });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(marker.pos);
    this.engine.scene.add(mesh);
    marker.mesh = mesh;
  }

  clearMarkers() {
    for (const m of this.markers) {
      if (m.mesh) this.engine._disposeMesh(m.mesh);
    }
    this.markers = [];
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const last = this.undoStack.pop();
    if (last.action === 'place') {
      this.engine.removeBlock(last.x, last.y, last.z);
    } else if (last.action === 'remove') {
      this.engine.placeBlock(last.x, last.y, last.z, last.type);
    }
    this.redoStack.push(last);
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const last = this.redoStack.pop();
    if (last.action === 'place') {
      this.engine.placeBlock(last.x, last.y, last.z, last.type);
    } else if (last.action === 'remove') {
      this.engine.removeBlock(last.x, last.y, last.z);
    }
    this.undoStack.push(last);
  }

  exportMap() {
    const blocks = [];
    for (const [key, blk] of this.engine.blocks) {
      blocks.push({ key, type: blk.type, x: blk.mesh.position.x, y: blk.mesh.position.y, z: blk.mesh.position.z });
    }
    return {
      version: 1,
      name: '未命名地图',
      blocks: blocks.map(b => ({ x: Math.round(b.x), y: Math.round(b.y), z: Math.round(b.z), type: b.type })),
      markers: this.markers.map(m => ({ type: m.type, x: m.pos.x, y: m.pos.y, z: m.pos.z, subtype: m.subtype })),
      timestamp: Date.now()
    };
  }

  importMap(data) {
    if (!data || !Array.isArray(data.blocks)) return;
    this.undoStack = [];
    this.redoStack = [];
    // 清除现有方块
    for (const [key, blk] of this.engine.blocks) {
      this.engine._disposeMesh(blk.mesh);
    }
    this.engine.blocks.clear();
    this.clearMarkers();
    // 放置导入的方块（过滤无效数据）
    for (const b of data.blocks) {
      if (typeof b.x !== 'number' || typeof b.y !== 'number' || typeof b.z !== 'number') continue;
      if (!b.type || typeof b.type !== 'string') continue;
      this.engine.placeBlock(b.x, b.y, b.z, b.type);
    }
    // 恢复标记
    for (const m of data.markers || []) {
      if (!m.type || typeof m.x !== 'number') continue;
      this.addMarker(m.type, new THREE.Vector3(m.x, m.y, m.z), m.subtype);
    }
  }
}
