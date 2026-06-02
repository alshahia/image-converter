import { describe, expect, it } from 'vitest';
import {
  MAX_IMAGE_BYTES,
  WARN_IMAGE_BYTES,
  checkFileSize,
  formatBytes,
} from '../../src/lib/utils/guardRails';

describe('formatBytes', () => {
  it('formats bytes', () => {
    expect(formatBytes(512)).toBe('512 B');
  });
  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(2048)).toBe('2.0 KB');
  });
  it('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(5.2 * 1024 * 1024)).toBe('5.2 MB');
  });
  it('formats gigabytes', () => {
    expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe('1.50 GB');
  });
});

describe('checkFileSize', () => {
  const file = (size: number) =>
    new File([new Uint8Array(size)], 'test.bin', { type: 'application/octet-stream' });

  it('returns ok for small files', () => {
    expect(checkFileSize(file(1024), MAX_IMAGE_BYTES, WARN_IMAGE_BYTES, 'file').verdict).toBe('ok');
  });
  it('returns warn for files above warn threshold', () => {
    const r = checkFileSize(file(60 * 1024 * 1024), MAX_IMAGE_BYTES, WARN_IMAGE_BYTES, 'file');
    expect(r.verdict).toBe('warn');
    expect(r.reason).toMatch(/large/i);
  });
  it('returns block for files above max', () => {
    const r = checkFileSize(file(200 * 1024 * 1024), MAX_IMAGE_BYTES, WARN_IMAGE_BYTES, 'file');
    expect(r.verdict).toBe('block');
    expect(r.reason).toMatch(/too large/i);
  });
});
