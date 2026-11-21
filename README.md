# eduAI

날쌤(nalssam)의 교육용 AI 스킬 모음. 날쌤 분필팩에 들어갈 스킬과, 누구나 자기 스타일의 스킬을 만들어 가는 고르기 판을 여기서 다듬는다.

## 들어 있는 것

| 위치 | 하는 일 |
|---|---|
| [`skills/nalssam-html-ppt`](skills/nalssam-html-ppt/SKILL.md) | 날쌤 스타일 발표 덱을 브라우저로 여는 HTML 파일 하나로 만드는 스킬. 설정 한 줄을 받으면 "나만의 스킬"도 찍어 낸다 |
| [`site/index.html`](site/index.html) | 고르기 판(웹사이트용). 색·글꼴·모양을 고르면 나만의 스킬 ZIP 이 내려온다 |
| `site/artifact.html` | 같은 고르기 판의 Claude 아티팩트용. 파일을 내려받을 수 없는 곳이라 설정 한 줄을 복사해 쓴다 |
| `site/downloads/nalssam-html-ppt.zip` | 날쌤 기본 스킬 설치 파일 |
| `tools/` | 고르기 판 빌드, 한국 서비스 대표색 목록 갱신 |

## 쓰는 흐름

1. **고르기** — 고르기 판에서 출발점(날쌤 기본·칠판·네이비·한국 서비스 톤 29가지), 색, 글꼴, 모서리, 카드, 배경 무늬, 제목 꾸밈, 움직임, 말투를 고른다. 견본이 바로 바뀐다.
2. **저장하기** — 웹사이트에서는 `나만의 스킬 ZIP 받기`. 아티팩트에서는 `설정 한 줄 복사` → 날쌤 기본 스킬을 붙여 둔 Claude 에 붙여 넣고 "이 설정으로 스킬 저장해 줘".
3. **붙이기**
   - Claude 앱: 설정 > 기능에서 코드 실행 및 파일 생성을 켜고, 사용자 지정 > 스킬 > + > 스킬 만들기 > 스킬 업로드에 ZIP 을 올린다.
   - Claude Code: ZIP 을 풀어 `~/.claude/skills/<이름>/`.
   - Codex: ZIP 을 풀어 `~/.agents/skills/<이름>/`, `$<이름>` 으로 부른다.

터미널에서 바로 만들 수도 있다.

```bash
node skills/nalssam-html-ppt/scripts/make_skill.js "[HTML PPT 스킬 설정] name=class-ppt; title=우리반 발표; ground=white; key=#3182F6" out
```

## 웹사이트로 올리기

`site/` 폴더가 그대로 정적 사이트다. Vercel·Netlify·GitHub Pages 어디든 `site` 를 루트로 지정하면 된다. 빌드 단계는 없다(만들어 둔 `index.html` 을 그대로 올린다).

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
