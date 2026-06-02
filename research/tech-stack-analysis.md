# Tech Stack Analysis: React + TypeScript + Bun

Your stated stack: **React + TypeScript + Bun**.

Per SOUL.md (independent, rigorous, no flattery), I will NOT just tell you what
you want to hear. Here is the honest analysis.

---

## TL;DR

**For a fully client-side image/video converter, "Bun" as a JavaScript runtime
matters almost nothing** — the heavy work happens in the browser via WASM
(ffmpeg.wasm, jSquash codecs). The runtime only matters at build time and
(optionally) at server time.

**My recommended stack**:
- **Vite + React + TypeScript** for the dev server / build
- **Bun as the package manager** (`bun install`) if you want fast installs
- **ffmpeg.wasm + jSquash** for the actual media processing in the browser
- **Host anywhere** — Vercel, Netlify, Cloudflare Pages, GitHub Pages. Static.

Skip Bun as a server runtime unless you specifically need a server component.
Skip Bun's bundler — Vite is more battle-tested for React.

---

## What Bun actually is (re-set the frame)

Bun is **a JavaScript runtime that aims to replace Node.js**, with a built-in
package manager, test runner, and bundler. It's not a framework, not a build
tool you can compare to Webpack. It's a runtime like Node or Deno.

The marketing: "All-in-one JavaScript toolkit" — package manager, test runner,
bundler, transpiler, runtime, all from one binary.

The reality: It's very good at what it does, but for a **browser-only** app
like this, the runtime is almost invisible to you.

---

## Pros of Bun (general, not specific to this project)

| Pro | Concrete impact |
|---|---|
| **Fast installs** | `bun install` is 5-30x faster than `npm install` for typical projects |
| **Native TypeScript** | No need for `ts-node`, `tsx`, or build step to run TS scripts |
| **Built-in test runner** | `bun test` works with Jest-style syntax, no config |
| **Built-in bundler** | `Bun.build()` can replace esbuild/rollup for many use cases |
| **Drop-in Node API** | Most `node:*` modules and npm packages work without changes |
| **Single binary** | One install, no juggling `nvm`, `corepack`, `npx` |
| **Active development** | Bun 1.x stable, frequent releases, Jarred Sumner is shipping fast |
| **Faster HTTP server** | Bun.serve() benchmarks faster than Express/Fastify for many workloads |
| **Web Streams, fetch, etc. modern** | Better Node compat story than Deno for some things |

## Cons of Bun (general, not specific to this project)

| Con | Concrete impact |
|---|---|
| **Younger** | Less battle-tested than Node. Edge cases still being found. |
| **Some npm packages break** | Native modules, packages with `node-gyp`, some postinstall scripts |
| **Smaller community** | Stack Overflow answers, blog posts, Discord — Node wins on volume |
| **Deploy friction** | Vercel, Netlify, Cloudflare primarily support Node. Bun requires more setup. |
| **Bundler not Vite** | Vite's HMR, plugin ecosystem, and React integration are more mature |
| **Database drivers limited** | Some libs (Prisma in particular) are still settling |
| **Memory leaks reported** | A few long-running server issues in production |

---

## Why Bun matters LESS for this specific project

ezgif's architectural pattern (and the one PixConvert, HighTool, TheWebPConverter
all follow) is **client-side processing in the browser**:

1. User drops a file
2. Browser reads it via File API → ArrayBuffer
3. WASM module (ffmpeg.wasm, jSquash codec) processes it locally
4. Output Blob → download via Blob URL
5. **No server round trip. The "runtime" on the server side is irrelevant.**

The JavaScript runtime you use (Bun, Node, Deno) only matters for:
- **Build time** — bundling your React app
- **Dev server** — HMR, file watching
- **Optional server** — if you add a backend

For a static client-side app deployed to Vercel/Netlify/Cloudflare Pages, **none
of the runtime is exercised at request time**. The browser does the work.

This is why ezgif itself is a static site with no backend. Privacy + cost = static.

---

## So what's the right stack?

### Recommended: Vite + React + TypeScript, Bun as package manager

```bash
# Use Bun to install, but Vite for dev/build
bun create vite my-app -- --template react-ts
cd my-app
bun install
bun run dev
bun run build
```

- **Vite 6**: Best-in-class dev server, HMR, Rollup-based production builds,
  massive React ecosystem (every React library has a Vite plugin)
- **React 18+**: Familiar, hireable, biggest component ecosystem
- **TypeScript**: Catches the kind of bugs that would otherwise hit production
- **Bun**: Used for fast installs and (optionally) running TS scripts
- **Deploy**: `bun run build` → `dist/` → push to Vercel/Netlify/Cloudflare Pages

### Alternative 1: Next.js + React + TypeScript

- **Pros**: If you want SSR, serverless API routes, or Vercel hosting
- **Cons**: Overkill for a client-side tool. Adds React Server Components
  complexity, hydration concerns, bundle bloat. The ffmpeg.wasm multi-thread
  mode requires COOP/COEP headers, which Next.js can set but it adds friction.
- **Use when**: You need server-side AI features, user accounts, or SEO
  marketing pages with deep SSR.

### Alternative 2: SvelteKit + Svelte + TypeScript

- **Pros**: Smaller bundles, simpler mental model, ffmpegwasm.link uses it
- **Cons**: Smaller ecosystem, less hireable, fewer React component libraries
- **Use when**: Bundle size is critical or you love Svelte

### Alternative 3: Pure Vite + React + TS, server in Bun

If you DO need a server (large file handling, AI features, user accounts):
- Frontend: Vite + React + TS
- Server: **Bun + ElysiaJS or Bun.serve()** — genuinely fast, great DX
- Deploy: Fly.io, Railway, or your own VPS (not as easy as Vercel)

### Alternative 4: Cloudflare Workers + React + Vite

- **Pros**: Edge runtime = low latency, generous free tier, no cold starts
- **Cons**: Workers has limits (128MB memory, 30s CPU on free plan). For
  ffmpeg.wasm, the bundle (~30MB) is too big for Workers. Use Pages instead.
- **Use when**: You want a tiny API for metadata extraction or thumbnail
  generation, not heavy FFmpeg work.

---

## ffmpeg.wasm specifics (this is the actual hard part)

Regardless of your JS framework choice, you need:

```bash
bun add @ffmpeg/ffmpeg @ffmpeg/util
```

Key constraints:

1. **Multi-thread mode requires `SharedArrayBuffer`**, which requires:
   ```
   Cross-Origin-Opener-Policy: same-origin
   Cross-Origin-Embedder-Policy: require-corp
   ```
   On Vercel: `vercel.json` headers. On Netlify: `_headers` file. On Cloudflare
   Pages: `_headers` file. This is non-optional and trips up most beginners.

2. **Bundle is ~30MB** (core wasm + worker JS). Lazy-load it on first use, not
   on initial page load. Cache via service worker.

3. **Performance is 5-20x slower than native FFmpeg**. Fine for files under
   ~500MB. Above that, expect memory pressure and tab crashes.

4. **Cannot import from CDN directly** in v0.12+ (the worker has same-origin
   requirements). Bundle it through Vite.

5. **Browser support**: Chrome, Firefox, Edge, Safari (modern). No IE. Mobile
   Safari works but is slower.

---

## For image-only tools (no video)

You can skip ffmpeg.wasm entirely and use:

- **jSquash** — modern, worker-first, MIT, no Node deps
- **Squoosh codecs** — the original, large ecosystem
- **Native browser APIs** — `OffscreenCanvas`, `createImageBitmap`, `canvas.toBlob`
  for basic conversions and resizing
- **WASM-ImageMagick** — if you need ImageMagick's full format coverage

This makes the app dramatically smaller and faster than a video-capable tool.

---

## My actual recommendation

```
Vite 6
+ React 18+
+ TypeScript (strict)
+ Bun (package manager + script runner)
+ ffmpeg.wasm v0.12+ (video/audio)
+ jSquash (image codecs)
+ Tailwind + shadcn/ui (UI)
+ Zustand (state — small, ergonomic)
+ React Router or TanStack Router (tool registry → URL mapping)
+ Vitest (tests — works perfectly with Bun)
+ Biome or ESLint + Prettier (lint/format)
+ Vercel or Cloudflare Pages (hosting)
+ vercel.json with COOP/COEP headers
```

This is a boring, solid, hireable, fast stack. You will not regret it.

If you want to use **Bun the runtime** (because you like it, or you want
homogeneous full-stack with one language), you can. But for a static
client-side converter, it doesn't buy you anything. Save it for a future
project where the server matters.

---

## Risk: what could go wrong with the choice

| Risk | Mitigation |
|---|---|
| ffmpeg.wasm bundle too big, slow first load | Lazy-load on first video tool use, cache via service worker |
| COOP/COEP headers break embeds | Acceptable tradeoff for the tool's use case |
| Mobile Safari memory limits | Warn user, suggest max file size |
| Bun breaks a niche npm package | Fall back to Node for that one tool, or wrap manually |
| WASM codec missing a format | Build a fallback path using server-side FFmpeg later |
