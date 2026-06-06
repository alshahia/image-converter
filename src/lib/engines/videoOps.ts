import { fetchFile } from '@ffmpeg/util';
import { inferVideoExtension } from '../utils/video';
import { getFFmpeg, onProgressFFmpeg } from './ffmpeg';

export interface RunFFmpegOptions {
  inputName?: string;
  outputName: string;
  outputMimeType: string;
  args: (input: string, output: string) => string[];
  onProgress?: (pct: number) => void;
}

function readToBlob(data: unknown, mime: string): Blob {
  if (data instanceof Uint8Array) {
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    return new Blob([copy], { type: mime });
  }
  return new Blob([new TextEncoder().encode(String(data))], { type: mime });
}

export async function runFFmpeg(file: File | Blob, options: RunFFmpegOptions): Promise<Blob> {
  const { inputName, outputName, outputMimeType, args, onProgress } = options;
  const ffmpeg = await getFFmpeg();
  const detach = onProgress ? onProgressFFmpeg(onProgress) : null;
  const input = inputName ?? `input.${inferVideoExtension(file, 'mp4')}`;

  try {
    await ffmpeg.writeFile(input, await fetchFile(file));
    await ffmpeg.exec(args(input, outputName));
    const data = await ffmpeg.readFile(outputName);
    return readToBlob(data, outputMimeType);
  } finally {
    if (detach) detach();
    for (const name of [input, outputName]) {
      try {
        await ffmpeg.deleteFile(name);
      } catch {
        // ignore
      }
    }
  }
}
