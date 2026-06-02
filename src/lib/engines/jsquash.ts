import type { ConvertRequest, ConvertResponse, ImageFormat } from '../workers/image.worker';
import { stripExifFromJpeg } from './exif';

export type { ImageFormat } from '../workers/image.worker';

let workerInstance: Worker | null = null;
let nextId = 1;
const pending = new Map<number, (response: ConvertResponse) => void>();

function getWorker(): Worker {
  if (workerInstance) return workerInstance;
  workerInstance = new Worker(new URL('../workers/image.worker.ts', import.meta.url), {
    type: 'module',
    name: 'jsquash-image-worker',
  });
  workerInstance.addEventListener('message', (event: MessageEvent<ConvertResponse>) => {
    const { id } = event.data;
    const resolver = pending.get(id);
    if (!resolver) return;
    pending.delete(id);
    resolver(event.data);
  });
  return workerInstance;
}

function runOnWorker(request: Omit<ConvertRequest, 'id'>): Promise<ConvertResponse> {
  const id = nextId++;
  const full: ConvertRequest = { ...request, id };
  return new Promise((resolve) => {
    pending.set(id, resolve);
    getWorker().postMessage(full, [full.buffer]);
  });
}

export interface ConvertOptions {
  from: ImageFormat;
  to: ImageFormat;
  quality?: number;
}

export async function convertImageBuffer(
  buffer: ArrayBuffer,
  options: ConvertOptions,
): Promise<ArrayBuffer> {
  const response = await runOnWorker({
    from: options.from,
    to: options.to,
    buffer,
    quality: options.quality,
  });
  if (!response.ok) {
    throw new Error(response.error);
  }
  return response.buffer;
}

const MIME_TYPES: Record<ImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export function mimeTypeFor(format: ImageFormat): string {
  return MIME_TYPES[format];
}

export async function convertImage(input: Blob, options: ConvertOptions): Promise<Blob> {
  const inputBuffer = await input.arrayBuffer();
  const outputBuffer = await convertImageBuffer(inputBuffer, options);
  let blob = new Blob([outputBuffer], { type: MIME_TYPES[options.to] });
  if (options.to === 'jpeg') {
    blob = await stripExifFromJpeg(blob);
  }
  return blob;
}

export function terminateWorker(): void {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
  pending.clear();
}
