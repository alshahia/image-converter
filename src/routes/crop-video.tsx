import { useCallback, useEffect, useRef, useState } from 'react';
import { DownloadButton } from '../components/output/DownloadButton';
import { ErrorMessage } from '../components/processing/ErrorMessage';
import { ProcessingStatus } from '../components/processing/ProcessingStatus';
import { CropOverlay } from '../components/tool/CropOverlay';
import type { VideoMetadata } from '../components/tool/VideoPlayer';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { DropZone } from '../components/upload/DropZone';
import { FilePreview } from '../components/upload/FilePreview';
import { useConversion } from '../hooks/useConversion';
import type { CropRect } from '../hooks/useCropSelection';
import { useSEO } from '../hooks/useSEO';
import { type VideoCropRect, cropVideo } from '../lib/conversions/video/crop';
import { terminateFFmpeg } from '../lib/engines/ffmpeg';
import { humanReadableAccept, isAcceptedType } from '../lib/utils/fileValidation';
import {
  MAX_VIDEO_BYTES,
  WARN_VIDEO_BYTES,
  checkFileSize,
  formatBytes,
} from '../lib/utils/guardRails';

const ACCEPT = [
  '.mp4',
  '.mov',
  '.webm',
  '.mkv',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
];

function fullCropRect(w: number, h: number): CropRect {
  return { x: 0, y: 0, width: w, height: h };
}

function asVideoCropRect(r: CropRect): VideoCropRect {
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}

export default function CropVideoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMetadata | null>(null);
  const [rect, setRect] = useState<CropRect | null>(null);
  const { status, progress, result, error, run, cancel, reset } = useConversion(terminateFFmpeg);

  useSEO('Crop video', 'Visually crop a video region. Browser-only, no upload.');

  useEffect(() => {
    if (!file) {
      if (url) URL.revokeObjectURL(url);
      setUrl(null);
      setMeta(null);
      setRect(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, url]);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setMeta({
      duration: Number.isFinite(v.duration) ? v.duration : 0,
      videoWidth: v.videoWidth,
      videoHeight: v.videoHeight,
    });
    setRect(fullCropRect(v.videoWidth, v.videoHeight));
  }, []);

  const handleFile = useCallback(
    (f: File | File[]) => {
      const first = Array.isArray(f) ? f[0] : f;
      if (!first) {
        setFileError('No file selected.');
        return;
      }
      setFileError(null);
      if (!isAcceptedType(first, ACCEPT)) {
        setFileError(
          `Expected ${humanReadableAccept(ACCEPT)}. Got ${first.type || 'unknown type'}.`,
        );
        return;
      }
      const sizeCheck = checkFileSize(first, MAX_VIDEO_BYTES, WARN_VIDEO_BYTES, 'video');
      if (sizeCheck.verdict === 'block') {
        setFileError(sizeCheck.reason);
        return;
      }
      setFile(first);
      reset();
    },
    [reset],
  );

  const handleRemove = useCallback(() => {
    cancel();
    setFile(null);
    setFileError(null);
    reset();
  }, [cancel, reset]);

  const handleConvert = useCallback(async () => {
    if (!file || !rect) return;
    await run(cropVideo(file, { rect: asVideoCropRect(rect) }));
  }, [file, rect, run]);

  const noChange =
    rect &&
    meta &&
    rect.x === 0 &&
    rect.y === 0 &&
    rect.width === meta.videoWidth &&
    rect.height === meta.videoHeight;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Crop video</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Drag the rectangle to position, or grab a handle to resize. Audio is preserved.
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Accepts {humanReadableAccept(ACCEPT)} · Max {formatBytes(MAX_VIDEO_BYTES)} · Output is MP4
        </p>
      </header>

      {fileError && (
        <ErrorMessage
          error={fileError}
          onReset={handleRemove}
          title="This file can't be processed"
        />
      )}

      {!file && !fileError && (
        <DropZone accept={ACCEPT} onFile={handleFile} hint={humanReadableAccept(ACCEPT)} />
      )}

      {file && <FilePreview file={file} onRemove={handleRemove} />}

      {file && url && meta && rect && status === 'idle' && (
        <Card className="space-y-4">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Source: {meta.videoWidth} × {meta.videoHeight} px · Selection:{' '}
            <span className="font-mono">
              {rect.width} × {rect.height} px
            </span>
          </div>
          <div className="overflow-hidden rounded-glass-sm border border-white/60 bg-black/5 dark:border-white/10 dark:bg-white/[0.04]">
            <CropOverlay
              imageWidth={meta.videoWidth}
              imageHeight={meta.videoHeight}
              rect={rect}
              onRectChange={setRect}
              ariaLabel="Video crop region"
            >
              <video
                ref={videoRef}
                src={url}
                playsInline
                muted
                preload="metadata"
                onLoadedMetadata={handleLoadedMetadata}
                className="block h-full w-full select-none object-contain"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
                aria-label={`${file.name} preview`}
              />
            </CropOverlay>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setRect(fullCropRect(meta.videoWidth, meta.videoHeight))}
            >
              Reset
            </Button>
            <Button onClick={handleConvert} disabled={!!noChange || !rect}>
              {noChange ? 'No crop region selected' : 'Crop video'}
            </Button>
          </div>
        </Card>
      )}

      {file && status === 'processing' && (
        <ProcessingStatus progress={progress} onCancel={cancel} label="Cropping video..." />
      )}

      {file && status === 'done' && result && (
        <Card className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Cropped to {rect?.width ?? 0} × {rect?.height ?? 0} px · {formatBytes(result.size)}
          </p>
          <DownloadButton
            blob={result}
            inputName={file.name}
            outputExtension="mp4"
            outputMimeType="video/mp4"
            label="Download .mp4"
          />
          <Button variant="secondary" onClick={handleRemove}>
            Crop another file
          </Button>
        </Card>
      )}

      {file && status === 'error' && error && (
        <ErrorMessage error={error} onRetry={handleConvert} onReset={handleRemove} />
      )}
    </div>
  );
}
