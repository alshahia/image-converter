import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">Not found</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        That route doesn't exist. Pick a tool from the{' '}
        <Link to="/" className="underline">
          home page
        </Link>
        .
      </p>
    </div>
  );
}
