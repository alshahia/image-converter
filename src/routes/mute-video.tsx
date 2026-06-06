import { useCallback, useEffect, useState } from 'react';
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
import { muteVideo } from '../lib/conversions/video/mute';
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

export default function MuteVideoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const { status, progress, result, error, run, cancel, reset } = useConversion(terminateFFmpeg);

  useSEO('Mute video', 'Remove the audio track from a video in your browser.');

  useEffect(() => {
    if (!file) {
      if (url) URL.revokeObjectURL(url);
      setUrl(null);
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
    await run(muteVideo(file));
  }, [file, run]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Mute video</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Remove the audio track from a video. Video stream is copied as-is.
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
          <VideoPlayer src={url} fileName={file.name} />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Output: MP4 with the video stream copied and the audio track removed.
          </p>
          <div>
            <Button onClick={handleConvert}>Mute video</Button>
          </div>
        </Card>
      )}

      {file && status === 'processing' && (
        <ProcessingStatus progress={progress} onCancel={cancel} label="Removing audio..." />
      )}

      {file && status === 'done' && result && (
        <Card className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Muted · {formatBytes(result.size)}
          </p>
          <DownloadButton
            blob={result}
            inputName={file.name}
            outputExtension="mp4"
            outputMimeType="video/mp4"
            label="Download .mp4"
          />
          <Button variant="secondary" onClick={handleRemove}>
            Mute another file
          </Button>
        </Card>
      )}

      {file && status === 'error' && error && (
        <ErrorMessage error={error} onRetry={handleConvert} onReset={handleRemove} />
      )}
    </div>
  );
}
