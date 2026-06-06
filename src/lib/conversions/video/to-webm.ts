import { runFFmpeg } from '../../engines/videoOps';

export interface VideoToWebmOptions {
  crf?: number;
  onProgress?: (pct: number) => void;
}

export async function videoToWebm(
  file: File | Blob,
  options: VideoToWebmOptions = {},
): Promise<Blob> {
  const { crf = 30, onProgress } = options;
  return runFFmpeg(file, {
    outputName: 'output.webm',
    outputMimeType: 'video/webm',
    args: (input, output) => [
      '-i',
      input,
      '-c:v',
      'libvpx-vp9',
      '-crf',
      String(crf),
      '-b:v',
      '0',
      '-row-mt',
      '1',
      '-c:a',
      'libopus',
      output,
    ],
    onProgress,
  });
}
