#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
FPS=12
DUR=15
OUT=../assets
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
N=$((FPS * DUR))
for LANG_CODE in en es; do
  SUFFIX=""
  [ "$LANG_CODE" = "es" ] && SUFFIX=".es"
  rm -f "$TMP"/f*.png
  for i in $(seq 1 "$N"); do
    t=$(awk -v i="$i" -v f="$FPS" 'BEGIN{printf "%.3f", (i-1)/f}')
    "$CHROME" --headless=new --hide-scrollbars --user-data-dir="$TMP/profile" \
      --window-size=960,540 --virtual-time-budget=3000 \
      --screenshot="$TMP/f$(printf %03d "$i").png" \
      "file://$PWD/explained.html?t=$t&lang=$LANG_CODE" >/dev/null 2>&1
  done
  ffmpeg -y -loglevel error -framerate "$FPS" -i "$TMP/f%03d.png" \
    -vf "split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5" \
    -loop 0 "$OUT/explained$SUFFIX.gif"
  ffmpeg -y -loglevel error -framerate "$FPS" -i "$TMP/f%03d.png" \
    -pix_fmt yuv420p -vf scale=960:-2 "$OUT/explained$SUFFIX.mp4"
done
ls -lh "$OUT"/explained*
