import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToolOptions } from '../../src/components/tool/ToolOptions';

describe('ToolOptions', () => {
  it('renders children', () => {
    render(
      <ToolOptions title="Settings">
        <span data-testid="child">content</span>
      </ToolOptions>,
    );
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders without a title', () => {
    render(
      <ToolOptions>
        <span data-testid="child">content</span>
      </ToolOptions>,
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
