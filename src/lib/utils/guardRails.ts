export const MAX_IMAGE_BYTES = 100 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
export const WARN_IMAGE_BYTES = 50 * 1024 * 1024;
export const WARN_VIDEO_BYTES = 200 * 1024 * 1024;
export const WARN_MOBILE_IMAGE_PIXELS = 20 * 1024 * 1024;

export type GuardVerdict = 'ok' | 'warn' | 'block';

export interface GuardResult {
  verdict: GuardVerdict;
  reason: string | null;
}

export function checkFileSize(
  file: File | Blob,
  maxBytes: number,
  warnBytes: number,
  label: string,
): GuardResult {
  if (file.size > maxBytes) {
    return {
      verdict: 'block',
      reason: `This ${label} is too large for browser processing (${formatBytes(file.size)}). Maximum is ${formatBytes(maxBytes)}.`,
    };
  }
  if (file.size > warnBytes) {
    return {
      verdict: 'warn',
      reason: `This ${label} is large (${formatBytes(file.size)}). Processing may take a while or fail on memory-constrained devices.`,
    };
  }
  return { verdict: 'ok', reason: null };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
