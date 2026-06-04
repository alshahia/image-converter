import { svgToPng } from '../../engines/svg';

export async function svgToPngConvert(file: File): Promise<Blob> {
  const { blob } = await svgToPng(file);
  return blob;
}
