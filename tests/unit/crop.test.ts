import { describe, expect, it, vi } from 'vitest';
import { cropImage } from '../../src/lib/conversions/image/crop';

vi.mock('../../src/lib/engines/imageData', () => ({
  decodeToImageData: vi.fn(async (blob: Blob & { __w?: number; __h?: number }) => {
    const width = blob.__w ?? 100;
    const height = blob.__h ?? 100;
    const data = new Uint8ClampedArray(width * height * 4);
    return new ImageData(data, width, height);
  }),
}));

function makeFile(w: number, h: number): File {
  const file = new File([new Uint8Array(8)], 'test.png', { type: 'image/png' }) as File & {
    __w?: number;
    __h?: number;
  };
  file.__w = w;
  file.__h = h;
  return file;
}

describe('cropImage', () => {
  it('returns a result with the requested output dimensions', async () => {
    const file = makeFile(100, 100);
    const result = await cropImage(file, { rect: { x: 10, y: 10, width: 40, height: 30 } });
    expect(result.width).toBe(40);
    expect(result.height).toBe(30);
  });

  it('defaults outputType to image/png', async () => {
    const file = makeFile(50, 50);
    const result = await cropImage(file, { rect: { x: 0, y: 0, width: 10, height: 10 } });
    expect(result.outputType).toBe('image/png');
    expect(result.blob.type).toBe('image/png');
  });

  it('honors a custom outputType', async () => {
    const file = makeFile(50, 50);
    const result = await cropImage(file, {
      rect: { x: 0, y: 0, width: 10, height: 10 },
      outputType: 'image/jpeg',
    });
    expect(result.outputType).toBe('image/jpeg');
    expect(result.blob.type).toBe('image/jpeg');
  });

  it('clamps the rect to the image bounds', async () => {
    const file = makeFile(100, 100);
    const result = await cropImage(file, {
      rect: { x: 95, y: 95, width: 200, height: 200 },
    });
    expect(result.width).toBeLessThanOrEqual(5);
    expect(result.height).toBeLessThanOrEqual(5);
    expect(result.width).toBeGreaterThanOrEqual(1);
    expect(result.height).toBeGreaterThanOrEqual(1);
  });

  it('clamps negative coordinates to zero', async () => {
    const file = makeFile(100, 100);
    const result = await cropImage(file, {
      rect: { x: -50, y: -50, width: 40, height: 30 },
    });
    expect(result.width).toBe(40);
    expect(result.height).toBe(30);
  });
});
