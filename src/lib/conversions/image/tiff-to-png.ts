import { decodeTiffToImageData } from '../../engines/tiff';

export async function tiffToPng(file: File): Promise<Blob> {
  const image = await decodeTiffToImageData(file);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('tiff-to-png: 2D context unavailable');
  ctx.putImageData(image.data, 0, 0);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('tiff-to-png: canvas.toBlob returned null'));
    }, 'image/png');
  });
}
