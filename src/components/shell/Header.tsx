import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-sm bg-neutral-900 dark:bg-neutral-50"
          />
          <span>Image Converter</span>
        </Link>
        <nav className="text-sm text-neutral-600 dark:text-neutral-400">
          <Link to="/" className="hover:text-neutral-900 dark:hover:text-neutral-50">
            Tools
          </Link>
        </nav>
      </div>
    </header>
  );
}
