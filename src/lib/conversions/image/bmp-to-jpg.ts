import { decodeBmpToImageData } from '../../engines/bmp';
import { stripExifFromJpeg } from '../../engines/exif';
import { convertImage } from '../../engines/jsquash';

export async function bmpToJpg(file: File): Promise<Blob> {
  const image = await decodeBmpToImageData(file);
  const pngBlob = await imageDataToPngBlob(image.data, image.width, image.height);
  const jpeg = await convertImage(pngBlob, { from: 'png', to: 'jpeg', quality: 92 });
  return stripExifFromJpeg(jpeg);
}

async function imageDataToPngBlob(data: ImageData, width: number, height: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('bmp-to-jpg: 2D context unavailable');
  ctx.putImageData(data, 0, 0);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('bmp-to-jpg: canvas.toBlob returned null'));
    }, 'image/png');
  });
}
