import { stripExifFromJpeg } from '../../engines/exif';
import { heicToBlob } from '../../engines/heic';

export interface HeicToJpgOptions {
  quality?: number;
}

export async function heicToJpg(file: File, options: HeicToJpgOptions = {}): Promise<Blob> {
  const quality = options.quality ?? 0.92;
  const jpegBlob = await heicToBlob(file, { toType: 'image/jpeg', quality });
  return stripExifFromJpeg(jpegBlob);
}
