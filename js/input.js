/**
 * 输入管理器模块 —— 筑梦激斗（3D起床战争）
 * 纯class封装，无全局污染，支持键盘 / 鼠标 / 触摸三种输入方式。
 */
class InputManager {
  constructor() {
    /** 按键状态表 { code: boolean } */
    this.keys = {};
    /** 鼠标锁定下的累计视角增量（每帧由 resetFrame 清零） */
    this.look = { dx: 0, dy: 0 };
    /** 鼠标锁定状态 */
    this.pointerLocked = false;
    /** 视角灵敏度（从 localStorage 读取） */
    this.lookSensitivity = parseFloat(
      localStorage.getItem('bedwars_look_sensitivity') ?? '1.8'
    );
    /** 滚轮切换快捷栏增量（-1=上滚 / +1=下滚，每帧由 resetFrame 清零） */
    this.hotbarScroll = 0;
    /** 临时单帧事件标记 —— jump / attack / build / skill / drop / backpack / action */
    this._jump = false;
    this._attack = false;
    this._build = false;
    this._skill = false;
    this._drop = false;
    this._backpack = false;
    this._action = false;
    /** 长按持续状态 */
    this._attackHeld = false;
    this._buildHeld = false;
    this._actionHeld = false;
    this._skillHeld = false;

    // ── 触摸相关 ──────────────────────────────────────────────
    /** 触摸视角控制 */
    this.touchLook = { active: false, id: -1, lastX: 0, lastY: 0 };
    /** 虚拟摇杆 */
    this.joystick = { active: false, dx: 0, dy: 0 };
    /** 触摸按钮状态 */
    this.buttons = {
      jump: false,
      attack: false,
      attackHeld: false,
      build: false,
      skill: false,
      skillHeld: false,
      action: false,
      actionHeld: false,
    };
    /** 触屏建造点击坐标（屏幕像素） */
    this.buildPointer = { x: 0, y: 0 };

    /** 移动端控制容器DOM（懒创建） */
    this._mobileContainer = null;

    // ── 需要阻止默认行为的按键列表 ────────────────────────────
    this._preventKeys = new Set([
      'KeyW', 'KeyA', 'KeyS', 'KeyD',
      'Space', 'ShiftLeft', 'Tab',
    ]);

    // ── 绑定事件（全部使用箭头函数，便于 destroy 统一移除） ──
    this._onKeyDown = (e) => this._handleKeyDown(e);
    this._onKeyUp = (e) => this._handleKeyUp(e);
    this._onPointerLockChange = () => this._handlePointerLockChange();
    this._onMouseMove = (e) => this._handleMouseMove(e);
    this._onMouseDown = (e) => this._handleMouseDown(e);
    this._onMouseUp = (e) => this._handleMouseUp(e);
    this._onWheel = (e) => this._handleWheel(e);
    this._onTouchStart = (e) => this._handleTouchStart(e);
    this._onTouchMove = (e) => this._handleTouchMove(e);
    this._onTouchEnd = (e) => this._handleTouchEnd(e);
    this._onContextMenu = (e) => e.preventDefault();

    this._bindEvents();
  }

  // ───────────────────────────── 事件绑定 / 解绑 ─────────────────────────────

  _bindEvents() {
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('wheel', this._onWheel, { passive: false });
    document.addEventListener('touchstart', this._onTouchStart, { passive: false });
    document.addEventListener('touchmove', this._onTouchMove, { passive: false });
    document.addEventListener('touchend', this._onTouchEnd, { passive: false });
    document.addEventListener('contextmenu', this._onContextMenu);
  }

  destroy() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('wheel', this._onWheel);
    document.removeEventListener('touchstart', this._onTouchStart);
    document.removeEventListener('touchmove', this._onTouchMove);
    document.removeEventListener('touchend', this._onTouchEnd);
    document.removeEventListener('contextmenu', this._onContextMenu);
    // 移除移动端DOM
    if (this._mobileContainer && this._mobileContainer.parentNode) {
      this._mobileContainer.parentNode.removeChild(this._mobileContainer);
      this._mobileContainer = null;
    }
  }

  // ───────────────────────────── 键盘事件 ─────────────────────────────

  _handleKeyDown(e) {
    const code = e.code;
    if (this._preventKeys.has(code)) e.preventDefault();
    this.keys[code] = true;

    // 单帧消费事件
    if (code === 'Space') this._jump = true;
    if (code === 'KeyQ') this._skill = true;
    if (code === 'KeyF') this._build = true;
    if (code === 'KeyE') this._action = true;
    if (code === 'Tab') this._backpack = true;

    // 长按状态
    this._attackHeld = (code === 'KeyJ') ? true : this._attackHeld;
    this._buildHeld = (code === 'KeyF') ? true : this._buildHeld;
    this._actionHeld = (code === 'KeyE') ? true : this._actionHeld;
    this._skillHeld = (code === 'KeyQ') ? true : this._skillHeld;
  }

  _handleKeyUp(e) {
    const code = e.code;
    if (this._preventKeys.has(code)) e.preventDefault();
    this.keys[code] = false;

    if (code === 'KeyJ') this._attackHeld = false;
    if (code === 'KeyF') this._buildHeld = false;
    if (code === 'KeyE') this._actionHeld = false;
    if (code === 'KeyQ') this._skillHeld = false;
  }

  // ───────────────────────────── 鼠标指针锁定 ─────────────────────────────

  _handlePointerLockChange() {
    this.pointerLocked = (document.pointerLockElement != null);
  }

  _handleMouseMove(e) {
    if (!this.pointerLocked) return;
    this.look.dx += e.movementX * this.lookSensitivity;
    this.look.dy += e.movementY * this.lookSensitivity;
  }

  // ───────────────────────────── 鼠标按键 ─────────────────────────────

  _handleMouseDown(e) {
    if (e.button === 0) {
      this._attack = true;
      this._attackHeld = true;
    }
    if (e.button === 2) {
      this._build = true;
      this._buildHeld = true;
    }
  }

  _handleMouseUp(e) {
    if (e.button === 0) this._attackHeld = false;
    if (e.button === 2) this._buildHeld = false;
  }

  // ───────────────────────────── 滚轮切换快捷栏 ─────────────────────────────

  _handleWheel(e) {
    e.preventDefault();
    this.hotbarScroll += Math.sign(e.deltaY);
  }

  // ───────────────────────────── 触摸事件 ─────────────────────────────

  /**
   * 触摸开始 —— 根据触摸位置判断：
   *  左下区域 → 虚拟摇杆
   *  右下区域 → 视角控制
   *  按钮 → 攻击/跳跃/技能/交互/建造
   */
  _handleTouchStart(e) {
    e.preventDefault();
    if (!this.isMobile()) this._ensureMobileControls();

    for (const touch of e.changedTouches) {
      const t = touch;
      const btn = this._getTouchButton(t.clientX, t.clientY);

      if (btn === 'joystick') {
        this.joystick.active = true;
        this.joystick.id = t.identifier;
        this.joystick.baseX = t.clientX;
        this.joystick.baseY = t.clientY;
        this.joystick.dx = 0;
        this.joystick.dy = 0;
      } else if (btn === 'look') {
        this.touchLook.active = true;
        this.touchLook.id = t.identifier;
        this.touchLook.lastX = t.clientX;
        this.touchLook.lastY = t.clientY;
      } else if (btn) {
        this._handleTouchButton(btn, t.clientX, t.clientY);
      }
    }
  }

  _handleTouchMove(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const t = touch;
      // 虚拟摇杆位移
      if (this.joystick.active && t.identifier === this.joystick.id) {
        this.joystick.dx = (t.clientX - this.joystick.baseX) / 50; // 归一化到 -1~1
        this.joystick.dy = (t.clientY - this.joystick.baseY) / 50;
        // 限幅
        const len = Math.sqrt(this.joystick.dx ** 2 + this.joystick.dy ** 2);
        if (len > 1) {
          this.joystick.dx /= len;
          this.joystick.dy /= len;
        }
      }
      // 视角滑动
      if (this.touchLook.active && t.identifier === this.touchLook.id) {
        const dx = t.clientX - this.touchLook.lastX;
        const dy = t.clientY - this.touchLook.lastY;
        this.touchLook.lastX = t.clientX;
        this.touchLook.lastY = t.clientY;
        // 叠加到 look 增量（乘以灵敏度）
        this.look.dx += dx * this.lookSensitivity;
        this.look.dy += dy * this.lookSensitivity;
      }
    }
  }

  _handleTouchEnd(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const t = touch;
      if (this.joystick.active && t.identifier === this.joystick.id) {
        this.joystick.active = false;
        this.joystick.dx = 0;
        this.joystick.dy = 0;
      }
      if (this.touchLook.active && t.identifier === this.touchLook.id) {
        this.touchLook.active = false;
      }
    }
  }

  /**
   * 根据触摸坐标判断命中的按钮名
   * 返回: 'joystick' | 'look' | 'jump' | 'attack' | 'build' | 'skill' | 'action' | null
   */
  _getTouchButton(x, y) {
    if (!this._mobileContainer) return null;
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    return el.dataset.inputBtn || null;
  }

  /** 处理触摸按钮按下 */
  _handleTouchButton(btn, x, y) {
    switch (btn) {
      case 'jump':
        this.buttons.jump = true;
        break;
      case 'attack':
        this.buttons.attack = true;
        this.buttons.attackHeld = true;
        break;
      case 'build':
        this.buttons.build = true;
        this.buildPointer.x = x;
        this.buildPointer.y = y;
        break;
      case 'skill':
        this.buttons.skill = true;
        this.buttons.skillHeld = true;
        break;
      case 'action':
        this.buttons.action = true;
        this.buttons.actionHeld = true;
        break;
      case 'backpack':
        this._backpack = true;
        break;
    }
  }

  // ───────────────────────────── 每帧更新 / 重置 ─────────────────────────────

  /**
   * 每帧结束时重置临时状态。
   * - look.dx / look.dy 归零
   * - 单帧事件 jump / attack / build / skill / drop / backpack / action 归 false
   * - 不重置 attackHeld / buildHeld / actionHeld / skillHeld（持续按压状态）
   */
  resetFrame() {
    this.look.dx = 0;
    this.look.dy = 0;
    this.hotbarScroll = 0;
    this._jump = false;
    this._attack = false;
    this._build = false;
    this._skill = false;
    this._drop = false;
    this._backpack = false;
    this._action = false;
    // 按钮单帧事件
    this.buttons.jump = false;
    this.buttons.attack = false;
    this.buttons.build = false;
    this.buttons.skill = false;
    this.buttons.action = false;
  }

  /**
   * 每帧开始时调用，处理持续触摸输入（视角滑动增量）
   */
  update() {
    if (this.isMobile()) this._ensureMobileControls();
  }

  // ───────────────────────────── 公开查询方法 ─────────────────────────────

  /** 获取移动方向向量 { x, z, sprint } */
  getMovement() {
    let x = 0, z = 0, sprint = false;

    if (this.isMobile()) {
      // 触摸摇杆
      x = this.joystick.dx;
      z = this.joystick.dy;
    } else {
      // 键盘 WASD
      if (this.isDown('KeyW')) z -= 1;
      if (this.isDown('KeyS')) z += 1;
      if (this.isDown('KeyA')) x -= 1;
      if (this.isDown('KeyD')) x += 1;
      // 归一化
      const len = Math.sqrt(x * x + z * z);
      if (len > 1) { x /= len; z /= len; }
      sprint = !!this.isDown('ShiftLeft');
    }
    return { x, z, sprint };
  }

  /** 获取视角增量 { dx, dy }（弧度制） */
  getLook() {
    return { dx: this.look.dx, dy: this.look.dy };
  }

  // ───────────── 单帧消费（调用后由 resetFrame 自动清零） ─────────────

  /** 消费跳跃事件 */
  consumeJump() {
    if (this._jump) { this._jump = false; return true; }
    if (this.buttons.jump) { this.buttons.jump = false; return true; }
    return false;
  }

  /** 消费攻击事件 */
  consumeAttack() {
    if (this._attack) { this._attack = false; return true; }
    if (this.buttons.attack) { this.buttons.attack = false; return true; }
    return false;
  }

  /** 消费建造/放置方块事件 */
  consumeBuild() {
    if (this._build) { this._build = false; return true; }
    if (this.buttons.build) { this.buttons.build = false; return true; }
    return false;
  }

  /** 消费技能事件 */
  consumeSkill() {
    if (this._skill) { this._skill = false; return true; }
    if (this.buttons.skill) { this.buttons.skill = false; return true; }
    return false;
  }

  /** 消费丢弃事件 */
  consumeDrop() {
    if (this._drop) { this._drop = false; return true; }
    return false;
  }

  /** 消费背包事件 */
  consumeBackpack() {
    if (this._backpack) { this._backpack = false; return true; }
    return false;
  }

  /** 消费交互事件 */
  consumeAction() {
    if (this._action) { this._action = false; return true; }
    if (this.buttons.action) { this.buttons.action = false; return true; }
    return false;
  }

  /** 获取快捷栏滚轮增量（每帧由 resetFrame 清零） */
  getHotbarScroll() {
    return this.hotbarScroll;
  }

  // ───────────── 持续按压查询 ─────────────

  /** 查询按键是否处于按下状态 */
  isDown(code) {
    return !!this.keys[code];
  }

  /** 攻击是否持续按住 */
  isAttackHeld() {
    return this._attackHeld || this.buttons.attackHeld;
  }

  /** 建造是否持续按住 */
  isBuildHeld() {
    return this._buildHeld;
  }

  /** 交互是否持续按住 */
  isActionHeld() {
    return this._actionHeld || this.buttons.actionHeld;
  }

  // ───────────────────────────── 移动端判断 ─────────────────────────────

  /** 是否为移动端（触摸屏） */
  isMobile() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  }

  // ───────────────────────────── 移动端控制DOM ─────────────────────────────

  /**
   * 懒创建移动端虚拟控制按钮DOM，仅创建一次。
   * 包含：虚拟摇杆底座、视角区域、攻击/跳跃/技能/建造/交互/背包按钮。
   */
  _ensureMobileControls() {
    if (this._mobileContainer) return;
    const container = document.createElement('div');
    container.id = 'mobile-controls';
    container.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    this._mobileContainer = container;

    // 虚拟摇杆底座
    const joystickBase = this._createTouchZone('joystick', {
      position: 'absolute',
      left: '20px',
      bottom: '20px',
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.15)',
      border: '2px solid rgba(255,255,255,0.3)',
      pointerEvents: 'auto',
      touchAction: 'none',
    });
    container.appendChild(joystickBase);

    // 视角触摸区域（右半屏幕）
    const lookZone = this._createTouchZone('look', {
      position: 'absolute',
      right: '0',
      top: '0',
      width: '55%',
      height: '100%',
      pointerEvents: 'auto',
      touchAction: 'none',
    });
    container.appendChild(lookZone);

    // ── 右下角按钮组 ──
    const btnGroup = document.createElement('div');
    btnGroup.style.cssText =
      'position:absolute;right:15px;bottom:20px;display:flex;flex-direction:column;gap:10px;pointer-events:auto;';
    container.appendChild(btnGroup);

    // 攻击按钮
    btnGroup.appendChild(this._createButton('attack', 'ATK', '#e74c3c', '50px', '50px'));
    // 建造按钮
    btnGroup.appendChild(this._createButton('build', 'BLD', '#2ecc71', '50px', '50px'));
    // 技能按钮
    btnGroup.appendChild(this._createButton('skill', 'SKL', '#9b59b6', '50px', '50px'));
    // 交互按钮
    btnGroup.appendChild(this._createButton('action', 'ACT', '#3498db', '50px', '50px'));

    // 跳跃按钮（右下角大按钮）
    container.appendChild(this._createButton('jump', 'JMP', 'rgba(255,255,255,0.25)', {
      position: 'absolute',
      right: '80px',
      bottom: '25px',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.4)',
      color: '#fff',
      fontSize: '14px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'auto',
      touchAction: 'none',
    }));

    // 背包按钮
    container.appendChild(this._createButton('backpack', 'INV', 'rgba(255,255,255,0.15)', {
      position: 'absolute',
      right: '150px',
      bottom: '30px',
      width: '50px',
      height: '50px',
      borderRadius: '8px',
      border: '2px solid rgba(255,255,255,0.3)',
      color: '#fff',
      fontSize: '12px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'auto',
      touchAction: 'none',
    }));

    document.body.appendChild(container);

    // ── 为按钮绑定 touchstart/touchend ──
    this._bindMobileButtons(container);
  }

  /** 创建触摸区域元素 */
  _createTouchZone(name, styles) {
    const el = document.createElement('div');
    el.dataset.inputBtn = name;
    el.style.cssText = Object.entries(styles)
      .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${v}`)
      .join(';');
    return el;
  }

  /** 创建触摸按钮元素（支持简写参数或完整样式对象） */
  _createButton(name, label, bg, sizeOrStyle, height) {
    const el = document.createElement('div');
    el.dataset.inputBtn = name;
    el.textContent = label;
    if (typeof sizeOrStyle === 'object') {
      el.style.cssText = Object.entries(sizeOrStyle)
        .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${v}`)
        .join(';');
      el.style.background = bg;
    } else {
      const w = sizeOrStyle;
      const h = height;
      el.style.cssText =
        `width:${w};height:${h};border-radius:50%;background:${bg};color:#fff;` +
        `font-size:12px;font-weight:bold;display:flex;align-items:center;justify-content:center;` +
        `pointer-events:auto;touch-action:none;`;
    }
    return el;
  }

  /** 为移动端按钮绑定触摸事件 */
  _bindMobileButtons(container) {
    const buttons = container.querySelectorAll('[data-input-btn]');
    for (const btn of buttons) {
      const name = btn.dataset.inputBtn;
      if (name === 'joystick' || name === 'look') continue; // 由统一 touchstart 处理

      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.changedTouches[0];
        this._handleTouchButton(name, touch.clientX, touch.clientY);
      }, { passive: false });

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // 释放长按状态
        if (name === 'attack') this.buttons.attackHeld = false;
        if (name === 'skill') this.buttons.skillHeld = false;
        if (name === 'action') this.buttons.actionHeld = false;
      }, { passive: false });
    }
  }
}
