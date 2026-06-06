import { type ImageFormat, mimeTypeFor } from '../../../engines/jsquash';
import { compressImage } from '../compress';

export interface SmartCompressOptions {
  targetSizeKB: number;
  maxIterations?: number;
  onProgress?: (pct: number) => void;
  signal?: AbortSignal;
}

const SUPPORTED_FORMATS: ReadonlyArray<ImageFormat> = ['jpeg', 'png', 'webp'];

function isSupportedFormat(mime: string): ImageFormat | null {
  for (const f of SUPPORTED_FORMATS) {
    if (mimeTypeFor(f) === mime) return f;
  }
  return null;
}

export async function smartCompress(file: Blob, opts: SmartCompressOptions): Promise<Blob> {
  const format = isSupportedFormat(file.type);
  if (!format) {
    throw new Error(`smart-compress only supports jpeg/png/webp. Got: ${file.type || 'unknown'}`);
  }
  const targetBytes = Math.max(1, opts.targetSizeKB) * 1024;
  const tolerance = 0.1;
  const maxIter = opts.maxIterations ?? 8;
  const fileObj = new File([file], 'input', { type: file.type });
  let lo = 0.3;
  let hi = 0.95;
  let best: Blob | null = null;
  let bestSize = Number.POSITIVE_INFINITY;
  for (let i = 0; i < maxIter; i++) {
    if (opts.signal?.aborted) throw new Error('Cancelled');
    const q = (lo + hi) / 2;
    const out = await compressImage(fileObj, { quality: q, format });
    opts.onProgress?.(Math.round(((i + 1) / maxIter) * 95));
    if (out.size < bestSize) {
      best = out;
      bestSize = out.size;
    }
    const upperBound = targetBytes * (1 + tolerance);
    if (out.size <= targetBytes) {
      hi = q;
    } else if (out.size > upperBound) {
      lo = q;
    } else {
      best = out;
      bestSize = out.size;
      break;
    }
  }
  if (!best) {
    throw new Error('smart-compress failed to find a result');
  }
  opts.onProgress?.(100);
  return best;
}
