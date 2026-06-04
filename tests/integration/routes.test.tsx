import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CompressImagePage from '../../src/routes/compress-image';
import ExtractAudioPage from '../../src/routes/extract-audio';
import HeicToJpgPage from '../../src/routes/heic-to-jpg';
import JpgToPngPage from '../../src/routes/jpg-to-png';
import JpgToWebpPage from '../../src/routes/jpg-to-webp';
import PngToJpgPage from '../../src/routes/png-to-jpg';
import ResizeImagePage from '../../src/routes/resize-image';
import StripExifPage from '../../src/routes/strip-exif';
import VideoToGifPage from '../../src/routes/video-to-gif';
import VideoToMp4Page from '../../src/routes/video-to-mp4';
import WebpToJpgPage from '../../src/routes/webp-to-jpg';

vi.mock('../../src/lib/engines/jsquash', () => ({
  convertImage: vi.fn(async () => new Blob(['x'], { type: 'image/png' })),
  getImageDimensions: vi.fn(async () => ({ width: 100, height: 100 })),
  computeResizeToFit: vi.fn(() => ({ width: 100, height: 100 })),
  detectFormat: vi.fn(() => 'jpeg'),
  terminateWorker: vi.fn(),
}));

vi.mock('../../src/lib/engines/ffmpeg', () => ({
  getFFmpeg: vi.fn(async () => ({
    writeFile: vi.fn(),
    exec: vi.fn(),
    readFile: vi.fn(),
    deleteFile: vi.fn(),
  })),
  attachProgress: vi.fn(() => () => {}),
  terminateFFmpeg: vi.fn(),
}));

vi.mock('../../src/lib/engines/heic', () => ({
  heicToBlob: vi.fn(async () => new Blob(['x'], { type: 'image/jpeg' })),
}));

const ROUTES: Array<[string, () => React.JSX.Element]> = [
  ['JPG to PNG', JpgToPngPage],
  ['JPG to WebP', JpgToWebpPage],
  ['PNG to JPG', PngToJpgPage],
  ['WebP to JPG', WebpToJpgPage],
  ['Resize image', ResizeImagePage],
  ['Compress image', CompressImagePage],
  ['HEIC to JPG', HeicToJpgPage],
  ['Strip EXIF from JPG', StripExifPage],
  ['Video to MP4', VideoToMp4Page],
  ['Video to GIF', VideoToGifPage],
  ['Extract audio', ExtractAudioPage],
];

function renderWithRouter(node: React.ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

afterEach(() => {
  vi.clearAllMocks();
});

beforeEach(() => {
  globalThis.indexedDB = undefined as unknown as IDBFactory;
});

describe('integration: each tool route renders without crashing', () => {
  for (const [title, Page] of ROUTES) {
    it(`renders ${title}`, () => {
      renderWithRouter(<Page />);
      expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    });
  }
});
