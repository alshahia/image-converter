import { convertImage } from '../../engines/jsquash';

export interface WebpToJpgOptions {
  quality?: number;
}

export async function webpToJpg(file: File | Blob, options: WebpToJpgOptions = {}): Promise<Blob> {
  return convertImage(file, { from: 'webp', to: 'jpeg', quality: options.quality ?? 92 });
}
