import { fetchFile } from '@ffmpeg/util';
import { attachProgress, getFFmpeg } from '../../engines/ffmpeg';

export interface VideoToGifOptions {
  width?: number;
  fps?: number;
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

export async function videoToGif(
  file: File | Blob,
  options: VideoToGifOptions = {},
): Promise<Blob> {
  const { width = 480, fps = 15, onProgress } = options;
  const ffmpeg = await getFFmpeg();
  const detach = onProgress ? attachProgress(ffmpeg, onProgress) : null;

  const inputName = `input.${inferExtension(file, 'mp4')}`;
  const paletteName = 'palette.png';
  const outputName = 'output.gif';
  const filterChain = `fps=${fps},scale=${width}:-1:flags=lanczos`;

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec([
      '-i',
      inputName,
      '-vf',
      `${filterChain},palettegen=stats_mode=diff`,
      '-y',
      paletteName,
    ]);
    await ffmpeg.exec([
      '-i',
      inputName,
      '-i',
      paletteName,
      '-lavfi',
      `${filterChain} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5`,
      '-y',
      outputName,
    ]);
    const data = await ffmpeg.readFile(outputName);
    const buffer: ArrayBuffer = (
      data instanceof Uint8Array ? new Uint8Array(data) : new TextEncoder().encode(String(data))
    ).buffer as ArrayBuffer;
    return new Blob([buffer], { type: 'image/gif' });
  } finally {
    if (detach) detach();
    for (const name of [inputName, paletteName, outputName]) {
      try {
        await ffmpeg.deleteFile(name);
      } catch {
        // ignore
      }
    }
  }
}
