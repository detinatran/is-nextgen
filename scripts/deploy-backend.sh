#!/usr/bin/env bash
# Đồng bộ thư mục backend/ lên server rồi build + chạy lại bằng Docker Compose (docker-compose.prod.yml).
#   scripts/deploy-backend.sh              # dùng khoá SSH hoặc hỏi mật khẩu
#   SSHPASS=... scripts/deploy-backend.sh  # cần sshpass
# Lần đầu: tạo ~/nextgen-backend/.env trên server với POSTGRES_PASSWORD=<mật khẩu mạnh>.
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${DEPLOY_HOST:-nextgen@112.137.143.140}"
DIR="${DEPLOY_BACKEND_DIR:-nextgen-backend}"

RSH="ssh"
[ -n "${SSHPASS:-}" ] && RSH="sshpass -e ssh"
rsync -az --delete -e "$RSH" \
  --exclude node_modules --exclude dist --exclude .data --exclude .env --exclude coverage \
  backend/ "$HOST:$DIR/"
$RSH "$HOST" "cd $DIR && docker compose -f docker-compose.prod.yml up -d --build && docker image prune -f >/dev/null"
echo "Đã deploy backend: https://nextgen.vnuis.edu.vn/api/v1/health/ready"
