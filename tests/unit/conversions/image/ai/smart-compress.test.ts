import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../src/lib/conversions/image/compress', () => ({
  compressImage: vi.fn(async (_file: Blob, opts: { quality: number; format: string }) => {
    const size = Math.round(100 + (1 - opts.quality) * 900) * 1024;
    return new Blob([new Uint8Array(size)], { type: `image/${opts.format}` });
  }),
}));

import { smartCompress } from '../../../../../src/lib/conversions/image/ai/smart-compress';

function makeJpgBlob(): Blob {
  return new Blob([new Uint8Array(2 * 1024 * 1024)], { type: 'image/jpeg' });
}

describe('smartCompress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('produces a blob at or under the target size', async () => {
    const out = await smartCompress(makeJpgBlob(), { targetSizeKB: 200 });
    expect(out).toBeInstanceOf(Blob);
    expect(out.size).toBeLessThanOrEqual(220 * 1024);
  });

  it('respects maxIterations to avoid runaway loops', async () => {
    const compress = await import('../../../../../src/lib/conversions/image/compress');
    await smartCompress(makeJpgBlob(), { targetSizeKB: 50, maxIterations: 4 });
    expect(vi.mocked(compress.compressImage).mock.calls.length).toBeLessThanOrEqual(4);
  });

  it('throws if input mime type is not jpeg/png/webp', async () => {
    const svg = new Blob(['<svg/>'], { type: 'image/svg+xml' });
    await expect(smartCompress(svg, { targetSizeKB: 100 })).rejects.toThrow();
  });
});
