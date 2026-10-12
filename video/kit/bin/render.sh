#!/usr/bin/env bash
# usage: render.sh <project_dir> [preview|final] [edit.json]
# preview = half-res fast check; final = full 1080x1920.
set -euo pipefail
KIT="$(cd "$(dirname "$0")/.." && pwd)"
PROJ="$(cd "$1" && pwd)"; MODE="${2:-preview}"; EDIT="${3:-$PROJ/edit.json}"
NAME="$(basename "$PROJ")"
mkdir -p "$PROJ/renders"
rm -rf "$PROJ/_kit"; cp -r "$KIT/public/_kit" "$PROJ/_kit"
STAMP="$(date +%m%d-%H%M)"
if [ "$MODE" = final ]; then
  OUT="$PROJ/renders/${NAME}_FINAL_${STAMP}.mp4"; EXTRA=(--crf 18)
else
  OUT="$PROJ/renders/${NAME}_preview_${STAMP}.mp4"; EXTRA=(--scale 0.5 --crf 26)
fi
export KIT_BROWSER="${KIT_BROWSER:-$(ls -d /opt/pw-browsers/chromium_headless_shell-*/*/headless_shell 2>/dev/null | head -1)}"
cd "$KIT"
npx remotion render src/index.ts Short "$OUT" --props="$EDIT" --public-dir="$PROJ" \
  ${KIT_BROWSER:+--browser-executable="$KIT_BROWSER"} "${EXTRA[@]}" --log=error
echo "$OUT"
