// ============================================================
// AR EKOSISTEM — Main Application JS
// Handles: Three.js engine, GLTFLoader (embedded), all scenes
// ============================================================

"use strict";

// ── Global State ──
let draggableObjects = []; // ← tambahkan ini
let renderer, camera, scene, clock;
let mixer = null;
let glbCache = {}; // Cache untuk menyimpan GLB yang sudah dimuat
let currentScene = 0;
let animating = false;
let builtObjects = {
  tree: 0,
  water: 0,
  solar: 0,
  animal: 0,
  bush: 0,
  building: 0,
};
let sceneObjects = [];
let damagedTrees = [];
let dmgLevel = 0;
let placedObjects = [];
let foodChainStep = 0;

let isDraggingItem = false;
let scene2DragControls = null;
let biotikZone = { min: -15, max: 0 };
let abiotikZone = { min: 0, max: 15 };

// Scene 1 label anchors — 3D world positions bound to labels
const scene1Anchors = {
  healthy: null, // will hold THREE.Object3D anchor
  damaged: null,
};

const GLB_PATHS = {
  lowPolyTree: "low_poly_tree_scene_free-compressed.glb",
  smallForest: "small_forest-compressed.glb",
  coolingTower: "nuklir.glb",
  // ASET SCENE 2
  base: "tanah_sceen2.glb",
  batu: "batu.glb",
  singa: "singa.glb",
  air: "genangan_air.glb",
  rusa: "rusa.glb",
  manusia: "manusia.glb",
  matahari: "matahari.glb",
  pohon: "pohon.glb",
};

const SCENES = [
  {
    title: "Scene 1 — Pembuka",
    narasi:
      "Lingkungan kita sedang mengalami perubahan. Bagaimana cara kita merancang ekosistem yang lebih ramah lingkungan?",
  },
  {
    title: "Scene 2 — Konsep Ekosistem",
    narasi:
      "Ekosistem terdiri dari komponen biotik dan abiotik yang saling berinteraksi.",
  },
  {
    title: "Scene 3 — Aliran Energi",
    narasi: "Energi mengalir dari produsen ke konsumen hingga pengurai.",
  },
  {
    title: "Scene 4 — Dampak Manusia",
    narasi: "Aktivitas manusia dapat mengganggu keseimbangan ekosistem.",
  },
  {
    title: "Scene 5 — Prinsip Ramah Lingkungan",
    narasi:
      "Ekosistem ramah lingkungan dirancang untuk menjaga keseimbangan alam.",
  },
  {
    title: "Scene 6 — Tantangan Proyek",
    narasi: "Saatnya kamu merancang ekosistem ramah lingkunganmu sendiri!",
  },
  {
    title: "Scene 7 — Desain Ekosistem",
    narasi:
      "Tambahkan komponen ekosistem dan perhatikan indikator keseimbangan!",
  },
  {
    title: "Scene 8 — Simulasi Hasil",
    narasi: "Desainmu mempengaruhi keberlanjutan ekosistem.",
  },
  {
    title: "Scene 9 — Evaluasi & Refleksi",
    narasi: "Mari kita nilai ekosistem yang telah kamu rancang.",
  },
  { title: "Scene 10 — Penutup", narasi: "" },
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

  const builders = [
    buildScene1,
    buildScene2,
    buildScene3,
    buildScene4,
    buildScene5,
    buildScene6,
    buildScene7,
    buildScene8,
    buildScene9,
    buildScene10,
  ];
  if (builders[idx]) builders[idx]();
}

// ============================================================
// SCENE BUILDERS
// ============================================================

// SCENE 1 — Pembuka with GLB models
function buildScene1() {
  scene.background = new THREE.Color(0x0a1628);
  addLight();

  // ── Ground utama — tanah gelap di luar batas ──
  const ground = makePlaneTextured(80, 36, "dry", 0x2a1e10);
  scene.add(ground);

  // ── Divider tengah — garis tipis pemisah ──
  const div = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 10, 36),
    new THREE.MeshBasicMaterial({
      color: 0x8a7a6a,
      transparent: true,
      opacity: 0.2,
    }),
  );
  div.position.set(0, 5, 0);
  scene.add(div);

  // ── Sisi EKOSISTEM SEHAT — tekstur rumput hijau natural ──
  const gH = makePlaneTextured(34, 34, "grass", 0x557a40);
  gH.position.set(-18, 0.01, 0);
  scene.add(gH);

  // ── Sisi EKOSISTEM RUSAK — tekstur tanah kering & retak ──
  const gD = makePlaneTextured(34, 34, "dry", 0x8a6a35);
  gD.position.set(18, 0.01, 0);
  scene.add(gD);

  // Reset anchors for this scene
  scene1Anchors.healthy = null;
  scene1Anchors.damaged = null;

  // GLB: low poly tree (healthy side) — with fade-in
  loadGLB("lowPolyTree", GLB_PATHS.lowPolyTree, (model) => {
    fitModelToBox(model, 14);
    model.position.set(-22, 0, 2);
    model.rotation.y = Math.PI * 0.1;
    model.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    fadeInModel(model, 1200);
    if (scene) {
      scene.add(model);
      // Use this first tree model as the healthy anchor
      // We'll place the label above its bounding box top
      model.userData.isScene1HealthyAnchor = true;
      scene1Anchors.healthy = model;
    }
  });

  // GLB: small forest (healthy side center) — with fade-in
  loadGLB("smallForest", GLB_PATHS.smallForest, (model) => {
    fitModelToBox(model, 13);
    model.position.set(-10, 0, -4);
    model.rotation.y = -Math.PI * 0.15;
    model.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    fadeInModel(model, 1800);
    if (scene) scene.add(model);
    // If healthy anchor not set yet, also accept this as fallback
    if (!scene1Anchors.healthy) scene1Anchors.healthy = model;
  });

  // GLB: cooling tower (damaged side) — with fade-in
  loadGLB("coolingTower", GLB_PATHS.coolingTower, (model) => {
    fitModelToBox(model, 18);
    model.position.set(18, 0, 0);
    model.rotation.y = Math.PI * 0.05;
    model.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    fadeInModel(model, 2400);
    if (scene) {
      scene.add(model);
      scene1Anchors.damaged = model;
    }

    // Smoke particles
    for (let i = 0; i < 20; i++) {
      const sp = new THREE.Mesh(
        new THREE.SphereGeometry(0.25 + Math.random() * 0.4, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0x888888,
          transparent: true,
          opacity: 0.35,
        }),
      );
      sp.position.set(
        18 + (Math.random() - 0.5) * 5,
        5 + i * 0.9 + Math.random(),
        (Math.random() - 0.5) * 4,
      );
      sp.userData.floatY = 0.3 + Math.random() * 0.5;
      sp.userData.baseY = sp.position.y;
      if (scene) scene.add(sp);
    }
  });

  // Scene 1 labels: hide the fixed-position container;
  // labels will be repositioned each frame via updateScene1Labels()
  const lab = document.getElementById("scene1-labels");
  if (lab) {
    lab.style.display = "flex";
    // Labels start hidden; shown once anchors are ready (handled in render loop)
  }

  addInteractBtn("🌿 Apa Itu Ekosistem?", () =>
    showInfo(
      "Ekosistem",
      "Sistem ekologi yang terbentuk dari hubungan timbal balik antara makhluk hidup dengan lingkungannya.\n\nKomponen: Biotik + Abiotik",
    ),
  );
  addInteractBtn("🏭 Penyebab Kerusakan", () =>
    showInfo(
      "Kerusakan Ekosistem",
      "• Polusi udara & air\n• Deforestasi\n• Limbah industri\n• Urbanisasi berlebihan\n• Perubahan iklim",
    ),
  );
  addInteractBtn("🏭 Tentang PLTU", () =>
    showInfo(
      "Pembangkit Listrik Tenaga Uap",
      "PLTU menggunakan bahan bakar fosil. Dampak:\n• Emisi CO₂ & SO₂\n• Polusi air\n• Hujan asam\n• Pemanasan global",
    ),
  );
}

// ── Fade-in effect for GLB models ──
function fadeInModel(model, delay = 0) {
  model.traverse((c) => {
    if (c.isMesh && c.material) {
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach((m) => {
        m.transparent = true;
        m.opacity = 0;
      });
    }
  });
  let start = null;
  const duration = 1200;
  function tick(ts) {
    if (!start) start = ts + delay;
    const elapsed = ts - start;
    if (elapsed < 0) {
      requestAnimationFrame(tick);
      return;
    }
    const t = Math.min(elapsed / duration, 1);
    model.traverse((c) => {
      if (c.isMesh && c.material) {
        const mats = Array.isArray(c.material) ? c.material : [c.material];
        mats.forEach((m) => {
          m.opacity = t;
          if (t >= 1) {
            m.transparent = false;
          }
        });
      }
    });
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ============================================================
// SCENE 2 — Konsep Ekosistem (3D DRAG & DROP v4)
// Sistem: Objek 3D GLB sebagai balok draggable di canvas Three.js
// Drop ke zona 3D → pengecekan biotik/abiotik via raycast plane
// HTML overlay hanya untuk progress / score / feedback / hint
// ============================================================

// ── State Scene 2 ──
let s2_itemsMeshes = []; // array of { group, data, placed, originalPos }
let s2_correctCount = 0;
let s2_totalItems = 0;
let s2_solved = {};
let s2_highlightedObj = null;
let s2_raycaster = new THREE.Raycaster();
let s2_mouse = new THREE.Vector2();
let s2_clickHandler = null;

// Drop zone planes (invisible, for raycasting)
let s2_biotikPlane = null;
let s2_abiotikPlane = null;

// Drag state
let s2_dragObj = null; // { group, data } being dragged
let s2_dragPlane = null; // infinite y-plane for drag intersection
let s2_dragOffset = new THREE.Vector3();
let s2_isDragging = false;
let s2_mouseDownObj = null;
let s2_pointerDownPos = null;

// Label HTML elements overlaid over 3D zones
let s2_zoneLabels = null;

// ── Data komponen ekosistem ──
const S2_ITEMS = [
  {
    k: "pohon",
    lbl: "🌳 Pohon",
    tipe: "biotik",
    emoji: "🌳",
    kategori: "Produsen",
    fungsi:
      "Menghasilkan oksigen & menjadi sumber makanan melalui fotosintesis.",
    fakta: "Satu pohon bisa menyerap 22 kg CO₂ per tahun!",
    warna: 0x2d9e50,
  },
  {
    k: "rusa",
    lbl: "🦌 Rusa",
    tipe: "biotik",
    emoji: "🦌",
    kategori: "Konsumen",
    fungsi:
      "Hewan herbivora yang memakan tumbuhan. Bagian dari rantai makanan.",
    fakta:
      "Rusa jantan menggunakan tanduknya untuk bersaing mendapatkan pasangan!",
    warna: 0x8b5e3c,
  },
  {
    k: "singa",
    lbl: "🦁 Singa",
    tipe: "biotik",
    emoji: "🦁",
    kategori: "Konsumen Puncak",
    fungsi: "Predator puncak yang mengontrol populasi hewan lain di ekosistem.",
    fakta:
      "Singa adalah satu-satunya kucing besar yang hidup berkelompok (pride)!",
    warna: 0xc8860a,
  },
  {
    k: "manusia",
    lbl: "🧑 Manusia",
    tipe: "biotik",
    emoji: "🧑",
    kategori: "Konsumen Puncak",
    fungsi:
      "Manusia berperan sebagai konsumen & memiliki tanggung jawab menjaga ekosistem.",
    fakta:
      "Manusia adalah satu-satunya makhluk hidup yang bisa merusak sekaligus memulihkan ekosistem.",
    warna: 0xe8a87c,
  },
  {
    k: "batu",
    lbl: "🪨 Batu",
    tipe: "abiotik",
    emoji: "🪨",
    kategori: "Komponen Abiotik",
    fungsi:
      "Menyediakan mineral & tempat hidup bagi organisme seperti lumut dan serangga.",
    fakta:
      "Batu granit terbentuk dari lava yang mendingin selama jutaan tahun!",
    warna: 0x9e9e9e,
  },
  {
    k: "air",
    lbl: "💧 Air",
    tipe: "abiotik",
    emoji: "💧",
    kategori: "Komponen Abiotik",
    fungsi:
      "Pelarut universal yang dibutuhkan semua makhluk hidup untuk metabolisme.",
    fakta: "97% air di bumi adalah air asin. Hanya 3% yang air tawar!",
    warna: 0x42a5f5,
  },
  {
    k: "matahari",
    lbl: "☀️ Matahari",
    tipe: "abiotik",
    emoji: "☀️",
    kategori: "Sumber Energi Utama",
    fungsi:
      "Sumber energi primer ekosistem. Menggerakkan fotosintesis & siklus air.",
    fakta:
      "Energi matahari yang sampai ke bumi dalam 1 jam cukup untuk seluruh kebutuhan manusia setahun!",
    warna: 0xffca28,
  },
];

// ── GLB key → fallback geometry factory ──
function s2_makeFallback(key, color) {
  const g = new THREE.Group();
  let mesh;
  switch (key) {
    case "pohon": {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.25, 1.2, 8),
        new THREE.MeshPhongMaterial({ color: 0x5d4037 }),
      );
      trunk.position.y = 0.6;
      g.add(trunk);
      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(1.0, 10, 10),
        new THREE.MeshPhongMaterial({ color: 0x2d9e50 }),
      );
      crown.position.y = 1.8;
      g.add(crown);
      break;
    }
    case "rusa": {
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry()
          ? new THREE.CapsuleGeometry(0.35, 0.9, 6, 8)
          : new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0x8b5e3c }),
      );
      body.position.y = 0.7;
      g.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0x8b5e3c }),
      );
      head.position.set(0.5, 1.2, 0);
      g.add(head);
      break;
    }
    case "singa": {
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 10, 10),
        new THREE.MeshPhongMaterial({ color: 0xc8860a }),
      );
      body.scale.set(1.2, 0.85, 1.6);
      body.position.y = 0.6;
      g.add(body);
      const mane = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 10, 10),
        new THREE.MeshPhongMaterial({ color: 0x7b4f10 }),
      );
      mane.position.set(0.6, 0.9, 0);
      g.add(mane);
      break;
    }
    case "manusia": {
      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.9, 0.25),
        new THREE.MeshPhongMaterial({ color: 0x3f51b5 }),
      );
      torso.position.y = 0.9;
      g.add(torso);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 10, 10),
        new THREE.MeshPhongMaterial({ color: 0xe8a87c }),
      );
      head.position.y = 1.65;
      g.add(head);
      break;
    }
    case "batu": {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.75, 0),
        new THREE.MeshPhongMaterial({ color: 0x9e9e9e, flatShading: true }),
      );
      rock.position.y = 0.5;
      rock.rotation.y = Math.random() * Math.PI;
      g.add(rock);
      break;
    }
    case "air": {
      const pool = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 1.0, 0.18, 20),
        new THREE.MeshPhongMaterial({
          color: 0x42a5f5,
          transparent: true,
          opacity: 0.75,
        }),
      );
      pool.position.y = 0.09;
      g.add(pool);
      [0, 1].forEach((i) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.6 + i * 0.3, 0.04, 8, 24),
          new THREE.MeshBasicMaterial({
            color: 0x81d4fa,
            transparent: true,
            opacity: 0.5 - i * 0.15,
          }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.19;
        ring.userData.rotY = 0.4 + i * 0.2;
        g.add(ring);
      });
      break;
    }
    case "matahari": {
      const sun = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 14, 14),
        new THREE.MeshBasicMaterial({ color: 0xffca28 }),
      );
      sun.position.y = 0.7;
      g.add(sun);
      for (let i = 0; i < 8; i++) {
        const ray = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6),
          new THREE.MeshBasicMaterial({ color: 0xffe082 }),
        );
        const angle = (i / 8) * Math.PI * 2;
        ray.position.set(Math.cos(angle) * 1.05, 0.7, Math.sin(angle) * 1.05);
        ray.rotation.z = angle;
        g.add(ray);
      }
      break;
    }
    default:
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshPhongMaterial({ color }),
      );
      mesh.position.y = 0.5;
      g.add(mesh);
  }
  return g;
}

// ── Build Scene 2 ──
function buildScene2() {
  scene.background = new THREE.Color(0x071a12);

  // Hide narasi (its text overlaps the HUD bar in Scene 2)
  const narasiEl = document.getElementById("narasi");
  if (narasiEl) narasiEl.style.display = "none";

  // Lighting
  const ambLight = new THREE.AmbientLight(0x88bbff, 0.5);
  scene.add(ambLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(8, 14, 10);
  scene.add(dirLight);
  const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
  fillLight.position.set(-8, 6, -5);
  scene.add(fillLight);

  // Reset state
  s2_itemsMeshes = [];
  s2_correctCount = 0;
  s2_totalItems = S2_ITEMS.length;
  s2_solved = {};
  s2_dragObj = null;
  s2_isDragging = false;
  draggableObjects = [];

  if (scene2DragControls) {
    scene2DragControls.dispose();
    scene2DragControls = null;
  }

  // ── Terrain base ──
  loadGLB("base", GLB_PATHS.base, (model) => {
    fitModelToBox(model, 38);
    model.position.set(0, -2.5, 0);
    model.traverse((c) => {
      if (c.isMesh) c.userData.isPassive = true;
    });
    scene.add(model);
  });

  // ── Drop zone planes (visual + hitbox) ──
  // Biotik zone: X < 0, Abiotik zone: X > 0
  // We place them at Y=0 (ground level), visible as colored pads

  const zoneY = 0.05;
  const zoneW = 13,
    zoneD = 12;

  // Biotik zone (left, green)
  const biotikGeo = new THREE.PlaneGeometry(zoneW, zoneD);
  const biotikMat = new THREE.MeshBasicMaterial({
    color: 0x00e676,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
  });
  s2_biotikPlane = new THREE.Mesh(biotikGeo, biotikMat);
  s2_biotikPlane.rotation.x = -Math.PI / 2;
  s2_biotikPlane.position.set(-9, zoneY, 2);
  s2_biotikPlane.userData.zoneType = "biotik";
  s2_biotikPlane.userData.isPassive = true;
  scene.add(s2_biotikPlane);

  // Biotik zone border glow
  const biotikBorderGeo = new THREE.EdgesGeometry(biotikGeo);
  const biotikBorder = new THREE.LineSegments(
    biotikBorderGeo,
    new THREE.LineBasicMaterial({ color: 0x00e676, linewidth: 2 }),
  );
  biotikBorder.rotation.x = -Math.PI / 2;
  biotikBorder.position.set(-9, zoneY + 0.01, 2);
  biotikBorder.userData.isPassive = true;
  scene.add(biotikBorder);

  // Abiotik zone (right, blue)
  const abiotikGeo = new THREE.PlaneGeometry(zoneW, zoneD);
  const abiotikMat = new THREE.MeshBasicMaterial({
    color: 0x42a5f5,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
  });
  s2_abiotikPlane = new THREE.Mesh(abiotikGeo, abiotikMat);
  s2_abiotikPlane.rotation.x = -Math.PI / 2;
  s2_abiotikPlane.position.set(9, zoneY, 2);
  s2_abiotikPlane.userData.zoneType = "abiotik";
  s2_abiotikPlane.userData.isPassive = true;
  scene.add(s2_abiotikPlane);

  const abiotikBorderGeo = new THREE.EdgesGeometry(abiotikGeo);
  const abiotikBorder = new THREE.LineSegments(
    abiotikBorderGeo,
    new THREE.LineBasicMaterial({ color: 0x42a5f5, linewidth: 2 }),
  );
  abiotikBorder.rotation.x = -Math.PI / 2;
  abiotikBorder.position.set(9, zoneY + 0.01, 2);
  abiotikBorder.userData.isPassive = true;
  scene.add(abiotikBorder);

  // Zone label text (3D sprites via HTML overlay, updated each frame)
  s2_injectZoneLabels();

  // ── Spawn 7 GLB balok in a row at the front ──
  // Arrange them in an arc / row at z = 12 (near camera)
  const count = S2_ITEMS.length;
  const spacing = 4.5;
  const totalW = (count - 1) * spacing;

  S2_ITEMS.forEach((data, i) => {
    const xPos = -totalW / 2 + i * spacing;
    const zPos = 12; // front row, close to viewer
    const yPos = 0;

    const originalPos = new THREE.Vector3(xPos, yPos, zPos);

    loadGLB(data.k, GLB_PATHS[data.k], (model) => {
      // Scale to uniform "balok" size
      fitModelToBox(model, 2.8);

      // Re-seat on ground
      const box = new THREE.Box3().setFromObject(model);
      model.position.y -= box.min.y;

      // Wrap in a group with a hover glow platform
      const group = new THREE.Group();
      group.add(model);

      // Glowing base platform
      const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.6, 0.12, 20),
        new THREE.MeshBasicMaterial({
          color: data.tipe === "biotik" ? 0x00e676 : 0x42a5f5,
          transparent: true,
          opacity: 0.35,
        }),
      );
      platform.position.y = 0.06;
      platform.userData.isPassive = true;
      group.add(platform);

      group.position.copy(originalPos);
      group.userData = {
        isS2Item: true,
        itemData: data,
        originalPos: originalPos.clone(),
        placed: false,
        platformMesh: platform,
      };

      // Assign to draggableObjects (the model children for DragControls)
      // We'll use pointer events manually for more control
      s2_itemsMeshes.push(group);
      draggableObjects.push(group);
      scene.add(group);

      // If all loaded, set up drag
      if (s2_itemsMeshes.length === S2_ITEMS.length) {
        s2_setupDrag3D();
      }
    });
  });

  // ── Inject HUD overlay ──
  s2_injectHUDOverlay();

  // ── Interact buttons ──
  addInteractBtn("📖 Cara Main", () => s2_showInstructions3D());
  addInteractBtn("🔄 Reset", () => s2_reset3D());
  addInteractBtn("📊 Skor", () => {
    const pct = Math.round((s2_correctCount / s2_totalItems) * 100);
    let msg =
      pct === 100
        ? "🏆 SEMPURNA! Kamu paham ekosistem dengan baik!"
        : pct >= 70
          ? "👏 Bagus! Tinggal sedikit lagi!"
          : "💪 Terus coba! Kamu pasti bisa!";
    showInfo(`📊 Skormu: ${s2_correctCount}/${s2_totalItems} (${pct}%)`, msg);
  });

  // Show instructions after short delay
  setTimeout(() => s2_showInstructions3D(), 800);
}

// ── Inject minimal HUD overlay (progress + score + feedback) ──
function s2_injectHUDOverlay() {
  const old = document.getElementById("s2-hud-overlay");
  if (old) old.remove();

  const div = document.createElement("div");
  div.id = "s2-hud-overlay";
  div.innerHTML = `
    <div id="s2h-progress-wrap">
      <span id="s2h-progress-label">PROGRESS</span>
      <span id="s2h-progress-val">0 / ${S2_ITEMS.length}</span>
      <div id="s2h-progress-track"><div id="s2h-progress-bar"></div></div>
    </div>
    <div id="s2h-score-wrap">
      <span id="s2h-score-label">SKOR</span>
      <span id="s2h-score-val">0</span>
    </div>
    <div id="s2h-feedback"></div>
  `;
  document.body.appendChild(div);

  // ── Win overlay: injected DIRECTLY to <body>, NOT inside the HUD
  // This ensures it is not clipped or blocked by pointer-events:none on the HUD container
  const oldWin = document.getElementById("s2h-win");
  if (oldWin) oldWin.remove();

  const winDiv = document.createElement("div");
  winDiv.id = "s2h-win";
  winDiv.style.display = "none";
  winDiv.innerHTML = `
    <div id="s2h-win-card">
      <div>🏆</div>
      <div id="s2h-win-title">SELESAI!</div>
      <div id="s2h-win-sub"></div>
      <button id="s2h-win-btn">Lanjut ke Scene 3 ›</button>
    </div>
  `;
  document.body.appendChild(winDiv);

  document.getElementById("s2h-win-btn").addEventListener("click", () => {
    document.getElementById("s2h-win").style.display = "none";
    nextScene();
  });
}

// ── Zone labels as HTML overlay (projected to 3D world) ──
function s2_injectZoneLabels() {
  const old = document.getElementById("s2-zone-labels");
  if (old) old.remove();

  const div = document.createElement("div");
  div.id = "s2-zone-labels";
  div.innerHTML = `
    <div class="s2-zone-lbl biotik" id="s2zl-biotik">🌿 ZONA BIOTIK<br><small>Makhluk Hidup</small></div>
    <div class="s2-zone-lbl abiotik" id="s2zl-abiotik">💧 ZONA ABIOTIK<br><small>Benda Mati</small></div>
  `;
  document.body.appendChild(div);
}

// Update zone label positions each frame (called from loop if scene2)
function s2_updateZoneLabels() {
  if (currentScene !== 1) return;
  const lblBiotik = document.getElementById("s2zl-biotik");
  const lblAbiotik = document.getElementById("s2zl-abiotik");
  if (!lblBiotik || !lblAbiotik || !s2_biotikPlane || !s2_abiotikPlane) return;

  function project3D(obj) {
    if (!obj || !camera) return null;
    const wp = new THREE.Vector3();
    obj.getWorldPosition(wp);
    wp.y += 1.2;
    wp.project(camera);
    if (wp.z > 1) return null;
    return {
      x: ((wp.x + 1) / 2) * window.innerWidth,
      y: ((-wp.y + 1) / 2) * window.innerHeight,
    };
  }

  const pb = project3D(s2_biotikPlane);
  if (pb) {
    lblBiotik.style.left = pb.x + "px";
    lblBiotik.style.top = pb.y + "px";
    lblBiotik.style.display = "block";
  }
  const pa = project3D(s2_abiotikPlane);
  if (pa) {
    lblAbiotik.style.left = pa.x + "px";
    lblAbiotik.style.top = pa.y + "px";
    lblAbiotik.style.display = "block";
  }
}

// ── 3D Drag setup ──
let s2_dragListenersAttached = false;

function s2_setupDrag3D() {
  const canvas = document.getElementById("c");
  if (!canvas) return;
  s2_dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.4);
  if (!s2_dragListenersAttached) {
    canvas.addEventListener("pointerdown", s2_onPointerDown);
    canvas.addEventListener("pointermove", s2_onPointerMove);
    canvas.addEventListener("pointerup", s2_onPointerUp);
    s2_dragListenersAttached = true;
  }
}

function s2_getPointerNDC(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  return new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1,
  );
}

function s2_onPointerDown(e) {
  if (currentScene !== 1) return;
  const ndc = s2_getPointerNDC(e);
  s2_raycaster.setFromCamera(ndc, camera);

  // Find which s2 item was hit
  let hit = null;
  for (const grp of s2_itemsMeshes) {
    if (grp.userData.placed) continue;
    const meshes = [];
    grp.traverse((c) => {
      if (c.isMesh && !c.userData.isPassive) meshes.push(c);
    });
    const hits = s2_raycaster.intersectObjects(meshes, true);
    if (hits.length > 0) {
      hit = grp;
      break;
    }
  }

  if (!hit) return;

  s2_dragObj = hit;
  s2_isDragging = false;
  s2_pointerDownPos = { x: e.clientX, y: e.clientY };

  // Compute drag offset on the drag plane
  const intersect = new THREE.Vector3();
  s2_raycaster.ray.intersectPlane(s2_dragPlane, intersect);
  if (intersect) {
    s2_dragOffset.copy(hit.position).sub(intersect);
  }

  // Highlight
  hit.traverse((c) => {
    if (c.isMesh && !c.userData.isPassive && c.material) {
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach((m) => {
        m.emissive = new THREE.Color(0.15, 0.15, 0.15);
      });
    }
  });

  // Pulse platform
  if (hit.userData.platformMesh) {
    hit.userData.platformMesh.material.opacity = 0.7;
  }
}

function s2_onPointerMove(e) {
  if (currentScene !== 1 || !s2_dragObj) return;

  // Detect drag threshold
  const dx = e.clientX - s2_pointerDownPos.x;
  const dy = e.clientY - s2_pointerDownPos.y;
  if (!s2_isDragging && Math.sqrt(dx * dx + dy * dy) > 5) {
    s2_isDragging = true;
  }
  if (!s2_isDragging) return;

  const ndc = s2_getPointerNDC(e);
  s2_raycaster.setFromCamera(ndc, camera);
  const intersect = new THREE.Vector3();
  s2_raycaster.ray.intersectPlane(s2_dragPlane, intersect);
  if (intersect) {
    s2_dragObj.position.copy(intersect.add(s2_dragOffset));
    // Clamp Y to hover height
    s2_dragObj.position.y = 1.4;
  }

  // Highlight zones on hover
  s2_highlightZoneHover(s2_dragObj.position.x);
}

function s2_onPointerUp(e) {
  if (currentScene !== 1 || !s2_dragObj) return;

  const grp = s2_dragObj;
  s2_dragObj = null;

  // Remove highlight
  grp.traverse((c) => {
    if (c.isMesh && !c.userData.isPassive && c.material) {
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach((m) => {
        m.emissive = new THREE.Color(0, 0, 0);
      });
    }
  });
  if (grp.userData.platformMesh)
    grp.userData.platformMesh.material.opacity = 0.35;

  // Reset zone highlights
  s2_resetZoneHighlight();

  if (!s2_isDragging) {
    // It was a click — show info
    s2_showItemInfo(grp.userData.itemData);
    return;
  }

  s2_isDragging = false;

  // Check which zone the object landed in
  const px = grp.position.x;
  const pz = grp.position.z;

  const biotikCX = -9,
    biotikHW = 6.5;
  const abiotikCX = 9,
    abiotikHW = 6.5;
  const zoneZMin = -4,
    zoneZMax = 8;

  const inBiotik =
    px >= biotikCX - biotikHW &&
    px <= biotikCX + biotikHW &&
    pz >= zoneZMin &&
    pz <= zoneZMax;
  const inAbiotik =
    px >= abiotikCX - abiotikHW &&
    px <= abiotikCX + abiotikHW &&
    pz >= zoneZMin &&
    pz <= zoneZMax;

  const data = grp.userData.itemData;

  if (inBiotik || inAbiotik) {
    const droppedZone = inBiotik ? "biotik" : "abiotik";
    if (droppedZone === data.tipe) {
      // CORRECT!
      grp.userData.placed = true;
      s2_correctCount++;
      s2_solved[data.k] = true;

      // Snap into zone with slight offset by index
      const placedCount = Object.keys(s2_solved).length;
      const offsetX = (((placedCount - 1) % 3) - 1) * 2.8;
      const offsetZ = Math.floor((placedCount - 1) / 3) * 2.8;
      const targetX = (droppedZone === "biotik" ? -9 : 9) + offsetX;
      grp.position.set(targetX, 0, offsetZ - 1);

      // Reseat on ground
      const box = new THREE.Box3().setFromObject(grp);
      grp.position.y -= box.min.y;

      // Green glow + lock
      grp.traverse((c) => {
        if (c.isMesh && !c.userData.isPassive && c.material) {
          const mats = Array.isArray(c.material) ? c.material : [c.material];
          mats.forEach((m) => {
            m.emissive = new THREE.Color(
              droppedZone === "biotik" ? 0x004d20 : 0x003d6e,
            );
            m.emissiveIntensity = 0.5;
          });
        }
      });

      // Change platform color to solid success
      if (grp.userData.platformMesh) {
        grp.userData.platformMesh.material.color.setHex(
          droppedZone === "biotik" ? 0x00e676 : 0x42a5f5,
        );
        grp.userData.platformMesh.material.opacity = 0.8;
      }

      s2_updateScore(s2_correctCount * 10);
      s2_updateProgress();
      s2_showFeedback(
        `✅ ${data.emoji} ${data.lbl.replace(/^.+? /, "")} benar! ${data.tipe.toUpperCase()}`,
        true,
      );
      s2_showItemInfo(data);
      s2_spawnParticles3D(
        grp.position,
        droppedZone === "biotik" ? "#00e676" : "#42a5f5",
      );

      if (s2_correctCount >= s2_totalItems) {
        setTimeout(() => s2_showWin(), 800);
      }
    } else {
      // WRONG zone
      s2_returnToOrigin(grp);
      s2_showFeedback(
        `❌ ${data.emoji} bukan ${droppedZone}! Coba zona ${data.tipe === "biotik" ? "BIOTIK (hijau)" : "ABIOTIK (biru)"}`,
        false,
      );
      s2_shakeGroup(grp);
    }
  } else {
    // Dropped outside zones → return to origin
    s2_returnToOrigin(grp);
  }
}

function s2_returnToOrigin(grp) {
  // Animate back to original position
  const orig = grp.userData.originalPos;
  const start = grp.position.clone();
  const t0 = performance.now();
  const dur = 400;
  function tick(ts) {
    const t = Math.min((ts - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    grp.position.lerpVectors(start, orig, ease);
    if (t < 1) requestAnimationFrame(tick);
    else grp.position.copy(orig);
  }
  requestAnimationFrame(tick);
}

function s2_shakeGroup(grp) {
  const orig = grp.position.clone();
  let i = 0;
  const shakes = [0.4, -0.4, 0.3, -0.3, 0.15, -0.15, 0];
  function tick() {
    if (i >= shakes.length) {
      grp.position.x = orig.x;
      return;
    }
    grp.position.x = orig.x + shakes[i++];
    setTimeout(tick, 50);
  }
  tick();
}

function s2_highlightZoneHover(x) {
  const inBiotik = x < 0;
  if (s2_biotikPlane) s2_biotikPlane.material.opacity = inBiotik ? 0.4 : 0.18;
  if (s2_abiotikPlane) s2_abiotikPlane.material.opacity = inBiotik ? 0.18 : 0.4;
}

function s2_resetZoneHighlight() {
  if (s2_biotikPlane) s2_biotikPlane.material.opacity = 0.18;
  if (s2_abiotikPlane) s2_abiotikPlane.material.opacity = 0.18;
}

function s2_updateScore(val) {
  const el = document.getElementById("s2h-score-val");
  if (el) el.textContent = val;
}

function s2_updateProgress() {
  const pv = document.getElementById("s2h-progress-val");
  const pb = document.getElementById("s2h-progress-bar");
  if (pv) pv.textContent = `${s2_correctCount} / ${s2_totalItems}`;
  if (pb)
    pb.style.width = Math.round((s2_correctCount / s2_totalItems) * 100) + "%";
}

function s2_showFeedback(msg, success) {
  const el = document.getElementById("s2h-feedback");
  if (!el) return;
  el.textContent = msg;
  el.className = success ? "s2h-fb-ok" : "s2h-fb-err";
  el.style.opacity = "1";
  clearTimeout(el._to);
  el._to = setTimeout(() => {
    el.style.opacity = "0";
  }, 3000);
}

function s2_showItemInfo(data) {
  showInfo(
    `${data.emoji} ${data.lbl.replace(/^.+? /, "")} — ${data.kategori}`,
    `📌 Tipe: ${data.tipe.toUpperCase()}\n\n🔬 Fungsi:\n${data.fungsi}\n\n💡 Fakta:\n${data.fakta}`,
  );
}

function s2_showWin() {
  const win = document.getElementById("s2h-win");
  const sub = document.getElementById("s2h-win-sub");
  if (sub)
    sub.textContent = `Skor: ${s2_correctCount * 10} — Semua komponen benar! 🌿`;
  if (win) {
    win.style.display = "flex";
    win.style.alignItems = "center";
    win.style.justifyContent = "center";
  }
  // Particle burst
  for (let j = 0; j < 3; j++) {
    setTimeout(() => {
      const colors = ["#00e676", "#42a5f5", "#ffca28"];
      for (let i = 0; i < 20; i++) {
        const p = document.createElement("div");
        p.className = "s2p-particle";
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 8 + Math.random() * 12;
        const angle = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 200;
        p.style.cssText = `width:${size}px;height:${size}px;background:${color};
          left:${window.innerWidth / 2}px;top:${window.innerHeight / 2}px;
          --dx:${Math.cos(angle) * dist}px;--dy:${Math.sin(angle) * dist}px;
          border-radius:50%;position:fixed;z-index:9999;animation:s2p-burst 1s ease-out forwards;`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1200);
      }
    }, j * 280);
  }
}

function s2_reset3D() {
  // Remove overlays
  const hud = document.getElementById("s2-hud-overlay");
  if (hud) hud.remove();
  const zl = document.getElementById("s2-zone-labels");
  if (zl) zl.remove();
  // Clear interact buttons (prevent duplicates)
  const interactUI = document.getElementById("interact-ui");
  if (interactUI) interactUI.innerHTML = "";
  // Keep listener flag — listeners stay on canvas, just rebuild scene
  buildScene2();
}

function s2_spawnParticles3D(pos3d, color) {
  // Project 3D position to screen for particles
  if (!camera || !renderer) return;
  const v = pos3d.clone().project(camera);
  const x = ((v.x + 1) / 2) * window.innerWidth;
  const y = ((-v.y + 1) / 2) * window.innerHeight;
  for (let i = 0; i < 14; i++) {
    const p = document.createElement("div");
    const size = 6 + Math.random() * 8;
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 100;
    p.style.cssText = `
      width:${size}px;height:${size}px;background:${color};
      left:${x}px;top:${y}px;position:fixed;border-radius:50%;z-index:9999;
      --dx:${Math.cos(angle) * dist}px;--dy:${Math.sin(angle) * dist}px;
      animation:s2p-burst 0.9s ease-out forwards;`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }
}

function s2_showInstructions3D() {
  showInfo(
    "🎮 Cara Bermain — Scene 2",
    "1️⃣  DRAG objek 3D dari barisan depan ke zona yang tepat:\n" +
      "   🌿 ZONA HIJAU (BIOTIK) = Makhluk hidup (pohon, hewan, manusia)\n" +
      "   💧 ZONA BIRU (ABIOTIK) = Benda mati (air, batu, matahari)\n\n" +
      "2️⃣  Klik objek untuk melihat info & fakta!\n\n" +
      "3️⃣  Jika benar → objek terkunci di zona & skor bertambah!\n\n" +
      "4️⃣  Jika salah → objek kembali ke posisi semula.\n\n" +
      `🎯 Target: tempatkan semua ${S2_ITEMS.length} komponen ekosistem!`,
  );
}

// ── Legacy stubs (kept for compatibility) ──
let s2_puzzleState = {
  items: [],
  holes: [],
  score: 0,
  drag: { active: false },
};
function s2_injectPuzzleOverlay() {
  s2_injectHUDOverlay();
}
function s2p_renderShapes() {}
function s2p_renderHoles() {}
function s2p_setupDrag() {}
function s2_puzzleReset() {
  s2_reset3D();
}
function s2_showPopup(d) {
  s2_showItemInfo(d);
}
function s2_showInstructions() {
  s2_showInstructions3D();
}
function s2_showScore() {
  const pct = Math.round((s2_correctCount / s2_totalItems) * 100);
  showInfo(
    `📊 Skormu: ${s2_correctCount}/${s2_totalItems} (${pct}%)`,
    pct === 100 ? "🏆 SEMPURNA!" : pct >= 70 ? "👏 Bagus!" : "💪 Terus coba!",
  );
}
function s2_showS2Hint(msg) {
  s2_showFeedback(msg, true);
}
function s2_resetPositions() {
  s2_reset3D();
}
function s2_updateScoreUI() {
  s2_updateProgress();
}
function s2_injectScoreOverlay() {}
function s2_spawnParticles(pos3d, color) {
  s2_spawnParticles3D(pos3d, color);
}

// SCENE 3
const chainItems = [
  { label: "🌿 Tumbuhan", role: "Produsen", color: 0x2d9e50, x: -12 },
  { label: "🐛 Ulat", role: "Konsumen I", color: 0x8bc34a, x: -4 },
  { label: "🐦 Burung", role: "Konsumen II", color: 0x1565c0, x: 4 },
  { label: "🦅 Elang", role: "Konsumen III", color: 0x795548, x: 12 },
];

function buildScene3() {
  scene.background = new THREE.Color(0x0a1e10);
  addLight();
  scene.add(makePlane(40, 12, 0x1a3a0a));
  sceneObjects = [];

  chainItems.forEach((item, i) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshPhongMaterial({
        color: item.color,
        emissive: new THREE.Color(item.color).multiplyScalar(0.2),
      }),
    );
    mesh.position.set(item.x, 1.5, 0);
    mesh.userData.chainIndex = i;
    mesh.userData.floatY = 0.8 + i * 0.2;
    mesh.userData.baseY = 1.5;
    sceneObjects.push(mesh);
    scene.add(mesh);
    if (i < chainItems.length - 1) {
      const len = chainItems[i + 1].x - item.x - 3;
      const arrow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, len, 8),
        new THREE.MeshBasicMaterial({
          color: 0x00e676,
          transparent: true,
          opacity: 0.6,
        }),
      );
      arrow.position.set(item.x + 1.5 + len / 2, 1.5, 0);
      arrow.rotation.z = Math.PI / 2;
      scene.add(arrow);
      const head = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.6, 8),
        new THREE.MeshBasicMaterial({
          color: 0x00e676,
          transparent: true,
          opacity: 0.8,
        }),
      );
      head.position.set(chainItems[i + 1].x - 1.5, 1.5, 0);
      head.rotation.z = -Math.PI / 2;
      scene.add(head);
    }
  });

  addInteractBtn("▶ Animasi Rantai Makanan", animateFoodChain);
  addInteractBtn("🔄 Reset", buildScene3);
  addInteractBtn("ℹ️ Penjelasan", () =>
    showInfo(
      "Rantai Makanan",
      "🌿 PRODUSEN → energi matahari\n🐛 KONSUMEN I → makan produsen\n🐦 KONSUMEN II → makan kons. I\n🦅 KONSUMEN III → puncak\n\nEnergi berkurang ~90% per tingkat!",
    ),
  );
}

function animateFoodChain() {
  let step = 0;
  const steps = [
    () => {
      sceneObjects[0].userData.pulse = true;
      showInfo("Produsen", "Tumbuhan menyerap CO₂ + cahaya → fotosintesis");
    },
    () => {
      sceneObjects[0].userData.pulse = false;
      sceneObjects[1].userData.pulse = true;
      showInfo("Konsumen I", "Ulat memakan tumbuhan. Energi berpindah.");
    },
    () => {
      sceneObjects[1].userData.pulse = false;
      sceneObjects[2].userData.pulse = true;
      showInfo(
        "Konsumen II",
        "Burung memakan ulat. Hanya 10% energi berpindah.",
      );
    },
    () => {
      sceneObjects[2].userData.pulse = false;
      sceneObjects[3].userData.pulse = true;
      showInfo("Konsumen III", "Elang — predator puncak. Mengatur populasi.");
    },
    () => {
      sceneObjects[3].userData.pulse = false;
      showInfo(
        "Siklus Lengkap",
        "Pengurai → nutrisi kembali ke tanah → tumbuhan ♻️",
      );
    },
  ];
  const iv = setInterval(() => {
    if (step < steps.length) steps[step++]();
    else clearInterval(iv);
  }, 2000);
}

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
  document.getElementById("dmg-pct").textContent = v + "%";
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

// SCENE 9
function buildScene9() {
  scene.background = new THREE.Color(0x0a1628);
  addLight();
  const total = Object.values(builtObjects).reduce((a, b) => a + b, 0);
  const flora = builtObjects.tree + builtObjects.bush;
  const fauna = builtObjects.animal;
  const energy = builtObjects.solar;
  const s1 = Math.min(
    Math.round(((flora + fauna) / Math.max(total, 1)) * 100 + 20),
    100,
  );
  const s2 = Math.min(
    Math.round((fauna / Math.max(total, 1)) * 300 + total * 5),
    100,
  );
  const s3 = Math.min(
    Math.round((energy / Math.max(total, 1)) * 300 + flora * 3),
    100,
  );
  setTimeout(() => {
    document.getElementById("score-ui").style.display = "flex";
    animScore("s1", s1);
    animScore("s2", s2);
    animScore("s3", s3);
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

// SCENE 10
function buildScene10() {
  scene.background = new THREE.Color(0x000000);
  addLight();
  setTimeout(() => {
    document.getElementById("outro").style.display = "flex";
  }, 300);
}

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
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onCanvasClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(scene ? scene.children : [], true);
  if (hits.length > 0) {
    const obj = hits[0].object;
    if (obj.userData.chainIndex !== undefined) {
      const item = chainItems[obj.userData.chainIndex];
      showInfo(
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
