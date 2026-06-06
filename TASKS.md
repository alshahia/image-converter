# Active Tasks — V&V Code Review Fixes

> **Source plan:** [`docs/superpowers/plans/2026-06-05-vandv-fixes.md`](docs/superpowers/plans/2026-06-05-vandv-fixes.md)
> **Branch:** `v2/vandv-fixes` (off `main`)
> **Baseline:** 185 tests passing, 26 files; `tsc`/`biome` clean
> **Started:** 2026-06-05
> **Status (2026-06-05):** 18 of 19 findings closed; L-5 deferred to Phase C; 321 tests passing across 54 files

**Goal:** Close all 19 V&V findings (0 Critical, 5 High, 8 Medium, 6 Low).

---

## Phase 0 — Pre-Work
- [x] Read context files (useConversion, useFileDrop, jsquash, ffmpeg, onnx, heic, tiff, useSEO, DropZone, ToolPage, AGENTS.md, vite.config.ts, biome.json, package.json, AGENTS.md)
- [x] Capture baseline: `npx vitest run` → 185 passing
- [x] Verify `tsc -b` clean, `biome check` clean
- [x] Create branch `v2/vandv-fixes` from `main`
- [x] Save `tests/.baseline.txt` for diff later

## Phase 1 — Sprint-Now (≤ 4 hours)
- [x] **1.1 H-2** Remove `void progressHandler` dead code in `useConversion.ts` (commit `7153a3d`)
- [x] **1.2 L-1** `public/sitemap.xml` already exists with 49 URLs (home + privacy + 46 routes + 1 dup) — populated in wave-8 SEO commit `4aef35b`. **Closed by prior work; no action needed.**
- [x] **1.3 L-6** Add `toError()` helper in `src/lib/utils/errors.ts`; use in `useConversion` + `useAiModelLoader` (commit `f2e6bb4`)
- [x] **1.4 M-3** Add `runningRef` guard to `useConversion.run`; test reentrancy (commit `8ad03e8`)

**Phase 1 gate:** `npx vitest run` → 195 tests passing ✓ (target was ≥ 188)

## Phase 2 — Async Correctness (≤ 6 hours)
- [x] **2.1 H-1** Add `worker.onerror` + `onmessageerror` to jsquash pool; test (commit `d3a5e9f`)
- [x] **2.2 H-5** Module-scoped subscriber set in `ffmpeg.ts` for progress/log; test (commit `6a136ad`)
- [x] **2.3 H-3** AbortController-aware `useConversion`; pass `signal` to engine adapters (commit `f0c2ad8`)

**Phase 2 gate:** Manual smoke on `/heic-to-jpg`, `/video-to-mp4`, `/remove-background` cancel works ✓

## Phase 3 — Security Hardening (≤ 2 hours)
- [x] **3.1 H-4** Add `Content-Security-Policy-Report-Only`, smoke 5 routes, then flip to enforcing (commits `d41c081`, `71bce71`)

**Phase 3 gate:** DevTools clean on `/`, `/heic-to-jpg`, `/remove-background`, `/video-to-mp4`, `/upscale-image` ✓

## Phase 4 — Architecture Refactor (≤ 16 hours)
- [x] **4.1 L-2** `useConversion` doesn't clobber engine-provided final progress (commit `9a03f12`)
- [x] **4.2 M-1** Extract `useFileConversion` hook
  - [x] **4.2.1** Add hook with no consumers (commit `cd1ae19`)
  - [x] **4.2.2** Migrate `resize-image.tsx` (commit `c17a76c`)
  - [x] **4.2.3** Migrate `compress-image.tsx` (commit `62d412d`)
  - [x] **4.2.4** Migrate `smart-compress.tsx` (commit `fc89038`)
  - [x] **4.2.5** Migrate `remove-background.tsx` (with `useAiModelLoader`) (commit `cd77791`)
  - [x] **4.2.6** Migrate `upscale-image.tsx` (with model selector) (commit `d330e79`)
- [x] **4.3 M-7** `useSEO` rAF writes; discard stale writes (commit `324ad02`)

**Phase 4 gate:** ≥ 30% LOC reduction per migrated route; `tsc`/`biome`/`vitest` clean ✓

## Phase 5 — UX, Accessibility & Robustness (≤ 10 hours)
- [x] **5.1 M-2** DropZone keyboard paste (commit `029f15b`)
- [x] **5.2 M-8** Magic-byte validation in `useFileConversion` (commit `cb123e4`)
- [x] **5.3 M-4** TIFF IFD bound + `try/catch` around `UTIF.decode` (commit `ed011cf`)
- [x] **5.4 M-6** HEIC `createImageBitmap` fast path (commit `4e6a69c`)
- [x] **5.5 M-5** AI model load retry (3 attempts, exponential backoff) (commit `e325be6`)

**Phase 5 gate:** Manual smoke on image/AI routes; full test suite green ✓

## Phase 6 — Observability & Process (≤ 4 hours)
- [x] **6.1 L-4** `docs/biome-policy.md` — rule-by-rule policy (commit `bbbb058`)
- [x] **6.2 L-3** `CancelHint` UI for AI routes (commit `ff5cfbd`) — implemented inline in `ProcessingStatus`, not as a separate `CancelHint.tsx` component (deemed unnecessary indirection)
- [ ] **6.3 L-5** `ErrorBoundary` opt-in `sendBeacon` via `VITE_TELEMETRY_ENDPOINT` — **DEFERRED to Phase C** (per user decision 2026-06-05)

**Phase 6 gate:** Docs reviewed, components mount, no console regressions ✓ (L-5 explicit skip)

## Phase 7 — Test Depth (parallel to Phases 4–6, ≤ 10 hours)
- [x] **7.1** Per-engine unit tests — **largely complete**
  - bmp, tiff, ico, svg, heic, onnx, ffmpeg, jsquash, formatDetection, fileValidation
  - Pre-existing tests: `bmp`, `ico`, `jsquash`, `jsquash-worker-error`, `ffmpeg-listeners`, `formatDetection`
  - Added in V&V cycle: `tiff` (M-4), `heic` (M-6), `onnx` (M-5)
- [x] **7.2** Per-hook unit tests — **largely complete**
  - `useConversion` (M-3, H-3, L-2), `useFileConversion` (M-1, M-8), `useSEO` (M-7), `useAiModelLoader`
  - Pre-existing: `useConversion` family (`useConversion`, `useConversion-signal`, `useConversion-progress`)
  - Added in V&V cycle: `useFileConversion` (M-1 + M-8), `useSEO` (M-7), `useAiModelLoader`
- [x] **7.3** Top-10 route user-flow tests — **complete** (10/10 routes: jpg-to-png, png-to-jpg, webp-to-jpg, heic-to-jpg, resize-image, compress-image, smart-compress, remove-background, upscale-image, video-to-mp4)
- [x] **7.4** Component tests — **complete**
  - `DropZone` (M-2), `ProcessingStatus` (L-3), `toolOptions`, `ErrorBoundary`, `Header`, `DownloadButton`, `DemoZone`

**Phase 7 gate:** `npx vitest run` → 321 tests passing (target was ≥ 230) ✓

## Final Verification
- [x] `npx vitest run` ≥ 230 passing, 0 unhandled errors (321 passing)
- [x] `npx tsc -b --noEmit` exits 0
- [x] `npx biome check .` exits 0
- [x] `npm run build` succeeds (heic chunk >500kB is a known pre-existing condition)
- [ ] `npm run preview` serves; manual smoke on top-10 routes passes (operator gate)
- [x] All 19 finding IDs in plan's "Completion Checklist" filled with commit hashes (L-5 marked DEFERRED)
- [x] AGENTS.md status snapshot updated
- [x] Branch `v2/vandv-fixes` is 35+ commits ahead of `main`
- [ ] PR opened with plan linked (operator gate)

---

## Decisions Locked In (2026-06-05)

| # | Question | Default |
|---|----------|---------|
| 1 | M-1 refactor granularity | One PR per route (5 PRs + 1 for the hook) |
| 2 | H-4 CSP rollout | Report-only first, then enforce after smoke |
| 3 | M-5 retry count | 3 attempts, 200→400→800 ms |
| 4 | H-3 cancel semantics | Signal only, no worker teardown |
| 5 | L-5 telemetry | Defer to Phase C planning |
| 6 | Phase 7 test depth | Top-10 priority routes for full flow tests |

---

## Open Follow-ups (2026-06-05)

These are non-blocking, not part of the 19-finding plan, but worth
tracking before the PR opens:

- [x] **7.3 complete** — All 10 top-10 route user-flow tests done:
      `/jpg-to-png`, `/png-to-jpg`, `/webp-to-jpg`, `/heic-to-jpg`,
      `/resize-image`, `/compress-image`, `/smart-compress`,
      `/remove-background`, `/upscale-image`, `/video-to-mp4`.
- [ ] **Manual smoke gate** — Top-10 routes: `/`, `/jpg-to-png`,
      `/resize-image`, `/heic-to-jpg`, `/compress-image`,
      `/smart-compress`, `/remove-background`, `/upscale-image`,
      `/video-to-mp4`, `/strip-exif`. Run `npm run preview`, walk
      through each, confirm no console errors and CSP-clean.
- [ ] **PR open** — Once manual smoke passes, push
      `v2/vandv-fixes` and open PR with this plan linked in the
      description.
