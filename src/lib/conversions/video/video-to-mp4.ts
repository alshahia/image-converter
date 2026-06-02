import { fetchFile } from '@ffmpeg/util';
import { attachProgress, getFFmpeg } from '../../engines/ffmpeg';

export type Mp4Preset = 'ultrafast' | 'fast' | 'medium';

export interface VideoToMp4Options {
  preset?: Mp4Preset;
  onProgress?: (pct: number) => void;
}

const INPUT_EXTENSIONS = ['mp4', 'mov', 'webm', 'mkv', 'avi', 'flv', 'm4v', 'mpeg', 'mpg'];

function inferExtension(file: File | Blob, fallback: string): string {
  const fromName = file instanceof File ? file.name.split('.').pop()?.toLowerCase() : undefined;
  if (fromName && INPUT_EXTENSIONS.includes(fromName)) return fromName;
  const fromType = file.type;
  if (fromType === 'video/mp4') return 'mp4';
  if (fromType === 'video/quicktime') return 'mov';
  if (fromType === 'video/webm') return 'webm';
  if (fromType === 'video/x-matroska') return 'mkv';
  return fallback;
}

export async function videoToMp4(
  file: File | Blob,
  options: VideoToMp4Options = {},
): Promise<Blob> {
  const { preset = 'fast', onProgress } = options;
  const ffmpeg = await getFFmpeg();
  const detach = onProgress ? attachProgress(ffmpeg, onProgress) : null;

  const inputName = `input.${inferExtension(file, 'mp4')}`;
  const outputName = 'output.mp4';

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec([
      '-i',
      inputName,
      '-c:v',
      'libx264',
      '-preset',
      preset,
      '-crf',
      '23',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      outputName,
    ]);
    const data = await ffmpeg.readFile(outputName);
    const buffer: ArrayBuffer = (
      data instanceof Uint8Array ? new Uint8Array(data) : new TextEncoder().encode(String(data))
    ).buffer as ArrayBuffer;
    return new Blob([buffer], { type: 'video/mp4' });
  } finally {
    if (detach) detach();
    try {
      await ffmpeg.deleteFile(inputName);
    } catch {
      // ignore
    }
    try {
      await ffmpeg.deleteFile(outputName);
    } catch {
      // ignore
    }
  }
}
