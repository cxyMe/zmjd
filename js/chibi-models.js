// ============================================
// chibi-models.js
// 筑梦激斗 Q版角色模型系统
// 2.5头身比例 | 500-1000三角面/角色 | 模块化部件
// ============================================

// ====== 角色设计数据 ======
const CHIBI_SPECS = {
  FOX: {
    name: '狐狸',
    bodyColor: 0xD2691E,       // 暖橙红毛色
    bellyColor: 0xFFF8F0,      // 奶白面部/腹部
    earInner: 0xFFB6C1,        // 粉内耳
    pawColor: 0x5D4037,        // 深棕爪
    hairColor: 0xD2691E,
    eyeColor: 0x8B4513,
    skinColor: 0xD2691E,
    scarfColor: 0xCC3333,
    coatColor: 0xB85C2A,
    features: ['foxEars', 'fluffyTail', 'scarf', 'hoodie']
  },
  PORK_DOCTOR: {
    name: '猪排博士',
    bodyColor: 0xFFB6C1,       // 粉色皮肤
    bellyColor: 0xFFF0F5,      // 浅粉肚子
    earInner: 0xFF9999,
    pawColor: 0xFFB6C1,
    hairColor: 0xFFB6C1,
    eyeColor: 0xD2691E,        // 琥珀棕
    skinColor: 0xFFB6C1,
    cloakColor: 0xFFD700,      // 金币斗篷
    buttonColor: 0xFFD700,
    features: ['pigNose', 'pigEars', 'curlyTail', 'goldCloak']
  },
  HURRICANE: {
    name: '飓风',
    bodyColor: 0xF5F5F7,       // 白和服
    bellyColor: 0xF0F0F2,
    earInner: 0x9370DB,
    pawColor: 0xF5F5F7,
    hairColor: 0xF5F5F7,       // 白/银发
    eyeColor: 0x8B00FF,        // 紫
    skinColor: 0xF5F5F7,
    robeColor: 0x9370DB,       // 紫渐变外衣
    hornColor: 0x222222,
    wingColor: 0x9370DB,
    features: ['curvedHorns', 'purpleWings', 'dragonTail', 'sakura']
  },
  FROST: {
    name: '冰霜',
    bodyColor: 0xF0F8FF,       // 白色毛绒外套
    bellyColor: 0xFFF8F0,
    earInner: 0xFFB6C1,        // 粉色内耳
    pawColor: 0xF0F8FF,
    hairColor: 0xE8FFE8,       // 白/薄荷绿头发
    eyeColor: 0x50C878,        // 绿
    skinColor: 0xF0F8FF,
    bowColor: 0x98FB98,        // 薄荷绿蝴蝶结
    hairTipColor: 0x98FF98,
    features: ['bearEars', 'mintBow', 'hairTips', 'smallCompanion']
  },
  DRIFTWOOD: {
    name: '浮木',
    bodyColor: 0xFFF8F0,       // 奶白连帽衣
    bellyColor: 0xFFF0E6,
    earInner: 0xFFB6C1,
    pawColor: 0x8B7355,
    hairColor: 0x8B7355,       // 棕色胡须
    eyeColor: 0x5D4037,        // 深棕
    skinColor: 0xFFF8F0,
    apronColor: 0xFFB6C1,      // 粉色围裙
    hoodColor: 0xF5DEB3,       // 米色熊耳帽
    features: ['catEars', 'bearHood', 'apron', 'bowTie']
  },
  STEEL_BONE: {
    name: '钢骨',
    bodyColor: 0x7BA7D9,       // 蓝色和服外衣
    bellyColor: 0xE8EEF5,
    earInner: 0x7BA7D9,
    pawColor: 0xE8EEF5,
    hairColor: 0xF5F5F7,       // 银白蓬松头发
    eyeColor: 0x5BA4E6,        // 天蓝
    skinColor: 0xE8EEF5,
    ribbonColor: 0x7BA7D9,     // 蓝色飘带
    beltColor: 0x222222,       // 黑色腰带
    features: ['spikyHair', 'blueRibbon', 'blackBelt']
  },
  HIGH_ENERGY: {
    name: '高能人',
    bodyColor: 0xFFF8DC,       // 奶油色针织背心
    bellyColor: 0xFFFACD,
    earInner: 0x50C878,
    pawColor: 0xFFF8DC,
    hairColor: 0xE8FFF0,       // 白/薄荷绿渐变长发
    eyeColor: 0x50C878,        // 绿
    skinColor: 0xFFF8DC,
    bowColor: 0x87CEEB,        // 粉蓝蝴蝶结
    butterflyColor: 0xFFD700,  // 蝴蝶发饰金色
    hairTipColor: 0x98FF98,
    features: ['elfEars', 'bigBow', 'butterfly', 'leaves']
  },
  WAIWAI: {
    name: '歪歪',
    bodyColor: 0xFFFFF0,       // 白T恤
    bellyColor: 0xFFF8E7,      // 奶油裤
    earInner: 0xFFFFF0,
    pawColor: 0xFFFFF0,
    hairColor: 0xFFD700,       // 金黄蓬松头发
    eyeColor: 0x5BA4E6,        // 天蓝
    skinColor: 0xFFFFF0,
    features: ['afroHair']
  }
};

// ====== 模型构建器 ======
class ChibiModelBuilder {

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

    // 隐藏原有几何体（保留做碰撞体）
    if (parentMesh.geometry) parentMesh.geometry.visible = false;
    parentMesh.visible = true; // 保持父级可见

    // 创建模型容器
    const modelGroup = new THREE.Group();
    modelGroup.name = 'chibiModel';

    // 构建各部件
    const head = ChibiModelBuilder._buildHead(spec, roleKey);
    const bodyGroup = ChibiModelBuilder._buildBody(spec, roleKey);
    const accessories = new THREE.Group();
    accessories.name = 'accessories';
    ChibiModelBuilder._buildAccessories(accessories, roleKey, spec);

    // 组装
    modelGroup.add(head.group);
    modelGroup.add(bodyGroup.group);
    modelGroup.add(accessories);

    // 挂载到父mesh
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

    // 鹅蛋形头部 - 球体Y轴压缩
    const headGeo = new THREE.SphereGeometry(0.3, 12, 10);
    const headMat = new THREE.MeshLambertMaterial({ color: spec.skinColor });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.scale.set(1, 0.9, 0.95);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // 肚子/面部颜色（正面贴片）
    if (spec.bellyColor && spec.bellyColor !== spec.skinColor) {
      const faceGeo = new THREE.SphereGeometry(0.26, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const faceMat = new THREE.MeshLambertMaterial({ color: spec.bellyColor });
      const faceMesh = new THREE.Mesh(faceGeo, faceMat);
      faceMesh.scale.set(0.85, 0.8, 0.5);
      faceMesh.position.set(0, -0.02, 0.12);
      faceMesh.rotation.x = 0.15;
      headGroup.add(faceMesh);
    }

    // ====== 眼睛 ======
    // 位置：脸部下1/3 → Y偏移约0.02，占脸宽2/3 → X偏移±0.1
    const eyeY = 0.02;
    const eyeX = 0.1;
    const eyeZ = 0.25;

    // 创建一只眼睛
    function makeEye(sideX) {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(sideX, eyeY, eyeZ);

      // 眼白
      const whiteGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const whiteMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const white = new THREE.Mesh(whiteGeo, whiteMat);
      eyeGroup.add(white);

      // 虹膜
      const irisGeo = new THREE.SphereGeometry(0.045, 8, 8);
      const irisMat = new THREE.MeshBasicMaterial({ color: spec.eyeColor });
      const iris = new THREE.Mesh(irisGeo, irisMat);
      iris.position.z = 0.035;
      eyeGroup.add(iris);

      // 瞳孔
      const pupilGeo = new THREE.SphereGeometry(0.022, 6, 6);
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.z = 0.05;
      eyeGroup.add(pupil);

      // 高光点
      const hlGeo = new THREE.SphereGeometry(0.012, 4, 4);
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const hl = new THREE.Mesh(hlGeo, hlMat);
      hl.position.set(0.02, 0.02, 0.06);
      eyeGroup.add(hl);

      // 第二高光（小）
      const hl2Geo = new THREE.SphereGeometry(0.006, 4, 4);
      const hl2 = new THREE.Mesh(hl2Geo, hlMat);
      hl2.position.set(-0.015, -0.01, 0.06);
      eyeGroup.add(hl2);

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

    // ====== 腮红 ======
    const blushMat = new THREE.SpriteMaterial({
      color: 0xFF8888,
      transparent: true,
      opacity: 0.45,
      depthTest: false
    });
    const blushGeo = new THREE.CircleGeometry(0.04, 8);

    const leftBlush = new THREE.Sprite(blushMat);
    leftBlush.geometry = blushGeo;
    leftBlush.position.set(-0.15, -0.06, 0.26);
    leftBlush.scale.set(0.08, 0.05, 1);
    headGroup.add(leftBlush);

    const rightBlush = new THREE.Sprite(blushMat.clone());
    rightBlush.geometry = blushGeo;
    rightBlush.position.set(0.15, -0.06, 0.26);
    rightBlush.scale.set(0.08, 0.05, 1);
    headGroup.add(rightBlush);

    // ====== 嘴巴（弧线） ======
    const mouthGeo = new THREE.TorusGeometry(0.03, 0.005, 4, 8, Math.PI);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x664444 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -0.1, 0.26);
    mouth.rotation.z = Math.PI;
    headGroup.add(mouth);

    // ====== 鼻子 ======
    const noseGeo = new THREE.SphereGeometry(0.015, 6, 6);
    const noseMat = new THREE.MeshLambertMaterial({ color: 0xDDAA99 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, -0.04, 0.28);
    headGroup.add(nose);

    return { group: headGroup, mesh: headMesh, leftEye, rightEye };
  }

  // ====== 身体构建 ======
  static _buildBody(spec, roleKey) {
    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'body';

    // 躯干：球体Y轴拉伸
    const bodyGeo = new THREE.SphereGeometry(0.22, 10, 8);
    const bodyMat = new THREE.MeshLambertMaterial({ color: spec.bodyColor });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.scale.set(1, 1.1, 0.85);
    bodyMesh.position.set(0, 0.32, 0);
    bodyMesh.castShadow = true;
    bodyGroup.add(bodyMesh);

    // 肚子/腹部浅色贴片
    if (spec.bellyColor && spec.bellyColor !== spec.bodyColor) {
      const bellyGeo = new THREE.SphereGeometry(0.17, 8, 6);
      const bellyMat = new THREE.MeshLambertMaterial({ color: spec.bellyColor });
      const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
      bellyMesh.scale.set(0.8, 0.9, 0.5);
      bellyMesh.position.set(0, 0.3, 0.1);
      bodyGroup.add(bellyMesh);
    }

    // ====== 手臂（香肠型） ======
    const armGeo = new THREE.CapsuleGeometry(0.06, 0.15, 4, 8);
    const armMat = new THREE.MeshLambertMaterial({ color: spec.bodyColor });

    // 左臂
    const leftArm = new THREE.Group();
    leftArm.name = 'leftArm';
    leftArm.position.set(-0.3, 0.42, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, armMat);
    leftArmMesh.position.set(0, -0.1, 0);
    leftArm.add(leftArmMesh);
    // 左手（小圆坨）
    const leftHand = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 6, 6),
      new THREE.MeshLambertMaterial({ color: spec.pawColor || spec.skinColor })
    );
    leftHand.position.set(0, -0.22, 0);
    leftArm.add(leftHand);
    bodyGroup.add(leftArm);

    // 右臂
    const rightArm = new THREE.Group();
    rightArm.name = 'rightArm';
    rightArm.position.set(0.3, 0.42, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, armMat.clone());
    rightArmMesh.position.set(0, -0.1, 0);
    rightArm.add(rightArmMesh);
    // 右手
    const rightHand = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 6, 6),
      new THREE.MeshLambertMaterial({ color: spec.pawColor || spec.skinColor })
    );
    rightHand.position.set(0, -0.22, 0);
    rightArm.add(rightHand);
    bodyGroup.add(rightArm);

    // ====== 腿（香肠型） ======
    const legGeo = new THREE.CapsuleGeometry(0.065, 0.12, 4, 8);
    const legMat = new THREE.MeshLambertMaterial({ color: spec.bodyColor });

    // 左腿
    const leftLeg = new THREE.Group();
    leftLeg.name = 'leftLeg';
    leftLeg.position.set(-0.1, 0.14, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, legMat);
    leftLegMesh.position.set(0, -0.06, 0);
    leftLeg.add(leftLegMesh);
    // 左脚（略扁球）
    const leftFoot = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 6),
      new THREE.MeshLambertMaterial({ color: spec.pawColor || spec.bodyColor })
    );
    leftFoot.scale.set(1, 0.6, 1.3);
    leftFoot.position.set(0, -0.18, 0.02);
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
      new THREE.SphereGeometry(0.06, 6, 6),
      new THREE.MeshLambertMaterial({ color: spec.pawColor || spec.bodyColor })
    );
    rightFoot.scale.set(1, 0.6, 1.3);
    rightFoot.position.set(0, -0.18, 0.02);
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
      case 'FOX':          ChibiModelBuilder._buildFoxAccessories(group, spec); break;
      case 'PORK_DOCTOR':  ChibiModelBuilder._buildPorkDoctorAccessories(group, spec); break;
      case 'HURRICANE':    ChibiModelBuilder._buildHurricaneAccessories(group, spec); break;
      case 'FROST':        ChibiModelBuilder._buildFrostAccessories(group, spec); break;
      case 'DRIFTWOOD':    ChibiModelBuilder._buildDriftwoodAccessories(group, spec); break;
      case 'STEEL_BONE':   ChibiModelBuilder._buildSteelBoneAccessories(group, spec); break;
      case 'HIGH_ENERGY':  ChibiModelBuilder._buildHighEnergyAccessories(group, spec); break;
      case 'WAIWAI':       ChibiModelBuilder._buildWaiwaiAccessories(group, spec); break;
    }
  }

  // ----- 狐狸配件 -----
  static _buildFoxAccessories(group, spec) {
    const headRef = group.parent?.children.find(c => c.name === 'head');
    const headY = 0.62;

    // 三角狐耳
    const earGeo = new THREE.ConeGeometry(0.1, 0.18, 4);
    const earMat = new THREE.MeshLambertMaterial({ color: spec.bodyColor });
    const earInnerGeo = new THREE.ConeGeometry(0.06, 0.12, 4);
    const earInnerMat = new THREE.MeshLambertMaterial({ color: spec.earInner });

    [-1, 1].forEach(side => {
      const ear = new THREE.Mesh(earGeo, earMat);
      ear.position.set(side * 0.18, headY + 0.32, -0.02);
      ear.rotation.z = side * -0.3;
      ear.rotation.x = -0.15;
      group.add(ear);

      const inner = new THREE.Mesh(earInnerGeo, earInnerMat);
      inner.position.set(side * 0.18, headY + 0.31, 0.02);
      inner.rotation.z = side * -0.3;
      inner.rotation.x = -0.15;
      group.add(inner);
    });

    // 蓬松大尾巴（多个球体组合 + 锥体）
    const tailGroup = new THREE.Group();
    tailGroup.name = 'foxTail';
    tailGroup.position.set(0, 0.35, -0.25);

    // 尾巴主干 - 逐渐变大的球体
    const tailPositions = [
      { y: 0, r: 0.06, color: spec.bodyColor },
      { y: 0.05, z: -0.03, r: 0.08, color: spec.bodyColor },
      { y: 0.1, z: -0.06, r: 0.1, color: spec.bodyColor },
      { y: 0.15, z: -0.1, r: 0.12, color: spec.bodyColor },
      { y: 0.18, z: -0.12, r: 0.1, color: spec.bellyColor }, // 白色尾尖
    ];
    tailPositions.forEach(t => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(0.01, t.r), 8, 6),
        new THREE.MeshLambertMaterial({ color: t.color })
      );
      m.position.set(0, t.y, t.z || 0);
      tailGroup.add(m);
    });

    // 尾巴尖的小锥
    const tailTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.08, 6),
      new THREE.MeshLambertMaterial({ color: spec.bellyColor })
    );
    tailTip.position.set(0, 0.2, -0.15);
    tailTip.rotation.x = -0.5;
    tailGroup.add(tailTip);

    group.add(tailGroup);

    // 围巾
    const scarfGeo = new THREE.TorusGeometry(0.2, 0.04, 4, 12);
    const scarfMat = new THREE.MeshLambertMaterial({ color: spec.scarfColor });
    const scarf = new THREE.Mesh(scarfGeo, scarfMat);
    scarf.position.set(0, 0.48, 0.04);
    scarf.rotation.x = Math.PI / 2;
    group.add(scarf);

    // 围巾垂下的部分
    const scarfTailGeo = new THREE.CapsuleGeometry(0.03, 0.1, 4, 6);
    const scarfTail = new THREE.Mesh(scarfTailGeo, scarfMat);
    scarfTail.position.set(0.1, 0.38, 0.08);
    scarfTail.rotation.z = 0.3;
    group.add(scarfTail);
  }

  // ----- 猪排博士配件 -----
  static _buildPorkDoctorAccessories(group, spec) {
    const headY = 0.62;

    // 猪鼻（椭球 + 两个圆孔）
    const snoutGeo = new THREE.SphereGeometry(0.08, 8, 6);
    const snoutMat = new THREE.MeshLambertMaterial({ color: 0xFF9999 });
    const snout = new THREE.Mesh(snoutGeo, snoutMat);
    snout.scale.set(1.2, 0.8, 0.7);
    snout.position.set(0, -0.06, 0.27);
    group.add(snout);

    // 鼻孔
    const nostrilGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.03, 6);
    const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x885555 });
    [-1, 1].forEach(side => {
      const n = new THREE.Mesh(nostrilGeo, nostrilMat);
      n.position.set(side * 0.03, -0.06, 0.33);
      n.rotation.x = Math.PI / 2;
      group.add(n);
    });

    // 大圆耳朵
    const pigEarGeo = new THREE.SphereGeometry(0.12, 8, 6);
    const pigEarMat = new THREE.MeshLambertMaterial({ color: spec.bodyColor });
    const pigEarInnerMat = new THREE.MeshLambertMaterial({ color: spec.earInner });

    [-1, 1].forEach(side => {
      const ear = new THREE.Mesh(pigEarGeo, pigEarMat);
      ear.scale.set(0.7, 1, 0.4);
      ear.position.set(side * 0.28, headY + 0.22, -0.05);
      ear.rotation.z = side * 0.2;
      group.add(ear);

      const inner = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 5),
        pigEarInnerMat
      );
      inner.scale.set(0.6, 0.8, 0.3);
      inner.position.set(side * 0.28, headY + 0.22, -0.02);
      inner.rotation.z = side * 0.2;
      group.add(inner);
    });

    // 卷曲小尾巴（螺旋形用多个小环模拟）
    const curlGroup = new THREE.Group();
    curlGroup.position.set(0, 0.4, -0.2);
    for (let i = 0; i < 5; i++) {
      const curl = new THREE.Mesh(
        new THREE.TorusGeometry(0.02 + i * 0.003, 0.008, 4, 8),
        new THREE.MeshLambertMaterial({ color: spec.bodyColor })
      );
      curl.position.set(0, i * 0.015, -i * 0.01);
      curl.rotation.y = i * 0.8;
      curlGroup.add(curl);
    }
    group.add(curlGroup);

    // 金币斗篷
    const cloakGeo = new THREE.SphereGeometry(0.28, 10, 6, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.7);
    const cloakMat = new THREE.MeshLambertMaterial({
      color: spec.cloakColor,
      side: THREE.DoubleSide
    });
    const cloak = new THREE.Mesh(cloakGeo, cloakMat);
    cloak.scale.set(1.1, 0.9, 0.6);
    cloak.position.set(0, 0.32, -0.08);
    cloak.rotation.y = Math.PI;
    group.add(cloak);

    // 金色纽扣
    for (let i = 0; i < 3; i++) {
      const btn = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 6, 6),
        new THREE.MeshBasicMaterial({ color: spec.buttonColor })
      );
      btn.position.set(0, 0.42 - i * 0.07, 0.16);
      group.add(btn);
    }
  }

  // ----- 飓风配件 -----
  static _buildHurricaneAccessories(group, spec) {
    const headY = 0.62;

    // 弯曲黑色犄角（紫色渐变）
    [-1, 1].forEach(side => {
      const hornGroup = new THREE.Group();
      // 用多段锥体模拟弯曲
      const segments = 4;
      for (let i = 0; i < segments; i++) {
        const t = i / (segments - 1);
        const r = 0.025 - t * 0.012;
        const seg = new THREE.Mesh(
          new THREE.ConeGeometry(Math.max(0.005, r), 0.1, 6),
          new THREE.MeshLambertMaterial({
            color: t < 0.5 ? spec.hornColor : spec.robeColor
          })
        );
        seg.position.set(
          side * (0.15 + t * 0.08),
          headY + 0.22 + t * 0.18,
          -0.05 + t * 0.05
        );
        seg.rotation.z = side * (-0.3 - t * 0.6);
        seg.rotation.x = -t * 0.3;
        hornGroup.add(seg);
      }
      group.add(hornGroup);
    });

    // 紫色翅膀（平面几何 + 半透明材质）
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.quadraticCurveTo(0.15, 0.25, 0.05, 0.4);
    wingShape.quadraticCurveTo(-0.02, 0.3, 0, 0);
    const wingGeo = new THREE.ShapeGeometry(wingShape);
    const wingMat = new THREE.MeshBasicMaterial({
      color: spec.wingColor,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });

    [-1, 1].forEach(side => {
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.position.set(side * 0.3, 0.45, -0.12);
      wing.rotation.y = side * 0.4;
      wing.scale.set(side * 1.2, 1, 1);
      group.add(wing);
    });

    // 龙尾巴
    const dragonTailGroup = new THREE.Group();
    dragonTailGroup.position.set(0, 0.28, -0.2);
    const tailSegs = 6;
    for (let i = 0; i < tailSegs; i++) {
      const t = i / (tailSegs - 1);
      const r = 0.04 - t * 0.02;
      const seg = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(0.008, r), 6, 5),
        new THREE.MeshLambertMaterial({ color: spec.robeColor })
      );
      seg.position.set(0, t * 0.1, -t * 0.12);
      seg.scale.set(1, 0.8, 1.2);
      dragonTailGroup.add(seg);
    }
    // 龙尾尖
    const tailEnd = new THREE.Mesh(
      new THREE.ConeGeometry(0.02, 0.06, 4),
      new THREE.MeshLambertMaterial({ color: spec.wingColor })
    );
    tailEnd.position.set(0, 0.1, -0.72);
    tailEnd.rotation.x = 0.8;
    dragonTailGroup.add(tailEnd);
    group.add(dragonTailGroup);

    // 樱花发饰（头顶小花）
    const flowerGroup = new THREE.Group();
    flowerGroup.position.set(0.15, headY + 0.25, 0.1);
    const petalGeo = new THREE.SphereGeometry(0.02, 6, 4);
    const petalMat = new THREE.MeshBasicMaterial({ color: 0xFFB7C5 });
    for (let i = 0; i < 5; i++) {
      const petal = new THREE.Mesh(petalGeo, petalMat);
      const a = (Math.PI * 2 / 5) * i;
      petal.position.set(Math.cos(a) * 0.02, Math.sin(a) * 0.02, 0);
      flowerGroup.add(petal);
    }
    const flowerCenter = new THREE.Mesh(
      new THREE.SphereGeometry(0.01, 4, 4),
      new THREE.MeshBasicMaterial({ color: 0xFFDD00 })
    );
    flowerGroup.add(flowerCenter);
    group.add(flowerGroup);

    // 白/银头发（头顶蓬松）
    const hairMat = new THREE.MeshLambertMaterial({ color: spec.hairColor });
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 + Math.random() * 0.03, 6, 5),
        hairMat
      );
      hair.position.set(
        Math.cos(angle) * 0.15,
        headY + 0.25 + Math.random() * 0.05,
        Math.sin(angle) * 0.12
      );
      hair.scale.set(1, 0.7, 0.8);
      group.add(hair);
    }
  }

  // ----- 冰霜配件 -----
  static _buildFrostAccessories(group, spec) {
    const headY = 0.62;

    // 圆熊耳朵
    const bearEarGeo = new THREE.SphereGeometry(0.1, 8, 6);
    const bearEarMat = new THREE.MeshLambertMaterial({ color: spec.bodyColor });
    const bearEarInnerMat = new THREE.MeshLambertMaterial({ color: spec.earInner });

    [-1, 1].forEach(side => {
      const ear = new THREE.Mesh(bearEarGeo, bearEarMat);
      ear.position.set(side * 0.22, headY + 0.24, -0.02);
      ear.scale.set(1, 1, 0.6);
      group.add(ear);

      const inner = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 5),
        bearEarInnerMat
      );
      inner.position.set(side * 0.22, headY + 0.24, 0.01);
      inner.scale.set(1, 1, 0.5);
      group.add(inner);
    });

    // 薄荷绿蝴蝶结
    const bowGroup = new THREE.Group();
    bowGroup.position.set(-0.18, headY + 0.15, 0.15);

    const bowLoopGeo = new THREE.SphereGeometry(0.05, 6, 5);
    const bowMat = new THREE.MeshLambertMaterial({ color: spec.bowColor });

    const leftLoop = new THREE.Mesh(bowLoopGeo, bowMat);
    leftLoop.scale.set(1.2, 0.7, 0.5);
    leftLoop.position.set(-0.04, 0, 0);
    bowGroup.add(leftLoop);

    const rightLoop = new THREE.Mesh(bowLoopGeo, bowMat.clone());
    rightLoop.scale.set(1.2, 0.7, 0.5);
    rightLoop.position.set(0.04, 0, 0);
    bowGroup.add(rightLoop);

    const bowCenter = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 4, 4),
      new THREE.MeshLambertMaterial({ color: 0x66BB6A })
    );
    bowGroup.add(bowCenter);
    group.add(bowGroup);

    // 头发（白/薄荷绿，尖端渐变）
    const hairBaseMat = new THREE.MeshLambertMaterial({ color: spec.hairColor });
    const hairTipMat = new THREE.MeshLambertMaterial({ color: spec.hairTipColor });

    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 / 10) * i;
      const isTip = i % 3 === 0;
      const hair = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.03, 0.08 + Math.random() * 0.04, 4, 6),
        isTip ? hairTipMat : hairBaseMat
      );
      const r = 0.2 + Math.random() * 0.05;
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

    // 小伴侣（头顶小动物 - 圆润小熊形态）
    const companionGroup = new THREE.Group();
    companionGroup.name = 'companion';
    companionGroup.position.set(0.12, headY + 0.35, 0.05);

    const compBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0xFFFFF0 })
    );
    companionGroup.add(compBody);

    // 小耳朵
    [-1, 1].forEach(side => {
      const cEar = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 4, 4),
        new THREE.MeshLambertMaterial({ color: 0xFFFFF0 })
      );
      cEar.position.set(side * 0.04, 0.05, 0);
      companionGroup.add(cEar);
    });

    // 小眼睛
    [-1, 1].forEach(side => {
      const cEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.01, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0x333333 })
      );
      cEye.position.set(side * 0.025, 0.01, 0.05);
      companionGroup.add(cEye);
    });

    group.add(companionGroup);
  }

  // ----- 浮木配件 -----
  static _buildDriftwoodAccessories(group, spec) {
    const headY = 0.62;

    // 熊耳帽（米色）
    const hoodBase = new THREE.Mesh(
      new THREE.SphereGeometry(0.33, 10, 8),
      new THREE.MeshLambertMaterial({ color: spec.hoodColor })
    );
    hoodBase.scale.set(1.05, 0.85, 0.95);
    hoodBase.position.set(0, headY + 0.05, -0.02);
    group.add(hoodBase);

    // 帽子边沿（蕾丝效果 - 用扁平环模拟）
    const brimGeo = new THREE.TorusGeometry(0.32, 0.02, 4, 16);
    const brimMat = new THREE.MeshLambertMaterial({ color: 0xFFF5EE });
    const brim = new THREE.Mesh(brimGeo, brimMat);
    brim.position.set(0, headY - 0.12, 0.04);
    brim.rotation.x = Math.PI / 2;
    group.add(brim);

    // 熊耳帽耳朵
    [-1, 1].forEach(side => {
      const bearEar = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 6),
        new THREE.MeshLambertMaterial({ color: spec.hoodColor })
      );
      bearEar.position.set(side * 0.22, headY + 0.25, -0.08);
      bearEar.scale.set(0.9, 1.1, 0.5);
      group.add(bearEar);

      const inner = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 5),
        new THREE.MeshLambertMaterial({ color: spec.earInner })
      );
      inner.position.set(side * 0.22, headY + 0.25, -0.05);
      inner.scale.set(0.8, 1, 0.4);
      group.add(inner);
    });

    // 猫耳朵（在帽子下露出）
    [-1, 1].forEach(side => {
      const catEar = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.1, 4),
        new THREE.MeshLambertMaterial({ color: 0xFFF8DC })
      );
      catEar.position.set(side * 0.14, headY + 0.26, 0.08);
      catEar.rotation.z = side * -0.2;
      catEar.rotation.x = -0.1;
      group.add(catEar);
    });

    // 粉色围裙
    const apronGeo = new THREE.SphereGeometry(0.18, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const apronMat = new THREE.MeshLambertMaterial({
      color: spec.apronColor,
      side: THREE.DoubleSide
    });
    const apron = new THREE.Mesh(apronGeo, apronMat);
    apron.scale.set(0.9, 1, 0.5);
    apron.position.set(0, 0.3, 0.1);
    group.add(apron);

    // 围裙带子
    const strapGeo = new THREE.CapsuleGeometry(0.015, 0.12, 4, 4);
    const strapMat = new THREE.MeshLambertMaterial({ color: spec.apronColor });
    [-1, 1].forEach(side => {
      const strap = new THREE.Mesh(strapGeo, strapMat);
      strap.position.set(side * 0.12, 0.42, 0.12);
      strap.rotation.z = side * 0.4;
      group.add(strap);
    });

    // 白蝴蝶结领
    const bowTieGroup = new THREE.Group();
    bowTieGroup.position.set(0, 0.46, 0.16);
    const btMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const btLoop = new THREE.SphereGeometry(0.03, 6, 4);
    [-1, 1].forEach(side => {
      const loop = new THREE.Mesh(btLoop, btMat);
      loop.scale.set(1.3, 0.7, 0.4);
      loop.position.set(side * 0.03, 0, 0);
      bowTieGroup.add(loop);
    });
    const btCenter = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 4, 4),
      new THREE.MeshLambertMaterial({ color: 0xDDDDDD })
    );
    bowTieGroup.add(btCenter);
    group.add(bowTieGroup);
  }

  // ----- 钢骨配件 -----
  static _buildSteelBoneAccessories(group, spec) {
    const headY = 0.62;

    // 蓬松刺猬状白发（多个小锥体 + 球体）
    const hairMat = new THREE.MeshLambertMaterial({ color: spec.hairColor });
    const hairDarkMat = new THREE.MeshLambertMaterial({ color: 0xDDDDE5 });

    // 底层蓬松球体
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      const r = 0.18 + Math.random() * 0.08;
      const fluff = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 + Math.random() * 0.03, 6, 5),
        hairMat
      );
      fluff.position.set(
        Math.cos(angle) * r * 0.5,
        headY + 0.18 + Math.random() * 0.12,
        Math.sin(angle) * r * 0.4
      );
      group.add(fluff);
    }

    // 刺状发尖（小锥体）
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 / 16) * i + Math.random() * 0.3;
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.02 + Math.random() * 0.015, 0.08 + Math.random() * 0.06, 4),
        i % 3 === 0 ? hairDarkMat : hairMat
      );
      const r = 0.2 + Math.random() * 0.1;
      spike.position.set(
        Math.cos(angle) * r * 0.5,
        headY + 0.25 + Math.random() * 0.1,
        Math.sin(angle) * r * 0.4
      );
      spike.rotation.set(
        (Math.random() - 0.5) * 0.6,
        angle,
        (Math.random() - 0.5) * 0.6 - 0.3
      );
      group.add(spike);
    }

    // 蓝色飘带
    const ribbonMat = new THREE.MeshLambertMaterial({
      color: spec.ribbonColor,
      side: THREE.DoubleSide
    });
    // 飘带形状
    const ribbonShape = new THREE.Shape();
    ribbonShape.moveTo(0, 0);
    ribbonShape.quadraticCurveTo(0.1, 0.15, 0.02, 0.35);
    ribbonShape.lineTo(-0.02, 0.33);
    ribbonShape.quadraticCurveTo(-0.08, 0.12, 0, 0);
    const ribbonGeo = new THREE.ShapeGeometry(ribbonShape);

    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.position.set(-0.25, 0.35, 0.1);
    ribbon.rotation.y = 0.3;
    ribbon.name = 'ribbon';
    group.add(ribbon);

    // 黑色腰带
    const beltGeo = new THREE.TorusGeometry(0.2, 0.02, 4, 12);
    const beltMat = new THREE.MeshLambertMaterial({ color: spec.beltColor });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(0, 0.22, 0);
    belt.rotation.x = Math.PI / 2;
    group.add(belt);

    // 蓝色和服外衣肩部装饰
    [-1, 1].forEach(side => {
      const shoulder = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 5),
        new THREE.MeshLambertMaterial({ color: spec.ribbonColor })
      );
      shoulder.position.set(side * 0.28, 0.44, 0);
      shoulder.scale.set(1, 0.6, 0.8);
      group.add(shoulder);
    });
  }

  // ----- 高能人配件 -----
  static _buildHighEnergyAccessories(group, spec) {
    const headY = 0.62;

    // 精灵尖耳朵
    const elfEarMat = new THREE.MeshLambertMaterial({ color: spec.skinColor });
    [-1, 1].forEach(side => {
      const earShape = new THREE.Shape();
      earShape.moveTo(0, 0);
      earShape.lineTo(0.08 * side, 0.15);
      earShape.lineTo(0.03 * side, 0.05);
      earShape.closePath();
      const earGeo = new THREE.ShapeGeometry(earShape);
      const ear = new THREE.Mesh(earGeo, elfEarMat);
      ear.position.set(side * 0.28, headY + 0.05, 0.02);
      ear.rotation.y = side * 0.3;
      group.add(ear);
    });

    // 大蝴蝶结（粉蓝）
    const bigBowGroup = new THREE.Group();
    bigBowGroup.position.set(-0.2, headY + 0.1, 0.12);
    const bigBowMat = new THREE.MeshLambertMaterial({ color: spec.bowColor });
    const bigBowLoop = new THREE.SphereGeometry(0.07, 8, 6);
    [-1, 1].forEach(side => {
      const loop = new THREE.Mesh(bigBowLoop, bigBowMat);
      loop.scale.set(1.3, 0.6, 0.4);
      loop.position.set(side * 0.06, 0, 0);
      bigBowGroup.add(loop);
    });
    const bigBowCenter = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 4, 4),
      new THREE.MeshLambertMaterial({ color: 0xAADDFF })
    );
    bigBowGroup.add(bigBowCenter);
    // 蝴蝶结飘带
    const bowTail = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.02, 0.08, 4, 4),
      bigBowMat
    );
    bowTail.position.set(0, -0.07, 0);
    bowTail.rotation.z = 0.2;
    bigBowGroup.add(bowTail);
    group.add(bigBowGroup);

    // 蝴蝶发饰（金色）
    const butterflyGroup = new THREE.Group();
    butterflyGroup.position.set(0.18, headY + 0.2, 0.1);
    const bflyMat = new THREE.MeshBasicMaterial({
      color: spec.butterflyColor,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    // 翅膀用椭球模拟
    const bflyWingGeo = new THREE.SphereGeometry(0.03, 6, 4);
    [-1, 1].forEach(side => {
      [-1, 1].forEach(v => {
        const wing = new THREE.Mesh(bflyWingGeo, bflyMat);
        wing.scale.set(1, v * 1.3, 0.3);
        wing.position.set(side * 0.025, v * 0.02, 0);
        butterflyGroup.add(wing);
      });
    });
    const bflyBody = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.005, 0.03, 3, 4),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    butterflyGroup.add(bflyBody);
    butterflyGroup.name = 'butterfly';
    group.add(butterflyGroup);

    // 长发（白/薄荷绿渐变）
    const longHairMat = new THREE.MeshLambertMaterial({ color: spec.hairColor });
    const longHairTipMat = new THREE.MeshLambertMaterial({ color: spec.hairTipColor });
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 / 14) * i;
      const isTip = i % 4 === 0;
      const strand = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.025, 0.12 + Math.random() * 0.06, 4, 6),
        isTip ? longHairTipMat : longHairMat
      );
      const r = 0.22;
      strand.position.set(
        Math.cos(angle) * r * 0.6,
        headY + 0.1 - (angle > Math.PI ? 0.05 : 0),
        Math.sin(angle) * r * 0.5
      );
      strand.rotation.set(
        (Math.random() - 0.5) * 0.3,
        angle,
        (Math.random() - 0.5) * 0.3
      );
      // 后面的头发更长
      if (Math.sin(angle) < -0.3) {
        strand.scale.y = 1.5;
        strand.position.y -= 0.08;
      }
      group.add(strand);
    }

    // 叶子装饰
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.quadraticCurveTo(0.03, 0.04, 0, 0.08);
    leafShape.quadraticCurveTo(-0.03, 0.04, 0, 0);
    const leafGeo = new THREE.ShapeGeometry(leafShape);
    const leafMat = new THREE.MeshBasicMaterial({
      color: 0x88CC88,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 3; i++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(
        0.15 + i * 0.04,
        headY - 0.05 + i * 0.03,
        0.2 + i * 0.02
      );
      leaf.rotation.z = 0.3 + i * 0.2;
      leaf.rotation.y = 0.2;
      group.add(leaf);
    }
  }

  // ----- 歪歪配件 -----
  static _buildWaiwaiAccessories(group, spec) {
    const headY = 0.62;

    // 超蓬松爆炸头（大量球体组合）
    const afroMat = new THREE.MeshLambertMaterial({ color: spec.hairColor });
    const afroDarkMat = new THREE.MeshLambertMaterial({ color: 0xE6C200 });

    // 基础蓬松层
    for (let i = 0; i < 20; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / 20);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 0.32 + Math.random() * 0.08;
      const fluff = new THREE.Mesh(
        new THREE.SphereGeometry(
          0.06 + Math.random() * 0.04,
          6, 5
        ),
        Math.random() > 0.3 ? afroMat : afroDarkMat
      );
      fluff.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        headY + r * Math.cos(phi) * 0.8,
        r * Math.sin(phi) * Math.sin(theta)
      );
      group.add(fluff);
    }

    // 凌乱发丝（细长胶囊体）
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 / 10) * i + Math.random() * 0.5;
      const strand = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.015, 0.06 + Math.random() * 0.05, 3, 4),
        Math.random() > 0.5 ? afroMat : afroDarkMat
      );
      const r = 0.3 + Math.random() * 0.1;
      strand.position.set(
        Math.cos(angle) * r * 0.5,
        headY + 0.15 + Math.random() * 0.15,
        Math.sin(angle) * r * 0.5
      );
      strand.rotation.set(
        (Math.random() - 0.5) * 1.0,
        angle,
        (Math.random() - 0.5) * 1.0
      );
      group.add(strand);
    }

    // 自然凌乱感：几缕垂下的头发
    for (let i = 0; i < 4; i++) {
      const droop = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.018, 0.1, 3, 4),
        afroMat
      );
      droop.position.set(
        -0.15 + i * 0.1,
        headY - 0.08 - Math.random() * 0.08,
        0.18 + Math.random() * 0.05
      );
      droop.rotation.z = (Math.random() - 0.5) * 0.4;
      droop.rotation.x = -0.3 - Math.random() * 0.2;
      group.add(droop);
    }
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

    // 攻击/受伤/死亡计时器
    this.attackTimer = 0;
    this.hurtTimer = 0;
    this.deadTimer = 0;
    this.skillTimer = 0;

    // 初始姿态缓存
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

    // 状态切换
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
    const smoothBlend = blend * blend * (3 - 2 * blend); // smoothstep

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

    // 根据状态应用动画
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
      p.head.rotation.z += Math.sin(t * 0.8) * 0.05;
      p.head.rotation.y += Math.sin(t * 0.5) * 0.08;
    }
  }

  // --- 待机动画 ---
  _animIdle(t) {
    const p = this.parts;
    // 身体微浮动
    const floatY = Math.sin(t * 2.0) * 0.015;
    p.body.position.y = floatY;
    p.head.position.y = this.restPose.headY + floatY;

    // 手臂自然下垂微摆
    p.leftArm.rotation.x = Math.sin(t * 1.2) * 0.05;
    p.leftArm.rotation.z = 0.08;
    p.rightArm.rotation.x = Math.sin(t * 1.2 + 1) * 0.05;
    p.rightArm.rotation.z = -0.08;

    // 腿部静止
    p.leftLeg.rotation.x = 0;
    p.rightLeg.rotation.x = 0;

    // 角色特定待机
    this._roleIdleTick(t);
  }

  // --- 行走动画 ---
  _animWalk(t) {
    const p = this.parts;
    const speed = 8;
    const swing = 0.5;

    // 身体上下弹跳
    const bounce = Math.abs(Math.sin(t * speed)) * 0.025;
    p.body.position.y = bounce;
    p.head.position.y = this.restPose.headY + bounce;

    // 身体微前倾
    p.body.rotation.x = 0.08;

    // 四肢前后摆动（对角线同步）
    p.leftArm.rotation.x = Math.sin(t * speed) * swing;
    p.leftArm.rotation.z = 0.12;
    p.rightArm.rotation.x = -Math.sin(t * speed) * swing;
    p.rightArm.rotation.z = -0.12;

    p.leftLeg.rotation.x = -Math.sin(t * speed) * swing * 0.8;
    p.rightLeg.rotation.x = Math.sin(t * speed) * swing * 0.8;

    // 头部微前倾
    p.head.rotation.x = 0.05;
  }

  // --- 攻击动画 ---
  _animAttack(dt, t) {
    const p = this.parts;
    this.attackTimer += dt;
    const at = this.attackTimer;
    const duration = 0.35;

    if (at < duration) {
      const phase = at / duration;
      // 右臂前挥（快速前挥，缓慢回位）
      let armAngle;
      if (phase < 0.3) {
        // 蓄力后拉
        armAngle = -0.5 * (phase / 0.3);
      } else if (phase < 0.6) {
        // 前挥
        const swing = (phase - 0.3) / 0.3;
        armAngle = -0.5 + 2.5 * swing;
      } else {
        // 回位
        const recover = (phase - 0.6) / 0.4;
        armAngle = 2.0 * (1 - recover);
      }
      p.rightArm.rotation.x = armAngle;
      p.rightArm.rotation.z = -0.3;

      // 身体微前倾配合攻击
      p.body.rotation.x = 0.15 * Math.sin(phase * Math.PI);

      // 左臂微后
      p.leftArm.rotation.x = -0.2 * Math.sin(phase * Math.PI);
      p.leftArm.rotation.z = 0.15;

      // 头部跟随攻击方向
      p.head.rotation.x = 0.1 * Math.sin(phase * Math.PI);
    } else {
      // 攻击结束，回到待机
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
        // 蹲下蓄力
        if (st < 0.3) {
          const phase = st / 0.3;
          p.body.position.y = -0.1 * phase;
          p.head.position.y = this.restPose.headY - 0.1 * phase;
          p.body.rotation.x = 0.2 * phase;
          p.leftLeg.rotation.x = 0.4 * phase;
          p.rightLeg.rotation.x = 0.4 * phase;
        } else if (st < 0.6) {
          // 起跳
          const phase = (st - 0.3) / 0.3;
          p.body.position.y = 0.15 * Math.sin(phase * Math.PI);
          p.head.position.y = this.restPose.headY + 0.15 * Math.sin(phase * Math.PI);
          p.body.rotation.x = 0.2 * (1 - phase);
        } else {
          this._animIdle(t);
        }
        break;

      case 'PORK_DOCTOR':
        // 膨胀效果
        if (st < 0.5) {
          const phase = st / 0.5;
          const scale = 1 + 0.2 * Math.sin(phase * Math.PI);
          p.body.scale.set(scale, scale * 0.95, scale);
          p.head.position.y = this.restPose.headY + 0.05 * Math.sin(phase * Math.PI);
          // 双手张开
          p.leftArm.rotation.z = 0.5 * phase;
          p.rightArm.rotation.z = -0.5 * phase;
          p.leftArm.rotation.x = -0.3 * phase;
          p.rightArm.rotation.x = -0.3 * phase;
        } else {
          p.body.scale.set(1, 1, 1);
          this._animIdle(t);
        }
        break;

      case 'HURRICANE':
        // 旋转冲刺
        if (st < 0.4) {
          const phase = st / 0.4;
          p.body.rotation.y = phase * Math.PI * 4;
          p.head.position.y = this.restPose.headY + 0.05 * Math.sin(phase * Math.PI * 2);
          // 手臂张开如飞行
          p.leftArm.rotation.z = 0.8;
          p.rightArm.rotation.z = -0.8;
          p.leftArm.rotation.x = -0.3;
          p.rightArm.rotation.x = -0.3;
        } else {
          p.body.rotation.y = 0;
          this._animIdle(t);
        }
        break;

      case 'FROST':
        // 双手前推释放冰霜
        if (st < 0.5) {
          const phase = st / 0.5;
          p.leftArm.rotation.x = -1.2 * phase;
          p.rightArm.rotation.x = -1.2 * phase;
          p.leftArm.rotation.z = 0.2;
          p.rightArm.rotation.z = -0.2;
          p.body.position.y = -0.02 * phase;
          p.head.rotation.x = 0.1 * phase;
        } else {
          this._animIdle(t);
        }
        break;

      case 'DRIFTWOOD':
        // 举手指天（天罚导弹）
        if (st < 0.6) {
          const phase = st / 0.6;
          p.rightArm.rotation.x = -2.5 * phase;
          p.rightArm.rotation.z = -0.2;
          p.leftArm.rotation.x = -0.5 * phase;
          p.body.rotation.x = -0.1 * phase;
          p.head.rotation.x = -0.15 * phase;
        } else {
          this._animIdle(t);
        }
        break;

      case 'STEEL_BONE':
        // 双手拍地（玻璃桥）
        if (st < 0.4) {
          const phase = st / 0.4;
          // 蹲下
          p.body.position.y = -0.08 * Math.sin(phase * Math.PI);
          p.head.position.y = this.restPose.headY - 0.08 * Math.sin(phase * Math.PI);
          // 双手下拍
          const armPhase = phase < 0.5 ? phase * 2 : 2 - phase * 2;
          p.leftArm.rotation.x = 1.5 * armPhase;
          p.rightArm.rotation.x = 1.5 * armPhase;
          p.leftArm.rotation.z = 0.3 * armPhase;
          p.rightArm.rotation.z = -0.3 * armPhase;
        } else {
          this._animIdle(t);
        }
        break;

      case 'HIGH_ENERGY':
        // 喷气悬浮
        if (st < 1.0) {
          const phase = st;
          // 上下浮动
          p.body.position.y = 0.08 + Math.sin(phase * 4) * 0.03;
          p.head.position.y = this.restPose.headY + 0.08 + Math.sin(phase * 4) * 0.03;
          // 手臂微微张开保持平衡
          p.leftArm.rotation.z = 0.4 + Math.sin(phase * 3) * 0.1;
          p.rightArm.rotation.z = -0.4 - Math.sin(phase * 3 + 1) * 0.1;
          p.leftArm.rotation.x = -0.2;
          p.rightArm.rotation.x = -0.2;
          // 腿自然下垂
          p.leftLeg.rotation.x = 0.15;
          p.rightLeg.rotation.x = -0.1;
        } else {
          this._animIdle(t);
        }
        break;

      case 'WAIWAI':
        // 挥手撒骨头
        if (st < 0.5) {
          const phase = st / 0.5;
          // 双手快速左右挥动
          p.leftArm.rotation.z = 0.6 * Math.sin(phase * Math.PI * 4);
          p.rightArm.rotation.z = -0.6 * Math.sin(phase * Math.PI * 4 + 0.5);
          p.leftArm.rotation.x = -0.5;
          p.rightArm.rotation.x = -0.5;
          p.body.rotation.z = Math.sin(phase * Math.PI * 2) * 0.08;
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
      // 身体后仰
      p.body.rotation.x = -0.3 * Math.sin(phase * Math.PI);
      p.head.rotation.x = -0.2 * Math.sin(phase * Math.PI);
      // 缩一下
      const shrink = 1 - 0.05 * Math.sin(phase * Math.PI);
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

    // 身体倾斜倒下
    const fallProgress = Math.min(1, dt2 / 0.8);
    const eased = 1 - Math.pow(1 - fallProgress, 3); // ease-out cubic

    p.body.rotation.z = eased * 1.4; // 向侧面倒
    p.body.rotation.x = eased * 0.2;
    p.head.rotation.z = eased * 0.5;

    // 倒下时身体降低
    p.body.position.y = -eased * 0.15;
    p.head.position.y = this.restPose.headY - eased * 0.15;

    // 四肢瘫软
    p.leftArm.rotation.z = 0.3 + eased * 0.5;
    p.rightArm.rotation.z = -0.3 - eased * 0.5;
    p.leftLeg.rotation.x = eased * 0.3;
    p.rightLeg.rotation.x = -eased * 0.2;

    // 整体下沉
    if (dt2 > 1.5) {
      const sink = Math.min(0.3, (dt2 - 1.5) * 0.1);
      p.modelGroup.position.y = -sink;
    }
  }

  // --- 角色特定待机小动作 ---
  _roleIdleTick(t) {
    const p = this.parts;
    const acc = p.accessories;

    switch (this.roleKey) {
      case 'FOX': {
        // 尾巴轻摆
        const tail = acc.getObjectByName('foxTail');
        if (tail) {
          tail.rotation.y = Math.sin(t * 2.5) * 0.3;
          tail.rotation.x = Math.sin(t * 1.8) * 0.1;
        }
        break;
      }
      case 'HURRICANE': {
        // 翅膀微振
        acc.children.forEach(child => {
          if (child.material && child.material.opacity < 1) {
            child.rotation.z = Math.sin(t * 3 + child.position.x * 5) * 0.15;
          }
        });
        break;
      }
      case 'HIGH_ENERGY': {
        // 蝴蝶发饰上下飞舞
        const bfly = acc.getObjectByName('butterfly');
        if (bfly) {
          bfly.position.y += Math.sin(t * 3) * 0.001;
          bfly.rotation.y = Math.sin(t * 2) * 0.3;
        }
        // 飘带微动
        break;
      }
      case 'FROST': {
        // 小伴侣弹跳
        const comp = acc.getObjectByName('companion');
        if (comp) {
          comp.position.y = 0.35 + Math.sin(t * 3) * 0.015;
          comp.rotation.z = Math.sin(t * 2) * 0.1;
        }
        break;
      }
      case 'STEEL_BONE': {
        // 飘带飘动
        const ribbon = acc.getObjectByName('ribbon');
        if (ribbon) {
          ribbon.rotation.y = 0.3 + Math.sin(t * 2) * 0.15;
          ribbon.position.x = -0.25 + Math.sin(t * 1.5) * 0.01;
        }
        break;
      }
      case 'PORK_DOCTOR': {
        // 微微左右晃动（胖乎乎的感觉）
        p.body.rotation.z = Math.sin(t * 1.5) * 0.03;
        break;
      }
      case 'WAIWAI': {
        // 歪头（符合"歪歪"名字）
        p.head.rotation.z = Math.sin(t * 0.8) * 0.12;
        p.head.rotation.x = Math.sin(t * 0.6) * 0.05;
        break;
      }
      case 'DRIFTWOOD': {
        // 安静微摆
        p.body.rotation.z = Math.sin(t * 1.2) * 0.02;
        break;
      }
    }
  }
}