import { describe, expect, it, vi } from 'vitest';
import { rotateFlipImage } from '../../src/lib/conversions/image/rotate-flip';

vi.mock('../../src/lib/engines/imageData', () => ({
  decodeToImageData: vi.fn(async (blob: Blob & { __w?: number; __h?: number }) => {
    const width = blob.__w ?? 200;
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

describe('rotateFlipImage', () => {
  it('keeps dimensions for 0° rotation', async () => {
    const file = makeFile(200, 100);
    const result = await rotateFlipImage(file, { rotation: 0 });
    expect(result.width).toBe(200);
    expect(result.height).toBe(100);
  });

  it('swaps dimensions for 90° rotation', async () => {
    const file = makeFile(200, 100);
    const result = await rotateFlipImage(file, { rotation: 90 });
    expect(result.width).toBe(100);
    expect(result.height).toBe(200);
  });

  it('swaps dimensions for 270° rotation', async () => {
    const file = makeFile(200, 100);
    const result = await rotateFlipImage(file, { rotation: 270 });
    expect(result.width).toBe(100);
    expect(result.height).toBe(200);
  });

  it('keeps dimensions for 180° rotation', async () => {
    const file = makeFile(200, 100);
    const result = await rotateFlipImage(file, { rotation: 180 });
    expect(result.width).toBe(200);
    expect(result.height).toBe(100);
  });

  it('throws on an invalid rotation value', async () => {
    const file = makeFile(50, 50);
    await expect(rotateFlipImage(file, { rotation: 45 as unknown as 0 })).rejects.toThrow(
      /invalid rotation/i,
    );
  });

  it('defaults to image/png when outputType is omitted', async () => {
    const file = makeFile(50, 50);
    const result = await rotateFlipImage(file, { rotation: 90 });
    expect(result.outputType).toBe('image/png');
    expect(result.blob.type).toBe('image/png');
  });

  it('accepts a 90° rotation combined with horizontal flip without throwing', async () => {
    const file = makeFile(40, 20);
    const result = await rotateFlipImage(file, {
      rotation: 90,
      flipHorizontal: true,
    });
    expect(result.width).toBe(20);
    expect(result.height).toBe(40);
  });
});
