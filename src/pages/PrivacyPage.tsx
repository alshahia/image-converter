export function PrivacyPage() {
  return (
    <article className="prose mx-auto max-w-3xl dark:prose-invert">
      <h1>Privacy</h1>
      <p>
        Image Converter runs entirely in your browser. Files you drop into any tool are processed
        locally on your device. They are not uploaded to our servers (we don't have servers for the
        conversion path).
      </p>
      <h2>What we collect</h2>
      <p>
        We use Cloudflare Web Analytics, a privacy-respecting analytics service that does not use
        cookies, does not collect personal data, and aggregates visits per page. It tells us which
        tools are popular so we know what to build next.
      </p>
      <h2>What we don't collect</h2>
      <ul>
        <li>File contents (we never see them)</li>
        <li>File names (we never see them)</li>
        <li>IP addresses tied to identity (Cloudflare sees them, but we don't store them)</li>
        <li>Cookies (we don't set any)</li>
      </ul>
      <h2>Cross-origin isolation</h2>
      <p>
        This site sets <code>Cross-Origin-Opener-Policy</code> and
        <code> Cross-Origin-Embedder-Policy</code> headers so that conversion engines like
        ffmpeg.wasm can use <code>SharedArrayBuffer</code>. This means every resource on the page
        must be self-hosted — no Google Fonts, no third-party scripts, no CDN icons.
      </p>
    </article>
  );
}
