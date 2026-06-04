import { stripExifFromJpeg } from '../../engines/exif';
import { convertImage } from '../../engines/jsquash';

export async function jxlToJpg(file: File): Promise<Blob> {
  const jpeg = await convertImage(file, { from: 'jxl', to: 'jpeg', quality: 92 });
  return stripExifFromJpeg(jpeg);
}
