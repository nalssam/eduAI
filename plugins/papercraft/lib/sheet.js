'use strict';
// A4 학습지 한 장: 머리띠(제목·이름·범례) + 전개도 배치 + 아래 칸(순서·완성 모습·탐구 활동)

const A = require('./art');
const { buildParts } = require('./parts');
const { f, polyD, el } = A;

const PAGE = { w: 210, h: 297, margin: 8 };
const MAIN = { x: 8, y: 41, w: 194, h: 197 };

// ── MaxRects 배치 ──────────────────────────────────────────
function packRects(items, bin, pad, preferUpright = true) {
  let free = [{ x: bin.x, y: bin.y, w: bin.w, h: bin.h }];
  const placed = [];
  for (const it of items) {
    let best = null;
    for (const rot of it.allowRot ? [0, 90] : [0]) {
      if (best && preferUpright) break; // 돌리지 않고 들어가면 그대로 둔다
      const w = (rot ? it.h : it.w) + pad, h = (rot ? it.w : it.h) + pad;
      for (const fr of free) {
        if (w <= fr.w + 1e-6 && h <= fr.h + 1e-6) {
          const score = [fr.y + h, fr.x]; // 위·왼쪽부터 채우기
          if (!best || score[0] < best.score[0] - 1e-6 || (Math.abs(score[0] - best.score[0]) < 1e-6 && score[1] < best.score[1])) best = { x: fr.x, y: fr.y, w, h, rot, score };
        }
      }
    }
    if (!best) return null;
    placed.push({ id: it.id, x: best.x + pad / 2, y: best.y + pad / 2, rot: best.rot });
    const used = { x: best.x, y: best.y, w: best.w, h: best.h };
    const next = [];
    for (const fr of free) {
      if (used.x >= fr.x + fr.w || used.x + used.w <= fr.x || used.y >= fr.y + fr.h || used.y + used.h <= fr.y) { next.push(fr); continue; }
      if (used.x > fr.x) next.push({ x: fr.x, y: fr.y, w: used.x - fr.x, h: fr.h });
      if (used.x + used.w < fr.x + fr.w) next.push({ x: used.x + used.w, y: fr.y, w: fr.x + fr.w - used.x - used.w, h: fr.h });
      if (used.y > fr.y) next.push({ x: fr.x, y: fr.y, w: fr.w, h: used.y - fr.y });
      if (used.y + used.h < fr.y + fr.h) next.push({ x: fr.x, y: used.y + used.h, w: fr.w, h: fr.y + fr.h - used.y - used.h });
    }
    free = next.filter((a, i) => !next.some((b, j) => j !== i && a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h && (j < i || a.w !== b.w || a.h !== b.h || a.x !== b.x || a.y !== b.y)));
  }
  return { placed, free };
}

function layout(spec) {
  for (let scale = 1.3; scale > 0.35; scale -= 0.02) {
    const build = buildParts(spec, scale);
    const items = build.parts.map((p) => ({ id: p.id, w: p.bw, h: p.bh, allowRot: true }));
    const res = packRects(items, MAIN, 3.2, true) || packRects(items, MAIN, 3.2, false);
    if (res) {
      // 가로 가운데 맞춤
      const right = Math.max(...res.placed.map((pl) => { const p = build.parts.find((q) => q.id === pl.id); return pl.x + (pl.rot ? p.bh : p.bw); }));
      const dx = Math.max(0, (MAIN.x + MAIN.w - right) / 2);
      for (const pl of res.placed) pl.x += dx;
      for (const pl of res.placed) {
        const p = build.parts.find((q) => q.id === pl.id);
        p.place = { x: pl.x, y: pl.y, rot: pl.rot };
      }
      return { build, free: res.free };
    }
  }
  throw new Error('부품이 A4 한 장에 들어가지 않아요. 크기를 줄여 주세요.');
}

function placeTransform(p) {
  const { x, y, rot } = p.place;
  return rot ? `translate(${f(x + p.bh)} ${f(y)}) rotate(90)` : `translate(${f(x)} ${f(y)})`;
}

// 부품 자기 좌표 → 종이 좌표
function toSheet(p, pt) {
  const { x, y, rot } = p.place;
  return rot ? [x + p.bh - pt[1], y + pt[0]] : [x + pt[0], y + pt[1]];
}

// ── 완성 모습(사선 투상) ───────────────────────────────────
function previewSvg(build, s, box) {
  const a = 0.36, b = 0.27;
  const proj = (X, Y, Z) => [X - a * Z, -Y + b * Z];
  const pts = [];
  const boxes = build.parts.filter((p) => p.kind === 'box');
  for (const p of boxes) {
    const c = p.assembly.pos;
    for (const dx of [-1, 1]) for (const dy of [-1, 1]) for (const dz of [-1, 1]) pts.push(proj(c[0] + dx * p.W / 2, c[1] + dy * p.H / 2, c[2] + dz * p.D / 2));
  }
  for (const p of build.parts.filter((q) => q.kind !== 'box')) {
    const c = p.assembly.pos; pts.push(proj(c[0], c[1] + (p.shapeH || 0), c[2]));
    pts.push(proj(c[0] - (p.shapeW || 0) / 2, c[1], c[2]), proj(c[0] + (p.shapeW || 0) / 2, c[1], c[2]));
  }
  const minX = Math.min(...pts.map((q) => q[0])), maxX = Math.max(...pts.map((q) => q[0]));
  const minY = Math.min(...pts.map((q) => q[1])), maxY = Math.max(...pts.map((q) => q[1]));
  const sc = Math.min((box.w - 4) / (maxX - minX), (box.h - 6) / (maxY - minY));
  const ox = box.x + (box.w - (maxX - minX) * sc) / 2 - minX * sc;
  const oy = box.y + (box.h - 2 - (maxY - minY) * sc) / 2 - minY * sc;
  const M = (m) => `matrix(${m.map(f).join(' ')})`;
  let out = '';
  let n = 0;
  const faceG = (w, h, artSvg, fill, m) => {
    const id = `pv${n++}`;
    return `<g transform="${M(m)}"><clipPath id="${id}"><rect width="${f(w)}" height="${f(h)}"/></clipPath><g clip-path="url(#${id})"><rect width="${f(w)}" height="${f(h)}" fill="${fill}"/>${artSvg}</g><rect width="${f(w)}" height="${f(h)}" fill="none" stroke="${s.colors.ink}" stroke-width="${f(0.5 / sc)}" stroke-linejoin="round"/></g>`;
  };
  // 그림자
  const body0 = boxes[boxes.length - 1];
  const g = proj(0, 0, 0);
  out += el.ellipse(ox + g[0] * sc + body0.W * 0.12 * sc, oy + g[1] * sc + 1, body0.W * 0.75 * sc, body0.D * 0.32 * sc, '#000000', 'opacity="0.08"');
  const drawFlat = (p) => {
    const c = p.assembly.pos; const an = p.anchor; const face = p.panels[0];
    let m;
    if (p.assembly.rotY === 90) {
      m = [sc * a, -sc * b, 0, sc, ox + sc * (c[0] - a * c[2] - a * an[0]), oy + sc * (an[1] - c[1] + b * c[2] + b * an[0])];
    } else {
      m = [sc, 0, 0, sc, ox + sc * (c[0] - an[0] - a * c[2]), oy + sc * (an[1] - c[1] + b * c[2])];
    }
    return `<g transform="${M(m)}"><path d="${polyD(face.poly)}" fill="${face.fill}" stroke="${s.colors.ink}" stroke-width="${f(0.5 / sc)}" stroke-linejoin="round"/><clipPath id="pv${n}"><path d="${polyD(face.poly)}"/></clipPath><g clip-path="url(#pv${n++})">${face.art || ''}</g><path d="${polyD(face.poly)}" fill="none" stroke="${s.colors.ink}" stroke-width="${f(0.5 / sc)}" stroke-linejoin="round"/></g>`;
  };
  const tail = build.parts.find((p) => p.id === 'tail' && p.kind === 'flat');
  if (tail) out += drawFlat(tail);
  for (const p of [...boxes].reverse()) {
    const c = p.assembly.pos; const { W, H, D } = p;
    const zf = c[2] + D / 2;
    const art = (k) => { const fr = p.faces[k]; return `<g transform="translate(${f(-fr.x)} ${f(-fr.y)})">${p.panels.find((q) => q.id === k).art || ''}</g>`; };
    out += faceG(W, D, art('T'), p.panels[0].fill, [sc, 0, -sc * a, sc * b, ox + sc * (c[0] - W / 2 - a * (c[2] - D / 2)), oy + sc * (-(c[1] + H / 2) + b * (c[2] - D / 2))]);
    out += faceG(D, H, art('R'), p.panels[0].fill, [sc * a, -sc * b, 0, sc, ox + sc * (c[0] + W / 2 - a * zf), oy + sc * (-(c[1] + H / 2) + b * zf)]);
    out += faceG(W, H, art('F'), p.panels[0].fill, [sc, 0, 0, sc, ox + sc * (c[0] - W / 2 - a * zf), oy + sc * (-(c[1] + H / 2) + b * zf)]);
    if (p.id === 'head') for (const e of build.parts.filter((q) => q.id.startsWith('ear'))) out += drawFlat(e);
  }
  return out;
}

// ── 머리띠·아래 칸 ─────────────────────────────────────────
const FONT_TITLE = "Jua, 'Gowun Dodum', 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
const FONT_BODY = "'Gowun Dodum', Jua, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function text(x, y, t, size, fill, extra = '') { return `<text x="${f(x)}" y="${f(y)}" font-size="${f(size)}" fill="${fill}" ${extra}>${esc(t)}</text>`; }
function sparkle(cx, cy, r, fill) { return el.path(`M${f(cx)},${f(cy - r)}Q${f(cx + r * 0.18)},${f(cy - r * 0.18)} ${f(cx + r)},${f(cy)}Q${f(cx + r * 0.18)},${f(cy + r * 0.18)} ${f(cx)},${f(cy + r)}Q${f(cx - r * 0.18)},${f(cy + r * 0.18)} ${f(cx - r)},${f(cy)}Q${f(cx - r * 0.18)},${f(cy - r * 0.18)} ${f(cx)},${f(cy - r)}Z`, fill); }

function header(s, theme) {
  let o = '';
  const ink = s.colors.ink;
  o += `<rect x="8" y="8" width="118" height="27" rx="6" fill="${theme.soft}"/>`;
  o += text(14, 21.5, s.title, 10.5, ink, `font-family="${FONT_TITLE}"`);
  o += text(14.4, 30, s.subtitle, 3.7, A.shade(ink, -0.25), `font-family="${FONT_BODY}"`);
  o += A.heart(119, 14.5, 2.6, theme.accent);
  o += sparkle(112.5, 12, 1.7, '#FFD45E');
  // 이름 칸
  if (s.nameLine) {
    o += text(131, 15.2, '이름', 3.8, ink, `font-family="${FONT_TITLE}"`);
    o += `<line x1="140" y1="16" x2="202" y2="16" stroke="${ink}" stroke-width="0.3"/>`;
  }
  // 범례
  const ly = 23;
  o += `<rect x="130" y="${ly - 3.6}" width="72" height="15.6" rx="3" fill="#FFFFFF" stroke="${theme.line}" stroke-width="0.35"/>`;
  o += `<line x1="134" y1="${ly}" x2="144" y2="${ly}" stroke="${ink}" stroke-width="0.55"/>` + text(146, ly + 1.2, '자르는 선', 3.1, ink, `font-family="${FONT_BODY}"`);
  o += `<line x1="167" y1="${ly}" x2="177" y2="${ly}" stroke="#7A6A66" stroke-width="0.4" stroke-dasharray="1.6 1.1"/>` + text(179, ly + 1.2, '접는 선', 3.1, ink, `font-family="${FONT_BODY}"`);
  o += `<path d="M134,${ly + 8.6}L135.8,${ly + 5.2}L142.2,${ly + 5.2}L144,${ly + 8.6}Z" fill="#F6F2EC" stroke="${ink}" stroke-width="0.4"/>` + text(146, ly + 8.2, '풀칠하는 날개', 3.1, ink, `font-family="${FONT_BODY}"`);
  o += `<rect x="168" y="${ly + 5.2}" width="9" height="3.4" rx="0.5" fill="#FFFFFF" stroke="#9C8F8F" stroke-width="0.3" stroke-dasharray="0.9 0.7"/>` + text(179, ly + 8.2, '붙이는 자리', 3.1, ink, `font-family="${FONT_BODY}"`);
  return o;
}

function footer(s, build, theme) {
  const y0 = 241, h = 48; let o = '';
  const ink = s.colors.ink;
  const col = [{ x: 8, w: 76 }, { x: 87, w: 46 }, { x: 136, w: 66 }];
  for (const c of col) o += `<rect x="${c.x}" y="${y0}" width="${c.w}" height="${h}" rx="4" fill="${theme.soft}"/>`;
  // 만드는 순서
  o += text(col[0].x + 4, y0 + 7, '✂ 만드는 순서', 4.2, ink, `font-family="${FONT_TITLE}"`);
  const hasEars = build.parts.some((p) => p.id.startsWith('ear'));
  const hasTail = build.parts.some((p) => p.id === 'tail');
  const extra = [hasEars ? '귀' : null, hasTail ? '꼬리' : null].filter(Boolean).join('·');
  const steps = [
    '굵은 실선을 따라 오려요.',
    '점선을 모두 안쪽으로 꾹꾹 접어요.',
    "'풀' 날개에 풀칠해서 상자를 닫아요.",
    build.body ? '머리를 몸통 위에 붙여요.' : '얼굴이 앞을 보게 세워요.',
    extra ? `${extra}를 점선 자리에 붙이면 완성!` : '예쁘게 꾸미면 완성!',
  ];
  steps.forEach((t, i) => {
    const yy = y0 + 14.5 + i * 7;
    o += el.circle(col[0].x + 6.2, yy - 1.1, 2.3, theme.accent) + text(col[0].x + 6.2, yy, String(i + 1), 2.8, '#FFFFFF', `text-anchor="middle" font-family="${FONT_TITLE}"`);
    o += text(col[0].x + 10.2, yy, t, 3.15, ink, `font-family="${FONT_BODY}"`);
  });
  // 완성 모습
  o += text(col[1].x + col[1].w / 2, y0 + 7, '완성 모습', 4.2, ink, `text-anchor="middle" font-family="${FONT_TITLE}"`);
  o += `<rect x="${col[1].x + 3}" y="${y0 + 10}" width="${col[1].w - 6}" height="${h - 13}" rx="3" fill="#FFFFFF"/>`;
  o += previewSvg(build, s, { x: col[1].x + 3, y: y0 + 11, w: col[1].w - 6, h: h - 14 });
  // 탐구 활동
  const cx = col[2].x + 4;
  if (s.activity === 'math') {
    o += text(cx, y0 + 7, '📐 직육면체 탐구', 4.2, ink, `font-family="${FONT_TITLE}"`);
    const q = [
      ['머리 상자의 면은', '개'],
      ['모서리는', '개'],
      ['꼭짓점은', '개'],
      ['서로 마주 보는 면은', '쌍'],
    ];
    q.forEach(([a, b], i) => {
      const yy = y0 + 14.5 + i * 6.4;
      o += text(cx, yy, a, 3.2, ink, `font-family="${FONT_BODY}"`);
      const bx = cx + 41;
      o += `<rect x="${bx}" y="${yy - 3.6}" width="10" height="5" rx="1.2" fill="#FFFFFF" stroke="${theme.line}" stroke-width="0.35"/>`;
      o += text(bx + 11.5, yy, b, 3.2, ink, `font-family="${FONT_BODY}"`);
    });
    o += text(cx, y0 + 41.5, '접었을 때 만나는 모서리끼리', 2.9, A.shade(ink, -0.2), `font-family="${FONT_BODY}"`);
    o += text(cx, y0 + 45.3, '같은 색으로 칠해 보세요!', 2.9, A.shade(ink, -0.2), `font-family="${FONT_BODY}"`);
  } else if (s.activity === 'story') {
    o += text(cx, y0 + 7, '💬 내 친구를 소개해요', 4.2, ink, `font-family="${FONT_TITLE}"`);
    ['이름', '좋아하는 것', '잘하는 것', '하고 싶은 말'].forEach((t, i) => {
      const yy = y0 + 16 + i * 8;
      o += text(cx, yy, t, 3.2, ink, `font-family="${FONT_BODY}"`);
      o += `<line x1="${cx + 21}" y1="${yy + 0.8}" x2="${col[2].x + col[2].w - 4}" y2="${yy + 0.8}" stroke="${theme.line}" stroke-width="0.35"/>`;
    });
  } else {
    o += text(cx, y0 + 7, '💡 꿀팁', 4.2, ink, `font-family="${FONT_TITLE}"`);
    ['두꺼운 종이(180g 이상)에 인쇄해요.', '자를 대고 접으면 반듯해요.', '풀 대신 양면테이프도 좋아요.', '사인펜으로 꾸며 봐도 좋아요.'].forEach((t, i) => {
      o += text(cx, y0 + 15 + i * 7, '• ' + t, 3, ink, `font-family="${FONT_BODY}"`);
    });
  }
  return o;
}

// 빈자리에 작은 장식
function sprinkles(free, theme, seed) {
  let o = ''; let r = seed;
  const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  const spots = free.filter((fr) => fr.w > 12 && fr.h > 12).sort((p, q) => q.w * q.h - p.w * p.h).slice(0, 4);
  for (const fr of spots) {
    const cx = fr.x + fr.w * (0.3 + rnd() * 0.4), cy = fr.y + fr.h * (0.3 + rnd() * 0.4);
    o += rnd() > 0.5 ? A.heart(cx, cy, 2.4, theme.accent, 'opacity="0.55"') : sparkle(cx, cy, 2.4, '#FFD45E');
  }
  return o;
}

function themeFor(s) {
  const accent = A.lum(s.colors.main) > 0.85 || A.lum(s.colors.main) < 0.35 ? '#F28BA6' : A.shade(s.colors.main, 0.08);
  return { soft: A.mix(accent, '#FFFFFF', 0.86), accent, line: A.mix(accent, '#FFFFFF', 0.45) };
}

function makeSheet(spec) {
  const { build, free } = layout(spec);
  const theme = themeFor(spec);
  let parts = '';
  for (const p of build.parts) parts += `<g id="part-${p.id}" transform="${placeTransform(p)}">${p.svg}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE.w} ${PAGE.h}" width="${PAGE.w}mm" height="${PAGE.h}mm">`
    + `<rect width="${PAGE.w}" height="${PAGE.h}" fill="#FFFFFF"/>`
    + header(spec, theme)
    + sprinkles(free, theme, spec.seed)
    + parts
    + footer(spec, build, theme)
    + text(PAGE.w / 2, 294, `완성 크기: 높이 약 ${(((build.body ? build.body.h : 0) + build.head.h) / 10).toFixed(1)}cm · 두꺼운 종이에 실제 크기(100%)로 인쇄하세요`, 2.5, '#A79A94', `text-anchor="middle" font-family="${FONT_BODY}"`)
    + `</svg>`;
  return { svg, build, theme };
}

module.exports = { makeSheet, layout, toSheet, PAGE, MAIN };
