import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

const FFMPEG_CORE_BASE = '/ffmpeg';

export type ProgressHandler = (event: { progress: number; time: number }) => void;

export async function getFFmpeg(onProgress?: ProgressHandler): Promise<FFmpeg> {
  if (ffmpegInstance) {
    if (onProgress) ffmpegInstance.on('progress', onProgress);
    return ffmpegInstance;
  }
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const ffmpeg = new FFmpeg();
    if (onProgress) ffmpeg.on('progress', onProgress);

    const coreURL = await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, 'text/javascript');
    const wasmURL = await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm');

    await ffmpeg.load({ coreURL, wasmURL });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return loadingPromise;
}

export function isFFmpegLoaded(): boolean {
  return ffmpegInstance !== null;
}
