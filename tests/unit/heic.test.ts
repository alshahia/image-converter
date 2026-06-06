import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('heic2any', () => ({
  default: vi.fn(),
}));

import heic2any from 'heic2any';
import { heicToBlob } from '../../src/lib/engines/heic';

describe('heicToBlob (M-6 createImageBitmap fast path)', () => {
  let originalCreateImageBitmap: typeof createImageBitmap | undefined;

  beforeEach(() => {
    vi.mocked(heic2any).mockReset();
    originalCreateImageBitmap = globalThis.createImageBitmap;
  });

  it('uses createImageBitmap when the browser supports it (skips heic2any)', async () => {
    const fakeBlob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/heic' });
    // Mock createImageBitmap to return a fake bitmap, then we can short-circuit
    // by having it return a bitmap and a canvas toBlob that produces our fake.
    const fakeBitmap = {
      width: 2,
      height: 2,
      close: vi.fn(),
    } as unknown as ImageBitmap;
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(fakeBitmap);

    // Mock HTMLCanvasElement.prototype.toBlob to emit a known blob.
    const targetBlob = new Blob([new Uint8Array([7, 7, 7])], { type: 'image/jpeg' });
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = ((cb: BlobCallback) => {
      cb(targetBlob);
    }) as typeof HTMLCanvasElement.prototype.toBlob;

    try {
      const result = await heicToBlob(fakeBlob, { toType: 'image/jpeg' });
      expect(result).toBe(targetBlob);
      expect(heic2any).not.toHaveBeenCalled();
    } finally {
      HTMLCanvasElement.prototype.toBlob = originalToBlob;
      if (originalCreateImageBitmap) {
        globalThis.createImageBitmap = originalCreateImageBitmap;
      } else {
        delete (globalThis as { createImageBitmap?: typeof createImageBitmap }).createImageBitmap;
      }
    }
  });

  it('falls back to heic2any when createImageBitmap throws (no HEIC codec)', async () => {
    const fakeBlob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/heic' });
    globalThis.createImageBitmap = vi.fn().mockRejectedValue(new Error('HEIC not supported'));
    const targetBlob = new Blob([new Uint8Array([9, 9, 9])], { type: 'image/jpeg' });
    vi.mocked(heic2any).mockResolvedValue(targetBlob);

    try {
      const result = await heicToBlob(fakeBlob, { toType: 'image/jpeg' });
      expect(result).toBe(targetBlob);
      expect(heic2any).toHaveBeenCalledWith({ blob: fakeBlob, toType: 'image/jpeg', quality: 0.92 });
    } finally {
      if (originalCreateImageBitmap) {
        globalThis.createImageBitmap = originalCreateImageBitmap;
      } else {
        delete (globalThis as { createImageBitmap?: typeof createImageBitmap }).createImageBitmap;
      }
    }
  });

  it('falls back to heic2any when createImageBitmap is unavailable', async () => {
    const fakeBlob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/heic' });
    delete (globalThis as { createImageBitmap?: typeof createImageBitmap }).createImageBitmap;
    const targetBlob = new Blob([new Uint8Array([9, 9, 9])], { type: 'image/jpeg' });
    vi.mocked(heic2any).mockResolvedValue(targetBlob);

    const result = await heicToBlob(fakeBlob, { toType: 'image/jpeg' });
    expect(result).toBe(targetBlob);
    expect(heic2any).toHaveBeenCalledTimes(1);
  });
});
