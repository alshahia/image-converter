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

import { cropVideo } from '../../src/lib/conversions/video/crop';
import { muteVideo } from '../../src/lib/conversions/video/mute';
import { resizeVideo } from '../../src/lib/conversions/video/resize';
import { rotateVideo } from '../../src/lib/conversions/video/rotate';
import { changeVideoSpeed } from '../../src/lib/conversions/video/speed';
import { videoToWebm } from '../../src/lib/conversions/video/to-webm';
import { trimVideo } from '../../src/lib/conversions/video/trim';

function makeFile(): File {
  const file = new File(['fake'], 'test.mp4', { type: 'video/mp4' });
  Object.defineProperty(file, 'name', { value: 'test.mp4', configurable: true });
  return file;
}

function execArgs(): string[] {
  return mockExec.mock.calls[0]?.[0] as string[];
}

beforeEach(() => {
  vi.clearAllMocks();
  mockReadFile.mockResolvedValue(new Uint8Array([0, 1, 2]));
});

describe('trimVideo', () => {
  it('produces video/mp4 blob', async () => {
    const blob = await trimVideo(makeFile(), { startSec: 1, endSec: 3 });
    expect(blob.type).toBe('video/mp4');
  });

  it('uses -ss, -t, and -c copy', async () => {
    await trimVideo(makeFile(), { startSec: 1, endSec: 4 });
    const args = execArgs();
    expect(args).toContain('-ss');
    expect(args).toContain('1.000');
    expect(args).toContain('-t');
    expect(args).toContain('3.000');
    expect(args).toContain('copy');
  });
});

describe('cropVideo', () => {
  it('produces video/mp4 blob', async () => {
    const blob = await cropVideo(makeFile(), {
      rect: { x: 10, y: 20, width: 100, height: 80 },
    });
    expect(blob.type).toBe('video/mp4');
  });

  it('rounds rect dimensions to even and embeds in crop filter', async () => {
    await cropVideo(makeFile(), {
      rect: { x: 10, y: 20, width: 101, height: 81 },
    });
    const args = execArgs();
    const filter = args[args.indexOf('-vf') + 1] as string;
    expect(filter).toMatch(/^crop=\d+:\d+:\d+:\d+$/);
  });
});

describe('rotateVideo', () => {
  it.each([
    [0, '0'],
    [90, '1'],
    [180, '2'],
    [270, '3'],
  ] as const)('maps %i° to transpose %s', async (deg, code) => {
    await rotateVideo(makeFile(), { degrees: deg });
    const args = execArgs();
    expect(args).toContain(`transpose=${code}`);
  });
});

describe('muteVideo', () => {
  it('produces video/mp4 blob', async () => {
    const blob = await muteVideo(makeFile());
    expect(blob.type).toBe('video/mp4');
  });

  it('uses -an and -c:v copy', async () => {
    await muteVideo(makeFile());
    const args = execArgs();
    expect(args).toContain('-an');
    expect(args).toContain('copy');
  });
});

describe('changeVideoSpeed', () => {
  it('skips re-encode for factor=1 (stream copy)', async () => {
    await changeVideoSpeed(makeFile(), { factor: 1 });
    const args = execArgs();
    expect(args).toContain('copy');
  });

  it('re-encodes with setpts + atempo for factor != 1', async () => {
    await changeVideoSpeed(makeFile(), { factor: 2 });
    const args = execArgs();
    const vFilter = args[args.indexOf('-filter:v') + 1] as string;
    const aFilter = args[args.indexOf('-filter:a') + 1] as string;
    expect(vFilter).toMatch(/^setpts=0\.5+0*\*PTS$/);
    expect(aFilter).toContain('atempo=2');
  });

  it('chains atempo for factor > 2 (e.g. 4×)', async () => {
    await changeVideoSpeed(makeFile(), { factor: 4 });
    const args = execArgs();
    const aFilter = args[args.indexOf('-filter:a') + 1] as string;
    expect(aFilter).toContain('atempo=2');
    expect(aFilter.split('atempo=').length - 1).toBe(2);
  });
});

describe('resizeVideo', () => {
  it('produces video/mp4 blob', async () => {
    const blob = await resizeVideo(makeFile(), { width: 640, height: 360 });
    expect(blob.type).toBe('video/mp4');
  });

  it('uses scale filter with given dimensions', async () => {
    await resizeVideo(makeFile(), { width: 1280, height: 720 });
    const args = execArgs();
    const filter = args[args.indexOf('-vf') + 1] as string;
    expect(filter).toContain('scale=1280:720');
  });

  it('uses pad filter when keepAspect=true', async () => {
    await resizeVideo(makeFile(), { width: 1280, height: 720, keepAspect: true });
    const args = execArgs();
    const filter = args[args.indexOf('-vf') + 1] as string;
    expect(filter).toContain('pad=');
  });
});

describe('videoToWebm', () => {
  it('produces video/webm blob', async () => {
    const blob = await videoToWebm(makeFile());
    expect(blob.type).toBe('video/webm');
  });

  it('uses libvpx-vp9 and libopus', async () => {
    await videoToWebm(makeFile());
    const args = execArgs();
    expect(args).toContain('libvpx-vp9');
    expect(args).toContain('libopus');
  });

  it('respects custom crf', async () => {
    await videoToWebm(makeFile(), { crf: 24 });
    const args = execArgs();
    const idx = args.indexOf('-crf');
    expect(args[idx + 1]).toBe('24');
  });
});
