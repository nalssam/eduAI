'use strict';
// 파일로 내보내기: 인쇄용 HTML·SVG, (Playwright 가 있으면) PDF·PNG, 3D 접기 미리보기 HTML.

const fs = require('fs');
const path = require('path');
const { normalizeSpec } = require('./spec');
const { makeSheet } = require('./sheet');
const { foldViewerHtml } = require('./fold');

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Jua&display=swap" rel="stylesheet">';

function worksheetHtml(pages, s) {
  if (!Array.isArray(pages)) pages = [pages];
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${s.title} · 페이퍼크래프트 학습지</title>${FONTS}
<style>
@page { size: A4 portrait; margin: 0; }
html,body{margin:0;padding:0;background:#EDE9E3;}
.page{width:210mm;height:297mm;margin:12px auto;break-after:page;page-break-after:always;background:#fff;box-shadow:0 2px 14px rgba(0,0,0,.12);}
.page svg{display:block;width:210mm;height:297mm;}
.bar{max-width:210mm;margin:12px auto 0;font:14px 'Gowun Dodum',sans-serif;color:#3B2E2E;display:flex;gap:8px;align-items:center;}
.bar button{font:inherit;padding:6px 14px;border-radius:999px;border:1px solid #d9cfc7;background:#fff;cursor:pointer;}
@media print{html,body{background:#fff}.page{margin:0;box-shadow:none}.bar{display:none}}
@media screen and (max-width:820px){.page{width:100%;height:auto;aspect-ratio:210/297}.page svg{width:100%;height:auto}}
</style></head><body>
<div class="bar"><button onclick="print()">🖨 인쇄하기 (A4·100%)</button><span>두꺼운 종이에 실제 크기로 인쇄하세요.</span></div>
${pages.map((svg) => `<div class="page">${svg}</div>`).join('')}
</body></html>`;
}

function slug(t) { return String(t).toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-+|-+$/g, '') || 'papercraft'; }

async function tryPlaywright() {
  try { return require('playwright'); } catch (e) { /* 없음 */ }
  try { return require(require.resolve('playwright', { paths: [process.cwd(), '/usr/lib/node_modules', '/usr/local/lib/node_modules'] })); } catch (e) { return null; }
}

async function renderPdfPng(htmlPath, outBase, { png = true, pdf = true } = {}) {
  const pw = await tryPlaywright();
  if (!pw) return { note: 'Playwright 가 없어 PDF·PNG 는 건너뛰었어요. HTML 을 브라우저에서 열어 인쇄하세요.' };
  const browser = await pw.chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await page.evaluate(() => document.fonts && document.fonts.ready);
    const out = {};
    if (pdf) { out.pdf = outBase + '.pdf'; await page.pdf({ path: out.pdf, format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } }); }
    if (png) {
      await page.addStyleTag({ content: '.bar{display:none}.page{margin:0;box-shadow:none}body{background:#fff}' });
      const els = await page.$$('.page'); out.pngs = [];
      for (let i = 0; i < els.length; i++) { const f = outBase + (i ? `-p${i + 1}` : '') + '.png'; await els[i].screenshot({ path: f }); out.pngs.push(f); }
      out.png = out.pngs[0];
    }
    return out;
  } finally { await browser.close(); }
}

async function createPapercraft(input = {}, { outDir, render = true } = {}) {
  const s = normalizeSpec(input);
  const { svg, pages, build } = makeSheet(s);
  const dir = outDir || process.cwd();
  fs.mkdirSync(dir, { recursive: true });
  const base = path.join(dir, input.filename ? slug(input.filename) : `papercraft-${s.preset}`);
  const files = {};
  files.svg = base + '-worksheet.svg'; fs.writeFileSync(files.svg, svg);
  pages.slice(1).forEach((p, i) => fs.writeFileSync(base + `-worksheet-p${i + 2}.svg`, p));
  files.html = base + '-worksheet.html'; fs.writeFileSync(files.html, worksheetHtml(pages, s));
  files.fold = base + '-fold-3d.html'; fs.writeFileSync(files.fold, foldViewerHtml(pages, build, s));
  let note = '';
  if (render) {
    const r = await renderPdfPng(path.resolve(files.html), base + '-worksheet');
    if (r.pdf) files.pdf = r.pdf; if (r.png) files.png = r.png; if (r.pngs && r.pngs.length > 1) files.pngPages = r.pngs; if (r.note) note = r.note;
  }
  const summary = {
    title: s.title,
    pages: build.pages || 1,
    scale: Math.round(build.scale * 100) / 100,
    finishedHeightCm: Math.round((build.heightMm || ((build.body ? build.body.h : 0) + build.head.h)) / 10 * 10) / 10,
    answers: build.math ? build.math.answers : undefined,
    parts: build.parts.map((p) => ({ id: p.id, name: p.name, mm: [Math.round(p.bw), Math.round(p.bh)] })),
    spec: s,
  };
  return { files, summary, note };
}

module.exports = { createPapercraft, worksheetHtml, renderPdfPng, slug };
