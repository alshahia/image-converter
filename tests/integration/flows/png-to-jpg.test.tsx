import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PngToJpgPage from '../../../src/routes/png-to-jpg';
import { pngToJpg } from '../../../src/lib/conversions/image/png-to-jpg';

vi.mock('../../../src/lib/conversions/image/png-to-jpg', () => ({
  pngToJpg: vi.fn(),
}));

const mockedPngToJpg = vi.mocked(pngToJpg);

const realCreate = URL.createObjectURL;
const realRevoke = URL.revokeObjectURL;

function makePngFile(): File {
  // PNG magic header bytes 0x89 0x50 0x4E 0x47. Content is irrelevant —
  // the mock pngToJpg will return a known blob.
  return new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'sample.png', {
    type: 'image/png',
  });
}

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/png-to-jpg']}>
      <PngToJpgPage />
    </MemoryRouter>,
  );
}

// DropZone's <input type="file"> is sr-only + aria-hidden, so
// `getByLabelText` won't find it. Reach for it via a CSS selector
// (one per render) and fire a synthetic change event with a FileList.
function attachFile(file: File) {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('file input not found');
  Object.defineProperty(input, 'files', {
    value: [file],
    configurable: true,
  });
  fireEvent.change(input);
}

beforeEach(() => {
  let counter = 0;
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:fake-${++counter}`);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  mockedPngToJpg.mockReset();
});

afterEach(() => {
  URL.createObjectURL = realCreate;
  URL.revokeObjectURL = realRevoke;
  vi.restoreAllMocks();
});

describe('/png-to-jpg user flow (Phase 7.3)', () => {
  it('renders the title, drop zone, and EXIF-stripped notice', () => {
    renderRoute();
    expect(screen.getByRole('heading', { level: 1, name: 'PNG to JPG' })).toBeTruthy();
    // The description also contains "EXIF stripped", so use getAllByText
    expect(screen.getAllByText(/EXIF stripped/i).length).toBeGreaterThan(0);
  });

  it('happy path: drop PNG → convert → download button appears', async () => {
    const out = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' });
    mockedPngToJpg.mockResolvedValue(out);

    renderRoute();
    attachFile(makePngFile());

    await waitFor(() => {
      expect(mockedPngToJpg).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/conversion complete/i)).toBeTruthy();
    });
    const dl = screen.getByRole('button', { name: /download .*jpg/i });
    expect(dl).toBeTruthy();
  });

  it('rejects a non-PNG file with a friendly error', async () => {
    renderRoute();
    const jpgFile = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'not-a.jpg', {
      type: 'image/jpeg',
    });
    attachFile(jpgFile);

    await waitFor(() => {
      expect(screen.getByText(/can't be processed/i)).toBeTruthy();
    });
    expect(mockedPngToJpg).not.toHaveBeenCalled();
  });

  it('shows an error message when the conversion throws', async () => {
    mockedPngToJpg.mockRejectedValue(new Error('encode failed'));

    renderRoute();
    attachFile(makePngFile());

    await waitFor(() => {
      expect(screen.getByText(/encode failed/i)).toBeTruthy();
    });
  });

  it('Convert another file returns the user to the drop zone', async () => {
    const out = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' });
    mockedPngToJpg.mockResolvedValue(out);

    renderRoute();
    attachFile(makePngFile());
    await waitFor(() => screen.getByText(/conversion complete/i));

    fireEvent.click(screen.getByRole('button', { name: /convert another/i }));
    // The drop zone button is back
    expect(screen.getByRole('button', { name: /drop a file/i })).toBeTruthy();
  });
});
