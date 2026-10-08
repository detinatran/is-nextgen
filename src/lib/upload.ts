// Tải video và ảnh thẳng từ trình duyệt lên Google Drive qua phiên "resumable upload".
// Apps Script (docs/google-apps-script.md) tạo phiên và trả về uploadUrl; trình duyệt PUT file vào đó,
// nên dung lượng không bị giới hạn 50MB của Apps Script.

export const MAX_VIDEO_MB = 300;
export const MAX_VIDEO_SECONDS = 120;
export const MAX_PHOTO_MB = 10;

/** Đọc thời lượng video ở client; trả null nếu trình duyệt không đọc được định dạng. */
export function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.onloadedmetadata = () => done(Number.isFinite(video.duration) ? video.duration : null);
    video.onerror = () => done(null);
    video.src = url;
  });
}

async function createUploadSession(endpoint: string, file: File, name: string): Promise<string> {
  // Gửi text/plain để là "simple request": Apps Script trả JSON đọc được, không cần preflight CORS.
  const res = await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify({
      action: "initUpload",
      name: name.slice(0, 200),
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      origin: window.location.origin,
    }),
  });
  const data = (await res.json()) as { uploadUrl?: string; error?: string };
  if (!data.uploadUrl) throw new Error(data.error || "Không tạo được phiên tải lên");
  return data.uploadUrl;
}

/** Tải file (video hoặc ảnh) lên Drive với tên `name`, báo tiến trình 0..1; trả về link xem file. */
export async function uploadFile(endpoint: string, file: File, name: string, onProgress: (ratio: number) => void): Promise<string> {
  const uploadUrl = await createUploadSession(endpoint, file, name);
  const fileId = await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      try {
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText).id);
        else reject(new Error(`HTTP ${xhr.status}`));
      } catch (err) {
        reject(err);
      }
    };
    xhr.onerror = () => reject(new Error("Lỗi mạng khi tải file"));
    xhr.send(file);
  });
  return `https://drive.google.com/file/d/${fileId}/view`;
}
