import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  convertImageBuffer,
  terminateWorker,
} from '../../src/lib/engines/jsquash';

class MockWorker {
  static instances: MockWorker[] = [];
  url: string | URL;
  options: WorkerOptions | undefined;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  onmessageerror: ((e: MessageEvent) => void) | null = null;
  listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();

  constructor(url: string | URL, options?: WorkerOptions) {
    this.url = url;
    this.options = options;
    MockWorker.instances.push(this);
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)?.add(listener);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    this.listeners.get(type)?.delete(listener);
  }

  postMessage = vi.fn();
  terminate = vi.fn();

  fire(type: string, event: Event) {
    for (const listener of this.listeners.get(type) ?? []) {
      if (typeof listener === 'function') listener(event);
    }
  }
}

describe('jsquash worker error handling (H-1)', () => {
  let RealWorker: typeof Worker;

  beforeEach(() => {
    RealWorker = globalThis.Worker;
    (globalThis as unknown as { Worker: unknown }).Worker = MockWorker;
    MockWorker.instances = [];
  });

  afterEach(() => {
    (globalThis as unknown as { Worker: typeof Worker }).Worker = RealWorker;
    terminateWorker();
  });

  it('rejects pending convertImageBuffer() when the worker errors', async () => {
    const pending = convertImageBuffer(new ArrayBuffer(8), {
      from: 'jpeg',
      to: 'png',
    });

    // Wait one microtask so runOnWorker has registered the pending entry
    await new Promise((r) => setTimeout(r, 0));

    const w = MockWorker.instances[0];
    if (!w) throw new Error('mock worker not instantiated');
    w.fire('error', new ErrorEvent('error', { message: 'worker exploded' }));

    await expect(pending).rejects.toThrow(/worker.*error|exploded|terminated/i);
  });

  it('rejects all pending promises (not just the first) on error', async () => {
    const p1 = convertImageBuffer(new ArrayBuffer(8), { from: 'jpeg', to: 'png' });
    const p2 = convertImageBuffer(new ArrayBuffer(8), { from: 'png', to: 'webp' });

    await new Promise((r) => setTimeout(r, 0));

    const w = MockWorker.instances[0];
    if (!w) throw new Error('mock worker not instantiated');
    w.fire('error', new ErrorEvent('error', { message: 'oops' }));

    await expect(p1).rejects.toThrow();
    await expect(p2).rejects.toThrow();
  });

  it('rejects on messageerror (un-deserializable message)', async () => {
    const pending = convertImageBuffer(new ArrayBuffer(8), { from: 'jpeg', to: 'png' });
    await new Promise((r) => setTimeout(r, 0));

    const w = MockWorker.instances[0];
    if (!w) throw new Error('mock worker not instantiated');
    w.fire('messageerror', new MessageEvent('messageerror', { data: null }));

    await expect(pending).rejects.toThrow();
  });
});
