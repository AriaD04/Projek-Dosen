// ============================================================
// scene-8.js — Scene 8: Simulasi Hasil
// ============================================================
"use strict";

function buildCurrentScene() { buildScene8(); }

// SCENE 8
function buildScene8() {
  scene.background = new THREE.Color(0x051020);
  addLight();
  scene.add(makePlane(28, 18, 0x2d6e1e));
  for (let i = 0; i < (builtObjects.tree || 0) + 5; i++)
    scene.add(
      makeTree(
        (Math.random() - 0.5) * 24,
        0,
        (Math.random() - 0.5) * 14,
        Math.random() * 0.8 + 0.7,
      ),
    );
  for (let i = 0; i < (builtObjects.water || 0) + 1; i++)
    scene.add(
      makeWaterPool((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 12),
    );
  for (let i = 0; i < (builtObjects.solar || 0); i++)
    scene.add(
      makeSolarPanel((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 12),
    );
  for (let i = 0; i < 5; i++) {
    const bird = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      new THREE.MeshPhongMaterial({ color: 0x1565c0 }),
    );
    bird.position.set(
      (Math.random() - 0.5) * 20,
      3 + Math.random() * 4,
      (Math.random() - 0.5) * 12,
    );
    bird.userData.floatY = 1 + Math.random() * 0.5;
    bird.userData.baseY = bird.position.y;
    bird.userData.rotY = 0.3 + Math.random() * 0.4;
    scene.add(bird);
  }
  for (let i = 0; i < 20; i++) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.1),
      new THREE.MeshBasicMaterial({
        color: 0x00e676,
        transparent: true,
        opacity: 0.6,
      }),
    );
    p.position.set(
      (Math.random() - 0.5) * 26,
      Math.random() * 6,
      (Math.random() - 0.5) * 16,
    );
    p.userData.floatY = 0.3 + Math.random() * 0.8;
    p.userData.baseY = p.position.y;
    scene.add(p);
  }
  addInteractBtn("⏩ Simulasi Waktu", () =>
    showInfo(
      "Simulasi Berjalan",
      "Hari 1 → Bulan 1 → Tahun 1\n\n✅ Pohon bertumbuh\n✅ Hewan berkembang biak\n✅ Air tetap bersih\n✅ Biodiversitas meningkat\n\nEkosistemmu berkelanjutan! 🎉",
    ),
  );
}


window.addEventListener('DOMContentLoaded', () => startSceneApp(9));
