import { convertImage } from '../../engines/jsquash';

export interface PngToAvifOptions {
  quality?: number;
}

export async function pngToAvif(file: File, options: PngToAvifOptions = {}): Promise<Blob> {
  const quality = options.quality ?? 75;
  return convertImage(file, { from: 'png', to: 'avif', quality });
}
