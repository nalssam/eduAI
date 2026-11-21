---
name: "nalssam-pptx"
description: "nalssam(날쌤) 스타일 PPTX를 python-pptx로 만든다. 웜 오프화이트·네이비·틸·코랄, Pretendard 임베드, 결론 문장 제목, 장마다 메모란 대본. 교원 연수 원고 PPT용. 트리거: nalssam_pptx, 날쌤 스타일 PPT, 연수 원고 PPT."
---

# nalssam-pptx · 날쌤 스타일 PPTX

> 분필팩 공개판. 제안서·IR 모드와 개인 프로필 상수는 빠져 있다.

「AI Agent 시대, 교실은 어떻게 달라지는가?」(40장) 덱의 look & feel 을 그대로 재현하는 절차와 코드다. 사용자는 이 스킬을 "nalssam_pptx"라고 부른다(스킬 이름은 규칙상 하이픈). 대상은 교사·교육행정직 공무원·교육전문직·디지털 튜터·방과후 강사 연수(원격연수 포함). 결과물은 16:9 .pptx, **대본은 슬라이드 메모란**, 장표마다 알맞은 이미지, 아래 규격 고정.

`pptx-maker`·`anthropic-skills:pptx` 보다 이 스킬을 우선한다. 철학은 같다(결론 문장 제목 · 한 장 한 메시지 · 모든 장에 대본 · 지어낸 숫자 금지). 다만 python-pptx 로 직접 조립해 좌표와 장표 유형이 고정되므로 늘 같은 얼굴이 나온다.


## 1. 시작 전 확인
요청에 이미 있는 것은 다시 묻지 않는다. 모자라면 `AskUserQuestion` 한 번에(최대 4문항):
① 행사: 이름·날짜·시간·대상(일정은 Google Calendar 로 확인), 공동 강사 표기 여부 ② 분량: 총 시간·장수 ③ 대본: **녹화 낭독형**(분당 300~350자, 그대로 읽는 글) / **라이브 요점형**(분당 약 100자 + [시연]·[참여] 큐) ④ 이미지: 새로 생성 / 가진 이미지만.
스케줄·무인 실행이면 묻지 말고 합리적 가정을 첫 줄에 밝히고 진행한다.

## 2. 스타일 한눈에
- **분위기**: 웜 오프화이트 바탕(`FBFAF6`) 위에 네이비 글씨, 틸 포인트, 코랄 한 방울. 여백이 넉넉하다. 카드는 흰 바탕 + 얇은 베이지 테두리의 **납작한 둥근 상자(그림자 없음)**.
- **글꼴**: Pretendard(본문) · **Pretendard ExtraBold**(제목·표지) · Pretendard Medium(쪽번호). 반드시 임베드(§8~9).
- **문장 규칙**: 제목 = 결론 한 문장(30자 안팎). 키커 = "01 섹션명" 작은 틸 글씨. 한 장 한 메시지, 근거 2~5개. 아래에 **민트 띠**로 한 줄 결론 또는 "교사가 지키는 것". 같은 유형 3장 연속 금지.
- **바닥글**: `행사명  |  nalssam 박준호  |  2026. 10. 31.(토)` + 오른쪽 `NN / 총장수`(표지는 쪽번호 없음). 삽입 장은 `13-1 / 35` 처럼 라벨, 분모는 본편 총장수.
- **이미지 3종**: ⓐ 3D 클레이·세라믹 오브젝트(개념 장표) ⓑ 셰프 마스코트 스토리 장면(전면 16:9, 한글 제목·라벨이 그림 안에) ⓒ 실제 화면 캡처(둥근 모서리 + 얇은 테두리). 그림에는 로고·상표·실존 캐릭터를 넣지 않는다(도구 이름은 슬라이드의 글자 칩으로).
- **말투**: 대본은 구어체 존댓말. 낭독용이라 영문 약어는 소리 나는 대로(CLAUDE.md → 클로드닷엠디).
- **대상별 소재 힌트**: 교사(수업 설계·자료·평가·피드백·학부모 소통) / 교육행정직(공문·계획서·보고서·회의록·예산·민원·엑셀 정리) / 교육전문직(정책 연구·장학자료·연수 기획·설문 분석) / 디지털 튜터(학생 맞춤 지원·도구 안내·학습 데이터·상담 기록) / 방과후 강사(프로그램 계획·활동 안내문·학부모 소통·만족도 조사). 어느 대상이든 학생 실명·민감정보·비공개 공문은 외부 AI 에 올리지 않는다는 원칙을 한 장에 넣는다.

## 3. 작업 순서
1. **확인**(§1) → 일정·이전 원고를 Calendar·Drive·프로젝트 문서에서 찾는다.
2. **구조·시간표**: 장 목록(제목 = 결론 문장)과 장별 분. 기본 골격: 표지 → (소개) → 오늘의 질문·학습목표 → 본문(개념 → 사례 → 시연 → 실습) → 개조식 요약 → 내일 시작할 한 가지 → 출처 → 감사 + QR. 합계 검산: 마지막 장 종료 시각 = 행사 종료(쉬는 시간 포함). 길면 장 목록을 먼저 보여 준다.
3. **조사**: 최신 사실·수치·제품 정보는 WebSearch/WebFetch 로 확인하고 출처를 적는다. 논문은 저자·연도·저널·권호까지. 확인 못 한 것은 쓰지 않고, 예시는 '(가상)' 표시.
4. **이미지**(§6)를 먼저 일괄 제출해 두고, 기다리는 동안 캡처 수집과 대본 초안을 쓴다.
5. **조립**: `build.py` 하나에 장마다 `notes()` 까지(§9 뼈대). 마지막에 `assert n == TOTAL`.
6. **글꼴 임베드**: `python embed_fonts.py raw.pptx 최종.pptx` — 항상 마지막 저장 단계. 고칠 일이 생기면 raw 를 다시 만들어 이 단계부터 반복.
7. **점검**: `qa.py` → `render_check.py` → 모아보기를 전부 눈으로 → 의심 장 확대 → 수정 → 반복(오류 0, 겹침·잘림·넘침 0).
8. **전달**: `SendUserFile` + 한두 문장(장수 · 총 시간 · 가상 예시 · 확인 못 한 사실). 폴더가 연결된 세션이면 `device_commit_files` 로 폴더에도 저장. 프로젝트 세션이면 대본·시간표를 md 로 `project_write`(이어 쓸 가치가 있을 때).

## 4. 토큰과 좌표 (단위 inch, 슬라이드 13.333 × 7.5)
| 이름 | 값 | 쓰임 |
|---|---|---|
| BG / NAVY / TEAL / GRAY | `FBFAF6` / `132C3D` / `18766B` / `586875` | 배경 / 제목·본문 / 키커·번호·칩 글자 / 부제·설명·바닥글 |
| CORAL / LINE / CARD | `D9734E` / `E4DFD3` / `FFFFFF` | 마지막 칸·원칙 한 줄 / 카드 테두리 / 카드 바탕 |
| TEAL_SOFT / PAPER / ZEBRA | `E3F0EC` / `F3F0E8` / `F5F2EA` | 민트 띠·칩 바탕 / 종이색 상자 / 표 줄무늬 |

| 요소 | 글꼴 · 크기 | 위치 |
|---|---|---|
| 키커 | Pretendard Bold 10 틸 | (0.58, 0.35) |
| 제목 | ExtraBold 29(compact 28), 네이비 | (0.58, 0.85) 폭 12.22 · compact 는 y 0.78 |
| 부제 | Regular 13 회색 | (0.58, 1.83) · compact 는 y 1.5 |
| 카드 제목 / 설명 | Bold 18~20 / Regular 13~14 회색 | 카드 아래 y 5.76 / 6.26 |
| 표·작은 글씨 / 각주·출처 | 12~12.5 / 8.5~10 회색 | |
| 바닥글 / 쪽번호 | 9 회색 / Medium 10 | (0.58, 7.14) / 오른쪽 끝 12.91 |

격자: 좌우 여백 0.58, 본문 폭 12.17(0.58~12.75), 본문 영역 y 2.0~6.9. 3열 x = 0.58 / 4.75 / 8.92 폭 3.83. 4열 x = 0.58 + 3.08·i 폭 2.88. 민트 띠 y 5.8~6.4 높이 0.58~0.62.
도형: 카드 둥글기 0.06~0.12, 그림자 없음(`_flat`), 스크린샷은 `adj=5000` + `line=LINE`(0.75pt), 일러스트는 둥글림 없이 contain. 텍스트 상자는 여백 0 · 자동맞춤 없음 · 줄간격 1.14(작은 글씨 1.2) — 그래서 넘침은 `qa.py` 와 렌더링으로 잡는다. 애니메이션·전환은 쓰지 않는다.

## 5. 장표 유형 (코드의 함수 이름)
| 유형 | 구성 |
|---|---|
| 표지 | `cover()` — 54pt 제목 한 줄(한글 약 16자, 길면 48pt), 왼쪽 26pt 굵은 문구, 오른쪽 히어로, 틸 21pt 소속 줄 |
| 3열 카드 | `cards3()` — 4:3 일러스트(contain) 또는 스크린샷(cover) + 20pt 제목 + 14pt 설명. 소개·오늘의 질문·사례 |
| 타임라인 | `timeline()` — 4칸, 점선 + 연도 점, 마지막 칸 코랄. 연도가 발표자 정리면 하단에 '※ 발표자 정리' 각주 |
| 비교표 | `table()` + `banner()` — 4열 줄무늬, 핵심 열만 진하게 |
| 실천 단계 | 왼쪽 일러스트 + `steps()` (1주 · 2주 · 3주~) + `banner()` |
| 수업 적용 4단계 | `header(compact=True)` + `step_cards()` — 칩 · 장면 · AI 가 하는 일 · 예시 요청 · 도구 칩 · 교사가 지키는 것 |
| 스크린샷 3열 | `cards3()` mode 'cover', 부제 "실제 화면: …" |
| 전면 이미지 | `fullbleed()` — 머리말·바닥글 없음, 대본에 장면 설명 |
| 변화 요약 | `rows_arrow()` + 오른쪽 일러스트·한 줄 |
| 사례 지도 · 적용 아이디어 | `case_grid()` (2×3) · `idea_grid()` (2×2, 왼쪽 일러스트, 코랄 원칙 한 줄) |
| 인용·개념 | 왼쪽 일러스트 + 오른쪽 21pt 굵은 인용(따옴표 틸, 3줄 수동 줄바꿈) + 3칩(›로 연결) + 출처 10pt |
| 벤다이어그램 | 반투명 원 3개(`alpha` 14~22%) + 오른쪽 카드 4장 + 출처 8.5pt |
| 참고문헌 | `refs()` — 일러스트 생성 도구와 "상표는 각 기업 소유" 고지 1줄 포함 |
| 감사 | 제목 '감사합니다' + 25pt 문구 + 이미지 + `qr_card()`(`make_qr` 로 디코드 검증) + 오른쪽 아래 틸 이름 |

## 6. 이미지
공통: 그림에 로고·상표·실존/브랜드 캐릭터 금지, 그림 속 글자는 짧은 제목·라벨만(긴 문장은 슬라이드 글자로). 사용자가 직접 만들어 준 이미지는 그대로 쓴다. 생성 전 `balance` 로 잔액을 보고, 10장 이상이면 소모량을 한 줄로 알린다.

**ⓐ 클레이 오브젝트 (개념 장표)** — Higgsfield `nano_banana_pro`, 4:3, 스타일 앵커 1장을 참조로.
- 앵커 확보 순서: ① 프로젝트 문서 `claude/nalssam_anchor_clay.b64.txt`(base64 → `base64 -d`) ② 사용자가 올린 이전 날쌤 덱의 일러스트 1장(python-pptx `shape.image.blob`) ③ 없으면 텍스트만.
- 흐름: `media_upload`(filename, content_type) → 응답의 curl 대로 `PUT`(헤더 `Content-Type`, `If-None-Match: *`) → HTTP 200 확인 → `media_confirm`(type=image) → `generate_image_batch`(requests[] 최대 12: `model`, `prompt`, `aspect_ratio`, `medias:[{value:<media_id>, role:'image'}]`, role 은 서버가 보정) → `jobs_wait`(15초 이하, `all_terminal` 까지 반복) → 결과 URL 을 `curl -o` 로 즉시 저장(URL 은 영구가 아니다) → `python fixbg.py g*.png` → `*_fx.jpg` 를 덱에 넣는다.
- 프롬프트 틀: `Same illustration style as the reference image: soft 3D clay and matte ceramic objects, muted teal, deep navy, terracotta coral and cream palette, warm plain off-white background, soft studio light, gentle shadow, isolated object, no text, no letters, no logos. Subject: …` (앵커가 없으면 첫 구절을 빼고 `soft 3D paper-craft and glass orb render` 를 더한다)
- 주제는 장의 메시지를 사물 하나로: 말풍선+만년필(프롬프트) · 폴더 더미+유리구슬(컨텍스트) · 작업대의 하네스에 걸린 구슬(하네스) · 트랙 위 로봇(루프) · 지휘자와 로봇 셋(멀티에이전트) · 조종 콘솔(환경 설정) · 칠판 있는 교실(적용) · 계단 세 칸+트로피(단계) · 두 층 사무실의 로봇 넷(부서 운영).
- 생성물은 몽땅 모아보기로 보고, 어색한 것만 프롬프트를 고쳐 재생성(최대 2회).

**ⓑ 셰프 마스코트 스토리 장면 (전면 16:9)** — 원본은 사용자가 ChatGPT(gpt-image)로 직접 만든 장면이다. 새로 필요하면 사용자가 ChatGPT 로 만들게 하거나, Higgsfield `gpt_image_2_5`(16:9)로 만든다. 마스코트 참조 이미지(`claude/nalssam_anchor_chef.b64.txt` 또는 사용자 첨부)를 `medias` 로 넣으면 캐릭터가 이어진다.
- 은유 체계: 단일 에이전트 = 혼자 요리하는 셰프 · 멀티에이전트 = 주방 분업 · 프롬프트 = 레시피 카드 · 컨텍스트 = 요리책 + 알레르기 표시 · 하네스 = 조리도구 + 안전 체크리스트 · 루프 = 맛보고 고치기.
- 프롬프트 틀: `Cute original 3D toy-style mascot scene, 16:9. A round white-headed, mint-tinted little chef robot with a white chef hat, mint apron with a small chef-hat emblem, big glossy dark-green eyes, rosy cheeks. Warm cream restaurant kitchen, copper pendant lamps, green plants, glowing mint cable lines linking the stations. Orange pill-shaped label chips with short Korean words: '…'. Bold rounded dark-green Korean heading: '…'. Warm soft light, glossy vinyl-toy finish, no logos, no brand characters.` 그림 속 한글 철자를 반드시 확인하고, 틀리면 재생성하거나 글자를 빼고 슬라이드 글자로 얹는다.

**ⓒ 실제 화면 캡처** — Canva(`export-design` → PDF → `pdftoppm -r 150`/`pdfimages`), Padlet(MCP 로 내용 확인 → 공개 URL 을 Playwright 전체 페이지 스크린샷), Drive(`download_file_content`), 브라우저(Claude in Chrome: 첫 호출은 `browser_batch` 안에서 `tabs_context_mcp` 부터), 사용자 컴퓨터(`device_stage_files`). 학생 이름·얼굴·개인정보는 가리거나 크롭하고, 사이드바 글자가 섞이면 다시 크롭한다. 장표에는 `cards3` cover + `adj=5000, line=LINE`, 부제에 "실제 화면: …".

## 7. 대본(메모) 규칙
- 메모란(`notes()`)에 쓴다. 첫 줄 `7장 · 3분 · 10:17~10:20`(삽입 장은 `13-1장 · …`), 빈 줄, 구어체 본문. 쉬는 시간은 `[쉬는 시간 10분 · 11:01~11:11]`, 시연·참여는 `[시연]` `[참여]` 큐.
- 길이: 녹화 낭독형 분당 300~350자(공백 포함), 라이브 요점형 분당 약 100자. 장별 분을 합쳐 행사 시간과 맞는지 코드로 검산한다.
- 첫 장에 인사·소개, 마지막 장에 마무리 인사 + QR 안내. 출처 장은 "출처는 화면으로 대신하겠습니다" 한 줄이면 된다(qa 의 40자 주의를 피하려면 한두 문장 덧붙인다).
- 한 장의 대본은 그 장의 제목(결론)을 다시 한 번 말로 닫는다. 숫자·연도·인용은 지어내지 않는다(예시는 가상이라고 말한다). 학생 실명 금지.

## 8. 환경 준비 (새 세션에서 한 번)
```bash
python3 -c "import pptx, fontTools, PIL" 2>/dev/null || pip install python-pptx fonttools pillow --break-system-packages
pip install qrcode zxing-cpp --break-system-packages            # QR 이 필요할 때
mkdir -p ~/.local/share/fonts && cd "$(mktemp -d)" && npm pack pretendard@1.3.9 >/dev/null 2>&1 \
 && tar -xzf pretendard-1.3.9.tgz --wildcards 'package/dist/public/static/alternative/Pretendard-*.ttf' \
 && cp package/dist/public/static/alternative/Pretendard-*.ttf ~/.local/share/fonts/ && fc-cache -f \
 && fc-list | grep -c Pretendard            # 9 가 나오면 성공 (72MB 받음)
```
LibreOffice(`soffice`)·`pdftoppm`·Node 가 있어야 렌더링 점검을 한다. 아래 코드 블록의 첫 줄 `# file: 이름` 대로 같은 폴더에 저장해서 쓴다.

## 9. 코드
### nalssam_lib.py — 조립 헬퍼 (좌표는 모두 inch)
```python
# file: nalssam_lib.py
"""nalssam 스타일 PPTX 헬퍼 (python-pptx 1.x). 16:9 = 13.333 x 7.5 in. 모든 좌표 단위는 inch."""
from pptx import Presentation
from pptx.util import Inches as I, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
from lxml import etree
from PIL import Image

NAVY = '132C3D'; TEAL = '18766B'; GRAY = '586875'; BG = 'FBFAF6'        # 제목·강조·보조글·배경
CORAL = 'D9734E'; LINE = 'E4DFD3'; CARD = 'FFFFFF'; TEAL_SOFT = 'E3F0EC'  # 포인트·테두리·카드·민트 띠
PAPER = 'F3F0E8'; ZEBRA = 'F5F2EA'                                        # 종이색 상자·표 줄무늬
CFG = {'foot': '행사명  |  nalssam 박준호  |  2026. 0. 0.'}                 # 바닥글: 덱마다 바꾼다


def rgb(h): return RGBColor.from_string(h)


def _flat(sh):
    """도형의 테마 스타일(p:style: 그림자·테두리 참조)을 지운다 → 어느 프로그램에서 열어도 그림자 없이 납작하게."""
    st = sh._element.find(qn('p:style'))
    if st is not None: sh._element.remove(st)


def new_deck(ref=None):
    """ref가 있으면 그 덱(이전 날쌤 덱)의 틀만 쓰고 장표를 비운다. 없으면 빈 16:9 덱."""
    if ref:
        prs = Presentation(ref); lst = prs.slides._sldIdLst
        for sid in list(lst):
            prs.part.drop_rel(sid.get(qn('r:id'))); lst.remove(sid)
        return prs
    prs = Presentation(); prs.slide_width = 12192000; prs.slide_height = 6858000
    return prs


def _blank(prs):
    for l in prs.slide_layouts:
        if l.name.strip().lower() in ('blank', '빈 화면'): return l
    return prs.slide_layouts[0] if len(prs.slide_layouts) == 1 else prs.slide_layouts[-1]


def add_slide(prs):
    s = prs.slides.add_slide(_blank(prs))
    for ph in list(s.placeholders): ph._element.getparent().remove(ph._element)
    f = s.background.fill; f.solid(); f.fore_color.rgb = rgb(BG)
    return s


def _font(run, size, bold, color, face):
    f = run.font; f.size = Pt(size); f.bold = bold; f.color.rgb = rgb(color); f.name = face
    rPr = run._r.get_or_add_rPr(); rPr.set('lang', 'ko-KR')
    for tag in ('a:ea', 'a:cs'):                       # 한글(ea)·복합(cs) 글꼴도 같은 이름으로
        el = rPr.find(qn(tag))
        if el is None: el = etree.SubElement(rPr, qn(tag))
        el.set('typeface', face)


def text(s, x, y, w, h, content, size=14, bold=False, color=NAVY, face='Pretendard',
         align='l', anchor='t', lnspc=1.14, spc_after=0):
    """content: str('\\n'=새 문단) 또는 문단 리스트. 문단 = str 또는 [(글, {size,bold,color,face}), ...]"""
    tb = s.shapes.add_textbox(I(x), I(y), I(w), I(h)); tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = {'t': MSO_ANCHOR.TOP, 'm': MSO_ANCHOR.MIDDLE, 'b': MSO_ANCHOR.BOTTOM}[anchor]
    paras = content.split('\n') if isinstance(content, str) else content
    for i, para in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = {'l': PP_ALIGN.LEFT, 'c': PP_ALIGN.CENTER, 'r': PP_ALIGN.RIGHT}[align]
        p.line_spacing = lnspc; p.space_after = Pt(spc_after)
        for t, o in ([(para, {})] if isinstance(para, str) else para):
            r = p.add_run(); r.text = t
            _font(r, o.get('size', size), o.get('bold', bold), o.get('color', color), o.get('face', face))
    return tb


def header(s, kicker, title, sub=None, tsize=29, compact=False):
    """키커(틸 10pt) + 결론 한 문장 제목(ExtraBold 29pt) + 부제(13pt). compact=True: 본문이 y=2.0부터 시작하는 빽빽한 장표용"""
    text(s, 0.58, 0.35, 12.15, 0.28, kicker, 10, True, TEAL)
    text(s, 0.58, 0.78 if compact else 0.85, 12.22, 0.6 if compact else 1.0, title, 28 if compact else tsize, False, NAVY, 'Pretendard ExtraBold')
    if sub: text(s, 0.58, 1.5 if compact else 1.83, 12.15, 0.32 if compact else 0.39, sub, 13, False, GRAY)


def footer(s, n, total):
    """n: 정수 또는 '13-1' 같은 문자열"""
    text(s, 0.58, 7.14, 11.0, 0.19, CFG['foot'], 9, False, GRAY)
    lab = f'{n:02d}' if isinstance(n, int) else n
    text(s, 11.61, 7.07, 1.3, 0.32, f'{lab} / {total}', 10, False, GRAY, 'Pretendard Medium', align='r')


def _round(pic, adj=6000, line=None):
    geom = pic._element.spPr.find(qn('a:prstGeom')); geom.set('prst', 'roundRect')
    av = geom.find(qn('a:avLst'))
    for c in list(av): av.remove(c)
    gd = etree.SubElement(av, qn('a:gd')); gd.set('name', 'adj'); gd.set('fmla', f'val {adj}')
    if line: pic.line.color.rgb = rgb(line); pic.line.width = Pt(0.75)


def pic(s, path, x, y, w, h, mode='contain', anchor='c', adj=6000, line=None, valign='c', alt=None):
    """contain: 비율 유지하며 상자 안에 / cover: 상자를 채우고 넘치는 부분은 크롭(anchor l/c/r, t/c/b).
    adj: 모서리 둥글기(None=직각). 일러스트(배경 투명 느낌)는 adj=None, 스크린샷은 adj=5000, line=LINE"""
    iw, ih = Image.open(path).size; ar = iw / ih; br = w / h
    if mode == 'contain':
        pw, ph = (w, w / ar) if ar > br else (h * ar, h)
        p = s.shapes.add_picture(path, I(x + (w - pw) / 2), I({'t': y, 'c': y + (h - ph) / 2, 'b': y + h - ph}[valign]), I(pw), I(ph))
    else:
        p = s.shapes.add_picture(path, I(x), I(y), I(w), I(h))
        if ar > br:
            cut = 1 - br / ar; l = {'l': 0, 'c': cut / 2, 'r': cut}[anchor if anchor in 'lcr' else 'c']
            p.crop_left = l; p.crop_right = cut - l
        else:
            cut = 1 - ar / br; t = {'t': 0, 'c': cut / 2, 'b': cut}[anchor if anchor in 'tcb' else 'c']
            p.crop_top = t; p.crop_bottom = cut - t
    if adj is not None: _round(p, adj, line)
    if alt: p._element.nvPicPr.cNvPr.set('descr', alt)          # 대체 텍스트(접근성)
    return p


def box(s, x, y, w, h, fill=CARD, line=LINE, radius=0.08, lw=0.75, shape=MSO_SHAPE.ROUNDED_RECTANGLE):
    sh = s.shapes.add_shape(shape, I(x), I(y), I(w), I(h))
    if fill: sh.fill.solid(); sh.fill.fore_color.rgb = rgb(fill)
    else: sh.fill.background()
    if line: sh.line.color.rgb = rgb(line); sh.line.width = Pt(lw)
    else: sh.line.fill.background()
    sh.shadow.inherit = False; _flat(sh)
    if shape == MSO_SHAPE.ROUNDED_RECTANGLE: sh.adjustments[0] = radius
    sh.text_frame.text = ''
    return sh


def chip(s, x, y, w, h, label, fill=TEAL_SOFT, color=TEAL, size=10, bold=True, line=None):
    b = box(s, x, y, w, h, fill=fill, line=line, radius=0.5); tf = b.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    r = p.add_run(); r.text = label; _font(r, size, bold, color, 'Pretendard')
    return b


def hline(s, x1, y1, x2, y2, color=LINE, w=1.0, dash=False):
    ln = s.shapes.add_connector(1, I(x1), I(y1), I(x2), I(y2))
    ln.line.color.rgb = rgb(color); ln.line.width = Pt(w)
    if dash: ln.line.dash_style = 4
    _flat(ln)
    return ln


def dot(s, cx, cy, d=0.16, fill=TEAL):
    sh = s.shapes.add_shape(MSO_SHAPE.OVAL, I(cx - d / 2), I(cy - d / 2), I(d), I(d))
    sh.fill.solid(); sh.fill.fore_color.rgb = rgb(fill); sh.line.fill.background(); sh.shadow.inherit = False; _flat(sh)
    return sh


def notes(s, body): s.notes_slide.notes_text_frame.text = body


# ───────── 장표 유형 헬퍼 ─────────
def cover(prs, kicker, title, lines, byline, hero=None, tsize=54):
    """표지: 키커 / 54pt ExtraBold 제목 / 왼쪽 26pt 굵은 문구(list) / 오른쪽 히어로 / 틸 21pt 소속·이름(list)"""
    s = add_slide(prs)
    text(s, 0.58, 0.35, 12.15, 0.28, kicker, 10, True, TEAL)
    text(s, 0.58, 0.85, 12.22, 0.9, title, tsize, False, NAVY, 'Pretendard ExtraBold')
    if hero: pic(s, hero, 5.42, 2.31, 7.33, 4.13, 'contain', adj=None)
    text(s, 0.64, 2.46, 4.78, 2.35, lines, 26, True, NAVY)
    text(s, 0.58, 5.59, 6.51, 0.9, byline, 21, True, TEAL)
    text(s, 0.58, 7.14, 11.81, 0.19, CFG['foot'], 9, False, GRAY)
    return s


def cards3(s, items, img_y=2.47, img_h=3.12, title_y=5.76, xs=(0.58, 4.75, 8.92), w=3.83):
    """3열 카드. items: (이미지경로|None, 'contain'|'cover', 제목, 설명[, {h,dy,anchor,adj,line,valign}])"""
    for (path, mode, title, desc, *o), x in zip(items, xs):
        o = o[0] if o else {}
        if path:
            if mode == 'cover':
                ch = o.get('h', 2.6)
                pic(s, path, x, img_y + (img_h - ch) / 2 + o.get('dy', 0), w, ch, 'cover', o.get('anchor', 'c'),
                    adj=o.get('adj', 6000), line=o.get('line', LINE))
            else:
                pic(s, path, x, img_y, w, img_h, 'contain', adj=None, valign=o.get('valign', 'c'))
        text(s, x, title_y, w, 0.42, title, 20, True, NAVY)
        text(s, x, title_y + 0.5, w, 0.6, desc, 14, False, GRAY)


def banner(s, msg, y=6.1, label=None, x=0.58, w=12.17, h=0.58, size=15):
    """민트 결론 띠(장표의 한 줄 결론). label을 주면 '라벨   본문'(틸+네이비) 두 색."""
    box(s, x, y, w, h, TEAL_SOFT, None, 0.45)
    runs = [(label + '   ', {'color': TEAL}), (msg, {'color': NAVY})] if label else [(msg, {})]
    text(s, x, y, w, h, [runs], size, True, TEAL, align='c', anchor='m')


def timeline(s, cols, xs=(0.58, 3.66, 6.74, 9.82), cw=2.93, img_y=2.3, img_h=2.35, yl=4.86, last_coral=True, yw=0.62):
    """가로 타임라인(4칸). cols: (이미지|None, '2023', 제목, 설명). 마지막 칸 점은 코랄."""
    hline(s, 0.9, yl, 12.4, yl, TEAL, 1.5, dash=True)
    for i, ((img, yr, t, d), x) in enumerate(zip(cols, xs)):
        c = CORAL if (last_coral and i == len(cols) - 1) else TEAL
        if img: pic(s, img, x, img_y, cw, img_h, 'contain', adj=None)
        dot(s, x + 0.12, yl, 0.2, c)
        yb = text(s, x + 0.27, yl - 0.14, yw, 0.3, yr, 14, True, c, align='c')
        yb.fill.solid(); yb.fill.fore_color.rgb = rgb(BG)          # 점선이 글자를 가리지 않게
        text(s, x, yl + 0.32, cw, 0.4, t, 18, True, NAVY)
        text(s, x, yl + 0.76, cw, 0.7, d, 13, False, GRAY)


def table(s, heads, rows, cx=(0.58, 3.25, 6.0, 10.1), cw=(2.6, 2.7, 4.0, 2.65), y=2.38, rh=0.66, strong=2, number=True):
    """줄무늬 비교표(4열 기본). strong 열은 진한 글씨(핵심), 나머지는 회색. 첫 열은 '01 ' 번호."""
    for x, w, h in zip(cx, cw, heads): text(s, x + 0.1, y, w, 0.3, h, 12, True, TEAL)
    hline(s, 0.58, y + 0.38, 12.75, y + 0.38, TEAL, 1.25)
    for i, r in enumerate(rows):
        yy = y + 0.5 + i * rh
        if i % 2 == 0: box(s, 0.58, yy - 0.06, 12.17, rh - 0.04, ZEBRA, None, 0.15)
        for j, (x, w, t) in enumerate(zip(cx, cw, r)):
            if j == 0:
                text(s, x + 0.1, yy + 0.1, w, 0.4, [[(f'{i + 1:02d} ' if number else '', {'color': TEAL}), (t, {})]], 14, True, NAVY)
            else:
                text(s, x + 0.1, yy + 0.12, w - 0.1, 0.45, t, 12.5, j == strong, NAVY if j == strong else GRAY)


def steps(s, items, x=5.45, y=2.45, pitch=1.18, w=6.2):
    """세로 단계(칩 + 굵은 제목 + 설명). items: (칩 라벨 '1주', 제목, 설명). 마지막 칩은 진한 틸."""
    for i, (c, t, d) in enumerate(items):
        yy = y + i * pitch; last = i == len(items) - 1
        chip(s, x, yy + 0.05, 0.9, 0.36, c, TEAL if last else TEAL_SOFT, 'FFFFFF' if last else TEAL, 12)
        text(s, x + 1.1, yy, w, 0.42, t, 19, True, NAVY)
        text(s, x + 1.1, yy + 0.48, w, 0.45, d, 13, False, GRAY)


def step_cards(s, steps4, guard=None, y=2.0, h=3.78):
    """4단계 카드(수업 적용 예시용). steps4: (칩, 장면, AI가 하는 일, 예시 요청, 도구). guard: 아래 '교사가 지키는 것' 띠."""
    for i, (c, scene, ai, ask, tool) in enumerate(steps4):
        x = 0.58 + i * 3.08; w = 2.88
        box(s, x, y, w, h, CARD, LINE, 0.06)
        chip(s, x + 0.2, y + 0.2, 1.45, 0.3, c, TEAL_SOFT, TEAL, 10.5)
        text(s, x + 0.2, y + 0.62, w - 0.35, 0.36, scene, 15, True, NAVY)
        text(s, x + 0.2, y + 1.02, w - 0.35, 0.95, [[('AI  ', {'bold': True, 'color': TEAL}), (ai, {})]], 11.5, False, GRAY, lnspc=1.2)
        box(s, x + 0.15, y + 2.02, w - 0.3, 1.2, PAPER, None, 0.1)
        text(s, x + 0.3, y + 2.1, w - 0.55, 0.25, '예시 요청', 9, True, CORAL)
        text(s, x + 0.3, y + 2.36, w - 0.55, 0.84, f'“{ask}”', 10.5, False, NAVY, lnspc=1.2)
        chip(s, x + 0.2, y + 3.34, min(w - 0.4, 0.3 + 0.105 * len(tool)), 0.28, tool, 'FFFFFF', GRAY, 9.5, True, line=LINE)
        if i < len(steps4) - 1: text(s, x + w - 0.02, y + h / 2 - 0.2, 0.24, 0.4, '›', 18, True, GRAY, align='c')
    if guard: banner(s, guard, y=6.02, label='교사가 지키는 것', size=13, h=0.6)


def rows_arrow(s, pairs, y=2.38, pitch=0.7, w=8.25, last_hi=True):
    """'이전 → 이후' 요약 줄. pairs: (이전, 이후). 마지막 줄은 민트 강조(결론)."""
    for i, (a, b) in enumerate(pairs):
        yy = y + i * pitch; hi = last_hi and i == len(pairs) - 1
        box(s, 0.58, yy, w, 0.58, TEAL_SOFT if hi else CARD, None if hi else LINE, 0.3)
        text(s, 0.82, yy, 2.5, 0.58, a, 14, False, GRAY, anchor='m')
        text(s, 3.2, yy, 0.4, 0.58, '→', 15, True, TEAL, anchor='m')
        text(s, 3.65, yy, w - 3.15, 0.58, b, 15, True, TEAL if hi else NAVY, anchor='m')


def case_grid(s, cases, ncol=3, y0=2.4, dx=4.17, dy=2.15):
    """번호 카드 격자(사례 지도). cases: (제목, 한 줄 설명, 도구 칩). 앞 절반 번호는 틸, 뒤 절반은 코랄."""
    for i, (a, b, c) in enumerate(cases):
        x = 0.58 + (i % ncol) * dx; y = y0 + (i // ncol) * dy
        box(s, x, y, 3.83, 1.92, CARD, LINE, 0.08)
        text(s, x + 0.25, y + 0.2, 1.0, 0.4, f'{i + 1:02d}', 20, True, TEAL if i < len(cases) / 2 else CORAL, 'Pretendard ExtraBold')
        text(s, x + 0.25, y + 0.62, 3.4, 0.4, a, 18, True, NAVY)
        text(s, x + 0.25, y + 1.03, 3.4, 0.4, b, 12.5, False, GRAY)
        chip(s, x + 0.25, y + 1.43, min(0.2 + len(c) * 0.11, 3.3), 0.3, c, TEAL_SOFT, TEAL, 10)


def idea_grid(s, items, x0=5.05, y0=2.35, ncol=2, w=3.7, h=1.78, dx=3.9, dy=1.95):
    """2x2 아이디어 카드(적용 방안). items: (틸 굵은 제목, 네이비 설명)"""
    for i, (t, d) in enumerate(items):
        x = x0 + (i % ncol) * dx; y = y0 + (i // ncol) * dy
        box(s, x, y, w, h, CARD, LINE, 0.08)
        text(s, x + 0.22, y + 0.18, w - 0.4, 0.4, t, 15, True, TEAL)
        text(s, x + 0.22, y + 0.62, w - 0.4, h - 0.7, d, 12, False, NAVY, lnspc=1.22)


def refs(s, rows, y=2.0, pitch=0.78):
    """참고문헌 장. rows: (분류, 출처 문장). 일러스트 생성 도구와 상표 고지 한 줄도 넣는다."""
    for i, (a, b) in enumerate(rows):
        text(s, 0.58, y + i * pitch, 2.2, 0.35, a, 13, True, TEAL)
        text(s, 2.8, y + i * pitch, 9.95, 0.7, b, 12, False, NAVY, lnspc=1.2)


def alpha(shape, pct):
    """채움색 투명도(pct % 불투명). 벤다이어그램 원 등에 사용"""
    clr = shape.fill._xPr.find(qn('a:solidFill'))[0]
    etree.SubElement(clr, qn('a:alpha')).set('val', str(int(pct * 1000)))


def fullbleed(prs, s, path, anchor='c'):
    """슬라이드 전체를 덮는 이미지(스토리 장면). 머리말·바닥글을 넣지 않는다."""
    return pic(s, path, 0, 0, prs.slide_width / 914400, prs.slide_height / 914400, 'cover', anchor, adj=None)


def qr_card(s, qr_path, x=0.58, y=4.85, size=1.75):
    box(s, x, y, size, size, CARD, LINE, 0.08)
    pic(s, qr_path, x + 0.1, y + 0.1, size - 0.2, size - 0.2, 'contain', adj=None)


def make_qr(url, out='qr.png', scale=12):
    """QR 생성 + 디코드 검증(zxingcpp > cv2). 검증 실패 시 예외."""
    import qrcode
    qrcode.make(url, box_size=scale, border=2).convert('RGB').save(out)
    got = None
    try:
        import zxingcpp; r = zxingcpp.read_barcodes(Image.open(out)); got = r[0].text if r else None
    except ImportError:
        import cv2; got = cv2.QRCodeDetector().detectAndDecode(cv2.imread(out))[0] or None
    assert got == url, f'QR 디코드 불일치: {got!r}'
    return out
```
### embed_fonts.py — 전체 글꼴 임베드 (마지막 저장 단계, 부분 임베드도 교체)
```python
# file: embed_fonts.py
"""덱에 Pretendard '전체' 글꼴을 심는다(EOT, 비압축). 이미 들어 있는 부분(subset) 임베드는 전체 글꼴로 교체한다.
부분 임베드는 새로 쓴 글자가 얇은 대체 글꼴로 보이게 만든다(모바일 PowerPoint에서 특히). 저장의 '마지막' 단계에 실행.
사용: python embed_fonts.py in.pptx out.pptx [글꼴폴더=~/.local/share/fonts]"""
import sys, re, os, struct, zipfile
from lxml import etree
from fontTools.ttLib import TTFont

SRC, DST = sys.argv[1], sys.argv[2]
FONTDIR = sys.argv[3] if len(sys.argv) > 3 else os.path.expanduser('~/.local/share/fonts')
MAP = {  # typeface -> {칸: ttf}   (덱 글꼴 이름과 같아야 한다)
    'Pretendard': {'regular': 'Pretendard-Regular.ttf', 'bold': 'Pretendard-Bold.ttf'},
    'Pretendard ExtraBold': {'regular': 'Pretendard-ExtraBold.ttf'},
    'Pretendard Medium': {'regular': 'Pretendard-Medium.ttf'},
}
NS = {'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
RELNS = 'http://schemas.openxmlformats.org/package/2006/relationships'
FONT_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/font'
P, R = '{%s}' % NS['p'], '{%s}' % NS['r']


def u16(s):
    b = s.encode('utf-16le'); return struct.pack('<H', len(b)) + b


def make_eot(ttf, family, style):
    data = open(ttf, 'rb').read(); f = TTFont(ttf); os2 = f['OS/2']; pn = os2.panose
    pan = bytes([pn.bFamilyType, pn.bSerifStyle, pn.bWeight, pn.bProportion, pn.bContrast,
                 pn.bStrokeVariation, pn.bArmStyle, pn.bLetterForm, pn.bMidline, pn.bXHeight])
    ver = f['name'].getDebugName(5) or 'Version 1.0'
    body = pan + struct.pack('<BBIHH', 0x81, 1 if os2.fsSelection & 1 else 0, os2.usWeightClass, os2.fsType, 0x504C)
    body += struct.pack('<IIII', os2.ulUnicodeRange1, os2.ulUnicodeRange2, os2.ulUnicodeRange3, os2.ulUnicodeRange4)
    body += struct.pack('<II', os2.ulCodePageRange1, os2.ulCodePageRange2)
    body += struct.pack('<I', f['head'].checkSumAdjustment) + b'\0' * 16
    body += b'\0\0' + u16(family + '\0') + b'\0\0' + u16(style + '\0') + b'\0\0' + u16(ver) + b'\0\0' + u16(family)
    body += b'\0\0' + struct.pack('<H', 0) + struct.pack('<II', 0, 0)
    body += b'\0\0' + struct.pack('<H', 0) + struct.pack('<II', 0, 0)
    return struct.pack('<IIII', 16 + len(body) + len(data), len(data), 0x00020002, 0) + body + data


def panose_hex(ttf):
    pn = TTFont(ttf)['OS/2'].panose
    return ''.join('%02X' % v for v in (pn.bFamilyType, pn.bSerifStyle, pn.bWeight, pn.bProportion, pn.bContrast,
                                        pn.bStrokeVariation, pn.bArmStyle, pn.bLetterForm, pn.bMidline, pn.bXHeight))


zin = zipfile.ZipFile(SRC)
files = {i.filename: zin.read(i.filename) for i in zin.infolist()}
order = [i.filename for i in zin.infolist()]
pres = etree.fromstring(files['ppt/presentation.xml'])
rels = etree.fromstring(files['ppt/_rels/presentation.xml.rels'])
ct = files['[Content_Types].xml'].decode('utf8')
if 'Extension="fntdata"' not in ct:
    ct = ct.replace('<Default ', '<Default Extension="fntdata" ContentType="application/x-fontdata"/><Default ', 1)
    files['[Content_Types].xml'] = ct.encode('utf8')
rid_n = max([int(m) for r in rels for m in re.findall(r'^rId(\d+)$', r.get('Id'))] + [0])
font_n = max([int(m) for n in files for m in re.findall(r'^ppt/fonts/font(\d+)\.fntdata$', n)] + [0])
lst = pres.find('p:embeddedFontLst', NS)
if lst is None:
    lst = etree.Element(P + 'embeddedFontLst')
    anchor = pres.find('p:notesSz', NS)
    if anchor is None: anchor = pres.find('p:sldSz', NS)
    anchor.addnext(lst)


def part_of(rid):
    for r in rels:
        if r.get('Id') == rid: return 'ppt/' + r.get('Target')
    raise KeyError(rid)


done = []
for face, slots in MAP.items():
    ef = next((e for e in lst.findall('p:embeddedFont', NS) if e.find('p:font', NS).get('typeface') == face), None)
    first_ttf = os.path.join(FONTDIR, next(iter(slots.values())))
    if not os.path.exists(first_ttf): sys.exit(f'글꼴 없음: {first_ttf}')
    if ef is None:
        ef = etree.SubElement(lst, P + 'embeddedFont')
        etree.SubElement(ef, P + 'font', typeface=face, panose=panose_hex(first_ttf), pitchFamily='50', charset='-127')
    for slot, fn in slots.items():
        eot = make_eot(os.path.join(FONTDIR, fn), face, 'Bold' if slot == 'bold' else 'Regular')
        el = ef.find('p:' + slot, NS)
        if el is not None:                                   # 기존 칸: 부품 내용만 교체
            target = part_of(el.get(R + 'id'))
        else:                                                # 새 칸: 관계·부품·요소 추가
            rid_n += 1; font_n += 1; target = f'ppt/fonts/font{font_n}.fntdata'
            etree.SubElement(rels, '{%s}Relationship' % RELNS, Id=f'rId{rid_n}', Type=FONT_REL, Target=f'fonts/font{font_n}.fntdata')
            el = etree.Element(P + slot); el.set(R + 'id', f'rId{rid_n}')
            prev = [c for c in ef if c.tag in (P + 'font', P + 'regular', P + 'bold')]
            prev[-1].addnext(el)
            order.append(target)
        files[target] = eot; done.append((face, slot, len(eot)))
pres.set('embedTrueTypeFonts', '1'); pres.attrib.pop('saveSubsetFonts', None)   # 다시 저장해도 '모든 문자' 임베드 유지
files['ppt/presentation.xml'] = etree.tostring(pres, xml_declaration=True, encoding='UTF-8', standalone=True)
files['ppt/_rels/presentation.xml.rels'] = etree.tostring(rels, xml_declaration=True, encoding='UTF-8', standalone=True)
with zipfile.ZipFile(DST, 'w', zipfile.ZIP_DEFLATED) as zo:
    for n in order: zo.writestr(n, files[n])
from pptx import Presentation; Presentation(DST)           # 다시 열어 보는 검증
for d in done: print('임베드', *d)
print('저장', DST)
```
### fixbg.py — 생성 이미지 배경을 덱 배경색에 맞추기
```python
# file: fixbg.py
"""생성 이미지의 배경색을 덱 배경(웜 오프화이트)에 맞추고 가장자리를 부드럽게 녹인다. 사용: python fixbg.py g*.png  -> g*_fx.jpg"""
import sys, numpy as np
from PIL import Image
TARGET = np.array([253, 249, 241], float); SLIDE = np.array([251, 250, 246], float)
for f in sys.argv[1:]:
    a = np.asarray(Image.open(f).convert('RGB')).astype(float); h, w, _ = a.shape; b = max(4, int(min(h, w) * 0.03))
    border = np.concatenate([a[:b].reshape(-1, 3), a[-b:].reshape(-1, 3), a[:, :b].reshape(-1, 3), a[:, -b:].reshape(-1, 3)])
    out = np.clip(a * (TARGET / np.median(border, 0)), 0, 255)          # 가장자리 중앙값 = 목표 크림색
    yy = np.linspace(0, 1, h)[:, None]; xx = np.linspace(0, 1, w)[None, :]
    d = np.minimum(np.minimum(yy, 1 - yy) * h, np.minimum(xx, 1 - xx) * w) / (0.06 * min(h, w))
    m = np.clip(d, 0, 1)[..., None]; m = m * m * (3 - 2 * m)
    out = out * m + SLIDE * (1 - m)                                      # 테두리를 슬라이드색으로 페더링
    o = f.rsplit('.', 1)[0] + '_fx.jpg'; Image.fromarray(out.astype('uint8')).save(o, quality=92); print(f, '->', o)
```
### qa.py — 납품 전 자동 점검
```python
# file: qa.py
"""납품 전 자동 점검 (렌더링 눈 확인을 대신하지 않는다).
사용: python qa.py deck.pptx [--ban 단어1,단어2] [--no-notes]   · 오류가 있으면 종료코드 1
점검: 글꼴 이름 / 글자 넘침 추정 / 슬라이드 밖 도형 / 대본 유무 / 쪽번호 분모 / 제목 길이 / 금칙어(이전 행사 단어)"""
import sys, re, os
from pptx import Presentation
from PIL import ImageFont

FONTDIR = os.path.expanduser('~/.local/share/fonts')
OK_FACES = {'Pretendard', 'Pretendard ExtraBold', 'Pretendard Medium'}
LH = 1.193                                  # Pretendard 한 줄 높이 = 글자 크기의 1.193배
_fc = {}


def font(face, bold):
    n = 'ExtraBold' if 'ExtraBold' in face else 'Medium' if 'Medium' in face else 'Bold' if bold else 'Regular'
    if n not in _fc: _fc[n] = ImageFont.truetype(os.path.join(FONTDIR, f'Pretendard-{n}.ttf'), 100)
    return _fc[n]


def tokens(p):
    """문단을 (글자, 폭 함수 인자) 단어 토큰으로: 공백 기준, 서식은 run별로 유지"""
    out = []
    for r in p.runs:
        face = r.font.name or 'Pretendard'; sz = r.font.size.pt if r.font.size else 18
        for part in re.findall(r'\S+|\s+', r.text):
            out.append((part, font(face, bool(r.font.bold)), sz))
    return out


def para_lines(p, w_in):
    lines, cur = 1, 0.0
    for part, f, sz in tokens(p):
        wd = f.getlength(part) / 100 * sz / 72
        if part.isspace():
            cur += wd; continue
        if cur + wd <= w_in + 0.01: cur += wd; continue
        if wd > w_in:                                      # 한 단어가 한 줄보다 길면 글자 단위로 쪼개짐
            lines += int(wd // w_in) + (1 if cur > 0 else 0); cur = wd % w_in; continue
        lines += 1; cur = wd
    return lines


def text_height(sh):
    tf = sh.text_frame
    w = (sh.width - tf.margin_left - tf.margin_right) / 914400
    h = 0.0
    for p in tf.paragraphs:
        sz = max([r.font.size.pt for r in p.runs if r.font.size] or [18])
        ls = p.line_spacing if isinstance(p.line_spacing, float) else 1.0
        h += para_lines(p, w) * sz * LH * ls / 72 + (p.space_after.pt / 72 if p.space_after else 0)
    return h + (tf.margin_top + tf.margin_bottom) / 914400


args = sys.argv[1:]; ban = []; need_notes = '--no-notes' not in args
if '--ban' in args: ban = [b for b in args[args.index('--ban') + 1].split(',') if b]
prs = Presentation(args[0]); W, H = prs.slide_width, prs.slide_height
errs, warns, totals = [], [], set()
for i, s in enumerate(prs.slides, 1):
    full = ''
    for sh in s.shapes:
        if sh.left is not None and not (sh.left == 0 and sh.top == 0 and sh.width >= W - 10):      # 전면 이미지는 제외
            if sh.left < -9144 or sh.top < -9144 or sh.left + sh.width > W + 9144 or sh.top + sh.height > H + 9144:
                warns.append(f'{i}장 슬라이드 밖으로 나감: {sh.name}')
        if not sh.has_text_frame or not sh.text_frame.text.strip(): continue
        t = sh.text_frame.text; full += t + '\n'
        for p in sh.text_frame.paragraphs:
            for r in p.runs:
                if (r.font.name or 'Pretendard') not in OK_FACES:
                    warns.append(f'{i}장 허용 밖 글꼴 "{r.font.name}": {r.text[:20]}'); break
        m = re.fullmatch(r'(\S+) / (\d+)', t.strip())
        if m: totals.add(m.group(2))
        try:
            need = text_height(sh)
            if need > sh.height / 914400 * 1.12 + 0.06:
                warns.append(f'{i}장 글자 넘침 추정(필요 {need:.2f}in > 상자 {sh.height / 914400:.2f}in): {t[:28]!r}')
        except Exception as e:
            warns.append(f'{i}장 높이 추정 실패: {t[:20]!r} ({e})')
        if any(r.font.name == 'Pretendard ExtraBold' and r.font.size and 24 <= r.font.size.pt <= 32 for p in sh.text_frame.paragraphs for r in p.runs) \
                and len(t.replace('\n', '')) > 36:
            warns.append(f'{i}장 제목이 36자 초과(결론 한 문장 30자 안팎): {t[:20]}…')
    note = s.notes_slide.notes_text_frame.text.strip() if s.has_notes_slide else ''
    if need_notes and not note: errs.append(f'{i}장 대본(메모)이 비어 있음')
    elif need_notes and len(note) < 40: warns.append(f'{i}장 대본이 40자 미만(의도한 짧은 장이면 무시)')
    for b in ban:
        if b in full or b in note: errs.append(f'{i}장 금칙어 "{b}" 남아 있음')
if len(totals) > 1: warns.append(f'쪽번호 분모가 제각각: {sorted(totals)}')
for e in errs: print('오류', e)
for w in warns: print('주의', w)
print(f'장표 {len(prs.slides)}장 · 오류 {len(errs)} · 주의 {len(warns)}')
sys.exit(1 if errs else 0)
```
### render_check.py — 렌더링 모아보기
```python
# file: render_check.py
"""PPTX -> PDF(LibreOffice) -> 장표 JPG -> 번호 붙은 모아보기(12장씩). 사용: python render_check.py deck.pptx [출력폴더=pv] [dpi=55]
모아보기로 전체를 보고, 의심 장은 dpi를 올려(-r 100) 한 장씩 확대해서 본다."""
import sys, os, glob, subprocess
from PIL import Image, ImageDraw, ImageFont
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else 'pv'; dpi = sys.argv[3] if len(sys.argv) > 3 else '55'
os.makedirs(out, exist_ok=True)
for f in glob.glob(f'{out}/p-*.jpg') + glob.glob(f'{out}/sheet*.jpg'): os.remove(f)
subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', out, src], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
pdf = os.path.join(out, os.path.splitext(os.path.basename(src))[0] + '.pdf')
subprocess.run(['pdftoppm', '-jpeg', '-r', dpi, pdf, f'{out}/p'], check=True)
pages = sorted(glob.glob(f'{out}/p-*.jpg')); tw = 640
try: fnt = ImageFont.truetype(os.path.expanduser('~/.local/share/fonts/Pretendard-Bold.ttf'), 26)
except Exception: fnt = None
for k in range(0, len(pages), 12):
    chunk = pages[k:k + 12]; ims = []
    for j, p in enumerate(chunk):
        im = Image.open(p).convert('RGB'); im = im.resize((tw, int(im.height * tw / im.width)))
        d = ImageDraw.Draw(im); d.rectangle([tw - 64, 0, tw, 36], fill=(19, 44, 61)); d.text((tw - 56, 3), str(k + j + 1), fill='white', font=fnt)
        ims.append(im)
    th = ims[0].height; sheet = Image.new('RGB', (4 * (tw + 8) + 8, 3 * (th + 8) + 8), (120, 120, 120))
    for j, im in enumerate(ims): sheet.paste(im, (8 + (j % 4) * (tw + 8), 8 + (j // 4) * (th + 8)))
    sheet.save(f'{out}/sheet{k // 12 + 1}.jpg', quality=82); print(f'{out}/sheet{k // 12 + 1}.jpg  (장 {k + 1}~{k + len(chunk)})')
print('총', len(pages), '장 · 개별 장:', f'{out}/p-NN.jpg')
```
### edit_helpers.py — 기존 덱의 문구만 바꾸기
```python
# file: edit_helpers.py
"""기존 덱의 '문구만' 바꿀 때(서식·이미지·배치 유지). from edit_helpers import *  →  prs = Presentation(src)
순서: find로 도형 찾기(정확히 1개) → set_text/sub로 교체 → 바닥글·쪽번호·대본 일괄 → qa.py --ban 으로 옛 단어 점검."""
import copy
from lxml import etree
A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
IGN = {'lang', 'altLang', 'dirty', 'err', 'noProof', 'smtClean', 'smtId'}


def _sig(r):
    rp = r._r.find(A + 'rPr')
    if rp is None: return ''
    c = copy.deepcopy(rp)
    for k in list(c.attrib):
        if k in IGN: del c.attrib[k]
    return etree.tostring(c)


def merge_runs(p):
    """같은 서식으로 잘게 쪼개진 인접 run을 합친다(모양 변화 없음). 교체 전에 항상 호출."""
    runs = p.runs; i = 0
    while i < len(runs) - 1:
        a, b = runs[i], runs[i + 1]
        if a._r.getnext() is b._r and _sig(a) == _sig(b):
            a.text += b.text; b._r.getparent().remove(b._r); runs = p.runs
        else: i += 1


def find(prs, si, needle, exact=False):
    """si장에서 needle이 든 도형. 0개 또는 2개 이상이면 중단(엉뚱한 곳을 고치지 않게)."""
    hits = [sh for sh in prs.slides[si - 1].shapes if sh.has_text_frame and
            ((sh.text_frame.text.strip() == needle) if exact else (needle in sh.text_frame.text))]
    if len(hits) != 1: raise SystemExit(f'[find] {si}장 "{needle}" -> {len(hits)}개')
    return hits[0]


def set_text(sh, paras):
    """문단 리스트로 통째 교체. 문단마다 첫 run 서식을 유지, 문단 수가 늘면 마지막 문단을 복제."""
    tf = sh.text_frame; plist = list(tf.paragraphs)
    for i, p in enumerate(plist):
        if i >= len(paras): p._p.getparent().remove(p._p); continue
        merge_runs(p)
        for br in p._p.findall(A + 'br'): p._p.remove(br)
        runs = p.runs
        if runs:
            runs[0].text = paras[i]
            for r in runs[1:]: r._r.getparent().remove(r._r)
    if len(paras) > len(plist):
        last = tf.paragraphs[-1]._p
        for t in paras[len(plist):]:
            n = copy.deepcopy(last); last.addnext(n); last = n
            rs = n.findall(A + 'r')
            for r in rs[1:]: n.remove(r)
            rs[0].find(A + 't').text = t


def sub(sh, pairs):
    """run 안의 낱말만 바꾼다([(옛, 새), ...]). 못 찾으면 예외."""
    for p in sh.text_frame.paragraphs: merge_runs(p)
    for o, n in pairs:
        hit = False
        for p in sh.text_frame.paragraphs:
            for r in p.runs:
                if o in r.text: r.text = r.text.replace(o, n); hit = True
        if not hit: raise SystemExit(f'[sub] "{o}" 없음: {sh.text_frame.text[:30]!r}')
```
### build.py 뼈대
```python
# file: build.py
import sys; sys.path.insert(0, '.')
from nalssam_lib import *
CFG['foot'] = '구리남양주교육지원청 교원연수  |  nalssam 박준호  |  2026. 10. 31.(토)'
prs = new_deck()                  # 이전 날쌤 덱이 있으면 new_deck('이전.pptx'): 틀만 쓰고 장표는 비운다
TOTAL = 3; n = 0
def slide():
    global n; n += 1; s = add_slide(prs)
    if n > 1: footer(s, n, TOTAL)
    return s

s = cover(prs, '구리남양주교육지원청  /  2026. 10. 31.(토) 10:00~12:00', 'AI Agent 시대, 교실은?',
          ['선생님의 아이디어를', 'AI 비서와 함께'], ['○○초등학교 박준호 (@nalssam)', "(공익법인) '몽당분필' 대표이사장"], 'gen/hero_fx.jpg'); n += 1
notes(s, '1장 · 1분 · 10:00~10:01\n\n안녕하세요. ○○초 교사 박준호입니다. 오늘은 AI Agent 시대에 교실이 어떻게 달라지는지 함께 보겠습니다.')
s = slide(); header(s, '01 오늘의 질문', 'AI는 교사의 무엇을 바꾸고, 무엇을 남겨 둘까요?', '세 가지 질문을 따라갑니다.')
cards3(s, [('gen/a_fx.jpg', 'contain', '01 일하는 방식', '프롬프트에서 환경 설정으로'), ('gen/b_fx.jpg', 'contain', '02 교수전략', '설계 · 자료 · 평가'), ('gen/c_fx.jpg', 'contain', '03 우리 교실', '월요일에 시작할 한 가지')])
notes(s, '2장 · 1분 · 10:01~10:02\n\n먼저 질문 하나를 드립니다. AI는 교사의 무엇을 바꾸고, 무엇을 남겨 둘까요? 세 가지를 따라가겠습니다.')
s = slide(); header(s, 'THANK YOU', '감사합니다')          # 바닥글·쪽번호는 slide() 가 단다. QR 은 qr_card(s, make_qr(url))
notes(s, '3장 · 1분 · 10:02~10:03\n\n끝까지 함께해 주셔서 감사합니다. 화면의 QR 코드로 오늘 자료와 연수 소식을 보실 수 있습니다.')
assert n == TOTAL, n
prs.save('raw.pptx')              # → python embed_fonts.py raw.pptx 최종.pptx
# 장 끼워 넣기: 맨 뒤에 만든 장을 13번째 뒤로 →  lst = prs.slides._sldIdLst; el = list(lst)[-1]; lst.remove(el); lst.insert(13, el)
```

## 10. 점검과 전달
- `python qa.py 최종.pptx --ban 옛단어1,옛단어2` — 오류(대본 없음·금칙어)는 0 이어야 하고, 주의(글자 넘침 추정·슬라이드 밖·허용 밖 글꼴·제목 36자 초과·쪽번호 분모 불일치)는 하나씩 설명할 수 있어야 한다.
- `python render_check.py 최종.pptx pv` → `pv/sheet*.jpg` 를 **전부** 본다. 겹침 · 잘림 · 제목이 두 줄로 넘어가 부제와 닿음 · 글자가 얇게 보임(글꼴 대체) · 이미지 가장자리 색 차이 · 한글 깨짐 · 쪽번호를 확인하고, 의심 장은 `pdftoppm -jpeg -r 100 -f N -l N pv/최종.pdf pv/zoom` 으로 확대한다. LibreOffice 는 한영 혼용 글자 사이가 PowerPoint 보다 넓게 보이는데 글꼴 문제가 아니다.
- 전달 요약에 쓸 것: 장수 · 총 시간 · '(가상)' 표시한 예시 · 확인하지 못한 사실 · (임베드했으므로 글꼴 설치 불필요, 모바일 PowerPoint 에서도 보임).

## 11. 기존 덱을 다른 행사로 바꿀 때
새로 만들지 말고 문구만 바꾼다(이미지·배치·사용자가 손본 곳 보존). ① 새 행사 일정·주제·대상 확인(캘린더) ② 옛 행사 단어 목록 작성(기관명·직군어. 예: 공군, 교관, 교육사령부, 교범, 교육생, 기수) ③ `edit_helpers` 의 `find`(정확히 1개일 때만)·`set_text`·`sub` 로 교체 ④ 바닥글·쪽번호·키커·대본(시간표 포함) 일괄 갱신 ⑤ 줄 수가 늘어난 곳 점검 ⑥ `qa.py --ban` + 렌더링 ⑦ 사용자가 PowerPoint 로 다시 저장한 덱은 임베드가 부분(subset)으로 바뀌었을 수 있으니 마지막에 `embed_fonts.py` 를 다시 돌린다.

## 12. 함정 (실제로 겪은 것)
1. **부분 임베드 글꼴**: PowerPoint 가 쓴 글자만 담은 글꼴을 심어 두면 새로 쓴 글자(예: "공군")가 얇은 대체 글꼴로 보인다 → 마지막에 항상 `embed_fonts.py`.
2. **테마 그림자**: python-pptx 기본 템플릿은 도형에 그림자를 입힌다 → `_flat()` 이 `p:style` 을 지운다. 도형은 반드시 `box/chip/dot/hline` 으로 만든다.
3. 타임라인 점선이 연도 글자를 가린다 → 연도 상자에 배경색 채움(코드 반영). 표 마지막 행이 각주와 겹친다 → 행 간격 0.66, 글자 anchor 'm'. 긴 질문(Q.)은 두 줄로 쪼개 사진과 겹치지 않게. 큰 인용문은 수동으로 3줄.
4. 부제는 장당 한 줄. compact 헤더가 아니면 본문을 y 2.0 아래에 둔다.
5. 스크린샷에 개인정보·사이드바 글자 → 크롭. QR 은 `make_qr` 의 디코드 검증을 통과해야 한다(가운데 로고를 넣은 QR 은 zxing-cpp 로만 읽히기도 한다).
6. Higgsfield 결과 URL 은 만료될 수 있다 → 즉시 파일로 저장하고 덱에는 파일만 넣는다. 도구 로고·마스코트는 그리지 않고 글자 칩으로.
7. 날짜·요일·일정은 캘린더·검색으로 확인한다. 장이 늘면 쪽번호 분모·대본 첫 줄 시각을 함께 갱신한다.
8. 근거 슬라이드는 하단 8.5pt 로 출처(저자·연도·저널)를 달고 출처 장에 모은다. 확인되지 않은 수치는 쓰지 않는다.
9. **Word 한글 줄바꿈**: docx 를 같이 만들 때 `w:wordWrap w:val="0"` 이면 Word 가 한글 단어 중간에서 끊는다 → `val="1"`. ko-KR 언어 태그를 넣으면 LibreOffice 가 글자 단위로 끊으므로 넣지 않는다.
10. **brand-pptx(html2pptx)를 대신 쓸 때**: `\n` 뒤에 인라인 span 이 오는 run 은 새 문단으로 쪼개진다 → span 앞 글자도 span 으로 감싸고 공백은 다음 span 안에 넣는다. 세리프 디스플레이 run 의 굵기가 빠지면 후처리로 `b="1"`. 이 스킬(python-pptx 직접 조립)에서는 생기지 않는다.
11. LibreOffice PDF 는 숫자와 단위(`4.27억`·`300차시`) 사이에서 줄을 바꾸기도 한다 — PowerPoint 에서는 정상. 넘침이 의심되면 상자를 넓히거나 줄을 수동으로 나눈다.
12. 예산표 라벨이 길면 열을 넘친다(예: "PPT·학습지·도안·페이퍼크래프트 세트") → 표에는 "차시별 수업 세트(4종 묶음)" 처럼 짧게, 구성은 부제에.
