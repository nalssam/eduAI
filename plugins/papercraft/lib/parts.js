'use strict';
// 부품(전개도) 만들기: 상자 전개도 + 납작 부품(귀·꼬리). 각 부품은 2D 패널과 경첩(접는 선)을 가진다.
// 같은 데이터로 인쇄용 SVG 와 3D 접기 미리보기를 함께 만든다.

const A = require('./art');
const { f, polyD } = A;

const INK = '#3B2E2E';
const TAB_FILL = '#F6F2EC';

function centroid(poly) { let x = 0, y = 0; for (const p of poly) { x += p[0]; y += p[1]; } return [x / poly.length, y / poly.length]; }
function rectPoly(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }

// 모서리 a→b 바깥쪽에 붙는 풀칠 날개(사다리꼴)
function tabPoly(a, b, depth, inside) {
  const dx = b[0] - a[0], dy = b[1] - a[1]; const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len; let nx = -uy, ny = ux;
  // inside 쪽 반대로 향하게
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  if ((inside[0] - mx) * nx + (inside[1] - my) * ny > 0) { nx = -nx; ny = -ny; }
  const inset = Math.min(depth * 0.95, len * 0.3);
  return [a, [a[0] + ux * inset + nx * depth, a[1] + uy * inset + ny * depth], [b[0] - ux * inset + nx * depth, b[1] - uy * inset + ny * depth], b];
}

function sameEdge(p, q, a, b, eps = 0.02) {
  const eq = (u, v) => Math.abs(u[0] - v[0]) < eps && Math.abs(u[1] - v[1]) < eps;
  return (eq(p, a) && eq(q, b)) || (eq(p, b) && eq(q, a));
}

// 부품 SVG (부품 자기 좌표). 면 채우기 → 그림(면 모양으로 자르기) → 자르는 선 → 접는 선
function renderPartSvg(part) {
  const id = part.id; let defs = ''; let body = '';
  const hinges = part.panels.filter((p) => p.hinge).map((p) => p.hinge);
  for (const p of part.panels) {
    const d = polyD(p.poly);
    if (p.role === 'tab') {
      body += `<path d="${d}" fill="${TAB_FILL}"/>`;
      if (p.label) {
        const [a, b] = p.hinge; const c = centroid(p.poly);
        let ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len > 9) body += `<text x="${f(c[0])}" y="${f(c[1])}" font-size="2.3" fill="#A79A94" text-anchor="middle" dominant-baseline="central" transform="rotate(${f(ang)} ${f(c[0])} ${f(c[1])})" font-family="Jua, 'Gowun Dodum', sans-serif">풀</text>`;
      }
    } else {
      body += `<path d="${d}" fill="${p.fill || '#FFFFFF'}"/>`;
      if (p.art) {
        const cid = `clip-${id}-${p.id}`;
        defs += `<clipPath id="${cid}"><path d="${d}"/></clipPath>`;
        body += `<g clip-path="url(#${cid})">${p.art}</g>`;
      }
    }
  }
  // 자르는 선: 경첩과 겹치지 않는 모든 모서리
  let cut = '';
  for (const p of part.panels) {
    const n = p.poly.length;
    for (let i = 0; i < n; i++) {
      const a = p.poly[i], b = p.poly[(i + 1) % n];
      if (hinges.some(([h0, h1]) => sameEdge(a, b, h0, h1))) continue;
      cut += `M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}`;
    }
  }
  body += `<path d="${cut}" fill="none" stroke="${INK}" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  let fold = '';
  for (const [a, b] of hinges) fold += `M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}`;
  body += `<path d="${fold}" fill="none" stroke="#7A6A66" stroke-width="0.32" stroke-dasharray="1.6 1.1"/>`;
  return `<defs>${defs}</defs>${body}`;
}

// ── 상자 전개도(가로 띠 모양) ──────────────────────────────
//  [윗면] 은 앞면 위, [아랫면] 은 앞면 아래, 가로로 왼쪽옆·앞·오른쪽옆·뒤.
//  모든 면이 바깥에서 볼 때 바로 서도록 놓인다(뒤집힘 없음).
function buildBox({ id, name, W, H, D, fill, art, tabDepth }) {
  const t = tabDepth;
  const faces = {
    L: { x: 0, y: D, w: D, h: H },
    F: { x: D, y: D, w: W, h: H },
    R: { x: D + W, y: D, w: D, h: H },
    B: { x: 2 * D + W, y: D, w: W, h: H },
    T: { x: D, y: 0, w: W, h: D },
    U: { x: D, y: D + H, w: W, h: D },
  };
  const P = (k) => rectPoly(faces[k].x, faces[k].y, faces[k].w, faces[k].h);
  const r = faces;
  const panels = [
    { id: 'F', role: 'face', poly: P('F'), parent: null, hinge: null, stage: 0, fill, art: art.F(r.F) },
    { id: 'L', role: 'face', poly: P('L'), parent: 'F', hinge: [[D, D], [D, D + H]], stage: 2, fill, art: art.L(r.L) },
    { id: 'R', role: 'face', poly: P('R'), parent: 'F', hinge: [[D + W, D], [D + W, D + H]], stage: 2, fill, art: art.R(r.R) },
    { id: 'B', role: 'face', poly: P('B'), parent: 'R', hinge: [[2 * D + W, D], [2 * D + W, D + H]], stage: 2, fill, art: art.B(r.B) },
    { id: 'T', role: 'face', poly: P('T'), parent: 'F', hinge: [[D, D], [D + W, D]], stage: 3, fill, art: art.T(r.T) },
    { id: 'U', role: 'face', poly: P('U'), parent: 'F', hinge: [[D, D + H], [D + W, D + H]], stage: 3, fill, art: art.U(r.U) },
  ];
  const addTab = (parent, a, b) => {
    const pp = panels.find((p) => p.id === parent);
    panels.push({ id: `${parent}t${panels.length}`, role: 'tab', poly: tabPoly(a, b, t, centroid(pp.poly)), parent, hinge: [a, b], stage: 1, label: true });
  };
  addTab('L', [0, D], [D, D]); addTab('L', [0, D + H], [D, D + H]);
  addTab('R', [D + W, D], [2 * D + W, D]); addTab('R', [D + W, D + H], [2 * D + W, D + H]);
  addTab('B', [2 * D + W, D], [2 * D + 2 * W, D]); addTab('B', [2 * D + W, D + H], [2 * D + 2 * W, D + H]);
  addTab('B', [2 * D + 2 * W, D], [2 * D + 2 * W, D + H]);
  const part = {
    id, name, kind: 'box', W, H, D,
    bw: 2 * W + 2 * D + t, bh: 2 * D + H,
    faces, panels,
    // 접은 뒤 상자 가운데(3D 자기 좌표: X=x, Y=-y, Z)
    anchor: [D + W / 2, -(D + H / 2), -D / 2],
  };
  part.svg = renderPartSvg(part);
  return part;
}

// ── 납작 부품(귀·꼬리). hinge 가 있으면 풀칠 날개를 단다 ─────────
function buildFlat({ id, name, shape, tabDepth, anchorAt = 'hinge' }) {
  const panels = [{ id: 'P', role: 'face', poly: shape.poly, parent: null, hinge: null, stage: 0, fill: shape.fill, art: shape.art }];
  let anchor;
  if (shape.hinge) {
    const [a, b] = shape.hinge;
    panels.push({ id: 'Pt', role: 'tab', poly: tabPoly(a, b, tabDepth, centroid(shape.poly)), parent: 'P', hinge: [a, b], stage: 1, label: true });
    anchor = [(a[0] + b[0]) / 2, -(a[1] + b[1]) / 2, 0];
  } else {
    anchor = [shape.w / 2, -shape.h / 2, 0];
  }
  void anchorAt;
  // 날개까지 포함한 경계 상자로 원점을 옮긴다
  const all = panels.flatMap((p) => p.poly);
  const minX = Math.min(...all.map((p) => p[0])), minY = Math.min(...all.map((p) => p[1]));
  const shift = (pt) => [pt[0] - minX, pt[1] - minY];
  for (const p of panels) { p.poly = p.poly.map(shift); if (p.hinge) p.hinge = p.hinge.map(shift); if (p.art) p.art = `<g transform="translate(${f(-minX)} ${f(-minY)})">${p.art}</g>`; }
  anchor = [anchor[0] - minX, anchor[1] + minY, 0];
  const bw = Math.max(...all.map((p) => p[0])) - minX, bh = Math.max(...all.map((p) => p[1])) - minY;
  const part = { id, name, kind: shape.hinge ? 'flat' : 'patch', bw, bh, panels, anchor, shapeW: shape.w, shapeH: shape.h };
  part.svg = renderPartSvg(part);
  return part;
}

// 스펙 → 부품 목록 + 조립 위치(3D, 단위 mm, 바닥 가운데가 원점, 앞이 +Z)
function buildParts(s, scale = 1) {
  const hd = { w: s.head.w * scale, h: s.head.h * scale, d: s.head.d * scale };
  const bd = { w: s.bodyDims.w * scale, h: s.bodyDims.h * scale, d: s.bodyDims.d * scale };
  const tab = Math.max(4.2, Math.min(6.5, Math.min(hd.w, hd.h, hd.d) * 0.15));
  const parts = [];
  const bodyH = s.body ? bd.h : 0;

  // 귀 모양과 자리
  const earProto = A.earShape(s.ears, hd.w, s, 'L');
  const earCount = earProto ? (s.ears === 'tuft' ? 1 : 2) : 0;
  const earMarks = []; const earPlacements = [];
  if (earProto) {
    const inset = s.ears === 'long' ? hd.w * 0.16 : s.ears === 'koala' ? -earProto.w * 0.12 : hd.w * 0.04;
    const xs = earCount === 1 ? [0] : [-(hd.w / 2 - earProto.w / 2 - inset), hd.w / 2 - earProto.w / 2 - inset];
    const zFront = s.ears === 'koala' ? hd.d * 0.45 : hd.d * 0.3; // 앞 모서리에서 뒤로
    for (const ex of xs) {
      earPlacements.push({ x: ex, y: bodyH + hd.h, z: hd.d / 2 - zFront });
      // 머리 윗면(T) 위 표시: T 는 앞 모서리가 아래쪽
      const halfW = Math.min(earProto.w / 2, hd.w / 2);
      earMarks.push({ type: 'rect', x: hd.w / 2 + ex - halfW, y: hd.d - zFront - tab, w: halfW * 2, h: tab, label: '귀' });
    }
  }

  // 머리
  const headArt = {
    F: (r) => A.headFront(r, s),
    L: (r) => A.headSide(r, s, 'left'),
    R: (r) => A.headSide(r, s, 'right'),
    B: (r) => A.headBack(r, s),
    T: (r) => A.headTop(r, s, earMarks.map((m) => ({ ...m, x: m.x + r.x, y: m.y + r.y }))),
    U: (r) => A.headBottom(r, s, s.body ? [{ type: 'rect', x: r.x + (r.w - bd.w) / 2, y: r.y + (r.h - bd.d) / 2, w: bd.w, h: bd.d, label: '몸통 위에 붙여요' }] : []),
  };
  const head = buildBox({ id: 'head', name: '머리', W: hd.w, H: hd.h, D: hd.d, fill: s.colors.main, art: headArt, tabDepth: tab });
  head.assembly = { pos: [0, bodyH + hd.h / 2, 0], rotY: 0 };
  parts.push(head);

  // 꼬리 모양
  const tail = s.body ? A.tailShape(s.tail, bd.w, s) : null;
  let tailMarks = [];
  if (s.body) {
    const tailY = bd.h * 0.62; // 위에서부터
    if (tail && tail.kind === 'hinge') tailMarks = [{ type: 'rect', x: bd.w / 2 - tab / 2, y: tailY - (tail.hinge ? Math.abs(tail.hinge[0][1] - tail.hinge[1][1]) : 6) / 2, w: tab, h: Math.abs(tail.hinge[0][1] - tail.hinge[1][1]), label: '' }];
    if (tail && tail.kind === 'patch') tailMarks = [{ type: 'circle', cx: bd.w / 2, cy: tailY, r: tail.w / 2, label: '' }];
    const bodyArt = {
      F: (r) => A.bodyFront(r, s),
      L: (r) => A.bodySide(r, s, 'left'),
      R: (r) => A.bodySide(r, s, 'right'),
      B: (r) => A.bodyBack(r, s, tailMarks.map((m) => (m.type === 'rect' ? { ...m, x: m.x + r.x, y: m.y + r.y } : { ...m, cx: m.cx + r.x, cy: m.cy + r.y }))),
      T: (r) => A.bodyTop(r, s, [{ type: 'rect', x: r.x + 1.2, y: r.y + 1.2, w: r.w - 2.4, h: r.h - 2.4, label: '풀칠 → 머리' }]),
      U: (r) => A.bodyBottom(r, s),
    };
    const body = buildBox({ id: 'body', name: '몸통', W: bd.w, H: bd.h, D: bd.d, fill: s.colors.main, art: bodyArt, tabDepth: tab });
    body.assembly = { pos: [0, bd.h / 2, 0], rotY: 0 };
    parts.push(body);
    if (tail) {
      const tp = buildFlat({ id: 'tail', name: '꼬리', shape: tail, tabDepth: Math.min(tab, 5) });
      if (tail.kind === 'hinge') tp.assembly = { pos: [0, bd.h - tailY, -bd.d / 2], rotY: 90 };
      else tp.assembly = { pos: [0, bd.h - tailY, -bd.d / 2 - 0.4], rotY: 180 };
      parts.push(tp);
    }
  }

  earPlacements.forEach((pl, i) => {
    const shape = A.earShape(s.ears, hd.w, s, i ? 'R' : 'L');
    const ep = buildFlat({ id: `ear${i + 1}`, name: earCount === 1 ? '머리 장식' : (i ? '오른쪽 귀' : '왼쪽 귀'), shape, tabDepth: Math.min(tab, 5) });
    ep.assembly = { pos: [pl.x, pl.y, pl.z], rotY: 0 };
    parts.push(ep);
  });

  return { parts, scale, head: hd, body: s.body ? bd : null, tab };
}

module.exports = { buildParts, buildBox, buildFlat, renderPartSvg, centroid };
