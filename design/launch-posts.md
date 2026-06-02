# Launch posts

Drafts for the public launch on 2026-06-30. Adapt per platform.

---

## r/ezgif, r/webdev, r/SideProject (Reddit)

**Title:** I built a free, no-upload image and video converter that runs in your browser

**Body:**

Hi r/SideProject. I've been working on this for the past few weeks and it's finally ready to share.

**Image Converter** (https://image-converter.example) is a privacy-first alternative to ezgif.com and similar tools. Drop a file, pick a tool, get the result. Nothing is uploaded.

**What's there:** 11 tools — HEIC→JPG, PNG↔JPG, WebP↔JPG, resize, compress, strip EXIF, video→MP4, video→GIF, extract audio.

**How it works:** Everything runs in your browser using WebAssembly (ffmpeg.wasm for video, jSquash for images, heic2any for HEIC). The site sets COOP/COEP headers so ffmpeg.wasm can use SharedArrayBuffer, which means everything is self-hosted — no Google Fonts, no CDN scripts.

**Why I built it:** ezgif is great but feels stuck in 2010. Cloud converters all want your email, your file, or both. I wanted something I could use on a work laptop without worrying about whether my photo was being logged.

**Privacy:** No accounts, no uploads, no cookies. EXIF (including GPS) is stripped from every image output by default. Cloudflare Web Analytics for page views only — no per-file tracking.

**Tech stack:** Vite + React 18 + TypeScript, Bun as the package manager, Cloudflare Pages for hosting. Open source: https://github.com/alshahia/image-converter

**Things I'd love feedback on:**

1. The home page UX — is 11 tools overwhelming? Should some be hidden behind a "more" button?
2. The mobile layout — I haven't tested on iOS Safari yet.
3. The image conversion quality — jSquash uses mozjpeg, which is excellent but not always the smallest file size. Would love to know if anyone has a use case where it's too big.
4. Anything that feels off or janky.

Thanks for trying it!

---

## Hacker News (Show HN)

**Title:** Show HN: Free, no-upload image and video converter that runs in your browser

**Body:**

Hi HN. I built https://image-converter.example because I was tired of:

- ezgif looking like it's from 2010
- Cloud converters that want my email + my file
- Tools that don't strip EXIF, so my GPS coordinates leak with every "test image"

It's 11 tools (HEIC→JPG, PNG↔JPG, WebP↔JPG, resize, compress, strip EXIF, video→MP4, video→GIF, extract audio), all client-side. The site sets COOP/COEP headers so ffmpeg.wasm can use SharedArrayBuffer, which forces everything to be self-hosted — a constraint I turned into a feature (no Google Fonts, no CDN scripts, no third-party tracking).

**Tech:** Vite + React 18 + TypeScript, jSquash for image codecs (in a Web Worker), ffmpeg.wasm v0.12 for video, heic2any for HEIC, piexifjs for EXIF stripping. ~6KB of JS per tool (lazy-loaded), plus codec WASM as needed. Bun is the package manager, Node isn't installed. Cloudflare Pages for hosting.

**Privacy model:** No accounts, no uploads, no cookies, no analytics that touch files. EXIF is stripped by default from every image output — the dedicated /strip-exif route does lossless removal (no re-encode) for when you just want the metadata gone.

**Caveats:**

- First video conversion downloads ~30MB of ffmpeg-core. Cached after.
- iOS Safari has limited SharedArrayBuffer; large video conversions may OOM.
- The image codecs are not always the smallest possible file size. They're excellent quality at a reasonable size, not a space race.

**Open source:** https://github.com/alshahia/image-converter

Happy to answer technical questions. The two design constraints I kept coming back to were (1) zero upload (so the conversion path is pure client-side) and (2) zero CDN (forced by COEP). Both made the build harder but the product better.

---

## ProductHunt (coming later)

**Tagline:** Free, no-upload image and video converter. EXIF stripped. Open source.

**Description:** Drop a file, get a result. 11 tools, all client-side.

**Topics:** privacy, image-processing, video, webassembly, open-source

---

## Notes for posting

- **r/ezgif** specifically: lead with "this is *not* a replacement for ezgif, it's a privacy-first alternative." Don't sound like you're attacking them.
- **r/webdev**: lead with the tech stack and the Web Worker pattern. Engineers care about the architecture.
- **r/SideProject**: lead with the story and ask for feedback.
- **Hacker News**: Show HN format. Be technical. Don't over-sell.
- **ProductHunt**: needs a hunter; post on Tuesday-Thursday morning PT for best visibility.
- **Cross-posting**: don't post the same exact text to all four — adapt per the notes above.
