import { fetchFile } from '@ffmpeg/util';
import { attachProgress, getFFmpeg } from '../../engines/ffmpeg';
import { inferVideoExtension } from '../../utils/video';

export type AudioFormat = 'mp3' | 'wav' | 'aac' | 'm4a';

export interface ExtractAudioOptions {
  format?: AudioFormat;
  bitrate?: string;
  onProgress?: (pct: number) => void;
}

const MIME_TYPES: Record<AudioFormat, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
};

const CODECS: Record<AudioFormat, string> = {
  mp3: 'libmp3lame',
  wav: 'pcm_s16le',
  aac: 'aac',
  m4a: 'aac',
};

export async function extractAudio(
  file: File | Blob,
  options: ExtractAudioOptions = {},
): Promise<Blob> {
  const { format = 'mp3', bitrate = '192k', onProgress } = options;
  const ffmpeg = await getFFmpeg();
  const detach = onProgress ? attachProgress(ffmpeg, onProgress) : null;

  const inputName = `input.${inferVideoExtension(file, 'mp4')}`;
  const outputName = `output.${format}`;

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    const args = ['-i', inputName, '-vn', '-c:a', CODECS[format]];
    if (format === 'mp3' || format === 'aac' || format === 'm4a') {
      args.push('-b:a', bitrate);
    }
    if (format === 'm4a') {
      args.push('-f', 'mp4', '-movflags', '+faststart');
    }
    args.push('-y', outputName);
    await ffmpeg.exec(args);
    const data = await ffmpeg.readFile(outputName);
    const buffer: ArrayBuffer = (
      data instanceof Uint8Array ? new Uint8Array(data) : new TextEncoder().encode(String(data))
    ).buffer as ArrayBuffer;
    return new Blob([buffer], { type: MIME_TYPES[format] });
  } finally {
    if (detach) detach();
    for (const name of [inputName, outputName]) {
      try {
        await ffmpeg.deleteFile(name);
      } catch {
        // ignore
      }
    }
  }
}
