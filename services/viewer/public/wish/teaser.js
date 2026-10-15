// Creator-page teaser: a gift box drops into a little "room", shakes, pops open, and the gift for the
// chosen tab rises out (Pooja lamp, cake, heart, emoji face, trophy). Loops gently; pauses off-screen.
import * as THREE from 'three';

const box = document.getElementById('teaser');
const canvas = box && box.querySelector('canvas');

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

if (canvas && webglOK()) start();

function start() {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 1.6, 5.0);
  camera.lookAt(0, 0.88, 0);

  scene.add(new THREE.HemisphereLight(0xfff1e0, 0x3a1f4f, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(2, 4, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  sun.shadow.radius = 4;
  scene.add(sun);
  const warm = new THREE.PointLight(0xffa64d, 0, 4, 1.5);
  warm.position.set(0, 1.6, 0.6);
  scene.add(warm);

  const std = (color, rough = 0.5, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    return m;
  };

  // A soft glow texture for flames and the floor spot.
  const glowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();

  // Floor: shadow catcher plus a soft spot, so it reads as "on a surface in the room".
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ opacity: 0.3 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const spot = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffc27a, transparent: true, opacity: 0.35, depthWrite: false }));
  spot.rotation.x = -Math.PI / 2;
  spot.position.y = 0.002;
  scene.add(spot);

  // ── The gift box ──
  const giftGroup = new THREE.Group();
  scene.add(giftGroup);
  const boxMat = new THREE.MeshPhysicalMaterial({ color: 0x8a5cff, roughness: 0.35, clearcoat: 0.6 });
  const ribbon = std(0xffc94a, 0.3, { metalness: 0.6 });
  giftGroup.add(mesh(new THREE.BoxGeometry(0.9, 0.66, 0.9), boxMat, 0, 0.33, 0));
  for (const r of [0, Math.PI / 2]) {
    const s = mesh(new THREE.BoxGeometry(0.14, 0.665, 0.91), ribbon, 0, 0.33, 0);
    s.rotation.y = r;
    giftGroup.add(s);
  }
  const lid = new THREE.Group();
  lid.add(mesh(new THREE.BoxGeometry(0.98, 0.16, 0.98), boxMat));
  for (const r of [0, Math.PI / 2]) {
    const s = mesh(new THREE.BoxGeometry(0.15, 0.165, 0.99), ribbon);
    s.rotation.y = r;
    lid.add(s);
  }
  for (const side of [-1, 1]) {
    const loop = mesh(new THREE.TorusGeometry(0.13, 0.04, 10, 22), ribbon, side * 0.13, 0.15, 0);
    loop.rotation.z = side * 0.5;
    loop.scale.set(1, 0.75, 1);
    lid.add(loop);
  }
  giftGroup.add(lid);
  const LID_Y = 0.74;

  // ── What rises out, per tab ──
  function flame() {
    const g = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff8a1f }));
    outer.scale.set(1, 2.4, 1);
    outer.position.y = 0.05;
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff1b8 }));
    core.scale.set(1, 2, 1);
    core.position.y = 0.045;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffa040, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.setScalar(0.32);
    glow.position.y = 0.06;
    g.add(outer, core, glow);
    g.userData.flame = true;
    return g;
  }
  const lathe = (pts, mat) => mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 32), mat);
  const ITEMS = {
    pj() {
      const g = new THREE.Group();
      const brass = std(0xd4a017, 0.25, { metalness: 1 });
      g.add(lathe([[0, 0], [0.2, 0], [0.21, 0.02], [0.13, 0.06], [0.05, 0.1], [0.035, 0.14], [0.03, 0.55], [0.05, 0.58], [0.035, 0.62],
        [0.03, 0.66], [0.19, 0.73], [0.2, 0.76], [0.03, 0.77], [0.02, 0.86], [0.05, 0.9], [0, 0.97]], brass));
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
        const f = flame();
        f.position.set(Math.cos(a) * 0.17, 0.76, Math.sin(a) * 0.17);
        g.add(f);
      }
      return g;
    },
    bday() {
      const g = new THREE.Group();
      g.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.28, 40), std(0xff8fb8, 0.5), 0, 0.14, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.24, 40), std(0xfff5f8, 0.5), 0, 0.4, 0));
      g.add(mesh(new THREE.TorusGeometry(0.42, 0.03, 8, 40), std(0xffffff, 0.5), 0, 0.28, 0).rotateX(Math.PI / 2));
      [0xff5c9d, 0x4dd0e1, 0xffd23f].forEach((c, i) => {
        const x = (i - 1) * 0.14;
        g.add(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.18, 10), std(c, 0.4), x, 0.61, 0));
        const f = flame();
        f.position.set(x, 0.7, 0);
        f.scale.setScalar(0.8);
        g.add(f);
      });
      return g;
    },
    ty() {
      const s = new THREE.Shape();
      s.moveTo(0, -0.35);
      s.bezierCurveTo(-0.55, 0.05, -0.32, 0.45, 0, 0.22);
      s.bezierCurveTo(0.32, 0.45, 0.55, 0.05, 0, -0.35);
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4, curveSegments: 24 });
      geo.center();
      const heart = mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xff2d6f, roughness: 0.3, clearcoat: 0.8 }), 0, 0.42, 0);
      const g = new THREE.Group();
      g.add(heart);
      return g;
    },
    rx() {
      const g = new THREE.Group();
      g.add(mesh(new THREE.SphereGeometry(0.36, 40, 28), new THREE.MeshPhysicalMaterial({ color: 0xffae00, roughness: 0.45, clearcoat: 0.3, emissive: 0x6b3a00, emissiveIntensity: 0.2 }), 0, 0.42, 0));
      const dark = std(0x3b2314, 0.4);
      for (const sx of [-1, 1]) {
        const eye = mesh(new THREE.SphereGeometry(0.045, 14, 10), dark, sx * 0.12, 0.5, 0.32);
        eye.scale.set(1, 1.4, 0.6);
        g.add(eye);
        const blush = mesh(new THREE.CircleGeometry(0.06, 16), new THREE.MeshBasicMaterial({ color: 0xff7a9c, transparent: true, opacity: 0.6 }), sx * 0.21, 0.4, 0.31);
        blush.lookAt(sx * 0.6, 0.4, 1.5);
        g.add(blush);
      }
      const smile = mesh(new THREE.TorusGeometry(0.13, 0.025, 8, 24, Math.PI), dark, 0, 0.38, 0.32);
      smile.rotation.z = Math.PI;
      g.add(smile);
      return g;
    },
    aw() {
      const g = new THREE.Group();
      const gold = std(0xffc94a, 0.22, { metalness: 1, side: THREE.DoubleSide });
      g.add(mesh(new THREE.BoxGeometry(0.42, 0.12, 0.42), std(0x3b2314, 0.45), 0, 0.06, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.22, 20), gold, 0, 0.23, 0));
      g.add(lathe([[0.03, 0.34], [0.1, 0.37], [0.2, 0.46], [0.26, 0.6], [0.28, 0.74], [0.25, 0.75]], gold));
      for (const sx of [-1, 1]) {
        const h = mesh(new THREE.TorusGeometry(0.08, 0.02, 10, 20, Math.PI), gold, sx * 0.29, 0.6, 0);
        h.rotation.z = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
        g.add(h);
      }
      return g;
    },
  };
  const itemHolder = new THREE.Group();
  scene.add(itemHolder);
  let item = null;
  const GLOW_COLORS = { pj: 0xffa64d, bday: 0xff8fb8, ty: 0xff5c9d, rx: 0xffd23f, aw: 0xffd36b };
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffa64d, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.setScalar(2.2);
  scene.add(halo);

  function setItem(kind) {
    if (item) itemHolder.remove(item);
    item = (ITEMS[kind] || ITEMS.pj)();
    itemHolder.add(item);
    halo.material.color.setHex(GLOW_COLORS[kind] || 0xffa64d);
  }

  // ── Sparkle burst when the lid pops ──
  const SPARK_N = 90;
  const sparks = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }), SPARK_N);
  const sparkCols = [0xffd23f, 0xff5c9d, 0x7ad0ff, 0xc13cff, 0xffffff];
  const sparkData = [];
  for (let i = 0; i < SPARK_N; i++) {
    sparks.setColorAt(i, new THREE.Color(sparkCols[i % sparkCols.length]));
    sparkData.push({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: Math.random() * 6, life: 99 });
  }
  scene.add(sparks);
  function burst() {
    for (const s of sparkData) {
      s.p.set(0, 0.8, 0);
      const a = Math.random() * Math.PI * 2, up = 1.6 + Math.random() * 1.6, out = 0.6 + Math.random() * 1.1;
      s.v.set(Math.cos(a) * out, up, Math.sin(a) * out);
      s.life = 0;
    }
  }
  const dummy = new THREE.Object3D();

  // ── Timeline (seconds within one loop) ──
  const LOOP = 7.2;
  const ease = {
    bounce(k) {
      const n = 7.5625, d = 2.75;
      if (k < 1 / d) return n * k * k;
      if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75;
      if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375;
      return n * (k -= 2.625 / d) * k + 0.984375;
    },
    back(k) { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
    out(k) { return 1 - Math.pow(1 - k, 3); },
  };
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  let loopStart = performance.now() / 1000;
  let burstDone = false;

  function pose(t, now) {
    // 0–0.9 drop · 0.9–1.7 shake · 1.7 lid pops · 1.7–2.6 rise · … · 6.4–7.2 fade out
    const drop = clamp01(t / 0.9);
    giftGroup.position.y = (1 - ease.bounce(drop)) * 2.4;
    const shrink = t > 6.4 ? 1 - clamp01((t - 6.4) / 0.6) : 1;
    giftGroup.scale.setScalar(Math.max(0.0001, Math.min(1, drop * 3) * shrink));
    giftGroup.rotation.z = t > 0.9 && t < 1.7 ? Math.sin(now * 38) * 0.05 * (1 - (t - 0.9) / 0.8) : 0;
    giftGroup.rotation.y = Math.sin(now * 0.6) * 0.25;

    const open = clamp01((t - 1.7) / 0.7);
    lid.position.set(ease.out(open) * 0.9, LID_Y + Math.sin(open * Math.PI) * 0.9 - open * 0.68, -ease.out(open) * 0.15);
    lid.rotation.set(open * 0.4, open * 1.1, -open * 0.9);
    if (t >= 1.7 && !burstDone) { burst(); burstDone = true; }

    const rise = clamp01((t - 1.85) / 0.9);
    itemHolder.position.y = 0.4 + ease.out(rise) * 0.55 + (rise >= 1 ? Math.sin(now * 1.6) * 0.04 : 0);
    itemHolder.scale.setScalar(Math.max(0.0001, ease.back(rise) * shrink));
    itemHolder.rotation.y = Math.sin(now * 0.8) * 0.5;
    halo.position.set(0, itemHolder.position.y + 0.45, 0);
    halo.material.opacity = 0.55 * rise * shrink;
    warm.intensity = 3 * rise * shrink;
    spot.material.opacity = 0.2 + 0.25 * rise * shrink;

    if (item) item.traverse((o) => {
      if (o.userData.flame) {
        const f = 1 + Math.sin(now * 17 + o.position.x * 9) * 0.1;
        o.children[0].scale.set(1, 2.4 * f, 1);
      }
    });
  }

  function stepSparks(dt) {
    for (let i = 0; i < SPARK_N; i++) {
      const s = sparkData[i];
      if (s.life > 2.2) { dummy.scale.setScalar(0); dummy.updateMatrix(); sparks.setMatrixAt(i, dummy.matrix); continue; }
      s.life += dt;
      s.v.y -= 3.2 * dt;
      s.v.multiplyScalar(1 - 1.4 * dt);
      s.p.addScaledVector(s.v, dt);
      dummy.position.copy(s.p);
      dummy.rotation.set(s.r + s.life * 6, s.r * 2 + s.life * 4, 0);
      dummy.scale.setScalar(Math.max(0, 1 - s.life / 2.2));
      dummy.updateMatrix();
      sparks.setMatrixAt(i, dummy.matrix);
    }
    sparks.instanceMatrix.needsUpdate = true;
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Narrow boxes need the camera further back to keep the gift in frame.
    camera.position.z = 5.0 * Math.max(1, 1.5 / camera.aspect);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  // Start from the active tab; follow tab changes and replay from the opening.
  setItem(document.querySelector('.kind.active')?.dataset.kind || 'pj');
  document.addEventListener('wish:kind', (e) => {
    setItem(e.detail);
    loopStart = performance.now() / 1000 - 1.65;     // jump to just before the lid pops
    burstDone = false;
  });

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 }).observe(box);
  document.getElementById('heroEmoji')?.setAttribute('hidden', '');
  box.hidden = false;

  let last = performance.now() / 1000;
  function frame() {
    requestAnimationFrame(frame);
    const now = performance.now() / 1000;
    const dt = Math.min(0.05, now - last);
    last = now;
    if (!visible || document.hidden) return;
    let t;
    if (reduceMotion) {
      t = 4;                                          // rest on the opened gift, no looping
    } else {
      t = now - loopStart;
      if (t > LOOP) { loopStart = now; t = 0; burstDone = false; }
    }
    pose(t, reduceMotion ? 0 : now);
    stepSparks(dt);
    renderer.render(scene, camera);
  }
  frame();
}
