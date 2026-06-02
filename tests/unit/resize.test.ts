import { describe, expect, it } from 'vitest';
import { computeResizeToFit, detectFormat } from '../../src/lib/engines/jsquash';

describe('computeResizeToFit', () => {
  it('scales down to fit longest edge, preserving aspect ratio', () => {
    expect(computeResizeToFit({ width: 4000, height: 3000 }, 1920)).toEqual({
      width: 1920,
      height: 1440,
    });
  });

  it('scales portrait images', () => {
    expect(computeResizeToFit({ width: 3000, height: 4000 }, 1920)).toEqual({
      width: 1440,
      height: 1920,
    });
  });

  it('returns original if longest edge already fits', () => {
    expect(computeResizeToFit({ width: 1920, height: 1080 }, 1920)).toEqual({
      width: 1920,
      height: 1080,
    });
  });

  it('returns original for a 100x100 image when target is 1920', () => {
    expect(computeResizeToFit({ width: 100, height: 100 }, 1920)).toEqual({
      width: 100,
      height: 100,
    });
  });

  it('returns original when target is 0 or negative', () => {
    expect(computeResizeToFit({ width: 4000, height: 3000 }, 0)).toEqual({
      width: 4000,
      height: 3000,
    });
    expect(computeResizeToFit({ width: 4000, height: 3000 }, -10)).toEqual({
      width: 4000,
      height: 3000,
    });
  });

  it('rounds to nearest pixel', () => {
    expect(computeResizeToFit({ width: 1000, height: 333 }, 500)).toEqual({
      width: 500,
      height: 167,
    });
  });

  it('never returns zero dimensions', () => {
    const result = computeResizeToFit({ width: 1, height: 100000 }, 1);
    expect(result.width).toBeGreaterThanOrEqual(1);
    expect(result.height).toBeGreaterThanOrEqual(1);
  });
});

describe('detectFormat', () => {
  it('detects jpeg from MIME type', () => {
    expect(detectFormat(new Blob([], { type: 'image/jpeg' }))).toBe('jpeg');
  });

  it('detects png from MIME type', () => {
    expect(detectFormat(new Blob([], { type: 'image/png' }))).toBe('png');
  });

  it('detects webp from MIME type', () => {
    expect(detectFormat(new Blob([], { type: 'image/webp' }))).toBe('webp');
  });

  it('returns null for unsupported MIME types', () => {
    expect(detectFormat(new Blob([], { type: 'image/gif' }))).toBeNull();
    expect(detectFormat(new Blob([], { type: 'application/octet-stream' }))).toBeNull();
  });

  it('returns null for blobs with no type', () => {
    expect(detectFormat(new Blob([]))).toBeNull();
  });
});
