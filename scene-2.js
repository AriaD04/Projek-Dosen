// ============================================================
// scene-2.js — Scene 2: Konsep Ekosistem (Drag & Drop 3D)
// ============================================================
"use strict";

function buildCurrentScene() { buildScene2(); }

// SCENE 2 — Konsep Ekosistem (3D DRAG & DROP v4)
// Sistem: Objek 3D GLB sebagai balok draggable di canvas Three.js
// Drop ke zona 3D → pengecekan biotik/abiotik via raycast plane
// HTML overlay hanya untuk progress / score / feedback / hint
// ============================================================

// ── State Scene 2 ──
// [shared] let s2_itemsMeshes = []; // array of { group, data, placed, originalPos }
// [shared] let s2_correctCount = 0;
// [shared] let s2_totalItems = 0;
// [shared] let s2_solved = {};
// [shared] let s2_highlightedObj = null;
// [shared] let s2_raycaster = new THREE.Raycaster();
// [shared] let s2_mouse = new THREE.Vector2();
// [shared] let s2_clickHandler = null;

// Drop zone planes (invisible, for raycasting)
// [shared] let s2_biotikPlane = null;
// [shared] let s2_abiotikPlane = null;

// Drag state
// [shared] let s2_dragObj = null; // { group, data } being dragged
// [shared] let s2_dragPlane = null; // infinite y-plane for drag intersection
// [shared] let s2_dragOffset = new THREE.Vector3();
// [shared] let s2_isDragging = false;
// [shared] let s2_mouseDownObj = null;
// [shared] let s2_pointerDownPos = null;

// Label HTML elements overlaid over 3D zones
// [shared] let s2_zoneLabels = null;

// ── Data komponen ekosistem ──
const S2_ITEMS = [
  {
    k: "pohon",
    lbl: "🌳 Pohon",
    tipe: "biotik",
    emoji: "🌳",
    kategori: "Produsen",
    fungsi:
      "Menghasilkan oksigen & menjadi sumber makanan melalui fotosintesis.",
    fakta: "Satu pohon bisa menyerap 22 kg CO₂ per tahun!",
    warna: 0x2d9e50,
  },
  {
    k: "rusa",
    lbl: "🦌 Rusa",
    tipe: "biotik",
    emoji: "🦌",
    kategori: "Konsumen",
    fungsi:
      "Hewan herbivora yang memakan tumbuhan. Bagian dari rantai makanan.",
    fakta:
      "Rusa jantan menggunakan tanduknya untuk bersaing mendapatkan pasangan!",
    warna: 0x8b5e3c,
  },
  {
    k: "singa",
    lbl: "🦁 Singa",
    tipe: "biotik",
    emoji: "🦁",
    kategori: "Konsumen Puncak",
    fungsi: "Predator puncak yang mengontrol populasi hewan lain di ekosistem.",
    fakta:
      "Singa adalah satu-satunya kucing besar yang hidup berkelompok (pride)!",
    warna: 0xc8860a,
  },
  {
    k: "manusia",
    lbl: "🧑 Manusia",
    tipe: "biotik",
    emoji: "🧑",
    kategori: "Konsumen Puncak",
    fungsi:
      "Manusia berperan sebagai konsumen & memiliki tanggung jawab menjaga ekosistem.",
    fakta:
      "Manusia adalah satu-satunya makhluk hidup yang bisa merusak sekaligus memulihkan ekosistem.",
    warna: 0xe8a87c,
  },
  {
    k: "batu",
    lbl: "🪨 Batu",
    tipe: "abiotik",
    emoji: "🪨",
    kategori: "Komponen Abiotik",
    fungsi:
      "Menyediakan mineral & tempat hidup bagi organisme seperti lumut dan serangga.",
    fakta:
      "Batu granit terbentuk dari lava yang mendingin selama jutaan tahun!",
    warna: 0x9e9e9e,
  },
  {
    k: "air",
    lbl: "💧 Air",
    tipe: "abiotik",
    emoji: "💧",
    kategori: "Komponen Abiotik",
    fungsi:
      "Pelarut universal yang dibutuhkan semua makhluk hidup untuk metabolisme.",
    fakta: "97% air di bumi adalah air asin. Hanya 3% yang air tawar!",
    warna: 0x42a5f5,
  },
  {
    k: "matahari",
    lbl: "☀️ Matahari",
    tipe: "abiotik",
    emoji: "☀️",
    kategori: "Sumber Energi Utama",
    fungsi:
      "Sumber energi primer ekosistem. Menggerakkan fotosintesis & siklus air.",
    fakta:
      "Energi matahari yang sampai ke bumi dalam 1 jam cukup untuk seluruh kebutuhan manusia setahun!",
    warna: 0xffca28,
  },
];

// ── GLB key → fallback geometry factory ──
function s2_makeFallback(key, color) {
  const g = new THREE.Group();
  let mesh;
  switch (key) {
    case "pohon": {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.25, 1.2, 8),
        new THREE.MeshPhongMaterial({ color: 0x5d4037 }),
      );
      trunk.position.y = 0.6;
      g.add(trunk);
      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(1.0, 10, 10),
        new THREE.MeshPhongMaterial({ color: 0x2d9e50 }),
      );
      crown.position.y = 1.8;
      g.add(crown);
      break;
    }
    case "rusa": {
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry()
          ? new THREE.CapsuleGeometry(0.35, 0.9, 6, 8)
          : new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0x8b5e3c }),
      );
      body.position.y = 0.7;
      g.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0x8b5e3c }),
      );
      head.position.set(0.5, 1.2, 0);
      g.add(head);
      break;
    }
    case "singa": {
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 10, 10),
        new THREE.MeshPhongMaterial({ color: 0xc8860a }),
      );
      body.scale.set(1.2, 0.85, 1.6);
      body.position.y = 0.6;
      g.add(body);
      const mane = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 10, 10),
        new THREE.MeshPhongMaterial({ color: 0x7b4f10 }),
      );
      mane.position.set(0.6, 0.9, 0);
      g.add(mane);
      break;
    }
    case "manusia": {
      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.9, 0.25),
        new THREE.MeshPhongMaterial({ color: 0x3f51b5 }),
      );
      torso.position.y = 0.9;
      g.add(torso);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 10, 10),
        new THREE.MeshPhongMaterial({ color: 0xe8a87c }),
      );
      head.position.y = 1.65;
      g.add(head);
      break;
    }
    case "batu": {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.75, 0),
        new THREE.MeshPhongMaterial({ color: 0x9e9e9e, flatShading: true }),
      );
      rock.position.y = 0.5;
      rock.rotation.y = Math.random() * Math.PI;
      g.add(rock);
      break;
    }
    case "air": {
      const pool = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 1.0, 0.18, 20),
        new THREE.MeshPhongMaterial({
          color: 0x42a5f5,
          transparent: true,
          opacity: 0.75,
        }),
      );
      pool.position.y = 0.09;
      g.add(pool);
      [0, 1].forEach((i) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.6 + i * 0.3, 0.04, 8, 24),
          new THREE.MeshBasicMaterial({
            color: 0x81d4fa,
            transparent: true,
            opacity: 0.5 - i * 0.15,
          }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.19;
        ring.userData.rotY = 0.4 + i * 0.2;
        g.add(ring);
      });
      break;
    }
    case "matahari": {
      const sun = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 14, 14),
        new THREE.MeshBasicMaterial({ color: 0xffca28 }),
      );
      sun.position.y = 0.7;
      g.add(sun);
      for (let i = 0; i < 8; i++) {
        const ray = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6),
          new THREE.MeshBasicMaterial({ color: 0xffe082 }),
        );
        const angle = (i / 8) * Math.PI * 2;
        ray.position.set(Math.cos(angle) * 1.05, 0.7, Math.sin(angle) * 1.05);
        ray.rotation.z = angle;
        g.add(ray);
      }
      break;
    }
    default:
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshPhongMaterial({ color }),
      );
      mesh.position.y = 0.5;
      g.add(mesh);
  }
  return g;
}

// ── Build Scene 2 ──
function buildScene2() {
  scene.background = new THREE.Color(0x071a12);

  // Hide narasi (its text overlaps the HUD bar in Scene 2)
  const narasiEl = document.getElementById("narasi");
  if (narasiEl) narasiEl.style.display = "none";

  // Lighting
  const ambLight = new THREE.AmbientLight(0x88bbff, 0.5);
  scene.add(ambLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(8, 14, 10);
  scene.add(dirLight);
  const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
  fillLight.position.set(-8, 6, -5);
  scene.add(fillLight);

  // Reset state
  s2_itemsMeshes = [];
  s2_correctCount = 0;
  s2_totalItems = S2_ITEMS.length;
  s2_solved = {};
  s2_dragObj = null;
  s2_isDragging = false;
  draggableObjects = [];

  if (scene2DragControls) {
    scene2DragControls.dispose();
    scene2DragControls = null;
  }

  // ── Terrain base ──
  loadGLB("base", GLB_PATHS.base, (model) => {
    fitModelToBox(model, 38);
    model.position.set(0, -2.5, 0);
    model.traverse((c) => {
      if (c.isMesh) c.userData.isPassive = true;
    });
    scene.add(model);
  });

  // ── Drop zone planes (visual + hitbox) ──
  // Biotik zone: X < 0, Abiotik zone: X > 0
  // We place them at Y=0 (ground level), visible as colored pads

  const zoneY = 0.05;
  const zoneW = 13,
    zoneD = 12;

  // Biotik zone (left, green)
  const biotikGeo = new THREE.PlaneGeometry(zoneW, zoneD);
  const biotikMat = new THREE.MeshBasicMaterial({
    color: 0x00e676,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
  });
  s2_biotikPlane = new THREE.Mesh(biotikGeo, biotikMat);
  s2_biotikPlane.rotation.x = -Math.PI / 2;
  s2_biotikPlane.position.set(-9, zoneY, 2);
  s2_biotikPlane.userData.zoneType = "biotik";
  s2_biotikPlane.userData.isPassive = true;
  scene.add(s2_biotikPlane);

  // Biotik zone border glow
  const biotikBorderGeo = new THREE.EdgesGeometry(biotikGeo);
  const biotikBorder = new THREE.LineSegments(
    biotikBorderGeo,
    new THREE.LineBasicMaterial({ color: 0x00e676, linewidth: 2 }),
  );
  biotikBorder.rotation.x = -Math.PI / 2;
  biotikBorder.position.set(-9, zoneY + 0.01, 2);
  biotikBorder.userData.isPassive = true;
  scene.add(biotikBorder);

  // Abiotik zone (right, blue)
  const abiotikGeo = new THREE.PlaneGeometry(zoneW, zoneD);
  const abiotikMat = new THREE.MeshBasicMaterial({
    color: 0x42a5f5,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
  });
  s2_abiotikPlane = new THREE.Mesh(abiotikGeo, abiotikMat);
  s2_abiotikPlane.rotation.x = -Math.PI / 2;
  s2_abiotikPlane.position.set(9, zoneY, 2);
  s2_abiotikPlane.userData.zoneType = "abiotik";
  s2_abiotikPlane.userData.isPassive = true;
  scene.add(s2_abiotikPlane);

  const abiotikBorderGeo = new THREE.EdgesGeometry(abiotikGeo);
  const abiotikBorder = new THREE.LineSegments(
    abiotikBorderGeo,
    new THREE.LineBasicMaterial({ color: 0x42a5f5, linewidth: 2 }),
  );
  abiotikBorder.rotation.x = -Math.PI / 2;
  abiotikBorder.position.set(9, zoneY + 0.01, 2);
  abiotikBorder.userData.isPassive = true;
  scene.add(abiotikBorder);

  // Zone label text (3D sprites via HTML overlay, updated each frame)
  s2_injectZoneLabels();

  // ── Spawn 7 GLB balok in a row at the front ──
  // Arrange them in an arc / row at z = 12 (near camera)
  const count = S2_ITEMS.length;
  const spacing = 4.5;
  const totalW = (count - 1) * spacing;

  S2_ITEMS.forEach((data, i) => {
    const xPos = -totalW / 2 + i * spacing;
    const zPos = 12; // front row, close to viewer
    const yPos = 0;

    const originalPos = new THREE.Vector3(xPos, yPos, zPos);

    loadGLB(data.k, GLB_PATHS[data.k], (model) => {
      // Scale to uniform "balok" size
      fitModelToBox(model, 2.8);

      // Re-seat on ground
      const box = new THREE.Box3().setFromObject(model);
      model.position.y -= box.min.y;

      // Wrap in a group with a hover glow platform
      const group = new THREE.Group();
      group.add(model);

      // Glowing base platform
      const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.6, 0.12, 20),
        new THREE.MeshBasicMaterial({
          color: data.tipe === "biotik" ? 0x00e676 : 0x42a5f5,
          transparent: true,
          opacity: 0.35,
        }),
      );
      platform.position.y = 0.06;
      platform.userData.isPassive = true;
      group.add(platform);

      group.position.copy(originalPos);
      group.userData = {
        isS2Item: true,
        itemData: data,
        originalPos: originalPos.clone(),
        placed: false,
        platformMesh: platform,
      };

      // Assign to draggableObjects (the model children for DragControls)
      // We'll use pointer events manually for more control
      s2_itemsMeshes.push(group);
      draggableObjects.push(group);
      scene.add(group);

      // If all loaded, set up drag
      if (s2_itemsMeshes.length === S2_ITEMS.length) {
        s2_setupDrag3D();
      }
    });
  });

  // ── Inject HUD overlay ──
  s2_injectHUDOverlay();

  // ── Interact buttons ──
  addInteractBtn("📖 Cara Main", () => s2_showInstructions3D());
  addInteractBtn("📊 Skor", () => {
    const pct = Math.round((s2_correctCount / s2_totalItems) * 100);
    let msg =
      pct === 100
        ? "🏆 SEMPURNA! Kamu paham ekosistem dengan baik!"
        : pct >= 70
          ? "👏 Bagus! Tinggal sedikit lagi!"
          : "💪 Terus coba! Kamu pasti bisa!";
    showInfo(`📊 Skormu: ${s2_correctCount}/${s2_totalItems} (${pct}%)`, msg);
  });

  // Show instructions after short delay
  setTimeout(() => s2_showInstructions3D(), 800);
}

// ── Inject minimal HUD overlay (progress + score + feedback) ──
function s2_injectHUDOverlay() {
  const old = document.getElementById("s2-hud-overlay");
  if (old) old.remove();

  const div = document.createElement("div");
  div.id = "s2-hud-overlay";
  div.innerHTML = `
    <div id="s2h-progress-wrap">
      <span id="s2h-progress-label">PROGRESS</span>
      <span id="s2h-progress-val">0 / ${S2_ITEMS.length}</span>
      <div id="s2h-progress-track"><div id="s2h-progress-bar"></div></div>
    </div>
    <div id="s2h-score-wrap">
      <span id="s2h-score-label">SKOR</span>
      <span id="s2h-score-val">0</span>
    </div>
    <div id="s2h-feedback"></div>
  `;
  document.body.appendChild(div);

  // ── Win overlay: injected DIRECTLY to <body>, NOT inside the HUD
  // This ensures it is not clipped or blocked by pointer-events:none on the HUD container
  const oldWin = document.getElementById("s2h-win");
  if (oldWin) oldWin.remove();

  const winDiv = document.createElement("div");
  winDiv.id = "s2h-win";
  winDiv.style.display = "none";
  winDiv.innerHTML = `
    <div id="s2h-win-card">
      <div>🏆</div>
      <div id="s2h-win-title">SELESAI!</div>
      <div id="s2h-win-sub"></div>
      <button id="s2h-win-btn">Lanjut ke Scene 3 ›</button>
    </div>
  `;
  document.body.appendChild(winDiv);

  document.getElementById("s2h-win-btn").addEventListener("click", () => {
    document.getElementById("s2h-win").style.display = "none";
    nextScene();
  });
}

// ── Zone labels as HTML overlay (projected to 3D world) ──
function s2_injectZoneLabels() {
  const old = document.getElementById("s2-zone-labels");
  if (old) old.remove();

  const div = document.createElement("div");
  div.id = "s2-zone-labels";
  div.innerHTML = `
    <div class="s2-zone-lbl biotik" id="s2zl-biotik">🌿 ZONA BIOTIK<br><small>Makhluk Hidup</small></div>
    <div class="s2-zone-lbl abiotik" id="s2zl-abiotik">💧 ZONA ABIOTIK<br><small>Benda Mati</small></div>
  `;
  document.body.appendChild(div);
}

// Update zone label positions each frame (called from loop if scene2)
function s2_updateZoneLabels() {
  if (currentScene !== 1) return;
  const lblBiotik = document.getElementById("s2zl-biotik");
  const lblAbiotik = document.getElementById("s2zl-abiotik");
  if (!lblBiotik || !lblAbiotik || !s2_biotikPlane || !s2_abiotikPlane) return;

  function project3D(obj) {
    if (!obj || !camera) return null;
    const wp = new THREE.Vector3();
    obj.getWorldPosition(wp);
    wp.y += 1.2;
    wp.project(camera);
    if (wp.z > 1) return null;
    return {
      x: ((wp.x + 1) / 2) * window.innerWidth,
      y: ((-wp.y + 1) / 2) * window.innerHeight,
    };
  }

  const pb = project3D(s2_biotikPlane);
  if (pb) {
    lblBiotik.style.left = pb.x + "px";
    lblBiotik.style.top = pb.y + "px";
    lblBiotik.style.display = "block";
  }
  const pa = project3D(s2_abiotikPlane);
  if (pa) {
    lblAbiotik.style.left = pa.x + "px";
    lblAbiotik.style.top = pa.y + "px";
    lblAbiotik.style.display = "block";
  }
}

// ── 3D Drag setup ──
// s2_dragListenersAttached declared in shared.js

function s2_setupDrag3D() {
  const canvas = document.getElementById("c");
  if (!canvas) return;
  s2_dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.4);
  if (!s2_dragListenersAttached) {
    canvas.addEventListener("pointerdown", s2_onPointerDown);
    canvas.addEventListener("pointermove", s2_onPointerMove);
    canvas.addEventListener("pointerup", s2_onPointerUp);
    s2_dragListenersAttached = true;
  }
}

function s2_getPointerNDC(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  return new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1,
  );
}

function s2_onPointerDown(e) {
  if (currentScene !== 1) return;
  const ndc = s2_getPointerNDC(e);
  s2_raycaster.setFromCamera(ndc, camera);

  // Find which s2 item was hit
  let hit = null;
  for (const grp of s2_itemsMeshes) {
    if (grp.userData.placed) continue;
    const meshes = [];
    grp.traverse((c) => {
      if (c.isMesh && !c.userData.isPassive) meshes.push(c);
    });
    const hits = s2_raycaster.intersectObjects(meshes, true);
    if (hits.length > 0) {
      hit = grp;
      break;
    }
  }

  if (!hit) return;

  s2_dragObj = hit;
  s2_isDragging = false;
  s2_pointerDownPos = { x: e.clientX, y: e.clientY };

  // Compute drag offset on the drag plane
  const intersect = new THREE.Vector3();
  s2_raycaster.ray.intersectPlane(s2_dragPlane, intersect);
  if (intersect) {
    s2_dragOffset.copy(hit.position).sub(intersect);
  }

  // Highlight
  hit.traverse((c) => {
    if (c.isMesh && !c.userData.isPassive && c.material) {
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach((m) => {
        m.emissive = new THREE.Color(0.15, 0.15, 0.15);
      });
    }
  });

  // Pulse platform
  if (hit.userData.platformMesh) {
    hit.userData.platformMesh.material.opacity = 0.7;
  }
}

function s2_onPointerMove(e) {
  if (currentScene !== 1 || !s2_dragObj) return;

  // Detect drag threshold
  const dx = e.clientX - s2_pointerDownPos.x;
  const dy = e.clientY - s2_pointerDownPos.y;
  if (!s2_isDragging && Math.sqrt(dx * dx + dy * dy) > 5) {
    s2_isDragging = true;
  }
  if (!s2_isDragging) return;

  const ndc = s2_getPointerNDC(e);
  s2_raycaster.setFromCamera(ndc, camera);
  const intersect = new THREE.Vector3();
  s2_raycaster.ray.intersectPlane(s2_dragPlane, intersect);
  if (intersect) {
    s2_dragObj.position.copy(intersect.add(s2_dragOffset));
    // Clamp Y to hover height
    s2_dragObj.position.y = 1.4;
  }

  // Highlight zones on hover
  s2_highlightZoneHover(s2_dragObj.position.x);
}

function s2_onPointerUp(e) {
  if (currentScene !== 1 || !s2_dragObj) return;

  const grp = s2_dragObj;
  s2_dragObj = null;

  // Remove highlight
  grp.traverse((c) => {
    if (c.isMesh && !c.userData.isPassive && c.material) {
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach((m) => {
        m.emissive = new THREE.Color(0, 0, 0);
      });
    }
  });
  if (grp.userData.platformMesh)
    grp.userData.platformMesh.material.opacity = 0.35;

  // Reset zone highlights
  s2_resetZoneHighlight();

  if (!s2_isDragging) {
    // It was a click — show info
    s2_showItemInfo(grp.userData.itemData);
    return;
  }

  s2_isDragging = false;

  // Check which zone the object landed in
  const px = grp.position.x;
  const pz = grp.position.z;

  const biotikCX = -9,
    biotikHW = 6.5;
  const abiotikCX = 9,
    abiotikHW = 6.5;
  const zoneZMin = -4,
    zoneZMax = 8;

  const inBiotik =
    px >= biotikCX - biotikHW &&
    px <= biotikCX + biotikHW &&
    pz >= zoneZMin &&
    pz <= zoneZMax;
  const inAbiotik =
    px >= abiotikCX - abiotikHW &&
    px <= abiotikCX + abiotikHW &&
    pz >= zoneZMin &&
    pz <= zoneZMax;

  const data = grp.userData.itemData;

  if (inBiotik || inAbiotik) {
    const droppedZone = inBiotik ? "biotik" : "abiotik";
    if (droppedZone === data.tipe) {
      // CORRECT!
      grp.userData.placed = true;
      s2_correctCount++;
      s2_solved[data.k] = true;

      // Snap into zone with slight offset by index
      const placedCount = Object.keys(s2_solved).length;
      const offsetX = (((placedCount - 1) % 3) - 1) * 2.8;
      const offsetZ = Math.floor((placedCount - 1) / 3) * 2.8;
      const targetX = (droppedZone === "biotik" ? -9 : 9) + offsetX;
      grp.position.set(targetX, 0, offsetZ - 1);

      // Reseat on ground
      const box = new THREE.Box3().setFromObject(grp);
      grp.position.y -= box.min.y;

      // Green glow + lock
      grp.traverse((c) => {
        if (c.isMesh && !c.userData.isPassive && c.material) {
          const mats = Array.isArray(c.material) ? c.material : [c.material];
          mats.forEach((m) => {
            m.emissive = new THREE.Color(
              droppedZone === "biotik" ? 0x004d20 : 0x003d6e,
            );
            m.emissiveIntensity = 0.5;
          });
        }
      });

      // Change platform color to solid success
      if (grp.userData.platformMesh) {
        grp.userData.platformMesh.material.color.setHex(
          droppedZone === "biotik" ? 0x00e676 : 0x42a5f5,
        );
        grp.userData.platformMesh.material.opacity = 0.8;
      }

      s2_updateScore(s2_correctCount * 10);
      s2_updateProgress();
      s2_showFeedback(
        `✅ ${data.emoji} ${data.lbl.replace(/^.+? /, "")} benar! ${data.tipe.toUpperCase()}`,
        true,
      );
      s2_showItemInfo(data);
      s2_spawnParticles3D(
        grp.position,
        droppedZone === "biotik" ? "#00e676" : "#42a5f5",
      );

      if (s2_correctCount >= s2_totalItems) {
        setTimeout(() => s2_showWin(), 800);
      }
    } else {
      // WRONG zone
      s2_returnToOrigin(grp);
      s2_showFeedback(
        `❌ ${data.emoji} bukan ${droppedZone}! Coba zona ${data.tipe === "biotik" ? "BIOTIK (hijau)" : "ABIOTIK (biru)"}`,
        false,
      );
      s2_shakeGroup(grp);
    }
  } else {
    // Dropped outside zones → return to origin
    s2_returnToOrigin(grp);
  }
}

function s2_returnToOrigin(grp) {
  // Animate back to original position
  const orig = grp.userData.originalPos;
  const start = grp.position.clone();
  const t0 = performance.now();
  const dur = 400;
  function tick(ts) {
    const t = Math.min((ts - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    grp.position.lerpVectors(start, orig, ease);
    if (t < 1) requestAnimationFrame(tick);
    else grp.position.copy(orig);
  }
  requestAnimationFrame(tick);
}

function s2_shakeGroup(grp) {
  const orig = grp.position.clone();
  let i = 0;
  const shakes = [0.4, -0.4, 0.3, -0.3, 0.15, -0.15, 0];
  function tick() {
    if (i >= shakes.length) {
      grp.position.x = orig.x;
      return;
    }
    grp.position.x = orig.x + shakes[i++];
    setTimeout(tick, 50);
  }
  tick();
}

function s2_highlightZoneHover(x) {
  const inBiotik = x < 0;
  if (s2_biotikPlane) s2_biotikPlane.material.opacity = inBiotik ? 0.4 : 0.18;
  if (s2_abiotikPlane) s2_abiotikPlane.material.opacity = inBiotik ? 0.18 : 0.4;
}

function s2_resetZoneHighlight() {
  if (s2_biotikPlane) s2_biotikPlane.material.opacity = 0.18;
  if (s2_abiotikPlane) s2_abiotikPlane.material.opacity = 0.18;
}

function s2_updateScore(val) {
  const el = document.getElementById("s2h-score-val");
  if (el) el.textContent = val;
}

function s2_updateProgress() {
  const pv = document.getElementById("s2h-progress-val");
  const pb = document.getElementById("s2h-progress-bar");
  if (pv) pv.textContent = `${s2_correctCount} / ${s2_totalItems}`;
  if (pb)
    pb.style.width = Math.round((s2_correctCount / s2_totalItems) * 100) + "%";
}

function s2_showFeedback(msg, success) {
  const el = document.getElementById("s2h-feedback");
  if (!el) return;
  el.textContent = msg;
  el.className = success ? "s2h-fb-ok" : "s2h-fb-err";
  el.style.opacity = "1";
  clearTimeout(el._to);
  el._to = setTimeout(() => {
    el.style.opacity = "0";
  }, 3000);
}

function s2_showItemInfo(data) {
  showInfo(
    `${data.emoji} ${data.lbl.replace(/^.+? /, "")} — ${data.kategori}`,
    `📌 Tipe: ${data.tipe.toUpperCase()}\n\n🔬 Fungsi:\n${data.fungsi}\n\n💡 Fakta:\n${data.fakta}`,
  );
}

function s2_showWin() {
  const win = document.getElementById("s2h-win");
  const sub = document.getElementById("s2h-win-sub");
  if (sub)
    sub.textContent = `Skor: ${s2_correctCount * 10} — Semua komponen benar! 🌿`;
  if (win) {
    win.style.display = "flex";
    win.style.alignItems = "center";
    win.style.justifyContent = "center";
  }
  // Particle burst
  for (let j = 0; j < 3; j++) {
    setTimeout(() => {
      const colors = ["#00e676", "#42a5f5", "#ffca28"];
      for (let i = 0; i < 20; i++) {
        const p = document.createElement("div");
        p.className = "s2p-particle";
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 8 + Math.random() * 12;
        const angle = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 200;
        p.style.cssText = `width:${size}px;height:${size}px;background:${color};
          left:${window.innerWidth / 2}px;top:${window.innerHeight / 2}px;
          --dx:${Math.cos(angle) * dist}px;--dy:${Math.sin(angle) * dist}px;
          border-radius:50%;position:fixed;z-index:9999;animation:s2p-burst 1s ease-out forwards;`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1200);
      }
    }, j * 280);
  }
}

function s2_reset3D() {
  // Remove overlays
  const hud = document.getElementById("s2-hud-overlay");
  if (hud) hud.remove();
  const zl = document.getElementById("s2-zone-labels");
  if (zl) zl.remove();
  // Clear interact buttons (prevent duplicates)
  const interactUI = document.getElementById("interact-ui");
  if (interactUI) interactUI.innerHTML = "";
  // Keep listener flag — listeners stay on canvas, just rebuild scene
  buildScene2();
}

function s2_spawnParticles3D(pos3d, color) {
  // Project 3D position to screen for particles
  if (!camera || !renderer) return;
  const v = pos3d.clone().project(camera);
  const x = ((v.x + 1) / 2) * window.innerWidth;
  const y = ((-v.y + 1) / 2) * window.innerHeight;
  for (let i = 0; i < 14; i++) {
    const p = document.createElement("div");
    const size = 6 + Math.random() * 8;
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 100;
    p.style.cssText = `
      width:${size}px;height:${size}px;background:${color};
      left:${x}px;top:${y}px;position:fixed;border-radius:50%;z-index:9999;
      --dx:${Math.cos(angle) * dist}px;--dy:${Math.sin(angle) * dist}px;
      animation:s2p-burst 0.9s ease-out forwards;`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }
}

function s2_showInstructions3D() {
  showInfo(
    "🎮 Cara Bermain — Scene 2",
    "1️⃣  DRAG objek 3D dari barisan depan ke zona yang tepat:\n" +
      "   🌿 ZONA HIJAU (BIOTIK) = Makhluk hidup (pohon, hewan, manusia)\n" +
      "   💧 ZONA BIRU (ABIOTIK) = Benda mati (air, batu, matahari)\n\n" +
      "2️⃣  Klik objek untuk melihat info & fakta!\n\n" +
      "3️⃣  Jika benar → objek terkunci di zona & skor bertambah!\n\n" +
      "4️⃣  Jika salah → objek kembali ke posisi semula.\n\n" +
      `🎯 Target: tempatkan semua ${S2_ITEMS.length} komponen ekosistem!`,
  );
}

// ── Legacy stubs (kept for compatibility) ──
// [shared] let s2_puzzleState = {
//   items: [],
//   holes: [],
//   score: 0,
//   drag: { active: false },
// };
function s2_injectPuzzleOverlay() {
  s2_injectHUDOverlay();
}
function s2p_renderShapes() {}
function s2p_renderHoles() {}
function s2p_setupDrag() {}
function s2_puzzleReset() {
  s2_reset3D();
}
function s2_showPopup(d) {
  s2_showItemInfo(d);
}
function s2_showInstructions() {
  s2_showInstructions3D();
}
function s2_showScore() {
  const pct = Math.round((s2_correctCount / s2_totalItems) * 100);
  showInfo(
    `📊 Skormu: ${s2_correctCount}/${s2_totalItems} (${pct}%)`,
    pct === 100 ? "🏆 SEMPURNA!" : pct >= 70 ? "👏 Bagus!" : "💪 Terus coba!",
  );
}
function s2_showS2Hint(msg) {
  s2_showFeedback(msg, true);
}
function s2_resetPositions() {
  s2_reset3D();
}
function s2_updateScoreUI() {
  s2_updateProgress();
}
function s2_injectScoreOverlay() {}
function s2_spawnParticles(pos3d, color) {
  s2_spawnParticles3D(pos3d, color);
}

// ============================================================

// ── Entry point ──
window.addEventListener('DOMContentLoaded', () => startSceneApp(1));
