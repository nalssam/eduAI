'use strict';
// 3D 가상 접기 미리보기: 인쇄한 학습지 → 오리기 → 접기 → 붙이기 → 완성.
// 학습지 SVG 를 그대로 텍스처로 쓰고, 전개도의 경첩(접는 선)을 따라 패널을 돌려 접는다.

const { toSheet, PAGE } = require('./sheet');

function modelData(build) {
  return {
    sheet: { w: PAGE.w, h: PAGE.h },
    parts: build.parts.map((p) => ({
      id: p.id, kind: p.kind, name: p.name,
      place: p.place, bw: p.bw, bh: p.bh,
      anchor: p.anchor, assembly: p.assembly,
      anchorSheet: toSheet(p, [p.anchor[0], -p.anchor[1]]),
      panels: p.panels.map((q) => ({
        id: q.id, parent: q.parent, role: q.role, stage: q.stage,
        hinge: q.hinge,
        poly: q.poly,
        uv: q.poly.map((pt) => { const s = toSheet(p, pt); return [s[0] / PAGE.w, 1 - s[1] / PAGE.h]; }),
      })),
    })),
    height: (build.body ? build.body.h : 0) + build.head.h,
  };
}

function foldViewerHtml(svg, build, s) {
  const data = JSON.stringify(modelData(build));
  const svgJson = JSON.stringify(svg);
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${s.title} · 3D 접기</title>
<link href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Jua&display=swap" rel="stylesheet">
<style>
:root{--bg:#FBF6F1;--ink:#3B2E2E;--sub:#7A6A66;--chip:#FFFFFF;--line:#EADFD6;--accent:#F28BA6;}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#211C1B;--ink:#F3ECE7;--sub:#BBA9A3;--chip:#2E2826;--line:#453B38;}}
:root[data-theme="dark"]{--bg:#211C1B;--ink:#F3ECE7;--sub:#BBA9A3;--chip:#2E2826;--line:#453B38;}
html,body{margin:0;height:100%;background:var(--bg);color:var(--ink);font-family:'Gowun Dodum',sans-serif;overflow:hidden}
#c{position:fixed;inset:0;width:100%;height:100%;touch-action:none;display:block}
.top{position:fixed;left:16px;right:16px;top:12px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;pointer-events:none}
h1{font-family:Jua,sans-serif;font-weight:400;font-size:22px;margin:0}
.step{font-family:Jua,sans-serif;font-size:18px;background:var(--chip);border:1px solid var(--line);border-radius:999px;padding:6px 14px;white-space:nowrap}
.ctl{position:fixed;left:16px;right:16px;bottom:14px;display:flex;gap:10px;align-items:center;background:var(--chip);border:1px solid var(--line);border-radius:16px;padding:8px 12px}
.ctl button{font:inherit;font-size:15px;border:0;background:var(--accent);color:#fff;border-radius:999px;padding:7px 14px;cursor:pointer;min-width:64px}
.ctl input{flex:1;accent-color:var(--accent);min-width:0}
.hint{position:fixed;left:16px;top:52px;font-size:13px;color:var(--sub);pointer-events:none}
</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"}}</script>
</head><body>
<canvas id="c"></canvas>
<div class="top"><h1>${s.title}</h1><div class="step" id="step">인쇄한 학습지</div></div>
<div class="hint">끌어서 돌려 보세요</div>
<div class="ctl"><button id="play">⏸ 멈춤</button><input id="seek" type="range" min="0" max="1000" value="0" aria-label="진행"></div>
<script type="module">
import * as THREE from 'three';
const M = ${data};
const SVG = ${svgJson};
const qs = new URLSearchParams(location.search);
const T_TOTAL = 15;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const seg = (t, a, b) => clamp((t - a) / (b - a));
const STEPS = [[0, '① 인쇄한 학습지'], [0.1, '② 굵은 선 따라 오리기 ✂'], [0.2, '③ 점선 따라 접기'], [0.53, '④ 풀칠해서 붙이기'], [0.72, '완성! 🎉']];

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.setClearColor(new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#FBF6F1'));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 1, 5000);
scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cfc8, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(120, 260, 220); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 10, far: 900 });
scene.add(sun);

// 학습지 텍스처
const TW = 1680, TH = Math.round(TW * M.sheet.h / M.sheet.w);
const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH;
const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
await new Promise((res) => {
  const img = new Image();
  img.onload = () => { const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, TW, TH); g.drawImage(img, 0, 0, TW, TH); tex.needsUpdate = true; res(); };
  img.onerror = res;
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(SVG.replace('width="210mm" height="297mm"', 'width="' + TW + '" height="' + TH + '"'));
});

const world = new THREE.Group(); scene.add(world);
const frontMat = new THREE.MeshLambertMaterial({ map: tex, side: THREE.FrontSide });
const backMat = new THREE.MeshLambertMaterial({ color: 0xF4F0EA, side: THREE.BackSide });

// 배경 종이
const sheetMat = new THREE.MeshLambertMaterial({ map: tex, transparent: true });
const sheet = new THREE.Mesh(new THREE.PlaneGeometry(M.sheet.w, M.sheet.h), sheetMat);
sheet.position.z = -0.4; world.add(sheet);
// 바닥 그림자
const ground = new THREE.Mesh(new THREE.CircleGeometry(90, 48), new THREE.ShadowMaterial({ opacity: 0.16 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground);

const sheetPos = (x, y) => new THREE.Vector3(x - M.sheet.w / 2, M.sheet.h / 2 - y, 0);
const parts = [];
for (const P of M.parts) {
  const container = new THREE.Group(); const inner = new THREE.Group();
  container.add(inner); world.add(container);
  inner.position.set(-P.anchor[0], -P.anchor[1], -P.anchor[2]);
  const nodes = {};
  const order = []; const pending = [...P.panels];
  while (pending.length) for (let i = 0; i < pending.length; i++) { const q = pending[i]; if (!q.parent || nodes[q.parent]) { build(q); pending.splice(i, 1); i--; } }
  function build(q) {
    const g = new THREE.Group();
    const origin = q.hinge ? new THREE.Vector3(q.hinge[0][0], -q.hinge[0][1], 0) : new THREE.Vector3();
    const parent = q.parent ? nodes[q.parent] : null;
    if (parent) { g.position.copy(origin).sub(parent.origin); parent.g.add(g); } else inner.add(g);
    const shape = new THREE.Shape(q.poly.map(([x, y]) => new THREE.Vector2(x - origin.x, -y - origin.y)));
    const geo = new THREE.ShapeGeometry(shape);
    // 같은 순서로 UV 를 다시 넣는다
    const pos = geo.attributes.position; const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + origin.x, y = -(pos.getY(i) + origin.y);
      let best = 0, bd = 1e9; q.poly.forEach((p, j) => { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < bd) { bd = d; best = j; } });
      uv.setXY(i, q.uv[best][0], q.uv[best][1]);
    }
    const m1 = new THREE.Mesh(geo, frontMat); const m2 = new THREE.Mesh(geo, backMat);
    m1.castShadow = m2.castShadow = true; g.add(m1, m2);
    let axis = null, sign = 1;
    if (q.hinge) {
      const a = q.hinge[0], b = q.hinge[1];
      axis = new THREE.Vector3(b[0] - a[0], -(b[1] - a[1]), 0).normalize();
      const cx = q.poly.reduce((s, p) => s + p[0], 0) / q.poly.length, cy = q.poly.reduce((s, p) => s + p[1], 0) / q.poly.length;
      const r = new THREE.Vector3(cx - a[0], -(cy - a[1]), 0);
      sign = (axis.x * r.y - axis.y * r.x) < 0 ? 1 : -1;
    }
    nodes[q.id] = { g, origin, axis, sign, q, target: q.role === 'tab' ? 94 : 90 };
    order.push(nodes[q.id]);
  }
  const a0 = sheetPos(P.anchorSheet[0], P.anchorSheet[1]); a0.z = P.anchor[2];
  const q0 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), P.place.rot ? -Math.PI / 2 : 0);
  const a1 = new THREE.Vector3(...P.assembly.pos);
  const q1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), P.assembly.rotY * Math.PI / 180);
  parts.push({ P, container, nodes: order, a0, q0, a1, q1 });
}
// 붙이는 순서: 몸통 → 머리 → 꼬리 → 귀
const rank = (id) => id === 'body' ? 0 : id === 'head' ? 1 : id === 'tail' ? 2 : 3;
parts.sort((x, y) => rank(x.P.id) - rank(y.P.id));

const H = M.height;
const camA = { pos: new THREE.Vector3(0, -40, 600), look: new THREE.Vector3(0, 0, 0) };
const camB = { pos: new THREE.Vector3(150, H * 1.25 + 60, 230), look: new THREE.Vector3(0, H * 0.5, 0) };
let yaw = 0, pitch = 0;

function setT(t) {
  // 오리기
  const cut = seg(t, 0.09, 0.19);
  sheetMat.opacity = 1 - ease(cut); sheet.visible = sheetMat.opacity > 0.01;
  // 접기: 날개 → 옆면 → 윗면·아랫면
  const fold = { 1: ease(seg(t, 0.2, 0.3)), 2: ease(seg(t, 0.29, 0.42)), 3: ease(seg(t, 0.41, 0.52)) };
  // 붙이기
  parts.forEach((pt, i) => {
    for (const n of pt.nodes) if (n.axis) n.g.quaternion.setFromAxisAngle(n.axis, n.sign * n.target * Math.PI / 180 * (fold[n.q.stage] || 0));
    const k = ease(seg(t, 0.53 + i * 0.035, 0.66 + i * 0.035));
    const spread = 1 + 0.07 * ease(cut);
    const p0 = pt.a0.clone(); p0.x *= spread; p0.y *= spread; p0.z += 6 * ease(cut);
    const lift = Math.sin(Math.PI * k) * 40;
    pt.container.position.lerpVectors(p0, pt.a1, k); pt.container.position.y += lift * (1 - k) * 0.6;
    pt.container.quaternion.slerpQuaternions(pt.q0, pt.q1, k);
  });
  const cam = ease(seg(t, 0.48, 0.68));
  ground.visible = t > 0.55; ground.material.opacity = 0.16 * ease(seg(t, 0.55, 0.7));
  // 완성 후 한 바퀴
  const spin = ease(seg(t, 0.74, 1)) * Math.PI * 2;
  world.rotation.y = spin + yaw;
  const pos = new THREE.Vector3().lerpVectors(camA.pos, camB.pos, cam);
  const look = new THREE.Vector3().lerpVectors(camA.look, camB.look, cam);
  pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), -pitch);
  camera.position.copy(pos); camera.lookAt(look);
  let label = STEPS[0][1]; for (const [s, l] of STEPS) if (t >= s) label = l;
  document.getElementById('step').textContent = label;
  renderer.render(scene, camera);
}

function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.fov = w < h ? 46 : 32; camera.updateProjectionMatrix();
}
addEventListener('resize', () => { resize(); setT(T); }); resize();

let T = qs.has('t') ? parseFloat(qs.get('t')) : 0;
let playing = !qs.has('t') && qs.get('autoplay') !== '0';
const seek = document.getElementById('seek'); const btn = document.getElementById('play');
const sync = () => { btn.textContent = playing ? '⏸ 멈춤' : '▶ 재생'; };
btn.onclick = () => { playing = !playing; if (playing && T >= 1) T = 0; sync(); };
seek.oninput = () => { T = seek.value / 1000; playing = false; sync(); setT(T); };
let drag = null;
canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yaw, pitch }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; yaw = drag.yaw + (e.clientX - drag.x) * 0.01; pitch = clamp(drag.pitch + (e.clientY - drag.y) * 0.005, -0.5, 0.6); if (!playing) setT(T); });
canvas.addEventListener('pointerup', () => { drag = null; });
let last = performance.now();
function loop(now) {
  const dt = (now - last) / 1000; last = now;
  if (playing) { T += dt / T_TOTAL; if (T > 1.08) T = 0; seek.value = Math.min(1000, T * 1000); }
  setT(Math.min(1, T)); requestAnimationFrame(loop);
}
sync(); setT(T);
window.__setT = (t) => { playing = false; T = t; setT(t); };
window.__ready = true;
requestAnimationFrame(loop);
</script></body></html>`;
}

module.exports = { foldViewerHtml, modelData };
