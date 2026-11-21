#!/usr/bin/env node
// 사이트를 만든다.
//   site/index.html            분필팩 첫 화면(한 줄 설치 + 스킬 ZIP)      site/pack-artifact.html   같은 화면의 아티팩트용
//   site/builder.html          스타일 고르기 판                           site/artifact.html        고르기 판의 아티팩트용
//   site/downloads/<스킬>.zip  스킬별 ZIP · bunpil-skill-pack.zip(전체)
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
const SAVE = {
  web: "var dl=$('dl');\n  dl.addEventListener('click',function(){\n    var out=C.buildSkill(cfg,DATA.files,brandOf(cfg.brand)),bytes=C.zip(out,cfg.name);\n    var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([bytes],{type:'application/zip'}));a.download=cfg.name+'.zip';document.body.appendChild(a);a.click();a.remove();\n    $('saved').hidden=false;$('saved').textContent=cfg.name+'.zip 을 저장했습니다';\n  });",
  artifact: "var say=function(t){$('saved').hidden=false;$('saved').textContent=t};\n  function offer(filename,bytes){\n    return window.claude.use('downloads').then(function(d){\n      if(!d)return say('이 화면에서는 파일 저장을 쓸 수 없습니다. 설정 한 줄을 복사해 쓰세요.');\n      return d.save({filename:filename,data:bytes}).then(function(){say(filename+' 을 저장했습니다')},function(e){\n        say(e&&e.code==='declined'?'저장을 취소했습니다':e&&e.code==='rate_limited'?'잠시 뒤 다시 눌러 주세요':'파일을 저장하지 못했습니다. 설정 한 줄을 복사해 쓰세요.')});\n    });\n  }\n  if(window.claude&&window.claude.use)window.claude.use('downloads').then(function(d){\n    if(!d)return;$('zipbox').hidden=false;\n    $('dl').addEventListener('click',function(){offer(cfg.name+'.zip',C.zip(C.buildSkill(cfg,DATA.files,brandOf(cfg.brand)),cfg.name))});\n    $('dl-base').addEventListener('click',function(){var b=atob(DATA.baseZip),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);offer('nalssam-html-ppt.zip',u)});\n  });",
};
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
    how: 'ZIP 받기를 누르면 스킬 파일이 내려옵니다. 버튼이 보이지 않으면 설정 한 줄을 복사해 날쌤 기본 스킬을 붙여 둔 Claude 에 붙여 넣습니다.',
    boxes: `<div class="box" id="zipbox" hidden><h3>스킬 ZIP 받기</h3>
        <p class="hint">고른 스타일이 들어간 스킬 폴더를 ZIP 하나로 받습니다. 저장할지 묻는 창이 한 번 뜹니다.</p>
        <div class="acts"><button type="button" class="btn" id="dl">나만의 스킬 ZIP 받기</button><button type="button" class="btn ghost" id="dl-base">날쌤 기본 스킬 받기</button></div>
        <span class="ok" id="saved" role="status" hidden></span>
      </div>
      ` + lineBox.replace('__LINE_HINT__', '이 한 줄을 복사해 Claude 대화창에 붙여 넣고 "이 설정으로 스킬 저장해 줘"라고 합니다. Claude 가 스킬 ZIP 을 만들어 줍니다.').replace('__COPY_CLASS__', 'ghost'),
  },
};
// 스킬별 ZIP 과 팩 전체 ZIP
function tree(dir) {
  const out = {};
  (function walk(d, rel) {
    fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
      const p = path.join(d, e.name), r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) walk(p, r); else out[r] = new Uint8Array(fs.readFileSync(p));
    });
  })(dir, '');
  return out;
}
fs.mkdirSync(path.join(root, 'site/downloads'), { recursive: true });
const zips = {}, all = {};
fs.readdirSync(path.join(root, 'skills')).sort().forEach(name => {
  const dir = path.join(root, 'skills', name);
  if (!fs.existsSync(path.join(dir, 'SKILL.md'))) return;
  const files = tree(dir);
  zips[name] = Buffer.from(core.zip(files, name));
  Object.keys(files).forEach(k => { all[name + '/' + k] = files[k]; });
  fs.writeFileSync(path.join(root, 'site/downloads', name + '.zip'), zips[name]);
});
zips['bunpil-skill-pack'] = Buffer.from(core.zip(all, ''));
fs.writeFileSync(path.join(root, 'site/downloads/bunpil-skill-pack.zip'), zips['bunpil-skill-pack']);
const baseZip = zips['nalssam-html-ppt'];

function render(kind) {
  const v = variants[kind];
  return src.replace('__SAVE_HOW__', v.how).replace('__SAVE_BOXES__', v.boxes).replace('__REPO__', REPO)
    .replace('/*__CORE__*/', () => coreJs).replace('/*__SAVE__*/', () => SAVE[kind]).replace('__DATA__', () => kind === 'artifact' ? json.replace(/\}$/, ',"baseZip":"' + baseZip.toString('base64') + '"}') : json).replace('__ARTIFACT__', String(kind === 'artifact'));
}
fs.writeFileSync(path.join(root, 'site/artifact.html'), render('artifact'));
const shell = body => '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  '<meta name="description" content="색·글꼴·모양을 고르면 나만의 HTML PPT 스킬이 나옵니다. Claude 와 Codex 에 붙여 씁니다.">\n</head>\n<body style="margin:0">\n' + body + '\n</body>\n</html>\n';
fs.writeFileSync(path.join(root, 'site/builder.html'), shell(render('web')));


// 분필팩 첫 화면
const BUILDER_ARTIFACT = 'https://claude.ai/artifact/Q4h9pif6Z6zMBKNNGGvCH2';
const baseCss = (src.match(/<style>([\s\S]*?)<\/style>/) || [])[1];
const home = fs.readFileSync(path.join(root, 'site/src/home.html'), 'utf8');
const HOME_SAVE = {
  web: `document.addEventListener('click',function(e){var b=e.target.closest('[data-zip]');if(!b)return;location.href='downloads/'+b.dataset.zip+'.zip'});`,
  artifact: `var zb=[].slice.call(document.querySelectorAll('[data-zip]'));zb.forEach(function(b){b.hidden=true});
  if(window.claude&&window.claude.use)window.claude.use('downloads').then(function(d){
    if(!d)return;zb.forEach(function(b){b.hidden=false});
    document.addEventListener('click',function(e){var b=e.target.closest('[data-zip]');if(!b)return;var n=b.dataset.zip,s=atob(DATA.zips[n]),u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i);
      var say=function(t){$('saved').hidden=false;$('saved').textContent=t};
      d.save({filename:n+'.zip',data:u}).then(function(){say(n+'.zip 을 저장했습니다')},function(er){say(er&&er.code==='declined'?'저장을 취소했습니다':er&&er.code==='rate_limited'?'잠시 뒤 다시 눌러 주세요':'파일을 저장하지 못했습니다')})});
  });`,
};
function renderHome(kind) {
  const data = kind === 'artifact' ? { zips: Object.fromEntries(Object.entries(zips).map(([k, v]) => [k, v.toString('base64')])) } : {};
  return home.replace('/*__BASE_CSS__*/', () => baseCss).replace('__REPO__', REPO)
    .replace('__BUILDER__', kind === 'artifact' ? BUILDER_ARTIFACT : 'builder.html')
    .replace('/*__SAVE__*/', () => HOME_SAVE[kind]).replace('__DATA__', () => JSON.stringify(data));
}
fs.writeFileSync(path.join(root, 'site/index.html'), shell(renderHome('web')).replace('나만의 HTML PPT 스킬이 나옵니다. Claude 와 Codex 에 붙여 씁니다.', '날쌤 분필팩 스킬을 한 줄로 Claude 와 Codex 에 설치합니다.'));
fs.writeFileSync(path.join(root, 'site/pack-artifact.html'), renderHome('artifact'));
console.log('site/index.html · builder.html · artifact.html · pack-artifact.html · downloads:', Object.keys(zips).join(', '));
