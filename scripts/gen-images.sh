#!/bin/zsh
# Sinh ảnh minh hoạ còn thiếu bằng Codex CLI (cần đăng nhập `codex login` và còn hạn mức).
# Ảnh đã có trong public/images/generated/ sẽ được bỏ qua. Chạy: ./scripts/gen-images.sh
set -u
cd "$(dirname "$0")/.."
OUT=public/images/generated
TMP=.cache/images  # nằm trong workspace để sandbox của Codex ghi được
mkdir -p "$OUT" "$TMP"

STYLE="Photorealistic editorial photography, 16:9 landscape, cool blue tones with subtle warm orange accents, natural light, shallow depth of field, Vietnamese university students in smart-casual or business attire. No text, no watermark, no logos."

typeset -A PROMPTS
PROMPTS=(
  about "a university lecturer coaching a small group of business students around a whiteboard covered with an organizational chart and decision tree, modern international school campus classroom."
  round-1 "a focused female student taking a proctored online aptitude test on a laptop in a quiet modern university computer lab, charts and logic puzzles visible but blurred on screen."
  round-2 "six students around a meeting table in a bright glass-walled room, intensely discussing a management case with sticky notes and laptops, no one clearly leading."
  round-3 "a student at a desk handling a simulated executive inbox: laptop with many emails, priority notes, a phone, under time pressure but composed; two judges blurred in the background."
  round-4 "a team of four students presenting a business strategy on stage to a panel of five judges in a modern auditorium, large blurred slide behind them, blue stage lighting with warm accents."
  business-trip "about 15 students touring the open-plan headquarters of a large Vietnamese technology corporation, a middle-aged manager guiding and explaining, glass walls and modern workspaces."
  networking "an elegant evening networking dinner: students in formal attire talking with business executives and lecturers, standing cocktail tables, warm ambient lighting mixed with blue tones."
)

gen() {
  local name=$1
  if [[ -f "$OUT/$name.webp" ]]; then echo "skip $name (đã có)"; return; fi
  codex exec --skip-git-repo-check -s workspace-write \
    "Use your image generation tool to create ONE image. Subject: ${PROMPTS[$name]} Style: $STYLE Save the final image to $TMP/$name.png (use sips to convert to PNG if needed). Reply only with the saved path." \
    > "$TMP/$name.log" 2>&1
  if [[ -f "$TMP/$name.png" ]]; then
    cwebp -quiet -q 80 -resize 1536 0 "$TMP/$name.png" -o "$OUT/$name.webp" && echo "ok   $name"
  else
    echo "FAIL $name — xem $TMP/$name.log"
  fi
}

for name in ${(k)PROMPTS}; do gen "$name" & done
wait
