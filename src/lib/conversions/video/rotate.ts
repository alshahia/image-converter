import { runFFmpeg } from '../../engines/videoOps';

export type VideoRotate = 0 | 90 | 180 | 270;

export interface VideoRotateOptions {
  degrees: VideoRotate;
  onProgress?: (pct: number) => void;
}

function transposeFor(degrees: VideoRotate): 0 | 1 | 2 | 3 {
  switch (degrees) {
    case 90:
      return 1;
    case 180:
      return 2;
    case 270:
      return 3;
    default:
      return 0;
  }
}

export async function rotateVideo(file: File | Blob, options: VideoRotateOptions): Promise<Blob> {
  const { degrees, onProgress } = options;
  const transpose = transposeFor(degrees);
  return runFFmpeg(file, {
    outputName: 'output.mp4',
    outputMimeType: 'video/mp4',
    args: (input, output) => ['-i', input, '-vf', `transpose=${transpose}`, '-c:a', 'copy', output],
    onProgress,
  });
}
