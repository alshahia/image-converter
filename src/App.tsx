import { Suspense, lazy } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell';
import { FfmpegSmokePage } from './pages/FfmpegSmokePage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPage } from './pages/PrivacyPage';

const HeicToJpg = lazy(() => import('./routes/heic-to-jpg'));
const PngToJpg = lazy(() => import('./routes/png-to-jpg'));
const JpgToPng = lazy(() => import('./routes/jpg-to-png'));
const WebpToJpg = lazy(() => import('./routes/webp-to-jpg'));
const JpgToWebp = lazy(() => import('./routes/jpg-to-webp'));
const ResizeImage = lazy(() => import('./routes/resize-image'));
const CompressImage = lazy(() => import('./routes/compress-image'));
const StripExif = lazy(() => import('./routes/strip-exif'));
const VideoToMp4 = lazy(() => import('./routes/video-to-mp4'));
const VideoToGif = lazy(() => import('./routes/video-to-gif'));
const ExtractAudio = lazy(() => import('./routes/extract-audio'));

function Loading() {
  return <div className="flex items-center justify-center p-12 text-neutral-500">Loading…</div>;
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
