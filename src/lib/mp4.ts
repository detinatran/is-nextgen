// Đọc thông tin MP4 trực tiếp từ cấu trúc file (box ftyp/moov/mvhd), không cần trình duyệt giải mã video.
// Nhờ vậy đọc được cả video HEVC của iPhone hay trình duyệt thiếu codec H.264, và phát hiện file hỏng/tải dở.
// Quy tắc khớp với backend (media-validation.service.ts): ftyp ở đầu file, không phải QuickTime/3GP, có track video.

export type Mp4Check =
  | { ok: true; duration: number | null }
  | { ok: false; reason: "NOT_MP4" | "CORRUPT" | "NO_VIDEO" };

const MAX_MOOV_BYTES = 64 * 1024 * 1024;

const fourcc = (v: DataView, at: number) => String.fromCharCode(v.getUint8(at), v.getUint8(at + 1), v.getUint8(at + 2), v.getUint8(at + 3));

async function bytes(file: Blob, start: number, end: number) {
  return new DataView(await file.slice(start, end).arrayBuffer());
}

/** Header của box tại `offset`: kích thước (0 = tới hết file), loại và độ dài phần header. */
async function boxAt(file: Blob, offset: number) {
  if (offset + 8 > file.size) return null;
  const v = await bytes(file, offset, Math.min(offset + 16, file.size));
  let size = v.getUint32(0);
  const type = fourcc(v, 4);
  let header = 8;
  if (size === 1) {
    if (v.byteLength < 16) return null;
    size = Number(v.getBigUint64(8));
    header = 16;
  } else if (size === 0) {
    size = file.size - offset;
  }
  return { size, type, header };
}

/** Duyệt các box con trong một vùng nhớ (moov, trak, mdia, mvex...). */
function* children(v: DataView, start: number, end: number): Generator<{ type: string; body: number; end: number }> {
  let at = start;
  while (at + 8 <= end) {
    let size = v.getUint32(at);
    let header = 8;
    if (size === 1) {
      if (at + 16 > end) return;
      size = Number(v.getBigUint64(at + 8));
      header = 16;
    } else if (size === 0) size = end - at;
    if (size < header || at + size > end) return;
    yield { type: fourcc(v, at + 4), body: at + header, end: at + size };
    at += size;
  }
}

export async function checkMp4(file: Blob): Promise<Mp4Check> {
  const first = await boxAt(file, 0);
  if (!first || first.type !== "ftyp") return { ok: false, reason: "NOT_MP4" };
  const brandView = await bytes(file, 8, 12);
  if (brandView.byteLength < 4) return { ok: false, reason: "CORRUPT" };
  const brand = fourcc(brandView, 0);
  if (brand === "qt  " || /^3g[p2]/.test(brand)) return { ok: false, reason: "NOT_MP4" };

  // Box cấp cao nhất: tìm moov, đồng thời phát hiện file bị cắt (box vượt quá cuối file)
  let offset = 0;
  let moov: { offset: number; size: number; header: number } | null = null;
  for (let i = 0; i < 10_000 && offset < file.size; i++) {
    const box = await boxAt(file, offset);
    if (!box || box.size < box.header || offset + box.size > file.size) return { ok: false, reason: "CORRUPT" };
    if (box.type === "moov") moov = { offset, ...box };
    offset += box.size;
  }
  if (!moov || moov.size > MAX_MOOV_BYTES) return { ok: false, reason: "CORRUPT" };

  const v = await bytes(file, moov.offset, moov.offset + moov.size);
  let timescale = 0;
  let duration = 0;
  let fragmentDuration = 0;
  let hasVideo = false;
  for (const box of children(v, moov.header, v.byteLength)) {
    if (box.type === "mvhd") {
      const version = v.getUint8(box.body);
      if (version === 1) {
        timescale = v.getUint32(box.body + 20);
        duration = Number(v.getBigUint64(box.body + 24));
      } else {
        timescale = v.getUint32(box.body + 12);
        duration = v.getUint32(box.body + 16);
      }
    } else if (box.type === "mvex") {
      for (const m of children(v, box.body, box.end)) {
        if (m.type === "mehd") fragmentDuration = v.getUint8(m.body) === 1 ? Number(v.getBigUint64(m.body + 4)) : v.getUint32(m.body + 4);
      }
    } else if (box.type === "trak") {
      for (const mdia of children(v, box.body, box.end)) {
        if (mdia.type !== "mdia") continue;
        for (const h of children(v, mdia.body, mdia.end)) {
          if (h.type === "hdlr" && fourcc(v, h.body + 8) === "vide") hasVideo = true;
        }
      }
    }
  }
  if (!timescale) return { ok: false, reason: "CORRUPT" };
  if (!hasVideo) return { ok: false, reason: "NO_VIDEO" };
  const units = duration && duration !== 0xffffffff ? duration : fragmentDuration;
  return { ok: true, duration: units ? units / timescale : null };
}
