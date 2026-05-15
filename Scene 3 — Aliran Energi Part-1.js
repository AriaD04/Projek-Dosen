// ============================================================
// Scene 3 — Aliran Energi Part-1.js
// Scene 3 Layer 2: Puzzle Rantai Makanan Laut
// ============================================================
"use strict";

function buildCurrentScene() { s3_loadLayer2(); }

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

// ── LAPISAN 2 : Puzzle Rantai Makanan Laut ──
function s3_loadLayer2() {
  s3_layer = 2;
  // Bersihkan scene tapi tetap di Scene 3 (currentScene tetap 2)
  scene = new THREE.Scene();
  sceneObjects = [];
  // Reset semua state puzzle
  s3p2_gameStarted = false;
  s3p2_cameraLocked = false;
  s3p2_listenersOn = false;
  if (s3p2_timerInterval) {
    clearInterval(s3p2_timerInterval);
    s3p2_timerInterval = null;
  }
  // Bersihkan UI yang mungkin tersisa
  [
    "s3p2-mulai-btn",
    "s3p2-timer",
    "s3p2-timeup",
    "s3p2-win",
    "s3p2-hud",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
  // Hapus tombol lapisan 1
  const old = document.getElementById("s3-layer-btn");
  if (old) old.remove();
  // Update judul & narasi
  document.getElementById("scene-title").textContent =
    "Scene 3 — Aliran Energi Part-1";
  document.getElementById("narasi-text").textContent =
    "Susun rantai makanan laut dari produsen hingga predator puncak!";
  document.getElementById("interact-ui").innerHTML = "";

  scene.background = new THREE.Color(0x021428);
  addLight();

  // Ground GLB (Diganti menjadi Laut)
  loadGLB("laut2", GLB_PATHS["laut2"], (model) => {
    fitModelToBox(model, 32);
    const box = new THREE.Box3().setFromObject(model);
    model.position.y -= box.min.y;
    model.position.set(0, -2.5, 2);
    model.rotation.y = Math.PI / 2; // <--- Ubah menjadi 90 derajat

    // --- TAMBAHKAN BARIS INI ---
    model.scale.z *= 1.8;
    // ---------------------------
    scene.add(model);
  });

  s3p2_slots = [];
  s3p2_items = [];
  s3p2_correct = 0;

  // Buat zona slot (target positions) — transparan di atas tanah
  s3p2_correctOrder.forEach((key, i) => {
    const d = s3p2_itemData[key];
    const slotGroup = new THREE.Group();
    slotGroup.position.set(d.slotX, 0, -3);
    slotGroup.userData.slotKey = key;
    slotGroup.userData.slotIndex = i;
    slotGroup.userData.occupied = false;

    // Platform slot: cincin + platform tipis
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.12, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00bcd4,
        transparent: true,
        opacity: 0.18,
        wireframe: false,
      }),
    );
    platform.position.y = 0.06;
    slotGroup.add(platform);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.1, 8, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00bcd4,
        transparent: true,
        opacity: 0.5,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.13;
    slotGroup.add(ring);

    // Label slot
    const labelDiv = document.createElement("div");
    labelDiv.className = "s3p2-slot-label";
    labelDiv.textContent = `${i + 1}. ${d.role}`;
    labelDiv.style.cssText = `
      position:fixed; color:rgba(0,188,212,0.8); font-size:12px; font-weight:600;
      letter-spacing:1px; text-transform:uppercase; pointer-events:none;
      z-index:50; text-shadow:0 0 8px rgba(0,188,212,0.5);
      background:rgba(0,10,30,0.5); padding:3px 10px; border-radius:10px;
      font-family:'DM Sans',sans-serif;
    `;
    labelDiv.dataset.slotIndex = i;
    document.body.appendChild(labelDiv);

    scene.add(slotGroup);
    s3p2_slots.push({
      key,
      group: slotGroup,
      label: labelDiv,
      occupied: false,
    });
  });

  // Tray item (posisi bawah, urutan TETAP) — zone Z = +6
  // Urutan selalu: plankton → ikanKecil → tuna → hiu (tidak pernah diacak)
  const shuffled = [...s3p2_correctOrder]; // ["plankton", "ikanKecil", "tuna", "hiu"]
  const trayXPositions = [-13.5, -4.5, 4.5, 13.5];

  shuffled.forEach((key, i) => {
    const d = s3p2_itemData[key];
    const group = new THREE.Group();
    group.position.set(trayXPositions[i], 0, 6);
    group.userData.itemKey = key;
    group.userData.originPos = group.position.clone();
    group.userData.floatY = 0.4 + i * 0.1;
    group.userData.baseY = 0;
    group.userData.isS3Item = true;
    group.userData.placed = false;

    // --- UBAH BAGIAN INI: TAMBAHKAN PLATFORM LINGKARAN HIJAU ---
    // 1. Platform Base (Sebagai Hitbox / Area Sentuh Drag yang lebar)
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 2.0, 0.15, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00e676,
        transparent: true,
        opacity: 0.15, // Opacity rendah agar terlihat seperti area energi di air
      }),
    );
    platform.position.y = 0.08;
    group.add(platform);

    // 2. Garis Tepi (Border Ring) Hijau Terang di ujung lingkaran
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.1, 8, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00e676,
        transparent: true,
        opacity: 0.6,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.15;
    group.add(ring);
    group.userData.glowRing = ring;
    // -----------------------------------------------------------

    // Placeholder mesh (akan diganti GLB)
    const placeholder = new THREE.Mesh(
      new THREE.SphereGeometry(1, 12, 12),
      new THREE.MeshPhongMaterial({
        color: 0x2a6040,
        transparent: true,
        opacity: 0.4,
      }),
    );
    placeholder.position.y = 1;
    group.add(placeholder);
    group.userData.placeholder = placeholder;

    scene.add(group);
    s3p2_items.push(group);

    // Load GLB
    loadGLB(d.glbKey, GLB_PATHS[d.glbKey], (model) => {
      fitModelToBox(model, d.targetSize);
      // Terapkan koreksi rotasi agar semua model menghadap arah yang sama seperti hiu
      model.rotation.set(d.rotationX || 0, d.rotationY || 0, d.rotationZ || 0);
      const box = new THREE.Box3().setFromObject(model);
      model.position.y -= box.min.y;
      group.remove(placeholder);
      group.add(model);
      group.userData.model = model;
    });
  });

  // Panah slot (selalu tampil, di atas slot)
  for (let j = 0; j < s3p2_correctOrder.length - 1; j++) {
    const x1 = s3p2_itemData[s3p2_correctOrder[j]].slotX;
    const x2 = s3p2_itemData[s3p2_correctOrder[j + 1]].slotX;
    makeChainArrowZ(x1, x2, 0.2, -3);
  }

  // Reset game state
  s3p2_gameStarted = false;
  s3p2_cameraLocked = false;
  s3p2_timeLeft = 10;
  if (s3p2_timerInterval) {
    clearInterval(s3p2_timerInterval);
    s3p2_timerInterval = null;
  }

  // Inject HUD overlay puzzle (tersembunyi dulu sampai Mulai)
  s3p2_injectHUD();
  const hudEl = document.getElementById("s3p2-hud");
  if (hudEl) hudEl.style.display = "none";

  // JANGAN pasang drag listener dulu — tunggu tombol Mulai
  // s3p2_attachListeners(); ← ditunda

  // Inject tombol "Mulai" di tengah bawah
  s3p2_injectMulaiBtn();

  // Cara bermain — tampil setelah sebentar
  setTimeout(() => {
    showInfo(
      "🎮 Cara Bermain — Part 1",
      "Putar kamera untuk mengamati posisi 4 organisme laut.\n\n" +
        "Tekan ▶ MULAI saat siap!\n\n" +
        "⏱️ Kamu punya 10 detik untuk menyusun:\n" +
        "🦠 Plankton → 🐟 Ikan Kecil → 🐠 Tuna → 🦈 Hiu\n\n" +
        "Drag setiap objek ke zona slot yang sesuai!",
    );
  }, 600);
}

// ── Inject tombol "Mulai" ke tengah bawah layar ──
function s3p2_injectMulaiBtn() {
  const old = document.getElementById("s3p2-mulai-btn");
  if (old) old.remove();

  const btn = document.createElement("button");
  btn.id = "s3p2-mulai-btn";
  btn.innerHTML = "▶ &nbsp;Mulai";
  btn.style.cssText = `
    position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
    z-index:200; padding:15px 48px; border-radius:40px;
    background:rgba(0,230,118,0.15); border:2px solid rgba(0,230,118,0.7);
    color:#00e676; font-size:16px; font-weight:700; letter-spacing:1.5px;
    text-transform:uppercase; cursor:pointer; transition:all 0.3s ease;
    box-shadow:0 0 28px rgba(0,230,118,0.25); font-family:'DM Sans',sans-serif;
    animation: s3p2MulaiBlink 1.4s ease-in-out infinite;
  `;

  // Inject keyframe animation jika belum ada
  if (!document.getElementById("s3p2-keyframes")) {
    const style = document.createElement("style");
    style.id = "s3p2-keyframes";
    style.textContent = `
      @keyframes s3p2MulaiBlink {
        0%,100% { box-shadow:0 0 28px rgba(0,230,118,0.25); }
        50%      { box-shadow:0 0 48px rgba(0,230,118,0.6); }
      }
      @keyframes s3p2TimerPulse {
        0%   { transform:translateX(-50%) scale(1); }
        50%  { transform:translateX(-50%) scale(1.12); }
        100% { transform:translateX(-50%) scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  btn.onmouseover = () => {
    btn.style.background = "rgba(0,230,118,0.28)";
    btn.style.transform = "translateX(-50%) scale(1.05)";
  };
  btn.onmouseout = () => {
    btn.style.background = "rgba(0,230,118,0.15)";
    btn.style.transform = "translateX(-50%) scale(1)";
  };
  btn.onclick = () => s3p2_startChallenge();
  document.body.appendChild(btn);
}

// ── Mulai tantangan: lock kamera, jalankan timer, aktifkan drag ──
function s3p2_startChallenge() {
  // Hapus tombol Mulai
  const btn = document.getElementById("s3p2-mulai-btn");
  if (btn) btn.remove();

  s3p2_gameStarted = true;

  // ── Lock kamera ke posisi tertentu ──
  s3p2_cameraLocked = true;
  orbit.radius = 38; // <--- UBAH INI: Memperbesar angka ini akan men-zoom out kamera
  orbit.phi = 0.75; // <--- UBAH INI: Memperkecil angka ini akan membuat kamera melihat lebih dari atas
  orbit.theta = 0.0; // Biarkan 0.0 agar kamera tetap persis di tengah
  orbit.tx = 0;
  orbit.ty = 2;
  orbit.tz = 0;
  applyOrbit();

  // Animasi smooth transisi kamera (opsional flash fade)
  const fade = document.getElementById("scene-fade");
  if (fade) {
    fade.style.transition = "opacity 0.4s ease";
    fade.style.opacity = "0.4";
    setTimeout(() => {
      fade.style.opacity = "0";
    }, 400);
  }

  // Tampilkan HUD
  const hudEl = document.getElementById("s3p2-hud");
  if (hudEl) hudEl.style.display = "flex";

  // ── Inject timer display ──
  const oldTimer = document.getElementById("s3p2-timer");
  if (oldTimer) oldTimer.remove();
  const timerEl = document.createElement("div");
  timerEl.id = "s3p2-timer";
  timerEl.style.cssText = `
    position:fixed; bottom:88px; left:50%; transform:translateX(-50%);
    z-index:200; font-family:'Syne',sans-serif; font-size:32px; font-weight:800;
    color:#00e676; text-shadow:0 0 20px rgba(0,230,118,0.6);
    letter-spacing:2px; pointer-events:none;
  `;
  timerEl.textContent = "10";
  document.body.appendChild(timerEl);

  // Aktifkan drag listener
  s3p2_attachListeners();

  // Jalankan countdown
  s3p2_timeLeft = 10;
  s3p2_timerInterval = setInterval(() => {
    s3p2_timeLeft--;
    const el = document.getElementById("s3p2-timer");
    if (el) {
      el.textContent = s3p2_timeLeft;
      // Merah saat ≤ 3 detik
      if (s3p2_timeLeft <= 3) {
        el.style.color = "#ff5252";
        el.style.textShadow = "0 0 24px rgba(255,82,82,0.7)";
        el.style.animation = "s3p2TimerPulse 0.5s ease-in-out infinite";
      }
    }
    if (s3p2_timeLeft <= 0) {
      clearInterval(s3p2_timerInterval);
      s3p2_timerInterval = null;
      // Hanya gagal jika belum selesai
      if (s3p2_correct < 4) s3p2_showTimeUp();
    }
  }, 1000);
}

// ── Tampilan waktu habis ──
function s3p2_showTimeUp() {
  s3p2_detachListeners();
  s3p2_cameraLocked = false;

  const timerEl = document.getElementById("s3p2-timer");
  if (timerEl) timerEl.remove();
  const hudEl = document.getElementById("s3p2-hud");
  if (hudEl) hudEl.remove();

  const over = document.createElement("div");
  over.id = "s3p2-timeup";
  over.style.cssText = `
    position:fixed; inset:0; z-index:300; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:20px;
    background:rgba(0,5,20,0.88); font-family:'DM Sans',sans-serif;
  `;
  over.innerHTML = `
    <div style="font-size:64px;">⏱️</div>
    <h2 style="color:#ff5252;font-size:26px;font-weight:800;margin:0;text-shadow:0 0 24px rgba(255,82,82,0.4);">Waktu Habis!</h2>
    <p style="color:rgba(200,220,200,0.7);font-size:14px;max-width:380px;text-align:center;line-height:1.7;margin:0;">
      Kamu berhasil menempatkan <strong style="color:#00e676">${s3p2_correct} / 4</strong> organisme.<br/>
      Coba lagi dan susun rantai makanan dengan benar!
    </p>
    <div style="display:flex;gap:14px;margin-top:8px;flex-wrap:wrap;justify-content:center;">
      <button id="s3p2-retry-tu" style="padding:13px 32px;border-radius:30px;background:rgba(0,230,118,0.1);border:1.5px solid rgba(0,230,118,0.5);color:#00e676;font-size:14px;font-weight:700;cursor:pointer;">🔄 Coba Lagi</button>
    </div>
  `;
  document.body.appendChild(over);

  document.getElementById("s3p2-retry-tu").onclick = () => {
    over.remove();
    s3p2_slots.forEach((s) => {
      if (s.label && s.label.parentNode) s.label.remove();
    });
    s3_loadLayer2();
  };
}

// Panah pada slot (z tetap)
function makeChainArrowZ(x1, x2, y, z) {
  const gap = 3.5;
  const len = x2 - x1 - gap * 2;
  if (len <= 0) return;
  const mid = x1 + gap + len / 2;
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, len, 8),
    new THREE.MeshBasicMaterial({
      color: 0x00bcd4,
      transparent: true,
      opacity: 0.6,
    }),
  );
  shaft.rotation.z = Math.PI / 2;
  shaft.position.set(mid, y, z);
  scene.add(shaft);
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.7, 8),
    new THREE.MeshBasicMaterial({
      color: 0x00bcd4,
      transparent: true,
      opacity: 0.9,
    }),
  );
  head.rotation.z = -Math.PI / 2;
  head.position.set(x2 - gap, y, z);
  scene.add(head);
}

function s3p2_injectHUD() {
  const old = document.getElementById("s3p2-hud");
  if (old) old.remove();
  const hud = document.createElement("div");
  hud.id = "s3p2-hud";
  hud.style.cssText = `
    position:fixed; top:110px; left:50%; transform:translateX(-50%);
    z-index:150; display:flex; gap:20px; align-items:center;
    background:rgba(0,10,30,0.75); border:1px solid rgba(0,188,212,0.25);
    border-radius:40px; padding:10px 28px; font-family:'DM Sans',sans-serif;
  `;
  hud.innerHTML = `
    <span style="color:rgba(0,188,212,0.7);font-size:11px;letter-spacing:2px;text-transform:uppercase;">PROGRESS</span>
    <span id="s3p2-progress" style="color:#00bcd4;font-size:18px;font-weight:700;">0 / 4</span>
    <span style="color:rgba(255,255,255,0.15);font-size:18px;">|</span>
    <span id="s3p2-feedback" style="color:rgba(200,220,200,0.6);font-size:13px;font-style:italic;">Drag objek ke zona yang tepat...</span>
  `;
  document.body.appendChild(hud);
}

function s3p2_updateHUD(msg, color) {
  const prog = document.getElementById("s3p2-progress");
  const fb = document.getElementById("s3p2-feedback");
  if (prog) prog.textContent = `${s3p2_correct} / 4`;
  if (fb) {
    fb.textContent = msg || "";
    if (color) fb.style.color = color;
  }
}

// ── Drag logic untuk Lapisan 2 ──
function s3p2_attachListeners() {
  if (s3p2_listenersOn) return;
  s3p2_listenersOn = true;
  s3p2_raycaster = new THREE.Raycaster();
  const canvas = document.getElementById("c");
  canvas.addEventListener("pointerdown", s3p2_onDown);
  canvas.addEventListener("pointermove", s3p2_onMove);
  canvas.addEventListener("pointerup", s3p2_onUp);
}

function s3p2_detachListeners() {
  s3p2_listenersOn = false;
  const canvas = document.getElementById("c");
  canvas.removeEventListener("pointerdown", s3p2_onDown);
  canvas.removeEventListener("pointermove", s3p2_onMove);
  canvas.removeEventListener("pointerup", s3p2_onUp);
}

function s3p2_getMouse(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  return new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1,
  );
}

function s3p2_onDown(e) {
  if (s3_layer !== 2) return; // standalone: scene index varies
  if (!s3p2_gameStarted) return; // Belum Mulai — objek tidak bisa digerak
  s3p2_raycaster.setFromCamera(s3p2_getMouse(e), camera);
  const draggable = s3p2_items.filter((g) => !g.userData.placed);
  const hits = s3p2_raycaster.intersectObjects(draggable, true);
  if (hits.length === 0) return;
  let obj = hits[0].object;
  while (obj.parent && !obj.userData.isS3Item) obj = obj.parent;
  if (!obj.userData.isS3Item || obj.userData.placed) return;
  s3p2_dragObj = obj;
  s3p2_dragOrigin = obj.position.clone();
  s3p2_isDragging = true;
  if (obj.userData.glowRing) obj.userData.glowRing.material.opacity = 0.6;
}

function s3p2_onMove(e) {
  if (!s3p2_isDragging || !s3p2_dragObj) return;
  // Projeksikan pointer ke bidang Y=2 (mengangkat objek saat drag)
  s3p2_raycaster.setFromCamera(s3p2_getMouse(e), camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -2);
  const pt = new THREE.Vector3();
  s3p2_raycaster.ray.intersectPlane(plane, pt);
  if (pt) s3p2_dragObj.position.set(pt.x, 2, pt.z);
}

function s3p2_onUp(e) {
  if (!s3p2_isDragging || !s3p2_dragObj) return;
  s3p2_isDragging = false;
  const obj = s3p2_dragObj;
  s3p2_dragObj = null;
  if (obj.userData.glowRing) obj.userData.glowRing.material.opacity = 0;

  // Cek apakah mendekati slot yang benar
  let snapped = false;
  for (const slot of s3p2_slots) {
    if (slot.occupied) continue;
    const slotPos = slot.group.position;
    const dist = Math.sqrt(
      Math.pow(obj.position.x - slotPos.x, 2) +
        Math.pow(obj.position.z - slotPos.z, 2),
    );
    if (dist < 3.5) {
      // Masuk zona slot — cek apakah kunci cocok
      if (obj.userData.itemKey === slot.key) {
        // BENAR
        obj.position.set(slotPos.x, 0, slotPos.z);
        obj.userData.placed = true;
        slot.occupied = true;
        s3p2_correct++;
        // Highlight slot berhasil
        slot.group.children.forEach((c) => {
          if (c.material) {
            c.material.color.setHex(0x00e676);
            c.material.opacity = Math.min(c.material.opacity * 2.5, 0.8);
          }
        });
        s3p2_updateHUD(
          `✅ ${s3p2_itemData[obj.userData.itemKey].label} benar!`,
          "#00e676",
        );
        // Glow ring hijau permanen
        if (obj.userData.glowRing) {
          obj.userData.glowRing.material.color.setHex(0x00e676);
          obj.userData.glowRing.material.opacity = 0.5;
        }
        snapped = true;
        if (s3p2_correct === 4) setTimeout(s3p2_showWin, 600);
      } else {
        // SALAH — kembalikan
        obj.position.copy(s3p2_dragOrigin || obj.userData.originPos);
        s3p2_updateHUD("❌ Bukan posisi yang tepat, coba lagi!", "#ff5252");
        snapped = true;
      }
      break;
    }
  }
  if (!snapped) {
    obj.position.copy(obj.userData.originPos);
    s3p2_updateHUD("Drag objek ke zona yang tepat...", "rgba(200,220,200,0.6)");
  }
}

function s3p2_showWin() {
  s3p2_detachListeners();
  s3p2_cameraLocked = false;
  // Hentikan timer
  if (s3p2_timerInterval) {
    clearInterval(s3p2_timerInterval);
    s3p2_timerInterval = null;
  }
  const timerEl = document.getElementById("s3p2-timer");
  if (timerEl) timerEl.remove();
  // Hapus HUD puzzle
  const hud = document.getElementById("s3p2-hud");
  if (hud) hud.remove();
  // Hapus label slot
  s3p2_slots.forEach((s) => {
    if (s.label) s.label.remove();
  });

  // Modal kemenangan
  const win = document.createElement("div");
  win.id = "s3p2-win";
  win.style.cssText = `
    position:fixed; inset:0; z-index:300; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:20px;
    background:rgba(0,5,20,0.85); font-family:'DM Sans',sans-serif;
  `;
  win.innerHTML = `
    <div style="font-size:64px;">🏆</div>
    <h2 style="color:#00e676;font-size:28px;font-weight:800;margin:0;text-shadow:0 0 30px rgba(0,230,118,0.4);">Rantai Makanan Tersusun!</h2>
    <p style="color:rgba(200,240,220,0.7);font-size:15px;max-width:400px;text-align:center;line-height:1.7;margin:0;">
      🦠 Plankton → 🐟 Ikan Kecil → 🐠 Tuna → 🦈 Hiu<br/>
      <em>Setiap tingkat trofik hanya menerima ~10% energi dari tingkat sebelumnya!</em>
    </p>
    <div style="display:flex;gap:16px;margin-top:8px;flex-wrap:wrap;justify-content:center;">
      <button id="s3p2-replay" style="padding:13px 32px;border-radius:30px;background:rgba(0,230,118,0.1);border:1.5px solid rgba(0,230,118,0.5);color:#00e676;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:0.5px;">🔄 Main Lagi?</button>
      <button id="s3p2-other"  style="padding:13px 32px;border-radius:30px;background:rgba(255,171,0,0.15);border:1.5px solid rgba(255,171,0,0.5);color:#ffab00;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:0.5px;">🎮 Main Puzzle Lain?</button>
      <button id="s3p2-next"   style="padding:13px 32px;border-radius:30px;background:rgba(66,165,245,0.15);border:1.5px solid rgba(66,165,245,0.5);color:#42a5f5;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:0.5px;">▶ Lanjut ke Scene 4 ›</button>
    </div>
  `;
  document.body.appendChild(win);

  document.getElementById("s3p2-replay").onclick = () => {
    win.remove();
    // Bersihkan label slot yg tersisa
    s3p2_slots.forEach((s) => {
      if (s.label && s.label.parentNode) s.label.remove();
    });
    s3_loadLayer2();
  };
  document.getElementById("s3p2-other").onclick = () => {
    win.remove();
    s3p2_slots.forEach((s) => {
      if (s.label && s.label.parentNode) s.label.remove();
    });
    window.location.href = 'Scene 3 — Aliran Energi Part-2.html';
  };
  document.getElementById("s3p2-next").onclick = () => {
    win.remove();
    s3p2_slots.forEach((s) => {
      if (s.label && s.label.parentNode) s.label.remove();
    });
    window.location.href = 'scene-4.html'; // navigate to Scene 4
  };
}

// Update posisi label slot setiap frame (dipanggil dari loop)
function s3p2_updateSlotLabels() {
  if (s3_layer !== 2 || currentScene !== 2) return;
  s3p2_slots.forEach((slot, i) => {
    if (!slot.label || !camera || !renderer) return;
    const pos3d = slot.group.position.clone();
    pos3d.y += 3;
    const v = pos3d.project(camera);
    const x = ((v.x + 1) / 2) * window.innerWidth;
    const y = ((-v.y + 1) / 2) * window.innerHeight;
    slot.label.style.left = x + "px";
    slot.label.style.top = y + "px";
    slot.label.style.transform = "translate(-50%, -50%)";
  });
}


// ── Entry point ──
window.addEventListener('DOMContentLoaded', () => {
  currentScene = 3;
  startSceneApp(3);
});
