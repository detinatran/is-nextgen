#!/bin/bash
# Thêm header bảo mật (HSTS, nosniff, chống nhúng iframe, Referrer-Policy, Permissions-Policy) cho nginx
# của nextgen.vnuis.edu.vn, ẩn phiên bản nginx và header X-Powered-By.
# Chạy từ máy cá nhân:
#   SUDO_PASSWORD=... ; ssh nextgen@112.137.143.140 "SUDO_PASSWORD='$SUDO_PASSWORD' bash -s" < scripts/nginx-security-headers.sh
# Tự sao lưu cấu hình vào /etc/nginx/nextgen.bak-<ngày>, chạy nginx -t; lỗi thì khôi phục bản cũ và không reload.
set -e
P="${SUDO_PASSWORD:?đặt SUDO_PASSWORD}"
S=/etc/nginx/sites-enabled/nextgen
BAK=/etc/nginx/nextgen.bak-$(date +%Y%m%d%H%M)
echo "$P" | sudo -S -p '' cp $S $BAK

cat > /tmp/nextgen-security-headers.conf <<'H'
# Header bảo mật chung cho nextgen.vnuis.edu.vn (include ở cấp server và ở mọi location có add_header riêng,
# vì nginx bỏ header cấp server ở location tự đặt add_header)
add_header Strict-Transport-Security "max-age=31536000" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
H
echo "$P" | sudo -S -p '' mv /tmp/nextgen-security-headers.conf /etc/nginx/snippets/nextgen-security-headers.conf

python3 - <<'PY' > /tmp/nextgen.new
import re
s = open("/etc/nginx/sites-enabled/nextgen").read()
if "nextgen-security-headers" not in s:
    s = s.replace("    index index.html;\n", "    index index.html;\n\n    server_tokens off;\n    proxy_hide_header X-Powered-By;\n    proxy_hide_header Strict-Transport-Security;\n    proxy_hide_header X-Content-Type-Options;\n    proxy_hide_header X-Frame-Options;\n    proxy_hide_header Referrer-Policy;\n    include snippets/nextgen-security-headers.conf;\n", 1)
    out, inloc, added = [], False, False
    for line in s.split("\n"):
        if re.match(r"\s*location\b", line):
            inloc, added = True, False
        if inloc and not added and "add_header" in line:
            out.append(re.match(r"(\s*)", line).group(1) + "include snippets/nextgen-security-headers.conf;")
            added = True
        if inloc and line.strip() == "}":
            inloc = False
        out.append(line)
    s = "\n".join(out)
print(s, end="")
PY

echo "$P" | sudo -S -p '' cp /tmp/nextgen.new $S
if echo "$P" | sudo -S -p '' nginx -t; then
  echo "$P" | sudo -S -p '' systemctl reload nginx && echo "Đã áp dụng header bảo mật (bản sao lưu: $BAK)"
else
  echo "$P" | sudo -S -p '' cp $BAK $S
  echo "nginx -t lỗi: đã khôi phục cấu hình cũ" >&2
  exit 1
fi
