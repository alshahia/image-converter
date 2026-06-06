import heic2any from 'heic2any';

export interface HeicToBlobOptions {
  toType?: 'image/jpeg' | 'image/png';
  quality?: number;
}

async function tryCreateImageBitmapFastPath(
  file: File | Blob,
  toType: 'image/jpeg' | 'image/png',
  quality: number,
): Promise<Blob | null> {
  if (typeof createImageBitmap !== 'function') return null;
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(bitmap, 0, 0);
      return await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), toType, quality);
      });
    } finally {
      bitmap.close();
    }
  } catch {
    return null;
  }
}

export async function heicToBlob(
  file: File | Blob,
  options: HeicToBlobOptions = {},
): Promise<Blob> {
  const { toType = 'image/jpeg', quality = 0.92 } = options;

  // Fast path: modern browsers (Chrome 119+ on Android, Safari 17+, Edge)
  // decode HEIC natively. Skip the heic2any WASM path entirely.
  const fast = await tryCreateImageBitmapFastPath(file, toType, quality);
  if (fast) return fast;

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
