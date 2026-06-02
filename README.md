# Image Converter

Free, privacy-first, browser-based image and video conversion toolset.
Files never leave your device.

**Phase A — pure client-side MVP.** See `design/design-doc.md` for the
phased plan and `design/phase-a-implementation-plan.md` for the
engineering plan.

## Status

Pre-launch. Week 1 of the 3-week build (scaffold + ffmpeg.wasm smoke test).
No conversion tools are functional yet.

## Stack

- Vite 5 + React 18 + TypeScript (strict)
- Bun (package manager only — not the runtime)
- ffmpeg.wasm v0.12 (video tools, lazy-loaded)
- jSquash (image codecs, lazy-loaded per codec)
- Tailwind CSS 3
- React Router v6
- Vitest + Testing Library
- Biome (lint + format)
- Cloudflare Pages (deploy target)

## Requirements

- **Bun** 1.1+ ([install](https://bun.sh))
- A Chromium-based browser for development. The ffmpeg.wasm smoke test
  requires a real browser that supports `SharedArrayBuffer` (Chrome,
  Firefox, Safari 16+). It will not work in `lynx` or some headless
  environments.

## Local development

```bash
bun install
bun run dev
```

Open http://localhost:5173/ and verify:

1. The home page renders the 11 tool cards.
2. The Privacy page renders.
3. The `/ffmpeg-smoke` page runs to "Pass".

## Scripts

| Command | Purpose |
|---|---|
| `bun run dev` | Start Vite dev server with HMR. COOP/COEP headers set on the dev server. |
| `bun run build` | Type-check (`tsc -b`) and build to `dist/`. |
| `bun run preview` | Serve the built `dist/` locally. |
| `bun run typecheck` | Type-check only. |
| `bun run lint` | Biome lint check. |
| `bun run lint:fix` | Biome lint with auto-fix. |
| `bun run format` | Biome format. |
| `bun run test` | Run unit + integration tests once. |
| `bun run test:watch` | Watch mode. |
| `bun run copy:ffmpeg-core` | Copy ffmpeg-core files from `node_modules/@ffmpeg/core` to `public/ffmpeg/`. Runs automatically on `postinstall`. |

## ffmpeg.wasm smoke test (Windows 11 + Chrome gate)

Per the design doc, the ffmpeg.wasm smoke test must pass on Windows 11 +
Chrome by end of Week 1. To run it:

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

## Project layout

```
public/                 Static assets served as-is (favicon, _headers, _redirects)
  ffmpeg/               ffmpeg-core (gitignored, copied from node_modules on install)
src/
  components/           AppShell, DropZone, DownloadButton, etc.
  hooks/                useFileDrop, useConversion, useFFmpeg
  lib/
    engines/            ffmpeg, jSquash, heic, exif loaders
    conversions/        Per-tool conversion functions
    workers/            Web Worker for jSquash codecs
    utils/              File validation, format detection, downloads
  pages/                HomePage, PrivacyPage, NotFoundPage, FfmpegSmokePage
  routes/               One file per tool (lazy-loaded)
  state/                Zustand stores (settings, history)
  styles/               Tailwind globals.css
tests/
  unit/                 Per-conversion function tests
  integration/          Per-route tests
  e2e/                  Playwright (Phase A optional)
  fixtures/             Sample files for tests
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
  CDN.
- EXIF is stripped by default in every image tool (via `piexifjs`).
  The dedicated `/strip-exif` route exists for the no-conversion case.

## License

TBD. Likely MIT for the client code; server code (Phase C) will be
separate.

## See also

- `design/design-doc.md` — phased plan
- `design/phase-a-implementation-plan.md` — engineering plan
- `AGENTS.md` — repo state and conventions
