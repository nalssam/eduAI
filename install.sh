#!/usr/bin/env sh
# 날쌤 분필팩 스킬 설치 — Claude Code 와 Codex 에 한 번에 넣는다.
#   curl -fsSL https://raw.githubusercontent.com/nalssam/eduAI/main/install.sh | sh
#   … | sh -s -- claude     (Claude Code 에만)      … | sh -s -- codex     (Codex 에만)
# 같은 이름의 스킬이 이미 있으면 지우지 않고 skills 옆 skills-backup-날짜시각 폴더로 옮겨 둔다.
set -eu

TARGET="${1:-all}"
SRC="${BUNPIL_PACK_SRC:-https://github.com/nalssam/eduAI/archive/refs/heads/main.tar.gz}"

case "$TARGET" in
  all) DESTS="$HOME/.claude/skills $HOME/.agents/skills" ;;
  claude) DESTS="$HOME/.claude/skills" ;;
  codex) DESTS="$HOME/.agents/skills" ;;
  *) echo "쓰는 법: install.sh [all|claude|codex]" >&2; exit 1 ;;
esac

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
echo "분필팩을 받는 중…"
if [ -f "$SRC" ]; then cp "$SRC" "$TMP/pack.tar.gz"; else curl -fsSL "$SRC" -o "$TMP/pack.tar.gz"; fi
tar -xzf "$TMP/pack.tar.gz" -C "$TMP"
ROOT="$(find "$TMP" -maxdepth 2 -type d -name skills | head -n 1)"
[ -n "$ROOT" ] || { echo "받은 파일에서 skills 폴더를 찾지 못했어요." >&2; exit 1; }

STAMP="$(date +%Y%m%d-%H%M%S)"
COUNT=0
for DEST in $DESTS; do
  mkdir -p "$DEST"
  for DIR in "$ROOT"/*/; do
    [ -f "$DIR/SKILL.md" ] || continue
    NAME="$(basename "$DIR")"
    if [ -e "$DEST/$NAME" ]; then
      mkdir -p "$DEST-backup-$STAMP"
      mv "$DEST/$NAME" "$DEST-backup-$STAMP/$NAME"
      echo "  이미 있던 $NAME 은 $DEST-backup-$STAMP 로 옮겼어요"
    fi
    cp -R "$DIR" "$DEST/$NAME"
    COUNT=$((COUNT + 1))
  done
  echo "넣었어요 → $DEST"
done
[ "$COUNT" -gt 0 ] || { echo "넣을 스킬이 없었어요." >&2; exit 1; }
echo "끝. Claude Code 나 Codex 를 새로 열고 \"날쌤 HTML PPT 로 발표 자료 만들어 줘\"라고 해 보세요."
