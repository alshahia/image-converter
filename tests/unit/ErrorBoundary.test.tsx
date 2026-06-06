import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../src/components/shell/ErrorBoundary';

function Boom(): never {
  throw new Error('kaboom');
}

describe('ErrorBoundary (Phase 7.4)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <p>happy path</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('happy path')).toBeTruthy();
  });

  it('renders the default fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/something went wrong/i)).toBeTruthy();
    expect(screen.getByText('kaboom')).toBeTruthy();
  });

  it('logs the error to console.error (not silenced)', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('renders a custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={(err, reset) => <button type="button" onClick={reset}>{`custom: ${err.message}`}</button>}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('button', { name: /custom: kaboom/i })).toBeTruthy();
  });

  it('reset() clears the error and re-renders children', () => {
    let shouldThrow = true;
    function MaybeBoom() {
      if (shouldThrow) throw new Error('boom-1');
      return <span>recovered</span>;
    }
    render(
      <ErrorBoundary>
        <MaybeBoom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('recovered')).toBeTruthy();
  });
});
