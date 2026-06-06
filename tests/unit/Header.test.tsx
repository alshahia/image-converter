import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../../src/components/shell/Header';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Header />
    </MemoryRouter>,
  );
}

describe('Header (Phase 7.4)', () => {
  let originalClassList: DOMTokenList;

  beforeEach(() => {
    // The useDarkMode hook reads `dark` from <html> on mount; make
    // sure each test starts in a known state (light mode).
    originalClassList = document.documentElement.classList;
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.documentElement.classList = originalClassList;
  });

  it('renders the Drift wordmark with a home link', () => {
    renderAt('/');
    const home = screen.getByRole('link', { name: /drift home/i });
    expect(home.getAttribute('href')).toBeTruthy();
  });

  it('marks the active route via aria-current="page"', () => {
    renderAt('/strip-exif');
    const active = screen.getByRole('link', { name: /strip exif/i });
    expect(active.getAttribute('aria-current')).toBe('page');
  });

  it('does not mark inactive routes', () => {
    renderAt('/');
    const stripExif = screen.getByRole('link', { name: /strip exif/i });
    expect(stripExif.getAttribute('aria-current')).toBeNull();
  });

  it('exposes a dark mode toggle with a descriptive aria-label', () => {
    renderAt('/');
    const toggle = screen.getByRole('button', { name: /switch to (light|dark) mode/i });
    expect(toggle).toBeTruthy();
  });

  it('clicking the dark mode toggle flips the <html> class', () => {
    renderAt('/');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /switch to dark mode/i }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /switch to light mode/i }));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
