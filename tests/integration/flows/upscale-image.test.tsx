import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UpscaleImagePage from '../../../src/routes/upscale-image';
import { upscale } from '../../../src/lib/conversions/image/ai/upscale';

vi.mock('../../../src/lib/conversions/image/ai/upscale', () => ({
  upscale: vi.fn(),
}));

vi.mock('../../../src/hooks/useAiModelLoader', () => ({
  useAiModelLoader: () => ({
    status: 'loaded',
    progress: 100,
    error: null,
    load: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('../../../src/lib/engines/jsquash', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/engines/jsquash')>();
  return {
    ...actual,
    terminateWorker: vi.fn(),
  };
});

const mockedUpscale = vi.mocked(upscale);

const realCreate = URL.createObjectURL;
const realRevoke = URL.revokeObjectURL;

function makePngFile(): File {
  return new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'sample.png', {
    type: 'image/png',
  });
}

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/upscale-image']}>
      <UpscaleImagePage />
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
  mockedUpscale.mockReset();
});

afterEach(() => {
  URL.createObjectURL = realCreate;
  URL.revokeObjectURL = realRevoke;
  vi.restoreAllMocks();
});

describe('/upscale-image user flow (Phase 7.3)', () => {
  it('renders the title, model selector, and drop zone (model pre-loaded)', () => {
    renderRoute();
    expect(screen.getByRole('heading', { level: 1, name: 'Upscale image' })).toBeTruthy();
    // The label "Model" and AiDisclosure's aria-label both match /model/i
    expect(screen.getByLabelText(/^Model$/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /drop a file/i })).toBeTruthy();
  });

  it('happy path: drop image → click Upscale → download button appears', async () => {
    const out = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' });
    mockedUpscale.mockResolvedValue(out);

    renderRoute();
    attachFile(makePngFile());

    // Wait for file preview and upscale button to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Upscale$/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Upscale$/i }));

    await waitFor(() => {
      expect(mockedUpscale).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/upscale complete/i)).toBeTruthy();
    });
    const dl = screen.getByRole('button', { name: /download .*png/i });
    expect(dl).toBeTruthy();
  });

  it('rejects a non-image file with a friendly error', async () => {
    renderRoute();
    const txtFile = new File(['hello'], 'not-an-image.txt', { type: 'text/plain' });
    attachFile(txtFile);

    await waitFor(() => {
      expect(screen.getByText(/can't be processed/i)).toBeTruthy();
    });
    expect(mockedUpscale).not.toHaveBeenCalled();
  });

  it('shows an error message when the conversion throws', async () => {
    mockedUpscale.mockRejectedValue(new Error('upscale failed'));

    renderRoute();
    attachFile(makePngFile());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Upscale$/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Upscale$/i }));

    await waitFor(() => {
      expect(screen.getByText(/upscale failed/i)).toBeTruthy();
    });
  });

  it('Convert another file returns the user to the drop zone', async () => {
    const out = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' });
    mockedUpscale.mockResolvedValue(out);

    renderRoute();
    attachFile(makePngFile());
    await waitFor(() => screen.getByRole('button', { name: /^Upscale$/i }));

    fireEvent.click(screen.getByRole('button', { name: /^Upscale$/i }));
    await waitFor(() => screen.getByText(/upscale complete/i));

    fireEvent.click(screen.getByRole('button', { name: /convert another file/i }));
    expect(screen.getByRole('button', { name: /drop a file/i })).toBeTruthy();
  });
});
