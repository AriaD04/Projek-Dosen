// ============================================================
// scene-3.js — Scene 3: Aliran Energi (Rantai Makanan Darat)
// ============================================================
"use strict";

function buildCurrentScene() { buildScene3(); }

// ============================================================
// SCENE 3 — Aliran Energi (3 Lapisan)
// Lapisan 1 : Demo animasi rantai makanan darat
// Lapisan 2 : Puzzle susun rantai makanan laut (Part 1)
// Lapisan 3 : Placeholder Part 2 (belum diisi)
// ============================================================

// ── State layer Scene 3 ──
// [shared] let s3_layer = 1; // 1 | 2 | 3

// ── Data rantai makanan darat (Lapisan 1) ──
const chainItems = [
  {
    label: "🌿 Tumbuhan",
    role: "Produsen",
    glbKey: "pohon",
    x: -13.5,
    targetSize: 3.5,
    info: {
      title: "Produsen — Tumbuhan",
      body: "Tumbuhan menyerap CO₂ + cahaya matahari melalui fotosintesis dan menjadi sumber energi pertama dalam rantai makanan.",
    },
  },
  {
    label: "🦗 Belalang",
    role: "Konsumen I",
    glbKey: "belalang",
    x: -4.5,
    targetSize: 3.0,
    info: {
      title: "Konsumen I — Belalang",
      body: "Belalang memakan tumbuhan. Hanya sekitar 10% energi berpindah ke tingkat berikutnya.",
    },
  },
  {
    label: "🐦 Burung",
    role: "Konsumen II",
    glbKey: "burung3",
    x: 4.5,
    targetSize: 3.0,
    info: {
      title: "Konsumen II — Burung",
      body: "Burung memakan belalang. Energi terus berkurang ~90% per tingkat trofik.",
    },
  },
  {
    label: "🦅 Elang",
    role: "Konsumen III",
    glbKey: "elang3",
    x: 13.5,
    targetSize: 3.2,
    info: {
      title: "Konsumen III — Elang",
      body: "Elang adalah predator puncak. Mengatur populasi di bawahnya dan menjaga keseimbangan ekosistem.",
    },
  },
];

// ── Data puzzle laut (Lapisan 2) ──
// Urutan benar: plankton → ikanKecil → tuna → hiu
const s3p2_correctOrder = ["plankton", "ikanKecil", "tuna", "hiu"];

// ── PETUNJUK ROTASI KOREKSI ──
// Referensi: hiu (sceen_3_hiu_bagian2_4.glb) dianggap sudah benar arahnya.
// ikanKecil mengarah ke BAWAH → perlu diputar di sumbu X sebesar +90° (Math.PI/2)
// tuna     mengarah ke ATAS  → perlu diputar di sumbu X sebesar -90° (-Math.PI/2)
// plankton → ikuti hiu, biasanya sudah OK (kecil, simetris)
const s3p2_itemData = {
  plankton: {
    label: "🦠 Plankton",
    role: "Produsen",
    glbKey: "plankton",
    targetSize: 2.0,
    slotX: -13.5,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
  },
  ikanKecil: {
    label: "🐟 Ikan Kecil",
    role: "Konsumen I",
    glbKey: "ikanKecil",
    targetSize: 2.5,
    slotX: -4.5,
    // ikanKecil menghadap ke bawah → putar +90° pada sumbu X agar berdiri horizontal
    rotationX: Math.PI / 2,
    rotationY: 0,
    rotationZ: 0,
  },
  tuna: {
    label: "🐠 Tuna",
    role: "Konsumen II",
    glbKey: "tuna",
    targetSize: 3.0,
    slotX: 4.5,
    // tuna menghadap ke atas → putar -90° pada sumbu X agar berdiri horizontal
    rotationX: -Math.PI / 2,
    rotationY: 0,
    rotationZ: 0,
  },
  hiu: {
    label: "🦈 Hiu",
    role: "Konsumen III",
    glbKey: "hiu",
    targetSize: 3.5,
    slotX: 13.5,
    // Hiu sudah benar, tidak perlu koreksi
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
  },
};

// State puzzle lapisan 2
// [shared] let s3p2_slots = []; // array {key, mesh slot, occupied}
// [shared] let s3p2_items = []; // draggable item groups (shuffle tray)
// [shared] let s3p2_correct = 0;
// [shared] let s3p2_dragObj = null;
// [shared] let s3p2_dragOrigin = null;
// [shared] let s3p2_isDragging = false;
// [shared] let s3p2_raycaster = null;
// [shared] let s3p2_listenersOn = false;

// ── State fitur Mulai + Timer (baru) ──
// [shared] let s3p2_gameStarted = false; // true setelah user tekan "Mulai"
// [shared] let s3p2_timerInterval = null; // interval ID countdown
// [shared] let s3p2_timeLeft = 10; // detik tersisa
// [shared] let s3p2_cameraLocked = false; // apakah kamera sedang di-lock

// ── Shared helpers ──
function makeGlowRing(color) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.12, 8, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.1;
  ring.userData.isGlowRing = true;
  return ring;
}

function makeChainArrow(x1, x2, y) {
  const gap = 3.5;
  const len = x2 - x1 - gap * 2;
  if (len <= 0) return;
  const mid = x1 + gap + len / 2;
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, len, 8),
    new THREE.MeshBasicMaterial({
      color: 0x00e676,
      transparent: true,
      opacity: 0.7,
    }),
  );
  shaft.rotation.z = Math.PI / 2;
  shaft.position.set(mid, y, 0);
  scene.add(shaft);
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.7, 8),
    new THREE.MeshBasicMaterial({
      color: 0x00e676,
      transparent: true,
      opacity: 0.9,
    }),
  );
  head.rotation.z = -Math.PI / 2;
  head.position.set(x2 - gap, y, 0);
  scene.add(head);
}

// ── LAPISAN 1 : Demo animasi darat ──
function buildScene3() {
  if (typeof s3_layer !== 'undefined') s3_layer = 1;
  scene.background = new THREE.Color(0x071a0e);
  addLight();

  // Ground GLB (tanah_sceen3_1_1.glb)
  loadGLB("tanah3", GLB_PATHS["tanah3"], (model) => {
    // Fit to wide plane footprint
    fitModelToBox(model, 30);
    const box = new THREE.Box3().setFromObject(model);
    model.position.y -= box.min.y;
    model.position.set(0, -0.5, 0);

    // --- TAMBAHKAN BARIS INI ---
    // Memutar tanah 90 derajat di sumbu Y agar sejajar dengan rantai makanan
    model.rotation.y = Math.PI / 2;
    // ---------------------------

    // --- TAMBAHKAN BARIS INI ---
    // Memanjangkan tanah ke kiri & kanan sebesar 1.8x lipat
    model.scale.z *= 1.8;
    // ---------------------------
    scene.add(model);
  });

  sceneObjects = [];
  let loadedCount = 0;
  const total = chainItems.length;

  chainItems.forEach((item, i) => {
    const group = new THREE.Group();
    group.position.set(item.x, 0, 0);
    group.userData.chainIndex = i;
    group.userData.chainItem = item;
    group.userData.baseY = 0;
    group.userData.floatY = 0.6 + i * 0.15;
    group.userData.pulse = false;
    const ring = makeGlowRing(0x00e676);
    group.add(ring);
    group.userData.glowRing = ring;
    sceneObjects.push(group);
    scene.add(group);

    loadGLB(item.glbKey, GLB_PATHS[item.glbKey], (model) => {
      fitModelToBox(model, item.targetSize);
      const box = new THREE.Box3().setFromObject(model);
      model.position.y -= box.min.y;
      group.add(model);
      group.userData.model = model;
      loadedCount++;
      if (loadedCount === total) {
        for (let j = 0; j < chainItems.length - 1; j++)
          makeChainArrow(chainItems[j].x, chainItems[j + 1].x, 1.2);
      }
    });
  });

  // Interact buttons
  addInteractBtn("▶ Animasi Rantai Makanan", animateFoodChain);
  addInteractBtn("ℹ️ Penjelasan", () =>
    showInfo(
      "Rantai Makanan",
      "🌿 PRODUSEN → Tumbuhan (energi matahari)\n" +
        "🦗 KONSUMEN I → Belalang (memakan tumbuhan)\n" +
        "🐦 KONSUMEN II → Burung (memakan belalang)\n" +
        "🦅 KONSUMEN III → Elang (predator puncak)\n\n" +
        "Energi berkurang ±90% setiap naik satu tingkat trofik!\n\n" +
        "💡 Klik setiap objek 3D untuk info lebih lanjut.",
    ),
  );

  // Klik 3D → info
  const canvas = document.getElementById("c");
  const s3Raycaster = new THREE.Raycaster();
  function s3OnClick(e) {
    if (s3_layer !== 1) return; // standalone
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    s3Raycaster.setFromCamera(mouse, camera);
    const hits = s3Raycaster.intersectObjects(sceneObjects, true);
    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj.parent && !obj.userData.chainItem) obj = obj.parent;
      if (obj.userData.chainItem)
        showInfo(
          obj.userData.chainItem.info.title,
          obj.userData.chainItem.info.body,
        );
    }
  }
  canvas.addEventListener("click", s3OnClick);
  canvas._s3ClickHandler = s3OnClick;

  // Tombol pindah ke lapisan 2 — muncul di tengah bawah
  s3_injectLayerBtn();
}

// Inject tombol "Ayo Menyusun Rantai Makanan Sendiri" ke tengah bawah layar
function s3_injectLayerBtn() {
  const old = document.getElementById("s3-layer-btn");
  if (old) old.remove();
  const btn = document.createElement("button");
  btn.id = "s3-layer-btn";
  btn.textContent = "🎮 Ayo Menyusun Rantai Makanan Sendiri!";
  btn.style.cssText = `
    position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
    z-index:200; padding:14px 32px; border-radius:40px;
    background:rgba(0,230,118,0.15); border:2px solid rgba(0,230,118,0.6);
    color:#00e676; font-size:15px; font-weight:700; letter-spacing:0.5px;
    cursor:pointer; transition:all 0.3s ease;
    box-shadow: 0 0 20px rgba(0,230,118,0.2);
    font-family:'DM Sans',sans-serif;
  `;
  btn.onmouseover = () => {
    btn.style.background = "rgba(0,230,118,0.3)";
    btn.style.boxShadow = "0 0 30px rgba(0,230,118,0.4)";
  };
  btn.onmouseout = () => {
    btn.style.background = "rgba(0,230,118,0.15)";
    btn.style.boxShadow = "0 0 20px rgba(0,230,118,0.2)";
  };
  btn.onclick = () => {
    btn.remove();
    s3_loadLayer2();
  };
  document.body.appendChild(btn);
}

function animateFoodChain() {
  sceneObjects.forEach((g) => {
    if (g && g.userData.glowRing) {
      g.userData.glowRing.material.opacity = 0;
      g.userData.pulse = false;
    }
  });
  let step = 0;
  const steps = [
    () => {
      if (sceneObjects[0]) sceneObjects[0].userData.pulse = true;
      showInfo(chainItems[0].info.title, chainItems[0].info.body);
    },
    () => {
      if (sceneObjects[0]) sceneObjects[0].userData.pulse = false;
      if (sceneObjects[1]) sceneObjects[1].userData.pulse = true;
      showInfo(chainItems[1].info.title, chainItems[1].info.body);
    },
    () => {
      if (sceneObjects[1]) sceneObjects[1].userData.pulse = false;
      if (sceneObjects[2]) sceneObjects[2].userData.pulse = true;
      showInfo(chainItems[2].info.title, chainItems[2].info.body);
    },
    () => {
      if (sceneObjects[2]) sceneObjects[2].userData.pulse = false;
      if (sceneObjects[3]) sceneObjects[3].userData.pulse = true;
      showInfo(chainItems[3].info.title, chainItems[3].info.body);
    },
    () => {
      if (sceneObjects[3]) sceneObjects[3].userData.pulse = false;
      showInfo(
        "Siklus Lengkap ♻️",
        "Setelah elang mati, pengurai menguraikan bangkai menjadi nutrisi → kembali ke tanah → diserap tumbuhan.\n\nEkosistem terus berputar dalam siklus yang seimbang!",
      );
    },
  ];
  const iv = setInterval(() => {
    if (step < steps.length) steps[step++]();
    else clearInterval(iv);
  }, 2200);
}


// Override: navigate to Part-1.html when layer 2 is triggered
function s3_loadLayer2() {
  window.location.href = 'Scene 3 — Aliran Energi Part-1.html';
}

// ── Entry point ──
window.addEventListener('DOMContentLoaded', () => startSceneApp(2));

// Fix s3_layer state for navigation reference
s3_layer = 1;
