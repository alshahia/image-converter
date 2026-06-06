import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSEO } from '../../../src/hooks/useSEO';

describe('useSEO', () => {
  beforeEach(() => {
    document.title = 'Original';
    document.head.querySelectorAll('meta[name="description"]').forEach((m) => m.remove());
  });

  it('sets document.title to "<title> · Drift" on mount', async () => {
    renderHook(() => useSEO('Compress image'));
    // Writes are deferred to the next animation frame to avoid intermediate
    // flicker on rapid route changes.
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    expect(document.title).toBe('Compress image · Drift');
  });

  it('sets meta description when provided', async () => {
    renderHook(() => useSEO('Compress image', 'Reduce JPG file size in your browser.'));
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    expect(meta?.getAttribute('content')).toBe('Reduce JPG file size in your browser.');
  });

  it('does not create a meta tag when no description is given', async () => {
    renderHook(() => useSEO('Compress image'));
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    expect(document.querySelector('meta[name="description"]')).toBeNull();
  });

  it('restores the previous title on unmount', async () => {
    const { unmount } = renderHook(() => useSEO('Resize image'));
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    expect(document.title).toBe('Resize image · Drift');
    unmount();
    expect(document.title).toBe('Original');
  });

  it('discards a stale rAF write when the effect re-runs before the frame fires (M-7)', async () => {
    const { rerender } = renderHook(({ title }: { title: string }) => useSEO(title), {
      initialProps: { title: 'Resize' },
    });
    // Re-render with a new title before the rAF callback for the first run fires.
    rerender({ title: 'Compress' });
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    // Only the latest title should be applied; the first run's rAF must have
    // been discarded by the bumped writeIdRef.
    expect(document.title).toBe('Compress · Drift');
  });

  it('on rapid unmount-then-mount, only the final mount sticks (M-7)', async () => {
    const first = renderHook(() => useSEO('A'));
    // Unmount A, immediately mount B in the same tick.
    first.unmount();
    renderHook(() => useSEO('B'));
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    // A's cleanup rAF is invalidated by B's writeIdRef. B wins.
    expect(document.title).toBe('B · Drift');
  });
});
