import * as UTIF from 'utif';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decodeTiffToImageData } from '../../src/lib/engines/tiff';

vi.mock('utif', () => ({
  decode: vi.fn(),
  decodeImage: vi.fn(),
  encodeImage: vi.fn(),
}));

function makeBlob(bytes: number[] = [0x49, 0x49]): Blob {
  return new Blob([new Uint8Array(bytes)], { type: 'image/tiff' });
}

describe('decodeTiffToImageData (M-4)', () => {
  beforeEach(() => {
    vi.mocked(UTIF.decode).mockReset();
    vi.mocked(UTIF.decodeImage).mockReset();
  });

  it('throws a friendly error when the blob is not a TIFF', async () => {
    vi.mocked(UTIF.decode).mockImplementation(() => {
      throw new Error('Invalid TIFF file');
    });
    await expect(decodeTiffToImageData(makeBlob())).rejects.toThrow(/tiff|tif/i);
  });

  it('throws when UTIF returns no IFDs', async () => {
    vi.mocked(UTIF.decode).mockReturnValue([] as unknown as ReturnType<typeof UTIF.decode>);
    await expect(decodeTiffToImageData(makeBlob())).rejects.toThrow(/no.*ifd|empty/i);
  });

  it('rejects TIFFs with more IFDs than the safety bound (M-4)', async () => {
    // Synthesize 100 fake IFDs to exceed the bound. The real bound is
    // implementation-defined (defense-in-depth); we test the contract that
    // "too many" is rejected with a clear error.
    const manyIfds = Array.from({ length: 100 }, () => ({}));
    vi.mocked(UTIF.decode).mockReturnValue(manyIfds as unknown as ReturnType<typeof UTIF.decode>);
    await expect(decodeTiffToImageData(makeBlob())).rejects.toThrow(/too many ifd|exceeded|bound/i);
  });

  it('accepts a TIFF within the IFD bound and decodes it', async () => {
    // Pixel 0 alpha=128 (semi-transparent, kept as-is).
    // Pixel 1 alpha=0 (transparent, upgraded to 255 — TIFF's default).
    // Pixel 2 alpha=255 (kept).
    // Pixel 3 alpha=128 (kept).
    const fakeIfd = {
      width: 2,
      height: 2,
      data: new Uint8Array([
        255, 0, 0, 128,
        0, 255, 0, 0,
        0, 0, 255, 255,
        255, 255, 255, 128,
      ]),
    };
    vi.mocked(UTIF.decode).mockReturnValue([fakeIfd] as unknown as ReturnType<typeof UTIF.decode>);
    vi.mocked(UTIF.decodeImage).mockImplementation(() => undefined);
    const result = await decodeTiffToImageData(makeBlob());
    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    expect(result.data.data.length).toBe(16);
    // Non-zero alpha is preserved verbatim.
    expect(result.data.data[3]).toBe(128);
    expect(result.data.data[7]).toBe(255);
    expect(result.data.data[11]).toBe(255);
    expect(result.data.data[15]).toBe(128);
  });

  it('throws if width or height is missing from the first IFD', async () => {
    const fakeIfd = { data: new Uint8Array(4) };
    vi.mocked(UTIF.decode).mockReturnValue([fakeIfd] as unknown as ReturnType<typeof UTIF.decode>);
    await expect(decodeTiffToImageData(makeBlob())).rejects.toThrow(/dimension|width|height/i);
  });
});
