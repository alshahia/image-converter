import { convertImage } from '../../engines/jsquash';

export async function jxlToPng(file: File): Promise<Blob> {
  return convertImage(file, { from: 'jxl', to: 'png' });
}
