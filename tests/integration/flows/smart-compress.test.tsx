import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SmartCompressPage from '../../../src/routes/smart-compress';
import { smartCompress } from '../../../src/lib/conversions/image/ai/smart-compress';

vi.mock('../../../src/lib/conversions/image/ai/smart-compress', () => ({
  smartCompress: vi.fn(),
}));

vi.mock('../../../src/lib/engines/jsquash', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/engines/jsquash')>();
  return {
    ...actual,
    terminateWorker: vi.fn(),
  };
});

const mockedSmartCompress = vi.mocked(smartCompress);

const realCreate = URL.createObjectURL;
const realRevoke = URL.revokeObjectURL;

function makeJpegFile(): File {
  return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'sample.jpg', {
    type: 'image/jpeg',
  });
}

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/smart-compress']}>
      <SmartCompressPage />
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
  mockedSmartCompress.mockReset();
});

afterEach(() => {
  URL.createObjectURL = realCreate;
  URL.revokeObjectURL = realRevoke;
  vi.restoreAllMocks();
});

describe('/smart-compress user flow (Phase 7.3)', () => {
  it('renders the title, target size input, and drop zone', () => {
    renderRoute();
    expect(screen.getByRole('heading', { level: 1, name: 'Smart compress' })).toBeTruthy();
    expect(screen.getByLabelText(/target size/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /drop a file/i })).toBeTruthy();
  });

  it('happy path: drop image → click Compress → download button appears', async () => {
    const out = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' });
    mockedSmartCompress.mockResolvedValue(out);

    renderRoute();
    attachFile(makeJpegFile());

    // Wait for file preview and compress button to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /compress to 200 kb/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /compress to 200 kb/i }));

    await waitFor(() => {
      expect(mockedSmartCompress).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/compression complete/i)).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: /download/i })).toBeTruthy();
  });

  it('rejects a non-image file with a friendly error', async () => {
    renderRoute();
    const txtFile = new File(['hello'], 'not-an-image.txt', { type: 'text/plain' });
    attachFile(txtFile);

    await waitFor(() => {
      expect(screen.getByText(/can't be processed/i)).toBeTruthy();
    });
    expect(mockedSmartCompress).not.toHaveBeenCalled();
  });

  it('shows an error message when the conversion throws', async () => {
    mockedSmartCompress.mockRejectedValue(new Error('smart compress failed'));

    renderRoute();
    attachFile(makeJpegFile());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /compress to 200 kb/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /compress to 200 kb/i }));

    await waitFor(() => {
      expect(screen.getByText(/smart compress failed/i)).toBeTruthy();
    });
  });

  it('Convert another file returns the user to the drop zone', async () => {
    const out = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' });
    mockedSmartCompress.mockResolvedValue(out);

    renderRoute();
    attachFile(makeJpegFile());
    await waitFor(() => screen.getByRole('button', { name: /compress to 200 kb/i }));

    fireEvent.click(screen.getByRole('button', { name: /compress to 200 kb/i }));
    await waitFor(() => screen.getByText(/compression complete/i));

    fireEvent.click(screen.getByRole('button', { name: /convert another file/i }));
    expect(screen.getByRole('button', { name: /drop a file/i })).toBeTruthy();
  });
});
