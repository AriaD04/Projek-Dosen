// ============================================================
// scene-6.js — Scene 6: Tantangan Proyek
// ============================================================
"use strict";

function buildCurrentScene() { buildScene6(); }

// SCENE 6
function buildScene6() {
  scene.background = new THREE.Color(0x0a1628);
  addLight();
  scene.add(makePlane(28, 18, 0x8b6914));
  for (let i = -4; i <= 4; i++) {
    const gl = new THREE.Mesh(
      new THREE.BoxGeometry(28, 0.02, 0.05),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.08,
      }),
    );
    gl.position.set(0, 0.02, i * 2);
    scene.add(gl);
  }
  for (let i = -6; i <= 6; i++) {
    const gl = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.02, 18),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.08,
      }),
    );
    gl.position.set(i * 2, 0.02, 0);
    scene.add(gl);
  }
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(3, 1.5, 2),
    new THREE.MeshPhongMaterial({ color: 0x795548 }),
  );
  box.position.y = 1;
  box.userData.floatY = 0.5;
  box.userData.baseY = 1;
  box.userData.rotY = 0.2;
  scene.add(box);
  addInteractBtn("🚀 Mulai Mendesain!", () => nextScene());
  addInteractBtn("📌 Petunjuk", () =>
    showInfo(
      "Petunjuk Proyek",
      "1. Tambah pohon & tanaman\n2. Buat kolam/sungai\n3. Pasang panel surya\n4. Buat habitat hewan\n5. Capai keseimbangan optimal!",
    ),
  );
}


window.addEventListener('DOMContentLoaded', () => startSceneApp(7));
