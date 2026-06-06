import { describe, expect, it } from 'vitest';
import { readExif } from '../../src/lib/conversions/image/view-exif';

const MINIMAL_JPEG = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x4d, 0x4d, 0x00, 0x2a,
  0x00, 0x00, 0x00, 0x00, 0xff, 0xd9,
]);

describe('readExif', () => {
  it('returns hasExif: false for non-JPEG inputs with a helpful error', async () => {
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'foo.png', {
      type: 'image/png',
    });
    const result = await readExif(png);
    expect(result.hasExif).toBe(false);
    expect(result.fields).toEqual([]);
    expect(result.error).toMatch(/jpeg/i);
  });

  it('returns hasExif: false for a Blob with no MIME type', async () => {
    const blob = new Blob([MINIMAL_JPEG]);
    const result = await readExif(blob);
    expect(result.hasExif).toBe(false);
    expect(result.error).toMatch(/unknown type/i);
  });

  it('does not throw for a malformed JPEG byte stream', async () => {
    const garbage = new File([new Uint8Array([0xff, 0xd8, 0xff, 0x00, 0x00, 0x00])], 'bad.jpg', {
      type: 'image/jpeg',
    });
    const result = await readExif(garbage);
    // Should resolve with either hasExif:false + a non-thrown error, or
    // successfully return empty fields. Either way, no rejection.
    expect(result).toHaveProperty('hasExif');
  });

  it('returns ExifData-shaped objects (hasExif, fields, error keys)', async () => {
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'foo.png', {
      type: 'image/png',
    });
    const result = await readExif(png);
    expect(result).toMatchObject({
      hasExif: expect.any(Boolean),
      fields: expect.any(Array),
    });
    expect(typeof result.error === 'string' || result.error === null).toBe(true);
  });
});
