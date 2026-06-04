import { Link } from 'react-router-dom';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="px-4 pb-6 sm:px-6 lg:px-10">
      <div className="glass-card-soft mx-auto flex w-full max-w-7xl flex-col items-start gap-4 px-5 py-5 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/60 bg-glass-soft shadow-glass-inset"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          <span>Files never leave your device. No accounts. No tracking.</span>
        </p>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link to="/privacy" className="transition-colors hover:text-ink focus-visible:text-ink">
            Privacy
          </Link>
          <a
            href="https://github.com/alshahia/image-converter"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-ink focus-visible:text-ink"
          >
            GitHub
          </a>
          <span className="text-ink-subtle">
            <span className="font-display italic">Drift</span> &copy; {year}
          </span>
        </nav>
      </div>
    </footer>
  );
}
