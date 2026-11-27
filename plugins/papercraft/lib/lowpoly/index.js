'use strict';
// 로우폴리 모형 → 전개도 섬(부품) → 학습지 배치용 데이터·SVG.

const { V, faceNormal, quatFromMat } = require('./geom');
const { unfoldMesh, finishIslands, bbox } = require('./unfold');
const { buildLowpolyTiger } = require('./models');
const { f, polyD } = require('../art');

const INK = '#3B2E2E';
const TAB_FILL = '#F6F2EC';
const LIGHT = V.norm([-0.35, 0.8, 0.55]);
const MODELS = { tiger: buildLowpolyTiger };

function shadeOverlay(n) {
  const b = V.dot(n, LIGHT);
  if (b < 0.4) return { fill: '#5A2E10', op: Math.min(0.15, (0.4 - b) * 0.13) };
  return { fill: '#FFFFFF', op: Math.min(0.14, (b - 0.4) * 0.25) };
}

// L(층 좌표) → N(종이 좌표) 아핀 행렬
function affine(L, N) {
  let best = [0, 1, 2], bestA = -1;
  for (let i = 1; i < L.length - 1; i++) for (let j = i + 1; j < L.length; j++) {
    const a = Math.abs((L[i][0] - L[0][0]) * (L[j][1] - L[0][1]) - (L[j][0] - L[0][0]) * (L[i][1] - L[0][1]));
    if (a > bestA) { bestA = a; best = [0, i, j]; }
  }
  const [i0, i1, i2] = best;
  const l1 = [L[i1][0] - L[i0][0], L[i1][1] - L[i0][1]], l2 = [L[i2][0] - L[i0][0], L[i2][1] - L[i0][1]];
  const n1 = [N[i1][0] - N[i0][0], N[i1][1] - N[i0][1]], n2 = [N[i2][0] - N[i0][0], N[i2][1] - N[i0][1]];
  const det = l1[0] * l2[1] - l2[0] * l1[1];
  if (Math.abs(det) < 1e-9) return null;
  const inv = [l2[1] / det, -l2[0] / det, -l1[1] / det, l1[0] / det];
  const a = n1[0] * inv[0] + n2[0] * inv[2], cc = n1[0] * inv[1] + n2[0] * inv[3];
  const b = n1[1] * inv[0] + n2[1] * inv[2], d = n1[1] * inv[1] + n2[1] * inv[3];
  const e = N[i0][0] - a * L[i0][0] - cc * L[i0][1], ff = N[i0][1] - b * L[i0][0] - d * L[i0][1];
  return [a, b, cc, d, e, ff];
}

const sameEdge = (p, q, a, b, eps = 0.02) => {
  const eq = (u, v) => Math.abs(u[0] - v[0]) < eps && Math.abs(u[1] - v[1]) < eps;
  return (eq(p, a) && eq(q, b)) || (eq(p, b) && eq(q, a));
};

function faceArt(T, P, face, pts0, normal, N, clipId) {
  // 면 하나의 그림: 바탕(데칼 층 또는 단색) + 명암 + 풀칠 표시
  let o = `<path d="${polyD(N)}" fill="${face.fill || T.base}"/>`;
  if (!face.fill) {
    const layer = T.layerOf(normal); const lid = T.layerId(P, layer);
    if (lid) {
      const m = affine(pts0.map((p) => T.proj(layer, p)), N);
      if (m) o += `<g clip-path="url(#${clipId})"><use href="#${lid}" transform="matrix(${m.map(f).join(' ')})"/></g>`;
    }
  }
  const sh = shadeOverlay(normal);
  o += `<path d="${polyD(N)}" fill="${sh.fill}" fill-opacity="${f(sh.op)}"/>`;
  return o;
}

function buildParts(spec, scale = 1) {
  const T = (MODELS[spec.preset] || buildLowpolyTiger)(spec);
  const seamIds = { next: 1 };
  const parts = [];
  const tabDepth = Math.max(3, Math.min(5, 5 * scale));
  for (const P of T.model) {
    const m0 = P.mesh;
    const mesh = { verts: m0.verts.map((v) => V.mul(v, scale)), faces: m0.faces };
    const U = unfoldMesh(mesh, { rootScore: (fc) => (P.kind === 'head' && fc.cap === 'end' ? 1 : 0) });
    const isls = finishIslands(mesh, U, { tabDepth, seamIds, upright: (fc) => P.kind === 'head' && fc.cap === 'end' });
    isls.forEach((isl, ii) => {
      const allPts = [...isl.faces.flatMap((fi) => U.placed[fi].pts), ...isl.tabs.flatMap((t) => t.poly)];
      const bb = bbox(allPts); const minX = bb[0], maxY = bb[3];
      const S = (p) => [p[0] - minX, maxY - p[1]];
      const d = [-minX, -maxY, 0];
      const shiftFrame = (fr) => { const R = fr.R; const Rd = [R[0] * d[0] + R[1] * d[1], R[3] * d[0] + R[4] * d[1], R[6] * d[0] + R[7] * d[1]]; return { R, T: V.sub(fr.T, Rd) }; };
      const frames = {}; for (const fi of isl.faces) frames[fi] = shiftFrame(isl.frames[fi]);
      const id = isls.length > 1 ? `${P.id}${ii + 1}` : P.id;
      const name = isls.length > 1 ? `${P.name} ${ii + 1}` : P.name;
      const panels = []; let svg = ''; let defs = '';
      const hinges = [];
      // 면
      for (const fi of isl.faces) {
        const face = mesh.faces[fi];
        const N = U.placed[fi].pts.map(S);
        const tr = isl.tree.find((t) => t.child === fi);
        panels.push({ id: `f${fi}`, role: 'face', stage: 2, poly: N, parent: tr ? `f${tr.parent}` : null, hinge: tr ? tr.hinge.map(S) : null, angle: tr ? tr.angle : null });
        if (tr) hinges.push({ a: S(tr.hinge[0]), b: S(tr.hinge[1]), valley: tr.angle < -1 });
        const clipId = `c-${id}-${fi}`;
        defs += `<clipPath id="${clipId}"><path d="${polyD(N)}"/></clipPath>`;
        const pts0 = face.v.map((i) => m0.verts[i]);
        svg += faceArt(T, P, face, pts0, U.normals[fi], N, clipId);
        if (face.glue) {
          svg += `<path d="${polyD(N)}" fill="url(#pc-hatch)"/>`;
          const cc = N.reduce((s, p) => [s[0] + p[0] / N.length, s[1] + p[1] / N.length], [0, 0]);
          svg += `<text x="${f(cc[0])}" y="${f(cc[1] + 0.8)}" font-size="2.1" text-anchor="middle" fill="#6E5F5A" stroke="#fff" stroke-width="0.6" paint-order="stroke" font-family="Jua, sans-serif">풀칠</text>`;
        }
        // 이 면에 붙는 부속 자리
        for (const g of T.glue.filter((q) => q.host === P.id && q.face === fi)) {
          const fr = frames[fi]; const R = fr.R;
          const poly = g.poly3.map((p) => { const w = V.sub(V.mul(p, scale), fr.T); return S([R[0] * w[0] + R[3] * w[1] + R[6] * w[2] + minX, R[1] * w[0] + R[4] * w[1] + R[7] * w[2] + maxY]); });
          svg += `<path d="${polyD(poly)}" fill="#FFFFFF" fill-opacity="0.35" stroke="#5C4A44" stroke-width="0.3" stroke-dasharray="0.9 0.7"/>`;
          const cc = poly.reduce((s, p) => [s[0] + p[0] / poly.length, s[1] + p[1] / poly.length], [0, 0]);
          svg += `<text x="${f(cc[0])}" y="${f(cc[1] + 0.7)}" font-size="1.9" text-anchor="middle" fill="#5C4A44" stroke="#fff" stroke-width="0.5" paint-order="stroke" font-family="Jua, sans-serif">${g.label}</text>`;
        }
      }
      // 날개
      isl.tabs.forEach((t, j) => {
        const poly = t.poly.map(S); const h = t.hinge.map(S);
        panels.push({ id: `t${j}`, role: 'tab', stage: 1, poly, parent: `f${t.face}`, hinge: h, angle: t.angle });
        hinges.push({ a: h[0], b: h[1], tab: true });
        svg += `<path d="${polyD(poly)}" fill="${TAB_FILL}"/>`;
        const cc = poly.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]);
        svg += `<text x="${f(cc[0])}" y="${f(cc[1] + 0.65)}" font-size="1.8" text-anchor="middle" fill="#8E7F78" font-family="Jua, sans-serif">${t.no}</text>`;
      });
      // 짝 번호
      for (const nb of isl.numbers) {
        const a = S(nb.a), b = S(nb.b); const N = U.placed[nb.face].pts.map(S);
        const cc = N.reduce((s, p) => [s[0] + p[0] / N.length, s[1] + p[1] / N.length], [0, 0]);
        const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; const dv = [cc[0] - mid[0], cc[1] - mid[1]]; const dl = Math.hypot(dv[0], dv[1]) || 1;
        const off = Math.min(1.7, dl * 0.45); const p = [mid[0] + dv[0] / dl * off, mid[1] + dv[1] / dl * off];
        svg += `<text x="${f(p[0])}" y="${f(p[1] + 0.6)}" font-size="1.7" text-anchor="middle" fill="${INK}" stroke="#fff" stroke-width="0.45" paint-order="stroke" font-family="Jua, sans-serif">${nb.no}</text>`;
      }
      // 선
      let cut = '', fold = '', valley = '';
      for (const p of panels) {
        const n = p.poly.length;
        for (let i = 0; i < n; i++) {
          const a = p.poly[i], b = p.poly[(i + 1) % n];
          if (hinges.some((h) => sameEdge(a, b, h.a, h.b))) continue;
          cut += `M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}`;
        }
      }
      for (const h of hinges) { const seg = `M${f(h.a[0])},${f(h.a[1])}L${f(h.b[0])},${f(h.b[1])}`; if (h.valley) valley += seg; else fold += seg; }
      svg += `<path d="${fold}" fill="none" stroke="#6E5F5A" stroke-width="0.28" stroke-dasharray="1.3 0.9"/>`;
      if (valley) svg += `<path d="${valley}" fill="none" stroke="#2F6FA8" stroke-width="0.3" stroke-dasharray="2 0.7 0.4 0.7"/>`;
      svg += `<path d="${cut}" fill="none" stroke="${INK}" stroke-width="0.42" stroke-linecap="round" stroke-linejoin="round"/>`;
      const root = isl.faces[0]; const fr = frames[root];
      parts.push({
        id, name, kind: 'island', group: P.id,
        bw: bb[2] - bb[0], bh: bb[3] - bb[1],
        panels, anchor: [0, 0, 0],
        assembly: { pos: fr.T, quat: quatFromMat(fr.R), rotY: 0 },
        svg: `<defs>${defs}</defs>${svg}`,
        faceCount: isl.faces.length,
      });
    });
  }
  const order = (id) => { const g = id.replace(/\d+$/, ''); const i = T.assemblyOrder.indexOf(g); return i < 0 ? 99 : i; };
  parts.sort((p, q) => q.bw * q.bh - p.bw * p.bh);
  const head = T.model[0].mesh;
  const counts = { 3: 0, 4: 0, 8: 0, other: 0 }; head.faces.forEach((fc) => { const n = fc.v.length; if (counts[n] != null) counts[n]++; else counts.other++; });
  const build = {
    style: 'lowpoly', parts, scale, heightMm: T.height * scale,
    head: { h: T.height * scale }, body: null,
    defs: `<pattern id="pc-hatch" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.6" height="1.6" fill="#FFFFFF" fill-opacity="0.45"/><line x1="0" y1="0" x2="0" y2="1.6" stroke="#9C8F8F" stroke-width="0.35"/></pattern>` + Object.values(T.defs).join(''),
    assemblyRank: order,
    steps: [
      '굵은 실선을 따라 조각을 모두 오려요.',
      '회색 점선은 바깥으로, 파란 선은 안으로 접어요.',
      '같은 번호끼리 날개에 풀칠해 붙여요.',
      '다리·앞발·꼬리·귀를 점선 자리에 붙여요.',
      '머리를 몸통 위에 붙이면 완성!',
    ],
    math: {
      title: '📐 다면체 탐구',
      rows: [['머리 조각의 면은 모두', '개'], ['그중 삼각형 면은', '개'], ['사각형 면은', '개'], ['팔각형 면은', '개']],
      answers: { faces: head.faces.length, tri: counts[3], quad: counts[4], oct: counts[8] },
      note: ['평평한 면이 많을수록', '공 모양에 가까워져요!'],
    },
    previewSvg: (box, ink) => previewSvg(T, box, ink),
  };
  return build;
}

// 완성 모습: 면마다 같은 그림을 투영해 화가 알고리즘으로 그린다
function previewSvg(T, box, ink) {
  const yaw = 28 * Math.PI / 180, pitch = 14 * Math.PI / 180;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const view = (p) => { const x = p[0] * cy + p[2] * sy; const z1 = -p[0] * sy + p[2] * cy; return [x, p[1] * cp - z1 * sp, p[1] * sp + z1 * cp]; };
  const items = [];
  for (const P of T.model) {
    const m = P.mesh;
    m.faces.forEach((face, fi) => {
      const pts = face.v.map((i) => m.verts[i]); const n = faceNormal(pts); const vn = view(n);
      if (vn[2] <= 0.02) return;
      const vp = pts.map(view);
      items.push({ P, face, pts, n, vp, depth: vp.reduce((s, q) => s + q[2], 0) / vp.length + (face.glue ? -50 : 0) });
    });
  }
  const all = items.flatMap((it) => it.vp);
  const minX = Math.min(...all.map((q) => q[0])), maxX = Math.max(...all.map((q) => q[0]));
  const minY = Math.min(...all.map((q) => -q[1])), maxY = Math.max(...all.map((q) => -q[1]));
  const sc = Math.min((box.w - 4) / (maxX - minX), (box.h - 4) / (maxY - minY));
  const ox = box.x + (box.w - (maxX - minX) * sc) / 2 - minX * sc, oy = box.y + (box.h - (maxY - minY) * sc) / 2 - minY * sc;
  items.sort((a, b) => a.depth - b.depth);
  let o = `<ellipse cx="${f(ox)}" cy="${f(oy + 0.5)}" rx="${f(38 * sc)}" ry="${f(10 * sc)}" fill="#000" opacity="0.08"/>`;
  items.forEach((it, i) => {
    if (it.face.glue) return;
    const N = it.vp.map((q) => [ox + q[0] * sc, oy - q[1] * sc]);
    const id = `pvl${i}`;
    o += `<clipPath id="${id}"><path d="${polyD(N)}"/></clipPath>`;
    o += faceArt(T, it.P, it.face, it.pts, it.n, N, id).replace(/<path d="([^"]+)" fill="#2A1A10"/, '<path d="$1" fill="#2A1A10"');
    o += `<path d="${polyD(N)}" fill="none" stroke="${ink}" stroke-opacity="0.18" stroke-width="0.12" stroke-linejoin="round"/>`;
  });
  return o;
}

module.exports = { buildParts, MODELS };
