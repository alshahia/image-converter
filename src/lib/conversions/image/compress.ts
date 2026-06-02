import { type ImageFormat, convertImage } from '../../engines/jsquash';

export interface CompressOptions {
  format: ImageFormat;
  quality: number;
}

export async function compressImage(file: File | Blob, options: CompressOptions): Promise<Blob> {
  return convertImage(file, {
    from: options.format,
    to: options.format,
    quality: options.quality,
  });
}
