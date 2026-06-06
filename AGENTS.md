# AGENTS.md

## Project state

**Phase A done. Phase B+ (feature parity push) in progress.** Full
codebase exists; building toward 51 tool routes + batch + PWA + AI.

- **Stack**: React + TypeScript + Vite + Vitest. Bun is package manager only.
- **41 commits** on `main`. Git repo initialized at GitHub.
- **183 tests passing** across 26 test files (unit + integration).
- **20 prod dependencies** (`@ffmpeg/*`, `jsquash` (6 sub-packages),
  `canvg`, `heic2any`, `idb-keyval`, `jsbarcode`, `jszip`, `onnxruntime-web`,
  `piexifjs` — keep, see known issues, `qrcode`, `react`, `react-dom`,
  `react-router-dom`, `utif`, `workbox-window`, `zustand`) + **17 devDependencies**
  (Vite, Vitest, TypeScript, Biome, Tailwind, PostCSS, `happy-dom`, `jsdom`,
  `vite-plugin-pwa`).
- **46 tool routes** under `/` (kebab-case). Phase A (11) + Wave 1
  AVIF/JXL/HEIC-expand/BMP/TIFF/ICO/SVG (20) + Wave 2
  crop/rotate/watermark/view-exif (4) + Wave 3 video
  trim/crop/rotate/mute/speed/resize/extract-frames/to-webm (8) + Wave 8
  AI bg-removal/upscale/smart-compress (3) are live.
- **Vite dev/build** working. COOP/COEP headers in `public/_headers`.
- ffmpeg-core files self-hosted in `public/ffmpeg/`.
- **Phase B+ plan:** `design/phase-b-implementation-plan.md` (binding,
  APPROVED 2026-06-04). Extends Phase B scope per
  `design-doc.md:378-401` with 8 waves, ~51 total routes, AI features,
  PWA, batch. Validation gate skipped per user decision.

The folder path (`E:\flutter\image_convertor`) is a leftover from an
earlier Flutter idea — ignore it. The product is a browser tool.

## Read first, every session

In this order:

0. **`skills_guide&roadmap.md`** (project root) — meta-skill selection
   guide. Tells the agent which skills to load per task type
   (writing-plans, systematic-debugging, test-driven-development,
   verification-before-completion, frontend-design, etc.) and which
   phase of the project roadmap it is on. Read immediately after this
   file, before any other doc, so the rest of the session uses
   the right workflow.
1. **`SOUL.md`** — behavioral code for the agent (values, identity,
   security posture, no-flattery rule, push-back on weak choices).
   Read before doing anything. Arabic version exists as `SOUL_ar.md`
   (same content).
2. **`design/design-doc.md`** — the phased plan (A → B → C with
   validation gates). Source of truth for *what* to build. APPROVED
   2026-06-02.
3. **`design/phase-a-implementation-plan.md`** — engineering plan for
   Phase A. APPROVED 2026-06-02.
4. **`design/phase-b-implementation-plan.md`** — engineering plan for
   Phase B+ (feature parity push: 51 routes, AI, PWA, batch).
   APPROVED 2026-06-04. **This is the active plan.** All current
   work follows its 8 waves.

The 5 files in `research/` explain *why* the stack was chosen. Most
agents will only need `research/tech-stack-analysis.md` (why Bun is the
package manager only, not the runtime) and `research/target-ezgif.md`
(what we're building toward).

## What the user has committed to (binding)

- **Phased delivery**: A → validate → B → validate → C. **Exception
  (2026-06-04):** the A→B validation gate is **skipped** per user
  decision. Phase B+ work proceeds in parallel. Do not start Phase C
  work (server-side FFmpeg, job queues, R2 storage, Stripe) without
  its own gate.
- **Phase A constraints** (still binding): pure client-side, no
  server code, no auth, no Stripe. PWA, service worker, and AI
  features are explicitly added in Phase B+ and are NOT Phase A.
- **Bun is the package manager only.** Per `tech-stack-analysis.md`,
  Bun as a runtime adds nothing to a static client-side app. Use
  `bun install` for installs; Vite for dev/build. Do not write a
  Bun server.
- **Out of scope (permanent)**: PDF tools, OCR, cloud sync, accounts,
  face restore, style transfer on portraits, DeepOldify, real NLE
  video editing, public API/paid tier (Phase C), i18n, dark mode.
  See `design/phase-b-implementation-plan.md` §"Out of scope" for
  the full list and reasoning.

## Conventions specific to this repo

These are not defaults — an agent would miss them:

- **COOP/COEP headers are mandatory.** `public/_headers` on
  Cloudflare Pages must set `Cross-Origin-Opener-Policy: same-origin`
  and `Cross-Origin-Embedder-Policy: require-corp`. ffmpeg.wasm
  refuses to initialize without them.
- **All assets self-hosted.** No Google Fonts, no Font Awesome CDN,
  no third-party iframes. COEP blocks cross-origin resources.
- **ffmpeg-core files are self-hosted in `public/ffmpeg/`**, never
  loaded from a CDN. ffmpeg.wasm v0.12+ needs the core at a
  same-origin URL.
- **EXIF is stripped by default in every image tool** (via
  `piexifjs`). The dedicated `/strip-exif` route exists for the
  no-conversion case only.
- **One route per tool, kebab-case under `/`.** See
  `phase-a-implementation-plan.md` for the 11 route names.
- **The office-hours "YC pitch" framing does NOT apply.** This is a
  developer tool, not a YC application. Skip founder-resources / YC
  references in any inherited agent prompts.

## What to ignore

- **`.windsurf/`** — agent prompt configuration, not project content.
  Do not read as documentation. Do not modify. The design doc notes
  the user may want to archive this folder once Phase A ships.
- **`CLAUDE.md` at the user level** (`C:\Users\Ahmad Mahmoud\.claude\`)
  is the gstack integration file for the user, not project-level
  guidance.
- **The folder name `image_convertor`** implies a Flutter project. It
  is not.

## Status snapshot

| Item | Status |
|---|---|
| `design/design-doc.md` | APPROVED 2026-06-02 |
| `design/phase-a-implementation-plan.md` | APPROVED 2026-06-02 |
| `design/phase-b-implementation-plan.md` | APPROVED 2026-06-04 |
| Phase A build | Done (11 tools, 85 tests) |
| Phase B+ build | Wave 8 done (46 tools, 183 tests) |
| V&V fix plan | 18 of 19 findings fixed (L-5 deferred to Phase C); 252 tests, 24+ commits on `v2/vandv-fixes` branch |
| Git repo | Initialized (41+ commits on main) |
| Dependencies installed | Yes (12 + 16 devDeps) |
| Tests passing | 252 across 33 test files |

## Known issues for agents

- **jSquash WASM in dev mode**: `vite.config.ts` excludes jsquash packages from
  `optimizeDeps` to prevent WASM loading failures in dev. Run `npx vitest run`
  (not through Bun) — Bun's Vitest runner has module resolution quirks.
- **`piexifjs` is declared but unused in imports**: The exif module imports it
  at the type level only. Do not remove from `package.json` — `strip-exif`
  routes depend on it at runtime. The unused-import lint complaint is known.
- **`v7_startTransition` future flag**: React Router v6 warns about this.
  Do not add the flag — it will be the default in v7.
- **No `ffprobe` WASM**: ffmpeg.wasm v0.12 does not ship ffprobe. The video
  tools infer input format from the file extension. This is a known limitation.
- **Biome, not ESLint/Prettier**: Linting uses `biome check .`; formatting
  uses `biome format --write .`. Do not add ESLint or Prettier config.
- **Vitest env is `jsdom`** (per `vitest.config.ts`). `happy-dom` is also
  in devDeps as a fallback. Do not switch to `node` or `edge`.
- **First-turn trap**: If the user opens a session with a retrospective question
  ("What did we do so far?"), it is a question about the project's history and
  the AGENTS.md/docs — not an instruction to continue working. Ask clarifying
  questions before executing. Read SOUL.md first, per the "Read first" section.
- **The `useSEO` hook** (`src/hooks/useSEO.ts`) sets `document.title` + meta
  description per route. Already wired into ToolPage and all page components.
  Do not add react-helmet-async — this hook is sufficient for Phase A.
- **ToolPage defaults `onCancel` to `terminateWorker`** — 4 routes that don't
  pass an explicit `onCancel` get cancellation for free. The remaining routes
  (heic-to-jpg, resize-image, compress-image) pass it explicitly.
- **`a11y/noSvgWithoutTitle` lint warnings** exist for decorative SVGs (Header
  logo, HomePage icons). These are low-priority — the SVGs are `aria-hidden`.
- **jsquash `terminateWorker()` now rejects pending promises** (`src/lib/engines/jsquash.ts`).
  Previously it only cleared the pending map — now it rejects in-flight conversions
  so `useConversion` transitions to `'cancelled'`.
- **No outstanding pre-existing type errors.** Earlier claims of missing
  `WARN_IMAGE_BYTES` imports in `compress-image.tsx` / `resize-image.tsx` and
  `HomePage.tsx` meta-undefined were stale; both routes now import the
  guardRails constant and `useSEO` is fully typed.
- **History feature is FROZEN** (per user decision 2026-06-04). No
  `/history` route, no history state extension, no Footer link. Do
  not build until the user unfreezes.
- **iOS video tools limitation is documented, not fixed.** Video
  routes get a non-blocking informational banner on iOS Safari. No
  server-side fallback. Revisit if browser updates fix
  SharedArrayBuffer.
- **Mobile-first is scattered, not retrofitted.** Every new component
  is built mobile-first in its own wave (44px touch targets, no-hover
  fallbacks). There is no Wave 7 retro-pass.
- **AI model files must be in `public/models/`** before Wave 8. Accepted licenses: **MIT, Apache 2.0, BSD-3-Clause** (all permissive; only attribution required). GPL/LGPL/source-available/non-commercial/custom licenses are NOT accepted. If a different license is required, raise it before commit.

  **Wave 8 actual model picks** (per 2026-06-04 decision):
  - `silueta.onnx` (~43MB) — U-2-Net variant, **Apache 2.0** (xuebinqin/U-2-Net). Used by `/remove-background`.
  - `realesrgan-x2plus.fp16.onnx` (~34MB) — **BSD-3-Clause** (xinntao/Real-ESRGAN). Used by `/upscale-image` (2× mode).
  - `realesrgan-x4plus.fp16.onnx` (~34MB) — **BSD-3-Clause** (xinntao/Real-ESRGAN). Used by `/upscale-image` (4× mode).

  **Smart-compress has no separate model** — it's codec-quality iteration using `jsquash` jpeg/webp/avif codecs (all MIT).
- **`onnxruntime-web` is the chosen AI engine** for bg-removal
  and upscale. Do not swap to `@imgly/background-removal` without
  user approval — direct ORT is the chosen path (smaller bundle,
  no third-party runtime). `@imgly/background-removal` was removed
  from `package.json` in the post-Wave-8 cleanup commit.
- **`vite-plugin-pwa` is the chosen PWA plugin.** Config-only install
  in Wave 0; full `VitePWA({...})` config lands in Wave 7. Do not
  add `workbox-cli` or hand-rolled service workers.
