#!/usr/bin/env node
'use strict';
// 페이퍼크래프트 학습지 MCP 서버 (stdio, 의존성 없음).
// Claude Code 플러그인·Claude Desktop·Codex 등 MCP 를 붙일 수 있는 곳이면 어디서나 쓴다.

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { PRESETS, ENUMS } = require('../lib/spec');
const { createPapercraft } = require('../lib/output');
const { renderFold } = require('../lib/foldrender');

const VERSION = require('../package.json').version;
const STYLE_GUIDE = fs.readFileSync(path.join(__dirname, '..', 'skills', 'papercraft', 'references', 'style-guide.md'), 'utf8');

const colorProps = { type: 'object', description: '색 덮어쓰기(#RRGGBB). main=몸 바탕, light=배·주둥이, accent=무늬·귀끝, inner=귀 안쪽, cheek=볼터치, beak=부리·발', properties: { main: { type: 'string' }, light: { type: 'string' }, accent: { type: 'string' }, inner: { type: 'string' }, cheek: { type: 'string' }, beak: { type: 'string' } } };
const en = (k, d) => ({ type: 'string', enum: ENUMS[k], description: d });

const TOOLS = [
  {
    name: 'papercraft_style_guide',
    description: '페이퍼크래프트 학습지 스타일 규칙, 캐릭터 명세(spec) 항목, 프리셋 목록을 돌려준다. 새 캐릭터를 설계하기 전에 한 번 읽는다.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'create_papercraft_worksheet',
    description: '귀여운 3D 동물 페이퍼크래프트를 A4 한 장 학습지로 만든다(머리·몸통 직육면체 전개도 + 귀·꼬리 + 만드는 순서 + 완성 모습 + 탐구 활동). 인쇄용 HTML·SVG, 가능하면 PDF·PNG, 그리고 3D 접기 미리보기 HTML 을 저장한다. 프리셋 하나만 골라도 되고, 항목을 바꿔 새 동물을 만들 수도 있다.',
    inputSchema: {
      type: 'object',
      properties: {
        preset: { type: 'string', enum: Object.keys(PRESETS), description: '출발점 동물. 가장 가까운 것을 고른 뒤 아래 항목으로 바꾼다.' },
        label: { type: 'string', description: '동물 이름(예: 강아지). title 이 없으면 "OO 만들기" 로 쓴다.' },
        title: { type: 'string', description: '학습지 큰 제목(12자 안팎).' },
        subtitle: { type: 'string', description: '제목 아래 한 줄.' },
        colors: colorProps,
        earColor: { type: 'string', description: '귀 바탕색(판다처럼 몸과 다를 때).' },
        ears: en('ears', '귀 모양'), eyes: en('eyes', '눈'), nose: en('nose', '코'), mouth: en('mouth', '입'),
        mask: en('mask', '얼굴 무늬'), headPattern: en('headPattern', '머리 무늬'), bodyPattern: en('bodyPattern', '몸 무늬'),
        tail: en('tail', '꼬리'), accessory: en('accessory', '장식'),
        whiskers: { type: 'boolean' }, blush: { type: 'boolean' },
        body: { type: 'boolean', description: 'false 면 머리 상자 하나만(말랑 큐브).' },
        activity: { type: 'string', enum: ENUMS.activity, description: '아래 오른쪽 칸: math=직육면체 탐구(초5 수학), story=내 친구 소개, none=만들기 꿀팁' },
        nameLine: { type: 'boolean', description: '이름 쓰는 줄(기본 true)' },
        head: { type: 'object', description: '머리 상자 mm {w,h,d} (기본 52×44×40). A4 에 맞게 자동으로 줄어든다.', properties: { w: { type: 'number' }, h: { type: 'number' }, d: { type: 'number' } } },
        bodyDims: { type: 'object', description: '몸통 상자 mm {w,h,d} (기본 38×30×30)', properties: { w: { type: 'number' }, h: { type: 'number' }, d: { type: 'number' } } },
        filename: { type: 'string', description: '파일 이름 앞부분(영문 권장)' },
        output_dir: { type: 'string', description: '저장할 폴더(절대 경로 권장). 없으면 현재 폴더의 papercraft-out.' },
        render: { type: 'boolean', description: 'PDF·PNG 렌더(Playwright 필요). 기본 true' },
      },
    },
  },
  {
    name: 'render_fold_preview',
    description: 'create_papercraft_worksheet 가 만든 *-fold-3d.html 을 헤드리스 브라우저로 돌려 "가상으로 접는" 장면 사진(PNG), 장면표, MP4·GIF 영상을 만든다. 사용자에게 접는 과정을 보여 줄 때 쓴다. Playwright 필요(영상은 ffmpeg 도).',
    inputSchema: {
      type: 'object', required: ['fold_html'],
      properties: {
        fold_html: { type: 'string', description: '*-fold-3d.html 경로' },
        output_dir: { type: 'string' },
        video: { type: 'boolean', description: 'MP4·GIF 도 만들기(기본 true)' },
      },
    },
  },
];

function textResult(obj, extra = []) {
  return { content: [{ type: 'text', text: typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2) }, ...extra] };
}

function imageContent(file, maxBytes = 900 * 1024) {
  try { const b = fs.readFileSync(file); if (b.length > maxBytes) return []; return [{ type: 'image', data: b.toString('base64'), mimeType: 'image/png' }]; } catch (e) { return []; }
}

async function callTool(name, args = {}) {
  if (name === 'papercraft_style_guide') {
    const presets = Object.entries(PRESETS).map(([k, v]) => `- ${k}: ${v.label}`).join('\n');
    return textResult(`${STYLE_GUIDE}\n\n## 프리셋\n${presets}\n\n## 고를 수 있는 값\n${Object.entries(ENUMS).map(([k, v]) => `- ${k}: ${v.join(' | ')}`).join('\n')}`);
  }
  if (name === 'create_papercraft_worksheet') {
    const outDir = path.resolve(args.output_dir || path.join(process.cwd(), 'papercraft-out'));
    const { output_dir, render, ...spec } = args; void output_dir;
    const r = await createPapercraft(spec, { outDir, render: render !== false });
    const preview = r.files.png ? imageContent(r.files.png) : [];
    return textResult({
      message: `「${r.summary.title}」 학습지를 만들었어요. A4 한 장, 완성 높이 약 ${r.summary.finishedHeightCm}cm.`,
      files: r.files, parts: r.summary.parts, scale: r.summary.scale, note: r.note || undefined,
      next: '가상 접기를 보여 주려면 render_fold_preview 에 files.fold 를 넘기세요. 인쇄는 files.pdf(없으면 files.html 을 브라우저에서 인쇄).',
    }, preview);
  }
  if (name === 'render_fold_preview') {
    if (!args.fold_html || !fs.existsSync(args.fold_html)) throw new Error('fold_html 파일을 찾지 못했어요.');
    const outDir = path.resolve(args.output_dir || path.dirname(args.fold_html));
    const r = await renderFold(args.fold_html, outDir, { video: args.video !== false });
    return textResult({ message: '가상 접기 장면을 만들었어요: 인쇄 → 오리기 → 접기 → 붙이기 → 완성', ...r }, r.storyboard ? imageContent(r.storyboard, 1200 * 1024) : []);
  }
  throw new Error(`모르는 도구: ${name}`);
}

// ── JSON-RPC over stdio ───────────────────────────────────
function send(msg) { process.stdout.write(JSON.stringify(msg) + '\n'); }

async function handle(msg) {
  const { id, method, params } = msg;
  const reply = (result) => id !== undefined && send({ jsonrpc: '2.0', id, result });
  const fail = (code, message) => id !== undefined && send({ jsonrpc: '2.0', id, error: { code, message } });
  try {
    switch (method) {
      case 'initialize':
        return reply({
          protocolVersion: (params && params.protocolVersion) || '2025-06-18',
          capabilities: { tools: {} },
          serverInfo: { name: 'papercraft', version: VERSION },
          instructions: '귀여운 3D 동물 페이퍼크래프트 A4 학습지를 만든다. 사용자가 페이퍼크래프트·종이접기 전개도·만들기 학습지를 원하면 create_papercraft_worksheet 를 쓰고, 접는 모습을 보여 달라면 render_fold_preview 를 쓴다. 새 동물을 설계할 땐 papercraft_style_guide 를 먼저 읽는다.',
        });
      case 'notifications/initialized': case 'notifications/cancelled': return undefined;
      case 'ping': return reply({});
      case 'tools/list': return reply({ tools: TOOLS });
      case 'tools/call': {
        try { return reply(await callTool(params.name, params.arguments || {})); } catch (e) { return reply({ isError: true, content: [{ type: 'text', text: `오류: ${e.message}` }] }); }
      }
      default: return fail(-32601, `Method not found: ${method}`);
    }
  } catch (e) { return fail(-32603, e.message); }
}

if (require.main === module) {
  const rl = readline.createInterface({ input: process.stdin });
  rl.on('line', (line) => { if (!line.trim()) return; let m; try { m = JSON.parse(line); } catch (e) { return send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); } handle(m); });
  void os;
}

module.exports = { TOOLS, callTool };
