export function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 text-neutral-700 dark:text-neutral-300">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Privacy</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated 2026-06-02</p>
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
    </article>
  );
}
