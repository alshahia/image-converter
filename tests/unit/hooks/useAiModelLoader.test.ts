import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/lib/engines/onnx', () => ({
  loadModel: vi.fn(async () => ({})),
}));

import { useAiModelLoader } from '../../../src/hooks/useAiModelLoader';

afterEach(() => {
  vi.clearAllMocks();
});

describe('useAiModelLoader', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useAiModelLoader());
    expect(result.current.status).toBe('idle');
    expect(result.current.progress).toBe(0);
  });

  it('transitions to loading then loaded on load()', async () => {
    const { result } = renderHook(() => useAiModelLoader());
    let p: Promise<void> | undefined;
    act(() => {
      p = result.current.load('silueta');
    });
    expect(result.current.status).toBe('loading');
    await act(async () => {
      await p;
    });
    expect(result.current.status).toBe('loaded');
  });

  it('transitions to error on failure', async () => {
    const ort = await import('../../../src/lib/engines/onnx');
    vi.mocked(ort.loadModel).mockImplementationOnce(async () => {
      throw new Error('Network down');
    });
    const { result } = renderHook(() => useAiModelLoader());
    await act(async () => {
      await result.current.load('silueta').catch(() => undefined);
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toBe('Network down');
  });

  it('reset() returns to idle', async () => {
    const { result } = renderHook(() => useAiModelLoader());
    await act(async () => {
      await result.current.load('silueta');
    });
    act(() => result.current.reset());
    expect(result.current.status).toBe('idle');
  });
});
