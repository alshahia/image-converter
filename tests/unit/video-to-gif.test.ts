import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@ffmpeg/util', () => ({
  fetchFile: vi.fn((file) => file),
}));

const mockExec = vi.fn();
const mockWriteFile = vi.fn();
const mockReadFile = vi.fn();
const mockDeleteFile = vi.fn();
vi.mock('../../src/lib/engines/ffmpeg', () => ({
  getFFmpeg: vi.fn(() => ({
    exec: mockExec,
    writeFile: mockWriteFile,
    readFile: mockReadFile,
    deleteFile: mockDeleteFile,
  })),
  attachProgress: vi.fn(() => vi.fn()),
}));

import { videoToGif } from '../../src/lib/conversions/video/video-to-gif';

function mp4Blob(_seconds = 2): Blob & { name: string } {
  const blob = new Blob(['fake-video-data'], { type: 'video/mp4' });
  Object.defineProperty(blob, 'name', { value: 'test.mp4', configurable: true });
  return blob as Blob & { name: string };
}

describe('videoToGif', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadFile.mockResolvedValue(new Uint8Array([0, 1, 2]));
  });

  it('produces a Blob with image/gif type', async () => {
    const result = await videoToGif(mp4Blob());
    expect(result.type).toBe('image/gif');
    expect(result).toBeInstanceOf(Blob);
  });

  it('calls ffmpeg exec twice (palette gen + palette use)', async () => {
    await videoToGif(mp4Blob());
    expect(mockExec).toHaveBeenCalledTimes(2);
  });

  it('deletes temp files in finally block', async () => {
    await videoToGif(mp4Blob());
    expect(mockDeleteFile).toHaveBeenCalled();
  });

  it('passes custom width and fps to palette gen filter', async () => {
    await videoToGif(mp4Blob(2), { width: 640, fps: 10 });
    const paletteGenCall = mockExec.mock.calls[0]?.[0] as string[] | undefined;
    expect(paletteGenCall).toBeDefined();
    if (!paletteGenCall) throw new Error('expected paletteGenCall');
    const vfIndex = paletteGenCall.indexOf('-vf') + 1;
    expect(paletteGenCall[vfIndex]).toContain('fps=10');
    expect(paletteGenCall[vfIndex]).toContain('scale=640');
  });
});
