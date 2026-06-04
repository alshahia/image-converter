import { encodeBmpFromImageData } from '../../engines/bmp';
import { decodeToImageData } from '../../engines/imageData';

export async function jpgToBmp(file: File): Promise<Blob> {
  const image = await decodeToImageData(file);
  return encodeBmpFromImageData(image);
}
