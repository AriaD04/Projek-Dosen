// ============================================================
// scene-1.js — Scene 1: Pembuka
// ============================================================
"use strict";

function buildCurrentScene() {
  buildScene1();
}

// ── Fade-in effect for GLB models ──
function fadeInModel(model, delay = 0) {
  model.traverse((c) => {
    if (c.isMesh && c.material) {
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach((m) => { m.transparent = true; m.opacity = 0; });
    }
  });
  let start = null;
  const duration = 1200;
  function tick(ts) {
    if (!start) start = ts + delay;
    const elapsed = ts - start;
    if (elapsed < 0) { requestAnimationFrame(tick); return; }
    const t = Math.min(elapsed / duration, 1);
    model.traverse((c) => {
      if (c.isMesh && c.material) {
        const mats = Array.isArray(c.material) ? c.material : [c.material];
        mats.forEach((m) => { m.opacity = t; if (t >= 1) m.transparent = false; });
      }
    });
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function buildScene1() {
  scene.background = new THREE.Color(0x0a1628);
  addLight();

  const ground = makePlaneTextured(80, 36, "dry", 0x2a1e10);
  scene.add(ground);

  const div = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 10, 36),
    new THREE.MeshBasicMaterial({ color: 0x8a7a6a, transparent: true, opacity: 0.2 })
  );
  div.position.set(0, 5, 0);
  scene.add(div);

  const gH = makePlaneTextured(34, 34, "grass", 0x557a40);
  gH.position.set(-18, 0.01, 0);
  scene.add(gH);

  const gD = makePlaneTextured(34, 34, "dry", 0x8a6a35);
  gD.position.set(18, 0.01, 0);
  scene.add(gD);

  scene1Anchors.healthy = null;
  scene1Anchors.damaged = null;

  loadGLB("lowPolyTree", GLB_PATHS.lowPolyTree, (model) => {
    fitModelToBox(model, 14);
    model.position.set(-22, 0, 2);
    model.rotation.y = Math.PI * 0.1;
    model.traverse((c) => { if (c.isMesh) { c.castShadow=true; c.receiveShadow=true; } });
    fadeInModel(model, 1200);
    if (scene) { scene.add(model); model.userData.isScene1HealthyAnchor = true; scene1Anchors.healthy = model; }
  });

  loadGLB("smallForest", GLB_PATHS.smallForest, (model) => {
    fitModelToBox(model, 13);
    model.position.set(-10, 0, -4);
    model.rotation.y = -Math.PI * 0.15;
    model.traverse((c) => { if (c.isMesh) { c.castShadow=true; c.receiveShadow=true; } });
    fadeInModel(model, 1800);
    if (scene) scene.add(model);
    if (!scene1Anchors.healthy) scene1Anchors.healthy = model;
  });

  loadGLB("coolingTower", GLB_PATHS.coolingTower, (model) => {
    fitModelToBox(model, 18);
    model.position.set(18, 0, 0);
    model.rotation.y = Math.PI * 0.05;
    model.traverse((c) => { if (c.isMesh) { c.castShadow=true; c.receiveShadow=true; } });
    fadeInModel(model, 2400);
    if (scene) { scene.add(model); scene1Anchors.damaged = model; }
    for (let i = 0; i < 20; i++) {
      const sp = new THREE.Mesh(
        new THREE.SphereGeometry(0.25 + Math.random() * 0.4, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.35 })
      );
      sp.position.set(18 + (Math.random()-0.5)*5, 5+i*0.9+Math.random(), (Math.random()-0.5)*4);
      sp.userData.floatY = 0.3 + Math.random() * 0.5;
      sp.userData.baseY = sp.position.y;
      if (scene) scene.add(sp);
    }
  });

  const lab = document.getElementById("scene1-labels");
  if (lab) { lab.style.display = "flex"; }

  addInteractBtn("🌿 Apa Itu Ekosistem?", () =>
    showInfo("Ekosistem", "Sistem ekologi yang terbentuk dari hubungan timbal balik antara makhluk hidup dengan lingkungannya.\n\nKomponen: Biotik + Abiotik"));
  addInteractBtn("🏭 Penyebab Kerusakan", () =>
    showInfo("Kerusakan Ekosistem", "• Polusi udara & air\n• Deforestasi\n• Limbah industri\n• Urbanisasi berlebihan\n• Perubahan iklim"));
  addInteractBtn("🏭 Tentang PLTU", () =>
    showInfo("Pembangkit Listrik Tenaga Uap", "PLTU menggunakan bahan bakar fosil. Dampak:\n• Emisi CO₂ & SO₂\n• Polusi air\n• Hujan asam\n• Pemanasan global"));
}

// ── Entry point ──
window.addEventListener('DOMContentLoaded', () => startSceneApp(0));
