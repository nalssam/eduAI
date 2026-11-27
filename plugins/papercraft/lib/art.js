'use strict';
// 귀염 스타일 그림 조각들. 모든 좌표는 mm. 각 함수는 SVG 문자열을 돌려준다.
// 레퍼런스에서 뽑은 규칙: 파스텔 단색 면, 크고 반짝이는 검은 눈(흰 하이라이트 2개),
// 분홍 볼터치와 빗금 3개, ω 입, 결 무늬는 끝이 가늘어지는 줄, 발바닥 젤리.

const f = (n) => (Math.round(n * 100) / 100).toString();

function hex2rgb(h) { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgb2hex(r, g, b) { return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
function shade(c, t) { return t >= 0 ? mix(c, '#000000', t) : mix(c, '#FFFFFF', -t); }
function lum(c) { const [r, g, b] = hex2rgb(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }

const el = {
  ellipse: (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`,
  circle: (cx, cy, r, fill, extra = '') => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" ${extra}/>`,
  path: (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`,
  stroke: (d, color, w, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`,
};

function polyD(pts, close = true) {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])},${f(p[1])}`).join('') + (close ? 'Z' : '');
}

// 끝이 가늘어지는 결 무늬 한 줄: (x0,y0)에서 (ux,uy) 방향으로 len 만큼, 굵기 wd.
function stripe(x0, y0, ux, uy, len, wd, fill) {
  const nx = -uy, ny = ux;
  const ax = x0 + nx * wd / 2, ay = y0 + ny * wd / 2;
  const bx = x0 - nx * wd / 2, by = y0 - ny * wd / 2;
  const tx = x0 + ux * len, ty = y0 + uy * len;
  const c1x = ax + ux * len * 0.65, c1y = ay + uy * len * 0.65;
  const c2x = bx + ux * len * 0.65, c2y = by + uy * len * 0.65;
  return el.path(`M${f(ax)},${f(ay)}Q${f(c1x)},${f(c1y)} ${f(tx)},${f(ty)}Q${f(c2x)},${f(c2y)} ${f(bx)},${f(by)}Z`, fill);
}

// ── 얼굴 부품 ─────────────────────────────────────────────
function eye(style, ex, ey, r, ink, ring) {
  let s = '';
  if (ring) s += el.ellipse(ex, ey, r * 1.35, r * 1.45, '#FFFFFF');
  if (style === 'happy') {
    return s + el.stroke(`M${f(ex - r)},${f(ey + r * 0.35)}Q${f(ex)},${f(ey - r * 1.25)} ${f(ex + r)},${f(ey + r * 0.35)}`, ink, r * 0.42);
  }
  if (style === 'dot') {
    return s + el.ellipse(ex, ey, r * 0.62, r * 0.72, ink) + el.circle(ex + r * 0.2, ey - r * 0.25, r * 0.2, '#FFFFFF');
  }
  s += el.ellipse(ex, ey, r, r * 1.12, ink);
  s += el.circle(ex + r * 0.3, ey - r * 0.38, r * 0.38, '#FFFFFF');
  s += el.circle(ex - r * 0.36, ey + r * 0.42, r * 0.17, '#FFFFFF');
  return s;
}

function blush(cx, cy, k, color) {
  let s = el.ellipse(cx, cy, 3.6 * k, 2.2 * k, color, 'opacity="0.8"');
  for (let i = -1; i <= 1; i++) {
    const x = cx + i * 1.3 * k;
    s += el.stroke(`M${f(x - 0.35 * k)},${f(cy + 0.8 * k)}L${f(x + 0.45 * k)},${f(cy - 0.8 * k)}`, '#FFFFFF', 0.32 * k, 'opacity="0.9"');
  }
  return s;
}

function nose(type, cx, ny, k, s) {
  const ink = s.colors.ink;
  switch (type) {
    case 'cat':
      return el.path(`M${f(cx - 1.4 * k)},${f(ny - 0.5 * k)}Q${f(cx)},${f(ny - 1.1 * k)} ${f(cx + 1.4 * k)},${f(ny - 0.5 * k)}Q${f(cx + 0.5 * k)},${f(ny + 0.9 * k)} ${f(cx)},${f(ny + 1 * k)}Q${f(cx - 0.5 * k)},${f(ny + 0.9 * k)} ${f(cx - 1.4 * k)},${f(ny - 0.5 * k)}Z`, '#F08CA0');
    case 'button':
      return el.ellipse(cx, ny, 2.5 * k, 1.8 * k, ink) + el.ellipse(cx - 0.7 * k, ny - 0.6 * k, 0.8 * k, 0.45 * k, '#FFFFFF', 'opacity="0.85"');
    case 'koala':
      return el.ellipse(cx, ny + 1 * k, 4.4 * k, 5.4 * k, ink) + el.ellipse(cx - 1.4 * k, ny - 1.4 * k, 1.2 * k, 0.8 * k, '#FFFFFF', 'opacity="0.7"');
    case 'beak': {
      const c = s.colors.beak || '#F4A83A';
      return el.path(`M${f(cx - 3.2 * k)},${f(ny)}L${f(cx)},${f(ny - 2 * k)}L${f(cx + 3.2 * k)},${f(ny)}L${f(cx)},${f(ny + 2.8 * k)}Z`, c, `stroke="${shade(c, 0.25)}" stroke-width="${f(0.3 * k)}" stroke-linejoin="round"`)
        + el.stroke(`M${f(cx - 3.2 * k)},${f(ny)}L${f(cx + 3.2 * k)},${f(ny)}`, shade(c, 0.3), 0.3 * k);
    }
    default: return '';
  }
}

function mouth(type, cx, my, k, ink) {
  switch (type) {
    case 'w':
      return el.stroke(`M${f(cx - 2.8 * k)},${f(my)}Q${f(cx - 1.4 * k)},${f(my + 2 * k)} ${f(cx)},${f(my + 0.1 * k)}Q${f(cx + 1.4 * k)},${f(my + 2 * k)} ${f(cx + 2.8 * k)},${f(my)}`, ink, 0.55 * k);
    case 'smile':
      return el.stroke(`M${f(cx - 2.6 * k)},${f(my)}Q${f(cx)},${f(my + 2.8 * k)} ${f(cx + 2.6 * k)},${f(my)}`, ink, 0.55 * k);
    case 'open':
      return el.path(`M${f(cx - 2.4 * k)},${f(my)}Q${f(cx)},${f(my + 0.4 * k)} ${f(cx + 2.4 * k)},${f(my)}Q${f(cx)},${f(my + 4 * k)} ${f(cx - 2.4 * k)},${f(my)}Z`, '#7A3B3B')
        + el.ellipse(cx, my + 1.9 * k, 1.3 * k, 0.8 * k, '#F08CA0');
    default: return '';
  }
}

// 머리 앞면(얼굴)
function headFront(r, s) {
  const { x, y, w, h } = r; const k = w / 52; const c = s.colors; const ink = c.ink;
  const cx = x + w / 2; const ey = y + h * 0.5; const edx = w * 0.22; const er = 3.9 * k;
  let o = '';
  // 무늬(얼굴 뒤 바탕)
  if (s.headPattern === 'tabby') {
    o += stripe(cx, y - 0.5, 0, 1, h * 0.26, 4.4 * k, c.accent);
    o += stripe(cx - 7.5 * k, y - 0.5, 0, 1, h * 0.2, 3.6 * k, c.accent);
    o += stripe(cx + 7.5 * k, y - 0.5, 0, 1, h * 0.2, 3.6 * k, c.accent);
  } else if (s.headPattern === 'spots') {
    o += el.ellipse(x + w * 0.16, y + h * 0.16, 4 * k, 3 * k, c.accent) + el.ellipse(x + w * 0.86, y + h * 0.12, 3 * k, 2.4 * k, c.accent);
  } else if (s.headPattern === 'tuft') {
    o += el.path(`M${f(cx - 5 * k)},${f(y)}Q${f(cx - 2 * k)},${f(y + 7 * k)} ${f(cx)},${f(y + 2 * k)}Q${f(cx + 3 * k)},${f(y + 8 * k)} ${f(cx + 5 * k)},${f(y)}Z`, c.accent);
  }
  let ring = false;
  switch (s.mask) {
    case 'muzzle':
      o += el.ellipse(cx, ey + h * 0.2, w * 0.17, h * 0.135, c.light); break;
    case 'hamster':
      o += el.ellipse(cx, y + h * 0.98, w * 0.56, h * 0.42, c.light); break;
    case 'fox':
      o += el.path(`M${f(x)},${f(y + h * 0.52)}C${f(x + w * 0.22)},${f(y + h * 0.56)} ${f(cx - w * 0.12)},${f(y + h * 0.55)} ${f(cx)},${f(y + h * 0.66)}C${f(cx + w * 0.12)},${f(y + h * 0.55)} ${f(x + w * 0.78)},${f(y + h * 0.56)} ${f(x + w)},${f(y + h * 0.52)}L${f(x + w)},${f(y + h)}L${f(x)},${f(y + h)}Z`, c.light);
      break;
    case 'raccoon':
      o += el.path(`M${f(x + w * 0.05)},${f(ey - h * 0.02)}Q${f(cx - edx)},${f(ey - h * 0.22)} ${f(cx)},${f(ey - h * 0.06)}Q${f(cx + edx)},${f(ey - h * 0.22)} ${f(x + w * 0.95)},${f(ey - h * 0.02)}Q${f(cx + edx)},${f(ey + h * 0.2)} ${f(cx)},${f(ey + h * 0.08)}Q${f(cx - edx)},${f(ey + h * 0.2)} ${f(x + w * 0.05)},${f(ey - h * 0.02)}Z`, c.accent);
      o += el.ellipse(cx, ey + h * 0.24, w * 0.2, h * 0.15, c.light);
      o += el.ellipse(cx - edx, ey - h * 0.24, w * 0.08, h * 0.05, c.light) + el.ellipse(cx + edx, ey - h * 0.24, w * 0.08, h * 0.05, c.light);
      ring = true; break;
    case 'panda':
      o += el.ellipse(cx - edx, ey + 0.6 * k, 5.8 * k, 7.4 * k, c.accent, `transform="rotate(28 ${f(cx - edx)} ${f(ey)})"`);
      o += el.ellipse(cx + edx, ey + 0.6 * k, 5.8 * k, 7.4 * k, c.accent, `transform="rotate(-28 ${f(cx + edx)} ${f(ey)})"`);
      ring = true; break;
    case 'penguin':
      o += el.ellipse(cx - w * 0.17, ey + h * 0.02, w * 0.25, h * 0.33, c.light) + el.ellipse(cx + w * 0.17, ey + h * 0.02, w * 0.25, h * 0.33, c.light);
      o += el.ellipse(cx, ey + h * 0.28, w * 0.3, h * 0.24, c.light);
      break;
    default: break;
  }
  // 눈·볼·코·입
  const leftStyle = s.eyes === 'wink' ? 'sparkle' : s.eyes; const rightStyle = s.eyes === 'wink' ? 'happy' : s.eyes;
  o += eye(leftStyle, cx - edx, ey, er, ink, ring) + eye(rightStyle, cx + edx, ey, er, ink, ring);
  if (s.blush) o += blush(cx - w * 0.31, ey + h * 0.15, k, c.cheek) + blush(cx + w * 0.31, ey + h * 0.15, k, c.cheek);
  const ny = ey + h * 0.1;
  o += nose(s.nose, cx, ny, k, s);
  const my = s.nose === 'koala' ? ny + 6.6 * k : s.nose === 'button' ? ny + 1.6 * k : ny + 1.1 * k;
  o += mouth(s.mouth, cx, my, k, ink);
  if (s.whiskers) {
    for (const sd of [-1, 1]) {
      const bx = cx + sd * w * 0.4;
      o += el.stroke(`M${f(bx)},${f(ey + h * 0.06)}L${f(bx + sd * 4 * k)},${f(ey + h * 0.03)}`, ink, 0.4 * k);
      o += el.stroke(`M${f(bx)},${f(ey + h * 0.11)}L${f(bx + sd * 4 * k)},${f(ey + h * 0.13)}`, ink, 0.4 * k);
    }
  }
  if (s.accessory === 'bow') o += bow(x + w * 0.82, y + h * 0.14, k * 0.9);
  if (s.accessory === 'flower') o += flower(x + w * 0.83, y + h * 0.15, k * 0.9);
  return o;
}

function bow(cx, cy, k, color = '#F58FA8') {
  const d = shade(color, 0.18);
  return el.path(`M${f(cx)},${f(cy)}L${f(cx - 5 * k)},${f(cy - 3.4 * k)}Q${f(cx - 6.4 * k)},${f(cy)} ${f(cx - 5 * k)},${f(cy + 3.4 * k)}Z`, color, `stroke="${d}" stroke-width="${f(0.35 * k)}" stroke-linejoin="round"`)
    + el.path(`M${f(cx)},${f(cy)}L${f(cx + 5 * k)},${f(cy - 3.4 * k)}Q${f(cx + 6.4 * k)},${f(cy)} ${f(cx + 5 * k)},${f(cy + 3.4 * k)}Z`, color, `stroke="${d}" stroke-width="${f(0.35 * k)}" stroke-linejoin="round"`)
    + el.circle(cx, cy, 1.5 * k, d);
}

function flower(cx, cy, k) {
  let o = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    o += el.circle(cx + Math.cos(a) * 2.4 * k, cy + Math.sin(a) * 2.4 * k, 1.9 * k, '#F9A8C0', `stroke="#E5839F" stroke-width="${f(0.25 * k)}"`);
  }
  return o + el.circle(cx, cy, 1.5 * k, '#FFD45E');
}

function heart(cx, cy, size, fill, extra = '') {
  const s = size;
  return el.path(`M${f(cx)},${f(cy + s * 0.9)}C${f(cx - s * 1.3)},${f(cy + s * 0.1)} ${f(cx - s * 0.9)},${f(cy - s * 0.9)} ${f(cx)},${f(cy - s * 0.35)}C${f(cx + s * 0.9)},${f(cy - s * 0.9)} ${f(cx + s * 1.3)},${f(cy + s * 0.1)} ${f(cx)},${f(cy + s * 0.9)}Z`, fill, extra);
}

function pawPrint(cx, cy, k, fill) {
  return el.ellipse(cx, cy + 1.2 * k, 2.6 * k, 2.1 * k, fill)
    + el.ellipse(cx - 2.6 * k, cy - 1.4 * k, 0.95 * k, 1.2 * k, fill) + el.ellipse(cx - 0.9 * k, cy - 2.5 * k, 0.95 * k, 1.2 * k, fill)
    + el.ellipse(cx + 0.9 * k, cy - 2.5 * k, 0.95 * k, 1.2 * k, fill) + el.ellipse(cx + 2.6 * k, cy - 1.4 * k, 0.95 * k, 1.2 * k, fill);
}

// 앞발(배 위에 모은 손)
function paw(cx, cy, k, fill, ink) {
  return el.ellipse(cx, cy, 3.4 * k, 2.8 * k, fill, `stroke="${shade(fill, 0.22)}" stroke-width="${f(0.35 * k)}"`)
    + el.stroke(`M${f(cx - 1)},${f(cy - 2.6 * k)}L${f(cx - 1)},${f(cy - 1.4 * k)}M${f(cx + 1)},${f(cy - 2.6 * k)}L${f(cx + 1)},${f(cy - 1.4 * k)}`, shade(fill, 0.3), 0.3 * k);
}

function foot(cx, by, k, fill, light) {
  return el.path(`M${f(cx - 4.6 * k)},${f(by)}Q${f(cx - 4.8 * k)},${f(by - 5 * k)} ${f(cx)},${f(by - 5.2 * k)}Q${f(cx + 4.8 * k)},${f(by - 5 * k)} ${f(cx + 4.6 * k)},${f(by)}Z`, fill, `stroke="${shade(fill, 0.22)}" stroke-width="${f(0.35 * k)}"`)
    + el.ellipse(cx, by - 1.9 * k, 1.7 * k, 1.3 * k, light)
    + el.circle(cx - 2.1 * k, by - 3.6 * k, 0.55 * k, light) + el.circle(cx, by - 4.2 * k, 0.55 * k, light) + el.circle(cx + 2.1 * k, by - 3.6 * k, 0.55 * k, light);
}

// 머리 윗면(앞쪽 모서리가 아래)
function headTop(r, s, marks = []) {
  const { x, y, w, h } = r; const k = w / 52; const c = s.colors; let o = '';
  if (s.headPattern === 'tabby') {
    for (const dx of [-7.5, 0, 7.5]) o += stripe(x + w / 2 + dx * k, y - 0.5, 0, 1, h * (dx ? 0.75 : 0.95), (dx ? 3.6 : 4.4) * k, c.accent);
  } else if (s.headPattern === 'spots') {
    o += el.ellipse(x + w * 0.3, y + h * 0.4, 4 * k, 3 * k, c.accent) + el.ellipse(x + w * 0.7, y + h * 0.65, 3 * k, 2.2 * k, c.accent);
  }
  if (s.mask === 'penguin' || s.preset === 'panda') { /* 단색 */ }
  o += glueMarks(marks, k);
  return o;
}

function glueMarks(marks, k) {
  let o = '';
  for (const m of marks) {
    if (m.type === 'rect') {
      o += `<rect x="${f(m.x)}" y="${f(m.y)}" width="${f(m.w)}" height="${f(m.h)}" rx="0.6" fill="#FFFFFF" fill-opacity="0.4" stroke="#9C8F8F" stroke-width="0.25" stroke-dasharray="0.9 0.7"/>`;
    } else if (m.type === 'circle') {
      o += el.circle(m.cx, m.cy, m.r, '#FFFFFF', 'fill-opacity="0.4" stroke="#9C8F8F" stroke-width="0.25" stroke-dasharray="0.9 0.7"');
    }
    if (m.label) o += `<text x="${f(m.lx ?? (m.x + m.w / 2))}" y="${f(m.ly ?? (m.y + m.h / 2 + 0.9))}" font-size="${f(Math.max(1.9, 2.3 * k))}" text-anchor="middle" fill="#8A7C7C" font-family="Jua, 'Gowun Dodum', sans-serif">${m.label}</text>`;
  }
  return o;
}

// 머리 옆면. back: 'left' | 'right' (뒤쪽 모서리가 어느 쪽인지)
function headSide(r, s, back) {
  const { x, y, w, h } = r; const k = h / 44; const c = s.colors; let o = '';
  const bx = back === 'left' ? x - 0.5 : x + w + 0.5; const dir = back === 'left' ? 1 : -1;
  if (s.headPattern === 'tabby') {
    o += stripe(bx, y + h * 0.3, dir, 0, w * 0.55, 3.8 * k, c.accent);
    o += stripe(bx, y + h * 0.5, dir, 0, w * 0.65, 4.2 * k, c.accent);
    o += stripe(bx, y + h * 0.7, dir, 0, w * 0.5, 3.6 * k, c.accent);
  }
  if (s.mask === 'fox' || s.mask === 'hamster') {
    o += el.path(`M${f(x)},${f(y + h * 0.62)}Q${f(x + w / 2)},${f(y + h * 0.5)} ${f(x + w)},${f(y + h * 0.62)}L${f(x + w)},${f(y + h)}L${f(x)},${f(y + h)}Z`, c.light);
  }
  if (s.mask === 'raccoon') {
    const fx = back === 'left' ? x + w : x; // 앞쪽 모서리
    o += el.path(`M${f(fx)},${f(y + h * 0.4)}Q${f(fx - dir * w * 0.4)},${f(y + h * 0.48)} ${f(fx)},${f(y + h * 0.6)}Z`, c.accent);
  }
  return o;
}

function headBack(r, s) {
  const { x, y, w, h } = r; const k = w / 52; const c = s.colors; let o = '';
  if (s.headPattern === 'tabby') {
    for (const yy of [0.3, 0.52, 0.74]) {
      o += stripe(x - 0.5, y + h * yy, 1, 0, w * 0.26, 3.8 * k, c.accent);
      o += stripe(x + w + 0.5, y + h * yy, -1, 0, w * 0.26, 3.8 * k, c.accent);
    }
    o += stripe(x + w / 2, y - 0.5, 0, 1, h * 0.3, 4.4 * k, c.accent);
  } else if (s.headPattern === 'spots') {
    o += el.ellipse(x + w * 0.35, y + h * 0.4, 5 * k, 3.6 * k, c.accent) + el.ellipse(x + w * 0.65, y + h * 0.65, 3.4 * k, 2.6 * k, c.accent);
  }
  if (s.accessory === 'bow' || s.accessory === 'flower') o += heart(x + w * 0.5, y + h * 0.82, 1.6 * k, c.cheek, 'opacity="0.7"');
  return o;
}

function headBottom(r, s, marks) {
  return glueMarks(marks || [], r.w / 52);
}

// 몸통 앞면
function bodyFront(r, s) {
  const { x, y, w, h } = r; const k = w / 38; const c = s.colors; const ink = c.ink; let o = '';
  const cx = x + w / 2;
  switch (s.bodyPattern) {
    case 'belly': case 'heart':
      o += el.ellipse(cx, y + h * 0.62, w * 0.3, h * 0.4, c.light); break;
    case 'bib':
      o += el.path(`M${f(cx - w * 0.3)},${f(y)}L${f(cx + w * 0.3)},${f(y)}L${f(cx + w * 0.18)},${f(y + h * 0.4)}L${f(cx + w * 0.09)},${f(y + h * 0.32)}L${f(cx)},${f(y + h * 0.58)}L${f(cx - w * 0.09)},${f(y + h * 0.32)}L${f(cx - w * 0.18)},${f(y + h * 0.4)}Z`, c.light); break;
    case 'tuxedo':
      o += el.ellipse(cx, y + h * 0.56, w * 0.36, h * 0.52, c.light); break;
    case 'panda':
      o += `<rect x="${f(x - 0.5)}" y="${f(y - 0.5)}" width="${f(w + 1)}" height="${f(h * 0.36)}" fill="${c.accent}"/>`;
      o += el.ellipse(cx, y + h * 0.36, w * 0.3, h * 0.1, c.accent);
      break;
    case 'tabby':
      o += el.ellipse(cx, y + h * 0.62, w * 0.28, h * 0.38, c.light);
      o += stripe(x - 0.5, y + h * 0.35, 1, 0, w * 0.16, 3 * k, c.accent) + stripe(x + w + 0.5, y + h * 0.35, -1, 0, w * 0.16, 3 * k, c.accent);
      break;
    default: break;
  }
  if (s.bodyPattern === 'heart') o += heart(cx, y + h * 0.6, 3.2 * k, c.cheek);
  // 발
  const footFill = s.bodyPattern === 'panda' ? c.accent : s.preset === 'penguin' || s.preset === 'chick' ? (c.beak || '#F4A83A') : c.main;
  const footLight = s.bodyPattern === 'panda' ? '#6B6466' : s.preset === 'penguin' || s.preset === 'chick' ? shade(c.beak || '#F4A83A', -0.35) : c.inner;
  o += foot(cx - w * 0.22, y + h + 0.3, k, footFill, footLight) + foot(cx + w * 0.22, y + h + 0.3, k, footFill, footLight);
  // 앞발(손)
  if (s.preset !== 'penguin' && s.preset !== 'chick') {
    const pf = s.bodyPattern === 'panda' ? c.accent : c.main;
    if (s.accessory === 'seed') {
      o += el.ellipse(cx, y + h * 0.42, 2.4 * k, 3.6 * k, '#5A4A3E') + el.stroke(`M${f(cx)},${f(y + h * 0.42 - 2.6 * k)}L${f(cx)},${f(y + h * 0.42 + 2.6 * k)}`, '#E9E1D2', 0.45 * k);
      o += paw(cx - 3.6 * k, y + h * 0.45, k * 0.85, pf, ink) + paw(cx + 3.6 * k, y + h * 0.45, k * 0.85, pf, ink);
    } else {
      o += paw(cx - w * 0.2, y + h * 0.38, k, pf, ink) + paw(cx + w * 0.2, y + h * 0.38, k, pf, ink);
    }
  }
  if (s.accessory === 'scarf') {
    o += `<rect x="${f(x - 0.5)}" y="${f(y - 0.5)}" width="${f(w + 1)}" height="${f(5.5 * k)}" fill="#E8485A"/>`;
    o += el.path(`M${f(x + w * 0.66)},${f(y + 4 * k)}L${f(x + w * 0.84)},${f(y + 4 * k)}L${f(x + w * 0.88)},${f(y + 14 * k)}L${f(x + w * 0.7)},${f(y + 13 * k)}Z`, '#D63A4C');
    o += el.stroke(`M${f(x)},${f(y + 2.4 * k)}L${f(x + w)},${f(y + 2.4 * k)}`, '#FFFFFF', 0.4 * k, 'stroke-dasharray="1 1.2" opacity="0.8"');
  }
  if (s.accessory === 'bow' && s.bodyPattern !== 'panda') o += bow(cx, y + 2.6 * k, k * 0.7, '#7FC4E8');
  if (s.accessory === 'heart') o += heart(cx, y + h * 0.18, 2.4 * k, c.cheek);
  return o;
}

function bodySide(r, s, back) {
  const { x, y, w, h } = r; const k = h / 30; const c = s.colors; let o = '';
  const dir = back === 'left' ? 1 : -1; const bx = back === 'left' ? x - 0.5 : x + w + 0.5;
  if (s.bodyPattern === 'panda') o += `<rect x="${f(x - 0.5)}" y="${f(y - 0.5)}" width="${f(w + 1)}" height="${f(h * 0.36)}" fill="${c.accent}"/>`;
  if (s.bodyPattern === 'tabby' || s.headPattern === 'tabby') {
    o += stripe(bx, y + h * 0.35, dir, 0, w * 0.6, 3.6 * k, c.accent);
    o += stripe(bx, y + h * 0.62, dir, 0, w * 0.5, 3.2 * k, c.accent);
  }
  if (s.preset === 'penguin') {
    const fx = x + w / 2;
    o += el.path(`M${f(fx - 3 * k)},${f(y + h * 0.12)}Q${f(fx + 4 * k)},${f(y + h * 0.3)} ${f(fx + 1 * k)},${f(y + h * 0.86)}Q${f(fx - 4 * k)},${f(y + h * 0.5)} ${f(fx - 3 * k)},${f(y + h * 0.12)}Z`, shade(c.main, 0.25));
  }
  if (s.bodyPattern === 'wing') {
    const fx = x + w / 2;
    o += el.path(`M${f(fx - 5 * k)},${f(y + h * 0.3)}Q${f(fx + 6 * k)},${f(y + h * 0.25)} ${f(fx + 5 * k)},${f(y + h * 0.62)}Q${f(fx + 1 * k)},${f(y + h * 0.6)} ${f(fx - 1 * k)},${f(y + h * 0.75)}Q${f(fx - 5 * k)},${f(y + h * 0.6)} ${f(fx - 5 * k)},${f(y + h * 0.3)}Z`, c.accent);
  }
  return o;
}

function bodyBack(r, s, marks) {
  const { x, y, w, h } = r; const k = w / 38; const c = s.colors; let o = '';
  if (s.bodyPattern === 'panda') o += `<rect x="${f(x - 0.5)}" y="${f(y - 0.5)}" width="${f(w + 1)}" height="${f(h * 0.36)}" fill="${c.accent}"/>`;
  if (s.bodyPattern === 'tabby' || s.headPattern === 'tabby') {
    o += stripe(x - 0.5, y + h * 0.3, 1, 0, w * 0.25, 3.2 * k, c.accent) + stripe(x + w + 0.5, y + h * 0.3, -1, 0, w * 0.25, 3.2 * k, c.accent);
  }
  if (s.accessory === 'scarf') o += `<rect x="${f(x - 0.5)}" y="${f(y - 0.5)}" width="${f(w + 1)}" height="${f(5.5 * k)}" fill="#E8485A"/>`;
  o += glueMarks(marks || [], k);
  return o;
}

function bodyTop(r, s, marks) {
  const { x, y, w, h } = r; const k = w / 38; const c = s.colors; let o = '';
  if (s.bodyPattern === 'panda') o += `<rect x="${f(x - 0.5)}" y="${f(y - 0.5)}" width="${f(w + 1)}" height="${f(h + 1)}" fill="${c.accent}"/>`;
  if (s.accessory === 'scarf') o += `<rect x="${f(x - 0.5)}" y="${f(y + h - 5.5 * k)}" width="${f(w + 1)}" height="${f(5.5 * k + 0.5)}" fill="#E8485A"/>`;
  return o + glueMarks(marks || [], k);
}

function bodyBottom(r, s) {
  const { x, y, w, h } = r; const k = w / 38;
  return pawPrint(x + w / 2, y + h / 2, k * 1.1, mix(s.colors.main, '#F08CA0', 0.45));
}

// ── 납작 부품 모양(귀·꼬리) ─────────────────────────────────
// 각 모양은 { w, h, poly, hinge:[a,b] (탭이 붙는 직선 모서리), art } 를 돌려준다.
function sampleQuad(p0, c, p1, n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n; const u = 1 - t;
    out.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]);
  }
  return out;
}

function earShape(type, W, s, side) {
  const c = s.colors; const ec = s.earColor || c.main; const ink = c.ink;
  let w, h, poly, art = '';
  const clipSafe = (pts) => polyD(pts);
  switch (type) {
    case 'cat': case 'fox': {
      w = W * 0.34; h = type === 'fox' ? W * 0.4 : W * 0.31;
      const mk = (sx, sy, ox, oy) => {
        const p0 = [ox, oy + h * sy]; const tip = [ox + w * sx * 0.5, oy];
        const pts = [p0, ...sampleQuad(p0, [ox + w * sx * 0.1, oy + h * sy * 0.35], [ox + w * sx * 0.42, oy + h * sy * 0.06], 8),
          ...sampleQuad([ox + w * sx * 0.42, oy + h * sy * 0.06], tip, [ox + w * sx * 0.58, oy + h * sy * 0.06], 5).slice(0),
          ...sampleQuad([ox + w * sx * 0.58, oy + h * sy * 0.06], [ox + w * sx * 0.9, oy + h * sy * 0.35], [ox + w * sx, oy + h * sy], 8)];
        return pts;
      };
      poly = mk(1, 1, 0, 0);
      const inner = poly.map(([px, py]) => [w / 2 + (px - w / 2) * 0.58, h + (py - h) * 0.66]);
      if (type === 'fox') {
        art += `<path d="${clipSafe(poly)}" fill="${c.accent}"/>`;
        const lower = poly.map(([px, py]) => [w / 2 + (px - w / 2) * 1.0, h + (py - h) * 0.62]);
        art += `<path d="${clipSafe(lower)}" fill="${ec}"/>`;
        art += `<path d="${clipSafe(inner)}" fill="${c.inner}"/>`;
      } else {
        art += `<path d="${clipSafe(inner)}" fill="${c.inner}"/>`;
        if (s.headPattern === 'tabby') art += stripe(w / 2, h + 0.5, 0, -1, h * 0.28, 3 * (W / 52), c.accent);
      }
      break;
    }
    case 'round': case 'frog': {
      const r = type === 'frog' ? W * 0.17 : W * 0.15; w = 2 * r; h = r * 1.6; const cx = r, cy = r;
      const a0 = Math.asin(0.6); poly = [];
      for (let i = 0; i <= 28; i++) { const t = a0 - (i / 28) * (Math.PI + 2 * a0); poly.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
      // 마지막 점은 왼쪽 아래, 처음 점은 오른쪽 아래 → 시계 방향으로 맞춰 뒤집기
      poly.reverse();
      if (type === 'frog') {
        art += el.circle(cx, cy + r * 0.1, r * 0.72, '#FFFFFF') + el.circle(cx, cy + r * 0.2, r * 0.42, ink) + el.circle(cx + r * 0.15, cy, r * 0.15, '#FFFFFF');
      } else {
        art += el.circle(cx, cy + r * 0.12, r * 0.56, c.inner);
      }
      break;
    }
    case 'koala': {
      const r = W * 0.21; w = 2 * r; h = r * 1.7; const cx = r, cy = r;
      const a0 = Math.asin(0.7); poly = [];
      for (let i = 0; i <= 48; i++) {
        const t = a0 - (i / 48) * (Math.PI + 2 * a0);
        const rr = r * (0.93 + 0.07 * Math.abs(Math.sin(t * 6)));
        poly.push([cx + rr * Math.cos(t), cy + rr * Math.sin(t)]);
      }
      poly.reverse();
      poly[0] = [cx - r * Math.cos(a0), cy + r * 0.7]; poly[poly.length - 1] = [cx + r * Math.cos(a0), cy + r * 0.7];
      h = cy + r * 0.7;
      art += el.circle(cx, cy + r * 0.1, r * 0.6, c.inner);
      break;
    }
    case 'long': {
      w = W * 0.25; h = W * 0.6; const cx = w / 2; const ry = h * 0.56; const cy = ry; const rx = w / 2;
      const a0 = Math.asin((h - cy) / ry); poly = [];
      for (let i = 0; i <= 30; i++) { const t = a0 - (i / 30) * (Math.PI + 2 * a0); poly.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]); }
      poly.reverse();
      poly[0] = [poly[0][0], h]; poly[poly.length - 1] = [poly[poly.length - 1][0], h];
      art += el.ellipse(cx, cy + h * 0.06, rx * 0.5, ry * 0.72, c.inner);
      break;
    }
    case 'tuft': {
      w = W * 0.3; h = W * 0.24;
      poly = [[0, h], ...sampleQuad([0, h], [w * 0.05, h * 0.35], [w * 0.28, h * 0.22], 5), ...sampleQuad([w * 0.28, h * 0.22], [w * 0.35, h * 0.5], [w * 0.42, h * 0.45], 3),
        ...sampleQuad([w * 0.42, h * 0.45], [w * 0.4, 0], [w * 0.62, 0.02], 5), ...sampleQuad([w * 0.62, 0.02], [w * 0.55, h * 0.4], [w * 0.62, h * 0.48], 3),
        ...sampleQuad([w * 0.62, h * 0.48], [w * 0.85, h * 0.25], [w, h * 0.35], 4), ...sampleQuad([w, h * 0.35], [w * 0.9, h * 0.6], [w, h], 4)];
      break;
    }
    default: return null;
  }
  // 바닥 모서리는 poly 의 마지막 점 → 첫 점 (왼쪽 아래 → ... ) 이 되도록 정리
  const a = [Math.min(...poly.map((p) => p[0])), h];
  poly = poly.map(([px, py]) => [px, Math.min(py, h)]);
  // 첫 점이 왼쪽 아래(0,h), 마지막 점이 오른쪽 아래(w,h) 가 되도록 강제
  poly[0] = [poly[0][0], h]; poly[poly.length - 1] = [poly[poly.length - 1][0], h];
  const hinge = [poly[poly.length - 1].slice(), poly[0].slice()];
  void a;
  return { w, h, poly, hinge, art, fill: type === 'fox' ? c.accent : ec };
}

// 꼬리: 왼쪽 직선 모서리가 몸통 뒤에 붙는다. kind: 'hinge' | 'patch'
function tailShape(type, Wb, s) {
  const c = s.colors; const k = Wb / 38;
  if (type === 'none') return null;
  if (type === 'puff' || type === 'stub') {
    const r = type === 'puff' ? 6.2 * k : 4.8 * k; const pts = [];
    for (let i = 0; i < 40; i++) {
      const t = (i / 40) * Math.PI * 2;
      const rr = type === 'puff' ? r * (0.9 + 0.1 * Math.abs(Math.sin(t * 4))) : r;
      pts.push([r + rr * Math.cos(t), r + rr * Math.sin(t)]);
    }
    const fill = type === 'puff' ? c.light : (s.preset === 'panda' ? c.accent : c.main);
    const art = type === 'puff' ? el.circle(r, r, r * 0.5, mix(c.light, c.inner, 0.25)) : el.circle(r * 0.8, r * 0.75, r * 0.3, '#FFFFFF', 'opacity="0.35"');
    return { kind: 'patch', w: 2 * r, h: 2 * r, poly: pts, art, fill };
  }
  // 굵기가 변하는 곡선 꼬리
  const cfg = {
    cat: { len: 34 * k, rise: 22 * k, w0: 6.4 * k, w1: 7 * k, w2: 5.2 * k, tip: c.main },
    fox: { len: 36 * k, rise: 20 * k, w0: 7.5 * k, w1: 14 * k, w2: 6 * k, tip: c.light },
    raccoon: { len: 34 * k, rise: 16 * k, w0: 7.5 * k, w1: 10 * k, w2: 8 * k, tip: c.accent },
  }[type];
  const N = 26; const center = []; const widths = [];
  const P0 = [0, 0], C1 = [cfg.len * 0.75, 0], P2 = [cfg.len, -cfg.rise];
  for (let i = 0; i <= N; i++) {
    const t = i / N; const u = 1 - t;
    center.push([u * u * P0[0] + 2 * u * t * C1[0] + t * t * P2[0], u * u * P0[1] + 2 * u * t * C1[1] + t * t * P2[1]]);
    const wv = t < 0.5 ? cfg.w0 + (cfg.w1 - cfg.w0) * (t / 0.5) : cfg.w1 + (cfg.w2 - cfg.w1) * ((t - 0.5) / 0.5);
    widths.push(wv);
  }
  const L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const a = center[Math.max(0, i - 1)], b = center[Math.min(N, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty); tx /= l; ty /= l;
    if (i === 0) { tx = 1; ty = 0; }
    const nx = -ty, ny = tx; const hw = widths[i] / 2;
    L.push([center[i][0] + nx * hw, center[i][1] + ny * hw]); R.push([center[i][0] - nx * hw, center[i][1] - ny * hw]);
  }
  // 둥근 끝
  const tipC = center[N]; const last = center[N - 1]; let ang = Math.atan2(tipC[1] - last[1], tipC[0] - last[0]);
  const cap = []; const hw = widths[N] / 2;
  for (let i = 1; i < 10; i++) { const t = ang + Math.PI / 2 - (i / 10) * Math.PI; cap.push([tipC[0] + Math.cos(t) * hw, tipC[1] + Math.sin(t) * hw]); }
  let poly = [...R, ...cap.reverse(), ...L.reverse()];
  // 화면 좌표(y 아래)로: center y 가 음수 → 이동
  const minX = Math.min(...poly.map((p) => p[0])), minY = Math.min(...poly.map((p) => p[1]));
  poly = poly.map(([px, py]) => [px - minX, py - minY]);
  const cen = center.map(([px, py]) => [px - minX, py - minY]);
  const w = Math.max(...poly.map((p) => p[0])), h = Math.max(...poly.map((p) => p[1]));
  // 첫 점(R[0]) 과 마지막 점(L[0]) 사이가 직선 경첩
  const hinge = [poly[poly.length - 1].slice(), poly[0].slice()];
  let art = '';
  const band = (i0, i1, color) => {
    const pts = [...L.slice(0)].length; void pts;
    const segL = [], segR = [];
    for (let i = i0; i <= i1; i++) {
      const a = cen[Math.max(0, i - 1)], b = cen[Math.min(N, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty); tx /= l; ty /= l;
      const nx = -ty, ny = tx; const hw2 = widths[i] / 2 + 1.5;
      segL.push([cen[i][0] + nx * hw2, cen[i][1] + ny * hw2]); segR.push([cen[i][0] - nx * hw2, cen[i][1] - ny * hw2]);
    }
    return `<path d="${polyD([...segL, ...segR.reverse()])}" fill="${color}"/>`;
  };
  if (type === 'cat') {
    for (const i of [6, 12, 18]) art += band(i, i + 2, c.accent);
  } else if (type === 'fox') {
    art += band(20, N, c.light);
    art += `<circle cx="${f(cen[N][0])}" cy="${f(cen[N][1])}" r="${f(widths[N])}" fill="${c.light}"/>`;
  } else if (type === 'raccoon') {
    for (const i of [5, 11, 17]) art += band(i, i + 3, c.accent);
    art += band(23, N, c.accent);
    art += `<circle cx="${f(cen[N][0])}" cy="${f(cen[N][1])}" r="${f(widths[N])}" fill="${c.accent}"/>`;
  }
  return { kind: 'hinge', w, h, poly, hinge, art, fill: c.main };
}

module.exports = {
  f, mix, shade, lum, el, polyD, stripe, heart, pawPrint, bow, flower,
  headFront, headTop, headSide, headBack, headBottom,
  bodyFront, bodySide, bodyBack, bodyTop, bodyBottom,
  earShape, tailShape, glueMarks,
};
