import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WebpToJpgPage from '../../../src/routes/webp-to-jpg';
import { webpToJpg } from '../../../src/lib/conversions/image/webp-to-jpg';

vi.mock('../../../src/lib/conversions/image/webp-to-jpg', () => ({
  webpToJpg: vi.fn(),
}));

const mockedWebpToJpg = vi.mocked(webpToJpg);

const realCreate = URL.createObjectURL;
const realRevoke = URL.revokeObjectURL;

function makeWebpFile(): File {
  // WebP magic: RIFF....WEBP
  const bytes = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x00, 0x00, 0x00, 0x00, // file size placeholder
    0x57, 0x45, 0x42, 0x50, // "WEBP"
  ]);
  return new File([bytes], 'sample.webp', { type: 'image/webp' });
}

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/webp-to-jpg']}>
      <WebpToJpgPage />
    </MemoryRouter>,
  );
}

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
  mockedWebpToJpg.mockReset();
});

afterEach(() => {
  URL.createObjectURL = realCreate;
  URL.revokeObjectURL = realRevoke;
  vi.restoreAllMocks();
});

describe('/webp-to-jpg user flow (Phase 7.3)', () => {
  it('renders the title, drop zone, and EXIF-stripped notice', () => {
    renderRoute();
    expect(screen.getByRole('heading', { level: 1, name: 'WebP to JPG' })).toBeTruthy();
    expect(screen.getAllByText(/EXIF stripped/i).length).toBeGreaterThan(0);
  });

  it('happy path: drop WebP → convert → download button appears', async () => {
    const out = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' });
    mockedWebpToJpg.mockResolvedValue(out);

    renderRoute();
    attachFile(makeWebpFile());

    await waitFor(() => {
      expect(mockedWebpToJpg).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/conversion complete/i)).toBeTruthy();
    });
    const dl = screen.getByRole('button', { name: /download .*jpg/i });
    expect(dl).toBeTruthy();
  });

  it('rejects a non-WebP file with a friendly error', async () => {
    renderRoute();
    const jpgFile = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'not-a.jpg', {
      type: 'image/jpeg',
    });
    attachFile(jpgFile);

    await waitFor(() => {
      expect(screen.getByText(/can't be processed/i)).toBeTruthy();
    });
    expect(mockedWebpToJpg).not.toHaveBeenCalled();
  });

  it('shows an error message when the conversion throws', async () => {
    mockedWebpToJpg.mockRejectedValue(new Error('webp decode failed'));

    renderRoute();
    attachFile(makeWebpFile());

    await waitFor(() => {
      expect(screen.getByText(/webp decode failed/i)).toBeTruthy();
    });
  });

  it('Convert another file returns the user to the drop zone', async () => {
    const out = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' });
    mockedWebpToJpg.mockResolvedValue(out);

    renderRoute();
    attachFile(makeWebpFile());
    await waitFor(() => screen.getByText(/conversion complete/i));

    fireEvent.click(screen.getByRole('button', { name: /convert another/i }));
    expect(screen.getByRole('button', { name: /drop a file/i })).toBeTruthy();
  });
});
