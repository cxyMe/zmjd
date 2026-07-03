// ============================================
// 筑梦决斗成长系统：局内觉醒 + 局外养成 + 赛季/排位
// ============================================

const GROWTH_CONFIG = {
  maxInMatchLevel: 8,
  hpPerLevel: 2,
  levelXp: [0, 30, 75, 135, 210, 300, 410, 540],
  xp: {
    collectResource: { copper: 1, silver: 3, gold: 8, jade: 18 },
    placeBlock: 2,
    damage: 0.8,
    bedBreak: 90,
    kill: 120,
    survivalMinute: 6
  },
  ranks: [
    { key: 'SLEEPER', name: '沉睡梦游者', min: 0 },
    { key: 'STAR', name: '筑梦新星', min: 800 },
    { key: 'EXPERT', name: '筑梦高手', min: 1400 },
    { key: 'MASTER', name: '筑梦大师', min: 2100 },
    { key: 'GRANDMASTER', name: '筑梦宗师', min: 3000 },
    { key: 'LEGEND', name: '筑梦传说', min: 4200 }
  ]
};

const AWAKENING_OPTIONS = {
  FOX: {
    3: [
      { id: 'fox_camouflage_cd', name: '灵狐潜踪', desc: '伪装冷却减少3秒', apply: p => { p.skillCdBonus = (p.skillCdBonus || 0) + 3; } },
      { id: 'fox_lowhp_boost', name: '狐影威慑', desc: '低血增伤额外提高10%', apply: p => { p.lowHpDamageBoost = 0.1; } }
    ],
    6: [
      { id: 'fox_kill_reset', name: '狐火收割', desc: '击杀刷新主动技能冷却', apply: p => { p.killResetSkill = true; } },
      { id: 'fox_kill_heal', name: '狡狐回生', desc: '击杀后恢复15点生命', apply: p => { p.killHeal = 15; } }
    ]
  },
  PORK_DOCTOR: {
    3: [
      { id: 'pork_fat_cd', name: '热量储备', desc: '五斤肥肉冷却减少4秒', apply: p => { p.skillCdBonus = (p.skillCdBonus || 0) + 4; } },
      { id: 'pork_heal_plus', name: '营养过剩', desc: '被动恢复额外+2生命', apply: p => { p.porkHealBonus = 2; } }
    ],
    6: [
      { id: 'pork_tank', name: '厚切装甲', desc: '受到伤害降低8%', apply: p => { p.flatDamageReduce = 0.08; } },
      { id: 'pork_kill_heal', name: '加餐时间', desc: '击杀后恢复25点生命', apply: p => { p.killHeal = 25; } }
    ]
  },
  HURRICANE: {
    3: [
      { id: 'hurricane_dash_cd', name: '顺风而行', desc: '飓风之力冷却减少3秒', apply: p => { p.skillCdBonus = (p.skillCdBonus || 0) + 3; } },
      { id: 'hurricane_arrow_slow', name: '风压箭', desc: '远程命中附带短暂减速', apply: p => { p.arrowSlow = true; } }
    ],
    6: [
      { id: 'hurricane_arrow_boost', name: '穿风箭意', desc: '弓箭伤害+15%', apply: p => { p.arrowDamageBoost = 0.15; } },
      { id: 'hurricane_refund', name: '回旋箭袋', desc: '弓箭击杀返还2支箭', apply: p => { p.killArrowRefund = 2; } }
    ]
  },
  DRIFTWOOD: {
    3: [
      { id: 'driftwood_missile_cd', name: '冷却木芯', desc: '天罚冷却减少5秒', apply: p => { p.skillCdBonus = (p.skillCdBonus || 0) + 5; } },
      { id: 'driftwood_shield_plus', name: '回收强化', desc: '命中获得护盾上限提高20', apply: p => { p.shieldCapBonus = 20; } }
    ],
    6: [
      { id: 'driftwood_damage_reduce', name: '木纹缓冲', desc: '受到伤害降低6%', apply: p => { p.flatDamageReduce = 0.06; } },
      { id: 'driftwood_block_xp', name: '漂流筑桥', desc: '放置方块经验+30%', apply: p => { p.blockXpBoost = 0.3; } }
    ]
  }
};

const OUTGAME_TALENTS = [
  { id: 'red_tnt_start', color: 'red', name: '爆破先锋', desc: '开局自带1个TNT，但不能带出基地', max: 1 },
  { id: 'red_first_bed_hit', color: 'red', name: '破床锋芒', desc: '对敌床首次伤害提高5%', max: 1 },
  { id: 'red_chase', color: 'red', name: '追击步伐', desc: '击杀后3秒内移速微增', max: 1 },
  { id: 'red_bow_focus', color: 'red', name: '战弓预热', desc: '弓箭首次命中额外获得经验', max: 1 },
  { id: 'red_breach_xp', color: 'red', name: '破阵经验', desc: '拆床经验提高10%', max: 1 },
  { id: 'red_forge_mark', color: 'red', name: '战痕标记', desc: '对床造成伤害会被记录到勋章墙', max: 1 },
  { id: 'red_tnt_safe', color: 'red', name: '爆破直觉', desc: 'TNT误伤队友提示增强', max: 1 },
  { id: 'red_duel', color: 'red', name: '决斗礼仪', desc: '单挑击杀展示专属击杀文字', max: 1 },
  { id: 'red_pressure', color: 'red', name: '压迫路线', desc: '进入中枢梦域时小地图高亮资源点', max: 1 },
  { id: 'red_banner', color: 'red', name: '破梦旌旗', desc: '拆床横幅外观可选红色主题', max: 1 },
  { id: 'blue_pick_range', color: 'blue', name: '宽域拾取', desc: '基地资源拾取范围扩大30%', max: 1 },
  { id: 'blue_wood_discount', color: 'blue', name: '木工议价', desc: '购买木板价格9折', max: 1 },
  { id: 'blue_early_copper', color: 'blue', name: '铜流感知', desc: '前3分钟铜币经验+10%', max: 1 },
  { id: 'blue_pack_order', color: 'blue', name: '背包整理', desc: '拾取物优先填入同类槽', max: 1 },
  { id: 'blue_bridge_hint', color: 'blue', name: '路线测绘', desc: '搭桥时显示落点提示', max: 1 },
  { id: 'blue_shop_memory', color: 'blue', name: '商店记忆', desc: '商店保留上次分页', max: 1 },
  { id: 'blue_forge_watch', color: 'blue', name: '资源守望', desc: '资源刷新时有更明显提示', max: 1 },
  { id: 'blue_trade_log', color: 'blue', name: '账本意识', desc: '结算页展示资源贡献评分', max: 1 },
  { id: 'blue_route_badge', color: 'blue', name: '筑路徽记', desc: '搭桥贡献进入赛季任务统计', max: 1 },
  { id: 'blue_supply', color: 'blue', name: '补给规划', desc: '补给包领取提示增强', max: 1 },
  { id: 'green_void_grace', color: 'green', name: '虚空缓坠', desc: '掉入虚空0.5秒后才死亡', max: 1 },
  { id: 'green_knock_reduce', color: 'green', name: '稳固脚步', desc: '被击退效果减弱10%', max: 1 },
  { id: 'green_respawn_focus', color: 'green', name: '复生专注', desc: '复活后短暂显示资源路线', max: 1 },
  { id: 'green_low_hp_warn', color: 'green', name: '危机警觉', desc: '低血量时UI提示更明显', max: 1 },
  { id: 'green_bed_guard', color: 'green', name: '守床本能', desc: '床附近获得额外经验提示', max: 1 },
  { id: 'green_fall_memory', color: 'green', name: '坠落记忆', desc: '死亡点在小地图短暂标记', max: 1 },
  { id: 'green_team_ping', color: 'green', name: '团队信标', desc: '队友低血量时显示提示', max: 1 },
  { id: 'green_sustain_log', color: 'green', name: '生存日志', desc: '结算页展示生存贡献', max: 1 },
  { id: 'green_emote_calm', color: 'green', name: '沉着表情', desc: '解锁基础鞠躬表情', max: 1 },
  { id: 'green_medal_frame', color: 'green', name: '守护边框', desc: '勋章墙可选绿色边框', max: 1 }
];

class GrowthManager {
  constructor(game) {
    this.game = game;
    this.activeTalents = JSON.parse(localStorage.getItem('bedwars_active_talents') || '[]');
    this.unlockedTalents = JSON.parse(localStorage.getItem('bedwars_unlocked_talents') || '[]');
    this.profile = JSON.parse(localStorage.getItem('bedwars_growth_profile') || '{"stardust":0,"rankScore":0,"seasonXp":0}');
  }

  hasTalent(id) { return this.activeTalents.includes(id); }

  addXp(player, amount, reason = '成长') {
    if (!player || player.isDead || amount <= 0) return;
    const oldLevel = player.matchLevel;
    player.matchXp += Math.floor(amount);
    while (player.matchLevel < GROWTH_CONFIG.maxInMatchLevel) {
      const need = GROWTH_CONFIG.levelXp[player.matchLevel] || 999999;
      if (player.matchXp < need) break;
      player.matchLevel++;
      player.maxHp += GROWTH_CONFIG.hpPerLevel;
      player.hp = Math.min(player.maxHp, player.hp + GROWTH_CONFIG.hpPerLevel + 4);
      this.game.showMessage(`${player.name} 升至 ${player.matchLevel} 级：生命上限 +2`, '#8be9fd');
      if (player.isLocal && (player.matchLevel === 3 || player.matchLevel === 6)) this.showAwakeningChoice(player, player.matchLevel);
      if (!player.isLocal && (player.matchLevel === 3 || player.matchLevel === 6)) this.autoPickAwakening(player, player.matchLevel);
    }
    if (player.isLocal && oldLevel !== player.matchLevel) this.game.ui?.updateGrowthPanel?.();
  }

  showAwakeningChoice(player, level) {
    const panel = document.getElementById('awakeningPanel');
    const body = document.getElementById('awakeningChoices');
    if (!panel || !body) return;
    const options = AWAKENING_OPTIONS[player.role]?.[level] || [];
    body.innerHTML = options.map(o => `<button class="awake-choice" data-id="${o.id}"><b>${o.name}</b><span>${o.desc}</span></button>`).join('');
    body.querySelectorAll('.awake-choice').forEach(btn => {
      btn.onclick = () => {
        const choice = options.find(o => o.id === btn.dataset.id);
        this.applyAwakening(player, level, choice);
        panel.style.display = 'none';
        if (!this.game.input.isMobile()) this.game.engine.renderer.domElement.requestPointerLock();
      };
    });
    panel.style.display = 'flex';
    if (document.pointerLockElement) document.exitPointerLock();
  }

  autoPickAwakening(player, level) {
    const options = AWAKENING_OPTIONS[player.role]?.[level] || [];
    this.applyAwakening(player, level, options[Math.floor(Math.random() * options.length)]);
  }

  applyAwakening(player, level, choice) {
    if (!choice || player.awakenings[level]) return;
    player.awakenings[level] = choice.id;
    choice.apply?.(player);
    this.game.showMessage(`${player.name} 觉醒：${choice.name}`, '#ffdd00');
  }

  applyOutGameTalents(player) {
    if (!player?.isLocal) return;
    if (this.hasTalent('red_tnt_start')) player.addToBackpack('tnt', 1);
    if (this.hasTalent('blue_pick_range')) player.pickupRangeBonus = 0.3;
    if (this.hasTalent('green_void_grace')) player.voidGrace = 0.5;
    if (this.hasTalent('green_knock_reduce')) player.knockbackReduce = 0.1;
  }

  settlement(winnerName) {
    const p = this.game.localPlayer;
    if (!p) return;
    const win = winnerName === p.teamInfo.name;
    const survivalMin = Math.floor(this.game.gameTime / 60);
    const stardust = Math.max(10, survivalMin * 3 + p.matchStats.beds * 40 + (win ? 80 : 20));
    const rankDelta = Math.round((win ? 28 : -12) + p.matchStats.beds * 18 + p.matchStats.resourceContribution * 0.02 + survivalMin * 0.8);
    this.profile.stardust = (this.profile.stardust || 0) + stardust;
    this.profile.rankScore = Math.max(0, (this.profile.rankScore || 0) + rankDelta);
    this.profile.seasonXp = (this.profile.seasonXp || 0) + Math.max(20, p.matchStats.blocksPlaced + p.matchStats.kills * 30 + p.matchStats.beds * 60);
    localStorage.setItem('bedwars_growth_profile', JSON.stringify(this.profile));
    this.saveMastery(p, win);
    this.remoteSettlement(p, win, stardust, rankDelta);
    return { stardust, rankDelta, rankName: this.rankName(this.profile.rankScore), seasonXp: this.profile.seasonXp };
  }

  saveMastery(player, win) {
    const all = JSON.parse(localStorage.getItem('bedwars_role_mastery') || '{}');
    const r = all[player.role] || { kills: 0, beds: 0, wins: 0 };
    r.kills += player.matchStats.kills;
    r.beds += player.matchStats.beds;
    if (win) r.wins++;
    r.tier = this.masteryTier(r);
    all[player.role] = r;
    localStorage.setItem('bedwars_role_mastery', JSON.stringify(all));
  }

  masteryTier(r) {
    const score = r.kills + r.beds * 4 + r.wins * 8;
    if (score >= 220) return '筑梦大师';
    if (score >= 100) return '黄金';
    if (score >= 35) return '白银';
    return '青铜';
  }

  rankName(score) {
    let rank = GROWTH_CONFIG.ranks[0];
    for (const r of GROWTH_CONFIG.ranks) if (score >= r.min) rank = r;
    return rank.name;
  }

  async remoteSettlement(player, win, stardust, rankDelta) {
    const client = this.game.network?.roomNet?.client;
    if (!client || player.playerId?.startsWith?.('local-')) return;
    const profile = {
      player_id: player.playerId,
      stardust_total: this.profile.stardust || 0,
      rank_score: this.profile.rankScore || 0,
      rank_name: this.rankName(this.profile.rankScore || 0),
      season_xp: this.profile.seasonXp || 0,
      updated_at: new Date().toISOString()
    };
    client.from('player_growth_profiles').upsert(profile, { onConflict: 'player_id' }).catch(()=>{});
    client.from('match_growth_results').insert({
      player_id: player.playerId,
      room_id: this.game.network?.roomNet?.room?.id || 'local',
      role_key: player.role,
      win,
      survival_seconds: Math.floor(this.game.gameTime),
      kills: player.matchStats.kills,
      beds_destroyed: player.matchStats.beds,
      blocks_placed: player.matchStats.blocksPlaced,
      resource_contribution: player.matchStats.resourceContribution,
      stardust_earned: stardust,
      rank_delta: rankDelta
    }).catch(()=>{});
    client.from('role_mastery').upsert({
      player_id: player.playerId,
      role_key: player.role,
      kills: player.matchStats.kills,
      beds_destroyed: player.matchStats.beds,
      wins: win ? 1 : 0,
      mastery_tier: this.masteryTier(player.matchStats)
    }, { onConflict: 'player_id,role_key' }).catch(()=>{});
  }
}

window.GROWTH_CONFIG = GROWTH_CONFIG;
window.AWAKENING_OPTIONS = AWAKENING_OPTIONS;
window.OUTGAME_TALENTS = OUTGAME_TALENTS;
window.GrowthManager = GrowthManager;
