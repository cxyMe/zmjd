// ============================================
// chibi-models.js
// 筑梦激斗 Q版角色模型系统 (v3 - 参考图精确配色版)
// 2.5头身比例 | 500-1500三角面/角色 | 模块化部件
// MeshToonMaterial 卡通渲染 | 3色阶gradientMap
// ============================================

// ====== 角色设计数据（参考图精确配色）======
const CHIBI_SPECS = {
  FOX: {
    name: '狐狸', hp: 80, skinClass: 'role-fox', category: '先锋',
    bodyColor: 0xD4692A,
    bellyColor: 0xFDF6ED,
    earInner: 0xF5D5C8,
    pawColor: 0x5C3324,
    hairColor: 0xFDF6ED,
    eyeColor: 0x6B4423,
    noseColor: 0x8B5A5A,
    blushColor: 0xF5C4B8,
    scarfColor: 0xFDF6ED,
    coatColor: 0xFDF6ED,
    passive: { name: '附魔箭矢', desc: '箭矢落地产生火焰区域' },
    active: { name: '伪装', desc: '12秒隐身，受伤/攻击时解除', cd: 30 }
  },
  PORK_DOCTOR: {
    name: '猪猪医生', hp: 110, skinClass: 'role-pork', category: '支援',
    bodyColor: 0xFFB6C1,
    bellyColor: 0xFFF0F5,
    earInner: 0xFF8FAB,
    pawColor: 0xFFB6C1,
    hairColor: 0xFFD1DC,
    eyeColor: 0x4A3728,
    noseColor: 0xD47085,
    blushColor: 0xFFA07A,
    capeColor: 0xFFFDD0,
    coinColor: 0xFFD700,
    passive: { name: '生命光环', desc: '附近队友持续回血' },
    active: { name: '投币治疗', desc: '投出金币恢复队友生命', cd: 18 }
  },
  HURRICANE: {
    name: '飓风', hp: 95, skinClass: 'role-hurricane', category: '先锋',
    bodyColor: 0xFFF5F0,
    bellyColor: 0xFFF5F0,
    earInner: 0xFFF5F0,
    pawColor: 0x1A1A1A,
    hairColor: 0xF5F0FA,
    eyeColor: 0xC85FD9,
    noseColor: 0xFFB6C1,
    blushColor: 0xFFB6C1,
    hornColor: 0x2D1B4E,
    wingColor: 0x4A306D,
    wingHighlight: 0x9B7CB6,
    kimonoPurple: 0x3D2B5E,
    kimonoWhite: 0xFFFFFF,
    lavender: 0xC4A8D8,
    blossomPink: 0xF0C4D8,
    passive: { name: '剑气斩', desc: '普攻附带远程剑气' },
    active: { name: '瞬移斩', desc: '向准心方向瞬移6格并强化', cd: 16 }
  },
  FROST: {
    name: '冰霜', hp: 90, skinClass: 'role-frost', category: '法师',
    bodyColor: 0xFFF5F0,
    bellyColor: 0xFFFFFF,
    earInner: 0xFFD5E0,
    pawColor: 0xFFFFFF,
    hairColor: 0xFFFFFF,
    hairTip: 0xB4E8D0,
    eyeColor: 0x50C878,
    noseColor: 0xFFB6C1,
    blushColor: 0xFFB4C8,
    coatColor: 0xFFFFFF,
    mintGreen: 0x98FB98,
    goldButton: 0xFFC864,
    passive: { name: '冰霜领域', desc: '受击时脚下产生减速冰区' },
    active: { name: '冰锥', desc: '发射冰锥，命中产生冰区', cd: 10 }
  },
  DRIFTWOOD: {
    name: '漂木', hp: 100, skinClass: 'role-driftwood', category: '坦克',
    bodyColor: 0xFFFAF5,
    bellyColor: 0xFFFAF5,
    earInner: 0xFFE4C4,
    pawColor: 0xFFFAF5,
    hairColor: 0xF5E6D3,
    eyeColor: 0x3D2914,
    noseColor: 0xF5C4B8,
    blushColor: 0xFADADD,
    bonnetPink: 0xF8C8DC,
    brownAcc: 0x8B6F47,
    laceWhite: 0xFFFFFF,
    passive: { name: '木质护甲', desc: '获得临时护盾吸收伤害' },
    active: { name: '投掷木板', desc: '投出木板造成伤害和击退', cd: 12 }
  },
  STEEL_BONE: {
    name: '钢骨', hp: 85, skinClass: 'role-steelbone', category: '坦克',
    bodyColor: 0xF5E6D8,
    bellyColor: 0xF5E6D8,
    earInner: 0xE8B4B4,
    pawColor: 0x3D4550,
    hairColor: 0xFFFFFF,
    eyeColor: 0x4A90D9,
    noseColor: 0xFFB6C1,
    blushColor: 0xE8B4B4,
    jacketBlue: 0x8FB8E0,
    stripeBlue: 0xB8D4F0,
    ribbonBlue: 0xA8C8E8,
    darkGray: 0x3D4550,
    passive: { name: '铁壁', desc: '5秒内减伤50%' },
    active: { name: '地裂波', desc: '重击地面产生范围伤害+击飞', cd: 20 }
  },
  HIGH_ENERGY: {
    name: '高能人', hp: 75, skinClass: 'role-highenergy', category: '法师',
    bodyColor: 0xFFF5F0,
    bellyColor: 0xFFFFFF,
    earInner: 0xFFF5F0,
    pawColor: 0xFFF5F0,
    hairColor: 0xFFFFFF,
    hairTip: 0x98FB98,
    eyeColor: 0x50C878,
    noseColor: 0xFFB6C1,
    blushColor: 0xFFB0B0,
    bowBlue: 0x8FB8E0,
    goldAcc: 0xDAA520,
    leafGreen: 0x7CB68E,
    creamVest: 0xF5E6D8,
    capeBlue: 0x8FB8E0,
    passive: { name: '附魔箭矢', desc: '箭矢落地产生火焰区域' },
    active: { name: '喷气背包', desc: '悬浮22秒，移动加速，可跳跃消耗时间', cd: 30 }
  },
  WAIWAI: {
    name: '歪歪', hp: 75, skinClass: 'role-waiwai', category: '辅助',
    bodyColor: 0xFFF5F0,
    bellyColor: 0xFFF5F0,
    earInner: 0xFFF5F0,
    pawColor: 0xFFFFFF,
    hairColor: 0xF4D03F,
    hairShadow: 0xD35400,
    eyeColor: 0x5BA4E6,
    noseColor: 0xFFB6C1,
    blushColor: 0xFFB6C1,
    shirtWhite: 0xFFFFFF,
    pantCream: 0xF5E6D8,
    collarNavy: 0x2C3E50,
    passive: { name: '勇气光环', desc: '附近队友攻击力提升' },
    active: { name: '勇气呐喊', desc: '范围内队友加速+攻击提升', cd: 25 }
  }
};

// ====== 辅助工具函数 ======

/** 使用 CatmullRomCurve3 创建管道 Mesh */
function _tube(points, radius, radialSegs, tubularSegs, material) {
  radius = Math.max(0.001, radius);
  radialSegs = Math.max(3, radialSegs);
  tubularSegs = Math.max(2, tubularSegs);
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, tubularSegs, radius, radialSegs, false);
  return new THREE.Mesh(geo, material);
}

/** 斐波那契球面分布，返回 {x,y,z} 数组 */
function _fibSphere(count, baseRadius, jitter) {
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const jit = (Math.random() - 0.5) * (jitter || 0);
    pts.push({
      x: Math.cos(theta) * r * (baseRadius + jit),
      y: y * (baseRadius + jit),
      z: Math.sin(theta) * r * (baseRadius + jit)
    });
  }
  return pts;
}

/** 色彩线性插值 (hex) */
function _lerpColor(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return (rr << 16) | (rg << 8) | rb;
}

// ====== 模型构建器 ======
class ChibiModelBuilder {

  // --- 共享卡通梯度纹理（3色阶）---
  static _gradientMap = (() => {
    const c = document.createElement('canvas');
    c.width = 3; c.height = 1;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#444'; ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = '#aaa'; ctx.fillRect(1, 0, 1, 1);
    ctx.fillStyle = '#fff'; ctx.fillRect(2, 0, 1, 1);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    return tex;
  })();

  /** 创建一个共享梯度卡通材质 */
  static _toonMat(color) {
    return new THREE.MeshToonMaterial({ color: color, gradientMap: ChibiModelBuilder._gradientMap });
  }

  /** 创建皮肤材质 */
  static _skinMat(color) {
    return new THREE.MeshToonMaterial({ color: color, gradientMap: ChibiModelBuilder._gradientMap });
  }

  /** 创建眼睛用 MeshBasicMaterial */
  static _eyeMat(color) {
    return new THREE.MeshBasicMaterial({ color: color });
  }

  /**
   * 将Q版角色模型挂载到现有角色mesh上
   * @param {THREE.Mesh} parentMesh - 现有角色主体Mesh
   * @param {string} roleKey - 角色键名（CHIBI_SPECS中的键）
   * @param {number} teamColor - 队伍颜色（备用）
   * @returns {{ parts: Object, animator: ChibiAnimator }}
   */
  static attach(parentMesh, roleKey, teamColor) {
    const spec = CHIBI_SPECS[roleKey];
    if (!spec) {
      console.warn('[ChibiModelBuilder] 未知角色:', roleKey);
      return null;
    }

    parentMesh.visible = true;

    const modelGroup = new THREE.Group();
    modelGroup.name = 'chibiModel';

    const head = ChibiModelBuilder._buildHead(spec, roleKey);
    const bodyGroup = ChibiModelBuilder._buildBody(spec, roleKey);
    const accessories = new THREE.Group();
    accessories.name = 'accessories';
    ChibiModelBuilder._buildAccessories(accessories, roleKey, spec);

    modelGroup.add(head.group);
    modelGroup.add(bodyGroup.group);
    modelGroup.add(accessories);

    parentMesh.add(modelGroup);

    const parts = {
      modelGroup,
      head: head.group,
      headMesh: head.mesh,
      leftEye: head.leftEye,
      rightEye: head.rightEye,
      body: bodyGroup.group,
      bodyMesh: bodyGroup.mesh,
      leftArm: bodyGroup.leftArm,
      rightArm: bodyGroup.rightArm,
      leftLeg: bodyGroup.leftLeg,
      rightLeg: bodyGroup.rightLeg,
      accessories
    };

    const animator = new ChibiAnimator(parts, roleKey);
    return { parts, animator };
  }

  // ====== 头部构建 ======
  static _buildHead(spec, roleKey) {
    const headGroup = new THREE.Group();
    headGroup.name = 'head';
    headGroup.position.set(0, 0.62, 0);

    // 头部主球体
    const headGeo = new THREE.SphereGeometry(0.3, 16, 14);
    const headMat = ChibiModelBuilder._skinMat(spec.bodyColor);
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.scale.set(1, 0.92, 0.95);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // 婴儿肥凸起（脸颊两侧小半球）
    const cheekMat = ChibiModelBuilder._toonMat(spec.bodyColor);
    [-1, 1].forEach(function(side) {
      const cheek = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 6),
        cheekMat
      );
      cheek.scale.set(0.8, 0.6, 0.5);
      cheek.position.set(side * 0.2, -0.04, 0.2);
      headGroup.add(cheek);
    });

    // 面部贴片（FOX专用倒三角白色面部区域，其他角色按bellyColor）
    if (roleKey === 'FOX') {
      const faceGeo = new THREE.SphereGeometry(0.2, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const faceMat = ChibiModelBuilder._toonMat(spec.bellyColor);
      const faceMesh = new THREE.Mesh(faceGeo, faceMat);
      faceMesh.scale.set(0.75, 0.75, 0.5);
      faceMesh.position.set(0, -0.02, 0.12);
      faceMesh.rotation.x = 0.15;
      headGroup.add(faceMesh);
    } else if (spec.bellyColor && spec.bellyColor !== spec.bodyColor) {
      const faceGeo = new THREE.SphereGeometry(0.26, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const faceMat = ChibiModelBuilder._toonMat(spec.bellyColor);
      const faceMesh = new THREE.Mesh(faceGeo, faceMat);
      faceMesh.scale.set(0.85, 0.8, 0.5);
      faceMesh.position.set(0, -0.02, 0.12);
      faceMesh.rotation.x = 0.15;
      headGroup.add(faceMesh);
    }

    // ====== 精细眼睛系统 ======
    var eyeY = 0.02;
    var eyeX = 0.1;
    var eyeZ = 0.25;
    var eyeWhiteColor = 0xFDF8F3;

    function makeEye(sideX) {
      var eyeGroup = new THREE.Group();
      eyeGroup.position.set(sideX, eyeY, eyeZ);

      // 眼白 - 扁椭圆
      var whiteGeo = new THREE.SphereGeometry(0.06, 10, 8);
      var whiteMat = ChibiModelBuilder._eyeMat(eyeWhiteColor);
      var white = new THREE.Mesh(whiteGeo, whiteMat);
      white.scale.set(1.3, 1.1, 0.5);
      eyeGroup.add(white);

      // 虹膜 - 外层
      var irisOuterGeo = new THREE.SphereGeometry(0.045, 8, 8);
      var irisOuterMat = ChibiModelBuilder._eyeMat(spec.eyeColor);
      var irisOuter = new THREE.Mesh(irisOuterGeo, irisOuterMat);
      irisOuter.position.z = 0.03;
      irisOuter.scale.set(1, 1.05, 0.6);
      eyeGroup.add(irisOuter);

      // 虹膜 - 内层浅色渐变
      var irisInnerGeo = new THREE.SphereGeometry(0.03, 8, 8);
      var irisInnerColor = _lerpColor(spec.eyeColor, 0xFFFFFF, 0.4);
      var irisInnerMat = ChibiModelBuilder._eyeMat(irisInnerColor);
      var irisInner = new THREE.Mesh(irisInnerGeo, irisInnerMat);
      irisInner.position.z = 0.035;
      eyeGroup.add(irisInner);

      // 瞳孔
      var pupilGeo = new THREE.SphereGeometry(0.02, 8, 8);
      var pupilMat = ChibiModelBuilder._eyeMat(0x111111);
      var pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.z = 0.05;
      eyeGroup.add(pupil);

      // 主高光 - 10点方向
      var hlGeo = new THREE.SphereGeometry(0.015, 6, 6);
      var hlMat = ChibiModelBuilder._eyeMat(0xFFFFFF);
      var hl = new THREE.Mesh(hlGeo, hlMat);
      hl.position.set(0.02, 0.02, 0.06);
      eyeGroup.add(hl);

      // 副高光 - 5点方向
      var hl2Geo = new THREE.SphereGeometry(0.007, 4, 4);
      var hl2 = new THREE.Mesh(hl2Geo, hlMat);
      hl2.position.set(-0.016, -0.012, 0.06);
      eyeGroup.add(hl2);

      // 微高光 - 2点方向
      var hl3Geo = new THREE.SphereGeometry(0.004, 4, 4);
      var hl3 = new THREE.Mesh(hl3Geo, hlMat);
      hl3.position.set(-0.025, 0.005, 0.058);
      eyeGroup.add(hl3);

      // 睫毛 - FOX/PORK_DOCTOR有3根上睫毛
      if (roleKey === 'FOX' || roleKey === 'PORK_DOCTOR') {
        for (var li = 0; li < 3; li++) {
          var lashGeo = new THREE.BoxGeometry(0.005, 0.012, 0.006);
          var lashMat = ChibiModelBuilder._eyeMat(0x333333);
          var lash = new THREE.Mesh(lashGeo, lashMat);
          var la = -0.15 + li * 0.15;
          lash.position.set(Math.sin(la) * 0.04, 0.045, Math.cos(la) * 0.015);
          lash.rotation.z = la * 0.3;
          eyeGroup.add(lash);
        }
      }

      // HIGH_ENERGY四叶草瞳孔特效
      if (roleKey === 'HIGH_ENERGY') {
        var cloverGeo = new THREE.SphereGeometry(0.008, 4, 4);
        var cloverMat = ChibiModelBuilder._eyeMat(0xA8FFA8);
        for (var ci = 0; ci < 4; ci++) {
          var c = new THREE.Mesh(cloverGeo, cloverMat);
          var ca = (Math.PI / 2) * ci;
          c.position.set(Math.cos(ca) * 0.013, Math.sin(ca) * 0.013, 0.055);
          eyeGroup.add(c);
        }
      }

      return eyeGroup;
    }

    var leftEye = makeEye(-eyeX);
    var rightEye = makeEye(eyeX);
    headGroup.add(leftEye);
    headGroup.add(rightEye);

    // ====== 腮红 ======
    var blushMat = new THREE.SpriteMaterial({
      color: spec.blushColor || 0xF5C4B8,
      transparent: true,
      opacity: 0.35,
      depthTest: false
    });

    var leftBlush = new THREE.Sprite(blushMat);
    leftBlush.position.set(-0.16, -0.07, 0.26);
    leftBlush.scale.set(0.1, 0.07, 1);
    headGroup.add(leftBlush);

    var rightBlush = new THREE.Sprite(blushMat.clone());
    rightBlush.position.set(0.16, -0.07, 0.26);
    rightBlush.scale.set(0.1, 0.07, 1);
    headGroup.add(rightBlush);

    // ====== 嘴巴 ======
    if (roleKey === 'FROST') {
      // "w" 猫嘴
      var wMouthL = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 6, 6),
        ChibiModelBuilder._eyeMat(0x884444)
      );
      wMouthL.scale.set(0.6, 0.5, 0.3);
      wMouthL.position.set(-0.015, -0.1, 0.28);
      headGroup.add(wMouthL);
      var wMouthR = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 6, 6),
        ChibiModelBuilder._eyeMat(0x884444)
      );
      wMouthR.scale.set(0.6, 0.5, 0.3);
      wMouthR.position.set(0.015, -0.1, 0.28);
      headGroup.add(wMouthR);
    } else if (roleKey === 'WAIWAI') {
      // 不爽平直线嘴
      var lineMouth = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.004, 0.005),
        ChibiModelBuilder._eyeMat(0x884444)
      );
      lineMouth.position.set(0, -0.1, 0.285);
      headGroup.add(lineMouth);
    } else if (roleKey !== 'PORK_DOCTOR') {
      // 普通小弧线嘴
      var mouthPoints = [];
      for (var mi = 0; mi <= 8; mi++) {
        var mt = (mi / 8) * Math.PI;
        mouthPoints.push(new THREE.Vector3(
          -0.025 + (mi / 8) * 0.05,
          -0.005 * Math.sin(mt),
          0.28 + 0.005 * Math.cos(mt)
        ));
      }
      var mouthMat = ChibiModelBuilder._eyeMat(0x664444);
      var mouth = _tube(mouthPoints, 0.003, 4, 6, mouthMat);
      mouth.position.y = -0.1;
      headGroup.add(mouth);
    }
    // PORK_DOCTOR无可见嘴巴

    // ====== 鼻子 ======
    if (roleKey === 'FOX') {
      // 小三角圆点，玫瑰棕
      var fNose = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 6, 6),
        ChibiModelBuilder._toonMat(spec.noseColor)
      );
      fNose.scale.set(1.2, 0.8, 0.7);
      fNose.position.set(0, -0.05, 0.285);
      headGroup.add(fNose);
    } else {
      // 通用小圆鼻
      var noseGeo = new THREE.SphereGeometry(0.013, 6, 6);
      var noseMat = ChibiModelBuilder._toonMat(spec.noseColor || 0xDDAA99);
      var nose = new THREE.Mesh(noseGeo, noseMat);
      nose.position.set(0, -0.04, 0.28);
      headGroup.add(nose);
    }

    // ====== 眉毛（WAIWAI不爽表情专用）=====
    if (roleKey === 'WAIWAI') {
      var browMat = ChibiModelBuilder._eyeMat(spec.hairShadow);
      var browGeo = new THREE.BoxGeometry(0.05, 0.008, 0.01);
      [-1, 1].forEach(function(side) {
        var brow = new THREE.Mesh(browGeo, browMat);
        brow.position.set(side * 0.1, 0.08, 0.28);
        brow.rotation.z = side * 0.15;
        headGroup.add(brow);
      });
    }

    return { group: headGroup, mesh: headMesh, leftEye: leftEye, rightEye: rightEye };
  }

  // ====== 身体构建 ======
  static _buildBody(spec, roleKey) {
    var bodyGroup = new THREE.Group();
    bodyGroup.name = 'body';

    // 躯干
    var bodyGeo = new THREE.SphereGeometry(0.22, 14, 12);
    var bodyMat = ChibiModelBuilder._toonMat(spec.bodyColor);
    var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.scale.set(1, 1.1, 0.85);
    bodyMesh.position.set(0, 0.32, 0);
    bodyMesh.castShadow = true;
    bodyGroup.add(bodyMesh);

    // 小肚子凸起
    var bellyMat = ChibiModelBuilder._toonMat(spec.bellyColor || spec.bodyColor);
    var bellyGeo = new THREE.SphereGeometry(0.17, 10, 8);
    var bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
    bellyMesh.scale.set(0.85, 0.9, 0.5);
    bellyMesh.position.set(0, 0.28, 0.1);
    bodyGroup.add(bellyMesh);

    var tummyBump = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      bellyMat
    );
    tummyBump.scale.set(0.7, 0.6, 0.5);
    tummyBump.position.set(0, 0.26, 0.15);
    bodyGroup.add(tummyBump);

    // ====== 手臂 ======
    var armGeo = new THREE.CapsuleGeometry(0.06, 0.15, 5, 8);
    var armMat = ChibiModelBuilder._toonMat(spec.bodyColor);
    var handMat = ChibiModelBuilder._toonMat(spec.pawColor || spec.bodyColor);

    var leftArm = new THREE.Group();
    leftArm.name = 'leftArm';
    leftArm.position.set(-0.25, 0.42, 0);
    leftArm.rotation.z = 0.15;
    var leftArmMesh = new THREE.Mesh(armGeo, armMat);
    leftArmMesh.position.set(0, -0.1, 0);
    leftArm.add(leftArmMesh);
    var leftHand = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 6),
      handMat
    );
    leftHand.position.set(0, -0.22, 0);
    leftArm.add(leftHand);
    bodyGroup.add(leftArm);

    var rightArm = new THREE.Group();
    rightArm.name = 'rightArm';
    rightArm.position.set(0.25, 0.42, 0);
    rightArm.rotation.z = -0.15;
    var rightArmMesh = new THREE.Mesh(armGeo, armMat.clone());
    rightArmMesh.position.set(0, -0.1, 0);
    rightArm.add(rightArmMesh);
    var rightHand = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 6),
      handMat.clone()
    );
    rightHand.position.set(0, -0.22, 0);
    rightArm.add(rightHand);
    bodyGroup.add(rightArm);

    // ====== 腿 ======
    var legGeo = new THREE.CapsuleGeometry(0.07, 0.1, 5, 8);
    var legMat = ChibiModelBuilder._toonMat(spec.bodyColor);
    var footMat = ChibiModelBuilder._toonMat(spec.pawColor || spec.bodyColor);

    var leftLeg = new THREE.Group();
    leftLeg.name = 'leftLeg';
    leftLeg.position.set(-0.1, 0.14, 0);
    var leftLegMesh = new THREE.Mesh(legGeo, legMat);
    leftLegMesh.position.set(0, -0.06, 0);
    leftLeg.add(leftLegMesh);
    var leftFoot = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 8, 6),
      footMat
    );
    leftFoot.scale.set(1.2, 0.5, 1.4);
    leftFoot.position.set(0, -0.17, 0.02);
    leftLeg.add(leftFoot);
    bodyGroup.add(leftLeg);

    var rightLeg = new THREE.Group();
    rightLeg.name = 'rightLeg';
    rightLeg.position.set(0.1, 0.14, 0);
    var rightLegMesh = new THREE.Mesh(legGeo, legMat.clone());
    rightLegMesh.position.set(0, -0.06, 0);
    rightLeg.add(rightLegMesh);
    var rightFoot = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 8, 6),
      footMat.clone()
    );
    rightFoot.scale.set(1.2, 0.5, 1.4);
    rightFoot.position.set(0, -0.17, 0.02);
    rightLeg.add(rightFoot);
    bodyGroup.add(rightLeg);

    return {
      group: bodyGroup,
      mesh: bodyMesh,
      leftArm: leftArm,
      rightArm: rightArm,
      leftLeg: leftLeg,
      rightLeg: rightLeg
    };
  }

  // ====== 配件系统 ======
  static _buildAccessories(group, roleKey, spec) {
    switch (roleKey) {
      case 'FOX':         ChibiModelBuilder._buildFoxAccessories(group, spec); break;
      case 'PORK_DOCTOR': ChibiModelBuilder._buildPorkDoctorAccessories(group, spec); break;
      case 'HURRICANE':   ChibiModelBuilder._buildHurricaneAccessories(group, spec); break;
      case 'FROST':       ChibiModelBuilder._buildFrostAccessories(group, spec); break;
      case 'DRIFTWOOD':   ChibiModelBuilder._buildDriftwoodAccessories(group, spec); break;
      case 'STEEL_BONE':  ChibiModelBuilder._buildSteelBoneAccessories(group, spec); break;
      case 'HIGH_ENERGY':  ChibiModelBuilder._buildHighEnergyAccessories(group, spec); break;
      case 'WAIWAI':       ChibiModelBuilder._buildWaiwaiAccessories(group, spec); break;
    }
  }

  // ============================================================
  //  FOX 狐狸 - 橙色毛绒穿奶油白连帽外套
  // ============================================================
  static _buildFoxAccessories(group, spec) {
    var headY = 0.62;
    var toon = function(c) { return ChibiModelBuilder._toonMat(c); };

    // --- 三角狐耳：橙色外层，尖端深锈色 ---
    var earOuterMat = toon(spec.bodyColor);
    var earTipMat = toon(0xB85A24);
    var earInnerMat = toon(spec.earInner);

    [-1, 1].forEach(function(side) {
      // 外层三角耳
      var earGeo = new THREE.ConeGeometry(0.1, 0.26, 4);
      var ear = new THREE.Mesh(earGeo, earOuterMat);
      ear.position.set(side * 0.18, headY + 0.36, -0.02);
      ear.rotation.z = side * -0.35;
      ear.rotation.x = -0.15;
      group.add(ear);
      // 尖端深锈色
      var tipGeo = new THREE.ConeGeometry(0.06, 0.1, 4);
      var tip = new THREE.Mesh(tipGeo, earTipMat);
      tip.position.set(side * 0.18, headY + 0.46, -0.02);
      tip.rotation.z = side * -0.35;
      tip.rotation.x = -0.15;
      group.add(tip);
      // 贝壳粉内耳
      var innerGeo = new THREE.ConeGeometry(0.06, 0.17, 4);
      var inner = new THREE.Mesh(innerGeo, earInnerMat);
      inner.position.set(side * 0.18, headY + 0.34, 0.02);
      inner.rotation.z = side * -0.35;
      inner.rotation.x = -0.15;
      group.add(inner);
      // 内耳毛绒效果
      var fluff = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 6, 5),
        new THREE.MeshToonMaterial({
          color: 0xFFFFFF, transparent: true, opacity: 0.4,
          gradientMap: ChibiModelBuilder._gradientMap
        })
      );
      fluff.scale.set(0.8, 0.6, 0.4);
      fluff.position.set(side * 0.18, headY + 0.32, 0.03);
      group.add(fluff);
    });

    // --- 头顶白色椭圆斑点（眉毛上方对称）---
    [-1, 1].forEach(function(side) {
      var dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 6, 5),
        toon(0xFFFFFF)
      );
      dot.scale.set(1.3, 0.6, 0.4);
      dot.position.set(side * 0.1, headY + 0.1, 0.27);
      group.add(dot);
    });

    // --- 奶油白围巾（infinity scarf环 + 两端绒球）---
    var scarfMat = toon(spec.scarfColor);
    // 围巾环
    var scarfGeo = new THREE.TorusGeometry(0.2, 0.04, 5, 14, Math.PI * 1.3);
    var scarf = new THREE.Mesh(scarfGeo, scarfMat);
    scarf.position.set(0, 0.48, 0.04);
    scarf.rotation.x = Math.PI / 2;
    scarf.rotation.z = 0.2;
    group.add(scarf);
    // 围巾垂坠
    var scarfTailGeo = new THREE.CapsuleGeometry(0.025, 0.1, 4, 6);
    var st1 = new THREE.Mesh(scarfTailGeo, scarfMat);
    st1.position.set(0.08, 0.38, 0.08);
    st1.rotation.z = 0.3;
    group.add(st1);
    var st2 = new THREE.Mesh(scarfTailGeo, scarfMat.clone());
    st2.position.set(0.12, 0.4, 0.06);
    st2.rotation.z = -0.1;
    group.add(st2);
    // 两个大绒球（0.3x头大小 = 0.09）
    var pomGeo = new THREE.SphereGeometry(0.09, 8, 6);
    var pom1 = new THREE.Mesh(pomGeo, scarfMat);
    pom1.position.set(0.06, 0.32, 0.1);
    group.add(pom1);
    var pom2 = new THREE.Mesh(pomGeo, scarfMat.clone());
    pom2.position.set(0.1, 0.33, 0.08);
    group.add(pom2);

    // --- 奶油白连帽外套（A字型，oversize帽，3/4袖）---
    var coatMat = toon(spec.coatColor);
    // 外套身体（A字型锥体）
    var coatGeo = new THREE.CylinderGeometry(0.16, 0.24, 0.35, 10, 1, true);
    var coat = new THREE.Mesh(coatGeo, new THREE.MeshToonMaterial({
      color: spec.coatColor, side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    }));
    coat.position.set(0, 0.28, 0.02);
    group.add(coat);
    // 外套毛绒质感（小球覆盖）
    for (var fi = 0; fi < 6; fi++) {
      var fa = (Math.PI * 2 / 6) * fi;
      var fuzz = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 5, 4),
        coatMat
      );
      fuzz.position.set(
        Math.cos(fa) * 0.2,
        0.2 + fi * 0.02,
        0.05 + Math.sin(fa) * 0.12
      );
      group.add(fuzz);
    }
    // 3/4袖覆盖（短袖套在上臂）
    [-1, 1].forEach(function(side) {
      var sleeveGeo = new THREE.CapsuleGeometry(0.065, 0.1, 4, 6);
      var sleeve = new THREE.Mesh(sleeveGeo, coatMat);
      sleeve.position.set(side * 0.25, 0.38, 0);
      sleeve.rotation.z = side * 0.15;
      group.add(sleeve);
    });

    // --- 蓬松大尾巴（10-12个球体，基部深橙->尖端奶油白）---
    var tailGroup = new THREE.Group();
    tailGroup.name = 'foxTail';
    tailGroup.position.set(0, 0.35, -0.25);

    var tailColors = [
      0xC45E28, 0xC45E28, 0xD4692A, 0xD4692A, 0xD4692A,
      0xE07830, 0xE89050, 0xF0C080,
      0xF8E8D0, 0xFDF6ED, 0xFDF6ED, 0xFDF6ED
    ];
    for (var ti = 0; ti < 12; ti++) {
      var tt = ti / 11;
      var tr = 0.07 + Math.sin(tt * Math.PI) * 0.09;
      var tailBall = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(0.01, tr), 8, 6),
        toon(tailColors[ti])
      );
      tailBall.position.set(0, tt * 0.6, -tt * 0.35);
      tailGroup.add(tailBall);
    }
    group.add(tailGroup);

    // --- 脚底3趾暗示 ---
    [-1, 1].forEach(function(side) {
      for (var toei = 0; toei < 3; toei++) {
        var toe = new THREE.Mesh(
          new THREE.SphereGeometry(0.012, 4, 4),
          toon(0x4A2A1A)
        );
        toe.scale.set(0.8, 0.4, 1);
        toe.position.set(
          side * 0.1 + (toei - 1) * 0.02,
          0.0,
          0.18 + toei * 0.01
        );
        group.add(toe);
      }
    });
  }

  // ============================================================
  //  PORK_DOCTOR 猪猪医生 - 粉红存钱罐穿象牙白斗篷
  // ============================================================
  static _buildPorkDoctorAccessories(group, spec) {
    var headY = 0.62;
    var toon = function(c) { return ChibiModelBuilder._toonMat(c); };

    // --- 大三角圆耳朵：45度外展 ---
    var pigEarMat = toon(spec.bodyColor);
    var pigEarInnerMat = toon(spec.earInner);

    [-1, 1].forEach(function(side) {
      // 外层三角圆耳
      var earGeo = new THREE.SphereGeometry(0.14, 10, 8);
      var ear = new THREE.Mesh(earGeo, pigEarMat);
      ear.scale.set(0.7, 1, 0.4);
      ear.position.set(side * 0.3, headY + 0.24, -0.06);
      ear.rotation.z = side * 0.45;
      ear.rotation.y = side * 0.1;
      group.add(ear);
      // 深粉内耳（耳蜗纹路用环形暗示）
      var innerGeo = new THREE.SphereGeometry(0.1, 8, 6);
      var inner = new THREE.Mesh(innerGeo, pigEarInnerMat);
      inner.scale.set(0.55, 0.8, 0.3);
      inner.position.set(side * 0.3, headY + 0.24, -0.03);
      inner.rotation.z = side * 0.45;
      group.add(inner);
      // 耳蜗纹路（小环）
      var cochleaGeo = new THREE.TorusGeometry(0.04, 0.005, 4, 8);
      var cochleaMat = toon(0xE07090);
      var cochlea = new THREE.Mesh(cochleaGeo, cochleaMat);
      cochlea.position.set(side * 0.3, headY + 0.24, -0.015);
      cochlea.rotation.x = Math.PI / 2;
      cochlea.rotation.z = side * 0.45;
      group.add(cochlea);
    });

    // --- 猪鼻：紧凑圆鼻，粉色比身体深 ---
    var snoutGeo = new THREE.SphereGeometry(0.08, 10, 8);
    var snoutMat = toon(0xFF9EB5);
    var snout = new THREE.Mesh(snoutGeo, snoutMat);
    snout.scale.set(1.2, 0.8, 0.7);
    snout.position.set(0, -0.06, 0.27);
    group.add(snout);

    // 两个竖椭圆鼻孔
    [-1, 1].forEach(function(side) {
      var nGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.035, 8);
      var nMat = ChibiModelBuilder._eyeMat(spec.noseColor);
      var n = new THREE.Mesh(nGeo, nMat);
      n.scale.set(1, 1, 0.6);
      n.position.set(side * 0.03, -0.06, 0.33);
      n.rotation.x = Math.PI / 2;
      group.add(n);
    });

    // --- 头顶硬币槽：深玫瑰金色竖矩形，凸起边缘 ---
    var slotOuterGeo = new THREE.BoxGeometry(0.08, 0.012, 0.035);
    var slotOuterMat = toon(0xB87333);
    var slotOuter = new THREE.Mesh(slotOuterGeo, slotOuterMat);
    slotOuter.position.set(0, headY + 0.28, 0);
    group.add(slotOuter);
    // 槽内深色阴影
    var slotInnerGeo = new THREE.BoxGeometry(0.05, 0.008, 0.02);
    var slotInnerMat = ChibiModelBuilder._eyeMat(0x333333);
    var slotInner = new THREE.Mesh(slotInnerGeo, slotInnerMat);
    slotInner.position.set(0, headY + 0.283, 0.002);
    group.add(slotInner);

    // --- 额头两个白色圆点（硬币槽两侧）---
    [-1, 1].forEach(function(side) {
      var fDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 6, 5),
        toon(0xFFFFFF)
      );
      fDot.scale.set(1, 1, 0.3);
      fDot.position.set(side * 0.06, headY + 0.2, 0.28);
      group.add(fDot);
    });

    // --- 粉色眼影 ---
    [-1, 1].forEach(function(side) {
      var eyeshadow = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 6, 5),
        new THREE.MeshToonMaterial({
          color: 0xFF69B4, transparent: true, opacity: 0.3,
          gradientMap: ChibiModelBuilder._gradientMap
        })
      );
      eyeshadow.scale.set(1.3, 0.3, 0.3);
      eyeshadow.position.set(side * 0.1, headY + 0.06, 0.26);
      group.add(eyeshadow);
    });

    // --- 不对称象牙白斗篷：高领，右长左短 ---
    var capeMat = new THREE.MeshToonMaterial({
      color: spec.capeColor, side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    });
    // 右侧长斗篷（mid-thigh）
    var capeRightGeo = new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.7);
    var capeRight = new THREE.Mesh(capeRightGeo, capeMat);
    capeRight.scale.set(1.1, 1, 0.55);
    capeRight.position.set(0.05, 0.28, -0.08);
    capeRight.rotation.y = Math.PI;
    group.add(capeRight);
    // 左侧短斗篷（waist）
    var capeLeftGeo = new THREE.SphereGeometry(0.2, 10, 6, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.4);
    var capeLeft = new THREE.Mesh(capeLeftGeo, capeMat);
    capeLeft.scale.set(0.9, 0.75, 0.5);
    capeLeft.position.set(-0.05, 0.32, -0.08);
    capeLeft.rotation.y = Math.PI;
    group.add(capeLeft);
    // 高领
    var collarGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.08, 12, 1, true);
    var collar = new THREE.Mesh(collarGeo, capeMat);
    collar.position.set(0, 0.48, 0);
    group.add(collar);

    // 3个金色纽扣
    for (var bi = 0; bi < 3; bi++) {
      var btn = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 6, 6),
        ChibiModelBuilder._eyeMat(spec.coinColor)
      );
      btn.position.set(0.02, 0.42 - bi * 0.07, 0.16);
      group.add(btn);
    }

    // --- 卷尾巴：紧密螺旋一圈 ---
    var curlGroup = new THREE.Group();
    curlGroup.position.set(0, 0.4, -0.2);
    for (var ci = 0; ci < 6; ci++) {
      var curl = new THREE.Mesh(
        new THREE.TorusGeometry(0.025 + ci * 0.003, 0.008, 4, 8),
        toon(ci < 3 ? spec.bodyColor : spec.earInner)
      );
      curl.position.set(0, ci * 0.012, -ci * 0.01);
      curl.rotation.y = ci * 1.05;
      curlGroup.add(curl);
    }
    group.add(curlGroup);

    // --- 散落金币（2-3个扁平金色小圆柱）---
    for (var coi = 0; coi < 3; coi++) {
      var coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.005, 8),
        ChibiModelBuilder._eyeMat(spec.coinColor)
      );
      coin.position.set(-0.08 + coi * 0.08, 0.02, 0.15 + coi * 0.02);
      coin.rotation.z = coi * 0.2;
      group.add(coin);
    }
  }

  // ============================================================
  //  HURRICANE 飓风 - 紫黑龙角和服巫女
  // ============================================================
  static _buildHurricaneAccessories(group, spec) {
    var headY = 0.62;
    var toon = function(c) { return ChibiModelBuilder._toonMat(c); };

    // --- 铂金白带淡薰衣草色头发：中长bob高马尾，两个呆毛 ---
    var hairMat = toon(spec.hairColor);
    // 后脑头发
    for (var hi = 0; hi < 10; hi++) {
      var ha = (Math.PI * 2 / 10) * hi;
      var hfluff = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 6),
        hairMat
      );
      hfluff.position.set(
        Math.cos(ha) * 0.18,
        headY + 0.15 + (hi % 3) * 0.03,
        Math.sin(ha) * 0.15 - 0.05
      );
      hfluff.scale.set(1, 0.8, 0.9);
      group.add(hfluff);
    }
    // 两个呆毛
    for (var ah = 0; ah < 2; ah++) {
      var ahGeo = new THREE.CapsuleGeometry(0.01, 0.1, 3, 4);
      var ahair = new THREE.Mesh(ahGeo, hairMat);
      ahair.position.set(-0.05 + ah * 0.1, headY + 0.35 + ah * 0.02, 0.05);
      ahair.rotation.z = (ah === 0 ? -0.3 : 0.2);
      ahair.rotation.x = -0.15;
      group.add(ahair);
    }
    // 高马尾
    var ponytailGroup = new THREE.Group();
    ponytailGroup.position.set(0, headY + 0.1, -0.2);
    for (var pi = 0; pi < 5; pi++) {
      var pt = pi / 4;
      var pBall = new THREE.Mesh(
        new THREE.SphereGeometry(0.04 - pt * 0.008, 6, 5),
        hairMat
      );
      pBall.position.set(0, -pt * 0.06, -pt * 0.15);
      ponytailGroup.add(pBall);
    }
    group.add(ponytailGroup);

    // --- 弯曲犄角：5-6节脊纹，深紫黑基底到浅紫脊高光 ---
    [-1, 1].forEach(function(side) {
      var hornGroup = new THREE.Group();
      var segs = 6;
      for (var si = 0; si < segs; si++) {
        var st = si / (segs - 1);
        var hr = 0.03 - st * 0.018;
        var hColor = _lerpColor(spec.hornColor, 0x5A3D8C, st);
        var seg = new THREE.Mesh(
          new THREE.ConeGeometry(Math.max(0.005, hr), 0.09, 6),
          toon(hColor)
        );
        seg.position.set(
          side * (0.15 + st * 0.12),
          headY + 0.22 + st * 0.28,
          -0.05 + st * 0.06
        );
        seg.rotation.z = side * (-0.3 - st * 0.8);
        seg.rotation.x = -st * 0.35;
        hornGroup.add(seg);
        // 脊纹（小球）
        if (si < segs - 1) {
          var ridge = new THREE.Mesh(
            new THREE.SphereGeometry(0.008, 4, 4),
            toon(0x5A3D8C)
          );
          ridge.position.set(
            side * (0.15 + (st + 0.08) * 0.12),
            headY + 0.22 + (st + 0.08) * 0.28 + 0.02,
            -0.05 + (st + 0.08) * 0.06
          );
          hornGroup.add(ridge);
        }
      }
      group.add(hornGroup);
    });

    // --- 大翅膀：3根指骨骨架 + 膜翼 ---
    var wingMat = new THREE.MeshToonMaterial({
      color: spec.wingColor, transparent: true, opacity: 0.5,
      side: THREE.DoubleSide, gradientMap: ChibiModelBuilder._gradientMap
    });
    var wingInnerMat = new THREE.MeshToonMaterial({
      color: spec.wingHighlight, transparent: true, opacity: 0.4,
      side: THREE.DoubleSide, gradientMap: ChibiModelBuilder._gradientMap
    });
    var boneMat = toon(spec.hornColor);

    [-1, 1].forEach(function(side) {
      var wingGroup = new THREE.Group();
      wingGroup.position.set(side * 0.3, 0.42, -0.12);
      wingGroup.rotation.y = side * 0.3;

      // 3根指骨骨架
      var bones = [
        { angle: -0.4, len: 0.35 },
        { angle: 0, len: 0.45 },
        { angle: 0.4, len: 0.3 }
      ];
      bones.forEach(function(b) {
        var bone = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.008, b.len, 3, 4),
          boneMat
        );
        bone.rotation.z = side * (b.angle + 0.5);
        wingGroup.add(bone);
      });

      // 膜面（外层深紫）
      var ws = new THREE.Shape();
      ws.moveTo(0, 0);
      ws.quadraticCurveTo(side * 0.2, 0.22, side * 0.08, 0.45);
      ws.quadraticCurveTo(side * 0.02, 0.35, side * -0.08, 0.3);
      ws.quadraticCurveTo(side * -0.02, 0.15, 0, 0);
      var wMesh = new THREE.Mesh(new THREE.ShapeGeometry(ws), wingMat);
      wingGroup.add(wMesh);
      // 内面浅紫
      var ws2 = new THREE.Shape();
      ws2.moveTo(0, 0.02);
      ws2.quadraticCurveTo(side * 0.12, 0.15, side * 0.05, 0.3);
      ws2.quadraticCurveTo(0, 0.2, 0, 0.02);
      var wMesh2 = new THREE.Mesh(new THREE.ShapeGeometry(ws2), wingInnerMat);
      wMesh2.position.z = 0.01;
      wingGroup.add(wMesh2);

      // 脉络线条
      for (var vi = 0; vi < 3; vi++) {
        var veinGeo = new THREE.CapsuleGeometry(0.002, 0.2 + vi * 0.05, 2, 3);
        var vein = new THREE.Mesh(veinGeo, toon(0x6A4090));
        vein.rotation.z = side * (-0.2 + vi * 0.3);
        vein.position.y = 0.05 + vi * 0.03;
        wingGroup.add(vein);
      }

      group.add(wingGroup);
    });

    // --- 龙尾巴：长粗壮，鳞片脊纹 ---
    var dragonTailGroup = new THREE.Group();
    dragonTailGroup.name = 'dragonTail';
    dragonTailGroup.position.set(0, 0.28, -0.2);
    for (var di = 0; di < 8; di++) {
      var dt = di / 7;
      var dr = 0.05 - dt * 0.025;
      var dColor = _lerpColor(spec.hornColor, 0x5A3D8C, dt * 0.5);
      var dSeg = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(0.008, dr), 8, 6),
        toon(dColor)
      );
      dSeg.position.set(0, dt * 0.12, -dt * 0.15);
      dSeg.scale.set(1, 0.85, 1.2);
      dragonTailGroup.add(dSeg);
      // 鳞片脊纹
      if (di < 7) {
        var scale = new THREE.Mesh(
          new THREE.ConeGeometry(0.012, 0.015, 3),
          toon(0x5A3D8C)
        );
        scale.position.set(0, dt * 0.12 + 0.03, -dt * 0.15 - 0.03);
        scale.rotation.x = 0.6;
        dragonTailGroup.add(scale);
      }
    }
    var tailEnd = new THREE.Mesh(
      new THREE.ConeGeometry(0.02, 0.08, 4),
      toon(spec.wingColor)
    );
    tailEnd.position.set(0, 0.12, -1.05);
    tailEnd.rotation.x = 0.8;
    dragonTailGroup.add(tailEnd);
    group.add(dragonTailGroup);

    // --- 白色外层羽织(haori)：纯白，宽袖，碎花图案 ---
    var haoriMat = new THREE.MeshToonMaterial({
      color: spec.kimonoWhite, side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    });
    var haoriGeo = new THREE.CylinderGeometry(0.2, 0.26, 0.3, 10, 1, true);
    var haori = new THREE.Mesh(haoriGeo, haoriMat);
    haori.position.set(0, 0.3, 0);
    group.add(haori);
    // 宽袖
    [-1, 1].forEach(function(side) {
      var sleeveGeo = new THREE.CapsuleGeometry(0.06, 0.12, 4, 6);
      var sleeve = new THREE.Mesh(sleeveGeo, haoriMat);
      sleeve.position.set(side * 0.28, 0.36, 0);
      sleeve.rotation.z = side * 0.5;
      group.add(sleeve);
    });
    // 碎花图案（小樱花粉+薰衣草紫圆点）
    for (var fi = 0; fi < 8; fi++) {
      var fAngle = (Math.PI * 2 / 8) * fi;
      var fColor = fi % 2 === 0 ? spec.blossomPink : spec.lavender;
      var flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.01, 5, 4),
        ChibiModelBuilder._eyeMat(fColor)
      );
      flower.position.set(
        Math.cos(fAngle) * 0.2,
        0.22 + Math.sin(fi) * 0.06,
        Math.sin(fAngle) * 0.12 + 0.1
      );
      group.add(flower);
    }

    // --- 深紫色内层和服 ---
    var innerGeo = new THREE.CylinderGeometry(0.17, 0.2, 0.28, 10, 1, true);
    var innerMat = new THREE.MeshToonMaterial({
      color: spec.kimonoPurple, side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    });
    var innerKim = new THREE.Mesh(innerGeo, innerMat);
    innerKim.position.set(0, 0.3, 0.02);
    group.add(innerKim);
    // 密集樱花图案（粉/紫/白三色）
    for (var ki = 0; ki < 12; ki++) {
      var kAngle = (Math.PI * 2 / 12) * ki;
      var kColors = [spec.blossomPink, spec.lavender, 0xFFFFFF];
      var kFlower = new THREE.Mesh(
        new THREE.SphereGeometry(0.008, 4, 4),
        ChibiModelBuilder._eyeMat(kColors[ki % 3])
      );
      kFlower.position.set(
        Math.cos(kAngle) * 0.18,
        0.2 + ki * 0.01,
        Math.sin(kAngle) * 0.1 + 0.1
      );
      group.add(kFlower);
    }

    // --- 大腰带结(obi) ---
    var obiGeo = new THREE.TorusGeometry(0.19, 0.03, 5, 12);
    var obiMat = toon(spec.kimonoPurple);
    var obi = new THREE.Mesh(obiGeo, obiMat);
    obi.position.set(0, 0.22, 0);
    obi.rotation.x = Math.PI / 2;
    group.add(obi);
    // 前面大花装饰
    var obiFlowerGeo = new THREE.SphereGeometry(0.035, 8, 6);
    var obiFlower = new THREE.Mesh(obiFlowerGeo, ChibiModelBuilder._eyeMat(spec.blossomPink));
    obiFlower.scale.set(1, 0.6, 0.4);
    obiFlower.position.set(0, 0.22, 0.18);
    group.add(obiFlower);

    // --- 黑色木屐 ---
    [-1, 1].forEach(function(side) {
      var getaBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.03, 0.12),
        toon(0x1A1A1A)
      );
      getaBase.position.set(side * 0.1, -0.02, 0.01);
      group.add(getaBase);
      // 木屐齿
      var getaTooth = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.025, 0.02),
        toon(0x1A1A1A)
      );
      getaTooth.position.set(side * 0.1, -0.01, 0.06);
      group.add(getaTooth);
    });

    // --- 樱花发饰：头两侧各3-4朵层叠樱花 + 黑色垂带 + 粉色流苏 ---
    [-1, 1].forEach(function(side) {
      var sakuraGroup = new THREE.Group();
      sakuraGroup.position.set(side * 0.25, headY + 0.15, 0.08);
      // 3-4朵层叠樱花
      for (var si = 0; si < 3; si++) {
        var sFlower = new THREE.Mesh(
          new THREE.SphereGeometry(0.018 - si * 0.003, 6, 5),
          ChibiModelBuilder._eyeMat(spec.blossomPink)
        );
        sFlower.scale.set(1, 0.5, 0.6);
        sFlower.position.set(0, si * 0.015, si * 0.008);
        sakuraGroup.add(sFlower);
        // 花瓣小球
        for (var pi2 = 0; pi2 < 5; pi2++) {
          var pa = (Math.PI * 2 / 5) * pi2;
          var petal = new THREE.Mesh(
            new THREE.SphereGeometry(0.008, 4, 3),
            ChibiModelBuilder._eyeMat(0xFFC0D0)
          );
          petal.position.set(
            Math.cos(pa) * 0.02,
            si * 0.015 + Math.sin(pa) * 0.01,
            si * 0.008
          );
          sakuraGroup.add(petal);
        }
      }
      // 黑色垂带
      var kurohimo = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.006, 0.08, 3, 4),
        toon(0x1A1A1A)
      );
      kurohimo.position.set(0, -0.04, 0.01);
      kurohimo.rotation.z = side * 0.15;
      sakuraGroup.add(kurohimo);
      // 粉色流苏（小球串）
      for (var fri = 0; fri < 3; fri++) {
        var fr = new THREE.Mesh(
          new THREE.SphereGeometry(0.005, 4, 3),
          ChibiModelBuilder._eyeMat(spec.blossomPink)
        );
        fr.position.set(0, -0.06 - fri * 0.015, 0.01);
        sakuraGroup.add(fr);
      }
      group.add(sakuraGroup);
    });

    // --- 两个黑色三角发夹（左侧刘海）---
    for (var cli = 0; cli < 2; cli++) {
      var clipGeo = new THREE.ConeGeometry(0.015, 0.03, 3);
      var clip = new THREE.Mesh(clipGeo, toon(0x1A1A1A));
      clip.position.set(-0.2 + cli * 0.04, headY + 0.15, 0.22);
      clip.rotation.z = -0.2;
      group.add(clip);
    }
  }

  // ============================================================
  //  FROST 冰霜 - 白薄荷双马尾熊耳毛绒外套
  // ============================================================
  static _buildFrostAccessories(group, spec) {
    var headY = 0.62;
    var toon = function(c) { return ChibiModelBuilder._toonMat(c); };

    // --- 大圆熊耳：白色外层，浅粉内耳 ---
    [-1, 1].forEach(function(side) {
      var ear = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 8),
        toon(spec.bodyColor)
      );
      ear.position.set(side * 0.22, headY + 0.26, -0.02);
      ear.scale.set(1, 1.1, 0.65);
      group.add(ear);
      var inner = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 6),
        toon(spec.earInner)
      );
      inner.position.set(side * 0.22, headY + 0.26, 0.015);
      inner.scale.set(1, 1.1, 0.5);
      group.add(inner);
    });

    // --- 纯白+发梢薄荷绿渐变头发：双马尾，凌乱刘海，2个呆毛 ---
    var hairWhiteMat = toon(spec.hairColor);
    var hairMidMat = toon(_lerpColor(spec.hairColor, spec.hairTip, 0.5));
    var hairGreenMat = toon(spec.hairTip);
    var hairMats = [hairWhiteMat, hairMidMat, hairGreenMat];

    // 后脑头发基座
    for (var bi = 0; bi < 8; bi++) {
      var ba = (Math.PI * 2 / 8) * bi;
      var bf = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 6, 5),
        hairWhiteMat
      );
      bf.position.set(
        Math.cos(ba) * 0.2,
        headY + 0.18,
        Math.sin(ba) * 0.18 - 0.04
      );
      group.add(bf);
    }
    // 凌乱刘海
    for (var li2 = 0; li2 < 6; li2++) {
      var la2 = -0.5 + (Math.PI / 5) * li2;
      var lh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.025, 0.06, 3, 5),
        hairWhiteMat
      );
      lh.position.set(
        Math.cos(la2) * 0.2,
        headY + 0.12,
        Math.sin(la2) * 0.1 + 0.15
      );
      lh.rotation.set((Math.random() - 0.5) * 0.3, la2, -0.4);
      group.add(lh);
    }
    // 2个呆毛
    for (var ai = 0; ai < 2; ai++) {
      var ah2 = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.008, 0.08, 3, 4),
        hairWhiteMat
      );
      ah2.position.set(-0.04 + ai * 0.08, headY + 0.38, 0.02);
      ah2.rotation.z = (ai === 0 ? -0.25 : 0.2);
      ah2.rotation.x = -0.2;
      group.add(ah2);
    }

    // 双马尾（薄荷绿蝴蝶结系住）
    [-1, 1].forEach(function(side) {
      var tailGroup = new THREE.Group();
      tailGroup.position.set(side * 0.22, headY + 0.05, -0.12);
      for (var ti2 = 0; ti2 < 6; ti2++) {
        var t2 = ti2 / 5;
        var tMatIdx = Math.min(2, Math.floor(t2 * 3));
        var tBall = new THREE.Mesh(
          new THREE.SphereGeometry(0.035 - t2 * 0.005, 6, 5),
          hairMats[tMatIdx]
        );
        tBall.position.set(side * t2 * 0.08, -t2 * 0.2, -t2 * 0.08);
        tailGroup.add(tBall);
      }
      group.add(tailGroup);

      // 薄荷绿蝴蝶结
      var bowGroup = new THREE.Group();
      bowGroup.position.set(side * 0.22, headY + 0.12, -0.1);
      [-1, 1].forEach(function(bs) {
        var bLoop = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 8, 6),
          toon(spec.mintGreen)
        );
        bLoop.scale.set(1.3, 0.6, 0.4);
        bLoop.position.set(bs * 0.035, 0, 0);
        bowGroup.add(bLoop);
      });
      var bCenter = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 6, 5),
        toon(0x66BB6A)
      );
      bowGroup.add(bCenter);
      // 飘带
      var bRibbon = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.012, 0.05, 3, 4),
        toon(spec.mintGreen)
      );
      bRibbon.position.set(0, -0.04, 0);
      bRibbon.rotation.z = 0.2;
      bowGroup.add(bRibbon);
      group.add(bowGroup);
    });

    // --- 颈部薄荷绿蝴蝶结 ---
    var neckBow = new THREE.Group();
    neckBow.position.set(0, 0.5, 0.14);
    [-1, 1].forEach(function(ns) {
      var nLoop = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 6),
        toon(spec.mintGreen)
      );
      nLoop.scale.set(1.3, 0.6, 0.4);
      nLoop.position.set(ns * 0.03, 0, 0);
      neckBow.add(nLoop);
    });
    var nCenter = new THREE.Mesh(
      new THREE.SphereGeometry(0.015, 6, 5),
      toon(0x66BB6A)
    );
    neckBow.add(nCenter);
    group.add(neckBow);

    // --- 纯白毛绒外套：圆领，一个大金色纽扣 ---
    var coatMat2 = toon(spec.coatColor);
    var coatGeo2 = new THREE.CylinderGeometry(0.18, 0.24, 0.32, 10, 1, true);
    var coat2 = new THREE.Mesh(coatGeo2, new THREE.MeshToonMaterial({
      color: spec.coatColor, side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    }));
    coat2.position.set(0, 0.28, 0.01);
    group.add(coat2);
    // 圆领
    var coatCollar = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.025, 5, 12),
      coatMat2
    );
    coatCollar.position.set(0, 0.44, 0.08);
    coatCollar.rotation.x = Math.PI / 2;
    group.add(coatCollar);
    // 大金色纽扣
    var goldBtn = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 8, 6),
      ChibiModelBuilder._eyeMat(spec.goldButton)
    );
    goldBtn.position.set(0, 0.34, 0.2);
    group.add(goldBtn);
    // 毛绒质感
    for (var fli = 0; fli < 5; fli++) {
      var fla = (Math.PI * 2 / 5) * fli;
      var fl = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 5, 4),
        coatMat2
      );
      fl.position.set(
        Math.cos(fla) * 0.18,
        0.2 + fli * 0.02,
        0.06 + Math.sin(fla) * 0.1
      );
      group.add(fl);
    }

    // --- 头顶小仓鼠伴侣 ---
    var compGroup = new THREE.Group();
    compGroup.name = 'companion';
    compGroup.position.set(0.1, headY + 0.38, 0.05);
    // 身体
    var compBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 6),
      toon(0xFFFFF0)
    );
    compBody.scale.set(1, 1.1, 0.9);
    compGroup.add(compBody);
    // 头
    var compHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 6),
      toon(0xFFFFF0)
    );
    compHead.position.y = 0.055;
    compGroup.add(compHead);
    // 圆耳朵
    [-1, 1].forEach(function(cs) {
      var cEar = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 6, 5),
        toon(0xFFFFF0)
      );
      cEar.position.set(cs * 0.025, 0.085, 0);
      compGroup.add(cEar);
    });
    // 黑色点眼
    [-1, 1].forEach(function(cs) {
      var cEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.006, 4, 4),
        ChibiModelBuilder._eyeMat(0x222222)
      );
      cEye.position.set(cs * 0.015, 0.06, 0.028);
      compGroup.add(cEye);
    });
    // 小粉鼻
    var cNose = new THREE.Mesh(
      new THREE.SphereGeometry(0.005, 4, 4),
      toon(0xFFB6C1)
    );
    cNose.position.set(0, 0.045, 0.032);
    compGroup.add(cNose);
    // 粉红腮红斑
    [-1, 1].forEach(function(cs) {
      var cBlush = new THREE.Sprite(
        new THREE.SpriteMaterial({ color: 0xFFB6C1, transparent: true, opacity: 0.5 })
      );
      cBlush.position.set(cs * 0.02, 0.04, 0.03);
      cBlush.scale.set(0.02, 0.015, 1);
      compGroup.add(cBlush);
    });
    group.add(compGroup);
  }

  // ============================================================
  //  DRIFTWOOD 漂木 - 白猫穿熊耳帽和连衣裙
  // ============================================================
  static _buildDriftwoodAccessories(group, spec) {
    var headY = 0.62;
    var toon = function(c) { return ChibiModelBuilder._toonMat(c); };

    // --- 每侧3根棕色胡须 ---
    var whiskerMat = toon(spec.brownAcc);
    [-1, 1].forEach(function(side) {
      for (var wi = 0; wi < 3; wi++) {
        var whisker = new THREE.Mesh(
          new THREE.CylinderGeometry(0.003, 0.002, 0.08, 4),
          whiskerMat
        );
        whisker.position.set(
          side * 0.06,
          headY - 0.04 + (wi - 1) * 0.02,
          0.28
        );
        whisker.rotation.z = side * (0.1 + wi * 0.15);
        whisker.rotation.x = -0.1;
        group.add(whisker);
      }
    });

    // --- 小三角猫耳（帽子下若隐若现）---
    [-1, 1].forEach(function(side) {
      var catEar = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.1, 4),
        toon(spec.bodyColor)
      );
      catEar.position.set(side * 0.14, headY + 0.27, 0.08);
      catEar.rotation.z = side * -0.2;
      catEar.rotation.x = -0.1;
      group.add(catEar);
    });

    // --- 熊耳帽(bonnet)：暖米色半球形帽顶+扁平圆柱帽檐 ---
    var bonnetMat = toon(spec.hairColor);
    // 半球形帽顶
    var bonnetTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.33, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
      bonnetMat
    );
    bonnetTop.scale.set(1.05, 0.85, 0.95);
    bonnetTop.position.set(0, headY + 0.05, -0.02);
    bonnetTop.rotation.x = -0.3;
    group.add(bonnetTop);
    // 扁平圆柱帽檐
    var brimGeo = new THREE.CylinderGeometry(0.36, 0.38, 0.02, 16);
    var brim = new THREE.Mesh(brimGeo, bonnetMat);
    brim.position.set(0, headY - 0.12, 0.04);
    group.add(brim);
    // 白色扇贝蕾丝边
    var laceMat = toon(spec.laceWhite);
    for (var li3 = 0; li3 < 16; li3++) {
      var la3 = (Math.PI * 2 / 16) * li3;
      var scallop = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 5, 4),
        laceMat
      );
      scallop.scale.set(0.7, 0.4, 0.5);
      scallop.position.set(
        Math.cos(la3) * 0.37,
        headY - 0.11,
        0.04 + Math.sin(la3) * 0.37
      );
      group.add(scallop);
    }

    // --- 帽侧大粉蝴蝶结 ---
    var dBowGroup = new THREE.Group();
    dBowGroup.position.set(0.28, headY + 0.08, 0.1);
    [-1, 1].forEach(function(bs) {
      var dLoop = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 6),
        toon(spec.bonnetPink)
      );
      dLoop.scale.set(1.3, 0.6, 0.45);
      dLoop.position.set(bs * 0.05, 0, 0);
      dBowGroup.add(dLoop);
    });
    var dBCenter = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 6, 5),
      toon(0xE8A0C0)
    );
    dBowGroup.add(dBCenter);
    // 飘带
    var dRibbon = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.018, 0.06, 3, 4),
      toon(spec.bonnetPink)
    );
    dRibbon.position.set(0, -0.05, 0);
    dRibbon.rotation.z = 0.2;
    dBowGroup.add(dRibbon);
    group.add(dBowGroup);

    // --- 帽前棕色刺绣熊脸（简笔画风格）---
    var emFaceGroup = new THREE.Group();
    emFaceGroup.position.set(0, headY - 0.06, 0.32);
    // 两个点眼
    [-1, 1].forEach(function(es) {
      var emEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.008, 4, 4),
        toon(spec.brownAcc)
      );
      emEye.position.set(es * 0.025, 0.01, 0);
      emFaceGroup.add(emEye);
    });
    // 椭圆鼻
    var emNose = new THREE.Mesh(
      new THREE.SphereGeometry(0.01, 6, 5),
      toon(spec.brownAcc)
    );
    emNose.scale.set(1.2, 0.8, 0.5);
    emNose.position.set(0, -0.005, 0.005);
    emFaceGroup.add(emNose);
    group.add(emFaceGroup);

    // --- 米色A字型连衣裙：蓬松袖，白色扇贝蕾丝领口和袖口 ---
    var dressMat = new THREE.MeshToonMaterial({
      color: spec.hairColor, side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    });
    // A字裙身
    var dressGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.32, 10, 1, true);
    var dress = new THREE.Mesh(dressGeo, dressMat);
    dress.position.set(0, 0.26, 0.01);
    group.add(dress);
    // 蓬松袖
    [-1, 1].forEach(function(side) {
      var puffySleeve = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 6),
        dressMat
      );
      puffySleeve.scale.set(1, 0.7, 0.7);
      puffySleeve.position.set(side * 0.26, 0.4, 0);
      group.add(puffySleeve);
      // 白色扇贝蕾丝袖口
      for (var si2 = 0; si2 < 6; si2++) {
        var sa = (Math.PI * 2 / 6) * si2;
        var sLace = new THREE.Mesh(
          new THREE.SphereGeometry(0.015, 4, 3),
          laceMat
        );
        sLace.scale.set(0.8, 0.4, 0.5);
        sLace.position.set(
          side * 0.26 + Math.cos(sa) * 0.06,
          0.37 + Math.sin(sa) * 0.03,
          Math.sin(sa) * 0.04
        );
        group.add(sLace);
      }
    });
    // 白色扇贝蕾丝领口
    for (var ci2 = 0; ci2 < 12; ci2++) {
      var ca = (Math.PI * 2 / 12) * ci2;
      var cLace = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 4, 3),
        laceMat
      );
      cLace.scale.set(0.8, 0.4, 0.5);
      cLace.position.set(
        Math.cos(ca) * 0.16,
        0.42 + Math.sin(ca) * 0.02,
        0.1 + Math.sin(ca) * 0.12
      );
      group.add(cLace);
    }

    // --- 裙上碎花图案（小熊脸+粉色和棕色小点）---
    for (var di2 = 0; di2 < 8; di2++) {
      var da = (Math.PI * 2 / 8) * di2;
      var decoColor = di2 % 3 === 0 ? spec.bonnetPink : (di2 % 3 === 1 ? spec.brownAcc : spec.hairColor);
      var deco = new THREE.Mesh(
        new THREE.SphereGeometry(0.008, 4, 3),
        ChibiModelBuilder._eyeMat(decoColor)
      );
      deco.position.set(
        Math.cos(da) * 0.2,
        0.22 + di2 * 0.015,
        0.08 + Math.sin(da) * 0.12
      );
      group.add(deco);
    }
    // 小熊脸图案
    for (var bi2 = 0; bi2 < 2; bi2++) {
      var ba2 = Math.PI * 0.5 + bi2 * Math.PI;
      var bearFace = new THREE.Group();
      bearFace.position.set(Math.cos(ba2) * 0.2, 0.28, 0.12 + Math.sin(ba2) * 0.08);
      [-1, 1].forEach(function(be) {
        var bfEye = new THREE.Mesh(
          new THREE.SphereGeometry(0.005, 4, 3),
          ChibiModelBuilder._eyeMat(spec.brownAcc)
        );
        bfEye.position.set(be * 0.012, 0.008, 0);
        bearFace.add(bfEye);
      });
      var bfNose = new THREE.Mesh(
        new THREE.SphereGeometry(0.006, 4, 3),
        ChibiModelBuilder._eyeMat(spec.brownAcc)
      );
      bfNose.scale.set(1.2, 0.8, 0.5);
      bearFace.add(bfNose);
      group.add(bearFace);
    }

    // --- 背后大粉蝴蝶结领 ---
    var backBow = new THREE.Group();
    backBow.position.set(0, 0.44, -0.15);
    [-1, 1].forEach(function(bs) {
      var bLoop = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 6),
        toon(spec.bonnetPink)
      );
      bLoop.scale.set(1.4, 0.6, 0.4);
      bLoop.position.set(bs * 0.055, 0, 0);
      backBow.add(bLoop);
    });
    var bCenter2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 6, 5),
      toon(0xE8A0C0)
    );
    backBow.add(bCenter2);
    group.add(backBow);

    // --- 小圆白脚 ---
    [-1, 1].forEach(function(side) {
      var wFoot = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 6),
        toon(spec.pawColor)
      );
      wFoot.scale.set(1, 0.5, 1.2);
      wFoot.position.set(side * 0.1, -0.01, 0.02);
      group.add(wFoot);
    });
  }

  // ============================================================
  //  STEEL_BONE 钢骨 - 白发蓝眼和服少年
  // ============================================================
  static _buildSteelBoneAccessories(group, spec) {
    var headY = 0.62;
    var toon = function(c) { return ChibiModelBuilder._toonMat(c); };

    // --- 纯白蓬松刺猬状头发：大量向外翘的尖刺，一个突出呆毛，不对称刘海 ---
    var hairMat = toon(spec.hairColor);
    var hairShadowMat = toon(0xE8E8F0);

    // 底层蓬松球
    for (var bi3 = 0; bi3 < 10; bi3++) {
      var ba3 = (Math.PI * 2 / 10) * bi3;
      var bf2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.055 + Math.random() * 0.03, 8, 6),
        bi3 % 3 === 0 ? hairShadowMat : hairMat
      );
      bf2.position.set(
        Math.cos(ba3) * 0.17,
        headY + 0.16 + Math.random() * 0.1,
        Math.sin(ba3) * 0.14
      );
      group.add(bf2);
    }
    // 中层
    for (var mi = 0; mi < 6; mi++) {
      var ma = (Math.PI * 2 / 6) * mi + 0.4;
      var mf = new THREE.Mesh(
        new THREE.SphereGeometry(0.04 + Math.random() * 0.02, 6, 5),
        hairMat
      );
      mf.position.set(
        Math.cos(ma) * 0.12,
        headY + 0.26 + Math.random() * 0.05,
        Math.sin(ma) * 0.1
      );
      group.add(mf);
    }
    // 刺状发尖（大量向外翘）
    for (var si3 = 0; si3 < 18; si3++) {
      var sa3 = (Math.PI * 2 / 18) * si3 + Math.random() * 0.3;
      var spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.018 + Math.random() * 0.012, 0.08 + Math.random() * 0.05, 4),
        si3 % 3 === 0 ? hairShadowMat : hairMat
      );
      var sr = 0.19 + Math.random() * 0.08;
      spike.position.set(
        Math.cos(sa3) * sr * 0.5,
        headY + 0.24 + Math.random() * 0.1,
        Math.sin(sa3) * sr * 0.4
      );
      spike.rotation.set(
        (Math.random() - 0.5) * 0.6,
        sa3,
        (Math.random() - 0.5) * 0.6 - 0.3
      );
      group.add(spike);
    }
    // 突出呆毛
    var ah3 = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.01, 0.12, 3, 4),
      hairMat
    );
    ah3.position.set(0.05, headY + 0.42, 0);
    ah3.rotation.z = 0.25;
    ah3.rotation.x = -0.2;
    group.add(ah3);
    // 不对称刘海
    for (var li4 = 0; li4 < 4; li4++) {
      var lh2 = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.02, 0.07, 3, 4),
        hairMat
      );
      lh2.position.set(-0.15 + li4 * 0.08, headY + 0.12, 0.2);
      lh2.rotation.set((Math.random() - 0.5) * 0.3, 0, -0.35 - Math.random() * 0.15);
      group.add(lh2);
    }

    // --- 淡蓝色发带：从左侧垂下，长而飘逸 ---
    var ribbonMat = new THREE.MeshToonMaterial({
      color: spec.ribbonBlue, side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    });
    var ribbonShape = new THREE.Shape();
    ribbonShape.moveTo(0, 0);
    ribbonShape.bezierCurveTo(0.1, 0.1, 0.05, 0.22, 0.03, 0.38);
    ribbonShape.bezierCurveTo(0.07, 0.42, 0.02, 0.5, -0.01, 0.58);
    ribbonShape.lineTo(-0.025, 0.56);
    ribbonShape.bezierCurveTo(0, 0.48, 0.035, 0.4, 0, 0.36);
    ribbonShape.bezierCurveTo(-0.03, 0.2, -0.05, 0.08, 0, 0);
    var ribbonGeo2 = new THREE.ShapeGeometry(ribbonShape);
    var ribbon = new THREE.Mesh(ribbonGeo2, ribbonMat);
    ribbon.position.set(-0.25, 0.32, 0.1);
    ribbon.rotation.y = 0.3;
    ribbon.name = 'ribbon';
    group.add(ribbon);

    // --- 蓝色发夹：淡蓝矩形在左眼上方刘海间 ---
    var hairClip = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.012, 0.006),
      toon(spec.ribbonBlue)
    );
    hairClip.position.set(-0.1, headY + 0.14, 0.27);
    hairClip.rotation.z = -0.1;
    group.add(hairClip);

    // --- 白色内层和服：纯白，宽袖 ---
    var whiteKimonoMat = new THREE.MeshToonMaterial({
      color: 0xFFFFFF, side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    });
    var innerKimono = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.21, 0.3, 10, 1, true),
      whiteKimonoMat
    );
    innerKimono.position.set(0, 0.3, 0.02);
    group.add(innerKimono);
    // 宽袖
    [-1, 1].forEach(function(side) {
      var wSleeve = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.055, 0.12, 4, 6),
        whiteKimonoMat
      );
      wSleeve.position.set(side * 0.27, 0.36, 0);
      wSleeve.rotation.z = side * 0.45;
      group.add(wSleeve);
    });

    // --- 粉蓝羽织外套(haori)：短款open-front，袖子两条浅蓝条纹 ---
    var haoriMat = new THREE.MeshToonMaterial({
      color: spec.jacketBlue, side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    });
    var haori2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.23, 0.25, 10, 1, true),
      haoriMat
    );
    haori2.position.set(0, 0.32, 0);
    group.add(haori2);
    // 羽织袖子
    [-1, 1].forEach(function(side) {
      var hSleeve = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.06, 0.1, 4, 6),
        haoriMat
      );
      hSleeve.position.set(side * 0.28, 0.38, 0);
      hSleeve.rotation.z = side * 0.5;
      group.add(hSleeve);
      // 两条浅蓝条纹
      for (var sti = 0; sti < 2; sti++) {
        var stripe = new THREE.Mesh(
          new THREE.CylinderGeometry(0.062, 0.062, 0.006, 6, 1, true),
          toon(spec.stripeBlue)
        );
        stripe.position.set(
          side * 0.28 + sti * side * 0.025,
          0.38 + sti * 0.025,
          0
        );
        stripe.rotation.z = side * 0.5;
        group.add(stripe);
      }
    });
    // 帽子（背面可见）
    var sbHat = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 6),
      haoriMat
    );
    sbHat.scale.set(1, 0.5, 0.6);
    sbHat.position.set(0, 0.45, -0.15);
    group.add(sbHat);

    // --- 深灰腰带：前面简单结，两个垂坠 ---
    var sbBeltMat = toon(spec.darkGray);
    var sbBelt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.025, 12),
      sbBeltMat
    );
    sbBelt.position.set(0, 0.22, 0);
    sbBelt.rotation.x = Math.PI / 2;
    group.add(sbBelt);
    // 前面结
    var sbKnot = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 8, 6),
      sbBeltMat
    );
    sbKnot.scale.set(1.2, 0.7, 0.6);
    sbKnot.position.set(0, 0.22, 0.2);
    group.add(sbKnot);
    // 两个垂坠
    [-1, 1].forEach(function(side) {
      var sbTail = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.015, 0.06, 3, 4),
        sbBeltMat
      );
      sbTail.position.set(side * 0.02, 0.18, 0.21);
      sbTail.rotation.z = side * 0.2;
      sbTail.rotation.x = 0.15;
      group.add(sbTail);
    });

    // --- 深灰短裤 ---
    var shortsGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.1, 8, 1, true);
    var shorts = new THREE.Mesh(shortsGeo, new THREE.MeshToonMaterial({
      color: spec.darkGray, side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    }));
    shorts.position.set(0, 0.16, 0);
    group.add(shorts);

    // --- 深灰鞋+浅色鞋底 ---
    [-1, 1].forEach(function(side) {
      var sbShoe = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.04, 0.1),
        sbBeltMat
      );
      sbShoe.position.set(side * 0.1, -0.03, 0.01);
      group.add(sbShoe);
      // 浅色鞋底
      var sbSole = new THREE.Mesh(
        new THREE.BoxGeometry(0.075, 0.01, 0.11),
        toon(0x888888)
      );
      sbSole.position.set(side * 0.1, -0.05, 0.01);
      group.add(sbSole);
    });
  }

  // ============================================================
  //  HIGH_ENERGY 高能人 - 白绿渐变长发精灵
  // ============================================================
  static _buildHighEnergyAccessories(group, spec) {
    var headY = 0.62;
    var toon = function(c) { return ChibiModelBuilder._toonMat(c); };

    // --- 精灵尖耳朵：1.5倍正常耳长 ---
    [-1, 1].forEach(function(side) {
      var earShape = new THREE.Shape();
      earShape.moveTo(0, 0);
      earShape.lineTo(side * 0.06, 0.04);
      earShape.lineTo(side * 0.14, 0.22);
      earShape.lineTo(side * 0.05, 0.2);
      earShape.lineTo(side * 0.03, 0.05);
      earShape.closePath();
      var earGeo = new THREE.ShapeGeometry(earShape);
      var ear = new THREE.Mesh(earGeo, toon(spec.bodyColor));
      ear.position.set(side * 0.27, headY + 0.02, 0.02);
      ear.rotation.y = side * 0.3;
      group.add(ear);
    });

    // --- 极大量白->薄荷绿渐变长发：波浪卷曲，从耳朵开始渐变，2个呆毛 ---
    var lHairBaseMat = toon(spec.hairColor);
    var lHairMidMat = toon(_lerpColor(spec.hairColor, spec.hairTip, 0.5));
    var lHairTipMat = toon(spec.hairTip);
    var lHairMats = [lHairBaseMat, lHairMidMat, lHairTipMat];

    // 后脑基座
    for (var bi4 = 0; bi4 < 8; bi4++) {
      var ba4 = (Math.PI * 2 / 8) * bi4;
      var hb = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 6, 5),
        lHairBaseMat
      );
      hb.position.set(
        Math.cos(ba4) * 0.2,
        headY + 0.16,
        Math.sin(ba4) * 0.18 - 0.04
      );
      group.add(hb);
    }
    // 2个呆毛
    for (var ai2 = 0; ai2 < 2; ai2++) {
      var ahair2 = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.008, 0.09, 3, 4),
        lHairBaseMat
      );
      ahair2.position.set(-0.05 + ai2 * 0.1, headY + 0.4, 0.02);
      ahair2.rotation.z = (ai2 === 0 ? -0.3 : 0.15);
      ahair2.rotation.x = -0.15;
      group.add(ahair2);
    }

    // 长发股（白->绿渐变，从耳朵位置开始渐变）
    for (var si4 = 0; si4 < 16; si4++) {
      var sa4 = (Math.PI * 2 / 16) * si4;
      var strandGroup = new THREE.Group();
      strandGroup.position.set(
        Math.cos(sa4) * 0.22 * 0.6,
        headY + 0.1 - (sa4 > Math.PI ? 0.05 : 0),
        Math.sin(sa4) * 0.22 * 0.5
      );
      strandGroup.rotation.set(
        (Math.random() - 0.5) * 0.3,
        sa4,
        (Math.random() - 0.5) * 0.3
      );
      var segCount = 4 + (Math.random() > 0.5 ? 1 : 0);
      for (var sj = 0; sj < segCount; sj++) {
        var st2 = sj / (segCount - 1);
        // 从耳朵开始渐变（前2段白色，后段渐变绿色）
        var matIdx = st2 < 0.4 ? 0 : (st2 < 0.7 ? 1 : 2);
        var segR = 0.025 - st2 * 0.004;
        var seg = new THREE.Mesh(
          new THREE.SphereGeometry(Math.max(0.008, segR), 6, 5),
          lHairMats[matIdx]
        );
        seg.position.set(0, -sj * 0.055, -sj * 0.01);
        strandGroup.add(seg);
      }
      // 后面头发更长（到腰部）
      if (Math.sin(sa4) < -0.3) {
        strandGroup.scale.y = 1.7;
        strandGroup.position.y -= 0.1;
      }
      group.add(strandGroup);
    }

    // --- 头顶大粉蓝蝴蝶结：两个环+两条飘带 ---
    var heBowGroup = new THREE.Group();
    heBowGroup.position.set(-0.15, headY + 0.12, 0.12);
    var heBowMat = toon(spec.bowBlue);
    [-1, 1].forEach(function(bs) {
      var loop = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 10, 8),
        heBowMat
      );
      loop.scale.set(1.3, 0.55, 0.45);
      loop.position.set(bs * 0.06, 0, 0);
      heBowGroup.add(loop);
    });
    var heBC = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 6, 6),
      toon(0xA0C8E8)
    );
    heBowGroup.add(heBC);
    // 两条飘带
    var hbRibbon1 = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.018, 0.1, 4, 6),
      heBowMat
    );
    hbRibbon1.position.set(0, -0.08, 0);
    hbRibbon1.rotation.z = 0.2;
    heBowGroup.add(hbRibbon1);
    var hbRibbon2 = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.015, 0.08, 4, 6),
      heBowMat.clone()
    );
    hbRibbon2.position.set(0.02, -0.07, 0.01);
    hbRibbon2.rotation.z = -0.15;
    heBowGroup.add(hbRibbon2);
    group.add(heBowGroup);

    // --- 金色蝴蝶发饰：心形下翅，圆三角上翅，两根触须 ---
    var bflyGroup = new THREE.Group();
    bflyGroup.position.set(0.18, headY + 0.2, 0.1);
    var bflyMat = ChibiModelBuilder._eyeMat(spec.goldAcc);
    // 上翅（圆三角）
    [-1, 1].forEach(function(bs) {
      var uWing = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 6, 5),
        bflyMat
      );
      uWing.scale.set(1.2, 1, 0.4);
      uWing.position.set(bs * 0.02, 0.02, 0);
      bflyGroup.add(uWing);
    });
    // 下翅（心形，用两个球模拟）
    [-1, 1].forEach(function(bs) {
      var lWing = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 6, 5),
        bflyMat
      );
      lWing.scale.set(1.1, 0.7, 0.4);
      lWing.position.set(bs * 0.02, -0.015, 0);
      bflyGroup.add(lWing);
    });
    // 身体
    var bflyBody = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.005, 0.035, 3, 4),
      ChibiModelBuilder._eyeMat(0x333333)
    );
    bflyGroup.add(bflyBody);
    // 两根触须
    [-1, 1].forEach(function(bs) {
      var antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.002, 0.001, 0.04, 3),
        bflyMat
      );
      antenna.position.set(bs * 0.01, 0.035, 0);
      antenna.rotation.z = bs * 0.3;
      bflyGroup.add(antenna);
    });
    bflyGroup.name = 'butterfly';
    group.add(bflyGroup);

    // --- 鼠尾草绿叶子：在耳后，有小白花 ---
    for (var li5 = 0; li5 < 3; li5++) {
      var leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 8, 6),
        toon(spec.leafGreen)
      );
      leaf.scale.set(0.5, 1.3, 0.15);
      leaf.position.set(
        0.15 + li5 * 0.04,
        headY - 0.05 + li5 * 0.03,
        0.2 + li5 * 0.02
      );
      leaf.rotation.z = 0.3 + li5 * 0.2;
      leaf.rotation.y = 0.2;
      group.add(leaf);
    }
    // 小白花
    var whiteFlower = new THREE.Mesh(
      new THREE.SphereGeometry(0.01, 6, 5),
      ChibiModelBuilder._eyeMat(0xFFFFFF)
    );
    whiteFlower.position.set(0.25, headY - 0.02, 0.24);
    group.add(whiteFlower);

    // --- 白色衬衫：长袖，高立领蕾丝花边 ---
    var shirtMat = new THREE.MeshToonMaterial({
      color: 0xFFFFFF, side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    });
    var shirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.19, 0.28, 10, 1, true),
      shirtMat
    );
    shirt.position.set(0, 0.3, 0.02);
    group.add(shirt);
    // 高立领蕾丝花边
    var heCollar = new THREE.TorusGeometry(0.14, 0.015, 4, 12);
    var heCollarMesh = new THREE.Mesh(heCollar, toon(0xFFFFFF));
    heCollarMesh.position.set(0, 0.46, 0.08);
    heCollarMesh.rotation.x = Math.PI / 2;
    group.add(heCollarMesh);
    // 蕾丝花边装饰
    for (var li6 = 0; li6 < 8; li6++) {
      var lca = (Math.PI * 2 / 8) * li6;
      var lace = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 4, 3),
        toon(0xFFFFFF)
      );
      lace.scale.set(0.7, 0.4, 0.5);
      lace.position.set(
        Math.cos(lca) * 0.14,
        0.46,
        0.08 + Math.sin(lca) * 0.14
      );
      group.add(lace);
    }
    // 袖口花朵刺绣
    [-1, 1].forEach(function(side) {
      var emFlower = new THREE.Mesh(
        new THREE.SphereGeometry(0.01, 5, 4),
        ChibiModelBuilder._eyeMat(spec.leafGreen)
      );
      emFlower.position.set(side * 0.25, 0.28, 0.05);
      group.add(emFlower);
    });

    // --- 奶油色针织背心：V领，绞花纹理 ---
    var vestMat = new THREE.MeshToonMaterial({
      color: spec.creamVest, side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    });
    var vestGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.22, 10, 1, true);
    var vest = new THREE.Mesh(vestGeo, vestMat);
    vest.position.set(0, 0.3, 0.04);
    group.add(vest);
    // V领暗示
    var vNeck = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.08, 3),
      shirtMat
    );
    vNeck.position.set(0, 0.4, 0.12);
    vNeck.rotation.x = -0.3;
    group.add(vNeck);
    // 绞花纹理（扭结线条）
    for (var ci3 = 0; ci3 < 4; ci3++) {
      var cableAngle = (Math.PI * 2 / 4) * ci3;
      var cable = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.008, 0.15, 3, 4),
        toon(_lerpColor(spec.creamVest, 0xFFFFFF, 0.3))
      );
      cable.position.set(
        Math.cos(cableAngle) * 0.17,
        0.3,
        0.06 + Math.sin(cableAngle) * 0.08
      );
      group.add(cable);
    }

    // --- 粉蓝短披风：从肩膀垂下 ---
    var heCapeMat = new THREE.MeshToonMaterial({
      color: spec.capeBlue, side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    });
    var heCape = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 10, 8, 0, Math.PI * 2, Math.PI * 0.25, Math.PI * 0.5),
      heCapeMat
    );
    heCape.scale.set(1.1, 0.8, 0.6);
    heCape.position.set(0, 0.35, -0.12);
    heCape.rotation.y = Math.PI;
    group.add(heCape);
  }

  // ============================================================
  //  WAIWAI 歪歪 - 金黄爆炸头不爽少年
  // ============================================================
  static _buildWaiwaiAccessories(group, spec) {
    var headY = 0.62;
    var toon = function(c) { return ChibiModelBuilder._toonMat(c); };

    // --- 极大量金黄色蓬松爆炸头：25-30个球体，内部焦橙阴影 ---
    var afroMat = toon(spec.hairColor);
    var afroDarkMat = toon(spec.hairShadow);

    var fibPts = _fibSphere(28, 0.32, 0.06);
    fibPts.forEach(function(pt, i) {
      // 内部球用焦橙阴影色，外部用金黄色
      var isInner = Math.abs(pt.y) < 0.15;
      var fluff = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 + Math.random() * 0.04, 8, 6),
        isInner ? afroDarkMat : afroMat
      );
      fluff.position.set(
        pt.x,
        headY + pt.y * 0.85,
        pt.z
      );
      group.add(fluff);
    });

    // 2-3根突出呆毛向上弯曲
    for (var ai3 = 0; ai3 < 3; ai3++) {
      var ah4 = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.015, 0.08 + ai3 * 0.02, 3, 4),
        ai3 === 0 ? afroDarkMat : afroMat
      );
      ah4.position.set(-0.06 + ai3 * 0.06, headY + 0.48 + ai3 * 0.03, 0.05);
      ah4.rotation.z = (ai3 - 1) * 0.2;
      ah4.rotation.x = -0.25;
      group.add(ah4);
    }

    // 几缕垂下的头发
    for (var fi2 = 0; fi2 < 4; fi2++) {
      var strand = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.015, 0.1 + Math.random() * 0.06, 4, 6),
        fi2 % 2 === 0 ? afroMat : afroDarkMat
      );
      strand.position.set(
        -0.1 + fi2 * 0.06,
        headY - 0.08 - Math.random() * 0.06,
        0.18 + Math.random() * 0.05
      );
      strand.rotation.z = (Math.random() - 0.5) * 0.4;
      strand.rotation.x = -0.25 - Math.random() * 0.2;
      group.add(strand);
    }

    // --- 白色T恤：深海军蓝领口条纹 ---
    var shirtMat2 = new THREE.MeshToonMaterial({
      color: spec.shirtWhite, side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    });
    var wwShirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.2, 0.26, 10, 1, true),
      shirtMat2
    );
    wwShirt.position.set(0, 0.3, 0.02);
    group.add(wwShirt);
    // 深海军蓝领口条纹
    var collarStripe = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.015, 5, 12),
      toon(spec.collarNavy)
    );
    collarStripe.position.set(0, 0.44, 0.06);
    collarStripe.rotation.x = Math.PI / 2;
    group.add(collarStripe);

    // --- 奶油色宽松裤 ---
    var pantMat = new THREE.MeshToonMaterial({
      color: spec.pantCream, side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    });
    var wwPants = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.14, 0.15, 8, 1, true),
      pantMat
    );
    wwPants.position.set(0, 0.14, 0);
    group.add(wwPants);

    // --- 白色运动鞋：圆头低帮 ---
    [-1, 1].forEach(function(side) {
      var shoeBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.04, 0.1),
        toon(spec.pawColor)
      );
      shoeBody.position.set(side * 0.1, -0.03, 0.01);
      // 圆头
      var shoeToe = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 6, 5),
        toon(spec.pawColor)
      );
      shoeToe.scale.set(1, 0.7, 1.2);
      shoeToe.position.set(side * 0.1, -0.03, 0.05);
      group.add(shoeBody);
      group.add(shoeToe);
      // 鞋底
      var shoeSole = new THREE.Mesh(
        new THREE.BoxGeometry(0.075, 0.01, 0.11),
        toon(0xCCCCCC)
      );
      shoeSole.position.set(side * 0.1, -0.05, 0.01);
      group.add(shoeSole);
    });
  }
}


// ====== Q版动画器 ======
class ChibiAnimator {
  /**
   * @param {Object} parts - ChibiModelBuilder返回的parts对象
   * @param {string} roleKey - 角色键名
   */
  constructor(parts, roleKey) {
    this.parts = parts;
    this.roleKey = roleKey;
    this.time = 0;
    this.state = 'idle';
    this.prevState = 'idle';
    this.blendTime = 0;
    this.blendDuration = 0.15;

    this.attackTimer = 0;
    this.hurtTimer = 0;
    this.deadTimer = 0;
    this.skillTimer = 0;

    this.restPose = {
      headY: parts.head.position.y,
      headRotZ: 0,
      leftArmRotX: 0,
      leftArmRotZ: 0,
      rightArmRotX: 0,
      rightArmRotZ: 0,
      leftLegRotX: 0,
      rightLegRotX: 0,
      bodyY: 0,
      bodyRotX: 0,
      bodyRotZ: 0
    };
  }

  /**
   * 每帧更新动画
   * @param {number} dt - 时间增量（秒）
   * @param {string} state - 动画状态: 'idle'|'walk'|'attack'|'skill'|'hurt'|'dead'
   */
  update(dt, state) {
    if (!dt || dt <= 0 || dt > 0.5) return;
    this.time += dt;

    if (state !== this.state) {
      this.prevState = this.state;
      this.state = state;
      this.blendTime = 0;
      if (state === 'attack') this.attackTimer = 0;
      if (state === 'hurt') this.hurtTimer = 0;
      if (state === 'dead') this.deadTimer = 0;
      if (state === 'skill') this.skillTimer = 0;
    }

    this.blendTime += dt;
    var p = this.parts;
    var t = this.time;

    // 重置所有旋转
    p.head.rotation.set(0, 0, 0);
    p.head.position.y = this.restPose.headY;
    p.leftArm.rotation.set(0, 0, 0);
    p.rightArm.rotation.set(0, 0, 0);
    p.leftLeg.rotation.set(0, 0, 0);
    p.rightLeg.rotation.set(0, 0, 0);
    p.body.rotation.set(0, 0, 0);
    p.body.position.y = 0;

    switch (this.state) {
      case 'idle':   this._animIdle(t); break;
      case 'walk':   this._animWalk(t); break;
      case 'attack': this._animAttack(dt, t); break;
      case 'skill':  this._animSkill(dt, t); break;
      case 'hurt':   this._animHurt(dt, t); break;
      case 'dead':   this._animDead(dt, t); break;
    }

    // 通用头部微转
    if (this.state !== 'dead') {
      p.head.rotation.z += Math.sin(t * 0.8) * 0.06;
      p.head.rotation.y += Math.sin(t * 0.5) * 0.1;
    }
  }

  // --- 待机动画 ---
  _animIdle(t) {
    var p = this.parts;
    var floatY = Math.sin(t * 2.0) * 0.025;
    p.body.position.y = floatY;
    p.head.position.y = this.restPose.headY + floatY;
    p.head.rotation.z += Math.sin(t * 0.7) * 0.03;
    p.head.rotation.x += Math.sin(t * 0.9) * 0.02;
    p.leftArm.rotation.x = Math.sin(t * 1.2) * 0.08;
    p.leftArm.rotation.z = 0.1;
    p.rightArm.rotation.x = Math.sin(t * 1.2 + 1) * 0.08;
    p.rightArm.rotation.z = -0.1;
    p.leftLeg.rotation.x = 0;
    p.rightLeg.rotation.x = 0;
    this._roleIdleTick(t);
  }

  // --- 行走动画 ---
  _animWalk(t) {
    var p = this.parts;
    var speed = 8;
    var swing = 0.55;
    var bounce = Math.abs(Math.sin(t * speed)) * 0.04;
    p.body.position.y = bounce;
    p.head.position.y = this.restPose.headY + bounce;
    p.body.rotation.x = 0.1;
    p.body.rotation.z = Math.sin(t * speed * 0.5) * 0.03;
    p.leftArm.rotation.x = Math.sin(t * speed) * swing;
    p.leftArm.rotation.z = 0.15;
    p.rightArm.rotation.x = -Math.sin(t * speed) * swing;
    p.rightArm.rotation.z = -0.15;
    p.leftLeg.rotation.x = -Math.sin(t * speed) * swing * 0.85;
    p.rightLeg.rotation.x = Math.sin(t * speed) * swing * 0.85;
    p.head.rotation.x = 0.06;
    p.head.rotation.y += Math.sin(t * speed * 0.5) * 0.05;
  }

  // --- 攻击动画 ---
  _animAttack(dt, t) {
    var p = this.parts;
    this.attackTimer += dt;
    var at = this.attackTimer;
    var duration = 0.35;

    if (at < duration) {
      var phase = at / duration;
      var armAngle;
      if (phase < 0.3) {
        armAngle = -0.6 * (phase / 0.3);
      } else if (phase < 0.6) {
        armAngle = -0.6 + 2.8 * ((phase - 0.3) / 0.3);
      } else {
        armAngle = 2.2 * (1 - (phase - 0.6) / 0.4);
      }
      p.rightArm.rotation.x = armAngle;
      p.rightArm.rotation.z = -0.35;
      p.body.rotation.x = 0.18 * Math.sin(phase * Math.PI);
      p.leftArm.rotation.x = -0.25 * Math.sin(phase * Math.PI);
      p.leftArm.rotation.z = 0.18;
      p.head.rotation.x = 0.12 * Math.sin(phase * Math.PI);
    } else {
      this._animIdle(t);
    }
  }

  // --- 技能动画 ---
  _animSkill(dt, t) {
    var p = this.parts;
    this.skillTimer += dt;
    var st = this.skillTimer;

    switch (this.roleKey) {
      case 'FOX':
        if (st < 0.3) {
          var phase = st / 0.3;
          p.body.position.y = -0.1 * phase;
          p.head.position.y = this.restPose.headY - 0.1 * phase;
          p.body.rotation.x = 0.2 * phase;
          p.leftLeg.rotation.x = 0.4 * phase;
          p.rightLeg.rotation.x = 0.4 * phase;
        } else if (st < 0.6) {
          var phase2 = (st - 0.3) / 0.3;
          p.body.position.y = 0.15 * Math.sin(phase2 * Math.PI);
          p.head.position.y = this.restPose.headY + 0.15 * Math.sin(phase2 * Math.PI);
          p.body.rotation.x = 0.2 * (1 - phase2);
        } else {
          this._animIdle(t);
        }
        break;

      case 'PORK_DOCTOR':
        if (st < 0.5) {
          var phase = st / 0.5;
          var scale = 1 + 0.25 * Math.sin(phase * Math.PI);
          p.body.scale.set(scale, scale * 0.95, scale);
          p.head.position.y = this.restPose.headY + 0.06 * Math.sin(phase * Math.PI);
          p.leftArm.rotation.z = 0.6 * phase;
          p.rightArm.rotation.z = -0.6 * phase;
          p.leftArm.rotation.x = -0.35 * phase;
          p.rightArm.rotation.x = -0.35 * phase;
        } else {
          p.body.scale.set(1, 1, 1);
          this._animIdle(t);
        }
        break;

      case 'HURRICANE':
        if (st < 0.4) {
          var phase = st / 0.4;
          p.body.rotation.y = phase * Math.PI * 4;
          p.head.position.y = this.restPose.headY + 0.06 * Math.sin(phase * Math.PI * 2);
          p.leftArm.rotation.z = 0.9;
          p.rightArm.rotation.z = -0.9;
          p.leftArm.rotation.x = -0.35;
          p.rightArm.rotation.x = -0.35;
        } else {
          p.body.rotation.y = 0;
          this._animIdle(t);
        }
        break;

      case 'FROST':
        if (st < 0.5) {
          var phase = st / 0.5;
          p.leftArm.rotation.x = -1.3 * phase;
          p.rightArm.rotation.x = -1.3 * phase;
          p.leftArm.rotation.z = 0.25;
          p.rightArm.rotation.z = -0.25;
          p.body.position.y = -0.03 * phase;
          p.head.rotation.x = 0.12 * phase;
        } else {
          this._animIdle(t);
        }
        break;

      case 'DRIFTWOOD':
        if (st < 0.6) {
          var phase = st / 0.6;
          p.rightArm.rotation.x = -2.5 * phase;
          p.rightArm.rotation.z = -0.25;
          p.leftArm.rotation.x = -0.5 * phase;
          p.body.rotation.x = -0.12 * phase;
          p.head.rotation.x = -0.18 * phase;
        } else {
          this._animIdle(t);
        }
        break;

      case 'STEEL_BONE':
        if (st < 0.4) {
          var phase = st / 0.4;
          p.body.position.y = -0.08 * Math.sin(phase * Math.PI);
          p.head.position.y = this.restPose.headY - 0.08 * Math.sin(phase * Math.PI);
          var armPhase = phase < 0.5 ? phase * 2 : 2 - phase * 2;
          p.leftArm.rotation.x = 1.5 * armPhase;
          p.rightArm.rotation.x = 1.5 * armPhase;
          p.leftArm.rotation.z = 0.35 * armPhase;
          p.rightArm.rotation.z = -0.35 * armPhase;
        } else {
          this._animIdle(t);
        }
        break;

      case 'HIGH_ENERGY':
        if (st < 1.0) {
          var phase = st;
          p.body.position.y = 0.08 + Math.sin(phase * 4) * 0.04;
          p.head.position.y = this.restPose.headY + 0.08 + Math.sin(phase * 4) * 0.04;
          p.leftArm.rotation.z = 0.45 + Math.sin(phase * 3) * 0.12;
          p.rightArm.rotation.z = -0.45 - Math.sin(phase * 3 + 1) * 0.12;
          p.leftArm.rotation.x = -0.25;
          p.rightArm.rotation.x = -0.25;
          p.leftLeg.rotation.x = 0.15;
          p.rightLeg.rotation.x = -0.1;
        } else {
          this._animIdle(t);
        }
        break;

      case 'WAIWAI':
        if (st < 0.5) {
          var phase = st / 0.5;
          p.leftArm.rotation.z = 0.7 * Math.sin(phase * Math.PI * 4);
          p.rightArm.rotation.z = -0.7 * Math.sin(phase * Math.PI * 4 + 0.5);
          p.leftArm.rotation.x = -0.55;
          p.rightArm.rotation.x = -0.55;
          p.body.rotation.z = Math.sin(phase * Math.PI * 2) * 0.1;
        } else {
          this._animIdle(t);
        }
        break;

      default:
        this._animIdle(t);
    }
  }

  // --- 受伤动画 ---
  _animHurt(dt, t) {
    var p = this.parts;
    this.hurtTimer += dt;
    var ht = this.hurtTimer;
    var duration = 0.3;

    if (ht < duration) {
      var phase = ht / duration;
      p.body.rotation.x = -0.35 * Math.sin(phase * Math.PI);
      p.head.rotation.x = -0.25 * Math.sin(phase * Math.PI);
      var shrink = 1 - 0.06 * Math.sin(phase * Math.PI);
      p.body.scale.set(shrink, shrink, shrink);
    } else {
      p.body.scale.set(1, 1, 1);
      this._animIdle(t);
    }
  }

  // --- 死亡动画 ---
  _animDead(dt, t) {
    var p = this.parts;
    this.deadTimer += dt;
    var dt2 = this.deadTimer;

    var fallProgress = Math.min(1, dt2 / 0.8);
    var eased = 1 - Math.pow(1 - fallProgress, 3);

    p.body.rotation.z = eased * 1.4;
    p.body.rotation.x = eased * 0.2;
    p.head.rotation.z = eased * 0.5;
    p.body.position.y = -eased * 0.15;
    p.head.position.y = this.restPose.headY - eased * 0.15;
    p.leftArm.rotation.z = 0.3 + eased * 0.5;
    p.rightArm.rotation.z = -0.3 - eased * 0.5;
    p.leftLeg.rotation.x = eased * 0.3;
    p.rightLeg.rotation.x = -eased * 0.2;

    if (dt2 > 1.5) {
      var sink = Math.min(0.3, (dt2 - 1.5) * 0.1);
      p.modelGroup.position.y = -sink;
    }
  }

  // --- 角色特定待机小动作 ---
  _roleIdleTick(t) {
    var p = this.parts;
    var acc = p.accessories;

    switch (this.roleKey) {
      case 'FOX': {
        var tail = acc.getObjectByName('foxTail');
        if (tail) {
          tail.rotation.y = Math.sin(t * 2.5) * 0.4;
          tail.rotation.x = Math.sin(t * 1.8) * 0.12;
        }
        break;
      }
      case 'PORK_DOCTOR': {
        p.head.rotation.x += Math.sin(t * 1.5) * 0.05;
        p.body.rotation.z += Math.sin(t * 1.2) * 0.04;
        break;
      }
      case 'HURRICANE': {
        var wingChildren = acc.children;
        wingChildren.forEach(function(child) {
          if (child.material && child.material.transparent && child.material.opacity < 1) {
            child.rotation.z = Math.sin(t * 4 + child.position.x * 5) * 0.2;
          }
          if (child.children) {
            child.children.forEach(function(sub) {
              if (sub.material && sub.material.transparent) {
                sub.rotation.z = Math.sin(t * 4 + 1) * 0.15;
              }
            });
          }
        });
        break;
      }
      case 'FROST': {
        var comp = acc.getObjectByName('companion');
        if (comp) {
          comp.position.y = 0.38 + Math.sin(t * 3.5) * 0.02;
          comp.rotation.z = Math.sin(t * 2.5) * 0.12;
          comp.rotation.x = Math.sin(t * 1.8) * 0.08;
        }
        break;
      }
      case 'STEEL_BONE': {
        var ribbon = acc.getObjectByName('ribbon');
        if (ribbon) {
          ribbon.rotation.y = 0.3 + Math.sin(t * 2) * 0.2;
          ribbon.position.x = -0.25 + Math.sin(t * 1.5) * 0.015;
        }
        break;
      }
      case 'HIGH_ENERGY': {
        var bfly = acc.getObjectByName('butterfly');
        if (bfly) {
          bfly.position.y = bfly.position.y + Math.sin(t * 3) * 0.0005;
          bfly.rotation.y = Math.sin(t * 2) * 0.35;
          bfly.rotation.z = Math.sin(t * 2.5) * 0.1;
        }
        break;
      }
      case 'WAIWAI': {
        p.head.rotation.z += Math.sin(t * 1.0) * 0.08;
        p.head.rotation.x += Math.sin(t * 0.7) * 0.04;
        break;
      }
      case 'DRIFTWOOD': {
        p.body.rotation.z += Math.sin(t * 1.2) * 0.025;
        break;
      }
    }
  }
}