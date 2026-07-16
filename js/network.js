// ============================================
// 联机与账号系统：本地用户名密码 + Supabase 房间
// 表结构对应 supabase-schema.sql
// ============================================

class AuthManager {
  constructor(config) {
    this.config = config;
    this.user = null;
    this.session = null;
    this.client = null;
    this.loadSession();
  }

  _makeToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let t = '';
    for (let i = 0; i < 32; i++) t += chars[Math.floor(Math.random() * chars.length)];
    return t;
  }

  get _supabaseEnabled() {
    return !!(this.config.supabaseUrl && this.config.supabaseAnonKey && window.supabase);
  }

  initClient() {
    if (!this._supabaseEnabled) throw new Error('Supabase 未配置');
    if (!this.client) {
      this.client = window.supabase.createClient(this.config.supabaseUrl, this.config.supabaseAnonKey);
    }
    return this.client;
  }

  async _hashPassword(password, salt) {
    const text = salt + ':' + password;
    if (window.crypto && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // fallback for non-secure contexts
    let s = text;
    for (let i = 0; i < 3; i++) {
      try {
        s = btoa(unescape(encodeURIComponent(s.split('').reverse().join('') + 'bw_salt_' + i)));
      } catch (e) {
        s = btoa(s.split('').reverse().join('') + 'bw_salt_' + i);
      }
    }
    return s;
  }

  _users() {
    try { return JSON.parse(localStorage.getItem('bedwars_users') || '{}'); }
    catch (_) { return {}; }
  }

  _saveUsers(users) {
    localStorage.setItem('bedwars_users', JSON.stringify(users));
  }

  loadSession() {
    try {
      const saved = JSON.parse(localStorage.getItem('bedwars_auth') || 'null');
      if (!saved?.session?.access_token) return;
      // 检查14天有效期上限
      const savedTime = saved.savedAt || 0;
      if (savedTime && (Date.now() - savedTime > 14 * 24 * 60 * 60 * 1000)) return;
      this.user = saved.user;
      this.session = saved.session;
    } catch (_) {
      this.user = null;
      this.session = null;
    }
  }

  async register(username, password) {
    const uname = String(username || '').trim();
    if (!uname) throw new Error('请输入用户名');
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]{2,16}$/.test(uname)) throw new Error('用户名为 2-16 位，支持中英文、数字、下划线');
    if (!password || password.length < 6) throw new Error('密码至少 6 位');

    const key = uname.toLowerCase();
    const uid = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const passwordHash = await this._hashPassword(password, key);

    // 1) 优先尝试写入 Supabase（实现跨设备同步）
    if (this._supabaseEnabled) {
      try {
        const client = this.initClient();
        const { data: existing } = await client.from('bw_game_users').select('username').eq('username', key).maybeSingle();
        if (existing) throw new Error('该用户名已被注册');
        const { error } = await client.from('bw_game_users').insert({
          id: uid,
          username: key,
          password_hash: passwordHash,
          created_at: new Date().toISOString()
        });
        if (error) {
          const msg = String(error.message || error.code || '').toLowerCase();
          if (!msg.includes('does not exist') && !msg.includes('42p01')) {
            console.warn('Supabase 注册写入失败，降级到本地:', error);
          }
        }
      } catch (e) {
        if (e.message === '该用户名已被注册') throw e;
        console.warn('Supabase 注册失败，降级到本地:', e);
      }
    }

    // 2) 同时保存到 localStorage（作为离线缓存与回退）
    const users = this._users();
    if (users[key]) throw new Error('该用户名已被注册');
    users[key] = {
      id: uid,
      username: uname,
      password: passwordHash,
      createdAt: Date.now()
    };
    this._saveUsers(users);

    // 自动登录
    this.user = { id: uid, username: uname, nickname: uname };
    this.session = { access_token: this._makeToken(), expires_at: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60 };
    localStorage.setItem('bedwars_auth', JSON.stringify({ user: this.user, session: this.session, savedAt: Date.now() }));
    return { user: this.user, session: this.session };
  }

  async login(username, password) {
    const uname = String(username || '').trim();
    if (!uname) throw new Error('请输入用户名');
    if (!password) throw new Error('请输入密码');

    const key = uname.toLowerCase();
    const passwordHash = await this._hashPassword(password, key);

    // 1) 优先尝试 Supabase 登录（跨设备同步）
    if (this._supabaseEnabled) {
      try {
        const client = this.initClient();
        const { data: rec, error } = await client.from('bw_game_users').select('*').eq('username', key).maybeSingle();
        if (!error && rec) {
          if (rec.password_hash !== passwordHash) throw new Error('密码错误');
          this.user = { id: rec.id, username: uname, nickname: uname };
          this.session = { access_token: this._makeToken(), expires_at: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60 };
          localStorage.setItem('bedwars_auth', JSON.stringify({ user: this.user, session: this.session, savedAt: Date.now() }));
          // 同步到本地缓存
          const users = this._users();
          users[key] = { id: rec.id, username: uname, password: rec.password_hash, createdAt: new Date(rec.created_at).getTime() };
          this._saveUsers(users);
          return { user: this.user, session: this.session };
        }
      } catch (e) {
        if (e.message === '密码错误') throw e;
        console.warn('Supabase 登录失败，降级到本地:', e);
      }
    }

    // 2) 本地回退（兼容旧数据）
    const users = this._users();
    const rec = users[key];
    if (!rec) throw new Error('用户名不存在');

    const stored = rec.password || '';
    if (stored === passwordHash) {
      // 哈希匹配
    } else if (stored === password) {
      // 兼容旧明文密码：验证通过后自动升级为哈希
      rec.password = passwordHash;
      this._saveUsers(users);
    } else {
      throw new Error('密码错误');
    }

    this.user = { id: rec.id, username: rec.username, nickname: rec.username };
    this.session = { access_token: this._makeToken(), expires_at: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60 };
    localStorage.setItem('bedwars_auth', JSON.stringify({ user: this.user, session: this.session, savedAt: Date.now() }));
    return { user: this.user, session: this.session };
  }

  logout() {
    this.user = null;
    this.session = null;
    localStorage.removeItem('bedwars_auth');
  }
}

class RoomNetwork {
  constructor(config, auth) {
    this.config = config;
    this.auth = auth;
    this.client = null;
    this.room = null;
    this.member = null;
    this.members = [];
    this.isMainHost = false;
    this.channel = null;
    this.heartbeatTimer = null;
    this.hostCheckTimer = null;
    this.roomTimeoutTimer = null;
    this.onRoomUpdate = () => {};
    this.onEvent = () => {};
    this.onHostChanged = () => {};
    this.onMembersChanged = () => {};
  }

  get enabled() {
    return !!(this.config.supabaseUrl && this.config.supabaseAnonKey && window.supabase);
  }

  initClient() {
    if (!this.enabled) throw new Error('Supabase 未配置');
    if (!this.client) {
      this.client = window.supabase.createClient(this.config.supabaseUrl, this.config.supabaseAnonKey);
    }
    return this.client;
  }

  makeRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  ensureLoggedIn() {
    if (!this.auth.user) throw new Error('请先登录');
  }

  // ---------- 房间操作 ----------

  async createRoom(roomName = '起床战争房间') {
    this.ensureLoggedIn();
    const client = this.initClient();
    const now = new Date().toISOString();
    const uid = this.auth.user.id;
    let room = null;
    let lastError = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = this.makeRoomCode();
      const roomPayload = {
        name: roomName,
        code,
        host_id: uid,
        host_order: [uid],
        status: 'waiting',
        max_players: 12,
        map_config: { maxTeams: 4, maxPlayersPerTeam: 3 },
        updated_at: now
      };

      const { data, error } = await client.from('rooms').insert(roomPayload).select('*').single();
      if (!error) {
        room = data;
        break;
      }
      lastError = error;
      if (!String(error.message || '').includes('duplicate')) break;
    }

    if (!room) throw new Error(lastError?.message || '创建房间失败');
    this.room = room;
    this.isMainHost = true;
    await this.upsertPlayer({ role: 'host' });
    await this.subscribe();
    await this.refreshPlayers();
    this.startHeartbeat();
    this.startRoomTimeoutCheck();
    localStorage.setItem('bedwars_last_room', JSON.stringify({ code, savedAt: Date.now() }));
    return room;
  }

  async joinRoom(code) {
    this.ensureLoggedIn();
    const client = this.initClient();
    const { data: room, error } = await client
      .from('rooms')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .in('status', ['waiting', 'playing'])
      .single();
    if (error || !room) throw new Error('房间不存在或已结束');

    this.room = room;
    this.isMainHost = room.host_id === this.auth.user.id;
    await this.upsertPlayer({ role: this.isMainHost ? 'host' : 'player' });
    await this.subscribe();
    await this.refreshPlayers();
    if (!this.isMainHost) this.startHostCheck();
    else this.startHeartbeat();
    this.startRoomTimeoutCheck();
    localStorage.setItem('bedwars_last_room', JSON.stringify({ code: room.code, savedAt: Date.now() }));
    return room;
  }

  async reconnectLastRoom() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem('bedwars_last_room') || 'null'); } catch (_) { saved = null; }
    if (!saved?.code || Date.now() - saved.savedAt > 600000) throw new Error('没有可恢复的房间');
    return this.joinRoom(saved.code);
  }

  // ---------- 玩家操作 ----------

  async upsertPlayer({ role }) {
    const client = this.initClient();
    const uid = this.auth.user.id;
    const { data: existing, error: findError } = await client
      .from('room_players')
      .select('*')
      .eq('room_id', this.room.id)
      .eq('player_id', uid)
      .maybeSingle();
    if (findError) throw findError;

    if (existing) {
      const { data, error } = await client
        .from('room_players')
        .update({ role, is_online: true })
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) throw error;
      this.member = data;
      return data;
    }

    const { count } = await client
      .from('room_players')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', this.room.id);

    const payload = {
      room_id: this.room.id,
      player_id: uid,
      team: null,
      role,
      is_ready: false,
      is_online: true,
      join_order: count || 0
    };

    const { data, error } = await client
      .from('room_players')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    this.member = data;
    return data;
  }

  async refreshPlayers() {
    const client = this.initClient();
    const { data, error } = await client
      .from('room_players')
      .select('*')
      .eq('room_id', this.room.id)
      .eq('is_online', true)
      .order('join_order', { ascending: true });
    if (error) throw error;
    this.members = data || [];
    this.onMembersChanged(this.members);
    return this.members;
  }

  async setReady(ready) {
    const client = this.initClient();
    const { error } = await client
      .from('room_players')
      .update({ is_ready: ready })
      .eq('room_id', this.room.id)
      .eq('player_id', this.auth.user.id);
    if (error) throw error;
  }

  async setTeam(team) {
    const client = this.initClient();
    if (team) {
      const { count } = await client
        .from('room_players')
        .select('id', { count: 'exact', head: true })
        .eq('room_id', this.room.id)
        .eq('team', team)
        .eq('is_online', true)
        .neq('player_id', this.auth.user.id);
      if ((count || 0) >= 3) throw new Error('该队伍已满，最多3人');
    }
    const { error } = await client
      .from('room_players')
      .update({ team })
      .eq('room_id', this.room.id)
      .eq('player_id', this.auth.user.id);
    if (error) throw error;
    await this.refreshPlayers();
  }

  async hostSetPlayerTeam(playerId, team) {
    if (!this.isMainHost) throw new Error('只有房主可以变更用户队伍');
    const client = this.initClient();
    if (team) {
      const { count } = await client
        .from('room_players')
        .select('id', { count: 'exact', head: true })
        .eq('room_id', this.room.id)
        .eq('team', team)
        .eq('is_online', true)
        .neq('player_id', playerId);
      if ((count || 0) >= 3) throw new Error('该队伍已满，最多3人');
    }
    const { error } = await client
      .from('room_players')
      .update({ team })
      .eq('room_id', this.room.id)
      .eq('player_id', playerId);
    if (error) throw error;
    await this.sendEvent('room_team_changed', { playerId, team }, 0);
    await this.refreshPlayers();
  }

  async hostKickPlayer(playerId, reason = '房主移出房间') {
    if (!this.isMainHost) throw new Error('只有房主可以踢出用户');
    if (playerId === this.auth.user.id) throw new Error('不能踢出自己');
    const client = this.initClient();
    const { error } = await client
      .from('room_players')
      .update({ is_online: false })
      .eq('room_id', this.room.id)
      .eq('player_id', playerId);
    if (error) throw error;
    await this.sendEvent('room_kick', { playerId, reason }, 0);
    await this.refreshPlayers();
  }

  // ---------- 订阅与实时同步 ----------

  async subscribe() {
    const client = this.initClient();
    if (this.channel) await this.channel.unsubscribe();

    this.channel = client.channel(`room_${this.room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${this.room.id}` }, payload => {
        const oldHost = this.room?.host_id;
        this.room = payload.new;
        this.onRoomUpdate(this.room);
        if (oldHost && this.room.host_id !== oldHost) {
          this.isMainHost = this.room.host_id === this.auth.user.id;
          this.onHostChanged(this.room.host_id);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${this.room.id}` }, () => {
        this.refreshPlayers();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_events', filter: `room_id=eq.${this.room.id}` }, payload => {
        this.onEvent(payload.new);
      })
      .subscribe();
  }

  // ---------- 房主心跳与接管 ----------

  startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(async () => {
      try {
        const client = this.initClient();
        const now = new Date().toISOString();
        await client.from('rooms').update({ updated_at: now }).eq('id', this.room.id);
        // 同时发一个心跳事件，让副房主更精确地检测
        await client.from('game_events').insert({
          room_id: this.room.id,
          player_id: this.auth.user.id,
          event_type: 'heartbeat',
          event_data: { ts: Date.now() },
          tick: 0
        });
      } catch (e) { console.warn('心跳失败', e); }
    }, this.config.heartbeatIntervalMs || 5000);
  }

  startHostCheck() {
    if (this.hostCheckTimer) clearInterval(this.hostCheckTimer);
    this.hostCheckTimer = setInterval(async () => {
      try {
        const client = this.initClient();
        // 检查 rooms.updated_at
        const { data: room } = await client.from('rooms').select('updated_at,host_id,host_order').eq('id', this.room.id).single();
        if (!room) return;
        const lastUpdate = new Date(room.updated_at).getTime();
        const timeout = this.config.hostTimeoutMs || 15000;
        if (Date.now() - lastUpdate < timeout) return; // 主房主正常

        // 主房主掉线，选举新房主
        await this.electNewHost(room);
      } catch (e) { console.warn('房主检测失败', e); }
    }, this.config.heartbeatIntervalMs || 5000);
  }

  startRoomTimeoutCheck() {
    if (this.roomTimeoutTimer) clearInterval(this.roomTimeoutTimer);
    this.roomTimeoutTimer = setInterval(async () => {
      if (!this.room) return;
      const client = this.initClient();
      const { data: room } = await client.from('rooms')
        .select('updated_at')
        .eq('id', this.room.id)
        .single();
      if (!room) {
        // Room already deleted
        this.handleRoomKick('房间已解散');
        return;
      }
      const lastUpdate = new Date(room.updated_at).getTime();
      const now = Date.now();
      const TEN_MINUTES = 10 * 60 * 1000;
      if (now - lastUpdate > TEN_MINUTES) {
        // Auto-dissolve due to inactivity
        await this.sendEvent('room_dissolved', { reason: '房间超过10分钟未活跃，已自动解散' });
        await client.from('room_players').delete().eq('room_id', this.room.id);
        await client.from('game_events').delete().eq('room_id', this.room.id);
        await client.from('rooms').delete().eq('id', this.room.id);
        this.handleRoomKick('房间超过10分钟未活跃，已自动解散');
      }
    }, 30000);
  }

  async electNewHost(room) {
    const client = this.initClient();
    const myId = this.auth.user.id;
    const order = room.host_order || [];

    // 获取当前在线玩家
    const { data: players } = await client
      .from('room_players')
      .select('player_id,role')
      .eq('room_id', this.room.id)
      .eq('is_online', true)
      .order('join_order', { ascending: true });
    if (!players?.length) return;

    // 按 host_order 找到下一个房主候选
    const onlineIds = players.map(p => p.player_id);
    let nextId = null;
    for (const uid of order) {
      if (onlineIds.includes(uid) && uid !== room.host_id) { nextId = uid; break; }
    }
    // 若 host_order 里没有合适的，按 join_order 选第一个在线的
    if (!nextId) nextId = onlineIds.find(id => id !== room.host_id);
    if (!nextId || nextId !== myId) return; // 不是我，等待真正的副房主去更新

    // 我是新房主，更新 rooms
    const newOrder = [...new Set([...order, myId])];
    const { data: updated } = await client
      .from('rooms')
      .update({ host_id: myId, host_order: newOrder, updated_at: new Date().toISOString() })
      .eq('id', this.room.id)
      .eq('host_id', room.host_id) // 乐观锁，防止多客户端同时竞争
      .select('*')
      .single();
    if (updated) {
      this.isMainHost = true;
      this.room = updated;
      this.onHostChanged(myId);
      // 停止检测，开始发心跳
      if (this.hostCheckTimer) { clearInterval(this.hostCheckTimer); this.hostCheckTimer = null; }
      this.startHeartbeat();
      await client.from('room_players').update({ role: 'host' }).eq('room_id', this.room.id).eq('player_id', myId);
    }
  }

  // ---------- 游戏状态 ----------

  async setRoomStatus(status) {
    const client = this.initClient();
    const { data, error } = await client
      .from('rooms')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', this.room.id)
      .select('*')
      .single();
    if (error) throw error;
    this.room = data;
    return data;
  }

  async sendEvent(eventType, eventData, tick = 0) {
    if (!this.isMainHost) return;
    const client = this.initClient();
    const { error } = await client.from('game_events').insert({
      room_id: this.room.id,
      player_id: this.auth.user.id,
      event_type: eventType,
      event_data: eventData,
      tick
    });
    if (error) console.warn('事件发送失败', error);
  }

  // ---------- 离开与清理 ----------

  async leave() {
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; }
    if (this.hostCheckTimer) { clearInterval(this.hostCheckTimer); this.hostCheckTimer = null; }
    if (this.roomTimeoutTimer) { clearInterval(this.roomTimeoutTimer); this.roomTimeoutTimer = null; }
    if (this.channel) { try { await this.channel.unsubscribe(); } catch (_) {} this.channel = null; }

    if (this.room && this.auth.user) {
      try {
        const client = this.initClient();
        await client.from('room_players')
          .update({ is_online: false })
          .eq('room_id', this.room.id)
          .eq('player_id', this.auth.user.id);
        if (this.isMainHost) {
          // 房主离开前先触发一次接管检测机会
          await this.electNewHost(this.room);
        }
      } catch (e) { /* ignore */ }
    }

    this.room = null;
    this.member = null;
    this.members = [];
    this.isMainHost = false;
    localStorage.removeItem('bedwars_last_room');
  }

  async handleRoomKick(reason) {
    await this.leave();
    if (reason) window.game?.showMessage?.('已被踢出：' + reason, '#ff4444');
  }

  async dissolveRoom() {
    if (!this.isMainHost || !this.room) return;
    const client = this.initClient();
    // Send dissolve event to all members
    await this.sendEvent('room_dissolved', { reason: '房主解散了房间' });
    // Delete room players
    await client.from('room_players').delete().eq('room_id', this.room.id);
    // Delete game events
    await client.from('game_events').delete().eq('room_id', this.room.id);
    // Delete room
    await client.from('rooms').delete().eq('id', this.room.id);
    // Clean up local state
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; }
    if (this.hostCheckTimer) { clearInterval(this.hostCheckTimer); this.hostCheckTimer = null; }
    if (this.roomTimeoutTimer) { clearInterval(this.roomTimeoutTimer); this.roomTimeoutTimer = null; }
    if (this.channel) { await this.channel.unsubscribe(); this.channel = null; }
    this.room = null;
    this.member = null;
    this.members = [];
    this.isMainHost = false;
    localStorage.removeItem('bedwars_last_room');
  }
}

// ============================================
// NetworkManager：游戏层统一接口
// ============================================

class NetworkManager {
  constructor(config) {
    this.config = config;
    this.auth = new AuthManager(config);
    this.roomNet = new RoomNetwork(config, this.auth);
    this.lastSent = {};
    this.incoming = [];
    this.snapshotCache = null;
  }

  get loggedIn() { return !!this.auth.user; }
  get inRoom() { return !!this.roomNet.room; }
  get isHost() { return this.roomNet.isMainHost; }
  get roomCode() { return this.roomNet.room?.code; }
  get members() { return this.roomNet.members; }

  async login(phone, password) { return this.auth.login(phone, password); }
  logout() { this.auth.logout(); }

  async createRoom() {
    const room = await this.roomNet.createRoom();
    this.bindRoomEvents();
    return room;
  }

  async joinRoom(code) {
    const room = await this.roomNet.joinRoom(code);
    this.bindRoomEvents();
    return room;
  }

  async reconnect() {
    const room = await this.roomNet.reconnectLastRoom();
    this.bindRoomEvents();
    return room;
  }

  async setMyTeam(team) {
    return this.roomNet.setTeam(team);
  }

  async hostSetPlayerTeam(playerId, team) {
    return this.roomNet.hostSetPlayerTeam(playerId, team);
  }

  async hostKickPlayer(playerId, reason) {
    return this.roomNet.hostKickPlayer(playerId, reason);
  }

  async dissolveRoom() {
    return this.roomNet.dissolveRoom();
  }

  bindRoomEvents() {
    this.roomNet.onRoomUpdate = (room) => {
      if (window.game) window.game.onNetworkRoomUpdate?.(room);
    };
    this.roomNet.onEvent = (evt) => {
      if (evt.event_type === 'player_state') {
        this.incoming.push(evt);
      } else if (evt.event_type === 'snapshot') {
        this.snapshotCache = evt.event_data;
        if (window.game) window.game.onNetworkSnapshot?.(evt.event_data);
      } else if (evt.event_type === 'bed_destroyed') {
        if (window.game) window.game.onNetworkBedDestroyed?.(evt.event_data.teamKey, evt.event_data.destroyerId);
      } else if (evt.event_type === 'player_killed') {
        if (window.game) window.game.onNetworkPlayerKilled?.(evt.event_data.victimId, evt.event_data.killerId);
      } else if (evt.event_type === 'game_over') {
        if (window.game) window.game.onNetworkGameOver?.(evt.event_data.winner);
      }
    };
    this.roomNet.onHostChanged = (hostId) => {
      console.log('房主切换为', hostId);
      if (window.game) window.game.showMessage?.('房主已切换');
    };
    this.roomNet.onMembersChanged = (members) => {
      if (window.game) window.game.onNetworkMembers?.(members);
    };
  }

  sendPlayerState(id, state) {
    if (!this.isHost) return;
    const key = `${id}_state`;
    if (JSON.stringify(this.lastSent[key]) === JSON.stringify(state)) return;
    this.lastSent[key] = state;
    return this.roomNet.sendEvent('player_state', { id, state });
  }

  sendSnapshot(data) {
    if (!this.isHost) return;
    return this.roomNet.sendEvent('snapshot', data);
  }

  sendBedDestroyed(teamKey, destroyerId) {
    if (!this.isHost) return;
    return this.roomNet.sendEvent('bed_destroyed', { teamKey, destroyerId });
  }

  sendPlayerKilled(victimId, killerId) {
    if (!this.isHost) return;
    return this.roomNet.sendEvent('player_killed', { victimId, killerId });
  }

  sendGameOver(winner) {
    if (!this.isHost) return;
    return this.roomNet.sendEvent('game_over', { winner });
  }

  async leaveRoom() {
    await this.roomNet.leave();
  }

  // Admin command broadcast (for game clients to receive)
  subscribeAdminCommands(callback) {
    if (!this.roomNet?.client) return;
    const client = this.roomNet.client;
    const channel = client.channel('admin_broadcast')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_events', filter: "room_id=eq.broadcast" }, payload => {
        callback(payload.new);
      })
      .subscribe();
    return channel;
  }

  // Report player economy log
  async logEconomy(playerId, eventType, currency, amount, itemKey, pos, tick) {
    if (!this.roomNet?.client) return;
    await this.roomNet.client.from('player_economy_logs').insert({
      player_id: playerId,
      room_id: this.roomNet.room?.id || 'local',
      event_type: eventType,
      currency: currency || null,
      amount: amount || null,
      item_key: itemKey || null,
      tick: tick || 0,
      pos_x: pos?.x || 0,
      pos_y: pos?.y || 0,
      pos_z: pos?.z || 0
    }).catch(()=>{});
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthManager, RoomNetwork, NetworkManager };
}
