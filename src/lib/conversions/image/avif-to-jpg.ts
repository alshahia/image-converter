import { stripExifFromJpeg } from '../../engines/exif';
import { convertImage } from '../../engines/jsquash';

export async function avifToJpg(file: File): Promise<Blob> {
  const jpeg = await convertImage(file, { from: 'avif', to: 'jpeg', quality: 92 });
  return stripExifFromJpeg(jpeg);
}
