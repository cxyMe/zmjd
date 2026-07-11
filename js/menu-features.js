// ============================================
// 主界面赛季/任务 + HUD自定义布局
// ============================================

class MenuGrowthUI {
  constructor() {
    this.panel = document.getElementById('menuGrowthPanel');
    this.body = document.getElementById('menuGrowthBody');
    this.title = document.getElementById('menuGrowthTitle');
    this.tab = 'season';
    this.profile = JSON.parse(localStorage.getItem('bedwars_growth_profile') || '{"stardust":0,"rankScore":0,"seasonXp":0}');
    this.bind();
  }

  bind() {
    document.getElementById('menuSeasonBtn')?.addEventListener('click', () => this.open('season'));
    document.getElementById('menuTasksBtn')?.addEventListener('click', () => this.open('tasks'));
    document.querySelectorAll('[data-menu-growth-tab]').forEach(btn => {
      btn.addEventListener('click', () => this.open(btn.dataset.menuGrowthTab));
    });
  }

  open(tab = 'season') {
    this.tab = tab;
    this.profile = JSON.parse(localStorage.getItem('bedwars_growth_profile') || '{"stardust":0,"rankScore":0,"seasonXp":0}');
    document.querySelectorAll('[data-menu-growth-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.menuGrowthTab === tab);
    });
    if (this.panel) this.panel.style.display = 'flex';
    this.render();
  }

  close() {
    if (this.panel) this.panel.style.display = 'none';
  }

  render() {
    if (!this.body) return;
    if (this.tab === 'season') return this.renderSeason();
    if (this.tab === 'tasks') return this.renderTasks();
    if (this.tab === 'rewards') return this.renderRewards();
  }

  renderSeason() {
    const xp = this.profile.seasonXp || 0;
    const level = Math.floor(xp / 300) + 1;
    this.title.textContent = '赛季征程';
    this.body.innerHTML = `
      <div class="growth-summary">
        <span class="growth-pill">赛季等级：${level}</span>
        <span class="growth-pill">赛季积分：${xp}</span>
        <span class="growth-pill">周期：每3个月重置</span>
      </div>
      <div class="season-track">
        ${[1,2,3,4,5,6,7,8,9,10].map(lv => `
          <div class="season-node ${level >= lv ? 'unlocked' : ''}">
            <b>Lv.${lv}</b><span>${level >= lv ? '已解锁' : `${lv * 300}分`}</span>
          </div>
        `).join('')}
      </div>
      <div class="growth-grid">
        <div class="season-card"><h4>本赛季主题：梦域远征</h4><p>通过对局建造、击杀、拆床、团队资源贡献获得赛季积分。</p></div>
        <div class="season-card"><h4>赛季规则</h4><p>赛季、任务、奖励均在主界面查看；游戏内只保留战斗和必要HUD。</p></div>
      </div>`;
  }

  renderTasks() {
    this.title.textContent = '赛季任务';
    const taskState = JSON.parse(localStorage.getItem('bedwars_task_progress') || '{}');
    const tasks = [
      { key: 'daily_blocks', type: '日常', name: '累计放置500个方块', target: 500, value: taskState.daily_blocks || 0, reward: '120赛季积分' },
      { key: 'daily_resources', type: '日常', name: '拾取200个资源物品', target: 200, value: taskState.daily_resources || 0, reward: '80赛季积分' },
      { key: 'weekly_arrow', type: '周常', name: '用弓箭击杀3名敌人', target: 3, value: taskState.weekly_arrow || 0, reward: '重置卷轴碎片' },
      { key: 'weekly_bed', type: '周常', name: '摧毁5张敌方床', target: 5, value: taskState.weekly_bed || 0, reward: '300赛季积分' }
    ];
    this.body.innerHTML = `
      <div class="growth-summary">
        <span class="growth-pill">任务入口已迁移至主界面</span>
        <span class="growth-pill">对局结算后自动累计</span>
      </div>
      <div class="task-list">
        ${tasks.map(t => {
          const pct = Math.min(100, Math.floor((t.value / t.target) * 100));
          return `<div class="task-card">
            <div class="task-head"><b>${t.type}｜${t.name}</b><span>${t.value}/${t.target}</span></div>
            <div class="task-track"><div style="width:${pct}%"></div></div>
            <p>奖励：${t.reward}</p>
          </div>`;
        }).join('')}
      </div>`;
  }

  renderRewards() {
    const xp = this.profile.seasonXp || 0;
    const level = Math.floor(xp / 300) + 1;
    this.title.textContent = '赛季奖励';
    const rewards = [
      ['Lv.2', '出生拖尾光效'],
      ['Lv.4', '拆床宣言：梦域破碎'],
      ['Lv.6', '重置卷轴'],
      ['Lv.8', '专属表情：胜利鞠躬'],
      ['Lv.10', '筑梦远征头像框']
    ];
    this.body.innerHTML = `<div class="growth-grid">
      ${rewards.map(([lv, reward]) => {
        const num = parseInt(lv.replace('Lv.', ''), 10);
        return `<div class="season-card ${level >= num ? 'reward-unlocked' : ''}">
          <h4>${lv}</h4><p>${reward}</p><p>${level >= num ? '已达到领取条件' : '继续完成任务解锁'}</p>
        </div>`;
      }).join('')}
    </div>`;
  }

}

class HUDLayoutManager {
  constructor() {
    this.panel = document.getElementById('layoutPanel');
    this.status = document.getElementById('layoutStatus');
    this.editing = false;
    this.drag = null;
    this.items = ['resourceBar','gameTimer','teamInfo','minimap','playerStatus','hotbar','shopBtn','layoutBtn','skillBtn','rescueBtn','mobileControls'];
    this.defaultKey = 'bedwars_hud_layout_default';
    this.activeKey = 'bedwars_hud_layout_active';
    this.bind();
  }

  bind() {
    document.getElementById('layoutBtn')?.addEventListener('click', () => this.open());
    document.getElementById('layoutCloseBtn')?.addEventListener('click', () => this.close());
    document.getElementById('layoutEditBtn')?.addEventListener('click', () => this.toggleEdit());
    document.getElementById('layoutResetBtn')?.addEventListener('click', () => this.reset());
    document.querySelectorAll('[data-save-layout]').forEach(btn => btn.addEventListener('click', () => this.save(btn.dataset.saveLayout)));
    document.querySelectorAll('[data-load-layout]').forEach(btn => btn.addEventListener('click', () => this.load(btn.dataset.loadLayout)));
    document.addEventListener('pointermove', e => this.onMove(e));
    document.addEventListener('pointerup', () => this.onUp());
  }

  init() {
    this.captureDefault();
    this.apply(JSON.parse(localStorage.getItem(this.activeKey) || 'null'));
    this.bindSizeSliders();
    this.applySizeSettings();
  }

  bindSizeSliders() {
    const joySlider = document.getElementById('joystickSizeSlider');
    const joyVal = document.getElementById('joystickSizeVal');
    const btnSlider = document.getElementById('btnSizeSlider');
    const btnVal = document.getElementById('btnSizeVal');
    if (joySlider) {
      joySlider.value = parseFloat(localStorage.getItem('bedwars_joystick_size')) || 100;
      if (joyVal) joyVal.textContent = joySlider.value;
      joySlider.addEventListener('input', () => {
        const v = parseFloat(joySlider.value);
        if (joyVal) joyVal.textContent = v;
        localStorage.setItem('bedwars_joystick_size', v);
        this.applySizeSettings();
      });
    }
    if (btnSlider) {
      btnSlider.value = parseFloat(localStorage.getItem('bedwars_btn_size')) || 100;
      if (btnVal) btnVal.textContent = btnSlider.value;
      btnSlider.addEventListener('input', () => {
        const v = parseFloat(btnSlider.value);
        if (btnVal) btnVal.textContent = v;
        localStorage.setItem('bedwars_btn_size', v);
        this.applySizeSettings();
      });
    }
  }

  applySizeSettings() {
    const joyScale = (parseFloat(localStorage.getItem('bedwars_joystick_size')) || 100) / 100;
    const btnScale = (parseFloat(localStorage.getItem('bedwars_btn_size')) || 100) / 100;
    const joyZone = document.getElementById('joystickZone');
    const joyBase = document.getElementById('joystickBase');
    const jumpBtn = document.getElementById('jumpBtnMobile');
    const actionBtn = document.getElementById('actionBtnMobile');
    if (joyZone) { joyZone.style.width = `${140 * joyScale}px`; joyZone.style.height = `${140 * joyScale}px`; }
    if (joyBase) { joyBase.style.width = `${140 * joyScale}px`; joyBase.style.height = `${140 * joyScale}px`; }
    if (jumpBtn) { jumpBtn.style.width = `${76 * btnScale}px`; jumpBtn.style.height = `${76 * btnScale}px`; }
    if (actionBtn) { actionBtn.style.width = `${88 * btnScale}px`; actionBtn.style.height = `${88 * btnScale}px`; }
  }

  captureDefault() {
    if (localStorage.getItem(this.defaultKey)) return;
    const defaults = {};
    this.items.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const cs = getComputedStyle(el);
      defaults[id] = { top: cs.top, left: cs.left, right: cs.right, bottom: cs.bottom, transform: cs.transform };
    });
    localStorage.setItem(this.defaultKey, JSON.stringify(defaults));
  }

  open() {
    if (this.panel) this.panel.style.display = 'flex';
    if (document.pointerLockElement) document.exitPointerLock();
  }

  close() {
    if (this.panel) this.panel.style.display = 'none';
    if (!this.editing && window.game?.gameActive && !window.game?.input?.isMobile?.()) {
      window.game.engine.renderer.domElement.requestPointerLock();
    }
  }

  toggleEdit() {
    this.editing = !this.editing;
    document.body.classList.toggle('layout-editing', this.editing);
    document.getElementById('layoutEditBtn').textContent = this.editing ? '关闭编辑' : '开启编辑';
    this.items.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle('layout-draggable', this.editing);
      el.onpointerdown = this.editing ? (e) => this.onDown(e, el) : null;
    });
    this.setStatus(this.editing ? '编辑模式已开启：拖动HUD组件即可调整位置。' : '编辑模式已关闭。');
  }

  onDown(e, el) {
    if (!this.editing || e.target.closest?.('#layoutPanel, #shopPanel, #backpackPanel, #socialPanel')) return;
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    this.drag = { el, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    el.setPointerCapture?.(e.pointerId);
  }

  onMove(e) {
    if (!this.drag) return;
    const el = this.drag.el;
    const x = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, e.clientX - this.drag.offsetX));
    const y = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, e.clientY - this.drag.offsetY));
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.transform = 'none';
  }

  onUp() {
    if (!this.drag) return;
    this.persistActive();
    this.drag = null;
  }

  collect() {
    const layout = {};
    this.items.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      layout[id] = {
        top: el.style.top || getComputedStyle(el).top,
        left: el.style.left || getComputedStyle(el).left,
        right: el.style.right || getComputedStyle(el).right,
        bottom: el.style.bottom || getComputedStyle(el).bottom,
        transform: el.style.transform || getComputedStyle(el).transform
      };
    });
    return layout;
  }

  apply(layout) {
    if (!layout) return;
    Object.entries(layout).forEach(([id, pos]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.top = pos.top;
      el.style.left = pos.left;
      el.style.right = pos.right;
      el.style.bottom = pos.bottom;
      el.style.transform = pos.transform === 'none' ? '' : pos.transform;
    });
  }

  persistActive() {
    localStorage.setItem(this.activeKey, JSON.stringify(this.collect()));
  }

  save(slot) {
    const layout = this.collect();
    localStorage.setItem(`bedwars_hud_layout_${slot}`, JSON.stringify(layout));
    localStorage.setItem(this.activeKey, JSON.stringify(layout));
    this.setStatus(`已保存到布局${slot}。`);
  }

  load(slot) {
    const layout = JSON.parse(localStorage.getItem(`bedwars_hud_layout_${slot}`) || 'null');
    if (!layout) return this.setStatus(`布局${slot}还没有保存。`);
    this.apply(layout);
    localStorage.setItem(this.activeKey, JSON.stringify(layout));
    this.setStatus(`已读取布局${slot}。`);
  }

  reset() {
    const defaults = JSON.parse(localStorage.getItem(this.defaultKey) || '{}');
    this.apply(defaults);
    localStorage.removeItem(this.activeKey);
    this.setStatus('已一键复原默认布局。');
  }

  setStatus(text) {
    if (this.status) this.status.textContent = text;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.menuGrowthUI = new MenuGrowthUI();
  window.hudLayoutManager = new HUDLayoutManager();
});
