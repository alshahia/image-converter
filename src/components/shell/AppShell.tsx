import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { Footer } from './Footer';
import { Header } from './Header';

export function AppShell() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main
          id="main"
          className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-10 lg:pt-14"
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </>
  );
}
