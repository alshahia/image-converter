import { runFFmpeg } from '../../engines/videoOps';

export interface VideoResizeOptions {
  width: number;
  height: number;
  keepAspect?: boolean;
  onProgress?: (pct: number) => void;
}

export async function resizeVideo(file: File | Blob, options: VideoResizeOptions): Promise<Blob> {
  const { width, height, keepAspect = true, onProgress } = options;
  const filter = keepAspect
    ? `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`
    : `scale=${width}:${height}`;
  return runFFmpeg(file, {
    outputName: 'output.mp4',
    outputMimeType: 'video/mp4',
    args: (input, output) => ['-i', input, '-vf', filter, '-c:a', 'copy', output],
    onProgress,
  });
}
