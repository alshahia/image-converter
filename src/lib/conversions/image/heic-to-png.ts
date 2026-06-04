import { heicToBlob } from '../../engines/heic';

export interface HeicToPngOptions {
  quality?: number;
}

export async function heicToPng(file: File, options: HeicToPngOptions = {}): Promise<Blob> {
  const quality = options.quality ?? 0.95;
  return heicToBlob(file, { toType: 'image/png', quality });
}
