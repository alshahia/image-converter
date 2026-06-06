import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('onnxruntime-web', () => ({
  env: { wasm: { wasmPaths: {} } },
  InferenceSession: { create: vi.fn() },
}));

vi.mock('../../src/lib/engines/aiModels', () => ({
  getModel: (id: string) => ({
    id,
    displayName: id,
    bytes: 12,
    path: `/models/${id}.onnx`,
    license: 'MIT',
    attributionUrl: '',
    attributionName: '',
  }),
}));

import * as ort from 'onnxruntime-web';
import { loadModel, releaseAllModels } from '../../src/lib/engines/onnx';

describe('loadModel retry (M-5)', () => {
  beforeEach(() => {
    releaseAllModels();
    vi.mocked(ort.InferenceSession.create).mockReset();
    vi.mocked(ort.InferenceSession.create).mockResolvedValue({
      inputNames: [],
      outputNames: [],
      run: vi.fn(),
      release: vi.fn().mockResolvedValue(undefined),
    } as unknown as ort.InferenceSession);
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  it('retries transient fetch failures up to 3 times, then succeeds', async () => {
    const okBody = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));
        controller.close();
      },
    });
    const okResponse = new Response(okBody, {
      status: 200,
      headers: { 'content-length': '12' },
    });
    const fail = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('NetworkError'))
      .mockRejectedValueOnce(new Error('NetworkError'))
      .mockResolvedValueOnce(okResponse);
    globalThis.fetch = fail as unknown as typeof fetch;

    const session = await loadModel('silueta');
    expect(session).toBeDefined();
    expect(fail).toHaveBeenCalledTimes(3);
  });

  it('gives up after 3 failed attempts and throws', async () => {
    const fail = vi.fn<typeof fetch>().mockRejectedValue(new Error('NetworkError'));
    globalThis.fetch = fail as unknown as typeof fetch;

    await expect(loadModel('silueta')).rejects.toThrow(/network|fetch|model/i);
    expect(fail).toHaveBeenCalledTimes(3);
  });

  it('does not retry on 4xx (client error)', async () => {
    const notFound = new Response('not found', { status: 404 });
    const fail = vi.fn<typeof fetch>().mockResolvedValue(notFound);
    globalThis.fetch = fail as unknown as typeof fetch;

    await expect(loadModel('silueta')).rejects.toThrow(/404/);
    expect(fail).toHaveBeenCalledTimes(1);
  });

  it('retries on 5xx (server error)', async () => {
    const okBody = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));
        controller.close();
      },
    });
    const okResponse = new Response(okBody, {
      status: 200,
      headers: { 'content-length': '12' },
    });
    const fail = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('oops', { status: 503 }))
      .mockResolvedValueOnce(okResponse);
    globalThis.fetch = fail as unknown as typeof fetch;

    const session = await loadModel('silueta');
    expect(session).toBeDefined();
    expect(fail).toHaveBeenCalledTimes(2);
  });

  it('honors AbortSignal — aborting during backoff throws', async () => {
    const fail = vi.fn<typeof fetch>().mockRejectedValue(new Error('NetworkError'));
    globalThis.fetch = fail as unknown as typeof fetch;

    const controller = new AbortController();
    const promise = loadModel('silueta', { signal: controller.signal });
    // Abort while the first attempt is being retried.
    setTimeout(() => controller.abort(), 5);

    await expect(promise).rejects.toThrow();
  });
});
