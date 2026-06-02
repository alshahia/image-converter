# Open-Source References Worth Studying

Fetched: 2026-06-02

Projects to read, run, and possibly fork patterns from. Listed in priority order
for an image/video converter project.

## Tier 1 — directly relevant, study the architecture

### 1. Squoosh (Google) — 24.7k stars
- **Repo**: github.com/GoogleChromeLabs/squoosh
- **What it does**: Image compression with codec choice, before/after preview
- **Why study**: This is THE reference for client-side image processing. Uses
  jSquash (their own WASM codec bundles derived from this project). Their
  worker pattern is the gold standard.
- **Key pattern**: Each codec in its own Web Worker. Main thread just orchestrates.
- **Stack**: TypeScript, Lit web components, no React (worth considering).

### 2. ffmpeg.wasm — 17.5k stars
- **Repo**: github.com/ffmpegwasm/ffmpeg.wasm
- **What it does**: FFmpeg compiled to WASM for browser
- **Why study**: This is THE engine for client-side video/audio. You'll either
  use this directly or use libraries built on it.
- **Key constraint**: Requires COOP/COEP headers for SharedArrayBuffer
  (multi-thread core). Without these, FFmpeg.wasm refuses to initialize.
- **Critical headers**:
  ```
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  ```
- **API version**: v0.12+ uses `new FFmpeg()` class, NOT the old `createFFmpeg()`

### 3. omni-tools — 8.5k stars
- **Repo**: github.com/iib0011/omni-tools
- **What it does**: 100+ web tools in one app, fully client-side
- **Why study**: Closest thing to "ezgif as a React app". Multi-tool architecture
  in a single React shell. Look at their routing, tool registry, and shared
  component patterns.
- **Stack**: React, TypeScript

### 4. jSquash — 606 stars
- **Repo**: github.com/jamsinclair/jSquash
- **What it does**: Browser & Web Worker focused image codec WASM bundles
- **Why study**: Modern alternative to Squoosh's internal codecs. Smaller bundles,
  worker-first, no Node.js deps. MIT licensed, actively maintained.
- **Use case**: For image conversions (WebP, AVIF, JPEG, PNG, JXL, OxiPNG)

## Tier 2 — useful patterns

### 5. video-compress (Addy Osmani)
- **Repo**: github.com/addyosmani/video-compress
- **Stack**: React 18 + TypeScript + ffmpeg.wasm
- **Why study**: Clean React integration of ffmpeg.wasm. Real-time preview
  (unusual — most tools wait for completion). Built by an engineering leader
  at Google; code quality is high.

### 6. clip-js
- **Repo**: github.com/mohyware/clip-js
- **Stack**: Next.js 14 + ffmpeg.wasm + Remotion + IndexedDB
- **Why study**: Combines ffmpeg.wasm (rendering) with Remotion (preview) — the
  best of both. Caches binaries in IndexedDB. 1080p H.264 export.
- **When relevant**: If you add video editing features (timeline, preview)

### 7. WASM-ImageMagick — 914 stars
- **Repo**: github.com/KnicKnic/WASM-ImageMagick
- **Why study**: ImageMagick in the browser. Massive format support. The format
  coverage moat that ezgif has.
- **Tradeoff**: Larger bundle, slower than purpose-built codecs.

## Tier 3 — inspiration only

### 8. Final2x — 7k stars
- AI image upscaling. Worth looking at for AI-feature inspiration.

### 9. RapidRAW — 4.6k stars
- RAW photo processing. Native app (Tauri). Different distribution model but
  similar feature space.

### 10. videoconverter.live
- Simple, focused ffmpeg.wasm converter. Good MVP reference.

## Patterns to adopt (synthesis)

1. **Worker-based codec isolation** (Squoosh, jSquash pattern)
   - One WASM module per codec, loaded on demand
   - Run in Web Worker so main thread stays responsive
   - Cache in IndexedDB or service worker

2. **Progressive enhancement** (ffmpeg.wasm Studio pattern)
   - Detect browser capabilities (SharedArrayBuffer, WebCodecs, OffscreenCanvas)
   - Use the best available, fall back gracefully
   - Show user a clear message if their browser can't do what they need

3. **Tool registry + URL-per-tool** (ezgif + omni-tools pattern)
   - Each tool is a route (`/video-to-gif`, `/webp-to-png`)
   - Tools are pure functions registered in a central registry
   - Easy to add new tools, easy to deep-link, great for SEO

4. **Settings persistence in localStorage** (small but mighty)
   - User picks "JPG quality 85" once, it sticks
   - Better than ezgif's cookie-based persistence

5. **Drag-and-drop with file system access API**
   - Modern browsers support `showDirectoryPicker` for batch
   - Falls back to drag-and-drop multiple files

6. **Streaming preview during processing** (video-compress pattern)
   - Don't make user wait for the whole thing
   - Show progress, frame previews, audio waveforms
