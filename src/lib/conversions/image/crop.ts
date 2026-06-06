import { decodeToImageData } from '../../engines/imageData';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropOptions {
  rect: CropRect;
  outputType?: string;
  quality?: number;
}

export interface CropResult {
  blob: Blob;
  width: number;
  height: number;
  outputType: string;
}

function clampRect(rect: CropRect, maxWidth: number, maxHeight: number): CropRect {
  const x = Math.max(0, Math.min(Math.round(rect.x), maxWidth - 1));
  const y = Math.max(0, Math.min(Math.round(rect.y), maxHeight - 1));
  const width = Math.max(1, Math.min(Math.round(rect.width), maxWidth - x));
  const height = Math.max(1, Math.min(Math.round(rect.height), maxHeight - y));
  return { x, y, width, height };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number | undefined,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('cropImage: canvas.toBlob returned null'));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

export async function cropImage(file: File | Blob, options: CropOptions): Promise<CropResult> {
  const imageData = await decodeToImageData(file);
  const rect = clampRect(options.rect, imageData.width, imageData.height);

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = imageData.width;
  sourceCanvas.height = imageData.height;
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) throw new Error('cropImage: 2D context unavailable');
  sourceCtx.putImageData(imageData, 0, 0);

  const destCanvas = document.createElement('canvas');
  destCanvas.width = rect.width;
  destCanvas.height = rect.height;
  const destCtx = destCanvas.getContext('2d');
  if (!destCtx) throw new Error('cropImage: 2D context unavailable');
  destCtx.imageSmoothingEnabled = true;
  destCtx.imageSmoothingQuality = 'high';
  destCtx.drawImage(
    sourceCanvas,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height,
  );

  const outputType = options.outputType ?? 'image/png';
  const quality = outputType === 'image/png' ? undefined : (options.quality ?? 0.92);
  const blob = await canvasToBlob(destCanvas, outputType, quality);
  return { blob, width: rect.width, height: rect.height, outputType };
}
