# Image Converter — Design Explorations

Five self-contained landing-page mockups for the browser-based image converter.
Each one is a complete, working HTML file with the full eleven-tool surface
area and the same value proposition, but a totally different visual language.

## How to view

Open `index.html` in this directory to see all five side by side. Or open any
of the individual files below directly in a browser.

```
designs/
├── index.html              ← gallery of all five
├── 01-aurora/index.html    ← Linear/Vercel-style dark with bento grid
├── 02-editorial/index.html ← newspaper aesthetic, serif, minimal
├── 03-brutalist/index.html ← thick borders, hard shadows, loud colours
├── 04-glass/index.html     ← pastel glassmorphism, soft and friendly
└── 05-terminal/index.html  ← monospace, green-on-black, dev-tool
```

No build step. No dependencies to install. Each file is fully self-contained
and loads Tailwind + fonts from public CDNs.

## The five directions

### 01 — Aurora
**Vibe:** Linear / Vercel / Raycast. "Premium developer tool" energy.

- Deep near-black palette (`#020203` → `#0a0a0c`)
- Indigo accent (`#5E6AD2`) with multi-layer glow shadows
- Four animated gradient blobs creating ambient lighting
- Asymmetric bento grid for the 11 tools
- Mouse-tracking radial spotlights on every card
- Gradient text for headlines
- Subtle 64px grid overlay + noise texture
- Inter for UI, JetBrains Mono for metadata

### 02 — Editorial
**Vibe:** A Sunday newspaper. Quiet, considered, paper-textured.

- Off-white paper (`#faf8f5`), no harsh whites
- Fraunces serif headlines (with optical sizing)
- Inter for body, JetBrains Mono for metadata
- Hairline rules and small-caps section labels
- Tools listed alphabetically with a byline-style sidebar
- Terracotta accent (`#c2410c`) used sparingly
- Three-column manifesto and field-notes testimonials
- Newspaper-style masthead with date and price

### 03 — Brutalist
**Vibe:** A 1995 zine that grew up. Loud, proud, and intentionally rough.

- Cream paper (`#fff8e7`) with a 20px dot grid
- Archivo Black for headlines, Space Grotesk for body
- Lime / pink / blue / yellow / orange accent palette
- 3-5px black borders, 6-10px hard drop shadows (no blur)
- "Lifted" hover: `translate(-2px, -2px)` with bigger shadow
- Marquee banners top and middle
- Sticker accents rotated -6° to +8°
- Squash and stretch, no subtlety

### 04 — Glassmorphism
**Vibe:** Soft, pastel, friendly. The opposite of "developer tool."

- Four-colour pastel gradient backdrop (pink → blue → purple → green)
- Three floating blurred blobs (slow, 20s cycle)
- Frosted glass cards with `backdrop-filter: blur(24px)`
- Icon tiles with mini gradients (pink, purple, blue, green, yellow, peach)
- Instrument Serif italic for accent words
- Plus Jakarta Sans for body
- Gradient text using pink → purple → blue
- Subtle 6-12px translateY float on tool cards

### 05 — Terminal
**Vibe:** A man page with a marketing budget. For the people who type.

- Near-black (`#0c0c0d`) with subtle scanlines + noise + vignette
- JetBrains Mono for everything
- Green (`#7ee787`) as the only colour, with pink/amber/blue accents
- Code blocks with line numbers, prompt arrows (`$`, `❯`)
- Comment-prefixed copy (`# this is a section`)
- Top status bar with uptime + latency (live-updating)
- Tools as `ls ./tools` output — a list of clickable command rows
- ASCII art header, CLI example block, FAQ formatted as `man` entries

## What they all share

Every design hits the same beats:

1. **Hero** — value prop + a clear primary CTA + a secondary "how it works"
2. **Upload zone** — somewhere obvious to drop a file
3. **Tools grid/list** — all 11 tools (image converter, jpg-to-png, png-to-jpg,
   jpg-to-webp, webp-to-jpg, heic-to-jpg, resize-image, compress-image,
   strip-exif, video-to-mp4, video-to-gif, extract-audio)
4. **Privacy framing** — the "your file never leaves your browser" message
5. **Footer** — minimal, with the same source/license/contact info

The 11 tool names are pulled directly from the route table in
`design/phase-a-implementation-plan.md`. Nothing here contradicts the spec.

## What's deliberately different

Each design is an extreme. None of them try to be all things. Pick the one
that matches the personality you want the product to project, then build the
real product with the conventions of that design — not the visuals literally.

| Design | Best for | Worst for |
|---|---|---|
| Aurora | B2C, devs, designer-adjacent users | Brand expression, accessibility for low-vision users |
| Editorial | Brand-led, long-tail SEO, trust | Younger users, video-first audiences |
| Brutalist | Launch buzz, brand statement, indie credibility | Enterprise procurement, professional services |
| Glassmorphism | Consumer apps, lifestyle, creative tools | Performance (heavy blur), serious tool tone |
| Terminal | Developer audience, technical credibility | Non-technical users, mobile-first audiences |

## Status

These are exploratory design directions, not committed implementations. They
live outside the React app in `designs/` so they don't interfere with the build,
the test suite, or the routing. Each is a single HTML file with CDN Tailwind
and Google Fonts — nothing to install.

If you want to promote one to the real product, the path is:

1. Pick a direction.
2. Translate the design tokens into `tailwind.config.ts` (already in the repo).
3. Build the actual page components in `src/pages/` using those tokens.
4. Replace the CDN Tailwind with the local build (Vite handles this).
5. Add tests under `tests/` following the same Vitest pattern as the existing
   85 tests.

No part of the React/Vite/Vitest stack needs to change to adopt any of these
designs.
