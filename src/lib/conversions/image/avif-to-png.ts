import { convertImage } from '../../engines/jsquash';

export async function avifToPng(file: File): Promise<Blob> {
  return convertImage(file, { from: 'avif', to: 'png' });
}
