import { useCallback, useEffect, useMemo, useState } from 'react';
import { DownloadButton } from '../components/output/DownloadButton';
import { ErrorMessage } from '../components/processing/ErrorMessage';
import { ProcessingStatus } from '../components/processing/ProcessingStatus';
import { type VideoMetadata, VideoPlayer } from '../components/tool/VideoPlayer';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { DropZone } from '../components/upload/DropZone';
import { FilePreview } from '../components/upload/FilePreview';
import { useConversion } from '../hooks/useConversion';
import { useSEO } from '../hooks/useSEO';
import { resizeVideo } from '../lib/conversions/video/resize';
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

const PRESETS: ReadonlyArray<{ label: string; width: number }> = [
  { label: '480p', width: 854 },
  { label: '720p', width: 1280 },
  { label: '1080p', width: 1920 },
  { label: '1440p', width: 2560 },
  { label: '4K', width: 3840 },
];

function ensureEven(n: number): number {
  return Math.max(2, Math.floor(n / 2) * 2);
}

export default function ResizeVideoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMetadata | null>(null);
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [keepAspect, setKeepAspect] = useState(true);
  const { status, progress, result, error, run, cancel, reset } = useConversion(terminateFFmpeg);

  useSEO('Resize video', 'Scale a video to common resolutions (480p, 720p, 1080p, 1440p, 4K).');

  useEffect(() => {
    if (!file) {
      if (url) URL.revokeObjectURL(url);
      setUrl(null);
      setMeta(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, url]);

  const onLoaded = useCallback((m: VideoMetadata) => {
    setMeta(m);
    setWidth(m.videoWidth);
    setHeight(m.videoHeight);
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

  const onWidthChange = useCallback(
    (v: number) => {
      setWidth(v);
      if (keepAspect && meta && meta.videoWidth > 0) {
        const ratio = meta.videoHeight / meta.videoWidth;
        setHeight(ensureEven(Math.round(v * ratio)));
      }
    },
    [keepAspect, meta],
  );

  const onHeightChange = useCallback(
    (v: number) => {
      setHeight(v);
      if (keepAspect && meta && meta.videoHeight > 0) {
        const ratio = meta.videoWidth / meta.videoHeight;
        setWidth(ensureEven(Math.round(v * ratio)));
      }
    },
    [keepAspect, meta],
  );

  const handleConvert = useCallback(async () => {
    if (!file) return;
    await run(
      resizeVideo(file, {
        width: ensureEven(width),
        height: ensureEven(height),
        keepAspect,
      }),
    );
  }, [file, width, height, keepAspect, run]);

  const noChange = useMemo(() => {
    if (!meta) return false;
    return ensureEven(width) === meta.videoWidth && ensureEven(height) === meta.videoHeight;
  }, [meta, width, height]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Resize video</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Scale a video to common resolutions or a custom size. Aspect ratio is preserved by
          default.
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

      {file && url && meta && status === 'idle' && (
        <Card className="space-y-4">
          <VideoPlayer src={url} fileName={file.name} onLoadedMetadata={onLoaded} />
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const aspectRatio = meta.videoWidth / meta.videoHeight;
              const targetHeight = ensureEven(Math.round(p.width / aspectRatio));
              const isCurrent =
                ensureEven(width) === p.width && ensureEven(height) === targetHeight;
              return (
                <Button
                  key={p.label}
                  variant={isCurrent ? 'primary' : 'secondary'}
                  onClick={() => {
                    setWidth(p.width);
                    setHeight(targetHeight);
                  }}
                  size="sm"
                >
                  {p.label}
                </Button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">Width (px)</span>
              <input
                type="number"
                min={2}
                step={2}
                value={width}
                onChange={(e) => onWidthChange(Math.max(2, Number(e.target.value) || 2))}
                className="h-11 rounded-lg border border-white/60 bg-white/70 px-3 text-sm shadow-glass-inset focus:outline-none focus:ring-2 focus:ring-accent dark:border-white/10 dark:bg-white/[0.06] dark:text-ink-inverse"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">Height (px)</span>
              <input
                type="number"
                min={2}
                step={2}
                value={height}
                onChange={(e) => onHeightChange(Math.max(2, Number(e.target.value) || 2))}
                className="h-11 rounded-lg border border-white/60 bg-white/70 px-3 text-sm shadow-glass-inset focus:outline-none focus:ring-2 focus:ring-accent dark:border-white/10 dark:bg-white/[0.06] dark:text-ink-inverse"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={keepAspect}
              onChange={(e) => setKeepAspect(e.target.checked)}
              className="h-4 w-4 accent-brand-600"
            />
            Keep aspect ratio (pad to fit)
          </label>
          <div>
            <Button onClick={handleConvert} disabled={noChange}>
              {noChange ? 'Same as source' : `Resize to ${ensureEven(width)}×${ensureEven(height)}`}
            </Button>
          </div>
        </Card>
      )}

      {file && status === 'processing' && (
        <ProcessingStatus progress={progress} onCancel={cancel} label="Resizing video..." />
      )}

      {file && status === 'done' && result && (
        <Card className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Resized to {ensureEven(width)}×{ensureEven(height)} · {formatBytes(result.size)}
          </p>
          <DownloadButton
            blob={result}
            inputName={file.name}
            outputExtension="mp4"
            outputMimeType="video/mp4"
            label="Download .mp4"
          />
          <Button variant="secondary" onClick={handleRemove}>
            Resize another file
          </Button>
        </Card>
      )}

      {file && status === 'error' && error && (
        <ErrorMessage error={error} onRetry={handleConvert} onReset={handleRemove} />
      )}
    </div>
  );
}
