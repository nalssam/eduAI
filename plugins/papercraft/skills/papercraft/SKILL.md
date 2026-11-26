---
name: papercraft
description: "귀여운 3D 동물 페이퍼크래프트(종이 공작) 전개도를 A4 한 장 학습지로 만들고, 3D 로 가상 접기 영상까지 보여 준다. 트리거: 페이퍼크래프트, 종이 공작, 전개도 만들기, 만들기 학습지, 직육면체 전개도 동물, 3D 종이 인형, papercraft."
---

# papercraft · 페이퍼크래프트 학습지

동물 이름 하나만 받아도 바로 인쇄할 수 있는 A4 학습지를 만든다. 그림은 손으로 그리지 않는다. 이 플러그인의 MCP 도구(`papercraft` 서버)가 전개도·얼굴·배치·안내를 모두 그린다.

## 흐름

1. **무엇을 만들지 정한다.** 요청에 동물이 있으면 묻지 않고 만든다. 없으면 프리셋 중 하나를 권한다.
   - 프리셋: cat, graycat, bunny, bear, panda, penguin, fox, raccoon, koala, hamster, chick, frog
   - 프리셋에 없는 동물(강아지·돼지·유니콘 등)은 `papercraft_style_guide` 를 읽고 가장 가까운 프리셋에서 출발해 `colors`·`ears`·`mask`·`tail`·`accessory` 등을 바꾼다. 예: 강아지 = bear + colors 크림/갈색, ears round, tail stub, accessory heart.
2. **`create_papercraft_worksheet` 를 부른다.** `output_dir` 는 사용자가 열 수 있는 폴더(작업 폴더 아래 등)로 준다. 학년·수업이 수학이면 `activity: "math"`, 국어·창체면 `"story"`.
3. **결과를 확인한다.** 돌려받은 PNG 를 보고 잘린 곳·겹친 곳이 없는지 본다.
4. **가상으로 접어 보여 준다.** 사용자가 접는 모습을 원하거나 첫 결과물이면 `render_fold_preview` 에 `files.fold` 를 넘긴다. 장면표(PNG)·MP4·GIF 가 나온다. 3D HTML(`*-fold-3d.html`)은 브라우저에서 돌려 볼 수 있다.
5. **전달한다.** PDF(인쇄용), PNG(미리보기), 접기 영상, 3D HTML 경로를 알려 주고 "두꺼운 종이(180g 이상)에 실제 크기(100%)로 인쇄" 를 한 줄로 덧붙인다.

## MCP 가 없을 때

같은 폴더 위 `cli.js` 를 바로 돌린다.

```bash
node <플러그인 폴더>/cli.js --preset fox --out ./papercraft-out
node <플러그인 폴더>/cli.js --json my-spec.json --out ./papercraft-out
```

## 지키는 것

- 스타일은 `references/style-guide.md` 를 따른다. 사실적인 그림·그라데이션·글자 많은 안내를 넣지 않는다.
- 실존 캐릭터(만화·게임 캐릭터, 상표)를 흉내 내지 않는다. 비슷한 동물 친구로 바꿔 제안한다.
- 학생 이름·사진 같은 개인정보는 넣지 않는다(이름 칸은 비워 둔다).
