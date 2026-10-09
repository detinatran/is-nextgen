# Nối form đăng ký với Google Sheets

Trang là web tĩnh, nên form gửi dữ liệu tới một Google Apps Script. Script này ghi mỗi lượt đăng ký thành một dòng trong Google Sheet.

## 1. Tạo Sheet và script

1. Tạo một Google Sheet mới, ví dụ `IS-NextGen 2026 - Đăng ký`, và một thư mục Google Drive để chứa video và ảnh thí sinh (không cần chia sẻ công khai). Sao chép ID thư mục: phần cuối của URL `drive.google.com/drive/folders/<ID>`.
2. Vào **Tiện ích mở rộng → Apps Script**, xoá code mẫu và dán:

```js
const SHEET_NAME = "DangKy";
// ID thư mục Google Drive chứa video và ảnh (phần cuối URL của thư mục)
const VIDEO_FOLDER_ID = "DAN_ID_THU_MUC_VAO_DAY";
const MAX_VIDEO_BYTES = 300 * 1024 * 1024;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const FIELDS = [
  "submittedAt", "fullName", "dateOfBirth", "email", "phone", "facebook", "school",
  "department", "major", "studentId", "year", "nationality", "videoUrl", "photoUrl", "mediaConsent",
  "confirm", "shareProfile",
];

function doPost(e) {
  const body = (e.postData && e.postData.contents) || "";
  if (body.charAt(0) === "{") return json(initUpload(JSON.parse(body)));
  return json(saveRegistration(e.parameter || {}));
}

// Bước 1: tạo phiên tải lên Drive; trình duyệt sẽ gửi video/ảnh thẳng vào uploadUrl.
function initUpload(req) {
  if (req.action !== "initUpload") return { error: "Sai yêu cầu" };
  const type = req.mimeType || "";
  const max = /^video\//.test(type) ? MAX_VIDEO_BYTES : /^image\//.test(type) ? MAX_PHOTO_BYTES : 0;
  if (!max) return { error: "Chỉ nhận file video hoặc ảnh" };
  if (!(req.size > 0 && req.size <= max)) return { error: "File quá lớn" };
  const res = UrlFetchApp.fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true",
    {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + ScriptApp.getOAuthToken(),
        "X-Upload-Content-Type": req.mimeType,
        "X-Upload-Content-Length": String(req.size),
        Origin: req.origin, // để Drive cho phép trình duyệt từ trang web gửi file
      },
      payload: JSON.stringify({ name: String(req.name || "file").slice(0, 200), parents: [VIDEO_FOLDER_ID] }),
      muteHttpExceptions: true,
    },
  );
  const uploadUrl = res.getHeaders().Location || res.getHeaders().location;
  return uploadUrl ? { uploadUrl } : { error: "Drive từ chối: " + res.getResponseCode() };
}

// Bước 2: lưu thông tin đăng ký (kèm link video, ảnh và lựa chọn đồng ý hình ảnh) vào Sheet.
function saveRegistration(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(FIELDS);
    sheet.appendRow(FIELDS.map((f) => String(p[f] || "").slice(0, 500)));
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Dòng dưới không chạy, chỉ để Apps Script xin quyền Google Drive khi triển khai.
// DriveApp.getFolderById(VIDEO_FOLDER_ID);
```

3. Thay `DAN_ID_THU_MUC_VAO_DAY` bằng ID thư mục video.
   - Nếu Sheet đã có dòng tiêu đề từ phiên bản cũ, thêm hai cột `photoUrl` và `mediaConsent` ngay sau cột `videoUrl` (hoặc xoá dòng tiêu đề để script tự tạo lại) để dữ liệu không bị lệch cột.
   - Sửa code xong cần **Triển khai → Quản lý triển khai → Chỉnh sửa → Phiên bản mới** để áp dụng.
4. **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**:
   - Thực thi dưới dạng: **Tôi**
   - Người có quyền truy cập: **Bất kỳ ai**
5. Lần đầu triển khai, Google sẽ hỏi quyền truy cập Sheet, Drive và gửi yêu cầu ra ngoài: chọn **Cho phép**.
6. Sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/.../exec`).

## 2. Khai báo cho trang web

Tạo file `.env.local` (hoặc biến môi trường trên Vercel / GitHub Actions):

```
NEXT_PUBLIC_REGISTER_ENDPOINT=https://script.google.com/macros/s/.../exec
```

Build lại (`npm run build`). Khi biến này trống, form hiển thị nhưng bị khoá kèm dòng "Cổng đăng ký sẽ mở trong Lễ phát động".

> Cách hoạt động: khi thí sinh bấm gửi, trình duyệt xin Apps Script một đường dẫn tải lên, gửi ảnh (≤ 10 MB) và video (≤ 300 MB, kiểm tra độ dài ≤ 2 phút) thẳng vào thư mục Drive có thanh tiến trình, rồi gửi thông tin đăng ký kèm link ảnh, link video và lựa chọn đồng ý sử dụng hình ảnh (cột `mediaConsent`) vào Sheet. File đứng tên tài khoản triển khai script. Hãy thử một lượt đăng ký và kiểm tra cả Sheet lẫn thư mục Drive.

## 3. (Tuỳ chọn) Cập nhật kết quả bằng Google Sheet

Thay vì sửa `public/data/results.json`, Ban Tổ chức có thể dùng một Sheet:

1. Tạo tab có hàng tiêu đề đúng như sau: `round | title | status | date | link`
   - `status`: `upcoming` (Chưa diễn ra), `soon` (Sắp công bố) hoặc `published` (Đã công bố)
   - `link`: đường dẫn danh sách, chỉ hiện khi `status = published`
2. **Tệp → Chia sẻ → Công bố lên web**, chọn đúng tab, định dạng **CSV**, rồi sao chép link.
3. Đặt `NEXT_PUBLIC_RESULTS_CSV_URL=<link CSV>` và build lại một lần. Từ đó sửa Sheet là trang cập nhật theo (Google có thể trễ vài phút).
