// iNiXR AR Wish — receiver experience (Birthday cake + Thank-you gift).
// Personal data (names, message) arrives only in the URL #fragment and never reaches the server.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const $ = (id) => document.getElementById(id);
const EVT_URL = document.body.dataset.evt;
const CREATE_URL = document.body.dataset.create;
const PAGE_KIND = ['ty', 'rx', 'aw'].includes(document.body.dataset.kind) ? document.body.dataset.kind : 'bday';
const REACT_URL = document.body.dataset.react;
const FONT = '"Baloo Thambi 2", system-ui, sans-serif';
const TEXT_FONT_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/fonts/helvetiker_bold.typeface.json';

// ── Wish data ───────────────────────────────────────────────────
// "Thank you for…" — the 3D treat that rises out of the gift.
const ITEM_INFO = {
  heart: { label: '', emoji: '💖' },
  meals: { label: 'the delicious food', emoji: '🍛' },
  biryani: { label: 'the biryani', emoji: '😋' },
  dosa: { label: 'the crispy dosa', emoji: '😋' },
  chicken: { label: 'the chicken treat', emoji: '🍗' },
  juice: { label: 'the juice', emoji: '🧃' },
  icecream: { label: 'the ice cream', emoji: '🍦' },
  coffee: { label: 'the coffee', emoji: '☕' },
  pizza: { label: 'the pizza', emoji: '🍕' },
  chocolate: { label: 'the chocolate', emoji: '🍫' },
};
const RELS = {
  friend: 'my friend', bestie: 'my bestie', love: 'my love', husband: 'my husband', wife: 'my wife',
  brother: 'my brother', sister: 'my sister', amma: 'Amma', appa: 'Appa', teacher: 'my teacher',
  colleague: 'my colleague', kind: 'a kind soul',
  bff: 'my best friend', gang: 'the gang', machan: 'Machan',
};
// One-tap reactions (also sendable on their own from the creator).
const REACTS = {
  love: { emoji: '❤️', word: 'LOVE YOU', verb: 'loved it', glow: 0xff2d6f },
  hug: { emoji: '🤗', word: 'BIG HUG', verb: 'sent you a big hug', glow: 0xffb627 },
  kiss: { emoji: '😘', word: 'MUAH!', verb: 'sent you a kiss', glow: 0xff5c9d },
  haha: { emoji: '😂', word: 'HAHA!', verb: 'is laughing', glow: 0xffd23f },
  wow: { emoji: '😍', word: 'WOW!', verb: 'loved it', glow: 0xff5c9d },
  aww: { emoji: '☺️', word: 'AWW!', verb: 'is blushing', glow: 0xff8fc0 },
  bff: { emoji: '🤝', word: 'BEST FRIENDS', verb: 'says you are the best friend ever', glow: 0xff5c9d },
  gang: { emoji: '🥳', word: 'BEST GANG', verb: 'says our gang is the best', glow: 0xffd23f },
  missyou: { emoji: '🥺', word: 'MISS YOU', verb: 'misses you', glow: 0x7ad0ff },
};
// 🏆 Fun awards — the friendly war zone. The trophy holds a funny prop.
const AWARDS = {
  liar: { emoji: '🤥', title: 'GREAT LIAR', prop: 'liar' },
  drinker: { emoji: '🍺', title: 'GREAT DRINKER', prop: 'beer' },
  puresoul: { emoji: '🧸', title: 'PURE SOUL', prop: 'teddy' },
  tallest: { emoji: '👠', title: 'TALLEST PERSON', prop: 'heels' },
  bigbrain: { emoji: '🧠', title: 'BIG BRAIN', prop: 'brain' },
  sleepy: { emoji: '😴', title: 'SLEEPING CHAMPION', prop: 'sleep' },
  late: { emoji: '⏰', title: 'LATE COMER', prop: 'clock' },
  foodie: { emoji: '🍗', title: 'FOOD MONSTER', prop: 'chicken' },
  phone: { emoji: '📱', title: 'PHONE ADDICT', prop: 'phone' },
  drama: { emoji: '👑', title: 'DRAMA STAR', prop: 'crown' },
  bestie: { emoji: '🤝', title: 'BEST FRIEND', prop: 'hearts2' },
  custom: { emoji: '🏆', title: '', prop: 'star' },
};

const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u0009\u000b-\u001f]/g, ' ').trim().slice(0, n);

function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
}

function readWish() {
  try {
    const hp = new URLSearchParams(location.hash.slice(1));
    const d = hp.get('d');
    if (!d) return null;
    const o = JSON.parse(b64urlDecode(d));
    const w = {
      kind: ['ty', 'bday', 'rx', 'aw'].includes(o.k) ? o.k : PAGE_KIND,
      to: clean(o.t, 24),
      from: clean(o.f, 24),
      msg: clean(o.m, 220),
      id: /^[a-z0-9]{1,12}$/.test(o.i || '') ? o.i : '',
      preview: hp.get('p') === '1',
      item: ITEM_INFO[o.o] ? o.o : 'heart',
      rel: RELS[o.l] ? o.l : '',
      react: REACTS[o.x] ? o.x : 'love',
      reply: o.y === 1,
      award: AWARDS[o.a] ? o.a : 'custom',
      awardTitle: clean(o.c, 28).toUpperCase().replace(/\s*AWARD$/, ''),
    };
    return w.to ? w : null;
  } catch {
    return null;
  }
}

const DEMO_RX = { kind: 'rx', to: 'Friend', from: 'iNiXR', id: '', demo: true, item: 'heart', rel: '', react: 'wow', msg: 'You are amazing! 😍' };
const DEMO_AW = { kind: 'aw', to: 'Friend', from: 'iNiXR', id: '', demo: true, item: 'heart', rel: '', react: 'love', award: 'liar', awardTitle: '', msg: 'Congratulations on lying for 365 days straight 😂🏆' };
const W = readWish() || (PAGE_KIND === 'aw' ? DEMO_AW : PAGE_KIND === 'rx' ? DEMO_RX : PAGE_KIND === 'ty'
  ? { kind: 'ty', to: 'Friend', from: 'iNiXR', id: '', demo: true, item: 'heart', rel: '', msg: 'Thank you for being amazing! 💖' }
  : { kind: 'bday', to: 'Friend', from: 'iNiXR', id: '', demo: true, item: 'heart', rel: '', msg: 'Wishing you a year full of smiles, surprises and magic! 🎉' });
const IS_TY = W.kind === 'ty';
const IS_RX = W.kind === 'rx';
const IS_AW = W.kind === 'aw';
const IS_BOX = IS_TY || IS_AW;          // gift-box flow: thank-you + awards
const AWARD = AWARDS[W.award || 'liar'];
const AW_TITLE = (W.award === 'custom' ? W.awardTitle : AWARD.title) || 'SUPERSTAR';
const HEARTY = IS_TY || IS_RX;          // thank-you + reactions share the hearts theme
const ITEM = ITEM_INFO[W.item];
const REACT = REACTS[W.react || 'love'];

// Owner's own phone: open any page once with ?me=1 to stop counting it (?me=0 to undo).
const ME = (() => {
  try {
    const q = new URLSearchParams(location.search).get('me');
    if (q === '1') localStorage.setItem('wish_me', '1');
    if (q === '0') localStorage.removeItem('wish_me');
    return localStorage.getItem('wish_me') === '1';
  } catch { return false; }
})();

function track(e) {
  if (ME || W.demo || W.preview || !EVT_URL) return;
  const body = JSON.stringify({ e, k: W.kind, i: W.id, r: '' });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon(EVT_URL, new Blob([body], { type: 'text/plain' }));
    else fetch(EVT_URL, { method: 'POST', body, keepalive: true });
  } catch { /* analytics must never break the gift */ }
}

// ── Helpers ─────────────────────────────────────────────────────
const rand = (a, b) => a + Math.random() * (b - a);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeOutBack = (k) => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3);
const easeOutBounce = (k) => {
  const n = 7.5625, d = 2.75;
  if (k < 1 / d) return n * k * k;
  if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75;
  if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375;
  return n * (k -= 2.625 / d) * k + 0.984375;
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let toastTimer = 0;
function toast(text, ms = 2200) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitFont(ctx, text, weight, maxSize, maxWidth) {
  let size = maxSize;
  ctx.font = `${weight} ${size}px ${FONT}`;
  while (ctx.measureText(text).width > maxWidth && size > 40) {
    size -= 4;
    ctx.font = `${weight} ${size}px ${FONT}`;
  }
  return size;
}

function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function glowTexture() {
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return toTexture(c);
}

function plaqueTexture(line1, line2, colors) {
  const [c, ctx] = canvas(1024, 512);
  roundRectPath(ctx, 10, 10, 1004, 492, 70);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#fffaf2');
  g.addColorStop(1, colors.bg2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#e8b64c';
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colors.line1;
  ctx.font = `700 100px ${FONT}`;
  ctx.fillText(line1, 512, 150);
  fitFont(ctx, line2, 800, 200, 900);
  ctx.fillStyle = colors.line2;
  ctx.fillText(line2, 512, 335);
  ctx.fillStyle = '#e8b64c';
  for (const [x, y, s] of [[90, 110, 26], [935, 110, 26], [110, 410, 18], [915, 410, 18]]) star(ctx, x, y, s);
  return toTexture(c);
}

function bandTexture(name) {
  const W_ = 4096, H_ = 178;
  const [c, ctx] = canvas(W_, H_);
  const unit = `  ★  HAPPY BIRTHDAY ${name.toUpperCase()}`;
  ctx.font = `800 104px ${FONT}`;
  const uw = ctx.measureText(unit).width;
  const reps = Math.max(1, Math.round(W_ / uw));
  ctx.setTransform(W_ / (reps * uw), 0, 0, 1, 0, 0);
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  for (let i = 0; i < reps; i++) {
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#c2185b';
    ctx.strokeText(unit, i * uw, H_ / 2 + 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(unit, i * uw, H_ / 2 + 6);
  }
  const t = toTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

function stripeTexture() {
  const [c, ctx] = canvas(64, 256);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 64, 256);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  for (let y = -64; y < 256; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(64, y + 40); ctx.lineTo(64, y + 60); ctx.lineTo(0, y + 20);
    ctx.fill();
  }
  return toTexture(c);
}

function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(5, 5);
  s.bezierCurveTo(5, 5, 4, 0, 0, 0);
  s.bezierCurveTo(-6, 0, -6, 7, -6, 7);
  s.bezierCurveTo(-6, 11, -3, 15.4, 5, 19);
  s.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
  s.bezierCurveTo(16, 7, 16, 0, 10, 0);
  s.bezierCurveTo(7, 0, 5, 5, 5, 5);
  return s;
}

// Heart geometry of a given width, centred, point facing down (depth 0 = flat).
function heartGeometry(width, depth) {
  const g = depth > 0
    ? new THREE.ExtrudeGeometry(heartShape(), { depth: 4, bevelEnabled: true, bevelThickness: 1.6, bevelSize: 1.4, bevelSegments: 5, curveSegments: 18 })
    : new THREE.ShapeGeometry(heartShape(), 10);
  g.center();
  g.rotateZ(Math.PI);
  const s = width / 22;
  g.scale(s, s, depth > 0 ? (depth / 7.2) : 1);
  return g;
}

// ── Renderer / scene ────────────────────────────────────────────
const stage = $('stage');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch {
  $('introTitle').textContent = 'Sorry, this phone’s browser can’t show 3D. Try opening the link in Chrome.';
  $('openBtn').hidden = true;
  throw new Error('WebGL unavailable');
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const VIEW_FOV = 40, AR_FOV = 62;     // phone cameras see ~60° vertically in portrait
const camera = new THREE.PerspectiveCamera(VIEW_FOV, innerWidth / innerHeight, 0.05, 100);
const TARGET = new THREE.Vector3(0, 1.15, 0);
const ELEV = THREE.MathUtils.degToRad(17);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minPolarAngle = 0.55;
controls.maxPolarAngle = 1.52;

function framingDistance() {
  const aspect = innerWidth / innerHeight;
  return 5.6 * Math.max(1, 0.72 / aspect);
}

scene.add(new THREE.HemisphereLight(0xffe9f5, 0x3b1257, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 2.0);
sun.position.set(3, 7, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: 1, far: 20 });
sun.shadow.bias = -0.0005;
scene.add(sun);

const warmLight = new THREE.PointLight(HEARTY ? 0xff5c9d : 0xffa64d, 0, 5, 1.6);
warmLight.position.set(0, 2.05, 0.4);
scene.add(warmLight);

// Everything that is "the gift" lives in world (scaled down when shown through the camera).
const world = new THREE.Group();
scene.add(world);

const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ opacity: 0.28 }));
shadowCatcher.rotation.x = -Math.PI / 2;
shadowCatcher.receiveShadow = true;
world.add(shadowCatcher);

const GLOW = glowTexture();
const hero = new THREE.Group();          // cake or gift box — drops in on reveal
hero.visible = false;
world.add(hero);

function std(color, rough = 0.55, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, ...extra });
}
function shadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ── Tweens ──────────────────────────────────────────────────────
const tweens = [];
function tween(dur, fn, delay = 0) {
  return new Promise((resolve) => tweens.push({ t: -delay, dur, fn, resolve }));
}

// ── Balloons (round for birthday, hearts for thank-you) ─────────
const balloons = [];
function buildBalloons() {
  const colors = HEARTY
    ? [0xff2d6f, 0xff8fc0, 0xc13cff, 0xff5c9d, 0xffb3d1, 0xe0115f, 0x9b5de5, 0xff7aa8]
    : [0xff4d6d, 0xffd23f, 0x3ec1d3, 0x9b5de5, 0x00c49a, 0xf15bb5, 0xfb8500, 0x4d96ff];
  // [angle° (0 = toward viewer), radius, height] — sides and back only, never in front of the name.
  const spots = [[75, 2.2, 2.4], [105, 2.0, 3.0], [140, 2.3, 2.2], [165, 2.0, 3.4], [195, 2.2, 3.0], [220, 2.3, 2.3], [255, 2.0, 2.9], [285, 2.2, 2.5]];
  const geo = HEARTY ? heartGeometry(0.62, 0.22) : new THREE.SphereGeometry(0.3, 32, 24);
  spots.forEach(([deg, r, y], i) => {
    const a = THREE.MathUtils.degToRad(deg);
    const g = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({ color: colors[i], roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15 });
    const body = new THREE.Mesh(geo, mat);
    if (!HEARTY) body.scale.set(1, 1.18, 1);
    body.userData.balloon = g;
    g.add(shadowed(body));
    // Invisible, generous tap target — balloons are small on a phone, especially in the room view.
    const hitbox = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
    hitbox.userData.balloon = g;
    g.add(hitbox);
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.07, 10), mat);
    knot.position.y = HEARTY ? -0.3 : -0.37;
    g.add(knot);
    const pts = [];
    for (let j = 0; j <= 14; j++) {
      const t = j / 14;
      pts.push(new THREE.Vector3(Math.sin(t * 5 + i) * 0.05, knot.position.y - 0.03 - t * 1.5, Math.cos(t * 4 + i) * 0.03));
    }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })));
    const home = new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);
    g.position.set(home.x, -4, home.z);
    g.visible = false;
    g.userData = { home, seed: rand(0, 10), shown: 0, fly: 0, flyV: 0, flyX: rand(-0.3, 0.3), popped: false, body, hitbox };
    world.add(g);
    balloons.push(g);
  });
}

function showBalloons() {
  balloons.forEach((b, i) => {
    Object.assign(b.userData, { shown: 0, fly: 0, flyV: 0, popped: false });
    b.visible = true;
    b.scale.setScalar(1);
    tween(2.2, (k) => { b.userData.shown = easeOutCubic(k); }, 0.3 + i * 0.12);
  });
}

function releaseBalloons() {
  balloons.forEach((b, i) => setTimeout(() => { if (!b.userData.popped) b.userData.flyV = rand(0.4, 0.8); }, i * 140));
}

function popBalloon(b) {
  if (b.userData.popped) return;
  b.userData.popped = true;
  const p = new THREE.Vector3();
  b.userData.body.getWorldPosition(p);
  world.worldToLocal(p);
  burstConfetti(40, p, 0.55);
  sfx.pop();
  tween(0.12, (k) => b.scale.setScalar(1 + k * 0.35)).then(() => { b.visible = false; });
}

// ── Sparkles, confetti, smoke ───────────────────────────────────
function buildSparkles() {
  const n = 90;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), r = rand(1.4, 2.6), y = rand(0.3, 3.2);
    pos.set([Math.sin(a) * r, y, Math.cos(a) * r], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.07, map: GLOW, color: HEARTY ? 0xffb3d1 : 0xffd98a, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.visible = false;
  world.add(pts);
  return pts;
}
const sparkles = buildSparkles();

const CONF_N = 420;
const confetti = new THREE.InstancedMesh(
  HEARTY ? heartGeometry(0.1, 0) : new THREE.PlaneGeometry(0.055, 0.09),
  new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
  CONF_N,
);
confetti.frustumCulled = false;
const conf = Array.from({ length: CONF_N }, () => ({ alive: false, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), life: 0 }));
{
  const palette = HEARTY
    ? [0xff2d6f, 0xff8fc0, 0xffffff, 0xc13cff, 0xffd23f, 0xff5c9d]
    : [0xff4d6d, 0xffd23f, 0x3ec1d3, 0x9b5de5, 0x00f5d4, 0xf15bb5, 0xffffff, 0xfb8500];
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < CONF_N; i++) {
    confetti.setMatrixAt(i, zero);
    confetti.setColorAt(i, new THREE.Color(palette[i % palette.length]));
  }
  world.add(confetti);
}
let confCursor = 0;
function burstConfetti(n, origin, power = 1) {
  for (let k = 0; k < n; k++) {
    const c = conf[confCursor];
    confCursor = (confCursor + 1) % CONF_N;
    const a = rand(0, Math.PI * 2);
    c.alive = true;
    c.life = 0;
    c.p.copy(origin).add(new THREE.Vector3(rand(-0.2, 0.2), 0, rand(-0.2, 0.2)));
    c.v.set(Math.cos(a) * rand(0.6, 2.2) * power, rand(3.2, 5.2) * power, Math.sin(a) * rand(0.6, 2.2) * power);
    c.r.set(rand(0, 6), rand(0, 6), rand(0, 6));
    c.w.set(rand(-9, 9), rand(-9, 9), rand(-9, 9));
  }
}

const smokeMats = [];
const smoke = Array.from({ length: 24 }, () => {
  const mat = new THREE.SpriteMaterial({ map: GLOW, color: 0xdad4e8, transparent: true, opacity: 0, depthWrite: false });
  smokeMats.push(mat);
  const s = new THREE.Sprite(mat);
  s.visible = false;
  hero.add(s);
  return { s, life: 0, alive: false, drift: 0 };
});
let smokeCursor = 0;
function puffSmoke(at) {
  for (let i = 0; i < 4; i++) {
    const sm = smoke[smokeCursor];
    smokeCursor = (smokeCursor + 1) % smoke.length;
    sm.alive = true;
    sm.life = -i * 0.12;
    sm.drift = rand(-0.15, 0.15);
    sm.s.position.copy(at);
    sm.s.visible = false;
  }
}

// ── Audio (all synthesized; the Happy Birthday tune is public domain) ─
let actx = null, master = null, songBus = null, noiseBuf = null, muted = false;

function initAudio() {
  if (actx) { actx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  actx = new AC();
  master = actx.createGain();
  master.gain.value = 0.85;
  master.connect(actx.destination);
  noiseBuf = actx.createBuffer(1, actx.sampleRate * 1.2, actx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const freq = (n) => 440 * Math.pow(2, (12 * (parseInt(n.slice(-1), 10) + 1) + NOTE[n[0]] - 69) / 12);

function tone(f, t, dur, vol, type = 'sine', out = master) {
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function musicBox(f, t, dur, vol = 0.22, out = master) {
  tone(f, t, Math.max(0.6, dur * 1.5), vol, 'sine', out);
  tone(f * 2, t, 0.5, vol * 0.25, 'triangle', out);
  tone(f * 3, t, 0.18, vol * 0.08, 'sine', out);
}

function noise(t, dur, vol, filterType, f0, f1) {
  const src = actx.createBufferSource();
  src.buffer = noiseBuf;
  const flt = actx.createBiquadFilter();
  flt.type = filterType;
  flt.frequency.setValueAtTime(f0, t);
  flt.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(flt).connect(g).connect(master);
  src.start(t);
  src.stop(t + dur + 0.05);
}

const sfx = {
  sparkle() {
    if (!actx) return;
    const t = actx.currentTime;
    ['E6', 'G6', 'C7', 'E7'].forEach((n, i) => tone(freq(n), t + i * 0.07, 0.5, 0.06));
  },
  pop(delay = 0) {
    if (!actx) return;
    const t = actx.currentTime + delay;
    noise(t, 0.12, 0.5, 'bandpass', 1800, 600);
    tone(520, t, 0.12, 0.12, 'triangle');
  },
  whoosh() {
    if (!actx) return;
    noise(actx.currentTime, 0.7, 0.35, 'lowpass', 2400, 300);
  },
  light() {
    if (!actx) return;
    const t = actx.currentTime;
    noise(t, 0.35, 0.25, 'bandpass', 500, 2500);
    tone(freq('G6'), t + 0.05, 0.3, 0.04);
  },
  thud() {
    if (!actx) return;
    const t = actx.currentTime;
    tone(110, t, 0.25, 0.3, 'sine');
    noise(t, 0.15, 0.2, 'lowpass', 600, 120);
  },
  tada() {
    if (!actx) return;
    const t = actx.currentTime;
    ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => musicBox(freq(n), t + i * 0.09, 0.4, 0.16));
    ['C5', 'E5', 'G5', 'C6'].forEach((n) => musicBox(freq(n), t + 0.42, 1.2, 0.1));
  },
  drumroll(sec) {
    if (!actx) return;
    const t0 = actx.currentTime;
    for (let t = 0; t < sec; t += 0.045) {
      noise(t0 + t, 0.06, 0.08 + (t / sec) * 0.3, 'bandpass', 900, 300);
    }
    noise(t0 + sec, 0.4, 0.6, 'lowpass', 3000, 200);
    tone(80, t0 + sec, 0.4, 0.4, 'sine');
  },
  applause() {
    if (!actx) return;
    const t0 = actx.currentTime;
    for (let i = 0; i < 90; i++) noise(t0 + rand(0, 2.4), 0.05, rand(0.05, 0.16), 'bandpass', rand(1200, 3000), 800);
  },
  shutter() {
    if (!actx) return;
    const t = actx.currentTime;
    noise(t, 0.05, 0.4, 'highpass', 3000, 5000);
    noise(t + 0.07, 0.05, 0.3, 'highpass', 3000, 5000);
  },
};

// ── Songs ───────────────────────────────────────────────────────
// Happy Birthday (public domain). [note, beats, bass]
const BDAY_SONG = [
  [['G4', 0.75], ['G4', 0.25], ['A4', 1, 'C3'], ['G4', 1], ['C5', 1], ['B4', 2, 'G2']],
  [['G4', 0.75], ['G4', 0.25], ['A4', 1, 'G2'], ['G4', 1], ['D5', 1], ['C5', 2, 'C3']],
  [['G4', 0.75], ['G4', 0.25], ['G5', 1, 'C3'], ['E5', 1], ['C5', 1], ['B4', 1, 'F2'], ['A4', 2]],
  [['F5', 0.75], ['F5', 0.25], ['E5', 1, 'C3'], ['C5', 1], ['D5', 1, 'G2'], ['C5', 3, 'C3']],
];
const BDAY_LYRICS = [
  'Happy birthday to you 🎵',
  'Happy birthday to you 🎶',
  `Happy birthday dear ${W.to} 💖`,
  'Happy birthday to you! 🎉',
];
// Original gentle arpeggio for the thank-you gift.
const TY_SONG = [
  [['C5', 0.5, 'C3'], ['E5', 0.5], ['G5', 0.5], ['C6', 0.5]],
  [['B4', 0.5, 'G2'], ['D5', 0.5], ['G5', 0.5], ['B5', 0.5]],
  [['A4', 0.5, 'A2'], ['C5', 0.5], ['E5', 0.5], ['A5', 0.5]],
  [['F4', 0.5, 'F2'], ['A4', 0.5], ['C5', 0.5], ['F5', 0.5]],
  [['G4', 0.5, 'G2'], ['B4', 0.5], ['D5', 0.5], ['G5', 0.5]],
  [['E5', 0.5, 'C3'], ['G5', 0.5], ['C6', 2]],
];
const AW_LYRICS = ['', '', `Congratulations, ${W.to}! 😂👏`, '', 'Speech! Speech! 🎤', ''];
const TY_LYRICS = ['', '', `Thank you, ${W.to} 💖`, '', ITEM.label ? `for ${ITEM.label} ${ITEM.emoji}` : '', ''];

let songTimers = [];

function stopSong() {
  songTimers.forEach(clearTimeout);
  songTimers = [];
  if (songBus && actx) {
    songBus.gain.setTargetAtTime(0, actx.currentTime, 0.08);
    const old = songBus;
    setTimeout(() => old.disconnect(), 800);
  }
  songBus = null;
  hideLyric();
}

function playSong(song, lyrics, beatSec) {
  stopSong();
  return new Promise((resolve) => {
    if (actx) {
      songBus = actx.createGain();
      songBus.connect(master);
    }
    const bus = songBus;
    const start = actx ? actx.currentTime + 0.15 : 0;
    let beat = 0;
    song.forEach((line, li) => {
      if (lyrics[li]) songTimers.push(setTimeout(() => showLyric(lyrics[li]), beat * beatSec * 1000 + 100));
      for (const [n, b, bass] of line) {
        if (bus) {
          const t = start + beat * beatSec;
          musicBox(freq(n), t, b * beatSec, 0.22, bus);
          if (bass) {
            tone(freq(bass), t, b * beatSec * 2.2, 0.1, 'triangle', bus);
            tone(freq(bass) * 1.5, t, b * beatSec * 2, 0.05, 'triangle', bus);
          }
        }
        beat += b;
      }
    });
    songTimers.push(setTimeout(() => { hideLyric(); resolve(); }, beat * beatSec * 1000 + 700));
  });
}

function showLyric(text) {
  const el = $('lyric');
  el.classList.remove('show');
  requestAnimationFrame(() => { el.textContent = text; el.classList.add('show'); });
}
function hideLyric() { $('lyric').classList.remove('show'); }

// ═══════════════════════════════════════════════════════════════
//  BIRTHDAY CAKE
// ═══════════════════════════════════════════════════════════════
const flames = [];

function dripRing(radius, topY, count, color, rMin, rMax) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(1, 14, 10);
  const mat = std(color, 0.35);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = rand(rMin, rMax);
    const len = rand(1.1, 2.6);
    const m = new THREE.Mesh(geo, mat);
    m.scale.set(r, r * len, r);
    m.position.set(Math.sin(a) * radius, topY - r * len * 0.45, Math.cos(a) * radius);
    g.add(shadowed(m));
  }
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius - 0.01, rMax * 0.9, 12, 80), mat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = topY;
  g.add(shadowed(rim));
  return g;
}

function beadRing(radius, y, count, color, r) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(r, 12, 10);
  const mat = std(color, 0.4);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const m = new THREE.Mesh(geo, mat);
    m.position.set(Math.sin(a) * radius, y, Math.cos(a) * radius);
    g.add(shadowed(m));
  }
  return g;
}

function buildCake() {
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.38, 0.08, 64), std(0xf7f3ff, 0.25, { metalness: 0.15 }));
  plate.position.y = 0.04;
  hero.add(shadowed(plate));

  const t1 = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.8, 72), std(0xff8fb8, 0.6));
  t1.position.y = 0.48;
  hero.add(shadowed(t1));
  hero.add(dripRing(1.1, 0.88, 30, 0xfff4e6, 0.07, 0.1));
  hero.add(beadRing(1.1, 0.13, 40, 0xfff4e6, 0.07));

  const bandMat = new THREE.MeshStandardMaterial({ map: bandTexture(W.to), transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 });
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.104, 1.104, 0.3, 96, 1, true), bandMat);
  band.position.y = 0.43;
  hero.add(band);

  const sprinkles = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.012, 0.045, 2, 6), std(0xffffff, 0.4), 90);
  const dummy = new THREE.Object3D();
  const sprColors = [0xffd23f, 0x3ec1d3, 0x9b5de5, 0x00c49a, 0xff5d8f, 0xffffff];
  for (let i = 0; i < 90; i++) {
    const a = rand(0, Math.PI * 2);
    const r = rand(0.8, 1.02);
    dummy.position.set(Math.sin(a) * r, 0.9, Math.cos(a) * r);
    dummy.rotation.set(Math.PI / 2, 0, rand(0, Math.PI));
    dummy.updateMatrix();
    sprinkles.setMatrixAt(i, dummy.matrix);
    sprinkles.setColorAt(i, new THREE.Color(sprColors[i % sprColors.length]));
  }
  hero.add(sprinkles);

  const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.6, 64), std(0xfff1dc, 0.6));
  t2.position.y = 1.18;
  hero.add(shadowed(t2));
  hero.add(dripRing(0.75, 1.48, 22, 0xff6fa3, 0.055, 0.08));
  hero.add(beadRing(0.75, 0.92, 30, 0xff8fb8, 0.05));

  const berryMat = std(0xd81b60, 0.25, { metalness: 0.05 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), berryMat);
    b.position.set(Math.sin(a) * 0.66, 1.52, Math.cos(a) * 0.66);
    hero.add(shadowed(b));
  }

  // Name topper on gold sticks
  const topper = new THREE.Group();
  topper.position.set(0, 2.24, -0.32);
  topper.scale.setScalar(1.2);
  const tex = plaqueTexture('Happy Birthday', W.to, { bg2: '#ffe1ee', line1: '#e64a8b', line2: '#5b1a8a' });
  const gold = std(0xe8b64c, 0.3, { metalness: 0.8 });
  topper.add(shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.6, 0.02), gold)));
  for (const side of [1, -1]) {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.56), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    face.position.z = 0.011 * side;
    if (side < 0) face.rotation.y = Math.PI;
    topper.add(face);
  }
  for (const x of [-0.4, 0.4]) {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.55, 8), gold);
    stick.position.set(x, -0.52, 0);
    topper.add(stick);
  }
  hero.add(topper);

  // Candles (start unlit — the viewer lights them)
  const stripe = stripeTexture();
  const candleColors = [0x7ad0ff, 0xff7aa8, 0xffd23f, 0x9b5de5, 0x5fe0b0];
  const N = 5;
  for (let i = 0; i < N; i++) {
    const a = THREE.MathUtils.degToRad(-64 + (128 / (N - 1)) * i);
    const x = Math.sin(a) * 0.5, z = Math.cos(a) * 0.5 - 0.02;
    const h = 0.38;
    const candle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, h, 14),
      new THREE.MeshStandardMaterial({ color: candleColors[i], map: stripe, roughness: 0.45 }),
    );
    candle.position.set(x, 1.48 + h / 2, z);
    hero.add(shadowed(candle));

    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 6), std(0x222222, 0.9));
    wick.position.set(x, 1.48 + h + 0.02, z);
    hero.add(wick);

    const flame = new THREE.Group();
    flame.position.set(x, 1.48 + h + 0.1, z);
    const outer = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    outer.scale.set(0.05, 0.12, 0.05);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff4c2 }));
    inner.scale.set(0.028, 0.07, 0.028);
    inner.position.y = -0.02;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xffb04d, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.setScalar(0.5);
    flame.add(outer, inner, glow);
    flame.userData = { lit: false, k: 0, seed: rand(0, 100), base: flame.position.clone() };
    flame.visible = false;
    hero.add(flame);
    flames.push(flame);
  }
}

function lightFlame(f, delay) {
  return tween(0.35, (k) => { f.userData.k = easeOutBack(k); }, delay).then(() => { f.userData.lit = true; });
}

function extinguish(f) {
  if (!f.userData.lit) return;
  f.userData.lit = false;
  tween(0.25, (k) => { f.userData.k = 1 - k; });
  puffSmoke(f.userData.base.clone().add(new THREE.Vector3(0, 0.02, 0)));
}

// ═══════════════════════════════════════════════════════════════
//  THANK-YOU GIFT
// ═══════════════════════════════════════════════════════════════
// ── 3D treats for "Thank you for…" ─────────────────────────────
const steamPuffs = [];
function addSteam(parent, x, y, z, n = 3) {
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    s.userData = { x, y, z, phase: i / n, speed: rand(0.35, 0.5), seed: rand(0, 6) };
    parent.add(s);
    steamPuffs.push(s);
  }
}

function patternTexture(size, draw) {
  const [c, ctx] = canvas(size, size);
  draw(ctx, size);
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const riceTexture = (base, grains) => patternTexture(256, (ctx, n) => {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, n, n);
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = grains[i % grains.length];
    ctx.save();
    ctx.translate(rand(0, n), rand(0, n));
    ctx.rotate(rand(0, Math.PI));
    ctx.fillRect(-5, -1.6, 10, 3.2);
    ctx.restore();
  }
});
const stripes = (a, b) => patternTexture(64, (ctx, n) => {
  ctx.fillStyle = a;
  ctx.fillRect(0, 0, n, n);
  ctx.fillStyle = b;
  for (let y = 0; y < n; y += 16) ctx.fillRect(0, y, n, 8);
});

function physical(color, extra = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3, ...extra });
}
function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = shadowed(new THREE.Mesh(geo, mat));
  m.position.set(x, y, z);
  return m;
}
function steelMat() { return std(0xd8dde3, 0.22, { metalness: 0.9 }); }

function drumstick() {
  const g = new THREE.Group();
  const meat = mesh(new THREE.SphereGeometry(1, 28, 20), physical(0x9c4a1a, { roughness: 0.45, clearcoat: 0.7 }));
  meat.scale.set(0.26, 0.36, 0.24);
  g.add(meat);
  const spice = std(0x5a1e05, 0.8);
  for (let i = 0; i < 16; i++) {
    const v = new THREE.Vector3(rand(-1, 1), rand(-0.6, 1), rand(-1, 1)).normalize();
    g.add(mesh(new THREE.SphereGeometry(0.018, 6, 5), spice, v.x * 0.26, v.y * 0.36, v.z * 0.24));
  }
  const boneMat = std(0xfff6e6, 0.5);
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.3, 12), boneMat, 0, -0.42, 0));
  g.add(mesh(new THREE.SphereGeometry(0.055, 12, 10), boneMat, -0.035, -0.58, 0));
  g.add(mesh(new THREE.SphereGeometry(0.055, 12, 10), boneMat, 0.035, -0.58, 0));
  return g;
}

const TREATS = {
  heart() {
    const g = new THREE.Group();
    g.add(mesh(heartGeometry(1.0, 0.36), new THREE.MeshPhysicalMaterial({ color: 0xff2d6f, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1, emissive: 0x5a0020, emissiveIntensity: 0.6 })));
    return g;
  },
  juice() {
    const g = new THREE.Group();
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.28, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
    g.add(mesh(new THREE.CylinderGeometry(0.27, 0.21, 0.75, 36, 1, true), glassMat));
    g.add(mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.04, 36), glassMat, 0, -0.375, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.255, 0.205, 0.58, 36), std(0xff9f1c, 0.25, { emissive: 0x7a3000, emissiveIntensity: 0.35 }), 0, -0.07, 0));
    const ice = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.55 });
    g.add(mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), ice, -0.07, 0.2, 0.05));
    g.add(mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), ice, 0.06, 0.19, -0.06));
    const straw = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 10), std(0xffffff, 0.4, { map: stripes('#ffffff', '#ff3b5c') }), 0.08, 0.28, 0);
    straw.rotation.z = -0.28;
    g.add(straw);
    const slice = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.035, 28), std(0xffa630, 0.4), -0.27, 0.38, 0.03);
    slice.rotation.x = Math.PI / 2;
    g.add(slice);
    const pulp = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 28), std(0xffd27a, 0.5), -0.27, 0.38, 0.035);
    pulp.rotation.x = Math.PI / 2;
    g.add(pulp);
    return g;
  },
  icecream() {
    const g = new THREE.Group();
    const waffle = patternTexture(128, (ctx, n) => {
      ctx.fillStyle = '#d9a066';
      ctx.fillRect(0, 0, n, n);
      ctx.strokeStyle = '#a8703a';
      ctx.lineWidth = 5;
      for (let i = -n; i < n * 2; i += 26) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + n, n); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i, n); ctx.lineTo(i + n, 0); ctx.stroke();
      }
    });
    waffle.repeat.set(3, 2);
    const cone = mesh(new THREE.ConeGeometry(0.22, 0.62, 28), std(0xffffff, 0.7, { map: waffle }), 0, -0.2, 0);
    cone.rotation.x = Math.PI;
    g.add(cone);
    g.add(mesh(new THREE.SphereGeometry(0.23, 28, 20), physical(0xff8fb8), 0, 0.17, 0));
    g.add(mesh(new THREE.SphereGeometry(0.2, 28, 20), physical(0x9ee6c4), 0.02, 0.43, 0));
    g.add(mesh(new THREE.SphereGeometry(0.17, 28, 20), physical(0x6b3a1f), -0.01, 0.65, 0));
    g.add(mesh(new THREE.SphereGeometry(0.06, 16, 12), physical(0xd0021b, { clearcoat: 1 }), 0, 0.84, 0));
    const sprinkle = new THREE.CapsuleGeometry(0.01, 0.035, 2, 5);
    const cols = [0xffd23f, 0x3ec1d3, 0xffffff, 0x9b5de5];
    for (let i = 0; i < 18; i++) {
      const a = rand(0, Math.PI * 2), y = rand(0.3, 0.55);
      const sp = mesh(sprinkle, std(cols[i % 4], 0.4), Math.cos(a) * 0.19, y, Math.sin(a) * 0.19);
      sp.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
      g.add(sp);
    }
    return g;
  },
  chicken() {
    const g = new THREE.Group();
    const a = drumstick();
    a.position.set(-0.14, 0, 0);
    a.rotation.z = 0.45;
    const b = drumstick();
    b.position.set(0.14, 0.02, -0.05);
    b.rotation.z = -0.45;
    g.add(a, b);
    const leaf = std(0x3fae49, 0.5);
    g.add(mesh(new THREE.SphereGeometry(0.05, 10, 8), leaf, 0, 0.28, 0.2));
    g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 20), std(0xfff27a, 0.4), 0.25, -0.3, 0.2));
    return g;
  },
  coffee() {
    const g = new THREE.Group();
    const cup = physical(0xffffff, { roughness: 0.2 });
    g.add(mesh(new THREE.CylinderGeometry(0.27, 0.2, 0.45, 36), cup));
    const art = patternTexture(256, (ctx, n) => {
      ctx.fillStyle = '#6b3f1d';
      ctx.fillRect(0, 0, n, n);
      ctx.fillStyle = '#f3e1c7';
      ctx.beginPath();
      ctx.moveTo(128, 190);
      ctx.bezierCurveTo(40, 130, 60, 60, 128, 100);
      ctx.bezierCurveTo(196, 60, 216, 130, 128, 190);
      ctx.fill();
    });
    const top = mesh(new THREE.CircleGeometry(0.255, 36), std(0xffffff, 0.3, { map: art }), 0, 0.2, 0);
    top.rotation.x = -Math.PI / 2;
    g.add(top);
    const handle = mesh(new THREE.TorusGeometry(0.1, 0.03, 10, 20, Math.PI), cup, 0.25, 0.02, 0);
    handle.rotation.z = -Math.PI / 2;
    g.add(handle);
    g.add(mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.04, 36), cup, 0, -0.245, 0));
    addSteam(g, 0, 0.3, 0, 4);
    g.rotation.x = 0.25;
    return g;
  },
  pizza() {
    const g = new THREE.Group();
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.5);
    shape.lineTo(-0.4, 0.38);
    shape.quadraticCurveTo(0, 0.52, 0.4, 0.38);
    shape.closePath();
    const slice = mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 }), physical(0xffc93c, { roughness: 0.5, clearcoat: 0.3 }));
    g.add(slice);
    const crust = mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.42, 0.38, 0.03), new THREE.Vector3(0, 0.54, 0.03), new THREE.Vector3(0.42, 0.38, 0.03)), 20, 0.065, 10), std(0xc9832f, 0.6));
    g.add(crust);
    const pep = std(0xc0392b, 0.45);
    for (const [x, y] of [[-0.12, 0.2], [0.14, 0.24], [0.02, -0.02], [-0.05, 0.36], [0.05, -0.22]]) {
      const p = mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.02, 20), pep, x, y, 0.085);
      p.rotation.x = Math.PI / 2;
      g.add(p);
    }
    const olive = std(0x2c2c2c, 0.4);
    for (const [x, y] of [[0.16, 0.05], [-0.18, 0.05]]) g.add(mesh(new THREE.TorusGeometry(0.025, 0.012, 8, 14), olive, x, y, 0.085));
    g.rotation.x = -0.2;
    return g;
  },
  chocolate() {
    const g = new THREE.Group();
    const choc = physical(0x4a2511, { roughness: 0.3 });
    g.add(mesh(new THREE.BoxGeometry(0.52, 0.82, 0.07), choc));
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 2; c++) g.add(mesh(new THREE.BoxGeometry(0.21, 0.17, 0.035), choc, -0.12 + c * 0.24, 0.3 - r * 0.2, 0.05));
    }
    g.add(mesh(new THREE.BoxGeometry(0.56, 0.36, 0.11), physical(0xc0392b, { roughness: 0.25, clearcoat: 0.8 }), 0, -0.26, 0));
    g.add(mesh(new THREE.BoxGeometry(0.565, 0.05, 0.115), std(0xe8b64c, 0.3, { metalness: 0.8 }), 0, -0.12, 0));
    g.rotation.z = 0.18;
    return g;
  },
  meals() {
    const g = new THREE.Group();
    const leafShape = new THREE.Shape();
    const lw = 0.68, lh = 0.42, lr = 0.2;
    leafShape.moveTo(-lw + lr, -lh);
    leafShape.lineTo(lw - lr, -lh);
    leafShape.quadraticCurveTo(lw, -lh, lw, -lh + lr);
    leafShape.lineTo(lw, lh - lr);
    leafShape.quadraticCurveTo(lw, lh, lw - lr, lh);
    leafShape.lineTo(-lw + lr, lh);
    leafShape.quadraticCurveTo(-lw, lh, -lw, lh - lr);
    leafShape.lineTo(-lw, -lh + lr);
    leafShape.quadraticCurveTo(-lw, -lh, -lw + lr, -lh);
    const leafGeo = new THREE.ShapeGeometry(leafShape, 8);
    leafGeo.rotateX(-Math.PI / 2);
    g.add(mesh(leafGeo, new THREE.MeshStandardMaterial({ color: 0x2e9e3e, roughness: 0.45, side: THREE.DoubleSide })));
    g.add(mesh(new THREE.BoxGeometry(1.3, 0.008, 0.025), std(0x9ad49a, 0.5), 0, 0.004, 0));
    const rice = mesh(new THREE.SphereGeometry(0.24, 28, 18), std(0xffffff, 0.8, { map: riceTexture('#f7f3ea', ['#ffffff', '#ece6d8']) }), 0.08, 0.04, 0.08);
    rice.scale.set(1, 0.5, 1);
    g.add(rice);
    const sambar = mesh(new THREE.SphereGeometry(0.13, 20, 12), std(0xc76a1c, 0.3, { emissive: 0x3a1500, emissiveIntensity: 0.3 }), 0.08, 0.14, 0.08);
    sambar.scale.set(1, 0.22, 1);
    g.add(sambar);
    const curries = [0x6abf3a, 0xf4a300, 0xb5361c, 0xfff3e0, 0x8e5a2b];
    curries.forEach((col, i) => {
      const d = mesh(new THREE.SphereGeometry(0.07, 16, 10), std(col, 0.5), -0.5 + i * 0.22, 0.03, -0.25);
      d.scale.set(1, 0.5, 1);
      g.add(d);
    });
    const appalam = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.012, 28), std(0xf3dc97, 0.6), -0.4, 0.05, 0.14);
    appalam.rotation.z = 0.15;
    g.add(appalam);
    g.add(mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.1, 20), steelMat(), 0.5, 0.05, 0.05));
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.01, 20), std(0xe9c98f, 0.4), 0.5, 0.098, 0.05));
    addSteam(g, 0.08, 0.16, 0.08, 4);
    g.rotation.x = 0.9;
    return g;
  },
  biryani() {
    const g = new THREE.Group();
    const profile = [[0.001, -0.35], [0.26, -0.35], [0.37, -0.22], [0.4, -0.02], [0.35, 0.14], [0.3, 0.2], [0.34, 0.24], [0.34, 0.27], [0.3, 0.27]]
      .map(([x, y]) => new THREE.Vector2(x, y));
    g.add(mesh(new THREE.LatheGeometry(profile, 40), std(0xb87333, 0.28, { metalness: 0.85, side: THREE.DoubleSide })));
    const mound = mesh(new THREE.SphereGeometry(0.31, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), std(0xffffff, 0.8, { map: riceTexture('#f1c27d', ['#fff4dc', '#ff9a1f', '#f7d9a0', '#ffffff']) }), 0, 0.22, 0);
    mound.scale.set(1, 0.55, 1);
    g.add(mound);
    const leg = drumstick();
    leg.scale.setScalar(0.42);
    leg.position.set(0.05, 0.36, 0.02);
    leg.rotation.set(0.3, 0, -1.1);
    g.add(leg);
    const mint = std(0x2f9e44, 0.5);
    for (const [x, z] of [[-0.12, 0.1], [-0.05, -0.12], [0.15, -0.06]]) {
      const m = mesh(new THREE.SphereGeometry(0.035, 10, 8), mint, x, 0.37, z);
      m.scale.set(1.4, 0.4, 0.8);
      g.add(m);
    }
    g.add(mesh(new THREE.SphereGeometry(0.06, 16, 12), std(0xffffff, 0.4), -0.16, 0.34, 0.12));
    g.add(mesh(new THREE.SphereGeometry(0.03, 12, 10), std(0xffc01e, 0.4), -0.16, 0.37, 0.15));
    addSteam(g, 0, 0.42, 0, 4);
    g.rotation.x = 0.35;
    return g;
  },
  dosa() {
    const g = new THREE.Group();
    const steel = steelMat();
    g.add(mesh(new THREE.CylinderGeometry(0.56, 0.52, 0.03, 48), steel));
    const rim = mesh(new THREE.TorusGeometry(0.56, 0.02, 8, 48), steel, 0, 0.015, 0);
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
    const roll = mesh(new THREE.CylinderGeometry(0.1, 0.13, 1.25, 28), physical(0xd9922e, { roughness: 0.55, clearcoat: 0.3, map: riceTexture('#d9922e', ['#b8691c', '#e8b04f', '#c97a22']) }), 0, 0.14, -0.08);
    roll.rotation.z = Math.PI / 2;
    roll.rotation.y = 0.15;
    g.add(roll);
    const fills = [0xf5f0e1, 0xc0392b, 0xc56a1a];
    fills.forEach((col, i) => {
      const x = -0.28 + i * 0.28;
      g.add(mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.08, 24), steel, x, 0.06, 0.27));
      g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 24), std(col, 0.5), x, 0.1, 0.27));
    });
    addSteam(g, 0, 0.26, -0.08, 3);
    g.rotation.x = 0.7;
    return g;
  },
};

// Builds the chosen treat, normalised to ~1 unit, centred on the origin.
function buildItem(key) {
  return normalized((TREATS[key] || TREATS.heart)(), 1.2);
}

// Wraps a model so its largest side is `size` and it is centred on the origin.
function normalized(model, target) {
  const puffs = [];
  model.traverse((o) => { if (o.isSprite) puffs.push(o); });
  puffs.forEach((o) => o.parent.remove(o));          // keep steam out of the size measurement
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const inner = new THREE.Group();
  inner.add(model);
  model.position.sub(center);
  inner.scale.setScalar(target / Math.max(size.x, size.y, size.z));
  puffs.forEach((o) => model.add(o));
  const outer = new THREE.Group();
  outer.add(inner);
  return outer;
}

// ── Funny award props + the trophy ──────────────────────────────
const PROPS = {
  beer() {
    const g = new THREE.Group();
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.3, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
    g.add(mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.5, 32, 1, true), glass));
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 32), glass, 0, -0.25, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.205, 0.19, 0.4, 32), std(0xf2a900, 0.2, { emissive: 0x5a3000, emissiveIntensity: 0.4 }), 0, -0.04, 0));
    const foam = std(0xfffaf0, 0.8);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      g.add(mesh(new THREE.SphereGeometry(rand(0.07, 0.1), 14, 10), foam, Math.cos(a) * 0.14, 0.22 + rand(0, 0.05), Math.sin(a) * 0.14));
    }
    g.add(mesh(new THREE.SphereGeometry(0.12, 14, 10), foam, 0, 0.26, 0));
    const handle = mesh(new THREE.TorusGeometry(0.11, 0.035, 10, 20, Math.PI), glass, 0.22, 0, 0);
    handle.rotation.z = -Math.PI / 2;
    g.add(handle);
    return g;
  },
  teddy() {
    const g = new THREE.Group();
    const fur = physical(0x9c6b3c, { roughness: 0.8, clearcoat: 0 });
    const light = std(0xe6c49a, 0.8);
    const dark = std(0x2b1a10, 0.4);
    const body = mesh(new THREE.SphereGeometry(0.26, 24, 18), fur, 0, -0.12, 0);
    body.scale.set(1, 1.1, 0.9);
    g.add(body);
    g.add(mesh(new THREE.SphereGeometry(0.2, 24, 18), fur, 0, 0.26, 0));
    for (const sx of [-1, 1]) {
      g.add(mesh(new THREE.SphereGeometry(0.08, 14, 10), fur, sx * 0.15, 0.42, 0));
      g.add(mesh(new THREE.SphereGeometry(0.045, 12, 8), light, sx * 0.15, 0.42, 0.04));
      g.add(mesh(new THREE.SphereGeometry(0.03, 10, 8), dark, sx * 0.075, 0.3, 0.17));
      const arm = mesh(new THREE.SphereGeometry(0.09, 14, 10), fur, sx * 0.25, -0.05, 0.05);
      arm.scale.set(1, 1.4, 1);
      g.add(arm);
      g.add(mesh(new THREE.SphereGeometry(0.1, 14, 10), fur, sx * 0.14, -0.36, 0.08));
    }
    g.add(mesh(new THREE.SphereGeometry(0.08, 14, 10), light, 0, 0.22, 0.15));
    g.add(mesh(new THREE.SphereGeometry(0.03, 10, 8), dark, 0, 0.25, 0.22));
    g.add(mesh(new THREE.SphereGeometry(0.12, 14, 10), light, 0, -0.1, 0.2));
    const bow = std(0xff5c9d, 0.4);
    g.add(mesh(new THREE.SphereGeometry(0.05, 10, 8), bow, 0, 0.08, 0.17));
    for (const sx of [-1, 1]) {
      const w = mesh(new THREE.ConeGeometry(0.05, 0.1, 10), bow, sx * 0.07, 0.08, 0.16);
      w.rotation.z = sx * Math.PI / 2;
      g.add(w);
    }
    return g;
  },
  heels() {
    const g = new THREE.Group();
    const s = new THREE.Shape();
    s.moveTo(-0.4, 0);
    s.quadraticCurveTo(-0.44, 0.09, -0.32, 0.11);
    s.quadraticCurveTo(-0.12, 0.13, 0.0, 0.15);
    s.quadraticCurveTo(0.16, 0.3, 0.28, 0.44);
    s.lineTo(0.36, 0.44);
    s.lineTo(0.34, 0.32);
    s.quadraticCurveTo(0.2, 0.2, 0.04, 0.03);
    s.lineTo(-0.4, 0);
    const shoe = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 }), physical(0xd0021b, { clearcoat: 1, roughness: 0.2 }));
    shoe.position.z = -0.08;
    g.add(shoe);
    g.add(mesh(new THREE.CylinderGeometry(0.018, 0.03, 0.36, 12), std(0x1a1a1a, 0.3), 0.32, 0.17, 0));
    g.add(mesh(new THREE.BoxGeometry(0.34, 0.012, 0.14), std(0xf5d0d8, 0.6), -0.1, 0.13, 0));
    g.rotation.y = -0.5;
    return g;
  },
  brain() {
    const geo = new THREE.SphereGeometry(0.3, 64, 48);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = 1 + 0.07 * Math.sin(v.x * 34) * Math.sin(v.y * 30) * Math.sin(v.z * 26) + 0.04 * Math.sin(v.y * 60 + v.x * 20);
      const groove = Math.abs(v.x) < 0.02 ? 0.9 : 1;
      v.multiplyScalar(n * groove);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const g = new THREE.Group();
    const b = mesh(geo, physical(0xf7a1b5, { roughness: 0.35, clearcoat: 0.8 }));
    b.scale.set(1.15, 0.85, 1);
    g.add(b);
    return g;
  },
  liar() {
    const f = emojiFace('liar');
    f.rotation.y = 0.85;                 // turn so the long nose shows in profile
    return f;
  },
  sleep() { return emojiFace('sleep'); },
  clock() {
    const g = new THREE.Group();
    const red = physical(0xe53935, { clearcoat: 0.8, roughness: 0.25 });
    const body = mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.14, 40), red);
    body.rotation.x = Math.PI / 2;
    g.add(body);
    g.add(mesh(new THREE.CircleGeometry(0.23, 40), std(0xffffff, 0.5), 0, 0, 0.072));
    const ink = std(0x222222, 0.4);
    const hh = mesh(new THREE.BoxGeometry(0.025, 0.12, 0.01), ink, 0.03, 0.05, 0.08);
    hh.rotation.z = -0.6;
    g.add(hh);
    const mh = mesh(new THREE.BoxGeometry(0.018, 0.18, 0.01), ink, -0.03, 0.08, 0.082);
    mh.rotation.z = 0.35;
    g.add(mh);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.add(mesh(new THREE.BoxGeometry(0.012, 0.03, 0.005), ink, Math.sin(a) * 0.19, Math.cos(a) * 0.19, 0.075));
    }
    const gold = std(0xffc94a, 0.25, { metalness: 0.9 });
    for (const sx of [-1, 1]) {
      g.add(mesh(new THREE.SphereGeometry(0.1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), gold, sx * 0.17, 0.26, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8), ink, sx * 0.17, -0.3, 0));
    }
    return g;
  },
  chicken() { return TREATS.chicken(); },
  phone() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(0.32, 0.62, 0.04), physical(0x111111, { roughness: 0.2, clearcoat: 1 })));
    const [c, ctx] = canvas(256, 512);
    const gr = ctx.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, '#6a11cb');
    gr.addColorStop(1, '#ff5c9d');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, 256, 512);
    const icons = ['#25d366', '#e1306c', '#ff0000', '#1da1f2', '#ffcc00', '#00c49a', '#4d96ff', '#ff8a00'];
    icons.forEach((col, i) => {
      const x = 40 + (i % 3) * 80, y = 90 + Math.floor(i / 3) * 95;
      ctx.fillStyle = col;
      roundRectPath(ctx, x - 26, y - 26, 52, 52, 14);
      ctx.fill();
      ctx.fillStyle = '#ff2d55';
      ctx.beginPath(); ctx.arc(x + 22, y - 22, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('99+', x + 22, y - 17);
    });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.29, 0.58), new THREE.MeshBasicMaterial({ map: toTexture(c) }));
    screen.position.z = 0.021;
    g.add(screen);
    g.rotation.z = 0.2;
    return g;
  },
  crown() {
    const g = new THREE.Group();
    const gold = std(0xffc94a, 0.2, { metalness: 1, side: THREE.DoubleSide });
    g.add(mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.16, 40, 1, true), gold));
    const gems = [0xe53935, 0x1e88e5, 0x43a047, 0xe53935, 0x8e24aa];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      g.add(mesh(new THREE.ConeGeometry(0.06, 0.2, 12), gold, Math.sin(a) * 0.27, 0.17, Math.cos(a) * 0.27));
      g.add(mesh(new THREE.SphereGeometry(0.035, 12, 10), std(0xfff3c4, 0.2, { metalness: 0.6 }), Math.sin(a) * 0.27, 0.28, Math.cos(a) * 0.27));
      g.add(mesh(new THREE.SphereGeometry(0.035, 12, 10), physical(gems[i], { clearcoat: 1, roughness: 0.1 }), Math.sin(a + 0.63) * 0.275, 0, Math.cos(a + 0.63) * 0.275));
    }
    g.rotation.x = 0.25;
    return g;
  },
  hearts2() {
    const g = new THREE.Group();
    const a = mesh(heartGeometry(0.5, 0.18), physical(0xff2d6f, { clearcoat: 1, roughness: 0.2 }), -0.14, 0.02, 0);
    a.rotation.z = 0.25;
    const b = mesh(heartGeometry(0.44, 0.16), physical(0xff8fc0, { clearcoat: 1, roughness: 0.2 }), 0.16, -0.04, 0.06);
    b.rotation.z = -0.25;
    g.add(a, b);
    return g;
  },
  star() {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const r = i % 2 ? 0.14 : 0.32;
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const g = new THREE.Group();
    const m = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 }), std(0xffd23f, 0.2, { metalness: 0.8 }));
    m.position.z = -0.04;
    g.add(m);
    return g;
  },
};

function plateTexture(name) {
  const [c, ctx] = canvas(512, 160);
  roundRectPath(ctx, 6, 6, 500, 148, 22);
  ctx.fillStyle = '#ffd36b';
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#a8741a';
  ctx.stroke();
  ctx.fillStyle = '#3b2314';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  fitFont(ctx, name, 800, 96, 460);
  ctx.fillText(name, 256, 86);
  return toTexture(c);
}

// Golden trophy with the funny prop sitting in the cup and the winner's name on the base.
function buildTrophy(propKey) {
  const g = new THREE.Group();
  const gold = std(0xffc94a, 0.22, { metalness: 1, side: THREE.DoubleSide });
  g.add(mesh(new THREE.BoxGeometry(0.66, 0.18, 0.66), std(0x3b2314, 0.45), 0, 0.09, 0));
  g.add(mesh(new THREE.BoxGeometry(0.52, 0.12, 0.52), std(0x2a180d, 0.45), 0, 0.24, 0));
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.16), new THREE.MeshStandardMaterial({ map: plateTexture(W.to), roughness: 0.4, metalness: 0.3 }));
  plate.position.set(0, 0.09, 0.332);
  g.add(plate);
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.1, 0.26, 20), gold, 0, 0.43, 0));
  g.add(mesh(new THREE.SphereGeometry(0.075, 20, 14), gold, 0, 0.56, 0));
  const cup = [[0.04, 0], [0.12, 0.03], [0.24, 0.12], [0.31, 0.28], [0.33, 0.44], [0.3, 0.45]].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(mesh(new THREE.LatheGeometry(cup, 40), gold, 0, 0.58, 0));
  for (const sx of [-1, 1]) {
    const h = mesh(new THREE.TorusGeometry(0.1, 0.025, 10, 20, Math.PI), gold, sx * 0.34, 0.86, 0);
    h.rotation.z = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
    g.add(h);
  }
  const prop = normalized((PROPS[propKey] || PROPS.star)(), 0.62);
  prop.position.y = 1.3;
  g.add(prop);
  return normalized(g, 1.25);
}

const ty = { lid: null, heart: null, heartGlow: null, text: null, opened: false, textY: 2.65 };

function tagTexture() {
  const [c, ctx] = canvas(1024, 512);
  roundRectPath(ctx, 40, 60, 944, 392, 60);
  ctx.fillStyle = '#fffaf5';
  ctx.fill();
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#e8b64c';
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e64a8b';
  const line1 = IS_AW ? 'Award for' : W.rel ? `For ${RELS[W.rel]}` : 'For';
  fitFont(ctx, line1, 700, 92, 860);
  ctx.fillText(line1, 512, 170);
  fitFont(ctx, W.to, 800, 170, 860);
  ctx.fillStyle = '#5b1a8a';
  ctx.fillText(W.to, 512, 330);
  return toTexture(c);
}

// Gold 3D title: a word (THANK YOU / LOVE YOU / …) with the receiver's name under it.
function buildTitle(word, y, sub = '') {
  const textGroup = new THREE.Group();
  textGroup.position.set(0, y, 0);
  textGroup.scale.setScalar(0.0001);
  hero.add(textGroup);
  const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xffd36b, metalness: 0.85, roughness: 0.22, clearcoat: 0.6, emissive: 0x4a2a00, emissiveIntensity: 0.4 });
  const text3d = (font, str, size, ty_, maxW) => {
    const g = new TextGeometry(str, { font, size, depth: size * 0.32, curveSegments: 6, bevelEnabled: true, bevelThickness: size * 0.07, bevelSize: size * 0.05, bevelSegments: 3 });
    g.center();
    g.computeBoundingBox();
    const m = shadowed(new THREE.Mesh(g, goldMat));
    const w = g.boundingBox.max.x - g.boundingBox.min.x;
    if (w > maxW) m.scale.setScalar(maxW / w);
    m.position.y = ty_;
    textGroup.add(m);
  };
  // The 3D font only has Latin letters — other scripts (e.g. Tamil) get a glowing name sign.
  const latinName = /^[A-Za-z0-9 .,'&!-]+$/.test(W.to);
  const nameSign = () => {
    const [c, ctx] = canvas(1024, 256);
    fitFont(ctx, W.to, 800, 190, 980);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 16;
    ctx.strokeStyle = '#6b1d3f';
    ctx.strokeText(W.to, 512, 140);
    const gr = ctx.createLinearGradient(0, 40, 0, 230);
    gr.addColorStop(0, '#fff3c4');
    gr.addColorStop(1, '#ffb83b');
    ctx.fillStyle = gr;
    ctx.fillText(W.to, 512, 140);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), new THREE.MeshBasicMaterial({ map: toTexture(c), transparent: true, depthWrite: false }));
    m.position.y = -0.2;
    textGroup.add(m);
  };
  new FontLoader().loadAsync(TEXT_FONT_URL).then((font) => {
    text3d(font, word, 0.25, sub ? 0.44 : 0.2, 2.0);
    if (sub) text3d(font, sub, 0.15, 0.17, 1.2);
    if (latinName) text3d(font, W.to, 0.22, -0.18, 1.9);
    else nameSign();
  }).catch(() => {
    const tex = plaqueTexture(sub ? `${word} ${sub}` : word, W.to, { bg2: '#ffe1ee', line1: '#e64a8b', line2: '#c2185b' });
    textGroup.add(new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), new THREE.MeshStandardMaterial({ map: tex })));
  });
  return textGroup;
}

function buildGift() {
  const boxMat = new THREE.MeshPhysicalMaterial({ color: IS_AW ? 0xe53935 : 0x8a5cff, roughness: 0.35, clearcoat: 0.6 });
  const ribbonMat = std(0xffc94a, 0.3, { metalness: 0.6 });

  const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), boxMat);
  box.position.y = 0.45;
  hero.add(shadowed(box));
  for (const rot of [0, Math.PI / 2]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.905, 1.21), ribbonMat);
    r.position.y = 0.45;
    r.rotation.y = rot;
    hero.add(r);
  }
  // Name tag on the front
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshStandardMaterial({ map: tagTexture(), transparent: true, roughness: 0.6 }));
  tag.position.set(0, 0.42, 0.608);
  hero.add(tag);

  // Lid with bow
  const lid = new THREE.Group();
  lid.position.y = 0.99;
  lid.add(shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 1.3), boxMat)));
  for (const rot of [0, Math.PI / 2]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.205, 1.31), ribbonMat);
    r.rotation.y = rot;
    lid.add(r);
  }
  for (const side of [-1, 1]) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 10, 24), ribbonMat);
    loop.position.set(side * 0.17, 0.2, 0);
    loop.rotation.set(0, 0, side * 0.5);
    loop.scale.set(1, 0.75, 1);
    lid.add(shadowed(loop));
  }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 10), ribbonMat);
  knot.position.y = 0.14;
  lid.add(knot);
  hero.add(lid);
  ty.lid = lid;

  // The heart (or chosen treat) that rises out of the box
  const heart = IS_AW ? buildTrophy(AWARD.prop) : buildItem(W.item);
  heart.position.y = 0.5;
  heart.scale.setScalar(0.0001);
  hero.add(heart);
  ty.heart = heart;
  const hg = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: IS_AW ? 0xffd36b : 0xff5c9d, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  hg.scale.setScalar(2.4);
  hero.add(hg);
  ty.heartGlow = hg;

  ty.textY = IS_AW ? 2.75 : 2.65;
  ty.text = IS_AW ? buildTitle(AW_TITLE, ty.textY, 'AWARD') : buildTitle('THANK YOU', ty.textY);
}

// Floating hearts rising gently around the gift (thank-you ambience)
const FLOAT_N = 28;
let floaters = null;
const floatData = [];
function buildFloaters() {
  floaters = new THREE.InstancedMesh(heartGeometry(0.14, 0.04), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }), FLOAT_N);
  const cols = [0xff2d6f, 0xff8fc0, 0xffb3d1, 0xc13cff];
  for (let i = 0; i < FLOAT_N; i++) {
    floaters.setColorAt(i, new THREE.Color(cols[i % cols.length]));
    floatData.push({ a: rand(0, Math.PI * 2), r: rand(0.9, 2.2), y: rand(-1, 3.5), v: rand(0.12, 0.3), s: rand(0.6, 1.3), seed: rand(0, 10) });
  }
  floaters.visible = false;
  world.add(floaters);
}

async function openGift() {
  if (phase !== 'open' || ty.opened) return;
  ty.opened = true;
  phase = 'hearts';
  $('hint').hidden = true;
  track('gift_open');
  if (IS_AW) {                                   // 🥁 "And the award goes to…"
    showLyric('🥁 And the award goes to…');
    sfx.drumroll(1.6);
    tween(1.6, (k) => { hero.position.x = Math.sin(k * 60) * 0.03 * k; }).then(() => { hero.position.x = 0; });
    await wait(1700);
  }
  sfx.pop();
  sfx.sparkle();
  const lid = ty.lid;
  const from = lid.position.clone();
  tween(1.0, (k) => {
    const e = easeOutCubic(k);
    lid.position.set(from.x + e * 1.3, from.y + Math.sin(k * Math.PI) * 1.1 - k * 0.87, from.z - e * 0.2);
    lid.rotation.set(e * 0.4, e * 1.2, -e * 0.9);
  });
  burstConfetti(140, new THREE.Vector3(0, 1.0, 0), 1.05);
  await wait(250);
  sfx.tada();
  tween(1.4, (k) => {
    ty.heart.scale.setScalar(Math.max(0.0001, easeOutBack(k)));
    ty.heart.position.y = 0.5 + easeOutCubic(k) * 1.1;
    ty.heartGlow.material.opacity = 0.55 * k;
    ty.heartGlow.position.copy(ty.heart.position);
    warmLight.intensity = 4 * k;
  });
  await wait(700);
  tween(1.1, (k) => ty.text.scale.setScalar(Math.max(0.0001, easeOutBack(k))));
  if (floaters) floaters.visible = true;
  showBalloons();
  playSong(TY_SONG, IS_AW ? AW_LYRICS : TY_LYRICS, 0.32);
  if (IS_AW) { sfx.applause(); showLyric(`🏆 ${AW_TITLE} AWARD`); }
  await wait(2200);
  setHint({ text: IS_AW ? 'Tap the balloons to pop them 🎈😂' : 'Tap the heart balloons to pop them 💕' });
  await wait(4500);
  $('hint').hidden = true;
  showCard();
}

// ═══════════════════════════════════════════════════════════════
//  REACTIONS — 3D emoji faces (❤️ uses the big heart)
// ═══════════════════════════════════════════════════════════════
const FACE_R = 0.6;
// Places a flat feature on the face sphere, facing outward.
function onFace(obj, x, y, lift = 0.004) {
  const z = Math.sqrt(Math.max(0, FACE_R * FACE_R - x * x - y * y)) + lift;
  obj.position.set(x, y, z);
  obj.lookAt(x * 3, y * 3, z * 3);
  return obj;
}

function emojiFace(type) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.SphereGeometry(FACE_R, 48, 32), physical(0xffae00, { roughness: 0.5, clearcoat: 0.25, emissive: 0x6b3a00, emissiveIntensity: 0.25 })));
  const dark = std(0x3b2314, 0.4);
  const eye = (x, y) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), dark);
    e.scale.set(0.065, 0.1, 0.035);
    g.add(onFace(e, x, y));
  };
  // Half-ring: up = "∩" (happy closed eye), down = "∪" (smile)
  const arc = (x, y, r, tube, up) => {
    const wrap = new THREE.Group();
    const a = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 28, Math.PI), dark);
    if (!up) a.rotation.z = Math.PI;
    wrap.add(a);
    g.add(onFace(wrap, x, y));
  };
  const blush = (x, y, r = 0.085) => {
    const b = new THREE.Mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshBasicMaterial({ color: 0xff7aa8, transparent: true, opacity: 0.6 }));
    g.add(onFace(b, x, y, 0.008));
  };
  const openMouth = (y, w) => {
    const wrap = new THREE.Group();
    wrap.add(new THREE.Mesh(new THREE.CircleGeometry(w, 32, Math.PI, Math.PI), std(0x5a1a1a, 0.5, { side: THREE.DoubleSide })));
    const tongue = new THREE.Mesh(new THREE.CircleGeometry(w * 0.55, 24, Math.PI, Math.PI), std(0xff6f8a, 0.5, { side: THREE.DoubleSide }));
    tongue.position.set(0, -w * 0.38, 0.003);
    tongue.scale.y = 0.6;
    wrap.add(tongue);
    g.add(onFace(wrap, 0, y, 0.012));
  };
  const onSurface = (m, x, y, out) => {
    const z = Math.sqrt(Math.max(0, FACE_R * FACE_R - x * x - y * y));
    m.position.set(x, y, z + out);
    g.add(m);
    return m;
  };
  const redHeart = (size) => mesh(heartGeometry(size, size * 0.35), physical(0xff2d55, { clearcoat: 1, roughness: 0.2, emissive: 0x5a0015, emissiveIntensity: 0.5 }));

  if (type === 'liar') {
    const lookEye = (x) => {
      const w = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), std(0xffffff, 0.3));
      w.scale.set(0.09, 0.11, 0.04);
      g.add(onFace(w, x, 0.14));
      const p = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), dark);
      p.scale.set(0.045, 0.055, 0.03);
      g.add(onFace(p, x + 0.045, 0.13, 0.02));
    };
    lookEye(-0.2); lookEye(0.2);
    const flat = mesh(new THREE.BoxGeometry(0.22, 0.03, 0.02), dark);
    g.add(onFace(flat, 0.03, -0.24));
    const nose = mesh(new THREE.ConeGeometry(0.06, 0.62, 20), physical(0xffae00, { roughness: 0.5, clearcoat: 0.25 }));
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, -0.02, FACE_R + 0.27);
    g.add(nose);
  } else if (type === 'sleep') {
    arc(-0.2, 0.08, 0.075, 0.02, false);
    arc(0.2, 0.08, 0.075, 0.02, false);
    const o = mesh(new THREE.TorusGeometry(0.045, 0.02, 10, 20), dark);
    g.add(onFace(o, 0, -0.2, 0.01));
    const [c, ctx] = canvas(256, 256);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#4d96ff';
    ctx.lineWidth = 10;
    [['Z', 60, 200, 110], ['z', 140, 120, 80], ['z', 200, 60, 56]].forEach(([ch, x, y, sz]) => {
      ctx.font = `900 ${sz}px sans-serif`;
      ctx.strokeText(ch, x, y);
      ctx.fillText(ch, x, y);
    });
    const zz = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: toTexture(c), transparent: true, depthWrite: false }));
    zz.position.set(0.5, 0.5, 0.2);
    g.add(zz);
  } else if (type === 'party') {
    arc(-0.2, 0.13, 0.075, 0.02, true);
    arc(0.2, 0.13, 0.075, 0.02, true);
    openMouth(-0.12, 0.2);
    blush(-0.33, -0.03); blush(0.33, -0.03);
    const hat = mesh(new THREE.ConeGeometry(0.2, 0.42, 28), std(0xffffff, 0.5, { map: stripes('#9b5de5', '#ffd23f') }), 0.12, 0.68, 0);
    hat.rotation.z = -0.3;
    g.add(hat);
    g.add(mesh(new THREE.SphereGeometry(0.06, 12, 10), std(0xff5c9d, 0.4), 0.24, 0.87, 0));
  } else if (type === 'plead') {
    for (const sx of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), std(0xffffff, 0.2));
      w.scale.set(0.12, 0.14, 0.05);
      g.add(onFace(w, sx * 0.2, 0.1));
      const p = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), dark);
      p.scale.set(0.085, 0.1, 0.04);
      g.add(onFace(p, sx * 0.2, 0.08, 0.025));
      const hl = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), std(0xffffff, 0.1));
      hl.scale.set(0.03, 0.035, 0.02);
      g.add(onFace(hl, sx * 0.2 + 0.03, 0.12, 0.05));
    }
    arc(0, -0.25, 0.09, 0.022, true);
    const tear = mesh(new THREE.SphereGeometry(1, 14, 10), physical(0x5ec8ff, { clearcoat: 1, roughness: 0.1 }));
    tear.scale.set(0.05, 0.075, 0.04);
    g.add(onFace(tear, 0.32, -0.02, 0.03));
  } else if (type === 'hug') {
    arc(-0.2, 0.13, 0.075, 0.02, true);
    arc(0.2, 0.13, 0.075, 0.02, true);
    arc(0, -0.1, 0.22, 0.028, false);
    blush(-0.32, -0.02); blush(0.32, -0.02);
    for (const sx of [-1, 1]) {
      const hand = mesh(new THREE.SphereGeometry(1, 20, 14), physical(0xffb627, { roughness: 0.4 }));
      hand.scale.set(0.2, 0.13, 0.12);
      hand.rotation.z = sx * 0.5;
      onSurface(hand, sx * 0.3, -0.36, 0.08);
    }
  } else if (type === 'kiss') {
    arc(-0.2, 0.12, 0.075, 0.02, true);             // wink
    eye(0.2, 0.13);
    const lips = mesh(new THREE.TorusGeometry(0.05, 0.028, 10, 20), physical(0xe0335f, { roughness: 0.3 }));
    g.add(onFace(lips, 0.05, -0.18, 0.02));
    blush(-0.33, -0.04); blush(0.33, -0.04);
    const h = redHeart(0.2);
    h.rotation.z = 0.35;
    onSurface(h, 0.42, -0.1, 0.12);
  } else if (type === 'haha') {
    arc(-0.2, 0.14, 0.08, 0.022, true);
    arc(0.2, 0.14, 0.08, 0.022, true);
    openMouth(-0.1, 0.27);
    const tearMat = physical(0x5ec8ff, { clearcoat: 1, roughness: 0.1 });
    for (const sx of [-1, 1]) {
      const tear = mesh(new THREE.SphereGeometry(1, 16, 12), tearMat);
      tear.scale.set(0.07, 0.11, 0.05);
      onSurface(tear, sx * 0.43, 0.08, 0.03);
    }
    g.rotation.z = 0.22;
  } else if (type === 'wow') {
    for (const sx of [-1, 1]) {
      const h = redHeart(0.24);
      onSurface(h, sx * 0.21, 0.12, 0.05);
    }
    openMouth(-0.14, 0.2);
  } else {                                           // aww ☺️
    arc(-0.2, 0.1, 0.075, 0.02, true);
    arc(0.2, 0.1, 0.075, 0.02, true);
    arc(0, -0.15, 0.14, 0.024, false);
    blush(-0.3, -0.06, 0.11); blush(0.3, -0.06, 0.11);
  }
  return g;
}

const rx = { obj: null, glow: null, text: null };
function buildReaction() {
  const FACE = { gang: 'party', missyou: 'plead' };
  const obj = W.react === 'love' ? buildItem('heart')
    : W.react === 'bff' ? normalized(PROPS.hearts2(), 1.3)
      : (() => {
        const o = new THREE.Group();
        o.add(emojiFace(FACE[W.react] || W.react));
        return o;
      })();
  obj.position.y = 1.35;
  obj.scale.setScalar(0.0001);
  hero.add(obj);
  rx.obj = obj;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: REACT.glow, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.setScalar(2.6);
  glow.position.y = 1.35;
  hero.add(glow);
  rx.glow = glow;
  rx.text = buildTitle(REACT.word, 2.6);
}

const RX_LYRICS = ['', '', W.reply ? `${W.from || 'Someone'} ${REACT.verb} ${REACT.emoji}` : `From ${W.from || 'someone special'} ${REACT.emoji}`, '', '', ''];

async function playReaction() {
  phase = 'react';
  track('gift_open');
  sfx.pop();
  sfx.tada();
  tween(0.9, (k) => {
    rx.obj.scale.setScalar(Math.max(0.0001, easeOutBack(k)));
    rx.glow.material.opacity = 0.5 * k;
    warmLight.intensity = (W.react === 'love' ? 4 : 1.2) * k;
  });
  burstConfetti(150, new THREE.Vector3(0, 1.3, 0), 1.0);
  await wait(500);
  tween(1.1, (k) => rx.text.scale.setScalar(Math.max(0.0001, easeOutBack(k))));
  floaters.visible = true;
  showBalloons();
  playSong(TY_SONG, RX_LYRICS, 0.3);
  await wait(1500);
  setHint({ text: `Tap the ${REACT.emoji} to make it bounce!` });
  await wait(5000);
  $('hint').hidden = true;
  if (phase === 'react') showCard();
}

let bouncing = false;
function bounceReaction() {
  if (bouncing) return;
  bouncing = true;
  sfx.pop();
  const p = new THREE.Vector3(0, 1.35, 0);
  burstConfetti(45, p, 0.6);
  tween(0.5, (k) => {
    const sq = Math.sin(k * Math.PI);
    rx.obj.scale.set(1 + sq * 0.18, 1 - sq * 0.14 + Math.sin(k * Math.PI * 2) * 0.05, 1 + sq * 0.18);
  }).then(() => { rx.obj.scale.setScalar(1); bouncing = false; });
}

// ═══════════════════════════════════════════════════════════════
//  Camera modes: 3D · Room (back camera + gyro) · Selfie (front camera)
// ═══════════════════════════════════════════════════════════════
const AR_SCALE = 0.38;
const video = $('cam');
let mode = '3d';
let camStream = null;
let videoTex = null;
const arTarget = new THREE.Vector3();
const devQ = new THREE.Quaternion(), startQ = new THREE.Quaternion(), baseQ = new THREE.Quaternion();
let orientReady = false, orientStarted = false;

const _e = new THREE.Euler(), _q0 = new THREE.Quaternion();
const _q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const _z = new THREE.Vector3(0, 0, 1);
function onOrient(ev) {
  if (mode !== 'room' || ev.alpha == null || ev.beta == null) return;
  const d = THREE.MathUtils.degToRad;
  const orient = d((screen.orientation && screen.orientation.angle) || window.orientation || 0);
  _e.set(d(ev.beta), d(ev.alpha), -d(ev.gamma), 'YXZ');
  devQ.setFromEuler(_e).multiply(_q1).multiply(_q0.setFromAxisAngle(_z, -orient));
  if (!orientStarted) { startQ.copy(devQ); orientStarted = true; }
  if (!orientReady) {
    orientReady = true;
    controls.enabled = false;        // gyro takes over from finger-drag
    arTip('Move your phone slowly to look around 📱');
  }
}
window.addEventListener('deviceorientation', onOrient);

// iOS asks for motion permission; must be called synchronously inside a tap.
function askGyro() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    return DeviceOrientationEvent.requestPermission().catch(() => 'denied');
  }
  return Promise.resolve('granted');
}

let tipTimer = 0;
function arTip(text, ms = 3500) {
  const el = $('arTip');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(tipTimer);
  tipTimer = setTimeout(() => { el.hidden = true; }, ms);
}

function fitVideoBackground() {
  if (!videoTex || !video.videoWidth) return;
  const va = video.videoWidth / video.videoHeight;
  const sa = innerWidth / innerHeight;
  let rx = 1, ry = 1;
  if (sa < va) rx = sa / va; else ry = va / sa;
  const mirror = mode === 'selfie';
  videoTex.repeat.set(mirror ? -rx : rx, ry);
  videoTex.offset.set(mirror ? (1 + rx) / 2 : (1 - rx) / 2, (1 - ry) / 2);
}

function place3D() {
  camera.fov = VIEW_FOV;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  world.scale.setScalar(1);
  const d = framingDistance();
  camera.position.set(0, TARGET.y + Math.sin(ELEV) * d, Math.cos(ELEV) * d);
  controls.target.copy(TARGET);
  controls.minDistance = 3;
  controls.maxDistance = 14;
  camera.lookAt(TARGET);
  controls.enabled = true;
  controls.update();
}

function placeAR() {
  camera.fov = AR_FOV;
  camera.clearViewOffset();
  world.scale.setScalar(AR_SCALE);
  const fovRatio = Math.tan(THREE.MathUtils.degToRad(VIEW_FOV / 2)) / Math.tan(THREE.MathUtils.degToRad(AR_FOV / 2));
  const d = framingDistance() * AR_SCALE * fovRatio * 1.15;
  const elev = THREE.MathUtils.degToRad(mode === 'selfie' ? 12 : 24);
  arTarget.set(0, 1.0 * AR_SCALE, 0);
  camera.position.set(0, arTarget.y + Math.sin(elev) * d, Math.cos(elev) * d);
  camera.lookAt(arTarget);
  baseQ.copy(camera.quaternion);
  controls.target.copy(arTarget);
  controls.minDistance = d * 0.5;
  controls.maxDistance = d * 2.2;
  controls.enabled = true;
  controls.update();
  // Selfie: push the gift into the lower part of the frame so your face stays visible.
  if (mode === 'selfie') camera.setViewOffset(innerWidth, innerHeight, 0, -innerHeight * 0.24, innerWidth, innerHeight);
  camera.updateProjectionMatrix();
}

function stopCamera() {
  if (camStream) camStream.getTracks().forEach((t) => t.stop());
  camStream = null;
  video.srcObject = null;
}

function updateTools() {
  document.querySelectorAll('.tool[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  $('recenter').hidden = mode !== 'room';
  $('selfieBtn').textContent = mode === 'selfie' ? '📷 Back to room' : '🤳 Selfie with it';
}

let switching = false;
async function setMode(m, gyroAsk) {
  minimizeCard();
  if (switching || m === mode) return m === mode;
  switching = true;
  try {
    if (m === '3d') {
      stopCamera();
      scene.background = null;
      document.body.classList.remove('ar');
      mode = '3d';
      place3D();
      updateTools();
      return true;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: m === 'room' ? 'environment' : 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch {
      toast('Camera not allowed — showing 3D view');
      return false;
    }
    if (gyroAsk) await gyroAsk;
    stopCamera();
    camStream = stream;
    video.srcObject = stream;
    try { await video.play(); } catch { /* muted inline video should play */ }
    if (!videoTex) {
      videoTex = new THREE.VideoTexture(video);
      videoTex.colorSpace = THREE.SRGBColorSpace;
      video.addEventListener('loadedmetadata', fitVideoBackground);
    }
    scene.background = videoTex;
    document.body.classList.add('ar');
    mode = m;
    orientReady = false;
    orientStarted = false;
    fitVideoBackground();
    placeAR();
    updateTools();
    track(m);
    arTip(m === 'room' ? 'Drag to look around 👆' : 'Smile! Tap 📸 to take a photo 😄');
    return true;
  } finally {
    switching = false;
  }
}

function recenter() {
  orientStarted = false;             // next gyro reading becomes "straight ahead"
  placeAR();
}

// ── Photo & video capture ───────────────────────────────────────
// Composites the 3D canvas (which already contains the camera feed) + watermark.
function paintFrame(ctx, w, h) {
  if (mode === '3d') {
    const g = ctx.createRadialGradient(w / 2, h * 0.2, 0, w / 2, h * 0.2, h);
    g.addColorStop(0, '#7a1f5c');
    g.addColorStop(0.45, '#3b1257');
    g.addColorStop(1, '#1a0b2e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(renderer.domElement, 0, 0, w, h);
  // Watermark pill — every shared photo/video points back to the creator.
  const s = w / 420;
  const label = `${IS_AW ? '🏆' : IS_RX ? REACT.emoji : IS_TY ? '💖' : '🎂'} Make yours free · wish.inixr.com`;
  ctx.font = `800 ${Math.round(15 * s)}px ${FONT}`;
  const tw = ctx.measureText(label).width;
  const ph = 34 * s, pw = tw + 30 * s, px = (w - pw) / 2, py = h - ph - 22 * s;
  roundRectPath(ctx, px, py, pw, ph, ph / 2);
  ctx.fillStyle = 'rgba(20,8,32,0.62)';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, w / 2, py + ph / 2 + 1 * s);
}

let shot = { blob: null, url: '', kind: 'photo' };

function showShot(blob, kind) {
  if (shot.url) URL.revokeObjectURL(shot.url);
  shot = { blob, url: URL.createObjectURL(blob), kind };
  const isVid = kind === 'video';
  $('shotImg').hidden = isVid;
  $('shotVid').hidden = !isVid;
  if (isVid) {
    $('shotVid').src = shot.url;
    $('shotVid').play().catch(() => {});
  } else {
    $('shotImg').src = shot.url;
  }
  const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('webm') ? 'webm' : 'jpg';
  $('shotSave').href = shot.url;
  $('shotSave').download = `inixr-wish.${ext}`;
  $('shot').hidden = false;
}

function capture() {
  if (rec) return;
  minimizeCard();
  track('photo');
  renderer.render(scene, camera);
  const w = renderer.domElement.width, h = renderer.domElement.height;
  const [c, ctx] = canvas(w, h);
  paintFrame(ctx, w, h);
  sfx.shutter();
  const fl = $('flash');
  fl.classList.add('on');
  requestAnimationFrame(() => requestAnimationFrame(() => fl.classList.remove('on')));
  c.toBlob((blob) => { if (blob) showShot(blob, 'photo'); }, 'image/jpeg', 0.9);
}

async function shareShot() {
  if (!shot.blob) return;
  const ext = shot.kind === 'video' ? ($('shotSave').download.split('.').pop()) : 'jpg';
  const file = new File([shot.blob], `${IS_RX ? 'reaction' : IS_TY ? 'thank-you' : 'birthday-surprise'}.${ext}`, { type: shot.blob.type });
  const text = IS_AW
    ? `😂 I just won the ${AW_TITLE} AWARD 🏆 Want to give your friends an award? Tap 👉 https://wish.inixr.com/create/`
    : HEARTY
    ? `Look what I got ${IS_RX ? REACT.emoji : '💖'} Want to send one too? Tap 👉 https://wish.inixr.com/create/`
    : 'Look at my birthday surprise 🎂 Want to send one too? Tap 👉 https://wish.inixr.com/create/';
  const done = () => track(shot.kind === 'video' ? 'video_share' : 'photo_share');
  const saveInstead = (why) => {
    $('shotSave').click();
    toast(why || 'Saved to your phone — share it from your gallery 📲', 3500);
  };
  if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
    saveInstead(shot.kind === 'video' ? 'Video saved — share it from your gallery 📲' : '');
    return;
  }
  try {
    await navigator.share({ files: [file], text });   // most phones: file + invite caption
    done();
  } catch (err) {
    if (err && err.name === 'AbortError') return;      // user closed the share sheet
    try {
      await navigator.share({ files: [file] });         // some apps reject file + text together
      done();
    } catch (err2) {
      if (err2 && err2.name === 'AbortError') return;
      saveInstead();
    }
  }
}

// Video: records the composited canvas + the gift's music (up to REC_MAX seconds).
const REC_MAX = 15;
let rec = null;

function pickMime() {
  if (!window.MediaRecorder) return null;
  const list = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,opus', 'video/mp4',
    'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return list.find((m) => MediaRecorder.isTypeSupported(m)) || '';
}

function startRec() {
  const mime = pickMime();
  const src = renderer.domElement;
  if (mime === null || !src.captureStream) { toast('Video recording isn’t supported on this browser'); return; }
  const k = Math.min(1, 720 / src.width);
  const w = Math.round((src.width * k) / 2) * 2, h = Math.round((src.height * k) / 2) * 2;
  const [c, ctx] = canvas(w, h);
  paintFrame(ctx, w, h);
  const stream = c.captureStream(30);
  let dest = null;
  if (actx) {
    dest = actx.createMediaStreamDestination();
    master.connect(dest);
    dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
  }
  let mr;
  try {
    mr = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 5_000_000 } : undefined);
  } catch {
    toast('Couldn’t start recording');
    return;
  }
  const chunks = [];
  mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  mr.onstop = () => {
    if (dest) { try { master.disconnect(dest); } catch { /* already gone */ } }
    stream.getTracks().forEach((tr) => tr.stop());
    const type = (mr.mimeType || mime || 'video/webm').split(';')[0];
    if (chunks.length) showShot(new Blob(chunks, { type }), 'video');
  };
  mr.start(250);
  minimizeCard();
  document.body.classList.add('recording');
  rec = { mr, ctx, w, h, t0: performance.now() };
  track('video');
  $('recBtn').classList.add('recording');
  $('recLabel').textContent = '● 0s';
}

function stopRec() {
  if (!rec) return;
  const r = rec;
  rec = null;
  document.body.classList.remove('recording');
  $('recBtn').classList.remove('recording');
  $('recLabel').textContent = 'Video';
  if (r.mr.state !== 'inactive') r.mr.stop();
}

function recFrame() {
  if (!rec) return;
  paintFrame(rec.ctx, rec.w, rec.h);
  const sec = (performance.now() - rec.t0) / 1000;
  $('recLabel').textContent = `● ${Math.floor(sec)}s`;
  if (sec >= REC_MAX) stopRec();
}

// ── Mic blow detection ──────────────────────────────────────────
let mic = null;
let micLevel = 0;

async function startMic() {
  $('hintMain').disabled = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    track('mic_ok');
    initAudio();
    const src = actx.createMediaStreamSource(stream);
    const analyser = actx.createAnalyser();
    analyser.fftSize = 1024;
    src.connect(analyser);
    mic = { stream, analyser, buf: new Float32Array(analyser.fftSize), floor: 0, calib: 0, accum: 0 };
    setHint({ text: 'Now blow! 🌬️ (close to the mic)', meter: true, alt: 'or tap here to blow', onAlt: tapBlow });
  } catch {
    track('mic_denied');
    setHint({ text: 'No mic? No problem! 🌬️', main: '🌬️ Tap to blow', onMain: tapBlow });
  }
}

function stopMic() {
  if (mic) mic.stream.getTracks().forEach((t) => t.stop());
  mic = null;
  micLevel = 0;
  $('meter').classList.remove('on');
}

function updateMic(dt) {
  if (!mic || phase !== 'blow') return;
  mic.analyser.getFloatTimeDomainData(mic.buf);
  let sum = 0;
  for (const v of mic.buf) sum += v * v;
  const rms = Math.sqrt(sum / mic.buf.length);

  if (mic.calib < 0.5) {             // learn the room's noise floor first
    mic.calib += dt;
    mic.floor = Math.max(mic.floor, rms);
    return;
  }
  const thresh = Math.max(0.05, mic.floor * 3);
  micLevel += (clamp01((rms - mic.floor) / (thresh * 2)) - micLevel) * 0.3;
  $('meter').firstElementChild.style.width = `${Math.round(micLevel * 100)}%`;

  if (rms > thresh) {
    mic.accum += dt * (rms > thresh * 2 ? 2 : 1);
    if (mic.accum > 0.16) {
      mic.accum = 0;
      const lit = flames.filter((f) => f.userData.lit);
      if (lit.length) {
        extinguish(lit[Math.floor(Math.random() * lit.length)]);
        if (lit.length === flames.length) sfx.whoosh();
      }
      if (lit.length <= 1) celebrate();
    }
  }
}

function tapBlow() {
  if (phase !== 'blow') return;
  sfx.whoosh();
  flames.forEach((f, i) => setTimeout(() => extinguish(f), i * 110));
  setTimeout(celebrate, flames.length * 110 + 150);
}

// ── Hint panel ──────────────────────────────────────────────────
let hintMainHandler = null, hintAltHandler = null;
function setHint({ text, main = '', onMain = null, alt = '', onAlt = null, meter = false }) {
  $('hintText').textContent = text;
  const m = $('hintMain');
  m.hidden = !main;
  m.disabled = false;
  m.textContent = main;
  hintMainHandler = onMain;
  $('hintAlt').hidden = !alt;
  $('hintAlt').textContent = alt;
  hintAltHandler = onAlt;
  $('meter').classList.toggle('on', meter);
  $('hint').hidden = false;
}
$('hintMain').addEventListener('click', () => hintMainHandler && hintMainHandler());
$('hintAlt').addEventListener('click', () => hintAltHandler && hintAltHandler());

// ── Flow ────────────────────────────────────────────────────────
// bday: intro → reveal → light → blow (song plays, blow anytime) → done
// ty:   intro → reveal → open → hearts → done
let phase = 'intro';

async function reveal() {
  phase = 'reveal';
  hero.visible = true;
  sparkles.visible = true;
  sfx.sparkle();
  // Drop in from above with a bounce
  tween(1.1, (k) => {
    hero.position.y = (1 - easeOutBounce(k)) * 3.2;
    hero.scale.setScalar(Math.max(0.0001, Math.min(1, k * 3)));
  });
  setTimeout(() => { sfx.thud(); burstConfetti(60, new THREE.Vector3(0, 0.2, 0), 0.7); }, 420);
  await wait(1200);
  if (IS_RX) {
    playReaction();
  } else if (IS_BOX) {
    phase = 'open';
    setHint(IS_AW
      ? { text: `${W.from || 'Your friend'} has an award for you 🏆`, main: '🏆 Open my award', onMain: openGift }
      : { text: 'Tap the gift to open it 🎁', main: '🎁 Open the gift', onMain: openGift });
  } else {
    showBalloons();
    phase = 'light';
    setHint({ text: 'Tap the cake to light the candles 🔥', main: '🔥 Light the candles', onMain: lightCandles });
  }
}

async function lightCandles() {
  if (phase !== 'light') return;
  phase = 'lighting';
  $('hint').hidden = true;
  track('lit');
  flames.forEach((f, i) => {
    setTimeout(() => { f.visible = true; sfx.light(); }, i * 170);
    lightFlame(f, i * 0.17);
  });
  await wait(flames.length * 170 + 400);
  phase = 'blow';
  setHint({ text: 'Make a wish… then blow! 🌬️ (or tap the cake)', main: '🎤 Blow with mic', onMain: startMic, alt: 'or tap here to blow', onAlt: tapBlow });
  playSong(BDAY_SONG, BDAY_LYRICS, 0.52).then(() => { if (phase === 'blow') track('song_done'); });
}

async function celebrate() {
  if (phase !== 'blow') return;
  phase = 'done';
  stopMic();
  stopSong();
  flames.forEach(extinguish);
  $('hint').hidden = true;
  track('blown');

  await wait(350);
  sfx.tada();
  burstConfetti(160, new THREE.Vector3(0, 1.6, 0), 1.1);
  [0, 0.25, 0.5].forEach((d) => sfx.pop(d));
  setTimeout(() => { burstConfetti(110, new THREE.Vector3(-1.2, 0.2, 0.6), 1); sfx.pop(); }, 450);
  setTimeout(() => { burstConfetti(110, new THREE.Vector3(1.2, 0.2, 0.6), 1); sfx.pop(); }, 750);
  tween(0.6, (k) => hero.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.08));
  showLyric(`🎉 Happy Birthday, ${W.to}! 🎉`);
  setTimeout(releaseBalloons, 600);

  await wait(2600);
  hideLyric();
  showCard();
}

function showCard() {
  phase = 'done';
  $('cardTo').textContent = `Dear ${W.to},`;
  $('cardMsg').textContent = W.msg || (IS_AW ? `You've won the ${AW_TITLE} AWARD! 😂🏆` : IS_RX ? `${REACT.word.charAt(0)}${REACT.word.slice(1).toLowerCase()} ${REACT.emoji}` : IS_TY ? 'Thank you so much! 💖' : 'Happy Birthday! 🎂');
  $('cardFrom').textContent = W.from ? `— with love, ${W.from}` : '';
  $('reactLabel').textContent = W.from ? `React to ${W.from}:` : 'React:';
  const btn = $('primaryBtn');
  btn.className = 'big-btn pink';
  btn.textContent = IS_AW
    ? (W.from ? `🏆 Give an award back to ${W.from}` : '🏆 Give someone an award')
    : (W.from ? `💌 Send something back to ${W.from}` : '💌 Send a surprise to someone');
  $('card').classList.remove('min');
  $('card').hidden = false;
  arTip('Tap 📸 Photo or 🎥 Video to share it! ✨', 5000);
}

async function replay() {
  track('replay');
  $('card').hidden = true;
  stopSong();
  if (IS_RX) {
    rx.obj.scale.setScalar(0.0001);
    rx.glow.material.opacity = 0;
    rx.text.scale.setScalar(0.0001);
    floaters.visible = false;
    warmLight.intensity = 0;
  } else if (IS_BOX) {
    ty.opened = false;
    ty.heart.scale.setScalar(0.0001);
    ty.heart.position.y = 0.5;
    ty.heartGlow.material.opacity = 0;
    ty.text.scale.setScalar(0.0001);
    ty.lid.position.set(0, 0.99, 0);
    ty.lid.rotation.set(0, 0, 0);
    if (floaters) floaters.visible = false;
    warmLight.intensity = 0;
  } else {
    flames.forEach((f) => { f.userData.lit = false; f.userData.k = 0; f.visible = false; });
  }
  balloons.forEach((b) => { b.visible = false; });
  hero.visible = false;
  await wait(250);
  reveal();
}

// ── Taps on the 3D scene ────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let down = null;
renderer.domElement.addEventListener('pointerdown', (e) => { if (e.isPrimary) down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
renderer.domElement.addEventListener('pointercancel', () => { down = null; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  const quick = performance.now() - down.t < 700;
  down = null;
  if (moved > 18 || !quick) return;        // a drag, not a tap
  onTap(e.clientX, e.clientY);
});

function onTap(x, y) {
  if (phase === 'light') { lightCandles(); return; }
  if (phase === 'open') { openGift(); return; }
  if (phase === 'blow') { tapBlow(); return; }
  pointer.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  if (IS_RX && rx.obj && rx.obj.scale.x > 0.5 && raycaster.intersectObject(rx.obj, true).length) {
    bounceReaction();
    return;
  }
  const targets = balloons.filter((b) => b.visible && !b.userData.popped).map((b) => b.userData.hitbox);
  const hit = raycaster.intersectObjects(targets, false)[0];
  if (hit) {
    popBalloon(hit.object.userData.balloon);
    if (HEARTY) track('heart_pop');
  }
}

// ── Buttons ─────────────────────────────────────────────────────
$('openBtn').addEventListener('click', async () => {
  initAudio();
  track('start');
  const gyro = askGyro();
  $('openBtn').disabled = true;
  $('introSub').textContent = 'Opening your gift… 📷';
  const ok = await setMode('room', gyro);
  track(ok ? 'cam_ok' : 'cam_denied');
  if (!ok) place3D();
  updateTools();
  $('intro').classList.add('fade');
  setTimeout(() => { $('intro').hidden = true; }, 650);
  $('mute').hidden = false;
  $('tools').hidden = false;
  reveal();
});

$('mute').addEventListener('click', () => {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.85;
  $('mute').textContent = muted ? '🔇' : '🔊';
});

document.querySelectorAll('.tool[data-mode]').forEach((b) => {
  b.addEventListener('click', () => setMode(b.dataset.mode, b.dataset.mode === 'room' ? askGyro() : null));
});
$('recenter').addEventListener('click', recenter);
$('snapBtn').addEventListener('click', capture);
$('selfieBtn').addEventListener('click', () => {
  const next = mode === 'selfie' ? 'room' : 'selfie';
  setMode(next, next === 'room' ? askGyro() : null);
});
$('replayBtn').addEventListener('click', replay);
function minimizeCard() { $('card').classList.add('min'); }
$('cardToggle').addEventListener('click', minimizeCard);
$('cardShow').addEventListener('click', () => $('card').classList.remove('min'));

// "Send something back": opens the creator with names swapped; the viewer picks what to send.
$('primaryBtn').addEventListener('click', () => {
  track('send_back');
  const p = new URLSearchParams();
  p.set('k', IS_AW ? 'aw' : IS_TY || IS_RX ? 'rx' : 'ty');
  p.set('f', W.to);                            // the viewer becomes the sender
  if (W.from) p.set('t', W.from);
  if (W.id) p.set('r', W.id);
  location.href = `${CREATE_URL}#${p.toString()}`;
});

// ── One-tap reactions (sent straight to WhatsApp) ───────────────
function newId() {
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return Array.from(a, (x) => (x % 36).toString(36)).join('');
}
function b64url(str) {
  let bin = '';
  new TextEncoder().encode(str).forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function beacon(payload) {
  if (ME || !EVT_URL || W.demo || W.preview) return;
  try { navigator.sendBeacon(EVT_URL, new Blob([JSON.stringify(payload)], { type: 'text/plain' })); } catch { /* ignore */ }
}

let reactKey = 'love';
function openReact(key) {
  reactKey = key;
  const R = REACTS[key];
  $('reactBig').textContent = R.emoji;
  $('reactTitle').textContent = W.from ? `Send ${R.emoji} to ${W.from}` : `Send ${R.emoji}`;
  $('reactTo').hidden = !!W.from;
  $('reactTo').value = W.from || '';
  $('reactFrom').value = W.demo ? '' : W.to;
  $('reactErr').textContent = '';
  $('reactSheet').hidden = false;
}
$('reactRow').querySelectorAll('button[data-x]').forEach((b) => b.addEventListener('click', () => openReact(b.dataset.x)));
$('reactClose').addEventListener('click', () => { $('reactSheet').hidden = true; });
$('reactSend').addEventListener('click', () => {
  const to = $('reactTo').value.trim().slice(0, 24);
  const from = $('reactFrom').value.trim().slice(0, 24);
  if (!to) { $('reactErr').textContent = 'Who are you reacting to? 🙂'; $('reactTo').focus(); return; }
  if (!from) { $('reactErr').textContent = 'Add your name so they know it’s you 🙂'; $('reactFrom').focus(); return; }
  const R = REACTS[reactKey];
  const id = newId();
  const data = { k: 'rx', t: to, f: from, m: $('reactMsg').value.trim().slice(0, 120), i: id, x: reactKey, y: 1 };
  const url = `${location.origin}${REACT_URL}#d=${b64url(JSON.stringify(data))}`;
  beacon({ e: 'react', k: W.kind, i: W.id, r: '' });
  beacon({ e: 'link_created', k: 'rx', i: id, r: W.id });
  const text = `${R.emoji} ${from} ${R.verb}! Tap to see it in 3D 👉 ${url}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  $('reactSheet').hidden = true;
  if (!window.open(wa, '_blank')) location.href = wa;
});

$('shotShare').addEventListener('click', shareShot);
$('shotClose').addEventListener('click', () => { $('shot').hidden = true; $('shotVid').pause(); });
$('recBtn').addEventListener('click', () => (rec ? stopRec() : startRec()));

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  renderer.setSize(innerWidth, innerHeight);
  if (mode === '3d') camera.updateProjectionMatrix();
  else placeAR();
  fitVideoBackground();
});

// ── Loop ────────────────────────────────────────────────────────
const clock = new THREE.Clock();
const dummy = new THREE.Object3D();

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    if (tw.t < 0) continue;
    const k = clamp01(tw.t / tw.dur);
    tw.fn(k);
    if (k >= 1) { tweens.splice(i, 1); tw.resolve(); }
  }

  updateMic(dt);

  // Gently turns to show off, but keeps its front toward the viewer.
  hero.rotation.y = Math.sin(t * 0.35) * 0.3;

  if (W.kind === 'bday') {
    let glow = 0;
    for (const f of flames) {
      const { k, seed, base } = f.userData;
      const flick = 1 + Math.sin(t * 19 + seed) * 0.08 + Math.sin(t * 31 + seed * 2) * 0.06;
      const lean = micLevel * 0.06 + Math.sin(t * 3 + seed) * 0.008;
      f.scale.set(Math.max(0.0001, k * (1 - micLevel * 0.3)), Math.max(0.0001, k * flick * (1 - micLevel * 0.35)), Math.max(0.0001, k));
      f.position.set(base.x - lean, base.y, base.z - lean * 0.5);
      if (k < 0.01 && !f.userData.lit) f.visible = false;
      glow += Math.max(0, k) * flick;
    }
    warmLight.intensity = glow * 0.9 * (1 - micLevel * 0.4);
  } else if (IS_RX) {
    if (rx.obj && rx.obj.scale.x > 0.5) {
      rx.obj.rotation.y = Math.sin(t * 0.9) * 0.4;
      rx.obj.position.y = 1.35 + Math.sin(t * 1.6) * 0.06;
      if (W.react === 'love' && !bouncing) rx.obj.scale.setScalar(1 + Math.max(0, Math.sin(t * 5.2)) * 0.05);
      rx.glow.position.y = rx.obj.position.y;
      rx.text.position.y = 2.6 + Math.sin(t * 1.2) * 0.04;
    }
  } else if (ty.opened) {
    ty.heart.rotation.y = Math.sin(t * 0.9) * 0.5;
    if (W.item === 'heart' && ty.heart.scale.x > 0.9) ty.heart.scale.setScalar(1 + Math.max(0, Math.sin(t * 5.2)) * 0.05);
    for (const s of steamPuffs) {
      const u = s.userData;
      const k = (t * u.speed + u.phase) % 1;
      s.position.set(u.x + Math.sin(t * 2 + u.seed) * 0.04, u.y + k * 0.5, u.z);
      s.scale.setScalar(0.12 + k * 0.28);
      s.material.opacity = 0.4 * Math.sin(k * Math.PI);
    }
    ty.heartGlow.position.copy(ty.heart.position);
    ty.text.position.y = ty.textY + Math.sin(t * 1.2) * 0.04;
  }

  for (const b of balloons) {
    if (!b.visible) continue;
    const u = b.userData;
    if (u.flyV > 0) {                       // released: drift up and away
      u.flyV = Math.min(u.flyV + dt * 0.6, 1.6);
      u.fly += u.flyV * dt;
      if (u.fly > 9) b.visible = false;
    }
    b.position.set(
      u.home.x + Math.sin(t * 0.6 + u.seed) * 0.08 + u.flyX * u.fly,
      THREE.MathUtils.lerp(-4, u.home.y + Math.sin(t * 0.9 + u.seed) * 0.12, u.shown) + u.fly,
      u.home.z + Math.cos(t * 0.5 + u.seed) * 0.08,
    );
    b.rotation.z = Math.sin(t * 0.7 + u.seed) * 0.12;
    if (HEARTY) b.rotation.y = Math.sin(t * 0.8 + u.seed) * 0.6;
  }

  if (floaters && floaters.visible) {
    floatData.forEach((f, i) => {
      f.y += f.v * dt;
      if (f.y > 3.8) { f.y = -0.2; f.a = rand(0, Math.PI * 2); }
      dummy.position.set(Math.sin(f.a + t * 0.1) * f.r, f.y, Math.cos(f.a + t * 0.1) * f.r);
      dummy.rotation.set(0, Math.sin(t + f.seed) * 0.8, Math.sin(t * 1.3 + f.seed) * 0.2);
      dummy.scale.setScalar(Math.max(0.0001, f.s * clamp01(f.y + 0.2) * clamp01((3.8 - f.y) * 1.5)));
      dummy.updateMatrix();
      floaters.setMatrixAt(i, dummy.matrix);
    });
    floaters.instanceMatrix.needsUpdate = true;
  }

  sparkles.rotation.y = t * 0.05;
  sparkles.material.opacity = 0.55 + Math.sin(t * 2.3) * 0.25;

  let anyConf = false;
  for (let i = 0; i < CONF_N; i++) {
    const c = conf[i];
    if (!c.alive) continue;
    anyConf = true;
    c.life += dt;
    c.v.y -= 3.4 * dt;
    c.v.multiplyScalar(1 - 1.6 * dt);
    c.p.addScaledVector(c.v, dt);
    c.p.x += Math.sin(c.life * 6 + i) * 0.004;
    c.r.x += c.w.x * dt; c.r.y += c.w.y * dt; c.r.z += c.w.z * dt;
    const fade = c.p.y < 0 ? Math.max(0, 1 + c.p.y * 2) : 1;
    if (fade <= 0 || c.life > 7) {
      c.alive = false;
      dummy.scale.setScalar(0);
    } else {
      dummy.scale.setScalar(fade);
    }
    dummy.position.copy(c.p);
    dummy.rotation.copy(c.r);
    dummy.updateMatrix();
    confetti.setMatrixAt(i, dummy.matrix);
  }
  if (anyConf) confetti.instanceMatrix.needsUpdate = true;

  smoke.forEach((sm, i) => {
    if (!sm.alive) return;
    sm.life += dt;
    if (sm.life < 0) return;
    const k = sm.life / 1.8;
    if (k >= 1) { sm.alive = false; sm.s.visible = false; return; }
    sm.s.visible = true;
    sm.s.position.y += dt * 0.35;
    sm.s.position.x += dt * sm.drift;
    sm.s.scale.setScalar(0.08 + k * 0.35);
    smokeMats[i].opacity = 0.45 * (1 - k);
  });

  if (mode === 'room' && orientReady) {
    camera.quaternion.copy(baseQ).multiply(startQ.clone().invert().multiply(devQ));
  } else {
    controls.update();
  }
  renderer.render(scene, camera);
  recFrame();
  requestAnimationFrame(frame);
}

// ── Boot ────────────────────────────────────────────────────────
(async function boot() {
  if (IS_AW) {
    $('introEmoji').textContent = '🏆';
    $('introTitle').textContent = W.demo
      ? 'Preview: this is what they will see 🏆'
      : `Hey ${W.to}! 🏆 ${W.from || 'Your friend'} has an award for you!`;
    $('introSub').textContent = 'Turn your sound on 🔊 (drumroll please…)';
    $('openBtn').textContent = 'Open my award 🏆';
  } else if (IS_RX) {
    $('introEmoji').textContent = REACT.emoji;
    $('introTitle').textContent = W.demo
      ? 'Preview: this is what they will see 💞'
      : W.reply
        ? `Hey ${W.to}! ${W.from || 'Someone'} reacted to your surprise ${REACT.emoji}`
        : `Hey ${W.to}! ${W.from || 'Someone'} sent you something special ${REACT.emoji}`;
    $('openBtn').textContent = 'Open it ✨';
  } else if (IS_TY) {
    $('introEmoji').textContent = '💌';
    $('introTitle').textContent = W.demo
      ? 'Preview: this is what they will see 💖'
      : ITEM.label
        ? `Hey ${W.to}! ${ITEM.emoji} ${W.from || 'Someone'} says thank you for ${ITEM.label}!`
        : `Hey ${W.to}! 💖 ${W.from || 'Someone'} sent you a thank-you gift!`;
  } else {
    $('introTitle').textContent = W.demo
      ? 'Preview: this is what your friend will see ✨'
      : `Hey ${W.to}! 🎉 You've got a birthday surprise!`;
  }
  track('open');
  const meParam = new URLSearchParams(location.search).get('me');
  if (meParam === '1') toast('✅ This phone won’t be counted in stats', 3500);
  if (meParam === '0') toast('This phone is counted in stats again', 3500);
  place3D();
  try {
    await Promise.race([document.fonts.load(`800 100px ${FONT}`), wait(2500)]);
  } catch { /* fall back to system font */ }
  if (IS_RX) { buildReaction(); buildFloaters(); } else if (IS_BOX) { buildGift(); if (IS_TY) buildFloaters(); } else { buildCake(); }
  buildBalloons();
  requestAnimationFrame(frame);
})();
