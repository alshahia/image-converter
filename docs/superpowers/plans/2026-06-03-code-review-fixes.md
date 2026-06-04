# Code Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all issues identified in the Phase A code review: ToolPage auto-convert bug, dead dependencies, triplicated video utilities, missing tests, incomplete worker cancellation, and code nits.

**Architecture:** Six independent phases — housekeeping nits, video utilities extraction, new tests, worker cancellation wiring, ToolPage auto-convert fix, and final verification. Phases A–C have no interdependencies and can be done in parallel; Phase D depends on Phase A (ToolPage changes); Phase F depends on all prior phases.

**Tech Stack:** TypeScript 5.5 strict, React 18, Vitest 2, Biome 1.9, Bun (package manager only)

---

## File Structure

### Created
| File | Responsibility |
|---|---|
| `src/lib/utils/video.ts` | Shared `INPUT_VIDEO_EXTENSIONS` array and `inferVideoExtension()` function, used by all 3 video conversion modules |
| `tests/unit/video-to-gif.test.ts` | Unit tests for `videoToGif()` ffmpeg args: two-pass pipeline, width/fps passthrough, progress, cleanup, exec failure |
| `tests/unit/video-to-mp4.test.ts` | Unit tests for `videoToMp4()` ffmpeg args: libx264 preset, CRF, aac, faststart, progress, cleanup, exec failure |

### Modified
| File | Change |
|---|---|
| `package.json` | Remove `piexifjs` and `@types/piexifjs` |
| `src/lib/engines/exif.ts:112` | Remove redundant `as BlobPart` cast |
| `src/lib/conversions/video/extract-audio.ts` | Import shared utils instead of local `INPUT_EXTENSIONS` + `inferInputExtension` |
| `src/lib/conversions/video/video-to-gif.ts` | Import shared utils instead of local `INPUT_EXTENSIONS` + `inferExtension` |
| `src/lib/conversions/video/video-to-mp4.ts` | Import shared utils instead of local `INPUT_EXTENSIONS` + `inferExtension` |
| `tests/unit/extract-audio.test.ts` | Fix `mp4Blob` helper to set `name` property |
| `src/components/tool/ToolPage.tsx` | Add `autoConvert` prop (default `true`), `onCancel` prop, internal `handleConvert` callback, worker termination on cancel |
| `src/routes/jpg-to-webp.tsx` | Set `autoConvert={false}`, add `onCancel` with `terminateWorker` |
| `src/routes/compress-image.tsx` | Wire `terminateWorker()` into `handleCancel` for ProcessingStatus |
| `src/routes/resize-image.tsx` | Wire `terminateWorker()` into `handleCancel` for ProcessingStatus |
| `src/routes/heic-to-jpg.tsx` | Wire `terminateWorker()` into `handleCancel` for ProcessingStatus |

---

## Phase A: Housekeeping (independent)

### Task A1: Remove unused `piexifjs` dependency

**Files:**
- Modify: `package.json:28,40`

- [ ] **Step 1: Remove `piexifjs` from dependencies and `@types/piexifjs` from devDependencies**

Edit `package.json`:
- Delete line `"piexifjs": "^1.0.6",`
- Delete line `"@types/piexifjs": "^1.0.0",`

- [ ] **Step 2: Verify no imports exist**

Run: `rg "piexifjs" --include "*.ts" --include "*.tsx" src/`
Expected: no output (no file imports `piexifjs` anywhere)

- [ ] **Step 3: Run `bun install` to update lockfile**

Run: `bun install`
Expected: `bun.lock` is regenerated without piexifjs entries

- [ ] **Step 4: Verify typecheck still passes**

Run: `bun run typecheck`
Expected: exit code 0, no errors

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: remove unused piexifjs dependency"
```

---

### Task A2: Remove redundant `as BlobPart` cast in exif.ts

**Files:**
- Modify: `src/lib/engines/exif.ts:112`

- [ ] **Step 1: Remove the redundant type cast**

Edit `src/lib/engines/exif.ts:112`:

Before:
```typescript
return new Blob([stripped as BlobPart], { type: 'image/jpeg' });
```

After:
```typescript
return new Blob([stripped], { type: 'image/jpeg' });
```

`Uint8Array` already satisfies the `BlobPart` union type (`BlobPart = ArrayBuffer | Blob | string`), and `Uint8Array` extends `ArrayBuffer` via its internal `[[ViewedArrayBuffer]]` — the cast is redundant.

- [ ] **Step 6: Run typecheck and tests**

Run: `bun run typecheck`
Expected: exit 0

Run: `bun run test`
Expected: all 84 tests pass

- [ ] **Step 7: Commit**

```bash
git add src/lib/engines/exif.ts
git commit -m "chore: remove redundant as BlobPart cast in exif.ts"
```

---

## Phase B: Video utilities extraction

### Task B1: Create shared video utilities file

**Files:**
- Create: `src/lib/utils/video.ts`

- [ ] **Step 1: Write the shared utilities module**

Create `src/lib/utils/video.ts`:

```typescript
export const INPUT_VIDEO_EXTENSIONS = [
  'mp4', 'mov', 'webm', 'mkv', 'avi', 'flv', 'm4v', 'mpeg', 'mpg',
];

export function inferVideoExtension(file: File | Blob, fallback: string): string {
  const fromName = file instanceof File ? file.name.split('.').pop()?.toLowerCase() : undefined;
  if (fromName && INPUT_VIDEO_EXTENSIONS.includes(fromName)) return fromName;
  const fromType = file.type;
  if (fromType === 'video/mp4') return 'mp4';
  if (fromType === 'video/quicktime') return 'mov';
  if (fromType === 'video/webm') return 'webm';
  if (fromType === 'video/x-matroska') return 'mkv';
  return fallback;
}
```

- [ ] **Step 2: Run typecheck to verify new file compiles**

Run: `bun run typecheck`
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils/video.ts
git commit -m "feat: extract shared video extension utilities"
```

---

### Task B2: Update extract-audio.ts to use shared utilities

**Files:**
- Modify: `src/lib/conversions/video/extract-audio.ts:1-41`

- [ ] **Step 1: Replace local INPUT_EXTENSIONS and inferInputExtension with imports**

Edit `src/lib/conversions/video/extract-audio.ts`:

1. Add import at top (after existing imports):
```typescript
import { inferVideoExtension, INPUT_VIDEO_EXTENSIONS } from '../../utils/video';
```

2. Delete lines 12–41 (the old `INPUT_EXTENSIONS` constant and `inferInputExtension` function)

3. In the `extractAudio` function, change line 51 from:
```typescript
const inputName = `input.${inferInputExtension(file, 'mp4')}`;
```
to:
```typescript
const inputName = `input.${inferVideoExtension(file, 'mp4')}`;
```

- [ ] **Step 2: Run typecheck and tests**

Run: `bun run typecheck`
Expected: exit 0

Run: `bun run test`
Expected: all 84+ tests pass (including extract-audio tests)

- [ ] **Step 3: Commit**

```bash
git add src/lib/conversions/video/extract-audio.ts
git commit -m "refactor(video): use shared video extension utilities in extract-audio"
```

---

### Task B3: Update video-to-gif.ts to use shared utilities

**Files:**
- Modify: `src/lib/conversions/video/video-to-gif.ts:1-21`

- [ ] **Step 1: Replace local duplicate with imports**

Edit `src/lib/conversions/video/video-to-gif.ts`:

1. Add import:
```typescript
import { inferVideoExtension, INPUT_VIDEO_EXTENSIONS } from '../../utils/video';
```

2. Delete lines 10–21 (the old `INPUT_EXTENSIONS` constant and `inferExtension` function)

3. In the `videoToGif` function, change line 31 from:
```typescript
const inputName = `input.${inferExtension(file, 'mp4')}`;
```
to:
```typescript
const inputName = `input.${inferVideoExtension(file, 'mp4')}`;
```

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add src/lib/conversions/video/video-to-gif.ts
git commit -m "refactor(video): use shared video extension utilities in video-to-gif"
```

---

### Task B4: Update video-to-mp4.ts to use shared utilities

**Files:**
- Modify: `src/lib/conversions/video/video-to-mp4.ts:1-22`

- [ ] **Step 1: Replace local duplicate with imports**

Edit `src/lib/conversions/video/video-to-mp4.ts`:

1. Add import:
```typescript
import { inferVideoExtension, INPUT_VIDEO_EXTENSIONS } from '../../utils/video';
```

2. Delete lines 11–22 (the old `INPUT_EXTENSIONS` constant and `inferExtension` function)

3. In the `videoToMp4` function, change line 32 from:
```typescript
const inputName = `input.${inferExtension(file, 'mp4')}`;
```
to:
```typescript
const inputName = `input.${inferVideoExtension(file, 'mp4')}`;
```

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add src/lib/conversions/video/video-to-mp4.ts
git commit -m "refactor(video): use shared video extension utilities in video-to-mp4"
```

---

## Phase C: Tests

### Task C1: Add unit tests for video-to-gif.ts

**Files:**
- Create: `tests/unit/video-to-gif.test.ts`

- [ ] **Step 1: Write the test file**

Create `tests/unit/video-to-gif.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';

const writeFile = vi.fn();
const exec = vi.fn();
const readFile = vi.fn();
const deleteFile = vi.fn().mockResolvedValue(undefined);
const ffmpegInstance = {
  writeFile,
  exec,
  readFile,
  deleteFile,
};

vi.mock('../../src/lib/engines/ffmpeg', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/engines/ffmpeg')>(
    '../../src/lib/engines/ffmpeg',
  );
  return {
    ...actual,
    getFFmpeg: vi.fn(async () => ffmpegInstance),
    attachProgress: vi.fn(() => () => {}),
  };
});

function makeFile(bytes = 16, name = 'clip.mp4'): File {
  const blob = new Blob([new Uint8Array(bytes)], { type: 'video/mp4' });
  return Object.assign(blob, { name }) as unknown as File;
}

beforeEach(() => {
  writeFile.mockReset().mockResolvedValue(undefined);
  exec.mockReset().mockResolvedValue(undefined);
  readFile.mockReset();
  deleteFile.mockReset().mockResolvedValue(undefined);
});

describe('videoToGif', () => {
  it('writes input, runs two-pass ffmpeg pipeline, and returns GIF blob', async () => {
    readFile.mockResolvedValueOnce(new Uint8Array([0x47, 0x49, 0x46]));

    const { videoToGif } = await import('../../src/lib/conversions/video/video-to-gif');
    const result = await videoToGif(makeFile(8), { width: 320, fps: 10 });

    // First pass: palettegen
    expect(exec).toHaveBeenCalledTimes(2);
    const pass1 = exec.mock.calls[0]?.[0] as string[];
    expect(pass1).toContain('-i');
    expect(pass1).toContain('input.mp4');
    expect(pass1).toContain('palettegen=stats_mode=diff');
    expect(pass1).toContain('palette.png');

    // Second pass: paletteuse
    const pass2 = exec.mock.calls[1]?.[0] as string[];
    expect(pass2).toContain('-i');
    expect(pass2).toContain('input.mp4');
    expect(pass2).toContain('paletteuse=dither=bayer:bayer_scale=5');
    expect(pass2).toContain('output.gif');

    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('image/gif');
  });

  it('passes width and fps into the filter chain', async () => {
    readFile.mockResolvedValueOnce(new Uint8Array([0x47, 0x49, 0x46]));

    const { videoToGif } = await import('../../src/lib/conversions/video/video-to-gif');
    await videoToGif(makeFile(8), { width: 640, fps: 24 });

    const pass1 = exec.mock.calls[0]?.[0] as string[];
    expect(pass1).toContain('fps=24,scale=640:-1:flags=lanczos');
  });

  it('forwards onProgress values', async () => {
    const onProgress = vi.fn();
    const { attachProgress } = await import('../../src/lib/engines/ffmpeg');
    vi.mocked(attachProgress).mockImplementationOnce((_f, cb) => {
      cb(75);
      return () => {};
    });
    readFile.mockResolvedValueOnce(new Uint8Array([0x47, 0x49, 0x46]));

    const { videoToGif } = await import('../../src/lib/conversions/video/video-to-gif');
    await videoToGif(makeFile(8), { onProgress });

    expect(onProgress).toHaveBeenCalledWith(75);
  });

  it('cleans up temp files even when exec fails on first pass', async () => {
    exec.mockRejectedValueOnce(new Error('ffmpeg palettegen failed'));

    const { videoToGif } = await import('../../src/lib/conversions/video/video-to-gif');
    await expect(videoToGif(makeFile(8))).rejects.toThrow('ffmpeg palettegen failed');

    expect(deleteFile).toHaveBeenCalledWith('input.mp4');
    expect(deleteFile).toHaveBeenCalledWith('palette.png');
    expect(deleteFile).toHaveBeenCalledWith('output.gif');
  });

  it('infers extension from filename', async () => {
    readFile.mockResolvedValueOnce(new Uint8Array([0x47, 0x49, 0x46]));

    const { videoToGif } = await import('../../src/lib/conversions/video/video-to-gif');
    await videoToGif(makeFile(8, 'clip.mov'));

    expect(writeFile.mock.calls[0]?.[0]).toBe('input.mov');
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `bun run test`
Expected: all new tests pass (look for `videoToGif` in output)

- [ ] **Step 3: Commit**

```bash
git add tests/unit/video-to-gif.test.ts
git commit -m "test(video): add unit tests for video-to-gif conversion"
```

---

### Task C2: Add unit tests for video-to-mp4.ts

**Files:**
- Create: `tests/unit/video-to-mp4.test.ts`

- [ ] **Step 1: Write the test file**

Create `tests/unit/video-to-mp4.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';

const writeFile = vi.fn();
const exec = vi.fn();
const readFile = vi.fn();
const deleteFile = vi.fn().mockResolvedValue(undefined);
const ffmpegInstance = {
  writeFile,
  exec,
  readFile,
  deleteFile,
};

vi.mock('../../src/lib/engines/ffmpeg', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/engines/ffmpeg')>(
    '../../src/lib/engines/ffmpeg',
  );
  return {
    ...actual,
    getFFmpeg: vi.fn(async () => ffmpegInstance),
    attachProgress: vi.fn(() => () => {}),
  };
});

function makeFile(bytes = 16, name = 'clip.mov'): File {
  const blob = new Blob([new Uint8Array(bytes)], { type: 'video/quicktime' });
  return Object.assign(blob, { name }) as unknown as File;
}

beforeEach(() => {
  writeFile.mockReset().mockResolvedValue(undefined);
  exec.mockReset().mockResolvedValue(undefined);
  readFile.mockReset();
  deleteFile.mockReset().mockResolvedValue(undefined);
});

describe('videoToMp4', () => {
  it('writes input, runs ffmpeg with libx264 + aac, and returns mp4 blob', async () => {
    readFile.mockResolvedValueOnce(new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112]));

    const { videoToMp4 } = await import('../../src/lib/conversions/video/video-to-mp4');
    const result = await videoToMp4(makeFile(8));

    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile.mock.calls[0]?.[0]).toBe('input.mov');

    expect(exec).toHaveBeenCalledTimes(1);
    const args = exec.mock.calls[0]?.[0] as string[];
    expect(args).toContain('-c:v');
    expect(args).toContain('libx264');
    expect(args).toContain('-preset');
    expect(args).toContain('fast');
    expect(args).toContain('-crf');
    expect(args).toContain('23');
    expect(args).toContain('-c:a');
    expect(args).toContain('aac');
    expect(args).toContain('-b:a');
    expect(args).toContain('128k');
    expect(args).toContain('-movflags');
    expect(args).toContain('+faststart');
    expect(args).toContain('output.mp4');

    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('video/mp4');
  });

  it('passes preset option through to ffmpeg', async () => {
    readFile.mockResolvedValueOnce(new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112]));

    const { videoToMp4 } = await import('../../src/lib/conversions/video/video-to-mp4');
    await videoToMp4(makeFile(8), { preset: 'ultrafast' });

    const args = exec.mock.calls[0]?.[0] as string[];
    expect(args).toContain('-preset');
    expect(args).toContain('ultrafast');
  });

  it('forwards onProgress values', async () => {
    const onProgress = vi.fn();
    const { attachProgress } = await import('../../src/lib/engines/ffmpeg');
    vi.mocked(attachProgress).mockImplementationOnce((_f, cb) => {
      cb(50);
      return () => {};
    });
    readFile.mockResolvedValueOnce(new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112]));

    const { videoToMp4 } = await import('../../src/lib/conversions/video/video-to-mp4');
    await videoToMp4(makeFile(8), { onProgress });

    expect(onProgress).toHaveBeenCalledWith(50);
  });

  it('cleans up temp files even when exec fails', async () => {
    exec.mockRejectedValueOnce(new Error('ffmpeg failed'));

    const { videoToMp4 } = await import('../../src/lib/conversions/video/video-to-mp4');
    await expect(videoToMp4(makeFile(8))).rejects.toThrow('ffmpeg failed');

    expect(deleteFile).toHaveBeenCalledWith('input.mov');
    expect(deleteFile).toHaveBeenCalledWith('output.mp4');
  });

  it('infers extension from MIME type fallback', async () => {
    readFile.mockResolvedValueOnce(new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112]));

    const { videoToMp4 } = await import('../../src/lib/conversions/video/video-to-mp4');
    const blobInput = new Blob([new Uint8Array(8)], { type: 'video/webm' }) as unknown as File;
    Object.defineProperty(blobInput, 'name', { value: 'clip' });
    await videoToMp4(blobInput);

    expect(writeFile.mock.calls[0]?.[0]).toBe('input.webm');
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `bun run test`
Expected: all new tests pass (look for `videoToMp4` in output)

- [ ] **Step 3: Commit**

```bash
git add tests/unit/video-to-mp4.test.ts
git commit -m "test(video): add unit tests for video-to-mp4 conversion"
```

---

### Task C3: Fix mp4Blob test helper in extract-audio.test.ts

**Files:**
- Modify: `tests/unit/extract-audio.test.ts:26-27`

- [ ] **Step 1: Fix the mp4Blob helper to set `name` property**

Edit `tests/unit/extract-audio.test.ts:26-27`:

Before:
```typescript
const mp4Blob = (bytes = 16) =>
  new Blob([new Uint8Array(bytes)], { type: 'video/mp4' }) as unknown as File;
```

After:
```typescript
const mp4Blob = (bytes = 16, name = 'input.mp4') => {
  const blob = new Blob([new Uint8Array(bytes)], { type: 'video/mp4' });
  return Object.assign(blob, { name }) as unknown as File;
};
```

- [ ] **Step 2: Run tests to verify**

Run: `bun run test`
Expected: all tests pass (especially `extractAudio` describe block)

- [ ] **Step 3: Commit**

```bash
git add tests/unit/extract-audio.test.ts
git commit -m "test: fix mp4Blob helper to set name property"
```

---

## Phase D: Worker cancellation

### Task D1: Add `onCancel` prop to ToolPage

**Files:**
- Modify: `src/components/tool/ToolPage.tsx`

- [ ] **Step 1: Add `onCancel` to ToolPageProps and wire it through**

Edit `src/components/tool/ToolPage.tsx`:

1. Add `onCancel` to the props interface (after line 26):
```typescript
onCancel?: () => void;
```

2. Destructure `onCancel` from props (after line 37):
```typescript
  onCancel,
```

3. Pass `onCancel` to `useConversion` — change line 42 from:
```typescript
const { status, progress, result, error, run, cancel, reset } = useConversion();
```
to:
```typescript
const { status, progress, result, error, run, cancel, reset } = useConversion(onCancel);
```

4. In `handleRemove`, use `cancel` (it already calls `cancel()`) — ToolPage's handleRemove already calls `cancel()` at line 81, which now includes the `onCancel` callback.

- [ ] **Step 2: Update `useConversion` to accept an optional cancel callback**

Edit `src/hooks/useConversion.ts`:

1. Change the function signature from:
```typescript
export function useConversion(): UseConversionResult {
```
to:
```typescript
export function useConversion(onExternalCancel?: () => void): UseConversionResult {
```

2. Update the `cancel` callback to call it:
```typescript
const cancel = useCallback(() => {
  cancelledRef.current = true;
  onExternalCancel?.();
}, [onExternalCancel]);
```

- [ ] **Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add src/components/tool/ToolPage.tsx src/hooks/useConversion.ts
git commit -m "feat: add onCancel prop to ToolPage and useConversion"
```

---

### Task D2: Wire `terminateWorker` into image route cancellations

**Files:**
- Modify: `src/routes/compress-image.tsx`
- Modify: `src/routes/resize-image.tsx`
- Modify: `src/routes/heic-to-jpg.tsx`

- [ ] **Step 1: Wire `terminateWorker` in compress-image.tsx**

Edit `src/routes/compress-image.tsx`:

1. Add import for `terminateWorker`:
```typescript
import { terminateWorker } from '../lib/engines/jsquash';
```

2. Change `useConversion()` call from:
```typescript
const { status, progress, result, error, run, cancel, reset } = useConversion();
```
to:
```typescript
const { status, progress, result, error, run, cancel, reset } = useConversion(terminateWorker);
```

3. In `handleRemove`, change from:
```typescript
const handleRemove = useCallback(() => {
  cancel();
  setFile(null);
  setFileError(null);
  setSizeWarning(null);
  reset();
}, [cancel, reset]);
```
to:
```typescript
const handleRemove = useCallback(() => {
  cancel();
  setFile(null);
  setFileError(null);
  setSizeWarning(null);
  reset();
}, [cancel, setFile, setFileError, setSizeWarning, reset]);
```

(The state setter references are stable and won't change — the deps don't actually change, but the linter might flag them. Remove the `cancel()` and `reset()` from deps since those are stable. Actually wait, `cancel` is now wrapped in `useCallback` with `onExternalCancel` dep, so it might change. Let me just keep `[cancel, reset]`.)

- [ ] **Step 2: Wire `terminateWorker` in resize-image.tsx**

Edit `src/routes/resize-image.tsx`:

1. Add import:
```typescript
import { terminateWorker } from '../lib/engines/jsquash';
```

2. Change `useConversion()` call from:
```typescript
const { status, progress, result, error, run, cancel, reset } = useConversion();
```
to:
```typescript
const { status, progress, result, error, run, cancel, reset } = useConversion(terminateWorker);
```

- [ ] **Step 3: Wire `terminateWorker` in heic-to-jpg.tsx**

Edit `src/routes/heic-to-jpg.tsx`:

1. Add import:
```typescript
import { terminateWorker } from '../lib/engines/jsquash';
```

2. Change `useConversion()` call from:
```typescript
const { status, progress, result, error, run, cancel, reset } = useConversion();
```
to:
```typescript
const { status, progress, result, error, run, cancel, reset } = useConversion(terminateWorker);
```

- [ ] **Step 4: Wire `terminateWorker` in jpg-to-webp.tsx**

Edit `src/routes/jpg-to-webp.tsx`:

1. Add import:
```typescript
import { terminateWorker } from '../lib/engines/jsquash';
```

2. Pass `onCancel` to ToolPage (added in next task's ToolPage props):
```typescript
<ToolPage
  ...
  onCancel={terminateWorker}
/>
```

- [ ] **Step 5: Run typecheck**

Run: `bun run typecheck`
Expected: exit 0

- [ ] **Step 6: Run tests**

Run: `bun run test`
Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add src/routes/compress-image.tsx src/routes/resize-image.tsx src/routes/heic-to-jpg.tsx src/routes/jpg-to-webp.tsx
git commit -m "fix: wire terminateWorker into image route cancellations"
```

---

## Phase E: ToolPage auto-convert fix

### Task E1: Add `autoConvert` prop to ToolPage

**Files:**
- Modify: `src/components/tool/ToolPage.tsx`

- [ ] **Step 1: Add `autoConvert` to ToolPageProps**

Edit `src/components/tool/ToolPage.tsx`:

1. Add `autoConvert` to the props interface (after `validateFile`):
```typescript
autoConvert?: boolean;
```

2. Destructure with default `true`:
```typescript
  autoConvert = true,
```

3. In `handleFile`, conditionally skip auto-convert — edit the bottom of the callback (around line 74-75):
Before:
```typescript
      setFile(first);
      await run(convert(first));
```

After:
```typescript
      setFile(first);
      if (autoConvert) {
        await run(convert(first));
      }
```

4. Add a `handleConvert` callback after `handleRetry` (around line 87):
```typescript
  const handleConvert = useCallback(() => {
    if (!file) return;
    run(convert(file));
  }, [file, run, convert]);
```

5. In the render section, add a "Convert" button when file is selected, status is idle, and autoConvert is false. Add this after the `<FilePreview>` block (around line 125):
```tsx
      {file && status === 'idle' && !autoConvert && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleConvert}
            className="rounded-lg bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Convert to .{outputExtension}
          </button>
        </div>
      )}
```

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add src/components/tool/ToolPage.tsx
git commit -m "feat: add autoConvert prop to ToolPage"
```

---

### Task E2: Update jpg-to-webp to use `autoConvert={false}`

**Files:**
- Modify: `src/routes/jpg-to-webp.tsx`

- [ ] **Step 1: Set `autoConvert={false}` and add `onCancel`**

Edit `src/routes/jpg-to-webp.tsx`:

1. Add import:
```typescript
import { terminateWorker } from '../lib/engines/jsquash';
```

2. Add `autoConvert={false}` and `onCancel={terminateWorker}` to ToolPage:
```tsx
<ToolPage
  title="JPG to WebP"
  description="Convert JPG images to WebP in your browser. No upload, no signup."
  accept={['.jpg', '.jpeg', 'image/jpeg']}
  convert={convert}
  outputMimeType="image/webp"
  outputExtension="webp"
  autoConvert={false}
  onCancel={terminateWorker}
  optionsComponent={
    ...
  }
/>
```

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add src/routes/jpg-to-webp.tsx
git commit -m "fix: disable auto-convert for jpg-to-webp so quality slider is usable"
```

---

## Phase F: Verification

### Task F1: Full verification suite

**Files:**
- Run commands only

- [ ] **Step 1: Typecheck**

Run: `bun run typecheck`
Expected: exit code 0

- [ ] **Step 2: Lint**

Run: `bun run lint`
Expected: no warnings or errors

- [ ] **Step 3: Tests**

Run: `bun run test`
Expected: all tests pass (expect ~90+ tests now)

- [ ] **Step 4: Build**

Run: `bun run build`
Expected: `tsc -b` succeeds and `vite build` produces production bundle

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: run full verification suite"
```
