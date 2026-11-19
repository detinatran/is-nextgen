import { Readable, type Writable } from 'node:stream';

export const MAX_VIDEO_OPEN_RANGE_BYTES = 4 * 1024 * 1024;

export type ByteRangeResult =
  | { ok: false }
  | { ok: true; isRange: boolean; start: number; end: number };

export function resolveByteRange(
  rangeHeader: string | undefined,
  totalSize: number,
  maxOpenRangeBytes?: number,
): ByteRangeResult {
  if (!Number.isFinite(totalSize) || totalSize <= 0) {
    return { ok: false };
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec((rangeHeader ?? '').trim());
  if (!match) {
    return { ok: true, isRange: false, start: 0, end: totalSize - 1 };
  }

  const startRaw = match[1];
  const endRaw = match[2];
  let start = 0;
  let end = totalSize - 1;

  if (startRaw && endRaw) {
    start = Number(startRaw);
    end = Math.min(Number(endRaw), totalSize - 1);
  } else if (startRaw && !endRaw) {
    start = Number(startRaw);
    end =
      maxOpenRangeBytes && maxOpenRangeBytes > 0
        ? Math.min(start + maxOpenRangeBytes - 1, totalSize - 1)
        : totalSize - 1;
  } else if (!startRaw && endRaw) {
    const suffix = Number(endRaw);
    if (!Number.isFinite(suffix) || suffix <= 0) {
      return { ok: false };
    }
    start = Math.max(0, totalSize - suffix);
    end = totalSize - 1;
  } else {
    return { ok: false };
  }

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    start > end ||
    start >= totalSize
  ) {
    return { ok: false };
  }

  return { ok: true, isRange: true, start, end };
}

export type StreamResponseLike = Writable & {
  writableEnded?: boolean;
  destroyed?: boolean;
  closed?: boolean;
};

const swallowStreamError = (): void => {};

/**
 * Pipes a Node Readable stream to an HTTP response and guarantees upstream
 * cancellation + stream destruction on premature client disconnect or error.
 */
export function pipeReadableToResponse(
  source: Readable,
  res: StreamResponseLike,
  onAbort?: () => void,
): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;

    const onClose = () => finish(!res.writableEnded);
    const onFinish = () => finish(false);
    const onResError = () => finish(true);
    const onSourceError = () => finish(true);

    const finish = (abortUpstream: boolean) => {
      if (settled) return;
      settled = true;

      res.off('close', onClose);
      res.off('finish', onFinish);
      res.off('error', onResError);
      source.off('error', onSourceError);

      if (abortUpstream) {
        // Keep an error sink attached while tearing down aborted streams so late
        // async controller/socket errors never become uncaught exceptions.
        source.on('error', swallowStreamError);
        res.on('error', swallowStreamError);
        try {
          source.unpipe(res);
        } catch {
          // ignore
        }
        try {
          onAbort?.();
        } catch {
          // ignore
        }
        if (!source.destroyed) {
          source.destroy();
        }
        if (!res.destroyed && !res.writableEnded) {
          res.destroy();
        }
      }

      resolve();
    };

    if (res.destroyed || res.closed || res.writableEnded) {
      finish(true);
      return;
    }

    res.once('close', onClose);
    res.once('finish', onFinish);
    res.once('error', onResError);
    source.on('error', onSourceError);

    source.pipe(res);
  });
}
