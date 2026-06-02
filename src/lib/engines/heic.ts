import heic2any from 'heic2any';

export interface HeicToBlobOptions {
  toType?: 'image/jpeg' | 'image/png';
  quality?: number;
}

export async function heicToBlob(
  file: File | Blob,
  options: HeicToBlobOptions = {},
): Promise<Blob> {
  const { toType = 'image/jpeg', quality = 0.92 } = options;
  const result = await heic2any({
    blob: file,
    toType,
    quality,
  });
  if (Array.isArray(result)) {
    const first = result[0];
    if (!first) throw new Error('heic2any returned an empty array');
    return first;
  }
  return result;
}
