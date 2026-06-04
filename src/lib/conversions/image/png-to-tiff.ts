import { decodeToImageData } from '../../engines/imageData';
import { encodeTiffFromImageData } from '../../engines/tiff';

export async function pngToTiff(file: File): Promise<Blob> {
  const image = await decodeToImageData(file);
  return encodeTiffFromImageData(image);
}
