import { useSEO } from '../hooks/useSEO';

export function PrivacyPage() {
  useSEO(
    'Privacy',
    'Image Converter runs entirely in your browser. Files are processed locally. No upload, no data collection.',
  );

  return (
    <article className="mx-auto max-w-3xl space-y-6 text-neutral-700 dark:text-neutral-300">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Privacy</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated 2026-06-04</p>
      </header>

      <section className="space-y-2">
        <p>
          Image Converter runs entirely in your browser. Files you drop into any tool are processed
          locally on your device. They are not uploaded to our servers (we do not have servers
          participating in the conversion path).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">What runs in your browser</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Image conversion:{' '}
            <a className="underline" href="https://github.com/jakearchibald/squoosh">
              jSquash
            </a>{' '}
            WebAssembly codecs (mozjpeg, libwebp, oxipng)
          </li>
          <li>
            HEIC decoding:{' '}
            <a className="underline" href="https://github.com/alexcorvi/heic2any">
              heic2any
            </a>
          </li>
          <li>
            Video conversion:{' '}
            <a className="underline" href="https://github.com/ffmpegwasm/ffmpeg.wasm">
              ffmpeg.wasm
            </a>{' '}
            (lazy-loaded only on video tools, ~30MB on first use)
          </li>
          <li>
            EXIF stripping:{' '}
            <a className="underline" href="https://github.com/hMatoba/piexifjs">
              piexifjs
            </a>
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">AI models (Wave 8)</h2>
        <p>
          Three AI features are available:{' '}
          <a className="underline" href="/remove-background">
            background removal
          </a>
          ,{' '}
          <a className="underline" href="/upscale-image">
            image upscaling
          </a>
          , and{' '}
          <a className="underline" href="/smart-compress">
            smart compression
          </a>
          . The first two load ONNX model files on first use. The third uses local codec iteration —
          no AI model.
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>U-2-Net (silueta)</strong> — Apache 2.0,{' '}
            <a className="underline" href="https://github.com/xuebinqin/U-2-Net">
              xuebinqin/U-2-Net
            </a>{' '}
            (Pattern Recognition 2020). ~43 MB. Used by background removal.
          </li>
          <li>
            <strong>Real-ESRGAN x2plus / x4plus</strong> — BSD-3-Clause,{' '}
            <a className="underline" href="https://github.com/xinntao/Real-ESRGAN">
              xinntao/Real-ESRGAN
            </a>
            . ~34 MB each. Used by image upscaling.
          </li>
          <li>
            <strong>Smart compress</strong> — no separate model. Uses{' '}
            <a className="underline" href="https://github.com/jakearchibald/squoosh">
              jSquash
            </a>{' '}
            codecs to bisect quality until the target size is hit.
          </li>
        </ul>
        <p className="text-sm text-neutral-500">
          All model files are self-hosted at <code>/models/</code> — they are not loaded from a
          third-party CDN. The browser cache and Cloudflare CDN cache each file for one year.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Intentionally excluded</h2>
        <p>We do not build or host AI models for these use cases:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Face restoration or face enhancement (consent + identity concerns)</li>
          <li>Style transfer on portrait photos (consent concerns)</li>
          <li>DeepOldify or age-progression (deepfake potential)</li>
        </ul>
        <p className="text-sm text-neutral-500">These are out of scope for this project.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">What we collect</h2>
        <p>
          We use Cloudflare Web Analytics, a privacy-respecting analytics service that does not use
          cookies, does not collect personal data, and aggregates visits per page. It tells us which
          tools are popular so we know what to build next.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">What we do not collect</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>File contents (we never see them)</li>
          <li>File names (we never see them)</li>
          <li>
            EXIF metadata, GPS coordinates, or camera details (stripped locally before download)
          </li>
          <li>Cookies (we do not set any)</li>
          <li>
            IP addresses tied to identity (Cloudflare sees them transiently; we do not log them)
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Cross-origin isolation</h2>
        <p>
          This site sets{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
            Cross-Origin-Opener-Policy
          </code>{' '}
          and{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
            Cross-Origin-Embedder-Policy
          </code>{' '}
          headers so that conversion engines like ffmpeg.wasm can use{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
            SharedArrayBuffer
          </code>
          . This means every resource on the page must be self-hosted — no Google Fonts, no
          third-party scripts, no CDN icons.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Open source</h2>
        <p>
          The full source is on{' '}
          <a className="underline" href="https://github.com/alshahia/image-converter">
            GitHub
          </a>
          . You can audit the conversion code, or run a copy on your own server.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Known iOS Safari limitations</h2>
        <p>
          The video tools (trim, crop, rotate, mute, speed, resize, extract-frames, video to WebM)
          all run in your browser via ffmpeg.wasm. On iOS Safari there are a few practical limits to
          be aware of:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Maximum file size is{' '}
            <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
              500MB
            </code>{' '}
            per file.
          </li>
          <li>
            <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
              WAV
            </code>{' '}
            audio output from the audio extractor may not preview in Safari — use AAC or MP3 if you
            need to preview on iOS.
          </li>
          <li>
            <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
              HEIC
            </code>{' '}
            decoding is only available on iOS 16 and later. Older iPhones will get an error on the
            HEIC tools.
          </li>
        </ul>
        <p>
          These limits are in the browser, not the server. The site has no server-side fallback. We
          will revisit them if iOS Safari improves{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
            SharedArrayBuffer
          </code>{' '}
          behavior in future releases.
        </p>
      </section>
    </article>
  );
}
