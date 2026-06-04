import { convertImage } from '../../engines/jsquash';

export interface JpgToAvifOptions {
  quality?: number;
}

export async function jpgToAvif(file: File, options: JpgToAvifOptions = {}): Promise<Blob> {
  const quality = options.quality ?? 75;
  const avif = await convertImage(file, { from: 'jpeg', to: 'avif', quality });
  return avif;
}
