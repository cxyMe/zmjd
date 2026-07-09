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

class GrowthManager {
  constructor(game) {
    this.game = game;
    this.profile = JSON.parse(localStorage.getItem('bedwars_growth_profile') || '{"stardust":0,"rankScore":0,"seasonXp":0}');
  }

  addXp(player, amount, reason = '成长') {
    if (!player || player.isDead || amount <= 0) return;
    const oldLevel = player.matchLevel;
    player.matchXp += Math.floor(amount);
    while (player.matchLevel < GROWTH_CONFIG.maxInMatchLevel) {
      const need = GROWTH_CONFIG.levelXp[player.matchLevel] || 999999;
      if (player.matchXp < need) break;
      player.matchLevel++;
      if (player.role === 'WAIWAI') {
        player.maxHp = 1;
        player.hp = 1;
        this.game.showMessage(`${player.name} 升至 ${player.matchLevel} 级：歪歪生命上限固定为1`, '#f5f0dc');
      } else {
        player.maxHp += GROWTH_CONFIG.hpPerLevel;
        player.hp = Math.min(player.maxHp, player.hp + GROWTH_CONFIG.hpPerLevel + 4);
        this.game.showMessage(`${player.name} 升至 ${player.matchLevel} 级：生命上限 +2`, '#8be9fd');
      }
    }
    if (player.isLocal && oldLevel !== player.matchLevel) this.game.ui?.updateGrowthPanel?.();
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
window.GrowthManager = GrowthManager;
