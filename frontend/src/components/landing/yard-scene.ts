import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

/*
 * The hero's 3D yard (DESIGN.md §7.4), driven entirely by scroll progress p ∈ [0, 1]:
 *   0.00  side profile of a lone truck on an empty dusk horizon
 *   0.05  it rolls forward; the yard rises out of the ground around it
 *   0.30  the camera cranes up into an aerial three-quarter view
 *   0.42  conversion: geometry dissolves chunk by chunk — outward from the truck — into
 *         glowing edges and point-cloud dust, while dusk gives way to a starfield
 *   0.68  the camera swings behind the truck; the yard fades, the truck floats alone
 * Units are metres. The truck drives along +x.
 */

const CYAN = new THREE.Color("#9fe6ee");
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);

// ---------- conversion shaders ----------

// Shared field: blocky cells mixed with distance from the truck, so the world converts
// in chunks that spread outward. Solid fragments below the threshold are discarded;
// edges and dust fade in exactly where the solid disappears.
const FIELD = /* glsl */ `
  uniform float uConvert;
  uniform vec2 uOrigin;
  float hash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float convField(vec3 wp) {
    float cell = hash3(floor(wp * 0.42));
    float sweep = clamp(length(wp.xz - uOrigin) / 70.0, 0.0, 1.0);
    return clamp(0.5 * sweep + 0.5 * cell, 0.0, 1.0) * 0.98 + 0.01;
  }
`;

type Uniforms = {
  uConvert: { value: number };
  uOrigin: { value: THREE.Vector2 };
  uTime: { value: number };
  uPixelRatio: { value: number };
};

function solidMaterial(U: Uniforms, params: THREE.MeshStandardMaterialParameters) {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.15, ...params });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uConvert = U.uConvert;
    shader.uniforms.uOrigin = U.uOrigin;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWp;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vWp;\n${FIELD}`)
      .replace(
        "#include <clipping_planes_fragment>",
        "#include <clipping_planes_fragment>\nfloat cf = convField(vWp);\nif (cf < uConvert) discard;",
      )
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.62, 0.9, 0.93) * 4.0 * (1.0 - smoothstep(0.0, 0.035, cf - uConvert)) * step(0.0005, uConvert);",
      );
  };
  return m;
}

function lineMaterial(U: Uniforms, fade: { value: number }) {
  return new THREE.ShaderMaterial({
    uniforms: { uConvert: U.uConvert, uOrigin: U.uOrigin, uFade: fade, uColor: { value: CYAN } },
    vertexShader: /* glsl */ `
      varying vec3 vWp;
      void main() {
        vWp = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      ${FIELD}
      uniform float uFade;
      uniform vec3 uColor;
      varying vec3 vWp;
      void main() {
        float cf = convField(vWp);
        float a = smoothstep(cf - 0.06, cf, uConvert) * uFade;
        if (a < 0.003) discard;
        gl_FragColor = vec4(uColor, a * 0.95);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function pointsMaterial(U: Uniforms, fade: { value: number }, size = 2.2) {
  return new THREE.ShaderMaterial({
    uniforms: { uConvert: U.uConvert, uOrigin: U.uOrigin, uFade: fade, uTime: U.uTime, uPixelRatio: U.uPixelRatio, uSize: { value: size } },
    vertexShader: /* glsl */ `
      attribute float aRand;
      uniform float uTime, uPixelRatio, uSize;
      varying vec3 vWp;
      varying float vTw;
      void main() {
        vWp = (modelMatrix * vec4(position, 1.0)).xyz;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vTw = 0.55 + 0.45 * sin(uTime * (1.5 + aRand * 2.5) + aRand * 40.0);
        gl_PointSize = uSize * uPixelRatio * (18.0 / -mv.z) * (0.6 + aRand * 0.8);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      ${FIELD}
      uniform float uFade;
      varying vec3 vWp;
      varying float vTw;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float cf = convField(vWp);
        float a = smoothstep(cf - 0.08, cf, uConvert) * uFade * vTw * (1.0 - d * 2.0);
        if (a < 0.003) discard;
        gl_FragColor = vec4(0.88, 0.97, 1.0, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// ---------- scene ----------

type Riser = { obj: THREE.Object3D; at: number };

export class YardScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 900);
  private U: Uniforms = {
    uConvert: { value: 0 },
    uOrigin: { value: new THREE.Vector2() },
    uTime: { value: 0 },
    uPixelRatio: { value: 1 },
  };
  private truckFade = { value: 1 };
  private yardFade = { value: 1 };
  private truck = new THREE.Group();
  private wheels: THREE.Mesh[] = [];
  private risers: Riser[] = [];
  private sky: THREE.ShaderMaterial;
  private stars: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#c98a62", 60, 230);
  private sun: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private headlight: THREE.SpotLight;
  private camCurve: THREE.CatmullRomCurve3;
  private lookCurve: THREE.CatmullRomCurve3;
  private fovs: number[];
  private keyP: number[];
  private p = 0;
  private groundMats: THREE.MeshStandardMaterial[] = [];
  private glowMats: THREE.MeshBasicMaterial[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.fog = this.fog;

    // sky dome: lavender → peach → orange at the horizon, fading to black for the twin
    this.sky = new THREE.ShaderMaterial({
      uniforms: { uNight: { value: 0 } },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uNight; varying vec3 vDir;
        void main(){
          float h = clamp(vDir.y, -0.2, 1.0);
          vec3 horizon = vec3(0.96, 0.6, 0.33), mid = vec3(0.92, 0.77, 0.66), top = vec3(0.7, 0.68, 0.74);
          vec3 c = mix(horizon, mid, smoothstep(0.0, 0.12, h));
          c = mix(c, top, smoothstep(0.12, 0.5, h));
          c = mix(c, vec3(0.02, 0.025, 0.03), uNight);
          gl_FragColor = vec4(c, 1.0);
        }`,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), this.sky));

    // stars for the digital twin
    const starGeo = new THREE.BufferGeometry();
    const n = 2600;
    const pos = new Float32Array(n * 3);
    const rnd = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(180 + Math.random() * 300);
      pos.set([v.x, Math.abs(v.y) * 0.9 - 20, v.z], i * 3);
      rnd[i] = Math.random();
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    starGeo.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));
    this.stars = new THREE.ShaderMaterial({
      uniforms: { uAlpha: { value: 0 }, uTime: this.U.uTime, uPixelRatio: this.U.uPixelRatio },
      vertexShader: `attribute float aRand; uniform float uTime, uPixelRatio; varying float vA;
        void main(){ vA = 0.5 + 0.5 * sin(uTime * (0.6 + aRand) + aRand * 30.0); gl_PointSize = (1.0 + aRand * 1.8) * uPixelRatio; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform float uAlpha; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(0.85, 0.95, 1.0, uAlpha * vA * (1.0 - d * 2.0)); }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    this.scene.add(new THREE.Points(starGeo, this.stars));

    // light: low warm sun behind the truck (backlight), soft sky fill, headlights
    this.hemi = new THREE.HemisphereLight("#f6d5b8", "#3a2a20", 1.6);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#ffb27a", 2.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 220 });
    this.sun.shadow.bias = -0.0005;
    this.scene.add(this.sun, this.sun.target);
    const fill = new THREE.DirectionalLight("#d8c2ad", 0.8);
    fill.position.set(10, 12, 40);
    this.scene.add(fill);

    this.buildGround();
    this.buildTruck();
    this.headlight = new THREE.SpotLight("#ffe2b8", 60, 45, 0.5, 0.6, 1.4);
    this.headlight.position.set(6.7, 1.3, 0);
    this.headlight.target.position.set(22, 0, 0);
    this.truck.add(this.headlight, this.headlight.target);
    this.buildYard();

    // camera path, relative to the truck — keyframed by scroll progress
    const keys: [number, [number, number, number], [number, number, number], number][] = [
      [0.0, [-1.8, 2.3, 27], [-1.8, 2.2, 0], 30],
      [0.12, [-1.2, 2.6, 25], [-1.2, 2.3, 0], 30],
      [0.32, [15, 13, 27], [0, 1.6, 0], 34],
      [0.5, [24, 25, 31], [2, 0, -5], 36],
      [0.68, [-24, 17, 11], [0, 2, 0], 34],
      [0.86, [-21, 13, 13], [0.5, 1.8, 0], 34],
      [1.0, [-18, 11.5, 16], [1.5, 2.2, 0], 33],
    ];
    this.keyP = keys.map((k) => k[0]);
    this.camCurve = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k[1])), false, "centripetal");
    this.lookCurve = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k[2])), false, "centripetal");
    this.fovs = keys.map((k) => k[3]);
  }

  // ---- builders

  private withTwin(mesh: THREE.Mesh, points: number, isTruck: boolean, edgeAngle = 25) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const fade = isTruck ? this.truckFade : this.yardFade;
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, edgeAngle), lineMaterial(this.U, fade)));
    if (points > 0) {
      const sampler = new MeshSurfaceSampler(mesh).build();
      const pos = new Float32Array(points * 3);
      const rnd = new Float32Array(points);
      const v = new THREE.Vector3();
      for (let i = 0; i < points; i++) {
        sampler.sample(v);
        pos.set([v.x, v.y, v.z], i * 3);
        rnd[i] = Math.random();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));
      mesh.add(new THREE.Points(g, pointsMaterial(this.U, fade)));
    }
    return mesh;
  }

  private glow(color: string) {
    const m = new THREE.MeshBasicMaterial({ color, transparent: true });
    this.glowMats.push(m);
    return m;
  }

  // A box whose origin sits on its base, so scaling y "grows" it out of the ground.
  private box(w: number, h: number, d: number) {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(0, h / 2, 0);
    return g;
  }

  private buildGround() {
    // The ground never dissolves — it sinks into darkness while the dotted grid takes over.
    const groundMat = new THREE.MeshStandardMaterial({ color: "#4b382c", roughness: 1 });
    const roadMat = new THREE.MeshStandardMaterial({ color: "#211915", roughness: 0.95 });
    groundMat.userData.base = new THREE.Color("#4b382c");
    roadMat.userData.base = new THREE.Color("#211915");
    this.groundMats.push(groundMat, roadMat);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // road: asphalt strip with dashed centre line
    const road = new THREE.Mesh(new THREE.PlaneGeometry(900, 7), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, 0);
    road.receiveShadow = true;
    this.scene.add(road);

    // the twin's floor: a dotted grid that resolves as the world converts
    const grid: number[] = [];
    const rnd: number[] = [];
    for (let x = -200; x <= 260; x += 3) {
      for (let z = -120; z <= 80; z += 3) {
        grid.push(x, 0.02, z);
        rnd.push(Math.random());
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(grid, 3));
    g.setAttribute("aRand", new THREE.Float32BufferAttribute(rnd, 1));
    this.scene.add(new THREE.Points(g, pointsMaterial(this.U, this.yardFade, 1.6)));
  }

  private buildTruck() {
    const T = this.truck;
    const trailerMat = solidMaterial(this.U, { color: "#8f8378", roughness: 0.55, metalness: 0.3 });
    const cabMat = solidMaterial(this.U, { color: "#d9d2c8", roughness: 0.35, metalness: 0.45 });
    const darkMat = solidMaterial(this.U, { color: "#16110e", roughness: 0.9 });
    const glassMat = solidMaterial(this.U, { color: "#1b1f25", roughness: 0.1, metalness: 0.6 });
    const tyreMat = solidMaterial(this.U, { color: "#0d0b0a", roughness: 0.95 });

    const trailer = new THREE.Mesh(new THREE.BoxGeometry(13.6, 2.7, 2.5), trailerMat);
    trailer.position.set(-3.2, 2.65, 0);
    T.add(this.withTwin(trailer, 4200, true));
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(13, 0.28, 1.1), darkMat);
    chassis.position.set(-3.4, 1.15, 0);
    T.add(this.withTwin(chassis, 0, true));

    // cab-over tractor: extruded aero side profile
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(0, 2.55);
    s.quadraticCurveTo(0.1, 3.1, 0.8, 3.15);
    s.lineTo(1.9, 3.15);
    s.quadraticCurveTo(2.4, 3.1, 2.48, 2.6);
    s.lineTo(2.62, 1.3);
    s.lineTo(2.62, 0);
    s.lineTo(0, 0);
    const cabGeo = new THREE.ExtrudeGeometry(s, { depth: 2.45, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 10 });
    cabGeo.translate(0, 0, -1.225);
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(3.9, 0.95, 0);
    T.add(this.withTwin(cab, 2200, true, 30));
    const windscreen = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.0, 2.2), glassMat);
    windscreen.position.set(6.47, 3.15, 0);
    windscreen.rotation.z = -0.12;
    T.add(windscreen);
    for (const z of [-1.27, 1.27]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.04), glassMat);
      win.position.set(5.3, 3.2, z);
      T.add(win);
    }
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 2.5), darkMat);
    bumper.position.set(6.62, 0.85, 0);
    T.add(this.withTwin(bumper, 0, true));
    for (const z of [-0.95, 0.95]) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.4), this.glow("#fff3dc"));
      lamp.position.set(6.66, 1.25, z);
      T.add(lamp);
    }

    // wheels: twelve tyres, spun by distance travelled
    const wheelGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.34, 22);
    wheelGeo.rotateX(Math.PI / 2);
    for (const x of [-8.6, -7.4, 3.9, 5.0, 6.0]) {
      for (const z of [-1.08, 1.08]) {
        const w = new THREE.Mesh(wheelGeo, tyreMat);
        w.position.set(x, 0.52, z);
        T.add(this.withTwin(w, 120, true, 40));
        this.wheels.push(w);
      }
    }
    this.scene.add(T);
  }

  private buildYard() {
    const rise = (obj: THREE.Object3D, at: number) => {
      obj.scale.y = 0.0001;
      this.risers.push({ obj, at });
      this.scene.add(obj);
    };
    const tones = ["#6e4f3c", "#8a6a54", "#4f5a5e", "#7a3f2c", "#a08470", "#3e4a4f"];
    const container = (x: number, z: number, level: number, tone: number, rot = 0) => {
      const m = new THREE.Mesh(this.box(6.06, 2.59, 2.44), solidMaterial(this.U, { color: tones[tone % tones.length], roughness: 0.7, metalness: 0.25 }));
      m.position.set(x, level * 2.59, z);
      m.rotation.y = rot;
      return this.withTwin(m, 160, false);
    };

    // container stacks behind the road and a low row in front of it
    let i = 0;
    for (const [x, z, h] of [
      [14, -11, 3], [20.5, -11, 2], [27, -11.4, 3], [14, -14, 2], [20.5, -14, 3], [60, -12, 2], [66.5, -12, 3], [73, -12.4, 1],
      [90, -11, 3], [96.5, -11, 2], [-14, -12, 2], [-20.5, -12, 3],
    ] as const) {
      for (let lv = 0; lv < h; lv++) rise(container(x, z, lv, i++), 0.06 + (x + 30) / 900);
    }
    for (const [x, z] of [[30, 11], [36.5, 11], [43, 11.4], [70, 10.5], [76.5, 10.5]] as const) {
      rise(container(x, z, 0, i++), 0.12 + x / 900);
    }

    // warehouse with lit dock doors and two trucks backed into it
    const wh = new THREE.Mesh(this.box(46, 8, 16), solidMaterial(this.U, { color: "#3b2d26", roughness: 0.9 }));
    wh.position.set(50, 0, -32);
    rise(this.withTwin(wh, 1600, false), 0.1);
    const roof = new THREE.Mesh(this.box(47, 0.6, 17), solidMaterial(this.U, { color: "#2a201b" }));
    roof.position.set(50, 8, -32);
    rise(this.withTwin(roof, 300, false), 0.12);
    for (let d = 0; d < 6; d++) {
      const door = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.4), this.glow("#ffbd78"));
      door.position.set(33 + d * 7, 1.8, -23.95);
      rise(door, 0.14);
    }
    for (const x of [40, 54]) {
      const parked = this.truck.clone(true);
      parked.remove(...parked.children.filter((c) => c instanceof THREE.SpotLight || (c as THREE.Object3D).type === "Object3D"));
      // Parked trucks belong to the yard: they fade out with it, leaving the hero truck alone.
      const yardLines = lineMaterial(this.U, this.yardFade);
      const yardPoints = pointsMaterial(this.U, this.yardFade);
      parked.traverse((o) => {
        if (o instanceof THREE.LineSegments) o.material = yardLines;
        else if (o instanceof THREE.Points) o.material = yardPoints;
      });
      parked.rotation.y = -Math.PI / 2;
      parked.position.set(x, 0, -14);
      parked.scale.setScalar(1);
      rise(parked, 0.16);
    }

    // yard lights along the road
    for (let x = -30; x <= 140; x += 22) {
      const pole = new THREE.Mesh(this.box(0.18, 9, 0.18), solidMaterial(this.U, { color: "#1a1411" }));
      pole.position.set(x, 0, -6.5);
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.5), this.glow("#fff1d6"));
      head.position.set(0.5, 9, 0);
      pole.add(head);
      rise(this.withTwin(pole, 40, false), 0.08 + (x + 30) / 1000);
    }

    // the far industrial skyline
    for (let k = 0; k < 14; k++) {
      const w = 10 + Math.random() * 22;
      const h = 5 + Math.random() * 12;
      const sk = new THREE.Mesh(this.box(w, h, 10), solidMaterial(this.U, { color: "#8a5f4a", roughness: 1 }));
      sk.position.set(-60 + k * 26, 0, -175 - Math.random() * 30);
      rise(this.withTwin(sk, 0, false), 0.06);
    }
  }

  // ---- runtime

  resize(w: number, h: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.U.uPixelRatio.value = dpr;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // keep the truck framed on tall/narrow screens
    this.camera.userData.fovScale = w / h < 1.2 ? 1.35 : 1;
    this.camera.updateProjectionMatrix();
  }

  setProgress(p: number) {
    this.p = clamp01(p);
  }

  render(time: number) {
    const p = this.p;
    this.U.uTime.value = time / 1000;

    // drive
    const dist = 46 * span(p, 0.03, 0.8);
    this.truck.position.x = dist;
    this.wheels.forEach((w) => (w.rotation.z = -dist / 0.52));
    this.U.uOrigin.value.set(dist - 2, 0);

    // the yard rises out of the ground, left to right
    for (const r of this.risers) {
      const t = smooth(span(p, r.at, r.at + 0.1));
      r.obj.scale.y = Math.max(0.0001, t);
      r.obj.visible = t > 0.001;
    }

    // conversion and night
    const convert = smooth(span(p, 0.42, 0.74)) * 1.02;
    this.U.uConvert.value = convert;
    const night = smooth(span(p, 0.44, 0.7));
    this.sky.uniforms.uNight.value = night;
    this.stars.uniforms.uAlpha.value = smooth(span(p, 0.5, 0.74));
    this.fog.color.set("#c98a62").lerp(new THREE.Color("#020304"), night);
    this.fog.far = 230 + night * 400;
    this.hemi.intensity = 1.6 * (1 - night * 0.85);
    this.sun.intensity = 2.2 * (1 - night);
    this.headlight.intensity = 60 * (1 - night);
    this.yardFade.value = 1 - smooth(span(p, 0.74, 0.86));
    const dark = new THREE.Color("#050607");
    this.groundMats.forEach((m) => m.color.copy(m.userData.base).lerp(dark, night));
    const glow = 1 - smooth(span(p, 0.44, 0.62));
    this.glowMats.forEach((m) => {
      m.opacity = glow;
      m.visible = glow > 0.01;
    });
    this.renderer.toneMappingExposure = 1.25 - night * 0.3;

    // sun sits low behind the truck so it reads as a backlit silhouette; shadow box follows
    this.sun.position.set(dist - 25, 16, -45);
    this.sun.target.position.set(dist, 0, 0);

    // camera along its keyframed path, tracking the truck
    const seg = this.keyP.findIndex((k) => k > p);
    const i = seg === -1 ? this.keyP.length - 1 : Math.max(1, seg);
    const a = this.keyP[i - 1];
    const b = this.keyP[i];
    const local = b > a ? smooth(clamp01((p - a) / (b - a))) : 1;
    const t = ((i - 1) + local) / (this.keyP.length - 1);
    const pos = this.camCurve.getPoint(Math.min(1, t));
    const look = this.lookCurve.getPoint(Math.min(1, t));
    this.camera.position.set(pos.x + dist, pos.y, pos.z);
    this.camera.lookAt(look.x + dist, look.y, look.z);
    const fov = this.fovs[i - 1] + (this.fovs[i] - this.fovs[i - 1]) * local;
    this.camera.fov = fov * (this.camera.userData.fovScale ?? 1);
    this.camera.updateProjectionMatrix();

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
    });
    this.renderer.dispose();
  }
}
