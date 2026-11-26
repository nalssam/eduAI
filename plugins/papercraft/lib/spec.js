'use strict';
// 캐릭터 명세(spec): 프리셋 + 사용자가 바꾼 값 → 그리기에 쓰는 완성 명세.

const PRESETS = {
  cat: {
    label: '고양이', title: '아기 고양이 만들기',
    colors: { main: '#F6C48A', light: '#FFF6EA', accent: '#E8995A', inner: '#F7B2BE' },
    ears: 'cat', eyes: 'sparkle', nose: 'cat', mouth: 'w', whiskers: true,
    mask: 'muzzle', headPattern: 'tabby', bodyPattern: 'belly', tail: 'cat', accessory: 'bow',
  },
  graycat: {
    label: '회색 고양이', title: '말랑 고양이 만들기',
    colors: { main: '#ECE8E4', light: '#FFFFFF', accent: '#C9C0BA', inner: '#F7B2BE' },
    ears: 'cat', eyes: 'sparkle', nose: 'cat', mouth: 'w', whiskers: true,
    mask: 'none', headPattern: 'tabby', bodyPattern: 'belly', tail: 'cat', accessory: 'none',
  },
  bunny: {
    label: '토끼', title: '아기 토끼 만들기',
    colors: { main: '#FFFFFF', light: '#FFF4F7', accent: '#F5C6D3', inner: '#F7A9BC' },
    ears: 'long', eyes: 'sparkle', nose: 'cat', mouth: 'w', whiskers: false,
    mask: 'none', headPattern: 'none', bodyPattern: 'heart', tail: 'puff', accessory: 'flower',
  },
  bear: {
    label: '곰', title: '아기 곰 만들기',
    colors: { main: '#C99466', light: '#F3DDC3', accent: '#A8724A', inner: '#F2B6A6' },
    ears: 'round', eyes: 'sparkle', nose: 'button', mouth: 'smile', whiskers: false,
    mask: 'muzzle', headPattern: 'none', bodyPattern: 'belly', tail: 'stub', accessory: 'bow',
  },
  panda: {
    label: '판다', title: '아기 판다 만들기',
    colors: { main: '#FFFFFF', light: '#FFFFFF', accent: '#2E2A2B', inner: '#4A4446' },
    ears: 'round', earColor: '#2E2A2B', eyes: 'sparkle', nose: 'button', mouth: 'w', whiskers: false,
    mask: 'panda', headPattern: 'none', bodyPattern: 'panda', tail: 'stub', accessory: 'none',
  },
  penguin: {
    label: '펭귄', title: '아기 펭귄 만들기',
    colors: { main: '#3D4659', light: '#FFFFFF', accent: '#2B3142', inner: '#3D4659', beak: '#F4A83A' },
    ears: 'none', eyes: 'sparkle', nose: 'beak', mouth: 'none', whiskers: false,
    mask: 'penguin', headPattern: 'none', bodyPattern: 'tuxedo', tail: 'none', accessory: 'scarf',
  },
  fox: {
    label: '여우', title: '아기 여우 만들기',
    colors: { main: '#F08A3C', light: '#FFF3E4', accent: '#7A4326', inner: '#FFF3E4' },
    ears: 'fox', eyes: 'sparkle', nose: 'button', mouth: 'smile', whiskers: false,
    mask: 'fox', headPattern: 'none', bodyPattern: 'bib', tail: 'fox', accessory: 'none',
  },
  raccoon: {
    label: '너구리', title: '아기 너구리 만들기',
    colors: { main: '#A4A4A8', light: '#FFFFFF', accent: '#3A3A3E', inner: '#F2B6C0' },
    ears: 'cat', eyes: 'sparkle', nose: 'button', mouth: 'smile', whiskers: false,
    mask: 'raccoon', headPattern: 'none', bodyPattern: 'bib', tail: 'raccoon', accessory: 'none',
  },
  koala: {
    label: '코알라', title: '아기 코알라 만들기',
    colors: { main: '#B9B9BE', light: '#F6EEF3', accent: '#8E8E95', inner: '#F6E2EC' },
    ears: 'koala', eyes: 'dot', nose: 'koala', mouth: 'none', whiskers: false,
    mask: 'none', headPattern: 'none', bodyPattern: 'belly', tail: 'none', accessory: 'none',
  },
  hamster: {
    label: '햄스터', title: '아기 햄스터 만들기',
    colors: { main: '#F3C27E', light: '#FFFFFF', accent: '#D99A4E', inner: '#F7B2BE' },
    ears: 'round', eyes: 'sparkle', nose: 'cat', mouth: 'w', whiskers: true,
    mask: 'hamster', headPattern: 'none', bodyPattern: 'belly', tail: 'none', accessory: 'seed',
  },
  chick: {
    label: '병아리', title: '아기 병아리 만들기',
    colors: { main: '#FFE27A', light: '#FFF6C8', accent: '#F5C542', inner: '#FFE27A', beak: '#F49B3A' },
    ears: 'tuft', eyes: 'sparkle', nose: 'beak', mouth: 'none', whiskers: false,
    mask: 'none', headPattern: 'none', bodyPattern: 'wing', tail: 'none', accessory: 'none',
  },
  frog: {
    label: '개구리', title: '아기 개구리 만들기',
    colors: { main: '#9BD47A', light: '#E8F7D8', accent: '#6FB257', inner: '#FFFFFF' },
    ears: 'frog', eyes: 'dot', nose: 'none', mouth: 'smile', whiskers: false,
    mask: 'none', headPattern: 'none', bodyPattern: 'belly', tail: 'none', accessory: 'none',
  },
};

const ENUMS = {
  ears: ['cat', 'fox', 'round', 'long', 'koala', 'tuft', 'frog', 'none'],
  eyes: ['sparkle', 'dot', 'happy', 'wink'],
  nose: ['cat', 'button', 'beak', 'koala', 'none'],
  mouth: ['w', 'smile', 'open', 'none'],
  mask: ['none', 'muzzle', 'fox', 'raccoon', 'panda', 'penguin', 'hamster'],
  headPattern: ['none', 'tabby', 'spots', 'tuft'],
  bodyPattern: ['none', 'belly', 'bib', 'tuxedo', 'panda', 'heart', 'wing', 'tabby'],
  tail: ['cat', 'fox', 'raccoon', 'puff', 'stub', 'none'],
  accessory: ['none', 'bow', 'flower', 'scarf', 'heart', 'seed'],
  activity: ['math', 'story', 'none'],
};

const DEFAULT_DIMS = {
  head: { w: 52, h: 44, d: 40 },
  body: { w: 38, h: 30, d: 30 },
};

function pick(v, list, fallback) { return list.includes(v) ? v : fallback; }

function normalizeSpec(input = {}) {
  const presetKey = PRESETS[input.preset] ? input.preset : 'cat';
  const p = PRESETS[presetKey];
  const colors = { cheek: '#F7A1B0', ink: '#3B2E2E', ...p.colors, ...(input.colors || {}) };
  const s = {
    preset: presetKey,
    label: input.label || p.label,
    title: input.title || (input.label ? `${input.label} 만들기` : p.title),
    subtitle: input.subtitle || '자르고 · 접고 · 붙여서 나만의 3D 친구 완성!',
    colors,
    earColor: input.earColor || p.earColor || colors.main,
    ears: pick(input.ears, ENUMS.ears, p.ears),
    eyes: pick(input.eyes, ENUMS.eyes, p.eyes),
    nose: pick(input.nose, ENUMS.nose, p.nose),
    mouth: pick(input.mouth, ENUMS.mouth, p.mouth),
    whiskers: typeof input.whiskers === 'boolean' ? input.whiskers : p.whiskers,
    blush: typeof input.blush === 'boolean' ? input.blush : true,
    mask: pick(input.mask, ENUMS.mask, p.mask),
    headPattern: pick(input.headPattern, ENUMS.headPattern, p.headPattern),
    bodyPattern: pick(input.bodyPattern, ENUMS.bodyPattern, p.bodyPattern),
    tail: pick(input.tail, ENUMS.tail, p.tail),
    accessory: pick(input.accessory, ENUMS.accessory, p.accessory),
    body: input.body !== false,
    activity: pick(input.activity, ENUMS.activity, 'math'),
    nameLine: input.nameLine !== false,
    head: { ...DEFAULT_DIMS.head, ...(input.head || {}) },
    bodyDims: { ...DEFAULT_DIMS.body, ...(input.bodyDims || {}) },
    seed: Number.isFinite(input.seed) ? input.seed : 7,
  };
  return s;
}

module.exports = { PRESETS, ENUMS, DEFAULT_DIMS, normalizeSpec };
