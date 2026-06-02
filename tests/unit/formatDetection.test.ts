import { describe, expect, it } from 'vitest';
import { detectImageFormat } from '../../src/lib/utils/formatDetection';

const makeBlob = (bytes: number[]) =>
  new Blob([new Uint8Array(bytes)], { type: 'application/octet-stream' });

describe('detectImageFormat', () => {
  it('detects JPEG', async () => {
    const blob = makeBlob([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(await detectImageFormat(blob)).toEqual({ family: 'jpeg', isHeif: false });
  });
  it('detects PNG', async () => {
    const blob = makeBlob([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(await detectImageFormat(blob)).toEqual({ family: 'png', isHeif: false });
  });
  it('detects WebP', async () => {
    const blob = makeBlob([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(await detectImageFormat(blob)).toEqual({ family: 'webp', isHeif: false });
  });
  it('detects HEIC by ftyp brand heic', async () => {
    const blob = makeBlob([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);
    expect(await detectImageFormat(blob)).toEqual({ family: 'heic', isHeif: true });
  });
  it('detects HEIF by ftyp brand mif1', async () => {
    const blob = makeBlob([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x69, 0x66, 0x31]);
    expect(await detectImageFormat(blob)).toEqual({ family: 'heic', isHeif: true });
  });
  it('returns unknown for unrecognized bytes', async () => {
    const blob = makeBlob([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(await detectImageFormat(blob)).toEqual({ family: 'unknown', isHeif: false });
  });
});
