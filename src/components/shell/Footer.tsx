import { Link } from 'react-router-dom';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 dark:text-neutral-400">
        <p>Files never leave your device. No accounts. No tracking cookies.</p>
        <nav className="flex gap-4">
          <Link to="/privacy" className="hover:text-neutral-900 dark:hover:text-neutral-50">
            Privacy
          </Link>
          <a
            href="https://github.com/image-converter/image-converter/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-900 dark:hover:text-neutral-50"
          >
            Feedback
          </a>
          <span>© {year}</span>
        </nav>
      </div>
    </footer>
  );
}
