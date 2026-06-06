import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CompressImagePage from '../../../src/routes/compress-image';
import { compressImage } from '../../../src/lib/conversions/image/compress';
import * as jsquash from '../../../src/lib/engines/jsquash';

vi.mock('../../../src/lib/conversions/image/compress', () => ({
  compressImage: vi.fn(),
}));

vi.mock('../../../src/lib/engines/jsquash', async (importOriginal) => {
  const actual = await importOriginal<typeof jsquash>();
  return {
    ...actual,
    detectFormat: vi.fn(),
    terminateWorker: vi.fn(),
  };
});

const mockedCompressImage = vi.mocked(compressImage);
const mockedDetectFormat = vi.mocked(jsquash.detectFormat);

const realCreate = URL.createObjectURL;
const realRevoke = URL.revokeObjectURL;

function makeJpegFile(): File {
  return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'sample.jpg', {
    type: 'image/jpeg',
  });
}

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/compress-image']}>
      <CompressImagePage />
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
  mockedCompressImage.mockReset();
  mockedDetectFormat.mockReset();
});

afterEach(() => {
  URL.createObjectURL = realCreate;
  URL.revokeObjectURL = realRevoke;
  vi.restoreAllMocks();
});

describe('/compress-image user flow (Phase 7.3)', () => {
  it('renders the title and drop zone', () => {
    renderRoute();
    expect(screen.getByRole('heading', { level: 1, name: 'Compress image' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /drop a file/i })).toBeTruthy();
  });

  it('happy path: drop image → click Compress → download button appears', async () => {
    mockedDetectFormat.mockReturnValue('jpeg');
    const out = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' });
    mockedCompressImage.mockResolvedValue(out);

    renderRoute();
    attachFile(makeJpegFile());

    // Wait for file preview and options to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Compress$/i })).toBeTruthy();
    });

    // Click the Compress button
    fireEvent.click(screen.getByRole('button', { name: /^Compress$/i }));

    await waitFor(() => {
      expect(mockedCompressImage).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/compression complete/i)).toBeTruthy();
    });
    const dl = screen.getByRole('button', { name: /download .*jpg/i });
    expect(dl).toBeTruthy();
  });

  it('rejects a non-image file with a friendly error', async () => {
    renderRoute();
    const txtFile = new File(['hello'], 'not-an-image.txt', { type: 'text/plain' });
    attachFile(txtFile);

    await waitFor(() => {
      expect(screen.getByText(/can't be processed/i)).toBeTruthy();
    });
    expect(mockedCompressImage).not.toHaveBeenCalled();
  });

  it('shows an error message when the conversion throws', async () => {
    mockedDetectFormat.mockReturnValue('jpeg');
    mockedCompressImage.mockRejectedValue(new Error('compress failed'));

    renderRoute();
    attachFile(makeJpegFile());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Compress$/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Compress$/i }));

    await waitFor(() => {
      expect(screen.getByText(/compress failed/i)).toBeTruthy();
    });
  });

  it('Compress another file returns the user to the drop zone', async () => {
    mockedDetectFormat.mockReturnValue('jpeg');
    const out = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' });
    mockedCompressImage.mockResolvedValue(out);

    renderRoute();
    attachFile(makeJpegFile());
    await waitFor(() => screen.getByRole('button', { name: /^Compress$/i }));

    fireEvent.click(screen.getByRole('button', { name: /^Compress$/i }));
    await waitFor(() => screen.getByText(/compression complete/i));

    fireEvent.click(screen.getByRole('button', { name: /compress another file/i }));
    expect(screen.getByRole('button', { name: /drop a file/i })).toBeTruthy();
  });
});
