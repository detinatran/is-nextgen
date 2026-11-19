import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough, Readable } from "node:stream";
import {
  MAX_VIDEO_OPEN_RANGE_BYTES,
  pipeReadableToResponse,
  resolveByteRange,
} from "../backend/src/media/drive/stream-proxy.ts";

test("resolveByteRange handles full, capped open-ended, explicit, suffix, and invalid ranges", () => {
  const total = 100_000_000;

  // Absent Range header
  assert.deepEqual(resolveByteRange(undefined, total, MAX_VIDEO_OPEN_RANGE_BYTES), {
    ok: true,
    isRange: false,
    start: 0,
    end: 99_999_999,
  });

  // Open-ended Range: bytes=0- capped at MAX_VIDEO_OPEN_RANGE_BYTES (4 MiB)
  assert.deepEqual(
    resolveByteRange("bytes=0-", total, MAX_VIDEO_OPEN_RANGE_BYTES),
    {
      ok: true,
      isRange: true,
      start: 0,
      end: 4 * 1024 * 1024 - 1,
    },
  );

  // Open-ended Range: bytes=99000000- near EOF
  assert.deepEqual(
    resolveByteRange("bytes=99000000-", total, MAX_VIDEO_OPEN_RANGE_BYTES),
    {
      ok: true,
      isRange: true,
      start: 99_000_000,
      end: 99_999_999,
    },
  );

  // Explicit range
  assert.deepEqual(
    resolveByteRange("bytes=100-500", total, MAX_VIDEO_OPEN_RANGE_BYTES),
    {
      ok: true,
      isRange: true,
      start: 100,
      end: 500,
    },
  );

  // Explicit range clamped to total - 1
  assert.deepEqual(
    resolveByteRange("bytes=100-999999999", total, MAX_VIDEO_OPEN_RANGE_BYTES),
    {
      ok: true,
      isRange: true,
      start: 100,
      end: 99_999_999,
    },
  );

  // Suffix range on 10,000-byte file
  assert.deepEqual(resolveByteRange("bytes=-1024", 10_000), {
    ok: true,
    isRange: true,
    start: 8976,
    end: 9999,
  });

  // Out-of-bounds / inverted / zero-size / empty range
  assert.deepEqual(resolveByteRange("bytes=200-100", 10_000), { ok: false });
  assert.deepEqual(resolveByteRange("bytes=10000-", 10_000), { ok: false });
  assert.deepEqual(resolveByteRange("bytes=0-10", 0), { ok: false });
  assert.deepEqual(resolveByteRange("bytes=-", 10_000), { ok: false });
});

test("pipeReadableToResponse aborts upstream and cancels web stream on premature client disconnect", async () => {
  let cancelCalled = false;
  let pulled = false;
  const webStream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (!pulled) {
        pulled = true;
        controller.enqueue(new Uint8Array([1, 2, 3, 4]));
        return;
      }
      return new Promise(() => {});
    },
    cancel() {
      cancelCalled = true;
    },
  });
  const source = Readable.fromWeb(
    webStream as unknown as import("node:stream/web").ReadableStream,
  );
  const ac = new AbortController();
  const res = new PassThrough();

  let firstChunkSeen = false;
  res.on("data", () => {
    if (!firstChunkSeen) {
      firstChunkSeen = true;
      // Simulate premature client disconnect before response ends
      queueMicrotask(() => {
        res.emit("close");
      });
    }
  });

  await pipeReadableToResponse(source, res, () => ac.abort());
  await new Promise((r) => setTimeout(r, 10));

  assert.equal(ac.signal.aborted, true);
  assert.equal(cancelCalled, true);
  assert.equal(source.destroyed, true);
});

test("pipeReadableToResponse writes finite stream cleanly without aborting upstream", async () => {
  const webStream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(Buffer.from("hello "));
      controller.enqueue(Buffer.from("world"));
      controller.close();
    },
  });
  const source = Readable.fromWeb(
    webStream as unknown as import("node:stream/web").ReadableStream,
  );
  const ac = new AbortController();
  const res = new PassThrough();
  const chunks: Buffer[] = [];
  res.on("data", (chunk: Buffer) => chunks.push(chunk));

  await pipeReadableToResponse(source, res, () => ac.abort());

  assert.equal(Buffer.concat(chunks).toString("utf8"), "hello world");
  assert.equal(ac.signal.aborted, false);
});

test("pipeReadableToResponse aborts and destroys response when upstream emits error", async () => {
  let sent = false;
  const source = new Readable({
    read() {
      if (!sent) {
        sent = true;
        this.push(Buffer.from("partial"));
        queueMicrotask(() => {
          this.destroy(new Error("upstream socket reset"));
        });
      }
    },
  });
  const ac = new AbortController();
  const res = new PassThrough();
  res.resume();

  await pipeReadableToResponse(source, res, () => ac.abort());

  assert.equal(ac.signal.aborted, true);
  assert.equal(res.destroyed, true);
});

test("pipeReadableToResponse immediately aborts when response is already destroyed on entry", async () => {
  let cancelCalled = false;
  const webStream = new ReadableStream<Uint8Array>({
    pull() {
      return new Promise(() => {});
    },
    cancel() {
      cancelCalled = true;
    },
  });
  const source = Readable.fromWeb(
    webStream as unknown as import("node:stream/web").ReadableStream,
  );
  const ac = new AbortController();
  const res = new PassThrough();
  res.destroy();

  await pipeReadableToResponse(source, res, () => ac.abort());
  await new Promise((r) => setTimeout(r, 10));

  assert.equal(ac.signal.aborted, true);
  assert.equal(cancelCalled, true);
  assert.equal(source.destroyed, true);
});
