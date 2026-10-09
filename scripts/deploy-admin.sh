#!/usr/bin/env bash
# Deploy admin (nhánh main) lên https://nextgen.vnuis.edu.vn/admin — xem deploy/admin/docker-compose.yml.
#   SSHPASS=... scripts/deploy-admin.sh
# Lần đầu: tạo ~/nextgen-admin/deploy/admin/.env trên server (POSTGRES_PASSWORD, SMTP_URL giống ~/nextgen-backend/.env).
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${DEPLOY_HOST:-nextgen@112.137.143.140}"
DIR="${DEPLOY_ADMIN_DIR:-nextgen-admin}"

RSH="ssh"
[ -n "${SSHPASS:-}" ] && RSH="sshpass -e ssh"
rsync -az --delete -e "$RSH" \
  --exclude node_modules --exclude .next --exclude .git --exclude dist --exclude assets --exclude is-nextgen \
  --exclude src.zip --exclude "deploy/admin/.env" --exclude ".env*" \
  ./ "$HOST:$DIR/"
$RSH "$HOST" "cd $DIR/deploy/admin && docker compose up -d --build && docker image prune -f >/dev/null"
echo "Đã deploy admin: https://nextgen.vnuis.edu.vn/admin/"
