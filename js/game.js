// ============================================
// 筑梦激斗（3D起床战争）- Game 核心类
// 输入管理器已提取到 input.js，UI管理器已提取到 ui.js
// ============================================

class Game {
  constructor(options = {}) {
    this.engine = null;
    this.gens = [];
    this.players = [];
    this.localPlayer = null;
    this.gameTime = 0;
    this.gameActive = false;
    this.lastTime = 0;
    // 缩圈相关
    this.shrinkTimer = 1500;
    this.shrinkActive = false;
    this.shrinkRadius = 125;
    this.shrinkInitialRadius = 125;
    this.nextDreamTide = 300;
    // 输入（在 init 中创建）
    this.input = null;
    // 子系统
    this.ai = null;
    this.ui = null;
    this.growth = null;
    this.social = null;
    // UI数据
    this.killFeed = [];
    this._timeouts = [];
    this.shrinkBoundary = null;
    this.shopDirty = true;
    // 网络与联机
    this.network = options.network || null;
    this.onlineMode = !!options.onlineMode;
    this.playerName = options.playerName || '你';
    // 上报计时器
    this.tick = 0;
    this.matchSnapshotTimer = 0;
    this.economyLogTimer = 0;
    // 面板状态
    this.growthPanelOpen = false;
    this.roleSelectionActive = false;
    this.roleSelectionTimer = 0;
    this.roleChosen = false;
    // 建造面板
    this.selectedBlockKey = null;
    this.movingBlockKey = null;
    // 地图与模式
    this.selectedMap = 'classic';
    this.isCampusMode = false;
    this.genLabels = [];
    // 性能
    this._fpsFrames = 0;
    this._fpsTime = 0;
    this._rafId = null;
  }

  // ============================================
  // 初始化
  // ============================================

  init() {
    // 1. 获取画布容器
    const container = document.getElementById('gameCanvas');
    if (!container) { console.error('找不到 #gameCanvas'); return; }

    // 2. 创建引擎
    this.engine = new Engine(container);

    // 3. 生成世界
    this.gens = generateWorld(this.engine, this.selectedMap);

    // 4. 创建子系统
    this.growth = new GrowthManager(this);
    this.social = new SocialManager(this);
    this.ui = new UIManager(this);
    this.ai = { init: (game) => { AIManager.controllers = []; AIManager.activeCount = 0; } };

    // 5. 创建输入管理器
    this.input = new InputManager();

    // 6. 商店标签事件
    const shopTabs = document.querySelectorAll('.shop-tab');
    shopTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        shopTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.ui.shopTab = tab.getAttribute('data-tab') || 'blocks';
        this.ui.buildShop();
      });
    });

    // 7. 按钮事件（null安全检查）
    const shopClose = document.querySelector('.shop-close');
    if (shopClose) shopClose.addEventListener('click', () => this.toggleShop());

    const shopBtn = document.getElementById('shopBtn');
    if (shopBtn) {
      shopBtn.addEventListener('click', () => this.toggleShop());
      shopBtn.addEventListener('touchend', () => this.toggleShop());
    }

    const backpackBtn = document.getElementById('backpackBtn');
    if (backpackBtn) {
      backpackBtn.addEventListener('click', () => this.toggleBackpack());
      backpackBtn.addEventListener('touchend', () => this.toggleBackpack());
    }

    const growthBtn = document.getElementById('growthBtn');
    if (growthBtn) growthBtn.addEventListener('click', () => this.toggleGrowthPanel());

    // 8. 快捷栏点击事件
    const hotbarSlots = document.querySelectorAll('.hotbar-slot');
    hotbarSlots.forEach((slot, idx) => {
      slot.addEventListener('click', () => this.selectHotbar(idx));
      slot.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showSlotContextMenu(slot, idx);
      });
    });

    // 9. 建造面板按钮
    const upgradeBtn = document.getElementById('upgradeBuildBtn');
    if (upgradeBtn) upgradeBtn.addEventListener('click', () => this.upgradeSelectedBlock());
    const destroyBtn = document.getElementById('destroyBuildBtn');
    if (destroyBtn) destroyBtn.addEventListener('click', () => this.destroySelectedBlock());
    const moveBtn = document.getElementById('moveBuildBtn');
    if (moveBtn) moveBtn.addEventListener('click', () => this.prepareMoveSelectedBlock());

    // 10. 启动渲染循环
    this.lastTime = performance.now();
    this._rafId = requestAnimationFrame((t) => this.loop(t));
  }

  // ============================================
  // 开始游戏
  // ============================================

  start(teamKey, roleKey, mode = 'classic') {
    // 重置游戏状态
    this.gameActive = true;
    this.gameTime = 0;
    this.shrinkTimer = GAME_RULES.shrinkStartTime || 1500;
    this.shrinkActive = false;
    this.shrinkRadius = GAME_RULES.shrinkInitialRadius || 125;
    this.shrinkInitialRadius = this.shrinkRadius;
    this.nextDreamTide = GAME_RULES.dreamTideInterval || 300;
    this.tick = 0;
    this.matchSnapshotTimer = 5;
    this.economyLogTimer = 30;
    this.killFeed = [];
    this.selectedBlockKey = null;
    this.movingBlockKey = null;
    this.shopDirty = true;
    this.isCampusMode = false;
    this.campusMode = null;

    // 重置所有队伍的床状态
    for (const t of Object.values(TEAMS)) {
      t.bedAlive = true;
      if (t.bedMesh) t.bedMesh.visible = true;
    }

    // 清除旧玩家和击杀信息
    this.players = [];
    AIManager.controllers = [];
    AIManager.activeCount = 0;
    const killFeedEl = document.getElementById('killFeed');
    if (killFeedEl) killFeedEl.innerHTML = '';

    // 隐藏所有面板
    this._hideAllPanels();

    // 隐藏主菜单
    const mainMenu = document.getElementById('mainMenu');
    if (mainMenu) mainMenu.style.display = 'none';

    // 按模式分发
    if (mode === 'campus') {
      return this._startCampusMode();
    }
    this._startClassicMode(teamKey, roleKey);
  }

  /** 隐藏所有面板 */
  _hideAllPanels() {
    const ids = [
      'shopPanel', 'backpackPanel', 'growthPanel', 'buildPanel',
      'socialPanel', 'markWheel', 'teamChestPanel', 'bigMapPanel',
      'postMatchGallery', 'slotContextMenu', 'startRolePanel',
      'campusHud', 'workshopPanel'
    ];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    }
  }

  // ============================================
  // 经典模式启动
  // ============================================

  _startClassicMode(teamKey, roleKey) {
    // 显示HUD
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = '';
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = '';

    // 随机角色列表
    const roleKeys = Object.keys(ROLES);

    // 遍历4队生成玩家
    for (const [tKey, tInfo] of Object.entries(TEAMS)) {
      const isLocal = (tKey === teamKey);
      const rKey = isLocal ? roleKey : roleKeys[Math.floor(Math.random() * roleKeys.length)];
      const name = isLocal ? this.playerName : (tInfo.name + '玩家');
      const entity = new PlayerEntity(this.engine, tKey, rKey, isLocal, name);
      entity.pos = tInfo.spawn.clone();
      // 朝向地图中心
      entity.yaw = Math.atan2(-tInfo.spawn.x, -tInfo.spawn.z);
      this.players.push(entity);

      if (isLocal) {
        this.localPlayer = entity;
        entity.isFrozen = true;
      } else {
        // AI接管
        entity.aiTakeover = true;
        entity.isAI = true;
        entity.inv.copper = 10 + Math.floor(Math.random() * 20);
        const ctrl = new AIController(entity, this.engine, this);
        AIManager.controllers.push(ctrl);
        AIManager.activeCount++;
      }
    }

    // 相机跟随本地玩家
    if (this.localPlayer) {
      this.engine.cameraOffset = new THREE.Vector3(0, 4, 8);
    }

    // AI初始化
    if (this.ai && this.ai.init) this.ai.init(this);

    // 社交系统初始化
    if (this.social && this.social.initMatch) this.social.initMatch();

    // 开始角色选择
    this.beginRoleSelection();

    // 网络同步：设置房间状态为playing
    if (this.network && this.network.roomNet && this.network.roomNet.room) {
      this.network.roomNet.setRoomStatus('playing').catch(() => {});
    }
  }

  // ============================================
  // 校园寻宝模式
  // ============================================

  _startCampusMode() {
    // 显示/隐藏对应HUD
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = '';
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'none';
    const skillBtn = document.getElementById('skillBtn');
    if (skillBtn) skillBtn.style.display = 'none';
    const resourceBar = document.getElementById('resourceBar');
    if (resourceBar) resourceBar.style.display = 'none';
    const teamInfo = document.getElementById('teamInfo');
    if (teamInfo) teamInfo.style.display = 'none';
    const hotbar = document.getElementById('hotbar');
    if (hotbar) hotbar.style.display = 'none';
    const shopBtn = document.getElementById('shopBtn');
    if (shopBtn) shopBtn.style.display = 'none';

    // 确保移动端控件
    this.input._ensureMobileControls();
    this.isCampusMode = true;

    // 显示校园职业选择
    this._showCampusCareerSelection();
  }

  /** 显示校园模式职业选择 */
  _showCampusCareerSelection() {
    const panel = document.getElementById('startRolePanel');
    const cards = document.getElementById('startRoleCards');
    if (!panel || !cards) return;

    panel.style.display = '';
    panel.querySelector('h2').textContent = '选择你的校园职业';
    const desc = panel.querySelector('p');
    if (desc) desc.textContent = '选择一个职业开始校园寻宝';

    let html = '';
    for (const [key, career] of Object.entries(CAREERS)) {
      const hexColor = '#' + career.color.toString(16).padStart(6, '0');
      html += '<div class="role-card" data-career="' + key + '">'
        + '<div class="role-card-color" style="background:' + hexColor + '">' + career.code + '</div>'
        + '<div class="role-card-name">' + career.name + '</div>'
        + '<div class="role-card-passive">' + career.passive.name + '：' + career.passive.desc + '</div>'
        + '<div class="role-card-active">' + career.active.name + '：' + career.active.desc + '</div>'
        + '</div>';
    }
    cards.innerHTML = html;

    // 隐藏分类栏
    const catBar = document.getElementById('roleCatBar');
    if (catBar) catBar.style.display = 'none';

    // 绑定点击事件
    cards.querySelectorAll('.role-card').forEach(card => {
      card.addEventListener('click', () => {
        const careerKey = card.getAttribute('data-career');
        this._startCampusWithCareer(careerKey);
      });
    });
  }

  /** 用选择的职业启动校园模式 */
  _startCampusWithCareer(careerKey) {
    // 隐藏角色选择面板
    const panel = document.getElementById('startRolePanel');
    if (panel) panel.style.display = 'none';

    // 创建CampusMode实例
    this.campusMode = new CampusMode(this.engine, {});

    // 生成校园地图
    const mapGen = new CampusMapGenerator(this.engine.scene);
    mapGen.generate();

    // 初始化校园模式
    this.campusMode.init(careerKey, this.playerName);

    // 绑定事件
    this.campusMode.onEvent = (type, text) => {
      this.showMessage(text, type === 'blackout' ? '#333366' : '#ffaa00');
      const eventEl = document.getElementById('campusEvent');
      if (eventEl) eventEl.textContent = text;
    };
    this.campusMode.onPickup = (kind, key, info) => {
      this.showMessage('拾取了 ' + (info.name || key), '#8be9fd');
    };
    this.campusMode.onEnd = (success, reason, player) => {
      this.endCampusMode(success, reason, player);
    };

    // 显示校园HUD
    const campusHud = document.getElementById('campusHud');
    if (campusHud) campusHud.style.display = '';
  }

  /** 校园模式结束 */
  endCampusMode(success, reason, player) {
    this.gameActive = false;
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }

    // 清理校园模式
    if (this.campusMode) {
      this.campusMode.dispose();
      this.campusMode = null;
    }

    // 清理timeout
    for (const t of this._timeouts) clearTimeout(t);
    this._timeouts = [];

    // 显示结算
    const screen = document.getElementById('gameOverScreen');
    if (screen) {
      screen.style.display = '';
      const titleEl = screen.querySelector('.result-title');
      if (titleEl) titleEl.textContent = success ? '寻宝成功！' : '寻宝失败';
      const winnerEl = screen.querySelector('.winner');
      if (winnerEl) winnerEl.textContent = reason || '';
    }
  }

  /** 更新校园HUD */
  _updateCampusHud() {
    if (!this.campusMode || !this.campusMode.localPlayer) return;
    const lp = this.campusMode.localPlayer;
    const cm = this.campusMode;

    const timerEl = document.getElementById('campusTimer');
    if (timerEl) {
      const remaining = Math.max(0, Math.floor(cm.maxTime - cm.gameTime));
      const min = Math.floor(remaining / 60);
      const sec = remaining % 60;
      timerEl.textContent = min + ':' + (sec < 10 ? '0' : '') + sec;
    }

    const statusEl = document.getElementById('campusStatus');
    if (statusEl) statusEl.textContent = lp.isDead ? '已阵亡' : '存活';

    const weightEl = document.getElementById('campusWeight');
    if (weightEl) weightEl.textContent = '负重 ' + Math.floor(lp.totalWeight);
  }

  // ============================================
  // 角色选择
  // ============================================

  beginRoleSelection() {
    this.roleSelectionActive = true;
    this.roleSelectionTimer = 10;
    this.roleChosen = false;
    if (this.localPlayer) this.localPlayer.isFrozen = true;

    const panel = document.getElementById('startRolePanel');
    const cards = document.getElementById('startRoleCards');
    if (!panel || !cards) return;

    panel.style.display = '';

    // 动态生成角色卡片
    let html = '';
    const categories = {};
    for (const [key, role] of Object.entries(ROLES)) {
      const cat = role.category || '其他';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push({ key, ...role });
    }

    for (const [catName, roles] of Object.entries(categories)) {
      html += '<div class="role-cat-label">' + catName + '</div><div class="role-cat-row">';
      for (const r of roles) {
        html += '<div class="role-card ' + r.skinClass + '" data-role="' + r.key + '">'
          + '<div class="role-card-name">' + r.name + '</div>'
          + '<div class="role-card-hp">HP: ' + r.hp + '</div>'
          + '<div class="role-card-passive">' + r.passive.name + '：' + r.passive.desc + '</div>'
          + '<div class="role-card-active">' + r.active.name + '：' + r.active.desc + '</div>'
          + '</div>';
      }
      html += '</div>';
    }
    cards.innerHTML = html;

    // 绑定卡片点击
    cards.querySelectorAll('.role-card').forEach(card => {
      card.addEventListener('click', () => {
        const roleKey = card.getAttribute('data-role');
        if (roleKey) this.confirmRoleSelection(roleKey);
      });
    });

    // 绑定分类按钮（如果存在）
    const catBar = document.getElementById('roleCatBar');
    if (catBar) {
      catBar.style.display = 'flex';
      catBar.innerHTML = '';
      for (const catName of Object.keys(categories)) {
        const btn = document.createElement('button');
        btn.textContent = catName;
        btn.className = 'role-cat-btn';
        btn.addEventListener('click', () => {
          const allCards = cards.querySelectorAll('.role-card');
          allCards.forEach(c => {
            const role = ROLES[c.getAttribute('data-role')];
            c.style.display = (role && role.category === catName) ? '' : 'none';
          });
        });
        catBar.appendChild(btn);
      }
    }
  }

  updateRoleSelection(dt) {
    if (!this.roleSelectionActive) return;
    this.roleSelectionTimer -= dt;
    // 更新倒计时文字
    const descEl = document.querySelector('#startRolePanel > p');
    if (descEl) {
      descEl.textContent = Math.ceil(Math.max(0, this.roleSelectionTimer)) + '秒内选择，超时默认狐狸';
    }
    // 超时默认狐狸
    if (this.roleSelectionTimer <= 0) {
      this.confirmRoleSelection('FOX');
    }
  }

  confirmRoleSelection(roleKey) {
    this.roleSelectionActive = false;
    this.roleChosen = true;
    if (this.localPlayer) this.localPlayer.isFrozen = false;

    // 隐藏选择面板
    const panel = document.getElementById('startRolePanel');
    if (panel) panel.style.display = 'none';

    // 设置角色和初始装备
    if (this.localPlayer) {
      this.localPlayer.setRole(roleKey, true);
      this.localPlayer.applyStarterGear();
    }

    // 请求pointer lock（非移动端）
    if (!this.input.isMobile()) {
      const canvas = document.getElementById('gameCanvas');
      if (canvas) canvas.requestPointerLock().catch(() => {});
    }
  }

  // ============================================
  // 核心游戏循环
  // ============================================

  loop(time) {
    this._rafId = requestAnimationFrame((t) => this.loop(t));

    const now = performance.now();
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    // FPS计算
    this._fpsFrames++;
    if (now - this._fpsTime >= 1000) {
      const fpsEl = document.getElementById('fpsCounter');
      if (fpsEl) fpsEl.textContent = this._fpsFrames + ' FPS';
      window._fpsCounter = this._fpsFrames;
      this._fpsFrames = 0;
      this._fpsTime = now;
    }

    // 游戏未激活时仅渲染
    if (!this.gameActive) {
      this.engine.render();
      return;
    }

    this.gameTime += dt;
    this.tick++;
    this.shrinkTimer -= dt;

    // 角色选择倒计时
    if (this.roleSelectionActive) {
      this.updateRoleSelection(dt);
    }

    // 梦域潮汐
    if (GAME_RULES.enableDreamTide && this.gameTime >= this.nextDreamTide) {
      this.nextDreamTide += GAME_RULES.dreamTideInterval;
      this.showMessage('梦域潮汐来袭！资源生成加速30秒！', '#b388ff');
      // 临时加速生成器
      for (const g of this.gens) {
        if (g.resKey) {
          const origSec = RES[g.resKey.toUpperCase()]?.spawnSec || 10;
          g._origSpawnSec = g._origSpawnSec || g.spawnSec;
          g.spawnSec = Math.max(0.5, origSec * 0.3);
          const tid = setTimeout(() => { g.spawnSec = g._origSpawnSec || origSec; }, 30000);
          this._timeouts.push(tid);
        }
      }
    }

    // 缩圈逻辑
    if (GAME_RULES.enableShrink) {
      if (this.shrinkTimer <= 0 && !this.shrinkActive) {
        // 开始缩圈
        this.shrinkActive = true;
        this.shrinkRadius = this.shrinkInitialRadius;
        this.showMessage('缩圈开始！注意安全区域！', '#ff4444');
        // 创建缩圈边界可视化
        if (!this.shrinkBoundary) {
          const geo = new THREE.RingGeometry(
            Math.max(0.1, this.shrinkRadius - 0.5),
            Math.max(0.2, this.shrinkRadius + 0.5), 64
          );
          const mat = new THREE.MeshBasicMaterial({
            color: 0xff0000, transparent: true, opacity: 0.3, side: THREE.DoubleSide
          });
          this.shrinkBoundary = new THREE.Mesh(geo, mat);
          this.shrinkBoundary.rotation.x = -Math.PI / 2;
          this.shrinkBoundary.position.y = 0.1;
          this.engine.scene.add(this.shrinkBoundary);
        }
      }
      if (this.shrinkActive) {
        // 缩小半径
        const finalRadius = GAME_RULES.shrinkFinalRadius || 8;
        if (this.shrinkRadius > finalRadius) {
          this.shrinkRadius -= GAME_RULES.shrinkSpeed * dt;
          this.shrinkRadius = Math.max(finalRadius, this.shrinkRadius);
          // 更新边界可视化
          if (this.shrinkBoundary) {
            this.engine.scene.remove(this.shrinkBoundary);
            this.shrinkBoundary.geometry.dispose();
            const geo = new THREE.RingGeometry(
              Math.max(0.1, this.shrinkRadius - 0.5),
              Math.max(0.2, this.shrinkRadius + 0.5), 64
            );
            this.shrinkBoundary.geometry = geo;
            this.engine.scene.add(this.shrinkBoundary);
          }
        }
        // 对圈外玩家造成伤害
        for (const p of this.players) {
          if (p.isDead) continue;
          const dist2D = Math.sqrt(p.pos.x * p.pos.x + p.pos.z * p.pos.z);
          if (dist2D > this.shrinkRadius) {
            p.hp -= GAME_RULES.shrinkDamage * dt;
            if (p.hp <= 0 && !p.isDead) {
              p.die(null, false);
              this.onPlayerKilled(p, null);
            }
          }
        }
        // 缩圈摧毁圈外的床
        for (const [tKey, tInfo] of Object.entries(TEAMS)) {
          if (!tInfo.bedAlive) continue;
          const bedDist = Math.sqrt(tInfo.bedPos.x * tInfo.bedPos.x + tInfo.bedPos.z * tInfo.bedPos.z);
          if (bedDist > this.shrinkRadius) {
            tInfo.bedAlive = false;
            if (tInfo.bedMesh) tInfo.bedMesh.visible = false;
            this.engine.spawnParticles(tInfo.bedPos, tInfo.color, 20);
            this.showMessage(tInfo.name + ' 的床被缩圈摧毁！', '#ff4444');
            this.onBedDestroyed(tKey, null);
          }
        }
        // 35分钟强制判定
        if (this.gameTime >= 2100) {
          this.endGameByShrink();
        }
      }
    }

    // ---- 本地玩家输入处理 ----
    if (this.localPlayer && !this.localPlayer.isDead && !this.roleSelectionActive) {
      if (!this.isCampusMode) {
        // 经典模式输入
        const move = this.input.getMovement();
        const look = this.input.getLook();
        this.localPlayer.moveInput(move.x, move.z, move.sprint);
        this.localPlayer.look(look.dx, look.dy);

        // 跳跃
        if (this.input.consumeJump()) {
          if (this.localPlayer.onGround) {
            this.localPlayer.vel.y = this.localPlayer.jumpPower;
            this.localPlayer.onGround = false;
          }
        }

        // 攻击
        if (this.input.consumeAttack()) {
          this.localPlayer.attack();
        }

        // 建造/放置方块
        if (this.input.consumeBuild()) {
          const blockType = this.localPlayer.getSelectedBlockType();
          if (blockType) {
            const rc = this.getLookedBlock(6);
            if (rc.hit) {
              this.engine.placeBlock(
                rc.placePos.x, rc.placePos.y, rc.placePos.z,
                blockType, this.localPlayer.team
              );
              this.localPlayer.matchStats.blocksPlaced++;
              if (this.growth) this.growth.addXp(this.localPlayer, GROWTH_CONFIG.xp.placeBlock, '放置方块');
            }
          } else {
            // 没有方块时尝试交互（拆对方方块）
            const rc = this.getLookedBlock(6);
            if (rc.hit) {
              this.engine.damageBlock(rc.pos.x, rc.pos.y, rc.pos.z, this.localPlayer.baseDmg);
            }
          }
        }

        // 技能
        if (this.input.consumeSkill()) {
          this.localPlayer.useSkill();
        }

        // 交互（E键）
        if (this.input.consumeAction()) {
          this.tryOpenFriendlyBlockPanel();
        }

        // 背包（Tab键）
        if (this.input.consumeBackpack()) {
          this.toggleBackpack();
        }

        // 丢弃（G键）
        if (this.input.consumeDrop()) {
          const item = this.localPlayer.getSelectedItem();
          if (item) {
            this.engine.spawnItemDrop(this.localPlayer.pos, item.key, 1);
            item.count--;
            if (item.count <= 0) this.localPlayer.hotbar[this.localPlayer.hotbarIndex] = null;
            this.localPlayer.updateWeaponMesh();
          }
        }

        // 快捷栏滚轮切换
        const scroll = this.input.getHotbarScroll();
        if (scroll !== 0) {
          let idx = this.localPlayer.hotbarIndex + scroll;
          if (idx < 0) idx = 7;
          if (idx > 7) idx = 0;
          this.localPlayer.setHotbarIndex(idx);
        }

        // 移动端操作按钮
        if (this.input.isMobile()) {
          this.performMobileAction();
        }
      } else if (this.isCampusMode && this.campusMode && this.campusMode.localPlayer) {
        // 校园模式输入
        const cmInput = this.campusMode.input;
        const move = this.input.getMovement();
        cmInput.forward = move.z < -0.3;
        cmInput.backward = move.z > 0.3;
        cmInput.left = move.x < -0.3;
        cmInput.right = move.x > 0.3;
        cmInput.sprint = move.sprint;

        // 校园模式视角
        const look = this.input.getLook();
        const lp = this.campusMode.localPlayer;
        lp.yaw -= look.dx * 0.002;
        lp.pitch = Math.max(-1.2, Math.min(1.2, lp.pitch - look.dy * 0.002));

        // 校园模式跳跃
        if (this.input.consumeJump()) {
          lp.vel.y = 8;
          lp.onGround = false;
        }

        // 校园模式技能
        if (this.input.consumeSkill()) {
          this.campusMode.handleSkillActivation();
        }

        // 校园模式交互
        if (this.input.consumeAction()) {
          // 交互逻辑
        }

        this.campusMode.update(dt);
        this._updateCampusHud();
      }
    }

    // ---- 资源生成器更新 ----
    for (const g of this.gens) {
      if (!g.resKey) continue;
      g.spawnTimer = (g.spawnTimer || 0) + dt;
      if (g.spawnTimer >= (g.spawnSec || 10)) {
        g.spawnTimer = 0;
        this.engine.spawnCurrencyDrop(g.pos, g.resKey, 1);
      }
    }

    // ---- AI更新 ----
    if (this.ai && !this.isCampusMode) {
      AIManager.updateAll(dt, this.gameTime);
    }

    // ---- 社交系统更新 ----
    if (this.social && this.social.update) {
      this.social.update(dt);
    }

    // ---- 引擎更新和渲染 ----
    this.engine.update(dt);
    this.engine.render();

    // ---- UI更新 ----
    if (this.ui) this.ui.update();
    if (this.ui && this.ui.shopOpen && this.shopDirty) {
      this.ui.buildShop();
      this.shopDirty = false;
    }

    // ---- 数据上报 ----
    this.matchSnapshotTimer -= dt;
    if (this.matchSnapshotTimer <= 0) {
      this.matchSnapshotTimer = 5;
      this.reportMatchSnapshot();
    }
    this.economyLogTimer -= dt;
    if (this.economyLogTimer <= 0) {
      this.economyLogTimer = 30;
      this.reportEconomyStats();
    }

    // ---- 重置输入帧状态 ----
    this.input.resetFrame();
  }

  // ============================================
  // 快捷栏与移动端
  // ============================================

  selectHotbar(idx) {
    if (!this.localPlayer) return;
    this.localPlayer.setHotbarIndex(idx);
  }

  performMobileAction() {
    if (!this.localPlayer) return;
    // 移动端攻击
    if (this.input.buttons.attack) {
      this.localPlayer.attack();
    }
    // 移动端技能（长按释放）
    if (this.input.buttons.skillHeld) {
      // 持续按住技能时的处理
    }
    if (this.input.buttons.skill) {
      this.localPlayer.useSkill();
    }
  }

  // ============================================
  // 方块交互
  // ============================================

  getLookedBlock(maxDist = 6) {
    if (!this.localPlayer) return { hit: false };
    const origin = this.localPlayer.pos.clone().add(new THREE.Vector3(0, 0.7, 0));
    const dir = this.localPlayer.getForwardDir();
    return this.engine.raycastBlocks(origin, dir, maxDist);
  }

  tryOpenFriendlyBlockPanel() {
    const rc = this.getLookedBlock(6);
    if (!rc.hit) { this.closeBuildPanel(); return; }
    const blk = this.engine.blocks.get(rc.pos.x + ',' + rc.pos.y + ',' + rc.pos.z);
    if (!blk || blk.type === 'ground') { this.closeBuildPanel(); return; }
    // 检查是否为友方方块
    if (blk.team === this.localPlayer.team) {
      this.selectedBlockKey = rc.pos.x + ',' + rc.pos.y + ',' + rc.pos.z;
      const panel = document.getElementById('buildPanel');
      const hpText = document.getElementById('buildHpText');
      if (hpText) {
        const blockInfo = ITEM_DB[blk.type];
        hpText.textContent = (blockInfo ? blockInfo.name : '建筑') + ' 血量：' + Math.ceil(blk.hp) + '/' + blk.maxHp;
      }
      if (panel) panel.style.display = 'block';
    } else {
      this.closeBuildPanel();
    }
  }

  closeBuildPanel() {
    this.selectedBlockKey = null;
    const panel = document.getElementById('buildPanel');
    if (panel) panel.style.display = 'none';
  }

  nextBlockUpgrade(type) {
    const chain = GAME_RULES.blockUpgradeChain || ['wood_plank', 'stone_plate', 'iron_plate', 'titanium'];
    const idx = chain.indexOf(type);
    if (idx >= 0 && idx < chain.length - 1) return chain[idx + 1];
    return null;
  }

  upgradeSelectedBlock() {
    if (!this.selectedBlockKey || !this.localPlayer) return;
    const blk = this.engine.blocks.get(this.selectedBlockKey);
    if (!blk) return;
    const nextType = this.nextBlockUpgrade(blk.type);
    if (!nextType) { this.showMessage('已经是最高级', '#ffaa00'); return; }
    const cost = ITEM_DB[nextType] ? ITEM_DB[nextType].cost : null;
    if (!cost) return;
    // 检查资源
    for (const [cur, amount] of Object.entries(cost)) {
      if ((this.localPlayer.inv[cur] || 0) < amount) {
        this.showMessage('资源不足！', '#ff4444');
        return;
      }
    }
    // 扣除资源
    for (const [cur, amount] of Object.entries(cost)) {
      this.localPlayer.inv[cur] -= amount;
    }
    // 替换方块
    this.engine.replaceBlockType(this.selectedBlockKey, nextType);
    this.closeBuildPanel();
    this.shopDirty = true;
  }

  destroySelectedBlock() {
    if (!this.selectedBlockKey || !this.localPlayer) return;
    const blk = this.engine.blocks.get(this.selectedBlockKey);
    if (!blk) return;
    // 高等级方块需要确认
    const chain = GAME_RULES.blockUpgradeChain || ['wood_plank', 'stone_plate', 'iron_plate', 'titanium'];
    const level = chain.indexOf(blk.type);
    if (level >= 2) {
      // 高等级方块：直接拆毁但返还部分资源
      this.showMessage('拆毁了 ' + (ITEM_DB[blk.type]?.name || '建筑'), '#ffaa00');
    }
    const parts = this.selectedBlockKey.split(',');
    this.engine.removeBlock(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
    this.closeBuildPanel();
  }

  prepareMoveSelectedBlock() {
    if (!this.selectedBlockKey || !this.localPlayer) return;
    this.movingBlockKey = this.selectedBlockKey;
    this.closeBuildPanel();
    this.showMessage('点击目标位置放置方块', '#8be9fd');
    // 监听下次点击
    const handler = (e) => {
      document.removeEventListener('click', handler);
      this.placeMovedBlock({ x: e.clientX, y: e.clientY });
    };
    document.addEventListener('click', handler);
  }

  placeMovedBlock(pointer) {
    if (!this.movingBlockKey) return;
    const blk = this.engine.blocks.get(this.movingBlockKey);
    if (!blk) { this.movingBlockKey = null; return; }
    // 用引擎的射线检测新位置
    const rc = this.engine.raycastPlacement(pointer.x, pointer.y, 8);
    if (rc.hit && rc.baseKey) {
      const type = blk.type;
      const team = blk.team;
      const parts = this.movingBlockKey.split(',');
      this.engine.removeBlock(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
      this.engine.placeBlock(rc.placePos.x, rc.placePos.y, rc.placePos.z, type, team);
    }
    this.movingBlockKey = null;
  }

  // ============================================
  // 面板切换
  // ============================================

  toggleBackpack() {
    const panel = document.getElementById('backpackPanel');
    if (!panel) return;
    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : '';
    if (!isOpen && this.ui) this.ui.updateBackpack();
    // 关闭其他面板
    if (!isOpen) {
      const shop = document.getElementById('shopPanel');
      if (shop) shop.style.display = 'none';
      this.ui.shopOpen = false;
      this.growthPanelOpen = false;
      const growth = document.getElementById('growthPanel');
      if (growth) growth.style.display = 'none';
    }
  }

  toggleShop() {
    const panel = document.getElementById('shopPanel');
    if (!panel) return;
    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : '';
    this.ui.shopOpen = !isOpen;
    if (!isOpen) {
      this.shopDirty = true;
      this.ui.buildShop();
      // 绑定购买按钮
      this._bindShopBuyButtons();
    }
    // 关闭其他面板
    if (!isOpen) {
      const bp = document.getElementById('backpackPanel');
      if (bp) bp.style.display = 'none';
      this.growthPanelOpen = false;
      const growth = document.getElementById('growthPanel');
      if (growth) growth.style.display = 'none';
    }
  }

  _bindShopBuyButtons() {
    const grid = document.getElementById('shopGrid') || document.getElementById('shopBody');
    if (!grid) return;
    grid.querySelectorAll('.shop-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-buy-key');
        if (key) this.buyItem(key, ITEM_DB[key]?.count || 1, this.localPlayer);
      });
    });
  }

  toggleGrowthPanel() {
    const panel = document.getElementById('growthPanel');
    if (!panel) return;
    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : '';
    this.growthPanelOpen = !isOpen;
    if (!isOpen && this.ui) {
      this.ui.renderGrowthCenter();
    }
  }

  // ============================================
  // 商店购买
  // ============================================

  buyItem(key, count, targetPlayer) {
    const info = ITEM_DB[key];
    if (!info || !info.cost) return;
    const player = targetPlayer || this.localPlayer;
    if (!player) return;
    // 检查资源
    for (const [cur, amount] of Object.entries(info.cost)) {
      if ((player.inv[cur] || 0) < amount) {
        if (player === this.localPlayer) this.showMessage('资源不足！', '#ff4444');
        return false;
      }
    }
    // 扣除资源
    for (const [cur, amount] of Object.entries(info.cost)) {
      player.inv[cur] -= amount;
    }
    // 添加到背包
    const actualCount = info.count || count || 1;
    player.addToBackpack(key, actualCount);
    // 如果是武器且玩家没有装备武器，自动装备
    if (info.type === 'weapon' && !player.equipped.weapon) {
      player.equipped.weapon = key;
      player.updateWeaponMesh();
    }
    // 如果是护甲且玩家没有装备护甲，自动装备
    if (info.type === 'armor' && !player.equipped.armor) {
      player.equipped.armor = key;
      // 应用护甲效果
      player.armor = info.armor || 0;
      player.armorMax = info.armor || 0;
      player.armorProtectRate = info.protectRate || 0;
    }
    // 标记商店需要刷新
    this.shopDirty = true;
    return true;
  }

  // ============================================
  // 陷阱装填
  // ============================================

  loadNearestTrap() {
    if (!this.localPlayer) return;
    for (const trap of this.engine.trapDevices) {
      if (trap.team !== this.localPlayer.team) continue;
      if (trap.arrows >= 100) continue;
      const dist = this.localPlayer.pos.distanceTo(trap.pos);
      if (dist < 5) {
        // 消耗箭矢装填
        const arrowItem = this.localPlayer.hotbar.find(h => h && h.key === 'arrow');
        if (arrowItem) {
          const loadCount = Math.min(arrowItem.count, 100 - trap.arrows);
          arrowItem.count -= loadCount;
          trap.arrows += loadCount;
          if (arrowItem.count <= 0) {
            const idx = this.localPlayer.hotbar.indexOf(arrowItem);
            if (idx >= 0) this.localPlayer.hotbar[idx] = null;
          }
          this.showMessage('装填了 ' + loadCount + ' 支箭矢', '#8be9fd');
          return;
        }
      }
    }
    this.showMessage('附近没有可装填的陷阱', '#ffaa00');
  }

  // ============================================
  // 击杀与床摧毁
  // ============================================

  onPlayerKilled(victim, killer) {
    // 生成击杀消息
    const victimName = victim ? victim.name : '未知';
    const killerName = killer ? killer.name : '虚空';
    this.addKillFeed(killerName + ' 击杀了 ' + victimName);
    this.showMessage(victimName + ' 被击杀了！', '#ff4444');

    // 掉落物品
    if (victim) {
      // 货币掉落
      for (const cur of ['copper', 'silver', 'gold', 'jade']) {
        const amount = Math.floor((victim.inv[cur] || 0) * 0.5);
        if (amount > 0) {
          this.engine.spawnCurrencyDrop(victim.pos.clone(), cur, amount);
        }
      }
      // 死亡盒子
      this.engine.createDeathBox(victim);
    }

    // AI击杀经验
    if (killer && killer.isAI && this.growth) {
      this.growth.addXp(killer, GROWTH_CONFIG.xp.kill * AI_CONFIG.XP_REDUCTION, '击杀');
    }
    // 本地玩家击杀经验
    if (killer === this.localPlayer && this.growth) {
      this.growth.addXp(killer, GROWTH_CONFIG.xp.kill, '击杀');
    }

    // 击杀者统计
    if (killer && !killer.isAI) {
      killer.matchStats.kills++;
    }

    // 网络同步
    try {
      if (this.network && this.network.sendPlayerKilled) {
        this.network.sendPlayerKilled(victim?.playerId, killer?.playerId);
      }
    } catch (e) { /* 忽略网络错误 */ }

    // 检查胜利条件
    this.checkWinCondition();
  }

  onBedDestroyed(teamKey, destroyer) {
    const teamInfo = TEAMS[teamKey];
    if (!teamInfo) return;
    const destroyerName = destroyer ? destroyer.name : '未知';
    this.addKillFeed(destroyerName + ' 拆毁了 ' + teamInfo.name + ' 的床！');
    this.showMessage(teamInfo.name + ' 的床被拆毁了！', '#ff4444');

    // 拆床者经验
    if (destroyer && this.growth) {
      const mult = destroyer.isAI ? AI_CONFIG.XP_REDUCTION : 1;
      this.growth.addXp(destroyer, GROWTH_CONFIG.xp.bedBreak * mult, '拆床');
    }
    if (destroyer) destroyer.matchStats.beds++;

    // 网络同步
    try {
      if (this.network && this.network.sendBedDestroyed) {
        this.network.sendBedDestroyed(teamKey, destroyer?.playerId);
      }
    } catch (e) { /* 忽略网络错误 */ }

    // 检查胜利条件
    this.checkWinCondition();
  }

  checkWinCondition() {
    // 统计存活队伍（有活人或床还存在的队伍）
    const aliveTeams = new Set();
    for (const [tKey, tInfo] of Object.entries(TEAMS)) {
      if (tInfo.bedAlive) {
        aliveTeams.add(tKey);
      } else {
        // 床没了，检查是否还有活着的玩家
        const hasAlive = this.players.some(p => p.team === tKey && !p.isDead);
        if (hasAlive) aliveTeams.add(tKey);
      }
    }
    if (aliveTeams.size <= 1) {
      const winnerKey = aliveTeams.values().next().value;
      const winnerName = winnerKey ? TEAMS[winnerKey].name : '平局';
      this.endGame(winnerName);
    }
  }

  endGameByShrink() {
    // 按存活人数判定
    const alivePlayers = this.players.filter(p => !p.isDead);
    if (alivePlayers.length <= 1) {
      const winner = alivePlayers[0];
      const winnerName = winner ? winner.teamInfo.name : '平局';
      this.endGame(winnerName);
    }
  }

  // ============================================
  // 游戏结束
  // ============================================

  endGame(winnerName) {
    this.gameActive = false;
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }

    // 销毁输入
    if (this.input) this.input.destroy();

    // 清理timeout
    for (const t of this._timeouts) clearTimeout(t);
    this._timeouts = [];

    // 清理缩圈边界
    if (this.shrinkBoundary) {
      this.engine.scene.remove(this.shrinkBoundary);
      this.shrinkBoundary.geometry.dispose();
      this.shrinkBoundary.material.dispose();
      this.shrinkBoundary = null;
    }

    // 退出pointer lock
    if (document.pointerLockElement) document.exitPointerLock();

    // 网络同步
    try {
      if (this.network && this.network.sendGameOver) {
        this.network.sendGameOver(winnerName);
      }
      if (this.network && this.network.roomNet && this.network.roomNet.room) {
        this.network.roomNet.setRoomStatus('finished').catch(() => {});
      }
    } catch (e) { /* 忽略 */ }

    // 成长结算
    let growthResult = null;
    if (this.growth && !this.isCampusMode) {
      growthResult = this.growth.settlement(winnerName);
    }

    // 计算MVP
    let mvp = null;
    let mvpScore = -1;
    for (const p of this.players) {
      const score = (p.matchStats.kills || 0) * 100 + (p.matchStats.beds || 0) * 200 + (p.matchStats.damage || 0);
      if (score > mvpScore) { mvpScore = score; mvp = p; }
    }

    // 显示结算界面
    const screen = document.getElementById('gameOverScreen');
    if (screen) {
      screen.style.display = '';
      const titleEl = screen.querySelector('.result-title');
      if (titleEl) titleEl.textContent = '游戏结束！';
      const winnerEl = screen.querySelector('.winner');
      if (winnerEl) winnerEl.textContent = winnerName + ' 获胜！';

      // 填充结算数据
      const statsEl = screen.querySelector('.stats');
      if (statsEl && this.localPlayer) {
        const p = this.localPlayer;
        const survivalMin = Math.floor(this.gameTime / 60);
        statsEl.innerHTML = ''
          + '<div>存活时间：' + survivalMin + ' 分 ' + Math.floor(this.gameTime % 60) + ' 秒</div>'
          + '<div>击杀：' + (p.matchStats.kills || 0) + '</div>'
          + '<div>拆床：' + (p.matchStats.beds || 0) + '</div>'
          + '<div>方块放置：' + (p.matchStats.blocksPlaced || 0) + '</div>'
          + '<div>造成伤害：' + Math.floor(p.matchStats.damage || 0) + '</div>';
      }

      // MVP
      const mvpSection = document.getElementById('mvpSection');
      if (mvpSection && mvp) {
        mvpSection.innerHTML = '<div>MVP：' + mvp.name + '（' + mvp.teamInfo.name + '）</div>';
      }

      // 段位变化
      const rankEl = document.getElementById('rankChange');
      if (rankEl && growthResult) {
        rankEl.innerHTML = '<div>段位：' + growthResult.rankName + '</div>'
          + '<div>段位分变化：' + (growthResult.rankDelta >= 0 ? '+' : '') + growthResult.rankDelta + '</div>'
          + '<div>获得星尘：' + growthResult.stardust + '</div>';
      }
    }
  }

  // ============================================
  // 消息系统
  // ============================================

  showMessage(text, color = '#fff') {
    const container = document.getElementById('gameMessages');
    if (!container) return;
    const msg = document.createElement('div');
    msg.className = 'game-msg';
    msg.style.color = color;
    msg.textContent = text;
    container.appendChild(msg);
    const tid = setTimeout(() => {
      if (msg.parentNode) msg.parentNode.removeChild(msg);
    }, 4000);
    this._timeouts.push(tid);
  }

  addKillFeed(text) {
    const container = document.getElementById('killFeed');
    if (!container) return;
    const msg = document.createElement('div');
    msg.className = 'kill-msg';
    msg.textContent = text;
    container.appendChild(msg);
    // 最多保留8条
    while (container.children.length > 8) {
      container.removeChild(container.firstChild);
    }
    const tid = setTimeout(() => {
      if (msg.parentNode) msg.parentNode.removeChild(msg);
    }, 8000);
    this._timeouts.push(tid);
  }

  // ============================================
  // 网络数据上报
  // ============================================

  reportMatchSnapshot() {
    try {
      if (!this.network || !this.network.roomNet || !this.network.roomNet.client) return;
      const client = this.network.roomNet.client;
      const roomId = this.network.roomNet.room?.id;
      if (!roomId) return;

      const playersState = this.players.map(p => ({
        id: p.playerId,
        team: p.team,
        hp: Math.floor(p.hp),
        isDead: p.isDead,
        x: Math.floor(p.pos.x * 10) / 10,
        z: Math.floor(p.pos.z * 10) / 10
      }));

      client.from('match_snapshots').insert({
        room_id: roomId,
        tick: this.tick,
        game_time: Math.floor(this.gameTime),
        players_state: playersState,
        alive_teams: Object.entries(TEAMS).filter(([, t]) => t.bedAlive).map(([k]) => k)
      }).catch(() => {});
    } catch (e) { /* 忽略 */ }
  }

  reportEconomyStats() {
    try {
      if (!this.localPlayer || !this.network || !this.network.roomNet || !this.network.roomNet.client) return;
      const client = this.network.roomNet.client;
      const p = this.localPlayer;
      const roomId = this.network.roomNet.room?.id;
      if (!roomId) return;

      client.from('player_economy_logs').insert({
        player_id: p.playerId,
        room_id: roomId,
        event_type: 'snapshot',
        tick: this.tick,
        copper: p.inv.copper || 0,
        silver: p.inv.silver || 0,
        gold: p.inv.gold || 0,
        jade: p.inv.jade || 0
      }).catch(() => {});
    } catch (e) { /* 忽略 */ }
  }

  getNetworkState() {
    return {
      gameActive: this.gameActive,
      gameTime: this.gameTime,
      tick: this.tick,
      players: this.players.map(p => ({
        id: p.playerId, name: p.name, team: p.team,
        hp: Math.floor(p.hp), isDead: p.isDead,
        x: p.pos.x, y: p.pos.y, z: p.pos.z
      })),
      beds: Object.fromEntries(
        Object.entries(TEAMS).map(([k, t]) => [k, t.bedAlive])
      )
    };
  }

  // ============================================
  // 右键菜单与物品操作
  // ============================================

  showSlotContextMenu(slotEl, idx) {
    if (!this.localPlayer) return;
    const item = this.localPlayer.hotbar[idx];
    if (!item) return;
    const menu = document.getElementById('slotContextMenu');
    if (!menu) return;
    // 定位菜单
    const rect = slotEl.getBoundingClientRect();
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.display = 'block';
    menu.dataset.slotIdx = idx;
    // 绑定按钮
    const splitBtn = menu.querySelector('[data-action="split"]');
    const dropBtn = menu.querySelector('[data-action="drop"]');
    if (splitBtn) splitBtn.onclick = () => { this.splitSelectedItem(); this.hideSlotContextMenu(); };
    if (dropBtn) dropBtn.onclick = () => {
      this.engine.spawnItemDrop(this.localPlayer.pos, item.key, 1);
      item.count--;
      if (item.count <= 0) this.localPlayer.hotbar[idx] = null;
      this.localPlayer.updateWeaponMesh();
      this.hideSlotContextMenu();
    };
  }

  hideSlotContextMenu() {
    const menu = document.getElementById('slotContextMenu');
    if (menu) menu.style.display = 'none';
  }

  splitSelectedItem() {
    if (!this.localPlayer) return;
    const menu = document.getElementById('slotContextMenu');
    if (!menu) return;
    const idx = parseInt(menu.dataset.slotIdx);
    if (isNaN(idx)) return;
    const item = this.localPlayer.hotbar[idx];
    if (!item || item.count <= 1) return;
    // 找一个空快捷栏槽位
    let emptyIdx = -1;
    for (let i = 0; i < 8; i++) {
      if (i !== idx && !this.localPlayer.hotbar[i]) { emptyIdx = i; break; }
    }
    if (emptyIdx < 0) {
      this.showMessage('快捷栏没有空位', '#ffaa00');
      return;
    }
    // 拆分：一半给空槽
    const half = Math.floor(item.count / 2);
    item.count -= half;
    this.localPlayer.hotbar[emptyIdx] = { key: item.key, count: half };
  }

  // ============================================
  // 网络回调（由NetworkManager调用）
  // ============================================

  onNetworkRoomUpdate(room) {
    // 房间信息更新
  }

  onNetworkSnapshot(data) {
    // 收到快照（客户端同步）
  }

  onNetworkBedDestroyed(teamKey, destroyerId) {
    const teamInfo = TEAMS[teamKey];
    if (teamInfo) {
      teamInfo.bedAlive = false;
      if (teamInfo.bedMesh) teamInfo.bedMesh.visible = false;
    }
  }

  onNetworkPlayerKilled(victimId, killerId) {
    // 网络同步击杀
  }

  onNetworkGameOver(winner) {
    this.endGame(winner || '未知');
  }

  onNetworkMembers(members) {
    // 成员列表更新
  }
}

// 挂载到全局
window.Game = Game;