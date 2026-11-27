'use strict';
// 로우폴리(다면체) 동물 모형. 앉은 아기 동물: 큰 머리 + 서양배 몸통 + 앞발·뒷다리·꼬리·귀.
// 부속은 몸통/머리의 한 면에서 돋아나므로 붙이는 면이 정확히 맞닿는다.
// 그림(무늬)은 부위마다 정면·옆·위 투영 '데칼 층'으로 그려서 면마다 잘라 붙인다.

const { V, loft, ring, sprout } = require('./geom');
const A = require('../art');
const { f, el } = A;

const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];

// 층 좌표: front/back → (X, -Y), left/right → (Z, -Y), top/bottom → (X, Z)
function proj(layer, p) {
  if (layer === 'front' || layer === 'back') return [p[0], -p[1]];
  if (layer === 'left' || layer === 'right') return [p[2], -p[1]];
  return [p[0], p[2]];
}
function layerOf(n) {
  const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
  if (az >= ax && az >= ay) return n[2] > 0 ? 'front' : 'back';
  if (ax >= ay) return n[0] > 0 ? 'right' : 'left';
  return n[1] > 0 ? 'top' : 'bottom';
}

const BIG = (fill) => `<rect x="-400" y="-400" width="800" height="800" fill="${fill}"/>`;

function buildLowpolyTiger(s) {
  const c = {
    main: s.colors.main, light: s.colors.light, stripe: s.colors.accent, inner: s.colors.inner,
    ink: s.colors.ink, cheek: s.colors.cheek, nose: '#E9798B',
  };
  const hasStripes = s.headPattern !== 'none';
  // ── 몸통: Y 축 고리(XZ 평면) ──
  const Wb = 62, Db = 54, Hb = 56;
  const bodyRings = [[0, 0.8], [0.16, 1], [0.5, 0.93], [0.82, 0.72], [1, 0.57]].map(([t, sc]) => ring([0, t * Hb, 0], X, Z, Wb / 2 * sc, Db / 2 * sc, 8));
  const body = loft(bodyRings, { tag: { part: 'body' } });
  // ── 머리: Z 축 고리(XY 평면) ──
  const W = 80, H = 64, D = 58; const zh = 0; const yh = Hb + 0.924 * H / 2;
  const headRings = [[-0.5, 0.5], [-0.32, 0.88], [-0.12, 1], [0.12, 1], [0.32, 0.88], [0.5, 0.62]].map(([t, sc]) => ring([0, yh, zh + t * D], X, Y, W / 2 * sc, H / 2 * sc, 8));
  const head = loft(headRings, { tag: { part: 'head' } });
  const headFront = [0, yh, zh + D / 2];
  // ── 부속 ──
  const parts = [];
  const glue = []; // { host, face, poly3, label }
  const addSprout = (id, name, host, hostId, hostFace, opts, extra = {}) => {
    const sp = sprout(host, hostFace, opts);
    const m = loft(sp.rings, { capStart: true, capEnd: !sp.apex, apexEnd: sp.apex, tag: { part: id } });
    m.faces[m.capStart].glue = hostId === 'body' ? '몸통에 붙여요' : '머리에 붙여요';
    glue.push({ host: hostId, face: hostFace, poly3: sp.base, label: name });
    parts.push({ id, name, mesh: m, ...extra, sp });
    return { m, sp };
  };
  // 몸통 슬롯: 면 k 의 가운데 각 = 45+45k (k=1 앞, k=0 오른앞, k=2 왼앞, k=5 뒤)
  for (const [k, side, nm] of [[0, 1, '오른쪽 뒷다리'], [2, -1, '왼쪽 뒷다리']]) {
    addSprout(side > 0 ? 'legR' : 'legL', nm, body, 'body', body.sideFaces[1][k], {
      shrink: 0.82, steps: [{ out: 8, scale: 0.96 }, { out: 3, move: [side * 2, -5, 11], scale: 0.82 }],
    }, { kind: 'leg' });
  }
  for (const [k, side, nm] of [[0, 1, '오른쪽 앞발'], [2, -1, '왼쪽 앞발']]) {
    addSprout(side > 0 ? 'armR' : 'armL', nm, body, 'body', body.sideFaces[2][k], {
      shrink: 0.78, steps: [{ out: 6, scale: 0.92 }, { out: 2, move: [-side * 4, -9, 8], scale: 0.74 }],
    }, { kind: 'arm' });
  }
  const tail = addSprout('tail', '꼬리', body, 'body', body.sideFaces[1][5], {
    shrink: 0.5, steps: [{ out: 9, move: [0, 1, 0], scale: 0.92 }, { out: 7, move: [0, 8, 0], scale: 0.86 }, { out: 2, move: [3, 10, 0], scale: 0.8 }, { out: -1, move: [5, 8, 3], scale: 0.7 }],
  }, { kind: 'tail' });
  // 꼬리 줄무늬: 고리 칸마다 색
  tail.m.faces.forEach((fc) => { if (fc.ring === 1 || fc.ring === 3 || fc.cap === 'end') fc.fill = c.stripe; else if (!fc.glue) fc.fill = c.main; });
  // 귀: 머리 가운데 띠(고리 2→3)의 위쪽 비스듬한 면(k=0 오른쪽, k=2 왼쪽)
  for (const [k, side, nm] of [[0, 1, '오른쪽 귀'], [2, -1, '왼쪽 귀']]) {
    addSprout(side > 0 ? 'earR' : 'earL', nm, head, 'head', head.sideFaces[2][k], {
      shrink: 0.78, steps: [], apex: { out: 13, move: [side * 2, 5, 2] },
    }, { kind: 'ear' });
  }
  // 머리 아래 면 → 몸통 윗면에 붙는다
  const headBottom = head.sideFaces[2][5];
  head.faces[headBottom].glue = '몸통 위에 붙여요';
  glue.push({ host: 'body', face: body.capEnd, poly3: head.faces[headBottom].v.map((i) => head.verts[i]), label: '머리' });

  const model = [
    { id: 'head', name: '머리', mesh: head, kind: 'head' },
    { id: 'body', name: '몸통', mesh: body, kind: 'body' },
    ...parts,
  ];

  // ── 데칼 층 ──
  const stripe = (x, y, ux, uy, len, wd) => (hasStripes ? A.stripe(x, y, ux, uy, len, wd, c.stripe) : '');
  const k = W / 80;
  const ey = -(yh + 2), ex = 13 * k, cy = -(yh - 9);
  const faceFront = () => {
    let o = BIG(c.main);
    // 흰 눈썹·볼·턱
    o += el.ellipse(-ex, ey - 8.5, 4.2, 2.6, c.light) + el.ellipse(ex, ey - 8.5, 4.2, 2.6, c.light);
    o += el.ellipse(-7, cy, 8.6, 6.8, c.light) + el.ellipse(7, cy, 8.6, 6.8, c.light) + el.ellipse(0, cy + 6, 8, 5, c.light);
    // 이마·볼 줄무늬
    o += stripe(0, -(yh + 22), 0, 1, 10, 3.4) + stripe(-6.5, -(yh + 21), 0.15, 1, 7, 2.6) + stripe(6.5, -(yh + 21), -0.15, 1, 7, 2.6);
    for (const sd of [-1, 1]) { o += stripe(sd * 27, -(yh + 1), -sd, 0.08, 8, 2.6) + stripe(sd * 27, -(yh - 5), -sd, -0.05, 7, 2.4); }
    // 눈·볼터치·코·입
    for (const sd of [-1, 1]) {
      const x = sd * ex;
      o += el.ellipse(x, ey, 4.4, 5, c.ink) + el.circle(x + 1.4, ey - 1.8, 1.7, '#FFFFFF') + el.circle(x - 1.5, ey + 1.9, 0.75, '#FFFFFF');
      o += el.ellipse(sd * 20, ey + 6.5, 3.8, 2.3, c.cheek, 'opacity="0.85"');
    }
    o += el.path(`M-2.6,${f(cy - 4)}Q0,${f(cy - 5.2)} 2.6,${f(cy - 4)}Q1,${f(cy - 1.4)} 0,${f(cy - 1.2)}Q-1,${f(cy - 1.4)} -2.6,${f(cy - 4)}Z`, c.nose);
    o += el.stroke(`M0,${f(cy - 1.3)}L0,${f(cy + 0.4)}M-3.4,${f(cy + 0.2)}Q-1.7,${f(cy + 2.6)} 0,${f(cy + 0.4)}Q1.7,${f(cy + 2.6)} 3.4,${f(cy + 0.2)}`, c.ink, 0.55);
    return o;
  };
  const headSide = () => {
    let o = BIG(c.main);
    for (const [yy, len] of [[yh + 12, 20], [yh + 1, 24], [yh - 10, 18]]) o += stripe(zh - D / 2 - 1, -yy, 1, 0, len, 4);
    o += el.ellipse(zh + D / 2, -(yh - 14), 14, 9, c.light);
    return o;
  };
  const headTop = () => { let o = BIG(c.main); for (const x of [-13, 0, 13]) o += stripe(x, zh - D / 2 - 1, 0, 1, x ? 24 : 30, x ? 4 : 5); return o; };
  const headBack = () => { let o = BIG(c.main); for (const yy of [yh + 10, yh - 4]) { o += stripe(-W / 2 - 1, -yy, 1, 0, 18, 4) + stripe(W / 2 + 1, -yy, -1, 0, 18, 4); } o += stripe(0, -(yh + H / 2 + 1), 0, 1, 16, 4.6); return o; };
  const bodyFront = () => BIG(c.main) + el.ellipse(0, -Hb * 0.42, Wb * 0.3, Hb * 0.4, c.light) + stripe(-Wb / 2 - 1, -Hb * 0.7, 1, 0.1, 10, 3) + stripe(Wb / 2 + 1, -Hb * 0.7, -1, 0.1, 10, 3);
  const bodySide = () => { let o = BIG(c.main); for (const zz of [-14, 0, 12]) o += stripe(zz, -(Hb + 1), 0.05, 1, zz ? 18 : 24, 4.2); return o; };
  const bodyBack = () => { let o = BIG(c.main); for (const yy of [Hb * 0.75, Hb * 0.45]) { o += stripe(-Wb / 2 - 1, -yy, 1, 0, 16, 4) + stripe(Wb / 2 + 1, -yy, -1, 0, 16, 4); } return o; };
  const bodyTop = () => BIG(c.main) + stripe(0, -Db / 2 - 1, 0, 1, 14, 4);
  const cream = () => BIG(c.light);
  // 발바닥(끝 뚜껑 가운데 투영 자리)
  const pawLayer = (kind) => () => {
    let o = BIG(c.main);
    for (const p of parts.filter((q) => q.kind === kind)) {
      const m = p.mesh; const cap = m.faces[m.capEnd]; const pts = cap.v.map((i) => m.verts[i]); const cc = V.avg(pts);
      const [x, y] = proj('front', cc); const r = Math.max(...pts.map((q) => V.len(V.sub(q, cc)))) * 0.95;
      o += el.ellipse(x, y, r * 0.95, r * 0.8, c.light);
      o += el.ellipse(x, y + r * 0.22, r * 0.38, r * 0.28, c.inner) + [-1, 0, 1].map((t) => el.circle(x + t * r * 0.38, y - r * 0.3 - (t ? 0 : r * 0.08), r * 0.15, c.inner)).join('');
    }
    return o;
  };
  const limbTop = (kind) => () => { let o = BIG(c.main); for (const p of parts.filter((q) => q.kind === kind)) { const cc = V.avg(p.sp.base); const [x, z] = proj('top', cc); o += stripe(x - 7, z + 2, 1, 0.1, 8, 2.6) + stripe(x + 7, z + 6, -1, 0.1, 8, 2.6); } return o; };
  const earFront = () => {
    let o = BIG(c.main);
    for (const p of parts.filter((q) => q.kind === 'ear')) {
      const m = p.mesh; const apex = m.verts[m.verts.length - 1]; const base = V.avg(p.sp.base);
      const mid = V.lerp(base, apex, 0.42); const [x, y] = proj('front', mid);
      o += el.ellipse(x, y, 5.2, 5.6, c.light) + el.ellipse(x, y + 0.8, 3.2, 3.6, c.inner);
    }
    return o;
  };
  const earBack = () => {
    let o = BIG(c.stripe);
    for (const p of parts.filter((q) => q.kind === 'ear')) { const [x, y] = proj('back', V.lerp(V.avg(p.sp.base), p.mesh.verts[p.mesh.verts.length - 1], 0.4)); o += el.ellipse(x, y, 3.2, 2.6, '#FFFFFF'); }
    return o;
  };
  const LAYERS = {
    head: { front: faceFront, right: headSide, left: headSide, top: headTop, back: headBack, bottom: cream },
    body: { front: bodyFront, right: bodySide, left: bodySide, back: bodyBack, top: bodyTop, bottom: cream },
    arm: { front: pawLayer('arm'), top: limbTop('arm'), bottom: pawLayer('arm') },
    leg: { front: pawLayer('leg'), top: limbTop('leg'), bottom: cream },
    tail: {},
    ear: { front: earFront, back: earBack, top: earBack },
  };
  const layerKind = (part) => (part.kind === 'head' || part.kind === 'body' ? part.kind : part.kind);
  const defs = {};
  const layerId = (part, layer) => {
    const kind = layerKind(part); const fn = (LAYERS[kind] || {})[layer];
    if (!fn) return null;
    const id = `L-${kind}-${layer}`;
    if (!defs[id]) defs[id] = `<g id="${id}">${fn()}</g>`;
    return id;
  };
  const height = Math.max(...model.flatMap((p) => p.mesh.verts.map((v) => v[1])));
  return { model, glue, proj, layerOf, layerId, defs, base: c.main, height, assemblyOrder: ['body', 'legR', 'legL', 'armR', 'armL', 'tail', 'head', 'earR', 'earL'] };
}

module.exports = { buildLowpolyTiger, proj, layerOf };
