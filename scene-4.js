// ============================================================
// scene-4.js — Scene 4: Dampak Manusia
// ============================================================
"use strict";

// ── Override prevScene: scene-4 goes back to scene-3 (bukan Part-2) ──
function prevScene() {
  try { localStorage.setItem('ar_builtObjects', JSON.stringify(builtObjects)); } catch(e){}
  window.location.href = 'scene-3.html';
}

function buildCurrentScene() { buildScene4(); }

// SCENE 4
function buildScene4() {
  scene.background = new THREE.Color(0x1a1a2e);
  addLight();
  scene.add(makePlane(30, 20, 0x2d5a1b));
  damagedTrees = [];
  for (let i = 0; i < 12; i++) {
    const t = makeTree(
      (Math.random() - 0.5) * 24,
      0,
      (Math.random() - 0.5) * 16,
    );
    damagedTrees.push(t);
    scene.add(t);
  }
  const lake = makePlane(6, 4, 0x1565c0);
  lake.position.set(-5, 0.02, 3);
  scene.add(lake);
  document.getElementById("slider-ui").style.display = "block";
  document.getElementById("dmg-slider").value = 0;
  // hapus baris ini atau ganti jadi:
  document.getElementById("dmg-label").textContent = "0% — Ekosistem Normal ✅";
  document.getElementById("dmg-label").textContent = "Ekosistem Normal ✅";
  dmgLevel = 0;
}

function updateDamage(v) {
  dmgLevel = parseInt(v);
  // percentage shown in dmg-label below
  const ratio = dmgLevel / 100;
  damagedTrees.forEach((t, i) => {
    const deadAt = (i / damagedTrees.length) * 0.8;
    t.traverse((c) => {
      if (c.material && c.geometry && c.geometry.type === "ConeGeometry")
        c.material.color.setHex(ratio > deadAt ? 0x5a3a1b : 0x2d9e50);
    });
  });
  let s = "✅ Ekosistem Normal";
  if (ratio > 0.3) s = "⚠️ Mulai Terganggu";
  if (ratio > 0.6) s = "⚠️ Kritis — Pencemaran Tinggi";
  if (ratio > 0.85) s = "❌ Rusak Parah";
  document.getElementById("dmg-label").textContent = s;
}

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


function onDmgSlider(v) { updateDamage(v); }

window.addEventListener('DOMContentLoaded', () => startSceneApp(5));
