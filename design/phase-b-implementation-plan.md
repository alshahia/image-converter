# Phase B+ Implementation Plan (Feature Parity Push)

**Status:** APPROVED 2026-06-04 (user)
**Parent:** `design/design-doc.md` (binding) — extends Phase B scope from
`design-doc.md:378-401` and the session research.
**Goal:** Bring feature parity with ezgif + modern AI-enhanced
competitors. Skip the Phase A→B validation gate per user decision.

## Decisions locked in this session

| Topic | Decision |
|---|---|
| Validation gate (A→B) | **Skip.** User has conviction. |
| AI features | **Full tier:** background removal, upscale (2×/4×), smart compress. No face restore, no style transfer on portraits, no DeepOldify (ethics). |
| Batch + PWA | **Full scope on all routes.** |
| iOS video tools | **Document the limitation, ship best-effort.** iOS Safari has SharedArrayBuffer limits; ffmpeg.wasm may fail. Privacy page and each video tool get an "iOS may not work" note. Revisit if a solution appears. |
| Domain + launch channel | **Deferred.** User decides when build is closer to done. |
| Mobile-first redesign | **Scattered through waves.** Every new component is built mobile-first from the start (touch targets ≥ 44px, mobile hit areas, no-hover fallbacks). No retro-pass in Wave 7. Audit happens inline. |
| History page | **FROZEN.** Wave 6 utility work continues (QR, barcode, diff). History state, route, and Footer link are NOT built. User will decide after the rest of the build. |

## Out of scope (permanent)

- PDF tools (different domain, ghostscript WASM ~5MB, big UX surface)
- OCR / document AI (server-GPU is more honest)
- Cloud sync, accounts, sharing (privacy promise forbids server upload)
- Face restore, style transfer on portraits, DeepOldify (ethics)
- Real NLE video editing (timeline/transitions/color grading)
- Public API, paid tier, Stripe (Phase C territory)
- i18n (English only for now; revisit if demand exists)
- Dark mode (tokens can come online later)

## Library additions (Wave 0, pin in `package.json`)

```jsonc
{
  "dependencies": {
    // Wave 1 — format coverage
    "@jsquash/avif": "^1.5.0",
    "@jsquash/jxl": "^1.5.0",
    "utif": "^3.1.0",
    "to-ico": "^1.1.5",
    "canvg": "^4.0.0",
    // Wave 3-6
    "jszip": "^3.10.1",
    "qrcode": "^1.5.4",
    "jsbarcode": "^3.11.6",
    // Wave 8 — AI
    "@imgly/background-removal": "^1.5.5",
    "onnxruntime-web": "^1.20.0"
  },
  "devDependencies": {
    "@types/jszip": "^3.4.0",
    "@types/qrcode": "^1.5.5",
    // Wave 7 — PWA
    "vite-plugin-pwa": "^0.20.5",
    "workbox-window": "^7.1.0"
  }
}
```

**Self-hosted model files** in `public/models/` (download, commit,
document provenance and license in `public/models/README.md`):

- `briaai/RMBG-1.4` ONNX (~5 MB) — background removal
- `realesrgan/RealESRGAN_x2plus` ONNX (~10 MB) — 2× upscale
- `realesrgan/RealESRGAN_x4plus` ONNX (~40 MB) — 4× upscale

License check before committing (Apache 2.0 / MIT required; no GPL
without explicit user approval).

## File structure additions

New directories under `src/`:

```
src/
├── lib/
│   ├── conversions/
│   │   ├── audio/                # NEW (Wave 4)
│   │   │   ├── audio-convert.ts
│   │   │   ├── audio-trim.ts
│   │   │   └── audio-normalize.ts
│   │   └── image/
│   │       ├── ai/                # NEW (Wave 8)
│   │       │   ├── remove-background.ts
│   │       │   ├── upscale.ts
│   │       │   └── smart-compress.ts
│   │       ├── crop.ts            # NEW (Wave 2)
│   │       ├── rotate-flip.ts     # NEW (Wave 2)
│   │       ├── watermark.ts       # NEW (Wave 2)
│   │       ├── view-exif.ts       # NEW (Wave 2)
│   │       └── diff.ts            # NEW (Wave 6)
│   ├── engines/
│   │   ├── aiModels.ts            # NEW (Wave 8)
│   │   ├── onnx.ts                # NEW (Wave 8)
│   │   └── videoOps.ts            # NEW (Wave 3)
│   ├── workers/
│   │   └── ai.worker.ts           # NEW (Wave 8)
│   └── utils/
│       ├── qr.ts                  # NEW (Wave 6)
│       ├── barcode.ts             # NEW (Wave 6)
│       └── bmp.ts                 # NEW (Wave 1)
├── hooks/
│   ├── useBatchConversion.ts      # NEW (Wave 7)
│   ├── useCropSelection.ts        # NEW (Wave 2)
│   └── useAiModelLoader.ts        # NEW (Wave 8)
├── components/
│   ├── tool/
│   │   ├── CropOverlay.tsx        # NEW (Wave 2, reused Wave 3)
│   │   ├── WatermarkControls.tsx  # NEW (Wave 2)
│   │   ├── VideoPlayer.tsx        # NEW (Wave 3)
│   │   ├── AudioPlayer.tsx        # NEW (Wave 4)
│   │   ├── RangeSlider.tsx        # NEW (Wave 3)
│   │   ├── TextInputPage.tsx      # NEW (Wave 6)
│   │   ├── DualFileDrop.tsx       # NEW (Wave 6)
│   │   ├── InfoPage.tsx           # NEW (Wave 2, view-exif)
│   │   ├── BatchProgressList.tsx  # NEW (Wave 7)
│   │   ├── AiDisclosure.tsx       # NEW (Wave 8)
│   │   └── AiModelLoader.tsx      # NEW (Wave 8)
│   ├── upload/
│   │   └── MultiDropZone.tsx      # NEW (Wave 7)
│   ├── output/
│   │   └── BatchDownloadButton.tsx # NEW (Wave 7)
│   ├── pwa/
│   │   └── InstallPrompt.tsx      # NEW (Wave 7)
│   └── processing/
│       └── AiModelLoader.tsx      # NEW (Wave 8; placeholder)
└── pages/
    └── (no new pages; History is frozen)
```

New test fixtures: `tests/fixtures/sample.{avif,jxl,bmp,tiff,ico,svg,mov,webm,mp3,wav,flac}`

---

## Wave 0 — Pre-flight (Day 1, blocking)

**Verification reads (no edits):**

- [x] `src/data/tools.ts` — `Tool` type at line 16; `ToolIconName` at line 1; `categoryMeta` at line 137
- [x] `src/lib/workers/image.worker.ts:9` — `ImageFormat` type, `decode`/`encode`/`ensureInit` cases
- [x] `src/lib/engines/jsquash.ts:73` — `MIME_TYPES` map
- [x] `src/lib/engines/ffmpeg.ts` — already wired for reuse
- [x] `src/hooks/useConversion.ts` — single-file; will extend or fork for batch
- [x] `src/components/tool/ToolPage.tsx` — single-file UI; will extend with `mode` prop
- [x] `public/_headers` — COOP/COEP set; need to add `/models/*` cache + service-worker no-cache

**Type and data structure changes:**

- [ ] `src/data/tools.ts:1-12` — extend `ToolIconName` with: `'crop' | 'qr' | 'barcode' | 'diff' | 'wand' | 'sparkles'`
- [ ] `src/data/tools.ts:16-24` — extend `Tool` interface: add `engine: 'jsquash' | 'heic2any' | 'canvas' | 'ffmpeg' | 'utility' | 'ai'`, `formats: { in: string[]; out: string }`, extend `category` to include `'edit' | 'audio' | 'animate' | 'utility' | 'ai'`
- [ ] `src/data/tools.ts:137-154` — extend `categoryMeta` with the 5 new categories
- [ ] `src/lib/workers/image.worker.ts:9` — extend `ImageFormat` to `'jpeg' | 'png' | 'webp' | 'avif' | 'jxl'`
- [ ] `src/lib/workers/image.worker.ts:43-57` — add `ensureInit` cases for `'avif' | 'jxl'`
- [ ] `src/lib/workers/image.worker.ts:59-63` — add `decode` cases for `'avif' | 'jxl'`
- [ ] `src/lib/workers/image.worker.ts:65-79` — add `encode` cases for `'avif' | 'jxl'`
- [ ] `src/lib/engines/jsquash.ts:73-77` — add MIME types: `image/avif`, `image/jxl`, `image/bmp`, `image/tiff`, `image/x-icon`, `image/svg+xml`
- [ ] `src/lib/engines/jsquash.ts:93-99` — extend `detectFormat` to detect AVIF + JXL by magic bytes
- [ ] `src/lib/utils/fileValidation.ts` — `humanReadableAccept` / `isAcceptedType` updates (no edits yet; will be needed per wave)

**Dependencies:**

- [ ] `package.json:19-32` — add all deps listed in "Library additions" above
- [ ] `package.json:33-50` — add all devDeps listed above
- [ ] Run `bun install` (or `npm install` if Bun is missing on this box)
- [ ] Verify `bun.lock` (or `package-lock.json`) commits cleanly

**Vite config:**

- [ ] `vite.config.ts` — add `@jsquash/avif` and `@jsquash/jxl` to `optimizeDeps.exclude` (the known issue from AGENTS.md)
- [ ] `vite.config.ts` — add `VitePWA` plugin import (config-only; no SW generated yet — that's Wave 7)
- [ ] `vite.config.ts` — set `build.assetsInlineLimit` so the AI model files (in `public/`) are not inlined

**Model files (placeholders; do not download yet):**

- [ ] Create `public/models/README.md` documenting:
  - Which model goes where (`briaai-rmbg-1.4.onnx`, `realesrgan-x2plus.onnx`, `realesrgan-x4plus.onnx`)
  - License of each (must verify Apache 2.0 / MIT before commit)
  - Source URL for each
  - Total budget (currently ~55 MB)
- [ ] Create empty placeholder files for now (e.g., `public/models/.gitkeep` + README)
- [ ] **Action for user:** confirm model license + download separately, or accept that this wave ships without the model files (defer Wave 8 until files are in place)

**`public/_headers`:**

- [ ] Add `/models/*` block: `Cache-Control: public, max-age=31536000, immutable`
- [ ] Add `/service-worker.js` block: `Cache-Control: no-cache` (preparation for Wave 7)

**Sitemap:**

- [ ] `public/sitemap.xml` — add stub `<url>` entries for the 51 routes (most will 404 until their wave ships; that's fine, search engines will re-crawl). Update at end of each wave as routes go live.

**Validation:**

- [ ] `bun run lint` — pass
- [ ] `bun run typecheck` — pass
- [ ] `bun run test` — all 85 existing tests still pass
- [ ] `bun run build` — succeeds

**Done when:** deps installed, types extended (compile-clean), lint+typecheck+test+build all green, plan file references the actual `src/` paths for Wave 1 to start against.

---

## Wave 1 — Format coverage closeout (1-2 weeks)

**12 new routes (counts adjusted: 11→23). Reuses existing engines + 2 new codec deps.**

### Conversion files (21 new in `src/lib/conversions/image/`)

- [ ] `jpg-to-avif.ts` — jSquash JPEG decode → AVIF encode
- [ ] `avif-to-jpg.ts` — AVIF decode → JPEG encode + stripExif
- [ ] `png-to-avif.ts` — PNG decode → AVIF encode
- [ ] `avif-to-png.ts` — AVIF decode → PNG encode
- [ ] `jpg-to-jxl.ts` — JPEG decode → JXL encode
- [ ] `jxl-to-jpg.ts` — JXL decode → JPEG encode + stripExif
- [ ] `png-to-jxl.ts` — PNG decode → JXL encode
- [ ] `jxl-to-png.ts` — JXL decode → PNG encode
- [ ] `heic-to-webp.ts` — heic2any → canvas → WebP encode
- [ ] `heic-to-png.ts` — heic2any → canvas → PNG encode
- [ ] `jpg-to-bmp.ts` — JPEG decode → canvas → BMP byte writer
- [ ] `png-to-bmp.ts` — PNG decode → canvas → BMP byte writer
- [ ] `bmp-to-jpg.ts` — custom BMP parser → JPEG encode + stripExif
- [ ] `bmp-to-png.ts` — custom BMP parser → PNG encode
- [ ] `jpg-to-tiff.ts` — JPEG decode → UTIF encode
- [ ] `png-to-tiff.ts` — PNG decode → UTIF encode
- [ ] `tiff-to-jpg.ts` — UTIF decode → JPEG encode + stripExif
- [ ] `tiff-to-png.ts` — UTIF decode → PNG encode
- [ ] `jpg-to-ico.ts` — JPEG decode → to-ico encode
- [ ] `png-to-ico.ts` — PNG decode → to-ico encode
- [ ] `svg-to-png.ts` — fetch SVG text → canvg → PNG encode

**Skip:** `png-to-svg` (no client-side tracer that produces real SVG; document in tool description).

### Worker extension

- [ ] `src/lib/workers/image.worker.ts:9` — `ImageFormat` already extended in Wave 0
- [ ] `src/lib/workers/image.worker.ts:43-57` — `ensureInit` already has AVIF/JXL in Wave 0
- [ ] `src/lib/workers/image.worker.ts:59-63, 65-79` — `decode`/`encode` already extended in Wave 0
- [ ] `src/lib/utils/bmp.ts` — `encodeBMP(imageData): ArrayBuffer`, `decodeBMP(buffer): ImageData` (custom, ~50 lines each)

### Route files (`src/routes/`, 21 new)

- [ ] `jpg-to-avif.tsx`, `png-to-avif.tsx`, `avif-to-jpg.tsx`, `avif-to-png.tsx`
- [ ] `jpg-to-jxl.tsx`, `png-to-jxl.tsx`, `jxl-to-jpg.tsx`, `jxl-to-png.tsx`
- [ ] `heic-to-webp.tsx`, `heic-to-png.tsx`
- [ ] `jpg-to-bmp.tsx`, `png-to-bmp.tsx`, `bmp-to-jpg.tsx`, `bmp-to-png.tsx`
- [ ] `jpg-to-tiff.tsx`, `png-to-tiff.tsx`, `tiff-to-jpg.tsx`, `tiff-to-png.tsx`
- [ ] `jpg-to-ico.tsx`, `png-to-ico.tsx`
- [ ] `svg-to-png.tsx`

### Wiring

- [ ] `src/data/tools.ts:26-135` — append 21 new `Tool` entries
- [ ] `src/App.tsx:9-19` — add 21 new `lazy()` imports
- [ ] `src/App.tsx:32-131` — add 21 new route entries
- [ ] `src/pages/HomePage.tsx` — verify grid handles 32 tools; may need search/filter UI

### Tests

- [ ] `tests/unit/conversions/avif.test.ts` — covers both directions
- [ ] `tests/unit/conversions/jxl.test.ts` — covers both directions
- [ ] `tests/unit/conversions/heic-webp.test.ts`, `heic-png.test.ts`
- [ ] `tests/unit/conversions/bmp.test.ts` — roundtrip
- [ ] `tests/unit/conversions/tiff.test.ts` — roundtrip
- [ ] `tests/unit/conversions/ico.test.ts`
- [ ] `tests/unit/conversions/svg-to-png.test.ts`
- [ ] `tests/integration/` — one test per route (mock codec layer)
- [ ] `tests/fixtures/` — add `sample.avif`, `sample.jxl`, `sample.bmp`, `sample.tiff`, `sample.ico`, `sample.svg`

### Validation

- [ ] `bun run lint && bun run typecheck && bun run test && bun run build` — all pass
- [ ] Manual: each of the 21 routes on Chrome desktop with a real file

**Done when:** 23 total routes live, all tested, bundle delta documented.

---

## Wave 2 — Image editing (1-2 weeks)

**4 new routes. Brings total: 23 → 27. Pure canvas operations.**

### Conversion files (`src/lib/conversions/image/`)

- [ ] `crop.ts` — accept `cropRect: { x, y, width, height }`, `drawImage` with source rect
- [ ] `rotate-flip.ts` — accept `rotation: 0|90|180|270`, `flipH: boolean`, `flipV: boolean`
- [ ] `watermark.ts` — accept `mode: 'text' | 'image'`, `text` or `imageBlob`, `position: 9-grid`, `opacity: number`, `fontSize: number`
- [ ] `view-exif.ts` — read-only via `piexifjs`, returns structured EXIF data (not a Blob conversion)

### Components (mobile-first from day one)

- [ ] `src/components/tool/CropOverlay.tsx` — draggable + resizable rect on top of `<img>`. Touch + mouse. 44px touch targets on handles. Returns `{x, y, width, height}`. **Reused in Wave 3 for video crop.**
- [ ] `src/hooks/useCropSelection.ts` — drag state, image-bounds clamping, returns rect
- [ ] `src/components/tool/WatermarkControls.tsx` — text/image toggle, 3×3 position grid, opacity + font size sliders
- [ ] `src/components/tool/InfoPage.tsx` — generic shell for "file in, information out" (no download). Renders a table. Used by `/view-exif`.

### Route files

- [ ] `crop-image.tsx` — `ToolPage` + `CropOverlay` (passed as `optionsComponent`)
- [ ] `rotate-image.tsx` — `ToolPage` + angle buttons + flip checkboxes
- [ ] `add-watermark.tsx` — `ToolPage` + `WatermarkControls`
- [ ] `view-exif.tsx` — `InfoPage` (NOT `ToolPage`)

### Wiring

- [ ] `src/data/tools.ts` — 4 new `Tool` entries under `category: 'edit'`
- [ ] `src/App.tsx` — 4 new lazy routes
- [ ] `src/components/tool/ToolOptions.tsx` — extend for richer options UIs

### Tests

- [ ] `tests/unit/conversions/crop.test.ts` — output dimensions match input rect
- [ ] `tests/unit/conversions/rotate-flip.test.ts` — 8 combinations
- [ ] `tests/unit/conversions/watermark.test.ts` — output pixel delta > 0
- [ ] `tests/unit/conversions/view-exif.test.ts` — known fixture EXIF parsed
- [ ] `tests/integration/` — one per route

### Validation

- [ ] Lint + typecheck + test + build pass
- [ ] Manual: each route on Chrome + iOS Safari + Android Chrome. Touch crop overlay specifically.

**Done when:** 4 routes live, mobile-tested, `CropOverlay` ready for reuse in Wave 3.

---

## Wave 3 — Video editing (2-3 weeks)

**8 new routes. Brings total: 27 → 35. Heaviest single wave.**

### Conversion files (`src/lib/conversions/video/`)

- [ ] `trim.ts` — ffmpeg: `-ss <start> -t <duration> -i input -c copy output` (no re-encode); fallback re-encode on codec mismatch
- [ ] `crop.ts` — ffmpeg: `-i input -vf "crop=w:h:x:y" output` (reuses `CropOverlay` from Wave 2)
- [ ] `rotate.ts` — ffmpeg: `-i input -vf "transpose=<0|1|2|3>" output`
- [ ] `mute.ts` — ffmpeg: `-i input -an -c:v copy output`
- [ ] `speed.ts` — ffmpeg: `-i input -filter:v "setpts=<1/x>*PTS" -filter:a "atempo=<chain>" output`. Chain atempo nodes for >2× or <0.5×.
- [ ] `resize.ts` — ffmpeg: `-i input -vf "scale=<w>:<h>" output` (width input, height auto)
- [ ] `extract-frames.ts` — ffmpeg: `-i input -vf "fps=<1/intervalSec>" frame_%04d.png` → `JSZip`
- [ ] `to-webm.ts` — ffmpeg: `-i input -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus output.webm`

### Engine

- [ ] `src/lib/engines/videoOps.ts` — thin wrapper: `runFFmpeg(args, input, outputFormat, onProgress): Promise<Blob>`. Eliminates boilerplate across 8 conversion files.

### Components (mobile-first)

- [ ] `src/components/tool/VideoPlayer.tsx` — HTML5 video with: play/pause, scrub bar, time display, in/out markers. Full-width on mobile. 44px buttons. Exposes ref to underlying `<video>`.
- [ ] `src/components/tool/RangeSlider.tsx` — dual-handle for in/out points. 24px touch handles.
- [ ] `src/components/tool/VideoCropOverlay.tsx` — same UX as `CropOverlay` but on top of `<video>`. **Refactor decision:** Wave 2's `CropOverlay` should be generic over the underlying element. Update Wave 2 if needed.
- [ ] `src/components/output/DownloadButton.tsx` — add `zip` variant (existing single-blob variant already works)

### Route files

- [ ] `video-trim.tsx` — VideoPlayer + RangeSlider
- [ ] `crop-video.tsx` — VideoPlayer + VideoCropOverlay
- [ ] `rotate-video.tsx` — VideoPlayer + angle buttons
- [ ] `mute-video.tsx` — VideoPlayer (toggle is implicit, no UI)
- [ ] `video-speed.tsx` — VideoPlayer + speed presets
- [ ] `resize-video.tsx` — VideoPlayer + width input
- [ ] `extract-frames.tsx` — VideoPlayer + interval input
- [ ] `video-to-webm.tsx` — VideoPlayer + CRF slider

### Wiring

- [ ] `src/data/tools.ts` — 8 new entries under `category: 'video'` (existing category absorbs these)
- [ ] `src/App.tsx` — 8 new lazy routes
- [ ] `src/lib/utils/guardRails.ts` — verify `MAX_VIDEO_BYTES`

### iOS limitation note (per session decision)

- [ ] `src/components/tool/VideoPlayer.tsx` — render an inline "iOS note" banner if `navigator.userAgent` indicates iOS Safari + SharedArrayBuffer not available. Banner text: "Video tools may not work on iOS Safari due to browser limitations. Try Chrome or Firefox for the best experience."
- [ ] `src/pages/PrivacyPage.tsx` — add a "Known limitations" section documenting iOS video limitation
- [ ] No logic change to hide/disable the tools; the iOS note is informational only

### Tests

- [ ] `tests/unit/conversions/video-trim.test.ts` — mock ffmpeg, assert args
- [ ] One per conversion (8 total)
- [ ] `tests/integration/` — one per route (render check)
- [ ] `tests/fixtures/sample.mov`
- [ ] Manual: real 100MB MP4 trim on Chrome desktop

**Done when:** 8 routes live, iOS note present, mobile-tested for the player UI on Android Chrome (iOS is best-effort per decision).

---

## Wave 4 — Audio expansion (1-2 weeks)

**6 new routes. Brings total: 35 → 41. Reuses ffmpeg; no new heavy deps.**

### Conversion files

- [ ] `src/lib/conversions/video/video-to-wav.ts` — ffmpeg: `-i input -vn -ar 44100 -ac 2 -f wav output.wav`
- [ ] `src/lib/conversions/video/video-to-aac.ts` — ffmpeg: `-i input -vn -c:a aac -b:a 192k output.m4a`
- [ ] `src/lib/conversions/video/video-to-ogg.ts` — ffmpeg: `-i input -vn -c:a libopus -b:a 128k output.ogg`
- [ ] `src/lib/conversions/audio/audio-convert.ts` — accept any audio in, user picks out format. ffmpeg: `-i input -c:a <codec> output`
- [ ] `src/lib/conversions/audio/audio-trim.ts` — ffmpeg: `-ss -t -i input -c copy output`
- [ ] `src/lib/conversions/audio/audio-normalize.ts` — ffmpeg loudnorm (two-pass)

### Components (mobile-first)

- [ ] `src/components/tool/AudioPlayer.tsx` — minimal HTML5 audio. Play/pause, current time. Reuses `RangeSlider` from Wave 3 for trim.

### Engine

- [ ] `src/lib/utils/formatDetection.ts` — extend for audio MIME types
- [ ] `src/lib/utils/fileValidation.ts` — accept audio types per route
- [ ] `src/lib/utils/guardRails.ts` — add `MAX_AUDIO_BYTES` (50 MB)

### Route files

- [ ] `video-to-wav.tsx`, `video-to-aac.tsx`, `video-to-ogg.tsx` (under `category: 'video'` in `data/tools.ts` since they originate from video, but new `audio` subcategory in UX if helpful)
- [ ] `audio-convert.tsx`, `audio-trim.tsx`, `audio-normalize.tsx` (under new `category: 'audio'`)

### Wiring

- [ ] `src/data/tools.ts` — 6 new entries (3 under `video`, 3 under new `audio`)
- [ ] `src/App.tsx` — 6 new lazy routes
- [ ] `src/components/shell/Header.tsx` — update nav if needed (existing nav already has a "Video & audio" section, may rename to "Video, audio & more" or split into two)

### Tests

- [ ] 6 unit tests (mocked ffmpeg args)
- [ ] `tests/fixtures/sample.mp3`, `sample.wav`, `sample.flac`

**Done when:** 6 routes live, no new bundle weight.

---

## Wave 5 — Animation (GIF-focused) (1-2 weeks)

**4 new routes. Brings total: 41 → 45.**

### Conversion files (`src/lib/conversions/video/`)

- [ ] `gif-to-mp4.ts` — ffmpeg: `-i input.gif -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" output.mp4`
- [ ] `gif-to-webp.ts` — ffmpeg: `-i input.gif -c:v libwebp -lossless 0 -q:v 70 -loop 0 -preset default -an output.webp`
- [ ] `gif-to-frames.ts` — like `extract-frames.ts` but for GIF (uses `-vf "fps=..."`)
- [ ] `gif-resize.ts` — ffmpeg with palette generation: `-vf "scale=<w>:<h>:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"`

**Skip:** GIF lossy optimization via gifsicle-wasm (+200 KB not worth it).

### Engine

- [ ] `src/lib/utils/formatDetection.ts` — detect GIF by magic bytes (`47 49 46 38`)
- [ ] `src/lib/utils/guardRails.ts` — `MAX_GIF_BYTES` (20 MB)

### Route files

- [ ] `gif-to-mp4.tsx`
- [ ] `gif-to-webp.tsx`
- [ ] `gif-to-frames.tsx` — ZIP download
- [ ] `gif-resize.tsx` — width input, height auto

### Wiring

- [ ] `src/data/tools.ts` — 4 new entries under `category: 'animate'`
- [ ] `src/App.tsx` — 4 new lazy routes
- [ ] `src/pages/HomePage.tsx` — group "Animation" in the grid

### Tests

- [ ] 4 unit tests (mocked ffmpeg)
- [ ] `tests/fixtures/sample.gif` already exists per the file listing

**Done when:** 4 routes live, mobile-tested (desktop primary per limitation note in plan).

---

## Wave 6 — Utility tools (1-2 weeks)

**3 new routes. Brings total: 45 → 48. NO History page (frozen).**

### Utility/conversion files

- [ ] `src/lib/utils/qr.ts` — `generateQR(text, { size, errorCorrection }): Promise<Blob>` using `qrcode` lib
- [ ] `src/lib/utils/barcode.ts` — `generateBarcode(text, format, { width, height }): Promise<Blob>` using `jsbarcode`
- [ ] `src/lib/conversions/image/diff.ts` — accept 2 images, return diff image (canvas pixel comparison)

### Components (mobile-first)

- [ ] `src/components/tool/TextInputPage.tsx` — generic shell for "text in, image out". Textarea, generate button, preview, download. No drop zone.
- [ ] `src/components/tool/DualFileDrop.tsx` — two drop zones side by side (stacks on mobile)
- [ ] `src/components/tool/DiffPreview.tsx` — three-up display: A, B, diff

### Route files

- [ ] `qr-code.tsx` — `TextInputPage` + `generateQR`
- [ ] `barcode.tsx` — `TextInputPage` + `generateBarcode`
- [ ] `image-diff.tsx` — `DualFileDrop` + `diff`

### Wiring

- [ ] `src/data/tools.ts` — 3 new entries under `category: 'utility'`
- [ ] `src/App.tsx` — 3 new lazy routes

### Tests

- [ ] `tests/unit/utils/qr.test.ts` — known input produces valid PNG
- [ ] `tests/unit/utils/barcode.test.ts` — known input produces valid PNG
- [ ] `tests/unit/conversions/diff.test.ts` — identical → blank, different → non-blank

**Done when:** 3 routes live, no history work, mobile-tested.

### History feature (FROZEN — not built)

- [ ] ~~`src/state/history.ts` extension~~ — **DEFERRED** until user decides
- [ ] ~~`src/pages/HistoryPage.tsx`~~ — **DEFERRED**
- [ ] ~~`/history` route~~ — **DEFERRED**
- [ ] ~~Footer "History" link~~ — **DEFERRED**
- [ ] **Re-decide at end of build:** user evaluates if History is worth adding.

---

## Wave 7 — Batch + PWA (2 weeks)

**No new tool routes. Major UX rewrite + service worker + install prompt.**

### Batch processing

- [ ] `src/components/upload/MultiDropZone.tsx` — accepts N files, shows file list. Mobile-first (full-width list, larger hit area on touch).
- [ ] `src/hooks/useBatchConversion.ts` — runs N conversions with concurrency limit (3-4). Error isolation: one failure doesn't kill others.
- [ ] `src/components/output/BatchDownloadButton.tsx` — packages results as ZIP via `JSZip`
- [ ] `src/components/processing/BatchProgressList.tsx` — per-file progress bars, file name, status
- [ ] `src/components/tool/ToolPage.tsx` — add `mode?: 'single' | 'batch' = 'single'` prop, conditionally render MultiDropZone / DropZone and BatchProgressList / ProcessingStatus
- [ ] Update all 45 route files — add `mode="batch"` where it makes sense. **Decision:** enable batch on 44 of 48 routes. Skip on `qr-code`, `barcode`, `image-diff`, `view-exif` (multi-input UX doesn't apply). Update: `qr-code`, `barcode` are text-in not file-in; `image-diff` takes 2 specific files; `view-exif` is read-only.

### PWA

- [ ] `vite.config.ts` — full `VitePWA({...})` config: `registerType: 'autoUpdate'`, manifest (name, short_name, theme_color, background_color, display: 'standalone', icons: 192+512+maskable), workbox (precache app shell, runtime cache for `/ffmpeg/*`, `/models/*`)
- [ ] `public/manifest.json` — verify or write
- [ ] `public/icons/` — 192×192, 512×512, maskable variants. Generate from existing favicon or create new.
- [ ] `public/_headers` — verify `/service-worker.js` has `Cache-Control: no-cache`
- [ ] `src/components/pwa/InstallPrompt.tsx` — listen for `beforeinstallprompt`, show non-intrusive banner, dismissible
- [ ] `src/components/shell/AppShell.tsx` — register SW on mount
- [ ] `src/pages/PrivacyPage.tsx` — document SW behavior (caches on device, no data sent)

### Mobile polish (scattered approach)

- [ ] **No retro-pass.** Each component built mobile-first in its own wave. Wave 7 only audits that the new batch/PWA components are mobile-first.
- [ ] Audit `MultiDropZone` + `BatchProgressList` + `InstallPrompt` for 44px touch targets, mobile hit areas, no-hover fallbacks.

### Tests

- [ ] `tests/unit/hooks/useBatchConversion.test.ts` — concurrency limit, error isolation
- [ ] `tests/integration/batch.test.tsx` — drop 3 files on `/heic-to-jpg` (batch mode), assert ZIP download
- [ ] Update 44 route integration tests to cover `mode='batch'` (or feature flag)

### Validation

- [ ] Lighthouse mobile: PWA 100, performance > 85
- [ ] Manual install test: iOS Safari (Add to Home Screen) + Android Chrome (Install prompt)

**Done when:** Batch works on 44 routes, app installable, SW caches ffmpeg-core + models, Lighthouse PWA = 100.

---

## Wave 8 — AI features (2-3 weeks)

**3 new routes. Brings total: 48 → 51. Bundle delta: 7-55 MB (lazy, per-tool, opt-in).**

**Pre-condition:** model files downloaded + committed to `public/models/`. Apache 2.0 / MIT / BSD-3-Clause only. Verify before starting.

### Conversion files (`src/lib/conversions/image/ai/`)

- [ ] `remove-background.ts` — direct `onnxruntime-web` + U-2-Net (`silueta.onnx`, ~43MB, Apache 2.0). Returns PNG with transparent background. Surfaces model-load progress. Override: the plan originally said `@imgly/background-removal` (RMBG-1.4, non-commercial) — we use direct ORT to keep licensing commercial-friendly.
- [ ] `upscale.ts` — `onnxruntime-web` + Real-ESRGAN (`realesrgan-x2plus.fp16.onnx` and `realesrgan-x4plus.fp16.onnx`, BSD-3-Clause). Accepts `{ model: 'x2plus' | 'x4plus' }`. Inference on input image → upscaled PNG.
- [ ] `smart-compress.ts` — codec-quality iteration using `jsquash` jpeg/webp/avif. Accepts `{ targetSizeKB: number }`. Bisects quality in [0.3, 0.95] until output ≤ target. **No separate model** (plan originally called for a perceptual quality model; dropped — codec iteration is sufficient).

### Engine

- [ ] `src/lib/engines/onnx.ts` — lazy-loads `onnxruntime-web`, execution provider `wasm` (cross-platform; `webgl` is faster but not iOS)
- [ ] `src/lib/engines/aiModels.ts` — paths to `/models/*.onnx`, model size display, "already cached" check via `caches.match()`
- [ ] `src/lib/workers/ai.worker.ts` — new worker file for AI operations (separate from `image.worker.ts` for clarity)

### Components (mobile-first)

- [ ] `src/components/processing/AiModelLoader.tsx` — "Loading AI model (5 MB, first time only)..." with progress
- [ ] `src/components/tool/AiDisclosure.tsx` — disclosure banner: "This loads a 5 MB AI model on first use. It runs entirely on your device — your images never leave your browser."
- [ ] `src/hooks/useAiModelLoader.ts` — manages model state, progress, error

### Route files

- [ ] `remove-background.tsx` — `ToolPage` + `AiDisclosure` + `AiModelLoader`
- [ ] `upscale-image.tsx` — `ToolPage` + model selector + `AiDisclosure`
- [ ] `smart-compress.tsx` — `ToolPage` + target size input + `AiDisclosure`

### Wiring

- [ ] `src/data/tools.ts` — 3 new entries under `category: 'ai'`
- [ ] `src/App.tsx` — 3 new lazy routes
- [ ] `src/state/settings.ts` — `enableAi: boolean` (default true). When false, the AI routes' lazy chunks are not preloaded (build still includes them, but the SW won't precache model files).
- [ ] `src/pages/PrivacyPage.tsx` — list all AI models, sizes, source licenses, confirm self-hosted

### Ethics additions (per session decision)

- [ ] No face restore, no style transfer on portraits, no DeepOldify. Documented in `PrivacyPage` "AI models" section as "intentionally excluded".
- [ ] Each AI tool renders `AiDisclosure` above the drop zone.

### Tests

- [ ] `tests/unit/conversions/remove-background.test.ts` — output has transparent pixels
- [ ] `tests/unit/conversions/upscale.test.ts` — output dimensions are 2× or 4× input
- [ ] `tests/unit/conversions/smart-compress.test.ts` — output within 10% of target size
- [ ] `tests/integration/` — one per route, asserts disclosure renders

**Done when:** 3 AI routes live, disclosures in place, no face/style/deoldify, Privacy page documents all models.

---

## Cross-cutting (all waves)

- [ ] `tests/fixtures/` — add fixtures per wave
- [ ] `public/sitemap.xml` — regenerate after each wave
- [ ] `README.md` — update tool list per wave
- [ ] `src/pages/PrivacyPage.tsx` — update per wave (engines, models, PWA, iOS limitation)
- [ ] `src/pages/HomePage.tsx` — verify grid handles growing tool count
- [ ] `bun run lint && bun run typecheck && bun run test && bun run build` after every wave
- [ ] `biome check .` + `biome format --write .` after every wave
- [ ] Manual smoke test: Chrome desktop + Firefox desktop + Safari macOS desktop + iOS Safari (best-effort) + Android Chrome

## Definition of done (all waves)

- [ ] 51 tool routes live at their paths
- [ ] All routes work in Chrome 110+ / Firefox 110+ / Safari 16+ macOS desktop
- [ ] Image + format-conversion routes work on iOS Safari 16+ + Android Chrome 110+
- [ ] Video + audio routes: desktop-primary, iOS best-effort with documented limitation
- [ ] Batch mode works on 44 of 48 routes
- [ ] PWA installable on iOS + Android; SW caches ffmpeg-core + AI models
- [ ] 3 AI features functional, each with disclosure
- [ ] No face restore, no style transfer, no DeepOldify
- [ ] **History feature FROZEN** (not built; user will decide)
- [ ] Lighthouse PWA 100; performance > 85 on homepage
- [ ] All tests passing (expect ~200+ after waves, was 85)
- [ ] `biome check .` clean
- [ ] Cloudflare Pages deployment with COOP/COEP, `/models/*` cache, service-worker no-cache

## Open questions for the user (revisit as needed)

1. **iOS video tools** — documentation done in Wave 3; revisit if browser updates improve SharedArrayBuffer support
2. **Domain + launch channel** — user decides when build is closer to done
3. **History retention** — frozen; user will decide after the rest of the build
4. **Model files** — user must verify license + download before Wave 8 starts

## What I'm NOT building (permanent)

- PDF tools
- OCR / document AI
- Cloud sync, accounts, sharing
- Face restore, style transfer on portraits, DeepOldify
- Real NLE video editing
- Public API, paid tier, Stripe (Phase C)
- i18n
- Dark mode
