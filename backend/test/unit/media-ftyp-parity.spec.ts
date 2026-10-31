import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MediaValidationService } from '../../src/media/media-validation.service';

function box(type: string, payload: Buffer): Buffer {
  const out = Buffer.alloc(8 + payload.length);
  out.writeUInt32BE(out.length, 0);
  out.write(type, 4, 4, 'latin1');
  payload.copy(out, 8);
  return out;
}

describe('MediaValidationService ftyp container parity', () => {
  const svc = new MediaValidationService() as unknown as {
    hasValidMp4Ftyp(filePath: string, sizeBytes: number): Promise<boolean>;
  };

  async function checkBytes(buf: Buffer): Promise<boolean> {
    const dir = await mkdtemp(join(tmpdir(), 'mp4-ftyp-'));
    const file = join(dir, 'sample.mp4');
    try {
      await writeFile(file, buf);
      return await svc.hasValidMp4Ftyp(file, buf.length);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  it('accepts MP4 with >64KB leading free box, uuid box, and 4-byte zero padding before ftyp', async () => {
    const largeFree = box('free', Buffer.alloc(128 * 1024));
    const uuidBox = box('uuid', Buffer.alloc(24));
    const zeroPad = Buffer.from([0, 0, 0, 0]);
    const ftyp = box('ftyp', Buffer.from('isom\x00\x00\x02\x00isommp42', 'latin1'));
    const buf = Buffer.concat([largeFree, uuidBox, zeroPad, ftyp]);
    expect(await checkBytes(buf)).toBe(true);
  });

  it('accepts Android hybrid MP4 (major_brand 3gp5 with isom/mp42 compatible_brands) and rejects pure 3GP', async () => {
    const hybrid = box('ftyp', Buffer.from('3gp5\x00\x00\x02\x00isom3gp5mp42', 'latin1'));
    expect(await checkBytes(hybrid)).toBe(true);

    const pure3gp = box('ftyp', Buffer.from('3gp5\x00\x00\x02\x003gp53gp4', 'latin1'));
    expect(await checkBytes(pure3gp)).toBe(false);
  });

  it('accepts hybrid QuickTime+HEVC/MP4 and still rejects pure QuickTime MOV', async () => {
    const hybridHevc = box('ftyp', Buffer.from('qt  \x00\x00\x02\x00qt  hvc1', 'latin1'));
    expect(await checkBytes(hybridHevc)).toBe(true);

    const pureMov = box('ftyp', Buffer.from('qt  \x00\x00\x02\x00qt  ', 'latin1'));
    expect(await checkBytes(pureMov)).toBe(false);
  });
});
