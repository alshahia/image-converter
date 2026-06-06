import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DownloadButton } from '../../src/components/output/DownloadButton';

vi.mock('../../src/lib/utils/download', () => ({
  downloadBlob: vi.fn(),
  inferOutputName: (input: string, ext: string) => {
    const dot = input.lastIndexOf('.');
    return `${dot > 0 ? input.slice(0, dot) : input}.${ext}`;
  },
}));

import { downloadBlob } from '../../src/lib/utils/download';

beforeEach(() => {
  let counter = 0;
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:fake-${++counter}`);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(downloadBlob).mockReset();
});

describe('DownloadButton (Phase 7.4)', () => {
  it('renders a button with a sensible default label', () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    render(
      <DownloadButton
        blob={blob}
        inputName="photo.png"
        outputExtension="webp"
        outputMimeType="image/webp"
      />,
    );
    expect(screen.getByRole('button', { name: /download/i })).toBeTruthy();
  });

  it('uses the custom label as the visible button text', () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    render(
      <DownloadButton
        blob={blob}
        inputName="photo.png"
        outputExtension="webp"
        outputMimeType="image/webp"
        label="Save as WebP"
      />,
    );
    // aria-label is "Download photo.webp as image/webp", but the
    // visible text is the `label` prop.
    expect(screen.getByText('Save as WebP')).toBeTruthy();
  });

  it('clicking invokes downloadBlob with the inferred filename', () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    render(
      <DownloadButton
        blob={blob}
        inputName="vacation.jpg"
        outputExtension="png"
        outputMimeType="image/png"
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(downloadBlob).toHaveBeenCalledTimes(1);
    const [passedBlob, passedName] = vi.mocked(downloadBlob).mock.calls[0]!;
    expect(passedBlob).toBe(blob);
    expect(passedName).toBe('vacation.png');
  });

  it('revokes the previous object URL when re-rendered with a new blob', () => {
    const blob1 = new Blob(['a'], { type: 'image/png' });
    const blob2 = new Blob(['b'], { type: 'image/png' });

    const { rerender } = render(
      <DownloadButton
        blob={blob1}
        inputName="a.png"
        outputExtension="webp"
        outputMimeType="image/webp"
      />,
    );
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);

    rerender(
      <DownloadButton
        blob={blob2}
        inputName="a.png"
        outputExtension="webp"
        outputMimeType="image/webp"
      />,
    );
    // First URL was revoked when the second one took its place
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-1');
  });
});
