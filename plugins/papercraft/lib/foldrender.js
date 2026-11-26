'use strict';
// 3D 접기 미리보기 HTML 을 헤드리스 브라우저로 돌려 장면 사진(PNG)·영상(MP4/GIF)으로 남긴다.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function hasFfmpeg() { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch (e) { return false; } }

async function renderFold(foldHtml, outDir, { keyframes = [0, 0.15, 0.3, 0.45, 0.62, 0.8], video = true, fps = 20, seconds = 9, size = [720, 900] } = {}) {
  let pw; try { pw = require('playwright'); } catch (e) { return { note: 'Playwright 가 없어 3D 장면을 사진으로 남기지 못했어요. 3D HTML 을 브라우저로 여세요.' }; }
  fs.mkdirSync(outDir, { recursive: true });
  const base = path.join(outDir, path.basename(foldHtml).replace(/\.html$/, ''));
  const browser = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const out = { frames: [] };
  try {
    const page = await browser.newPage({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 1 });
    await page.goto('file://' + path.resolve(foldHtml) + '?autoplay=0');
    await page.waitForFunction(() => window.__ready, null, { timeout: 45000 });
    await page.addStyleTag({ content: '.ctl,.hint{display:none}' });
    for (const t of keyframes) {
      await page.evaluate((x) => window.__setT(x), t); await page.waitForTimeout(80);
      const f = `${base}-t${String(Math.round(t * 100)).padStart(3, '0')}.png`;
      await page.screenshot({ path: f }); out.frames.push(f);
    }
    if (video && hasFfmpeg()) {
      const tmp = fs.mkdtempSync(path.join(outDir, 'frames-'));
      const n = fps * seconds;
      for (let i = 0; i <= n; i++) {
        await page.evaluate((x) => window.__setT(x), i / n);
        await page.screenshot({ path: path.join(tmp, `f${String(i).padStart(4, '0')}.png`) });
      }
      for (let i = 0; i < fps; i++) fs.copyFileSync(path.join(tmp, `f${String(n).padStart(4, '0')}.png`), path.join(tmp, `f${String(n + 1 + i).padStart(4, '0')}.png`));
      out.mp4 = base + '.mp4';
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(tmp, 'f%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-movflags', '+faststart', out.mp4]);
      out.gif = base + '.gif';
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(tmp, 'f%04d.png'), '-vf', 'fps=12,scale=420:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer', out.gif]);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
    // 한 장으로 모은 장면표
    if (hasFfmpeg() && out.frames.length) {
      out.storyboard = base + '-storyboard.png';
      const inputs = out.frames.flatMap((f) => ['-i', f]);
      const cols = Math.min(3, out.frames.length); const rows = Math.ceil(out.frames.length / cols);
      const layout = out.frames.map((_, i) => `${(i % cols) ? Array.from({ length: i % cols }, () => 'w0').join('+') : '0'}_${Math.floor(i / cols) ? Array.from({ length: Math.floor(i / cols) }, () => 'h0').join('+') : '0'}`).join('|');
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', `${out.frames.map((_, i) => `[${i}:v]scale=480:-1[v${i}]`).join(';')};${out.frames.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${out.frames.length}:layout=${layout}:fill=white`, '-frames:v', '1', out.storyboard]);
      void rows;
    }
  } finally { await browser.close(); }
  return out;
}

module.exports = { renderFold };
