// campus-map.js
// 校园寻宝 - 文字地图生成器
// 使用 Three.js 全局变量，所有建筑由文字体素构成

class CampusMapGenerator {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
    this.animatedGroups = [];
  }

  generate() {
    this._createGround();
    this._createMainBuilding();
    this._createLibrary();
    this._createGym();
    this._createLab();
    this._createArtBuilding();
    this._createDormitory();
    this._createCafeteria();
    this._createCentralPlaza();
    this._createWalls();
    this._createTrees();
    this._createLampPosts();
    this._createPaths();
    this._createExtractionPoints();
    this._createDecorativeLabels();
  }

  // ---- 工具方法 ----

  _createCanvas(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  _fillBackground(ctx, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
  }

  _tileChars(ctx, w, h, char, color, fontSize, stepX, stepY) {
    ctx.fillStyle = color;
    ctx.font = fontSize + 'px monospace';
    for (var y = 0; y < h; y += stepY) {
      for (var x = 0; x < w; x += stepX) {
        ctx.fillText(char, x, y);
      }
    }
  }

  _hexColor(num) {
    return '#' + num.toString(16).padStart(6, '0');
  }

  _addMesh(mesh) {
    this.scene.add(mesh);
    this.meshes.push(mesh);
    return mesh;
  }

  // ---- 地面 ----

  _createGround() {
    var canvas = this._createCanvas(512, 512);
    var ctx = canvas.getContext('2d');
    this._fillBackground(ctx, 512, 512, '#1a1a2e');
    this._tileChars(ctx, 512, 512, '·', '#2a2a4e', 8, 10, 10);

    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(20, 20);

    var geo = new THREE.PlaneGeometry(800, 800);
    var mat = new THREE.MeshLambertMaterial({ map: tex });
    var ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    this._addMesh(ground);
  }

  // ---- 文字墙体 ----

  _createTextWall(x, z, w, h, char, color, charColor) {
    var canvas = this._createCanvas(
      Math.max(64, Math.abs(w) * 16),
      Math.max(64, h * 16)
    );
    var ctx = canvas.getContext('2d');
    this._fillBackground(ctx, canvas.width, canvas.height, this._hexColor(color));
    this._tileChars(
      ctx, canvas.width, canvas.height,
      char || '\u2588',
      this._hexColor(charColor || 0x555577),
      12, 16, 16
    );

    var tex = new THREE.CanvasTexture(canvas);
    var geo = new THREE.BoxGeometry(Math.abs(w), h, 0.3);
    var mat = new THREE.MeshLambertMaterial({ map: tex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    this._addMesh(mesh);
    return mesh;
  }

  // ---- 添加墙体到组 ----

  _addWallToGroup(group, x, z, w, h, rotation, char, actualLength) {
    var len = actualLength || w;
    var cw = Math.max(64, len * 8);
    var ch = Math.max(64, h * 8);
    var canvas = this._createCanvas(cw, ch);
    var ctx = canvas.getContext('2d');

    this._fillBackground(ctx, cw, ch, '#2a2a4e');
    this._tileChars(ctx, cw, ch, char || '\u2588', '#4a4a6e', 10, 12, 12);

    // 窗户图案
    if (h > 4) {
      for (var wy = 20; wy < ch - 20; wy += 40) {
        for (var wx = 10; wx < cw - 10; wx += 30) {
          ctx.fillStyle = '#1a1a3e';
          ctx.fillRect(wx, wy, 16, 16);
          ctx.strokeStyle = '#3a5a8e';
          ctx.strokeRect(wx, wy, 16, 16);
        }
      }
    }

    var tex = new THREE.CanvasTexture(canvas);
    var geo = new THREE.BoxGeometry(w, h, len);
    var mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    mesh.rotation.y = rotation || 0;
    group.add(mesh);
  }

  // ---- 建筑物 ----

  _createBuilding(x, z, w, d, floors, wallChar, name, nameColor) {
    var group = new THREE.Group();
    var floorH = 4;
    var totalH = floors * floorH;

    // 楼层隔板
    for (var f = 0; f <= floors; f++) {
      var slabCanvas = this._createCanvas(128, 128);
      var sctx = slabCanvas.getContext('2d');
      this._fillBackground(sctx, 128, 128, '#2a2a3e');
      this._tileChars(sctx, 128, 128, '\u2593', '#3a3a5e', 6, 8, 8);

      var slabTex = new THREE.CanvasTexture(slabCanvas);
      var slabGeo = new THREE.BoxGeometry(w + 0.5, 0.3, d + 0.5);
      var slabMat = new THREE.MeshLambertMaterial({ map: slabTex });
      var slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(x, f * floorH, z);
      group.add(slab);
    }

    // 四面墙壁
    var wallH = totalH;
    this._addWallToGroup(group, x, z - d / 2, w, wallH, 0, wallChar);
    this._addWallToGroup(group, x, z + d / 2, w, wallH, 0, wallChar);
    this._addWallToGroup(group, x - w / 2, z, 0.3, wallH, Math.PI / 2, wallChar, d);
    this._addWallToGroup(group, x + w / 2, z, 0.3, wallH, Math.PI / 2, wallChar, d);

    // 屋顶装饰线条
    var roofCanvas = this._createCanvas(128, 32);
    var rctx = roofCanvas.getContext('2d');
    this._fillBackground(rctx, 128, 32, '#3a3a6e');
    rctx.fillStyle = '#6a6aae';
    rctx.font = '10px monospace';
    for (var rx = 0; rx < 128; rx += 12) {
      rctx.fillText('\u2584', rx, 20);
    }
    var roofTex = new THREE.CanvasTexture(roofCanvas);
    var roofGeo = new THREE.PlaneGeometry(w + 1, 1);
    var roofMat = new THREE.MeshLambertMaterial({ map: roofTex, transparent: true });
    var roofLine = new THREE.Mesh(roofGeo, roofMat);
    roofLine.rotation.x = -Math.PI / 2;
    roofLine.position.set(x, totalH + 0.2, z);
    group.add(roofLine);

    // 名称标牌
    if (name) {
      var signCanvas = this._createCanvas(256, 64);
      var nctx = signCanvas.getContext('2d');
      nctx.fillStyle = '#0a0a1a';
      nctx.fillRect(0, 0, 256, 64);
      nctx.strokeStyle = this._hexColor(nameColor || 0x6366f1);
      nctx.lineWidth = 2;
      nctx.strokeRect(2, 2, 252, 60);
      nctx.fillStyle = this._hexColor(nameColor || 0x6366f1);
      nctx.font = 'bold 32px sans-serif';
      nctx.textAlign = 'center';
      nctx.textBaseline = 'middle';
      nctx.fillText(name, 128, 32);

      var signTex = new THREE.CanvasTexture(signCanvas);
      var signMat = new THREE.SpriteMaterial({ map: signTex, transparent: true });
      var sign = new THREE.Sprite(signMat);
      sign.position.set(x, wallH + 1.5, z);
      sign.scale.set(w * 0.8, w * 0.2, 1);
      group.add(sign);
    }

    this._addMesh(group);
    return group;
  }

  // ---- 主教学楼 ----

  _createMainBuilding() {
    // 主教学楼 - 回字形，6层
    this._createBuilding(0, -100, 60, 80, 6, '\u6559', '\u4e3b\u6559\u5b66\u697c', 0x6366f1);

    // 内院四根柱子
    var pillarPositions = [
      [-10, -120], [10, -120], [-10, -80], [10, -80]
    ];
    pillarPositions.forEach(function(pos) {
      var pCanvas = this._createCanvas(32, 64);
      var pctx = pCanvas.getContext('2d');
      this._fillBackground(pctx, 32, 64, '#3a3a5e');
      this._tileChars(pctx, 32, 64, '\u2502', '#5a5a8e', 8, 8, 10);

      var pTex = new THREE.CanvasTexture(pCanvas);
      var pGeo = new THREE.BoxGeometry(1, 20, 1);
      var pMat = new THREE.MeshLambertMaterial({ map: pTex });
      var pillar = new THREE.Mesh(pGeo, pMat);
      pillar.position.set(pos[0], 10, pos[1]);
      this.scene.add(pillar);
      this.meshes.push(pillar);
    }.bind(this));
  }

  // ---- 逸夫图书馆 ----

  _createLibrary() {
    this._createBuilding(150, 100, 50, 40, 4, '\u4e66', '\u9038\u592b\u56fe\u4e66\u9986', 0x8b5cf6);
  }

  // ---- 体育馆 ----

  _createGym() {
    this._createBuilding(-150, 100, 80, 50, 2, '\u6a61', '\u4f53\u80b2\u9986', 0x44ff44);

    // 悬浮"球"装饰
    var ballCanvas = this._createCanvas(64, 64);
    var bctx = ballCanvas.getContext('2d');
    bctx.fillStyle = '#ff6644';
    bctx.font = 'bold 48px sans-serif';
    bctx.textAlign = 'center';
    bctx.textBaseline = 'middle';
    bctx.fillText('\u7403', 32, 32);

    var ballTex = new THREE.CanvasTexture(ballCanvas);
    var ballMat = new THREE.SpriteMaterial({ map: ballTex, transparent: true });
    var ball = new THREE.Sprite(ballMat);
    ball.position.set(-150, 8, 100);
    ball.scale.set(3, 3, 1);
    this._addMesh(ball);
  }

  // ---- 实验楼 ----

  _createLab() {
    this._createBuilding(200, -100, 40, 50, 4, '\u9178', '\u5b9e\u9a8c\u697c', 0xff8844);
  }

  // ---- 艺术楼 ----

  _createArtBuilding() {
    this._createBuilding(-200, -200, 40, 30, 5, '\u753b', '\u827a\u672f\u697c', 0xff44ff);

    // 钟楼尖顶装饰
    var spireCanvas = this._createCanvas(64, 128);
    var spctx = spireCanvas.getContext('2d');
    spctx.fillStyle = '#2a1a3a';
    spctx.fillRect(0, 0, 64, 128);
    spctx.fillStyle = '#aa44ff';
    spctx.font = 'bold 48px sans-serif';
    spctx.textAlign = 'center';
    spctx.fillText('\u949f', 32, 64);

    var spireTex = new THREE.CanvasTexture(spireCanvas);
    var spireMat = new THREE.SpriteMaterial({ map: spireTex, transparent: true });
    var spire = new THREE.Sprite(spireMat);
    spire.position.set(-200, 28, -200);
    spire.scale.set(3, 6, 1);
    this._addMesh(spire);
  }

  // ---- 宿舍楼 ----

  _createDormitory() {
    this._createBuilding(-250, 50, 35, 60, 5, '\u5bdd', '\u5b66\u751f\u5bbf\u820d', 0x66bbff);
  }

  // ---- 食堂 ----

  _createCafeteria() {
    this._createBuilding(250, 50, 45, 30, 2, '\u996d', '\u5b66\u751f\u98df\u5802', 0xffaa44);

    // 食堂上方"香"字装饰
    var aromaCanvas = this._createCanvas(64, 64);
    var actx = aromaCanvas.getContext('2d');
    actx.fillStyle = '#ffcc44';
    actx.font = 'bold 40px sans-serif';
    actx.textAlign = 'center';
    actx.textBaseline = 'middle';
    actx.fillText('\u9999', 32, 32);

    var aromaTex = new THREE.CanvasTexture(aromaCanvas);
    var aromaMat = new THREE.SpriteMaterial({ map: aromaTex, transparent: true });
    var aroma = new THREE.Sprite(aromaMat);
    aroma.position.set(250, 6, 50);
    aroma.scale.set(2, 2, 1);
    this._addMesh(aroma);
  }

  // ---- 中央广场 ----

  _createCentralPlaza() {
    var plazaCanvas = this._createCanvas(256, 256);
    var pctx = plazaCanvas.getContext('2d');
    this._fillBackground(pctx, 256, 256, '#1e1e3a');

    // 网格图案
    pctx.strokeStyle = '#2e2e5a';
    pctx.lineWidth = 1;
    for (var i = 0; i < 256; i += 16) {
      pctx.beginPath();
      pctx.moveTo(i, 0);
      pctx.lineTo(i, 256);
      pctx.stroke();
      pctx.beginPath();
      pctx.moveTo(0, i);
      pctx.lineTo(256, i);
      pctx.stroke();
    }

    // 中央十字标记
    pctx.strokeStyle = '#4a4a8a';
    pctx.lineWidth = 2;
    pctx.beginPath();
    pctx.moveTo(128, 80);
    pctx.lineTo(128, 176);
    pctx.stroke();
    pctx.beginPath();
    pctx.moveTo(80, 128);
    pctx.lineTo(176, 128);
    pctx.stroke();

    var plazaTex = new THREE.CanvasTexture(plazaCanvas);
    var plazaGeo = new THREE.PlaneGeometry(60, 60);
    var plazaMat = new THREE.MeshLambertMaterial({ map: plazaTex });
    var plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.02, 0);
    this._addMesh(plaza);
  }

  // ---- 围墙 ----

  _createWalls() {
    var half = 400;
    var wallH = 8;

    // 北墙
    this._createTextWall(0, -half, half * 2, wallH, '\u2588', 0x2a2a4e, 0x3a3a5e);
    // 南墙
    this._createTextWall(0, half, half * 2, wallH, '\u2588', 0x2a2a4e, 0x3a3a5e);
    // 东墙
    this._createTextWall(half, 0, 0.3, wallH, '\u2588', 0x2a2a4e, 0x3a3a5e);
    // 西墙
    this._createTextWall(-half, 0, 0.3, wallH, '\u2588', 0x2a2a4e, 0x3a3a5e);

    // 围墙顶部装饰
    var topCanvas = this._createCanvas(256, 16);
    var tctx = topCanvas.getContext('2d');
    this._fillBackground(tctx, 256, 16, '#3a3a5e');
    this._tileChars(tctx, 256, 16, '\u2580', '#5a5a7e', 8, 8, 8);

    var topTex = new THREE.CanvasTexture(topCanvas);
    topTex.wrapS = THREE.RepeatWrapping;
    topTex.repeat.set(8, 1);

    [1, -1].forEach(function(side) {
      var topGeoN = new THREE.PlaneGeometry(800, 1);
      var topMatN = new THREE.MeshLambertMaterial({ map: topTex.clone() });
      var topN = new THREE.Mesh(topGeoN, topMatN);
      topN.rotation.x = -Math.PI / 2;
      topN.position.set(0, wallH + 0.1, side * half);
      this._addMesh(topN);
    }.bind(this));
  }

  // ---- 树木 ----

  _createTrees() {
    var treePositions = [
      [-350, -350], [-300, -200], [300, -300], [350, 200], [-50, 350], [250, 300],
      [-350, 100], [350, -50], [-200, 350], [100, -350],
      [-320, -150], [320, 150], [-100, 300], [150, -320], [50, 280],
      [-280, 280], [280, -280], [-150, -320], [200, 250], [-60, -300]
    ];

    treePositions.forEach(function(pos) {
      // 树干
      var trunkCanvas = this._createCanvas(16, 32);
      var trctx = trunkCanvas.getContext('2d');
      trctx.fillStyle = '#5a3a1a';
      trctx.fillRect(6, 0, 4, 32);

      var trunkTex = new THREE.CanvasTexture(trunkCanvas);
      var trunkMat = new THREE.SpriteMaterial({ map: trunkTex, transparent: true });
      var trunk = new THREE.Sprite(trunkMat);
      trunk.position.set(pos[0], 0.6, pos[1]);
      trunk.scale.set(0.4, 0.8, 1);

      // 树冠
      var crownCanvas = this._createCanvas(64, 64);
      var cctx = crownCanvas.getContext('2d');
      cctx.fillStyle = '#2d5a2d';
      cctx.font = 'bold 48px sans-serif';
      cctx.textAlign = 'center';
      cctx.textBaseline = 'middle';
      cctx.fillText('\u6728', 32, 32);

      var crownTex = new THREE.CanvasTexture(crownCanvas);
      var crownMat = new THREE.SpriteMaterial({ map: crownTex, transparent: true });
      var crown = new THREE.Sprite(crownMat);
      crown.position.set(pos[0], 2, pos[1]);
      crown.scale.set(1.5, 1.5, 1);

      var group = new THREE.Group();
      group.add(trunk);
      group.add(crown);
      this._addMesh(group);
    }.bind(this));
  }

  // ---- 路灯 ----

  _createLampPosts() {
    var lampPositions = [
      [-60, -60], [60, -60], [-60, 60], [60, 60],
      [0, -180], [0, 180], [-180, 0], [180, 0],
      [-120, 50], [120, 50], [-120, -180], [120, -180]
    ];

    lampPositions.forEach(function(pos) {
      var lampCanvas = this._createCanvas(32, 64);
      var lctx = lampCanvas.getContext('2d');
      lctx.fillStyle = '#4a4a4a';
      lctx.fillRect(14, 10, 4, 54);
      lctx.fillStyle = '#ffdd88';
      lctx.beginPath();
      lctx.arc(16, 10, 8, 0, Math.PI * 2);
      lctx.fill();

      var lampTex = new THREE.CanvasTexture(lampCanvas);
      var lampMat = new THREE.SpriteMaterial({ map: lampTex, transparent: true });
      var lamp = new THREE.Sprite(lampMat);
      lamp.position.set(pos[0], 3, pos[1]);
      lamp.scale.set(0.8, 1.6, 1);
      this._addMesh(lamp);
    }.bind(this));
  }

  // ---- 小路 ----

  _createPaths() {
    // 主干道：十字路
    var pathHCanvas = this._createCanvas(256, 64);
    var phctx = pathHCanvas.getContext('2d');
    this._fillBackground(phctx, 256, 64, '#1a1a30');
    phctx.setLineDash([8, 8]);
    phctx.strokeStyle = '#3a3a5a';
    phctx.lineWidth = 2;
    phctx.beginPath();
    phctx.moveTo(0, 32);
    phctx.lineTo(256, 32);
    phctx.stroke();

    var pathHTex = new THREE.CanvasTexture(pathHCanvas);
    pathHTex.wrapS = THREE.RepeatWrapping;
    pathHTex.repeat.set(5, 1);

    // 南北向道路
    var pathNS = new THREE.Mesh(
      new THREE.PlaneGeometry(800, 8),
      new THREE.MeshLambertMaterial({ map: pathHTex })
    );
    pathNS.rotation.x = -Math.PI / 2;
    pathNS.position.set(0, 0.03, 0);
    this._addMesh(pathNS);

    // 东西向道路
    var pathEW = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 800),
      new THREE.MeshLambertMaterial({ map: pathHTex.clone() })
    );
    pathEW.rotation.x = -Math.PI / 2;
    pathEW.position.set(0, 0.03, 0);
    this._addMesh(pathEW);

    // 环形路 - 使用虚线效果
    var ringPathCanvas = this._createCanvas(256, 256);
    var rpctx = ringPathCanvas.getContext('2d');
    this._fillBackground(rpctx, 256, 256, '#1a1a30');
    rpctx.strokeStyle = '#2a2a4a';
    rpctx.lineWidth = 6;
    rpctx.setLineDash([10, 6]);
    rpctx.beginPath();
    rpctx.ellipse(128, 128, 100, 100, 0, 0, Math.PI * 2);
    rpctx.stroke();

    var ringPathTex = new THREE.CanvasTexture(ringPathCanvas);
    var ringPath = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshLambertMaterial({ map: ringPathTex, transparent: true })
    );
    ringPath.rotation.x = -Math.PI / 2;
    ringPath.position.set(0, 0.04, 0);
    this._addMesh(ringPath);
  }

  // ---- 撤离点 ----

  _createExtractionPoints() {
    var points = [
      { pos: new THREE.Vector3(-380, 0, 0), label: '\u897f\u95e8' },
      { pos: new THREE.Vector3(380, 0, 0), label: '\u4e1c\u95e8' },
      { pos: new THREE.Vector3(0, 0, -380), label: '\u5357\u95e8' }
    ];

    points.forEach(function(pt) {
      var group = new THREE.Group();

      // 旋转光环
      var ringCanvas = this._createCanvas(128, 128);
      var rctx = ringCanvas.getContext('2d');
      rctx.fillStyle = '#00ffaa';
      rctx.font = '20px monospace';
      rctx.textAlign = 'center';
      rctx.fillText('(     (     (     (     (     (', 64, 30);
      rctx.fillText(')     )     )     )     )     )', 64, 60);
      rctx.fillText('(     (     (     (     (     (', 64, 90);

      var ringTex = new THREE.CanvasTexture(ringCanvas);
      var ringMat = new THREE.SpriteMaterial({
        map: ringTex,
        transparent: true,
        opacity: 0.6
      });
      var ring = new THREE.Sprite(ringMat);
      ring.scale.set(6, 3, 1);
      group.add(ring);

      // 标签
      var labelCanvas = this._createCanvas(128, 48);
      var lctx = labelCanvas.getContext('2d');
      lctx.fillStyle = '#00ffaa';
      lctx.font = 'bold 28px sans-serif';
      lctx.textAlign = 'center';
      lctx.fillText(pt.label, 64, 32);

      var labelTex = new THREE.CanvasTexture(labelCanvas);
      var labelMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true });
      var label = new THREE.Sprite(labelMat);
      label.position.y = 2.5;
      label.scale.set(2, 0.8, 1);
      group.add(label);

      // 地面光圈
      var glowCanvas = this._createCanvas(128, 128);
      var gctx = glowCanvas.getContext('2d');
      var grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 60);
      grad.addColorStop(0, 'rgba(0,255,170,0.3)');
      grad.addColorStop(1, 'rgba(0,255,170,0)');
      gctx.fillStyle = grad;
      gctx.fillRect(0, 0, 128, 128);

      var glowTex = new THREE.CanvasTexture(glowCanvas);
      var glowGeo = new THREE.PlaneGeometry(12, 12);
      var glowMat = new THREE.MeshBasicMaterial({
        map: glowTex,
        transparent: true,
        depthWrite: false
      });
      var glow = new THREE.Mesh(glowGeo, glowMat);
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.05;
      group.add(glow);

      group.position.copy(pt.pos);
      this._addMesh(group);
      this.animatedGroups.push(group);
    }.bind(this));
  }

  // ---- 装饰标签 ----

  _createDecorativeLabels() {
    var labels = [
      { pos: new THREE.Vector3(0, 12, -180), text: '\u2193 \u6559\u5b66\u533a', color: '#6366f1' },
      { pos: new THREE.Vector3(0, 6, 180), text: '\u2193 \u4f53\u80b2\u533a', color: '#44ff44' },
      { pos: new THREE.Vector3(180, 6, 0), text: '\u2192 \u56fe\u4e66\u9986', color: '#8b5cf6' }
    ];

    labels.forEach(function(lb) {
      var canvas = this._createCanvas(192, 48);
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = lb.color;
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lb.text, 96, 24);

      var tex = new THREE.CanvasTexture(canvas);
      var mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      var sprite = new THREE.Sprite(mat);
      sprite.position.copy(lb.pos);
      sprite.scale.set(4, 1, 1);
      this._addMesh(sprite);
    }.bind(this));
  }

  // ---- 动画更新 ----

  update(time) {
    // 撤离点光环旋转
    this.animatedGroups.forEach(function(group) {
      if (group.children.length > 0) {
        group.children[0].material.rotation = time * 0.5;
      }
    });
  }

  // ---- 清理 ----

  dispose() {
    var self = this;
    this.meshes.forEach(function(m) {
      self.scene.remove(m);
      if (m.traverse) {
        m.traverse(function(c) {
          if (c.geometry) c.geometry.dispose();
          if (c.material) {
            if (c.material.map) c.material.map.dispose();
            c.material.dispose();
          }
        });
      } else {
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          if (m.material.map) m.material.map.dispose();
          m.material.dispose();
        }
      }
    });
    this.meshes = [];
    this.animatedGroups = [];
  }
}
