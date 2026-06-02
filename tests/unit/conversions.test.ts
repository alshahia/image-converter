import { describe, expect, it, vi } from 'vitest';
import { jpgToPng } from '../../src/lib/conversions/image/jpg-to-png';
import { jpgToWebp } from '../../src/lib/conversions/image/jpg-to-webp';
import { pngToJpg } from '../../src/lib/conversions/image/png-to-jpg';
import { webpToJpg } from '../../src/lib/conversions/image/webp-to-jpg';

vi.mock('../../src/lib/engines/jsquash', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/engines/jsquash')>(
    '../../src/lib/engines/jsquash',
  );
  return {
    ...actual,
    convertImage: vi.fn(
      async (input: Blob, options: { from: string; to: string; quality?: number }) => {
        return new Blob(
          [`${options.from}->${options.to}@${options.quality ?? 'def'}:${input.size}`],
          {
            type:
              options.to === 'jpeg'
                ? 'image/jpeg'
                : options.to === 'png'
                  ? 'image/png'
                  : 'image/webp',
          },
        );
      },
    ),
  };
});

const file = (bytes: number) => new Blob([new Uint8Array(bytes)], { type: 'image/png' });

describe('pngToJpg', () => {
  it('defaults quality to 92', async () => {
    const result = await pngToJpg(file(10));
    expect(result.type).toBe('image/jpeg');
  });

  it('passes explicit quality', async () => {
    const result = await pngToJpg(file(10), { quality: 50 });
    expect(result.type).toBe('image/jpeg');
  });
});

describe('jpgToPng', () => {
  it('returns a PNG blob', async () => {
    const result = await jpgToPng(file(10));
    expect(result.type).toBe('image/png');
  });
});

describe('webpToJpg', () => {
  it('defaults quality to 92', async () => {
    const result = await webpToJpg(file(10));
    expect(result.type).toBe('image/jpeg');
  });

  it('passes explicit quality', async () => {
    const result = await webpToJpg(file(10), { quality: 30 });
    expect(result.type).toBe('image/jpeg');
  });
});

describe('jpgToWebp', () => {
  it('defaults quality to 80', async () => {
    const result = await jpgToWebp(file(10));
    expect(result.type).toBe('image/webp');
  });

  it('passes explicit quality', async () => {
    const result = await jpgToWebp(file(10), { quality: 60 });
    expect(result.type).toBe('image/webp');
  });
});
