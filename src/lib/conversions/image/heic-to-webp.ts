import { heicToBlob } from '../../engines/heic';
import { convertImage } from '../../engines/jsquash';

export interface HeicToWebpOptions {
  quality?: number;
}

export async function heicToWebp(file: File, options: HeicToWebpOptions = {}): Promise<Blob> {
  const quality = options.quality ?? 82;
  const png = await heicToBlob(file, { toType: 'image/png' });
  return convertImage(png, { from: 'png', to: 'webp', quality });
}
