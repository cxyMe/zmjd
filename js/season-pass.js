// ============================================
// 赛季手册系统：奖励、任务、赛季券、支付申请
// ============================================

const SEASON_PASS_CONFIG = {
  seasonId: 'dream_expedition_s1',
  title: '梦域远征',
  duration: '3个月',
  maxLevel: 100,
  xpPerLevel: 1000,
  overflowEvery: 10,
  weeklyMatchXpSoftCap: 10000,
  tiers: {
    free: { name: '免费版', price: 0, boost: 0 },
    advanced: { name: '进阶版', price: 24, boost: 0 },
    premium: { name: '典藏版', price: 48, boost: 25 }
  }
};

const PASS_KEY_REWARDS = {
  1:  { free: '50赛季券', paid: '[皮肤] 暗影刺客·初阶 + 专属入场姿势' },
  10: { free: '[表情] 干得漂亮', paid: '[搭路特效] 星光拖尾（蓝色）' },
  25: { free: '[单日] 双倍熟练度卡', paid: '200赛季券' },
  40: { free: '[消耗品] 钩爪枪 x2', paid: '[击杀播报] 虚空吞噬者（全屏特效）' },
  55: { free: '100赛季券', paid: '[床皮肤] 极地冰棺（寒气特效）' },
  70: { free: '[头像框] 青铜筑梦师', paid: '[武器皮肤] 冰霜法杖·星辉（弹道变色）' },
  85: { free: '150赛季券', paid: '[表情动作] 嘲讽·虚空舞步' },
  100:{ free: '300赛季券', paid: '[传说皮肤] 虚空霸主·全队套装 + 出生黑雾特效' }
};

const PASS_DAILY_TASKS = [
  { id: 'daily_play', name: '参与1局对局', target: 1, xp: 120, coupons: 10 },
  { id: 'daily_resource', name: '收集50个资源', target: 50, xp: 120, coupons: 10 },
  { id: 'daily_blocks', name: '放置20个方块', target: 20, xp: 120, coupons: 10 }
];

const PASS_WEEKLY_TASKS = [
  { id: 'weekly_team_damage', name: '全队累计造成5000伤害', target: 5000, xp: 1200, coupons: 80, team: true },
  { id: 'weekly_team_beds', name: '全队累计拆掉2张床', target: 2, xp: 1200, coupons: 80, team: true },
  { id: 'weekly_team_silver', name: '全队累计收集500银币', target: 500, xp: 1200, coupons: 80, team: true },
  { id: 'weekly_defense', name: '全队触发10次防守击退/陷阱', target: 10, xp: 1000, coupons: 60, team: true },
  { id: 'weekly_win', name: '小队胜利3局', target: 3, xp: 1000, coupons: 60, team: true }
];

const PASS_SEASON_CHALLENGES = [
  { id: 'season_bed_50', name: '整个赛季累计拆床50次', reward: '称号：拆床狂魔' },
  { id: 'season_assassin_win', name: '使用刺客角色获胜30局', reward: '头像框：暗影之证' },
  { id: 'season_builder', name: '累计放置5000个方块', reward: '称号：筑城者' },
  { id: 'season_team', name: '三人组队完成30个周常目标', reward: '头像框：三人成梦' }
];

const PASS_COSMETICS = [
  { id: 'void_team_set', type: '角色皮肤', rarity: '传说', name: '虚空霸主·全队套装', price: 0, source: '手册100级', desc: '战士虚空壁垒、刺客虚空之刃、射手虚空颂者统一暗金风格，出生黑雾特效。', previewClass: 'skin-void-overlord' },
  { id: 'void_warrior', type: '角色皮肤', rarity: '传说', name: '虚空壁垒', price: 0, source: '套装部件', desc: '暗金重甲，肩甲喷发紫色粒子，待机锤击地面产生紫光冲击波。', previewClass: 'skin-void-overlord' },
  { id: 'void_assassin', type: '角色皮肤', rarity: '传说', name: '虚空之刃', price: 0, source: '套装部件', desc: '半透明身体、移动残影、双匕紫色电弧，蹲下融入阴影。', previewClass: 'skin-void-overlord' },
  { id: 'void_chanter', type: '角色皮肤', rarity: '传说', name: '虚空颂者', price: 0, source: '套装部件', desc: '法杖悬浮紫色核心，三颗暗能量球环绕，施法留下紫色光轨。', previewClass: 'skin-void-overlord' },
  { id: 'abyss_blade', type: '武器皮肤', rarity: '史诗', name: '深渊之锋', price: 680, desc: '剑身刻有深渊铭文，挥砍时留下紫色弧光。', previewClass: 'skin-abyss' },
  { id: 'abyss_bow', type: '武器皮肤', rarity: '史诗', name: '深渊之弓', price: 680, desc: '紫色骨骼弓臂，箭矢拖出暗影轨迹。', previewClass: 'skin-abyss' },
  { id: 'abyss_hammer', type: '武器皮肤', rarity: '史诗', name: '深渊之锤', price: 680, desc: '锤头为虚空巨兽头颅，蓄力时双眼发光。', previewClass: 'skin-abyss' },
  { id: 'compass_sword', type: '武器皮肤', rarity: '稀有', name: '圆规', price: 100, desc: '文具圆规造型，击杀目标时旋转画出金色圆环。', previewClass: 'skin-compass' },
  { id: 'void_miner_uniform', type: '角色皮肤', rarity: '稀有', name: '虚空矿工制服', price: 1000, desc: '橙色工装与头灯，移动时掉落紫色矿尘。', previewClass: 'skin-miner' },
  { id: 'miner_bridge_fx', type: '搭路特效', rarity: '稀有', name: '虚空矿石粒子', price: 380, desc: '放置方块时冒出紫色矿石粒子。', previewClass: 'skin-miner' },
  { id: 'flower_bridge_fx', type: '搭路特效', rarity: '稀有', name: '步步生花', price: 520, desc: '搭路时脚下绽放花瓣光点，3局体验卡/永久均支持。', previewClass: 'skin-flower' },
  { id: 'starlight_bridge_fx', type: '搭路特效', rarity: '史诗', name: '星光拖尾', price: 880, desc: '脚下生成蓝色星河拖尾，是每局曝光率最高的特效。', previewClass: 'skin-starlight' },
  { id: 'frost_path_fx', type: '搭路特效', rarity: '史诗', name: '冰霜路径', price: 880, desc: '方块落地后结霜，边缘散出寒气。', previewClass: 'skin-frost' },
  { id: 'dragon_bed', type: '床皮肤', rarity: '史诗', name: '龙巢之床', price: 760, desc: '床周围盘踞小型龙骨，敌人拆床时触发龙息光效。', previewClass: 'skin-dragon' },
  { id: 'space_capsule_bed', type: '床皮肤', rarity: '史诗', name: '太空舱床', price: 760, desc: '银白太空舱外观，拆毁时弹出失重星尘。', previewClass: 'skin-space' },
  { id: 'candy_house_bed', type: '床皮肤', rarity: '稀有', name: '糖果屋床', price: 420, desc: '童话糖果屋外观，拆毁时爆出彩糖粒子。', previewClass: 'skin-candy' },
  { id: 'void_kill_banner', type: '击杀播报', rarity: '史诗', name: '虚空吞噬者', price: 900, desc: '击杀敌人时全屏闪金光并出现虚空裂缝播报。', previewClass: 'skin-void-overlord' },
  { id: 'void_dance', type: '表情动作', rarity: '史诗', name: '嘲讽·虚空舞步', price: 520, desc: '击杀后可释放紫色舞步残影，拉满仇恨值。', previewClass: 'skin-void-overlord' },
  { id: 'nice_emote', type: '表情', rarity: '普通', name: '干得漂亮', price: 80, desc: '基础文字表情，适合队友配合后快速发送。', previewClass: 'skin-basic' },
  { id: 'metal_red', type: '角色换色', rarity: '普通', name: '赤焰基础换色', price: 120, desc: '红黑金属质感换色，无属性加成。', previewClass: 'skin-red' },
  { id: 'metal_blue', type: '角色换色', rarity: '普通', name: '湛蓝基础换色', price: 120, desc: '蓝白金属质感换色，无属性加成。', previewClass: 'skin-blue' },
  { id: 'metal_green', type: '角色换色', rarity: '普通', name: '翠绿基础换色', price: 120, desc: '绿色机能风换色，无属性加成。', previewClass: 'skin-green' }
];

const GACHA_POOL = [
  { id: 'miner_fragment', name: '虚空矿工碎片', rarity: '稀有碎片', weight: 26, fragmentOf: 'void_miner_uniform' },
  { id: 'abyss_fragment', name: '深渊守卫者碎片', rarity: '史诗碎片', weight: 8, fragmentOf: 'abyss_blade' },
  { id: 'double_xp_card', name: '单日双倍经验卡', rarity: '消耗品', weight: 30 },
  { id: 'limited_emote_laugh', name: '限定表情：偷笑', rarity: '普通', weight: 20, cosmeticId: 'nice_emote' },
  { id: 'bridge_trial_starlight', name: '星光拖尾体验卡3局', rarity: '稀有', weight: 14, trialOf: 'starlight_bridge_fx' },
  { id: 'rare_guarantee_skin', name: '未拥有稀有外观', rarity: '保底', weight: 2, cosmeticId: 'compass_sword' }
];

class SeasonPassSystem {
  constructor() {
    this.panel = document.getElementById('seasonPassPanel');
    this.body = document.getElementById('seasonPassBody');
    this.tab = 'rewards';
    this.buyTier = 'advanced';
    this.state = this.loadState();
    this.bind();
    this.updateCrystal();
    setTimeout(() => this.applyLobbyPreview(), 0);
  }

  loadState() {
    const base = {
      xp: 0,
      coupons: 0,
      tier: 'free',
      claimedFree: [],
      claimedPaid: [],
      taskProgress: {},
      pendingOrders: [],
      cosmetics: [],
      ownedCosmetics: [],
      equippedCosmetics: {},
      fragments: {},
      gachaPity: 0,
      predictionWins: 0,
      weeklyMatchXp: 0,
      lastLogin: Date.now()
    };
    const state = { ...base, ...JSON.parse(localStorage.getItem('bedwars_season_pass') || '{}') };
    if (!Array.isArray(state.ownedCosmetics)) state.ownedCosmetics = state.cosmetics || [];
    return state;
  }

  saveState() {
    localStorage.setItem('bedwars_season_pass', JSON.stringify(this.state));
    this.updateCrystal();
  }

  bind() {
    document.getElementById('seasonPassBtn')?.addEventListener('click', () => this.open('rewards'));
    document.getElementById('passCloseBtn')?.addEventListener('click', () => this.close());
    document.getElementById('claimAllPassBtn')?.addEventListener('click', () => this.claimAll());
    document.getElementById('sponsorDevBtn')?.addEventListener('click', () => this.openPay('advanced'));
    document.getElementById('upgradePassBtn')?.addEventListener('click', () => this.openPay('premium'));
    document.getElementById('passPayCloseBtn')?.addEventListener('click', () => this.closePay());
    document.getElementById('paidConfirmBtn')?.addEventListener('click', () => this.submitPaidOrder());
    document.querySelectorAll('[data-buy-pass]').forEach(btn => {
      btn.addEventListener('click', () => this.openPay(btn.dataset.buyPass));
    });
    document.querySelectorAll('[data-pass-tab]').forEach(btn => {
      btn.addEventListener('click', () => this.open(btn.dataset.passTab));
    });
  }

  level() {
    return Math.min(SEASON_PASS_CONFIG.maxLevel, Math.floor(this.state.xp / SEASON_PASS_CONFIG.xpPerLevel) + 1);
  }

  levelProgress() {
    return this.state.xp % SEASON_PASS_CONFIG.xpPerLevel;
  }

  hasPaid() {
    return this.state.tier === 'advanced' || this.state.tier === 'premium';
  }

  requireLogin(action = '领取奖励') {
    if (window.lobbyAuth?.user) return true;
    alert(`请先登录，未登录无法${action}。`);
    return false;
  }

  open(tab = this.tab) {
    this.tab = tab;
    if (this.panel) this.panel.style.display = 'flex';
    document.querySelectorAll('[data-pass-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.passTab === tab));
    this.render();
  }

  close() {
    if (this.panel) this.panel.style.display = 'none';
  }

  openSkinShop() {
    const panel = document.getElementById('skinShopPanel');
    const body = document.getElementById('skinShopBody');
    const couponText = document.getElementById('skinShopCouponText');
    if (couponText) couponText.textContent = this.state.coupons;
    if (panel) panel.style.display = 'flex';
    if (!body) return;
    const owned = new Set(this.state.ownedCosmetics || []);
    body.innerHTML = `
      <div class="pass-note">赛季券主要用于外观个性化：角色、武器、搭路、床、击杀播报和表情均不提供数值属性。</div>
      <div class="cosmetic-layout">
        <div class="cosmetic-preview">
          <div class="preview-character ${this.currentPreviewClass()}" id="skinShopPreviewHero">
            <div class="preview-glow"></div><div class="preview-head"></div><div class="preview-body"></div>
            <div class="preview-arm left"></div><div class="preview-arm right"></div><div class="preview-leg left"></div><div class="preview-leg right"></div><div class="preview-weapon"></div>
          </div>
          <h3>当前预览</h3>
          <p id="skinShopPreviewText">点击任意外观可试穿；购买后可装备到大厅和对局展示。</p>
        </div>
        <div class="cosmetic-shop-grid">
          ${PASS_COSMETICS.map(item => {
            const has = owned.has(item.id) || item.price === 0 && this.canUnlockFreeCosmetic(item);
            const equipped = this.state.equippedCosmetics?.[item.type] === item.id;
            return `<div class="cosmetic-card ${item.rarity}" data-preview-cosmetic="${item.id}">
              <div class="cosmetic-rarity">${item.rarity}</div>
              <h4>${item.name}</h4>
              <p>${item.type}｜${item.desc}</p>
              <div class="cosmetic-price">${item.price ? item.price + '赛季券' : item.source || '手册解锁'}</div>
              <button data-buy-cosmetic="${item.id}" ${has ? 'disabled' : ''}>${has ? '已拥有' : '购买'}</button>
              <button data-equip-cosmetic="${item.id}" ${has ? '' : 'disabled'}>${equipped ? '已装备' : '装备'}</button>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    body.querySelectorAll('[data-preview-cosmetic]').forEach(card => {
      card.onclick = (e) => {
        if (e.target.tagName === 'BUTTON') return;
        this.previewCosmeticInShop(card.dataset.previewCosmetic);
      };
    });
    body.querySelectorAll('[data-buy-cosmetic]').forEach(btn => btn.onclick = () => this.buyCosmetic(btn.dataset.buyCosmetic));
    body.querySelectorAll('[data-equip-cosmetic]').forEach(btn => btn.onclick = () => this.equipCosmetic(btn.dataset.equipCosmetic));
  }

  previewCosmeticInShop(id) {
    const item = PASS_COSMETICS.find(x => x.id === id);
    if (!item) return;
    const hero = document.getElementById('skinShopPreviewHero');
    const text = document.getElementById('skinShopPreviewText');
    if (hero) hero.className = `preview-character ${item.previewClass}`;
    if (text) text.textContent = `${item.name}：${item.desc}`;
    this.applyLobbyPreview(item.previewClass);
  }

  render() {
    const lv = this.level();
    document.getElementById('passLevelText').textContent = `Lv.${lv}`;
    document.getElementById('passXpText').textContent = `${this.levelProgress()} / ${SEASON_PASS_CONFIG.xpPerLevel} EXP`;
    document.getElementById('passXpFill').style.width = `${(this.levelProgress() / SEASON_PASS_CONFIG.xpPerLevel) * 100}%`;
    document.getElementById('seasonCouponText').textContent = this.state.coupons;
    document.getElementById('passTierText').textContent = SEASON_PASS_CONFIG.tiers[this.state.tier]?.name || '免费版';
    if (this.tab === 'rewards') this.renderRewards();
    if (this.tab === 'tasks') this.renderTasks();
  }

  rewardFor(level, track) {
    if (PASS_KEY_REWARDS[level]) return PASS_KEY_REWARDS[level][track];
    if (track === 'free') {
      if (level % 5 === 0) return '20赛季券';
      if (level % 3 === 0) return '[消耗品] 经验碎片';
      return '10赛季券';
    }
    if (level % 10 === 0) return '120赛季券';
    if (level % 4 === 0) return '[外观碎片] 梦晶';
    return '30赛季券';
  }

  renderRewards() {
    const lv = this.level();
    const levels = Array.from({ length: 100 }, (_, i) => i + 1);
    this.body.innerHTML = `
      <div class="pass-note">拖动奖励轨道查看100级配置。满级后每溢出10级发放1个“筑梦宝箱”。</div>
      <div class="pass-track-wrap">
        ${levels.map(level => {
          const freeClaimed = this.state.claimedFree.includes(level);
          const paidClaimed = this.state.claimedPaid.includes(level);
          return `<div class="pass-level-node ${lv >= level ? 'unlocked' : ''}">
            <div class="pass-node-level">Lv.${level}</div>
            <div class="pass-reward free ${freeClaimed ? 'claimed' : ''}">
              <b>免费</b><span>${this.rewardFor(level, 'free')}</span>
            </div>
            <div class="pass-reward paid ${paidClaimed ? 'claimed' : ''}" data-preview-level="${level}">
              <b>进阶</b><span>${this.rewardFor(level, 'paid')}</span>
            </div>
          </div>`;
        }).join('')}
      </div>`;
    this.body.querySelectorAll('[data-preview-level]').forEach(el => {
      el.onclick = () => this.previewReward(parseInt(el.dataset.previewLevel, 10));
    });
  }

  renderCosmetics() {
    const owned = new Set(this.state.ownedCosmetics || []);
    this.body.innerHTML = `
      <div class="pass-note">赛季券主要用于外观个性化：角色、武器、搭路、床、击杀播报和表情均不提供数值属性。</div>
      <div class="cosmetic-layout">
        <div class="cosmetic-preview">
          <div class="preview-character ${this.currentPreviewClass()}" id="cosmeticPreviewHero">
            <div class="preview-glow"></div><div class="preview-head"></div><div class="preview-body"></div>
            <div class="preview-arm left"></div><div class="preview-arm right"></div><div class="preview-leg left"></div><div class="preview-leg right"></div><div class="preview-weapon"></div>
          </div>
          <h3>当前预览</h3>
          <p id="cosmeticPreviewText">点击任意外观可试穿；购买后可装备到大厅和对局展示。</p>
        </div>
        <div class="cosmetic-shop-grid">
          ${PASS_COSMETICS.map(item => {
            const has = owned.has(item.id) || item.price === 0 && this.canUnlockFreeCosmetic(item);
            const equipped = this.state.equippedCosmetics?.[item.type] === item.id;
            return `<div class="cosmetic-card ${item.rarity}" data-preview-cosmetic="${item.id}">
              <div class="cosmetic-rarity">${item.rarity}</div>
              <h4>${item.name}</h4>
              <p>${item.type}｜${item.desc}</p>
              <div class="cosmetic-price">${item.price ? item.price + '赛季券' : item.source || '手册解锁'}</div>
              <button data-buy-cosmetic="${item.id}" ${has ? 'disabled' : ''}>${has ? '已拥有' : '购买'}</button>
              <button data-equip-cosmetic="${item.id}" ${has ? '' : 'disabled'}>${equipped ? '已装备' : '装备'}</button>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    this.body.querySelectorAll('[data-preview-cosmetic]').forEach(card => {
      card.onclick = (e) => {
        if (e.target.tagName === 'BUTTON') return;
        this.previewCosmetic(card.dataset.previewCosmetic);
      };
    });
    this.body.querySelectorAll('[data-buy-cosmetic]').forEach(btn => btn.onclick = () => this.buyCosmetic(btn.dataset.buyCosmetic));
    this.body.querySelectorAll('[data-equip-cosmetic]').forEach(btn => btn.onclick = () => this.equipCosmetic(btn.dataset.equipCosmetic));
  }

  renderGacha() {
    this.body.innerHTML = `
      <div class="gacha-panel">
        <div class="gacha-machine">
          <div class="gacha-orb"></div>
          <h3>筑梦扭蛋机</h3>
          <p>每抽消耗50赛季券。30抽必出未拥有稀有品质道具。概率公开：稀有碎片26%，史诗碎片8%，消耗品30%，限定表情20%，体验卡14%，隐藏保底2%。</p>
          <div class="growth-summary">
            <span class="growth-pill">当前赛季券：${this.state.coupons}</span>
            <span class="growth-pill">保底进度：${this.state.gachaPity || 0}/30</span>
          </div>
          <button class="pass-gold" id="gachaOnceBtn">抽取一次（50券）</button>
          <button class="pass-primary" id="gachaTenBtn">十连抽（500券）</button>
        </div>
        <div class="gacha-fragments">
          <h3>碎片合成</h3>
          ${['void_miner_uniform','abyss_blade'].map(id => {
            const item = PASS_COSMETICS.find(x => x.id === id);
            const count = this.state.fragments?.[id] || 0;
            return `<div class="fragment-row"><span>${item.name}</span><b>${count}/10</b><button data-craft="${id}" ${count >= 10 ? '' : 'disabled'}>合成</button></div>`;
          }).join('')}
          <div id="gachaResult" class="gacha-result">等待抽取结果。</div>
        </div>
      </div>`;
    document.getElementById('gachaOnceBtn').onclick = () => this.rollGacha(1);
    document.getElementById('gachaTenBtn').onclick = () => this.rollGacha(10);
    this.body.querySelectorAll('[data-craft]').forEach(btn => btn.onclick = () => this.craftFragment(btn.dataset.craft));
  }

  renderPredict() {
    this.body.innerHTML = `
      <div class="growth-grid">
        <div class="season-card"><h4>战局预测币</h4><p>观战好友对局时可用少量赛季券预测“哪队先拆床”。猜对返还双倍，单次返还上限1000赛季券。</p></div>
        <div class="season-card"><h4>娱乐限制</h4><p>纯社区娱乐，不涉及现金提现，不影响战斗数值。</p></div>
      </div>
      <div class="predict-box">
        <input id="predictStake" type="number" min="10" max="500" value="50">
        <select id="predictTeam">
          <option value="RED">红队先拆床</option><option value="BLUE">蓝队先拆床</option>
          <option value="GREEN">绿队先拆床</option><option value="YELLOW">黄队先拆床</option>
        </select>
        <button class="pass-gold" id="predictBtn">消耗赛季券预测</button>
        <p>已猜中次数：${this.state.predictionWins || 0}</p>
      </div>`;
    document.getElementById('predictBtn').onclick = () => this.makePrediction();
  }

  renderTasks() {
    const progress = this.state.taskProgress || {};
    const card = (t, type) => {
      const v = Math.min(t.target, progress[t.id] || 0);
      const pct = Math.floor((v / t.target) * 100);
      return `<div class="task-card pass-task">
        <div class="task-head"><b>${type}｜${t.name}</b><span>${v}/${t.target}</span></div>
        <div class="task-track"><div style="width:${pct}%"></div></div>
        <p>奖励：${t.xp || '限定外观'}经验 + ${t.coupons || 0}赛季券 ${t.team ? '｜小队共享' : ''}</p>
      </div>`;
    };
    this.body.innerHTML = `
      <div class="growth-summary">
        <span class="growth-pill">日常：3分钟顺手完成</span>
        <span class="growth-pill">周常：5选3即可拿满</span>
        <span class="growth-pill">挑战：只给称号/头像框</span>
      </div>
      <h3 class="pass-section-title">每日任务</h3>
      <div class="task-list">${PASS_DAILY_TASKS.map(t => card(t, '日常')).join('')}</div>
      <h3 class="pass-section-title">每周任务</h3>
      <div class="task-list">${PASS_WEEKLY_TASKS.map(t => card(t, '周常')).join('')}</div>
      <h3 class="pass-section-title">赛季挑战</h3>
      <div class="growth-grid">${PASS_SEASON_CHALLENGES.map(t => `<div class="season-card"><h4>${t.name}</h4><p>${t.reward}</p></div>`).join('')}</div>`;
  }

  renderTeam() {
    this.body.innerHTML = `
      <div class="growth-grid">
        <div class="season-card"><h4>筑梦羁绊</h4><p>3人组队且三人都开启进阶手册时，全队手册经验 +15%。</p></div>
        <div class="season-card"><h4>共享周常</h4><p>周常以“全队累计拆床、全队累计银币、全队累计伤害”为核心，鼓励好友开黑。</p></div>
        <div class="season-card"><h4>经验构成</h4><p>对局结算60% + 赛季任务30% + 每日首胜10%，避免只刷单一玩法。</p></div>
      </div>`;
  }

  renderRules() {
    this.body.innerHTML = `
      <div class="growth-grid">
        <div class="season-card"><h4>防爆肝</h4><p>每周通过对局结算获得的手册经验软上限为10000，超过后主要依靠任务。</p></div>
        <div class="season-card"><h4>回流补偿</h4><p>连续3天未登录，回归后前5局对局经验翻倍，帮助追赶。</p></div>
        <div class="season-card"><h4>赛季末冲刺</h4><p>最后两周开启双倍经验周末，任务奖励翻倍。</p></div>
        <div class="season-card"><h4>数值边界</h4><p>免费线路赛季券≤1000，付费线路约2400，只给外观与消耗品，杜绝属性售卖。</p></div>
      </div>`;
  }

  claimAll() {
    if (!this.requireLogin('领取奖励')) return;
    const lv = this.level();
    let coupons = 0, count = 0;
    for (let i = 1; i <= lv; i++) {
      if (!this.state.claimedFree.includes(i)) {
        this.state.claimedFree.push(i);
        coupons += this.extractCoupons(this.rewardFor(i, 'free'));
        count++;
      }
      if (this.hasPaid() && !this.state.claimedPaid.includes(i)) {
        this.state.claimedPaid.push(i);
        coupons += this.extractCoupons(this.rewardFor(i, 'paid'));
        const reward = this.rewardFor(i, 'paid');
        if (reward.includes('皮肤') || reward.includes('头像框') || reward.includes('播报') || reward.includes('特效')) this.state.cosmetics.push(reward);
        if (i === 70 && !this.state.ownedCosmetics.includes('frost_path_fx')) this.state.ownedCosmetics.push('frost_path_fx');
        if (i === 100) {
          ['void_team_set','void_warrior','void_assassin','void_chanter'].forEach(id => {
            if (!this.state.ownedCosmetics.includes(id)) this.state.ownedCosmetics.push(id);
          });
        }
        count++;
      }
    }
    this.state.coupons += coupons;
    this.saveState();
    this.render();
    alert(count ? `已领取 ${count} 个奖励，获得 ${coupons} 赛季券。` : '暂无可领取奖励');
  }

  extractCoupons(text) {
    const m = String(text).match(/(\d+)赛季券/);
    return m ? parseInt(m[1], 10) : 0;
  }

  canUnlockFreeCosmetic(item) {
    if (item.id === 'void_team_set') return this.level() >= 100 && this.hasPaid();
    if (item.id === 'void_warrior' || item.id === 'void_assassin' || item.id === 'void_chanter') return this.level() >= 100 && this.hasPaid();
    return false;
  }

  currentPreviewClass() {
    const equipped = Object.values(this.state.equippedCosmetics || {}).find(Boolean);
    return PASS_COSMETICS.find(x => x.id === equipped)?.previewClass || 'skin-basic';
  }

  previewCosmetic(id) {
    const item = PASS_COSMETICS.find(x => x.id === id);
    if (!item) return;
    const hero = document.getElementById('cosmeticPreviewHero');
    const text = document.getElementById('cosmeticPreviewText');
    if (hero) hero.className = `preview-character ${item.previewClass}`;
    if (text) text.textContent = `${item.name}：${item.desc}`;
    this.applyLobbyPreview(item.previewClass);
  }

  buyCosmetic(id) {
    if (!this.requireLogin('购买外观')) return;
    const item = PASS_COSMETICS.find(x => x.id === id);
    if (!item) return;
    if (this.state.ownedCosmetics.includes(id)) return alert('已拥有该外观');
    if (this.state.coupons < item.price) return alert('赛季券不足');
    this.state.coupons -= item.price;
    this.state.ownedCosmetics.push(id);
    this.saveState();
    if (document.getElementById('skinShopPanel')?.style.display === 'flex') this.openSkinShop();
    alert(`已购买：${item.name}`);
  }

  equipCosmetic(id) {
    if (!this.requireLogin('装备外观')) return;
    const item = PASS_COSMETICS.find(x => x.id === id);
    if (!item) return;
    if (!this.state.ownedCosmetics.includes(id) && !this.canUnlockFreeCosmetic(item)) return alert('尚未拥有该外观');
    if (!this.state.ownedCosmetics.includes(id)) this.state.ownedCosmetics.push(id);
    this.state.equippedCosmetics[item.type] = id;
    this.saveState();
    this.applyLobbyPreview(item.previewClass);
    if (document.getElementById('skinShopPanel')?.style.display === 'flex') this.openSkinShop();
    alert(`已装备：${item.name}`);
  }

  applyLobbyPreview(cls = this.currentPreviewClass()) {
    const hero = document.querySelector('.lobby-character');
    if (!hero) return;
    hero.className = `lobby-character ${cls}`;
  }

  rollGacha(times = 1) {
    if (!this.requireLogin('抽取奖励')) return;
    const cost = times * 50;
    if (this.state.coupons < cost) return alert('赛季券不足');
    this.state.coupons -= cost;
    const results = [];
    for (let i = 0; i < times; i++) {
      this.state.gachaPity = (this.state.gachaPity || 0) + 1;
      let reward = this.pickGachaReward();
      if (this.state.gachaPity >= 30) {
        reward = { id: 'rare_guarantee_skin', name: '未拥有稀有外观：圆规', rarity: '保底', cosmeticId: 'compass_sword' };
        this.state.gachaPity = 0;
      }
      this.applyGachaReward(reward);
      results.push(`${reward.rarity}｜${reward.name}`);
    }
    this.saveState();
    this.renderGacha();
    const el = document.getElementById('gachaResult');
    if (el) el.innerHTML = results.map(r => `<div>${r}</div>`).join('');
  }

  pickGachaReward() {
    const total = GACHA_POOL.reduce((s, x) => s + x.weight, 0);
    let roll = Math.random() * total;
    for (const item of GACHA_POOL) {
      roll -= item.weight;
      if (roll <= 0) return { ...item };
    }
    return { ...GACHA_POOL[0] };
  }

  applyGachaReward(reward) {
    if (reward.fragmentOf) {
      this.state.fragments[reward.fragmentOf] = (this.state.fragments[reward.fragmentOf] || 0) + 1;
    }
    if (reward.cosmeticId && !this.state.ownedCosmetics.includes(reward.cosmeticId)) {
      this.state.ownedCosmetics.push(reward.cosmeticId);
    }
    if (reward.trialOf) {
      this.state.fragments[reward.trialOf] = (this.state.fragments[reward.trialOf] || 0) + 3;
    }
  }

  craftFragment(id) {
    if (!this.requireLogin('合成奖励')) return;
    if ((this.state.fragments[id] || 0) < 10) return;
    this.state.fragments[id] -= 10;
    if (!this.state.ownedCosmetics.includes(id)) this.state.ownedCosmetics.push(id);
    this.saveState();
    this.renderGacha();
    alert(`已合成：${PASS_COSMETICS.find(x => x.id === id)?.name || id}`);
  }

  makePrediction() {
    if (!this.requireLogin('参与预测')) return;
    const stake = Math.max(10, Math.min(500, parseInt(document.getElementById('predictStake').value || '50', 10)));
    const team = document.getElementById('predictTeam').value;
    if (this.state.coupons < stake) return alert('赛季券不足');
    this.state.coupons -= stake;
    const win = Math.random() < 0.48;
    if (win) {
      const reward = Math.min(1000, stake * 2);
      this.state.coupons += reward;
      this.state.predictionWins = (this.state.predictionWins || 0) + 1;
      alert(`${team} 预测成功，返还 ${reward} 赛季券！`);
    } else {
      alert('预测失败，赛季券已消耗。');
    }
    this.saveState();
    this.renderPredict();
  }

  previewReward(level) {
    const need = Math.max(0, (level - 1) * SEASON_PASS_CONFIG.xpPerLevel - this.state.xp);
    alert(`试穿预览：${this.rewardFor(level, 'paid')}\n还差 ${need} 经验解锁。`);
  }

  openPay(tier = 'advanced') {
    if (!this.requireLogin('购买通行证')) return;
    this.buyTier = tier;
    const panel = document.getElementById('passPayPanel');
    const img = document.getElementById('payQrImage');
    const fallback = document.getElementById('payQrFallback');
    const album = JSON.parse(localStorage.getItem('bedwars_pay_album') || '[]');
    const qr = album[0]?.url || localStorage.getItem('bedwars_pay_qr') || '';
    if (qr) {
      img.src = qr;
      img.style.display = 'block';
      fallback.style.display = 'none';
    } else {
      img.style.display = 'none';
      fallback.style.display = 'flex';
    }
    panel.style.display = 'flex';
  }

  closePay() {
    document.getElementById('passPayPanel').style.display = 'none';
  }

  async submitPaidOrder() {
    if (!this.requireLogin('提交付费申请')) return;
    const tier = this.buyTier;
    const contact = document.getElementById('payContactInput').value.trim();
    const order = {
      id: 'order_' + Date.now(),
      season_id: SEASON_PASS_CONFIG.seasonId,
      tier,
      price: SEASON_PASS_CONFIG.tiers[tier].price,
      contact,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    this.state.pendingOrders.push(order);
    const adminOrders = JSON.parse(localStorage.getItem('bedwars_pass_admin_orders') || '[]');
    adminOrders.unshift({
      order_id: order.id,
      season_id: order.season_id,
      user_contact: order.contact,
      pass_tier: order.tier,
      amount: order.price,
      status: 'pending',
      created_at: order.created_at
    });
    localStorage.setItem('bedwars_pass_admin_orders', JSON.stringify(adminOrders.slice(0, 100)));
    this.saveState();
    await this.trySubmitOrderToSupabase(order);
    alert('支付审核申请已提交，请等待管理员审核。');
    this.closePay();
  }

  async trySubmitOrderToSupabase(order) {
    try {
      const cfg = window.BEDWARS_CONFIG || window.SUPABASE_CONFIG || {};
      if (!window.supabase || !cfg.supabaseUrl) return;
      const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      await client.from('season_pass_orders').insert({
        order_id: order.id,
        season_id: order.season_id,
        user_contact: order.contact,
        pass_tier: order.tier,
        amount: order.price,
        status: 'pending'
      });
    } catch (e) {
      console.warn('赛季手册订单暂存本地，等待数据库配置', e);
    }
  }

  grantTier(tier) {
    this.state.tier = tier;
    if (tier === 'premium') this.state.xp = Math.max(this.state.xp, 24 * SEASON_PASS_CONFIG.xpPerLevel);
    this.saveState();
    this.render();
  }

  addMatchSettlement(stats = {}, won = false, teamBond = false) {
    const base = 180;
    const performance = (stats.kills || 0) * 60 + (stats.beds || 0) * 160 + Math.floor((stats.blocksPlaced || 0) / 10) * 15 + Math.floor((stats.resourceContribution || 0) / 20) * 10;
    const winBonus = won ? 180 : 0;
    const firstWin = won && localStorage.getItem('bedwars_pass_first_win_' + new Date().toISOString().slice(0, 10)) !== '1';
    let xp = base + performance + winBonus + (firstWin ? 120 : 0);
    if (teamBond) xp = Math.floor(xp * 1.15);
    const canAddByMatch = Math.max(0, SEASON_PASS_CONFIG.weeklyMatchXpSoftCap - (this.state.weeklyMatchXp || 0));
    const finalXp = Math.min(xp, canAddByMatch);
    this.state.xp += finalXp;
    this.state.weeklyMatchXp = (this.state.weeklyMatchXp || 0) + finalXp;
    if (firstWin) localStorage.setItem('bedwars_pass_first_win_' + new Date().toISOString().slice(0, 10), '1');
    const coupons = won ? 12 : 6;
    this.state.coupons += coupons;
    this.saveState();
    return { xp: finalXp, coupons, capped: finalXp < xp };
  }

  updateCrystal() {
    const text = document.getElementById('passCrystalText');
    if (!text) return;
    text.textContent = `Lv.${this.level()} · ${Math.floor((this.levelProgress() / SEASON_PASS_CONFIG.xpPerLevel) * 100)}%`;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.seasonPass = new SeasonPassSystem();
});
