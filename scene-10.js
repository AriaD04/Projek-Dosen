// ============================================================
// scene-10.js — Scene 10: Penutup
// ============================================================
"use strict";

function buildCurrentScene() { buildScene10(); }

// SCENE 10
function buildScene10() {
  scene.background = new THREE.Color(0x000000);
  addLight();
  setTimeout(() => {
    document.getElementById("outro").style.display = "flex";
  }, 300);
}


window.addEventListener('DOMContentLoaded', () => startSceneApp(11));
