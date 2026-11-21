#!/usr/bin/env python3
"""덱에 쓰인 글자만 담은 Pretendard 를 HTML 안에 넣는다 (인터넷이 없는 교실용).

사용: python3 inline_font.py 덱.html 완성.html [PretendardVariable.ttf 경로]
준비: pip install fonttools brotli
글꼴 파일이 없으면 npm 에서 한 번 받는다(약 72MB, ~/.cache/nalssam-html-ppt 에 보관).
Pretendard 는 SIL OFL 1.1 이라 문서에 담아 나눠도 된다.
"""
import base64, html, io, os, re, subprocess, sys, tarfile, tempfile

CDN = re.compile(r'<link[^>]+pretendard[^>]+>\s*', re.I)
MEMBER = 'package/dist/public/variable/PretendardVariable.ttf'
ALWAYS = ' 0123456789.,:;!?%/|()[]"\'“”‘’·…—–-+×→←↑↓›‹▦⛶'


def find_font(arg):
    if arg:
        return arg
    cache = os.path.join(os.environ.get('XDG_CACHE_HOME', os.path.expanduser('~/.cache')), 'nalssam-html-ppt')
    path = os.path.join(cache, 'PretendardVariable.ttf')
    if os.path.exists(path):
        return path
    os.makedirs(cache, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['npm', 'pack', 'pretendard@1.3.9'], cwd=tmp, check=True, capture_output=True)
        with tarfile.open(os.path.join(tmp, 'pretendard-1.3.9.tgz')) as tar:
            with open(path, 'wb') as out:
                out.write(tar.extractfile(MEMBER).read())
    return path


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    src, dst = sys.argv[1], sys.argv[2]
    from fontTools import subset
    from fontTools.ttLib import TTFont

    doc = open(src, encoding='utf8').read()
    body = re.sub(r'<(script|style)\b.*?</\1>', ' ', doc, flags=re.S)
    text = html.unescape(re.sub(r'<[^>]+>', ' ', body))
    chars = ''.join(sorted(set(text + ALWAYS) - set('\n\r\t')))

    font = TTFont(find_font(sys.argv[3] if len(sys.argv) > 3 else None))
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    sub = subset.Subsetter(opts)
    sub.populate(text=chars)
    sub.subset(font)
    buf = io.BytesIO()
    font.flavor = 'woff2'
    font.save(buf)
    b64 = base64.b64encode(buf.getvalue()).decode()

    face = ('<style id="font-inline">@font-face{font-family:"Pretendard Variable";font-weight:45 920;'
            'font-style:normal;font-display:swap;src:url(data:font/woff2;base64,%s) format("woff2")}</style>\n' % b64)
    doc = CDN.sub('', doc)
    doc = re.sub(r'<style id="font-inline">.*?</style>\s*', '', doc, flags=re.S)
    doc = doc.replace('<style>', face + '<style>', 1)
    open(dst, 'w', encoding='utf8').write(doc)
    print('%s  글자 %d개 · 글꼴 %dKB · 전체 %dKB' % (dst, len(chars), len(buf.getvalue()) // 1024, len(doc.encode()) // 1024))


if __name__ == '__main__':
    main()
