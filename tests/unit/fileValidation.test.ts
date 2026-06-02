import { describe, expect, it } from 'vitest';
import { humanReadableAccept, isAcceptedType } from '../../src/lib/utils/fileValidation';

const makeFile = (name: string, type: string) => new File([new Uint8Array(8)], name, { type });

describe('isAcceptedType', () => {
  it('accepts everything when accept is empty', () => {
    expect(isAcceptedType(makeFile('x.bin', ''), [])).toBe(true);
  });
  it('matches by extension', () => {
    expect(isAcceptedType(makeFile('photo.heic', ''), ['.heic', '.heif'])).toBe(true);
    expect(isAcceptedType(makeFile('photo.jpg', ''), ['.heic', '.heif'])).toBe(false);
  });
  it('matches by mime type', () => {
    expect(isAcceptedType(makeFile('x.bin', 'image/jpeg'), ['image/jpeg', 'image/png'])).toBe(true);
  });
  it('matches by mime prefix', () => {
    expect(isAcceptedType(makeFile('x.bin', 'image/heic'), ['image/*'])).toBe(true);
    expect(isAcceptedType(makeFile('x.bin', 'video/mp4'), ['image/*'])).toBe(false);
  });
  it('is case-insensitive', () => {
    expect(isAcceptedType(makeFile('PHOTO.HEIC', ''), ['.heic'])).toBe(true);
    expect(isAcceptedType(makeFile('x.bin', 'IMAGE/JPEG'), ['image/jpeg'])).toBe(true);
  });
});

describe('humanReadableAccept', () => {
  it('uppercases extensions', () => {
    expect(humanReadableAccept(['.heic', '.heif'])).toBe('.HEIC, .HEIF');
  });
  it('keeps mime types as-is', () => {
    expect(humanReadableAccept(['image/jpeg'])).toBe('image/jpeg');
  });
});
