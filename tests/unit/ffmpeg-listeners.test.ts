import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ffmpegInstances: MockFFmpeg[] = [];

class MockFFmpeg {
  static instances: MockFFmpeg[] = ffmpegInstances;
  private listeners = new Map<string, Set<(event: unknown) => void>>();
  load = vi.fn(async () => {});
  terminate = vi.fn();
  exec = vi.fn();
  writeFile = vi.fn();
  readFile = vi.fn();
  deleteFile = vi.fn();
  on(event: string, handler: (e: unknown) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)?.add(handler);
  }
  off(event: string, handler: (e: unknown) => void) {
    this.listeners.get(event)?.delete(handler);
  }
  fire(event: string, payload: unknown) {
    for (const h of this.listeners.get(event) ?? []) h(payload);
  }
}

vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: vi.fn().mockImplementation(() => {
    const inst = new MockFFmpeg();
    ffmpegInstances.push(inst);
    return inst;
  }),
}));

vi.mock('@ffmpeg/util', () => ({
  toBlobURL: vi.fn(async (url: string) => `blob:${url}`),
}));

// Import AFTER mocks are set up
const ffmpegModule = await import('../../src/lib/engines/ffmpeg');
const { onProgressFFmpeg, onLogFFmpeg, terminateFFmpeg, getFFmpeg } = ffmpegModule;

describe('ffmpeg listener persistence (H-5)', () => {
  beforeEach(() => {
    ffmpegInstances.length = 0;
    terminateFFmpeg();
  });

  afterEach(() => {
    terminateFFmpeg();
  });

  it('onProgress callbacks survive terminateFFmpeg + re-init', async () => {
    const cb = vi.fn();
    const detach = onProgressFFmpeg(cb);
    void getFFmpeg();
    const firstInstance = ffmpegInstances[0];
    if (!firstInstance) throw new Error('first instance not created');

    firstInstance.fire('progress', { progress: 0.5 });
    expect(cb).toHaveBeenCalledWith(50);

    // Simulate cleanup (e.g. on Cancel) and re-initialization
    terminateFFmpeg();
    cb.mockClear();

    // The same callback should be re-bound to the new instance
    void getFFmpeg();
    const secondInstance = ffmpegInstances[1];
    if (!secondInstance) throw new Error('second instance not created');
    expect(secondInstance).not.toBe(firstInstance);

    secondInstance.fire('progress', { progress: 0.25 });
    expect(cb).toHaveBeenCalledWith(25);

    detach();
  });

  it('onLog callbacks survive terminateFFmpeg + re-init', async () => {
    const cb = vi.fn();
    onLogFFmpeg(cb);
    void getFFmpeg();
    const first = ffmpegInstances[0];
    if (!first) throw new Error('no first instance');
    first.fire('log', { message: 'hello' });
    expect(cb).toHaveBeenCalledWith('hello');

    terminateFFmpeg();
    cb.mockClear();

    void getFFmpeg();
    const second = ffmpegInstances[1];
    if (!second) throw new Error('no second instance');
    second.fire('log', { message: 'world' });
    expect(cb).toHaveBeenCalledWith('world');
  });

  it('detaching a callback stops it from firing', async () => {
    const cb = vi.fn();
    const detach = onProgressFFmpeg(cb);
    void getFFmpeg();
    const inst = ffmpegInstances[0];
    if (!inst) throw new Error('no instance');
    inst.fire('progress', { progress: 0.1 });
    expect(cb).toHaveBeenCalledTimes(1);
    detach();
    inst.fire('progress', { progress: 0.2 });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('multiple subscribers all receive progress events', async () => {
    const a = vi.fn();
    const b = vi.fn();
    onProgressFFmpeg(a);
    onProgressFFmpeg(b);
    void getFFmpeg();
    const inst = ffmpegInstances[0];
    if (!inst) throw new Error('no instance');
    inst.fire('progress', { progress: 0.75 });
    expect(a).toHaveBeenCalledWith(75);
    expect(b).toHaveBeenCalledWith(75);
  });

  it('clamps progress to [0, 100]', async () => {
    const cb = vi.fn();
    onProgressFFmpeg(cb);
    void getFFmpeg();
    const inst = ffmpegInstances[0];
    if (!inst) throw new Error('no instance');
    inst.fire('progress', { progress: -0.5 });
    expect(cb).toHaveBeenCalledWith(0);
    inst.fire('progress', { progress: 1.5 });
    expect(cb).toHaveBeenLastCalledWith(100);
  });
});
