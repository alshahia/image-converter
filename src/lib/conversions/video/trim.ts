import { runFFmpeg } from '../../engines/videoOps';

export interface TrimOptions {
  startSec: number;
  endSec: number;
  onProgress?: (pct: number) => void;
}

export async function trimVideo(file: File | Blob, options: TrimOptions): Promise<Blob> {
  const { startSec, endSec, onProgress } = options;
  const duration = Math.max(0, endSec - startSec);
  return runFFmpeg(file, {
    outputName: 'output.mp4',
    outputMimeType: 'video/mp4',
    args: (input, output) => [
      '-ss',
      startSec.toFixed(3),
      '-i',
      input,
      '-t',
      duration.toFixed(3),
      '-c',
      'copy',
      '-movflags',
      '+faststart',
      output,
    ],
    onProgress,
  });
}
