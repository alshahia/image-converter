import { Link } from 'react-router-dom';
import { DemoZone } from '../components/landing/DemoZone';
import { ToolIcon } from '../components/landing/ToolIcon';
import { TOOLS, type TileColor, categoryMeta } from '../data/tools';
import { useSEO } from '../hooks/useSEO';

const TILE_BG: Record<TileColor, string> = {
  pink: 'bg-drift-pink',
  purple: 'bg-drift-purple',
  blue: 'bg-drift-blue',
  green: 'bg-drift-mint',
  yellow: 'bg-drift-butter',
  peach: 'bg-drift-peach',
};

const TILE_ICON: Record<TileColor, string> = {
  pink: 'text-accent',
  purple: 'text-[#7c4dff]',
  blue: 'text-[#2962ff]',
  green: 'text-[#00897b]',
  yellow: 'text-[#b27300]',
  peach: 'text-[#d35400]',
};

const TRUST_PILLS = [
  { label: '100% private', icon: 'shield' as const },
  { label: 'WebAssembly', icon: 'wand' as const },
  { label: '11 tools', icon: 'layers' as const },
  { label: 'EXIF stripped', icon: 'tag' as const },
];

const HOW_STEPS = [
  {
    n: '01',
    title: 'Drop a file',
    body: 'Drag any image or video into the drop zone. Up to 200 MB. No upload — the file never leaves your browser tab.',
  },
  {
    n: '02',
    title: 'Pick your tool',
    body: 'Choose a conversion, a resize, a compression, or just strip the EXIF. Quality and format are adjustable when it matters.',
  },
  {
    n: '03',
    title: 'Download',
    body: 'Get the result as a fresh file. No watermark, no email gate, no "create an account" — just a clean download.',
  },
];

const TRUST_FACTS = [
  {
    title: 'WebAssembly in your tab',
    body: 'ffmpeg.wasm and jsquash run as compiled binaries in the browser sandbox. The server is just static HTML, JS, and font files.',
  },
  {
    title: 'EXIF is gone by default',
    body: 'Every image output is re-encoded through canvas, which strips GPS, camera, and timestamp metadata. No setting to forget.',
  },
  {
    title: 'Open source, MIT',
    body: 'Drift is built in the open on GitHub. No analytics, no telemetry, no third-party scripts. The site works offline once loaded.',
  },
];

function ToolCard({ tool }: { tool: (typeof TOOLS)[number] }) {
  return (
    <Link
      to={tool.path}
      className="group glass-card relative flex items-start gap-4 p-4 transition-all duration-200 ease-out-expo hover:-translate-y-0.5 hover:shadow-drift-card-hover focus-visible:-translate-y-0.5 focus-visible:shadow-drift-card-hover"
    >
      <span
        aria-hidden="true"
        className={`icon-tile shrink-0 ${TILE_BG[tool.tileColor]} ${TILE_ICON[tool.tileColor]}`}
      >
        <ToolIcon name={tool.icon} className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-sm font-semibold text-ink">{tool.title}</span>
          <span
            aria-hidden="true"
            className="hidden shrink-0 text-[10px] font-medium uppercase tracking-wider text-ink-subtle transition-opacity duration-200 group-hover:text-ink-muted sm:inline"
          >
            {tool.abbreviation}
          </span>
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-ink-muted">
          {tool.description}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="absolute right-4 top-1/2 -translate-y-1/2 translate-x-1 text-ink-subtle opacity-0 transition-all duration-200 ease-out-expo group-hover:translate-x-0 group-hover:opacity-100"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </span>
    </Link>
  );
}

function HeroBlobs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <span className="drift-blob left-[-8%] top-[-12%] h-[420px] w-[420px] bg-drift-pink animate-drift" />
      <span className="drift-blob right-[-10%] top-[10%] h-[380px] w-[380px] bg-drift-blue animate-drift-slow" />
      <span className="drift-blob bottom-[-15%] left-[20%] h-[460px] w-[460px] bg-drift-purple animate-drift-rev" />
      <span className="drift-blob right-[15%] bottom-[5%] h-[260px] w-[260px] bg-drift-mint animate-drift" />
    </div>
  );
}

export function HomePage() {
  useSEO(
    'Drift',
    'Eleven fast, private, browser-based tools for images and video. Convert, resize, compress, and edit media files locally using WebAssembly. No upload required.',
  );

  return (
    <div className="space-y-20">
      {/* HERO */}
      <section className="relative isolate">
        <HeroBlobs />
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div className="animate-fade-up space-y-7">
            <span className="glass-pill inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-ink-muted">
              <span
                aria-hidden="true"
                className="inline-flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft"
              />
              11 tools, zero uploads, no account
            </span>
            <h1 className="font-sans text-4xl font-bold leading-[1.05] tracking-tightest text-ink sm:text-5xl lg:text-6xl">
              Media tools,
              <br />
              <span className="font-display italic text-accent">in your browser.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
              Eleven fast tools for images and video. Drag, drop, done. Nothing is uploaded —
              everything runs locally using WebAssembly. EXIF is stripped from every image by
              default.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/jpg-to-webp" className="btn-cta px-6 py-3 text-base">
                Try a tool
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
              <a href="#tools" className="btn-glass px-6 py-3 text-base">
                See all 11 tools
              </a>
            </div>
            <ul className="flex flex-wrap gap-2 pt-2" aria-label="Trust signals">
              {TRUST_PILLS.map((pill) => (
                <li
                  key={pill.label}
                  className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink-muted"
                >
                  <ToolIcon name={pill.icon} className="h-3.5 w-3.5 text-accent" />
                  {pill.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="animate-fade-up-slow">
            <DemoZone />
          </div>
        </div>
      </section>

      {/* TOOL GRID */}
      <section id="tools" className="space-y-12 scroll-mt-28">
        {(['convert', 'optimize', 'video', 'internal'] as const).map((category) => {
          const tools = TOOLS.filter((t) => t.category === category);
          if (tools.length === 0) return null;
          const meta = categoryMeta[category];
          return (
            <div key={category} className="space-y-4">
              <header className="flex items-baseline justify-between gap-4">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
                  {meta.label}
                </h2>
                <p className="hidden text-xs text-ink-muted sm:block">{meta.description}</p>
              </header>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                  <li key={tool.path}>
                    <ToolCard tool={tool} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {/* HOW IT WORKS */}
      <section className="space-y-8">
        <header className="max-w-2xl space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Three steps.{' '}
            <span className="font-display italic text-accent">No signup, no friction.</span>
          </h2>
          <p className="text-base text-ink-muted">
            Drift runs entirely in your browser. There is no queue, no rate limit, no upload
            progress bar — because nothing leaves your device.
          </p>
        </header>
        <ol className="grid gap-4 md:grid-cols-3">
          {HOW_STEPS.map((step) => (
            <li key={step.n} className="glass-card relative space-y-3 p-6">
              <span className="font-display text-3xl italic text-accent">{step.n}</span>
              <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
              <p className="text-sm leading-relaxed text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* TRUST FACTS */}
      <section className="space-y-8">
        <header className="max-w-2xl space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Built for <span className="font-display italic text-accent">privacy by default.</span>
          </h2>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {TRUST_FACTS.map((fact) => (
            <article key={fact.title} className="glass-card-soft p-6">
              <h3 className="text-base font-semibold text-ink">{fact.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{fact.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="glass-card relative overflow-hidden p-8 text-center sm:p-12">
        <span
          aria-hidden="true"
          className="drift-blob -left-10 -top-10 h-64 w-64 bg-drift-pink animate-drift-slow"
        />
        <span
          aria-hidden="true"
          className="drift-blob -right-10 -bottom-10 h-72 w-72 bg-drift-purple animate-drift"
        />
        <div className="relative space-y-5">
          <h2 className="font-sans text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Try <span className="font-display italic text-accent">Drift</span>. Drop a file. See the
            result in your tab.
          </h2>
          <p className="mx-auto max-w-xl text-base text-ink-muted">
            No download, no install, no email. Just open a tool, drop a file, and download the
            result.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link to="/compress-image" className="btn-cta px-6 py-3 text-base">
              Compress an image
            </Link>
            <Link to="/strip-exif" className="btn-glass px-6 py-3 text-base">
              Strip EXIF
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
