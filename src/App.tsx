import { Suspense, lazy } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell';
import { FfmpegSmokePage } from './pages/FfmpegSmokePage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPage } from './pages/PrivacyPage';

const HeicToJpg = lazy(() => import('./routes/heic-to-jpg'));
const HeicToWebp = lazy(() => import('./routes/heic-to-webp'));
const HeicToPng = lazy(() => import('./routes/heic-to-png'));
const PngToJpg = lazy(() => import('./routes/png-to-jpg'));
const JpgToPng = lazy(() => import('./routes/jpg-to-png'));
const WebpToJpg = lazy(() => import('./routes/webp-to-jpg'));
const JpgToWebp = lazy(() => import('./routes/jpg-to-webp'));
const JpgToAvif = lazy(() => import('./routes/jpg-to-avif'));
const AvifToJpg = lazy(() => import('./routes/avif-to-jpg'));
const PngToAvif = lazy(() => import('./routes/png-to-avif'));
const AvifToPng = lazy(() => import('./routes/avif-to-png'));
const JpgToJxl = lazy(() => import('./routes/jpg-to-jxl'));
const JxlToJpg = lazy(() => import('./routes/jxl-to-jpg'));
const PngToJxl = lazy(() => import('./routes/png-to-jxl'));
const JxlToPng = lazy(() => import('./routes/jxl-to-png'));
const JpgToBmp = lazy(() => import('./routes/jpg-to-bmp'));
const PngToBmp = lazy(() => import('./routes/png-to-bmp'));
const BmpToJpg = lazy(() => import('./routes/bmp-to-jpg'));
const BmpToPng = lazy(() => import('./routes/bmp-to-png'));
const JpgToTiff = lazy(() => import('./routes/jpg-to-tiff'));
const PngToTiff = lazy(() => import('./routes/png-to-tiff'));
const TiffToJpg = lazy(() => import('./routes/tiff-to-jpg'));
const TiffToPng = lazy(() => import('./routes/tiff-to-png'));
const JpgToIco = lazy(() => import('./routes/jpg-to-ico'));
const PngToIco = lazy(() => import('./routes/png-to-ico'));
const SvgToPng = lazy(() => import('./routes/svg-to-png'));
const ResizeImage = lazy(() => import('./routes/resize-image'));
const CompressImage = lazy(() => import('./routes/compress-image'));
const StripExif = lazy(() => import('./routes/strip-exif'));
const VideoToMp4 = lazy(() => import('./routes/video-to-mp4'));
const VideoToGif = lazy(() => import('./routes/video-to-gif'));
const ExtractAudio = lazy(() => import('./routes/extract-audio'));

function Loading() {
  return (
    <div className="flex animate-pulse-soft items-center justify-center p-12">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-brand-500 dark:border-neutral-700 dark:border-t-brand-400" />
        <span className="text-sm text-neutral-500">Loading…</span>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'heic-to-jpg',
        element: (
          <Suspense fallback={<Loading />}>
            <HeicToJpg />
          </Suspense>
        ),
      },
      {
        path: 'heic-to-webp',
        element: (
          <Suspense fallback={<Loading />}>
            <HeicToWebp />
          </Suspense>
        ),
      },
      {
        path: 'heic-to-png',
        element: (
          <Suspense fallback={<Loading />}>
            <HeicToPng />
          </Suspense>
        ),
      },
      {
        path: 'jpg-to-avif',
        element: (
          <Suspense fallback={<Loading />}>
            <JpgToAvif />
          </Suspense>
        ),
      },
      {
        path: 'avif-to-jpg',
        element: (
          <Suspense fallback={<Loading />}>
            <AvifToJpg />
          </Suspense>
        ),
      },
      {
        path: 'png-to-avif',
        element: (
          <Suspense fallback={<Loading />}>
            <PngToAvif />
          </Suspense>
        ),
      },
      {
        path: 'avif-to-png',
        element: (
          <Suspense fallback={<Loading />}>
            <AvifToPng />
          </Suspense>
        ),
      },
      {
        path: 'jpg-to-jxl',
        element: (
          <Suspense fallback={<Loading />}>
            <JpgToJxl />
          </Suspense>
        ),
      },
      {
        path: 'jxl-to-jpg',
        element: (
          <Suspense fallback={<Loading />}>
            <JxlToJpg />
          </Suspense>
        ),
      },
      {
        path: 'png-to-jxl',
        element: (
          <Suspense fallback={<Loading />}>
            <PngToJxl />
          </Suspense>
        ),
      },
      {
        path: 'jxl-to-png',
        element: (
          <Suspense fallback={<Loading />}>
            <JxlToPng />
          </Suspense>
        ),
      },
      {
        path: 'jpg-to-bmp',
        element: (
          <Suspense fallback={<Loading />}>
            <JpgToBmp />
          </Suspense>
        ),
      },
      {
        path: 'png-to-bmp',
        element: (
          <Suspense fallback={<Loading />}>
            <PngToBmp />
          </Suspense>
        ),
      },
      {
        path: 'bmp-to-jpg',
        element: (
          <Suspense fallback={<Loading />}>
            <BmpToJpg />
          </Suspense>
        ),
      },
      {
        path: 'bmp-to-png',
        element: (
          <Suspense fallback={<Loading />}>
            <BmpToPng />
          </Suspense>
        ),
      },
      {
        path: 'jpg-to-tiff',
        element: (
          <Suspense fallback={<Loading />}>
            <JpgToTiff />
          </Suspense>
        ),
      },
      {
        path: 'png-to-tiff',
        element: (
          <Suspense fallback={<Loading />}>
            <PngToTiff />
          </Suspense>
        ),
      },
      {
        path: 'tiff-to-jpg',
        element: (
          <Suspense fallback={<Loading />}>
            <TiffToJpg />
          </Suspense>
        ),
      },
      {
        path: 'tiff-to-png',
        element: (
          <Suspense fallback={<Loading />}>
            <TiffToPng />
          </Suspense>
        ),
      },
      {
        path: 'jpg-to-ico',
        element: (
          <Suspense fallback={<Loading />}>
            <JpgToIco />
          </Suspense>
        ),
      },
      {
        path: 'png-to-ico',
        element: (
          <Suspense fallback={<Loading />}>
            <PngToIco />
          </Suspense>
        ),
      },
      {
        path: 'svg-to-png',
        element: (
          <Suspense fallback={<Loading />}>
            <SvgToPng />
          </Suspense>
        ),
      },
      {
        path: 'png-to-jpg',
        element: (
          <Suspense fallback={<Loading />}>
            <PngToJpg />
          </Suspense>
        ),
      },
      {
        path: 'jpg-to-png',
        element: (
          <Suspense fallback={<Loading />}>
            <JpgToPng />
          </Suspense>
        ),
      },
      {
        path: 'webp-to-jpg',
        element: (
          <Suspense fallback={<Loading />}>
            <WebpToJpg />
          </Suspense>
        ),
      },
      {
        path: 'jpg-to-webp',
        element: (
          <Suspense fallback={<Loading />}>
            <JpgToWebp />
          </Suspense>
        ),
      },
      {
        path: 'resize-image',
        element: (
          <Suspense fallback={<Loading />}>
            <ResizeImage />
          </Suspense>
        ),
      },
      {
        path: 'compress-image',
        element: (
          <Suspense fallback={<Loading />}>
            <CompressImage />
          </Suspense>
        ),
      },
      {
        path: 'strip-exif',
        element: (
          <Suspense fallback={<Loading />}>
            <StripExif />
          </Suspense>
        ),
      },
      {
        path: 'video-to-mp4',
        element: (
          <Suspense fallback={<Loading />}>
            <VideoToMp4 />
          </Suspense>
        ),
      },
      {
        path: 'video-to-gif',
        element: (
          <Suspense fallback={<Loading />}>
            <VideoToGif />
          </Suspense>
        ),
      },
      {
        path: 'extract-audio',
        element: (
          <Suspense fallback={<Loading />}>
            <ExtractAudio />
          </Suspense>
        ),
      },
      { path: 'ffmpeg-smoke', element: <FfmpegSmokePage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
