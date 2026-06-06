import { fetchFile } from '@ffmpeg/util';
import JSZip from 'jszip';
import { getFFmpeg, onProgressFFmpeg } from '../../engines/ffmpeg';
import { inferVideoExtension } from '../../utils/video';

export interface ExtractFramesOptions {
  intervalSec: number;
  onProgress?: (pct: number) => void;
}

export async function extractFrames(
  file: File | Blob,
  options: ExtractFramesOptions,
): Promise<Blob> {
  const { intervalSec, onProgress } = options;
  const fps = intervalSec > 0 ? 1 / intervalSec : 1;
  const ffmpeg = await getFFmpeg();
  const detach = onProgress ? onProgressFFmpeg(onProgress) : null;
  const inputName = `input.${inferVideoExtension(file, 'mp4')}`;
  const pattern = 'frame_%04d.png';

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec(['-i', inputName, '-vf', `fps=${fps}`, '-vsync', 'vfr', pattern]);
    const zip = new JSZip();
    let index = 1;
    for (;;) {
      const name = `frame_${String(index).padStart(4, '0')}.png`;
      try {
        const data = await ffmpeg.readFile(name);
        if (!(data instanceof Uint8Array)) {
          break;
        }
        const copy = new Uint8Array(data.byteLength);
        copy.set(data);
        zip.file(name, copy);
        index += 1;
      } catch {
        break;
      }
    }
    return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  } finally {
    if (detach) detach();
    try {
      await ffmpeg.deleteFile(inputName);
    } catch {
      // ignore
    }
    for (let i = 1; i < 1000; i += 1) {
      const name = `frame_${String(i).padStart(4, '0')}.png`;
      try {
        await ffmpeg.deleteFile(name);
      } catch {
        // ignore
      }
    }
  }
}
