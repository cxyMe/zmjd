// ============================================
// 筑梦决斗后台管理系统 - Admin Dashboard
// ============================================

const ADMIN_CONFIG = window.BEDWARS_CONFIG || window.SUPABASE_CONFIG || {};

class AdminSystem {
  constructor() {
    this.client = null;
    this.user = null;
    this.adminLevel = 0;
    this.adminName = '';
    this.currentPage = 'dashboard';
    this.economyChart = null;
    this.subs = [];
    this.init();
  }

  init() {
    document.getElementById('adminLoginBtn').addEventListener('click', () => this.login());
    document.getElementById('logoutAdminBtn').addEventListener('click', () => this.logout());
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); this.switchPage(el.dataset.page); });
    });
    this.bindActions();
    this.loadSession();
  }

  initClient() {
    if (!window.supabase || !ADMIN_CONFIG.supabaseUrl) return false;
    this.client = window.supabase.createClient(ADMIN_CONFIG.supabaseUrl, ADMIN_CONFIG.supabaseAnonKey);
    return true;
  }

  async login() {
    const phone = document.getElementById('adminPhone').value.trim();
    const password = document.getElementById('adminPassword').value;
    const errEl = document.getElementById('loginError');
    errEl.textContent = '';

    if (!/^1\d{10}$/.test(phone)) { errEl.textContent = '请输入11位手机号'; return; }
    if (!password) { errEl.textContent = '请输入密码'; return; }

    try {
      const res = await fetch(ADMIN_CONFIG.yiquanAuthEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) { errEl.textContent = data.error || '登录失败'; return; }

      this.user = data.user;
      localStorage.setItem('bedwars_admin_auth', JSON.stringify(data));

      if (!this.initClient()) { errEl.textContent = 'Supabase 未配置'; return; }

      const { data: adminRow } = await this.client.from('admin_users').select('*').eq('user_id', data.user.id).single();
      if (!adminRow) { errEl.textContent = '您没有管理员权限'; return; }
      if (!adminRow.is_active) { errEl.textContent = '管理员账号已被禁用'; return; }

      this.adminLevel = adminRow.level;
      this.adminName = adminRow.nickname || data.user.nickname || data.user.phone;
      this.showApp();
    } catch (e) { errEl.textContent = e.message || '网络错误'; }
  }

  async loadSession() {
    try {
      const saved = JSON.parse(localStorage.getItem('bedwars_admin_auth') || 'null');
      if (!saved?.session?.access_token) return;
      this.user = saved.user;
      if (!this.initClient()) return;
      const { data: adminRow } = await this.client.from('admin_users').select('*').eq('user_id', saved.user.id).single();
      if (!adminRow || !adminRow.is_active) { this.logout(); return; }
      this.adminLevel = adminRow.level;
      this.adminName = adminRow.nickname || saved.user.nickname || saved.user.phone;
      this.showApp();
    } catch (e) { /* ignore */ }
  }

  logout() {
    localStorage.removeItem('bedwars_admin_auth');
    this.user = null; this.adminLevel = 0;
    this.subs.forEach(s => s?.unsubscribe?.()); this.subs = [];
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminApp').style.display = 'none';
  }

  showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminApp').style.display = 'grid';
    document.getElementById('adminName').textContent = this.adminName;
    const levelNames = { 1: '观察员', 2: '裁判员', 3: '数值策划', 4: '超级管理员' };
    document.getElementById('adminLevelBadge').textContent = levelNames[this.adminLevel] || '观察员';
    if (this.adminLevel >= 4) document.getElementById('navAdmins').style.display = 'flex';
    this.switchPage('dashboard');
  }

  switchPage(page) {
    this.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    const nav = document.querySelector('.nav-item[data-page="' + page + '"]');
    if (nav) nav.classList.add('active');
    this.loadPageData(page);
  }

  can(level) { return this.adminLevel >= level; }
  guard(level) { if (!this.can(level)) { alert('权限不足：需要 Lv.' + level); return false; } return true; }

  // ====== Page Data Loaders ======
  async loadPageData(page) {
    if (!this.client) return;
    switch (page) {
      case 'dashboard': await this.loadDashboard(); break;
      case 'players': await this.loadPlayersPage(); break;
      case 'matches': break;
      case 'economy': await this.loadEconomyPage(); break;
      case 'balance': await this.loadBalancePage(); break;
      case 'cheat': await this.loadCheatPage(); break;
      case 'audit': await this.loadAuditPage(); break;
      case 'admins': await this.loadAdminsPage(); break;
    }
  }

  async loadDashboard() {
    const { data: matches } = await this.client.from('active_matches').select('*').eq('status', 'playing');
    document.getElementById('dashMatches').textContent = matches?.length || 0;
    let totalPlayers = 0;
    (matches || []).forEach(m => { totalPlayers += (m.team_red_alive || 0) + (m.team_blue_alive || 0) + (m.team_green_alive || 0) + (m.team_yellow_alive || 0); });
    document.getElementById('dashPlayers').textContent = totalPlayers;

    const beds = { red: 0, blue: 0, green: 0, yellow: 0, total: 0 };
    (matches || []).forEach(m => {
      if (m.red_bed_alive) beds.red++;
      if (m.blue_bed_alive) beds.blue++;
      if (m.green_bed_alive) beds.green++;
      if (m.yellow_bed_alive) beds.yellow++;
      beds.total++;
    });
    const t = Math.max(beds.total, 1);
    const setBed = (id, key, val) => { document.getElementById(id).style.width = val + '%'; document.getElementById(id + 'Text').textContent = Math.round(val) + '%'; };
    setBed('bedRed', 'bedRed', (beds.red / t) * 100);
    setBed('bedBlue', 'bedBlue', (beds.blue / t) * 100);
    setBed('bedGreen', 'bedGreen', (beds.green / t) * 100);
    setBed('bedYellow', 'bedYellow', (beds.yellow / t) * 100);

    const hourKey = new Date().toISOString().slice(0, 13);
    const { data: eco } = await this.client.from('economy_stats').select('*').eq('hour_key', hourKey).single();
    document.getElementById('dashEconomyAlert').style.display = (eco && eco.anomaly_score > 50) ? 'block' : 'none';

    const tbody = document.getElementById('activeMatchesBody');
    tbody.innerHTML = (matches || []).map(m => `<tr><td>${m.match_code}</td><td>${m.status}</td><td>${new Date(m.started_at).toLocaleTimeString()}</td><td>R${m.team_red_alive} B${m.team_blue_alive} G${m.team_green_alive} Y${m.team_yellow_alive}</td><td>${m.red_bed_alive ? '🛏️' : '💥'} ${m.blue_bed_alive ? '🛏️' : '💥'} ${m.green_bed_alive ? '🛏️' : '💥'} ${m.yellow_bed_alive ? '🛏️' : '💥'}</td></tr>`).join('');

    this.renderEconomyChart(eco);
  }

  renderEconomyChart(eco) {
    const ctx = document.getElementById('economyChart')?.getContext('2d');
    if (!ctx) return;
    if (this.economyChart) this.economyChart.destroy();
    this.economyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['铜币', '银币', '金币', '玉佩'],
        datasets: [{
          label: '过去1小时产出',
          data: [eco?.copper_total || 0, eco?.silver_total || 0, eco?.gold_total || 0, eco?.jade_total || 0],
          backgroundColor: ['#cd7f32', '#c0c0c0', '#ffd700', '#00a86b']
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }
    });
  }

  async loadPlayersPage() {
    if (!this.client) return;
    document.getElementById('searchPlayerBtn').onclick = async () => {
      const pid = document.getElementById('playerSearch').value.trim();
      if (!pid) return;
      const { data: logs } = await this.client.from('player_economy_logs').select('*').eq('player_id', pid).order('created_at', { ascending: false }).limit(50);
      document.getElementById('playerInfo').innerHTML = `<div style="color:#00d4ff;font-size:16px">玩家ID: ${pid}</div><div style="color:#aaa;font-size:12px;margin-top:4px">最近50条记录</div>`;
      document.getElementById('playerEconomy').innerHTML = (logs || []).map(l =>
        `<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px">
          <span style="color:#888">${new Date(l.created_at).toLocaleTimeString()}</span>
          <span style="color:#ccc;margin-left:8px">${l.event_type}</span>
          ${l.currency ? `<span style="color:#ffd700;margin-left:8px">${l.currency} ${l.amount > 0 ? '+' : ''}${l.amount}</span>` : ''}
          ${l.item_key ? `<span style="color:#00d4ff;margin-left:8px">${l.item_key}</span>` : ''}
        </div>`
      ).join('');
    };
  }

  async loadEconomyPage() {
    if (!this.client) return;
    const { data: cfg } = await this.client.from('game_config').select('*').in('config_key', ['shop_prices', 'gen_spawn_rates']);
    const prices = cfg?.find(c => c.config_key === 'shop_prices')?.config_value || {};
    const rates = cfg?.find(c => c.config_key === 'gen_spawn_rates')?.config_value || {};

    const pe = document.getElementById('shopPriceEditor');
    pe.innerHTML = Object.entries(prices).map(([k, v]) => {
      const cur = Object.keys(v)[0]; const amt = v[cur];
      return `<div class="config-row"><label>${k}</label><input type="number" data-key="${k}" value="${amt}" data-cur="${cur}"></div>`;
    }).join('');

    const ge = document.getElementById('genRateEditor');
    ge.innerHTML = Object.entries(rates).map(([k, v]) =>
      `<div class="config-row"><label>${k} (秒)</label><input type="number" data-gen="${k}" value="${v}"></div>`
    ).join('');

    const gi = document.getElementById('giftItem');
    gi.innerHTML = Object.keys(prices).map(k => `<option value="${k}">${k}</option>`).join('');
  }

  async loadBalancePage() {
    if (!this.client) return;
    const { data: cfg } = await this.client.from('game_config').select('*').in('config_key', ['role_skills', 'block_durability', 'banned_items']);
    const roles = cfg?.find(c => c.config_key === 'role_skills')?.config_value || {};
    const blocks = cfg?.find(c => c.config_key === 'block_durability')?.config_value || {};
    const banned = cfg?.find(c => c.config_key === 'banned_items')?.config_value || [];

    document.getElementById('roleSkillEditor').innerHTML = Object.entries(roles).map(([k, v]) =>
      `<div class="config-row"><label>${k} 启用</label><input type="checkbox" data-role="${k}" ${v.enabled ? 'checked' : ''}></div>`
    ).join('');

    document.getElementById('blockDurabilityEditor').innerHTML = Object.entries(blocks).map(([k, v]) =>
      `<div class="config-row"><label>${k} HP</label><input type="number" data-block="${k}" value="${v}"></div>`
    ).join('');

    document.getElementById('bannedItemsEditor').innerHTML =
      `<div style="font-size:12px;color:#aaa;margin-bottom:8px">当前禁用: ${banned.join(', ') || '无'}</div>
       <input type="text" id="banItemInput" placeholder="输入要禁用的道具key">`;
  }

  async loadCheatPage() {
    if (!this.client) return;
    const { data: alerts } = await this.client.from('cheat_alerts').select('*').eq('is_resolved', false).order('created_at', { ascending: false }).limit(50);
    document.getElementById('cheatCount').textContent = alerts?.length || 0;
    document.getElementById('cheatAlertsBody').innerHTML = (alerts || []).map(a =>
      `<tr><td>${new Date(a.created_at).toLocaleString()}</td><td>${a.player_id.slice(0, 12)}...</td><td>${a.alert_type}</td><td>${'⭐'.repeat(a.severity)}</td><td style="font-size:11px">${JSON.stringify(a.details).slice(0, 60)}</td><td><button class="btn-primary" onclick="admin.resolveCheat('${a.id}')">标记解决</button></td></tr>`
    ).join('');
  }

  async loadAuditPage() {
    if (!this.client) return;
    const { data: logs } = await this.client.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    document.getElementById('auditLogsBody').innerHTML = (logs || []).map(l =>
      `<tr><td>${new Date(l.created_at).toLocaleString()}</td><td>${l.admin_id.slice(0, 12)}</td><td>${l.action}</td><td>${l.target_type || '-'}</td><td>${l.target_id ? l.target_id.slice(0, 12) : '-'}</td><td style="font-size:11px">${JSON.stringify(l.new_value).slice(0, 60)}</td></tr>`
    ).join('');
  }

  async loadAdminsPage() {
    if (!this.client) return;
    const { data: admins } = await this.client.from('admin_users').select('*').order('level', { ascending: false });
    document.getElementById('adminListBody').innerHTML = (admins || []).map(a =>
      `<tr><td>${a.user_id.slice(0, 16)}...</td><td>${a.nickname || '-'}</td><td>Lv.${a.level} ${a.level_name}</td><td>${new Date(a.created_at).toLocaleDateString()}</td><td>${a.is_active ? '正常' : '禁用'}</td><td>${a.user_id !== this.user?.id ? `<button class="btn-danger" onclick="admin.toggleAdmin('${a.user_id}', ${!a.is_active})">${a.is_active ? '禁用' : '启用'}</button>` : '-'}</td></tr>`
    ).join('');
  }

  // ====== Actions ======
  bindActions() {
    document.getElementById('saveShopPricesBtn')?.addEventListener('click', () => this.saveShopPrices());
    document.getElementById('saveGenRatesBtn')?.addEventListener('click', () => this.saveGenRates());
    document.getElementById('saveRoleSkillsBtn')?.addEventListener('click', () => this.saveRoleSkills());
    document.getElementById('saveBlockDurabilityBtn')?.addEventListener('click', () => this.saveBlockDurability());
    document.getElementById('saveBannedItemsBtn')?.addEventListener('click', () => this.saveBannedItems());
    document.getElementById('addAdminBtn')?.addEventListener('click', () => this.addAdmin());
    document.getElementById('sendGiftBtn')?.addEventListener('click', () => this.sendGift());

    document.querySelectorAll('#penaltyBtns button').forEach(btn => {
      btn.addEventListener('click', () => this.applyPenalty(btn.dataset.type));
    });

    document.getElementById('forceShrinkBtn')?.addEventListener('click', () => this.broadcastCommand('force_shrink'));
    document.getElementById('forceFinalBtn')?.addEventListener('click', () => this.broadcastCommand('force_final'));
    document.getElementById('forceTideBtn')?.addEventListener('click', () => this.broadcastCommand('force_tide'));
    document.getElementById('forceTimeBtn')?.addEventListener('click', () => {
      const min = document.getElementById('timeSlider').value;
      this.broadcastCommand('force_time', { minutes: parseInt(min) });
    });
    document.getElementById('swapPlayersBtn')?.addEventListener('click', () => this.broadcastCommand('swap_players', {
      a: document.getElementById('swapPlayerA').value,
      b: document.getElementById('swapPlayerB').value
    }));
    document.getElementById('fillTeamBtn')?.addEventListener('click', () => this.broadcastCommand('fill_team', {
      player: document.getElementById('fillPlayer').value,
      team: document.getElementById('fillTeam').value
    }));
    document.getElementById('enableAiBtn')?.addEventListener('click', () => this.broadcastCommand('ai_takeover', {
      player: document.getElementById('aiPlayerId').value, enable: true
    }));
    document.getElementById('disableAiBtn')?.addEventListener('click', () => this.broadcastCommand('ai_takeover', {
      player: document.getElementById('aiPlayerId').value, enable: false
    }));
    document.getElementById('rollbackAssetsBtn')?.addEventListener('click', () => {
      const pid = document.getElementById('playerSearch').value.trim();
      if (!pid) return alert('请先查询玩家');
      this.broadcastCommand('rollback_assets', { player: pid });
    });
  }

  async saveShopPrices() {
    if (!this.guard(3)) return;
    const inputs = document.querySelectorAll('#shopPriceEditor input');
    const prices = {};
    inputs.forEach(inp => { prices[inp.dataset.key] = { [inp.dataset.cur]: parseInt(inp.value) }; });
    await this.client.from('game_config').update({ config_value: prices, updated_by: this.user.id }).eq('config_key', 'shop_prices');
    await this.logAudit('update_shop_prices', 'config', 'shop_prices', null, prices);
    alert('物价已保存');
  }

  async saveGenRates() {
    if (!this.guard(3)) return;
    const inputs = document.querySelectorAll('#genRateEditor input');
    const rates = {};
    inputs.forEach(inp => { rates[inp.dataset.gen] = parseInt(inp.value); });
    await this.client.from('game_config').update({ config_value: rates, updated_by: this.user.id }).eq('config_key', 'gen_spawn_rates');
    await this.logAudit('update_gen_rates', 'config', 'gen_spawn_rates', null, rates);
    alert('生成倍率已保存');
  }

  async saveRoleSkills() {
    if (!this.guard(3)) return;
    const inputs = document.querySelectorAll('#roleSkillEditor input');
    const { data: cfg } = await this.client.from('game_config').select('config_value').eq('config_key', 'role_skills').single();
    const roles = cfg?.config_value || {};
    inputs.forEach(inp => { if (roles[inp.dataset.role]) roles[inp.dataset.role].enabled = inp.checked; });
    await this.client.from('game_config').update({ config_value: roles, updated_by: this.user.id }).eq('config_key', 'role_skills');
    await this.logAudit('update_role_skills', 'config', 'role_skills', null, roles);
    alert('角色配置已保存');
  }

  async saveBlockDurability() {
    if (!this.guard(3)) return;
    const inputs = document.querySelectorAll('#blockDurabilityEditor input');
    const blocks = {};
    inputs.forEach(inp => { blocks[inp.dataset.block] = parseInt(inp.value); });
    await this.client.from('game_config').update({ config_value: blocks, updated_by: this.user.id }).eq('config_key', 'block_durability');
    await this.logAudit('update_block_durability', 'config', 'block_durability', null, blocks);
    alert('耐久度已保存');
  }

  async saveBannedItems() {
    if (!this.guard(3)) return;
    const val = document.getElementById('banItemInput')?.value.trim();
    const { data: cfg } = await this.client.from('game_config').select('config_value').eq('config_key', 'banned_items').single();
    let banned = cfg?.config_value || [];
    if (val && !banned.includes(val)) banned.push(val);
    await this.client.from('game_config').update({ config_value: banned, updated_by: this.user.id }).eq('config_key', 'banned_items');
    await this.logAudit('update_banned_items', 'config', 'banned_items', null, banned);
    alert('道具名单已保存');
    this.loadBalancePage();
  }

  async applyPenalty(type) {
    if (!this.guard(2)) return;
    const pid = document.getElementById('playerSearch').value.trim();
    if (!pid) return alert('请先查询玩家');
    const reason = document.getElementById('penaltyReason').value || '管理员操作';
    const duration = parseInt(document.getElementById('penaltyDuration').value) || 0;
    const expires = duration > 0 ? new Date(Date.now() + duration * 60000).toISOString() : null;
    await this.client.from('player_penalties').insert({
      player_id: pid, admin_id: this.user.id, type, reason,
      duration_minutes: duration || null, expires_at: expires
    });
    await this.logAudit('penalty_' + type, 'player', pid, null, { type, reason, duration });
    alert(`已执行${type}`);
  }

  async broadcastCommand(cmd, data = {}) {
    if (!this.client) return;
    await this.client.from('game_events').insert({
      room_id: 'broadcast', player_id: this.user.id,
      event_type: 'admin_command', event_data: { cmd, ...data }, tick: 0
    });
    await this.logAudit('command_' + cmd, 'broadcast', 'all', null, { cmd, ...data });
    alert('命令已广播');
  }

  async sendGift() {
    if (!this.guard(4)) return;
    const pid = document.getElementById('giftPlayerId').value.trim();
    const item = document.getElementById('giftItem').value;
    const count = parseInt(document.getElementById('giftCount').value) || 1;
    if (!pid) return alert('请输入玩家ID');
    await this.broadcastCommand('send_gift', { player: pid, item, count });
  }

  async addAdmin() {
    if (!this.guard(4)) return;
    const uid = document.getElementById('newAdminUserId').value.trim();
    const nick = document.getElementById('newAdminNickname').value.trim();
    const level = parseInt(document.getElementById('newAdminLevel').value);
    if (!uid) return alert('请输入用户ID');
    await this.client.from('admin_users').upsert({
      user_id: uid, nickname: nick, level, created_by: this.user.id
    });
    await this.logAudit('add_admin', 'admin', uid, null, { level, nickname: nick });
    alert('管理员已添加');
    this.loadAdminsPage();
  }

  async toggleAdmin(uid, active) {
    if (!this.guard(4)) return;
    await this.client.from('admin_users').update({ is_active: active }).eq('user_id', uid);
    await this.logAudit(active ? 'enable_admin' : 'disable_admin', 'admin', uid, null, { is_active: active });
    this.loadAdminsPage();
  }

  async resolveCheat(id) {
    if (!this.guard(2)) return;
    await this.client.from('cheat_alerts').update({ is_resolved: true, resolved_by: this.user.id }).eq('id', id);
    this.loadCheatPage();
  }

  async logAudit(action, targetType, targetId, oldVal, newVal) {
    if (!this.client) return;
    await this.client.from('admin_audit_logs').insert({
      admin_id: this.user.id, action, target_type: targetType, target_id: targetId,
      old_value: oldVal, new_value: newVal
    });
  }
}

const admin = new AdminSystem();
