// ============================================================
// scene-5.js — Scene 5: Prinsip Ramah Lingkungan
// ============================================================
"use strict";

function buildCurrentScene() { buildScene5(); }

// SCENE 5
const principles = [
  {
    label: "♻️ Daur Ulang",
    color: 0x2d9e50,
    desc: "Mengolah kembali sampah menjadi bahan baru. Mengurangi limbah dan polusi.",
    x: -9,
  },
  {
    label: "⚡ Energi Terbarukan",
    color: 0xf4a800,
    desc: "Memanfaatkan matahari, angin, dan air sebagai sumber energi bersih.",
    x: -3,
  },
  {
    label: "💧 Pengelolaan Air",
    color: 0x1565c0,
    desc: "Konservasi air, daur ulang air limbah, dan penangkapan air hujan.",
    x: 3,
  },
  {
    label: "🌳 Ruang Hijau",
    color: 0x1a6b2f,
    desc: "Hutan kota, taman, dan koridor hijau untuk biodiversitas dan oksigen.",
    x: 9,
  },
];

function buildScene5() {
  scene.background = new THREE.Color(0x071520);
  addLight();
  scene.add(makePlane(30, 16, 0x0d2137));
  principles.forEach((p, i) => {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 0.3, 8),
      new THREE.MeshPhongMaterial({
        color: p.color,
        transparent: true,
        opacity: 0.8,
      }),
    );
    pillar.position.set(p.x, 0.15, 0);
    scene.add(pillar);
    const crystal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.8, 3, 8),
      new THREE.MeshPhongMaterial({
        color: p.color,
        transparent: true,
        opacity: 0.7,
        emissive: new THREE.Color(p.color).multiplyScalar(0.3),
      }),
    );
    crystal.position.set(p.x, 1.8, 0);
    crystal.userData.floatY = 0.5 + i * 0.15;
    crystal.userData.baseY = 1.8;
    crystal.userData.rotY = 0.3 + i * 0.1;
    scene.add(crystal);
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 16, 16),
      new THREE.MeshPhongMaterial({
        color: p.color,
        transparent: true,
        opacity: 0.7,
      }),
    );
    top.position.set(p.x, 3.5, 0);
    top.userData.floatY = 0.5 + i * 0.15;
    top.userData.baseY = 3.5;
    top.userData.pulse = true;
    scene.add(top);
    for (let j = 0; j < 3; j++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1 + j * 0.3, 0.05, 8, 24),
        new THREE.MeshBasicMaterial({
          color: p.color,
          transparent: true,
          opacity: 0.3 - j * 0.08,
        }),
      );
      ring.position.set(p.x, 0.3, 0);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
    }
  });
  principles.forEach((p) =>
    addInteractBtn(`Lihat: ${p.label}`, () => showInfo(p.label, p.desc)),
  );
}


window.addEventListener('DOMContentLoaded', () => startSceneApp(6));
