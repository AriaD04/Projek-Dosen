// ============================================================
// scene-7.js — Scene 7: Desain Ekosistem (Builder)
// ============================================================
"use strict";

function buildCurrentScene() { buildScene7(); }

// SCENE 7
function buildScene7() {
  scene.background = new THREE.Color(0x0a1628);
  addLight();
  scene.add(makePlane(28, 18, 0x4a7c2f));
  document.getElementById("builder-ui").style.display = "block";
  document.getElementById("balance-meter").style.display = "block";
  placedObjects = [];
  updateBalance();
  addInteractBtn("🗑️ Reset Desain", () => {
    placedObjects = [];
    builtObjects = {
      tree: 0,
      water: 0,
      solar: 0,
      animal: 0,
      bush: 0,
      building: 0,
    };
    buildScene7();
  });
}

function addObject(type) {
  builtObjects[type] = (builtObjects[type] || 0) + 1;
  const pos = { x: (Math.random() - 0.5) * 24, z: (Math.random() - 0.5) * 14 };
  let obj;
  switch (type) {
    case "tree":
      obj = makeTree(pos.x, 0, pos.z, Math.random() * 0.6 + 0.8);
      break;
    case "water":
      obj = makeWaterPool(pos.x, pos.z);
      break;
    case "solar":
      obj = makeSolarPanel(pos.x, pos.z);
      break;
    case "animal":
      obj = makeAnimalHabitat(pos.x, pos.z);
      break;
    case "bush":
      obj = makeBush(pos.x, 0, pos.z);
      break;
    case "building":
      obj = makeGreenBuilding(pos.x, pos.z);
      break;
  }
  if (obj) {
    scene.add(obj);
    placedObjects.push({ type, obj });
    updateBalance();
  }
}

function updateBalance() {
  const total = Object.values(builtObjects).reduce((a, b) => a + b, 0);
  if (total === 0) {
    document.getElementById("balance-status").textContent =
      "Mulai mendesain...";
    document.getElementById("balance-status").style.color = "#888";
    return;
  }
  const flora = (builtObjects.tree + builtObjects.bush) / Math.max(total, 1);
  const fauna = builtObjects.animal / Math.max(total, 1);
  const energy = builtObjects.solar / Math.max(total, 1);
  const fp = Math.min(Math.round(flora * 200), 100);
  const fap = Math.min(Math.round(fauna * 400), 100);
  const ep = Math.min(Math.round(energy * 400), 100);
  document.getElementById("flora-fill").style.width = fp + "%";
  document.getElementById("fauna-fill").style.width = fap + "%";
  document.getElementById("energy-fill").style.width = ep + "%";
  document.getElementById("flora-val").textContent = fp + "%";
  document.getElementById("fauna-val").textContent = fap + "%";
  document.getElementById("energy-val").textContent = ep + "%";
  const avg = (fp + fap + ep) / 3;
  const st = document.getElementById("balance-status");
  if (avg > 65) {
    st.textContent = "✅ Seimbang!";
    st.style.color = "#00e676";
  } else if (avg > 35) {
    st.textContent = "⚠️ Hampir Seimbang";
    st.style.color = "#ff9800";
  } else {
    st.textContent = "❌ Belum Seimbang";
    st.style.color = "#f44336";
  }
}


function addBuildItem(type) { addObject(type); }

window.addEventListener('DOMContentLoaded', () => startSceneApp(8));
