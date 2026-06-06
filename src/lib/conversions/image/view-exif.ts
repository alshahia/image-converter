import { type ExifData, type ExifField, parseJpegExif } from '../../engines/exifRead';

export type { ExifData, ExifField };

export async function readExif(file: File | Blob): Promise<ExifData> {
  if (file.type !== 'image/jpeg') {
    return {
      hasExif: false,
      fields: [],
      error: `EXIF is only present in JPEG images. This file is ${file.type || 'unknown type'}.`,
    };
  }
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    return parseJpegExif(bytes);
  } catch (err) {
    return {
      hasExif: false,
      fields: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
