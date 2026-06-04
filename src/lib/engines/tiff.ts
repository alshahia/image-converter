import * as UTIF from 'utif';

export interface TiffImageData {
  width: number;
  height: number;
  data: ImageData;
}

export async function encodeTiffFromImageData(image: ImageData): Promise<Blob> {
  const { width, height, data } = image;
  if (width <= 0 || height <= 0) throw new Error('encodeTiffFromImageData: invalid dimensions');
  const rgba = new Uint8Array(data.buffer, data.byteOffset, width * height * 4);
  const arrayBuffer = UTIF.encodeImage(rgba, width, height);
  return new Blob([arrayBuffer], { type: 'image/tiff' });
}

export async function decodeTiffToImageData(blob: Blob): Promise<TiffImageData> {
  const buffer = await blob.arrayBuffer();
  const ifds = UTIF.decode(buffer);
  if (!ifds || ifds.length === 0) throw new Error('decodeTiffToImageData: no IFDs found in TIFF');
  const first = ifds[0];
  if (!first) throw new Error('decodeTiffToImageData: no first IFD');
  UTIF.decodeImage(buffer, first);
  const width = first.width;
  const height = first.height;
  if (!width || !height) throw new Error('decodeTiffToImageData: missing dimensions');
  const raw = first.data;
  if (!raw) throw new Error('decodeTiffToImageData: TIFF decoder returned no data');
  const rgba = new Uint8ClampedArray(raw.length);
  rgba.set(raw);
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i] === 0) rgba[i] = 255;
  }
  return {
    width,
    height,
    data: new ImageData(rgba, width, height),
  };
}

export const TIFF_MIME = 'image/tiff' as const;
export const TIFF_EXTENSION = 'tiff' as const;
