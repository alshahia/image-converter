import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useConversion } from '../../src/hooks/useConversion';

describe('useConversion AbortSignal (H-3 backwards-compatible)', () => {
  it('still accepts a Promise<Blob> (legacy path)', async () => {
    const { result } = renderHook(() => useConversion());
    await act(async () => {
      const blob = await result.current.run(Promise.resolve(new Blob(['x'])));
      expect(blob?.size).toBe(1);
    });
    expect(result.current.status).toBe('done');
  });

  it('accepts a (signal) => Promise<Blob> factory', async () => {
    const { result } = renderHook(() => useConversion());
    await act(async () => {
      const blob = await result.current.run(async (_signal) => new Blob(['y']));
      expect(blob?.size).toBe(1);
    });
    expect(result.current.status).toBe('done');
  });

  it('passes an AbortSignal to the factory', async () => {
    const { result } = renderHook(() => useConversion());
    let capturedSignal: AbortSignal | null = null;
    await act(async () => {
      await result.current.run(async (signal) => {
        capturedSignal = signal;
        return new Blob(['z']);
      });
    });
    expect(capturedSignal).toBeInstanceOf(AbortSignal);
    expect((capturedSignal as unknown as AbortSignal).aborted).toBe(false);
  });

  it('cancel() aborts the signal of the in-flight factory', async () => {
    let factoryObservedAbort = false;
    let resolveFactory: (b: Blob) => void = () => {};

    const factory = (signal: AbortSignal) =>
      new Promise<Blob>((resolve) => {
        resolveFactory = (b) => {
          factoryObservedAbort = signal.aborted;
          resolve(b);
        };
      });

    const { result } = renderHook(() => useConversion());

    act(() => {
      void result.current.run(factory);
    });

    act(() => {
      result.current.cancel();
    });

    await act(async () => {
      resolveFactory(new Blob(['w']));
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(factoryObservedAbort).toBe(true);
    expect(result.current.status).toBe('cancelled');
  });

  it('legacy Promise<Blob> arg: cancel() still transitions to cancelled', async () => {
    let resolveFirst: (b: Blob) => void = () => {};
    const first = new Promise<Blob>((res) => {
      resolveFirst = res;
    });

    const { result } = renderHook(() => useConversion());

    act(() => {
      void result.current.run(first);
    });
    act(() => {
      result.current.cancel();
    });

    await act(async () => {
      resolveFirst(new Blob(['late']));
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(result.current.status).toBe('cancelled');
  });

  it('cancel() invokes the onCancel hook for engine-level teardown', () => {
    const onCancel = vi.fn();
    const { result } = renderHook(() => useConversion(onCancel));
    act(() => {
      result.current.cancel();
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
