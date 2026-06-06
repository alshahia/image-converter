import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VideoToMp4Page from '../../../src/routes/video-to-mp4';
import { videoToMp4 } from '../../../src/lib/conversions/video/video-to-mp4';

vi.mock('../../../src/lib/conversions/video/video-to-mp4', () => ({
  videoToMp4: vi.fn(),
}));

vi.mock('../../../src/lib/engines/ffmpeg', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/engines/ffmpeg')>();
  return {
    ...actual,
    terminateFFmpeg: vi.fn(),
  };
});

const mockedVideoToMp4 = vi.mocked(videoToMp4);

const realCreate = URL.createObjectURL;
const realRevoke = URL.revokeObjectURL;

function makeMp4File(): File {
  return new File([new Uint8Array([0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70])], 'sample.mp4', {
    type: 'video/mp4',
  });
}

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/video-to-mp4']}>
      <VideoToMp4Page />
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
  mockedVideoToMp4.mockReset();
});

afterEach(() => {
  URL.createObjectURL = realCreate;
  URL.revokeObjectURL = realRevoke;
  vi.restoreAllMocks();
});

describe('/video-to-mp4 user flow (Phase 7.3)', () => {
  it('renders the title and drop zone', () => {
    renderRoute();
    expect(screen.getByRole('heading', { level: 1, name: 'Video to MP4' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /drop a file/i })).toBeTruthy();
  });

  it('happy path: drop video → click Convert to MP4 → download button appears', async () => {
    const out = new Blob([new Uint8Array([0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70])], {
      type: 'video/mp4',
    });
    mockedVideoToMp4.mockResolvedValue(out);

    renderRoute();
    attachFile(makeMp4File());

    // Wait for file preview and convert button to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Convert to MP4$/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Convert to MP4$/i }));

    await waitFor(() => {
      expect(mockedVideoToMp4).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/converted to mp4/i)).toBeTruthy();
    });
    const dl = screen.getByRole('button', { name: /download .*mp4/i });
    expect(dl).toBeTruthy();
  });

  it('rejects a non-video file with a friendly error', async () => {
    renderRoute();
    const txtFile = new File(['hello'], 'not-a-video.txt', { type: 'text/plain' });
    attachFile(txtFile);

    await waitFor(() => {
      expect(screen.getByText(/can't be processed/i)).toBeTruthy();
    });
    expect(mockedVideoToMp4).not.toHaveBeenCalled();
  });

  it('shows an error message when the conversion throws', async () => {
    mockedVideoToMp4.mockRejectedValue(new Error('ffmpeg failed'));

    renderRoute();
    attachFile(makeMp4File());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Convert to MP4$/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Convert to MP4$/i }));

    await waitFor(() => {
      expect(screen.getByText(/ffmpeg failed/i)).toBeTruthy();
    });
  });

  it('Convert another file returns the user to the drop zone', async () => {
    const out = new Blob([new Uint8Array([0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70])], {
      type: 'video/mp4',
    });
    mockedVideoToMp4.mockResolvedValue(out);

    renderRoute();
    attachFile(makeMp4File());
    await waitFor(() => screen.getByRole('button', { name: /^Convert to MP4$/i }));

    fireEvent.click(screen.getByRole('button', { name: /^Convert to MP4$/i }));
    await waitFor(() => screen.getByText(/converted to mp4/i));

    // "Convert another file" is a plain button, not a Button component
    fireEvent.click(screen.getByText(/convert another file/i));
    expect(screen.getByRole('button', { name: /drop a file/i })).toBeTruthy();
  });
});
