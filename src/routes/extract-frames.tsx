import { useCallback, useEffect, useState } from 'react';
import { ErrorMessage } from '../components/processing/ErrorMessage';
import { ProcessingStatus } from '../components/processing/ProcessingStatus';
import { type VideoMetadata, VideoPlayer } from '../components/tool/VideoPlayer';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Slider } from '../components/ui/slider';
import { DropZone } from '../components/upload/DropZone';
import { FilePreview } from '../components/upload/FilePreview';
import { useConversion } from '../hooks/useConversion';
import { useSEO } from '../hooks/useSEO';
import { extractFrames } from '../lib/conversions/video/extract-frames';
import { terminateFFmpeg } from '../lib/engines/ffmpeg';
import { downloadBlob, inferOutputName } from '../lib/utils/download';
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

const PRESETS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0.5, label: 'Every 0.5s' },
  { value: 1, label: 'Every 1s' },
  { value: 2, label: 'Every 2s' },
  { value: 5, label: 'Every 5s' },
  { value: 10, label: 'Every 10s' },
];

export default function ExtractFramesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMetadata | null>(null);
  const [interval, setInterval] = useState(1);
  const { status, progress, result, error, run, cancel, reset } = useConversion(terminateFFmpeg);

  useSEO('Extract video frames', 'Extract every Nth frame from a video as a ZIP of PNG images.');

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
    if (!file) return;
    await run(extractFrames(file, { intervalSec: interval }));
  }, [file, interval, run]);

  const handleDownload = useCallback(() => {
    if (!result || !file) return;
    const name = inferOutputName(file.name, 'zip').replace(/\.[^.]+$/, '_frames.zip');
    downloadBlob(result, name);
  }, [result, file]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Extract video frames</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Pull still frames from a video at a fixed interval. Output is a ZIP of PNG images.
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Accepts {humanReadableAccept(ACCEPT)} · Max {formatBytes(MAX_VIDEO_BYTES)} · Output ZIP
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

      {file && url && status === 'idle' && (
        <Card className="space-y-4">
          <VideoPlayer src={url} fileName={file.name} onLoadedMetadata={(m) => setMeta(m)} />
          {meta && meta.duration > 0 && (
            <p className="text-xs text-neutral-500">
              Approx {Math.max(1, Math.floor(meta.duration / interval))} frames over{' '}
              {meta.duration.toFixed(1)}s
            </p>
          )}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.value}
                  variant={interval === p.value ? 'primary' : 'secondary'}
                  onClick={() => setInterval(p.value)}
                  size="sm"
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <Slider
              value={interval}
              onChange={setInterval}
              min={0.25}
              max={30}
              step={0.25}
              label="Interval (seconds)"
            />
          </div>
          <div>
            <Button onClick={handleConvert}>Extract frames</Button>
          </div>
        </Card>
      )}

      {file && status === 'processing' && (
        <ProcessingStatus progress={progress} onCancel={cancel} label="Extracting frames..." />
      )}

      {file && status === 'done' && result && (
        <Card className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Frames packed into ZIP · {formatBytes(result.size)}
          </p>
          <Button onClick={handleDownload} size="lg">
            Download .zip
          </Button>
          <Button variant="secondary" onClick={handleRemove}>
            Extract from another file
          </Button>
        </Card>
      )}

      {file && status === 'error' && error && (
        <ErrorMessage error={error} onRetry={handleConvert} onReset={handleRemove} />
      )}
    </div>
  );
}
