#!/usr/bin/env bash
# Turn a hero video into a scroll-scrubbed WebP frame sequence.
#
#   scripts/make-frames.sh path/to/hero.mp4 [frame-count]
#
# Writes public/frames/hero/{desktop,mobile}/f_0001.webp … and public/frames/hero/manifest.json.
# The hero picks the sequence up automatically on the next page load.
# Needs ffmpeg and cwebp (brew install ffmpeg webp).
set -euo pipefail

SRC="${1:?usage: scripts/make-frames.sh <video> [frame-count]}"
COUNT="${2:-300}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/frames/hero"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

command -v ffmpeg >/dev/null || { echo "ffmpeg not found (brew install ffmpeg)"; exit 1; }
command -v cwebp >/dev/null || { echo "cwebp not found (brew install webp)"; exit 1; }

DURATION="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")"
FPS="$(awk -v c="$COUNT" -v d="$DURATION" 'BEGIN { printf "%.4f", c / d }')"
echo "→ $SRC · ${DURATION}s · sampling ${COUNT} frames at ${FPS} fps"

rm -rf "$OUT"
mkdir -p "$OUT/desktop" "$OUT/mobile" "$TMP/desktop" "$TMP/mobile"

# Desktop: 1920 wide. Mobile: 1080 wide (the canvas cover-crops it for portrait screens).
ffmpeg -v error -i "$SRC" -vf "fps=$FPS,scale=1920:-2:flags=lanczos" -frames:v "$COUNT" "$TMP/desktop/f_%04d.png"
ffmpeg -v error -i "$SRC" -vf "fps=$FPS,scale=1080:-2:flags=lanczos" -frames:v "$COUNT" "$TMP/mobile/f_%04d.png"

encode() {
  local dir="$1" q="$2"
  find "$TMP/$dir" -name '*.png' -print0 |
    xargs -0 -P 8 -I{} sh -c 'f="{}"; cwebp -quiet -q '"$q"' -m 5 "$f" -o "'"$OUT/$dir"'/$(basename "${f%.png}").webp"'
}
echo "→ encoding WebP"
encode desktop 78
encode mobile 72

N="$(find "$OUT/desktop" -name '*.webp' | wc -l | tr -d ' ')"
dims() { ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$1" | tr ',' ' '; }
read -r DW DH < <(dims "$TMP/desktop/f_0001.png")
read -r MW MH < <(dims "$TMP/mobile/f_0001.png")

cat > "$OUT/manifest.json" <<JSON
{
  "count": $N,
  "pad": 4,
  "desktop": { "path": "/frames/hero/desktop/f_{index}.webp", "width": $DW, "height": $DH },
  "mobile": { "path": "/frames/hero/mobile/f_{index}.webp", "width": $MW, "height": $MH }
}
JSON

SIZE="$(du -sh "$OUT" | cut -f1)"
echo "✓ $N frames → public/frames/hero ($SIZE)"
