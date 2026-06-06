import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useConversion } from '../../src/hooks/useConversion';

describe('useConversion reentrancy (M-3)', () => {
  it('rejects a second run() call while a previous one is in flight', async () => {
    let resolveFirst: (b: Blob) => void = () => {};
    const first = new Promise<Blob>((res) => {
      resolveFirst = res;
    });
    const second = Promise.resolve(new Blob(['second']));

    const { result } = renderHook(() => useConversion());

    let firstResult: Promise<Blob | null> | undefined;
    act(() => {
      firstResult = result.current.run(first);
    });

    let secondError: unknown = null;
    act(() => {
      void result.current.run(second).catch((e: unknown) => {
        secondError = e;
      });
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(secondError).toBeInstanceOf(Error);
    expect((secondError as Error).message).toMatch(/already in progress/i);

    await act(async () => {
      resolveFirst(new Blob(['first']));
      await firstResult;
    });

    expect(result.current.status).toBe('done');
    expect(result.current.result?.size).toBe(5);
  });

  it('allows a new run() after the previous one completes', async () => {
    const { result } = renderHook(() => useConversion());

    await act(async () => {
      await result.current.run(Promise.resolve(new Blob(['a'])));
    });
    expect(result.current.status).toBe('done');

    await act(async () => {
      await result.current.run(Promise.resolve(new Blob(['bbbbb'])));
    });
    expect(result.current.status).toBe('done');
    expect(result.current.result?.size).toBe(5);
  });

  it('allows a new run() after cancel()', async () => {
    let rejectFirst: (e: Error) => void = () => {};
    const first = new Promise<Blob>((_res, rej) => {
      rejectFirst = rej;
    });

    const { result } = renderHook(() => useConversion());

    act(() => {
      void result.current.run(first);
    });
    act(() => {
      result.current.cancel();
    });

    await act(async () => {
      rejectFirst(new Error('cancelled by engine'));
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(result.current.status).toBe('cancelled');

    await act(async () => {
      await result.current.run(Promise.resolve(new Blob(['ok'])));
    });
    expect(result.current.status).toBe('done');
    expect(result.current.result?.size).toBe(2);
  });
});
