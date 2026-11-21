#!/usr/bin/env node
// 설정 한 줄로 "나만의 HTML PPT 스킬" 폴더와 ZIP 을 만든다.
// 사용: node scripts/make_skill.js "[HTML PPT 스킬 설정] name=…; key=#…; …" [출력 폴더]
//       node scripts/make_skill.js config.json [출력 폴더]
const fs = require('fs'), path = require('path');
const core = require('./lib/core.js');

const arg = process.argv[2], outRoot = path.resolve(process.argv[3] || '.');
if (!arg) { console.error('설정 한 줄이나 config.json 경로를 주세요.'); process.exit(1); }
const raw = fs.existsSync(arg) ? fs.readFileSync(arg, 'utf8') : arg;
const cfg = core.parseLine(raw);

const base = path.join(__dirname, '..');
const files = {};
['assets/SKILL.template.md', 'assets/starter.html', 'scripts/check.js', 'scripts/inline_font.py',
  'references/design-rules.md', 'references/motion.md', 'references/brand-themes.md']
  .forEach(p => { files[p] = fs.readFileSync(path.join(base, p), 'utf8'); });
let brand = null;
if (cfg.brand) {
  const presets = JSON.parse(fs.readFileSync(path.join(base, 'assets/presets.json'), 'utf8'));
  brand = presets.brands.find(b => b.slug === cfg.brand) || null;
  if (!brand) console.warn(`주의: 카탈로그 목록에 없는 브랜드예요 (${cfg.brand}). 색은 설정에 적힌 값 그대로 씁니다.`);
}
const out = core.buildSkill(cfg, files, brand);
const dir = path.join(outRoot, cfg.name);
for (const [p, text] of Object.entries(out)) {
  fs.mkdirSync(path.dirname(path.join(dir, p)), { recursive: true });
  fs.writeFileSync(path.join(dir, p), text);
}
const zipPath = path.join(outRoot, cfg.name + '.zip');
fs.writeFileSync(zipPath, core.zip(out, cfg.name));
const t = core.tokens(cfg);
console.log(`스킬 폴더  ${dir}`);
console.log(`올릴 ZIP   ${zipPath}`);
if (t.keyMoved) console.log(`알림: 포인트 색 ${cfg.key} 은 이 바탕에서 글자로 읽기 어려워 ${t.key} 로 맞췄어요.`);
