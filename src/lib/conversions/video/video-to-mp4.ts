import { fetchFile } from '@ffmpeg/util';
import { attachProgress, getFFmpeg } from '../../engines/ffmpeg';
import { inferVideoExtension } from '../../utils/video';

export type Mp4Preset = 'ultrafast' | 'fast' | 'medium';

export interface VideoToMp4Options {
  preset?: Mp4Preset;
  onProgress?: (pct: number) => void;
}

export async function videoToMp4(
  file: File | Blob,
  options: VideoToMp4Options = {},
): Promise<Blob> {
  const { preset = 'fast', onProgress } = options;
  const ffmpeg = await getFFmpeg();
  const detach = onProgress ? attachProgress(ffmpeg, onProgress) : null;

  const inputName = `input.${inferVideoExtension(file, 'mp4')}`;
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
