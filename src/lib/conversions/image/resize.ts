import { type ImageFormat, type ResizeSpec, convertImage } from '../../engines/jsquash';

export interface ResizeOptions {
  format: ImageFormat;
  resize: ResizeSpec;
  quality?: number;
}

export async function resizeImage(file: File | Blob, options: ResizeOptions): Promise<Blob> {
  return convertImage(file, {
    from: options.format,
    to: options.format,
    quality: options.quality,
    resize: options.resize,
  });
}
