import { convertImage } from '../../engines/jsquash';

export interface PngToJxlOptions {
  quality?: number;
}

export async function pngToJxl(file: File, options: PngToJxlOptions = {}): Promise<Blob> {
  const quality = options.quality ?? 75;
  return convertImage(file, { from: 'png', to: 'jxl', quality });
}
