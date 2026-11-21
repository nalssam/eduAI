# eduAI

날쌤(nalssam)의 교육용 AI 스킬 모음. 날쌤 분필팩에 들어갈 스킬과, 누구나 자기 스타일의 스킬을 만들어 가는 고르기 판을 여기서 다듬는다.

## 한 줄로 설치하기

Claude Code(`~/.claude/skills`)와 Codex(`~/.agents/skills`)에 팩의 스킬을 한 번에 넣는다.

```bash
curl -fsSL https://raw.githubusercontent.com/nalssam/eduAI/main/install.sh | sh
```

```powershell
irm https://raw.githubusercontent.com/nalssam/eduAI/main/install.ps1 | iex
```

```bash
npx skills add nalssam/eduAI -g -a claude-code codex -s '*' -y
```

Claude 앱에는 `site/downloads/` 의 스킬별 ZIP 을 설정 > 기능(코드 실행 켜기) → 사용자 지정 > 스킬 > 스킬 업로드로 올린다.

## 들어 있는 것

| 위치 | 하는 일 |
|---|---|
| [`skills/nalssam-html-ppt`](skills/nalssam-html-ppt/SKILL.md) | 날쌤 스타일 발표 덱을 브라우저로 여는 HTML 파일 하나로 만든다. 설정 한 줄을 받으면 "나만의 스킬"도 찍어 낸다 |
| [`skills/nalssam-pptx`](skills/nalssam-pptx/SKILL.md) | 날쌤 스타일 연수 원고 PPTX. 공개판(제안서·IR 모드와 개인 프로필 상수 제외) |
| [`skills/pdf`](skills/pdf/SKILL.md) | PDF 읽기·합치기·나누기·양식 채우기. [anthropics/skills](https://github.com/anthropics/skills) 의 것을 그대로 담았다(Apache 2.0, `LICENSE.txt`) |
| [`skills/kordoc`](skills/kordoc/SKILL.md) | 한글(.hwp·.hwpx)·PDF·오피스 문서 읽기, 공문서 HWPX 생성, 서식 채우기. [chrisryugj/kordoc](https://github.com/chrisryugj/kordoc) 의 스킬을 그대로 담았다(MIT, `LICENSE`·`NOTICE`). Node.js 20 이상 필요 |
| [`site/index.html`](site/index.html) | 분필팩 첫 화면: 한 줄 설치, 스킬별 ZIP, 붙이는 법 |
| [`site/builder.html`](site/builder.html) | 스타일 고르기 판. 색·글꼴·모양을 고르면 나만의 스킬 ZIP 이 내려온다 |
| `site/pack-artifact.html` · `site/artifact.html` | 두 화면의 Claude 아티팩트용. `downloads` 권한을 켜고 올린다 |
| `site/downloads/` | 스킬별 ZIP 과 `bunpil-skill-pack.zip`(전체) |
| `install.sh` · `install.ps1` | 한 줄 설치 스크립트. 같은 이름의 스킬이 있으면 `skills-backup-날짜시각` 으로 옮기고 넣는다 |
| `tools/` | 사이트 빌드, 한국 서비스 대표색 목록 갱신 |

팩에 담지 않고 원본에서 받는 것: HWPX 한글 문서 스킬은 [jkf87/hwpx-skill](https://github.com/jkf87/hwpx-skill) 에 라이선스가 적혀 있지 않아 복사하지 않는다.

```bash
npx skills add jkf87/hwpx-skill -g -a claude-code codex -y
```

## 나만의 스킬 만드는 흐름

1. **고르기** — 고르기 판에서 출발점(날쌤 기본·칠판·네이비·한국 서비스 톤 29가지), 색, 글꼴, 모서리, 카드, 배경 무늬, 제목 꾸밈, 움직임, 말투를 고른다. 견본이 바로 바뀐다.
2. **저장하기** — `나만의 스킬 ZIP 받기`. 버튼이 없는 화면에서는 `설정 한 줄 복사` → 날쌤 기본 스킬을 붙여 둔 Claude 에 붙여 넣고 "이 설정으로 스킬 저장해 줘".
3. **붙이기**
   - Claude 앱: 설정 > 기능에서 코드 실행 및 파일 생성을 켜고, 사용자 지정 > 스킬 > + > 스킬 만들기 > 스킬 업로드에 ZIP 을 올린다.
   - Claude Code: ZIP 을 풀어 `~/.claude/skills/<이름>/`.
   - Codex: ZIP 을 풀어 `~/.agents/skills/<이름>/`, `$<이름>` 으로 부른다.

터미널에서 바로 만들 수도 있다.

```bash
node skills/nalssam-html-ppt/scripts/make_skill.js "[HTML PPT 스킬 설정] name=class-ppt; title=우리반 발표; ground=white; key=#3182F6" out
```

## 웹사이트

`site/` 폴더가 그대로 정적 사이트이고, `main` 에 `site/` 가 바뀌면 `.github/workflows/pages.yml` 이 GitHub Pages 로 올린다. 주소는 https://nalssam.github.io/eduAI/ 이다. 처음 한 번은 저장소 Settings > Pages 의 Source 가 "GitHub Actions" 여야 한다.

## 고칠 때

```bash
node tools/build_site.js                      # 스킬이나 site/src/page.html 을 고친 뒤 고르기 판과 설치 파일 다시 만들기
python3 tools/fetch_presets.py                # getdesign.kr 에서 대표색 목록 다시 받기
node skills/nalssam-html-ppt/scripts/check.js skills/nalssam-html-ppt/assets/starter.html shots
```

테마 계산·스킬 파일 생성·ZIP 묶기는 `skills/nalssam-html-ppt/scripts/lib/core.js` 한 곳에 있고, 고르기 판과 `make_skill.js` 가 같은 파일을 쓴다.

## 참고한 자료와 라이선스

- [ko/design.md](https://www.getdesign.kr/) (CC BY 4.0) — 한국 서비스 대표색과 둥글기. `assets/presets.json` 에 출처 주소와 함께 담았다. 이름과 상표는 각 기업의 것이다
- [Design in words](https://designinwords.onpod.ai/) — 슬라이드 구성·간격·대비 기준
- [Remotion Scenes](https://github.com/lifeprompt-team/remotion-scenes) (MIT) — 이징 값과 레이아웃 구도
- 글꼴 [Pretendard](https://github.com/orioncactus/pretendard)·Google Fonts (SIL OFL 1.1)
