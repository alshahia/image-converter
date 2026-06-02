# Phase A Implementation Plan

Generated: 2026-06-02
Status: APPROVED (parent design doc)
Target: 3 weeks build + 4 weeks validation = 7 weeks to gate decision

This is the engineering plan for Phase A. It's the layer below the design
doc: file structure, component breakdown, library versions, implementation
order, test plan, edge cases. Read the design doc first for the *why*.

---

## Library versions (pin these in `package.json`)

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.5",
    "@ffmpeg/ffmpeg": "^0.12.15",
    "@ffmpeg/util": "^0.12.2",
    "@jsquash/jpeg": "^1.5.0",
    "@jsquash/png": "^3.0.0",
    "@jsquash/webp": "^1.5.0",
    "@jsquash/resize": "^1.5.0",
    "heic2any": "^0.0.4",
    "piexifjs": "^1.0.6"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@types/piexifjs": "^1.0.5",
    "@types/node": "^20.16.0",
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0",
    "typescript": "^5.5.0",
    "tailwindcss": "^3.4.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "jsdom": "^25.0.0",
    "@biomejs/biome": "^1.8.0",
    "happy-dom": "^15.0.0"
  },
  "packageManager": "bun@1.1.0"
}
```

**Lockfile**: commit `bun.lockb` (or `bun.lock` for newer versions).
Bun is the package manager; Node is not installed in this project.

**Why these versions**: latest stable as of 2026-06. ffmpeg.wasm
v0.12+ uses the new `new FFmpeg()` API (not the old `createFFmpeg()`).
React 18 (not 19 yet) for ecosystem stability.

---

## File structure

```
image-converter/
├── public/
│   ├── _headers                       # Cloudflare Pages COOP/COEP
│   ├── _redirects                     # SPA routing
│   ├── robots.txt
│   └── favicon.svg
├── src/
│   ├── main.tsx                       # Entry, mount React, set up Router
│   ├── App.tsx                        # Root layout, route definitions
│   ├── env.d.ts                       # Vite env types
│   │
│   ├── routes/                        # One file per tool, lazy-loaded
│   │   ├── index.tsx                  # / — tool directory
│   │   ├── heic-to-jpg.tsx
│   │   ├── png-to-jpg.tsx
│   │   ├── jpg-to-png.tsx
│   │   ├── webp-to-jpg.tsx
│   │   ├── jpg-to-webp.tsx
│   │   ├── resize-image.tsx
│   │   ├── compress-image.tsx
│   │   ├── strip-exif.tsx
│   │   ├── video-to-mp4.tsx
│   │   ├── video-to-gif.tsx
│   │   ├── extract-audio.tsx
│   │   ├── privacy.tsx
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── shell/
│   │   │   ├── AppShell.tsx           # Header + main + footer
│   │   │   ├── Header.tsx             # Logo, "Image Converter" title
│   │   │   ├── Footer.tsx             # Privacy, GitHub, feedback link
│   │   │   └── ToolHeader.tsx         # Per-tool H1 + 1-line description
│   │   ├── upload/
│   │   │   ├── DropZone.tsx           # Drag-drop + click-to-pick
│   │   │   ├── FilePreview.tsx        # Thumbnail of selected file
│   │   │   └── FileSizeWarning.tsx    # Shows when file > guard rail
│   │   ├── processing/
│   │   │   ├── ProcessingStatus.tsx   # "Encoding..." with progress
│   │   │   ├── ErrorMessage.tsx       # Friendly error display
│   │   │   └── RetryButton.tsx
│   │   ├── output/
│   │   │   ├── DownloadButton.tsx     # <a download> with Blob URL
│   │   │   ├── PreviewImage.tsx       # <img> of result
│   │   │   └── ResultMetadata.tsx     # "5.2 MB → 1.8 MB (65% smaller)"
│   │   ├── tool/
│   │   │   ├── ToolPage.tsx           # Generic tool page layout
│   │   │   ├── ToolOptions.tsx        # Per-tool options (quality, etc.)
│   │   │   └── ToolDirectory.tsx      # Home page list of tools
│   │   └── ui/                        # shadcn/ui primitives
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── slider.tsx
│   │       ├── progress.tsx
│   │       └── card.tsx
│   │
│   ├── lib/
│   │   ├── engines/                   # Codec/FFmpeg loaders
│   │   │   ├── ffmpeg.ts              # ffmpeg.wasm init + write/read
│   │   │   ├── jsquash.ts             # jSquash codec factories
│   │   │   ├── heic.ts                # heic2any wrapper
│   │   │   └── exif.ts                # piexifjs wrapper
│   │   ├── conversions/
│   │   │   ├── image/
│   │   │   │   ├── png-to-jpg.ts
│   │   │   │   ├── jpg-to-png.ts
│   │   │   │   ├── webp-to-jpg.ts
│   │   │   │   ├── jpg-to-webp.ts
│   │   │   │   ├── heic-to-jpg.ts
│   │   │   │   ├── resize.ts
│   │   │   │   ├── compress.ts
│   │   │   │   └── strip-exif.ts
│   │   │   └── video/
│   │   │       ├── video-to-mp4.ts
│   │   │       ├── video-to-gif.ts
│   │   │       └── extract-audio.ts
│   │   ├── workers/
│   │   │   └── image.worker.ts        # Web Worker for jSquash codecs
│   │   ├── utils/
│   │   │   ├── fileValidation.ts      # Type/size guards
│   │   │   ├── formatDetection.ts     # Detect input format from File
│   │   │   ├── download.ts            # Trigger Blob download
│   │   │   ├── guardRails.ts          # File size limits
│   │   │   └── blobToFile.ts          # Helper
│   │   └── types.ts
│   │
│   ├── state/
│   │   ├── settings.ts                # Zustand + IndexedDB persistence
│   │   └── history.ts                 # Recent conversions
│   │
│   ├── hooks/
│   │   ├── useFileDrop.ts
│   │   ├── useConversion.ts           # Generic conversion hook
│   │   └── useFFmpeg.ts               # Lazy-load ffmpeg.wasm
│   │
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── PrivacyPage.tsx
│   │   └── NotFoundPage.tsx
│   │
│   └── styles/
│       └── globals.css                # Tailwind base
│
├── tests/
│   ├── unit/
│   │   ├── conversions/               # One test file per conversion
│   │   │   ├── png-to-jpg.test.ts
│   │   │   ├── heic-to-jpg.test.ts
│   │   │   └── ...
│   │   ├── engines/
│   │   │   ├── ffmpeg.test.ts
│   │   │   └── exif.test.ts
│   │   └── utils/
│   │       ├── fileValidation.test.ts
│   │       └── formatDetection.test.ts
│   ├── integration/
│   │   ├── heic-to-jpg.test.tsx       # Full route render test
│   │   ├── video-to-mp4.test.tsx
│   │   └── ...
│   ├── e2e/                           # Playwright (optional for Phase A)
│   │   └── heic-conversion.spec.ts
│   └── fixtures/
│       ├── sample.png
│       ├── sample.jpg
│       ├── sample.webp
│       ├── sample.heic
│       ├── sample.mp4
│       ├── sample-with-exif.jpg
│       └── README.md                  # How to source each fixture
│
├── public/
│   └── ...                            # Static assets
│
├── package.json
├── bun.lockb
├── tsconfig.json                      # Strict mode
├── vite.config.ts                     # COEP/COOP aware, worker support
├── tailwind.config.ts
├── postcss.config.js
├── biome.json                         # Lint + format
├── vitest.config.ts                   # jsdom for component tests
├── README.md
├── LICENSE
├── .github/
│   └── workflows/
│       └── ci.yml                     # Lint, type check, test, build
└── .gitignore
```

---

## Routing

React Router v6 with code-split per tool (so the JS for HEIC doesn't
load on the WebP tool):

```tsx
// src/App.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell';
import { HomePage } from './pages/HomePage';
import { PrivacyPage } from './pages/PrivacyPage';
import { NotFoundPage } from './pages/NotFoundPage';

const HeicToJpg = lazy(() => import('./routes/heic-to-jpg'));
const PngToJpg = lazy(() => import('./routes/png-to-jpg'));
// ... 9 more lazy imports

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'heic-to-jpg', element: <Suspense fallback={<Loading />}><HeicToJpg /></Suspense> },
      { path: 'png-to-jpg', element: <Suspense fallback={<Loading />}><PngToJpg /></Suspense> },
      // ...
      { path: 'privacy', element: <PrivacyPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
```

Each tool route file is **thin**: it imports the conversion function and
a generic `<ToolPage>` component, passes tool-specific options, done.

```tsx
// src/routes/heic-to-jpg.tsx
import { heicToJpg } from '../lib/conversions/image/heic-to-jpg';
import { ToolPage } from '../components/tool/ToolPage';

export default function HeicToJpgPage() {
  return (
    <ToolPage
      title="HEIC to JPG"
      description="Convert iPhone HEIC photos to JPG, in your browser. No upload."
      accept={['.heic', '.heif', 'image/heic', 'image/heif']}
      convert={heicToJpg}
      outputMimeType="image/jpeg"
      outputExtension="jpg"
    />
  );
}
```

This is the pattern for all 11 routes. Each route file is ~10 lines.

---

## The `<ToolPage>` generic component

This is the heart of the app. One component, used by all 11 tools:

```tsx
// src/components/tool/ToolPage.tsx
import { useState, useCallback } from 'react';
import { DropZone } from '../upload/DropZone';
import { ProcessingStatus } from '../processing/ProcessingStatus';
import { ErrorMessage } from '../processing/ErrorMessage';
import { DownloadButton } from '../output/DownloadButton';
import { PreviewImage } from '../output/PreviewImage';
import { ToolOptions } from './ToolOptions';
import { useConversion } from '../../hooks/useConversion';

interface ToolPageProps<O> {
  title: string;
  description: string;
  accept: string[];
  convert: (file: File, options: O) => Promise<Blob>;
  options?: O;
  optionsComponent?: React.ComponentType<{ value: O; onChange: (o: O) => void }>;
  outputMimeType: string;
  outputExtension: string;
}

export function ToolPage<O>({ ... }: ToolPageProps<O>) {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<O>(...);
  const { status, progress, result, error, run, cancel } = useConversion();

  const handleFile = useCallback((f: File) => {
    setFile(f);
    run(convert(f, options));
  }, [options, run, convert]);

  return (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
      {!file && <DropZone accept={accept} onFile={handleFile} />}
      {file && status === 'idle' && <FilePreview file={file} />}
      {file && status === 'processing' && <ProcessingStatus progress={progress} onCancel={cancel} />}
      {file && status === 'done' && result && <ResultView result={result} />}
      {status === 'error' && <ErrorMessage error={error} onRetry={...} />}
    </div>
  );
}
```

Every tool is a different `convert` function. The shell is shared.

---

## Conversion function signature

Every conversion function in `lib/conversions/` follows the same shape:

```ts
// lib/conversions/image/heic-to-jpg.ts
import { decode } from '@jsquash/jpeg';
import heic2any from 'heic2any';
import { stripExif } from './strip-exif';

export async function heicToJpg(file: File): Promise<Blob> {
  // 1. Decode HEIC via heic2any → ImageBitmap (or Blob)
  const decoded = await heic2any({ blob: file, toType: 'image/jpeg' });
  // 2. Strip EXIF (always, per design)
  const stripped = await stripExif(decoded as Blob);
  return stripped;
}
```

This signature (`File → Promise<Blob>`) makes conversion functions
unit-testable in isolation, no React required.

---

## Web Worker pattern

jSquash codecs run in a Web Worker to keep the main thread responsive:

```ts
// src/lib/workers/image.worker.ts
import { decode as decodeJpeg, encode as encodeJpeg } from '@jsquash/jpeg';
// ...

self.addEventListener('message', async (e) => {
  const { type, buffer, options } = e.data;
  try {
    let result: ArrayBuffer;
    switch (type) {
      case 'encode-jpeg': {
        const imageData = await decodeJpeg(buffer);
        result = await encodeJpeg(imageData, { quality: options.quality });
        break;
      }
      // ... other codec operations
    }
    self.postMessage({ success: true, buffer: result }, [result]);
  } catch (err) {
    self.postMessage({ success: false, error: String(err) });
  }
});
```

The hook manages the worker lifecycle:
```ts
// src/hooks/useConversion.ts
const worker = useMemo(() => new Worker(
  new URL('../lib/workers/image.worker.ts', import.meta.url),
  { type: 'module' }
), []);

const run = useCallback(async (promise: Promise<Blob>) => {
  setStatus('processing');
  try {
    const blob = await promise;
    setResult(blob);
    setStatus('done');
  } catch (err) {
    setError(err);
    setStatus('error');
  }
}, []);
```

**ffmpeg.wasm** uses its own internal worker (the library handles
it). You just call `await ffmpeg.load()` once, then `ffmpeg.exec(...)`.

---

## ffmpeg.wasm integration

ffmpeg.wasm v0.12+ API:
```ts
// src/lib/engines/ffmpeg.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

export async function getFFmpeg(
  onProgress?: (progress: number) => void
): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const ffmpeg = new FFmpeg();
    if (onProgress) ffmpeg.on('progress', ({ progress }) => onProgress(progress));

    // Load core from same origin (COEP requirement)
    const baseURL = '/ffmpeg';  // self-hosted, served from public/
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return loadingPromise;
}
```

**Important**: the ffmpeg-core files must be self-hosted in `public/ffmpeg/`,
NOT loaded from a CDN. COEP blocks cross-origin resources. The
`toBlobURL` helper fetches them and creates a blob URL for ffmpeg to
consume from same-origin.

To copy the core files during build:
```json
// package.json scripts
{
  "scripts": {
    "postinstall": "cp node_modules/@ffmpeg/core/dist/umd/* public/ffmpeg/ || echo 'no ffmpeg core, install separately'"
  }
}
```

Or just copy them once after install and commit them (or gitignore + download in CI).

**Conversion example**:
```ts
// src/lib/conversions/video/video-to-mp4.ts
import { getFFmpeg } from '../../engines/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export async function videoToMp4(
  file: File,
  options: { onProgress?: (p: number) => void } = {}
): Promise<Blob> {
  const ffmpeg = await getFFmpeg(options.onProgress);
  await ffmpeg.writeFile('input', await fetchFile(file));
  await ffmpeg.exec(['-i', 'input', '-c:v', 'libx264', '-preset', 'fast', 'output.mp4']);
  const data = await ffmpeg.readFile('output.mp4');
  return new Blob([data], { type: 'video/mp4' });
}
```

---

## State management

**Tool-local state** (the file the user just dropped, the current
options): useState inside the route component.

**Cross-tool state** (default quality, theme, recent conversions):
Zustand store persisted to IndexedDB (not localStorage — too small for
file references).

```ts
// src/state/settings.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

const idbStorage = {
  getItem: async (name: string) => (await idbGet(name)) ?? null,
  setItem: async (name: string, value: string) => idbSet(name, value),
  removeItem: async (name: string) => idbDel(name),
};

interface Settings {
  defaultJpegQuality: number;
  defaultMp4Preset: 'ultrafast' | 'fast' | 'medium';
  recentConversions: Array<{ tool: string; filename: string; timestamp: number }>;
  setDefaultQuality: (q: number) => void;
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      defaultJpegQuality: 85,
      defaultMp4Preset: 'fast',
      recentConversions: [],
      setDefaultQuality: (q) => set({ defaultJpegQuality: q }),
    }),
    { name: 'image-converter-settings', storage: createJSONStorage(() => idbStorage) }
  )
);
```

Add `idb-keyval` to deps (small, well-maintained wrapper around IndexedDB).

---

## Cloudflare Pages configuration

### `public/_headers`
```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Resource-Policy: same-origin
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/ffmpeg/*
  Cache-Control: public, max-age=31536000, immutable
```

The `Cache-Control` on `/ffmpeg/*` lets the browser cache the 30MB wasm
binary across sessions. First load: 30MB. Subsequent loads: instant.

### `public/_redirects`
```
/*    /index.html   200
```

Standard SPA fallback for React Router.

### Deploy
```bash
bun install
bun run build
# Wrangler for first deploy (CLI):
bunx wrangler pages deploy dist --project-name=image-converter
# Subsequent deploys: push to main, Cloudflare auto-deploys
```

CI in `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install --frozen-lockfile
      - run: bun run lint
      - run: bun run typecheck
      - run: bun run test
      - run: bun run build
```

---

## Implementation order (3 weeks)

### Week 1: Setup + first image tool

| Day | Task |
|---|---|
| 1 | `bun create vite image-converter -- --template react-ts`; `cd` in; install deps from `package.json` above; set up Tailwind + Biome + Vitest; init git; create GitHub repo; push empty scaffold |
| 2 | Copy ffmpeg-core to `public/ffmpeg/`; configure `_headers` and `_redirects`; deploy to Cloudflare Pages (smoke test); **Windows ffmpeg.wasm smoke test** (load + run a no-op command) |
| 3 | Build `AppShell`, `Header`, `Footer`, `DropZone`, `ErrorBoundary`, `DownloadButton`; write `useFileDrop` hook |
| 4 | Build `ToolPage` generic component; build first conversion: `heicToJpg` (uses heic2any + jSquash JPEG); wire up `/heic-to-jpg` route |
| 5 | Tests for `heicToJpg` (unit) + `<HeicToJpgPage>` (integration); add `piexifjs` strip post-process; verify EXIF removed from output |

**Week 1 exit criteria**: User can drop a HEIC file on `/heic-to-jpg`
and download a JPG. Works on Windows + Chrome. No console errors. EXIF
stripped.

### Week 2: Remaining image tools + first video tool

| Day | Task |
|---|---|
| 6-7 | `pngToJpg`, `jpgToPng`, `webpToJpg`, `jpgToWebp` (shared jSquash pipeline); routes for each; tests |
| 8 | `resizeImage` (Canvas + jSquash re-encode); `compressImage` (jSquash quality slider); the shared `<Slider>` component; tests |
| 9 | `stripExif` standalone route (post-process only); ensure default-on stripping is consistent across all image tools; integration tests |
| 10 | ffmpeg.wasm engine loader (`getFFmpeg()`); `videoToMp4` (first video tool); `/video-to-mp4` route; smoke test with sample MP4 |

**Week 2 exit criteria**: 8 image tools + 1 video tool live, all
working, all tested.

### Week 3: Remaining video tools + polish + launch

| Day | Task |
|---|---|
| 11-12 | `videoToGif`, `extractAudio`; routes; tests |
| 13 | Edge cases: corrupt file, codec load failure, file too large, mid-conversion cancel; `ErrorMessage` + `RetryButton`; `FileSizeWarning` |
| 14 | Mobile testing (iOS Safari 16+, Android Chrome 110+); fix any layout issues; accessibility check (WCAG AA on input controls); `PrivacyPage` |
| 15 | README, launch post draft (Reddit/HN), SEO meta tags, sitemap; final deploy; **LAUNCH** |

**Week 3 exit criteria**: All 11 tools live, mobile-tested, accessible,
documented. Ready to post to launch channels.

### Validation window (weeks 4-7)

| Week | Activity |
|---|---|
| 4 | Post to r/ezgif, r/webdev, r/SideProject; monitor Cloudflare analytics; triage GitHub issues |
| 5 | Repeat posts (Hacker News, ProductHunt); respond to feedback; ship small bug fixes |
| 6 | Review metrics against validation gate; decide proceed/pivot/stop |
| 7 | Decision: proceed to Phase B, pivot, or stop |

---

## Edge cases to handle in code

These come from the design doc's edge cases list. For each, name the
handling:

| Edge case | Handling |
|---|---|
| Corrupt / unsupported file | Try/catch in `useConversion`; render `ErrorMessage` with "This file couldn't be read. It may be corrupt or in an unsupported format." |
| Codec load failure (network error fetching ffmpeg.wasm) | `ErrorMessage` with "Failed to load the conversion engine. Check your network and retry." + `RetryButton` |
| Browser back button mid-conversion | `useEffect` cleanup cancels in-flight job + terminates worker |
| Image > 20MP on mobile | `FileSizeWarning` warns before processing; recommend resize first |
| HEIC live photos (HEIF sequence) | heic2any returns first frame only; `ErrorMessage` says "Live Photos are converted to a single still frame." |
| User drops wrong file type | `DropZone` validates `accept` prop; `ErrorMessage` on mismatch |
| User drops multiple files | Phase A: process the first one, ignore the rest with a notice. Phase B: batch. |
| File exactly at guard rail | Allow; warn but proceed |
| File just over guard rail | Block with friendly "This file is too large for browser processing. Try a smaller file." |
| Worker crashes | `ErrorBoundary` catches, falls back to error state, allows retry |
| User reloads mid-conversion | Tool-local state is lost (acceptable for Phase A) |

---

## Test plan

### Unit tests (Vitest, fast)
- One file per conversion in `tests/unit/conversions/`
- Each test: load fixture → call conversion function → assert output MIME type, dimensions, file size delta
- Run on every PR via CI

### Integration tests (Vitest + Testing Library)
- One file per tool route in `tests/integration/`
- Each test: render route, simulate file drop, assert download button appears
- Mock the codec layer (no real ffmpeg.wasm in tests)
- Run on every PR

### Manual tests (before each release)
- Real HEIC file on iOS Safari (most likely to break)
- Real 100MB video on Chrome desktop
- Real 50MB image on Android Chrome
- COOP/COEP check: open DevTools console, verify no CORP errors
- Privacy check: open Network tab, verify zero requests to our origin after first page load (during a conversion)

### Test fixtures
Source these from real-world files in `tests/fixtures/README.md`:
- `sample.png` — small (100x100), tiny file, basic case
- `sample.jpg` — small, with EXIF (use `exiftool` to add fake EXIF)
- `sample.webp` — small, animated and non-animated
- `sample.heic` — actual iPhone photo (anonymize first)
- `sample.mp4` — short (5-10s), 1080p, 5-10MB
- `sample-with-exif.jpg` — for strip-exif testing
- `sample-large.jpg` — 50MB+ for guard rail testing

---

## Performance budget

- **Initial JS (homepage)**: < 100KB gzipped
- **Per-tool JS** (lazy-loaded on route): < 200KB gzipped (excluding codec)
- **Codec load** (ffmpeg.wasm): ~30MB, lazy, after first user action on a video tool
- **jSquash codecs**: ~500KB per codec, lazy
- **Lighthouse score target**: > 85 on homepage

Use Vite's build analyzer (`bunx vite-bundle-visualizer`) to verify.

---

## Browser support matrix

| Browser | Image tools | Video tools | Notes |
|---|---|---|---|
| Chrome 110+ (desktop) | ✅ | ✅ | Primary target |
| Firefox 110+ (desktop) | ✅ | ✅ | |
| Safari 16+ (macOS) | ✅ | ✅ | |
| Edge 110+ (desktop) | ✅ | ✅ | |
| Chrome 110+ (Android) | ✅ | ⚠️ best-effort | Mobile memory limits |
| Safari 16+ (iOS) | ✅ | ⚠️ best-effort | Limited SharedArrayBuffer |
| IE 11 | ❌ | ❌ | Not supported, never will be |

Phase A success criteria: image tools on all six browsers; video tools
on the four desktop browsers.

---

## Open engineering questions

These are decisions to make during the build, not blocking now:

1. **Bundle splitting strategy**: per-tool route-based (current plan)
   vs. per-codec dynamic import? Per-route is simpler.
2. **Sentry / error reporting**: none in Phase A per privacy promise.
   If a codec crashes, the user just sees an error. Phase C might add
   optional Sentry with explicit opt-in.
3. **Analytics granularity**: Cloudflare Web Analytics is per-page
   only. If we want per-tool usage data, we'd need a tiny self-hosted
   counter (e.g., a Cloudflare Worker that just increments a number).
   Out of scope for Phase A.
4. **i18n**: copy is hardcoded English in Phase A. Plan for i18n in
   Phase B if demand signal exists.
5. **Dark mode**: out of scope for Phase A, design tokens can come
   online later.

---

## Definition of done for Phase A (re-stated from design doc)

- [ ] 11 tools live at their respective routes
- [ ] < 2s conversion for HEIC → JPG on a 5MB file (Chrome desktop)
- [ ] < 30s conversion for 1-min video → MP4 (1080p)
- [ ] ffmpeg.wasm + heic2any + jSquash all integrated, no console errors
- [ ] COOP/COEP set, no CORP violations
- [ ] Cloudflare Pages deployment working
- [ ] All 11 tools tested (unit + integration)
- [ ] Manual mobile testing on iOS Safari + Android Chrome
- [ ] Privacy page published
- [ ] README with usage docs
- [ ] Launch post drafted
- [ ] Posted to r/ezgif, r/webdev, r/SideProject
- [ ] ffmpeg.wasm smoke test passed on Windows 11 + Chrome (end of week 1)

---

## What's NOT in this plan

These are explicitly out of scope for Phase A:

- Service worker / PWA (Phase B)
- Video trim (Phase B)
- Batch processing (Phase B)
- AI features (Phase B)
- Server / backend / C (Phase C)
- Stripe / billing (Phase C)
- i18n (later)
- Dark mode (later)
- A11y audit beyond basic input controls (later)
- Performance beyond Lighthouse 85 (later)
