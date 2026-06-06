import { useCallback, useEffect, useState } from 'react';
import { DownloadButton } from '../components/output/DownloadButton';
import { ErrorMessage } from '../components/processing/ErrorMessage';
import { ProcessingStatus } from '../components/processing/ProcessingStatus';
import { RangeSlider, type RangeValue } from '../components/tool/RangeSlider';
import { type VideoMetadata, VideoPlayer } from '../components/tool/VideoPlayer';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { DropZone } from '../components/upload/DropZone';
import { FilePreview } from '../components/upload/FilePreview';
import { useConversion } from '../hooks/useConversion';
import { useSEO } from '../hooks/useSEO';
import { trimVideo } from '../lib/conversions/video/trim';
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

export default function VideoTrimPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMetadata | null>(null);
  const [range, setRange] = useState<RangeValue>({ lo: 0, hi: 0 });
  const { status, progress, result, error, run, cancel, reset } = useConversion(terminateFFmpeg);

  useSEO('Trim video', 'Cut a video to a precise time range. Browser-only, no upload.');

  useEffect(() => {
    if (!file) {
      if (url) URL.revokeObjectURL(url);
      setUrl(null);
      setMeta(null);
      setRange({ lo: 0, hi: 0 });
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, url]);

  const onLoaded = useCallback((m: VideoMetadata) => {
    setMeta(m);
    setRange({ lo: 0, hi: m.duration });
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
    if (!file) return;
    await run(trimVideo(file, { startSec: range.lo, endSec: range.hi }));
  }, [file, range.lo, range.hi, run]);

  const minSpan = 0.1;
  const tooShort = range.hi - range.lo < minSpan;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Trim video</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Cut a precise segment from the start and end. Browser-only, no upload.
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Accepts {humanReadableAccept(ACCEPT)} · Max {formatBytes(MAX_VIDEO_BYTES)} · Re-encodes
          are skipped via stream copy when possible
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
          <VideoPlayer src={url} fileName={file.name} onLoadedMetadata={onLoaded} />
          {meta && meta.duration > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
                <span>
                  Selection:{' '}
                  {range.hi - range.lo < 0.01 ? '—' : `${(range.hi - range.lo).toFixed(2)}s`}
                </span>
                <span className="font-mono text-xs">
                  {range.lo.toFixed(2)}s → {range.hi.toFixed(2)}s
                </span>
              </div>
              <RangeSlider
                min={0}
                max={meta.duration}
                value={range}
                onChange={setRange}
                ariaLabel="Trim range"
              />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleConvert} disabled={tooShort || !meta || meta.duration === 0}>
              Trim video
            </Button>
          </div>
        </Card>
      )}

      {file && status === 'processing' && (
        <ProcessingStatus progress={progress} onCancel={cancel} label="Trimming video..." />
      )}

      {file && status === 'done' && result && (
        <Card className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Trimmed to {(range.hi - range.lo).toFixed(2)}s · {formatBytes(result.size)}
          </p>
          <DownloadButton
            blob={result}
            inputName={file.name}
            outputExtension="mp4"
            outputMimeType="video/mp4"
            label="Download .mp4"
          />
          <Button variant="secondary" onClick={handleRemove}>
            Trim another file
          </Button>
        </Card>
      )}

      {file && status === 'error' && error && (
        <ErrorMessage error={error} onRetry={handleConvert} onReset={handleRemove} />
      )}
    </div>
  );
}
