import { fetchFile } from '@ffmpeg/util';
import { attachProgress, getFFmpeg } from '../../engines/ffmpeg';

export type AudioFormat = 'mp3' | 'wav' | 'aac';

export interface ExtractAudioOptions {
  format?: AudioFormat;
  bitrate?: string;
  onProgress?: (pct: number) => void;
}

const INPUT_EXTENSIONS = ['mp4', 'mov', 'webm', 'mkv', 'avi', 'flv', 'm4v', 'mpeg', 'mpg'];

const MIME_TYPES: Record<AudioFormat, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  aac: 'audio/aac',
};

const CODECS: Record<AudioFormat, string> = {
  mp3: 'libmp3lame',
  wav: 'pcm_s16le',
  aac: 'aac',
};

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

export async function extractAudio(
  file: File | Blob,
  options: ExtractAudioOptions = {},
): Promise<Blob> {
  const { format = 'mp3', bitrate = '192k', onProgress } = options;
  const ffmpeg = await getFFmpeg();
  const detach = onProgress ? attachProgress(ffmpeg, onProgress) : null;

  const inputName = `input.${inferExtension(file, 'mp4')}`;
  const outputName = `output.${format}`;

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    const args = ['-i', inputName, '-vn', '-c:a', CODECS[format]];
    if (format === 'mp3' || format === 'aac') {
      args.push('-b:a', bitrate);
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
