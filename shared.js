// ============================================================
// AR EKOSISTEM — shared.js
// Engine shared oleh semua scene (standalone mode)
// ============================================================
"use strict";

// ── Global State ──
let draggableObjects = [];
let renderer, camera, scene, clock;
let mixer = null;
let glbCache = {};
let currentScene = 0;
let animating = false;
let builtObjects = { tree:0, water:0, solar:0, animal:0, bush:0, building:0 };
let sceneObjects = [];
let damagedTrees = [];
let dmgLevel = 0;
let placedObjects = [];
let foodChainStep = 0;
let isDraggingItem = false;
let scene2DragControls = null;
let biotikZone = { min: -15, max: 0 };
let abiotikZone  = { min: 0,  max: 15 };
const scene1Anchors = { healthy: null, damaged: null };

// ── Scene 2 state (defined globally so shared.js render loop can guard) ──
let s2_itemsMeshes = [];
let s2_correctCount = 0;
let s2_totalItems = 0;
let s2_solved = {};
let s2_highlightedObj = null;
let s2_raycaster = null; // initialized in startSceneApp after THREE is loaded
let s2_mouse = null; // initialized in startSceneApp
let s2_clickHandler = null;
let s2_biotikPlane = null;
let s2_abiotikPlane = null;
let s2_dragObj = null;
let s2_dragPlane = null;
let s2_dragOffset = null; // initialized in startSceneApp
let s2_isDragging = false;
let s2_mouseDownObj = null;
let s2_pointerDownPos = null;
let s2_zoneLabels = null;
let s2_dragListenersAttached = false;

// ── Scene 3 state ──
let s3_layer = 1;
let s3p2_slots = [];
let s3p2_items = [];
let s3p2_correct = 0;
let s3p2_dragObj = null;
let s3p2_dragOrigin = null;
let s3p2_isDragging = false;
let s3p2_raycaster = null;
let s3p2_listenersOn = false;
let s3p2_gameStarted = false;
let s3p2_timerInterval = null;
let s3p2_timeLeft = 10;
let s3p2_cameraLocked = false;

const GLB_PATHS = {
  lowPolyTree: "low_poly_tree_scene_free-compressed.glb",
  smallForest:  "small_forest-compressed.glb",
  coolingTower: "nuklir.glb",
  base:    "tanah_sceen2.glb",
  batu:    "batu.glb",
  singa:   "singa.glb",
  air:     "genangan_air.glb",
  rusa:    "rusa.glb",
  manusia: "manusia.glb",
  matahari:"matahari.glb",
  pohon:   "pohon.glb",
  belalang:"sceen_3_belalang_bagian1_2.glb",
  burung3: "sceen_3_burung_bagian1_3.glb",
  elang3:  "sceen_3_elang_bagian1_4.glb",
  tanah3:  "sceen_3_tanah1_1.glb",
  laut2:   "sceen_3_laut2_1.glb",
  plankton:"sceen_3_plankton_bagian2_1.glb",
  ikanKecil:"sceen_3_ikan_kecil_bagian2_2.glb",
  tuna:    "sceen_3_tuna_bagian2_3.glb",
  hiu:     "sceen_3_hiu_bagian2_4.glb",
  // ── Scene 3 Part-2: Jaring-Jaring Makanan Darat ──
  p3_pohon:    "sceen_3_part2_pohon_bagian3_1_baris_bawah_1.glb",
  p3_rumput:   "sceen_3_part2_rumput_bagian3_1_baris_bawah_2.glb",
  p3_rusa:     "sceen_3_part2_rusa_bagian3_2_baris_tengah_bawah_1.glb",
  p3_tikus:    "sceen_3_part2_tikus_bagian3_2_baris_tengah_bawah_2.glb",
  p3_belalang: "sceen_3_part2_belalang_bagian3_2_baris_tengah_bawah_3.glb",
  p3_ular:     "sceen_3_part2_ular_bagian3_3_baris_tengah_atas_1.glb",
  p3_katak:    "sceen_3_part2_katak_bagian3_3_baris_tengah_atas_2.glb",
  p3_elang:    "sceen_3_part2_elang_bagian3_4_baris_tengah_atas_1.glb",
};

const SCENES = [
  { title:"Scene 1 — Pembuka",              file:"scene-1.html",   narasi:"Lingkungan kita sedang mengalami perubahan. Bagaimana cara kita merancang ekosistem yang lebih ramah lingkungan?" },
  { title:"Scene 2 — Konsep Ekosistem",     file:"scene-2.html",   narasi:"Ekosistem terdiri dari komponen biotik dan abiotik yang saling berinteraksi." },
  { title:"Scene 3 — Aliran Energi",        file:"scene-3.html",   narasi:"Energi mengalir dari produsen ke konsumen hingga pengurai." },
  { title:"Scene 3 — Aliran Energi Part-1", file:"Scene 3 — Aliran Energi Part-1.html", narasi:"Susun rantai makanan laut dari produsen hingga predator puncak!" },
  { title:"Scene 3 — Aliran Energi Part-2", file:"Scene 3 — Aliran Energi Part-2.html", narasi:"Eksplorasi lebih lanjut aliran energi dalam ekosistem." },
  { title:"Scene 4 — Dampak Manusia",       file:"scene-4.html",   narasi:"Aktivitas manusia dapat mengganggu keseimbangan ekosistem." },
  { title:"Scene 5 — Prinsip Ramah Lingkungan", file:"scene-5.html", narasi:"Ekosistem ramah lingkungan dirancang untuk menjaga keseimbangan alam." },
  { title:"Scene 6 — Tantangan Proyek",     file:"scene-6.html",   narasi:"Saatnya kamu merancang ekosistem ramah lingkunganmu sendiri!" },
  { title:"Scene 7 — Desain Ekosistem",     file:"scene-7.html",   narasi:"Tambahkan komponen ekosistem dan perhatikan indikator keseimbangan!" },
  { title:"Scene 8 — Simulasi Hasil",       file:"scene-8.html",   narasi:"Desainmu mempengaruhi keberlanjutan ekosistem." },
  { title:"Scene 9 — Evaluasi & Refleksi",  file:"scene-9.html",   narasi:"Mari kita nilai ekosistem yang telah kamu rancang." },
  { title:"Scene 10 — Penutup",             file:"scene-10.html",  narasi:"" },
];

// ============================================================
// GLTF LOADER — EMBEDDED (no CDN dependency)
// ============================================================
function embedGLTFLoader(THREE) {
  const BINARY_MAGIC = "glTF";
  const HEADER_LEN = 12;
  const CHUNK_TYPES = { JSON: 0x4e4f534a, BIN: 0x004e4942 };
  const EXTS = {
    KHR_BINARY_GLTF: "KHR_binary_glTF",
    KHR_LIGHTS_PUNCTUAL: "KHR_lights_punctual",
    KHR_MATERIALS_UNLIT: "KHR_materials_unlit",
    KHR_TEXTURE_TRANSFORM: "KHR_texture_transform",
    KHR_MESH_QUANTIZATION: "KHR_mesh_quantization",
    KHR_DRACO_MESH_COMPRESSION: "KHR_draco_mesh_compression",
  };
  const WGL = {
    FLOAT: 5126,
    FLOAT_MAT3: 35675,
    FLOAT_MAT4: 35676,
    FLOAT_VEC2: 35664,
    FLOAT_VEC3: 35665,
    FLOAT_VEC4: 35666,
    LINEAR: 9729,
    REPEAT: 10497,
    SAMPLER_2D: 35678,
    POINTS: 0,
    LINES: 1,
    LINE_LOOP: 2,
    LINE_STRIP: 3,
    TRIANGLES: 4,
    TRIANGLE_STRIP: 5,
    TRIANGLE_FAN: 6,
    UNSIGNED_BYTE: 5121,
    UNSIGNED_SHORT: 5123,
  };
  const COMP_TYPES = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
  };
  const FILTERS = {
    9728: THREE.NearestFilter,
    9729: THREE.LinearFilter,
    9984: THREE.NearestMipmapNearestFilter,
    9985: THREE.LinearMipmapNearestFilter,
    9986: THREE.NearestMipmapLinearFilter,
    9987: THREE.LinearMipmapLinearFilter,
  };
  const WRAPPINGS = {
    33071: THREE.ClampToEdgeWrapping,
    33648: THREE.MirroredRepeatWrapping,
    10497: THREE.RepeatWrapping,
  };
  const TYPE_SIZES = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16,
  };
  const ATTRIBS = {
    POSITION: "position",
    NORMAL: "normal",
    TANGENT: "tangent",
    TEXCOORD_0: "uv",
    TEXCOORD_1: "uv2",
    COLOR_0: "color",
    WEIGHTS_0: "skinWeight",
    JOINTS_0: "skinIndex",
  };
  const PATH_PROPS = {
    scale: "scale",
    translation: "position",
    rotation: "quaternion",
    weights: "morphTargetInfluences",
  };
  const INTERP = {
    CUBICSPLINE: THREE.InterpolateSmooth,
    LINEAR: THREE.InterpolateLinear,
    STEP: THREE.InterpolateDiscrete,
  };
  const ALPHA = { OPAQUE: "OPAQUE", MASK: "MASK", BLEND: "BLEND" };

  function resolveURL(url, path) {
    if (typeof url !== "string" || url === "") return "";
    if (/^(https?:\/\/|data:|blob:)/i.test(url)) return url;
    if (typeof path === "string") {
      const pu = new URL(path, window.location.href);
      pu.pathname =
        pu.pathname.substring(0, pu.pathname.lastIndexOf("/") + 1) + url;
      return pu.href;
    }
    return "./" + url;
  }

  // GLTFCubicSplineInterpolant
  class GLTFCubicSplineInterpolant extends THREE.Interpolant {
    constructor(pT, pV, vs, rB) {
      super(pT, pV, vs, rB);
    }
    copySampleValue_(index) {
      const r = this.resultBuffer,
        v = this.sampleValues,
        s = this.valueSize;
      const o = index * s * 3 + s;
      for (let i = 0; i !== s; i++) r[i] = v[o + i];
      return r;
    }
    interpolate_(i1, t0, t, t1) {
      const r = this.resultBuffer,
        v = this.sampleValues,
        s = this.valueSize;
      const s2 = s * 2,
        s3 = s * 3,
        td = t1 - t0,
        p = (t - t0) / td;
      const pp = p * p,
        ppp = pp * p;
      const o1 = i1 * s3,
        o0 = o1 - s3;
      const A = -2 * ppp + 3 * pp,
        B = ppp - pp,
        C = 1 - A,
        D = B - pp + p;
      for (let i = 0; i !== s; i++) {
        const p0 = v[o0 + i + s],
          m0 = v[o0 + i + s2] * td;
        const p1 = v[o1 + i + s],
          m1 = v[o1 + i] * td;
        r[i] = C * p0 + D * m0 + A * p1 + B * m1;
      }
      return r;
    }
  }

  function GLTFRegistry() {
    this.objects = {};
  }
  GLTFRegistry.prototype.get = function (k) {
    return this.objects[k];
  };
  GLTFRegistry.prototype.add = function (k, v) {
    this.objects[k] = v;
  };
  GLTFRegistry.prototype.remove = function (k) {
    delete this.objects[k];
  };
  GLTFRegistry.prototype.removeAll = function () {
    this.objects = {};
  };

  // BinaryExtension
  function GLTFBinaryExtension(data) {
    this.name = EXTS.KHR_BINARY_GLTF;
    this.content = null;
    this.body = null;
    const hv = new DataView(data, 0, HEADER_LEN);
    this.header = {
      magic: THREE.LoaderUtils.decodeText(new Uint8Array(data.slice(0, 4))),
      version: hv.getUint32(4, true),
      length: hv.getUint32(8, true),
    };
    if (this.header.magic !== BINARY_MAGIC)
      throw new Error("GLTFLoader: Bad magic.");
    if (this.header.version < 2) throw new Error("GLTFLoader: Legacy binary.");
    const cl = this.header.length - HEADER_LEN;
    const cv = new DataView(data, HEADER_LEN);
    let ci = 0;
    while (ci < cl) {
      const len = cv.getUint32(ci, true);
      ci += 4;
      const type = cv.getUint32(ci, true);
      ci += 4;
      if (type === CHUNK_TYPES.JSON) {
        this.content = THREE.LoaderUtils.decodeText(
          new Uint8Array(data, HEADER_LEN + ci, len),
        );
      } else if (type === CHUNK_TYPES.BIN) {
        this.body = data.slice(HEADER_LEN + ci, HEADER_LEN + ci + len);
      }
      ci += len;
    }
    if (!this.content) throw new Error("GLTFLoader: No JSON chunk.");
  }

  function GLTFMaterialsUnlitExtension() {
    this.name = EXTS.KHR_MATERIALS_UNLIT;
  }
  GLTFMaterialsUnlitExtension.prototype.getMaterialType = function () {
    return THREE.MeshBasicMaterial;
  };
  GLTFMaterialsUnlitExtension.prototype.extendParams = function (
    mp,
    md,
    parser,
  ) {
    const pending = [];
    mp.color = new THREE.Color(1, 1, 1);
    mp.opacity = 1;
    const mr = md.pbrMetallicRoughness;
    if (mr) {
      if (Array.isArray(mr.baseColorFactor)) {
        const a = mr.baseColorFactor;
        mp.color.fromArray(a);
        mp.opacity = a[3];
      }
      if (mr.baseColorTexture !== undefined)
        pending.push(parser.assignTexture(mp, "map", mr.baseColorTexture));
    }
    return Promise.all(pending);
  };

  function GLTFTextureTransformExtension() {
    this.name = EXTS.KHR_TEXTURE_TRANSFORM;
  }
  GLTFTextureTransformExtension.prototype.extendTexture = function (tex, t) {
    tex = tex.clone();
    if (t.offset !== undefined) tex.offset.fromArray(t.offset);
    if (t.rotation !== undefined) tex.rotation = t.rotation;
    if (t.scale !== undefined) tex.repeat.fromArray(t.scale);
    tex.needsUpdate = true;
    return tex;
  };

  function GLTFMeshQuantizationExtension() {
    this.name = EXTS.KHR_MESH_QUANTIZATION;
  }

  function GLTFLightExtension(parser) {
    this.name = EXTS.KHR_LIGHTS_PUNCTUAL;
    this.cache = { refs: {}, uses: {} };
    this.parser = parser;
  }
  GLTFLightExtension.prototype.markRefs = function () {
    const json = this.parser.json;
    if (!json.extensions || !json.extensions[EXTS.KHR_LIGHTS_PUNCTUAL]) return;
    (json.nodes || []).forEach((nd, ni) => {
      if (
        nd.extensions &&
        nd.extensions[EXTS.KHR_LIGHTS_PUNCTUAL] !== undefined
      ) {
        const li = nd.extensions[EXTS.KHR_LIGHTS_PUNCTUAL].light;
        if (!this.cache.refs[li]) this.cache.refs[li] = this.cache.uses[li] = 0;
        this.cache.refs[li]++;
      }
    });
  };
  GLTFLightExtension.prototype._loadLight = function (lightIndex, lightDefs) {
    const ck = "light:" + lightIndex;
    let dep = this.parser.cache.get(ck);
    if (dep) return dep;
    const ld = lightDefs[lightIndex];
    let lightNode;
    const color = new THREE.Color(0xffffff);
    if (ld.color) color.fromArray(ld.color);
    const range = ld.range !== undefined ? ld.range : 0;
    switch (ld.type) {
      case "directional":
        lightNode = new THREE.DirectionalLight(color);
        lightNode.target.position.set(0, 0, -1);
        lightNode.add(lightNode.target);
        break;
      case "point":
        lightNode = new THREE.PointLight(color);
        lightNode.distance = range;
        break;
      case "spot":
        lightNode = new THREE.SpotLight(color);
        lightNode.distance = range;
        if (ld.spot) {
          lightNode.angle =
            ld.spot.outerConeAngle !== undefined
              ? ld.spot.outerConeAngle
              : Math.PI / 4;
          lightNode.penumbra =
            ld.spot.innerConeAngle !== undefined
              ? 1.0 - ld.spot.innerConeAngle / lightNode.angle
              : 0;
        }
        lightNode.target.position.set(0, 0, -1);
        lightNode.add(lightNode.target);
        break;
      default:
        throw new Error("GLTFLoader: Unknown light type.");
    }
    lightNode.position.set(0, 0, 0);
    lightNode.decay = 2;
    if (ld.intensity !== undefined) lightNode.intensity = ld.intensity;
    lightNode.name = this.parser.createUniqueName(
      ld.name || "light_" + lightIndex,
    );
    dep = Promise.resolve(lightNode);
    this.parser.cache.add(ck, dep);
    return dep;
  };

  function createDefaultMaterial(cache) {
    if (cache.get("DefaultMaterial")) return cache.get("DefaultMaterial");
    const m = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x000000,
      metalness: 1,
      roughness: 1,
      transparent: false,
      depthTest: true,
      side: THREE.FrontSide,
    });
    cache.add("DefaultMaterial", m);
    return m;
  }
  function addUnknownExtensions(known, obj, def) {
    if (def && def.extensions)
      for (const n in def.extensions) {
        if (!known[n]) {
          obj.userData.gltfExtensions = obj.userData.gltfExtensions || {};
          obj.userData.gltfExtensions[n] = def.extensions[n];
        }
      }
  }
  function assignExtras(obj, def) {
    if (def && def.extras !== undefined) {
      if (typeof def.extras === "object")
        Object.assign(obj.userData, def.extras);
    }
  }
  function getNormalizedScale(ctor) {
    switch (ctor) {
      case Int8Array:
        return 1 / 127;
      case Uint8Array:
        return 1 / 255;
      case Int16Array:
        return 1 / 32767;
      case Uint16Array:
        return 1 / 65535;
      default:
        throw new Error("GLTFLoader: Unsupported normalized type.");
    }
  }
  function createPrimKey(prim) {
    const de =
      prim.extensions && prim.extensions[EXTS.KHR_DRACO_MESH_COMPRESSION];
    if (de)
      return (
        de.bufferView +
        ":" +
        de.indices +
        ":" +
        Object.keys(de.attributes)
          .sort()
          .map((k) => k + ":" + de.attributes[k])
          .join("+")
      );
    return (
      prim.indices +
      ":" +
      Object.keys(prim.attributes)
        .sort()
        .map((k) => k + ":" + prim.attributes[k])
        .join("+") +
      ":" +
      prim.mode
    );
  }
  function toTriangles(geo, mode) {
    if (mode === THREE.TrianglesDrawMode) return geo;
    const idx = geo.getIndex();
    let arr = [];
    if (idx) {
      for (let i = 0; i < idx.array.length; i++) arr.push(idx.array[i]);
    } else {
      const pa = geo.getAttribute("position");
      for (let i = 0; i < pa.count; i++) arr.push(i);
    }
    const out = [];
    if (mode === THREE.TriangleStripDrawMode) {
      for (let i = 0; i < arr.length - 2; i++)
        i % 2 === 0
          ? out.push(arr[i], arr[i + 1], arr[i + 2])
          : out.push(arr[i + 2], arr[i + 1], arr[i]);
    } else {
      for (let i = 1; i < arr.length - 1; i++)
        out.push(arr[0], arr[i], arr[i + 1]);
    }
    const ng = geo.clone();
    ng.setIndex(out);
    return ng;
  }
  function addMorphTargets(geo, targets, parser) {
    let hasPos = false,
      hasNorm = false;
    for (const t of targets) {
      if (t.POSITION) hasPos = true;
      if (t.NORMAL) hasNorm = true;
    }
    if (!hasPos && !hasNorm) return Promise.resolve(geo);
    const pending = targets.map((t) => {
      const ap = [];
      if (hasPos && t.POSITION)
        ap.push(parser.getDependency("accessor", t.POSITION));
      if (hasNorm && t.NORMAL)
        ap.push(parser.getDependency("accessor", t.NORMAL));
      return Promise.all(ap);
    });
    return Promise.all(pending).then((arr) => {
      if (hasPos) geo.morphAttributes.position = [];
      if (hasNorm) geo.morphAttributes.normal = [];
      arr.forEach((mt) => {
        let i = 0;
        if (hasPos) geo.morphAttributes.position.push(mt[i++]);
        if (hasNorm) geo.morphAttributes.normal.push(mt[i++]);
      });
      geo.morphTargetsRelative = true;
      return geo;
    });
  }
  function updateMorphTargets(mesh, def) {
    mesh.updateMorphTargets();
    if (def.weights)
      def.weights.forEach((w, i) => (mesh.morphTargetInfluences[i] = w));
  }
  function addPrimAttribs(geo, prim, parser) {
    const pending = [];
    for (const gn in prim.attributes) {
      const tn = ATTRIBS[gn] || gn.toLowerCase();
      if (!geo.attributes[tn])
        pending.push(
          parser
            .getDependency("accessor", prim.attributes[gn])
            .then((acc) => geo.setAttribute(tn, acc)),
        );
    }
    if (prim.indices !== undefined && !geo.index)
      pending.push(
        parser
          .getDependency("accessor", prim.indices)
          .then((acc) => geo.setIndex(acc)),
      );
    assignExtras(geo, prim);
    if (parser.json.accessors[prim.attributes.POSITION]) {
      const acc = parser.json.accessors[prim.attributes.POSITION];
      if (acc.min && acc.max) {
        geo.boundingBox = new THREE.Box3(
          new THREE.Vector3(...acc.min),
          new THREE.Vector3(...acc.max),
        );
        const l = new THREE.Vector3()
          .subVectors(geo.boundingBox.max, geo.boundingBox.min)
          .lengthSq();
        geo.boundingSphere = new THREE.Sphere(
          new THREE.Vector3()
            .addVectors(geo.boundingBox.min, geo.boundingBox.max)
            .multiplyScalar(0.5),
          0.5 * Math.sqrt(l),
        );
      }
    }
    return Promise.all(pending).then(() =>
      prim.targets ? addMorphTargets(geo, prim.targets, parser) : geo,
    );
  }

  // Main Parser
  function GLTFParser(json, opts) {
    this.json = json || {};
    this.extensions = {};
    this.plugins = {};
    this.options = opts;
    this.cache = new GLTFRegistry();
    this.associations = new Map();
    this.primitiveCache = {};
    this.meshCache = { refs: {}, uses: {} };
    this.cameraCache = { refs: {}, uses: {} };
    this.textureCache = {};
    this.nodeNamesUsed = {};
    this.textureLoader = new THREE.TextureLoader(opts.manager);
    this.textureLoader.setCrossOrigin(opts.crossOrigin);
    this.fileLoader = new THREE.FileLoader(opts.manager);
    this.fileLoader.setResponseType("arraybuffer");
    if (opts.crossOrigin === "use-credentials")
      this.fileLoader.setWithCredentials(true);
  }
  GLTFParser.prototype.setExtensions = function (e) {
    this.extensions = e;
  };
  GLTFParser.prototype.setPlugins = function (p) {
    this.plugins = p;
  };
  GLTFParser.prototype.parse = function (onLoad, onError) {
    const parser = this,
      json = this.json,
      exts = this.extensions;
    this.markRefs();
    Promise.all([
      this.getDependencies("scene"),
      this.getDependencies("animation"),
      this.getDependencies("camera"),
    ])
      .then((deps) => {
        const result = {
          scene: deps[0][json.scene || 0],
          scenes: deps[0],
          animations: deps[1],
          cameras: deps[2],
          asset: json.asset,
          parser: parser,
          userData: {},
        };
        addUnknownExtensions(exts, result, json);
        assignExtras(result, json);
        onLoad(result);
      })
      .catch(onError);
  };
  GLTFParser.prototype.markRefs = function () {
    const json = this.json;
    (json.nodes || []).forEach((nd) => {
      if (nd.mesh !== undefined) {
        if (!this.meshCache.refs[nd.mesh])
          this.meshCache.refs[nd.mesh] = this.meshCache.uses[nd.mesh] = 0;
        this.meshCache.refs[nd.mesh]++;
      }
      if (nd.skin !== undefined) {
        if (!this.skinCache) this.skinCache = { refs: {}, uses: {} };
        if (!this.skinCache.refs[nd.skin])
          this.skinCache.refs[nd.skin] = this.skinCache.uses[nd.skin] = 0;
        this.skinCache.refs[nd.skin]++;
      }
    });
    for (const n in this.plugins)
      if (this.plugins[n].markRefs) this.plugins[n].markRefs();
  };
  GLTFParser.prototype.createUniqueName = function (orig) {
    const s = THREE.PropertyBinding.sanitizeNodeName(orig || "");
    if (!(s in this.nodeNamesUsed)) this.nodeNamesUsed[s] = 0;
    else ++this.nodeNamesUsed[s];
    return s + (this.nodeNamesUsed[s] > 0 ? "_" + this.nodeNamesUsed[s] : "");
  };
  GLTFParser.prototype.getDependency = function (type, index) {
    const ck = type + ":" + index;
    let dep = this.cache.get(ck);
    if (!dep) {
      switch (type) {
        case "scene":
          dep = this.loadScene(index);
          break;
        case "node":
          dep = this.loadNode(index);
          break;
        case "mesh":
          dep = this._invokeOne((ext) => ext.loadMesh && ext.loadMesh(index));
          break;
        case "accessor":
          dep = this.loadAccessor(index);
          break;
        case "bufferView":
          dep = this.loadBufferView(index);
          break;
        case "buffer":
          dep = this.loadBuffer(index);
          break;
        case "material":
          dep = this._invokeOne(
            (ext) => ext.loadMaterial && ext.loadMaterial(index),
          );
          break;
        case "texture":
          dep = this._invokeOne(
            (ext) => ext.loadTexture && ext.loadTexture(index),
          );
          break;
        case "skin":
          dep = this.loadSkin(index);
          break;
        case "animation":
          dep = this.loadAnimation(index);
          break;
        case "camera":
          dep = this.loadCamera(index);
          break;
        default:
          throw new Error("Unknown type: " + type);
      }
      this.cache.add(ck, dep);
    }
    return dep;
  };
  GLTFParser.prototype.getDependencies = function (type) {
    let deps = this.cache.get(type);
    if (!deps) {
      const defs = this.json[type + "s"] || [];
      deps = Promise.all(defs.map((_, i) => this.getDependency(type, i)));
      this.cache.add(type, deps);
    }
    return deps;
  };
  GLTFParser.prototype._invokeOne = function (fn) {
    const exts = Object.values(this.plugins).concat(this);
    for (const e of exts) {
      const r = fn(e);
      if (r) return r;
    }
    return null;
  };
  GLTFParser.prototype.loadBuffer = function (idx) {
    const bd = this.json.buffers[idx];
    if (bd.type && bd.type !== "arraybuffer")
      throw new Error("GLTFLoader: Unsupported buffer type.");
    if (bd.uri === undefined && idx === 0)
      return Promise.resolve(this.extensions[EXTS.KHR_BINARY_GLTF].body);
    const opts = this.options;
    return new Promise((res, rej) =>
      this.fileLoader.load(resolveURL(bd.uri, opts.path), res, undefined, () =>
        rej(new Error("GLTFLoader: Buffer load failed: " + bd.uri)),
      ),
    );
  };
  GLTFParser.prototype.loadBufferView = function (idx) {
    const bv = this.json.bufferViews[idx];
    return this.getDependency("buffer", bv.buffer).then((buf) =>
      buf.slice(
        bv.byteOffset || 0,
        (bv.byteOffset || 0) + (bv.byteLength || 0),
      ),
    );
  };
  GLTFParser.prototype.loadAccessor = function (idx) {
    const json = this.json,
      ad = json.accessors[idx];
    if (ad.bufferView === undefined && ad.sparse === undefined) {
      const TS = TYPE_SIZES[ad.type],
        TA = COMP_TYPES[ad.componentType];
      return Promise.resolve(
        new THREE.BufferAttribute(
          new TA(ad.count * TS),
          TS,
          ad.normalized === true,
        ),
      );
    }
    const pending = [
      ad.bufferView !== undefined
        ? this.getDependency("bufferView", ad.bufferView)
        : Promise.resolve(null),
    ];
    if (ad.sparse) {
      pending.push(
        this.getDependency("bufferView", ad.sparse.indices.bufferView),
      );
      pending.push(
        this.getDependency("bufferView", ad.sparse.values.bufferView),
      );
    }
    return Promise.all(pending).then((bvs) => {
      const bv = bvs[0],
        TS = TYPE_SIZES[ad.type],
        TA = COMP_TYPES[ad.componentType];
      const eb = TA.BYTES_PER_ELEMENT,
        ib = eb * TS;
      const bo = ad.byteOffset || 0;
      const stride =
        ad.bufferView !== undefined
          ? json.bufferViews[ad.bufferView].byteStride
          : undefined;
      const norm = ad.normalized === true;
      let attr;
      if (stride && stride !== ib) {
        const sl = Math.floor(bo / stride),
          sc = Math.ceil((bo + ib * ad.count) / stride);
        const ne = ((sc - sl) * stride) / eb,
          is = sl * stride;
        const dv = new DataView(bv, is, ne * eb);
        const src = new TA(ne);
        for (let i = 0; i < src.length; i++)
          src[i] = dv["get" + TA.name.replace("Array", "")](i * eb, true);
        attr = new THREE.InterleavedBufferAttribute(
          new THREE.InterleavedBuffer(src, stride / eb),
          TS,
          (bo % stride) / eb,
          norm,
        );
      } else {
        const arr =
          bv === null ? new TA(ad.count * TS) : new TA(bv, bo, ad.count * TS);
        attr = new THREE.BufferAttribute(arr, TS, norm);
      }
      if (ad.sparse) {
        const TAI = COMP_TYPES[ad.sparse.indices.componentType];
        const si = new TAI(
          bvs[1],
          ad.sparse.indices.byteOffset || 0,
          ad.sparse.count,
        );
        const sv = new TA(
          bvs[2],
          ad.sparse.values.byteOffset || 0,
          ad.sparse.count * TS,
        );
        if (bv !== null)
          attr = new THREE.BufferAttribute(
            attr.array.slice(),
            attr.itemSize,
            norm,
          );
        for (let i = 0; i < si.length; i++) {
          const ii = si[i];
          attr.setX(ii, sv[i * TS]);
          if (TS >= 2) attr.setY(ii, sv[i * TS + 1]);
          if (TS >= 3) attr.setZ(ii, sv[i * TS + 2]);
          if (TS >= 4) attr.setW(ii, sv[i * TS + 3]);
        }
      }
      return attr;
    });
  };
  GLTFParser.prototype.loadTexture = function (idx) {
    const json = this.json,
      opts = this.options,
      td = json.textures[idx];
    const sd = json.images[td.source];
    const URL2 = window.URL || window.webkitURL;
    let srcURI = sd.uri || "",
      isObj = false;
    if (sd.bufferView !== undefined) {
      return this.getDependency("bufferView", sd.bufferView).then((bv) => {
        isObj = true;
        srcURI = URL2.createObjectURL(new Blob([bv], { type: sd.mimeType }));
        return this._loadTextureImage(idx, srcURI, isObj);
      });
    }
    return this._loadTextureImage(idx, resolveURL(srcURI, opts.path), isObj);
  };
  GLTFParser.prototype._loadTextureImage = function (idx, src, isObj) {
    const json = this.json,
      td = json.textures[idx];
    const URL2 = window.URL || window.webkitURL;
    const ck = src + (td.sampler !== undefined ? td.sampler : "");
    if (ck in this.textureCache) return this.textureCache[ck];
    const tex = this.textureLoader.load(src, undefined, undefined, () => {
      if (isObj) URL2.revokeObjectURL(src);
    });
    if (td.sampler !== undefined) {
      const s = json.samplers[td.sampler];
      tex.magFilter = FILTERS[s.magFilter] || THREE.LinearFilter;
      tex.minFilter = FILTERS[s.minFilter] || THREE.LinearMipmapLinearFilter;
      tex.wrapS = WRAPPINGS[s.wrapS] || THREE.RepeatWrapping;
      tex.wrapT = WRAPPINGS[s.wrapT] || THREE.RepeatWrapping;
    }
    const p = Promise.resolve(tex);
    this.textureCache[ck] = p;
    return p;
  };
  GLTFParser.prototype.assignTexture = function (mp, name, mapDef) {
    return this.getDependency("texture", mapDef.index).then((tex) => {
      const t =
        mapDef.extensions && mapDef.extensions[EXTS.KHR_TEXTURE_TRANSFORM];
      if (t)
        tex = this.extensions[EXTS.KHR_TEXTURE_TRANSFORM].extendTexture(tex, t);
      mp[name] = tex;
      return tex;
    });
  };
  GLTFParser.prototype.assignFinalMaterial = function (mesh) {
    const geo = mesh.geometry,
      mat = mesh.material;
    const udt = !geo.attributes.tangent,
      uvc = !!geo.attributes.color,
      ufs = !geo.attributes.normal;
    if (mesh.isPoints) {
      const ck = "PointsMaterial:" + mat.uuid;
      let pm = this.cache.get(ck);
      if (!pm) {
        pm = new THREE.PointsMaterial();
        THREE.Material.prototype.copy.call(pm, mat);
        pm.color.copy(mat.color);
        pm.map = mat.map;
        pm.sizeAttenuation = false;
        this.cache.add(ck, pm);
      }
      mesh.material = pm;
    } else if (mesh.isLine) {
      const ck = "LineBasicMaterial:" + mat.uuid;
      let lm = this.cache.get(ck);
      if (!lm) {
        lm = new THREE.LineBasicMaterial();
        THREE.Material.prototype.copy.call(lm, mat);
        lm.color.copy(mat.color);
        this.cache.add(ck, lm);
      }
      mesh.material = lm;
    }
    if (udt || uvc || ufs) {
      let ck = "ClonedMaterial:" + mat.uuid + ":";
      if (udt) ck += "dt:";
      if (uvc) ck += "vc:";
      if (ufs) ck += "fs:";
      let cm = this.cache.get(ck);
      if (!cm) {
        cm = mat.clone();
        if (uvc) cm.vertexColors = true;
        if (ufs) cm.flatShading = true;
        this.cache.add(ck, cm);
      }
      mesh.material = cm;
    }
  };
  GLTFParser.prototype.getMaterialType = function () {
    return THREE.MeshStandardMaterial;
  };
  GLTFParser.prototype.extendMaterialParams = function () {
    return Promise.resolve();
  };
  GLTFParser.prototype.loadMaterial = function (idx) {
    const parser = this,
      json = this.json,
      exts = this.extensions;
    const md = json.materials[idx],
      mext = md.extensions || {},
      pending = [];
    let mtype;
    if (mext[EXTS.KHR_MATERIALS_UNLIT]) {
      const e = exts[EXTS.KHR_MATERIALS_UNLIT];
      mtype = e.getMaterialType(idx);
      pending.push(e.extendParams({}, md, parser));
    } else {
      mtype = parser.getMaterialType(idx);
      pending.push(parser.extendMaterialParams(idx, {}));
    }
    const mp = {};
    if (md.doubleSided) mp.side = THREE.DoubleSide;
    const am = md.alphaMode || ALPHA.OPAQUE;
    if (am === ALPHA.BLEND) {
      mp.transparent = true;
      mp.depthWrite = false;
    } else {
      mp.transparent = false;
      if (am === ALPHA.MASK)
        mp.alphaTest = md.alphaCutoff !== undefined ? md.alphaCutoff : 0.5;
    }
    if (md.normalTexture && mtype !== THREE.MeshBasicMaterial) {
      pending.push(parser.assignTexture(mp, "normalMap", md.normalTexture));
      mp.normalScale = new THREE.Vector2(1, -1);
      if (md.normalTexture.scale)
        mp.normalScale.set(md.normalTexture.scale, -md.normalTexture.scale);
    }
    if (md.occlusionTexture && mtype !== THREE.MeshBasicMaterial) {
      pending.push(parser.assignTexture(mp, "aoMap", md.occlusionTexture));
      if (md.occlusionTexture.strength !== undefined)
        mp.aoMapIntensity = md.occlusionTexture.strength;
    }
    if (md.emissiveFactor && mtype !== THREE.MeshBasicMaterial)
      mp.emissive = new THREE.Color().fromArray(md.emissiveFactor);
    if (md.emissiveTexture && mtype !== THREE.MeshBasicMaterial)
      pending.push(parser.assignTexture(mp, "emissiveMap", md.emissiveTexture));
    if (!mext[EXTS.KHR_MATERIALS_UNLIT]) {
      const mr = md.pbrMetallicRoughness || {};
      mp.color = new THREE.Color(1, 1, 1);
      mp.opacity = 1;
      if (Array.isArray(mr.baseColorFactor)) {
        const a = mr.baseColorFactor;
        mp.color.fromArray(a);
        mp.opacity = a[3];
      }
      if (mr.baseColorTexture)
        pending.push(parser.assignTexture(mp, "map", mr.baseColorTexture));
      mp.metalness = mr.metallicFactor !== undefined ? mr.metallicFactor : 1;
      mp.roughness = mr.roughnessFactor !== undefined ? mr.roughnessFactor : 1;
      if (mr.metallicRoughnessTexture) {
        pending.push(
          parser.assignTexture(mp, "metalnessMap", mr.metallicRoughnessTexture),
        );
        pending.push(
          parser.assignTexture(mp, "roughnessMap", mr.metallicRoughnessTexture),
        );
      }
    }
    return Promise.all(pending).then(() => {
      const mat = new mtype(mp);
      if (md.name) mat.name = md.name;
      assignExtras(mat, md);
      parser.associations.set(mat, { materials: idx });
      if (md.extensions) addUnknownExtensions(exts, mat, md);
      return mat;
    });
  };
  GLTFParser.prototype.loadGeometries = function (prims) {
    const parser = this,
      cache = this.primitiveCache,
      pending = [];
    prims.forEach((prim) => {
      const ck = createPrimKey(prim);
      if (cache[ck]) {
        pending.push(cache[ck].promise);
      } else {
        const gp = addPrimAttribs(new THREE.BufferGeometry(), prim, parser);
        cache[ck] = { promise: gp };
        pending.push(gp);
      }
    });
    return Promise.all(pending);
  };
  GLTFParser.prototype.loadMesh = function (idx) {
    const parser = this,
      json = this.json,
      exts = this.extensions;
    const md = json.meshes[idx],
      prims = md.primitives;
    const matPending = prims.map((p) =>
      p.material === undefined
        ? createDefaultMaterial(this.cache)
        : this.getDependency("material", p.material),
    );
    return Promise.all([...matPending, parser.loadGeometries(prims)]).then(
      (results) => {
        const mats = results.slice(0, -1),
          geos = results[results.length - 1],
          meshes = [];
        geos.forEach((geo, i) => {
          const prim = prims[i],
            mat = mats[i];
          let mesh;
          const mode = prim.mode;
          if (
            mode === WGL.TRIANGLES ||
            mode === WGL.TRIANGLE_STRIP ||
            mode === WGL.TRIANGLE_FAN ||
            mode === undefined
          ) {
            mesh = new THREE.Mesh(geo, mat);
            if (mode === WGL.TRIANGLE_STRIP)
              mesh.geometry = toTriangles(geo, THREE.TriangleStripDrawMode);
            else if (mode === WGL.TRIANGLE_FAN)
              mesh.geometry = toTriangles(geo, THREE.TriangleFanDrawMode);
          } else if (mode === WGL.LINES)
            mesh = new THREE.LineSegments(geo, mat);
          else if (mode === WGL.LINE_STRIP) mesh = new THREE.Line(geo, mat);
          else if (mode === WGL.LINE_LOOP) mesh = new THREE.LineLoop(geo, mat);
          else if (mode === WGL.POINTS) mesh = new THREE.Points(geo, mat);
          else throw new Error("GLTFLoader: Unsupported prim mode: " + mode);
          if (Object.keys(mesh.geometry.morphAttributes).length > 0)
            updateMorphTargets(mesh, md);
          mesh.name = parser.createUniqueName(md.name || "mesh_" + idx);
          assignExtras(mesh, md);
          if (prim.extensions) addUnknownExtensions(exts, mesh, prim);
          parser.assignFinalMaterial(mesh);
          meshes.push(mesh);
        });
        if (meshes.length === 1) return meshes[0];
        const g = new THREE.Group();
        meshes.forEach((m) => g.add(m));
        return g;
      },
    );
  };
  GLTFParser.prototype.loadCamera = function (idx) {
    const cd = this.json.cameras[idx],
      p = cd.perspective || cd.orthographic || {};
    let cam;
    if (cd.type === "perspective")
      cam = new THREE.PerspectiveCamera(
        THREE.MathUtils.radToDeg(p.yfov),
        p.aspectRatio || 1,
        p.znear || 1,
        p.zfar || 2e6,
      );
    else
      cam = new THREE.OrthographicCamera(
        -p.xmag,
        p.xmag,
        p.ymag,
        -p.ymag,
        p.znear,
        p.zfar,
      );
    if (cd.name) cam.name = this.createUniqueName(cd.name);
    assignExtras(cam, cd);
    return Promise.resolve(cam);
  };
  GLTFParser.prototype.loadSkin = function (idx) {
    const sd = this.json.skins[idx],
      entry = { joints: sd.joints };
    if (sd.inverseBindMatrices === undefined) return Promise.resolve(entry);
    return this.getDependency("accessor", sd.inverseBindMatrices).then(
      (acc) => {
        entry.inverseBindMatrices = acc;
        return entry;
      },
    );
  };
  GLTFParser.prototype.loadAnimation = function (idx) {
    const json = this.json,
      ad = json.animations[idx];
    const pNodes = [],
      pInputs = [],
      pOutputs = [],
      samplers = [],
      targets = [];
    ad.channels.forEach((ch) => {
      const s = ad.samplers[ch.sampler],
        tgt = ch.target;
      const name = tgt.node !== undefined ? tgt.node : tgt.id;
      const inp = ad.parameters ? ad.parameters[s.input] : s.input;
      const out = ad.parameters ? ad.parameters[s.output] : s.output;
      pNodes.push(this.getDependency("node", name));
      pInputs.push(this.getDependency("accessor", inp));
      pOutputs.push(this.getDependency("accessor", out));
      samplers.push(s);
      targets.push(tgt);
    });
    return Promise.all([
      Promise.all(pNodes),
      Promise.all(pInputs),
      Promise.all(pOutputs),
    ]).then((deps) => {
      const nodes = deps[0],
        inAccs = deps[1],
        outAccs = deps[2],
        tracks = [];
      nodes.forEach((node, i) => {
        if (!node) return;
        node.updateMatrix();
        node.matrixAutoUpdate = true;
        const s = samplers[i],
          tgt = targets[i];
        let TKT;
        switch (PATH_PROPS[tgt.path]) {
          case "morphTargetInfluences":
            TKT = THREE.NumberKeyframeTrack;
            break;
          case "quaternion":
            TKT = THREE.QuaternionKeyframeTrack;
            break;
          default:
            TKT = THREE.VectorKeyframeTrack;
        }
        const tn = node.name || node.uuid;
        const interp = s.interpolation
          ? INTERP[s.interpolation]
          : THREE.InterpolateLinear;
        const tnames = [];
        if (PATH_PROPS[tgt.path] === "morphTargetInfluences")
          node.traverse((o) => {
            if (o.morphTargetInfluences) tnames.push(o.name || o.uuid);
          });
        else tnames.push(tn);
        let outArr = outAccs[i].array;
        if (outAccs[i].normalized) {
          const scale = getNormalizedScale(outArr.constructor),
            sc = new Float32Array(outArr.length);
          for (let j = 0; j < outArr.length; j++) sc[j] = outArr[j] * scale;
          outArr = sc;
        }
        tnames.forEach((n2) => {
          const track = new TKT(
            n2 + "." + PATH_PROPS[tgt.path],
            inAccs[i].array,
            outArr,
            interp,
          );
          if (s.interpolation === "CUBICSPLINE") {
            track.createInterpolant = function (result) {
              return new GLTFCubicSplineInterpolant(
                this.times,
                this.values,
                this.getValueSize() / 3,
                result,
              );
            };
            track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;
          }
          tracks.push(track);
        });
      });
      return new THREE.AnimationClip(
        ad.name || "animation_" + idx,
        undefined,
        tracks,
      );
    });
  };
  GLTFParser.prototype.loadNode = function (idx) {
    const json = this.json,
      exts = this.extensions,
      parser = this;
    const nd = json.nodes[idx];
    const meshPending =
      nd.mesh !== undefined
        ? parser.getDependency("mesh", nd.mesh)
        : Promise.resolve(null);
    const childPending = (nd.children || []).map((c) =>
      parser.getDependency("node", c),
    );
    const skinPending =
      nd.skin !== undefined
        ? this.getDependency("skin", nd.skin)
        : Promise.resolve(null);
    return Promise.all([meshPending, ...childPending, skinPending]).then(
      (results) => {
        const meshObj = results[0];
        const children = results.slice(
          1,
          1 + (nd.children ? nd.children.length : 0),
        );
        let node;
        if (meshObj) node = meshObj;
        else node = new THREE.Object3D();
        node.name = parser.createUniqueName(nd.name || "node_" + idx);
        assignExtras(node, nd);
        if (nd.extensions) addUnknownExtensions(exts, node, nd);
        if (nd.matrix !== undefined)
          node.applyMatrix4(new THREE.Matrix4().fromArray(nd.matrix));
        else {
          if (nd.translation) node.position.fromArray(nd.translation);
          if (nd.rotation) node.quaternion.fromArray(nd.rotation);
          if (nd.scale) node.scale.fromArray(nd.scale);
        }
        children.forEach((child) => {
          if (child) node.add(child);
        });
        parser.associations.set(node, { nodes: idx });
        return node;
      },
    );
  };
  GLTFParser.prototype.createNodeMesh = function (idx) {
    const json = this.json,
      nd = json.nodes[idx];
    if (nd.mesh === undefined) return null;
    return this.getDependency("mesh", nd.mesh);
  };
  GLTFParser.prototype.loadScene = function (idx) {
    const json = this.json,
      exts = this.extensions,
      sd = json.scenes[idx],
      parser = this;
    const grp = new THREE.Group();
    if (sd.name) grp.name = parser.createUniqueName(sd.name);
    assignExtras(grp, sd);
    if (sd.extensions) addUnknownExtensions(exts, grp, sd);
    return Promise.all(
      (sd.nodes || []).map((n) => parser.getDependency("node", n)),
    ).then((nodes) => {
      nodes.forEach((n) => {
        if (n) grp.add(n);
      });
      return grp;
    });
  };

  // GLTFLoader main class - MUST use 'new' keyword via prototype chain
  function GLTFLoader(manager) {
    THREE.Loader.call(this, manager);
  }
  GLTFLoader.prototype = Object.assign(Object.create(THREE.Loader.prototype), {
    constructor: GLTFLoader,
    load: function (url, onLoad, onProgress, onError) {
      const scope = this;
      let resourcePath;
      if (this.resourcePath !== "") resourcePath = this.resourcePath;
      else if (this.path !== "") resourcePath = this.path;
      else resourcePath = THREE.LoaderUtils.extractUrlBase(url);
      this.manager.itemStart(url);
      const _onError = (e) => {
        if (onError) onError(e);
        else console.error(e);
        scope.manager.itemError(url);
        scope.manager.itemEnd(url);
      };
      const loader = new THREE.FileLoader(this.manager);
      loader.setPath(this.path);
      loader.setResponseType("arraybuffer");
      loader.setRequestHeader(this.requestHeader);
      loader.setWithCredentials(this.withCredentials);
      loader.load(
        url,
        (data) => {
          try {
            scope.parse(
              data,
              resourcePath,
              (gltf) => {
                onLoad(gltf);
                scope.manager.itemEnd(url);
              },
              _onError,
            );
          } catch (e) {
            _onError(e);
          }
        },
        onProgress,
        _onError,
      );
    },
    parse: function (data, path, onLoad, onError) {
      let content;
      const extensions = {},
        plugins = {};
      if (typeof data === "string") {
        content = data;
      } else {
        const magic = THREE.LoaderUtils.decodeText(new Uint8Array(data, 0, 4));
        if (magic === BINARY_MAGIC) {
          try {
            extensions[EXTS.KHR_BINARY_GLTF] = new GLTFBinaryExtension(data);
          } catch (e) {
            if (onError) onError(e);
            return;
          }
          content = extensions[EXTS.KHR_BINARY_GLTF].content;
        } else {
          content = THREE.LoaderUtils.decodeText(new Uint8Array(data));
        }
      }
      const json = JSON.parse(content);
      if (!json.asset || json.asset.version[0] < 2) {
        if (onError) onError(new Error("GLTFLoader: glTF 2.0+ required."));
        return;
      }
      const parser = new GLTFParser(json, {
        path: path || this.resourcePath || "",
        crossOrigin: this.crossOrigin,
        requestHeader: this.requestHeader,
        manager: this.manager,
      });
      parser.fileLoader.setRequestHeader(this.requestHeader);
      (json.extensionsUsed || []).forEach((name) => {
        switch (name) {
          case EXTS.KHR_MATERIALS_UNLIT:
            extensions[name] = new GLTFMaterialsUnlitExtension();
            break;
          case EXTS.KHR_LIGHTS_PUNCTUAL:
            extensions[name] = new GLTFLightExtension(parser);
            break;
          case EXTS.KHR_TEXTURE_TRANSFORM:
            extensions[name] = new GLTFTextureTransformExtension();
            break;
          case EXTS.KHR_MESH_QUANTIZATION:
            extensions[name] = new GLTFMeshQuantizationExtension();
            break;
        }
      });
      parser.setExtensions(extensions);
      parser.setPlugins(plugins);
      parser.parse(onLoad, onError);
    },
  });

  THREE.GLTFLoader = GLTFLoader;
}


// ============================================================
// THREE.JS INIT
// ============================================================
function initThree() {
  const canvas = document.getElementById("c");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  clock = new THREE.Clock();

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  document.getElementById("c").addEventListener("click", onCanvasClick);
  setupOrbitControls();
  buildDots();
  // Use CDN GLTFLoader if already available (avoids class-extends bug in embedded version)
  if (!window.__gltfLoaderPreloaded || !THREE.GLTFLoader) {
    embedGLTFLoader(THREE);
  }
}

// ── Orbit ──
const orbit = {
  theta: 0.4,
  phi: 0.85,
  radius: 18,
  tx: 0,
  ty: 1,
  tz: 0,
  dragging: false,
  button: -1,
  lx: 0,
  ly: 0,
  minR: 4,
  maxR: 80,
  minPhi: 0.1,
  maxPhi: Math.PI * 0.48,
};

function applyOrbit() {
  const sp = Math.sin(orbit.phi),
    cp = Math.cos(orbit.phi);
  camera.position.x = orbit.tx + orbit.radius * sp * Math.sin(orbit.theta);
  camera.position.y = orbit.ty + orbit.radius * cp;
  camera.position.z = orbit.tz + orbit.radius * sp * Math.cos(orbit.theta);
  camera.lookAt(orbit.tx, orbit.ty, orbit.tz);
}

function setupOrbitControls() {
  const canvas = document.getElementById("c");
  canvas.addEventListener("mousedown", (e) => {
    if (isDraggingItem) return; // KUNCI KAMERA
    if (currentScene === 1) return; // Scene 2: kamera terkunci
    if (s3p2_cameraLocked) return; // Scene 3 Part-1: kamera terkunci saat tantangan berjalan
    orbit.dragging = true;
    orbit.button = e.button;
    orbit.ctrlHeld = e.ctrlKey;
    orbit.lx = e.clientX;
    orbit.ly = e.clientY;
    e.preventDefault();
  });
  window.addEventListener("mousemove", (e) => {
    if (!orbit.dragging) return;
    const dx = e.clientX - orbit.lx,
      dy = e.clientY - orbit.ly;
    orbit.lx = e.clientX;
    orbit.ly = e.clientY;
    // Ctrl + Left click = pan (same as right-click drag)
    if (orbit.button === 0 && orbit.ctrlHeld) {
      const ps = orbit.radius * 0.0012;
      const rx = Math.cos(orbit.theta),
        rz = -Math.sin(orbit.theta);
      orbit.tx -= rx * dx * ps;
      orbit.tz -= rz * dx * ps;
      orbit.ty += dy * ps;
    } else if (orbit.button === 0) {
      orbit.theta -= dx * 0.007;
      orbit.phi = Math.max(
        orbit.minPhi,
        Math.min(orbit.maxPhi, orbit.phi + dy * 0.007),
      );
    } else if (orbit.button === 2) {
      const ps = orbit.radius * 0.0012;
      const rx = Math.cos(orbit.theta),
        rz = -Math.sin(orbit.theta);
      orbit.tx -= rx * dx * ps;
      orbit.tz -= rz * dx * ps;
      orbit.ty += dy * ps;
    }
    applyOrbit();
  });
  window.addEventListener("mouseup", () => {
    orbit.dragging = false;
    orbit.button = -1;
  });
  canvas.addEventListener(
    "wheel",
    (e) => {
      if (currentScene === 1) {
        e.preventDefault();
        return;
      } // Scene 2: kunci zoom
      orbit.radius = Math.max(
        orbit.minR,
        Math.min(orbit.maxR, orbit.radius + e.deltaY * 0.04),
      );
      applyOrbit();
      e.preventDefault();
    },
    { passive: false },
  );
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  // Touch support
  let lastTouch = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (isDraggingItem) return; // KUNCI KAMERA
      if (currentScene === 1) return; // Scene 2: kamera terkunci
      if (s3p2_cameraLocked) return; // Scene 3 Part-1: kamera terkunci saat tantangan berjalan
      if (e.touches.length === 1) {
        orbit.dragging = true;
        orbit.button = 0;
        orbit.lx = e.touches[0].clientX;
        orbit.ly = e.touches[0].clientY;
      }
      e.preventDefault();
    },
    { passive: false },
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!orbit.dragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - orbit.lx,
        dy = e.touches[0].clientY - orbit.ly;
      orbit.lx = e.touches[0].clientX;
      orbit.ly = e.touches[0].clientY;
      orbit.theta -= dx * 0.007;
      orbit.phi = Math.max(
        orbit.minPhi,
        Math.min(orbit.maxPhi, orbit.phi + dy * 0.007),
      );
      applyOrbit();
      e.preventDefault();
    },
    { passive: false },
  );
  canvas.addEventListener("touchend", () => {
    orbit.dragging = false;
  });
}

function resetOrbitForScene(idx) {
  // Scene 2 (idx=1): locked top-down overhead view matching image reference
  const radii = [32, 28, 18, 16, 14, 18, 16, 14, 12, 12];
  const heights = [0.75, 0.42, 0.8, 0.85, 0.9, 0.9, 0.85, 0.8, 0.8, 0.9];
  const thetas = [0.4, 0.0, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4];
  const targetsY = [2, 4, 2, 2, 2, 2, 2, 2, 2, 2];
  const targetsZ = [0, 2, 0, 0, 0, 0, 0, 0, 0, 0];
  orbit.radius = radii[idx] !== undefined ? radii[idx] : 16;
  orbit.phi = heights[idx] !== undefined ? heights[idx] : 0.85;
  orbit.theta = thetas[idx] !== undefined ? thetas[idx] : 0.4;
  orbit.tx = 0;
  orbit.ty = targetsY[idx] !== undefined ? targetsY[idx] : 2;
  orbit.tz = targetsZ[idx] !== undefined ? targetsZ[idx] : 0;
  applyOrbit();
}

// ── Scene 1: project 3D label anchors to screen space each frame ──
function updateScene1Labels() {
  if (currentScene !== 0) return;

  const lblHealthy = document.getElementById("lbl-healthy");
  const lblDamaged = document.getElementById("lbl-damaged");
  if (!lblHealthy || !lblDamaged) return;

  function projectAnchor(model) {
    if (!model || !camera || !renderer) return null;
    // Compute the top-center of the model's bounding box in world space
    const box = new THREE.Box3().setFromObject(model);
    if (box.isEmpty()) return null;
    const topCenter = new THREE.Vector3(
      (box.min.x + box.max.x) / 2,
      box.max.y + 1.5, // float slightly above the top
      (box.min.z + box.max.z) / 2,
    );
    // Project to NDC
    topCenter.project(camera);
    // Check if behind camera
    if (topCenter.z > 1) return null;
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      x: ((topCenter.x + 1) / 2) * w,
      y: ((-topCenter.y + 1) / 2) * h,
    };
  }

  const ph = projectAnchor(scene1Anchors.healthy);
  if (ph) {
    lblHealthy.classList.add("visible");
    // Override position: use absolute instead of static layout
    lblHealthy.style.position = "fixed";
    lblHealthy.style.left = ph.x + "px";
    lblHealthy.style.top = ph.y + "px";
    lblHealthy.style.transform = "translate(-50%, -50%)";
    lblHealthy.style.bottom = "auto";
  }

  const pd = projectAnchor(scene1Anchors.damaged);
  if (pd) {
    lblDamaged.classList.add("visible");
    lblDamaged.style.position = "fixed";
    lblDamaged.style.left = pd.x + "px";
    lblDamaged.style.top = pd.y + "px";
    lblDamaged.style.transform = "translate(-50%, -50%)";
    lblDamaged.style.bottom = "auto";
  }
}

function loop() {
  requestAnimationFrame(loop);
  const dt = clock.getDelta();
  if (scene) {
    scene.traverse((obj) => {
      if (obj.userData.rotY) obj.rotation.y += obj.userData.rotY * dt;
      if (obj.userData.floatY) {
        obj.userData._t = (obj.userData._t || 0) + dt;
        obj.position.y =
          obj.userData.baseY +
          Math.sin(obj.userData._t * obj.userData.floatY) * 0.3;
      }
      if (obj.userData.pulse) {
        obj.userData._t = (obj.userData._t || 0) + dt;
        const s = 1 + Math.sin(obj.userData._t * 3) * 0.08;
        obj.scale.set(s, s, s);
      }
    });
  }
  if (mixer) mixer.update(dt);
  updateScene1Labels();
  s2_updateZoneLabels();
  applyOrbit(); // ← tambahkan ini jika belum ada
  if (renderer && scene && camera) renderer.render(scene, camera);
}

// ============================================================
// GLB LOADING
// ============================================================
function safeCloneGLB(source) {
  const root = new THREE.Group();
  function copyNode(src, dst) {
    let node;
    if (src.isMesh) {
      const mat = Array.isArray(src.material)
        ? src.material.map((m) => m.clone())
        : src.material.clone();
      node = new THREE.Mesh(src.geometry, mat);
    } else {
      node = new THREE.Group();
    }
    node.position.copy(src.position);
    node.quaternion.copy(src.quaternion);
    node.scale.copy(src.scale);
    node.name = src.name;
    node.visible = src.visible;
    node.castShadow = src.castShadow;
    node.receiveShadow = src.receiveShadow;
    node.userData = Object.assign({}, src.userData);
    dst.add(node);
    src.children.forEach((child) => copyNode(child, node));
  }
  source.children.forEach((child) => copyNode(child, root));
  return root;
}

function loadGLB(key, path, onLoad) {
  // Encode path untuk menangani spasi dan karakter khusus
  const safePath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  if (glbCache[key]) {
    try {
      onLoad(safeCloneGLB(glbCache[key].scene));
    } catch (e) {
      console.warn("GLB clone err:", e);
      onLoad(new THREE.Group());
    }
    return;
  }

  showStatus("⏳ Memuat " + key + "...");

  // Inisialisasi Loader Utama
  const loader = new THREE.GLTFLoader();

  // --- BAGIAN PENTING: Tambahkan DRACOLoader ---
  const dracoLoader = new THREE.DRACOLoader();
  // Menggunakan decoder dari Google CDN agar praktis
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
  );
  loader.setDRACOLoader(dracoLoader);
  // ---------------------------------------------

  loader.load(
    safePath,
    (gltf) => {
      glbCache[key] = gltf;
      hideStatus();
      try {
        onLoad(safeCloneGLB(gltf.scene));
      } catch (e) {
        console.warn(e);
        onLoad(makeFallbackModel(key));
      }
    },
    (prog) => {
      if (prog.total)
        showStatus(
          "⏳ " +
            key +
            ": " +
            Math.round((prog.loaded / prog.total) * 100) +
            "%",
        );
    },
    (err) => {
      console.warn("GLB load failed:", key, err);
      hideStatus();
      onLoad(makeFallbackModel(key));
    },
  );
}

function fitModelToBox(obj, targetSize) {
  const box = new THREE.Box3().setFromObject(obj);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (!maxDim) return;
  const scale = targetSize / maxDim;
  obj.scale.setScalar(scale);
  const box2 = new THREE.Box3().setFromObject(obj);
  const center = box2.getCenter(new THREE.Vector3());
  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= new THREE.Box3().setFromObject(obj).min.y;
}

function makeFallbackModel(key) {
  const g = new THREE.Group();
  if (key === "lowPolyTree" || key === "smallForest") {
    const count = key === "smallForest" ? 8 : 4;
    for (let i = 0; i < count; i++)
      g.add(
        makeTree(
          (Math.random() - 0.5) * 10,
          0,
          (Math.random() - 0.5) * 10,
          Math.random() * 0.6 + 0.7,
        ),
      );
  } else if (key === "coolingTower") {
    const t = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 3, 12, 16),
      new THREE.MeshPhongMaterial({ color: 0x888888 }),
    );
    t.position.y = 6;
    g.add(t);
    for (let i = 0; i < 8; i++) {
      const sp = new THREE.Mesh(
        new THREE.SphereGeometry(0.5 + Math.random() * 0.4, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0x777777,
          transparent: true,
          opacity: 0.4,
        }),
      );
      sp.position.set(
        (Math.random() - 0.5) * 2,
        12 + i * 1.2,
        (Math.random() - 0.5) * 2,
      );
      sp.userData.floatY = 0.4 + Math.random() * 0.3;
      sp.userData.baseY = sp.position.y;
      g.add(sp);
    }
  }
  return g;
}

// ============================================================

// SCENE MANAGEMENT
// ============================================================
function clearScene() {
  scene = new THREE.Scene();
  sceneObjects = [];
  mixer = null;
  builtObjects = {
    tree: 0,
    water: 0,
    solar: 0,
    animal: 0,
    bush: 0,
    building: 0,
  };
  damagedTrees = [];
  placedObjects = [];
  // Reset scene1 label anchors
  scene1Anchors.healthy = null;
  scene1Anchors.damaged = null;
  const lblH = document.getElementById("lbl-healthy");
  const lblD = document.getElementById("lbl-damaged");
  if (lblH) {
    lblH.classList.remove("visible");
    lblH.style.position = "";
    lblH.style.left = "";
    lblH.style.top = "";
    lblH.style.transform = "";
  }
  if (lblD) {
    lblD.classList.remove("visible");
    lblD.style.position = "";
    lblD.style.left = "";
    lblD.style.top = "";
    lblD.style.transform = "";
  }
  // Remove scene 2 puzzle overlay
  const s2overlay = document.getElementById("s2-puzzle-overlay");
  if (s2overlay) s2overlay.remove();
  // Remove old scene 2 overlay if any
  const s2old = document.getElementById("s2-overlay");
  if (s2old) s2old.remove();
  // Remove Scene 2 3D drag overlays
  const s2hud = document.getElementById("s2-hud-overlay");
  if (s2hud) s2hud.remove();
  const s2zl = document.getElementById("s2-zone-labels");
  if (s2zl) s2zl.remove();
  // Remove Scene 2 pointer events
  const cvs = document.getElementById("c");
  if (cvs) {
    cvs.removeEventListener("pointerdown", s2_onPointerDown);
    cvs.removeEventListener("pointermove", s2_onPointerMove);
    cvs.removeEventListener("pointerup", s2_onPointerUp);
  }
  // Reset zone planes refs
  s2_biotikPlane = null;
  s2_abiotikPlane = null;
  s2_dragObj = null;
  s2_isDragging = false;
  // Reset drag listener flag so Scene 2 re-attaches on fresh load
  s2_dragListenersAttached = false;
  // Restore narasi (hidden during Scene 2)
  const narasiEl2 = document.getElementById("narasi");
  if (narasiEl2) narasiEl2.style.display = "block";
}

function loadScene(idx) {
  clearScene();
  currentScene = idx;

  // Update HUD
  const s = SCENES[idx];
  document.getElementById("scene-title").textContent = s.title;
  document.getElementById("scene-counter").textContent = `${idx + 1} / 10`;
  document.getElementById("narasi-text").textContent = s.narasi;

  // Dots
  document
    .querySelectorAll(".dot")
    .forEach((d, i) => d.classList.toggle("active", i === idx));

  // Hide all UI panels
  [
    "slider-ui",
    "builder-ui",
    "balance-meter",
    "score-ui",
    "outro",
    "scene1-labels",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  document.getElementById("interact-ui").innerHTML = "";
  document.getElementById("tag-container").innerHTML = "";
  closeInfo();
  resetOrbitForScene(idx);

  // Fade transition
  const overlay = document.getElementById("scene-fade");
  if (overlay) {
    overlay.style.opacity = "1";
    overlay.style.transition = "none";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.transition = "opacity 0.6s ease";
        overlay.style.opacity = "0";
      });
    });
  }

  // In standalone mode, loadScene is replaced by window.location navigation.
  // buildCurrentScene() is defined in each scene's own JS file.
  if (typeof buildCurrentScene === 'function') buildCurrentScene();
}

// ============================================================

// ============================================================
// PRIMITIVE HELPERS
// ============================================================
function addLight() {
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const sun = new THREE.DirectionalLight(0xfff8dc, 1.4);
  sun.position.set(10, 20, 10);
  sun.castShadow = true;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x4488ff, 0.3);
  fill.position.set(-10, 5, -10);
  scene.add(fill);
}

function makePlane(w, d, color) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshPhongMaterial({ color, side: THREE.DoubleSide }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

// ── Procedural ground texture via Canvas ──
function makeProceduralTexture(type, size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (type === "grass") {
    // Base: medium green soil
    ctx.fillStyle = "#4a7240";
    ctx.fillRect(0, 0, size, size);

    // Layer darker patches (soil showing through)
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 2 + Math.random() * 10;
      const alpha = 0.15 + Math.random() * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(60,40,15,${alpha})`;
      ctx.fill();
    }
    // Lighter green grass tufts
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 1 + Math.random() * 5;
      const g = 100 + Math.floor(Math.random() * 60);
      const alpha = 0.2 + Math.random() * 0.4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(50,${g},30,${alpha})`;
      ctx.fill();
    }
    // Small stones
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 1 + Math.random() * 3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(140,130,100,0.4)`;
      ctx.fill();
    }
  } else if (type === "dry") {
    // Base: dry sandy brown
    ctx.fillStyle = "#a0845a";
    ctx.fillRect(0, 0, size, size);

    // Darker cracks / dirt patches
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 2 + Math.random() * 12;
      const alpha = 0.15 + Math.random() * 0.35;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(70,45,10,${alpha})`;
      ctx.fill();
    }
    // Light sandy spots
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 1 + Math.random() * 7;
      const alpha = 0.1 + Math.random() * 0.25;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,170,100,${alpha})`;
      ctx.fill();
    }
    // Crack lines
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      const sx = Math.random() * size;
      const sy = Math.random() * size;
      ctx.moveTo(sx, sy);
      ctx.lineTo(
        sx + (Math.random() - 0.5) * 60,
        sy + (Math.random() - 0.5) * 60,
      );
      ctx.strokeStyle = `rgba(60,35,5,0.25)`;
      ctx.lineWidth = 0.5 + Math.random() * 1.5;
      ctx.stroke();
    }
    // Dust/pebbles
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 1 + Math.random() * 2.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(90,70,40,0.5)`;
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6); // tile the texture
  return tex;
}

function makePlaneTextured(w, d, texType, colorHex) {
  const tex = makeProceduralTexture(texType);
  const mat = new THREE.MeshLambertMaterial({
    map: tex,
    color: colorHex, // tint on top of texture
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d, 8, 8), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

function makeTree(x, y, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15 * scale, 0.25 * scale, 1.5 * scale, 8),
    new THREE.MeshPhongMaterial({ color: 0x5a2d0a }),
  );
  trunk.position.y = 0.75 * scale;
  trunk.castShadow = true;
  g.add(trunk);
  [
    { r: 1.2, h: 1.6, y: 2.2, c: 0x2d9e50 },
    { r: 0.9, h: 1.4, y: 3.2, c: 0x3db860 },
    { r: 0.6, h: 1.2, y: 4.0, c: 0x4ecf70 },
  ].forEach((l) => {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(l.r * scale, l.h * scale, 8),
      new THREE.MeshPhongMaterial({ color: l.c }),
    );
    cone.position.y = l.y * scale;
    cone.castShadow = true;
    g.add(cone);
  });
  g.position.set(x, y, z);
  return g;
}

function makeBush(x, y, z) {
  const g = new THREE.Group();
  [0x1a8a2a, 0x22a032, 0x2ab83a].forEach((c) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.4 + Math.random() * 0.3, 8, 8),
      new THREE.MeshPhongMaterial({ color: c }),
    );
    mesh.position.set(
      (Math.random() - 0.5) * 0.6,
      0.3 + Math.random() * 0.2,
      (Math.random() - 0.5) * 0.6,
    );
    g.add(mesh);
  });
  g.position.set(x, y, z);
  return g;
}

function makeWaterPool(x, z) {
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 0.15, 16),
    new THREE.MeshPhongMaterial({
      color: 0x1565c0,
      transparent: true,
      opacity: 0.8,
    }),
  );
  mesh.position.y = 0.08;
  g.add(mesh);
  [0, 1].forEach((i) => {
    const r = new THREE.Mesh(
      new THREE.TorusGeometry(1 + i * 0.4, 0.04, 8, 24),
      new THREE.MeshBasicMaterial({
        color: 0x42a5f5,
        transparent: true,
        opacity: 0.4 - i * 0.15,
      }),
    );
    r.rotation.x = Math.PI / 2;
    r.position.y = 0.16;
    r.userData.rotY = 0.5;
    g.add(r);
  });
  g.position.set(x, 0, z);
  return g;
}

function makeSolarPanel(x, z) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 1.5, 8),
    new THREE.MeshPhongMaterial({ color: 0x888888 }),
  );
  pole.position.y = 0.75;
  g.add(pole);
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.06, 1),
    new THREE.MeshPhongMaterial({
      color: 0x1a237e,
      emissive: 0x0d47a1,
      emissiveIntensity: 0.3,
    }),
  );
  panel.position.y = 1.6;
  panel.rotation.x = -Math.PI / 8;
  g.add(panel);
  g.position.set(x, 0, z);
  return g;
}

function makeAnimalHabitat(x, z) {
  const g = new THREE.Group();
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 16),
    new THREE.MeshPhongMaterial({ color: 0x8b6914 }),
  );
  ground.rotation.x = -Math.PI / 2;
  g.add(ground);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6),
      new THREE.MeshPhongMaterial({ color: 0x795548 }),
    );
    post.position.set(Math.cos(a) * 1.5, 0.4, Math.sin(a) * 1.5);
    g.add(post);
  }
  for (let i = 0; i < 3; i++) {
    const animal = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 8),
      new THREE.MeshPhongMaterial({ color: 0x795548 }),
    );
    animal.position.set(
      (Math.random() - 0.5) * 2,
      0.25,
      (Math.random() - 0.5) * 2,
    );
    animal.userData.floatY = 0.3 + Math.random() * 0.2;
    animal.userData.baseY = 0.25;
    g.add(animal);
  }
  g.position.set(x, 0, z);
  return g;
}

function makeGreenBuilding(x, z) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2, 3, 2),
    new THREE.MeshPhongMaterial({ color: 0x558b2f }),
  );
  body.position.y = 1.5;
  g.add(body);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.6, 1.2, 4),
    new THREE.MeshPhongMaterial({ color: 0x33691e }),
  );
  roof.position.y = 3.6;
  g.add(roof);
  for (let i = 0; i < 5; i++) {
    const plant = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 6, 6),
      new THREE.MeshPhongMaterial({ color: 0x4caf50 }),
    );
    plant.position.set(
      (Math.random() - 0.5) * 1.6,
      3.05,
      (Math.random() - 0.5) * 1.6,
    );
    g.add(plant);
  }
  g.position.set(x, 0, z);
  return g;
}

function buildHealthyEco(ox, oy, oz) {
  scene.add(makePlane(12, 12, 0x2d5a1b));
  for (let i = 0; i < 8; i++)
    scene.add(
      makeTree(
        ox + (Math.random() - 0.5) * 10,
        oy,
        oz + (Math.random() - 0.5) * 10,
        Math.random() * 0.5 + 0.8,
      ),
    );
  const river = makePlane(2, 10, 0x1565c0);
  river.position.set(ox - 1, oy + 0.02, oz);
  river.rotation.y = Math.PI / 6;
  scene.add(river);
  for (let i = 0; i < 6; i++)
    scene.add(
      makeBush(
        ox + (Math.random() - 0.5) * 9,
        oy,
        oz + (Math.random() - 0.5) * 9,
      ),
    );
}

// ============================================================
// UI HELPERS
// ============================================================
function showStatus(msg) {
  const el = document.getElementById("glb-status");
  if (el) {
    el.textContent = msg;
    el.style.display = "block";
  }
}
function hideStatus() {
  const el = document.getElementById("glb-status");
  if (el) el.style.display = "none";
}

function addInteractBtn(label, fn) {
  const ui = document.getElementById("interact-ui");
  const btn = document.createElement("button");
  btn.className = "interact-btn";
  btn.innerHTML = label;
  btn.onclick = fn;
  ui.appendChild(btn);
}

function showInfo(title, body) {
  document.getElementById("info-title").textContent = title;
  document.getElementById("info-body").textContent = body;
  document.getElementById("info-panel").classList.add("show");
}

function closeInfo() {
  document.getElementById("info-panel").classList.remove("show");
}

function addTag(label, lPct, tPct, isAbiotik, desc) {
  const container = document.getElementById("tag-container");
  const tag = document.createElement("div");
  tag.className = "obj-tag" + (isAbiotik ? " abiotik" : "");
  tag.style.left = lPct + "%";
  tag.style.top = tPct + "%";
  tag.textContent = label;
  tag.onclick = () => showInfo(label, desc);
  container.appendChild(tag);
}

function buildDots() {
  const cont = document.getElementById("scene-dots");
  cont.innerHTML = "";
  SCENES.forEach((_, i) => {
    const d = document.createElement("div");
    d.className = "dot" + (i === 0 ? " active" : "");
    d.title = SCENES[i].title;
    d.onclick = () => loadScene(i);
    cont.appendChild(d);
  });
}

function nextScene() {
  if (currentScene < SCENES.length - 1) loadScene(currentScene + 1);
}
function prevScene() {
  if (currentScene > 0) loadScene(currentScene - 1);
}

function restartApp() {
  builtObjects = {
    tree: 0,
    water: 0,
    solar: 0,
    animal: 0,
    bush: 0,
    building: 0,
  };
  loadScene(0);
}

// Canvas click raycasting
let raycaster = null;
let mouse = null; // initialized in startSceneApp

function onCanvasClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(scene ? scene.children : [], true);
  if (hits.length > 0) {
    const obj = hits[0].object;
    if (obj.userData.chainIndex !== undefined) {
      const item = (typeof chainItems !== 'undefined') ? chainItems[obj.userData.chainIndex] : null;
    if (!item) return;
      if (item) showInfo(
        item.label,
        `Tingkat: ${item.role}\n\nKlik tombol animasi untuk melihat aliran energi!`,
      );
    }
  }
}

// ============================================================
// APP ENTRY POINTS
// ============================================================
function startApp() {
  document.getElementById("intro-screen").style.display = "none";

  // Inject AR frame now (was removed from HTML to prevent blocking intro)
  if (!document.querySelector(".ar-frame")) {
    const arFrame = document.createElement("div");
    arFrame.className = "ar-frame";
    arFrame.innerHTML =
      '<div class="ar-corner tl"></div>' +
      '<div class="ar-corner tr"></div>' +
      '<div class="ar-corner bl"></div>' +
      '<div class="ar-corner br"></div>' +
      '<div class="ar-scan">🔴 AR · LIVE</div>';
    document.body.appendChild(arFrame);
  }

  // Reveal scene UI elements
  document.getElementById("hud").style.display = "flex";
  document.getElementById("nav").style.display = "flex";
  document.getElementById("narasi").style.display = "block";
  document.getElementById("interact-ui").style.display = "flex";

  initThree();
  loadScene(0);
  loop(); // <--- KAMU LUPA MENULISKAN INI

  // Fade in canvas
  const fo = document.getElementById("scene-fade");
  if (fo) {
    fo.style.opacity = "1";
    fo.style.transition = "none";
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        fo.style.transition = "opacity 1.2s ease";
        fo.style.opacity = "0";
      }),
    );
  }
}

function exitApp() {
  const intro = document.getElementById("intro-screen");
  intro.innerHTML =
    '<p style="color:rgba(255,255,255,0.5);font-size:15px;text-align:center;padding:40px">Tutup tab ini untuk keluar.</p>';
}


// ============================================================
// STANDALONE NAVIGATION — override for per-scene HTML files
// ============================================================
function nextScene() {
  const next = SCENES[currentScene + 1];
  if (next) {
    // Save builtObjects to localStorage for scenes 7→8→9
    try { localStorage.setItem('ar_builtObjects', JSON.stringify(builtObjects)); } catch(e){}
    window.location.href = next.file;
  }
}
function prevScene() {
  const prev = SCENES[currentScene - 1];
  if (prev) {
    try { localStorage.setItem('ar_builtObjects', JSON.stringify(builtObjects)); } catch(e){}
    window.location.href = prev.file;
  }
}
function restartApp() {
  builtObjects = { tree:0, water:0, solar:0, animal:0, bush:0, building:0 };
  try { localStorage.removeItem('ar_builtObjects'); } catch(e){}
  window.location.href = 'scene-1.html';
}

// ── Restore builtObjects from localStorage (used in scene 8 & 9) ──
function restoreBuiltObjects() {
  try {
    const saved = localStorage.getItem('ar_builtObjects');
    if (saved) builtObjects = JSON.parse(saved);
  } catch(e){}
}

// ── Standalone startApp: init Three.js and load the scene directly ──
function startSceneApp(sceneIndex) {
  // Initialize THREE-dependent globals that were deferred
  if (typeof THREE !== 'undefined') {
    if (!s2_raycaster) s2_raycaster = new THREE.Raycaster();
    if (!s2_mouse) s2_mouse = new THREE.Vector2();
    if (!s2_dragOffset) s2_dragOffset = new THREE.Vector3();
    if (!raycaster) raycaster = new THREE.Raycaster();
    if (!mouse) mouse = new THREE.Vector2();
  }
  currentScene = sceneIndex;
  restoreBuiltObjects();

  // Inject AR frame
  if (!document.querySelector('.ar-frame')) {
    const arFrame = document.createElement('div');
    arFrame.className = 'ar-frame';
    arFrame.innerHTML =
      '<div class="ar-corner tl"></div>' +
      '<div class="ar-corner tr"></div>' +
      '<div class="ar-corner bl"></div>' +
      '<div class="ar-corner br"></div>' +
      '<div class="ar-scan">🔴 AR · LIVE</div>';
    document.body.appendChild(arFrame);
  }

  document.getElementById('hud').style.display = 'flex';
  document.getElementById('nav').style.display = 'flex';
  document.getElementById('narasi').style.display = 'block';
  document.getElementById('interact-ui').style.display = 'flex';

  // Update HUD with current scene info
  const s = SCENES[sceneIndex];
  if (s) {
    document.getElementById('scene-title').textContent = s.title;
    document.getElementById('scene-counter').textContent = `${sceneIndex + 1} / ${SCENES.length}`;
    document.getElementById('narasi-text').textContent = s.narasi;
  }

  // Update nav dots
  buildDots();
  // ── Progress bar ──
  let pb = document.getElementById('scene-progress-bar');
  if (!pb) {
    pb = document.createElement('div');
    pb.id = 'scene-progress-bar';
    pb.className = 'scene-progress-bar';
    document.body.appendChild(pb);
  }
  const pct = ((sceneIndex) / (SCENES.length - 1)) * 100;
  pb.style.width = pct + '%';

  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === sceneIndex));

  // Disable prev/next buttons at boundaries
  const prevBtn = document.querySelector('#nav .nav-btn:first-child');
  const nextBtn = document.querySelector('#nav .nav-btn.primary');
  if (prevBtn) prevBtn.disabled = sceneIndex === 0;
  if (nextBtn) nextBtn.disabled = sceneIndex === SCENES.length - 1;

  initThree();
  scene = new THREE.Scene();
  sceneObjects = [];
  mixer = null;
  damagedTrees = [];
  placedObjects = [];

  // Load the scene builder
  resetOrbitForScene(sceneIndex);
  if (typeof buildCurrentScene === 'function') buildCurrentScene();

  loop();

  // Fade in
  const fo = document.getElementById('scene-fade');
  if (fo) {
    fo.style.opacity = '1';
    fo.style.transition = 'none';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fo.style.transition = 'opacity 1.2s ease';
      fo.style.opacity = '0';
    }));
  }
}

// ── Stub functions for scene 2 compatibility (stubs in non-s2 scenes) ──
function s2_updateZoneLabels() {}

