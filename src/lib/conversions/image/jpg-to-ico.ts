import { encodeIcoFromImage } from '../../engines/ico';

export async function jpgToIco(file: File): Promise<Blob> {
  return encodeIcoFromImage(file);
}
