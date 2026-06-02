import { describe, expect, it } from 'vitest';
import { mimeTypeFor, terminateWorker } from '../../src/lib/engines/jsquash';

describe('mimeTypeFor', () => {
  it('returns image/jpeg for jpeg', () => {
    expect(mimeTypeFor('jpeg')).toBe('image/jpeg');
  });
  it('returns image/png for png', () => {
    expect(mimeTypeFor('png')).toBe('image/png');
  });
  it('returns image/webp for webp', () => {
    expect(mimeTypeFor('webp')).toBe('image/webp');
  });
});

describe('terminateWorker', () => {
  it('does not throw when no worker is active', () => {
    terminateWorker();
    expect(() => terminateWorker()).not.toThrow();
  });
});
