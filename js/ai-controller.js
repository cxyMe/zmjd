// ============================================
// AI 控制器：战略层 + 战术层 + 执行层（拟人微操）
// ============================================

const AI_CONFIG = {
  MAX_AI_COUNT: 4,           // 单局最多4个AI
  STRATEGIC_INTERVAL: 3,     // 战略评估间隔（秒）
  STRATEGIC_INTERVAL_FAR: 5,  // 远距离AI降频
  FAR_DISTANCE: 50,           // 超过此距离降频
  XP_REDUCTION: 0.5,         // AI对局经验/金币减少50%
  NO_RANK_POINTS: true,       // AI击杀不计入排位段位

  // 拟人微操参数
  AIM_NEAR_DEVIATION: 3,      // 近距离瞄准偏差（度）
  AIM_FAR_DEVIATION: 8,       // 远距离瞄准偏差（度）
  REACTION_MIN: 0.15,         // 最短反应时间（秒）
  REACTION_MAX: 0.45,         // 最长反应时间（秒）
  ACTION_FREQ_MIN: 4,         // 每秒最少操作次数
  ACTION_FREQ_MAX: 8,         // 每秒最多操作次数
  JUMP_INTERVAL_MIN: 3,       // 跳跃最短间隔（秒）
  JUMP_INTERVAL_MAX: 8,       // 跳跃最长间隔（秒）
  MISTAKE_RATE: 0.03,         // 关键操作失误概率3%

  // 战略权重
  WEIGHT_BED_ATTACKED: 100,   // 己方床被攻击
  WEIGHT_DEAD_ALLY: 40,       // 队友阵亡
  WEIGHT_RESOURCE_RICH: 30,   // 资源充足
  WEIGHT_ENEMY_BED_EXPOSED: 70, // 敌方床暴露
  WEIGHT_EARLY_GAME: 50,      // 前3分钟发育
  WEIGHT_LATE_ATTACK: 60,     // 15分钟后进攻
  WEIGHT_ALLY_NEAR_ENEMY: 40, // 队友在敌岛
  WEIGHT_LOW_HP: 80,          // 自身低血量
};

class AIController {
  constructor(entity, engine, game) {
    this.ent = entity;
    this.engine = engine;
    this.game = game;

    // 战略层状态
    this.strategicTimer = Math.random() * AI_CONFIG.STRATEGIC_INTERVAL;
    this.currentGoal = 'develop'; // develop, defend, attack, support, shop, flee
    this.goalWeights = {};
    this.gamePhase = 'early'; // early, mid, late

    // 战术层状态
    this.tacticalTarget = null;    // 目标位置或实体
    this.tacticalAction = null;    // 当前执行动作
    this.tacticalPath = [];        // 简易寻路路径
    this.pathIndex = 0;

    // 执行层：拟人微操
    this.reactionDelay = this.randomRange(AI_CONFIG.REACTION_MIN, AI_CONFIG.REACTION_MAX);
    this.reactionTimer = this.reactionDelay;
    this.actionCooldown = 0;
    this.actionInterval = 1 / this.randomRange(AI_CONFIG.ACTION_FREQ_MIN, AI_CONFIG.ACTION_FREQ_MAX);
    this.jumpTimer = this.randomRange(AI_CONFIG.JUMP_INTERVAL_MIN, AI_CONFIG.JUMP_INTERVAL_MAX);
    this.lastMistake = false;

    // 辅助
    this.lastEnemySeen = null;
    this.lastEnemyPos = null;
    this.stuckTimer = 0;
    this.lastPos = entity.pos.clone();
    this.bedAttackWarning = false;
  }

  randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  // ============================================
  // 战略层：局势判断与权重评估
  // ============================================
  evaluateStrategy(dt, gameTime) {
    // 根据距离降频
    const localPlayer = this.game?.localPlayer;
    if (localPlayer && this.ent.pos.distanceTo(localPlayer.pos) > AI_CONFIG.FAR_DISTANCE) {
      this.strategicTimer -= dt;
      if (this.strategicTimer > 0) return;
      this.strategicTimer = AI_CONFIG.STRATEGIC_INTERVAL_FAR;
    } else {
      this.strategicTimer -= dt;
      if (this.strategicTimer > 0) return;
      this.strategicTimer = AI_CONFIG.STRATEGIC_INTERVAL;
    }

    // 游戏阶段
    if (gameTime < 180) this.gamePhase = 'early';
    else if (gameTime < 900) this.gamePhase = 'mid';
    else this.gamePhase = 'late';

    const weights = {
      develop: 0,
      defend: 0,
      attack: 0,
      support: 0,
      shop: 0,
      flee: 0
    };

    // 1. 己方床状态
    const myBed = this.ent.teamInfo;
    if (!myBed.bedAlive) {
      weights.defend += AI_CONFIG.WEIGHT_BED_ATTACKED * 0.5; // 床已没，低优先级防守
    } else {
      // 检查是否有敌人在己方床附近
      const bedPos = myBed.bedPos;
      let enemyNearBed = false;
      for (const e of this.engine.entities) {
        if (e.team === this.ent.team || e.isDead) continue;
        if (e.pos.distanceTo(bedPos) < 15) { enemyNearBed = true; break; }
      }
      if (enemyNearBed) {
        weights.defend += AI_CONFIG.WEIGHT_BED_ATTACKED;
        if (!this.bedAttackWarning) {
          this.bedAttackWarning = true;
          // AI语音/消息
          this.game?.showMessage?.(`${this.ent.name} 发现敌方攻击己方床！`, '#ff4444');
        }
      } else {
        this.bedAttackWarning = false;
      }
    }

    // 2. 己方人数
    let deadAllies = 0;
    let totalAllies = 0;
    for (const e of this.engine.entities) {
      if (e.team === this.ent.team && e !== this.ent) {
        totalAllies++;
        if (e.isDead) deadAllies++;
      }
    }
    if (deadAllies > 0) {
      weights.defend += AI_CONFIG.WEIGHT_DEAD_ALLY;
      weights.support += AI_CONFIG.WEIGHT_DEAD_ALLY * 0.6;
    }

    // 3. 资源持有量
    const totalRes = (this.ent.inv.copper || 0) + (this.ent.inv.silver || 0) * 3 + (this.ent.inv.gold || 0) * 8 + (this.ent.inv.jade || 0) * 20;
    if (totalRes > 100) {
      weights.shop += AI_CONFIG.WEIGHT_RESOURCE_RICH;
    }

    // 4. 敌方床状态
    for (const [tkey, tinfo] of Object.entries(TEAMS)) {
      if (tkey === this.ent.team) continue;
      if (tinfo.bedAlive) {
        weights.attack += AI_CONFIG.WEIGHT_ENEMY_BED_EXPOSED * 0.3; // 有存活的敌方床
      }
    }

    // 5. 当前阶段
    if (this.gamePhase === 'early') {
      weights.develop += AI_CONFIG.WEIGHT_EARLY_GAME;
    } else if (this.gamePhase === 'late') {
      weights.attack += AI_CONFIG.WEIGHT_LATE_ATTACK;
    } else {
      weights.attack += 30;
      weights.develop += 20;
    }

    // 6. 队友位置
    for (const e of this.engine.entities) {
      if (e.team === this.ent.team || e.isDead || e === this.ent) continue;
      // 检查队友是否靠近敌方基地
      for (const [tkey, tinfo] of Object.entries(TEAMS)) {
        if (tkey === this.ent.team) continue;
        if (e.pos.distanceTo(tinfo.spawn) < 20) {
          weights.support += AI_CONFIG.WEIGHT_ALLY_NEAR_ENEMY;
        }
      }
    }

    // 7. 自身低血量
    if (this.ent.hp < this.ent.maxHp * 0.3) {
      weights.flee += AI_CONFIG.WEIGHT_LOW_HP;
      weights.defend += AI_CONFIG.WEIGHT_LOW_HP * 0.5;
    }

    this.goalWeights = weights;

    // 选择最高权重目标
    let bestGoal = 'develop';
    let bestScore = -1;
    for (const [goal, score] of Object.entries(weights)) {
      // 加入小随机性（±10%）
      const adjusted = score * (0.9 + Math.random() * 0.2);
      if (adjusted > bestScore) {
        bestScore = adjusted;
        bestGoal = goal;
      }
    }

    this.currentGoal = bestGoal;
    this.selectTacticalAction();
  }

  evaluateSecretKiller() {
    const role = this.ent.skRole;
    if (!role) return;
    
    if (role === 'killer') {
      this.currentGoal = 'sk_hunt';
      // Find nearest good guy
      let nearest = null, nearDist = Infinity;
      for (const e of this.engine.entities) {
        if (e === this.ent || e.isDead || e.skRole === 'killer') continue;
        const d = e.pos.distanceTo(this.ent.pos);
        if (d < nearDist) { nearDist = d; nearest = e; }
      }
      this.tacticalTarget = nearest;
      
      // If detective is close, consider fleeing
      const detective = this.engine.entities.find(e => !e.isDead && e.skRole === 'detective');
      if (detective && detective.pos.distanceTo(this.ent.pos) < 8) {
        this.currentGoal = 'sk_evade';
        this.tacticalTarget = detective;
      }
    } else if (role === 'detective') {
      this.currentGoal = 'sk_find_killer';
      // Move toward center or patrol
      if (!this.tacticalTarget || this.tacticalTarget.isDead || this.tacticalTarget.skRole !== 'killer') {
        this.tacticalTarget = this.engine.entities.find(e => !e.isDead && e.skRole === 'killer');
      }
      if (!this.tacticalTarget) {
        // Patrol - move to random points
        this.currentGoal = 'sk_patrol';
      }
    } else {
      this.currentGoal = 'sk_collect';
      // Find nearest fragment drop
      let nearestFrag = null, fragDist = Infinity;
      for (const drop of this.engine.dropItems) {
        if (drop.typeKey === 'fragment') {
          const d = drop.pos.distanceTo(this.ent.pos);
          if (d < fragDist) { fragDist = d; nearestFrag = drop; }
        }
      }
      this.tacticalTarget = nearestFrag ? { pos: nearestFrag.pos } : null;
      
      // Also flee from killer if close
      const killer = this.engine.entities.find(e => !e.isDead && e.skRole === 'killer');
      if (killer && killer.pos.distanceTo(this.ent.pos) < 6) {
        this.currentGoal = 'sk_evade';
        this.tacticalTarget = killer;
      }
    }
  }

  // ============================================
  // 战术层：行为树行动选择
  // ============================================
  selectTacticalAction() {
    switch (this.currentGoal) {
      case 'defend':
        this.tacticalAction = 'moveToDefend';
        this.tacticalTarget = this.ent.teamInfo.bedPos.clone();
        break;

      case 'attack':
        this.tacticalAction = 'moveToAttack';
        // 选择最近的敌方床
        let nearestBed = null;
        let nearestDist = Infinity;
        for (const [tkey, tinfo] of Object.entries(TEAMS)) {
          if (tkey === this.ent.team || !tinfo.bedAlive) continue;
          const d = this.ent.pos.distanceTo(tinfo.bedPos);
          if (d < nearestDist) { nearestDist = d; nearestBed = tinfo.bedPos.clone(); }
        }
        this.tacticalTarget = nearestBed;
        break;

      case 'support':
        this.tacticalAction = 'moveToSupport';
        // 找最近的活着队友
        let nearestAlly = null;
        let allyDist = Infinity;
        for (const e of this.engine.entities) {
          if (e.team !== this.ent.team || e.isDead || e === this.ent) continue;
          const d = this.ent.pos.distanceTo(e.pos);
          if (d < allyDist) { allyDist = d; nearestAlly = e; }
        }
        this.tacticalTarget = nearestAlly ? nearestAlly.pos.clone() : null;
        break;

      case 'shop':
        this.tacticalAction = 'shopping';
        this.executeShopLogic();
        break;

      case 'flee':
        this.tacticalAction = 'fleeToBase';
        this.tacticalTarget = this.ent.teamInfo.spawn.clone();
        break;

      case 'develop':
      default:
        this.tacticalAction = 'gatherResources';
        // 找最近的资源生成器
        this.findNearestResource();
        break;
    }
  }

  findNearestResource() {
    const gens = this.game?.gens || [];
    let nearest = null;
    let nearDist = Infinity;
    for (const g of gens) {
      if (!g.pos) continue;
      const d = this.ent.pos.distanceTo(g.pos);
      if (d < nearDist) { nearDist = d; nearest = g.pos.clone(); }
    }
    this.tacticalTarget = nearest;
  }

  executeShopLogic() {
    // AI购物逻辑：根据当前装备和资源决定买什么
    const inv = this.ent.inv;
    const hasWeapon = this.ent.equipped.weapon !== null;
    const hasArmor = this.ent.equipped.armor !== null;
    const hasBow = this.ent.equipped.weapon === 'bow';
    const arrowCount = this.ent.arrowCount || 0;

    // 优先级：武器 > 护甲 > 箭矢 > 方块
    if (!hasWeapon) {
      if (inv.copper >= 4) { this.game.buyItem('wood_sword', 1, this.ent); this.tacticalAction = 'develop'; return; }
      if (inv.silver >= 3) { this.game.buyItem('stone_sword', 1, this.ent); this.tacticalAction = 'develop'; return; }
    }
    if (hasBow && arrowCount < 8) {
      if (inv.silver >= 2) { this.game.buyItem('arrow', 1, this.ent); this.tacticalAction = 'develop'; return; }
    }
    if (!hasArmor) {
      if (inv.gold >= 8) { this.game.buyItem('std_armor', 1, this.ent); this.tacticalAction = 'develop'; return; }
    }
    // 买方块
    if (inv.copper >= 16) { this.game.buyItem('wood_plank', 1, this.ent); }
    else if (inv.silver >= 8) { this.game.buyItem('stone_plate', 1, this.ent); }

    this.tacticalAction = 'develop';
    this.currentGoal = 'develop';
  }

  // ============================================
  // 执行层：微操作控制（拟人手感）
  // ============================================
  update(dt, gameTime) {
    if (this.ent.isDead) return;

    // Secret Killer mode override
    if (this.game?.isSecretKiller && this.ent.skRole) {
      this.evaluateSecretKiller();
      this.executeSecretKiller(dt);
      return;
    }

    // 战略评估
    this.evaluateStrategy(dt, gameTime);

    // 反应延迟
    this.reactionTimer -= dt;
    if (this.reactionTimer > 0) return;
    this.reactionTimer = this.reactionDelay;

    // 操作频率冷却
    this.actionCooldown -= dt;
    if (this.actionCooldown > 0) {
      // 冷却中仍保持移动
      this.executeMovement(dt);
      return;
    }
    this.actionCooldown = this.actionInterval;

    // 跳跃习惯
    this.jumpTimer -= dt;
    if (this.jumpTimer <= 0) {
      this.ent.vel.y = 8;
      this.jumpTimer = this.randomRange(AI_CONFIG.JUMP_INTERVAL_MIN, AI_CONFIG.JUMP_INTERVAL_MAX);
    }

    // 执行当前战术动作
    this.executeMovement(dt);
    this.executeCombat(dt);
  }

  executeMovement(dt) {
    const target = this.tacticalTarget;
    if (!target) return;

    const dir = target.clone().sub(this.ent.pos);
    dir.y = 0;
    const dist = dir.length();

    if (dist < 2) {
      this.ent.vel.x *= 0.8;
      this.ent.vel.z *= 0.8;
      return;
    }

    dir.normalize();

    // 拟人化：加入微小方向偏差
    const deviation = (Math.random() - 0.5) * 0.15;
    const angle = Math.atan2(dir.x, dir.z) + deviation;
    const moveDir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));

    // 使用 moveInput 让 AI 利用现有移动系统
    const forward = new THREE.Vector3(-Math.sin(this.ent.yaw), 0, -Math.cos(this.ent.yaw));
    const right = new THREE.Vector3(Math.cos(this.ent.yaw), 0, -Math.sin(this.ent.yaw));

    const dotF = forward.dot(moveDir);
    const dotR = right.dot(moveDir);

    this.ent.moveInput(
      Math.abs(dotR) > 0.3 ? (dotR > 0 ? 1 : -1) : 0,
      dotF > 0 ? -1 : (dotF < -0.3 ? 1 : 0)
    );

    // 转向目标
    this.ent.yaw = Math.atan2(moveDir.x, moveDir.z);

    // 防卡检测
    this.stuckTimer += dt;
    if (this.stuckTimer > 2) {
      if (this.ent.pos.distanceTo(this.lastPos) < 0.5) {
        // 卡住了，尝试跳跃绕行
        this.ent.vel.y = 9;
        this.ent.vel.x += (Math.random() - 0.5) * 3;
        this.ent.vel.z += (Math.random() - 0.5) * 3;
      }
      this.lastPos.copy(this.ent.pos);
      this.stuckTimer = 0;
    }

    // 搭路到目标
    if (this.currentGoal === 'attack' || this.currentGoal === 'support') {
      this.aiBridgeBuild(dt);
    }
  }

  aiBridgeBuild(dt) {
    // AI自动搭路过间隙
    if (!this.tacticalTarget) return;
    const dir = this.tacticalTarget.clone().sub(this.ent.pos);
    dir.y = 0;
    const dist = dir.length();

    // 只在距离>10且脚下没有方块时搭路
    if (dist < 5 || dist > 40) return;

    const lookAhead = this.ent.pos.clone().add(dir.normalize().multiplyScalar(2));
    lookAhead.y = Math.floor(this.ent.pos.y);

    // 检查前方是否有地面
    const groundKey = this.engine.getBlockKey(lookAhead.x, lookAhead.y - 1, lookAhead.z);
    if (!this.engine.blocks.has(groundKey) && lookAhead.y > -2) {
      const blockType = this.ent.getSelectedBlockType();
      if (blockType) {
        const px = Math.floor(lookAhead.x);
        const py = Math.floor(lookAhead.y);
        const pz = Math.floor(lookAhead.z);
        this.engine.placeBlock(px, py, pz, blockType, this.ent.team);
        // 消耗方块
        const item = this.ent.getSelectedItem();
        if (item) {
          item.count--;
          if (item.count <= 0) this.ent.hotbar[this.ent.hotbarIndex] = null;
        }
      }
    }
  }

  executeCombat(dt) {
    // 扫描附近敌人
    let nearestEnemy = null;
    let nearestDist = 20; // AI感知范围

    for (const e of this.engine.entities) {
      if (e.team === this.ent.team || e.isDead) continue;
      const d = this.ent.pos.distanceTo(e.pos);
      if (d < nearestDist) {
        nearestDist = d;
        nearestEnemy = e;
      }
    }

    // 记录最后看到的敌人
    if (nearestEnemy) {
      this.lastEnemySeen = nearestEnemy;
      this.lastEnemyPos = nearestEnemy.pos.clone();
    }

    // 防守时优先攻击
    if (this.currentGoal === 'defend' && nearestEnemy && nearestDist < 8) {
      this.aiAttack(nearestEnemy, nearestDist);
      return;
    }

    // 进攻时攻击路上遇到的敌人
    if (this.currentGoal === 'attack' && nearestEnemy && nearestDist < 10) {
      this.aiAttack(nearestEnemy, nearestDist);
      return;
    }

    // 被攻击时反击
    if (this.ent.hp < this.ent.maxHp * 0.8 && nearestEnemy && nearestDist < 6) {
      this.aiAttack(nearestEnemy, nearestDist);
      return;
    }

    // 拆敌方床
    if (this.currentGoal === 'attack' && this.tacticalTarget) {
      const bedDist = this.ent.pos.distanceTo(this.tacticalTarget);
      if (bedDist < 5) {
        for (const [tkey, tinfo] of Object.entries(TEAMS)) {
          if (tkey === this.ent.team || !tinfo.bedAlive) continue;
          if (this.ent.pos.distanceTo(tinfo.bedPos) < 6) {
            // 拆床
            tinfo.bedAlive = false;
            tinfo.bedMesh.visible = false;
            this.engine.spawnParticles(tinfo.bedPos, tinfo.color, 20);
            this.ent.matchStats.beds++;
            this.game?.growth?.addXp?.(this.ent, GROWTH_CONFIG.xp.bedBreak, '拆床');
            this.game?.onBedDestroyed?.(tkey, this.ent);
            this.game?.showMessage?.(`${this.ent.name} 拆毁了 ${tinfo.name} 的床！`, '#ff4444');
            // 切换目标
            this.currentGoal = 'develop';
            this.selectTacticalAction();
          }
        }
      }
    }
  }

  aiAttack(enemy, dist) {
    // 拟人化瞄准偏差
    const deviation = dist < 5
      ? AI_CONFIG.AIM_NEAR_DEVIATION
      : AI_CONFIG.AIM_FAR_DEVIATION;
    const deviationRad = (Math.random() - 0.5) * 2 * (deviation * Math.PI / 180);

    // 转向敌人（加偏差）
    const dir = enemy.pos.clone().sub(this.ent.pos);
    dir.y = 0;
    const targetAngle = Math.atan2(dir.x, dir.z) + deviationRad;
    this.ent.yaw = targetAngle;

    // 失误判定
    if (Math.random() < AI_CONFIG.MISTAKE_RATE) {
      // 失误：这次不攻击
      return;
    }

    // 武器判定
    const weapon = this.ent.equipped.weapon;
    if (weapon === 'bow' && this.ent.arrowCount > 0) {
      // 远程攻击
      if (dist > 3 && dist < 18) {
        this.ent.attack();
      } else if (dist <= 3) {
        // 切换近战
        this.ent.hotbarIndex = 0;
        for (let i = 0; i < this.ent.hotbar.length; i++) {
          if (this.ent.hotbar[i] && ITEM_DB[this.ent.hotbar[i].key]?.type === 'weapon' && !ITEM_DB[this.ent.hotbar[i].key]?.ranged) {
            this.ent.hotbarIndex = i;
            this.ent.equipped.weapon = this.ent.hotbar[i].key;
            this.ent.updateWeaponMesh();
            break;
          }
        }
        this.ent.attack();
      }
    } else if (weapon && weapon !== 'bow') {
      // 近战攻击
      if (dist < 4) {
        this.ent.attack();
      }
    } else {
      // 没武器，先买或使用默认攻击
      if (dist < 3) {
        this.ent.attack();
      }
    }

    // 使用技能
    if (this.ent.skillCd <= 0 && dist < 8 && Math.random() < 0.3) {
      this.ent.useSkill();
    }

    // 使用药水
    if (this.ent.hp < this.ent.maxHp * 0.35) {
      for (let i = 0; i < this.ent.hotbar.length; i++) {
        if (this.ent.hotbar[i] && this.ent.hotbar[i].key === 'potion') {
          this.ent.hotbarIndex = i;
          this.ent.useHotbarItem();
          break;
        }
      }
    }

    // 追击或保持距离
    if (dist > 4 && weapon === 'bow') {
      // 保持距离
      const flee = this.ent.pos.clone().sub(enemy.pos).normalize().multiplyScalar(0.3);
      this.ent.vel.x += flee.x;
      this.ent.vel.z += flee.z;
    }
  }

  // 资源拾取增强
  tryPickupResources() {
    for (let i = this.engine.dropItems.length - 1; i >= 0; i--) {
      const drop = this.engine.dropItems[i];
      if (drop.pos.distanceTo(this.ent.pos) < 2.5) {
        if (drop.isCurrency && drop.currency) {
          this.ent.inv[drop.currency] = (this.ent.inv[drop.currency] || 0) + drop.count;
          this.engine.removeDropItem(drop);
        } else if (drop.typeKey) {
          this.ent.addToBackpack(drop.typeKey, drop.count);
          this.engine.removeDropItem(drop);
        }
      }
    }
    // 拾取死亡盒子
    for (const box of this.engine.deathBoxes) {
      if (box.pos.distanceTo(this.ent.pos) < 2) {
        for (const item of box.items) {
          this.ent.addToBackpack(item.key, item.count);
        }
        for (const [rk, rv] of Object.entries(box.currencies)) {
          if (rv > 0) this.ent.inv[rk] = (this.ent.inv[rk] || 0) + rv;
        }
        this.engine.spawnParticles(box.mesh.position, 0xffdd00, 10);
        this.engine.removeDeathBox(box);
      }
    }
  }

  // 资源生成器自动拾取
  autoGather(dt) {
    if (!this.game?.gens) return;
    for (const g of this.game.gens) {
      if (!g.pos || !g.drops || g.drops.length === 0) continue;
      for (let i = g.drops.length - 1; i >= 0; i--) {
        const drop = g.drops[i];
        if (drop.pos.distanceTo(this.ent.pos) < 3) {
          if (drop.isCurrency && drop.currency) {
            this.ent.inv[drop.currency] = (this.ent.inv[drop.currency] || 0) + drop.count;
            this.engine.removeDropItem(drop);
            if (i >= 0) g.drops.splice(i, 1);
          }
        }
      }
    }
  }

  executeSecretKiller(dt) {
    const role = this.ent.skRole;
    const target = this.tacticalTarget;
    
    // Movement toward target
    if (target) {
      const targetPos = target.pos || target;
      const dir = targetPos.clone().sub(this.ent.pos).normalize();
      this.ent.moveInput(dir.x, dir.z, false);
      
      // Jump if blocked
      if (this.ent.onGround && Math.random() < 0.02) {
        this.ent.vel.y = this.ent.jumpPower;
        this.ent.onGround = false;
      }
    }
    
    // Combat for killer
    if (role === 'killer' && this.currentGoal === 'sk_hunt' && target && !target.isDead) {
      const dist = target.pos.distanceTo(this.ent.pos);
      if (dist < 2.5) {
        this.ent.attack();
        // Also throw knife sometimes
        if (Math.random() < 0.01) {
          this.throwKnife(target);
        }
      } else if (dist < 15 && Math.random() < 0.005) {
        this.throwKnife(target);
      }
    }
    
    // Evade behavior
    if (this.currentGoal === 'sk_evade' && target) {
      const targetPos = target.pos || target;
      const away = this.ent.pos.clone().sub(targetPos).normalize();
      this.ent.moveInput(away.x, away.z, true);
    }
    
    // Detective combat
    if (role === 'detective' && this.currentGoal === 'sk_find_killer' && target && !target.isDead) {
      const dist = target.pos.distanceTo(this.ent.pos);
      if (dist < 15 && (this.ent.bowCdTimer || 0) <= 0) {
        this.ent.attack(); // Will fire arrow
      }
    }
    
    // Civilian fragment pickup
    if (role === 'civilian') {
      this.tryPickupResources();
    }
    
    // All roles: pick up dropped detective bow
    if (role === 'civilian') {
      for (const drop of this.engine.dropItems) {
        if (drop.typeKey === 'detective_bow' && drop.pos.distanceTo(this.ent.pos) < 2.5) {
          this.ent.hotbar[1] = { key: 'detective_bow', count: 1 };
          this.ent.skRole = 'detective';
          this.ent.arrowCount = 999;
          this.ent.bowCdTimer = 0;
          this.engine.removeDropItem(drop);
          break;
        }
      }
    }
  }

  throwKnife(target) {
    const dir = target.pos.clone().sub(this.ent.pos).normalize();
    const start = this.ent.pos.clone().add(new THREE.Vector3(0, 0.8, 0));
    this.engine.spawnWeaponProjectile(this.ent, 'arrow', start, dir, {
      damage: 1000,
      speed: 20,
      life: 2
    });
    // Remove knife from hotbar temporarily (it's throwable)
    // Actually keep it - killer always has the knife
  }
}

// ============================================
// AI 管理：创建、数量控制、全局更新
// ============================================
const AIManager = {
  controllers: [],
  activeCount: 0,

  createAI(engine, game, team, name, role = 'FOX') {
    const maxCount = game?.isSecretKiller ? 12 : AI_CONFIG.MAX_AI_COUNT;
    if (this.activeCount >= maxCount) return null;
    this.activeCount++;

    const entity = new PlayerEntity(engine, team, role, false, name, 'ai_' + name + '_' + Date.now());
    entity.aiTakeover = true;
    entity.isAI = true;

    // AI初始资源（少量，模拟新玩家）
    entity.inv.copper = 10 + Math.floor(Math.random() * 20);

    const controller = new AIController(entity, engine, game);
    this.controllers.push(controller);

    return { entity, controller };
  },

  updateAll(dt, gameTime) {
    for (const ctrl of this.controllers) {
      if (!ctrl.ent.isDead) {
        ctrl.update(dt, gameTime);
        ctrl.tryPickupResources();
        ctrl.autoGather(dt);
      }
    }
  },

  getCount() {
    return this.controllers.length;
  },

  removeAll() {
    for (let i = this.controllers.length - 1; i >= 0; i--) {
      this.controllers[i].ent.die(null);
    }
    this.controllers = [];
    this.activeCount = 0;
  },

  // 获取AI对局经验/金币减半系数
  getXpMultiplier() {
    return AI_CONFIG.XP_REDUCTION;
  }
};
