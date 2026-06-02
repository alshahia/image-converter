import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

const CORE_BASE = '/ffmpeg';

async function loadCore(ffmpeg: FFmpeg): Promise<void> {
  await ffmpeg.load({
    coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
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
      ffmpeg.on('log', ({ message }) => options.onLog?.(message));
    }
    await loadCore(ffmpeg);
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return loadingPromise;
}

export function attachProgress(ffmpeg: FFmpeg, onProgress: (pct: number) => void): () => void {
  const handler = ({ progress }: { progress: number }) => {
    const pct = Math.max(0, Math.min(100, progress * 100));
    onProgress(pct);
  };
  ffmpeg.on('progress', handler);
  return () => ffmpeg.off('progress', handler);
}

export function isFFmpegLoaded(): boolean {
  return ffmpegInstance !== null;
}
