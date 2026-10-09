#!/usr/bin/env python3
"""Cấp quyền Google Drive cho web NextGen (chạy một lần trên máy của BTC).

Cách dùng (trong thư mục nextgen):
    python3 scripts/drive-auth.py

Script mở trình duyệt tới trang xin quyền của Google. Đăng nhập nextgen@vnuis.edu.vn,
bấm "Cho phép" (Allow). Kết quả lưu vào drive-token.json (đã có trong .gitignore).

Quyền xin là drive.file: web chỉ tạo và quản lý những file do chính nó tải lên,
không đọc được email hay các file khác của tài khoản.
"""
import base64
import glob
import hashlib
import http.server
import json
import os
import secrets
import sys
import urllib.parse
import urllib.request
import webbrowser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8765
REDIRECT = f"http://localhost:{PORT}/"
SCOPE = "https://www.googleapis.com/auth/drive.file"
OUT = os.path.join(ROOT, "drive-token.json")

files = glob.glob(os.path.join(ROOT, "client_secret_*.json"))
if not files:
    sys.exit("Không thấy file client_secret_*.json trong thư mục nextgen.")
client = json.load(open(files[0]))["installed"]

verifier = base64.urlsafe_b64encode(secrets.token_bytes(48)).rstrip(b"=").decode()
challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
state = secrets.token_urlsafe(16)
auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(
    {
        "client_id": client["client_id"],
        "redirect_uri": REDIRECT,
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",
        "prompt": "consent",
        "login_hint": "nextgen@vnuis.edu.vn",
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "state": state,
    }
)


def exchange(code: str) -> dict:
    body = urllib.parse.urlencode(
        {
            "code": code,
            "client_id": client["client_id"],
            "client_secret": client["client_secret"],
            "redirect_uri": REDIRECT,
            "grant_type": "authorization_code",
            "code_verifier": verifier,
        }
    ).encode()
    return json.load(urllib.request.urlopen("https://oauth2.googleapis.com/token", body, timeout=20))


def drive_info(access_token: str) -> str:
    req = urllib.request.Request(
        "https://www.googleapis.com/drive/v3/about?fields=user(emailAddress),storageQuota",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    about = json.load(urllib.request.urlopen(req, timeout=20))
    q = about.get("storageQuota", {})
    gb = lambda v: f"{int(v) / 1e9:.1f} GB" if v else "không giới hạn"
    return f"Tài khoản: {about['user']['emailAddress']} · Đã dùng {gb(q.get('usage'))} / {gb(q.get('limit'))}"


result = {}


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        if "code" not in q and "error" not in q:
            self.send_response(404)
            self.end_headers()
            return
        if q.get("state", [""])[0] != state:
            msg = "Phiên không khớp, hãy chạy lại script."
        elif "error" in q:
            msg = "Google báo lỗi: " + q["error"][0]
        else:
            try:
                tok = exchange(q["code"][0])
                if not tok.get("refresh_token"):
                    msg = "Google không trả về refresh token, hãy chạy lại script."
                else:
                    with open(OUT, "w") as f:
                        json.dump({"refresh_token": tok["refresh_token"], "scope": tok.get("scope")}, f)
                    os.chmod(OUT, 0o600)
                    result["info"] = drive_info(tok["access_token"])
                    msg = ""
            except Exception as e:  # noqa: BLE001
                msg = f"Lỗi khi đổi mã: {e}"
        ok = not msg
        html = (
            "<h2>Đã kết nối Google Drive cho web NextGen.</h2><p>Có thể đóng tab này.</p>"
            if ok
            else f"<h2>Chưa kết nối được</h2><p>{msg}</p>"
        )
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(f'<meta charset="utf-8"><body style="font-family:sans-serif;padding:40px">{html}</body>'.encode())
        result["ok"], result["msg"] = ok, msg


try:
    server = http.server.HTTPServer(("127.0.0.1", PORT), Handler)
except OSError:
    sys.exit(f"Cổng {PORT} đang bận. Đóng chương trình đang dùng cổng này rồi chạy lại.")

print("Đang mở trình duyệt. Nếu không tự mở, sao chép link sau vào trình duyệt:\n")
print(auth_url + "\n")
webbrowser.open(auth_url)
while "ok" not in result:
    server.handle_request()

if result["ok"]:
    print("XONG: đã lưu quyền Drive vào drive-token.json")
    print(result.get("info", ""))
else:
    sys.exit("CHƯA XONG: " + result["msg"])
