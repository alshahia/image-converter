import { decodeBmpToImageData } from '../../engines/bmp';

export async function bmpToPng(file: File): Promise<Blob> {
  const image = await decodeBmpToImageData(file);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('bmp-to-png: 2D context unavailable');
  ctx.putImageData(image.data, 0, 0);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('bmp-to-png: canvas.toBlob returned null'));
    }, 'image/png');
  });
}
