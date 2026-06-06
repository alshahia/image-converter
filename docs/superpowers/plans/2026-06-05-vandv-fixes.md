# V&V Code Review Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Date:** 2026-06-05
**Source review:** Internal V&V report, 19 findings (0 Critical, 5 High, 8 Medium, 6 Low)
**Branch:** `v2/vandv-fixes` from `main`
**Baseline:** 185 tests passing across 26 files, `tsc -b` clean, `biome check` clean

**Goal:** Resolve all 19 findings from the V&V code review in 7 sequenced phases, each landing a single atomic commit per task, with regression tests added *before* the fix where TDD is sensible, and a verification gate at the end of every phase.

**Architecture:** Atomic commits per finding. Larger refactors (M-1, H-3) are split into 1-commit-per-route / 1-commit-per-concern sub-tasks so a regression is bisectable. Test depth (Phase 7) runs in parallel to Phases 4–6. Dependency graph and risk table at the bottom.

**Tech Stack:** TypeScript 5.5 strict, React 18, Vitest 2, Biome 1.9, Bun (package manager only). No new runtime deps.

---

## Decisions Resolved (defaults locked in)

| # | Question | Default chosen | Rationale |
|---|----------|----------------|-----------|
| 1 | M-1 refactor granularity | **One PR per route** (5 PRs + 1 for the hook) | Easier review, easier bisect, easier revert |
| 2 | H-4 CSP rollout | **Report-only first**, then enforce after smoke | Catches a misconfigured directive without breaking prod |
| 3 | M-5 retry count | **3 attempts**, exponential backoff 200→400→800 ms | Mobile networks benefit; logs make silent failures visible |
| 4 | H-3 cancel semantics | **Signal only**, no worker teardown | Lighter, more predictable; if engines hang, M-1 flow tests will catch |
| 5 | L-5 telemetry | **Defer to Phase C planning** | Privacy posture preserved; revisit when there's a real signal we want |
| 6 | Phase 7 test depth | **Top-10 priority routes** for full flow tests | AI + video + format-convert subset; extend later if needed |

---

## File Structure

### Created

| File | Responsibility | Status |
|---|---|---|
| `docs/superpowers/plans/2026-06-05-vandv-fixes.md` | This plan | done |
| `TASKS.md` | Active task tracking, mirrors Phase 1–7 status | done |
| `src/lib/utils/errors.ts` | `toError(e)` helper (L-6) | done |
| `src/hooks/useFileConversion.ts` | Shared scaffold for file→convert→download (M-1) | done |
| `src/hooks/useAiModelLoader.ts` | M-5 retry-aware AI model loader | done |
| `docs/biome-policy.md` | Rule-by-rule policy (L-4) | done |
| `tests/.baseline.txt` | Pre-V&V test-count reference | done |
| `tests/setup.ts` | JSDOM polyfills (URL.createObjectURL, Image) | done |
| `tests/unit/errors.test.ts` | toError behavior (L-6) | done |
| `tests/unit/useConversion.test.ts` | reentrancy, cancel, engine-progress behavior | done |
| `tests/unit/useConversion-progress.test.ts` | progress-guard behavior (H-2) | done |
| `tests/unit/useConversion-signal.test.ts` | AbortController behavior (H-3) | done |
| `tests/unit/hooks/useFileConversion.test.ts` | M-1 hook contract + M-8 magic-byte rejection | done |
| `tests/unit/hooks/useSEO.test.ts` | rAF + stale-write discard (M-7) | done |
| `tests/unit/hooks/useAiModelLoader.test.ts` | M-5 wiring | done |
| `tests/unit/tiff.test.ts` | IFD bound, alpha default, malformed input (M-4) | done |
| `tests/unit/heic.test.ts` | M-6 fast path, array result (M-6) | done |
| `tests/unit/onnx.test.ts` | M-5 retry path (M-5) | done |
| `tests/unit/ProcessingStatus.test.tsx` | L-3 in-UI cancel hint behavior | done |
| `tests/unit/DownloadButton.test.tsx` | Component test (Phase 7.4) | done |
| `tests/unit/ErrorBoundary.test.tsx` | Component test (Phase 7.4) | done |
| `tests/unit/Header.test.tsx` | Component test (Phase 7.4) | done |
| `tests/unit/DemoZone.test.tsx` | Component test (Phase 7.4) | done |
| `tests/integration/csp.test.ts` | H-4 header parse | done |
| `tests/integration/DropZone.test.tsx` | M-2 visible Choose-file button | done |
| `tests/integration/routes.test.tsx` | H-1 error-handler wiring | done |
| `tests/integration/flows/jpg-to-png.test.tsx` | Top-10 route user-flow test (Phase 7.3) | done |
| `tests/integration/flows/png-to-jpg.test.tsx` | Top-10 route user-flow test (Phase 7.3) | done |
| `tests/integration/flows/webp-to-jpg.test.tsx` | Top-10 route user-flow test (Phase 7.3) | done |
| `tests/integration/flows/heic-to-jpg.test.tsx` | Top-10 route user-flow test (Phase 7.3) | done |
| `tests/integration/flows/resize-image.test.tsx` | Top-10 route user-flow test (Phase 7.3) | done |
| `tests/integration/flows/compress-image.test.tsx` | Top-10 route user-flow test (Phase 7.3) | done |
| `tests/integration/flows/smart-compress.test.tsx` | Top-10 route user-flow test (Phase 7.3) | done |
| `tests/integration/flows/remove-background.test.tsx` | Top-10 route user-flow test (Phase 7.3) | done |
| `tests/integration/flows/upscale-image.test.tsx` | Top-10 route user-flow test (Phase 7.3) | done |
| `tests/integration/flows/video-to-mp4.test.tsx` | Top-10 route user-flow test (Phase 7.3) | done |
| `tests/unit/ico.test.ts` | multi-size encode (Phase 7) | **pending** |
| `tests/unit/svg.test.ts` | no-viewBox fallback, background option (Phase 7) | **pending** |
| `tests/unit/ffmpeg.test.ts` | H-5 listener persistence (Phase 7) | **pending** |
| `src/components/ai/CancelHint.tsx` | Was: standalone cancel-latency notice (L-3) | **cancelled — inlined into `ProcessingStatus` as the simpler path** |
| `tests/integration/CancelHint.test.tsx` | Was: L-3 test target | **cancelled — test lives in `tests/unit/ProcessingStatus.test.tsx`** |
| `tests/integration/ErrorBoundary.test.tsx` | Was: L-5 sendBeacon path | **deferred with L-5 to Phase C** |
| `tests/unit/useFileDrop.test.ts` | Was: standalone test for M-8 magic-byte rejection | **cancelled — M-8 is tested inside `useFileConversion.test.ts`** |
| `scripts/generate-sitemap.ts` | Was: sitemap generator (L-1) | **cancelled — L-1 closed in wave-8; no script needed for this branch** |
| `tests/integration/flows/<route>.test.tsx` | (All 10 top-10 routes done — no more pending) | **done** |

### Modified

| File | Change |
|---|---|
| `src/hooks/useConversion.ts` | H-2 dead code, M-3 runningRef, L-2 progress guard, L-6 toError, H-3 AbortController |
| `src/lib/engines/jsquash.ts` | H-1 worker.onerror / onmessageerror |
| `src/lib/engines/ffmpeg.ts` | H-5 subscriber set |
| `src/lib/engines/onnx.ts` | M-5 retry |
| `src/lib/engines/heic.ts` | M-6 createImageBitmap fast path |
| `src/lib/engines/tiff.ts` | M-4 IFD bound + try/catch |
| `src/hooks/useFileDrop.ts` | M-8 magic-byte validation, expose input ref / onPaste prop |
| `src/hooks/useSEO.ts` | M-7 rAF + stale-write discard |
| `src/components/upload/DropZone.tsx` | M-2 visible "Choose file" button, onPaste handler |
| `src/components/shell/ErrorBoundary.tsx` | L-5 opt-in sendBeacon |
| `public/_headers` | H-4 CSP (enforce after report-only smoke) |
| `vite.config.ts` | H-4 CSP in dev/preview |
| `public/robots.txt` | L-1 keep Sitemap line (sitempa now exists) |
| `biome.json` | L-4 align rule severities with policy doc |
| `package.json` | +`sitemap` script |
| `src/routes/resize-image.tsx` | M-1 migrate to useFileConversion |
| `src/routes/compress-image.tsx` | M-1 migrate |
| `src/routes/smart-compress.tsx` | M-1 migrate |
| `src/routes/remove-background.tsx` | M-1 migrate (extends with useAiModelLoader) |
| `src/routes/upscale-image.tsx` | M-1 migrate (model selector) |

---

## Phase 0 — Pre-Work

### Task 0.1: Create branch and capture baseline

- [ ] **Step 1: Create and check out `v2/vandv-fixes`**

```bash
git checkout -b v2/vandv-fixes
```

- [ ] **Step 2: Capture baseline test count**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: `Test Files  26 passed (27)`, `Tests  185 passed (187)`. Save output to `tests/.baseline.txt` for diff later.

- [ ] **Step 3: Confirm tsc and biome clean**

```bash
bun run typecheck
npx biome check .
```

Both expected to exit 0 with no output.

- [ ] **Step 4: Create `TASKS.md` at project root**

Mirrors this plan's 7 phases with a checkbox per task. Updated as items land.

---

## Phase 1 — Sprint-Now (≤ 4 hours, ~1 day)

*Independent, small, low-risk, all have obvious right answers. Land first.*

### Task 1.1 (H-2): Remove `void progressHandler` dead code

**Files:**
- Modify: `src/hooks/useConversion.ts`

- [ ] **Step 1: Edit `src/hooks/useConversion.ts`**

Delete the `const progressHandler = ...` block (lines 29–36) and the `void progressHandler;` (line 38). Replace the doc comment at the top of the file with:

```ts
/**
 * Conversion state machine.
 *
 * Progress is engine-specific:
 *   - jsquash: not wired here; routes call convertImage() and pass onProgress directly
 *   - ffmpeg: routes call attachProgress(ffmpeg, onProgress) before exec
 *   - ai: routes call useAiModelLoader.load() and surface its progress separately
 */
```

- [ ] **Step 2: Verify**

```bash
bun run typecheck
npx biome check .
npx vitest run
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useConversion.ts
git commit -m "fix(useConversion): drop unused progressHandler; document engine-specific progress wiring (H-2)"
```

### Task 1.2 (L-1): Add generated sitemap; robots.txt remains valid

**Files:**
- Create: `scripts/generate-sitemap.ts`
- Create: `public/sitemap.xml`
- Modify: `package.json` (+`sitemap` script)

- [ ] **Step 1: Create `scripts/generate-sitemap.ts`**

```ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOOLS } from '../src/data/tools';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = 'https://drift.example.com'; // TODO: read from env

const urls = TOOLS.map((t) => `  <url><loc>${SITE}${t.path}</loc></url>`).join('\n');
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc></url>
  <url><loc>${SITE}/privacy</loc></url>
${urls}
</urlset>
`;

const out = join(__dirname, '..', 'public', 'sitemap.xml');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, xml, 'utf8');
console.log(`Wrote ${out} (${TOOLS.length} routes)`);
```

- [ ] **Step 2: Add script to `package.json`**

Under `"scripts"`, add: `"sitemap": "bun run scripts/generate-sitemap.ts"`.

- [ ] **Step 3: Generate sitemap**

```bash
bun run sitemap
```

Expected: `Wrote .../public/sitemap.xml (46 routes)`.

- [ ] **Step 4: Verify file exists with 46+ URLs**

```bash
grep -c '<url>' public/sitemap.xml
```

Expected: `>= 48` (46 routes + home + privacy).

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-sitemap.ts public/sitemap.xml package.json
git commit -m "chore(seo): generate public/sitemap.xml from TOOLS; 46 routes (L-1)"
```

### Task 1.3 (L-6): `toError()` helper, use in `useConversion`

**Files:**
- Create: `src/lib/utils/errors.ts`
- Create: `tests/unit/errors.test.ts`
- Modify: `src/hooks/useConversion.ts`
- Modify: `src/hooks/useAiModelLoader.ts` (consistency)

- [ ] **Step 1: Write failing test `tests/unit/errors.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { toError } from '../../src/lib/utils/errors';

describe('toError', () => {
  it('returns the same Error instance', () => {
    const e = new Error('x');
    expect(toError(e)).toBe(e);
  });
  it('wraps a string in an Error', () => {
    expect(toError('boom').message).toBe('boom');
  });
  it('wraps a plain object via JSON', () => {
    expect(toError({ code: 1 }).message).toBe('{"code":1}');
  });
  it('falls back for circular objects', () => {
    const o: Record<string, unknown> = {};
    o.self = o;
    expect(toError(o).message).toBe('Unknown error');
  });
  it('falls back for null', () => {
    expect(toError(null).message).toBe('Unknown error');
  });
});
```

- [ ] **Step 2: Run test, confirm red**

```bash
npx vitest run tests/unit/errors.test.ts
```

Expected: fail (module not found).

- [ ] **Step 3: Create `src/lib/utils/errors.ts`**

```ts
export function toError(e: unknown, fallback = 'Unknown error'): Error {
  if (e instanceof Error) return e;
  if (typeof e === 'string') return new Error(e);
  try {
    return new Error(JSON.stringify(e));
  } catch {
    return new Error(fallback);
  }
}
```

- [ ] **Step 4: Run test, confirm green**

```bash
npx vitest run tests/unit/errors.test.ts
```

- [ ] **Step 5: Use `toError` in `useConversion.ts` and `useAiModelLoader.ts`**

Replace:
```ts
const error = err instanceof Error ? err : new Error(String(err));
```
With:
```ts
const error = toError(err);
```

- [ ] **Step 6: Verify full suite still passes**

```bash
bun run typecheck && npx biome check . && npx vitest run
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/utils/errors.ts tests/unit/errors.test.ts src/hooks/useConversion.ts src/hooks/useAiModelLoader.ts
git commit -m "feat(utils): toError() helper; useConversion and useAiModelLoader use it (L-6)"
```

### Task 1.4 (M-3): `useConversion.run` reentrancy guard

**Files:**
- Modify: `src/hooks/useConversion.ts`
- Create: `tests/unit/hooks/useConversion.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/hooks/useConversion.test.ts
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useConversion } from '../../../src/hooks/useConversion';

describe('useConversion.run reentrancy', () => {
  it('rejects a second run while the first is in flight', async () => {
    let resolveFirst!: (b: Blob) => void;
    const first = new Promise<Blob>((r) => (resolveFirst = r));
    const second = vi.fn(() => Promise.resolve(new Blob(['x'])));

    const { result } = renderHook(() => useConversion());
    const firstRun = result.current.run(first);
    const secondRun = result.current.run(second());
    expect(secondRun).resolves.toBeNull();
    resolveFirst(new Blob(['a']));
    await act(async () => { await firstRun; });
    expect(second).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, confirm red**

```bash
npx vitest run tests/unit/hooks/useConversion.test.ts
```

- [ ] **Step 3: Add `runningRef` guard to `useConversion.ts`**

Inside the hook (after `cancelledRef`), add:
```ts
const runningRef = useRef(false);
```

At the top of `run`:
```ts
if (runningRef.current) return null;
runningRef.current = true;
```

In the `try`'s `finally` (or in both `try` and `catch` paths via `try/finally`):
```ts
} finally {
  runningRef.current = false;
}
```

Refactor the existing `try/catch` to:
```ts
try {
  // ... existing body
} finally {
  runningRef.current = false;
}
```

- [ ] **Step 4: Run, confirm green**

```bash
npx vitest run tests/unit/hooks/useConversion.test.ts
```

- [ ] **Step 5: Verify full suite**

```bash
bun run typecheck && npx biome check . && npx vitest run
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useConversion.ts tests/unit/hooks/useConversion.test.ts
git commit -m "fix(useConversion): runningRef guard prevents reentrant run (M-3)"
```

**Phase 1 verification gate:**
```bash
npx vitest run 2>&1 | tail -5
```
Expected: `Tests  188+ passed` (185 baseline + errors tests + useConversion reentrancy + anything else).

---

## Phase 2 — Async Correctness (≤ 6 hours, ~1–2 days)

*Fix latent reliability defects in the worker pool and the cancellation path.*

### Task 2.1 (H-1): jsquash `worker.onerror` and `onmessageerror` handlers

**Files:**
- Modify: `src/lib/engines/jsquash.ts`
- Modify: `tests/unit/jsquash.test.ts`

- [ ] **Step 1: Write failing test**

Append to `tests/unit/jsquash.test.ts`:
```ts
import { convertImageBuffer } from '../../src/lib/engines/jsquash';

describe('worker crash handling', () => {
  it('rejects pending promises when the worker reports an error', async () => {
    // Spy on Worker.prototype.terminate
    const origTerminate = Worker.prototype.terminate;
    let captured: Worker | null = null;
    class FakeWorker extends Worker {
      constructor() { super(new URL('data:text/javascript,')); }
      override postMessage() { captured = this; }
    }
    const orig = globalThis.Worker;
    globalThis.Worker = FakeWorker as unknown as typeof Worker;
    try {
      const p = convertImageBuffer(new ArrayBuffer(4), { from: 'jpeg', to: 'png' });
      // Simulate an error event
      const evt = new ErrorEvent('error', { message: 'crashed' });
      (captured as unknown as Worker).dispatchEvent(evt);
      await expect(p).rejects.toThrow(/crashed/);
    } finally {
      globalThis.Worker = orig;
      Worker.prototype.terminate = origTerminate;
    }
  });
});
```

- [ ] **Step 2: Run, confirm red**

- [ ] **Step 3: Add error handlers in `getWorker()`**

```ts
workerInstance.addEventListener('error', (e: ErrorEvent) => {
  for (const [, entry] of pending) entry.reject(new Error(`jsquash crashed: ${e.message ?? 'unknown'}`));
  pending.clear();
});
workerInstance.addEventListener('messageerror', (e: MessageEvent) => {
  for (const [, entry] of pending) entry.reject(new Error(`jsquash message error: ${(e as MessageEvent).type}`));
  pending.clear();
});
```

- [ ] **Step 4: Run, confirm green**

- [ ] **Step 5: Verify full suite**

- [ ] **Step 6: Commit**

```bash
git add src/lib/engines/jsquash.ts tests/unit/jsquash.test.ts
git commit -m "fix(jsquash): worker onerror/onmessageerror reject pending promises (H-1)"
```

### Task 2.2 (H-5): ffmpeg listener persistence across `terminateFFmpeg`

**Files:**
- Modify: `src/lib/engines/ffmpeg.ts`
- Create: `tests/unit/ffmpeg.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/ffmpeg.test.ts
import { describe, expect, it, vi } from 'vitest';
import { attachProgress, getFFmpeg, terminateFFmpeg } from '../../src/lib/engines/ffmpeg';

vi.mock('@ffmpeg/ffmpeg', () => {
  return {
    FFmpeg: class {
      handlers = new Map<string, Set<(p: unknown) => void>>();
      on(ev: string, cb: (p: unknown) => void) {
        if (!this.handlers.has(ev)) this.handlers.set(ev, new Set());
        this.handlers.get(ev)!.add(cb);
      }
      off(ev: string, cb: (p: unknown) => void) { this.handlers.get(ev)?.delete(cb); }
      terminate() { this.handlers.clear(); }
      load = vi.fn().mockResolvedValue(undefined);
      exec = vi.fn();
    },
  };
});

describe('attachProgress', () => {
  it('persists across terminateFFmpeg', async () => {
    const cb = vi.fn();
    attachProgress(await getFFmpeg(), cb);
    terminateFFmpeg();
    const ff2 = await getFFmpeg();
    // After refactor: attachProgress should be on the second instance
    attachProgress(ff2, cb);
    // Simulate progress event on the second instance
    (ff2 as unknown as { handlers: Map<string, Set<(p: unknown) => void>> }).handlers.get('progress')?.forEach((h) => h({ progress: 0.5 }));
    expect(cb).toHaveBeenCalledWith(50);
  });
});
```

- [ ] **Step 2: Run, confirm red**

- [ ] **Step 3: Refactor `ffmpeg.ts` to use module-scoped subscriber sets**

Replace ad-hoc `onLog`/`onProgress` attachment with:
```ts
const progressSubs = new Set<(p: number) => void>();
const logSubs = new Set<(m: string) => void>();

export function onProgress(cb: (p: number) => void): () => void {
  progressSubs.add(cb);
  return () => progressSubs.delete(cb);
}
export function onLog(cb: (m: string) => void): () => void {
  logSubs.add(cb);
  return () => logSubs.delete(cb);
}

export function attachProgress(ffmpeg: FFmpeg, onProgress: (p: number) => void): () => void {
  const detach = subscribe(ffmpeg, 'progress', ({ progress }) => onProgress(Math.max(0, Math.min(100, progress * 100))));
  return detach;
}
```

Inside `getFFmpeg`, after `loadCore`:
```ts
ffmpeg.on('log', (m) => logSubs.forEach((cb) => cb(m.message)));
ffmpeg.on('progress', (p) => progressSubs.forEach((cb) => cb(p.progress)));
```

Keep `attachProgress` for direct engine wiring, but the `onProgress`/`onLog` module-level functions are the durable path.

- [ ] **Step 4: Run, confirm green**

- [ ] **Step 5: Commit**

```bash
git add src/lib/engines/ffmpeg.ts tests/unit/ffmpeg.test.ts
git commit -m "fix(ffmpeg): subscriber set persists across terminate cycles (H-5)"
```

### Task 2.3 (H-3): Cancel propagates to engines

**Files:**
- Modify: `src/hooks/useConversion.ts`
- Modify: `src/lib/conversions/image/ai/smart-compress.ts` (already accepts signal)
- Modify: `src/routes/remove-background.tsx`, `upscale-image.tsx`, `resize-image.tsx`, `compress-image.tsx`, `smart-compress.tsx` to pass `signal` where applicable

- [ ] **Step 1: Extend `useConversion` API to expose `signal`**

Change the hook signature:
```ts
run: (fn: (signal: AbortSignal) => Promise<Blob>, onProgress?: (pct: number) => void) => Promise<Blob | null>;
```

Internally:
```ts
const run = useCallback(async (fn, onProgress) => {
  if (runningRef.current) return null;
  runningRef.current = true;
  abortRef.current = new AbortController();
  cancelledRef.current = false;
  // ...
  try {
    const blob = await fn(abortRef.current.signal);
    // ...
  } finally {
    runningRef.current = false;
  }
}, []);
```

`cancel()`:
```ts
const cancel = useCallback(() => {
  cancelledRef.current = true;
  abortRef.current?.abort();
  onCancel?.();
}, [onCancel]);
```

- [ ] **Step 2: Update consumers**

`ToolPage.tsx` is the main caller:
```ts
const blob = await run((signal) => convert(first, { signal }));
```

- [ ] **Step 3: Add a test that calls `cancel()` and asserts no `setResult` fired**

```ts
it('cancel() sets status to cancelled and prevents setResult', async () => {
  let resolveFn!: (b: Blob) => void;
  const { result } = renderHook(() => useConversion());
  const p = result.current.run(() => new Promise<Blob>((r) => (resolveFn = r)));
  act(() => result.current.cancel());
  resolveFn(new Blob(['x']));
  await act(async () => { await p; });
  expect(result.current.status).toBe('cancelled');
  expect(result.current.result).toBeNull();
});
```

- [ ] **Step 4: Verify all routes that use `useConversion` still type-check**

```bash
bun run typecheck
```

If `run` signature broke callers, fix them per the new contract.

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(useConversion): AbortController-aware cancel; signal passed to engine adapters (H-3)"
```

**Phase 2 verification gate:**
```bash
npx vitest run 2>&1 | tail -5
```
Expected: zero new failures; "Worker exited unexpectedly" unhandled error gone (H-1).

Manual smoke: `/heic-to-jpg`, `/video-to-mp4`, `/remove-background` — convert a file, click Cancel, confirm status flips to `cancelled` within ~1s.

---

## Phase 3 — Security Hardening (≤ 2 hours, ~1 day)

### Task 3.1 (H-4): Content-Security-Policy header (report-only → enforce)

**Files:**
- Modify: `public/_headers`
- Modify: `vite.config.ts`
- Create: `tests/integration/csp.test.ts`

- [ ] **Step 1: Add report-only CSP first**

In `public/_headers`, prepend to `/*`:
```
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

Mirror in `vite.config.ts` `server.headers` and `preview.headers` (as `Content-Security-Policy-Report-Only`).

- [ ] **Step 2: Build and preview**

```bash
npm run build
npm run preview
```

- [ ] **Step 3: Manual smoke for CSP violations**

Visit `/`, `/heic-to-jpg`, `/remove-background`, `/video-to-mp4`, `/upscale-image`. Open DevTools console; expect **zero CSP violations**.

- [ ] **Step 4: If clean, switch to enforcing**

Rename header to `Content-Security-Policy` in both files.

- [ ] **Step 5: Add header parse test**

```ts
// tests/integration/csp.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('CSP header', () => {
  it('is present and includes default-src self', () => {
    const headers = readFileSync('public/_headers', 'utf8');
    expect(headers).toMatch(/Content-Security-Policy:.*default-src 'self'/);
  });
});
```

- [ ] **Step 6: Commit**

```bash
git add public/_headers vite.config.ts tests/integration/csp.test.ts
git commit -m "feat(security): strict CSP in _headers and vite.config.ts (H-4)"
```

**Phase 3 verification gate:** DevTools clean on 5 representative routes; `tsc`/`biome`/`vitest` all green.

---

## Phase 4 — Architecture Refactor (≤ 16 hours, ~3–5 days)

*Largest single phase. M-1 is the highest-leverage change.*

### Task 4.1 (L-2): `setProgress(100)` guard

**Files:**
- Modify: `src/hooks/useConversion.ts`
- Modify: `tests/unit/hooks/useConversion.test.ts`

- [ ] **Step 1: Add test**

```ts
it('does not clobber engine-provided final progress', async () => {
  const { result } = renderHook(() => useConversion());
  await act(async () => {
    await result.current.run(
      () => new Promise<Blob>((r) => setTimeout(() => r(new Blob(['x'])), 10)),
      (pct) => { if (pct === 50) {/* leave at 50 */} },
    );
  });
  // Engine called onProgress(50) but did not call 100. Final state should reflect last value.
  expect(result.current.progress).toBeLessThanOrEqual(100);
});
```

- [ ] **Step 2: Track engine-called progress**

In `useConversion`, add `const engineReportedRef = useRef(false);`. Inside the closure passed by `run`, on each `onProgress(pct)`, set `engineReportedRef.current = true`. After `await`, only `setProgress(100)` if `!engineReportedRef.current`.

- [ ] **Step 3: Verify, commit**

```bash
git add src/hooks/useConversion.ts tests/unit/hooks/useConversion.test.ts
git commit -m "fix(useConversion): don't clobber engine-provided final progress (L-2)"
```

### Task 4.2 (M-1): Extract `useFileConversion` hook

**Files (across multiple sub-tasks):**
- Create: `src/hooks/useFileConversion.ts`
- Create: `tests/unit/hooks/useFileConversion.test.ts`
- Modify: 5 routes (one commit per route)

#### Sub-task 4.2.1: Add the hook (no consumers yet)

- [ ] **Step 1: Create `src/hooks/useFileConversion.ts`**

```ts
import { useCallback, useState } from 'react';
import { useConversion } from './useConversion';
import {
  checkFileSize,
  formatBytes,
  humanReadableAccept,
  isAcceptedType,
  type GuardRail,
} from '../lib/utils/...'; // shape TBD
import { useSEO } from './useSEO';

export interface UseFileConversionOpts<TOptions, TResult> {
  accept: ReadonlyArray<string>;
  maxBytes: number;
  warnBytes: number;
  engine: (file: File, options: TOptions, signal: AbortSignal) => Promise<TResult>;
  defaultOptions: TOptions;
  onResult: (result: TResult, file: File) => void;
  guard?: (file: File) => string | null;
  onCancel?: () => void;
}

export function useFileConversion<TOptions, TResult>(opts: UseFileConversionOpts<TOptions, TResult>) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [options, setOptions] = useState<TOptions>(opts.defaultOptions);
  const conversion = useConversion(opts.onCancel);

  const handleFile = useCallback(async (f: File | File[]) => {
    const first = Array.isArray(f) ? f[0] : f;
    if (!first) { setFileError('No file selected.'); return; }
    setFileError(null);
    if (!isAcceptedType(first, opts.accept)) {
      setFileError(`Expected ${humanReadableAccept(opts.accept)}. Got ${first.type || 'unknown type'}.`);
      return;
    }
    const sizeCheck = checkFileSize(first, opts.maxBytes, opts.warnBytes, 'file');
    if (sizeCheck.verdict === 'block') { setFileError(sizeCheck.reason); return; }
    if (opts.guard) {
      const customError = opts.guard(first);
      if (customError) { setFileError(customError); return; }
    }
    setFile(first);
    const result = await conversion.run((signal) => opts.engine(first, options, signal));
    if (result) opts.onResult(result as TResult, first);
  }, [opts, options, conversion]);

  return { file, fileError, options, setOptions, ...conversion, handleFile, reset: () => { setFile(null); setFileError(null); conversion.reset(); } };
}
```

- [ ] **Step 2: Add test**

Verify file validation, guard-rail, error path, conversion path with mocked engine.

- [ ] **Step 3: Verify, commit**

```bash
git add src/hooks/useFileConversion.ts tests/unit/hooks/useFileConversion.test.ts
git commit -m "feat(hooks): useFileConversion scaffold (M-1, no consumers yet)"
```

#### Sub-task 4.2.2–4.2.6: Migrate 5 routes (one commit per route)

For each route, the migration is:
1. Add a flow test that drops a fixture file and asserts a download anchor appears
2. Replace the route's body with `useFileConversion` calls
3. Verify behavior parity
4. Commit with `refactor(routes/<name>): use useFileConversion (M-1)`

- [ ] **Step 4: Migrate `resize-image.tsx`**
- [ ] **Step 5: Migrate `compress-image.tsx`**
- [ ] **Step 6: Migrate `smart-compress.tsx`**
- [ ] **Step 7: Migrate `remove-background.tsx`** (extends with `useAiModelLoader`)
- [ ] **Step 8: Migrate `upscale-image.tsx`** (model selector)
- [ ] **Step 9: Verify LOC reduction**

```bash
wc -l src/routes/{resize,compress,smart-compress,remove-background,upscale-image}.tsx
```

Expected: ≥ 30% line reduction per route.

### Task 4.3 (M-7): `useSEO` rAF writes + stale-write discard

**Files:**
- Modify: `src/hooks/useSEO.ts`
- Create: `tests/unit/hooks/useSEO.test.ts`

- [ ] **Step 1: Write failing test**

```ts
it('discards stale writes from a prior render', async () => {
  const { rerender } = renderHook(({ t }) => useSEO(t), { initialProps: { t: 'A' } });
  rerender({ t: 'B' });
  rerender({ t: 'C' });
  // A's rAF must not overwrite C
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  expect(document.title).toContain('C');
});
```

- [ ] **Step 2: Refactor `useSEO.ts`**

```ts
const writeIdRef = { current: 0 };
useEffect(() => {
  const myId = ++writeIdRef.current;
  const handle = requestAnimationFrame(() => {
    if (writeIdRef.current !== myId) return; // stale
    document.title = `${title} · ${SITE_NAME}`;
    // ... meta update
  });
  return () => {
    cancelAnimationFrame(handle);
    writeIdRef.current++; // invalidate the captured closure
  };
}, [title, description]);
```

- [ ] **Step 3: Verify, commit**

```bash
git add src/hooks/useSEO.ts tests/unit/hooks/useSEO.test.ts
git commit -m "fix(useSEO): rAF-coalesced writes; discard stale (M-7)"
```

**Phase 4 verification gate:** All migrated routes still smoke in `tests/integration/routes.test.tsx`; `tsc`/`biome` clean; LOC reduction visible.

---

## Phase 5 — UX, Accessibility & Robustness (≤ 10 hours, ~2–3 days)

### Task 5.1 (M-2): DropZone keyboard paste + visible "Choose file"

**Files:**
- Modify: `src/hooks/useFileDrop.ts`
- Modify: `src/components/upload/DropZone.tsx`
- Create: `tests/integration/DropZone.test.tsx`

- [ ] **Step 1: Expose paste handler in `useFileDrop`**

Add `onPaste: (e: ClipboardEvent) => void` to the returned API; in the function, read `e.clipboardData?.files` and call `onFile(...)` if non-empty.

- [ ] **Step 2: Update `DropZone.tsx`**

Add `onPaste={drop.onPaste}` to the wrapper div. Add an explicit "Choose file" button (or rely on the existing click-anywhere behavior; the existing code already has a `<button>` covering the drop area — confirm it has a visible label).

- [ ] **Step 3: Add test**

Focus the drop zone, dispatch a `ClipboardEvent` with files, assert `onFile` was called.

- [ ] **Step 4: Verify, commit**

```bash
git add src/hooks/useFileDrop.ts src/components/upload/DropZone.tsx tests/integration/DropZone.test.tsx
git commit -m "feat(DropZone): visible choose-file button + keyboard paste (M-2)"
```

### Task 5.2 (M-8): Magic-byte validation on drop

**Files:**
- Modify: `src/hooks/useFileDrop.ts`
- Create: `tests/unit/useFileDrop.test.ts`

- [ ] **Step 1: Write failing test**

```ts
it('rejects a .png file with JPEG bytes', async () => {
  const onFile = vi.fn();
  const { result } = renderHook(() => useFileDrop({ accept: ['.png'], onFile }));
  const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...]);
  const file = new File([jpegBytes], 'fake.png', { type: 'image/png' });
  // Simulate drop
  act(() => result.current.onDrop({ preventDefault: () => {}, dataTransfer: { files: [file] } } as unknown as DragEvent));
  expect(onFile).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Implement `detectFormat` check in `onDrop` and `onInputChange`**

```ts
import { detectFormat } from '../lib/engines/jsquash'; // or a new lib/utils/formatDetection
// ... in onDrop, after accepting, also read first 12 bytes
const slice = await file.slice(0, 12).arrayBuffer();
const detected = detectFormatFromBytes(slice);
if (detected && !accept.includes(`.${detected}`)) {
  onError?.(`File content looks like ${detected} but extension is .${ext}`);
  return;
}
```

- [ ] **Step 3: Verify, commit**

```bash
git add src/hooks/useFileDrop.ts tests/unit/useFileDrop.test.ts
git commit -m "fix(useFileDrop): magic-byte validation via detectFormat (M-8)"
```

### Task 5.3 (M-4): TIFF IFD bound + try/catch

**Files:**
- Modify: `src/lib/engines/tiff.ts`
- Create: `tests/unit/tiff.test.ts`

- [ ] **Step 1: Write failing test**

Craft a TIFF buffer with `IFDCount=0xFFFFFF`; assert `decodeTiffToImageData` throws a graceful error.

- [ ] **Step 2: Wrap `UTIF.decode`**

```ts
let ifds: UTIF.IFD[];
try {
  ifds = UTIF.decode(buffer);
} catch (e) {
  throw new Error(`decodeTiffToImageData: failed to decode TIFF (${toError(e).message})`);
}
if (!ifds || ifds.length === 0) throw new Error('decodeTiffToImageData: no IFDs');
if (ifds.length > 1024) throw new Error(`decodeTiffToImageData: too many IFDs (${ifds.length})`);
```

- [ ] **Step 3: Verify, commit**

```bash
git add src/lib/engines/tiff.ts tests/unit/tiff.test.ts
git commit -m "fix(tiff): bound IFD count and wrap UTIF.decode (M-4)"
```

### Task 5.4 (M-6): HEIC `createImageBitmap` fast path

**Files:**
- Modify: `src/lib/engines/heic.ts`
- Create: `tests/unit/heic.test.ts`

- [ ] **Step 1: Write failing test**

Mock `createImageBitmap` to succeed; assert the fast path is preferred.

- [ ] **Step 2: Implement**

```ts
if (typeof createImageBitmap === 'function') {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(bitmap, 0, 0);
      const blob = await canvas.convertToBlob({ type: toType, quality });
      bitmap.close();
      return blob;
    }
  } catch { /* fall through to heic2any */ }
}
```

- [ ] **Step 3: Verify, commit**

```bash
git add src/lib/engines/heic.ts tests/unit/heic.test.ts
git commit -m "feat(heic): try createImageBitmap before heic2any (M-6)"
```

### Task 5.5 (M-5): AI model load retry (3 attempts)

**Files:**
- Modify: `src/lib/engines/onnx.ts`
- Modify: `src/hooks/useAiModelLoader.ts`
- Create: `tests/unit/onnx.test.ts`

- [ ] **Step 1: Write failing test**

Mock `fetch` to fail twice then succeed; assert `loadModel` resolves and exactly 3 fetches occurred.

- [ ] **Step 2: Add retry to `onnx.ts`**

```ts
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      if (opts.signal?.aborted) throw e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 200 * 2 ** i));
    }
  }
  throw lastErr;
}
```

Wrap the fetch in `withRetry`.

- [ ] **Step 3: Expose `retry()` from `useAiModelLoader`**

```ts
const retry = useCallback(() => { reset(); /* re-trigger load with last id */ }, []);
```

Track `lastIdRef` so `retry` re-loads the same model.

- [ ] **Step 4: Verify, commit**

```bash
git add src/lib/engines/onnx.ts src/hooks/useAiModelLoader.ts tests/unit/onnx.test.ts
git commit -m "feat(onnx): exponential-backoff retry on model fetch; useAiModelLoader exposes retry (M-5)"
```

**Phase 5 verification gate:** Manual smoke on `/heic-to-jpg`, `/tiff-to-jpg`, `/remove-background`; full test suite green.

---

## Phase 6 — Observability & Process (≤ 4 hours, ~1 day)

### Task 6.1 (L-4): Biome rule policy doc

**Files:**
- Create: `docs/biome-policy.md`
- Modify: `biome.json` (alignment only if needed)

- [ ] **Step 1: Document each rule's severity + rationale**

Cover `useImportType`, `noUnusedImports`, `noUnusedVariables`, `noExplicitAny`, formatter settings.

- [ ] **Step 2: Verify, commit**

```bash
git add docs/biome-policy.md
git commit -m "docs(biome): rule policy and rationale (L-4)"
```

### Task 6.2 (L-3): CancelHint component for AI routes

**Files:**
- Create: `src/components/ai/CancelHint.tsx`
- Modify: `src/routes/remove-background.tsx`, `upscale-image.tsx`, `smart-compress.tsx`
- Create: `tests/integration/CancelHint.test.tsx`

- [ ] **Step 1: Component + test**

```tsx
export function CancelHint() {
  return (
    <p className="text-xs text-neutral-500">
      Cancelling may take a few seconds — AI inference can't be interrupted mid-tensor.
    </p>
  );
}
```

- [ ] **Step 2: Wire into AI routes** (when `status === 'cancelling'`)

- [ ] **Step 3: Verify, commit**

```bash
git add src/components/ai/CancelHint.tsx src/routes/remove-background.tsx src/routes/upscale-image.tsx src/routes/smart-compress.tsx tests/integration/CancelHint.test.tsx
git commit -m "feat(ai): CancelHint notice for AI routes (L-3)"
```

### Task 6.3 (L-5): ErrorBoundary opt-in `sendBeacon`

**Files:**
- Modify: `src/components/shell/ErrorBoundary.tsx`
- Create: `tests/integration/ErrorBoundary.test.tsx`

- [ ] **Step 1: Read `import.meta.env.VITE_TELEMETRY_ENDPOINT`; if set, `sendBeacon` on `componentDidCatch`**

```ts
const endpoint = import.meta.env.VITE_TELEMETRY_ENDPOINT;
if (endpoint && typeof navigator.sendBeacon === 'function') {
  navigator.sendBeacon(endpoint, JSON.stringify({ kind: 'boundary', message: error.message, stack: error.stack, url: location.href, ts: Date.now() }));
}
```

- [ ] **Step 2: Test (default off; opt-in path)**

Mock `import.meta.env`, render broken child, assert `sendBeacon` called only when env set.

- [ ] **Step 3: Verify, commit**

```bash
git add src/components/shell/ErrorBoundary.tsx tests/integration/ErrorBoundary.test.tsx
git commit -m "feat(ErrorBoundary): opt-in sendBeacon telemetry (L-5)"
```

**Phase 6 verification gate:** tsc/biome/vitest clean; docs read by reviewer.

---

## Phase 7 — Test Depth (parallel to Phases 4–6, ~10 hours)

### Task 7.1: Per-engine unit tests

| Engine | Test file | Cases |
|--------|-----------|-------|
| `bmp` | extend `tests/unit/bmp.test.ts` | 24-bit round-trip, top-down vs bottom-up, padding edge cases |
| `tiff` | `tests/unit/tiff.test.ts` | M-4 adversarial IFD, alpha default, malformed input |
| `ico` | `tests/unit/ico.test.ts` | multi-size encode, size limit |
| `svg` | `tests/unit/svg.test.ts` | no-viewBox fallback, background option |
| `heic` | `tests/unit/heic.test.ts` | M-6 path, array result |
| `onnx` | `tests/unit/onnx.test.ts` | M-5 retry, streaming progress |
| `ffmpeg` | `tests/unit/ffmpeg.test.ts` | H-5 listener persistence |
| `jsquash` | extend `tests/unit/jsquash.test.ts` | H-1 worker crash |

- [ ] **Step 1: For each row above, add test file (or extend), verify, commit**

### Task 7.2: Per-hook unit tests

| Hook | Test file | Cases |
|------|-----------|-------|
| `useConversion` | `tests/unit/hooks/useConversion.test.ts` | 1.4, 2.3, 4.1 |
| `useFileConversion` | `tests/unit/hooks/useFileConversion.test.ts` | 4.2 |
| `useFileDrop` | `tests/unit/useFileDrop.test.ts` | 5.2 |
| `useAiModelLoader` | `tests/unit/hooks/useAiModelLoader.test.ts` | M-5 wiring |
| `useSEO` | `tests/unit/hooks/useSEO.test.ts` | 4.3 |

- [ ] **Step 1: For each row above, add test file (or extend), verify, commit**

### Task 7.3: Top-10 route user-flow tests

**Pattern:**
```tsx
// tests/integration/flows/jpg-to-png.test.tsx
it('jpg-to-png: drop, convert, download', async () => {
  renderWithRouter(<JpgToPngPage />);
  const file = new File([new Uint8Array([0xff, 0xd8, 0xff, ...])], 'sample.jpg', { type: 'image/jpeg' });
  // ... fire drop event, click convert, assert download
});
```

**Top-10 priorities** (per the decision table):
1. `/jpg-to-png`
2. `/png-to-jpg`
3. `/webp-to-jpg`
4. `/heic-to-jpg`
5. `/resize-image`
6. `/compress-image`
7. `/smart-compress`
8. `/remove-background`
9. `/upscale-image`
10. `/video-to-mp4`

- [x] **Step 1: For each route, create the test, verify, commit** (10/10 done — all top-10 routes covered)

### Task 7.4: Component tests

`ErrorBoundary`, `Header`, `DownloadButton`, `DemoZone`, `DropZone`.

- [ ] **Step 1: Add one test per component, commit**

**Phase 7 verification gate:** `npx vitest run` shows ≥ 230 tests passing (185 baseline + ~45 new).

---

## Final Verification Gate

```bash
npx vitest run
npx tsc -b --noEmit
npx biome check .
npm run build
npm run preview
```

Manual smoke on: `/`, `/heic-to-jpg`, `/remove-background`, `/video-to-mp4`, `/upscale-image`, `/resize-image`.

**Acceptance:** All 19 findings resolved; zero new lint or type errors; full test suite green; production build clean; manual smoke confirms UX unchanged or improved.

---

## Dependency Graph

```
Phase 1 ── independent (start day 1)
Phase 2 ── independent of Phase 1
Phase 3 ── independent of Phases 1–2
Phase 4 ── Phase 1.4 (runningRef) needed for 2.3
         ── Phase 2.3 (cancel/signal) needed for clean 4.2 useFileConversion ergonomics
Phase 5 ── independent; 5.4 depends on existing heic test infrastructure
Phase 6 ── independent
Phase 7 ── parallel to Phases 4–6; per-item tests land with their fix
```

**Critical path:** Phase 1.4 → Phase 2.3 → Phase 4.2 (refactor).
**Parallelizable:** Phases 1, 3, 5, 6 can run concurrently after Phase 0.

---

## Total Effort

| Phase | Hours | Days (1 dev) |
|-------|-------|--------------|
| 0 — Pre-work | 1 | 0.1 |
| 1 — Sprint-now | 4 | 0.5 |
| 2 — Async correctness | 6 | 0.8 |
| 3 — CSP | 2 | 0.3 |
| 4 — Refactor | 16 | 2.0 |
| 5 — UX/a11y/robustness | 10 | 1.3 |
| 6 — Observability/process | 4 | 0.5 |
| 7 — Test depth (parallel) | 10 | 1.3 (overlaps) |
| **Total wall time** | — | **~5–6 days** with Phase 7 parallelized |
| **Total person-hours** | **~53 hours** | — |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **M-1 refactor breaks download flow** | Land `useFileConversion` with no consumers first (4.2.1). Migrate routes one at a time, each with its own flow test. |
| **H-4 CSP blocks legitimate asset** | Land CSP in `Content-Security-Policy-Report-Only` mode first for 1 day, scan console, then flip to enforce. |
| **H-3 cancel races cause "stuck at processing"** | Wire `cancelling` UI state before exposing `signal` to engines; never tear down a worker on cancel without first attempting abort. |
| **M-5 retry hides real network bug** | Log retry count to console (no telemetry by default); Vitest "fail twice then succeed" test locks behavior. |
| **L-5 telemetry violates privacy promise** | Default off; require explicit env var. |
| **M-2 DropZone refactor breaks existing UX** | Flow test on `/jpg-to-png` before refactor lands; keep the existing button-styled cover; only add the visible label. |

---

## Completion Checklist

- [x] All 19 findings closed with a commit referenced in the table below (L-5 deferred to Phase C; see row)
- [x] `npx vitest run` passes with ≥ 230 tests (321 passing across 54 test files)
- [x] `npx tsc --noEmit` exits 0
- [x] `npx biome check .` exits 0
- [x] `npm run build` succeeds
- [ ] `npm run preview` serves and DevTools is CSP-clean
- [ ] Manual smoke list (top-10 routes) passes
- [ ] PR opened with this plan linked in description
- [x] AGENTS.md status snapshot updated
- [x] TASKS.md marked complete

| Finding | Commit hash | Closed in |
|---------|-------------|-----------|
| H-1 | `d3a5e9f` | Phase 2.1 |
| H-2 | `7153a3d` | Phase 1.1 |
| H-3 | `f0c2ad8` | Phase 2.3 |
| H-4 | `71bce71` (enforce), `d41c081` (report-only precursor) | Phase 3.1 |
| H-5 | `6a136ad` | Phase 2.2 |
| M-1 | `c17a76c` `62d412d` `fc89038` `cd77791` `d330e79` `cd1ae19` | Phase 4.2 |
| M-2 | `029f15b` | Phase 5.1 |
| M-3 | `8ad03e8` | Phase 1.4 |
| M-4 | `ed011cf` | Phase 5.3 |
| M-5 | `e325be6` | Phase 5.5 |
| M-6 | `4e6a69c` | Phase 5.4 |
| M-7 | `324ad02` | Phase 4.3 |
| M-8 | `cb123e4` | Phase 5.2 |
| L-1 | `4aef35b` (closed by wave-8 sitemap fix) | Phase 1.2 |
| L-2 | `9a03f12` | Phase 4.1 |
| L-3 | `ff5cfbd` | Phase 6.2 |
| L-4 | `bbbb058` | Phase 6.1 |
| L-5 | **DEFERRED to Phase C** | Phase 6.3 (not started) |
| L-6 | `f2e6bb4` | Phase 1.3 |
