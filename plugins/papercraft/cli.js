#!/usr/bin/env node
'use strict';
// 쓰는 법: node cli.js --preset cat --out ./out [--title "..."] [--json spec.json] [--no-render]
const { createPapercraft } = require('./lib/output');
const args = process.argv.slice(2); const opt = {};
for (let i = 0; i < args.length; i++) { const a = args[i]; if (a.startsWith('--')) { const k = a.slice(2); const v = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true; opt[k] = v; } }
let spec = {};
if (opt.json) spec = JSON.parse(require('fs').readFileSync(opt.json, 'utf8'));
for (const k of ['preset', 'title', 'label', 'subtitle', 'activity', 'filename']) if (opt[k]) spec[k] = opt[k];
createPapercraft(spec, { outDir: opt.out || 'papercraft-out', render: !opt['no-render'] })
  .then((r) => { console.log(JSON.stringify({ files: r.files, summary: { ...r.summary, spec: undefined }, note: r.note }, null, 2)); })
  .catch((e) => { console.error(e); process.exit(1); });
