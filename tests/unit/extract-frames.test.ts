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

import { extractFrames } from '../../src/lib/conversions/video/extract-frames';

function makeFile(): File {
  const file = new File(['fake'], 'test.mp4', { type: 'video/mp4' });
  Object.defineProperty(file, 'name', { value: 'test.mp4', configurable: true });
  return file;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('extractFrames', () => {
  it('produces a ZIP blob (application/zip)', async () => {
    mockReadFile.mockImplementation(async (name: string) => {
      if (typeof name === 'string' && name.startsWith('frame_')) {
        return new Uint8Array([10, 20, 30]);
      }
      return new Uint8Array();
    });
    const blob = await extractFrames(makeFile(), { intervalSec: 1 });
    expect(blob.type).toBe('application/zip');
  });

  it('issues fps filter based on intervalSec', async () => {
    mockReadFile.mockResolvedValue(new Uint8Array());
    await extractFrames(makeFile(), { intervalSec: 2 });
    const args = mockExec.mock.calls[0]?.[0] as string[];
    expect(args).toContain('fps=0.5');
  });
});
