'use strict';
// 다면체 메시를 겹치지 않는 전개도 섬(island)들로 펼친다.
// - 평평한 모서리(이면각이 작은 곳)부터 이어 붙여 큰 섬을 만든다
// - 겹치면 그 면은 다음 섬으로 넘긴다
// - 이어 붙이지 않은 모서리(이음선)마다 풀칠 날개를 단다(겹치지 않는 쪽으로)
// - 접는 각도를 정확히 계산해 3D 미리보기에서 그대로 다시 접을 수 있게 한다

const { V, faceNormal, quatFromMat } = require('./geom');

const P2 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
  add: (a, b) => [a[0] + b[0], a[1] + b[1]],
  mul: (a, s) => [a[0] * s, a[1] * s],
  len: (a) => Math.hypot(a[0], a[1]),
  rot: (a, c, s) => [a[0] * c - a[1] * s, a[0] * s + a[1] * c],
};

function polyArea2(pts) { let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }

// 볼록 다각형 겹침(분리축). 살짝 줄여서 모서리만 닿는 건 겹침이 아니다.
function shrink(pts, d) {
  const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length], [0, 0]);
  return pts.map((p) => { const v = P2.sub(p, c); const l = P2.len(v) || 1; return P2.add(c, P2.mul(v, Math.max(0, (l - d) / l))); });
}
function overlapConvex(A, B) {
  for (const poly of [A, B]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const nx = -(b[1] - a[1]), ny = b[0] - a[0];
      let minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity;
      for (const p of A) { const d = p[0] * nx + p[1] * ny; if (d < minA) minA = d; if (d > maxA) maxA = d; }
      for (const p of B) { const d = p[0] * nx + p[1] * ny; if (d < minB) minB = d; if (d > maxB) maxB = d; }
      if (maxA <= minB || maxB <= minA) return false;
    }
  }
  return true;
}
function bbox(pts) { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[0] > x1) x1 = p[0]; if (p[1] > y1) y1 = p[1]; } return [x0, y0, x1, y1]; }
function boxHit(a, b) { return !(a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1]); }

// 면 하나를 자기 평면 2D 좌표(반시계 유지)로
function localCoords(pts) {
  const n = faceNormal(pts); const e1 = V.norm(V.sub(pts[1], pts[0])); const e2 = V.cross(n, e1);
  return pts.map((p) => { const d = V.sub(p, pts[0]); return [V.dot(d, e1), V.dot(d, e2)]; });
}

// 로컬 좌표 L 을 두 점(La→Pa, Lb→Pb)에 맞추는 회전+이동
function alignTo(L, ia, ib, Pa, Pb) {
  const la = L[ia], lb = L[ib];
  const ang = Math.atan2(Pb[1] - Pa[1], Pb[0] - Pa[0]) - Math.atan2(lb[1] - la[1], lb[0] - la[0]);
  const c = Math.cos(ang), s = Math.sin(ang);
  return L.map((p) => P2.add(Pa, P2.rot(P2.sub(p, la), c, s)));
}

// net3(z=0 평면) → 모형 3D 강체변환. Q: 2D 넷 좌표(y 위), P: 3D
function frameOf(Q, P, n) {
  const un = V.norm([Q[1][0] - Q[0][0], Q[1][1] - Q[0][1], 0]); const wn = [-un[1], un[0], 0]; const zn = [0, 0, 1];
  const um = V.norm(V.sub(P[1], P[0])); const wm = V.cross(n, um);
  const R = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R.push(um[i] * un[j] + wm[i] * wn[j] + n[i] * zn[j]);
  const q0 = [Q[0][0], Q[0][1], 0];
  const Rq = [R[0] * q0[0] + R[1] * q0[1], R[3] * q0[0] + R[4] * q0[1], R[6] * q0[0] + R[7] * q0[1]];
  return { R, T: V.sub(P[0], Rq) };
}
function foldAngle(Rp, Rc, a, b) {
  // R_rel = Rp^T Rc, 경첩 축 u=(b-a), w = Z×u
  const u = V.norm([b[0] - a[0], b[1] - a[1], 0]); const w = [-u[1], u[0], 0];
  const Rcw = [Rc[0] * w[0] + Rc[1] * w[1] + Rc[2] * w[2], Rc[3] * w[0] + Rc[4] * w[1] + Rc[5] * w[2], Rc[6] * w[0] + Rc[7] * w[1] + Rc[8] * w[2]];
  const rel = [Rp[0] * Rcw[0] + Rp[3] * Rcw[1] + Rp[6] * Rcw[2], Rp[1] * Rcw[0] + Rp[4] * Rcw[1] + Rp[7] * Rcw[2], Rp[2] * Rcw[0] + Rp[5] * Rcw[1] + Rp[8] * Rcw[2]];
  return Math.atan2(rel[2], rel[0] * w[0] + rel[1] * w[1]) * 180 / Math.PI;
}

function unfoldMesh(mesh, { rootScore = () => 0, maxIsland = 175, compact = 6 } = {}) {
  const F = mesh.faces.length;
  const pts3 = mesh.faces.map((f) => f.v.map((i) => mesh.verts[i]));
  const normals = pts3.map(faceNormal);
  const local = pts3.map(localCoords);
  const area = local.map((L) => Math.abs(polyArea2(L)));
  // 모서리 → 양쪽 면
  const edges = new Map();
  mesh.faces.forEach((f, fi) => f.v.forEach((v, k) => {
    const w = f.v[(k + 1) % f.v.length]; const key = v < w ? `${v}_${w}` : `${w}_${v}`;
    if (!edges.has(key)) edges.set(key, []); edges.get(key).push({ f: fi, k });
  }));
  for (const [key, list] of edges) if (list.length !== 2) throw new Error(`메시가 닫혀 있지 않아요 (모서리 ${key}: ${list.length})`);
  const other = (fi, k) => { const f = mesh.faces[fi]; const v = f.v[k], w = f.v[(k + 1) % f.v.length]; const key = v < w ? `${v}_${w}` : `${w}_${v}`; return edges.get(key).find((e) => e.f !== fi); };

  const placed = new Array(F).fill(null); // { island, pts(net3) }
  const islands = [];
  const remaining = new Set(mesh.faces.map((_, i) => i));
  while (remaining.size) {
    let root = null, best = -Infinity;
    for (const fi of remaining) { const s = area[fi] + rootScore(mesh.faces[fi], fi) * 1e4; if (s > best) { best = s; root = fi; } }
    const isl = { faces: [], tree: [] }; islands.push(isl);
    const put = (fi, pts, parent, hinge) => {
      placed[fi] = { island: islands.length - 1, pts, parent, hinge }; isl.faces.push(fi); remaining.delete(fi);
      if (parent != null) isl.tree.push({ parent, child: fi, hinge });
    };
    put(root, local[root], null, null);
    let frontier = [];
    const cen = (pts) => pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
    const rootC = cen(local[root]);
    const pushEdges = (fi) => mesh.faces[fi].v.forEach((_, k) => {
      const o = other(fi, k); if (placed[o.f]) return;
      const fpts = placed[fi].pts; const n = fpts.length; const gn = mesh.faces[o.f].v.length;
      const cand = alignTo(local[o.f], (o.k + 1) % gn, o.k, fpts[k], fpts[(k + 1) % n]);
      const dih = Math.acos(Math.max(-1, Math.min(1, V.dot(normals[fi], normals[o.f]))));
      frontier.push({ from: fi, k, to: o.f, ok: o.k, cost: P2.len(P2.sub(cen(cand), rootC)) + dih * compact });
    });
    pushEdges(root);
    const islandBox = () => bbox(isl.faces.flatMap((fi) => placed[fi].pts));
    while (frontier.length) {
      frontier.sort((p, q) => p.cost - q.cost);
      const e = frontier.shift();
      if (placed[e.to]) continue;
      const fpts = placed[e.from].pts; const n = mesh.faces[e.from].v.length;
      const Pa = fpts[e.k], Pb = fpts[(e.k + 1) % n];
      // 이웃 면에서 같은 모서리는 반대 방향: g.v[ok] = b, g.v[ok+1] = a
      const gn = mesh.faces[e.to].v.length;
      const cand = alignTo(local[e.to], (e.ok + 1) % gn, e.ok, Pa, Pb);
      const cs = shrink(cand, 0.08); const cb = bbox(cs);
      let hit = false;
      for (const fi of isl.faces) { const p = placed[fi].pts; if (boxHit(cb, bbox(p)) && overlapConvex(cs, shrink(p, 0.08))) { hit = true; break; } }
      if (!hit) { const b = islandBox(); const nb = bbox([...cand, [b[0], b[1]], [b[2], b[3]]]); if (nb[2] - nb[0] > maxIsland && nb[3] - nb[1] > maxIsland * 0.7) hit = true; }
      if (hit) continue;
      put(e.to, cand, e.from, [Pa, Pb]);
      pushEdges(e.to);
    }
  }
  return { islands, placed, edges, normals, pts3, other, area };
}

// 섬 하나를 가장 작은 경계 상자가 되게 돌리고 원점으로 옮긴 뒤, 3D 정보(접는 각·날개)를 붙인다.
function finishIslands(mesh, U, { tabDepth = 4.5, seamIds, upright = () => false } = {}) {
  const { islands, placed, normals, pts3, other } = U;
  const out = [];
  islands.forEach((isl, ii) => {
    // 회전 고르기
    const all = isl.faces.flatMap((fi) => placed[fi].pts);
    let bestA = 0, bestS = Infinity;
    for (let d = 0; d < 180; d += 5) {
      const a = d * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      const b = bbox(all.map((p) => P2.rot(p, c, s))); const w = b[2] - b[0], h = b[3] - b[1];
      const score = w * h + Math.max(0, w - h) * 0.5; // 비슷하면 세로로 긴 쪽
      if (score < bestS) { bestS = score; bestA = a; }
    }
    const root = isl.faces[0];
    if (upright(mesh.faces[root], root)) {
      const R = frameOf(placed[root].pts, pts3[root], normals[root]).R;
      const v = [R[3], R[4]]; // R^T · (0,1,0) 의 x,y
      bestA = Math.PI / 2 - Math.atan2(v[1], v[0]);
    }
    const c = Math.cos(bestA), s = Math.sin(bestA);
    for (const fi of isl.faces) placed[fi].pts = placed[fi].pts.map((p) => P2.rot(p, c, s));
    for (const t of isl.tree) t.hinge = t.hinge.map((p) => P2.rot(p, c, s));
    // 각 면의 3D 틀
    const frames = {};
    for (const fi of isl.faces) frames[fi] = frameOf(placed[fi].pts, pts3[fi], normals[fi]);
    out.push({ index: ii, faces: isl.faces, tree: isl.tree, frames, tabs: [], numbers: [] });
  });
  // 이음선과 날개
  const islandOf = (fi) => placed[fi].island;
  const treeSet = new Set();
  for (const isl of out) for (const t of isl.tree) treeSet.add(`${Math.min(t.parent, t.child)}_${Math.max(t.parent, t.child)}_${t.hinge[0][0].toFixed(3)}`);
  const isTree = (f, g) => out[islandOf(f)].tree.some((t) => (t.parent === f && t.child === g) || (t.parent === g && t.child === f));
  const done = new Set();
  let seamNo = seamIds ? seamIds.next : 1;
  mesh.faces.forEach((face, fi) => face.v.forEach((_, k) => {
    const o = other(fi, k); const key = [Math.min(fi, o.f), Math.max(fi, o.f), Math.min(face.v[k], face.v[(k + 1) % face.v.length])].join('_');
    if (done.has(key)) return; done.add(key);
    if (islandOf(fi) === islandOf(o.f) && isTree(fi, o.f)) return;
    const sides = [{ f: fi, k }, { f: o.f, k: o.k }];
    const len = P2.len(P2.sub(placed[fi].pts[(k + 1) % face.v.length], placed[fi].pts[k]));
    let made = false; const no = seamNo++;
    for (const depthMul of [1, 0.6]) {
      for (const sd of sides) {
        const isl = out[islandOf(sd.f)]; const pts = placed[sd.f].pts; const n = pts.length;
        const a = pts[sd.k], b = pts[(sd.k + 1) % n];
        const u = P2.mul(P2.sub(b, a), 1 / len); const nOut = [u[1], -u[0]]; // 반시계 다각형의 바깥쪽
        const d = Math.min(tabDepth, Math.max(2.2, len * 0.32)) * depthMul; const inset = Math.min(d * 0.9, len * 0.3);
        const tab = [a, P2.add(P2.add(a, P2.mul(u, inset)), P2.mul(nOut, d)), P2.add(P2.sub(b, P2.mul(u, inset)), P2.mul(nOut, d)), b];
        const ts = shrink(tab, 0.06); const tb = bbox(ts);
        let hit = false;
        for (const g of isl.faces) { const p = placed[g].pts; if (boxHit(tb, bbox(p)) && overlapConvex(ts, shrink(p, 0.06))) { hit = true; break; } }
        if (!hit) for (const t of isl.tabs) if (boxHit(tb, bbox(t.poly)) && overlapConvex(ts, shrink(t.poly, 0.06))) { hit = true; break; }
        if (hit) continue;
        // 날개가 접히는 각: 짝 면을 이 모서리에 붙였다고 치고 계산
        const pr = sd === sides[0] ? sides[1] : sides[0];
        const gn = mesh.faces[pr.f].v.length;
        const virt = alignTo(localCoords(pts3[pr.f]), (pr.k + 1) % gn, pr.k, a, b);
        const Rv = frameOf(virt, pts3[pr.f], normals[pr.f]).R;
        const ang = foldAngle(isl.frames[sd.f].R, Rv, a, b);
        isl.tabs.push({ poly: tab, face: sd.f, hinge: [a, b], angle: ang * 1.05, no });
        // 짝 모서리 쪽에 같은 번호
        const ppts = placed[pr.f].pts; const pa = ppts[pr.k], pb = ppts[(pr.k + 1) % gn];
        out[islandOf(pr.f)].numbers.push({ face: pr.f, a: pa, b: pb, no });
        made = true; break;
      }
      if (made) break;
    }
    if (!made) {
      out[islandOf(fi)].numbers.push({ face: fi, a: placed[fi].pts[k], b: placed[fi].pts[(k + 1) % face.v.length], no });
      const pr = sides[1]; const gp = placed[pr.f].pts;
      out[islandOf(pr.f)].numbers.push({ face: pr.f, a: gp[pr.k], b: gp[(pr.k + 1) % gp.length], no });
    }
  }));
  if (seamIds) seamIds.next = seamNo;
  // 접는 각
  for (const isl of out) for (const t of isl.tree) t.angle = foldAngle(isl.frames[t.parent].R, isl.frames[t.child].R, t.hinge[0], t.hinge[1]);
  return out;
}

module.exports = { unfoldMesh, finishIslands, bbox, polyArea2, quatFromMat };
