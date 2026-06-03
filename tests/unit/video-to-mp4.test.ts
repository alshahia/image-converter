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

import { videoToMp4 } from '../../src/lib/conversions/video/video-to-mp4';

function mp4Blob(_seconds = 2): Blob & { name: string } {
  const blob = new Blob(['fake-video-data'], { type: 'video/mp4' });
  Object.defineProperty(blob, 'name', { value: 'test.mp4', configurable: true });
  return blob as Blob & { name: string };
}

describe('videoToMp4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadFile.mockResolvedValue(new Uint8Array([0, 1, 2]));
  });

  it('produces a Blob with video/mp4 type', async () => {
    const result = await videoToMp4(mp4Blob());
    expect(result.type).toBe('video/mp4');
  });

  it('passes default preset fast to ffmpeg', async () => {
    await videoToMp4(mp4Blob());
    const args = mockExec.mock.calls[0]?.[0] as string[] | undefined;
    expect(args).toContain('-preset');
    expect(args).toContain('fast');
  });

  it('accepts custom preset option', async () => {
    await videoToMp4(mp4Blob(), { preset: 'ultrafast' });
    const args = mockExec.mock.calls[0]?.[0] as string[] | undefined;
    expect(args).toContain('ultrafast');
  });

  it('includes h264 + aac codec settings', async () => {
    await videoToMp4(mp4Blob());
    const args = mockExec.mock.calls[0]?.[0] as string[] | undefined;
    expect(args).toContain('libx264');
    expect(args).toContain('aac');
  });

  it('cleans up temp files', async () => {
    await videoToMp4(mp4Blob());
    expect(mockDeleteFile).toHaveBeenCalled();
  });
});
