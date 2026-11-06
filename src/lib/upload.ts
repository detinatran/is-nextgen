// Tải video và ảnh thẳng từ trình duyệt lên Google Drive qua phiên "resumable upload".
// Apps Script (docs/google-apps-script.md) tạo phiên và trả về uploadUrl; trình duyệt PUT file vào đó,
// nên dung lượng không bị giới hạn 50MB của Apps Script.

// Khớp giới hạn UPLOAD_MAX_BYTES = 900_000_000 và VIDEO_MAX_DURATION_SECONDS = 150 của backend (backend/src/config/configuration.ts)
export const MAX_VIDEO_MB = 900;
export const MAX_VIDEO_BYTES = 900_000_000;
export const MAX_VIDEO_SECONDS = 150;
export const MAX_PHOTO_MB = 10;

type DroppedItemLike = { kind?: string; getAsFile?: () => File | null };
type DataTransferLike = {
  files?: ArrayLike<File> | null;
  items?: ArrayLike<DroppedItemLike> | null;
};

/** Lấy file đầu tiên từ sự kiện kéo-thả, hỗ trợ cả `dataTransfer.files` lẫn `dataTransfer.items` trên mọi trình duyệt. */
export function extractDroppedFile(dt: DataTransferLike | null | undefined): File | undefined {
  const direct = dt?.files?.[0];
  if (direct) return direct;
  const items = dt?.items;
  if (!items) return undefined;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item?.kind === "file" && typeof item.getAsFile === "function") {
      const f = item.getAsFile();
      if (f) return f;
    }
  }
  return undefined;
}

/**
 * Đọc metadata video qua thẻ `<video>` của trình duyệt: trả về thời lượng và có khung hình video hay không.
 * Nếu trình duyệt thiếu codec (ví dụ HEVC trên một số máy) hoặc quá `timeoutMs` thì trả `{ duration: null, hasVideo: false }`.
 */
export function probeVideo(file: File, timeoutMs = 8000): Promise<{ duration: number | null; hasVideo: boolean }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    let settled = false;
    const timer = window.setTimeout(() => done({ duration: null, hasVideo: false }), timeoutMs);
    function done(value: { duration: number | null; hasVideo: boolean }) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      video.removeAttribute("src");
      URL.revokeObjectURL(url);
      resolve(value);
    }
    video.onloadedmetadata = () =>
      done({
        duration: Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null,
        hasVideo: video.videoWidth > 0 && video.videoHeight > 0,
      });
    video.onerror = () => done({ duration: null, hasVideo: false });
    video.src = url;
  });
}

/**
 * Đọc thời lượng video ở client; trả null nếu trình duyệt không đọc được định dạng
 * hoặc quá `timeoutMs` (một số trình duyệt không bao giờ phát sự kiện) — khi đó server kiểm tra.
 */
export async function readVideoDuration(file: File, timeoutMs = 8000): Promise<number | null> {
  return (await probeVideo(file, timeoutMs)).duration;
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
