import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AvifToJpgPage from '../../src/routes/avif-to-jpg';
import AvifToPngPage from '../../src/routes/avif-to-png';
import BmpToJpgPage from '../../src/routes/bmp-to-jpg';
import BmpToPngPage from '../../src/routes/bmp-to-png';
import CompressImagePage from '../../src/routes/compress-image';
import ExtractAudioPage from '../../src/routes/extract-audio';
import HeicToJpgPage from '../../src/routes/heic-to-jpg';
import HeicToPngPage from '../../src/routes/heic-to-png';
import HeicToWebpPage from '../../src/routes/heic-to-webp';
import JpgToAvifPage from '../../src/routes/jpg-to-avif';
import JpgToBmpPage from '../../src/routes/jpg-to-bmp';
import JpgToIcoPage from '../../src/routes/jpg-to-ico';
import JpgToJxlPage from '../../src/routes/jpg-to-jxl';
import JpgToPngPage from '../../src/routes/jpg-to-png';
import JpgToTiffPage from '../../src/routes/jpg-to-tiff';
import JpgToWebpPage from '../../src/routes/jpg-to-webp';
import JxlToJpgPage from '../../src/routes/jxl-to-jpg';
import JxlToPngPage from '../../src/routes/jxl-to-png';
import PngToAvifPage from '../../src/routes/png-to-avif';
import PngToBmpPage from '../../src/routes/png-to-bmp';
import PngToIcoPage from '../../src/routes/png-to-ico';
import PngToJpgPage from '../../src/routes/png-to-jpg';
import PngToJxlPage from '../../src/routes/png-to-jxl';
import PngToTiffPage from '../../src/routes/png-to-tiff';
import ResizeImagePage from '../../src/routes/resize-image';
import StripExifPage from '../../src/routes/strip-exif';
import SvgToPngPage from '../../src/routes/svg-to-png';
import TiffToJpgPage from '../../src/routes/tiff-to-jpg';
import TiffToPngPage from '../../src/routes/tiff-to-png';
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

vi.mock('../../src/lib/engines/bmp', () => ({
  encodeBmpFromImageData: vi.fn(async () => new Blob(['x'], { type: 'image/bmp' })),
  decodeBmpToImageData: vi.fn(async () => ({
    width: 1,
    height: 1,
    data: new ImageData(new Uint8ClampedArray(4), 1, 1),
  })),
}));

vi.mock('../../src/lib/engines/tiff', () => ({
  encodeTiffFromImageData: vi.fn(async () => new Blob(['x'], { type: 'image/tiff' })),
  decodeTiffToImageData: vi.fn(async () => ({
    width: 1,
    height: 1,
    data: new ImageData(new Uint8ClampedArray(4), 1, 1),
  })),
}));

vi.mock('../../src/lib/engines/ico', () => ({
  encodeIcoFromImage: vi.fn(async () => new Blob(['x'], { type: 'image/x-icon' })),
}));

vi.mock('../../src/lib/engines/svg', () => ({
  svgToPng: vi.fn(async () => ({
    blob: new Blob(['x'], { type: 'image/png' }),
    width: 1,
    height: 1,
  })),
}));

vi.mock('../../src/lib/engines/imageData', () => ({
  decodeToImageData: vi.fn(async () => new ImageData(new Uint8ClampedArray(4), 1, 1)),
}));

const ROUTES: Array<[string, () => React.JSX.Element]> = [
  ['JPG to PNG', JpgToPngPage],
  ['JPG to WebP', JpgToWebpPage],
  ['PNG to JPG', PngToJpgPage],
  ['WebP to JPG', WebpToJpgPage],
  ['Resize image', ResizeImagePage],
  ['Compress image', CompressImagePage],
  ['HEIC to JPG', HeicToJpgPage],
  ['HEIC to WebP', HeicToWebpPage],
  ['HEIC to PNG', HeicToPngPage],
  ['JPG to AVIF', JpgToAvifPage],
  ['AVIF to JPG', AvifToJpgPage],
  ['PNG to AVIF', PngToAvifPage],
  ['AVIF to PNG', AvifToPngPage],
  ['JPG to JXL', JpgToJxlPage],
  ['JXL to JPG', JxlToJpgPage],
  ['PNG to JXL', PngToJxlPage],
  ['JXL to PNG', JxlToPngPage],
  ['JPG to BMP', JpgToBmpPage],
  ['PNG to BMP', PngToBmpPage],
  ['BMP to JPG', BmpToJpgPage],
  ['BMP to PNG', BmpToPngPage],
  ['JPG to TIFF', JpgToTiffPage],
  ['PNG to TIFF', PngToTiffPage],
  ['TIFF to JPG', TiffToJpgPage],
  ['TIFF to PNG', TiffToPngPage],
  ['JPG to ICO', JpgToIcoPage],
  ['PNG to ICO', PngToIcoPage],
  ['SVG to PNG', SvgToPngPage],
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
