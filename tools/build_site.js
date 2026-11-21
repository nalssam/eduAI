#!/usr/bin/env node
// 고르기 판을 만든다: site/index.html(웹사이트용, ZIP 바로 받기) · site/artifact.html(Claude 아티팩트용)
//                    site/downloads/nalssam-html-ppt.zip(기본 스킬 설치 파일)
// 사용: node tools/build_site.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), skill = path.join(root, 'skills/nalssam-html-ppt');
const core = require(path.join(skill, 'scripts/lib/core.js'));
const REPO = 'https://github.com/nalssam/eduAI';
const read = p => fs.readFileSync(path.join(skill, p), 'utf8');

const embed = ['assets/SKILL.template.md', 'assets/starter.html', 'scripts/check.js', 'scripts/inline_font.py',
  'references/design-rules.md', 'references/motion.md', 'references/brand-themes.md'];
const files = {}; embed.forEach(p => { files[p] = read(p); });
const data = { files, presets: JSON.parse(read('assets/presets.json')) };
const json = JSON.stringify(data).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '');
const coreJs = read('scripts/lib/core.js').replace(/<\/script/g, '<\\/script');
const src = fs.readFileSync(path.join(root, 'site/src/page.html'), 'utf8');

const lineBox = `<div class="box"><h3>설정 한 줄</h3>
        <p class="hint">__LINE_HINT__</p>
        <div class="line" id="line" tabindex="0" aria-label="설정 한 줄"></div>
        <div class="acts"><button type="button" class="btn __COPY_CLASS__" id="copy">설정 한 줄 복사</button><span class="ok" id="copied" role="status" hidden></span></div>
      </div>`;
const variants = {
  web: {
    how: 'ZIP 받기를 누르면 스킬 파일이 내려옵니다. 설치할 것이 따로 없습니다.',
    boxes: `<div class="box"><h3>스킬 ZIP 받기</h3>
        <p class="hint">고른 스타일이 들어간 스킬 폴더를 ZIP 하나로 받습니다. 스타터 덱, 점검 스크립트, 참고 문서가 들어 있습니다.</p>
        <div class="acts"><button type="button" class="btn" id="dl">나만의 스킬 ZIP 받기</button><a class="btn ghost" href="downloads/nalssam-html-ppt.zip" download>날쌤 기본 스킬 받기</a></div>
        <span class="ok" id="saved" role="status" hidden></span>
      </div>
      ` + lineBox.replace('__LINE_HINT__', '날쌤 기본 스킬을 이미 붙여 두었다면 이 한 줄을 대화창에 붙여 넣고 "이 설정으로 스킬 저장해 줘"라고 해도 됩니다. 나중에 다시 고칠 때도 이 줄을 씁니다.').replace('__COPY_CLASS__', 'ghost'),
  },
  artifact: {
    how: '설정 한 줄을 복사해, 날쌤 기본 스킬을 붙여 둔 Claude 대화창에 붙여 넣습니다.',
    boxes: lineBox.replace('__LINE_HINT__', '이 한 줄을 복사해 Claude 대화창에 붙여 넣고 "이 설정으로 스킬 저장해 줘"라고 합니다. Claude 가 스킬 ZIP 을 만들어 줍니다.').replace('__COPY_CLASS__', '') + `
      <div class="box"><h3>먼저 한 번만: 날쌤 기본 스킬</h3>
        <p class="hint">설정 한 줄을 스킬로 바꿔 주는 것이 날쌤 기본 스킬(nalssam-html-ppt)입니다. 아래 저장소에서 설치 파일을 받아 한 번만 붙여 두면 됩니다.</p>
        <div class="acts"><a class="btn ghost" href="${REPO}">설치 파일 받는 곳 열기</a></div>
      </div>`,
  },
};
function render(kind) {
  const v = variants[kind];
  return src.replace('__SAVE_HOW__', v.how).replace('__SAVE_BOXES__', v.boxes).replace('__REPO__', REPO)
    .replace('/*__CORE__*/', () => coreJs).replace('__DATA__', () => json).replace('__ARTIFACT__', String(kind === 'artifact'));
}
fs.writeFileSync(path.join(root, 'site/artifact.html'), render('artifact'));
fs.writeFileSync(path.join(root, 'site/index.html'),
  '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  '<meta name="description" content="색·글꼴·모양을 고르면 나만의 HTML PPT 스킬이 나옵니다. Claude 와 Codex 에 붙여 씁니다.">\n</head>\n<body style="margin:0">\n' + render('web') + '\n</body>\n</html>\n');

// 기본 스킬 설치 파일
const base = {};
(function walk(dir, rel) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
    const p = path.join(dir, e.name), r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) walk(p, r); else base[r] = new Uint8Array(fs.readFileSync(p));
  });
})(skill, '');
fs.mkdirSync(path.join(root, 'site/downloads'), { recursive: true });
fs.writeFileSync(path.join(root, 'site/downloads/nalssam-html-ppt.zip'), core.zip(base, 'nalssam-html-ppt'));
console.log('site/index.html', Math.round(fs.statSync(path.join(root, 'site/index.html')).size / 1024) + 'KB',
  '· site/artifact.html · site/downloads/nalssam-html-ppt.zip', Object.keys(base).length + '개 파일');
