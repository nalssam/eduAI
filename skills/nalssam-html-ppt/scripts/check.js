// 날쌤 HTML PPT 점검: 모든 장을 마지막 단계까지 펼쳐 캡처하고 넘침·대본·제목을 검사한다.
// 사용: node check.js 덱.html 출력폴더 [--mobile]
// (Playwright 를 찾지 못하면: NODE_PATH=$(npm root -g) node check.js …)
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const file = path.resolve(process.argv[2]), out = process.argv[3] || 'shots';
  const mobile = process.argv.includes('--mobile');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('스크립트 오류: ' + e.message));
  await page.goto('file://' + file);
  await page.waitForTimeout(600);
  const n = await page.evaluate(() => window.deck.count);
  const warn = [], titles = new Set();

  for (let i = 0; i < n; i++) {
    await page.evaluate(i => { const d = window.deck; d.go(i, 0); for (let k = 0; k < d.steps(i); k++) d.next(); }, i);
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `${out}/s${String(i + 1).padStart(2, '0')}.png` });
    const r = await page.evaluate(() => {
      const s = document.querySelector('.slide.on'), k = s.getBoundingClientRect().width / 1600, R = s.getBoundingClientRect(), o = [];
      const foot = s.querySelector('.foot'), fTop = foot ? foot.getBoundingClientRect().top : R.bottom;
      s.querySelectorAll('*').forEach(e => {
        if (e.closest('.notes,.foot') || e.matches('.num,.ring,.scrim,.mid,br')) return;
        const st = getComputedStyle(e); if (st.display === 'none' || st.visibility === 'hidden') return;
        const q = e.getBoundingClientRect(); if (!q.width || !q.height) return;
        const name = e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : e.tagName.toLowerCase();
        if (q.right > R.right + 1 || q.left < R.left - 1 || q.bottom > R.bottom + 1) o.push('화면 밖: ' + name);
        else if (st.position !== 'absolute' && !e.closest('.full,.vs,.cover,.thanks,.divider') && q.bottom > fTop - 4 * k) o.push('바닥글과 겹침: ' + name);
        if (e.scrollWidth > e.clientWidth + 2 && st.overflow !== 'visible') o.push('잘림: ' + name);
      });
      const t = s.querySelector('.title'), notes = s.querySelector('.notes');
      const lines = t ? Math.round(t.getBoundingClientRect().height / k / parseFloat(getComputedStyle(t).lineHeight)) : 0;
      return { title: s.dataset.title || '', o: [...new Set(o)].slice(0, 6), lines, h: t ? t.textContent.trim() : '', notes: notes ? notes.textContent.trim().length : 0 };
    });
    const tag = `${i + 1}장 「${r.title}」`;
    if (!r.title) warn.push(`${tag} data-title 이 없어요`);
    if (titles.has(r.title)) warn.push(`${tag} data-title 이 겹쳐요`);
    titles.add(r.title);
    if (r.lines > 2) warn.push(`${tag} 제목이 ${r.lines}줄이에요 → 문장을 줄이세요`);
    if (r.h.length > 36) warn.push(`${tag} 제목이 ${r.h.length}자예요 (30자 안팎 권장)`);
    if (/^(현황|분석|개요|소개|결과|배경|목차)$/.test(r.h)) warn.push(`${tag} 이름표 제목이에요 → 결론 문장으로`);
    if (r.notes < 20) warn.push(`${tag} 대본이 없거나 너무 짧아요`);
    r.o.forEach(x => warn.push(`${tag} ${x}`));
  }
  await browser.close();
  console.log(`${n}장 캡처 → ${out}/`);
  errors.forEach(e => console.log('오류  ' + e));
  warn.forEach(w => console.log('주의  ' + w));
  if (!errors.length && !warn.length) console.log('문제 없음');
  process.exit(errors.length ? 1 : 0);
})();
