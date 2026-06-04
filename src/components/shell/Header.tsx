import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [dark]);

  const toggle = useCallback(() => setDark((d) => !d), []);

  return { dark, toggle };
}

function DarkModeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="group relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border border-white/50 bg-glass-soft text-ink-muted shadow-glass-inset backdrop-blur-glass-sm transition-all duration-200 ease-out-expo hover:bg-glass-strong hover:text-ink active:scale-[0.96]"
    >
      {dark ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="h-4 w-4"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="h-4 w-4"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function Wordmark() {
  return (
    <Link to="/" className="group flex items-center gap-2" aria-label="Drift home">
      <span
        aria-hidden="true"
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl bg-drift-cta shadow-drift-cta transition-transform duration-300 ease-drift group-hover:rotate-[8deg]"
      >
        <span className="absolute inset-1 rounded-lg border border-white/40" />
        <span className="relative font-display text-lg italic leading-none text-white">d</span>
      </span>
      <span className="font-display text-2xl italic leading-none text-ink tracking-tight">
        Drift
      </span>
    </Link>
  );
}

function NavLink({ to, label, exact }: { to: string; label: string; exact?: boolean }) {
  const { pathname } = useLocation();
  const isActive = exact ? pathname === to : pathname.startsWith(to);
  return (
    <Link
      to={to}
      aria-current={isActive ? 'page' : undefined}
      className={`nav-pill ${isActive ? 'bg-white/60 text-ink shadow-glass-inset' : ''}`}
    >
      {label}
    </Link>
  );
}

export function Header() {
  const { dark, toggle } = useDarkMode();

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-10">
      <div className="glass-card mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2.5 sm:px-5">
        <Wordmark />
        <nav className="flex items-center gap-1">
          <NavLink to="/" label="Tools" exact />
          <NavLink to="/strip-exif" label="Strip EXIF" />
          <DarkModeToggle dark={dark} onToggle={toggle} />
          <Link
            to="/jpg-to-webp"
            className="btn-cta ml-2 hidden sm:inline-flex"
            aria-label="Try the JPG to WebP tool"
          >
            Try a tool
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5"
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
        </nav>
      </div>
    </header>
  );
}
