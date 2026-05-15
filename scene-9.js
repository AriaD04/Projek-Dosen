// ============================================================
// scene-9.js — Scene 9: Evaluasi & Refleksi
// ============================================================
"use strict";

function buildCurrentScene() { buildScene9(); }

// SCENE 9
function buildScene9() {
  scene.background = new THREE.Color(0x0a1628);
  addLight();
  const total = Object.values(builtObjects).reduce((a, b) => a + b, 0);
  const flora = builtObjects.tree + builtObjects.bush;
  const fauna = builtObjects.animal;
  const energy = builtObjects.solar;
  const sc1 = Math.min(
    Math.round(((flora + fauna) / Math.max(total, 1)) * 100 + 20),
    100,
  );
  const sc2 = Math.min(
    Math.round((fauna / Math.max(total, 1)) * 300 + total * 5),
    100,
  );
  const sc3 = Math.min(
    Math.round((energy / Math.max(total, 1)) * 300 + flora * 3),
    100,
  );
  setTimeout(() => {
    document.getElementById("score-ui").style.display = "flex";
    animScore("s1", sc1);
    animScore("s2", sc2);
    animScore("s3", sc3);
  }, 500);
}

function animScore(id, target) {
  let val = 0;
  const el = document.getElementById(id);
  const step = Math.max(1, Math.floor(target / 40));
  const iv = setInterval(() => {
    val = Math.min(val + step, target);
    el.textContent = val + "%";
    if (val >= target) clearInterval(iv);
  }, 50);
}


window.addEventListener('DOMContentLoaded', () => startSceneApp(10));
