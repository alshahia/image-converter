import { decodeToImageData } from '../../engines/imageData';

export type Rotation = 0 | 90 | 180 | 270;

export interface RotateFlipOptions {
  rotation?: Rotation;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  outputType?: string;
  quality?: number;
}

export interface RotateFlipResult {
  blob: Blob;
  width: number;
  height: number;
  outputType: string;
}

function isRotation(value: unknown): value is Rotation {
  return value === 0 || value === 90 || value === 180 || value === 270;
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
          reject(new Error('rotateFlip: canvas.toBlob returned null'));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

export async function rotateFlipImage(
  file: File | Blob,
  options: RotateFlipOptions = {},
): Promise<RotateFlipResult> {
  const rotation = options.rotation ?? 0;
  if (!isRotation(rotation)) {
    throw new Error(`rotateFlip: invalid rotation ${rotation}. Must be 0, 90, 180, or 270.`);
  }
  const flipH = options.flipHorizontal ?? false;
  const flipV = options.flipVertical ?? false;

  const imageData = await decodeToImageData(file);
  const sourceWidth = imageData.width;
  const sourceHeight = imageData.height;

  const swapsAxes = rotation === 90 || rotation === 270;
  const destWidth = swapsAxes ? sourceHeight : sourceWidth;
  const destHeight = swapsAxes ? sourceWidth : sourceHeight;

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = sourceWidth;
  sourceCanvas.height = sourceHeight;
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) throw new Error('rotateFlip: 2D context unavailable');
  sourceCtx.putImageData(imageData, 0, 0);

  const destCanvas = document.createElement('canvas');
  destCanvas.width = destWidth;
  destCanvas.height = destHeight;
  const ctx = destCanvas.getContext('2d');
  if (!ctx) throw new Error('rotateFlip: 2D context unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.save();
  ctx.translate(destWidth / 2, destHeight / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(sourceCanvas, -sourceWidth / 2, -sourceHeight / 2);
  ctx.restore();

  const outputType = options.outputType ?? 'image/png';
  const quality = outputType === 'image/png' ? undefined : (options.quality ?? 0.92);
  const blob = await canvasToBlob(destCanvas, outputType, quality);
  return { blob, width: destWidth, height: destHeight, outputType };
}
