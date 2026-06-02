import { stripExifFromJpeg } from '../../engines/exif';

export interface StripExifOptions {
  jpegQuality?: number;
}

export async function stripExif(file: File | Blob): Promise<Blob> {
  if (file.type !== 'image/jpeg') {
    return file;
  }
  return stripExifFromJpeg(file);
}
