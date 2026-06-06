import * as UTIF from 'utif';

export interface TiffImageData {
  width: number;
  height: number;
  data: ImageData;
}

/** Hard cap on IFDs accepted from a single TIFF. Defense-in-depth: a
 *  maliciously crafted header can claim millions of IFDs. 32 is far more
 *  than any sane TIFF (multi-page scans are usually <10). */
const MAX_IFDS = 32;
/** Cap on pixel area (W × H). 16384 × 16384 ≈ 268M pixels × 4 bytes = 1 GiB.
 *  Rejects pathological dimensions before UTIF allocates the buffer. */
const MAX_PIXEL_AREA = 16384 * 16384;

export async function encodeTiffFromImageData(image: ImageData): Promise<Blob> {
  const { width, height, data } = image;
  if (width <= 0 || height <= 0) throw new Error('encodeTiffFromImageData: invalid dimensions');
  if (width * height > MAX_PIXEL_AREA) {
    throw new Error('encodeTiffFromImageData: image dimensions exceed safety bound');
  }
  const rgba = new Uint8Array(data.buffer, data.byteOffset, width * height * 4);
  const arrayBuffer = UTIF.encodeImage(rgba, width, height);
  return new Blob([arrayBuffer], { type: 'image/tiff' });
}

export async function decodeTiffToImageData(blob: Blob): Promise<TiffImageData> {
  const buffer = await blob.arrayBuffer();
  let ifds: ReturnType<typeof UTIF.decode>;
  try {
    ifds = UTIF.decode(buffer);
  } catch (err) {
    throw new Error(
      `decodeTiffToImageData: not a valid TIFF (${err instanceof Error ? err.message : String(err)})`,
    );
  }
  if (!ifds || ifds.length === 0) throw new Error('decodeTiffToImageData: no IFDs found in TIFF');
  if (ifds.length > MAX_IFDS) {
    throw new Error(`decodeTiffToImageData: IFD count ${ifds.length} exceeds safety bound (${MAX_IFDS})`);
  }
  const first = ifds[0];
  if (!first) throw new Error('decodeTiffToImageData: no first IFD');
  UTIF.decodeImage(buffer, first);
  const width = first.width;
  const height = first.height;
  if (!width || !height) throw new Error('decodeTiffToImageData: missing dimensions');
  if (width * height > MAX_PIXEL_AREA) {
    throw new Error('decodeTiffToImageData: pixel area exceeds safety bound');
  }
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
