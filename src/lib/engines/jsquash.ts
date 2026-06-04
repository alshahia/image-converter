import type {
  ConvertRequest,
  ConvertResponse,
  ImageFormat,
  ResizeSpec,
} from '../workers/image.worker';
import { stripExifFromJpeg } from './exif';

export type { ImageFormat, ResizeSpec } from '../workers/image.worker';

let workerInstance: Worker | null = null;
let nextId = 1;
const pending = new Map<
  number,
  { resolve: (response: ConvertResponse) => void; reject: (reason: unknown) => void }
>();

function getWorker(): Worker {
  if (workerInstance) return workerInstance;
  workerInstance = new Worker(new URL('../workers/image.worker.ts', import.meta.url), {
    type: 'module',
    name: 'jsquash-image-worker',
  });
  workerInstance.addEventListener('message', (event: MessageEvent<ConvertResponse>) => {
    const { id } = event.data;
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    entry.resolve(event.data);
  });
  return workerInstance;
}

function runOnWorker(request: Omit<ConvertRequest, 'id'>): Promise<ConvertResponse> {
  const id = nextId++;
  const full: ConvertRequest = { ...request, id };
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage(full, [full.buffer]);
  });
}

export interface ConvertOptions {
  from: ImageFormat;
  to: ImageFormat;
  quality?: number;
  resize?: ResizeSpec;
}

export interface ConvertResult {
  buffer: ArrayBuffer;
  width: number;
  height: number;
}

export async function convertImageBuffer(
  buffer: ArrayBuffer,
  options: ConvertOptions,
): Promise<ConvertResult> {
  const response = await runOnWorker({
    from: options.from,
    to: options.to,
    buffer,
    quality: options.quality,
    resize: options.resize,
  });
  if (!response.ok) {
    throw new Error(response.error);
  }
  return { buffer: response.buffer, width: response.width, height: response.height };
}

const MIME_TYPES: Record<ImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  jxl: 'image/jxl',
};

export function mimeTypeFor(format: ImageFormat): string {
  return MIME_TYPES[format];
}

export async function convertImage(input: Blob, options: ConvertOptions): Promise<Blob> {
  const inputBuffer = await input.arrayBuffer();
  const { buffer } = await convertImageBuffer(inputBuffer, options);
  let blob = new Blob([buffer], { type: MIME_TYPES[options.to] });
  if (options.to === 'jpeg') {
    blob = await stripExifFromJpeg(blob);
  }
  return blob;
}

export function detectFormat(blob: Blob): ImageFormat | null {
  const mime = blob.type;
  if (mime === 'image/jpeg') return 'jpeg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/avif') return 'avif';
  if (mime === 'image/jxl') return 'jxl';
  return null;
}

export async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob);
    const result = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return result;
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const result = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(result);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for dimension detection'));
    };
    img.src = url;
  });
}

export function computeResizeToFit(
  original: { width: number; height: number },
  longestEdge: number,
): { width: number; height: number } {
  if (longestEdge <= 0) return original;
  const longest = Math.max(original.width, original.height);
  if (longest <= longestEdge) return original;
  const scale = longestEdge / longest;
  return {
    width: Math.max(1, Math.round(original.width * scale)),
    height: Math.max(1, Math.round(original.height * scale)),
  };
}

export function terminateWorker(): void {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
  for (const [, entry] of pending) {
    entry.reject(new Error('Conversion cancelled'));
  }
  pending.clear();
}
