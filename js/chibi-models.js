// ============================================
// chibi-models.js
// 筑梦激斗 Q版角色模型系统 (v2 - 精细版)
// 2.5头身比例 | 800-1500三角面/角色 | 模块化部件
// MeshToonMaterial 卡通渲染 | 更多几何体组合 | 更精细配件
// ============================================

// ====== 角色设计数据 ======
const CHIBI_SPECS = {
  FOX: {
    name: '狐狸',
    bodyColor: 0xD2691E,
    bellyColor: 0xFFF8F0,
    earInner: 0xFFB6C1,
    pawColor: 0x5D4037,
    hairColor: 0xD2691E,
    eyeColor: 0x8B4513,
    skinColor: 0xD2691E,
    scarfColor: 0xCC3333,
    coatColor: 0xB85C2A,
    features: ['foxEars', 'fluffyTail', 'scarf', 'hoodie']
  },
  PORK_DOCTOR: {
    name: '猪排博士',
    bodyColor: 0xFFB6C1,
    bellyColor: 0xFFF0F5,
    earInner: 0xFF9999,
    pawColor: 0xFFB6C1,
    hairColor: 0xFFB6C1,
    eyeColor: 0xD2691E,
    skinColor: 0xFFB6C1,
    cloakColor: 0xFFD700,
    buttonColor: 0xFFD700,
    features: ['pigNose', 'pigEars', 'curlyTail', 'goldCloak']
  },
  HURRICANE: {
    name: '飓风',
    bodyColor: 0xF5F5F7,
    bellyColor: 0xF0F0F2,
    earInner: 0x9370DB,
    pawColor: 0xF5F5F7,
    hairColor: 0xF5F5F7,
    eyeColor: 0x8B00FF,
    skinColor: 0xF5F5F7,
    robeColor: 0x9370DB,
    hornColor: 0x222222,
    wingColor: 0x9370DB,
    features: ['curvedHorns', 'purpleWings', 'dragonTail', 'sakura']
  },
  FROST: {
    name: '冰霜',
    bodyColor: 0xF0F8FF,
    bellyColor: 0xFFF8F0,
    earInner: 0xFFB6C1,
    pawColor: 0xF0F8FF,
    hairColor: 0xE8FFE8,
    eyeColor: 0x50C878,
    skinColor: 0xF0F8FF,
    bowColor: 0x98FB98,
    hairTipColor: 0x98FF98,
    features: ['bearEars', 'mintBow', 'hairTips', 'smallCompanion']
  },
  DRIFTWOOD: {
    name: '浮木',
    bodyColor: 0xFFF8F0,
    bellyColor: 0xFFF0E6,
    earInner: 0xFFB6C1,
    pawColor: 0x8B7355,
    hairColor: 0x8B7355,
    eyeColor: 0x5D4037,
    skinColor: 0xFFF8F0,
    apronColor: 0xFFB6C1,
    hoodColor: 0xF5DEB3,
    features: ['catEars', 'bearHood', 'apron', 'bowTie']
  },
  STEEL_BONE: {
    name: '钢骨',
    bodyColor: 0x7BA7D9,
    bellyColor: 0xE8EEF5,
    earInner: 0x7BA7D9,
    pawColor: 0xE8EEF5,
    hairColor: 0xF5F5F7,
    eyeColor: 0x5BA4E6,
    skinColor: 0xE8EEF5,
    ribbonColor: 0x7BA7D9,
    beltColor: 0x222222,
    features: ['spikyHair', 'blueRibbon', 'blackBelt']
  },
  HIGH_ENERGY: {
    name: '高能人',
    bodyColor: 0xFFF8DC,
    bellyColor: 0xFFFACD,
    earInner: 0x50C878,
    pawColor: 0xFFF8DC,
    hairColor: 0xE8FFF0,
    eyeColor: 0x50C878,
    skinColor: 0xFFF8DC,
    bowColor: 0x87CEEB,
    butterflyColor: 0xFFD700,
    hairTipColor: 0x98FF98,
    features: ['elfEars', 'bigBow', 'butterfly', 'leaves']
  },
  WAIWAI: {
    name: '歪歪',
    bodyColor: 0xFFFFF0,
    bellyColor: 0xFFF8E7,
    earInner: 0xFFFFF0,
    pawColor: 0xFFFFF0,
    hairColor: 0xFFD700,
    eyeColor: 0x5BA4E6,
    skinColor: 0xFFFFF0,
    features: ['afroHair']
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
    const y = 1 - (i / (count - 1)) * 2;
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

  // --- 共享卡通梯度纹理 ---
  static _gradientMap = (() => {
    const c = document.createElement('canvas');
    c.width = 4; c.height = 1;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#444'; ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = '#999'; ctx.fillRect(1, 0, 1, 1);
    ctx.fillStyle = '#fff'; ctx.fillRect(2, 0, 2, 1);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    return tex;
  })();

  /** 创建一个共享梯度卡通材质 */
  static _toonMat(color) {
    return new THREE.MeshToonMaterial({ color: color, gradientMap: ChibiModelBuilder._gradientMap });
  }

  /** 创建皮肤材质（微光泽） */
  static _skinMat(color) {
    const m = new THREE.MeshToonMaterial({ color: color, gradientMap: ChibiModelBuilder._gradientMap });
    m.shininess = 15;
    return m;
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

    if (parentMesh.geometry) parentMesh.geometry.visible = false;
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

  // ====== 头部构建（精细版）======
  static _buildHead(spec, roleKey) {
    const headGroup = new THREE.Group();
    headGroup.name = 'head';
    headGroup.position.set(0, 0.62, 0);

    // --- 头部主球体（更多面数，更圆滑）---
    const headGeo = new THREE.SphereGeometry(0.3, 16, 14);
    const headMat = ChibiModelBuilder._skinMat(spec.skinColor);
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.scale.set(1, 0.9, 0.95);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // --- 婴儿肥凸起（脸颊两侧小半球）---
    const cheekMat = ChibiModelBuilder._toonMat(spec.skinColor);
    [-1, 1].forEach(side => {
      const cheek = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 6),
        cheekMat
      );
      cheek.scale.set(0.8, 0.6, 0.5);
      cheek.position.set(side * 0.2, -0.04, 0.2);
      headGroup.add(cheek);
    });

    // --- 面部/腹部贴片 ---
    if (spec.bellyColor && spec.bellyColor !== spec.skinColor) {
      const faceGeo = new THREE.SphereGeometry(0.26, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const faceMat = ChibiModelBuilder._toonMat(spec.bellyColor);
      const faceMesh = new THREE.Mesh(faceGeo, faceMat);
      faceMesh.scale.set(0.85, 0.8, 0.5);
      faceMesh.position.set(0, -0.02, 0.12);
      faceMesh.rotation.x = 0.15;
      headGroup.add(faceMesh);
    }

    // ====== 精细眼睛系统 ======
    const eyeY = 0.02;
    const eyeX = 0.1;
    const eyeZ = 0.25;

    function makeEye(sideX) {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(sideX, eyeY, eyeZ);

      // 眼白 - 扁椭圆（占脸宽2/3）
      const whiteGeo = new THREE.SphereGeometry(0.06, 10, 8);
      const whiteMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const white = new THREE.Mesh(whiteGeo, whiteMat);
      white.scale.set(1.3, 1.1, 0.5);
      eyeGroup.add(white);

      // 虹膜 - 双层渐变效果
      // 外层：深色
      const irisOuterGeo = new THREE.SphereGeometry(0.045, 8, 8);
      const irisOuterMat = new THREE.MeshBasicMaterial({ color: spec.eyeColor });
      const irisOuter = new THREE.Mesh(irisOuterGeo, irisOuterMat);
      irisOuter.position.z = 0.03;
      irisOuter.scale.set(1, 1.05, 0.6);
      eyeGroup.add(irisOuter);
      // 内层：浅色渐变
      const irisInnerGeo = new THREE.SphereGeometry(0.03, 8, 8);
      const irisInnerColor = _lerpColor(spec.eyeColor, 0xFFFFFF, 0.45);
      const irisInnerMat = new THREE.MeshBasicMaterial({ color: irisInnerColor });
      const irisInner = new THREE.Mesh(irisInnerGeo, irisInnerMat);
      irisInner.position.z = 0.035;
      eyeGroup.add(irisInner);

      // 瞳孔 - 大而圆
      const pupilGeo = new THREE.SphereGeometry(0.022, 8, 8);
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.z = 0.05;
      eyeGroup.add(pupil);

      // 主高光（大）- 右上角
      const hlGeo = new THREE.SphereGeometry(0.015, 6, 6);
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const hl = new THREE.Mesh(hlGeo, hlMat);
      hl.position.set(0.022, 0.022, 0.06);
      eyeGroup.add(hl);

      // 副高光（小）- 左下角
      const hl2Geo = new THREE.SphereGeometry(0.007, 4, 4);
      const hl2 = new THREE.Mesh(hl2Geo, hlMat);
      hl2.position.set(-0.018, -0.015, 0.06);
      eyeGroup.add(hl2);

      // 眼睫毛 - 眼白上方小扁条
      const lashGeo = new THREE.BoxGeometry(0.06, 0.006, 0.008);
      const lashMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
      const lash = new THREE.Mesh(lashGeo, lashMat);
      lash.position.set(0, 0.04, 0.015);
      eyeGroup.add(lash);

      // 高能人四叶草瞳孔特效
      if (roleKey === 'HIGH_ENERGY') {
        const cloverGeo = new THREE.SphereGeometry(0.01, 4, 4);
        const cloverMat = new THREE.MeshBasicMaterial({ color: 0x98FF98 });
        for (let i = 0; i < 4; i++) {
          const c = new THREE.Mesh(cloverGeo, cloverMat);
          const angle = (Math.PI / 2) * i;
          c.position.set(Math.cos(angle) * 0.015, Math.sin(angle) * 0.015, 0.055);
          eyeGroup.add(c);
        }
      }

      return eyeGroup;
    }

    const leftEye = makeEye(-eyeX);
    const rightEye = makeEye(eyeX);
    headGroup.add(leftEye);
    headGroup.add(rightEye);

    // ====== 腮红（更大更柔和）======
    const blushMat = new THREE.SpriteMaterial({
      color: 0xFF8888,
      transparent: true,
      opacity: 0.3,
      depthTest: false
    });
    const blushGeo = new THREE.CircleGeometry(0.05, 12);

    const leftBlush = new THREE.Sprite(blushMat);
    leftBlush.geometry = blushGeo;
    leftBlush.position.set(-0.16, -0.07, 0.26);
    leftBlush.scale.set(0.1, 0.07, 1);
    headGroup.add(leftBlush);

    const rightBlush = new THREE.Sprite(blushMat.clone());
    rightBlush.geometry = blushGeo;
    rightBlush.position.set(0.16, -0.07, 0.26);
    rightBlush.scale.set(0.1, 0.07, 1);
    headGroup.add(rightBlush);

    // ====== 嘴巴（精致弧线 - CatmullRomCurve3 管道）======
    const mouthPoints = [];
    for (let i = 0; i <= 8; i++) {
      const t = (i / 8) * Math.PI;
      mouthPoints.push(new THREE.Vector3(
        -0.025 + (i / 8) * 0.05,
        -0.005 * Math.sin(t),
        0.28 + 0.005 * Math.cos(t)
      ));
    }
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x664444 });
    const mouth = _tube(mouthPoints, 0.003, 4, 6, mouthMat);
    mouth.position.y = -0.1;
    headGroup.add(mouth);

    // ====== 鼻子 ======
    const noseGeo = new THREE.SphereGeometry(0.015, 6, 6);
    const noseMat = ChibiModelBuilder._toonMat(0xDDAA99);
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, -0.04, 0.28);
    headGroup.add(nose);

    return { group: headGroup, mesh: headMesh, leftEye, rightEye };
  }

  // ====== 身体构建（精细版）======
  static _buildBody(spec, roleKey) {
    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'body';

    // --- 躯干（更多面数球体，更圆润）---
    const bodyGeo = new THREE.SphereGeometry(0.22, 14, 12);
    const bodyMat = ChibiModelBuilder._toonMat(spec.bodyColor);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.scale.set(1, 1.1, 0.85);
    bodyMesh.position.set(0, 0.32, 0);
    bodyMesh.castShadow = true;
    bodyGroup.add(bodyMesh);

    // --- 小肚子凸起（前方半球）---
    const bellyMat = ChibiModelBuilder._toonMat(spec.bellyColor);
    const bellyGeo = new THREE.SphereGeometry(0.17, 10, 8);
    const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
    bellyMesh.scale.set(0.85, 0.9, 0.5);
    bellyMesh.position.set(0, 0.28, 0.1);
    bodyGroup.add(bellyMesh);
    // 小肚子额外凸出
    const tummyBump = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      bellyMat
    );
    tummyBump.scale.set(0.7, 0.6, 0.5);
    tummyBump.position.set(0, 0.26, 0.15);
    bodyGroup.add(tummyBump);

    // ====== 手臂（肩膀更窄 ±0.25，稍微下垂）======
    const armGeo = new THREE.CapsuleGeometry(0.06, 0.15, 5, 8);
    const armMat = ChibiModelBuilder._toonMat(spec.bodyColor);
    const handMat = ChibiModelBuilder._toonMat(spec.pawColor || spec.skinColor);

    // 左臂
    const leftArm = new THREE.Group();
    leftArm.name = 'leftArm';
    leftArm.position.set(-0.25, 0.42, 0);
    leftArm.rotation.z = 0.15; // 微微外展下垂
    const leftArmMesh = new THREE.Mesh(armGeo, armMat);
    leftArmMesh.position.set(0, -0.1, 0);
    leftArm.add(leftArmMesh);
    const leftHand = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 6),
      handMat
    );
    leftHand.position.set(0, -0.22, 0);
    leftArm.add(leftHand);
    bodyGroup.add(leftArm);

    // 右臂
    const rightArm = new THREE.Group();
    rightArm.name = 'rightArm';
    rightArm.position.set(0.25, 0.42, 0);
    rightArm.rotation.z = -0.15;
    const rightArmMesh = new THREE.Mesh(armGeo, armMat.clone());
    rightArmMesh.position.set(0, -0.1, 0);
    rightArm.add(rightArmMesh);
    const rightHand = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 6),
      handMat.clone()
    );
    rightHand.position.set(0, -0.22, 0);
    rightArm.add(rightHand);
    bodyGroup.add(rightArm);

    // ====== 腿（更短更粗）======
    const legGeo = new THREE.CapsuleGeometry(0.07, 0.1, 5, 8);
    const legMat = ChibiModelBuilder._toonMat(spec.bodyColor);
    const footMat = ChibiModelBuilder._toonMat(spec.pawColor || spec.bodyColor);

    // 左腿
    const leftLeg = new THREE.Group();
    leftLeg.name = 'leftLeg';
    leftLeg.position.set(-0.1, 0.14, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, legMat);
    leftLegMesh.position.set(0, -0.06, 0);
    leftLeg.add(leftLegMesh);
    const leftFoot = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 8, 6),
      footMat
    );
    leftFoot.scale.set(1.2, 0.5, 1.4); // 更扁更宽的脚
    leftFoot.position.set(0, -0.17, 0.02);
    leftLeg.add(leftFoot);
    bodyGroup.add(leftLeg);

    // 右腿
    const rightLeg = new THREE.Group();
    rightLeg.name = 'rightLeg';
    rightLeg.position.set(0.1, 0.14, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, legMat.clone());
    rightLegMesh.position.set(0, -0.06, 0);
    rightLeg.add(rightLegMesh);
    const rightFoot = new THREE.Mesh(
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
      leftArm, rightArm,
      leftLeg, rightLeg
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
  //  FOX 狐狸配件（精细版）
  // ============================================================
  static _buildFoxAccessories(group, spec) {
    const headY = 0.62;
    const toon = (c) => ChibiModelBuilder._toonMat(c);

    // --- 三角狐耳（更大更尖更长）---
    const earGeo = new THREE.ConeGeometry(0.12, 0.24, 4);
    const earMat = toon(spec.bodyColor);
    const earInnerGeo = new THREE.ConeGeometry(0.07, 0.16, 4);
    const earInnerMat = toon(spec.earInner);

    [-1, 1].forEach(side => {
      const ear = new THREE.Mesh(earGeo, earMat);
      ear.position.set(side * 0.18, headY + 0.36, -0.02);
      ear.rotation.z = side * -0.35;
      ear.rotation.x = -0.15;
      group.add(ear);

      const inner = new THREE.Mesh(earInnerGeo, earInnerMat);
      inner.position.set(side * 0.18, headY + 0.34, 0.02);
      inner.rotation.z = side * -0.35;
      inner.rotation.x = -0.15;
      group.add(inner);

      // 耳内白色绒毛效果（小半透明球）
      const fluff = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 6, 5),
        new THREE.MeshToonMaterial({
          color: 0xFFFFFF,
          transparent: true,
          opacity: 0.5,
          gradientMap: ChibiModelBuilder._gradientMap
        })
      );
      fluff.scale.set(0.8, 0.6, 0.4);
      fluff.position.set(side * 0.18, headY + 0.32, 0.03);
      group.add(fluff);
    });

    // --- 白色面部标记 ---
    // 两眼上方小白点
    [-1, 1].forEach(side => {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 6, 5),
        toon(0xFFFFFF)
      );
      dot.scale.set(1.2, 0.6, 0.4);
      dot.position.set(side * 0.1, headY + 0.1, 0.27);
      group.add(dot);
    });
    // 嘴部白色区域
    const muzzleWhite = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 6),
      toon(spec.bellyColor)
    );
    muzzleWhite.scale.set(1.4, 0.8, 0.5);
    muzzleWhite.position.set(0, headY - 0.04, 0.27);
    group.add(muzzleWhite);

    // --- 蓬松大尾巴（8-10个球体，更大体积变化）---
    const tailGroup = new THREE.Group();
    tailGroup.name = 'foxTail';
    tailGroup.position.set(0, 0.35, -0.25);

    const tailData = [
      { y: 0, z: 0, r: 0.07, color: spec.bodyColor },
      { y: 0.04, z: -0.03, r: 0.09, color: spec.bodyColor },
      { y: 0.08, z: -0.06, r: 0.11, color: spec.bodyColor },
      { y: 0.12, z: -0.09, r: 0.13, color: spec.bodyColor },
      { y: 0.15, z: -0.12, r: 0.14, color: spec.bodyColor },
      { y: 0.18, z: -0.15, r: 0.13, color: spec.bodyColor },
      { y: 0.2, z: -0.17, r: 0.11, color: spec.bodyColor },
      { y: 0.22, z: -0.19, r: 0.12, color: spec.bellyColor },
      { y: 0.24, z: -0.21, r: 0.1, color: spec.bellyColor },
      { y: 0.25, z: -0.22, r: 0.07, color: spec.bellyColor },
    ];
    tailData.forEach(t => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(0.01, t.r), 8, 6),
        toon(t.color)
      );
      m.position.set(0, t.y, t.z);
      tailGroup.add(m);
    });
    group.add(tailGroup);

    // --- 围巾（弧形 Torus + 两个垂坠 CapsuleGeometry）---
    // 围巾环
    const scarfGeo = new THREE.TorusGeometry(0.2, 0.04, 5, 14, Math.PI * 1.3);
    const scarfMat = toon(spec.scarfColor);
    const scarf = new THREE.Mesh(scarfGeo, scarfMat);
    scarf.position.set(0, 0.48, 0.04);
    scarf.rotation.x = Math.PI / 2;
    scarf.rotation.z = 0.2;
    group.add(scarf);
    // 围巾垂坠1
    const scarfTailGeo = new THREE.CapsuleGeometry(0.03, 0.12, 4, 6);
    const scarfTail1 = new THREE.Mesh(scarfTailGeo, scarfMat);
    scarfTail1.position.set(0.08, 0.38, 0.08);
    scarfTail1.rotation.z = 0.3;
    scarfTail1.rotation.x = 0.1;
    group.add(scarfTail1);
    // 围巾垂坠2
    const scarfTail2 = new THREE.Mesh(scarfTailGeo, scarfMat.clone());
    scarfTail2.position.set(0.12, 0.4, 0.06);
    scarfTail2.rotation.z = -0.1;
    scarfTail2.rotation.x = 0.15;
    group.add(scarfTail2);

    // --- 手脚用深棕色 ---
    // 已通过 spec.pawColor 在 _buildBody 中应用
  }

  // ============================================================
  //  PORK_DOCTOR 猪排博士配件（精细版）
  // ============================================================
  static _buildPorkDoctorAccessories(group, spec) {
    const headY = 0.62;
    const toon = (c) => ChibiModelBuilder._toonMat(c);

    // --- 猪鼻（更大更圆，鼻孔更清晰）---
    const snoutGeo = new THREE.SphereGeometry(0.09, 10, 8);
    const snoutMat = toon(0xFF9999);
    const snout = new THREE.Mesh(snoutGeo, snoutMat);
    snout.scale.set(1.3, 0.85, 0.75);
    snout.position.set(0, -0.06, 0.27);
    group.add(snout);

    // 鼻孔（更大更清晰）
    const nostrilGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.04, 8);
    const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x885555 });
    [-1, 1].forEach(side => {
      const n = new THREE.Mesh(nostrilGeo, nostrilMat);
      n.position.set(side * 0.035, -0.06, 0.34);
      n.rotation.x = Math.PI / 2;
      group.add(n);
    });

    // --- 头顶硬币槽 ---
    const slotGeo = new THREE.BoxGeometry(0.06, 0.008, 0.02);
    const slotMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const slot = new THREE.Mesh(slotGeo, slotMat);
    slot.position.set(0, headY + 0.28, 0);
    group.add(slot);
    // 硬币槽边缘
    const slotRim = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.005, 0.03),
      toon(0x666666)
    );
    slotRim.position.set(0, headY + 0.283, 0);
    group.add(slotRim);

    // --- 大圆猪耳朵（更圆更大，下垂感）---
    const pigEarGeo = new THREE.SphereGeometry(0.14, 10, 8);
    const pigEarMat = toon(spec.bodyColor);
    const pigEarInnerMat = toon(spec.earInner);

    [-1, 1].forEach(side => {
      const ear = new THREE.Mesh(pigEarGeo, pigEarMat);
      ear.scale.set(0.7, 1, 0.4);
      ear.position.set(side * 0.3, headY + 0.24, -0.06);
      ear.rotation.z = side * 0.35; // 更明显的下垂
      ear.rotation.y = side * 0.1;
      group.add(ear);

      const inner = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 6),
        pigEarInnerMat
      );
      inner.scale.set(0.6, 0.85, 0.3);
      inner.position.set(side * 0.3, headY + 0.24, -0.03);
      inner.rotation.z = side * 0.35;
      inner.rotation.y = side * 0.1;
      group.add(inner);
    });

    // --- 卷尾巴（8环，更蓬松）---
    const curlGroup = new THREE.Group();
    curlGroup.position.set(0, 0.4, -0.2);
    for (let i = 0; i < 8; i++) {
      const curl = new THREE.Mesh(
        new THREE.TorusGeometry(0.025 + i * 0.004, 0.01, 4, 8),
        toon(spec.bodyColor)
      );
      curl.position.set(0, i * 0.015, -i * 0.012);
      curl.rotation.y = i * 0.9;
      curlGroup.add(curl);
    }
    group.add(curlGroup);

    // --- 金币斗篷（添加褶皱效果）---
    const cloakGeo = new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.7);
    const cloakMat = new THREE.MeshToonMaterial({
      color: spec.cloakColor,
      side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    });
    const cloak = new THREE.Mesh(cloakGeo, cloakMat);
    cloak.scale.set(1.15, 0.95, 0.6);
    cloak.position.set(0, 0.32, -0.08);
    cloak.rotation.y = Math.PI;
    group.add(cloak);

    // 褶皱效果（多个弧面叠加）
    for (let i = 0; i < 3; i++) {
      const fold = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 4, i * 0.8, 0.8, Math.PI * 0.35, Math.PI * 0.6),
        new THREE.MeshToonMaterial({
          color: 0xDAA520,
          side: THREE.DoubleSide,
          gradientMap: ChibiModelBuilder._gradientMap
        })
      );
      fold.scale.set(1.1, 0.9, 0.55);
      fold.position.set(0, 0.32, -0.08 - i * 0.01);
      fold.rotation.y = Math.PI + (i - 1) * 0.2;
      group.add(fold);
    }

    // 金色纽扣
    for (let i = 0; i < 3; i++) {
      const btn = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 6, 6),
        new THREE.MeshBasicMaterial({ color: spec.buttonColor })
      );
      btn.position.set(0, 0.42 - i * 0.07, 0.16);
      group.add(btn);
    }

    // --- 散落的金币（2-3个小金色扁平圆柱）---
    for (let i = 0; i < 3; i++) {
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.006, 8),
        new THREE.MeshBasicMaterial({ color: 0xFFD700 })
      );
      coin.position.set(
        -0.08 + i * 0.08,
        0.02,
        0.15 + Math.random() * 0.05
      );
      coin.rotation.z = Math.random() * 0.5;
      group.add(coin);
    }
  }

  // ============================================================
  //  HURRICANE 飓风配件（精细版）
  // ============================================================
  static _buildHurricaneAccessories(group, spec) {
    const headY = 0.62;
    const toon = (c) => ChibiModelBuilder._toonMat(c);

    // --- 弯曲犄角（6段锥体，更弯曲更长）---
    [-1, 1].forEach(side => {
      const hornGroup = new THREE.Group();
      hornGroup.name = 'horn_' + (side > 0 ? 'R' : 'L');
      const segments = 6;
      for (let i = 0; i < segments; i++) {
        const t = i / (segments - 1);
        const r = 0.03 - t * 0.018;
        const seg = new THREE.Mesh(
          new THREE.ConeGeometry(Math.max(0.005, r), 0.1, 6),
          toon(t < 0.5 ? spec.hornColor : spec.robeColor)
        );
        seg.position.set(
          side * (0.15 + t * 0.1),
          headY + 0.22 + t * 0.25,
          -0.05 + t * 0.06
        );
        seg.rotation.z = side * (-0.3 - t * 0.7);
        seg.rotation.x = -t * 0.35;
        hornGroup.add(seg);
      }
      group.add(hornGroup);
    });

    // --- 翅膀（ShapeGeometry，多根手指骨架 + 膜面）---
    const wingMat = new THREE.MeshToonMaterial({
      color: spec.wingColor,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    });
    const wingBoneMat = toon(spec.wingColor);

    [-1, 1].forEach(side => {
      const wingGroup = new THREE.Group();
      wingGroup.position.set(side * 0.28, 0.4, -0.12);
      wingGroup.rotation.y = side * 0.3;
      wingGroup.scale.set(1, 1, 1);

      // 翅膀骨架（3根手指骨）
      const bones = [
        { angle: -0.3, len: 0.35 },
        { angle: 0, len: 0.45 },
        { angle: 0.3, len: 0.3 }
      ];
      bones.forEach((b, bi) => {
        const bone = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.01, b.len, 3, 4),
          wingBoneMat
        );
        bone.rotation.z = side * (b.angle + 0.5);
        bone.position.y = bi * 0.02;
        wingGroup.add(bone);
      });

      // 膜面（ShapeGeometry 扇形）
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.quadraticCurveTo(side * 0.18, 0.2, side * 0.08, 0.45);
      wingShape.quadraticCurveTo(side * 0.02, 0.35, side * -0.08, 0.3);
      wingShape.quadraticCurveTo(side * -0.02, 0.15, 0, 0);
      const wingGeo = new THREE.ShapeGeometry(wingShape);
      const wingMesh = new THREE.Mesh(wingGeo, wingMat);
      wingGroup.add(wingMesh);

      group.add(wingGroup);
    });

    // --- 龙尾巴（8段，更粗壮）---
    const dragonTailGroup = new THREE.Group();
    dragonTailGroup.name = 'dragonTail';
    dragonTailGroup.position.set(0, 0.28, -0.2);
    const tailSegs = 8;
    for (let i = 0; i < tailSegs; i++) {
      const t = i / (tailSegs - 1);
      const r = 0.05 - t * 0.025;
      const seg = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(0.008, r), 8, 6),
        toon(spec.robeColor)
      );
      seg.position.set(0, t * 0.12, -t * 0.14);
      seg.scale.set(1, 0.85, 1.2);
      dragonTailGroup.add(seg);
    }
    const tailEnd = new THREE.Mesh(
      new THREE.ConeGeometry(0.025, 0.08, 4),
      toon(spec.wingColor)
    );
    tailEnd.position.set(0, 0.12, -0.96);
    tailEnd.rotation.x = 0.8;
    dragonTailGroup.add(tailEnd);
    group.add(dragonTailGroup);

    // --- 樱花发饰（5瓣花用小球排列成环形，更精致）---
    const flowerGroup = new THREE.Group();
    flowerGroup.position.set(0.15, headY + 0.27, 0.1);
    const petalGeo = new THREE.SphereGeometry(0.02, 8, 6);
    const petalMat = new THREE.MeshBasicMaterial({ color: 0xFFB7C5 });
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 / 5) * i;
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.scale.set(1.2, 0.8, 0.6);
      petal.position.set(Math.cos(a) * 0.025, Math.sin(a) * 0.025, 0);
      flowerGroup.add(petal);
    }
    const flowerCenter = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xFFDD00 })
    );
    flowerGroup.add(flowerCenter);
    // 花茎
    const stem = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.004, 0.04, 3, 4),
      toon(0x66BB66)
    );
    stem.position.set(0, -0.03, 0);
    stem.rotation.z = 0.2;
    flowerGroup.add(stem);
    group.add(flowerGroup);

    // --- 银白色蓬松短发（多个小球 + 小锥体）---
    const hairMat = toon(spec.hairColor);
    const hairDarkMat = toon(0xE8E8F0);
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 / 10) * i;
      const isDark = i % 3 === 0;
      const fluff = new THREE.Mesh(
        new THREE.SphereGeometry(0.065 + Math.random() * 0.03, 8, 6),
        isDark ? hairDarkMat : hairMat
      );
      fluff.position.set(
        Math.cos(angle) * 0.16,
        headY + 0.24 + Math.random() * 0.06,
        Math.sin(angle) * 0.13
      );
      fluff.scale.set(1, 0.75, 0.85);
      group.add(fluff);
    }
    // 小锥体发尖
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i + 0.3;
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.018, 0.07, 4),
        hairMat
      );
      spike.position.set(
        Math.cos(angle) * 0.18,
        headY + 0.3 + Math.random() * 0.03,
        Math.sin(angle) * 0.14
      );
      spike.rotation.set(
        (Math.random() - 0.5) * 0.5,
        angle,
        -0.3 - Math.random() * 0.3
      );
      group.add(spike);
    }
  }

  // ============================================================
  //  FROST 冰霜配件（精细版）
  // ============================================================
  static _buildFrostAccessories(group, spec) {
    const headY = 0.62;
    const toon = (c) => ChibiModelBuilder._toonMat(c);

    // --- 圆熊耳朵（更圆更明显）---
    const bearEarGeo = new THREE.SphereGeometry(0.12, 10, 8);
    const bearEarMat = toon(spec.bodyColor);
    const bearEarInnerMat = toon(spec.earInner);

    [-1, 1].forEach(side => {
      const ear = new THREE.Mesh(bearEarGeo, bearEarMat);
      ear.position.set(side * 0.22, headY + 0.26, -0.02);
      ear.scale.set(1, 1.1, 0.65);
      group.add(ear);

      const inner = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 6),
        bearEarInnerMat
      );
      inner.position.set(side * 0.22, headY + 0.26, 0.015);
      inner.scale.set(1, 1.1, 0.5);
      group.add(inner);
    });

    // --- 薄荷绿蝴蝶结（双层环形，更精致）---
    const bowGroup = new THREE.Group();
    bowGroup.position.set(-0.18, headY + 0.15, 0.15);

    // 外层
    const bowOuterMat = toon(spec.bowColor);
    const bowOuterGeo = new THREE.SphereGeometry(0.06, 8, 6);
    [-1, 1].forEach(side => {
      const loop = new THREE.Mesh(bowOuterGeo, bowOuterMat);
      loop.scale.set(1.3, 0.7, 0.5);
      loop.position.set(side * 0.05, 0, 0);
      bowGroup.add(loop);
    });
    // 内层
    const bowInnerGeo = new THREE.SphereGeometry(0.04, 8, 6);
    const bowInnerMat = toon(0xB0FFB0);
    [-1, 1].forEach(side => {
      const loop = new THREE.Mesh(bowInnerGeo, bowInnerMat);
      loop.scale.set(1.2, 0.65, 0.4);
      loop.position.set(side * 0.04, 0.005, 0.01);
      bowGroup.add(loop);
    });
    const bowCenter = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 6, 6),
      toon(0x66BB6A)
    );
    bowGroup.add(bowCenter);
    // 蝴蝶结飘带
    const bowRibbon = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.015, 0.06, 3, 4),
      toon(spec.bowColor)
    );
    bowRibbon.position.set(0, -0.05, 0);
    bowRibbon.rotation.z = 0.15;
    bowGroup.add(bowRibbon);
    group.add(bowGroup);

    // --- 头发（多段渐变，白->薄荷绿，更蓬松）---
    const hairBaseMat = toon(spec.hairColor);
    const hairMidMat = toon(_lerpColor(spec.hairColor, spec.hairTipColor, 0.5));
    const hairTipMat = toon(spec.hairTipColor);

    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 / 14) * i;
      const gradIdx = i % 3; // 0=白, 1=中间, 2=绿
      const hairMats = [hairBaseMat, hairMidMat, hairTipMat];
      const hair = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.032, 0.09 + Math.random() * 0.05, 4, 6),
        hairMats[gradIdx]
      );
      const r = 0.22 + Math.random() * 0.05;
      hair.position.set(
        Math.cos(angle) * r * 0.6,
        headY + 0.2 + Math.random() * 0.08,
        Math.sin(angle) * r * 0.5
      );
      hair.rotation.set(
        (Math.random() - 0.5) * 0.4,
        angle,
        (Math.random() - 0.5) * 0.3
      );
      group.add(hair);
    }

    // --- 小伴侣（完整小熊：头+身体+四肢+眼+耳）---
    const companionGroup = new THREE.Group();
    companionGroup.name = 'companion';
    companionGroup.position.set(0.12, headY + 0.38, 0.05);
    const compColor = 0xFFFFF0;

    // 小熊身体
    const compBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 6),
      toon(compColor)
    );
    compBody.scale.set(1, 1.1, 0.9);
    companionGroup.add(compBody);

    // 小熊头
    const compHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 6),
      toon(compColor)
    );
    compHead.position.y = 0.06;
    companionGroup.add(compHead);

    // 小熊耳朵
    [-1, 1].forEach(side => {
      const cEar = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 6, 5),
        toon(compColor)
      );
      cEar.position.set(side * 0.03, 0.09, 0);
      companionGroup.add(cEar);
    });

    // 小熊眼睛
    [-1, 1].forEach(side => {
      const cEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.008, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0x333333 })
      );
      cEye.position.set(side * 0.018, 0.065, 0.03);
      companionGroup.add(cEye);
    });

    // 小熊四肢
    const limbGeo = new THREE.CapsuleGeometry(0.015, 0.03, 3, 4);
    const limbMat = toon(compColor);
    // 左右手
    [-1, 1].forEach(side => {
      const arm = new THREE.Mesh(limbGeo, limbMat);
      arm.position.set(side * 0.05, 0, 0);
      arm.rotation.z = side * 0.5;
      companionGroup.add(arm);
    });
    // 左右脚
    [-1, 1].forEach(side => {
      const leg = new THREE.Mesh(limbGeo, limbMat);
      leg.position.set(side * 0.025, -0.06, 0.01);
      leg.rotation.x = 0.3;
      companionGroup.add(leg);
    });

    group.add(companionGroup);
  }

  // ============================================================
  //  DRIFTWOOD 浮木配件（精细版）
  // ============================================================
  static _buildDriftwoodAccessories(group, spec) {
    const headY = 0.62;
    const toon = (c) => ChibiModelBuilder._toonMat(c);

    // --- 帽子（半球 + 帽檐 CylinderGeometry 扁平）---
    // 帽顶（半球）
    const hoodBase = new THREE.Mesh(
      new THREE.SphereGeometry(0.33, 12, 10),
      toon(spec.hoodColor)
    );
    hoodBase.scale.set(1.05, 0.85, 0.95);
    hoodBase.position.set(0, headY + 0.05, -0.02);
    group.add(hoodBase);

    // 帽檐（扁平 CylinderGeometry）
    const brimGeo = new THREE.CylinderGeometry(0.36, 0.38, 0.02, 16);
    const brimMat = toon(spec.hoodColor);
    const brim = new THREE.Mesh(brimGeo, brimMat);
    brim.position.set(0, headY - 0.12, 0.04);
    group.add(brim);
    // 帽檐蕾丝边
    const laceGeo = new THREE.TorusGeometry(0.36, 0.012, 4, 20);
    const laceMat = toon(0xFFF5EE);
    const lace = new THREE.Mesh(laceGeo, laceMat);
    lace.position.set(0, headY - 0.12, 0.04);
    lace.rotation.x = Math.PI / 2;
    group.add(lace);

    // --- 熊耳帽耳朵 ---
    [-1, 1].forEach(side => {
      const bearEar = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 6),
        toon(spec.hoodColor)
      );
      bearEar.position.set(side * 0.22, headY + 0.25, -0.08);
      bearEar.scale.set(0.9, 1.1, 0.5);
      group.add(bearEar);

      const inner = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 5),
        toon(spec.earInner)
      );
      inner.position.set(side * 0.22, headY + 0.25, -0.05);
      inner.scale.set(0.8, 1, 0.4);
      group.add(inner);
    });

    // --- 猫耳朵（在帽子下若隐若现）---
    [-1, 1].forEach(side => {
      const catEar = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.12, 4),
        toon(0xFFF8DC)
      );
      catEar.position.set(side * 0.14, headY + 0.27, 0.08);
      catEar.rotation.z = side * -0.2;
      catEar.rotation.x = -0.1;
      group.add(catEar);
    });

    // --- 粉色围裙（带花纹装饰）---
    const apronGeo = new THREE.SphereGeometry(0.18, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const apronMat = new THREE.MeshToonMaterial({
      color: spec.apronColor,
      side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    });
    const apron = new THREE.Mesh(apronGeo, apronMat);
    apron.scale.set(0.9, 1, 0.5);
    apron.position.set(0, 0.3, 0.1);
    group.add(apron);

    // 围裙小圆形装饰
    for (let i = 0; i < 4; i++) {
      const deco = new THREE.Mesh(
        new THREE.SphereGeometry(0.01, 6, 5),
        toon(0xFFE4E1)
      );
      deco.scale.set(1, 1, 0.3);
      const da = (Math.PI * 2 / 4) * i;
      deco.position.set(
        Math.cos(da) * 0.06,
        0.26 + Math.sin(da) * 0.04,
        0.16
      );
      group.add(deco);
    }

    // 围裙带子
    const strapGeo = new THREE.CapsuleGeometry(0.015, 0.12, 4, 4);
    const strapMat = toon(spec.apronColor);
    [-1, 1].forEach(side => {
      const strap = new THREE.Mesh(strapGeo, strapMat);
      strap.position.set(side * 0.12, 0.42, 0.12);
      strap.rotation.z = side * 0.4;
      group.add(strap);
    });

    // --- 白蝴蝶结领（更精致）---
    const bowTieGroup = new THREE.Group();
    bowTieGroup.position.set(0, 0.46, 0.16);
    const btMat = toon(0xFFFFFF);
    // 外层环
    [-1, 1].forEach(side => {
      const loop = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 6),
        btMat
      );
      loop.scale.set(1.4, 0.7, 0.4);
      loop.position.set(side * 0.04, 0, 0);
      bowTieGroup.add(loop);
    });
    // 内层
    [-1, 1].forEach(side => {
      const loop = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 6, 5),
        toon(0xEEEEEE)
      );
      loop.scale.set(1.3, 0.65, 0.35);
      loop.position.set(side * 0.03, 0.003, 0.005);
      bowTieGroup.add(loop);
    });
    const btCenter = new THREE.Mesh(
      new THREE.SphereGeometry(0.014, 6, 6),
      toon(0xDDDDDD)
    );
    bowTieGroup.add(btCenter);
    group.add(bowTieGroup);

    // --- 胡须（3条细线 CylinderGeometry）---
    const whiskerMat = toon(spec.hairColor);
    [-1, 1].forEach(side => {
      for (let i = 0; i < 3; i++) {
        const whisker = new THREE.Mesh(
          new THREE.CylinderGeometry(0.003, 0.002, 0.08, 4),
          whiskerMat
        );
        whisker.position.set(
          side * 0.06,
          headY - 0.04 + (i - 1) * 0.02,
          0.28
        );
        whisker.rotation.z = side * (0.1 + i * 0.15);
        whisker.rotation.x = -0.1;
        group.add(whisker);
      }
    });
  }

  // ============================================================
  //  STEEL_BONE 钢骨配件（精细版）
  // ============================================================
  static _buildSteelBoneAccessories(group, spec) {
    const headY = 0.62;
    const toon = (c) => ChibiModelBuilder._toonMat(c);

    // --- 蓬松头发（16-20个球体 + 小锥体刺，有层次感）---
    const hairMat = toon(spec.hairColor);
    const hairDarkMat = toon(0xDDDDE5);

    // 底层蓬松球体
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      const r = 0.18 + Math.random() * 0.08;
      const fluff = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 + Math.random() * 0.035, 8, 6),
        i % 4 === 0 ? hairDarkMat : hairMat
      );
      fluff.position.set(
        Math.cos(angle) * r * 0.5,
        headY + 0.18 + Math.random() * 0.12,
        Math.sin(angle) * r * 0.4
      );
      group.add(fluff);
    }

    // 中层（多8个）
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i + 0.4;
      const fluff = new THREE.Mesh(
        new THREE.SphereGeometry(0.05 + Math.random() * 0.025, 6, 5),
        hairMat
      );
      fluff.position.set(
        Math.cos(angle) * 0.12,
        headY + 0.28 + Math.random() * 0.06,
        Math.sin(angle) * 0.1
      );
      group.add(fluff);
    }

    // 刺状发尖（20个）
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 / 20) * i + Math.random() * 0.3;
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.02 + Math.random() * 0.015, 0.08 + Math.random() * 0.06, 4),
        i % 3 === 0 ? hairDarkMat : hairMat
      );
      const r = 0.2 + Math.random() * 0.1;
      spike.position.set(
        Math.cos(angle) * r * 0.5,
        headY + 0.26 + Math.random() * 0.1,
        Math.sin(angle) * r * 0.4
      );
      spike.rotation.set(
        (Math.random() - 0.5) * 0.6,
        angle,
        (Math.random() - 0.5) * 0.6 - 0.3
      );
      group.add(spike);
    }

    // --- 蓝色飘带（更长，ShapeGeometry 波浪形）---
    const ribbonMat = new THREE.MeshToonMaterial({
      color: spec.ribbonColor,
      side: THREE.DoubleSide,
      gradientMap: ChibiModelBuilder._gradientMap
    });

    // 波浪形飘带
    const ribbonShape = new THREE.Shape();
    ribbonShape.moveTo(0, 0);
    ribbonShape.bezierCurveTo(0.12, 0.1, 0.06, 0.25, 0.03, 0.4);
    ribbonShape.bezierCurveTo(0.08, 0.45, 0.02, 0.52, -0.01, 0.6);
    ribbonShape.lineTo(-0.03, 0.58);
    ribbonShape.bezierCurveTo(0, 0.5, 0.04, 0.42, 0, 0.38);
    ribbonShape.bezierCurveTo(-0.04, 0.22, -0.06, 0.08, 0, 0);
    const ribbonGeo = new THREE.ShapeGeometry(ribbonShape);

    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.position.set(-0.25, 0.32, 0.1);
    ribbon.rotation.y = 0.3;
    ribbon.name = 'ribbon';
    group.add(ribbon);

    // --- 腰带（更明显：扁平 CylinderGeometry + 前面的结）---
    const beltGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.025, 14);
    const beltMat = toon(spec.beltColor);
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(0, 0.22, 0);
    belt.rotation.x = Math.PI / 2;
    group.add(belt);

    // 腰带结
    const knotGeo = new THREE.SphereGeometry(0.025, 8, 6);
    const knot = new THREE.Mesh(knotGeo, beltMat);
    knot.position.set(0, 0.22, 0.2);
    knot.scale.set(1.2, 0.7, 0.6);
    group.add(knot);
    // 腰带垂坠
    [-1, 1].forEach(side => {
      const tail = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.015, 0.06, 3, 4),
        beltMat
      );
      tail.position.set(side * 0.02, 0.18, 0.21);
      tail.rotation.z = side * 0.2;
      tail.rotation.x = 0.15;
      group.add(tail);
    });

    // --- 肩部蓝色护甲（小半球）---
    [-1, 1].forEach(side => {
      const armor = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 6),
        toon(spec.ribbonColor)
      );
      armor.scale.set(1.1, 0.6, 0.9);
      armor.position.set(side * 0.28, 0.44, 0);
      group.add(armor);
    });
  }

  // ============================================================
  //  HIGH_ENERGY 高能人配件（精细版）
  // ============================================================
  static _buildHighEnergyAccessories(group, spec) {
    const headY = 0.62;
    const toon = (c) => ChibiModelBuilder._toonMat(c);

    // --- 精灵尖耳朵（ShapeGeometry，更尖更长）---
    const elfEarMat = toon(spec.skinColor);
    [-1, 1].forEach(side => {
      const earShape = new THREE.Shape();
      earShape.moveTo(0, 0);
      earShape.lineTo(side * 0.06, 0.05);
      earShape.lineTo(side * 0.12, 0.2);
      earShape.lineTo(side * 0.04, 0.18);
      earShape.lineTo(side * 0.03, 0.06);
      earShape.closePath();
      const earGeo = new THREE.ShapeGeometry(earShape);
      const ear = new THREE.Mesh(earGeo, elfEarMat);
      ear.position.set(side * 0.27, headY + 0.02, 0.02);
      ear.rotation.y = side * 0.3;
      group.add(ear);
    });

    // --- 大蝴蝶结（粉蓝，多层）---
    const bigBowGroup = new THREE.Group();
    bigBowGroup.position.set(-0.2, headY + 0.1, 0.12);
    const bigBowMat = toon(spec.bowColor);
    // 外层
    const bigBowOuterGeo = new THREE.SphereGeometry(0.08, 10, 8);
    [-1, 1].forEach(side => {
      const loop = new THREE.Mesh(bigBowOuterGeo, bigBowMat);
      loop.scale.set(1.4, 0.6, 0.45);
      loop.position.set(side * 0.07, 0, 0);
      bigBowGroup.add(loop);
    });
    // 内层
    const bigBowInnerGeo = new THREE.SphereGeometry(0.05, 8, 6);
    const bigBowInnerMat = toon(0xAADDFF);
    [-1, 1].forEach(side => {
      const loop = new THREE.Mesh(bigBowInnerGeo, bigBowInnerMat);
      loop.scale.set(1.3, 0.55, 0.4);
      loop.position.set(side * 0.055, 0.003, 0.008);
      bigBowGroup.add(loop);
    });
    const bigBowCenter = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 6, 6),
      toon(0xAADDFF)
    );
    bigBowGroup.add(bigBowCenter);
    // 飘带
    const bowTail = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.022, 0.1, 4, 6),
      bigBowMat
    );
    bowTail.position.set(0, -0.08, 0);
    bowTail.rotation.z = 0.2;
    bigBowGroup.add(bowTail);
    const bowTail2 = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.02, 0.08, 4, 6),
      bigBowMat.clone()
    );
    bowTail2.position.set(0.02, -0.07, 0.01);
    bowTail2.rotation.z = -0.15;
    bigBowGroup.add(bowTail2);
    group.add(bigBowGroup);

    // --- 蝴蝶发饰（ShapeGeometry 8翼蝴蝶）---
    const butterflyGroup = new THREE.Group();
    butterflyGroup.position.set(0.18, headY + 0.2, 0.1);
    const bflyMat = new THREE.MeshBasicMaterial({
      color: spec.butterflyColor,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });

    // 8翼蝴蝶 - 上4下4
    for (let i = 0; i < 8; i++) {
      const wingShape = new THREE.Shape();
      const angle = (Math.PI * 2 / 8) * i;
      const isUpper = i < 4;
      const len = isUpper ? 0.04 : 0.03;
      const wid = isUpper ? 0.025 : 0.02;
      wingShape.moveTo(0, 0);
      wingShape.quadraticCurveTo(wid, len * 0.6, 0, len);
      wingShape.quadraticCurveTo(-wid, len * 0.6, 0, 0);
      const wGeo = new THREE.ShapeGeometry(wingShape);
      const wing = new THREE.Mesh(wGeo, bflyMat);
      wing.rotation.z = angle;
      wing.position.set(0, 0, 0);
      butterflyGroup.add(wing);
    }
    // 蝴蝶身体
    const bflyBody = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.005, 0.035, 3, 4),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    butterflyGroup.add(bflyBody);
    butterflyGroup.name = 'butterfly';
    group.add(butterflyGroup);

    // --- 长发（16股，每股3-4段球体，白->绿渐变，更飘逸）---
    const longHairBaseMat = toon(spec.hairColor);
    const longHairMidMat = toon(_lerpColor(spec.hairColor, spec.hairTipColor, 0.5));
    const longHairTipMat = toon(spec.hairTipColor);
    const hairMats = [longHairBaseMat, longHairMidMat, longHairTipMat];

    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 / 16) * i;
      const strandGroup = new THREE.Group();
      strandGroup.position.set(
        Math.cos(angle) * 0.22 * 0.6,
        headY + 0.1 - (angle > Math.PI ? 0.05 : 0),
        Math.sin(angle) * 0.22 * 0.5
      );
      strandGroup.rotation.set(
        (Math.random() - 0.5) * 0.3,
        angle,
        (Math.random() - 0.5) * 0.3
      );

      // 每股3-4段球体
      const segCount = 3 + (Math.random() > 0.5 ? 1 : 0);
      for (let j = 0; j < segCount; j++) {
        const t = j / (segCount - 1);
        const matIdx = Math.min(2, Math.floor(t * 3));
        const segR = 0.025 - t * 0.005;
        const seg = new THREE.Mesh(
          new THREE.SphereGeometry(Math.max(0.008, segR), 6, 5),
          hairMats[matIdx]
        );
        seg.position.set(0, -j * 0.05, -j * 0.01);
        strandGroup.add(seg);
      }

      // 后面的头发更长
      if (Math.sin(angle) < -0.3) {
        strandGroup.scale.y = 1.6;
        strandGroup.position.y -= 0.08;
      }

      group.add(strandGroup);
    }

    // --- 叶子装饰（扁平椭圆形 SphereGeometry + 绿色）---
    const leafMat = new THREE.MeshBasicMaterial({ color: 0x88CC88, side: THREE.DoubleSide });
    for (let i = 0; i < 3; i++) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 8, 6),
        leafMat
      );
      leaf.scale.set(0.5, 1.3, 0.15);
      leaf.position.set(
        0.15 + i * 0.04,
        headY - 0.05 + i * 0.03,
        0.2 + i * 0.02
      );
      leaf.rotation.z = 0.3 + i * 0.2;
      leaf.rotation.y = 0.2;
      group.add(leaf);
    }

    // --- 手脚更纤细（已在 _buildBody 中使用 pawColor）---
  }

  // ============================================================
  //  WAIWAI 歪歪配件（精细版）
  // ============================================================
  static _buildWaiwaiAccessories(group, spec) {
    const headY = 0.62;
    const toon = (c) => ChibiModelBuilder._toonMat(c);

    // --- 爆炸头（25-30个球体，斐波那契球面分布）---
    const afroMat = toon(spec.hairColor);
    const afroDarkMat = toon(0xE6C200);
    const afroLightMat = toon(0xFFE44D);

    const fibPts = _fibSphere(28, 0.32, 0.06);
    fibPts.forEach((pt, i) => {
      const matChoice = i % 3 === 0 ? afroDarkMat : (i % 5 === 0 ? afroLightMat : afroMat);
      const fluff = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 + Math.random() * 0.04, 8, 6),
        matChoice
      );
      fluff.position.set(
        pt.x,
        headY + pt.y * 0.85,
        pt.z
      );
      group.add(fluff);
    });

    // --- 几缕垂下的头发（CapsuleGeometry 4-6股）---
    for (let i = 0; i < 5; i++) {
      const strand = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.018, 0.1 + Math.random() * 0.06, 4, 6),
        i % 2 === 0 ? afroMat : afroDarkMat
      );
      strand.position.set(
        -0.12 + i * 0.06,
        headY - 0.06 - Math.random() * 0.08,
        0.18 + Math.random() * 0.05
      );
      strand.rotation.z = (Math.random() - 0.5) * 0.4;
      strand.rotation.x = -0.25 - Math.random() * 0.2;
      group.add(strand);
    }

    // --- 几缕垂下的头发（更长的，6股）---
    for (let i = 0; i < 6; i++) {
      const angle = -0.5 + (Math.PI / 5) * i;
      const strand = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.016, 0.14 + Math.random() * 0.08, 3, 5),
        afroMat
      );
      strand.position.set(
        Math.cos(angle) * 0.2,
        headY - 0.1 - Math.random() * 0.06,
        0.15 + Math.sin(angle) * 0.05
      );
      strand.rotation.set(
        -0.3 - Math.random() * 0.15,
        0,
        (Math.random() - 0.5) * 0.3
      );
      group.add(strand);
    }

    // --- 不悦的眉毛（两条小扁条，内端低外端高）---
    const browMat = toon(0x8B7355);
    const browGeo = new THREE.BoxGeometry(0.05, 0.008, 0.01);
    [-1, 1].forEach(side => {
      const brow = new THREE.Mesh(browGeo, browMat);
      brow.position.set(side * 0.1, headY + 0.08, 0.28);
      brow.rotation.z = side * 0.15; // 内端低外端高
      group.add(brow);
    });
  }
}


// ====== Q版动画器（精细版）======
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
    const blend = Math.min(1, this.blendTime / this.blendDuration);
    const smoothBlend = blend * blend * (3 - 2 * blend);

    const p = this.parts;
    const t = this.time;

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

    // 通用头部微转（叠加在状态动画之上）
    if (this.state !== 'dead') {
      p.head.rotation.z += Math.sin(t * 0.8) * 0.06;
      p.head.rotation.y += Math.sin(t * 0.5) * 0.1;
    }
  }

  // --- 待机动画（更生动：更大浮动+头部微倾）---
  _animIdle(t) {
    const p = this.parts;
    // 身体浮动幅度更大
    const floatY = Math.sin(t * 2.0) * 0.025;
    p.body.position.y = floatY;
    p.head.position.y = this.restPose.headY + floatY;

    // 头部微倾
    p.head.rotation.z += Math.sin(t * 0.7) * 0.03;
    p.head.rotation.x += Math.sin(t * 0.9) * 0.02;

    // 手臂自然下垂微摆
    p.leftArm.rotation.x = Math.sin(t * 1.2) * 0.08;
    p.leftArm.rotation.z = 0.1;
    p.rightArm.rotation.x = Math.sin(t * 1.2 + 1) * 0.08;
    p.rightArm.rotation.z = -0.1;

    // 腿部静止
    p.leftLeg.rotation.x = 0;
    p.rightLeg.rotation.x = 0;

    // 角色特定待机
    this._roleIdleTick(t);
  }

  // --- 行走动画（更明显的弹跳感）---
  _animWalk(t) {
    const p = this.parts;
    const speed = 8;
    const swing = 0.55;

    // 身体上下弹跳（更大正弦偏移）
    const bounce = Math.abs(Math.sin(t * speed)) * 0.04;
    p.body.position.y = bounce;
    p.head.position.y = this.restPose.headY + bounce;

    // 身体微前倾
    p.body.rotation.x = 0.1;
    p.body.rotation.z = Math.sin(t * speed * 0.5) * 0.03; // 微微左右摇摆

    // 四肢前后摆动（对角线同步）
    p.leftArm.rotation.x = Math.sin(t * speed) * swing;
    p.leftArm.rotation.z = 0.15;
    p.rightArm.rotation.x = -Math.sin(t * speed) * swing;
    p.rightArm.rotation.z = -0.15;

    p.leftLeg.rotation.x = -Math.sin(t * speed) * swing * 0.85;
    p.rightLeg.rotation.x = Math.sin(t * speed) * swing * 0.85;

    // 头部微前倾 + 轻微上下点头
    p.head.rotation.x = 0.06;
    p.head.rotation.y += Math.sin(t * speed * 0.5) * 0.05;
  }

  // --- 攻击动画 ---
  _animAttack(dt, t) {
    const p = this.parts;
    this.attackTimer += dt;
    const at = this.attackTimer;
    const duration = 0.35;

    if (at < duration) {
      const phase = at / duration;
      let armAngle;
      if (phase < 0.3) {
        armAngle = -0.6 * (phase / 0.3);
      } else if (phase < 0.6) {
        const swing = (phase - 0.3) / 0.3;
        armAngle = -0.6 + 2.8 * swing;
      } else {
        const recover = (phase - 0.6) / 0.4;
        armAngle = 2.2 * (1 - recover);
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
    const p = this.parts;
    this.skillTimer += dt;
    const st = this.skillTimer;

    switch (this.roleKey) {
      case 'FOX':
        if (st < 0.3) {
          const phase = st / 0.3;
          p.body.position.y = -0.1 * phase;
          p.head.position.y = this.restPose.headY - 0.1 * phase;
          p.body.rotation.x = 0.2 * phase;
          p.leftLeg.rotation.x = 0.4 * phase;
          p.rightLeg.rotation.x = 0.4 * phase;
        } else if (st < 0.6) {
          const phase = (st - 0.3) / 0.3;
          p.body.position.y = 0.15 * Math.sin(phase * Math.PI);
          p.head.position.y = this.restPose.headY + 0.15 * Math.sin(phase * Math.PI);
          p.body.rotation.x = 0.2 * (1 - phase);
        } else {
          this._animIdle(t);
        }
        break;

      case 'PORK_DOCTOR':
        if (st < 0.5) {
          const phase = st / 0.5;
          const scale = 1 + 0.25 * Math.sin(phase * Math.PI);
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
          const phase = st / 0.4;
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
          const phase = st / 0.5;
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
          const phase = st / 0.6;
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
          const phase = st / 0.4;
          p.body.position.y = -0.08 * Math.sin(phase * Math.PI);
          p.head.position.y = this.restPose.headY - 0.08 * Math.sin(phase * Math.PI);
          const armPhase = phase < 0.5 ? phase * 2 : 2 - phase * 2;
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
          const phase = st;
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
          const phase = st / 0.5;
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
    const p = this.parts;
    this.hurtTimer += dt;
    const ht = this.hurtTimer;
    const duration = 0.3;

    if (ht < duration) {
      const phase = ht / duration;
      p.body.rotation.x = -0.35 * Math.sin(phase * Math.PI);
      p.head.rotation.x = -0.25 * Math.sin(phase * Math.PI);
      const shrink = 1 - 0.06 * Math.sin(phase * Math.PI);
      p.body.scale.set(shrink, shrink, shrink);
    } else {
      p.body.scale.set(1, 1, 1);
      this._animIdle(t);
    }
  }

  // --- 死亡动画 ---
  _animDead(dt, t) {
    const p = this.parts;
    this.deadTimer += dt;
    const dt2 = this.deadTimer;

    const fallProgress = Math.min(1, dt2 / 0.8);
    const eased = 1 - Math.pow(1 - fallProgress, 3);

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
      const sink = Math.min(0.3, (dt2 - 1.5) * 0.1);
      p.modelGroup.position.y = -sink;
    }
  }

  // --- 角色特定待机小动作（精细版）---
  _roleIdleTick(t) {
    const p = this.parts;
    const acc = p.accessories;

    switch (this.roleKey) {
      case 'FOX': {
        // 尾巴左右摇摆
        const tail = acc.getObjectByName('foxTail');
        if (tail) {
          tail.rotation.y = Math.sin(t * 2.5) * 0.4;
          tail.rotation.x = Math.sin(t * 1.8) * 0.12;
        }
        break;
      }
      case 'PORK_DOCTOR': {
        // 微微点头
        p.head.rotation.x += Math.sin(t * 1.5) * 0.05;
        // 微微左右晃动（胖乎乎的感觉）
        p.body.rotation.z += Math.sin(t * 1.2) * 0.04;
        break;
      }
      case 'HURRICANE': {
        // 翅膀微振动
        const wingChildren = acc.children;
        wingChildren.forEach(child => {
          if (child.material && child.material.transparent && child.material.opacity < 1) {
            child.rotation.z = Math.sin(t * 4 + child.position.x * 5) * 0.2;
          }
          // 翅膀组内的子物体也要微动
          if (child.children) {
            child.children.forEach(sub => {
              if (sub.material && sub.material.transparent) {
                sub.rotation.z = Math.sin(t * 4 + 1) * 0.15;
              }
            });
          }
        });
        break;
      }
      case 'FROST': {
        // 小伴侣上下弹跳
        const comp = acc.getObjectByName('companion');
        if (comp) {
          comp.position.y = 0.38 + Math.sin(t * 3.5) * 0.02;
          comp.rotation.z = Math.sin(t * 2.5) * 0.12;
          comp.rotation.x = Math.sin(t * 1.8) * 0.08;
        }
        break;
      }
      case 'STEEL_BONE': {
        // 飘带飘动
        const ribbon = acc.getObjectByName('ribbon');
        if (ribbon) {
          ribbon.rotation.y = 0.3 + Math.sin(t * 2) * 0.2;
          ribbon.position.x = -0.25 + Math.sin(t * 1.5) * 0.015;
        }
        break;
      }
      case 'HIGH_ENERGY': {
        // 蝴蝶发饰上下飞舞
        const bfly = acc.getObjectByName('butterfly');
        if (bfly) {
          bfly.position.y = bfly.position.y + Math.sin(t * 3) * 0.0005;
          bfly.rotation.y = Math.sin(t * 2) * 0.35;
          bfly.rotation.z = Math.sin(t * 2.5) * 0.1;
        }
        break;
      }
      case 'WAIWAI': {
        // 头发微微晃动
        p.head.rotation.z += Math.sin(t * 1.0) * 0.08;
        p.head.rotation.x += Math.sin(t * 0.7) * 0.04;
        break;
      }
      case 'DRIFTWOOD': {
        // 安静微摆
        p.body.rotation.z += Math.sin(t * 1.2) * 0.025;
        break;
      }
    }
  }
}
