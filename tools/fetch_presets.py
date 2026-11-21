#!/usr/bin/env python3
"""getdesign.kr(ko/design.md 카탈로그)에서 브랜드별 대표색·라운드를 뽑아 presets.json 을 만든다.

사용: python3 tools/fetch_presets.py [받아 둔 md 폴더]
폴더를 주지 않으면 카탈로그에서 새로 받는다. 값은 각 DESIGN.md 의 frontmatter 에서만 읽는다.
대표색은 `primary` 가 가리키는 토큰이고, 그 줄 주석에 브랜드가 발행한 hex 가 있으면 그것을 쓴다.
없으면 OKLCH 를 sRGB 로 바꾼 근삿값을 쓰고 src 를 'oklch' 로 적는다.
"""
import json, math, os, re, subprocess, sys, tempfile

BASE = 'https://www.getdesign.kr'
OUT = os.path.join(os.path.dirname(__file__), '..', 'skills', 'nalssam-html-ppt', 'assets', 'presets.json')


def curl(url, path):
    subprocess.run(['curl', '-fsSL', '-o', path, url], check=True)


def oklch_hex(L, C, H):
    h = math.radians(H)
    a, b = C * math.cos(h), C * math.sin(h)
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    rgb = (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
           -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
           -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)
    out = []
    for v in rgb:
        v = max(0.0, min(1.0, v))
        v = 12.92 * v if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055
        out.append(round(max(0.0, min(1.0, v)) * 255))
    return '#%02X%02X%02X' % tuple(out)


def section(front, key):
    m = re.search(r'^%s:\n((?:[ \t]+.*\n|\n)+)' % key, front, re.M)
    rows = {}
    if m:
        for line in m.group(1).splitlines():
            r = re.match(r'\s+([\w.-]+):\s*(.*)$', line)
            if r and not line.strip().startswith('#'):
                rows[r.group(1)] = r.group(2)
    return rows


def resolve(colors, key, depth=0):
    raw = colors.get(key)
    if raw is None or depth > 6:
        return None
    ref = re.match(r'"\{colors\.([\w.-]+)\}"', raw)
    if ref:
        return resolve(colors, ref.group(1), depth + 1)
    val, _, comment = raw.partition('#')
    comment = '#' + comment if _ else ''
    hx = re.search(r'#([0-9A-Fa-f]{6})\b', comment)
    ok = re.match(r'\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)', val)
    if hx:
        return '#' + hx.group(1).upper(), 'hex'
    if ok:
        return oklch_hex(*map(float, ok.groups())), 'oklch'
    hx2 = re.match(r'\s*"?#([0-9A-Fa-f]{6})"?', raw)
    return ('#' + hx2.group(1).upper(), 'hex') if hx2 else None


# 문서에 `primary` 별칭이 없는 항목: 문서가 브랜드색·주 버튼색이라고 적은 토큰을 사람이 골라 둔 것
FALLBACK = {'laftel': 'point', 'chzzk': 'brand-strongest', 'banksalad': 'green-normal', 'lg-electronics': 'active-red',
            'zigbang': 'orange1', 'gs-retail': 'signature-cyan', 'bezier': 'blue-400', 'gmarket': 'green-500',
            'seed-design': 'carrot-600'}


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    tmp = tempfile.mkdtemp()
    idx = os.path.join(src, '..', 'llms.txt') if src else os.path.join(tmp, 'llms.txt')
    if not os.path.exists(idx):
        curl(BASE + '/llms.txt', idx)
    out, skipped = [], []
    for name, slug, rest in re.findall(r'^- \[([^\]]+)\]\(https://www\.getdesign\.kr/services/([\w-]+)/llms\.txt\): ([^\n]*)', open(idx, encoding='utf8').read(), re.M):
        path = os.path.join(src or tmp, slug + '.md')
        if not os.path.exists(path):
            curl('%s/services/%s/llms.txt' % (BASE, slug), path)
        text = open(path, encoding='utf8').read()
        front = text.split('\n---', 1)[0]
        colors = section(front, 'colors')
        got, via = resolve(colors, 'primary'), 'primary'
        if not got and slug in FALLBACK:
            got, via = resolve(colors, FALLBACK[slug]), FALLBACK[slug]
        if not got:
            skipped.append(slug)
            continue
        radii = sorted({int(float(v)) for v in re.findall(r'(\d+(?:\.\d+)?)px', ' '.join(section(front, 'rounded').values())) if 2 <= float(v) <= 28})
        out.append({'slug': slug, 'name': name, 'cat': rest.split(' ')[0], 'key': got[0], 'src': got[1], 'via': via,
                    'radii': radii, 'url': '%s/services/%s' % (BASE, slug)})
    json.dump({'source': 'ko/design.md (getdesign.kr) · CC BY 4.0', 'brands': out}, open(OUT, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print(len(out), '개 저장 →', os.path.normpath(OUT))
    if skipped:
        print('대표색을 읽지 못해 뺀 항목:', ', '.join(skipped))


if __name__ == '__main__':
    main()
