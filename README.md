# eduAI

날쌤(nalssam)의 교육용 AI 스킬 모음. 날쌤 분필팩에 들어갈 스킬을 여기서 다듬는다.

## 스킬

| 스킬 | 하는 일 |
|---|---|
| [`nalssam-html-ppt`](skills/nalssam-html-ppt/SKILL.md) | 날쌤 스타일 발표 덱을 브라우저로 여는 HTML 파일 하나로 만든다 |

## nalssam-html-ppt 써 보기

`skills/nalssam-html-ppt/assets/starter.html` 을 브라우저로 열면 견본 18장이 나온다. `→` 로 넘기고 `N` 으로 대본, `G` 로 목록, `?` 로 도움말을 본다.

Claude 에 붙이려면 `skills/nalssam-html-ppt` 폴더를 스킬 경로(`~/.claude/skills/` 또는 프로젝트의 `.claude/skills/`)에 복사한다.

```bash
node skills/nalssam-html-ppt/scripts/check.js 덱.html shots       # 캡처 + 넘침·대본 검사
python3 skills/nalssam-html-ppt/scripts/inline_font.py 덱.html 완성.html   # 인터넷 없는 곳용
```

## 참고한 자료

- [Design in words](https://designinwords.onpod.ai/) — 슬라이드 구성·간격·대비 기준
- [Remotion Scenes](https://github.com/lifeprompt-team/remotion-scenes) (MIT) — 이징 값과 레이아웃 구도
- [ko/design.md](https://www.getdesign.kr/) — 한국 서비스 디자인 톤을 빌리는 절차
- 글꼴 [Pretendard](https://github.com/orioncactus/pretendard) (SIL OFL 1.1)
