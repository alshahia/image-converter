import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ProcessingStatus } from '../../src/components/processing/ProcessingStatus';

describe('ProcessingStatus (L-3 CancelHint)', () => {
  it('renders progress and cancel button when onCancel is provided', () => {
    render(<ProcessingStatus progress={42} onCancel={vi.fn()} />);
    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy();
  });

  it('shows "Cancelling…" hint after click and disables the button', () => {
    render(<ProcessingStatus progress={50} onCancel={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(btn);
    expect(screen.getByRole('button', { name: /cancelling/i })).toBeDisabled();
    expect(screen.getByText(/stopping the worker/i)).toBeTruthy();
  });

  it('does not render cancel UI when onCancel is omitted', () => {
    render(<ProcessingStatus progress={75} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('invokes onCancel exactly once on click', () => {
    const onCancel = vi.fn();
    render(<ProcessingStatus progress={10} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    // Disabled now, second click is a no-op
    fireEvent.click(screen.getByRole('button', { name: /cancelling/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
