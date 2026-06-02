# Research: Image/Video Converter Project

Date: 2026-06-02
Mode: pre-product (no code written yet)

## What I researched

1. **[target-ezgif.md](target-ezgif.md)** — Deep dive on ezgif.com: tool inventory,
   architecture, revenue model, gaps you could exploit
2. **[competitors.md](competitors.md)** — PixConvert, HighTool, TheWebPConverter,
   Aspose, Kapwing, plus 11 open-source projects to study (Squoosh, omni-tools,
   jSquash, WASM-ImageMagick, video-compress, clip-js, etc.)
3. **[open-source-references.md](open-source-references.md)** — Tiered list of
   projects worth forking patterns from, with concrete code patterns to adopt
4. **[tech-stack-analysis.md](tech-stack-analysis.md)** — Honest analysis of
   React + TS + Bun, why Bun matters less than you'd think for a client-side
   app, and my recommended stack

## The single most important finding

ezgif's architectural pattern is **client-side WASM processing in the browser**.
No file ever leaves the device. This is the privacy moat. It also means
**the JavaScript runtime on the server is irrelevant** — the browser does all
the work.

That reframes the whole stack choice: Bun as a runtime buys you almost nothing
here. The interesting question is *which framework, which library, which
deployment target* — not *which runtime*.

## The honest take on the tech stack

- **Vite + React + TypeScript** is the right answer for the dev server / build
- **Bun as a package manager** (`bun install`) is fine and fast
- **Bun as a server runtime** is unnecessary for a static client-side app
- **ffmpeg.wasm + jSquash** are the actual heavy lifters — they do the work in
  the browser
- **Vercel/Netlify/Cloudflare Pages** will host it for free, with the COOP/COEP
  headers ffmpeg.wasm requires

See [tech-stack-analysis.md](tech-stack-analysis.md) for the full reasoning
and the recommended dependency list.

## Next step

Brainstorm with the user on which implementation approach to take. See
[../design/design-doc.md](../design/design-doc.md) for the full alternatives
analysis.
