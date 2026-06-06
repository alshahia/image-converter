import { useCallback, useState } from 'react';
import { DownloadButton } from '../components/output/DownloadButton';
import { ErrorMessage } from '../components/processing/ErrorMessage';
import { ProcessingStatus } from '../components/processing/ProcessingStatus';
import { VideoPlayer } from '../components/tool/VideoPlayer';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { DropZone } from '../components/upload/DropZone';
import { FilePreview } from '../components/upload/FilePreview';
import { useConversion } from '../hooks/useConversion';
import { useSEO } from '../hooks/useSEO';
import { type VideoRotate, rotateVideo } from '../lib/conversions/video/rotate';
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

const ANGLES: ReadonlyArray<{ value: VideoRotate; label: string }> = [
  { value: 0, label: '0°' },
  { value: 90, label: '90°' },
  { value: 180, label: '180°' },
  { value: 270, label: '270°' },
];

export default function RotateVideoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [degrees, setDegrees] = useState<VideoRotate>(90);
  const { status, progress, result, error, run, cancel, reset } = useConversion(terminateFFmpeg);

  useSEO('Rotate video', 'Rotate a video by 0, 90, 180, or 270 degrees in your browser.');

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
      const objectUrl = URL.createObjectURL(first);
      setUrl(objectUrl);
      reset();
    },
    [reset],
  );

  const handleRemove = useCallback(() => {
    cancel();
    if (url) URL.revokeObjectURL(url);
    setFile(null);
    setFileError(null);
    setUrl(null);
    reset();
  }, [cancel, reset, url]);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    await run(rotateVideo(file, { degrees }));
  }, [file, degrees, run]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Rotate video</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Rotate a video by 0, 90, 180, or 270 degrees. Audio is preserved.
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Accepts {humanReadableAccept(ACCEPT)} · Max {formatBytes(MAX_VIDEO_BYTES)}
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
          <VideoPlayer src={url} fileName={file.name} controls={false} />
          <div className="flex flex-wrap gap-2">
            {ANGLES.map((a) => (
              <Button
                key={a.value}
                variant={degrees === a.value ? 'primary' : 'secondary'}
                onClick={() => setDegrees(a.value)}
                aria-pressed={degrees === a.value}
                size="sm"
              >
                {a.label}
              </Button>
            ))}
          </div>
          <div>
            <Button onClick={handleConvert} disabled={degrees === 0}>
              {degrees === 0 ? 'No rotation selected' : `Rotate ${degrees}°`}
            </Button>
          </div>
        </Card>
      )}

      {file && status === 'processing' && (
        <ProcessingStatus progress={progress} onCancel={cancel} label="Rotating video..." />
      )}

      {file && status === 'done' && result && (
        <Card className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Rotated {degrees}° · {formatBytes(result.size)}
          </p>
          <DownloadButton
            blob={result}
            inputName={file.name}
            outputExtension="mp4"
            outputMimeType="video/mp4"
            label="Download .mp4"
          />
          <Button variant="secondary" onClick={handleRemove}>
            Rotate another file
          </Button>
        </Card>
      )}

      {file && status === 'error' && error && (
        <ErrorMessage error={error} onRetry={handleConvert} onReset={handleRemove} />
      )}
    </div>
  );
}
