const BMP_HEADER = 'BM' as const;
const PIXEL_OFFSET = 54;
const BMP_BITS_PER_PIXEL = 24;
const DIB_HEADER_SIZE = 40;

function rowSize(width: number): number {
  return Math.floor((width * BMP_BITS_PER_PIXEL + 31) / 32) * 4;
}

function fileSize(width: number, height: number): number {
  return PIXEL_OFFSET + rowSize(width) * Math.abs(height);
}

function writeUInt32LE(value: number): Uint8Array {
  return new Uint8Array([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ]);
}

function readUInt32LE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] ?? 0) |
      ((bytes[offset + 1] ?? 0) << 8) |
      ((bytes[offset + 2] ?? 0) << 16) |
      ((bytes[offset + 3] ?? 0) << 24)) >>>
    0
  );
}

function readUInt16LE(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8)) & 0xffff;
}

function readInt32(bytes: Uint8Array, offset: number): number {
  const v = readUInt32LE(bytes, offset);
  return v > 0x7fffffff ? v - 0x100000000 : v;
}

export interface BmpImageData {
  width: number;
  height: number;
  data: ImageData;
}

export async function encodeBmpFromImageData(image: ImageData): Promise<Blob> {
  const { width, height, data } = image;
  if (width <= 0 || height <= 0) throw new Error('encodeBmpFromImageData: invalid dimensions');
  const paddedRow = rowSize(width);
  const pixelBytes = paddedRow * height;
  const totalSize = fileSize(width, height);
  const buffer = new ArrayBuffer(totalSize);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  bytes[0] = BMP_HEADER.charCodeAt(0);
  bytes[1] = BMP_HEADER.charCodeAt(1);

  writeUInt32LE(totalSize).forEach((b, i) => {
    bytes[2 + i] = b;
  });
  writeUInt32LE(PIXEL_OFFSET).forEach((b, i) => {
    bytes[10 + i] = b;
  });
  view.setUint32(14, DIB_HEADER_SIZE, true);
  view.setInt32(18, width, true);
  view.setInt32(22, -height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, BMP_BITS_PER_PIXEL, true);
  view.setUint32(30, 0, true);
  view.setUint32(34, pixelBytes, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  let offset = PIXEL_OFFSET;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const r = data[srcIdx] ?? 0;
      const g = data[srcIdx + 1] ?? 0;
      const b = data[srcIdx + 2] ?? 0;
      bytes[offset++] = b & 0xff;
      bytes[offset++] = g & 0xff;
      bytes[offset++] = r & 0xff;
    }
    offset += paddedRow - width * 3;
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

export async function decodeBmpToImageData(blob: Blob): Promise<BmpImageData> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 14) throw new Error('decodeBmpToImageData: file too small');
  if (bytes[0] !== BMP_HEADER.charCodeAt(0) || bytes[1] !== BMP_HEADER.charCodeAt(1)) {
    throw new Error('decodeBmpToImageData: not a BMP file (missing BM header)');
  }
  const pixelOffset = readUInt32LE(bytes, 10);
  const dibSize = readUInt32LE(bytes, 14);
  if (dibSize < 40) throw new Error('decodeBmpToImageData: unsupported DIB header size');
  const width = readInt32(bytes, 18);
  const signedHeight = readInt32(bytes, 22);
  const topDown = signedHeight < 0;
  const height = Math.abs(signedHeight);
  const planes = readUInt16LE(bytes, 26);
  const bitsPerPixel = readUInt16LE(bytes, 28);
  const compression = readUInt32LE(bytes, 30);
  if (planes !== 1) throw new Error('decodeBmpToImageData: only 1 plane is supported');
  if (bitsPerPixel !== 24) throw new Error('decodeBmpToImageData: only 24-bit BMP is supported');
  if (compression !== 0) throw new Error('decodeBmpToImageData: compressed BMP is not supported');
  if (width <= 0 || height <= 0) throw new Error('decodeBmpToImageData: invalid dimensions');

  const paddedRow = rowSize(width);
  const expected = pixelOffset + paddedRow * height;
  if (bytes.length < expected) {
    throw new Error('decodeBmpToImageData: truncated BMP data');
  }

  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcY = topDown ? y : height - 1 - y;
    const rowStart = pixelOffset + srcY * paddedRow;
    for (let x = 0; x < width; x++) {
      const srcIdx = rowStart + x * 3;
      const dstIdx = (y * width + x) * 4;
      rgba[dstIdx] = bytes[srcIdx + 2] ?? 0;
      rgba[dstIdx + 1] = bytes[srcIdx + 1] ?? 0;
      rgba[dstIdx + 2] = bytes[srcIdx] ?? 0;
      rgba[dstIdx + 3] = 255;
    }
  }

  return {
    width,
    height,
    data: new ImageData(rgba, width, height),
  };
}

export const BMP_MIME = 'image/bmp' as const;
export const BMP_EXTENSION = 'bmp' as const;
