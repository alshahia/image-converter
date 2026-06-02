# Design Docs

## [design-doc.md](design-doc.md)

The main design document. Phased plan (A → B → C) with validation gates
between each phase. Built off the research in `../research/`. **Status:
APPROVED 2026-06-02.**

## [phase-a-implementation-plan.md](phase-a-implementation-plan.md)

The engineering plan for Phase A: file structure, library versions,
routing, `<ToolPage>` generic component, conversion function signature,
ffmpeg.wasm + jSquash + heic2any + piexifjs integration, Web Worker
pattern, state management, Cloudflare Pages config, 3-week
implementation order, edge cases, test plan, performance budget, browser
support matrix. **Status: APPROVED (companion to design-doc.md).**

## Read in this order

1. `../research/README.md` — research overview
2. `../research/target-ezgif.md` — what we're building toward
3. `../research/competitors.md` — what else is out there
4. `../research/open-source-references.md` — code patterns to learn
5. `../research/tech-stack-analysis.md` — why Vite + React + TS, why
   Bun matters less than you'd think
6. [design-doc.md](design-doc.md) — the actual plan (the *why*)
7. [phase-a-implementation-plan.md](phase-a-implementation-plan.md) —
   the engineering details (the *how*)
