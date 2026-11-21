/* 나만의 HTML PPT 스킬 만들기 — 공통 코드.
   브라우저(고르기 판)와 Node(scripts/make_skill.js)가 같은 파일을 쓴다. 의존성 없음. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PPTCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PRETENDARD = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
  var FALLBACK = '-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic",sans-serif';
  var gf = function (q) { return 'https://fonts.googleapis.com/css2?family=' + q + '&display=swap'; };

  var FONTS = {
    pretendard: { ko: '프리텐다드', stack: '"Pretendard Variable",Pretendard,' + FALLBACK, href: PRETENDARD },
    noto: { ko: '본고딕(Noto Sans KR)', stack: '"Noto Sans KR",' + FALLBACK, href: gf('Noto+Sans+KR:wght@300;400;500;700;800;900') },
    plex: { ko: 'IBM 플렉스 산스', stack: '"IBM Plex Sans KR",' + FALLBACK, href: gf('IBM+Plex+Sans+KR:wght@300;400;500;600;700') },
    gothica1: { ko: '고딕 A1', stack: '"Gothic A1",' + FALLBACK, href: gf('Gothic+A1:wght@300;400;500;700;800;900') }
  };
  var TITLE_FONTS = {
    same: { ko: '본문과 같게' },
    blackhan: { ko: '검은고딕', stack: '"Black Han Sans",', href: gf('Black+Han+Sans'), weight: 400 },
    dohyeon: { ko: '도현', stack: '"Do Hyeon",', href: gf('Do+Hyeon'), weight: 400 },
    jua: { ko: '주아', stack: '"Jua",', href: gf('Jua'), weight: 400 },
    myeongjo: { ko: '나눔명조', stack: '"Nanum Myeongjo",', href: gf('Nanum+Myeongjo:wght@700;800'), weight: 800 }
  };
  var GROUNDS = {
    warm: { ko: '웜 오프화이트', dark: false, bg: '#FBFAF6', ink: '#132C3D', sub: '#586875', line: '#E4DFD3', card: '#FFFFFF', paper: '#F3F0E8', zebra: '#F5F2EA', mute: '#C9CED2' },
    white: { ko: '흰색', dark: false, bg: '#FFFFFF', ink: '#17202A', sub: '#5A6672', line: '#E3E7EB', card: '#FFFFFF', paper: '#F3F5F7', zebra: '#F7F8FA', mute: '#CBD2D9' },
    chalk: { ko: '칠판', dark: true, bg: '#1F3A33', ink: '#F5F2E8', sub: '#B9C9C2', line: 'rgba(245,242,232,.2)', card: 'rgba(255,255,255,.06)', paper: 'rgba(255,255,255,.09)', zebra: 'rgba(255,255,255,.05)', mute: '#5E776F' },
    navy: { ko: '네이비', dark: true, bg: '#132C3D', ink: '#FBFAF6', sub: '#AEBBC4', line: 'rgba(251,250,246,.18)', card: 'rgba(255,255,255,.06)', paper: 'rgba(255,255,255,.09)', zebra: 'rgba(255,255,255,.05)', mute: '#4A6272' }
  };
  var CHOICES = {
    ground: Object.keys(GROUNDS), font: Object.keys(FONTS), titleFont: Object.keys(TITLE_FONTS),
    radius: ['0', '8', '12', '20'], card: ['line', 'shadow', 'fill'], pattern: ['none', 'grid', 'dots'],
    titlefx: ['none', 'bar', 'marker'], motion: ['basic', 'calm', 'off'], tone: ['haeyo', 'hamnida'], script: ['read', 'live']
  };
  var DEFAULTS = {
    name: 'my-html-ppt', title: '나만의 HTML PPT', author: '', preset: 'nalssam', brand: '',
    ground: 'warm', key: '#18766B', point: '#D9734E', font: 'pretendard', titleFont: 'same',
    radius: '12', card: 'line', pattern: 'none', titlefx: 'none', motion: 'basic', tone: 'haeyo', script: 'live'
  };

  /* ── 색 ── */
  function rgb(hex) { hex = hex.replace('#', ''); if (hex.length === 3) hex = hex.replace(/./g, '$&$&'); return [0, 2, 4].map(function (i) { return parseInt(hex.substr(i, 2), 16); }); }
  function hex(c) { return '#' + c.map(function (v) { return ('0' + Math.round(Math.max(0, Math.min(255, v))).toString(16)).slice(-2); }).join('').toUpperCase(); }
  function lum(h) { var c = rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex(x.map(function (v, i) { return v + (y[i] - v) * t; })); }
  /* 바탕 위에서 읽히도록 목표 대비가 될 때까지 검정(밝은 바탕)이나 흰색(어두운 바탕) 쪽으로 옮긴다 */
  function readable(color, bg, target) {
    var toward = lum(bg) > 0.4 ? '#000000' : '#FFFFFF', out = color, t = 0;
    while (contrast(out, bg) < target && t < 1) { t += 0.04; out = mix(color, toward, t); }
    return out;
  }
  function isHex(v) { return /^#[0-9A-Fa-f]{6}$/.test(v); }

  /* ── 설정 ── */
  function slug(v) { return String(v || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 64); }
  function nameError(n) {
    if (!n) return '이름을 영어 소문자·숫자·하이픈으로 적어 주세요';
    if (n !== slug(n)) return '영어 소문자·숫자·하이픈만 쓸 수 있어요';
    if (/claude|anthropic/.test(n)) return '이름에 claude 나 anthropic 은 넣을 수 없어요';
    return '';
  }
  function normalize(input) {
    var c = {}, k;
    for (k in DEFAULTS) c[k] = input && input[k] != null && input[k] !== '' ? String(input[k]) : DEFAULTS[k];
    for (k in CHOICES) if (CHOICES[k].indexOf(c[k]) < 0) c[k] = DEFAULTS[k];
    if (!isHex(c.key)) c.key = DEFAULTS.key;
    if (!isHex(c.point)) c.point = DEFAULTS.point;
    c.key = c.key.toUpperCase(); c.point = c.point.toUpperCase();
    c.name = slug(c.name) || DEFAULTS.name;
    if (nameError(c.name)) c.name = DEFAULTS.name;
    c.title = c.title.replace(/[<>"\n\r]/g, '').slice(0, 40) || DEFAULTS.title;
    c.author = c.author.replace(/[<>"\n\r]/g, '').slice(0, 30);
    c.brand = slug(c.brand);
    return c;
  }
  var ORDER = ['name', 'title', 'author', 'preset', 'brand', 'ground', 'key', 'point', 'font', 'titleFont', 'radius', 'card', 'pattern', 'titlefx', 'motion', 'tone', 'script'];
  function toLine(cfg) {
    var c = normalize(cfg);
    return '[HTML PPT 스킬 설정] ' + ORDER.filter(function (k) { return c[k] !== ''; }).map(function (k) { return k + '=' + c[k]; }).join('; ');
  }
  function parseLine(line) {
    var o = {}, s = String(line).trim();
    if (s.charAt(0) === '{') return normalize(JSON.parse(s));
    s.replace(/^\[[^\]]*\]\s*/, '').split(';').forEach(function (p) { var i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
    return normalize(o);
  }

  /* ── 테마 ── */
  function tokens(cfg) {
    var c = normalize(cfg), g = GROUNDS[c.ground];
    var key = readable(c.key, g.bg, 4.5), point = readable(c.point, g.bg, 3);
    var a = rgb(key);
    return {
      bg: g.bg, ink: g.ink, sub: g.sub, key: key, point: point, line: g.line, card: g.card, paper: g.paper, zebra: g.zebra, mute: g.mute,
      keySoft: g.dark ? 'rgba(' + a.join(',') + ',.14)' : mix(key, g.bg, 0.88),
      onKey: contrast('#FFFFFF', key) >= 4.5 ? '#FFFFFF' : '#10202A',
      keyMoved: key !== c.key, pointMoved: point !== c.point
    };
  }
  function fontInfo(cfg) {
    var c = normalize(cfg), f = FONTS[c.font], t = TITLE_FONTS[c.titleFont], links = [f.href];
    if (t.href) links.push(t.href);
    return { sans: f.stack, title: t.stack ? t.stack + f.stack : '', weight: t.weight || 800, links: links };
  }
  function themeCss(cfg) {
    var c = normalize(cfg), t = tokens(c), f = fontInfo(c);
    return ':root,[data-theme="nalssam"]{--bg:' + t.bg + ';--ink:' + t.ink + ';--sub:' + t.sub + ';--key:' + t.key + ';--key-soft:' + t.keySoft +
      ';--point:' + t.point + ';--line:' + t.line + ';--card:' + t.card + ';--paper:' + t.paper + ';--zebra:' + t.zebra + ';--on-key:' + t.onKey + ';--mute:' + t.mute + '}\n' +
      ':root{--r:' + c.radius + 'px;--sans:' + f.sans + (f.title ? ';--title-font:' + f.title + ';--title-weight:' + f.weight : '') + '}';
  }
  function stageAttrs(cfg) { var c = normalize(cfg); return { card: c.card, pattern: c.pattern, titlefx: c.titlefx, motion: c.motion }; }

  /* ── 스킬 파일 만들기 ── */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function applyStarter(html, cfg) {
    var c = normalize(cfg), f = fontInfo(c), a = stageAttrs(c);
    html = html.replace(/<!--FONT-->[\s\S]*?<!--\/FONT-->/, '<!--FONT-->\n' + f.links.map(function (h) { return '<link rel="stylesheet" href="' + h + '">'; }).join('\n') + '\n<!--/FONT-->');
    html = html.replace(/(<style id="my-theme">)[\s\S]*?(<\/style>)/, function (m, x, y) { return x + '\n' + themeCss(c) + '\n' + y; });
    Object.keys(a).forEach(function (k) { html = html.replace(new RegExp('(<div id="stage"[^>]*data-' + k + '=")[^"]*'), '$1' + a[k]); });
    html = html.replace(/<title>[^<]*<\/title>/, '<title>' + esc(c.title) + ' 스타터</title>');
    html = html.replace(/(<div id="stage"[^>]*data-event=")[^"]*/, '$1' + esc(c.title) + ' 견본');
    html = html.replace(/(<div id="stage"[^>]*data-author=")[^"]*/, '$1' + esc(c.author));
    html = html.replace(/<p class="who" data-step="1">nalssam 박준호<\/p>/, '<p class="who" data-step="1">' + esc(c.author || '발표자 이름') + '</p>');
    return html;
  }
  function fill(tpl, vars) {
    tpl = tpl.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}\n?/g, function (m, k, body) { return vars[k] ? body : ''; });
    return tpl.replace(/\{\{(\w+)\}\}/g, function (m, k) { return vars[k] != null ? vars[k] : ''; });
  }
  function skillVars(cfg, brandInfo) {
    var c = normalize(cfg), t = tokens(c), g = GROUNDS[c.ground];
    return {
      name: c.name, title: c.title, author: c.author, hasAuthor: !!c.author,
      footer: (c.author ? '행사명 | ' + c.author + ' | 날짜' : '행사명 | 날짜'),
      ground: g.ko, bg: t.bg, ink: t.ink, sub: t.sub, key: t.key, keySoft: t.keySoft, point: t.point, line: t.line, card: t.card, paper: t.paper, zebra: t.zebra,
      fontKo: FONTS[c.font].ko + (c.titleFont !== 'same' ? ' (제목은 ' + TITLE_FONTS[c.titleFont].ko + ')' : ''),
      pretendard: c.font === 'pretendard' && c.titleFont === 'same',
      radius: c.radius,
      cardKo: { line: '얇은 테두리의 납작한 상자(그림자 없음)', shadow: '테두리 없이 옅은 그림자로 띄운 상자', fill: '테두리 없이 옅은 면으로 채운 상자' }[c.card],
      toneScreen: c.tone === 'haeyo' ? '짧은 `~해요`' : '짧은 `~합니다`',
      scriptKo: c.script === 'read' ? '녹화 낭독형(분당 300~350자, 그대로 읽는 글)' : '라이브 요점형(분당 약 100자 + `[시연]`·`[참여]` 큐)',
      motionKo: { basic: '기본(아래에서 올라오며 등장)', calm: '차분하게(제자리에서 서서히)', off: '끔(등장·전환 없이 바로)' }[c.motion],
      brand: !!c.brand, brandName: brandInfo ? brandInfo.name : c.brand, brandSlug: c.brand, brandUrl: brandInfo ? brandInfo.url : 'https://www.getdesign.kr/services/' + c.brand,
      configLine: toLine(c)
    };
  }
  /* files: { 'SKILL.template.md', 'assets/starter.html', 'scripts/check.js', … } → 새 스킬의 { 경로: 내용 } */
  function buildSkill(cfg, files, brandInfo) {
    var c = normalize(cfg), out = {};
    out['SKILL.md'] = fill(files['assets/SKILL.template.md'], skillVars(c, brandInfo));
    out['assets/starter.html'] = applyStarter(files['assets/starter.html'], c);
    ['scripts/check.js', 'scripts/inline_font.py', 'references/design-rules.md', 'references/motion.md', 'references/brand-themes.md'].forEach(function (p) { if (files[p]) out[p] = files[p]; });
    out['config.json'] = JSON.stringify(c, null, 2) + '\n';
    return out;
  }

  /* ── ZIP (압축 없이 묶기) ── */
  var CRC = (function () { var t = [], n, k, c; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF, i; for (i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function utf8(s) { return new TextEncoder().encode(s); }
  function zip(files, rootDir) {
    var parts = [], central = [], offset = 0, count = 0;
    function u16(v) { return [v & 255, (v >>> 8) & 255]; }
    function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    Object.keys(files).sort().forEach(function (path) {
      var name = utf8((rootDir ? rootDir + '/' : '') + path), data = typeof files[path] === 'string' ? utf8(files[path]) : files[path], crc = crc32(data);
      var common = [].concat(u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
      var local = new Uint8Array([0x50, 0x4B, 3, 4].concat(common));
      central.push(new Uint8Array([0x50, 0x4B, 1, 2].concat(u16(20), common, u16(0), u16(0), u16(0), u32(0), u32(offset))), name);
      parts.push(local, name, data); offset += local.length + name.length + data.length; count++;
    });
    var csize = central.reduce(function (n, p) { return n + p.length; }, 0);
    var end = new Uint8Array([0x50, 0x4B, 5, 6].concat(u16(0), u16(0), u16(count), u16(count), u32(csize), u32(offset), u16(0)));
    var all = parts.concat(central, [end]), total = all.reduce(function (n, p) { return n + p.length; }, 0), out = new Uint8Array(total), pos = 0;
    all.forEach(function (p) { out.set(p, pos); pos += p.length; });
    return out;
  }

  return { FONTS: FONTS, TITLE_FONTS: TITLE_FONTS, GROUNDS: GROUNDS, CHOICES: CHOICES, DEFAULTS: DEFAULTS,
    normalize: normalize, nameError: nameError, slug: slug, toLine: toLine, parseLine: parseLine,
    tokens: tokens, themeCss: themeCss, stageAttrs: stageAttrs, fontInfo: fontInfo, contrast: contrast,
    applyStarter: applyStarter, buildSkill: buildSkill, zip: zip };
});
