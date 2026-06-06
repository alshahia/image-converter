import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

const CORE_BASE = '/ffmpeg';

/**
 * Module-scoped subscriber sets for progress and log events. The handlers
 * that forward events to these sets are bound to the FFmpeg instance inside
 * `bindInstanceListeners()` after each new instance is constructed, so
 * subscribers survive `terminateFFmpeg()` + re-init.
 */
const progressSubs = new Set<(pct: number) => void>();
const logSubs = new Set<(message: string) => void>();

async function loadCore(ffmpeg: FFmpeg): Promise<void> {
  await ffmpeg.load({
    coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
  });
}

function bindInstanceListeners(ffmpeg: FFmpeg): void {
  ffmpeg.on('progress', (event: unknown) => {
    const raw = (event as { progress?: number }).progress ?? 0;
    const pct = Math.max(0, Math.min(100, raw * 100));
    for (const cb of progressSubs) cb(pct);
  });
  ffmpeg.on('log', (event: unknown) => {
    const message = (event as { message?: string }).message ?? '';
    for (const cb of logSubs) cb(message);
  });
}

export interface GetFFmpegOptions {
  onLog?: (message: string) => void;
}

export async function getFFmpeg(options: GetFFmpegOptions = {}): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const ffmpeg = new FFmpeg();
    if (options.onLog) {
      logSubs.add(options.onLog);
    }
    bindInstanceListeners(ffmpeg);
    await loadCore(ffmpeg);
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return loadingPromise;
}

/**
 * Register a progress callback that survives `terminateFFmpeg()`.
 * Returns a detacher that removes the callback from the subscriber set.
 */
export function onProgressFFmpeg(cb: (pct: number) => void): () => void {
  progressSubs.add(cb);
  return () => {
    progressSubs.delete(cb);
  };
}

/**
 * Register a log callback that survives `terminateFFmpeg()`.
 * Returns a detacher that removes the callback from the subscriber set.
 */
export function onLogFFmpeg(cb: (message: string) => void): () => void {
  logSubs.add(cb);
  return () => {
    logSubs.delete(cb);
  };
}

export function terminateFFmpeg(): void {
  if (ffmpegInstance) {
    ffmpegInstance.terminate();
    ffmpegInstance = null;
  }
  loadingPromise = null;
}

export function isFFmpegLoaded(): boolean {
  return ffmpegInstance !== null;
}
