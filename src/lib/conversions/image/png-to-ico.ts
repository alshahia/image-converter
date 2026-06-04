import { encodeIcoFromImage } from '../../engines/ico';

export async function pngToIco(file: File): Promise<Blob> {
  return encodeIcoFromImage(file);
}
