// ============================================
// 筑梦激斗（3D起床战争）- UI管理器
// 负责HUD、快捷栏、商店、背包、小地图、成长中心等所有游戏内界面
// ============================================

class UIManager {
  /**
   * @param {object} game - Game实例引用
   */
  constructor(game) {
    /** @type {object} Game实例 */
    this.game = game;

    /** @type {boolean} 商店是否打开 */
    this.shopOpen = false;

    /** @type {string} 当前商店标签页 */
    this.shopTab = 'blocks';

    /** @type {number} 小地图更新节流计时（毫秒） */
    this._minimapThrottle = 0;

    /** @type {number} 小地图刷新间隔（毫秒） */
    this._minimapInterval = 200;

    /** @type {number|null} 大地图动画帧ID */
    this._bigMapRafId = null;
  }

  // ============================================
  // 主更新循环 - 每帧调用
  // ============================================
  update() {
    const p = this.game.localPlayer;

    // 本地玩家存在且未死亡 → 更新各项HUD
    if (p && !p.isDead) {
      this._updateHpBar(p);
      this._updateArmorBar(p);
      this._updateResources(p);
      this._updateHotbar(p);
      this._updateMinimapThrottled(p);
    } else {
      // 玩家不存在或已死亡 → 更新复活倒计时
      this._updateRespawnCountdown(p);
    }
  }

  // ============================================
  // HUD 子模块：血条
  // ============================================
  _updateHpBar(p) {
    const fill = document.getElementById('hpFill');
    const text = document.getElementById('hpText');
    if (!fill || !text) return;

    const hp = Math.max(0, p.hp || 0);
    const maxHp = Math.max(1, p.maxHp || 100);
    const pct = Math.min(100, (hp / maxHp) * 100);

    fill.style.width = pct + '%';
    text.textContent = Math.ceil(hp) + '/' + Math.ceil(maxHp);
  }

  // ============================================
  // HUD 子模块：护甲条
  // ============================================
  _updateArmorBar(p) {
    const fill = document.getElementById('armorFill');
    const text = document.getElementById('armorText');
    if (!fill || !text) return;

    const armor = Math.max(0, p.armor || 0);
    const maxArmor = Math.max(1, p.maxArmor || 100);
    const pct = Math.min(100, (armor / maxArmor) * 100);

    fill.style.width = pct + '%';
    text.textContent = Math.ceil(armor);
  }

  // ============================================
  // HUD 子模块：资源显示（铜/银/金/玉）
  // ============================================
  _updateResources(p) {
    const inv = p.inv;
    if (!inv) return;

    const elCopper = document.getElementById('resCopper');
    const elSilver = document.getElementById('resSilver');
    const elGold = document.getElementById('resGold');
    const elJade = document.getElementById('resJade');

    if (elCopper) elCopper.textContent = inv.copper || 0;
    if (elSilver) elSilver.textContent = inv.silver || 0;
    if (elGold) elGold.textContent = inv.gold || 0;
    if (elJade) elJade.textContent = inv.jade || 0;
  }

  // ============================================
  // HUD 子模块：快捷栏（8格）
  // ============================================
  _updateHotbar(p) {
    const hotbar = p.hotbar;
    if (!hotbar) return;

    for (let i = 0; i < 8; i++) {
      const slotEl = document.getElementById('slot' + i);
      if (!slotEl) continue;

      const nameEl = slotEl.querySelector('.slot-name');
      const countEl = slotEl.querySelector('.slot-count');

      const item = hotbar[i];
      if (item && item.key) {
        const info = ITEM_DB[item.key];
        if (nameEl) {
          nameEl.textContent = info ? info.name : item.key;
        }
        if (countEl) {
          // 堆叠数大于1时显示数量
          countEl.textContent = (item.count > 1) ? item.count : '';
        }
      } else {
        if (nameEl) nameEl.textContent = '';
        if (countEl) countEl.textContent = '';
      }
    }
  }

  // ============================================
  // 小地图节流更新
  // ============================================
  _updateMinimapThrottled(p) {
    this._minimapThrottle += 16; // 大约每帧16ms
    if (this._minimapThrottle >= this._minimapInterval) {
      this._minimapThrottle = 0;
      this.drawMinimap();
    }
  }

  // ============================================
  // HUD 子模块：死亡复活倒计时
  // ============================================
  _updateRespawnCountdown(p) {
    const overlay = document.getElementById('deathOverlay');
    const countdownEl = document.getElementById('respawnCountdown');

    if (!p || !p.isDead) {
      // 玩家存活，隐藏死亡遮罩
      if (overlay) overlay.style.display = 'none';
      return;
    }

    // 显示死亡遮罩
    if (overlay) overlay.style.display = 'flex';

    // 从matchStats获取复活倒计时
    const respawnTimer = (p.matchStats && p.matchStats.respawnTimer != null)
      ? p.matchStats.respawnTimer
      : 0;

    if (countdownEl) {
      const secs = Math.ceil(Math.max(0, respawnTimer));
      countdownEl.textContent = '还剩 ' + secs + ' 秒复活';
    }
  }

  // ============================================
  // 商店：按类别构建商品HTML
  // ============================================
  buildShop() {
    const shopBody = document.getElementById('shopBody');
    if (!shopBody) return;

    // 按类别分组商品
    const categories = {
      blocks:   { label: '建筑', items: [] },
      weapons:  { label: '武器', items: [] },
      armor:    { label: '防具', items: [] },
      specials: { label: '特殊', items: [] }
    };

    for (const [key, info] of Object.entries(ITEM_DB)) {
      // 跳过无价格的物品（杀手专属、碎片等）
      if (!info.cost || Object.keys(info.cost).length === 0) continue;
      // 跳过弹药类（箭矢通常不单独在商店卖）
      if (info.type === 'ammo') continue;

      const cat = info.type === 'block'  ? 'blocks'
                : info.type === 'weapon' ? 'weapons'
                : info.type === 'armor'  ? 'armor'
                : 'specials';

      if (categories[cat]) {
        categories[cat].items.push({ key, info });
      }
    }

    // 生成价格文本
    const costText = (cost) => {
      const parts = [];
      const names = { copper: '铜', silver: '银', gold: '金', jade: '玉' };
      for (const [currency, amount] of Object.entries(cost)) {
        parts.push((names[currency] || currency) + amount);
      }
      return parts.join(' ');
    };

    // 渲染当前标签页
    const renderTab = (tabKey) => {
      const cat = categories[tabKey];
      if (!cat) { shopBody.innerHTML = ''; return; }

      let html = '';
      for (const { key, info } of cat.items) {
        html += '<div class="shop-item">'
          + '<div class="shop-item-name">' + (info.name || key) + '</div>'
          + '<div class="shop-item-desc">' + (info.desc || '') + '</div>'
          + '<div class="shop-item-price">' + costText(info.cost) + '</div>'
          + '<button class="shop-buy-btn" data-buy-key="' + key + '">购买</button>'
          + '</div>';
      }
      shopBody.innerHTML = html;
    };

    // 渲染初始标签页
    renderTab(this.shopTab);

    // 绑定标签切换事件
    const shopPanel = document.getElementById('shopPanel');
    if (!shopPanel) return;

    const tabs = shopPanel.querySelectorAll('.shop-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.shopTab = tab.getAttribute('data-tab') || 'blocks';
        renderTab(this.shopTab);
      });
    });
  }

  // ============================================
  // 背包面板更新
  // ============================================
  updateBackpack() {
    const grid = document.getElementById('backpackGrid');
    if (!grid) return;

    const p = this.game.localPlayer;
    if (!p) {
      grid.innerHTML = '<div style="color:#888;">未连接玩家数据</div>';
      return;
    }

    const backpack = p.backpack || [];
    const hotbar = p.hotbar || [];

    let html = '';

    // 显示快捷栏物品
    html += '<div class="bp-section-title">快捷栏</div>';
    html += '<div class="bp-grid-row">';
    for (let i = 0; i < 8; i++) {
      const item = hotbar[i];
      if (item && item.key) {
        const info = ITEM_DB[item.key];
        html += '<div class="bp-item">'
          + '<div class="bp-item-name">' + (info ? info.name : item.key) + '</div>'
          + '<div class="bp-item-count">' + (item.count || 1) + '</div>'
          + '</div>';
      } else {
        html += '<div class="bp-item empty"></div>';
      }
    }
    html += '</div>';

    // 显示背包物品
    if (backpack.length > 0) {
      html += '<div class="bp-section-title">背包物品</div>';
      html += '<div class="bp-grid-row">';
      for (const item of backpack) {
        if (item && item.key) {
          const info = ITEM_DB[item.key];
          html += '<div class="bp-item">'
            + '<div class="bp-item-name">' + (info ? info.name : item.key) + '</div>'
            + '<div class="bp-item-count">' + (item.count || 1) + '</div>'
            + '</div>';
        }
      }
      html += '</div>';
    }

    // 背包为空的提示
    if (backpack.length === 0) {
      html += '<div class="bp-section-title">背包物品</div>';
      html += '<div style="color:#666;font-size:12px;padding:8px;">背包为空</div>';
    }

    grid.innerHTML = html;
  }

  // ============================================
  // 成长中心面板（简化版）
  // ============================================
  renderGrowthCenter() {
    const body = document.getElementById('growthBody');
    if (!body) return;

    const p = this.game.localPlayer;
    const growth = this.game.growth;

    // 基础信息
    const level = p ? (p.matchLevel || 1) : 1;
    const team = p ? p.team : null;
    const role = p ? p.role : null;

    // 队伍名称
    let teamName = '未分配';
    if (team && TEAMS[team]) {
      teamName = TEAMS[team].name;
    }

    // 角色名称
    let roleName = '未选择';
    if (role && ROLES[role]) {
      roleName = ROLES[role].name;
    }

    // 段位信息（从成长系统获取，若无则显示默认）
    let rankName = '新兵';
    let xpCurrent = 0;
    let xpMax = 100;
    let xpPercent = 0;

    if (growth) {
      rankName = growth.rankName || '新兵';
      xpCurrent = growth.xp || 0;
      xpMax = Math.max(1, growth.xpToNext || 100);
      xpPercent = Math.min(100, (xpCurrent / xpMax) * 100);
    }

    let html = '';

    // 等级与段位卡片
    html += '<div class="growth-overview">';
    html += '<div class="growth-rank-card">';
    html += '<div class="rank-icon">' + rankName.charAt(0) + '</div>';
    html += '<div class="rank-info">';
    html += '<div class="rank-name">' + rankName + '</div>';
    html += '<div class="rank-detail">等级 ' + level + ' · ' + teamName + ' · ' + roleName + '</div>';
    html += '</div>';
    html += '</div>';

    // 经验条
    html += '<div class="growth-xp-section">';
    html += '<div class="growth-xp-label">经验进度</div>';
    html += '<div class="growth-xp-bar">';
    html += '<div class="growth-xp-fill" style="width:' + xpPercent + '%;"></div>';
    html += '</div>';
    html += '<div class="growth-xp-text">' + xpCurrent + ' / ' + xpMax + '</div>';
    html += '</div>';
    html += '</div>';

    body.innerHTML = html;
  }

  // ============================================
  // 大地图开关
  // ============================================
  toggleBigMap(show) {
    const panel = document.getElementById('bigMapPanel');
    if (!panel) return;

    if (show) {
      panel.style.display = 'block';
      this.drawBigMap();
    } else {
      panel.style.display = 'none';
      // 取消大地图动画帧（如果有）
      if (this._bigMapRafId != null) {
        cancelAnimationFrame(this._bigMapRafId);
        this._bigMapRafId = null;
      }
    }
  }

  // ============================================
  // 小地图绘制（canvas，俯视图）
  // ============================================
  drawMinimap() {
    const canvas = document.getElementById('minimapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    if (w <= 0 || h <= 0) return;

    const p = this.game.localPlayer;
    const players = this.game.players || [];
    const blocks = this.game.engine ? this.game.engine.blocks : null;

    // 地图参数
    const mapScale = 0.4;   // 世界坐标到小地图像素的缩放比
    const mapCenter = w / 2; // 小地图中心

    // 清空画布
    ctx.clearRect(0, 0, w, h);

    // 绘制背景
    ctx.fillStyle = 'rgba(10, 10, 30, 0.8)';
    ctx.fillRect(0, 0, w, h);

    // 如果有本地玩家，以其位置为地图中心
    const cx = p ? (p.pos ? p.pos.x : 0) : 0;
    const cz = p ? (p.pos ? p.pos.z : 0) : 0;

    // 绘制方块（简化：只绘制建筑类方块，抽样绘制避免性能问题）
    if (blocks && blocks.size > 0) {
      ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
      let drawn = 0;
      const maxBlocks = 200; // 最多绘制200个方块点，防止卡顿
      for (const [, blk] of blocks) {
        if (drawn >= maxBlocks) break;
        // 解析方块坐标
        const bx = blk.x || 0;
        const bz = blk.z || 0;
        const px = mapCenter + (bx - cx) * mapScale;
        const pz = mapCenter + (bz - cz) * mapScale;

        // 只绘制可见范围内的方块
        if (px < 0 || px > w || pz < 0 || pz > h) continue;

        // 根据方块类型选择颜色
        const typeColor = this._getBlockMinimapColor(blk.type);
        ctx.fillStyle = typeColor;
        ctx.fillRect(px - 1, pz - 1, 2, 2);
        drawn++;
      }
    }

    // 绘制其他玩家位置
    for (const pl of players) {
      if (!pl || !pl.pos || pl.isDead) continue;
      if (pl === p) continue; // 本地玩家单独绘制

      const px = mapCenter + (pl.pos.x - cx) * mapScale;
      const pz = mapCenter + (pl.pos.z - cz) * mapScale;

      // 超出小地图范围则不绘制
      if (px < 0 || px > w || pz < 0 || pz > h) continue;

      // 队伍颜色
      const teamColor = this._getTeamHex(pl.team);
      ctx.fillStyle = teamColor;
      ctx.beginPath();
      ctx.arc(px, pz, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 绘制本地玩家（中心白色圆点 + 方向指示）
    if (p && p.pos) {
      const localX = mapCenter;
      const localZ = mapCenter;

      // 白色圆点
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(localX, localZ, 4, 0, Math.PI * 2);
      ctx.fill();

      // 朝向指示线
      const forward = p.getForwardDir ? p.getForwardDir() : null;
      if (forward) {
        const dirLen = 8;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(localX, localZ);
        ctx.lineTo(
          localX + forward.x * dirLen,
          localZ + forward.z * dirLen
        );
        ctx.stroke();
      }
    }

    // 绘制边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, h);
  }

  // ============================================
  // 大地图绘制（canvas，俯视图，更大更详细）
  // ============================================
  drawBigMap() {
    const canvas = document.getElementById('bigMapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    if (w <= 0 || h <= 0) return;

    const p = this.game.localPlayer;
    const players = this.game.players || [];
    const blocks = this.game.engine ? this.game.engine.blocks : null;

    // 大地图参数：显示更大范围
    const mapScale = 1.8;
    const mapCenter = w / 2;

    // 清空画布
    ctx.clearRect(0, 0, w, h);

    // 绘制背景
    ctx.fillStyle = 'rgba(10, 10, 30, 0.9)';
    ctx.fillRect(0, 0, w, h);

    // 绘制网格线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 20 * mapScale; // 每20格一条线
    const cx = p ? (p.pos ? p.pos.x : 0) : 0;
    const cz = p ? (p.pos ? p.pos.z : 0) : 0;

    const offsetX = (cx * mapScale) % gridSize;
    const offsetZ = (cz * mapScale) % gridSize;

    for (let x = -gridSize + offsetX; x < w + gridSize; x += gridSize) {
      const sx = mapCenter - (cx * mapScale) + x + (cx * mapScale - offsetX);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }
    for (let z = -gridSize + offsetZ; z < h + gridSize; z += gridSize) {
      const sz = mapCenter - (cz * mapScale) + z + (cz * mapScale - offsetZ);
      ctx.beginPath();
      ctx.moveTo(0, sz);
      ctx.lineTo(w, sz);
      ctx.stroke();
    }

    // 绘制方块
    if (blocks && blocks.size > 0) {
      let drawn = 0;
      const maxBlocks = 800;
      for (const [, blk] of blocks) {
        if (drawn >= maxBlocks) break;
        const bx = blk.x || 0;
        const bz = blk.z || 0;
        const px = mapCenter + (bx - cx) * mapScale;
        const pz = mapCenter + (bz - cz) * mapScale;

        if (px < 0 || px > w || pz < 0 || pz > h) continue;

        const typeColor = this._getBlockMinimapColor(blk.type);
        ctx.fillStyle = typeColor;
        ctx.fillRect(px - 2, pz - 2, 4, 4);
        drawn++;
      }
    }

    // 绘制所有玩家
    for (const pl of players) {
      if (!pl || !pl.pos || pl.isDead) continue;

      const px = mapCenter + (pl.pos.x - cx) * mapScale;
      const pz = mapCenter + (pl.pos.z - cz) * mapScale;

      if (px < 0 || px > w || pz < 0 || pz > h) continue;

      const isLocal = (pl === p);
      const teamColor = this._getTeamHex(pl.team);

      // 玩家圆点
      ctx.fillStyle = isLocal ? '#ffffff' : teamColor;
      ctx.beginPath();
      ctx.arc(px, pz, isLocal ? 6 : 5, 0, Math.PI * 2);
      ctx.fill();

      // 本地玩家外圈
      if (isLocal) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, pz, 8, 0, Math.PI * 2);
        ctx.stroke();

        // 朝向指示
        const forward = pl.getForwardDir ? pl.getForwardDir() : null;
        if (forward) {
          const dirLen = 14;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, pz);
          ctx.lineTo(px + forward.x * dirLen, pz + forward.z * dirLen);
          ctx.stroke();
        }
      }

      // 非本地玩家显示名称
      if (!isLocal && pl.name) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pl.name, px, pz - 8);
      }
    }

    // 绘制边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, w, h);
  }

  // ============================================
  // 工具方法：获取队伍十六进制颜色
  // ============================================
  _getTeamHex(team) {
    if (team && TEAMS[team]) {
      return TEAMS[team].hex || '#ffffff';
    }
    return '#aaaaaa';
  }

  // ============================================
  // 工具方法：获取方块在小地图上的颜色
  // ============================================
  _getBlockMinimapColor(type) {
    // 从ITEM_DB获取方块信息来确定颜色
    if (type && ITEM_DB[type]) {
      const info = ITEM_DB[type];
      // 方块类型对应的颜色映射
      if (type === 'wood_plank')   return 'rgba(160, 120, 60, 0.7)';
      if (type === 'stone_plate')  return 'rgba(130, 130, 140, 0.7)';
      if (type === 'iron_plate')   return 'rgba(180, 190, 200, 0.8)';
      if (type === 'titanium')     return 'rgba(100, 200, 255, 0.9)';
      if (type === 'blast_glass')  return 'rgba(200, 230, 255, 0.5)';
    }
    return 'rgba(150, 150, 150, 0.5)';
  }
}