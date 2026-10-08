#!/usr/bin/env bash
# Build tĩnh rồi đồng bộ lên server nextgen.vnuis.edu.vn (nginx phục vụ /var/www/nextgen).
#   scripts/deploy.sh            # dùng khoá SSH hoặc hỏi mật khẩu
#   SSHPASS=... scripts/deploy.sh  # cần sshpass
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${DEPLOY_HOST:-nextgen@112.137.143.140}"
DEST="${DEPLOY_DEST:-/var/www/nextgen/}"

unset NEXT_PUBLIC_BASE_PATH
npm run build

RSH="ssh"
[ -n "${SSHPASS:-}" ] && RSH="sshpass -e ssh"
rsync -az --delete -e "$RSH" out/ "$HOST:$DEST"
echo "Đã deploy: https://nextgen.vnuis.edu.vn"
