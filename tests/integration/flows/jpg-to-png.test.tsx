import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import JpgToPngPage from '../../../src/routes/jpg-to-png';
import { jpgToPng } from '../../../src/lib/conversions/image/jpg-to-png';

vi.mock('../../../src/lib/conversions/image/jpg-to-png', () => ({
  jpgToPng: vi.fn(),
}));

const mockedJpgToPng = vi.mocked(jpgToPng);

const realCreate = URL.createObjectURL;
const realRevoke = URL.revokeObjectURL;

function makeJpegFile(): File {
  // JPEG magic header bytes 0xFF 0xD8 0xFF. Content is irrelevant —
  // the mock jpgToPng will return a known blob.
  return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46])], 'sample.jpg', {
    type: 'image/jpeg',
  });
}

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/jpg-to-png']}>
      <JpgToPngPage />
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
  mockedJpgToPng.mockReset();
});

afterEach(() => {
  URL.createObjectURL = realCreate;
  URL.revokeObjectURL = realRevoke;
  vi.restoreAllMocks();
});

describe('/jpg-to-png user flow (Phase 7.3)', () => {
  it('renders the title, drop zone, and EXIF-stripped notice', () => {
    renderRoute();
    expect(screen.getByRole('heading', { level: 1, name: 'JPG to PNG' })).toBeTruthy();
    expect(screen.getByText(/EXIF stripped/i)).toBeTruthy();
  });

  it('happy path: drop JPG → convert → download button appears', async () => {
    const out = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' });
    mockedJpgToPng.mockResolvedValue(out);

    renderRoute();
    attachFile(makeJpegFile());

    await waitFor(() => {
      expect(mockedJpgToPng).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/conversion complete/i)).toBeTruthy();
    });
    const dl = screen.getByRole('button', { name: /download .*png/i });
    expect(dl).toBeTruthy();
  });

  it('rejects a non-JPG file with a friendly error', async () => {
    renderRoute();
    const pngFile = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'not-a.png', {
      type: 'image/png',
    });
    attachFile(pngFile);

    await waitFor(() => {
      expect(screen.getByText(/can't be processed/i)).toBeTruthy();
    });
    expect(mockedJpgToPng).not.toHaveBeenCalled();
  });

  it('shows an error message when the conversion throws', async () => {
    mockedJpgToPng.mockRejectedValue(new Error('decode failed'));

    renderRoute();
    attachFile(makeJpegFile());

    await waitFor(() => {
      expect(screen.getByText(/decode failed/i)).toBeTruthy();
    });
  });

  it('Convert another file returns the user to the drop zone', async () => {
    const out = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' });
    mockedJpgToPng.mockResolvedValue(out);

    renderRoute();
    attachFile(makeJpegFile());
    await waitFor(() => screen.getByText(/conversion complete/i));

    fireEvent.click(screen.getByRole('button', { name: /convert another/i }));
    // The drop zone button is back
    expect(screen.getByRole('button', { name: /drop a file/i })).toBeTruthy();
  });
});
