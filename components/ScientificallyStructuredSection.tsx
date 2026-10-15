"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import Eyebrow from "./Eyebrow";
import RevealTitle from "./RevealTitle";
import { getLenis } from "./SmoothScroll";
import "./scientificallyStructuredSection.scss";

// A chess piece per curriculum level, growing from pawn to king. Each level
// orbits two icon props and swaps in a dark/light porcelain glaze. Ported from
// the "Scientifically Structured" design reference: a vanilla three.js scene
// (r128) driving a WebGL stage that sits behind the copy panel.
type Step = {
  id: "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";
  dark: boolean;
  h: number;
  yaw: number;
  props: [string, string];
  title: string;
  desc: string;
};

const STEPS: Step[] = [
  {
    id: "pawn",
    dark: true,
    h: 0.58,
    yaw: 0,
    props: ["bulb", "books"],
    title: "1. Beginner Level",
    desc: "Introduce your child to chess and its incredible possibilities. By the end, they’ll know how to play by international chess rules and apply basic chess strategies.",
  },
  {
    id: "knight",
    dark: false,
    h: 0.7,
    yaw: 1.05,
    props: ["puzzle", "board"],
    title: "2. Advanced Beginner Level",
    desc: "Practical guidance to defeat amateur players. Students will master chess tactics and openings to gain a strong foundation.",
  },
  {
    id: "bishop",
    dark: true,
    h: 0.78,
    yaw: 0,
    props: ["shield", "clock"],
    title: "3. Intermediate Level",
    desc: "Students learn to defend under pressure, manage the clock and turn small advantages into winning positions.",
  },
  {
    id: "rook",
    dark: false,
    h: 0.758,
    yaw: 0,
    props: ["medal", "map"],
    title: "4. Advanced Level",
    desc: "Long-term planning and endgame technique prepare students to compete in rated tournaments with confidence.",
  },
  {
    id: "queen",
    dark: true,
    h: 0.93,
    yaw: 0,
    props: ["target", "clipboard"],
    title: "5. Expert Level",
    desc: "Deep game analysis and opening preparation sharpen accuracy, so every move is played with a clear purpose.",
  },
  {
    id: "king",
    dark: false,
    h: 1.0,
    yaw: 0,
    props: ["trophy", "mountain"],
    title: "6. Master & Pro Master Level",
    desc: "Elite coaching for title-level play: advanced strategy, psychology and preparation for national and international events.",
  },
];

// Orbiting prop icons. Square source canvases (the brand's PNG icon set) carry
// aspect 1; bulb/books are tightly-cropped webp cut-outs, so they keep their
// true aspect.
const ASSETS: Record<string, { src: string; aspect: number }> = {
  puzzle: { src: "/images/structured/puzzle.png", aspect: 1 },
  shield: { src: "/images/structured/shield.png", aspect: 1 },
  medal: { src: "/images/structured/medal.png", aspect: 1 },
  map: { src: "/images/structured/roadmap.png", aspect: 1 },
  board: { src: "/images/structured/chessboard.png", aspect: 1 },
  clock: { src: "/images/structured/chess-clock.png", aspect: 1 },
  target: { src: "/images/structured/target.png", aspect: 1 },
  trophy: { src: "/images/structured/trophy.png", aspect: 1 },
  clipboard: { src: "/images/structured/game-analysis.png", aspect: 1 },
  mountain: { src: "/images/structured/summit.png", aspect: 1 },
  bulb: { src: "/images/structured/bulb.webp", aspect: 0.8426 },
  books: { src: "/images/structured/books.webp", aspect: 1.2303 },
};

const MODEL_SRC: Record<Step["id"], string> = {
  pawn: "/models/pawn.glb",
  knight: "/models/knight.glb",
  bishop: "/models/bishop.glb",
  rook: "/models/rook-90.glb",
  queen: "/models/queen.glb",
  king: "/models/king.glb",
};

const ONE_ON_ONE_SRC = "/images/structured/one-on-one.png";
const GROUP_SRC = "/images/structured/group-class.png";

// Where each prop orbits: starting angle, height above the piece's middle,
// size in world units.
const PROP_SLOTS = [
  { phase: 2.75, y: -0.05, size: 0.78 },
  { phase: -0.42, y: 0.65, size: 0.9 },
];

const KING_H = 2.75;
const TILE = 1.85;
const TILE_H = 0.3;
const STEP_VEC = new THREE.Vector3(2.35, 0.62, -1.0);
const JUMP_TIME = 1.45;
const PROP_PAD = 0.12;
const LAUNCH = 0.16;
const LAND = 0.74;
const SWAP_A = 0.3;
const SWAP_B = 0.44;

export default function ScientificallyStructuredSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const ticksRef = useRef<HTMLOListElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const swapRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const srRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const statusEl = statusRef.current;
    const ticksEl = ticksRef.current;
    const titleEl = titleRef.current;
    const descEl = descRef.current;
    const swapEl = swapRef.current;
    const prevBtn = prevRef.current;
    const nextBtn = nextRef.current;
    const srEl = srRef.current;
    if (!section || !stage || !statusEl || !ticksEl || !titleEl || !descEl || !swapEl || !prevBtn || !nextBtn || !srEl) {
      return;
    }

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileMQ = matchMedia("(max-width: 819.98px)");

    // ---- Renderer & scene ----
    // WebGL can be unavailable (disabled GPU, or the browser has run out of
    // contexts); leave the copy panel usable rather than crashing the page.
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      console.error(err);
      statusEl.textContent = "The 3D board couldn’t start in this browser.";
      titleEl.textContent = STEPS[0].title;
      descEl.textContent = STEPS[0].desc;
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.autoClear = false;
    stage.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200);

    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 40 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 6;
    scene.add(key, key.target);
    const fill = new THREE.DirectionalLight(0xc9dbff, 0.45);
    fill.position.set(-6, 3, 5);
    scene.add(fill);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c4dc, 0.35));

    // ---- Staircase: tiles fade out with distance from the active piece ----
    const fadeUniforms = { uFocus: { value: new THREE.Vector3() }, uR0: { value: 1.7 }, uR1: { value: 5.2 } };
    function fadingMaterial(color: number, rough: number) {
      const m = new THREE.MeshStandardMaterial({ color, roughness: rough, envMapIntensity: 0.6, transparent: true });
      m.color.convertSRGBToLinear();
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, fadeUniforms);
        sh.vertexShader =
          "varying vec3 vWPos;\n" +
          sh.vertexShader.replace(
            "#include <project_vertex>",
            "#include <project_vertex>\n vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;"
          );
        sh.fragmentShader =
          "uniform vec3 uFocus; uniform float uR0; uniform float uR1; varying vec3 vWPos;\n" +
          sh.fragmentShader.replace(
            "#include <dithering_fragment>",
            "#include <dithering_fragment>\n gl_FragColor.a *= 1.0 - smoothstep(uR0, uR1, distance(vWPos, uFocus));"
          );
      };
      return m;
    }
    const whiteMat = fadingMaterial(0xf3f4f6, 0.34);
    const blackMat = fadingMaterial(0x2a2f3b, 0.36);
    const tileGeo = new RoundedBoxGeometry(TILE, TILE_H, TILE, 4, 0.05);
    const tileTop = (i: number) => STEP_VEC.clone().multiplyScalar(i);
    STEPS.forEach((s, i) => {
      const m = new THREE.Mesh(tileGeo, i % 2 ? blackMat : whiteMat);
      m.position.copy(tileTop(i)).add(new THREE.Vector3(0, -TILE_H / 2, 0));
      m.receiveShadow = true;
      scene.add(m);
    });

    // ---- Screen-fixed floating cubes, drawn in an overlay pass ----
    const overlay = new THREE.Scene();
    overlay.environment = envTex;
    const overlayLight = new THREE.DirectionalLight(0xffffff, 1.2);
    overlayLight.translateX(2).translateY(3).translateZ(4);
    overlay.add(overlayLight);
    overlay.add(new THREE.HemisphereLight(0xffffff, 0xaab6cc, 0.5));
    const ortho = new THREE.OrthographicCamera(0, 1, 0, -1, -500, 500);
    const cubeGeo = new RoundedBoxGeometry(1, 1, 1, 3, 0.1);
    // x/y/s are design px on the 1920 frame. `m` places a cube on phones as
    // [x, y, size] fractions of the stage (x, size × width, y × height);
    // cubes without one are hidden there, as in the mobile design.
    const cubeDefs: {
      x: number;
      y: number;
      s: number;
      c: number;
      r: readonly [number, number, number];
      soft: boolean;
      m?: readonly [number, number, number];
    }[] = [
      { x: 1625, y: 195, s: 34, c: 0x2c5bb0, r: [0.5, 0.7, 0.2], soft: false },
      { x: 200, y: 452, s: 46, c: 0x8fb7ef, r: [0.3, -0.6, 0.1], soft: true },
      { x: 1012, y: 826, s: 50, c: 0x3a6cc0, r: [0.9, 0.8, 0.4], soft: true, m: [0.07, 0.67, 0.06] },
      { x: 1577, y: 1006, s: 38, c: 0xe8d6b5, r: [0.6, 0.5, 0.3], soft: false, m: [0.67, 0.83, 0.05] },
    ];
    const cubes = cubeDefs.map((d) => {
      const mat = new THREE.MeshStandardMaterial({
        color: d.c,
        roughness: 0.3,
        envMapIntensity: 0.8,
        transparent: !!d.soft,
        opacity: d.soft ? 0.75 : 1,
      });
      mat.color.convertSRGBToLinear();
      const m = new THREE.Mesh(cubeGeo, mat);
      m.rotation.set(d.r[0], d.r[1], d.r[2]);
      m.userData = { ...d, base: null as THREE.Vector3 | null };
      overlay.add(m);
      return m;
    });

    // ---- The traveller ----
    const actor = new THREE.Group();
    const flipper = new THREE.Group();
    const body = new THREE.Group();
    actor.add(flipper);
    flipper.add(body);
    scene.add(actor);
    const forms: THREE.Group[] = [];

    // Turn the white porcelain glaze into the dark glaze, keeping and
    // deepening the blue bands.
    function makeDark(mat: THREE.Material) {
      const m = (mat as THREE.MeshStandardMaterial).clone();
      m.roughness = 0.4;
      m.onBeforeCompile = (sh) => {
        sh.fragmentShader = sh.fragmentShader.replace(
          "#include <map_fragment>",
          `#include <map_fragment>
        float mxc = max(max(diffuseColor.r, diffuseColor.g), diffuseColor.b);
        float mnc = min(min(diffuseColor.r, diffuseColor.g), diffuseColor.b);
        float sat = (mxc - mnc) / max(mxc, 1e-4);
        float bandMask = smoothstep(0.16, 0.32, sat);
        float shade = mxc;
        vec3 inkCol = vec3(0.011, 0.014, 0.022) * (0.45 + 0.75 * shade);
        vec3 bandCol = vec3(0.02, 0.15, 0.62) * (0.55 + 0.6 * shade);
        diffuseColor.rgb = mix(inkCol, bandCol, bandMask);`
        );
      };
      return m;
    }

    // ---- Orbiting props ----
    function propTextures(src: string) {
      const c1 = document.createElement("canvas");
      const c2 = document.createElement("canvas");
      const sharp = new THREE.CanvasTexture(c1);
      const soft = new THREE.CanvasTexture(c2);
      [sharp, soft].forEach((tx) => {
        tx.encoding = THREE.sRGBEncoding;
        tx.anisotropy = 4;
      });
      const img = new Image();
      img.onload = () => {
        const pw = Math.round(img.width * PROP_PAD);
        const ph = Math.round(img.height * PROP_PAD);
        const w = img.width + pw * 2;
        const h = img.height + ph * 2;
        c1.width = c2.width = w;
        c1.height = c2.height = h;
        c1.getContext("2d")!.drawImage(img, pw, ph);
        const small = document.createElement("canvas");
        small.width = Math.max(6, Math.round(w * 0.07));
        small.height = Math.max(6, Math.round(h * 0.07));
        const sg = small.getContext("2d")!;
        sg.imageSmoothingQuality = "high";
        sg.drawImage(c1, 0, 0, small.width, small.height);
        const mid = document.createElement("canvas");
        mid.width = Math.round(w * 0.18);
        mid.height = Math.round(h * 0.18);
        const mg = mid.getContext("2d")!;
        mg.imageSmoothingQuality = "high";
        mg.drawImage(small, 0, 0, mid.width, mid.height);
        const g2 = c2.getContext("2d")!;
        g2.imageSmoothingQuality = "high";
        g2.drawImage(mid, 0, 0, w, h);
        sharp.needsUpdate = soft.needsUpdate = true;
      };
      img.src = src;
      return { sharp, soft };
    }
    const propSets = STEPS.map((s) => {
      const sprites = s.props.map((name, k) => {
        const tx = propTextures(ASSETS[name].src);
        const mat = new THREE.SpriteMaterial({ map: tx.sharp, transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
        const blurU = { uSoftMap: { value: tx.soft }, uBlur: { value: 0 } };
        (mat.userData as { blur?: { value: number } }).blur = blurU.uBlur;
        mat.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, blurU);
          sh.fragmentShader =
            "uniform sampler2D uSoftMap; uniform float uBlur;\n" +
            sh.fragmentShader.replace(
              "#include <map_fragment>",
              "vec4 texelColor = mix(texture2D(map, vUv), texture2D(uSoftMap, vUv), uBlur);\n texelColor = mapTexelToLinear(texelColor);\n diffuseColor *= texelColor;"
            );
        };
        const sp = new THREE.Sprite(mat);
        const slot = PROP_SLOTS[k];
        const asp = ASSETS[name].aspect;
        const padK = 1 + PROP_PAD * 2;
        sp.userData = {
          slot,
          w: (asp >= 1 ? slot.size : slot.size * asp) * padK,
          h: (asp >= 1 ? slot.size / asp : slot.size) * padK,
          bob: Math.random() * 6,
        };
        sp.visible = false;
        sp.renderOrder = 2;
        scene.add(sp);
        return sp;
      });
      return { sprites, v: 0, target: 0 };
    });
    const orbitCenter = new THREE.Vector3();
    let orbitAngle = 0;
    let orbitReady = false;

    // ---- Burst particles & landing ripple ----
    const burstGeo = new RoundedBoxGeometry(1, 1, 1, 2, 0.15);
    const burstColors = [0x3d78de, 0x8fb7ef, 0xffffff, 0xe8d6b5];
    const particles: THREE.Mesh[] = [];
    for (let i = 0; i < 26; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: burstColors[i % 4], roughness: 0.3, transparent: true, opacity: 0 });
      mat.color.convertSRGBToLinear();
      const m = new THREE.Mesh(burstGeo, mat);
      m.visible = false;
      m.userData = { v: new THREE.Vector3(), spin: new THREE.Vector3(), life: 0, max: 1, size: 0.1 };
      scene.add(m);
      particles.push(m);
    }
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 0.98, 64),
      new THREE.MeshBasicMaterial({ color: 0x3d78de, transparent: true, opacity: 0, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);
    let ringT = 1;

    // ---- Load pieces ----
    const loader = new GLTFLoader();
    let loadedCount = 0;
    let cancelled = false;
    STEPS.forEach((s, i) => {
      loader.load(
        MODEL_SRC[s.id],
        (gltf) => {
          if (cancelled) return;
          const root = gltf.scene;
          root.traverse((o) => {
            if (!(o as THREE.Mesh).isMesh) return;
            const mesh = o as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (s.dark) mesh.material = makeDark(mesh.material as THREE.Material);
          });
          const box = new THREE.Box3().setFromObject(root);
          const size = box.getSize(new THREE.Vector3());
          const sc = (s.h * KING_H) / size.y;
          const c = box.getCenter(new THREE.Vector3());
          root.scale.setScalar(sc);
          root.position.set(-c.x * sc, -box.min.y * sc, -c.z * sc);
          const yawWrap = new THREE.Group();
          yawWrap.rotation.y = s.yaw;
          yawWrap.add(root);
          const wrap = new THREE.Group();
          wrap.add(yawWrap);
          wrap.visible = false;
          wrap.userData.height = s.h * KING_H;
          body.add(wrap);
          forms[i] = wrap;
          loadedCount++;
          statusEl!.textContent = `Setting up the board… ${loadedCount} of 6`;
          if (loadedCount === STEPS.length) ready();
        },
        undefined,
        (err) => {
          console.error(err);
          statusEl!.textContent = `The ${s.id} model could not be read. Reload the page to try again.`;
        }
      );
    });

    // ---- State & UI ----
    let cur = 0;
    let anim: null | {
      from: number;
      to: number;
      t: number;
      dir: number;
      p0: THREE.Vector3;
      p1: THREE.Vector3;
      swapped: boolean;
      landed: boolean;
      hc: number;
      dur: number;
    } = null;
    let isReady = false;
    let intro = 1;
    let queue: number[] = [];

    const tickButtons: HTMLButtonElement[] = [];
    STEPS.forEach((s, i) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", s.title);
      b.addEventListener("click", () => goTo(i));
      li.appendChild(b);
      ticksEl.appendChild(li);
      tickButtons.push(b);
    });

    let copyTimer: number | null = null;
    function setCopy(i: number, instant?: boolean) {
      const apply = () => {
        titleEl!.textContent = STEPS[i].title;
        descEl!.textContent = STEPS[i].desc;
      };
      if (copyTimer !== null) clearTimeout(copyTimer);
      if (instant || reduceMotion) {
        apply();
        swapEl!.classList.remove("out");
        return;
      }
      swapEl!.classList.add("out");
      copyTimer = window.setTimeout(() => {
        apply();
        swapEl!.classList.remove("out");
      }, 350);
    }

    function updateUI(i: number, instant?: boolean) {
      setCopy(i, instant);
      tickButtons.forEach((b, k) => {
        if (k === i) b.setAttribute("aria-current", "step");
        else b.removeAttribute("aria-current");
      });
      prevBtn!.disabled = !isReady || i === 0;
      nextBtn!.disabled = !isReady || i === STEPS.length - 1;
      srEl!.textContent = `Level ${i + 1} of ${STEPS.length}: ${STEPS[i].title}`;
    }

    function showForm(i: number) {
      forms.forEach((f, k) => {
        f.visible = k === i;
        f.scale.setScalar(1);
      });
    }

    function ready() {
      isReady = true;
      statusEl!.classList.add("done");
      actor.position.copy(tileTop(0));
      showForm(0);
      if (!reduceMotion) {
        forms[0].scale.setScalar(0.001);
        intro = 0;
      }
      propSets[0].target = 1;
      if (reduceMotion) propSets[0].v = 1;
      updateUI(0, true);
    }

    function stepDir(dir: 1 | -1) {
      if (!isReady || anim) return;
      const to = cur + dir;
      if (to >= 0 && to < STEPS.length) startJump(cur, to);
    }
    function goTo(i: number) {
      if (!isReady || i === cur) return;
      queue = [];
      const dir = i > cur ? 1 : -1;
      for (let k = cur + dir; dir > 0 ? k <= i : k >= i; k += dir) queue.push(k);
      if (!anim) startJump(cur, queue.shift()!);
    }

    function startJump(from: number, to: number) {
      propSets[from].target = 0;
      if (reduceMotion) {
        propSets[from].v = 0;
        propSets[to].target = 1;
        propSets[to].v = 1;
        cur = to;
        actor.position.copy(tileTop(to));
        showForm(to);
        updateUI(to);
        if (queue.length) startJump(cur, queue.shift()!);
        return;
      }
      forms[from].visible = true;
      forms[to].visible = true;
      forms[to].scale.setScalar(0.001);
      anim = {
        from,
        to,
        t: 0,
        dir: to > from ? 1 : -1,
        p0: tileTop(from),
        p1: tileTop(to),
        swapped: false,
        landed: false,
        hc: (forms[from].userData.height + forms[to].userData.height) * 0.25,
        dur: queue.length ? JUMP_TIME * 0.8 : JUMP_TIME,
      };
      cur = to;
      updateUI(to);
    }

    const onPrev = () => {
      queue = [];
      stepDir(-1);
    };
    const onNext = () => {
      queue = [];
      stepDir(1);
    };
    prevBtn.addEventListener("click", onPrev);
    nextBtn.addEventListener("click", onNext);

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest && target.closest("input, textarea")) return;
      if (e.key === "ArrowRight") {
        queue = [];
        stepDir(1);
      }
      if (e.key === "ArrowLeft") {
        queue = [];
        stepDir(-1);
      }
    };
    addEventListener("keydown", onKeyDown);

    // ---- Wheel: one gesture = one level ----
    // While the section sits centred in the viewport, the wheel steps through
    // the levels instead of scrolling the page. A gesture of any length (a
    // trackpad's momentum tail included) moves exactly one level: the wheel
    // stays locked until the jump has finished and the wheel has gone quiet.
    // At the first/last level the page scrolls on as usual. The listener runs
    // in the capture phase on document, ahead of Lenis's window listener.
    let wheelLock = false;
    let aligning = false;
    let lastWheel = 0;
    const WHEEL_QUIET = 200;
    const alignedY = () => {
      const r = section.getBoundingClientRect();
      return scrollY + r.top + (r.height - innerHeight) / 2;
    };
    const inBand = () => {
      const r = section.getBoundingClientRect();
      return Math.abs(r.top + r.height / 2 - innerHeight / 2) < innerHeight * 0.3;
    };
    const align = () => {
      const y = alignedY();
      const lenis = getLenis();
      aligning = true;
      if (lenis) lenis.scrollTo(y, { duration: 0.7, force: true, onComplete: () => (aligning = false) });
      else {
        scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
        window.setTimeout(() => (aligning = false), reduceMotion ? 0 : 700);
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (mobile || !isReady || e.ctrlKey) return;
      if (wheelLock) {
        e.preventDefault();
        e.stopPropagation();
        lastWheel = performance.now();
        return;
      }
      if (!e.deltaY || Math.abs(e.deltaY) < Math.abs(e.deltaX) || !inBand()) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      const canStep = dir > 0 ? cur < STEPS.length - 1 : cur > 0;
      if (!canStep) return;
      e.preventDefault();
      e.stopPropagation();
      wheelLock = true;
      lastWheel = performance.now();
      // Entering the section only lines it up; the next gesture changes level.
      if (Math.abs(scrollY - alignedY()) > 4) align();
      else {
        queue = [];
        stepDir(dir);
      }
    };
    document.addEventListener("wheel", onWheel, { capture: true, passive: false });

    // ---- Swipe: left = next level, right = previous ----
    // Scoped to the section. Its `touch-action: pan-y` keeps vertical page
    // scrolling native while leaving horizontal drags to us, so the browser
    // doesn't cancel the pointer mid-swipe. A drag that turns into a vertical
    // scroll fires pointercancel and is dropped.
    let swipe: [number, number] | null = null;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!e.isPrimary || target.closest?.("a, button")) return;
      swipe = [e.clientX, e.clientY];
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!swipe) return;
      const dx = e.clientX - swipe[0];
      const dy = e.clientY - swipe[1];
      swipe = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        queue = [];
        stepDir(dx < 0 ? 1 : -1);
      }
    };
    const onPointerCancel = () => (swipe = null);
    section.addEventListener("pointerdown", onPointerDown);
    section.addEventListener("pointerup", onPointerUp);
    section.addEventListener("pointercancel", onPointerCancel);

    const parallax = new THREE.Vector2();
    const parallaxT = new THREE.Vector2();
    const onPointerMove = (e: PointerEvent) => {
      if (!reduceMotion) parallaxT.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5);
    };
    addEventListener("pointermove", onPointerMove);

    // ---- Easing ----
    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
    const smooth = (a: number, b: number, x: number) => {
      const t = clamp01((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    };
    const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const backOut = (t: number) => {
      const c1 = 1.9;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };
    const softBack = (t: number) => {
      const c1 = 1.1;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInCubic = (t: number) => t * t * t;

    // ---- Layout ----
    const focus = new THREE.Vector3();
    const focusTarget = new THREE.Vector3();
    const camDir = new THREE.Vector3(-0.42, 0.36, 1).normalize();
    const camFlat = new THREE.Vector3(camDir.x, 0, camDir.z).normalize();
    let camDist = 14;
    let framed = false;
    let W = 1;
    let H = 1;
    let frame = { left: 0, top: 0, u: 1 };
    let mobile = false;

    function layout() {
      W = stage!.clientWidth;
      H = stage!.clientHeight;
      mobile = mobileMQ.matches;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      let sx: number;
      let sy: number;
      let pxPerUnit: number;
      if (mobile) {
        sx = W * 0.5;
        sy = H * 0.6;
        pxPerUnit = Math.min(W * 0.22, H * 0.15);
      } else {
        const u = Math.min(W / 100, H / 62.66);
        frame = { u, left: (W - 100 * u) / 2, top: Math.max(0, (H - 62.66 * u) / 2) };
        sx = frame.left + 72.2 * u;
        sy = frame.top + 37 * u;
        pxPerUnit = 8.6 * u;
      }
      camDist = H / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * pxPerUnit);
      camera.setViewOffset(W, H, W / 2 - sx, H / 2 - sy, W, H);
      camera.updateProjectionMatrix();

      ortho.left = 0;
      ortho.right = W;
      ortho.top = 0;
      ortho.bottom = -H;
      ortho.updateProjectionMatrix();
      cubes.forEach((c) => {
        const d = c.userData;
        if (mobile) {
          c.visible = !!d.m;
          if (!d.m) return;
          const [mx, my, ms] = d.m;
          d.base = new THREE.Vector3(W * mx, -(H * my), 0);
          c.position.copy(d.base);
          c.scale.setScalar(W * ms);
          return;
        }
        c.visible = true;
        const k = frame.u / 19.2;
        d.base = new THREE.Vector3(frame.left + d.x * k, -(frame.top + d.y * k), 0);
        c.position.copy(d.base);
        c.scale.setScalar(d.s * k);
      });
    }
    const onResize = () => layout();
    addEventListener("resize", onResize);
    mobileMQ.addEventListener("change", layout);

    const resizeObserver = new ResizeObserver(() => layout());
    resizeObserver.observe(stage);
    layout();

    const clock = new THREE.Clock();
    const tmp = new THREE.Vector3();

    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const time = clock.elapsedTime;

      if (wheelLock && !anim && !aligning && performance.now() - lastWheel > WHEEL_QUIET) wheelLock = false;

      if (intro < 1 && isReady) {
        intro = Math.min(1, intro + dt / 0.9);
        forms[0].scale.setScalar(Math.max(0.001, backOut(intro)));
      }

      if (anim) {
        anim.t = Math.min(1, anim.t + dt / anim.dur);
        const p = anim.t;
        const u = clamp01((p - LAUNCH) / (LAND - LAUNCH));
        const e = easeInOut(u);
        const arc = 1.6 + Math.abs(anim.p1.y - anim.p0.y) * 0.5;
        actor.position.lerpVectors(anim.p0, anim.p1, e);
        actor.position.y += arc * 4 * e * (1 - e);

        let sy = 1;
        if (p < LAUNCH) sy = 1 - 0.16 * Math.sin((p / LAUNCH) * (Math.PI / 2));
        else if (p < LAND) sy = 1 + 0.12 * Math.sin(u * Math.PI) * (1 - u * 0.5);
        else {
          const k = (p - LAND) / (1 - LAND);
          sy = 1 - 0.14 * Math.sin(k * Math.PI * 2.2) * Math.pow(1 - k, 1.6);
        }
        body.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));

        forms[anim.from].scale.setScalar(Math.max(0.001, 1 - smooth(SWAP_A, SWAP_B, p)));
        const g = clamp01((p - SWAP_B) / 0.26);
        forms[anim.to].scale.setScalar(Math.max(0.001, g > 0 ? backOut(g) : 0.001));
        if (!anim.swapped && p >= SWAP_B) {
          anim.swapped = true;
          forms[anim.from].visible = false;
        }
        if (p >= 0.58 && !propSets[anim.to].target) propSets[anim.to].target = 1;
        if (!anim.landed && p >= LAND) {
          anim.landed = true;
          ring.position.copy(anim.p1).add(new THREE.Vector3(0, 0.005, 0));
          ringT = 0;
        }
        if (p >= 1) {
          body.scale.set(1, 1, 1);
          actor.position.copy(anim.p1);
          showForm(anim.to);
          anim = null;
          if (queue.length) startJump(cur, queue.shift()!);
        }
      }

      const hMid = (forms[cur] ? forms[cur].userData.height : 1.5) * 0.55;
      tmp.copy(actor.position).setY(actor.position.y + hMid);
      if (!orbitReady) {
        orbitCenter.copy(tmp);
        orbitReady = true;
      }
      orbitCenter.lerp(tmp, 1 - Math.exp(-2.6 * dt));
      if (!reduceMotion) orbitAngle += dt * ((Math.PI * 2) / 42);
      const STAGGER = 0.18;
      propSets.forEach((set) => {
        if (set.v !== set.target) {
          const speed = set.target ? 1 / 1.1 : 1 / 0.6;
          set.v = set.target ? Math.min(1, set.v + dt * speed) : Math.max(0, set.v - dt * speed);
        }
        set.sprites.forEach((sp, k) => {
          const d = sp.userData as { slot: (typeof PROP_SLOTS)[number]; w: number; h: number; bob: number };
          const local = set.target
            ? clamp01((set.v - k * STAGGER) / (1 - STAGGER))
            : clamp01(set.v / (1 - k * 0.12));
          sp.visible = local > 0.001;
          if (!sp.visible) return;
          let scale: number;
          let opacity: number;
          let spread: number;
          let lift: number;
          let swing: number;
          if (set.target) {
            const e = easeOutCubic(local);
            scale = 0.45 + 0.55 * softBack(local);
            opacity = smooth(0, 0.45, local);
            spread = 1 + (1 - e) * 0.3;
            lift = -(1 - e) * 0.45;
            swing = -(1 - e) * 0.55;
          } else {
            const o = easeInCubic(1 - local);
            scale = 1 - 0.5 * o;
            opacity = 1 - smooth(0.1, 1, 1 - local);
            spread = 1 + o * 0.35;
            lift = o * 0.5;
            swing = o * 0.4;
          }
          const a = orbitAngle + d.slot.phase + swing;
          const R = 1.85 * spread;
          const Rz = 1.1 * spread;
          sp.position.set(
            orbitCenter.x + Math.cos(a) * R,
            orbitCenter.y + d.slot.y + lift + Math.sin(a) * 0.3 + (reduceMotion ? 0 : Math.sin(time * 1.1 + d.bob) * 0.07),
            orbitCenter.z + Math.sin(a) * Rz
          );
          const ox = Math.cos(a) * R;
          const oz = Math.sin(a) * Rz;
          const toward = (ox * camFlat.x + oz * camFlat.z) / R;
          const behind = smooth(0.3, -0.8, toward);
          scale *= 1 - 0.38 * behind;
          (sp.material.userData as { blur?: { value: number } }).blur!.value = behind;
          sp.scale.set(d.w * scale, d.h * scale, 1);
          sp.material.opacity = opacity * (1 - 0.18 * behind);
        });
      });

      particles.forEach((m) => {
        if (!m.visible) return;
        const d = m.userData as { v: THREE.Vector3; spin: THREE.Vector3; life: number; max: number; size: number };
        d.life += dt;
        const k = d.life / d.max;
        if (k >= 1) {
          m.visible = false;
          return;
        }
        d.v.y -= 7 * dt;
        m.position.addScaledVector(d.v, dt);
        m.rotation.x += d.spin.x * dt;
        m.rotation.y += d.spin.y * dt;
        m.scale.setScalar(d.size * (1 - k * 0.6));
        (m.material as THREE.MeshStandardMaterial).opacity = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      });

      if (ringT < 1) {
        ringT = Math.min(1, ringT + dt / 0.7);
        const s = 0.6 + ringT * 0.75;
        ring.scale.set(s, s, s);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - ringT);
      }

      if (!reduceMotion) {
        cubes.forEach((c, i) => {
          const base = (c.userData as { base: THREE.Vector3 | null }).base;
          if (!base) return;
          c.position.y = base.y + Math.sin(time * 0.9 + i * 1.7) * c.scale.x * 0.12;
          c.rotation.y += dt * 0.25;
        });
      }

      focusTarget.copy(actor.position).setY(actor.position.y + 0.9);
      if (anim) focusTarget.y = THREE.MathUtils.lerp(anim.p0.y, anim.p1.y, easeInOut(clamp01(anim.t))) + 0.9;
      if (!framed) {
        focus.copy(focusTarget);
        framed = true;
      }
      focus.lerp(focusTarget, 1 - Math.exp(-3.2 * dt));
      fadeUniforms.uFocus.value.copy(focus).setY(focus.y - 0.9);
      parallax.lerp(parallaxT, 1 - Math.exp(-3 * dt));
      camera.position.copy(focus).addScaledVector(camDir, camDist);
      camera.position.x += parallax.x * 0.6;
      camera.position.y -= parallax.y * 0.4;
      camera.lookAt(focus);
      key.position.copy(focus).add(new THREE.Vector3(4, 9, 6));
      key.target.position.copy(focus);

      renderer.clear();
      renderer.render(scene, camera);
      renderer.clearDepth();
      renderer.render(overlay, ortho);
    });

    return () => {
      cancelled = true;
      renderer.setAnimationLoop(null);
      removeEventListener("resize", onResize);
      mobileMQ.removeEventListener("change", layout);
      removeEventListener("keydown", onKeyDown);
      document.removeEventListener("wheel", onWheel, { capture: true });
      section.removeEventListener("pointerdown", onPointerDown);
      section.removeEventListener("pointerup", onPointerUp);
      section.removeEventListener("pointercancel", onPointerCancel);
      removeEventListener("pointermove", onPointerMove);
      prevBtn.removeEventListener("click", onPrev);
      nextBtn.removeEventListener("click", onNext);
      resizeObserver.disconnect();
      ticksEl.replaceChildren();
      if (copyTimer !== null) clearTimeout(copyTimer);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = (mesh as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose());
        else if (mat) (mat as THREE.Material).dispose();
      });
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === stage) stage.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <section ref={sectionRef} className="structured" aria-label="Chess curriculum levels">
      <div ref={stageRef} className="structured__stage" aria-hidden="true" />
      <p ref={statusRef} className="structured__status" role="status">
        Setting up the board…
      </p>

      <div className="structured__guides" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <Eyebrow className="structured__eyebrow" boxClassName="structured__box">
        A Curriculum For Growing Minds
      </Eyebrow>
      <RevealTitle className="structured__title">
        Scientifically&nbsp;
        <br />
        Structured
      </RevealTitle>
      <ol ref={ticksRef} className="structured__ticks" aria-label="Levels" />

      <div className="structured__copy">
        <div ref={swapRef} className="structured__swap" aria-live="polite">
          <h3 ref={titleRef} className="structured__level-title" />
          <p ref={descRef} className="structured__level-desc" />
        </div>
        {/* TODO: replace placeholder hrefs with the real course/class pages */}
        <a className="structured__cta" href="/chess-courses">
          <svg aria-hidden="true">
            <rect x="0" y="0" width="100%" height="100%" rx="9" ry="9" pathLength={100} />
          </svg>
          Explore Chess Courses
        </a>
        <ul className="structured__features">
          <li>
            <a href="/chess-courses/one-on-one">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ONE_ON_ONE_SRC} alt="" />
              <span className="structured__feature-label">
                <b>One-on-one</b>{" "}
                <br />
                chess classes
              </span>
            </a>
          </li>
          <li>
            <a href="/chess-courses/group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GROUP_SRC} alt="" />
              <span className="structured__feature-label">
                <b>Group</b> chess{" "}
                <br />
                classes
              </span>
            </a>
          </li>
        </ul>
        <div className="structured__arrows">
          <button type="button" className="structured__prev" ref={prevRef} aria-label="Previous level" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button type="button" className="structured__next" ref={nextRef} aria-label="Next level" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p ref={srRef} className="structured__sr" aria-live="polite" />
      </div>
    </section>
  );
}
