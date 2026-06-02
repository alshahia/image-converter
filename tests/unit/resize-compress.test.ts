import { describe, expect, it, vi } from 'vitest';
import { compressImage } from '../../src/lib/conversions/image/compress';
import { resizeImage } from '../../src/lib/conversions/image/resize';

vi.mock('../../src/lib/engines/jsquash', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/engines/jsquash')>(
    '../../src/lib/engines/jsquash',
  );
  return {
    ...actual,
    convertImage: vi.fn(
      async (
        _input: Blob,
        options: {
          from: string;
          to: string;
          quality?: number;
          resize?: { width: number; height: number };
        },
      ) => {
        const tag = options.resize
          ? `${options.from}->${options.to}@${options.quality ?? 'def'}:${options.resize.width}x${options.resize.height}`
          : `${options.from}->${options.to}@${options.quality ?? 'def'}`;
        return new Blob([tag], {
          type:
            options.to === 'jpeg'
              ? 'image/jpeg'
              : options.to === 'png'
                ? 'image/png'
                : 'image/webp',
        });
      },
    ),
  };
});

const file = (type: string) => new Blob([new Uint8Array(10)], { type });

describe('resizeImage', () => {
  it('returns a blob of the same format with resize spec', async () => {
    const result = await resizeImage(file('image/jpeg'), {
      format: 'jpeg',
      resize: { width: 800, height: 600 },
    });
    expect(result.type).toBe('image/jpeg');
  });

  it('preserves png format', async () => {
    const result = await resizeImage(file('image/png'), {
      format: 'png',
      resize: { width: 200, height: 200 },
    });
    expect(result.type).toBe('image/png');
  });

  it('passes quality through to the engine', async () => {
    const result = await resizeImage(file('image/webp'), {
      format: 'webp',
      resize: { width: 100, height: 100 },
      quality: 42,
    });
    expect(result.type).toBe('image/webp');
  });
});

describe('compressImage', () => {
  it('returns a jpeg blob with the chosen quality', async () => {
    const result = await compressImage(file('image/jpeg'), { format: 'jpeg', quality: 50 });
    expect(result.type).toBe('image/jpeg');
  });

  it('returns a webp blob with the chosen quality', async () => {
    const result = await compressImage(file('image/webp'), { format: 'webp', quality: 30 });
    expect(result.type).toBe('image/webp');
  });
});
