#!/usr/bin/env bash
# Run on the Mac side. Makes small, edit-friendly copies of every clip:
# h264, long side 1920, 30fps, so staging + rendering is fast. Originals untouched.
# usage: proxy.sh <project_dir>
set -uo pipefail
PROJ="$1"; mkdir -p "$PROJ/proxies"
shopt -s nullglob nocaseglob
for f in "$PROJ"/clips/*.{mp4,mov,m4v,mkv}; do
  b="$(basename "${f%.*}")"; o="$PROJ/proxies/$b.mp4"
  [ -s "$o" ] && continue
  echo "proxy: $b"
  ffmpeg -loglevel error -y -i "$f" -vf "scale='if(gt(iw,ih),1920,-2)':'if(gt(iw,ih),-2,1920)',fps=30" \
    -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "$o.part.mp4" \
    && mv "$o.part.mp4" "$o" || echo "FAILED: $f"
done
for f in "$PROJ"/clips/*.{png,jpg,jpeg,webp}; do cp -n "$f" "$PROJ/proxies/" ; done
ls -la "$PROJ/proxies"
