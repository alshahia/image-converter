import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RemoveBackgroundPage from '../../../src/routes/remove-background';
import { removeBackground } from '../../../src/lib/conversions/image/ai/remove-background';

vi.mock('../../../src/lib/conversions/image/ai/remove-background', () => ({
  removeBackground: vi.fn(),
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

const mockedRemoveBackground = vi.mocked(removeBackground);

const realCreate = URL.createObjectURL;
const realRevoke = URL.revokeObjectURL;

function makePngFile(): File {
  return new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'sample.png', {
    type: 'image/png',
  });
}

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/remove-background']}>
      <RemoveBackgroundPage />
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
  mockedRemoveBackground.mockReset();
});

afterEach(() => {
  URL.createObjectURL = realCreate;
  URL.revokeObjectURL = realRevoke;
  vi.restoreAllMocks();
});

describe('/remove-background user flow (Phase 7.3)', () => {
  it('renders the title and drop zone (model pre-loaded)', () => {
    renderRoute();
    expect(screen.getByRole('heading', { level: 1, name: 'Remove image background' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /drop a file/i })).toBeTruthy();
  });

  it('happy path: drop image → click Remove background → download button appears', async () => {
    const out = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' });
    mockedRemoveBackground.mockResolvedValue(out);

    renderRoute();
    attachFile(makePngFile());

    // Wait for file preview and remove button to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Remove background$/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Remove background$/i }));

    await waitFor(() => {
      expect(mockedRemoveBackground).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/background removed/i)).toBeTruthy();
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
    expect(mockedRemoveBackground).not.toHaveBeenCalled();
  });

  it('shows an error message when the conversion throws', async () => {
    mockedRemoveBackground.mockRejectedValue(new Error('bg removal failed'));

    renderRoute();
    attachFile(makePngFile());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Remove background$/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Remove background$/i }));

    await waitFor(() => {
      expect(screen.getByText(/bg removal failed/i)).toBeTruthy();
    });
  });

  it('Convert another file returns the user to the drop zone', async () => {
    const out = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' });
    mockedRemoveBackground.mockResolvedValue(out);

    renderRoute();
    attachFile(makePngFile());
    await waitFor(() => screen.getByRole('button', { name: /^Remove background$/i }));

    fireEvent.click(screen.getByRole('button', { name: /^Remove background$/i }));
    await waitFor(() => screen.getByText(/background removed/i));

    fireEvent.click(screen.getByRole('button', { name: /convert another file/i }));
    expect(screen.getByRole('button', { name: /drop a file/i })).toBeTruthy();
  });
});
