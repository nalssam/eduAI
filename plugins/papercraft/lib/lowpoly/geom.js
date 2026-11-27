'use strict';
// 3D 벡터·다면체 메시 도구. 메시 = { verts:[[x,y,z]], faces:[{v:[i..], fill?, layer?, glue?}] }
// 좌표계: X 오른쪽, Y 위, Z 앞(보는 사람 쪽). 면 꼭짓점은 바깥에서 볼 때 반시계.

const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
  avg: (pts) => { const s = [0, 0, 0]; for (const p of pts) { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; } return [s[0] / pts.length, s[1] / pts.length, s[2] / pts.length]; },
};

function faceNormal(pts) {
  // Newell 법
  let n = [0, 0, 0];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    n = V.add(n, [(a[1] - b[1]) * (a[2] + b[2]), (a[2] - b[2]) * (a[0] + b[0]), (a[0] - b[0]) * (a[1] + b[1])]);
  }
  return V.norm(n);
}

function planarError(pts) {
  const n = faceNormal(pts); const c = V.avg(pts);
  let size = 0; for (const p of pts) size = Math.max(size, V.len(V.sub(p, c)));
  let e = 0; for (const p of pts) e = Math.max(e, Math.abs(V.dot(V.sub(p, c), n)));
  return e / (size || 1);
}

// 고리(ring)들을 이어 붙여 닫힌 메시를 만든다. rings[i] = 같은 개수의 점 배열.
// 옆면 사각형이 평평하지 않으면 삼각형 두 개로 나눈다.
function loft(rings, { capStart = true, capEnd = true, apexEnd = null, tag = {} } = {}) {
  const verts = []; const faces = []; const n = rings[0].length;
  const idx = rings.map((r) => r.map((p) => { verts.push(p); return verts.length - 1; }));
  const centers = rings.map((r) => V.avg(r));
  const orient = (vs, outHint) => { const n0 = faceNormal(vs.map((i) => verts[i])); return V.dot(n0, outHint) >= 0 ? vs : vs.slice().reverse(); };
  const sideFaces = [];
  for (let r = 0; r < rings.length - 1; r++) {
    sideFaces[r] = [];
    for (let k = 0; k < n; k++) {
      const a = idx[r][k], b = idx[r][(k + 1) % n], c = idx[r + 1][(k + 1) % n], d = idx[r + 1][k];
      const pts = [a, b, c, d].map((i) => verts[i]);
      const axisC = V.lerp(centers[r], centers[r + 1], 0.5);
      const hint = V.sub(V.avg(pts), axisC);
      if (planarError(pts) < 0.015) {
        faces.push({ v: orient([a, b, c, d], hint), ring: r, slot: k, ...tag }); sideFaces[r][k] = faces.length - 1;
      } else {
        // 짧은 대각선으로 나눈다
        const dAC = V.len(V.sub(verts[a], verts[c])), dBD = V.len(V.sub(verts[b], verts[d]));
        const tris = dAC < dBD ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
        for (const t of tris) faces.push({ v: orient(t, hint), ring: r, slot: k, ...tag });
        sideFaces[r][k] = -1;
      }
    }
  }
  const last = rings.length - 1;
  const startHint = rings.length > 1 ? V.sub(centers[0], centers[1]) : V.sub(centers[0], apexEnd);
  const capS = capStart ? (faces.push({ v: orient(idx[0].slice(), startHint), cap: 'start', ...tag }), faces.length - 1) : -1;
  let capE = -1;
  if (apexEnd) {
    verts.push(apexEnd); const ai = verts.length - 1;
    for (let k = 0; k < n; k++) faces.push({ v: orient([idx[last][k], idx[last][(k + 1) % n], ai], V.sub(V.avg([verts[idx[last][k]], verts[idx[last][(k + 1) % n]], apexEnd]), centers[last])), ring: last, slot: k, apex: true, ...tag });
  } else if (capEnd) {
    faces.push({ v: orient(idx[last].slice(), V.sub(centers[last], centers[last - 1])), cap: 'end', ...tag }); capE = faces.length - 1;
  }
  return { verts, faces, sideFaces, capStart: capS, capEnd: capE, rings: idx };
}

// 평면 위 타원 고리: center + e1*rx*cos + e2*ry*sin
function ring(center, e1, e2, rx, ry, n, phase = Math.PI / n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = phase + (i / n) * Math.PI * 2;
    out.push(V.add(center, V.add(V.mul(e1, rx * Math.cos(t)), V.mul(e2, ry * Math.sin(t)))));
  }
  return out;
}

function facePts(mesh, f) { return mesh.faces[f].v.map((i) => mesh.verts[i]); }

// 메시의 한 면(호스트) 위에서 시작해 밖으로 뻗는 부속(다리·귀·꼬리) 고리를 만든다.
function sprout(host, hostFace, { shrink = 0.8, steps = [], apex = null }) {
  const base = facePts(host, hostFace); const c = V.avg(base); const n = faceNormal(base);
  // 호스트 면과 같은 평면, 가운데로 줄인 바닥 고리(붙이는 면). 바깥에서 본 반시계 → 새 메시 안쪽으로 향하게 뒤집힘은 loft 가 처리
  const r0 = base.map((p) => V.add(c, V.mul(V.sub(p, c), shrink)));
  const rings = [r0];
  let prevC = c;
  for (const st of steps) {
    // st: { out, move:[x,y,z], scale }
    const nc = V.add(V.add(prevC, V.mul(n, st.out || 0)), st.move || [0, 0, 0]);
    rings.push(r0.map((p) => V.add(nc, V.mul(V.sub(p, c), st.scale ?? 1))));
    prevC = nc;
  }
  const apexPt = apex ? V.add(V.add(prevC, V.mul(n, apex.out || 0)), apex.move || [0, 0, 0]) : null;
  return { rings, apex: apexPt, base: r0, normal: n };
}

// 회전행렬(3x3, 행 우선) → 쿼터니언 [x,y,z,w]
function quatFromMat(m) {
  const [m00, m01, m02, m10, m11, m12, m20, m21, m22] = m;
  const tr = m00 + m11 + m22; let x, y, z, w;
  if (tr > 0) { const s = 0.5 / Math.sqrt(tr + 1); w = 0.25 / s; x = (m21 - m12) * s; y = (m02 - m20) * s; z = (m10 - m01) * s; }
  else if (m00 > m11 && m00 > m22) { const s = 2 * Math.sqrt(1 + m00 - m11 - m22); w = (m21 - m12) / s; x = 0.25 * s; y = (m01 + m10) / s; z = (m02 + m20) / s; }
  else if (m11 > m22) { const s = 2 * Math.sqrt(1 + m11 - m00 - m22); w = (m02 - m20) / s; x = (m01 + m10) / s; y = 0.25 * s; z = (m12 + m21) / s; }
  else { const s = 2 * Math.sqrt(1 + m22 - m00 - m11); w = (m10 - m01) / s; x = (m02 + m20) / s; y = (m12 + m21) / s; z = 0.25 * s; }
  return [x, y, z, w];
}

module.exports = { V, faceNormal, planarError, loft, ring, facePts, sprout, quatFromMat };
