import { decodeToImageData } from '../../engines/imageData';
import { encodeTiffFromImageData } from '../../engines/tiff';

export async function jpgToTiff(file: File): Promise<Blob> {
  const image = await decodeToImageData(file);
  return encodeTiffFromImageData(image);
}
