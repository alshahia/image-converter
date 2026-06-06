import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeicToJpgPage from '../../../src/routes/heic-to-jpg';
import { heicToJpg } from '../../../src/lib/conversions/image/heic-to-jpg';

vi.mock('../../../src/lib/conversions/image/heic-to-jpg', () => ({
  heicToJpg: vi.fn(),
}));

const mockedHeicToJpg = vi.mocked(heicToJpg);

const realCreate = URL.createObjectURL;
const realRevoke = URL.revokeObjectURL;

function makeHeicFile(): File {
  // HEIC files use ftyp box with 'heic' or 'mif1' brand.
  // We just need enough bytes to pass the magic-byte check.
  const bytes = new Uint8Array([
    0x00, 0x00, 0x00, 0x1c, // box size
    0x66, 0x74, 0x79, 0x70, // "ftyp"
    0x68, 0x65, 0x69, 0x63, // "heic"
    0x00, 0x00, 0x00, 0x00, // minor version
    0x6d, 0x69, 0x66, 0x31, // "mif1"
    0x68, 0x65, 0x69, 0x63, // "heic"
  ]);
  return new File([bytes], 'sample.heic', { type: 'image/heic' });
}

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/heic-to-jpg']}>
      <HeicToJpgPage />
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
  mockedHeicToJpg.mockReset();
});

afterEach(() => {
  URL.createObjectURL = realCreate;
  URL.revokeObjectURL = realRevoke;
  vi.restoreAllMocks();
});

describe('/heic-to-jpg user flow (Phase 7.3)', () => {
  it('renders the title, drop zone, and EXIF-stripped notice', () => {
    renderRoute();
    expect(screen.getByRole('heading', { level: 1, name: 'HEIC to JPG' })).toBeTruthy();
    expect(screen.getAllByText(/EXIF stripped/i).length).toBeGreaterThan(0);
  });

  it('happy path: drop HEIC → convert → download button appears', async () => {
    const out = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' });
    mockedHeicToJpg.mockResolvedValue(out);

    renderRoute();
    attachFile(makeHeicFile());

    await waitFor(() => {
      expect(mockedHeicToJpg).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/conversion complete/i)).toBeTruthy();
    });
    const dl = screen.getByRole('button', { name: /download .*jpg/i });
    expect(dl).toBeTruthy();
  });

  it('rejects a non-HEIC file with a friendly error', async () => {
    renderRoute();
    const jpgFile = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'not-a.jpg', {
      type: 'image/jpeg',
    });
    attachFile(jpgFile);

    await waitFor(() => {
      expect(screen.getByText(/can't be processed/i)).toBeTruthy();
    });
    expect(mockedHeicToJpg).not.toHaveBeenCalled();
  });

  it('shows an error message when the conversion throws', async () => {
    mockedHeicToJpg.mockRejectedValue(new Error('heic decode failed'));

    renderRoute();
    attachFile(makeHeicFile());

    await waitFor(() => {
      expect(screen.getByText(/heic decode failed/i)).toBeTruthy();
    });
  });

  it('Convert another file returns the user to the drop zone', async () => {
    const out = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' });
    mockedHeicToJpg.mockResolvedValue(out);

    renderRoute();
    attachFile(makeHeicFile());
    await waitFor(() => screen.getByText(/conversion complete/i));

    fireEvent.click(screen.getByRole('button', { name: /convert another/i }));
    expect(screen.getByRole('button', { name: /drop a file/i })).toBeTruthy();
  });
});
