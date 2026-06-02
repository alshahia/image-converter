# Image Converter

Free, privacy-first, browser-based image and video conversion toolset.
Files never leave your device.

**Phase A — pure client-side MVP.** See `design/design-doc.md` for the
phased plan and `design/phase-a-implementation-plan.md` for the
engineering plan.

## Status

**All 11 tools implemented and unit-tested.** Awaiting real-browser verification
on Windows 11 + Chrome before public launch (target 2026-06-30).

| Tool | Route | Engine |
|---|---|---|
| HEIC to JPG | `/heic-to-jpg` | heic2any + piexifjs |
| PNG to JPG | `/png-to-jpg` | jSquash mozjpeg (in Web Worker) |
| JPG to PNG | `/jpg-to-png` | jSquash oxipng (in Web Worker) |
| WebP to JPG | `/webp-to-jpg` | jSquash libwebp (in Web Worker) |
| JPG to WebP | `/jpg-to-webp` | jSquash libwebp (in Web Worker) |
| Resize Image | `/resize-image` | jSquash resize (in Web Worker) |
| Compress Image | `/compress-image` | jSquash (in Web Worker) |
| Strip EXIF | `/strip-exif` | piexifjs (lossless) |
| Video to MP4 | `/video-to-mp4` | ffmpeg.wasm (libx264 + aac) |
| Video to GIF | `/video-to-gif` | ffmpeg.wasm (palettegen + paletteuse) |
| Extract Audio | `/extract-audio` | ffmpeg.wasm (mp3 / wav / aac) |
| ffmpeg smoke test | `/ffmpeg-smoke` | internal — verifies ffmpeg.wasm loads |

## Stack

- Vite 5 + React 18 + TypeScript 5.5 (strict, `noUncheckedIndexedAccess`)
- Bun (package manager only — not the runtime)
- ffmpeg.wasm v0.12 (video tools, lazy-loaded)
- jSquash (image codecs, lazy-loaded per codec, in a Web Worker)
- heic2any (HEIC decoding)
- piexifjs (EXIF stripping)
- Tailwind CSS 3
- React Router v6
- Vitest + Testing Library
- Biome (lint + format)
- Cloudflare Pages (deploy target)

## Requirements

- **Bun** 1.1+ ([install](https://bun.sh))
- A Chromium-based browser for development. The ffmpeg.wasm smoke test
  requires a real browser that supports `SharedArrayBuffer` (Chrome 110+,
  Firefox 110+, Safari 16+).

## Local development

```bash
bun install
bun run dev
```

Open http://localhost:5173/ and verify:

1. The home page renders 11 tool cards.
2. The Privacy page renders.
3. The `/ffmpeg-smoke` page runs to "Pass".
4. Click into `/heic-to-jpg` and try a real HEIC file.
5. Click into `/png-to-jpg` and try a real PNG.

## Scripts

| Command | Purpose |
|---|---|
| `bun run dev` | Start Vite dev server with HMR. COOP/COEP headers set. |
| `bun run build` | Type-check (`tsc -b`) and build to `dist/`. |
| `bun run preview` | Serve the built `dist/` locally. |
| `bun run typecheck` | Type-check only. |
| `bun run lint` | Biome lint check. |
| `bun run lint:fix` | Biome lint with auto-fix. |
| `bun run format` | Biome format. |
| `bun run test` | Run unit tests once. |
| `bun run test:watch` | Watch mode. |
| `bun run copy:ffmpeg-core` | Copy ffmpeg-core files from `node_modules/@ffmpeg/core` to `public/ffmpeg/`. Runs automatically on `postinstall`. |

## Privacy

Everything runs in your browser. Files are processed locally; we never see
them. See `/privacy` on the deployed site for the full statement.

## ffmpeg.wasm smoke test (Windows 11 + Chrome gate)

The ffmpeg.wasm smoke test must pass on Windows 11 + Chrome by end of
Week 1. To run it:

1. `bun install`
2. `bun run dev`
3. Open http://localhost:5173/ffmpeg-smoke in **real Chrome 110+** on
   Windows 11.
4. Open DevTools → Console. Verify:
   - `crossOriginIsolated === true` (otherwise COEP is broken)
   - No CORP / CORS errors
5. Open DevTools → Network. Verify:
   - `200` on `/ffmpeg-core.js` and `/ffmpeg-core.wasm`
6. The page should report "Pass" with a non-empty `ffmpeg version` line.

If the page reports "Fail", see the error panel. Common causes:

- **COEP error**: a third-party resource is being blocked. Open the
  console, find the resource, self-host it.
- **404 on /ffmpeg-core.\***: `bun run copy:ffmpeg-core` did not run.
  Run it manually and verify `public/ffmpeg/` contains the files.
- **Out of memory**: ffmpeg.wasm needs ~1GB of address space. Restart
  Chrome with `--js-flags="--max-old-space-size=4096"` if the browser
  refuses to allocate the wasm memory.

## Deploy to Cloudflare Pages

```bash
bun install
bun run build
bunx wrangler pages deploy dist --project-name=image-converter
```

First deploy creates the project. Subsequent deploys via push to `main`
once the GitHub integration is configured (Cloudflare dashboard →
Pages → image-converter → Settings → Builds).

The repo includes `public/_headers` (COOP/COEP, immutable cache for
`/ffmpeg/*`) and `public/_redirects` (SPA fallback). These apply
automatically on Cloudflare Pages.

## Project layout

```
public/                 Static assets served as-is (favicon, _headers, _redirects)
  ffmpeg/               ffmpeg-core (gitignored, copied from node_modules on install)
src/
  main.tsx              Entry, mount React
  App.tsx               Root layout, route definitions
  components/
    shell/              AppShell, Header, Footer, ErrorBoundary
    upload/             DropZone, FilePreview, FileSizeWarning
    processing/         ProcessingStatus, ErrorMessage
    output/             DownloadButton
    tool/               ToolPage, ToolOptions
    ui/                 button, input, slider, progress, card
  hooks/                useFileDrop, useConversion
  lib/
    engines/            ffmpeg, jSquash, heic, exif loaders
    conversions/        Per-tool conversion functions (image/, video/)
    workers/            image.worker.ts (jSquash codecs in a Web Worker)
    utils/              File validation, format detection, downloads, guard rails
  pages/                HomePage, PrivacyPage, NotFoundPage, FfmpegSmokePage
  routes/               One file per tool (lazy-loaded)
  styles/               Tailwind globals.css
tests/
  unit/                 Per-conversion function tests, engine tests, component tests
scripts/
  copy-ffmpeg-core.ts   Cross-platform copy from node_modules to public/ffmpeg
```

## Conventions

- One route per tool, kebab-case under `/`. See
  `design/phase-a-implementation-plan.md` for the 11 route names.
- Conversion function signature: `(file: File, options?: O) => Promise<Blob>`.
  Unit-testable in isolation, no React required.
- COOP/COEP headers are mandatory. `public/_headers` sets them.
- All assets self-hosted. No Google Fonts, no Font Awesome CDN, no
  third-party iframes. COEP blocks cross-origin resources.
- ffmpeg-core is self-hosted in `public/ffmpeg/`. Never loaded from a
  CDN. Use the ESM build (`dist/esm/`) per the bug fix in
  `scripts/copy-ffmpeg-core.ts`.
- EXIF is stripped by default in every image tool (via `piexifjs`).
  The dedicated `/strip-exif` route exists for the no-conversion case
  (lossless EXIF removal from a JPEG without re-encoding).
- Image conversions run in a Web Worker to keep the main thread
  responsive. ffmpeg.wasm uses its own internal worker.

## Browser support

| Browser | Image tools | Video tools |
|---|---|---|
| Chrome 110+ (desktop) | ✅ | ✅ |
| Firefox 110+ (desktop) | ✅ | ✅ |
| Safari 16+ (macOS) | ✅ | ✅ |
| Edge 110+ (desktop) | ✅ | ✅ |
| Chrome 110+ (Android) | ✅ | ⚠️ best-effort |
| Safari 16+ (iOS) | ✅ | ⚠️ best-effort |

iOS Safari has limited SharedArrayBuffer support; large video
conversions may OOM on iOS.

## License

MIT.

## See also

- `design/design-doc.md` — phased plan
- `design/phase-a-implementation-plan.md` — engineering plan
- `AGENTS.md` — repo state and conventions
