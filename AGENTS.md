# AGENTS.md

## Project state

Pre-product. **No code yet.** No `package.json`, no `src/`, no `lib/`, no
`pubspec.yaml`. The `research/` and `design/` folders contain planning
documents, not source code. Do not run `bun install`, `npm install`, or
any build command — there is nothing to build.

The folder path (`E:\flutter\image_convertor`) is a leftover from an
earlier Flutter idea. The actual product is a browser-based React +
TypeScript tool. Do not scaffold a Flutter app.

The repo is not a git repo yet.

## Read first, every session

In this order:

1. **`SOUL.md`** — behavioral code for the agent (values, identity,
   security posture, no-flattery rule, push-back on weak choices).
   Read before doing anything. Arabic version exists as `SOUL_ar.md`
   (same content).
2. **`design/design-doc.md`** — the phased plan (A → B → C with
   validation gates). Source of truth for *what* to build. APPROVED
   2026-06-02.
3. **`design/phase-a-implementation-plan.md`** — engineering plan for
   Phase A (file structure, library versions, integration code,
   3-week day-by-day order). APPROVED 2026-06-02 (companion to
   `design-doc.md`).

The 5 files in `research/` explain *why* the stack was chosen. Most
agents will only need `research/tech-stack-analysis.md` (why Bun is the
package manager only, not the runtime) and `research/target-ezgif.md`
(what we're building toward).

## What the user has committed to (binding)

- **Phased delivery**: A → validate → B → validate → C. Do not skip
  phases. Do not start Phase C work until Phase A's validation gate
  passes. Phase C work is server-side FFmpeg, job queues, R2 storage,
  Stripe — none of this belongs in Phase A.
- **Phase A constraints**: pure client-side, no server code, no auth,
  no Stripe, no service worker, no PWA. The 5 Assignment steps in
  `design-doc.md` must happen before any code is written: pick a
  domain, set up the GitHub repo, run the ffmpeg.wasm Windows smoke
  test, set a launch date, skip C.
- **Bun is the package manager only.** Per `tech-stack-analysis.md`,
  Bun as a runtime adds nothing to a static client-side app. Use
  `bun install` for installs; Vite for dev/build. Do not write a
  Bun server.
- **Validation gates are non-negotiable.** Each phase has a measurable
  gate. If the gate fails, stop — do not push forward. See
  `design-doc.md` §"Validation gate (A → B)" for the specific
  metrics.

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
| Phase A build | Not started (waiting on Assignment steps) |
| Git repo | Not initialized |
| Dependencies installed | None |
