import { convertImage } from '../../engines/jsquash';

export interface JpgToWebpOptions {
  quality?: number;
}

export async function jpgToWebp(file: File | Blob, options: JpgToWebpOptions = {}): Promise<Blob> {
  return convertImage(file, { from: 'jpeg', to: 'webp', quality: options.quality ?? 80 });
}
