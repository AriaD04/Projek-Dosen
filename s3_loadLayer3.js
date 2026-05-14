// ============================================================
// SCENE 3 — Aliran Energi Part-2
// s3_loadLayer3() — Puzzle Jaring-Jaring Makanan Darat
// 8 organisme: Pohon, Rumput, Rusa, Tikus, Belalang, Ular, Katak, Elang
// Mekanik: Drag & Drop 3D dengan snap ke slot target
// ============================================================

// ── State Layer 3 ──
let s3p3_slots = []; // Array { key, group, label, occupied }
let s3p3_items = []; // Array draggable group
let s3p3_correct = 0; // Jumlah item yang sudah di-snap benar
let s3p3_dragObj = null; // Group yang sedang di-drag
let s3p3_dragOrigin = null; // Vector3 posisi asal sebelum drag
let s3p3_isDragging = false;
let s3p3_raycaster = null;
let s3p3_listenersOn = false;
let s3p3_dragPlane = null; // THREE.Plane untuk melacak posisi drag di 3D
const s3p3_TOTAL = 8;

// ── Konfigurasi 8 Organisme & Slot Target ──
// Tata letak 4 tingkatan trofik:
//   Level 1 (Produsen)    z = +3   : Pohon (x=-4), Rumput (x=+4)
//   Level 2 (Konsumen I)  z = 0    : Rusa (x=-8), Tikus (x=0), Belalang (x=+8)
//   Level 3 (Konsumen II) z = -4   : Ular (x=-5), Katak (x=+5)
//   Level 4 (Puncak)      z = -8   : Elang (x=0)
const s3p3_itemData = {
  pohon: {
    label: "🌳 Pohon",
    role: "Produsen",
    glbKey: "pohon",
    targetSize: 3.2,
    slotX: -4,
    slotZ: 3,
    info: "Pohon adalah produsen utama. Mengubah energi matahari menjadi bahan organik melalui fotosintesis.",
  },
  rumput: {
    label: "🌿 Rumput",
    role: "Produsen",
    glbKey: "tanah3", // fallback ke tanah3 jika tidak ada GLB khusus rumput
    targetSize: 2.0,
    slotX: 4,
    slotZ: 3,
    info: "Rumput adalah produsen yang menutupi lantai hutan. Menjadi sumber energi bagi herbivora kecil.",
  },
  rusa: {
    label: "🦌 Rusa",
    role: "Konsumen I",
    glbKey: "rusa",
    targetSize: 3.0,
    slotX: -8,
    slotZ: 0,
    info: "Rusa memakan pohon dan semak. Hanya ~10% energi dari produsen yang tersimpan di tubuh rusa.",
  },
  tikus: {
    label: "🐭 Tikus",
    role: "Konsumen I",
    glbKey: "batu", // fallback ke batu jika tidak ada GLB khusus tikus
    targetSize: 1.8,
    slotX: 0,
    slotZ: 0,
    info: "Tikus memakan biji-bijian dan rumput. Menjadi mangsa bagi ular dan elang.",
  },
  belalang: {
    label: "🦗 Belalang",
    role: "Konsumen I",
    glbKey: "belalang",
    targetSize: 2.0,
    slotX: 8,
    slotZ: 0,
    info: "Belalang memakan daun dan rumput. Konsumen tingkat pertama yang menjadi mangsa katak.",
  },
  ular: {
    label: "🐍 Ular",
    role: "Konsumen II",
    glbKey: "singa", // fallback ke singa jika tidak ada GLB khusus ular
    targetSize: 2.5,
    slotX: -5,
    slotZ: -4,
    info: "Ular memakan tikus dan katak. Konsumen sekunder yang membantu mengendalikan populasi hewan kecil.",
  },
  katak: {
    label: "🐸 Katak",
    role: "Konsumen II",
    glbKey: "air", // fallback ke air jika tidak ada GLB khusus katak
    targetSize: 2.0,
    slotX: 5,
    slotZ: -4,
    info: "Katak memakan belalang. Konsumen sekunder yang juga menjadi mangsa ular dan elang.",
  },
  elang: {
    label: "🦅 Elang",
    role: "Konsumen III (Puncak)",
    glbKey: "elang3",
    targetSize: 3.2,
    slotX: 0,
    slotZ: -8,
    info: "Elang adalah predator puncak. Memakan ular, tikus, dan rusa muda. Menjaga keseimbangan ekosistem.",
  },
};

// ── Koneksi panah (dari → ke) sesuai gambar jaring-jaring makanan ──
// Panah menunjukkan aliran energi: produsen → konsumen
const s3p3_arrows = [
  // Dari produsen (Level 1) ke konsumen I (Level 2)
  { from: "pohon", to: "rusa" },
  { from: "pohon", to: "tikus" },
  { from: "rumput", to: "tikus" },
  { from: "rumput", to: "belalang" },
  // Dari konsumen I ke konsumen II
  { from: "belalang", to: "katak" },
  { from: "tikus", to: "ular" },
  { from: "tikus", to: "elang" },
  // Dari konsumen II ke puncak
  { from: "ular", to: "elang" },
  { from: "katak", to: "ular" },
  // Dari konsumen I langsung ke puncak
  { from: "rusa", to: "ular" },
];

// ── GLB key override: jika ada model khusus, daftarkan di sini ──
// Jika project kamu nanti menambahkan GLB untuk tikus, ular, katak, rumput,
// cukup tambahkan ke GLB_PATHS di app.js dan sesuaikan glbKey di s3p3_itemData.
// Contoh: GLB_PATHS['tikus'] = 'tikus.glb', lalu glbKey: 'tikus'

// ============================================================
// FUNGSI UTAMA — s3_loadLayer3()
// ============================================================
function s3_loadLayer3() {
  s3_layer = 3;

  // ── 1. Reset scene & state ──
  scene = new THREE.Scene();
  sceneObjects = [];
  s3p3_slots = [];
  s3p3_items = [];
  s3p3_correct = 0;
  s3p3_dragObj = null;
  s3p3_dragOrigin = null;
  s3p3_isDragging = false;
  s3p3_listenersOn = false;

  // Bersihkan UI sisa dari layer sebelumnya
  [
    "s3p3-hud",
    "s3p3-win",
    "s3p3-mulai-btn",
    "s3p3-info",
    "s3p2-mulai-btn",
    "s3p2-timer",
    "s3p2-timeup",
    "s3p2-win",
    "s3p2-hud",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  // Bersihkan semua label slot yang mungkin tersisa
  document.querySelectorAll(".s3p3-slot-label").forEach((el) => el.remove());

  // ── 2. Update judul & narasi ──
  document.getElementById("scene-title").textContent =
    "Scene 3 — Aliran Energi Part-2";
  document.getElementById("narasi-text").textContent =
    "Susun jaring-jaring makanan darat! Drag setiap organisme ke slot yang tepat.";
  document.getElementById("interact-ui").innerHTML = "";

  // ── 3. Background & pencahayaan ──
  scene.background = new THREE.Color(0x071a0e);
  addLight();

  // ── 4. Ground — pakai tanah dari layer 1 ──
  loadGLB("tanah3", GLB_PATHS["tanah3"], (model) => {
    fitModelToBox(model, 36);
    const box = new THREE.Box3().setFromObject(model);
    model.position.y -= box.min.y;
    model.position.set(0, -0.5, -2);
    model.rotation.y = Math.PI / 2;
    model.scale.z *= 1.6;
    model.scale.x *= 1.4;
    scene.add(model);
  });

  // ── 5. Buat slot target (8 platform biru) ──
  s3p3_buildSlots();

  // ── 6. Gambar panah statis ──
  s3p3_buildArrows();

  // ── 7. Buat tray draggable items (berjajar di Z = +10) ──
  s3p3_buildTray();

  // ── 8. Inject HUD ──
  s3p3_injectHUD();

  // ── 9. Attach drag listeners ──
  s3p3_attachListeners();

  // ── 10. Posisi kamera ──
  if (camera) {
    camera.position.set(0, 22, 18);
    camera.lookAt(0, 0, -2);
  }

  // ── 11. Instruksi awal ──
  setTimeout(() => {
    showInfo(
      "🎮 Cara Bermain — Jaring Makanan",
      "Di hadapanmu ada 8 organisme yang perlu ditempatkan di posisi yang benar!\n\n" +
        "📌 4 Tingkat Trofik:\n" +
        "🌱 PRODUSEN (Level 1)  — Pohon & Rumput\n" +
        "🦗 KONSUMEN I (Level 2) — Rusa, Tikus, Belalang\n" +
        "🐍 KONSUMEN II (Level 3) — Ular & Katak\n" +
        "🦅 PUNCAK (Level 4)    — Elang\n\n" +
        "👆 Drag alas HIJAU setiap organisme ke platform BIRU yang sesuai!\n" +
        "✅ Benar = terkunci & slot berubah HIJAU\n" +
        "❌ Salah = objek kembali ke tray",
    );
  }, 700);
}

// ============================================================
// BANGUN SLOT TARGET
// ============================================================
function s3p3_buildSlots() {
  Object.keys(s3p3_itemData).forEach((key) => {
    const d = s3p3_itemData[key];
    const group = new THREE.Group();
    group.position.set(d.slotX, 0, d.slotZ);
    group.userData.slotKey = key;
    group.userData.occupied = false;

    // Platform tipis biru transparan
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 2.0, 0.1, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00bcd4,
        transparent: true,
        opacity: 0.2,
      }),
    );
    platform.position.y = 0.05;
    group.add(platform);
    group.userData.platformMesh = platform;

    // Cincin torus biru (tepi slot)
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.09, 8, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00bcd4,
        transparent: true,
        opacity: 0.6,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    group.add(ring);
    group.userData.ringMesh = ring;

    // Cincin dalam lebih kecil (estetika)
    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.05, 8, 24),
      new THREE.MeshBasicMaterial({
        color: 0x00bcd4,
        transparent: true,
        opacity: 0.35,
      }),
    );
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.y = 0.1;
    group.add(innerRing);

    scene.add(group);

    // Label HTML slot
    const labelDiv = document.createElement("div");
    labelDiv.className = "s3p3-slot-label";
    labelDiv.dataset.slotKey = key;
    labelDiv.style.cssText = `
      position:fixed; pointer-events:none; z-index:50;
      color:rgba(0,188,212,0.75); font-size:11px; font-weight:600;
      letter-spacing:1px; text-transform:uppercase;
      text-shadow:0 0 8px rgba(0,188,212,0.5);
      background:rgba(0,10,30,0.55); padding:3px 10px;
      border-radius:10px; font-family:'DM Sans',sans-serif;
      transform:translate(-50%,-50%);
    `;
    labelDiv.textContent = `${d.role}`;
    document.body.appendChild(labelDiv);

    s3p3_slots.push({ key, group, label: labelDiv, occupied: false });
  });
}

// ============================================================
// GAMBAR PANAH STATIS
// ============================================================
function s3p3_buildArrows() {
  s3p3_arrows.forEach(({ from, to }) => {
    const df = s3p3_itemData[from];
    const dt = s3p3_itemData[to];
    if (!df || !dt) return;
    s3p3_makeArrow3D(
      new THREE.Vector3(df.slotX, 0.25, df.slotZ),
      new THREE.Vector3(dt.slotX, 0.25, dt.slotZ),
    );
  });
}

// Menggambar panah 3D dari posisi A ke B (di atas tanah)
function s3p3_makeArrow3D(from, to) {
  const dir = new THREE.Vector3().subVectors(to, from);
  const length = dir.length();
  if (length < 0.5) return;

  const GAP = 2.5; // jarak dari pusat objek ke awal/akhir shaft
  const shaftLen = length - GAP * 2;
  if (shaftLen <= 0) return;

  const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);

  // Material panah merah-oranye
  const matShaft = new THREE.MeshBasicMaterial({
    color: 0xff4500,
    transparent: true,
    opacity: 0.75,
  });
  const matHead = new THREE.MeshBasicMaterial({
    color: 0xff4500,
    transparent: true,
    opacity: 0.9,
  });

  // Shaft (silinder panjang)
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, shaftLen, 8),
    matShaft,
  );

  // Rotasi agar mengikuti arah dari → to
  const normDir = dir.clone().normalize();
  // CylinderGeometry defaultnya sejajar sumbu Y; kita perlu mengarahkannya ke normDir
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normDir);
  shaft.setRotationFromQuaternion(quaternion);
  shaft.position.copy(mid);
  scene.add(shaft);

  // Kepala panah (cone) di ujung dekat 'to'
  const headPos = to.clone().sub(normDir.clone().multiplyScalar(GAP));
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 8), matHead);
  head.setRotationFromQuaternion(quaternion);
  head.position.copy(headPos);
  scene.add(head);
}

// ============================================================
// BANGUN TRAY DRAGGABLE ITEMS
// ============================================================
function s3p3_buildTray() {
  const keys = Object.keys(s3p3_itemData);
  const count = keys.length; // 8
  const spacing = 5.5;
  const totalWidth = (count - 1) * spacing;
  const startX = -totalWidth / 2;
  const trayZ = 13; // Dekat kamera

  keys.forEach((key, i) => {
    const d = s3p3_itemData[key];
    const group = new THREE.Group();
    const originX = startX + i * spacing;
    group.position.set(originX, 0, trayZ);
    group.userData.itemKey = key;
    group.userData.originPos = new THREE.Vector3(originX, 0, trayZ);
    group.userData.floatY = 0.4 + (i % 4) * 0.1;
    group.userData.baseY = 0;
    group.userData.isS3p3Item = true;
    group.userData.placed = false;

    // ── Hitbox hijau (alas drag) ──
    const hitbox = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 2.0, 0.15, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00e676,
        transparent: true,
        opacity: 0.15,
      }),
    );
    hitbox.position.y = 0.08;
    hitbox.userData.isHitbox = true;
    group.add(hitbox);
    group.userData.hitbox = hitbox;

    // Cincin tepi hijau (border ring)
    const glowRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.1, 8, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00e676,
        transparent: true,
        opacity: 0.65,
      }),
    );
    glowRing.rotation.x = Math.PI / 2;
    glowRing.position.y = 0.15;
    group.add(glowRing);
    group.userData.glowRing = glowRing;

    // Cincin dalam hijau kecil
    const innerGlow = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.05, 8, 24),
      new THREE.MeshBasicMaterial({
        color: 0x00e676,
        transparent: true,
        opacity: 0.4,
      }),
    );
    innerGlow.rotation.x = Math.PI / 2;
    innerGlow.position.y = 0.15;
    group.add(innerGlow);

    // Placeholder sphere (ditampilkan sampai GLB selesai dimuat)
    const placeholder = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 12, 12),
      new THREE.MeshPhongMaterial({
        color: s3p3_getPlaceholderColor(key),
        transparent: true,
        opacity: 0.5,
      }),
    );
    placeholder.position.y = 1.2;
    group.add(placeholder);
    group.userData.placeholder = placeholder;

    scene.add(group);
    s3p3_items.push(group);

    // ── Load GLB model ──
    loadGLB(d.glbKey, GLB_PATHS[d.glbKey], (model) => {
      fitModelToBox(model, d.targetSize);
      const box = new THREE.Box3().setFromObject(model);
      model.position.y -= box.min.y;
      group.remove(placeholder);
      group.add(model);
      group.userData.model = model;
    });
  });
}

// Warna placeholder berbeda-beda per organisme
function s3p3_getPlaceholderColor(key) {
  const colors = {
    pohon: 0x2d9e50,
    rumput: 0x4ecf70,
    rusa: 0xa0522d,
    tikus: 0x888888,
    belalang: 0x80a040,
    ular: 0x5a8a3c,
    katak: 0x3a7a3a,
    elang: 0x8b6914,
  };
  return colors[key] || 0x44aa66;
}

// ============================================================
// HUD OVERLAY
// ============================================================
function s3p3_injectHUD() {
  const old = document.getElementById("s3p3-hud");
  if (old) old.remove();

  const hud = document.createElement("div");
  hud.id = "s3p3-hud";
  hud.style.cssText = `
    position:fixed; top:110px; left:50%; transform:translateX(-50%);
    z-index:150; display:flex; gap:18px; align-items:center;
    background:rgba(0,10,30,0.78); border:1px solid rgba(0,230,118,0.22);
    border-radius:40px; padding:10px 28px; font-family:'DM Sans',sans-serif;
    backdrop-filter:blur(6px);
  `;
  hud.innerHTML = `
    <span style="color:rgba(0,230,118,0.7);font-size:11px;letter-spacing:2px;text-transform:uppercase;">PROGRESS</span>
    <span id="s3p3-progress" style="color:#00e676;font-size:18px;font-weight:700;">0 / ${s3p3_TOTAL}</span>
    <span style="color:rgba(255,255,255,0.15);font-size:18px;">|</span>
    <span id="s3p3-feedback" style="color:rgba(200,220,200,0.65);font-size:13px;font-style:italic;">
      Drag organisme ke posisi trofik yang tepat!
    </span>
  `;
  document.body.appendChild(hud);
}

function s3p3_updateHUD(msg, color) {
  const prog = document.getElementById("s3p3-progress");
  const fb = document.getElementById("s3p3-feedback");
  if (prog) prog.textContent = `${s3p3_correct} / ${s3p3_TOTAL}`;
  if (fb) {
    if (msg) fb.textContent = msg;
    if (color) fb.style.color = color;
  }
}

// ============================================================
// UPDATE LABEL SLOT (dipanggil setiap frame dari loop animasi)
// ============================================================
function s3p3_updateSlotLabels() {
  if (s3_layer !== 3 || currentScene !== 2) return;
  s3p3_slots.forEach((slot) => {
    if (!slot.label || !camera || !renderer) return;
    const pos3d = slot.group.position.clone();
    pos3d.y += 2.5;
    const v = pos3d.project(camera);
    const x = ((v.x + 1) / 2) * window.innerWidth;
    const y = ((-v.y + 1) / 2) * window.innerHeight;
    slot.label.style.left = x + "px";
    slot.label.style.top = y + "px";
  });
}

// ============================================================
// DRAG & DROP — EVENT LISTENERS
// ============================================================
function s3p3_attachListeners() {
  if (s3p3_listenersOn) return;
  s3p3_listenersOn = true;
  s3p3_raycaster = new THREE.Raycaster();
  const canvas = document.getElementById("c");
  canvas.addEventListener("pointerdown", s3p3_onDown);
  canvas.addEventListener("pointermove", s3p3_onMove);
  canvas.addEventListener("pointerup", s3p3_onUp);
}

function s3p3_detachListeners() {
  if (!s3p3_listenersOn) return;
  s3p3_listenersOn = false;
  const canvas = document.getElementById("c");
  canvas.removeEventListener("pointerdown", s3p3_onDown);
  canvas.removeEventListener("pointermove", s3p3_onMove);
  canvas.removeEventListener("pointerup", s3p3_onUp);
}

// ── Pointer Down: mulai drag jika kena hitbox hijau ──
function s3p3_onDown(e) {
  if (currentScene !== 2 || s3_layer !== 3) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  s3p3_raycaster.setFromCamera({ x: mx, y: my }, camera);

  // Kumpulkan semua hitbox dari items yang belum ditempatkan
  const hitboxes = [];
  s3p3_items.forEach((grp) => {
    if (!grp.userData.placed && grp.userData.hitbox) {
      hitboxes.push(grp.userData.hitbox);
    }
  });

  const hits = s3p3_raycaster.intersectObjects(hitboxes, true);
  if (hits.length === 0) return;

  // Naiki ke parent Group
  let hitObj = hits[0].object;
  while (hitObj.parent && !hitObj.userData.isS3p3Item) hitObj = hitObj.parent;
  if (!hitObj.userData.isS3p3Item) return;

  s3p3_dragObj = hitObj;
  s3p3_dragOrigin = hitObj.position.clone();
  s3p3_isDragging = true;

  // Naikkan sedikit saat di-drag
  s3p3_dragObj.position.y = 1.2;

  // Highlight glowRing
  if (s3p3_dragObj.userData.glowRing) {
    s3p3_dragObj.userData.glowRing.material.color.setHex(0xffffff);
    s3p3_dragObj.userData.glowRing.material.opacity = 0.9;
  }

  // Buat drag plane horizontal di ketinggian Y=1.2
  s3p3_dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.2);
}

// ── Pointer Move: gerakkan objek mengikuti pointer di bidang horizontal ──
function s3p3_onMove(e) {
  if (!s3p3_isDragging || !s3p3_dragObj) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  s3p3_raycaster.setFromCamera({ x: mx, y: my }, camera);

  const target = new THREE.Vector3();
  s3p3_raycaster.ray.intersectPlane(s3p3_dragPlane, target);
  if (target) {
    s3p3_dragObj.position.x = target.x;
    s3p3_dragObj.position.z = target.z;
    s3p3_dragObj.position.y = 1.2;
  }

  // Highlight slot terdekat saat hover
  s3p3_highlightNearestSlot(s3p3_dragObj.position);
}

// ── Pointer Up: cek snap ke slot ──
function s3p3_onUp(e) {
  if (!s3p3_isDragging || !s3p3_dragObj) return;
  s3p3_isDragging = false;

  const obj = s3p3_dragObj;
  s3p3_dragObj = null;

  // Kembalikan glowRing ke normal
  if (obj.userData.glowRing) {
    obj.userData.glowRing.material.color.setHex(0x00e676);
    obj.userData.glowRing.material.opacity = 0.65;
  }

  // Reset highlight semua slot
  s3p3_resetSlotHighlights();

  // Cek jarak ke setiap slot
  const SNAP_DIST = 3.5;
  let snapped = false;

  for (const slot of s3p3_slots) {
    if (slot.occupied) continue;
    const slotPos = slot.group.position;
    const dx = obj.position.x - slotPos.x;
    const dz = obj.position.z - slotPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < SNAP_DIST) {
      // ── Drop di slot ini — cek apakah kunci cocok ──
      if (obj.userData.itemKey === slot.key) {
        // ✅ BENAR — snap ke slot
        obj.position.set(slotPos.x, 0, slotPos.z);
        obj.userData.placed = true;
        slot.occupied = true;
        s3p3_correct++;

        // Nonaktifkan hitbox agar tidak bisa di-drag lagi
        if (obj.userData.hitbox) {
          obj.userData.hitbox.material.opacity = 0;
          obj.userData.glowRing.material.opacity = 0;
          obj.userData.hitbox.userData.isHitbox = false;
        }

        // Warnai slot menjadi hijau terang
        s3p3_colorSlotCorrect(slot);

        // Animasi bounce kecil
        s3p3_bounceObject(obj);

        // Feedback
        const label = s3p3_itemData[slot.key].label;
        s3p3_updateHUD(
          `✅ ${label} benar! (+${s3p3_correct}/${s3p3_TOTAL})`,
          "#00e676",
        );

        // Show info singkat
        setTimeout(() => {
          showInfo(label, s3p3_itemData[slot.key].info);
        }, 300);

        snapped = true;

        // Cek win
        if (s3p3_correct >= s3p3_TOTAL) {
          setTimeout(s3p3_showWin, 800);
        }
      } else {
        // ❌ SALAH — kembalikan ke tray
        s3p3_returnToOrigin(obj);
        const wrongLabel = s3p3_itemData[slot.key]
          ? s3p3_itemData[slot.key].role
          : "slot itu";
        s3p3_updateHUD(`❌ Bukan posisi yang tepat! Coba lagi.`, "#ff5252");
        snapped = true;
      }
      break;
    }
  }

  if (!snapped) {
    // Tidak mendekati slot manapun — kembalikan ke tray
    s3p3_returnToOrigin(obj);
    s3p3_updateHUD(
      "Drag objek lebih dekat ke platform biru yang sesuai...",
      "rgba(200,220,200,0.6)",
    );
  }
}

// ── Warnai slot menjadi hijau (saat berhasil) ──
function s3p3_colorSlotCorrect(slot) {
  if (slot.group.userData.platformMesh) {
    slot.group.userData.platformMesh.material.color.setHex(0x00e676);
    slot.group.userData.platformMesh.material.opacity = 0.3;
  }
  if (slot.group.userData.ringMesh) {
    slot.group.userData.ringMesh.material.color.setHex(0x00e676);
    slot.group.userData.ringMesh.material.opacity = 0.9;
  }
}

// ── Highlight slot terdekat saat drag melayang ──
function s3p3_highlightNearestSlot(pos) {
  let nearestSlot = null;
  let nearestDist = Infinity;
  s3p3_slots.forEach((slot) => {
    if (slot.occupied) return;
    const dx = pos.x - slot.group.position.x;
    const dz = pos.z - slot.group.position.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < nearestDist) {
      nearestDist = d;
      nearestSlot = slot;
    }
  });
  s3p3_slots.forEach((slot) => {
    if (slot.occupied) return;
    const isNearest = slot === nearestSlot && nearestDist < 4.0;
    slot.group.userData.platformMesh &&
      (slot.group.userData.platformMesh.material.opacity = isNearest
        ? 0.35
        : 0.2);
    slot.group.userData.ringMesh &&
      (slot.group.userData.ringMesh.material.opacity = isNearest ? 0.9 : 0.6);
  });
}

// ── Reset semua highlight slot ──
function s3p3_resetSlotHighlights() {
  s3p3_slots.forEach((slot) => {
    if (slot.occupied) return;
    slot.group.userData.platformMesh &&
      (slot.group.userData.platformMesh.material.opacity = 0.2);
    slot.group.userData.ringMesh &&
      (slot.group.userData.ringMesh.material.opacity = 0.6);
  });
}

// ── Kembalikan objek ke tray dengan animasi smooth ──
function s3p3_returnToOrigin(obj) {
  const origin = obj.userData.originPos;
  const start = obj.position.clone();
  const t0 = performance.now();
  const dur = 400;
  function tick(ts) {
    const t = Math.min((ts - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
    obj.position.lerpVectors(start, origin, ease);
    obj.position.y = Math.max(origin.y, start.y * (1 - ease)); // turun halus
    if (t < 1) requestAnimationFrame(tick);
    else obj.position.copy(origin);
  }
  requestAnimationFrame(tick);
}

// ── Animasi bounce kecil saat snap berhasil ──
function s3p3_bounceObject(obj) {
  const baseY = obj.position.y;
  const t0 = performance.now();
  function tick(ts) {
    const t = (ts - t0) / 500;
    if (t >= 1) {
      obj.position.y = baseY;
      return;
    }
    obj.position.y = baseY + Math.sin(t * Math.PI) * 0.8;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ============================================================
// WIN SCREEN
// ============================================================
function s3p3_showWin() {
  s3p3_detachListeners();

  // Hapus HUD
  const hud = document.getElementById("s3p3-hud");
  if (hud) hud.remove();
  // Hapus label slot
  s3p3_slots.forEach((s) => {
    if (s.label && s.label.parentNode) s.label.remove();
  });

  const win = document.createElement("div");
  win.id = "s3p3-win";
  win.style.cssText = `
    position:fixed; inset:0; z-index:300; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:20px;
    background:rgba(0,5,20,0.88); font-family:'DM Sans',sans-serif;
  `;
  win.innerHTML = `
    <div style="font-size:68px;animation:s3p3-pop 0.5s ease-out;">🏆</div>
    <h2 style="color:#00e676;font-size:28px;font-weight:800;margin:0;
      text-shadow:0 0 30px rgba(0,230,118,0.5);">Jaring Makanan Tersusun!</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;
      max-width:460px;width:90%;margin-top:4px;">
      <div style="background:rgba(0,230,118,0.06);border:1px solid rgba(0,230,118,0.2);
        border-radius:12px;padding:12px 16px;text-align:center;">
        <div style="font-size:26px;">🌳🌿</div>
        <div style="color:#00e676;font-size:12px;margin-top:4px;letter-spacing:1px;">PRODUSEN</div>
        <div style="color:rgba(200,240,210,0.7);font-size:11px;">Pohon & Rumput</div>
      </div>
      <div style="background:rgba(66,165,245,0.06);border:1px solid rgba(66,165,245,0.2);
        border-radius:12px;padding:12px 16px;text-align:center;">
        <div style="font-size:26px;">🦌🐭🦗</div>
        <div style="color:#42a5f5;font-size:12px;margin-top:4px;letter-spacing:1px;">KONSUMEN I</div>
        <div style="color:rgba(200,240,210,0.7);font-size:11px;">Rusa, Tikus, Belalang</div>
      </div>
      <div style="background:rgba(255,152,0,0.06);border:1px solid rgba(255,152,0,0.2);
        border-radius:12px;padding:12px 16px;text-align:center;">
        <div style="font-size:26px;">🐍🐸</div>
        <div style="color:#ff9800;font-size:12px;margin-top:4px;letter-spacing:1px;">KONSUMEN II</div>
        <div style="color:rgba(200,240,210,0.7);font-size:11px;">Ular & Katak</div>
      </div>
      <div style="background:rgba(255,82,82,0.06);border:1px solid rgba(255,82,82,0.2);
        border-radius:12px;padding:12px 16px;text-align:center;">
        <div style="font-size:26px;">🦅</div>
        <div style="color:#ff5252;font-size:12px;margin-top:4px;letter-spacing:1px;">PREDATOR PUNCAK</div>
        <div style="color:rgba(200,240,210,0.7);font-size:11px;">Elang</div>
      </div>
    </div>
    <p style="color:rgba(200,240,220,0.65);font-size:14px;max-width:420px;
      text-align:center;line-height:1.75;margin:0;">
      Setiap tingkat trofik hanya menerima <strong style="color:#ffca28;">~10% energi</strong>
      dari tingkat di bawahnya.<br/>
      <em>Itulah mengapa predator puncak selalu paling sedikit jumlahnya!</em>
    </p>
    <div style="display:flex;gap:16px;margin-top:8px;flex-wrap:wrap;justify-content:center;">
      <button id="s3p3-replay" style="padding:13px 32px;border-radius:30px;
        background:rgba(0,230,118,0.1);border:1.5px solid rgba(0,230,118,0.5);
        color:#00e676;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:0.5px;">
        🔄 Main Lagi
      </button>
      <button id="s3p3-next" style="padding:13px 32px;border-radius:30px;
        background:rgba(66,165,245,0.15);border:1.5px solid rgba(66,165,245,0.5);
        color:#42a5f5;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:0.5px;">
        ▶ Lanjut ke Scene 4 ›
      </button>
    </div>
  `;
  document.body.appendChild(win);

  // Inject animasi pop kalau belum ada
  if (!document.getElementById("s3p3-keyframes")) {
    const style = document.createElement("style");
    style.id = "s3p3-keyframes";
    style.textContent = `
      @keyframes s3p3-pop {
        0%   { transform: scale(0.3); opacity:0; }
        60%  { transform: scale(1.2); opacity:1; }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  document.getElementById("s3p3-replay").onclick = () => {
    win.remove();
    // Bersihkan label yang tersisa
    document.querySelectorAll(".s3p3-slot-label").forEach((el) => el.remove());
    s3_loadLayer3();
  };
  document.getElementById("s3p3-next").onclick = () => {
    win.remove();
    document.querySelectorAll(".s3p3-slot-label").forEach((el) => el.remove());
    loadScene(3); // Lanjut ke Scene 4
  };

  // Particle burst perayaan
  for (let j = 0; j < 4; j++) {
    setTimeout(() => {
      const colors = ["#00e676", "#42a5f5", "#ffca28", "#ff9800"];
      for (let i = 0; i < 20; i++) {
        const p = document.createElement("div");
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 8 + Math.random() * 10;
        const angle = Math.random() * Math.PI * 2;
        const dist = 120 + Math.random() * 200;
        p.style.cssText = `
          width:${size}px;height:${size}px;background:${color};
          left:${window.innerWidth / 2}px;top:${window.innerHeight / 2}px;
          --dx:${Math.cos(angle) * dist}px;--dy:${Math.sin(angle) * dist}px;
          border-radius:50%;position:fixed;z-index:9999;
          animation:s2p-burst 1s ease-out forwards;
        `;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1200);
      }
    }, j * 250);
  }
}

// ============================================================
// INTEGRASI KE LOOP ANIMASI UTAMA
// Tambahkan baris berikut di dalam fungsi loop() / render() kamu,
// di tempat yang sudah ada s3p2_updateSlotLabels():
//
//   s3p3_updateSlotLabels();
//
// ============================================================

// ============================================================
// INTEGRASI KE s3_loadLayer2() WIN SCREEN
// Di dalam s3p2_showWin(), tombol "Lanjut" cukup panggil:
//   s3_loadLayer3();
// daripada loadScene(3), agar Part-2 tetap di Scene 3.
//
// Contoh:
//   document.getElementById("s3p2-next").onclick = () => {
//     win.remove();
//     s3p2_slots.forEach(s => { if (s.label && s.label.parentNode) s.label.remove(); });
//     s3_loadLayer3(); // ← ganti dari loadScene(3)
//   };
// ============================================================
