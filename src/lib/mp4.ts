// Đọc thông tin MP4 trực tiếp từ cấu trúc file (box ftyp/moov/mvhd), không cần trình duyệt giải mã video.
// Nhờ vậy đọc được cả video HEVC của iPhone hay trình duyệt thiếu codec H.264, và phát hiện file hỏng/tải dở.
// Quy tắc khớp với backend (media-validation.service.ts): ISO MP4 (ftyp hợp lệ), không phải QuickTime MOV thuần/3GP, có track video.

export type Mp4Check =
  | { ok: true; duration: number | null }
  | { ok: false; reason: "NOT_MP4" | "CORRUPT" | "NO_VIDEO" };

const MAX_MOOV_BYTES = 64 * 1024 * 1024;
const U32_UNKNOWN = 0xffffffff;
const U64_UNKNOWN = 0xffffffffffffffffn;

const LEADING_PADDING_BOXES = new Set(["free", "skip", "wide", "pdin"]);
const MP4_COMPAT_BRANDS = new Set([
  "isom",
  "iso2",
  "iso3",
  "iso4",
  "iso5",
  "iso6",
  "mp41",
  "mp42",
  "avc1",
  "M4V ",
  "dash",
  "f4v ",
  "mmp4",
  "MSNV",
]);

const fourcc = (v: DataView, at: number) => String.fromCharCode(v.getUint8(at), v.getUint8(at + 1), v.getUint8(at + 2), v.getUint8(at + 3));

const isValidFourcc = (s: string) => {
  for (let i = 0; i < 4; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x20 || c > 0x7e) return false;
  }
  return true;
};

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
    const type = fourcc(v, at + 4);
    // Một số bộ đóng gói chèn 4 byte 0x00000000 làm mốc kết thúc/đệm bên trong container
    if (size === 0 && !isValidFourcc(type)) {
      at += 4;
      continue;
    }
    let header = 8;
    if (size === 1) {
      if (at + 16 > end) return;
      size = Number(v.getBigUint64(at + 8));
      header = 16;
    } else if (size === 0) size = end - at;
    if (size < header || at + size > end) return;
    yield { type, body: at + header, end: at + size };
    at += size;
  }
}

export async function checkMp4(file: Blob): Promise<Mp4Check> {
  // Tìm ftyp ở đầu file (cho phép tối đa vài box đệm nhỏ free/skip/wide/pdin đứng trước theo ISO 14496-12)
  let ftypOffset = 0;
  let ftyp: { size: number; type: string; header: number } | null = null;
  for (let i = 0; i < 5 && ftypOffset < file.size; i++) {
    const b = await boxAt(file, ftypOffset);
    if (!b || b.size < b.header || ftypOffset + b.size > file.size) {
      return { ok: false, reason: i === 0 ? "NOT_MP4" : "CORRUPT" };
    }
    if (b.type === "ftyp") {
      ftyp = b;
      break;
    }
    if (!LEADING_PADDING_BOXES.has(b.type) || b.size > 65_536) {
      return { ok: false, reason: "NOT_MP4" };
    }
    ftypOffset += b.size;
  }
  if (!ftyp) return { ok: false, reason: "NOT_MP4" };
  if (ftyp.size < ftyp.header + 8 || ftyp.size > 4096) return { ok: false, reason: "CORRUPT" };

  const ftypView = await bytes(file, ftypOffset + ftyp.header, ftypOffset + ftyp.size);
  if (ftypView.byteLength < 8) return { ok: false, reason: "CORRUPT" };
  const brand = fourcc(ftypView, 0);
  if (/^3g[p2]/.test(brand)) return { ok: false, reason: "NOT_MP4" };
  if (brand === "qt  ") {
    let mp4Compatible = false;
    for (let at = 8; at + 4 <= ftypView.byteLength; at += 4) {
      if (MP4_COMPAT_BRANDS.has(fourcc(ftypView, at))) {
        mp4Compatible = true;
        break;
      }
    }
    if (!mp4Compatible) return { ok: false, reason: "NOT_MP4" };
  }

  // Duyệt box cấp cao nhất để tìm moov và mdat, đồng thời phát hiện file tải dở (box vượt quá cuối file).
  // Khi cả moov và mdat đều đã nguyên vẹn, bỏ qua các byte đệm/chữ ký cuối file (CapCut, QuickTime, Android...).
  let offset = ftypOffset + ftyp.size;
  let moov: { offset: number; size: number; header: number } | null = null;
  let hasMdat = false;
  for (let i = 0; i < 100_000 && offset < file.size; i++) {
    const box = await boxAt(file, offset);
    const completeSoFar = moov !== null && hasMdat;
    if (!box || box.size < box.header || offset + box.size > file.size || !isValidFourcc(box.type)) {
      if (completeSoFar) break;
      return { ok: false, reason: "CORRUPT" };
    }
    if (box.type === "moov") moov = { offset, ...box };
    else if (box.type === "mdat") hasMdat = true;
    offset += box.size;
    if (moov !== null && hasMdat && i >= 64) break;
  }
  if (!moov || moov.size > MAX_MOOV_BYTES) return { ok: false, reason: "CORRUPT" };

  const v = await bytes(file, moov.offset, moov.offset + moov.size);
  let timescale = 0;
  let duration = 0;
  let fragmentDuration = 0;
  let hasVideo = false;
  for (const box of children(v, moov.header, v.byteLength)) {
    if (box.type === "mvhd") {
      if (box.body + 20 > box.end) continue;
      const version = v.getUint8(box.body);
      if (version === 1) {
        if (box.body + 32 > box.end) continue;
        timescale = v.getUint32(box.body + 20);
        const raw = v.getBigUint64(box.body + 24);
        duration = raw === U64_UNKNOWN ? 0 : Number(raw);
      } else {
        timescale = v.getUint32(box.body + 12);
        const raw = v.getUint32(box.body + 16);
        duration = raw === U32_UNKNOWN ? 0 : raw;
      }
    } else if (box.type === "mvex") {
      for (const m of children(v, box.body, box.end)) {
        if (m.type !== "mehd" || m.body + 8 > m.end) continue;
        if (v.getUint8(m.body) === 1) {
          if (m.body + 12 > m.end) continue;
          const raw = v.getBigUint64(m.body + 4);
          fragmentDuration = raw === U64_UNKNOWN ? 0 : Number(raw);
        } else {
          const raw = v.getUint32(m.body + 4);
          fragmentDuration = raw === U32_UNKNOWN ? 0 : raw;
        }
      }
    } else if (box.type === "trak") {
      for (const mdia of children(v, box.body, box.end)) {
        if (mdia.type !== "mdia") continue;
        for (const h of children(v, mdia.body, mdia.end)) {
          if (h.type === "hdlr" && h.body + 12 <= h.end && fourcc(v, h.body + 8) === "vide") hasVideo = true;
        }
      }
    }
  }
  if (!timescale) return { ok: false, reason: "CORRUPT" };
  if (!hasVideo) return { ok: false, reason: "NO_VIDEO" };
  const units = duration || fragmentDuration;
  return { ok: true, duration: units ? units / timescale : null };
}
