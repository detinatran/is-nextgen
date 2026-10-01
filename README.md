# is-nextgen

Landing page của **IS-NextGen Manager Challenge 2026 – Nhà Quản trị trong Kỷ nguyên mới**, Khoa Kinh tế và Quản lý, Trường Quốc tế – ĐHQGHN.

Next.js 16 (App Router, xuất web tĩnh) + Tailwind CSS 4. Không cần server: thư mục `out/` sau khi build có thể đưa lên GitHub Pages, Vercel, Netlify hoặc hosting của Trường.

## Chạy thử

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # xuất web tĩnh ra out/
```

## Sửa nội dung

| Muốn sửa | File |
| --- | --- |
| Chữ, số liệu, vòng thi, giải thưởng, lộ trình, FAQ, hạn đăng ký, liên hệ | [src/content/site.ts](src/content/site.ts) |
| Kết quả từng vòng (không cần build lại) | [public/data/results.json](public/data/results.json) hoặc Google Sheet, xem [docs/google-apps-script.md](docs/google-apps-script.md) |
| Màu sắc, font | [src/app/globals.css](src/app/globals.css) (`@theme`) |
| Banner, logo | `public/images/banner.webp`, `public/images/crest.png` (bản gốc trong `assets/`) |

Những chỗ cần Ban Tổ chức điền đều có ghi chú `TODO(BTC)` trong `site.ts`: hạn đăng ký chính thức, email, số điện thoại, fanpage, hồ sơ tài trợ.

## Form đăng ký

Form gửi dữ liệu vào Google Sheet qua Google Apps Script. Cách cài đặt có trong [docs/google-apps-script.md](docs/google-apps-script.md). Chưa khai báo `NEXT_PUBLIC_REGISTER_ENDPOINT` thì form bị khoá.

## Biến môi trường

Xem [.env.example](.env.example).

| Biến | Ý nghĩa |
| --- | --- |
| `NEXT_PUBLIC_REGISTER_ENDPOINT` | URL Web App của Apps Script nhận đăng ký |
| `NEXT_PUBLIC_RESULTS_CSV_URL` | (Tuỳ chọn) link CSV của Sheet kết quả |
| `NEXT_PUBLIC_BASE_PATH` | `/is-nextgen` khi deploy GitHub Pages dạng project page |
| `NEXT_PUBLIC_SITE_URL` | Domain chính thức, dùng cho ảnh chia sẻ (Open Graph) |

## Ảnh minh hoạ

Ảnh trong `public/images/generated/` được sinh bằng Codex CLI. Ảnh nào chưa có thì trang tự hiện hoạ tiết thương hiệu thay thế. Để sinh các ảnh còn thiếu:

```bash
./scripts/gen-images.sh
```

## Cấu trúc

```
src/
  app/            layout, trang chủ, CSS
  components/     Header, Countdown, Photo, form, kết quả...
    sections/     từng khối của landing page
  content/        toàn bộ nội dung chữ
  lib/            tải kết quả, xử lý đường dẫn
public/
  data/           results.json
  images/         banner, logo, ảnh minh hoạ
docs/             hướng dẫn Google Apps Script
scripts/          sinh ảnh bằng Codex
```
