import { convertImage } from '../../engines/jsquash';

export async function jpgToPng(file: File | Blob): Promise<Blob> {
  return convertImage(file, { from: 'jpeg', to: 'png' });
}
