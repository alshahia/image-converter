import { describe, expect, it } from 'vitest';
import { decodeBmpToImageData, encodeBmpFromImageData } from '../../src/lib/engines/bmp';

describe('BMP engine', () => {
  it('encodes a small image and decodes it back to the same dimensions', async () => {
    const data = new Uint8ClampedArray(4 * 4 * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
    const imageData = new ImageData(data, 4, 4);
    const blob = await encodeBmpFromImageData(imageData);
    expect(blob.type).toBe('image/bmp');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0)).toBe('BM');
    const decoded = await decodeBmpToImageData(blob);
    expect(decoded.width).toBe(4);
    expect(decoded.height).toBe(4);
    expect(decoded.data.data[0]).toBe(255);
    expect(decoded.data.data[1]).toBe(0);
    expect(decoded.data.data[2]).toBe(0);
    expect(decoded.data.data[3]).toBe(255);
  });

  it('rejects non-BMP data', async () => {
    const notBmp = new Blob([new Uint8Array(64).fill(0x89)], { type: 'image/png' });
    await expect(decodeBmpToImageData(notBmp)).rejects.toThrow(/not a BMP/i);
  });

  it('rejects BMP with truncated pixel data', async () => {
    const header = new Uint8Array(54);
    header[0] = 0x42;
    header[1] = 0x4d;
    const view = new DataView(header.buffer);
    view.setUint32(2, 100, true);
    view.setUint32(10, 54, true);
    view.setUint32(14, 40, true);
    view.setInt32(18, 1, true);
    view.setInt32(22, 1, true);
    view.setUint16(26, 1, true);
    view.setUint16(28, 24, true);
    view.setUint32(30, 0, true);
    view.setUint32(34, 0, true);
    const blob = new Blob([header], { type: 'image/bmp' });
    await expect(decodeBmpToImageData(blob)).rejects.toThrow(/truncated/i);
  });

  it('encodes wider-than-4-pixel images with correct row padding', async () => {
    const data = new Uint8ClampedArray(5 * 2 * 4);
    const imageData = new ImageData(data, 5, 2);
    const blob = await encodeBmpFromImageData(imageData);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const view = new DataView(bytes.buffer);
    expect(view.getInt32(18, true)).toBe(5);
    expect(view.getInt32(22, true)).toBe(-2);
    const expectedSize = 54 + 8 * 2 * 2;
    expect(view.getUint32(2, true)).toBe(expectedSize);
  });
});
