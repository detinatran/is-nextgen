// Đọc thông tin MP4 trực tiếp từ cấu trúc file (box ftyp/moov/mvhd/mdhd), không cần trình duyệt giải mã video.
// Nhờ vậy đọc được cả video HEVC của iPhone hay trình duyệt thiếu codec H.264, và phát hiện file hỏng/tải dở.
// Quy tắc khớp với backend (media-validation.service.ts): ISO MP4 (ftyp hợp lệ), không phải QuickTime MOV thuần/3GP thuần, có track video.

export type Mp4Check =
  | { ok: true; duration: number | null }
  | { ok: false; reason: "NOT_MP4" | "CORRUPT" | "NO_VIDEO" };

const MAX_MOOV_BYTES = 64 * 1024 * 1024;
const MAX_LEADING_BOX_BYTES = 32 * 1024 * 1024;
const U32_UNKNOWN = 0xffffffff;
const I32_UNKNOWN = 0x7fffffff;
const U64_UNKNOWN = 0xffffffffffffffffn;
const I64_UNKNOWN = 0x7fffffffffffffffn;

const LEADING_PADDING_BOXES = new Set(["free", "skip", "wide", "pdin", "uuid", "styp"]);
const KNOWN_EOF_BOXES = new Set(["mdat", "imda", "moov", "free", "skip", "wide", "udta", "meta"]);
const MP4_COMPAT_BRANDS = new Set([
  "isom",
  "iso2",
  "iso3",
  "iso4",
  "iso5",
  "iso6",
  "iso7",
  "iso8",
  "iso9",
  "mp41",
  "mp42",
  "mp4v",
  "avc1",
  "hvc1",
  "hev1",
  "av01",
  "M4V ",
  "dash",
  "f4v ",
  "mmp4",
  "MSNV",
]);

const fourcc = (v: DataView, at: number) => String.fromCharCode(v.getUint8(at), v.getUint8(at + 1), v.getUint8(at + 2), v.getUint8(at + 3));

/** Chấp nhận cả box chuẩn ASCII (0x20..0x7E) lẫn metadata QuickTime/Android kiểu ©xyz, ©too (byte Latin-1 >= 0xA0). */
const isValidBoxType = (s: string) => {
  for (let i = 0; i < 4; i++) {
    const c = s.charCodeAt(i);
    const printableAscii = c >= 0x20 && c <= 0x7e;
    const printableLatin1 = c >= 0xa0 && c <= 0xff;
    if (!printableAscii && !printableLatin1) return false;
  }
  return true;
};

async function bytes(file: Blob, start: number, end: number) {
  return new DataView(await file.slice(start, end).arrayBuffer());
}

/** Header của box tại `offset`: phân biệt 4 byte đệm 0x00000000 với box kéo dài tới cuối file (size === 0). */
async function boxAt(file: Blob, offset: number): Promise<{ size: number; type: string; header: number; padding?: boolean } | null> {
  if (offset + 4 > file.size) return null;
  const v = await bytes(file, offset, Math.min(offset + 16, file.size));
  let size = v.getUint32(0);
  if (size === 0) {
    if (v.byteLength < 8) return { size: file.size - offset, type: "", header: 4, padding: true };
    const nextType = fourcc(v, 4);
    if (!KNOWN_EOF_BOXES.has(nextType)) {
      return { size: 4, type: "\0\0\0\0", header: 4, padding: true };
    }
    return { size: file.size - offset, type: nextType, header: 8 };
  }
  if (v.byteLength < 8) return null;
  const type = fourcc(v, 4);
  let header = 8;
  if (size === 1) {
    if (v.byteLength < 16) return null;
    size = Number(v.getBigUint64(8));
    header = 16;
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
    if (size === 0 && !KNOWN_EOF_BOXES.has(type)) {
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

function readDurationBox(v: DataView, body: number, end: number): { timescale: number; duration: number } | null {
  if (body + 20 > end) return null;
  const version = v.getUint8(body);
  if (version === 1) {
    if (body + 32 > end) return null;
    const timescale = v.getUint32(body + 20);
    const raw = v.getBigUint64(body + 24);
    const duration = raw === U64_UNKNOWN || raw === I64_UNKNOWN ? 0 : Number(raw);
    return { timescale, duration };
  }
  const timescale = v.getUint32(body + 12);
  const raw = v.getUint32(body + 16);
  const duration = raw === U32_UNKNOWN || raw === I32_UNKNOWN ? 0 : raw;
  return { timescale, duration };
}

export async function checkMp4(file: Blob): Promise<Mp4Check> {
  // Tìm ftyp ở đầu file (cho phép các box đệm free/skip/wide/pdin/uuid/styp đứng trước theo ISO 14496-12)
  let ftypOffset = 0;
  let ftyp: { size: number; type: string; header: number } | null = null;
  for (let i = 0; i < 16 && ftypOffset < file.size; i++) {
    const b = await boxAt(file, ftypOffset);
    if (!b || b.size < b.header || ftypOffset + b.size > file.size) {
      return { ok: false, reason: i === 0 ? "NOT_MP4" : "CORRUPT" };
    }
    if (b.padding) {
      ftypOffset += b.size;
      continue;
    }
    if (b.type === "ftyp") {
      ftyp = b;
      break;
    }
    if (!LEADING_PADDING_BOXES.has(b.type) || b.size > MAX_LEADING_BOX_BYTES) {
      return { ok: false, reason: "NOT_MP4" };
    }
    ftypOffset += b.size;
  }
  if (!ftyp) return { ok: false, reason: "NOT_MP4" };
  if (ftyp.size < ftyp.header + 8 || ftyp.size > 4096) return { ok: false, reason: "CORRUPT" };

  const ftypView = await bytes(file, ftypOffset + ftyp.header, ftypOffset + ftyp.size);
  if (ftypView.byteLength < 8) return { ok: false, reason: "CORRUPT" };
  const brand = fourcc(ftypView, 0);
  if (brand === "qt  " || /^3g[p2]/.test(brand)) {
    let mp4Compatible = false;
    for (let at = 8; at + 4 <= ftypView.byteLength; at += 4) {
      if (MP4_COMPAT_BRANDS.has(fourcc(ftypView, at))) {
        mp4Compatible = true;
        break;
      }
    }
    if (!mp4Compatible) return { ok: false, reason: "NOT_MP4" };
  }

  // Duyệt box cấp cao nhất để tìm moov và mdat/imda, đồng thời phát hiện file tải dở (box vượt quá cuối file).
  // Khi cả moov và mdat đều đã nguyên vẹn, bỏ qua các byte đệm/chữ ký cuối file (CapCut, QuickTime, Android...).
  let offset = ftypOffset + ftyp.size;
  let moov: { offset: number; size: number; header: number } | null = null;
  let hasMdat = false;
  for (let i = 0; i < 100_000 && offset < file.size; i++) {
    const box = await boxAt(file, offset);
    const completeSoFar = moov !== null && hasMdat;
    if (!box || box.size < box.header || offset + box.size > file.size) {
      if (completeSoFar) break;
      return { ok: false, reason: "CORRUPT" };
    }
    if (box.padding) {
      offset += box.size;
      continue;
    }
    if (!isValidBoxType(box.type)) {
      if (completeSoFar) break;
      return { ok: false, reason: "CORRUPT" };
    }
    if (box.type === "moov") moov = { offset, ...box };
    else if (box.type === "mdat" || box.type === "imda") hasMdat = true;
    offset += box.size;
    if (moov !== null && hasMdat && i >= 64) break;
  }
  if (!moov) return { ok: false, reason: "CORRUPT" };
  if (moov.size > MAX_MOOV_BYTES) return { ok: true, duration: null };

  const v = await bytes(file, moov.offset, moov.offset + moov.size);
  let timescale = 0;
  let duration = 0;
  let fragmentDuration = 0;
  let videoTrackDuration = 0;
  let hasVideo = false;
  let hasCompressedMoov = false;

  for (const box of children(v, moov.header, v.byteLength)) {
    if (box.type === "cmov") {
      hasCompressedMoov = true;
    } else if (box.type === "mvhd") {
      const parsed = readDurationBox(v, box.body, box.end);
      if (parsed) {
        timescale = parsed.timescale;
        duration = parsed.duration;
      }
    } else if (box.type === "mvex") {
      for (const m of children(v, box.body, box.end)) {
        if (m.type !== "mehd" || m.body + 8 > m.end) continue;
        if (v.getUint8(m.body) === 1) {
          if (m.body + 12 > m.end) continue;
          const raw = v.getBigUint64(m.body + 4);
          fragmentDuration = raw === U64_UNKNOWN || raw === I64_UNKNOWN ? 0 : Number(raw);
        } else {
          const raw = v.getUint32(m.body + 4);
          fragmentDuration = raw === U32_UNKNOWN || raw === I32_UNKNOWN ? 0 : raw;
        }
      }
    } else if (box.type === "trak") {
      for (const mdia of children(v, box.body, box.end)) {
        if (mdia.type !== "mdia") continue;
        let isVideoTrack = false;
        let mdhdInfo: { timescale: number; duration: number } | null = null;
        for (const h of children(v, mdia.body, mdia.end)) {
          if (h.type === "hdlr" && h.body + 12 <= h.end && fourcc(v, h.body + 8) === "vide") {
            isVideoTrack = true;
            hasVideo = true;
          } else if (h.type === "mdhd") {
            mdhdInfo = readDurationBox(v, h.body, h.end);
          }
        }
        if (isVideoTrack && mdhdInfo && mdhdInfo.timescale > 0 && mdhdInfo.duration > 0) {
          videoTrackDuration = Math.max(videoTrackDuration, mdhdInfo.duration / mdhdInfo.timescale);
        }
      }
    }
  }

  if (hasCompressedMoov && !hasVideo) return { ok: true, duration: null };
  if (!hasVideo) return { ok: false, reason: "NO_VIDEO" };
  const movieUnits = duration || fragmentDuration;
  const resolvedDuration =
    timescale > 0 && movieUnits > 0 ? movieUnits / timescale : videoTrackDuration > 0 ? videoTrackDuration : null;
  return { ok: true, duration: resolvedDuration };
}
