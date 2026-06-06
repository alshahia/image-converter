import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useConversion } from '../../src/hooks/useConversion';

describe('useConversion progress guard (L-2)', () => {
  it('setProgress(100) is called on success by default (engine did not report)', async () => {
    const { result } = renderHook(() => useConversion());
    await act(async () => {
      await result.current.run(Promise.resolve(new Blob(['x'])));
    });
    expect(result.current.progress).toBe(100);
  });

  it('does NOT override an engine-reported progress below 100', async () => {
    const { result } = renderHook(() => useConversion());
    act(() => {
      void result.current.run(Promise.resolve(new Blob(['y'])));
    });
    act(() => {
      result.current.setProgress(73);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(result.current.progress).toBe(73);
  });

  it('a fresh run() resets progress to 0 even if a previous run left it at 73', async () => {
    const { result } = renderHook(() => useConversion());
    act(() => {
      void result.current.run(Promise.resolve(new Blob(['a'])));
    });
    act(() => {
      result.current.setProgress(73);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(result.current.progress).toBe(73);

    await act(async () => {
      await result.current.run(Promise.resolve(new Blob(['b'])));
    });
    expect(result.current.progress).toBe(100);
  });
});
