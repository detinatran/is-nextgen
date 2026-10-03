#!/bin/zsh
# Sinh ảnh minh hoạ và hoạ tiết bằng Codex CLI (cần `codex login` và còn hạn mức).
# Asset đã có trong public/images/generated/ sẽ được bỏ qua, nên chạy lại bao nhiêu lần cũng được.
# Danh sách xếp theo mức ưu tiên; mỗi đợt chạy song song 3 ảnh, dừng sớm nếu Codex báo hết hạn mức.
#   ./scripts/gen-images.sh                 # sinh tất cả asset còn thiếu
#   ./scripts/gen-images.sh trophy wave-hero # chỉ sinh vài asset
set -u
cd "$(dirname "$0")/.."
OUT=public/images/generated
TMP=.cache/images # nằm trong workspace để sandbox của Codex ghi được
mkdir -p "$OUT" "$TMP"

PHOTO="Photorealistic, cinematic, high detail, natural colors with cool blue tones and warm golden accents. No text, no watermark, no logos."
SCENE="Landscape 3:2."

typeset -A P MODE INPUT CHECK

# ---- Ảnh cảnh lớn ----
P[theme-ai]="A young Vietnamese businessman in a navy suit seen from behind, over-the-shoulder, standing on a modern rooftop plaza at sunrise looking at a futuristic city skyline. Floating translucent holographic glass UI panels around him showing the words 'AI', 'Strategy' and 'Innovation' plus small business icons. Warm golden sun flare in the center, blue sky, reflective floor. $SCENE Photorealistic, cinematic. No other text, no logos."
P[theme-seminar]="Documentary-style candid photo, not staged: a small group of Vietnamese university students in casual smart clothes around a seminar table in a plain university classroom, one student explaining something on a laptop while two others look at a printed chart and take handwritten notes, a lecturer listening at the side. Natural window light, muted realistic colors, slight film grain, shallow depth of field, shot on a 35mm lens. No holograms, no floating UI, no glowing effects, no text, no logos. Landscape 3:2."
P[values-bg]="Wide panoramic website banner background: deep navy-blue twilight sky, majestic rocky mountain peaks on the right lit by a warm golden sunrise glow on the horizon, faint futuristic skyscraper silhouettes in the middle distance, dark trees in the lower-left corner, soft clouds. The left half is darker and calm for overlaying white text. $SCENE $PHOTO"
P[timeline-bg]="Wide panoramic website banner background at dusk: deep navy-blue sky on the left fading to a warm orange sunset on the right, layered blue mountain ranges, a winding highway with golden light trails curving from the right toward the lower center, a modern city with one tall landmark skyscraper on the right, trees with golden leaves in the lower-right corner. The left side is darker and uncluttered for white text. $SCENE $PHOTO"
P[footer-bg]="Night city skyline background for a website footer: dark navy-blue tones, illuminated modern skyscrapers on the right half with warm window lights, a wide road leading toward the city, a lone young man in a suit seen from behind standing on the road looking at the city, subtle blue haze. The left 40 percent is very dark navy and empty. $SCENE $PHOTO"
P[about-city]="Low-angle view looking up at modern glass skyscrapers in a business district at golden hour, warm sunlight flaring between the towers, clear blue sky with soft clouds, green trees at the bottom edge. $SCENE $PHOTO"
P[cta-students]="Four cheerful Vietnamese university students (two young women and two young men, smart casual, backpacks) standing side by side, upper bodies only, smiling and looking up toward the upper left with optimism, against a smooth plain warm orange gradient studio background (from #F7931E to #F26522). $SCENE Photorealistic, soft light. No text, no logos."
P[trophy]="3D render of luxurious golden trophies with crown tops standing on glossy golden cylindrical podiums of different heights, on a round glossy platform with soft glowing golden light rings, isolated on a pure white background (#FFFFFF), soft shadows, premium award concept. $SCENE No text."
P[round-case]="Four Vietnamese university students in business attire analyzing a management case together at a table with printed documents and a laptop in a bright modern office, focused discussion, natural daylight. $SCENE $PHOTO"
P[round-pitch]="A Vietnamese university student in a suit presenting confidently in front of a large screen with charts to a panel of judges and a seated audience in a modern meeting hall, teammates standing beside him. $SCENE $PHOTO"
PAIR="Two separate professional portrait photos placed side by side, split exactly down the vertical center line: the left photo fills the left half, the right photo fills the right half, no border, no gap. Both are upper-body portraits of Vietnamese university students with a friendly confident smile looking at the camera, soft natural light, bright modern office or campus background with bokeh. $SCENE Photorealistic. No text, no logos."
P[personas-a]="$PAIR Left: a young woman with long dark hair in a light pink blouse. Right: a young man in a navy suit and white shirt holding documents."
P[personas-b]="$PAIR Left: a young woman with shoulder-length hair in a white shirt and beige blazer. Right: a young man with glasses in a light blue shirt."
P[personas-c]="$PAIR Left: a young woman with a ponytail in a navy blazer. Right: a young man in a grey sweater over a collared shirt."

# ---- Hero góc rộng, dựng lại từ banner gốc ----
P[hero-wide]="Edit the attached key visual: outpaint it into a wider panorama. Keep the original artwork in the center exactly as it is, at the same large scale and the same position relative to the image height: the big glossy silver 3D letter N with an upward arrow, the red brush-stroke 'IS', the silver 3D letters 'EXTGEN', the glossy orange-red 3D letters 'MANAGER 2026', the round glass podium in the rippling water, the floating glass bubbles. The title must still fill about 55 percent of the image width. Only extend the scene outward on the left and the right with more modern glass skyscrapers, green trees and a curved reflecting-pool plaza edge, under the same bright blue sky with white clouds. Remove the four small logos at the top. Same photorealistic 3D render style, colors and lighting. Landscape 3:2."
INPUT[hero-wide]=assets/7.png

# ---- Dải lượn sóng và chuyển cảnh ----
P[wave-hero]="Abstract website design element on a pure black background (#000000). Across the full width in the lower third there is a wide, gently curved arc like the rim of a giant glass lens: the arc is lowest in the center and rises toward the left and right edges. Everything below the arc is solid pure white (#FFFFFF). The arc edge glows with a soft translucent light-blue glassy highlight and subtle cyan reflections that fade upward into the black. Above the glow it is pure black. No text, no objects. $SCENE"
P[wave-mist-top]="Abstract website section divider on a pure black background (#000000). The top 35 percent of the image is solid pure white. Below it the white dissolves downward into soft wispy cloud-like mist forming a gently undulating wavy edge across the full width, with soft cloud tufts and a subtle pale-blue tint, fading completely into pure black in the bottom 40 percent. No text, no objects. $SCENE"
P[wave-mist-bottom]="Abstract website section divider on a pure black background (#000000). The bottom 35 percent of the image is solid pure white. Above it, white soft misty clouds rise upward forming one wide gentle wave that is higher on the left and lower on the right, with faint pale snowy mountain silhouettes emerging from the mist on the right. The top 40 percent is pure black. No text. $SCENE"

# ---- Điểm nhấn Mùa 1 (ảnh tư liệu tự nhiên, tránh vẻ "AI") ----
DOC="Documentary-style candid photo, not staged, of Vietnamese university students in smart casual or business attire. Natural light, muted realistic colors, slight film grain, shallow depth of field, shot on a 35mm lens. No holograms, no floating UI, no glowing effects, no text, no logos, no watermarks. Landscape 3:2."
P[hl-lgd]="Six students seated around a round meeting table having a lively leaderless group discussion with printed case documents and sticky notes, nobody standing at the head of the table, two assessors with clipboards observing quietly in the soft-focus background of a bright university meeting room. $DOC"
P[hl-trip]="A small group of students on a company visit walking through the bright open-plan office of a large corporation, a friendly middle-aged manager in a blazer guiding them and gesturing toward the workspace, glass walls and plants, students holding notebooks. $DOC"
P[hl-dinner]="An evening networking dinner in a hotel function room with round tables and warm ambient lighting, students in formal attire talking and shaking hands with business professionals, name badges, glasses of juice, relaxed genuine smiles. $DOC"
P[hl-mt]="A final job interview in a corporate glass-walled meeting room: a confident young student candidate in a suit shaking hands across the table with a panel of three senior managers, city view through the window, documents and a laptop on the table. $DOC"

# ---- Hoạ tiết nền (tách nền trắng thành trong suốt) ----
P[deco-blue-waves]="Very light abstract decorative background on a pure white background (#FFFFFF): elegant translucent light-blue silk ribbons and glassy flowing wave shapes sweeping in from the left edge and from the right edge, soft gradients from sky blue to white, subtle glossy highlights. The center 50 percent of the image is completely empty pure white. No text. $SCENE"
P[deco-peach-waves]="Very light abstract decorative background on a pure white background (#FFFFFF): translucent peach and soft orange silk ribbons and flowing wave layers, faint pale peach mountain silhouettes in the distance on the left, warm glowing light in the upper right, airy and delicate. The center-left area is mostly empty white. No text. $SCENE"
P[deco-clouds]="Soft fluffy white clouds with very light blue shading, clustered only in the bottom-left corner and the bottom-right corner, on a pure white background (#FFFFFF). The top two thirds and the center are completely empty pure white. Dreamy, airy, photoreal clouds. No text. $SCENE"
P[rounds-bg]="Very pale misty low-contrast city skyline silhouettes in light blue-grey tones, only along the bottom edge on the far left and far right, with soft fog, on a pure white background (#FFFFFF); the rest of the image is empty pure white. No text. $SCENE"
P[soft-bg]="Very light airy website background: pale misty blue mountain ranges across the middle distance, a faint pale city skyline on the right side, warm sunlit trees with a soft peach-orange glow in the bottom-left corner, wispy clouds, mostly white and low contrast so dark text stays readable. No text. $SCENE"
P[cta-bg]="Abstract warm background texture: smooth vibrant orange gradient (from #FF9A3C to #F26522) with soft lighter flowing silk-like light streaks and subtle wave highlights sweeping diagonally, glossy and elegant. No text, no objects. $SCENE"

# ---- Icon 3D ----
P[icons-gold]="Four separate luxurious 3D golden emblem icons arranged in a 2 by 2 grid with generous equal spacing, each centered in its own quadrant, on a pure black background (#000000): top-left a golden shield badge with a glowing eye-shaped core, top-right a golden compass star with a target crosshair, bottom-left a cluster of small golden figure busts forming a team, bottom-right a golden map-pin badge with a coin in the middle. Metallic gold with warm glow and tiny sparkles. No text. $SCENE"
P[icons-light]="Eight separate glossy 3D icons arranged in a grid of 4 columns by 2 rows with generous equal spacing, each centered in its own cell, on a pure white background (#FFFFFF), minimal shadows. Top row from left to right: a blue brain, an orange glowing light bulb, a purple group of three people, a golden trophy cup. Bottom row from left to right: a golden crown, a red and gold medal with ribbon, a golden star medal, a red award badge with ribbon. Modern clean 3D icon style. No text. $SCENE"

MODE=(
  theme-ai photo theme-seminar photo values-bg photo timeline-bg photo footer-bg photo about-city photo cta-students key-orange
  trophy cutout round-case photo round-pitch photo
  personas-a pair personas-b pair personas-c pair
  hero-wide photo
  wave-hero black wave-mist-top black wave-mist-bottom black
  deco-blue-waves white deco-peach-waves white deco-clouds white rounds-bg white soft-bg photo cta-bg photo
  icons-gold grid:2x2:black icons-light grid:4x2:white
  hl-lgd photo hl-trip photo hl-dinner photo hl-mt photo
)
# Tên file kiểm tra đã sinh hay chưa (mặc định <tên>.webp)
CHECK=(personas-a persona-1 personas-b persona-3 personas-c persona-5 icons-gold icon-value-1 icons-light icon-light-1)
# Tên đầu ra khác tên asset
typeset -A OUTNAME
OUTNAME=(personas-a persona personas-b persona personas-c persona icons-gold icon-value icons-light icon-light)

ORDER=(
  theme-ai values-bg timeline-bg
  hero-wide wave-mist-top wave-hero
  footer-bg deco-blue-waves cta-students
  about-city trophy deco-peach-waves
  wave-mist-bottom round-case round-pitch
  personas-a personas-b personas-c
  icons-gold icons-light deco-clouds
  soft-bg rounds-bg cta-bg
  hl-lgd hl-trip hl-dinner hl-mt
)

done_already() { [[ -f "$OUT/${CHECK[$1]:-$1}.webp" ]]; }

postprocess() {
  local name=$1 out_name=${OUTNAME[$1]:-$1}
  case $name in
    personas-b) python3 scripts/postprocess.py pair "$TMP/$name.png" "$OUT" tmp-pair && mv "$OUT/tmp-pair-1.webp" "$OUT/persona-3.webp" && mv "$OUT/tmp-pair-2.webp" "$OUT/persona-4.webp" ;;
    personas-c) python3 scripts/postprocess.py pair "$TMP/$name.png" "$OUT" tmp-pair-c && mv "$OUT/tmp-pair-c-1.webp" "$OUT/persona-5.webp" && mv "$OUT/tmp-pair-c-2.webp" "$OUT/persona-6.webp" ;;
    *) python3 scripts/postprocess.py "${MODE[$name]}" "$TMP/$name.png" "$OUT" "$out_name" ;;
  esac
}

gen() {
  local name=$1
  if done_already "$name"; then echo "skip $name (đã có)"; return; fi
  rm -f "$TMP/$name.png"
  local prompt="Use your image generation tool to create ONE image. ${P[$name]} Save the final image to $TMP/$name.png (use sips to convert to PNG if needed). Reply only with the saved path."
  local args=(exec --skip-git-repo-check -s workspace-write "$prompt")
  # -i nhận nhiều giá trị, nên đặt sau câu lệnh để không nuốt mất câu lệnh
  [[ -n "${INPUT[$name]:-}" ]] && args+=(-i "${INPUT[$name]}")
  codex $args > "$TMP/$name.log" 2>&1 < /dev/null
  if [[ -f "$TMP/$name.png" ]] && postprocess "$name"; then
    echo "ok    $name"
  elif grep -q "usage limit" "$TMP/$name.log"; then
    touch "$TMP/.limit"
    echo "LIMIT $name — Codex hết hạn mức"
  else
    echo "FAIL  $name — xem $TMP/$name.log"
  fi
}

rm -f "$TMP/.limit"
list=(${@:-$ORDER})
for ((i = 1; i <= ${#list}; i += 3)); do
  for name in ${list[i,i+2]}; do gen "$name" & done
  wait
  if [[ -f "$TMP/.limit" ]]; then
    echo "Codex hết hạn mức, dừng. Chạy lại script sau khi được reset."
    break
  fi
done
