import { runFFmpeg } from '../../engines/videoOps';

export interface VideoSpeedOptions {
  factor: number;
  onProgress?: (pct: number) => void;
}

function atempoChain(factor: number): string {
  if (factor <= 0) {
    throw new Error('Speed factor must be > 0');
  }
  const chain: number[] = [];
  let remaining = factor;
  while (remaining > 2.0) {
    chain.push(2.0);
    remaining /= 2.0;
  }
  while (remaining < 0.5) {
    chain.push(0.5);
    remaining *= 2.0;
  }
  chain.push(Number(remaining.toFixed(3)));
  return chain.map((v) => `atempo=${v}`).join(',');
}

export async function changeVideoSpeed(
  file: File | Blob,
  options: VideoSpeedOptions,
): Promise<Blob> {
  const { factor, onProgress } = options;
  if (factor === 1) {
    return runFFmpeg(file, {
      outputName: 'output.mp4',
      outputMimeType: 'video/mp4',
      args: (input, output) => ['-i', input, '-c', 'copy', '-movflags', '+faststart', output],
      onProgress,
    });
  }
  const atempo = atempoChain(factor);
  return runFFmpeg(file, {
    outputName: 'output.mp4',
    outputMimeType: 'video/mp4',
    args: (input, output) => [
      '-i',
      input,
      '-filter:v',
      `setpts=${(1 / factor).toFixed(6)}*PTS`,
      '-filter:a',
      atempo,
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '23',
      '-c:a',
      'aac',
      output,
    ],
    onProgress,
  });
}
