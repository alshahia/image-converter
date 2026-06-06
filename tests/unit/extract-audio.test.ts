import { beforeEach, describe, expect, it, vi } from 'vitest';
import { extractAudio } from '../../src/lib/conversions/video/extract-audio';

const writeFile = vi.fn();
const exec = vi.fn();
const readFile = vi.fn();
const deleteFile = vi.fn().mockResolvedValue(undefined);
const ffmpegInstance = {
  writeFile,
  exec,
  readFile,
  deleteFile,
};

vi.mock('../../src/lib/engines/ffmpeg', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/engines/ffmpeg')>(
    '../../src/lib/engines/ffmpeg',
  );
  return {
    ...actual,
    getFFmpeg: vi.fn(async () => ffmpegInstance),
    onProgressFFmpeg: vi.fn(() => () => {}),
  };
});

function mp4Blob(_seconds = 2): Blob & { name: string } {
  const blob = new Blob(['fake-video-data'], { type: 'video/mp4' });
  Object.defineProperty(blob, 'name', { value: 'test.mp4', configurable: true });
  return blob as Blob & { name: string };
}

beforeEach(() => {
  writeFile.mockReset().mockResolvedValue(undefined);
  exec.mockReset().mockResolvedValue(undefined);
  readFile.mockReset();
  deleteFile.mockReset().mockResolvedValue(undefined);
});

describe('extractAudio', () => {
  it('writes a temp input, runs ffmpeg, and returns the output blob', async () => {
    readFile.mockResolvedValueOnce(new Uint8Array([1, 2, 3, 4]));

    const result = await extractAudio(mp4Blob(8), { format: 'mp3' });

    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile.mock.calls[0]?.[0]).toBe('input.mp4');
    expect(exec).toHaveBeenCalledTimes(1);
    const args = exec.mock.calls[0]?.[0] as string[];
    expect(args).toContain('-i');
    expect(args).toContain('input.mp4');
    expect(args).toContain('-vn');
    expect(args).toContain('-c:a');
    expect(args).toContain('libmp3lame');
    expect(args).toContain('output.mp3');
    expect(args[args.length - 2]).toBe('-y');
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('audio/mpeg');
  });

  it('uses pcm_s16le for wav and skips -b:a', async () => {
    readFile.mockResolvedValueOnce(new Uint8Array([0xff]));

    const result = await extractAudio(mp4Blob(4), { format: 'wav' });

    const args = exec.mock.calls[0]?.[0] as string[];
    expect(args).toContain('pcm_s16le');
    expect(args).not.toContain('-b:a');
    expect(args).toContain('output.wav');
    expect(result.type).toBe('audio/wav');
  });

  it('re-muxes m4a via MP4 container with faststart flag', async () => {
    readFile.mockResolvedValueOnce(new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112]));

    const result = await extractAudio(mp4Blob(4), { format: 'm4a' });

    const args = exec.mock.calls[0]?.[0] as string[];
    expect(args).toContain('aac');
    expect(args).toContain('-f');
    expect(args).toContain('mp4');
    expect(args).toContain('-movflags');
    expect(args).toContain('+faststart');
    expect(args).toContain('-b:a');
    expect(args).toContain('output.m4a');
    expect(result.type).toBe('audio/mp4');
  });

  it('infers input extension from filename for non-mp4 containers', async () => {
    const movBlob = new Blob([new Uint8Array(8)], { type: 'video/quicktime' }) as unknown as File;
    Object.defineProperty(movBlob, 'name', { value: 'clip.mov' });
    readFile.mockResolvedValueOnce(new Uint8Array([0]));

    await extractAudio(movBlob, { format: 'mp3' });

    expect(writeFile.mock.calls[0]?.[0]).toBe('input.mov');
  });

  it('passes through custom bitrate', async () => {
    readFile.mockResolvedValueOnce(new Uint8Array([0]));

    await extractAudio(mp4Blob(4), { format: 'm4a', bitrate: '256k' });

    const args = exec.mock.calls[0]?.[0] as string[];
    expect(args).toContain('-b:a');
    expect(args).toContain('256k');
  });

  it('cleans up temp files even when exec fails', async () => {
    exec.mockRejectedValueOnce(new Error('ffmpeg failed'));

    await expect(extractAudio(mp4Blob(4), { format: 'mp3' })).rejects.toThrow('ffmpeg failed');
    expect(deleteFile).toHaveBeenCalledWith('input.mp4');
  });

  it('forwards onProgress values through the onProgressFFmpeg wrapper', async () => {
    const onProgress = vi.fn();
    const { onProgressFFmpeg } = await import('../../src/lib/engines/ffmpeg');
    vi.mocked(onProgressFFmpeg).mockClear();
    vi.mocked(onProgressFFmpeg).mockImplementationOnce((cb) => {
      cb(50);
      return () => {};
    });
    readFile.mockResolvedValueOnce(new Uint8Array([0]));

    await extractAudio(mp4Blob(4), { format: 'mp3', onProgress });
    expect(onProgress).toHaveBeenCalledWith(50);
  });
});
