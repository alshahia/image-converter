import { Link } from 'react-router-dom';
import { TOOLS, type Tool } from '../data/tools';
import { useSEO } from '../hooks/useSEO';

const POPULAR_PATHS: ReadonlyArray<string> = ['/jpg-to-webp', '/heic-to-jpg', '/strip-exif'];

const popularTools: ReadonlyArray<Tool> = TOOLS.filter((t) => POPULAR_PATHS.includes(t.path));

export function NotFoundPage() {
  useSEO('Page not found');
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center px-4 py-12 sm:py-20">
      <div className="relative mb-8 flex items-center justify-center">
        <div
          className="drift-blob -z-10 h-40 w-40 animate-drift bg-drift-pink/70"
          aria-hidden="true"
        />
        <div
          className="drift-blob -z-10 h-32 w-32 animate-drift-slow bg-drift-blue/60"
          style={{ animationDelay: '-7s' }}
          aria-hidden="true"
        />
        <span
          aria-hidden="true"
          className="relative inline-flex h-24 w-24 items-center justify-center rounded-glass bg-drift-cta shadow-drift-cta"
        >
          <span className="absolute inset-2 rounded-glass-sm border border-white/45" />
          <span className="relative font-display text-4xl italic text-white tracking-tightest">
            404
          </span>
        </span>
      </div>

      <h1 className="text-center font-display text-4xl italic tracking-tightest text-ink sm:text-5xl dark:text-ink-inverse">
        Lost in the <span className="text-accent-strong">drift</span>
      </h1>

      <p className="mt-4 max-w-md text-center text-base text-ink-muted dark:text-neutral-400">
        That route doesn&rsquo;t exist. Head home, or try one of the popular tools below.
      </p>

      <Link to="/" className="btn-cta mt-8" aria-label="Back to the home page">
        Back to home
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

      <section aria-labelledby="popular-tools-heading" className="mt-12 w-full max-w-3xl sm:mt-16">
        <h2
          id="popular-tools-heading"
          className="text-center text-xs font-semibold uppercase tracking-widest text-ink-muted dark:text-neutral-400"
        >
          Popular tools
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {popularTools.map((tool) => (
            <li key={tool.path}>
              <Link
                to={tool.path}
                className="group glass-card-soft flex h-full flex-col gap-1 p-4 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-drift-card-hover"
              >
                <span className="text-sm font-semibold text-ink dark:text-ink-inverse">
                  {tool.title}
                </span>
                <span className="text-xs text-ink-muted line-clamp-2 dark:text-neutral-400">
                  {tool.description}
                </span>
                <span
                  aria-hidden="true"
                  className="mt-2 text-xs font-medium text-accent-strong transition-transform duration-200 group-hover:translate-x-0.5 dark:text-accent-soft"
                >
                  Open &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
