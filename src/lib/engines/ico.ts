import { decodeToImageData } from './imageData';
import { convertImage, detectFormat } from './jsquash';

export const ICO_MIME = 'image/x-icon' as const;
export const ICO_EXTENSION = 'ico' as const;

export interface EncodeIcoOptions {
  sizes?: number[];
}

function buildIco(pngs: Array<{ size: number; png: Uint8Array }>): Uint8Array {
  const headerSize = 6;
  const dirEntrySize = 16;
  let totalSize = headerSize + dirEntrySize * pngs.length;
  for (const { png } of pngs) totalSize += png.length;
  const out = new Uint8Array(totalSize);
  const view = new DataView(out.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, pngs.length, true);
  let dataOffset = headerSize + dirEntrySize * pngs.length;
  for (let i = 0; i < pngs.length; i++) {
    const current = pngs[i];
    if (!current) continue;
    const { size, png } = current;
    const entry = i * dirEntrySize;
    out[entry] = size >= 256 ? 0 : size;
    out[entry + 1] = size >= 256 ? 0 : size;
    out[entry + 2] = 0;
    out[entry + 3] = 0;
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, png.length, true);
    view.setUint32(entry + 12, dataOffset, true);
    out.set(png, dataOffset);
    dataOffset += png.length;
  }
  return out;
}

async function renderPngAtSize(input: File | Blob, size: number): Promise<Uint8Array> {
  const image = await decodeToImageData(input);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('encodeIcoFromImage: 2D context unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(await createImageBitmapFromImageData(image), 0, 0, size, size);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png');
  });
  if (!blob) throw new Error('encodeIcoFromImage: canvas.toBlob returned null');
  return new Uint8Array(await blob.arrayBuffer());
}

async function createImageBitmapFromImageData(image: ImageData): Promise<ImageBitmap> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(image);
  }
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('encodeIcoFromImage: 2D context unavailable');
  ctx.putImageData(image, 0, 0);
  return createImageBitmap(canvas);
}

export async function encodeIcoFromImage(
  input: File | Blob,
  options: EncodeIcoOptions = {},
): Promise<Blob> {
  const { sizes = [16, 32, 48, 64, 128, 256] } = options;
  const from = detectFormat(input) ?? 'png';
  const normalized = await convertImage(input, { from, to: 'png' });
  const pngs: Array<{ size: number; png: Uint8Array }> = [];
  for (const size of sizes) {
    const png = await renderPngAtSize(normalized, size);
    pngs.push({ size, png });
  }
  const ico = buildIco(pngs);
  const buf = new ArrayBuffer(ico.byteLength);
  new Uint8Array(buf).set(ico);
  return new Blob([buf], { type: ICO_MIME });
}
