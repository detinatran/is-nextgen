# Nối form đăng ký với Google Sheets

Trang là web tĩnh, nên form gửi dữ liệu tới một Google Apps Script. Script này ghi mỗi lượt đăng ký thành một dòng trong Google Sheet.

## 1. Tạo Sheet và script

1. Tạo một Google Sheet mới, ví dụ `IS-NextGen 2026 - Đăng ký`.
2. Vào **Tiện ích mở rộng → Apps Script**, xoá code mẫu và dán:

```js
const SHEET_NAME = "DangKy";
const FIELDS = [
  "submittedAt", "fullName", "email", "phone", "school", "major",
  "studentId", "year", "nationality", "videoUrl", "confirm", "shareProfile",
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(FIELDS);
    const p = e.parameter || {};
    sheet.appendRow(FIELDS.map((f) => String(p[f] || "").slice(0, 500)));
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

3. **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**:
   - Thực thi dưới dạng: **Tôi**
   - Người có quyền truy cập: **Bất kỳ ai**
4. Sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/.../exec`).

## 2. Khai báo cho trang web

Tạo file `.env.local` (hoặc biến môi trường trên Vercel / GitHub Actions):

```
NEXT_PUBLIC_REGISTER_ENDPOINT=https://script.google.com/macros/s/.../exec
```

Build lại (`npm run build`). Khi biến này trống, form hiển thị nhưng bị khoá kèm dòng "Cổng đăng ký sẽ mở trong Lễ phát động".

> Apps Script không trả header CORS, nên trình duyệt gửi ở chế độ `no-cors` và không đọc được phản hồi. Hãy kiểm tra Sheet sau lượt đăng ký thử đầu tiên.

## 3. (Tuỳ chọn) Cập nhật kết quả bằng Google Sheet

Thay vì sửa `public/data/results.json`, Ban Tổ chức có thể dùng một Sheet:

1. Tạo tab có hàng tiêu đề đúng như sau: `round | title | status | date | link`
   - `status`: `upcoming` (Chưa diễn ra), `soon` (Sắp công bố) hoặc `published` (Đã công bố)
   - `link`: đường dẫn danh sách, chỉ hiện khi `status = published`
2. **Tệp → Chia sẻ → Công bố lên web**, chọn đúng tab, định dạng **CSV**, rồi sao chép link.
3. Đặt `NEXT_PUBLIC_RESULTS_CSV_URL=<link CSV>` và build lại một lần. Từ đó sửa Sheet là trang cập nhật theo (Google có thể trễ vài phút).
