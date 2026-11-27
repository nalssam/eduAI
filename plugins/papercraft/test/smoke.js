'use strict';
// MCP 프로토콜로 서버를 띄워 실제로 학습지를 만들고 접어 본다.
// node test/smoke.js [출력폴더] [프리셋]
const { spawn } = require('child_process');
const path = require('path');
const out = path.resolve(process.argv[2] || 'papercraft-out');
const preset = process.argv[3] || 'cat';
const srv = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'mcp.js')], { stdio: ['pipe', 'pipe', 'inherit'] });
let buf = ''; const waiters = {}; let nextId = 1;
srv.stdout.on('data', (d) => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); const m = JSON.parse(line); if (waiters[m.id]) waiters[m.id](m); } });
const rpc = (method, params) => new Promise((res) => { const id = nextId++; waiters[id] = res; srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n'); });
const show = (r) => r.result.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
(async () => {
  const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'smoke', version: '0' } });
  console.log('server:', init.result.serverInfo);
  srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  const list = await rpc('tools/list', {});
  console.log('tools:', list.result.tools.map((t) => t.name).join(', '));
  const made = await rpc('tools/call', { name: 'create_papercraft_worksheet', arguments: { preset, output_dir: out } });
  if (made.result.isError) throw new Error(show(made));
  const info = JSON.parse(made.result.content[0].text); console.log(info.message); console.log(info.files);
  console.log('preview image attached:', made.result.content.some((c) => c.type === 'image'));
  const folded = await rpc('tools/call', { name: 'render_fold_preview', arguments: { fold_html: info.files.fold } });
  console.log(show(folded));
  srv.kill();
})().catch((e) => { console.error(e); srv.kill(); process.exit(1); });
