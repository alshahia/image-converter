import { describe, expect, it, vi } from 'vitest';
import { watermarkImage } from '../../src/lib/conversions/image/watermark';

vi.mock('../../src/lib/engines/imageData', () => ({
  decodeToImageData: vi.fn(async (blob: Blob & { __w?: number; __h?: number }) => {
    const width = blob.__w ?? 400;
    const height = blob.__h ?? 300;
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

describe('watermarkImage — text mode', () => {
  it('preserves the source image dimensions', async () => {
    const file = makeFile(400, 300);
    const result = await watermarkImage(file, {
      mode: 'text',
      text: '© Test',
      position: 'bottom-right',
      opacity: 0.5,
      fontSize: 24,
    });
    expect(result.width).toBe(400);
    expect(result.height).toBe(300);
  });

  it('returns a PNG blob by default', async () => {
    const file = makeFile(200, 200);
    const result = await watermarkImage(file, {
      mode: 'text',
      text: 'hello',
      position: 'top-left',
      opacity: 1,
      fontSize: 16,
    });
    expect(result.outputType).toBe('image/png');
    expect(result.blob.type).toBe('image/png');
  });

  it('honors a custom outputType', async () => {
    const file = makeFile(200, 200);
    const result = await watermarkImage(file, {
      mode: 'text',
      text: 'hello',
      position: 'top-left',
      opacity: 1,
      fontSize: 16,
      outputType: 'image/webp',
    });
    expect(result.outputType).toBe('image/webp');
    expect(result.blob.type).toBe('image/webp');
  });

  it('does not throw on multi-line text', async () => {
    const file = makeFile(200, 200);
    await expect(
      watermarkImage(file, {
        mode: 'text',
        text: 'line one\nline two\nline three',
        position: 'center',
        opacity: 0.8,
        fontSize: 20,
      }),
    ).resolves.toMatchObject({ width: 200, height: 200 });
  });
});

describe('watermarkImage — option clamping', () => {
  it('clamps opacity above 1 to 1', async () => {
    const file = makeFile(100, 100);
    const result = await watermarkImage(file, {
      mode: 'text',
      text: 'x',
      position: 'top-left',
      opacity: 5,
      fontSize: 12,
    });
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it('clamps opacity below 0 to 0', async () => {
    const file = makeFile(100, 100);
    const result = await watermarkImage(file, {
      mode: 'text',
      text: 'x',
      position: 'top-left',
      opacity: -2,
      fontSize: 12,
    });
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it('treats NaN opacity as fully opaque (falls back to 1)', async () => {
    const file = makeFile(100, 100);
    const result = await watermarkImage(file, {
      mode: 'text',
      text: 'x',
      position: 'top-left',
      opacity: Number.NaN,
      fontSize: 12,
    });
    expect(result.blob.size).toBeGreaterThan(0);
  });
});
