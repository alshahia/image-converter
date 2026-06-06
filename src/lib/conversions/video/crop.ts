import { runFFmpeg } from '../../engines/videoOps';

export interface VideoCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VideoCropOptions {
  rect: VideoCropRect;
  onProgress?: (pct: number) => void;
}

export async function cropVideo(file: File | Blob, options: VideoCropOptions): Promise<Blob> {
  const { rect, onProgress } = options;
  const w = Math.max(2, Math.floor(rect.width / 2) * 2);
  const h = Math.max(2, Math.floor(rect.height / 2) * 2);
  const x = Math.max(0, Math.floor(rect.x / 2) * 2);
  const y = Math.max(0, Math.floor(rect.y / 2) * 2);
  return runFFmpeg(file, {
    outputName: 'output.mp4',
    outputMimeType: 'video/mp4',
    args: (input, output) => [
      '-i',
      input,
      '-vf',
      `crop=${w}:${h}:${x}:${y}`,
      '-c:a',
      'copy',
      output,
    ],
    onProgress,
  });
}
