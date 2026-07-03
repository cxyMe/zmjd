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

class SeasonPassSystem {
  constructor() {
    this.panel = document.getElementById('seasonPassPanel');
    this.body = document.getElementById('seasonPassBody');
    this.tab = 'rewards';
    this.buyTier = 'advanced';
    this.state = this.loadState();
    this.bind();
    this.updateCrystal();
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
      weeklyMatchXp: 0,
      lastLogin: Date.now()
    };
    return { ...base, ...JSON.parse(localStorage.getItem('bedwars_season_pass') || '{}') };
  }

  saveState() {
    localStorage.setItem('bedwars_season_pass', JSON.stringify(this.state));
    this.updateCrystal();
  }

  bind() {
    document.getElementById('seasonPassBtn')?.addEventListener('click', () => this.open('rewards'));
    document.getElementById('passCloseBtn')?.addEventListener('click', () => this.close());
    document.getElementById('claimAllPassBtn')?.addEventListener('click', () => this.claimAll());
    document.getElementById('upgradePassBtn')?.addEventListener('click', () => this.openPay('advanced'));
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

  open(tab = this.tab) {
    this.tab = tab;
    if (this.panel) this.panel.style.display = 'flex';
    document.querySelectorAll('[data-pass-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.passTab === tab));
    this.render();
  }

  close() {
    if (this.panel) this.panel.style.display = 'none';
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
    if (this.tab === 'team') this.renderTeam();
    if (this.tab === 'rules') this.renderRules();
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

  previewReward(level) {
    const need = Math.max(0, (level - 1) * SEASON_PASS_CONFIG.xpPerLevel - this.state.xp);
    alert(`试穿预览：${this.rewardFor(level, 'paid')}\n还差 ${need} 经验解锁。`);
  }

  openPay(tier = 'advanced') {
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
