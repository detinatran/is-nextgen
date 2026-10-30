import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { checkMp4 } from "../src/lib/mp4.ts";

const FIXTURES = path.resolve(process.cwd(), "backend/test/fixtures/candidate-media");
const validMp4Bytes = readFileSync(path.join(FIXTURES, "valid-5s.mp4"));

function box(type: string, payload: Uint8Array): Uint8Array {
  const out = new Uint8Array(8 + payload.byteLength);
  new DataView(out.buffer).setUint32(0, out.byteLength);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
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
    // Include 4-byte 0x00000000 padding inside moov before trak to verify children() handles zero padding
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
});
