import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { checkMp4 } from "../src/lib/mp4.ts";
import * as uploadLib from "../src/lib/upload.ts";

const FIXTURES = path.resolve(process.cwd(), "backend/test/fixtures/candidate-media");
const validMp4Bytes = readFileSync(path.join(FIXTURES, "valid-5s.mp4"));

function box(type: string, payload: Uint8Array): Uint8Array {
  const out = new Uint8Array(8 + payload.byteLength);
  new DataView(out.buffer).setUint32(0, out.byteLength);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i) & 0xff;
  out.set(payload, 8);
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.byteLength, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.byteLength;
  }
  return out;
}

function splitTopLevelBoxes(buf: Uint8Array): Array<{ type: string; raw: Uint8Array }> {
  const out: Array<{ type: string; raw: Uint8Array }> = [];
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let at = 0;
  while (at + 8 <= buf.byteLength) {
    let size = dv.getUint32(at);
    const type = String.fromCharCode(buf[at + 4], buf[at + 5], buf[at + 6], buf[at + 7]);
    if (size === 1) size = Number(dv.getBigUint64(at + 8));
    else if (size === 0) size = buf.byteLength - at;
    out.push({ type, raw: buf.subarray(at, at + size) });
    at += size;
  }
  return out;
}

describe("checkMp4 systematic regression suite", () => {
  it("accepts standard valid MP4 fixture regardless of File.type (application/octet-stream, video/x-m4v, empty)", async () => {
    for (const mime of ["video/mp4", "", "application/octet-stream", "video/x-m4v", "video/mpeg4"]) {
      const f = new File([validMp4Bytes], "intro.mp4", { type: mime });
      const res = await checkMp4(f);
      assert.equal(res.ok, true, `Failed for MIME=${mime}`);
      if (res.ok) {
        assert.ok(res.duration !== null && res.duration > 4 && res.duration < 6);
      }
    }
  });

  it("accepts valid MP4 with trailing 4 zero bytes (CapCut / QuickTime / Android terminator)", async () => {
    const padded = concat(validMp4Bytes, new Uint8Array([0, 0, 0, 0]));
    const res = await checkMp4(new Blob([padded]));
    assert.equal(res.ok, true);
  });

  it("accepts valid MP4 with trailing CapCut/editor metadata signature bytes after moov+mdat", async () => {
    const sig = new TextEncoder().encode("LVMetadata{\"editor\":\"CapCut\"}");
    const withTrailing = concat(validMp4Bytes, sig);
    const res = await checkMp4(new Blob([withTrailing]));
    assert.equal(res.ok, true);
  });

  it("accepts hybrid MP4 whose major_brand is 'qt  ' when compatible_brands includes 'mp42' or 'isom'", async () => {
    const firstSize = new DataView(validMp4Bytes.buffer, validMp4Bytes.byteOffset, 4).getUint32(0);
    const ftypPayload = new TextEncoder().encode("qt  \0\0\x02\0qt  isommp42");
    const hybrid = concat(box("ftyp", ftypPayload), validMp4Bytes.subarray(firstSize));
    const res = await checkMp4(new Blob([hybrid]));
    assert.equal(res.ok, true);
  });

  it("rejects pure QuickTime MOV (major_brand 'qt  ' with no MP4 compatible_brands)", async () => {
    const firstSize = new DataView(validMp4Bytes.buffer, validMp4Bytes.byteOffset, 4).getUint32(0);
    const movPayload = new TextEncoder().encode("qt  \0\0\x02\0qt  ");
    const pureMov = concat(box("ftyp", movPayload), validMp4Bytes.subarray(firstSize));
    const res = await checkMp4(new Blob([pureMov]));
    assert.deepEqual(res, { ok: false, reason: "NOT_MP4" });
  });

  it("accepts MP4 with leading 'free' or 'pdin' box before 'ftyp'", async () => {
    const leadingFree = concat(box("free", new Uint8Array(8)), validMp4Bytes);
    const res = await checkMp4(new Blob([leadingFree]));
    assert.equal(res.ok, true);
  });

  it("treats 64-bit mvhd all-ones (0xFFFFFFFFFFFFFFFF) unknown duration as null instead of 1.84e19s", async () => {
    const ftyp = box("ftyp", new TextEncoder().encode("isom\0\0\x02\0isommp42"));
    const mvhdBody = new Uint8Array(32);
    const mv = new DataView(mvhdBody.buffer);
    mv.setUint8(0, 1);
    mv.setUint32(20, 1000);
    mv.setBigUint64(24, 0xffffffffffffffffn);
    const mvhd = box("mvhd", mvhdBody);

    const hdlrBody = new Uint8Array(24);
    hdlrBody.set(new TextEncoder().encode("vide"), 8);
    const zeroPad = new Uint8Array([0, 0, 0, 0]);
    const trak = box("trak", box("mdia", box("hdlr", hdlrBody)));
    const moov = box("moov", concat(mvhd, zeroPad, trak));
    const mdat = box("mdat", new Uint8Array(16));

    const res = await checkMp4(new Blob([concat(ftyp, moov, mdat)]));
    assert.deepEqual(res, { ok: true, duration: null });
  });

  it("still rejects truncated MP4 download where mdat is cut off before declared size", async () => {
    const truncated = validMp4Bytes.subarray(0, validMp4Bytes.byteLength - 500);
    const res = await checkMp4(new Blob([truncated]));
    assert.deepEqual(res, { ok: false, reason: "CORRUPT" });
  });

  it("still rejects non-MP4 garbage bytes", async () => {
    const corrupt = readFileSync(path.join(FIXTURES, "corrupt.mp4"));
    const res = await checkMp4(new Blob([corrupt]));
    assert.equal(res.ok, false);
  });

  it("accepts non-faststart camera MP4 with top-level non-ASCII ©xyz (0xA9) metadata box before moov", async () => {
    const parts = splitTopLevelBoxes(validMp4Bytes);
    const ftyp = parts.find((b) => b.type === "ftyp")!.raw;
    const mdat = parts.find((b) => b.type === "mdat")!.raw;
    const moov = parts.find((b) => b.type === "moov")!.raw;
    const gpsBox = box("\xa9xyz", new TextEncoder().encode("+21.0285+105.8542/"));
    const cameraMp4 = concat(ftyp, mdat, gpsBox, moov);
    const res = await checkMp4(new Blob([cameraMp4]));
    assert.equal(res.ok, true);
    if (res.ok) assert.ok(res.duration !== null && res.duration > 4 && res.duration < 6);
  });

  it("accepts non-faststart MP4 with 4-byte 0x00000000 zero padding between mdat and moov", async () => {
    const parts = splitTopLevelBoxes(validMp4Bytes);
    const ftyp = parts.find((b) => b.type === "ftyp")!.raw;
    const mdat = parts.find((b) => b.type === "mdat")!.raw;
    const moov = parts.find((b) => b.type === "moov")!.raw;
    const padded = concat(ftyp, mdat, new Uint8Array([0, 0, 0, 0]), moov);
    const res = await checkMp4(new Blob([padded]));
    assert.equal(res.ok, true);
    if (res.ok) assert.ok(res.duration !== null && res.duration > 4 && res.duration < 6);
  });

  it("accepts MP4 with large (> 64 KB) leading free box or uuid/styp box before ftyp", async () => {
    const largeFree = box("free", new Uint8Array(128 * 1024));
    const uuidBox = box("uuid", new Uint8Array(32));
    const editedMp4 = concat(largeFree, uuidBox, validMp4Bytes);
    const res = await checkMp4(new Blob([editedMp4]));
    assert.equal(res.ok, true);
  });

  it("accepts Android hybrid MP4 with major_brand '3gp5' + 'isom'/'mp42' compatible_brands, while rejecting pure 3GP", async () => {
    const firstSize = new DataView(validMp4Bytes.buffer, validMp4Bytes.byteOffset, 4).getUint32(0);
    const rest = validMp4Bytes.subarray(firstSize);
    const androidHybrid = concat(box("ftyp", new TextEncoder().encode("3gp5\0\0\x02\0isom3gp5mp42")), rest);
    const resHybrid = await checkMp4(new Blob([androidHybrid]));
    assert.equal(resHybrid.ok, true);

    const pure3gp = concat(box("ftyp", new TextEncoder().encode("3gp5\x00\x00\x02\x003gp53gp4")), rest);
    const resPure = await checkMp4(new Blob([pure3gp]));
    assert.deepEqual(resPure, { ok: false, reason: "NOT_MP4" });
  });

  it("falls back to video track mdhd duration when mvhd has INT32_MAX (0x7fffffff) or zero timescale/duration", async () => {
    const ftyp = box("ftyp", new TextEncoder().encode("isom\0\0\x02\0isommp42"));
    const mvhdBody = new Uint8Array(20);
    const mv = new DataView(mvhdBody.buffer);
    mv.setUint8(0, 0);
    mv.setUint32(12, 1000);
    mv.setUint32(16, 0x7fffffff);
    const mvhd = box("mvhd", mvhdBody);

    const mdhdBody = new Uint8Array(20);
    const mdv = new DataView(mdhdBody.buffer);
    mdv.setUint8(0, 0);
    mdv.setUint32(12, 30000);
    mdv.setUint32(16, 450000);
    const mdhd = box("mdhd", mdhdBody);

    const hdlrBody = new Uint8Array(24);
    hdlrBody.set(new TextEncoder().encode("vide"), 8);
    const trak = box("trak", box("mdia", concat(mdhd, box("hdlr", hdlrBody))));
    const moov = box("moov", concat(mvhd, trak));
    const mdat = box("mdat", new Uint8Array(16));

    const res = await checkMp4(new Blob([concat(ftyp, moov, mdat)]));
    assert.deepEqual(res, { ok: true, duration: 15 });
  });

  it("defers duration/stream validation (ok: true, duration: null) on compressed cmov atom instead of false CORRUPT", async () => {
    const ftyp = box("ftyp", new TextEncoder().encode("isom\0\0\x02\0isommp42"));
    const cmov = box("cmov", box("dcom", new TextEncoder().encode("zlib")));
    const moov = box("moov", cmov);
    const mdat = box("mdat", new Uint8Array(32));
    const res = await checkMp4(new Blob([concat(ftyp, moov, mdat)]));
    assert.deepEqual(res, { ok: true, duration: null });
  });

  it("aligns client MAX_VIDEO_MB / MAX_VIDEO_BYTES with backend 500_000_000 bytes limit", () => {
    assert.equal(uploadLib.MAX_VIDEO_MB, 500);
    assert.equal((uploadLib as Record<string, unknown>).MAX_VIDEO_BYTES, 500_000_000);
  });

  it("extracts dropped File from either DataTransfer.files or DataTransfer.items fallback", () => {
    const extract = (uploadLib as Record<string, unknown>).extractDroppedFile as ((dt: unknown) => File | undefined) | undefined;
    assert.equal(typeof extract, "function");
    const sample = new File([validMp4Bytes], "clip.mp4", { type: "video/mp4" });
    assert.equal(extract!({ files: [sample], items: [] }), sample);
    assert.equal(
      extract!({
        files: [],
        items: [{ kind: "string", getAsFile: () => null }, { kind: "file", getAsFile: () => sample }],
      }),
      sample,
    );
  });
});
