import { convertImage } from '../../engines/jsquash';

export interface JpgToJxlOptions {
  quality?: number;
}

export async function jpgToJxl(file: File, options: JpgToJxlOptions = {}): Promise<Blob> {
  const quality = options.quality ?? 75;
  return convertImage(file, { from: 'jpeg', to: 'jxl', quality });
}
