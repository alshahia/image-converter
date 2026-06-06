import { runFFmpeg } from '../../engines/videoOps';

export interface MuteVideoOptions {
  onProgress?: (pct: number) => void;
}

export async function muteVideo(file: File | Blob, options: MuteVideoOptions = {}): Promise<Blob> {
  const { onProgress } = options;
  return runFFmpeg(file, {
    outputName: 'output.mp4',
    outputMimeType: 'video/mp4',
    args: (input, output) => [
      '-i',
      input,
      '-an',
      '-c:v',
      'copy',
      '-movflags',
      '+faststart',
      output,
    ],
    onProgress,
  });
}
