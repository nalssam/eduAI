# 출처와 고친 내용

nalssam-doc은 [chrisryugj/kordoc](https://github.com/chrisryugj/kordoc)의 `plugins/kordoc/skills/kordoc/SKILL.md`를 바탕으로 날쌤(nalssam)이 학교 문서에 맞게 고친 스킬이다.
원본은 MIT 라이선스이고, 원 저작권 표시와 라이선스 전문을 `LICENSE`에, kordoc의 제3자 고지를 `NOTICE`에 그대로 담았다.

- 바탕으로 한 원본: 이 저장소의 `skills/kordoc/SKILL.md`(가져온 시점 2026-11-21, 커밋 `c0c10da`, kordoc 4.25.3)
- 실행 엔진: npm `kordoc@4.25.15`(2026-11-25 배포). 원본 스킬보다 새 버전으로 고정했다
- 고친 날: 2026-11-25

## 고친 것

- 이름과 설명: `kordoc` → `nalssam-doc`. 설명을 학교 문서(가정통신문·계획서·결과 보고·협의록·기안 본문·학습지·서식 채우기·공문 읽기·개인정보 가리기) 중심으로 바꿨다
- 더한 것: 먼저 지킬 것(학생 정보·초안 원칙), 요청별 길 표, 교육청형 서식 값(결재란·밝은 장 띠), 받은 공문에서 할 일 뽑기,
  학습지 2단과 분수식, 개인정보 가리기(`redact`) 절, 원고 함정(줄 맨 앞 날짜, 요일 '금'), 견본 여섯 가지(`templates/`)
- 바꾼 것: 보고서·계획서 스타일(정부·서울시)을 먼저 묻는 대목 → 학교 문서는 묻지 않고 교육청형 값으로 만든다.
  서식 채우기의 개인정보 안내를 학생 정보 중심으로 강화했다. 기관팩 예시를 학교팩으로 바꿨다
- 줄인 것: 중앙부처 업무보고·서울시 방침서 전용 원고 규약, 기안문 두문·결문 옵션 상세, MCP 도구 목록. 필요하면 같은 팩의 `kordoc` 스킬을 본다

## 돌려 본 것 (2026-11-25, kordoc 4.25.15, Linux)

- `templates/plan.md`·`templates/report.md`: `lint --gate` 통과 → 교육청형 값으로 `generate --gate` → `validate` 통과 → `render`로 쪽 그림 확인
- `templates/letter.md`(`--preset 통지 --notice-head`), `templates/minutes.md`(`--preset 회의록`), `templates/worksheet.md`(`--plain --columns 2 --inline-math`): `generate` → `validate` 통과 → `render`로 확인
- `templates/gian.txt`: `lint` 위반 0건. 일부러 틀리게 쓴 본문(날짜 붙여 쓰기·오전 표기·`~` 띄어쓰기·끝 표시 빠짐)은 모두 지적됨
- 줄 맨 앞 날짜는 번호 목록으로 읽혀 `나. 24.`가 됨 → `2026\. 12. 24.`로 쓰면 바르게 나옴
- `redact`: 가상 문서에서 전화·이메일·주소(`address` 규칙)는 가려짐. 가상 학생 이름은 `--rules`에 `name`을 넣어도 잡히지 않음 → 이름은 사람이 확인하도록 적음
- 차트 펜스, `--font gothic --pt 13 --line-spacing 160`: 생성·검증 통과
- Windows와 한컴오피스에서 직접 열어 보지는 못했다. 쓰기 전에 한글에서 열어 확인한다

## 새 버전으로 올릴 때

`SKILL.md`의 `kordoc@4.25.15`를 모두 새 버전으로 바꾸고, 위 견본으로 같은 확인을 다시 한다.
