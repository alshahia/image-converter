import { convertImage } from '../../engines/jsquash';

export interface PngToJpgOptions {
  quality?: number;
}

export async function pngToJpg(file: File | Blob, options: PngToJpgOptions = {}): Promise<Blob> {
  return convertImage(file, { from: 'png', to: 'jpeg', quality: options.quality ?? 92 });
}
