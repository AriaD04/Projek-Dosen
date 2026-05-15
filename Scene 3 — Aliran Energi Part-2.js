// ============================================================
// Scene 3 — Aliran Energi Part-2.js  (REVISED v2)
// Puzzle: Jaring-Jaring Makanan Darat — 8 Organisme
// Fix: gunakan orbit params bukan camera.position (loop override fix)
// ============================================================
"use strict";

function buildCurrentScene() { s3_loadLayer3(); }

// ── Global state ──
let s3p3_slots        = [];
let s3p3_items        = [];
let s3p3_correct      = 0;
let s3p3_dragObj      = null;
let s3p3_isDragging   = false;
let s3p3_raycaster    = null;
let s3p3_listenersOn  = false;
let s3p3_arrows       = [];

// ── Data 8 Organisme — semua pakai GLB baru ──
const S3P3_ITEMS = [
  { key:"trees",       label:"🌳 Pohon",    emoji:"🌳", glbKey:"p3_pohon",    color:0x2e7d32 },
  { key:"grass",       label:"🌿 Rumput",   emoji:"🌿", glbKey:"p3_rumput",   color:0x66bb6a },
  { key:"deer",        label:"🦌 Rusa",     emoji:"🦌", glbKey:"p3_rusa",     color:0x8d6e63 },
  { key:"mouse",       label:"🐭 Tikus",    emoji:"🐭", glbKey:"p3_tikus",    color:0x9e9e9e },
  { key:"grasshopper", label:"🦗 Belalang", emoji:"🦗", glbKey:"p3_belalang", color:0x558b2f },
  { key:"snake",       label:"🐍 Ular",     emoji:"🐍", glbKey:"p3_ular",     color:0x4e342e },
  { key:"frog",        label:"🐸 Katak",    emoji:"🐸", glbKey:"p3_katak",    color:0x388e3c },
  { key:"eagle",       label:"🦅 Elang",    emoji:"🦅", glbKey:"p3_elang",    color:0x5d4037 },
];

// ── Layout slot — level trofik (Z lebih kecil = lebih jauh/atas) ──
// Level 1 (Produsen): Z=7
// Level 2 (Primer):   Z=2
// Level 3 (Sekunder): Z=-4
// Level 4 (Puncak):   Z=-9
const S3P3_SLOTS = [
  { key:"trees",       x:-5.5, z: 7,  level:1 },
  { key:"grass",       x: 5.5, z: 7,  level:1 },
  { key:"deer",        x:-7,   z: 2,  level:2 },
  { key:"mouse",       x: 0,   z: 2,  level:2 },
  { key:"grasshopper", x: 7,   z: 2,  level:2 },
  { key:"snake",       x:-4,   z:-4,  level:3 },
  { key:"frog",        x: 4,   z:-4,  level:3 },
  { key:"eagle",       x: 0,   z:-9,  level:4 },
];

// ── Koneksi panah jaring-jaring makanan ──
const S3P3_ARROWS = [
  ["trees","deer"],
  ["grass","mouse"], ["grass","grasshopper"],
  ["grasshopper","mouse"], ["grasshopper","frog"],
  ["mouse","snake"], ["deer","snake"],
  ["frog","eagle"], ["snake","eagle"], ["mouse","eagle"],
];

const LEVEL_COLORS = { 1:0x00e676, 2:0x42a5f5, 3:0xffab00, 4:0xff5252 };
const TRAY_Z = 13.5;
const TRAY_Y = 0.5;

// ============================================================
// FUNGSI UTAMA
// ============================================================
function s3_loadLayer3() {
  s3_layer = 3;

  // ── Reset state ──
  s3p3_slots   = []; s3p3_items = []; s3p3_correct = 0;
  s3p3_dragObj = null; s3p3_isDragging = false; s3p3_arrows = [];
  s3p3_raycaster = new THREE.Raycaster();

  // ── Bersihkan scene ──
  while (scene && scene.children.length > 0) scene.remove(scene.children[0]);
  // Hapus DOM lama
  ['s3p3-hud','s3p3-levels','s3p3-win'].forEach(id => {
    const el = document.getElementById(id); if (el) el.remove();
  });
  document.querySelectorAll('.s3p3-slot-lbl,.s3p3-item-lbl').forEach(el => el.remove());

  // ── Background & fog ──
  scene.background = new THREE.Color(0x071a0c);
  scene.fog = new THREE.FogExp2(0x071a0c, 0.012);

  // ── Cahaya ──
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(8, 20, 10); dirLight.castShadow = true;
  scene.add(dirLight);
  const fillLight = new THREE.DirectionalLight(0x88ffaa, 0.4);
  fillLight.position.set(-8, 10, -5);
  scene.add(fillLight);

  // ── Tanah ──
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 60),
    new THREE.MeshPhongMaterial({ color:0x1a3a1f, side:THREE.DoubleSide })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid tipis
  const grid = new THREE.GridHelper(70, 24, 0x2a5a2f, 0x1e3a23);
  grid.position.y = 0.01;
  scene.add(grid);

  // Garis pemisah level (dekoratif)
  [6.0, 1.0, -2.5, -7.5].forEach((zLine, i) => {
    const mat = new THREE.LineBasicMaterial({ color:Object.values(LEVEL_COLORS)[i], transparent:true, opacity:0.18 });
    const pts = [new THREE.Vector3(-20, 0.05, zLine), new THREE.Vector3(20, 0.05, zLine)];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    scene.add(new THREE.Line(geo, mat));
  });

  // ── Set kamera via orbit (bukan camera.position langsung!) ──
  orbit.radius = 28;
  orbit.phi    = 1.08;   // sudut dari atas (~62°)
  orbit.theta  = 0.0;    // lurus ke depan
  orbit.tx     = 0;
  orbit.ty     = 1;
  orbit.tz     = 1;      // target sedikit ke depan supaya tray kelihatan
  applyOrbit();

  // ── Buat Slot Target ──
  S3P3_SLOTS.forEach(sd => {
    const col = LEVEL_COLORS[sd.level] || 0x00e676;
    const grp = new THREE.Group();
    grp.position.set(sd.x, 0, sd.z);
    grp.userData.isSlotGroup = true;

    // Platform tipis
    const plat = new THREE.Mesh(
      new THREE.CylinderGeometry(2.3, 2.3, 0.1, 32),
      new THREE.MeshPhongMaterial({ color:col, transparent:true, opacity:0.2, side:THREE.DoubleSide })
    );
    plat.position.y = 0.05;
    grp.add(plat);

    // Ring torus
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.3, 0.1, 8, 48),
      new THREE.MeshPhongMaterial({ color:col, emissive:col, emissiveIntensity:0.35,
        transparent:true, opacity:0.6 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.12;
    grp.add(ring);

    scene.add(grp);

    // Label slot
    const lbl = _s3p3_makeLabel('s3p3-slot-lbl',
      `${S3P3_ITEMS.find(it=>it.key===sd.key)?.emoji || '?'}`,
      'rgba(255,255,255,0.35)', '11px');
    document.body.appendChild(lbl);

    s3p3_slots.push({ key:sd.key, group:grp, platMesh:plat, ringMesh:ring,
      occupied:false, label:lbl, x:sd.x, z:sd.z });
  });

  // ── Panah Jaring-Jaring ──
  _s3p3_drawArrows();

  // ── Label Level Trofik ──
  _s3p3_injectLevelLabels();

  // ── HUD Panduan ──
  _s3p3_injectHUD();

  // ── Spawn Tray Items ──
  _s3p3_spawnTray();

  // ── Pasang Event Drag ──
  if (!s3p3_listenersOn) {
    renderer.domElement.addEventListener('pointerdown', s3p3_onDown);
    renderer.domElement.addEventListener('pointermove', s3p3_onMove);
    renderer.domElement.addEventListener('pointerup',   s3p3_onUp);
    s3p3_listenersOn = true;
  }
}

// ============================================================
// PANAH 3D STATIS
// ============================================================
function _s3p3_drawArrows() {
  const pos = {};
  S3P3_SLOTS.forEach(sd => { pos[sd.key] = new THREE.Vector3(sd.x, 0.3, sd.z); });

  S3P3_ARROWS.forEach(([fk, tk]) => {
    const from = pos[fk]; const to = pos[tk];
    if (!from || !to) return;

    // Kurva bezier dengan sedikit lengkungan
    const mid = from.clone().lerp(to, 0.5).add(
      new THREE.Vector3((Math.random()-0.5)*1.5, 0.3, (Math.random()-0.5)*1.5));
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    const pts   = curve.getPoints(18);

    // Garis
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color:0xff5252, transparent:true, opacity:0.55 })
    );
    scene.add(line); s3p3_arrows.push(line);

    // Kepala panah (kerucut kecil)
    const dir   = new THREE.Vector3().subVectors(to, mid).normalize();
    const cone  = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.5, 8),
      new THREE.MeshPhongMaterial({ color:0xff5252, emissive:0xff1744, emissiveIntensity:0.5 })
    );
    cone.position.copy(to).addScaledVector(dir, -0.35);
    cone.position.y = 0.35;
    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().setY(0).normalize());
    cone.quaternion.copy(quat);
    scene.add(cone); s3p3_arrows.push(cone);
  });
}

// ============================================================
// SPAWN TRAY ITEMS
// ============================================================
function _s3p3_spawnTray() {
  const N = S3P3_ITEMS.length;
  const spacing = 5.0;
  const startX  = -((N-1)*spacing)/2;

  S3P3_ITEMS.forEach((data, i) => {
    const ox = startX + i * spacing;
    const grp = new THREE.Group();
    grp.position.set(ox, TRAY_Y, TRAY_Z);
    grp.userData.key         = data.key;
    grp.userData.locked      = false;
    grp.userData.originalPos = new THREE.Vector3(ox, TRAY_Y, TRAY_Z);

    // ── Hitbox hijau (yang bisa di-drag) ──
    const hitbox = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.1, 0.14, 32),
      new THREE.MeshPhongMaterial({ color:0x00e676, transparent:true, opacity:0.16, side:THREE.DoubleSide })
    );
    hitbox.position.y = -0.15;
    hitbox.userData.isDragHitbox   = true;
    hitbox.userData.parentGroupKey = data.key;
    grp.add(hitbox);

    // Ring hijau di tepi hitbox
    const hitRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.08, 8, 40),
      new THREE.MeshPhongMaterial({ color:0x00e676, transparent:true, opacity:0.38,
        emissive:0x00e676, emissiveIntensity:0.2 })
    );
    hitRing.rotation.x = Math.PI / 2;
    hitRing.position.y = -0.07;
    grp.add(hitRing);
    grp.userData.hitRing = hitRing;

    // ── Model GLB ──
    const glbPath = GLB_PATHS[data.glbKey];
    if (glbPath) {
      loadGLB('p3_' + data.key, glbPath, (model) => {
        if (!grp.parent) return; // group sudah di-remove
        fitModelToBox(model, 2.6);
        model.position.y = 0.5;
        model.traverse(c => { if(c.isMesh){ c.castShadow=true; } });
        grp.add(model);
      });
    } else {
      // Fallback jika GLB belum ada
      const fb = _s3p3_makeFallback(data);
      fb.position.y = 0.5;
      grp.add(fb);
    }

    // ── Label nama di atas ──
    const lbl = _s3p3_makeLabel('s3p3-item-lbl',
      `${data.emoji}<br/><span style="font-size:10px;color:rgba(180,255,200,0.55);">${data.label.replace(/[^ ]* /,'')}</span>`,
      'rgba(255,255,255,0.9)', '12px');
    lbl.dataset.key = data.key;
    document.body.appendChild(lbl);
    grp.userData.label = lbl;

    scene.add(grp);
    s3p3_items.push({
      key:         data.key,
      group:       grp,
      hitbox:      hitbox,
      hitRing:     hitRing,
      originalPos: new THREE.Vector3(ox, TRAY_Y, TRAY_Z),
      locked:      false,
      label:       lbl,
    });
  });
}

// ── Fallback geometry (backup jika GLB gagal load) ──
function _s3p3_makeFallback(data) {
  const mat = new THREE.MeshPhongMaterial({ color:data.color });
  const shapes = {
    trees:       () => { const g=new THREE.Group(); g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.25,1.2,8),mat),{position:{set:()=>{}}}) ); const top=new THREE.Mesh(new THREE.ConeGeometry(0.9,1.5,8),mat); top.position.y=1.5; g.add(top); return g; },
    grass:       () => { const g=new THREE.Group(); for(let i=0;i<6;i++){const s=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.07,0.7+Math.random()*0.5,6),mat);s.position.set((Math.random()-0.5)*0.8,0.4,(Math.random()-0.5)*0.8);g.add(s);} return g; },
    deer:        () => { const g=new THREE.Group(); const b=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.4,1.0),mat); b.position.y=0.7; g.add(b); const h=new THREE.Mesh(new THREE.SphereGeometry(0.28,10,8),mat); h.position.set(0.5,0.95,0); g.add(h); return g; },
    mouse:       () => { const g=new THREE.Group(); const b=new THREE.Mesh(new THREE.SphereGeometry(0.55,14,10),mat); b.position.y=0.6; const h=new THREE.Mesh(new THREE.SphereGeometry(0.35,10,8),mat); h.position.set(0.45,0.8,0); g.add(b,h); return g; },
    grasshopper: () => { const g=new THREE.Group(); const b=new THREE.Mesh(new THREE.CapsuleGeometry?new THREE.CapsuleGeometry(0.2,0.6,4,8):new THREE.BoxGeometry(0.35,0.3,0.8),mat); b.position.y=0.6; b.rotation.z=0.3; g.add(b); return g; },
    snake:       () => { const g=new THREE.Group(); for(let i=0;i<7;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(0.22-i*0.02,8,8),mat); s.position.set(Math.cos(i*0.5)*i*0.25,0.22,Math.sin(i*0.5)*i*0.25); g.add(s);} return g; },
    frog:        () => { const g=new THREE.Group(); const b=new THREE.Mesh(new THREE.SphereGeometry(0.55,14,10),mat); b.scale.y=0.7; b.position.y=0.45; const h=new THREE.Mesh(new THREE.SphereGeometry(0.35,10,8),mat); h.position.set(0.5,0.65,0); g.add(b,h); return g; },
    eagle:       () => { const g=new THREE.Group(); const b=new THREE.Mesh(new THREE.SphereGeometry(0.45,12,10),mat); b.position.y=0.75; const wing1=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.08,0.5),mat); wing1.position.set(0,0.85,0); g.add(b,wing1); return g; },
  };
  return (shapes[data.key] || shapes.mouse)();
}

// ============================================================
// HELPER: Buat label HTML
// ============================================================
function _s3p3_makeLabel(className, html, color, size) {
  const el = document.createElement('div');
  el.className = className;
  el.style.cssText = `
    position:fixed; pointer-events:none; z-index:55;
    font-family:'DM Sans',sans-serif; font-size:${size}; font-weight:700;
    color:${color}; text-align:center; letter-spacing:0.4px;
    text-shadow:0 1px 6px rgba(0,0,0,0.95); transform:translate(-50%,-50%);
    user-select:none;
  `;
  el.innerHTML = html;
  return el;
}

// ============================================================
// HUD & LEVEL LABELS
// ============================================================
function _s3p3_injectHUD() {
  const hud = document.createElement('div');
  hud.id = 's3p3-hud';
  hud.style.cssText = `
    position:fixed; top:88px; right:14px; z-index:60; max-width:210px;
    background:rgba(3,18,8,0.9); border:1.5px solid rgba(0,230,118,0.22);
    border-radius:16px; padding:14px 16px; backdrop-filter:blur(14px);
    font-family:'DM Sans',sans-serif; box-shadow:0 8px 32px rgba(0,0,0,0.5);
  `;
  hud.innerHTML = `
    <div style="font-size:11px;font-weight:800;color:#00e676;letter-spacing:0.8px;
      text-transform:uppercase;margin-bottom:8px;">🕸 Cara Bermain — Part 2</div>
    <div style="font-size:11px;color:rgba(190,240,200,0.65);line-height:1.7;">
      Drag setiap organisme ke<br/>
      <strong style="color:rgba(255,255,255,0.8);">slot yang sesuai</strong><br/>
      di peta jaring-jaring!<br/><br/>
      <span style="color:#00e676;">🌳🌿</span> Produsen → bawah<br/>
      <span style="color:#42a5f5;">🦌🐭🦗</span> Primer → tengah<br/>
      <span style="color:#ffab00;">🐍🐸</span> Sekunder → atas<br/>
      <span style="color:#ff5252;">🦅</span> Puncak → paling atas
    </div>
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(0,230,118,0.14);">
      <div style="font-size:10px;color:rgba(190,240,200,0.45);margin-bottom:3px;">Progress</div>
      <div style="font-size:20px;font-weight:800;color:#00e676;" id="s3p3-score">0 / 8</div>
    </div>
  `;
  document.body.appendChild(hud);
}

function _s3p3_injectLevelLabels() {
  const wrap = document.createElement('div');
  wrap.id = 's3p3-levels';
  wrap.style.cssText = 'position:fixed;left:12px;top:0;height:100%;pointer-events:none;z-index:40;';
  [
    { pct:'74%', text:'Level 4 — Karnivora Puncak',  color:'#ff5252' },
    { pct:'55%', text:'Level 3 — Konsumen Sekunder', color:'#ffab00' },
    { pct:'37%', text:'Level 2 — Konsumen Primer',   color:'#42a5f5' },
    { pct:'19%', text:'Level 1 — Produsen',           color:'#00e676' },
  ].forEach(lv => {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;top:${lv.pct};left:0;transform:translateY(-50%);
      font-family:'Syne',sans-serif;font-size:9.5px;font-weight:700;color:${lv.color};
      letter-spacing:0.8px;text-transform:uppercase;opacity:0.75;white-space:nowrap;
      text-shadow:0 0 10px currentColor;`;
    el.textContent = lv.text;
    wrap.appendChild(el);
  });
  document.body.appendChild(wrap);
}

// ============================================================
// UPDATE LABELS — dipanggil setiap frame
// ============================================================
function s3p3_updateLabels() {
  if (s3_layer !== 3 || !camera || !renderer) return;
  const canvas = renderer.domElement;
  const W = canvas.clientWidth; const H = canvas.clientHeight;

  const project = (pos3d, yOffset) => {
    const p = pos3d.clone(); p.y += yOffset;
    const pr = p.project(camera);
    if (pr.z > 1) return null;
    return { x:(pr.x*0.5+0.5)*W, y:(-pr.y*0.5+0.5)*H };
  };

  s3p3_slots.forEach(slot => {
    if (!slot.label) return;
    if (slot.occupied) { slot.label.style.display='none'; return; }
    const sc = project(slot.group.position, 2.8);
    if (!sc) { slot.label.style.display='none'; return; }
    slot.label.style.display='';
    slot.label.style.left=sc.x+'px'; slot.label.style.top=sc.y+'px';
  });

  s3p3_items.forEach(item => {
    if (!item.label) return;
    if (item.locked) { item.label.style.display='none'; return; }
    const sc = project(item.group.position, 2.8);
    if (!sc) { item.label.style.display='none'; return; }
    item.label.style.display='';
    item.label.style.left=sc.x+'px'; item.label.style.top=sc.y+'px';
  });
}

// Hook ke render loop via override s2_updateZoneLabels
function s2_updateZoneLabels() { s3p3_updateLabels(); }

// ============================================================
// DRAG & DROP
// ============================================================
function _s3p3_ndc(e) {
  const r = renderer.domElement.getBoundingClientRect();
  return new THREE.Vector2(
    ((e.clientX - r.left) / r.width)  * 2 - 1,
    -((e.clientY - r.top)  / r.height) * 2 + 1
  );
}

function _s3p3_groundPt(ndc) {
  s3p3_raycaster.setFromCamera(ndc, camera);
  const plane  = new THREE.Plane(new THREE.Vector3(0,1,0), -0.3);
  const target = new THREE.Vector3();
  s3p3_raycaster.ray.intersectPlane(plane, target);
  return target;
}

function s3p3_onDown(e) {
  if (s3_layer !== 3) return;
  s3p3_raycaster.setFromCamera(_s3p3_ndc(e), camera);
  const hitboxes = s3p3_items.filter(it=>!it.locked).map(it=>it.hitbox);
  const hits = s3p3_raycaster.intersectObjects(hitboxes, false);
  if (!hits.length) return;

  const item = s3p3_items.find(it => it.hitbox === hits[0].object);
  if (!item || item.locked) return;

  s3p3_dragObj    = item;
  s3p3_isDragging = true;
  isDraggingItem  = true; // lock kamera saat drag
  renderer.domElement.setPointerCapture(e.pointerId);

  item.group.position.y = 2.2;
  item.hitbox.material.opacity = 0.45;
  item.hitbox.material.emissive = new THREE.Color(0x00e676);
  item.hitbox.material.emissiveIntensity = 0.5;
  item.hitRing.material.opacity = 0.7;
}

function s3p3_onMove(e) {
  if (!s3p3_isDragging || !s3p3_dragObj || s3_layer !== 3) return;
  const gp = _s3p3_groundPt(_s3p3_ndc(e));
  if (!gp) return;
  s3p3_dragObj.group.position.x = gp.x;
  s3p3_dragObj.group.position.z = gp.z;
  s3p3_dragObj.group.position.y = 2.2;

  // Highlight slot terdekat yang benar
  s3p3_slots.forEach(slot => {
    if (slot.occupied) return;
    const dx = slot.x - gp.x, dz = slot.z - gp.z;
    const near = Math.sqrt(dx*dx+dz*dz) < 3.2 && slot.key === s3p3_dragObj.key;
    slot.platMesh.material.opacity = near ? 0.5 : 0.2;
    slot.ringMesh.material.emissiveIntensity = near ? 1.0 : 0.35;
  });
}

function s3p3_onUp(e) {
  if (!s3p3_isDragging || !s3p3_dragObj || s3_layer !== 3) return;
  s3p3_isDragging = false;
  isDraggingItem  = false;
  const obj = s3p3_dragObj; s3p3_dragObj = null;

  // Reset glow
  obj.hitbox.material.opacity = 0.16;
  obj.hitbox.material.emissiveIntensity = 0;
  obj.hitRing.material.opacity = 0.38;

  // Cari slot cocok
  let snapped = false;
  for (const slot of s3p3_slots) {
    if (slot.occupied) continue;
    const dx = slot.x - obj.group.position.x;
    const dz = slot.z - obj.group.position.z;
    if (Math.sqrt(dx*dx+dz*dz) < 3.2 && slot.key === obj.key) {
      // BENAR
      obj.group.position.set(slot.x, 0.4, slot.z);
      obj.locked = true; slot.occupied = true;
      slot.platMesh.material.color.setHex(0x00e676);
      slot.platMesh.material.opacity = 0.35;
      slot.ringMesh.material.color.setHex(0x00e676);
      slot.ringMesh.material.emissive = new THREE.Color(0x00e676);
      slot.ringMesh.material.emissiveIntensity = 0.8;
      if (slot.label) { slot.label.remove(); slot.label = null; }
      _s3p3_burst(obj.group.position.clone());
      s3p3_correct++;
      const sc = document.getElementById('s3p3-score');
      if (sc) sc.textContent = `${s3p3_correct} / 8`;
      snapped = true;
      if (s3p3_correct === 8) setTimeout(_s3p3_showWin, 900);
      break;
    }
  }

  if (!snapped) {
    // SALAH — kembali ke posisi asal
    const op = obj.originalPos.clone();
    let t = 0;
    const start = obj.group.position.clone();
    const anim = setInterval(() => {
      t += 0.08;
      if (t >= 1) { obj.group.position.copy(op); clearInterval(anim); return; }
      obj.group.position.lerpVectors(start, op, t);
    }, 16);
  }

  // Reset semua highlight
  s3p3_slots.forEach(slot => {
    if (!slot.occupied) {
      slot.platMesh.material.opacity = 0.2;
      slot.ringMesh.material.emissiveIntensity = 0.35;
    }
  });
}

// Partikel sukses
function _s3p3_burst(pos) {
  const colors = [0x00e676, 0x69f0ae, 0xb9f6ca, 0xffd740];
  for (let i=0; i<14; i++) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.08+Math.random()*0.12, 6, 6),
      new THREE.MeshBasicMaterial({ color:colors[i%colors.length], transparent:true, opacity:1 })
    );
    p.position.copy(pos);
    scene.add(p);
    const vx=(Math.random()-0.5)*5, vy=1.5+Math.random()*3, vz=(Math.random()-0.5)*5;
    let tick=0;
    const id = setInterval(()=>{
      p.position.x+=vx*0.04; p.position.y+=vy*0.04-tick*0.004; p.position.z+=vz*0.04;
      p.material.opacity -= 0.045; tick++;
      if (p.material.opacity<=0||tick>28) { clearInterval(id); scene&&scene.remove(p); }
    }, 20);
  }
}

// ============================================================
// WIN MODAL
// ============================================================
function _s3p3_showWin() {
  // Cleanup
  s3p3_slots.forEach(s=>{if(s.label)s.label.remove();});
  s3p3_items.forEach(it=>{if(it.label)it.label.remove();});
  document.querySelectorAll('.s3p3-slot-lbl,.s3p3-item-lbl').forEach(el=>el.remove());
  ['s3p3-hud','s3p3-levels'].forEach(id=>{const el=document.getElementById(id);if(el)el.remove();});
  if (s3p3_listenersOn) {
    renderer.domElement.removeEventListener('pointerdown', s3p3_onDown);
    renderer.domElement.removeEventListener('pointermove', s3p3_onMove);
    renderer.domElement.removeEventListener('pointerup',   s3p3_onUp);
    s3p3_listenersOn = false;
  }

  const win = document.createElement('div');
  win.id = 's3p3-win';
  win.style.cssText = `
    position:fixed;inset:0;z-index:300;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:18px;
    background:rgba(0,8,4,0.9);font-family:'DM Sans',sans-serif;
    backdrop-filter:blur(12px);
  `;
  win.innerHTML = `
    <div style="font-size:60px;">🏆</div>
    <h2 style="color:#00e676;font-size:26px;font-weight:800;margin:0;
      text-shadow:0 0 30px rgba(0,230,118,0.5);">Jaring-Jaring Tersusun!</h2>
    <div style="background:rgba(0,230,118,0.07);border:1px solid rgba(0,230,118,0.2);
      border-radius:16px;padding:16px 28px;max-width:440px;text-align:center;">
      <p style="color:rgba(190,250,210,0.75);font-size:13px;line-height:1.85;margin:0;">
        🌳🌿 Produsen<br/>
        ↓<br/>
        🦌 Rusa &nbsp;·&nbsp; 🐭 Tikus &nbsp;·&nbsp; 🦗 Belalang<br/>
        ↓<br/>
        🐍 Ular &nbsp;·&nbsp; 🐸 Katak<br/>
        ↓<br/>
        🦅 Elang (Puncak)<br/><br/>
        <em style="color:rgba(0,230,118,0.6);font-size:12px;">
          Energi berkurang ~10% di setiap tingkat trofik!
        </em>
      </p>
    </div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-top:4px;">
      <button id="s3p3-replay" style="padding:12px 26px;border-radius:30px;
        background:rgba(0,230,118,0.1);border:1.5px solid rgba(0,230,118,0.5);
        color:#00e676;font-size:13px;font-weight:700;cursor:pointer;
        font-family:'DM Sans',sans-serif;">🔄 Main Lagi?</button>
      <button id="s3p3-next" style="padding:12px 26px;border-radius:30px;
        background:rgba(66,165,245,0.15);border:1.5px solid rgba(66,165,245,0.5);
        color:#42a5f5;font-size:13px;font-weight:700;cursor:pointer;
        font-family:'DM Sans',sans-serif;">▶ Lanjut ke Scene 4 ›</button>
    </div>
  `;
  document.body.appendChild(win);
  document.getElementById('s3p3-replay').onclick = () => { win.remove(); s3_loadLayer3(); };
  document.getElementById('s3p3-next').onclick   = () => { win.remove(); window.location.href='scene-4.html'; };
}

// ── Entry point ──
window.addEventListener('DOMContentLoaded', () => {
  currentScene = 4;
  startSceneApp(4);
});
