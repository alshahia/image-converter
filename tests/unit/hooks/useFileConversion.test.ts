import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useFileConversion } from '../../../src/hooks/useFileConversion';

const ACCEPT = ['.jpg', '.jpeg', 'image/jpeg'];
const MAX = 5_000_000;
const WARN = 2_000_000;

function makeFile(name: string, type: string, sizeBytes: number): File {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type });
  return new File([blob], name, { type });
}

function makeJpegBytes(sizeBytes: number = 12): BlobPart {
  // JPEG signature: ff d8 ff e0 ... (JFIF marker; enough for the detector)
  const out = new Uint8Array(new ArrayBuffer(sizeBytes));
  out[0] = 0xff;
  out[1] = 0xd8;
  out[2] = 0xff;
  out[3] = 0xe0;
  return out;
}

function makePngBytes(sizeBytes: number = 12): BlobPart {
  // PNG signature: 89 50 4e 47 0d 0a 1a 0a ...
  const out = new Uint8Array(new ArrayBuffer(sizeBytes));
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < sig.length; i++) out[i] = sig[i] ?? 0;
  return out;
}

describe('useFileConversion', () => {
  it('starts in idle with no file and no error', () => {
    const { result } = renderHook(() => useFileConversion({ accept: ACCEPT, maxBytes: MAX, warnBytes: WARN }));
    expect(result.current.file).toBeNull();
    expect(result.current.fileError).toBeNull();
    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('accepts a valid file and clears any prior error', () => {
    const { result } = renderHook(() => useFileConversion({ accept: ACCEPT, maxBytes: MAX, warnBytes: WARN }));
    const file = makeFile('hello.jpg', 'image/jpeg', 1000);
    act(() => result.current.handleFile(file));
    expect(result.current.file).toBe(file);
    expect(result.current.fileError).toBeNull();
  });

  it('accepts File[] and uses the first element', () => {
    const { result } = renderHook(() => useFileConversion({ accept: ACCEPT, maxBytes: MAX, warnBytes: WARN }));
    const f1 = makeFile('a.jpg', 'image/jpeg', 1000);
    const f2 = makeFile('b.jpg', 'image/jpeg', 2000);
    act(() => result.current.handleFile([f1, f2]));
    expect(result.current.file).toBe(f1);
  });

  it('rejects an empty file list', () => {
    const { result } = renderHook(() => useFileConversion({ accept: ACCEPT, maxBytes: MAX, warnBytes: WARN }));
    act(() => result.current.handleFile([]));
    expect(result.current.file).toBeNull();
    expect(result.current.fileError).toBe('No file selected.');
  });

  it('rejects a file whose type is not in the accept list', () => {
    const { result } = renderHook(() => useFileConversion({ accept: ACCEPT, maxBytes: MAX, warnBytes: WARN }));
    const file = makeFile('a.png', 'image/png', 1000);
    act(() => result.current.handleFile(file));
    expect(result.current.file).toBeNull();
    expect(result.current.fileError).toMatch(/Expected.*\.JPG/);
  });

  it('rejects a file larger than maxBytes', () => {
    const { result } = renderHook(() => useFileConversion({ accept: ACCEPT, maxBytes: 100, warnBytes: 50 }));
    const file = makeFile('big.jpg', 'image/jpeg', 200);
    act(() => result.current.handleFile(file));
    expect(result.current.file).toBeNull();
    expect(result.current.fileError).toMatch(/large|max|bytes/i);
  });

  it('handleRemove clears the file and resets conversion state', async () => {
    const { result } = renderHook(() => useFileConversion({ accept: ACCEPT, maxBytes: MAX, warnBytes: WARN }));
    const file = makeFile('a.jpg', 'image/jpeg', 1000);
    act(() => result.current.handleFile(file));
    expect(result.current.file).toBe(file);

    await act(async () => {
      await result.current.run(Promise.resolve(new Blob(['x'])));
    });
    expect(result.current.result).not.toBeNull();

    act(() => result.current.handleRemove());
    expect(result.current.file).toBeNull();
    expect(result.current.fileError).toBeNull();
    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeNull();
  });

  it('a new valid file clears a previous fileError', () => {
    const { result } = renderHook(() => useFileConversion({ accept: ACCEPT, maxBytes: MAX, warnBytes: WARN }));
    act(() => result.current.handleFile(makeFile('a.png', 'image/png', 100)));
    expect(result.current.fileError).not.toBeNull();
    act(() => result.current.handleFile(makeFile('b.jpg', 'image/jpeg', 100)));
    expect(result.current.file).not.toBeNull();
    expect(result.current.fileError).toBeNull();
  });

  it('rejects a .png file whose bytes are JPEG (M-8 magic-byte check)', async () => {
    const pngAccept = ['.png', 'image/png'];
    const { result } = renderHook(() => useFileConversion({ accept: pngAccept, maxBytes: MAX, warnBytes: WARN }));
    const file = new File([makeJpegBytes()], 'fake.png', { type: 'image/png' });
    await act(async () => {
      result.current.handleFile(file);
    });
    // The promise from detectImageFormat is awaited inside handleFile.
    // We may need a microtask tick for it to resolve.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.file).toBeNull();
    expect(result.current.fileError).toMatch(/jpeg|png|looks like/i);
  });

  it('accepts a .png file whose bytes are PNG (M-8 magic-byte check passes)', async () => {
    const pngAccept = ['.png', 'image/png'];
    const { result } = renderHook(() => useFileConversion({ accept: pngAccept, maxBytes: MAX, warnBytes: WARN }));
    const file = new File([makePngBytes()], 'real.png', { type: 'image/png' });
    await act(async () => {
      result.current.handleFile(file);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.file).toBe(file);
    expect(result.current.fileError).toBeNull();
  });
});
