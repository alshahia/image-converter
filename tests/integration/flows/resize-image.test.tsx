import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResizeImagePage from '../../../src/routes/resize-image';
import { resizeImage } from '../../../src/lib/conversions/image/resize';
import * as jsquash from '../../../src/lib/engines/jsquash';

vi.mock('../../../src/lib/conversions/image/resize', () => ({
  resizeImage: vi.fn(),
}));

vi.mock('../../../src/lib/engines/jsquash', async (importOriginal) => {
  const actual = await importOriginal<typeof jsquash>();
  return {
    ...actual,
    getImageDimensions: vi.fn(),
    computeResizeToFit: vi.fn(),
    detectFormat: vi.fn(),
    terminateWorker: vi.fn(),
  };
});

const mockedResizeImage = vi.mocked(resizeImage);
const mockedGetImageDimensions = vi.mocked(jsquash.getImageDimensions);
const mockedComputeResizeToFit = vi.mocked(jsquash.computeResizeToFit);
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
    <MemoryRouter initialEntries={['/resize-image']}>
      <ResizeImagePage />
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
  mockedResizeImage.mockReset();
  mockedGetImageDimensions.mockReset();
  mockedComputeResizeToFit.mockReset();
  mockedDetectFormat.mockReset();
});

afterEach(() => {
  URL.createObjectURL = realCreate;
  URL.revokeObjectURL = realRevoke;
  vi.restoreAllMocks();
});

describe('/resize-image user flow (Phase 7.3)', () => {
  it('renders the title and drop zone', () => {
    renderRoute();
    expect(screen.getByRole('heading', { level: 1, name: 'Resize image' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /drop a file/i })).toBeTruthy();
  });

  it('happy path: drop image → see dimensions → click Resize → download button appears', async () => {
    mockedGetImageDimensions.mockResolvedValue({ width: 3000, height: 2000 });
    mockedComputeResizeToFit.mockReturnValue({ width: 1920, height: 1280 });
    mockedDetectFormat.mockReturnValue('jpeg');
    const out = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' });
    mockedResizeImage.mockResolvedValue(out);

    renderRoute();
    attachFile(makeJpegFile());

    // Wait for dimensions to load and slider to appear
    await waitFor(() => {
      expect(screen.getByText(/Original: 3000 × 2000 px/i)).toBeTruthy();
    });

    // Click the Resize button
    fireEvent.click(screen.getByRole('button', { name: /^Resize$/i }));

    await waitFor(() => {
      expect(mockedResizeImage).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/resize complete/i)).toBeTruthy();
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
    expect(mockedResizeImage).not.toHaveBeenCalled();
  });

  it('shows an error message when the conversion throws', async () => {
    mockedGetImageDimensions.mockResolvedValue({ width: 3000, height: 2000 });
    mockedComputeResizeToFit.mockReturnValue({ width: 1920, height: 1280 });
    mockedDetectFormat.mockReturnValue('jpeg');
    mockedResizeImage.mockRejectedValue(new Error('resize failed'));

    renderRoute();
    attachFile(makeJpegFile());

    await waitFor(() => {
      expect(screen.getByText(/Original: 3000 × 2000 px/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Resize$/i }));

    await waitFor(() => {
      expect(screen.getByText(/resize failed/i)).toBeTruthy();
    });
  });

  it('Resize another file returns the user to the drop zone', async () => {
    mockedGetImageDimensions.mockResolvedValue({ width: 3000, height: 2000 });
    mockedComputeResizeToFit.mockReturnValue({ width: 1920, height: 1280 });
    mockedDetectFormat.mockReturnValue('jpeg');
    const out = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' });
    mockedResizeImage.mockResolvedValue(out);

    renderRoute();
    attachFile(makeJpegFile());
    await waitFor(() => screen.getByText(/Original: 3000 × 2000 px/i));

    fireEvent.click(screen.getByRole('button', { name: /^Resize$/i }));
    await waitFor(() => screen.getByText(/resize complete/i));

    fireEvent.click(screen.getByRole('button', { name: /resize another file/i }));
    expect(screen.getByRole('button', { name: /drop a file/i })).toBeTruthy();
  });
});
